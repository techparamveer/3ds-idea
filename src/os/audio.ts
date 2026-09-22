export type Sound = 'select' | 'open' | 'back' | 'home' | 'power' | 'touch' | 'grab' | 'drop' | 'folder-open' | 'folder-close';
export type AudioCue = { name: string; url: string; sampleRate: number; samples: number; loopStart: number | null; loopEnd: number | null };
export type AudioPack = { schema: 1; cues: Record<string, AudioCue> };
export type AudioState = { home: boolean; powered: boolean; sleeping: boolean; muted: boolean; volume: number; elapsedMs: number };

/** Native PCM is rendered offline from original sequences and instruments.
 * The OS clock owns transport; Web Audio owns sample-accurate loops. */
export function createMenuAudio(manifestUrl = '/os/firmware/10.7.0-32E/audio/audio.json', environment: { fetch?: typeof fetch; AudioContext?: typeof AudioContext } = {}) {
  const fetchAsset = environment.fetch ?? globalThis.fetch;
  let context: AudioContext | undefined, master: GainNode | undefined, disposed = false;
  let lastPlayed: Sound | undefined, music: AudioBufferSourceNode | undefined, musicSince = 0;
  let state: AudioState = { home: false, powered: true, sleeping: false, muted: false, volume: .35, elapsedMs: 0 };
  let failure: string | undefined, musicLoading = false, generation = 0, effectGeneration = 0;
  const abort = new AbortController();
  const active = new Set<AudioBufferSourceNode>(), buffers = new Map<string, AudioBuffer>();
  const pending = new Map<string, Promise<AudioBuffer | undefined>>();
  const bytes = new Map<string, Promise<ArrayBuffer>>();
  const base = new URL(manifestUrl, typeof location === 'undefined' ? 'http://localhost/' : location.href);
  const pack = fetchAsset(base, { signal: abort.signal }).then(async response => {
    if (!response.ok) throw new Error(`Audio pack HTTP ${response.status}`);
    const value = await response.json() as AudioPack;
    if (value.schema !== 1 || !value.cues || typeof value.cues !== 'object') throw new Error('Invalid native audio pack');
    for (const cue of Object.values(value.cues)) {
      if (!cue || typeof cue.url !== 'string' || !Number.isFinite(cue.sampleRate) || cue.sampleRate <= 0 || !Number.isSafeInteger(cue.samples) || cue.samples <= 0) throw new Error('Invalid native cue');
      const url = new URL(cue.url, base);
      if (url.origin !== base.origin || !url.pathname.startsWith(new URL('.', base).pathname)) throw new Error('Native cue escapes audio pack');
      if ((cue.loopStart === null) !== (cue.loopEnd === null) || cue.loopStart !== null && (!Number.isSafeInteger(cue.loopStart) || !Number.isSafeInteger(cue.loopEnd) || cue.loopStart < 0 || cue.loopEnd! <= cue.loopStart || cue.loopEnd! > cue.samples)) throw new Error('Invalid native loop');
    }
    // Fetch small effects before a gesture without creating a context or playing.
    for (const name of Object.keys(value.cues)) if (!name.startsWith('music')) void fetchBytes(name, value.cues[name]).catch(() => {});
    return value;
  }).catch(error => { if (!disposed) failure = String(error); return undefined; });

  function fetchBytes(name: string, cue: AudioCue) {
    if (!bytes.has(name)) bytes.set(name, fetchAsset(new URL(cue.url, base), { signal: abort.signal }).then(response => {
      if (!response.ok) throw new Error(`Native audio ${name}: HTTP ${response.status}`);
      return response.arrayBuffer();
    }));
    return bytes.get(name)!;
  }
  async function load(name: string): Promise<AudioBuffer | undefined> {
    if (buffers.has(name)) return buffers.get(name);
    if (pending.has(name)) return pending.get(name);
    const task = (async () => {
      const assets = await pack, ctx = context;
      if (!assets?.cues[name] || !ctx || disposed) return;
      try {
        const buffer = await ctx.decodeAudioData((await fetchBytes(name, assets.cues[name])).slice(0));
        if (disposed || context !== ctx) return;
        buffers.set(name, buffer); return buffer;
      } catch (error) { if (!disposed) failure = String(error); }
    })();
    pending.set(name, task);
    try { return await task; } finally { pending.delete(name); }
  }
  function stopSource(source: AudioBufferSourceNode) {
    source.onended = null;
    try { source.stop(); } catch { /* already ended */ }
    source.disconnect(); active.delete(source);
  }
  function stopMusic() { generation++; if (music) stopSource(music); music = undefined; }
  function stop() { effectGeneration++; stopMusic(); for (const source of active) stopSource(source); }
  function audibleHome() { return state.home && state.powered && !state.sleeping && !state.muted; }
  async function updateMusic() {
    if (disposed || !audibleHome() || context?.state !== 'running' || music || musicLoading) return;
    musicLoading = true;
    const token = generation;
    try {
      const [assets, buffer] = await Promise.all([pack, load('music')]);
      if (!assets || !buffer || disposed || token !== generation || !audibleHome() || context?.state !== 'running' || !master) return;
      const cue = assets.cues.music, source = context.createBufferSource();
      source.buffer = buffer;
      const loopStart = (cue.loopStart ?? 0) / cue.sampleRate, loopEnd = (cue.loopEnd ?? cue.samples) / cue.sampleRate;
      source.loop = cue.loopStart !== null; source.loopStart = loopStart; source.loopEnd = loopEnd;
      let offset = Math.max(0, (state.elapsedMs - musicSince) / 1000);
      if (source.loop && offset >= loopEnd) offset = loopStart + (offset - loopStart) % (loopEnd - loopStart);
      if (offset >= buffer.duration) offset = 0;
      source.connect(master); active.add(source); music = source;
      source.onended = () => { source.disconnect(); active.delete(source); if (music === source) music = undefined; };
      source.start(0, offset);
    } finally { musicLoading = false; }
  }
  async function unlock() {
    if (disposed) return;
    try {
      if (!context) { const Context = environment.AudioContext ?? globalThis.AudioContext; context = new Context(); master = context.createGain(); master.connect(context.destination); }
      if (context.state === 'suspended') await context.resume();
      const assets = await pack;
      if (disposed) return;
      if (assets) for (const name of Object.keys(assets.cues)) if (!name.startsWith('music')) void load(name);
      if (master) master.gain.value = state.muted ? 0 : state.volume;
      void updateMusic();
    } catch (error) { failure = String(error); }
  }
  function update(next: AudioState) {
    const wasHome = audibleHome(), oldPhase = state.home;
    state = { ...next, volume: Number.isFinite(next.volume) ? Math.max(0, Math.min(1, next.volume)) : .35 };
    if (oldPhase !== state.home && state.home) musicSince = state.elapsedMs;
    if (master && context) master.gain.setValueAtTime(state.muted ? 0 : state.volume, context.currentTime);
    if (!state.powered || state.sleeping) stop();
    else if (!audibleHome()) { if (wasHome || music) stopMusic(); }
    else void updateMusic();
  }
  function play(name: Sound, muted: boolean, volume: number) {
    if (disposed || muted || !state.powered || state.sleeping || !context || !master) return;
    const token = effectGeneration, requested = performance.now(), ctx = context;
    function start(buffer: AudioBuffer | undefined) {
      if (!buffer || disposed || token !== effectGeneration || state.muted || !state.powered || state.sleeping || context !== ctx || ctx.state !== 'running' || !master) return;
      // A cold decode may finish just after the unlock gesture. Drop old effects
      // instead of playing a delayed burst after a slow asset or decoder.
      if (performance.now() - requested > 250) return;
      master.gain.value = Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : .35;
      const source = ctx.createBufferSource(); source.buffer = buffer; source.connect(master);
      active.add(source); source.onended = () => { active.delete(source); source.disconnect(); };
      source.start(); lastPlayed = name;
    }
    const buffer = buffers.get(name); if (buffer) start(buffer); else void load(name).then(start);
  }
  return {
    unlock, play, update, stop,
    status() { return { state: context?.state ?? 'locked', decoded: buffers.size, lastPlayed, music: Boolean(music), active: active.size, failure }; },
    dispose() { if (disposed) return; disposed = true; abort.abort(); stop(); buffers.clear(); bytes.clear(); master?.disconnect(); void context?.close(); },
  };
}
