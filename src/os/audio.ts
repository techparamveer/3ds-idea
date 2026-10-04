import { createNativeMusicTransport } from './native-music-transport.ts';
import { loadNativeMusicPack } from './native-music-pack.ts';
import type { MusicEntry } from './native-home-audio/types.ts';

export type Sound = 'select' | 'open' | 'open-effect' | 'back' | 'home' | 'power' | 'touch' | 'grab' | 'drop' | 'folder-open' | 'folder-close' | 'scroll-invalid' | 'toolbar-select';
export type AudioCue = { name: string; url: string; sampleRate: number; samples: number; loopStart: number | null; loopEnd: number | null };
export type AudioPack = { schema: 1; cues: Record<string, AudioCue> };
export type AudioState = { home: boolean; powered: boolean; sleeping: boolean; muted: boolean; volume: number; elapsedMs: number; homeUpdates: number };

export type MenuAudioEnvironment = {
  fetch?: typeof fetch; AudioContext?: typeof AudioContext;
  createMusicTransport?: typeof createNativeMusicTransport; loadMusicPack?: typeof loadNativeMusicPack;
};

/** Short cues share one gesture-unlocked context with persistent native music.
 * The worker owns synthesis; HOME updates own the provisional native fade clock. */
export function createMenuAudio(manifestUrl = '/os/firmware/10.7.0-32E/audio/audio.json', environment: MenuAudioEnvironment = {}) {
  const fetchAsset = environment.fetch ?? globalThis.fetch;
  let context: AudioContext | undefined, master: GainNode | undefined, disposed = false;
  // Constructed ahead of the first gesture by prepare(); adopted only by unlock().
  let preparedContext: AudioContext | undefined;
  let lastPlayed: Sound | undefined, musicGain: GainNode | undefined;
  let transport: ReturnType<typeof createNativeMusicTransport> | undefined;
  let musicFailure: string | undefined, musicRevision = 0, activeRevision = -1, gainRevision = -1;
  let musicEntry: MusicEntry = 'music', enteredHome = false, fadeStart = 0, musicDueUpdate = 0;
  let musicWork = false, musicDirty = false, fetchMusicAbort: AbortController | undefined;
  let stopping: Promise<void> = Promise.resolve();
  let state: AudioState = { home: false, powered: true, sleeping: false, muted: false, volume: .35, elapsedMs: 0, homeUpdates: 0 };
  let failure: string | undefined, effectGeneration = 0;
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
  function musicEnabled() { return state.home && state.powered; }
  function soundUpdate() { return state.homeUpdates; }
  function applyGain() {
    if (!context) return;
    master?.gain.setValueAtTime(state.muted || state.sleeping || !state.powered ? 0 : state.volume, context.currentTime);
    const fade = musicEntry === 'music' ? 1 : Math.min(1, Math.max(0, soundUpdate() - fadeStart) / 180);
    musicGain?.gain.setValueAtTime(musicEnabled() && gainRevision === musicRevision && !musicFailure ? Math.fround(fade) : 0, context.currentTime);
  }
  function stopEffects() { effectGeneration++; for (const source of active) stopSource(source); }
  function stopMusic() {
    const token = ++musicRevision; activeRevision = -1; gainRevision = -1;
    fetchMusicAbort?.abort();
    if (context) musicGain?.gain.setValueAtTime(0, context.currentTime);
    if (transport) {
      // Stop gates synchronously and invalidates module/prepare/start completions.
      stopping = transport.stop().catch(error => {
        if (!disposed && token === musicRevision && error?.name !== 'AbortError') musicFailure = String(error);
      });
    }
  }
  function stop() { stopEffects(); stopMusic(); }
  function updateMusic() {
    if (disposed) return;
    musicDirty = true;
    if (musicWork) return;
    musicWork = true;
    void (async () => {
      try {
        while (musicDirty && !disposed) {
          musicDirty = false;
          await stopping;
          if (disposed || !musicEnabled() || musicFailure || context?.state !== 'running' || !musicGain) continue;
          if (activeRevision === musicRevision || state.sleeping) continue;
          const token = musicRevision, ctx = context;
          const current = () => !disposed && token === musicRevision && musicEnabled() && context === ctx;
          try {
            if (!transport) transport = (environment.createMusicTransport ?? createNativeMusicTransport)({
              context: ctx, destination: musicGain,
              workerUrl: new URL('../audio-stream/music-synthesis.worker.js', base),
              workletUrl: new URL('../audio-stream/music-output.worklet.js', base),
              onDiagnostic: event => {
                if (!disposed && event.type === 'error') { musicFailure = event.error ?? 'Native music failed'; applyGain(); }
              },
            });
            if (!transport.status().prepared) {
              const controller = new AbortController(); fetchMusicAbort = controller;
              const cancel = () => controller.abort(); abort.signal.addEventListener('abort', cancel, { once: true });
              try {
                const raw = await (environment.loadMusicPack ?? loadNativeMusicPack)(new URL('../music/music.json', base).href, { fetch: fetchAsset, signal: controller.signal });
                if (!current()) continue;
                await transport.prepare(raw, controller.signal);
              } finally {
                abort.signal.removeEventListener('abort', cancel);
                if (fetchMusicAbort === controller) fetchMusicAbort = undefined;
              }
            }
            if (!current() || state.sleeping || soundUpdate() < musicDueUpdate) continue;
            // Queue dispatch follows the same application update as the return
            // callback. Countdown3 is due on pass4 (three subsequent updates).
            // The first ready sequence update increments before calculating gain.
            fadeStart = soundUpdate() - 1; gainRevision = token; applyGain();
            await transport.start({ entry: musicEntry });
            if (current()) { activeRevision = token; applyGain(); }
          } catch (error) {
            if (current() && (error as Error)?.name !== 'AbortError') {
              musicFailure = String(error); applyGain();
            }
          }
        }
      } finally { musicWork = false; }
    })();
  }
  /** Construct the AudioContext while the page is idle. Creating the first
   * context starts the audio device (~90 ms on the main thread in Chromium);
   * doing it here keeps that out of the first key press. Nothing is audible or
   * scheduled until unlock() adopts it inside a gesture, so playback still
   * begins only after user input, as before. */
  function prepare() {
    if (disposed || context || preparedContext) return;
    try {
      const Context = environment.AudioContext ?? globalThis.AudioContext;
      preparedContext = new Context();
      // Where autoplay is already allowed the context starts running; hold it
      // suspended until the gesture, like a context created in unlock().
      if (preparedContext.state === 'running') void preparedContext.suspend?.().catch(() => undefined);
    } catch { preparedContext = undefined; }
  }
  async function unlock() {
    if (disposed) return;
    try {
      if (!context) {
        const Context = environment.AudioContext ?? globalThis.AudioContext;
        context = preparedContext ?? new Context(); preparedContext = undefined;
        master = context.createGain(); master.connect(context.destination);
        musicGain = context.createGain(); musicGain.gain.value = 0; musicGain.connect(master);
      }
      if (context.state === 'suspended') await context.resume();
      if (disposed) return;
      // Failed native music retries only on a new gesture, never every paint.
      if (musicFailure) { musicRevision++; fetchMusicAbort?.abort(); transport?.dispose(); transport = undefined; musicFailure = undefined; activeRevision = -1; }
      applyGain(); updateMusic();
      const assets = await pack;
      if (disposed) return;
      if (assets) for (const name of Object.keys(assets.cues)) if (!name.startsWith('music')) void load(name);
    } catch (error) { if (!disposed) failure = String(error); }
  }
  function update(next: AudioState) {
    const previous = state, wasEnabled = musicEnabled();
    state = { ...next, volume: Number.isFinite(next.volume) ? Math.max(0, Math.min(1, next.volume)) : .35 };
    if (wasEnabled && !musicEnabled()) stopMusic();
    if (!state.powered) enteredHome = false;
    if (!wasEnabled && musicEnabled()) {
      musicRevision++; activeRevision = -1; musicEntry = enteredHome ? 'music-resume' : 'music'; enteredHome = true;
      musicDueUpdate = soundUpdate() + (musicEntry === 'music-resume' ? 3 : 0);
    }
    if ((!state.powered && previous.powered) || (state.sleeping && !previous.sleeping)) stopEffects();
    // Accepted sleep/mute changes gain without selecting an archive entry. The
    // browser retains synthesis; hardware DSP sleep continuity is unverified.
    applyGain(); updateMusic();
  }
  function play(name: Sound, muted: boolean, volume: number) {
    if (disposed || muted || !state.powered || state.sleeping || !context || !master) return;
    const token = effectGeneration, requested = performance.now(), ctx = context;
    function start(buffer: AudioBuffer | undefined) {
      if (!buffer || disposed || token !== effectGeneration || state.muted || !state.powered || state.sleeping || context !== ctx || ctx.state !== 'running' || !master) return;
      // A cold decode may finish just after the unlock gesture. Drop old effects
      // instead of playing a delayed burst after a slow asset or decoder.
      if (performance.now() - requested > 250) return;
      // The current OS state owns master volume; a late cue cannot unmute it.
      const source = ctx.createBufferSource(); source.buffer = buffer; source.connect(master);
      active.add(source); source.onended = () => { active.delete(source); source.disconnect(); };
      source.start(); lastPlayed = name;
    }
    const buffer = buffers.get(name); if (buffer) start(buffer); else void load(name).then(start);
  }
  return {
    prepare, unlock, play, update, stop,
    status() { const native = transport?.status(); return { state: context?.state ?? 'locked', decoded: buffers.size, lastPlayed, music: native?.state === 'playing', active: active.size, failure: failure ?? musicFailure, musicFailure, musicEntry, musicTransport: native }; },
    dispose() { if (disposed) return; disposed = true; abort.abort(); fetchMusicAbort?.abort(); stopEffects(); transport?.dispose(); buffers.clear(); bytes.clear(); musicGain?.disconnect(); master?.disconnect(); void context?.close(); void preparedContext?.close(); preparedContext = undefined; },
  };
}
