import type { AppEvent, AppState, JsonValue } from './app-types.ts';
import type { RuntimeEffect } from './app-host.ts';
import { FirmwareStorageError, type FirmwareStorage } from './app-persistence.ts';

type CapabilityResult = Extract<AppEvent, { type: 'capability-result' }>;
type MotionSample = { x: number; y: number; z: number; interval: number };
type MotionPermission = typeof DeviceMotionEvent & { requestPermission?: () => Promise<PermissionState> };
/** Injectable browser boundary. No device is accessed when the adapter is constructed. */
export type CapabilityEnvironment = {
  getUserMedia?: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
  createVideo?: () => HTMLVideoElement;
  createCanvas?: () => HTMLCanvasElement;
  createRecorder?: (stream: MediaStream) => MediaRecorder;
  requestMotionPermission?: () => Promise<PermissionState>;
  listenMotion?: (callback: (sample: MotionSample) => void) => () => void;
  pickFile?: (kind: 'photo' | 'audio', signal: AbortSignal) => Promise<Blob & { name?: string }>;
  now?: () => number;
  id?: () => string;
};
export type CapabilityAdapterOptions = {
  storage?: Pick<FirmwareStorage, 'putMedia' | 'deleteMedia'>;
  isCurrent: (item: RuntimeEffect) => boolean;
  onResult: (owner: string, event: CapabilityResult) => void;
  environment?: CapabilityEnvironment;
  maxRecordingBytes?: number;
};
type Recording = { recorder: MediaRecorder; stream: MediaStream; result: Promise<Blob>; cancel: () => void };
type Lease = { jobs: Map<string, AbortController>; camera?: { stream: MediaStream; video: HTMLVideoElement }; recording?: Recording; stopMotion?: () => void; motion?: MotionSample };
class CapabilityError extends Error { readonly reason: string; constructor(reason: string) { super(reason); this.reason = reason; } }
const stopTracks = (stream: MediaStream) => { for (const track of stream.getTracks()) track.stop(); };
function stopCamera(lease: Lease) {
  if (!lease.camera) return;
  stopTracks(lease.camera.stream); lease.camera.video.pause(); lease.camera.video.srcObject = null; delete lease.camera;
}
function reason(error: unknown) {
  if (error instanceof CapabilityError) return error.reason;
  if (error instanceof FirmwareStorageError) return error.code === 'quota' ? 'quota' : 'storage-unavailable';
  const name = error && typeof error === 'object' && 'name' in error ? error.name : '';
  return name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : name === 'AbortError' ? 'cancelled' : 'unavailable';
}
function browserEnvironment(): CapabilityEnvironment {
  const motion = globalThis.DeviceMotionEvent as MotionPermission | undefined;
  return {
    getUserMedia: globalThis.navigator?.mediaDevices?.getUserMedia.bind(globalThis.navigator.mediaDevices),
    createVideo: globalThis.document ? () => document.createElement('video') : undefined,
    createCanvas: globalThis.document ? () => document.createElement('canvas') : undefined,
    createRecorder: globalThis.MediaRecorder ? stream => new MediaRecorder(stream) : undefined,
    requestMotionPermission: motion?.requestPermission?.bind(motion),
    listenMotion: globalThis.window && motion ? callback => {
      const listener = (event: DeviceMotionEvent) => {
        const a = event.accelerationIncludingGravity;
        if (a && [a.x, a.y, a.z].every(v => typeof v === 'number' && Number.isFinite(v))) callback({ x: a.x!, y: a.y!, z: a.z!, interval: Number.isFinite(event.interval) ? event.interval : 0 });
      };
      window.addEventListener('devicemotion', listener);
      return () => window.removeEventListener('devicemotion', listener);
    } : undefined,
    pickFile: globalThis.document ? (kind, signal) => new Promise((resolve, reject) => {
      const input = document.createElement('input'); input.type = 'file'; input.accept = kind === 'photo' ? 'image/*' : 'audio/*'; input.hidden = true;
      const cleanup = () => { signal.removeEventListener('abort', cancel); input.remove(); input.onchange = input.oncancel = null; };
      const cancel = () => { cleanup(); reject(new CapabilityError('cancelled')); };
      input.onchange = () => { const file = input.files?.[0]; cleanup(); if (file) resolve(file); else reject(new CapabilityError('cancelled')); };
      input.oncancel = cancel; signal.addEventListener('abort', cancel, { once: true });
      if (signal.aborted) { cancel(); return; }
      document.body.append(input);
      try { input.click(); } catch (error) { cleanup(); reject(error); }
    }) : undefined,
    now: () => Date.now(), id: () => crypto.randomUUID(),
  };
}
function startRecording(stream: MediaStream, recorder: MediaRecorder, maximum: number): Recording {
  let cancelled = false, failure: unknown, total = 0;
  const chunks: Blob[] = [];
  let rejectResult!: (error: unknown) => void;
  const result = new Promise<Blob>((resolve, reject) => {
    rejectResult = reject;
    recorder.ondataavailable = event => {
      if (cancelled || failure || !event.data.size) return;
      total += event.data.size;
      if (total > maximum) { failure = new CapabilityError('quota'); chunks.length = 0; if (recorder.state !== 'inactive') recorder.stop(); stopTracks(stream); }
      else chunks.push(event.data);
    };
    recorder.onerror = () => { failure = new CapabilityError('unavailable'); chunks.length = 0; if (recorder.state !== 'inactive') recorder.stop(); stopTracks(stream); reject(failure); };
    recorder.onstop = () => {
      stopTracks(stream);
      recorder.ondataavailable = recorder.onerror = recorder.onstop = null;
      if (cancelled || failure) reject(failure ?? new CapabilityError('cancelled'));
      else resolve(new Blob(chunks, { type: recorder.mimeType || chunks[0]?.type || 'audio/webm' }));
      chunks.length = 0;
    };
  });
  // The recording may fail before the user presses Stop. Keep that rejection handled.
  void result.catch(() => {});
  const cancel = () => {
    cancelled = true; chunks.length = 0;
    recorder.ondataavailable = recorder.onerror = recorder.onstop = null;
    if (recorder.state !== 'inactive') recorder.stop();
    stopTracks(stream); rejectResult(new CapabilityError('cancelled'));
  };
  try { recorder.start(250); } catch (error) { cancel(); throw error; }
  return { recorder, stream, result, cancel };
}
/** Execute capability effects in the originating gesture handler; release effects need no gesture. */
export function createCapabilityAdapter(options: CapabilityAdapterOptions) {
  const env = options.environment ?? browserEnvironment(), leases = new Map<string, Lease>();
  let disposed = false;
  function release(owner: string) {
    const lease = leases.get(owner); if (!lease) return;
    leases.delete(owner);
    for (const job of lease.jobs.values()) job.abort();
    lease.jobs.clear(); stopCamera(lease); lease.recording?.cancel(); lease.stopMotion?.();
  }
  async function execute(item: RuntimeEffect, context: { userGesture: boolean }): Promise<void> {
    if (item.effect.type === 'release-capabilities') { release(item.owner); return; }
    if (disposed || item.effect.type !== 'capability' || !options.isCurrent(item)) return;
    const effect = item.effect;
    const lease = leases.get(item.owner) ?? { jobs: new Map<string, AbortController>() };
    leases.set(item.owner, lease);
    lease.jobs.get(effect.requestId)?.abort();
    const controller = new AbortController(); lease.jobs.set(effect.requestId, controller);
    const current = () => !disposed && !controller.signal.aborted && leases.get(item.owner) === lease && lease.jobs.get(effect.requestId) === controller && options.isCurrent(item);
    const requireCurrent = () => { if (!current()) throw new CapabilityError('cancelled'); };
    const result = (ok: boolean, value?: JsonValue, error?: string) => { if (current()) options.onResult(item.owner, { type: 'capability-result', requestId: effect.requestId, requestToken: item.id, ok, ...(value === undefined ? {} : { value }), ...(error ? { reason: error } : {}) }); };
    async function persist(blob: Blob, kind: 'photo' | 'audio', name?: string): Promise<AppState> {
      requireCurrent(); if (!options.storage) throw new CapabilityError('storage-unavailable');
      const id = (env.id ?? (() => crypto.randomUUID()))();
      const metadata = await options.storage.putMedia({ id, kind, name: (name || (kind === 'photo' ? 'Photo' : 'Recording')).slice(0, 256), createdAt: (env.now ?? Date.now)() }, blob);
      if (!current()) { await options.storage.deleteMedia(id); throw new CapabilityError('cancelled'); }
      return { ...metadata };
    }
    try {
      if (['local-wireless', 'nfc', 'nintendo-network'].includes(effect.capability)) { result(false, undefined, 'offline'); return; }
      if (!context.userGesture) throw new CapabilityError('gesture-required');
      const operation = effect.options?.operation;
      if (effect.capability === 'camera') {
        if (operation === 'capture') {
          const camera = lease.camera;
          if (!camera || !env.createCanvas || !camera.video.videoWidth || !camera.video.videoHeight) throw new CapabilityError('unavailable');
          const canvas = env.createCanvas(), scale = Math.min(1, 1920 / camera.video.videoWidth, 1080 / camera.video.videoHeight); canvas.width = Math.max(1, Math.round(camera.video.videoWidth * scale)); canvas.height = Math.max(1, Math.round(camera.video.videoHeight * scale));
          const ctx = canvas.getContext('2d'); if (!ctx) throw new CapabilityError('unavailable');
          ctx.drawImage(camera.video, 0, 0, canvas.width, canvas.height);
          const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new CapabilityError('unavailable')), 'image/png'));
          result(true, await persist(blob, 'photo'));
        } else {
          if (!env.getUserMedia || !env.createVideo) throw new CapabilityError('unavailable');
          stopCamera(lease);
          const stream = await env.getUserMedia({ video: { facingMode: effect.options?.facing === 'user' ? 'user' : 'environment' }, audio: false });
          if (!current()) { stopTracks(stream); return; }
          let video: HTMLVideoElement;
          try { video = env.createVideo(); } catch (error) { stopTracks(stream); throw error; }
          video.muted = true; video.playsInline = true; video.srcObject = stream;
          const camera = { stream, video }; lease.camera = camera;
          try { await video.play(); requireCurrent(); result(true, { leaseId: `${item.owner}:camera` }); }
          catch (error) { if (lease.camera === camera) stopCamera(lease); else { stopTracks(stream); video.pause(); video.srcObject = null; } throw error; }
        }
      } else if (effect.capability === 'microphone') {
        if (operation === 'stop') {
          const recording = lease.recording; if (!recording) throw new CapabilityError('unavailable');
          // Keep the recording in its lease until the stop event; release must still cancel it.
          try {
            if (recording.recorder.state !== 'inactive') recording.recorder.stop();
            const blob = await recording.result;
            result(true, await persist(blob, 'audio'));
          } finally { if (lease.recording === recording) delete lease.recording; recording.cancel(); }
        } else {
          if (!env.getUserMedia || !env.createRecorder) throw new CapabilityError('unavailable');
          lease.recording?.cancel(); delete lease.recording;
          const stream = await env.getUserMedia({ video: false, audio: true });
          if (!current()) { stopTracks(stream); return; }
          try { lease.recording = startRecording(stream, env.createRecorder(stream), options.maxRecordingBytes ?? 32 * 1024 * 1024); }
          catch (error) { stopTracks(stream); throw error; }
          result(true, { leaseId: `${item.owner}:microphone` });
        }
      } else if (effect.capability === 'motion') {
        if (!env.listenMotion) throw new CapabilityError('unavailable');
        const permission = env.requestMotionPermission ? await env.requestMotionPermission() : 'granted';
        requireCurrent(); if (permission !== 'granted') throw new CapabilityError('denied');
        lease.stopMotion?.();
        lease.stopMotion = env.listenMotion(sample => { if (leases.get(item.owner) === lease && Object.values(sample).every(Number.isFinite)) lease.motion = { ...sample }; });
        result(true, { leaseId: `${item.owner}:motion` });
      } else {
        if (!env.pickFile) throw new CapabilityError('unavailable');
        const kind = effect.capability === 'import-photo' ? 'photo' : 'audio';
        const file = await env.pickFile(kind, controller.signal);
        result(true, await persist(file, kind, file.name));
      }
    } catch (error) { result(false, undefined, reason(error)); }
    finally { if (lease.jobs.get(effect.requestId) === controller) lease.jobs.delete(effect.requestId); }
  }
  return {
    execute, release,
    getPreview: (owner: string): HTMLVideoElement | null => leases.get(owner)?.camera?.video ?? null,
    getMotion: (owner: string): MotionSample | null => { const sample = leases.get(owner)?.motion; return sample ? { ...sample } : null; },
    dispose() { if (disposed) return; disposed = true; for (const owner of leases.keys()) release(owner); },
  };
}
