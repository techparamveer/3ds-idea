import { MUSIC_PROCESSOR, musicBufferConfig, stamp, stamped, type BufferConfig } from './native-home-audio/transport-protocol.ts';
import type { MusicEntry } from './native-home-audio/types.ts';

export type RawNativeMusicPack = Readonly<{
  manifest: unknown;
  /** Ownership of these buffers transfers to the validation/synthesis worker. */
  files: readonly Readonly<{ name: string; buffer: ArrayBuffer }>[];
}>;
export type NativeMusicStart = Readonly<{ epoch: number; entry: MusicEntry; firstContextFrame: number; missedByFrames: number }>;
export type NativeMusicBoundary = Readonly<{ epoch: number; contextFrame: number; outputConsumed: number }>;
export type NativeMusicTransportState = 'idle' | 'preparing' | 'prepared' | 'starting' | 'playing' | 'pausing' | 'paused' | 'resuming' | 'stopping' | 'failed' | 'disposed';
type Endpoint = 'worker' | 'worklet';
type Counters = Readonly<Record<string, number | string>>;
export type NativeMusicDiagnostic = Readonly<{
  source: Endpoint | 'transport'; type: string; epoch: number;
  state?: string; error?: string; counters?: Counters;
}>;
export type NativeMusicTransportStatus = Readonly<{
  state: NativeMusicTransportState; epoch: number; prepared: boolean; outputRate: number;
  entry: MusicEntry | null; firstContextFrame: number | null; missedByFrames: number | null;
  discardedMessages: number; failure: string | null;
  worker: Counters; worklet: Counters;
}>;
type MusicWorker = Pick<Worker, 'postMessage' | 'onmessage' | 'onerror' | 'onmessageerror' | 'terminate'>;
type MusicNode = Pick<AudioWorkletNode, 'port' | 'onprocessorerror' | 'connect' | 'disconnect'>;
export type NativeMusicEnvironment = Partial<{
  createWorker: (url: string | URL) => MusicWorker;
  createNode: (context: AudioContext, name: string, options: AudioWorkletNodeOptions) => MusicNode;
  createChannel: () => Pick<MessageChannel, 'port1' | 'port2'>;
  setTimeout: (callback: () => void, milliseconds: number) => unknown;
  clearTimeout: (handle: unknown) => void;
  /** Per-operation wall-clock bound; scheduled start adds its explicit future lead time. */
  timeoutMs: number;
}>;
export type NativeMusicTransportOptions = {
  context: AudioContext; destination: AudioNode; workerUrl: string | URL; workletUrl: string | URL;
  onDiagnostic?: (diagnostic: NativeMusicDiagnostic) => void;
  environment?: NativeMusicEnvironment;
};
type Reply = Record<string, unknown> & { type: string; epoch: number };
type Topology = {
  worker?: MusicWorker; node?: MusicNode; gain?: GainNode;
  channel?: Pick<MessageChannel, 'port1' | 'port2'>; attached: boolean;
};
type Waiter = {
  token: number; endpoint?: Endpoint; type?: string; replyEpoch?: number;
  resolve: (value: unknown) => void; reject: (error: Error) => void;
};
const counterKeys = ['outputRate', 'firstContextFrame', 'contextFrame', 'outputConsumed', 'outputAccepted', 'bufferedFrames',
  'creditEnd', 'minimumBufferedFrames', 'underrunFrames', 'underrunEvents', 'staleMessages', 'discontinuities',
  'outputProduced', 'missedByFrames', 'missingFrames', 'nativeAccepted', 'nativePosition', 'phaseNumerator', 'phaseDenominator',
  'retainedNativeStart', 'bufferedNativeFrames', 'capacityNativeFrames', 'taps', 'delayNativeFrames', 'delaySeconds', 'delayOutputFrames'] as const;
const frameNumber = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
function errorWithName(name: string, message: string): Error { const error = new Error(message); error.name = name; return error; }
const aborted = () => errorWithName('AbortError', 'Native music operation was superseded');
const invalidState = () => errorWithName('InvalidStateError', 'Native music transport is not ready for this operation');
const errorValue = (value: unknown) => value instanceof Error ? value : new Error(String(value));
const brief = (value: unknown) => String(value).slice(0, 512);

/** Main owns control and a music-only gate. PCM/credit/recycling never traverse main. */
export function createNativeMusicTransport(options: NativeMusicTransportOptions) {
  const { context, destination, environment = {} } = options;
  const createWorker = environment.createWorker ?? (url => new Worker(url, { type: 'module', name: 'native-home-music' }));
  const createNode = environment.createNode ?? ((ctx, name, init) => new AudioWorkletNode(ctx, name, init));
  const createChannel = environment.createChannel ?? (() => new MessageChannel());
  const schedule = environment.setTimeout ?? ((callback, ms) => globalThis.setTimeout(callback, ms));
  const unschedule = environment.clearTimeout ?? (handle => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>));
  const timeoutMs = environment.timeoutMs ?? 15000;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 2147483647) throw new RangeError('Invalid native music timeout');
  let state: NativeMusicTransportState = 'idle', epoch = 0, prepared = false;
  let topology: Topology | undefined, modulePromise: Promise<void> | undefined;
  let entry: MusicEntry | null = null, firstContextFrame: number | null = null, missedByFrames: number | null = null;
  let failure: string | null = null, discardedMessages = 0, lastDiagnosticTime = -Infinity;
  let workerStatus: Counters = {}, workletStatus: Counters = {};
  const waiters = new Set<Waiter>();

  function diagnostic(value: NativeMusicDiagnostic) { try { options.onDiagnostic?.(value); } catch { /* Observers cannot break transport cleanup. */ } }
  function setState(next: NativeMusicTransportState) {
    if (state === next) return;
    state = next; diagnostic({ source: 'transport', type: 'state', epoch, state: next });
  }
  function check(token: number) { if (state === 'disposed' || token !== epoch) throw aborted(); }
  function assertLive() { if (state === 'disposed') throw invalidState(); }
  function gate(value: 0 | 1) {
    if (!topology?.gain) return;
    try { topology.gain.gain.cancelScheduledValues(context.currentTime); topology.gain.gain.setValueAtTime(value, context.currentTime); }
    catch (error) { if (value) throw error; try { topology.node?.disconnect(); } catch { /* Already detached. */ } }
  }
  function cancelPending(error: Error) { for (const waiter of [...waiters]) waiter.reject(error); }
  function nextEpoch() {
    if (!Number.isSafeInteger(epoch + 1)) throw new RangeError('Native music epoch exhausted');
    epoch++; gate(0); cancelPending(aborted());
    entry = null; firstContextFrame = missedByFrames = null; workerStatus = {}; workletStatus = {}; lastDiagnosticTime = -Infinity;
    return epoch;
  }
  function cleanup() {
    const old = topology; topology = undefined;
    if (!old) return;
    if (old.worker) { old.worker.onmessage = old.worker.onerror = old.worker.onmessageerror = null; try { old.worker.terminate(); } catch { /* Best effort teardown. */ } }
    if (old.node) {
      old.node.onprocessorerror = null; old.node.port.onmessage = old.node.port.onmessageerror = null;
      try { old.node.port.close(); } catch { /* Already closed. */ }
      try { old.node.disconnect(); } catch { /* Already disconnected. */ }
    }
    try { old.gain?.disconnect(); } catch { /* Already disconnected. */ }
    for (const port of [old.channel?.port1, old.channel?.port2]) { try { port?.close(); } catch { /* Transferred/closed. */ } }
  }
  function post(endpoint: Endpoint, message: object, transfer: Transferable[] = []) {
    const output = endpoint === 'worker' ? topology?.worker : topology?.node?.port;
    if (!output) throw invalidState();
    output.postMessage(message, transfer);
  }
  function bestEffortDispose() {
    for (const endpoint of ['worker', 'worklet'] as const) { try { post(endpoint, { ...stamp(epoch), type: 'dispose' }); } catch { /* Still detach locally. */ } }
  }
  function fail(error: unknown) {
    if (state === 'disposed' || state === 'failed') return;
    const cause = errorValue(error); failure = brief(cause.message); epoch++; gate(0); cancelPending(cause);
    prepared = false; entry = null; bestEffortDispose(); cleanup();
    setState('failed'); diagnostic({ source: 'transport', type: 'error', epoch, error: failure });
  }
  async function operation<T>(token: number, work: () => Promise<T>): Promise<T> {
    try { check(token); return await work(); }
    catch (error) { if (token === epoch && state !== 'disposed') fail(error); throw error; }
  }
  function wait(token: number, label: string, milliseconds = timeoutMs, expected?: { endpoint: Endpoint; type: string; replyEpoch: number }) {
    check(token);
    let resolve!: (value: unknown) => void, reject!: (error: Error) => void;
    const promise = new Promise<unknown>((yes, no) => { resolve = yes; reject = no; });
    // Stop can reject a sibling wait before its Promise.all/await is installed.
    void promise.catch(() => {});
    let settled = false, timer: unknown;
    const finish = () => { if (settled) return false; settled = true; waiters.delete(waiter); unschedule(timer); return true; };
    const waiter: Waiter = { token, ...expected,
      resolve: value => { if (finish()) resolve(value); }, reject: error => { if (finish()) reject(error); } };
    waiters.add(waiter);
    timer = schedule(() => waiter.reject(errorWithName('TimeoutError', `Native music ${label} timed out`)), milliseconds);
    return { promise, waiter };
  }
  function ack(endpoint: Endpoint, type: string, token: number, replyEpoch = token, milliseconds = timeoutMs) {
    return wait(token, `${endpoint} ${type}`, milliseconds, { endpoint, type, replyEpoch }).promise as Promise<Reply>;
  }
  function all<T>(promises: Promise<T>[]) { const result = Promise.all(promises); void result.catch(() => {}); return result; }
  function counters(message: Reply): Counters {
    const result: Record<string, number | string> = {};
    for (const name of ['state', 'entry'] as const) if (typeof message[name] === 'string') result[name] = message[name].slice(0, 64);
    for (const name of counterKeys) if (typeof message[name] === 'number' && Number.isFinite(message[name])) result[name] = message[name];
    if (message.resampler && typeof message.resampler === 'object') {
      const nested = message.resampler as Record<string, unknown>;
      for (const name of counterKeys) if (typeof nested[name] === 'number' && Number.isFinite(nested[name])) result[`resampler.${name}`] = nested[name];
    }
    return result;
  }
  function validateAck(endpoint: Endpoint, message: Reply) {
    if (endpoint === 'worklet' && ['begun', 'paused', 'resumed', 'stopped'].includes(message.type) && !frameNumber(message.contextFrame)) throw new Error('Invalid worklet boundary acknowledgement');
    if (endpoint === 'worklet' && ['paused', 'resumed'].includes(message.type) && !frameNumber(message.outputConsumed)) throw new Error('Invalid consumed music position');
    if (message.type === 'started' && (!frameNumber(message.firstContextFrame) || !frameNumber(message.missedByFrames))) throw new Error('Invalid actual music start');
    if (message.type === 'begun') {
      const config = message.config as BufferConfig | undefined, expected = musicBufferConfig(context.sampleRate);
      if (!config || Object.keys(expected).some(key => config[key as keyof BufferConfig] !== expected[key as keyof BufferConfig])) throw new Error('Worklet acknowledged a different music buffer configuration');
    }
    if (message.type === 'producer-started' && message.entry !== entry) throw new Error('Worker acknowledged a different music entry');
  }
  function receive(owner: Topology, endpoint: Endpoint, value: unknown) {
    if (topology !== owner || state === 'disposed') return;
    if (!stamped(value) || (value.epoch !== epoch && !(value.epoch === 0 && !owner.attached))) { discardedMessages++; return; }
    const message = value as unknown as Reply;
    if (message.type === 'error') { fail(new Error(`${endpoint}: ${brief(message.error)}`)); return; }
    const waiter = [...waiters].find(item => item.token === epoch && item.endpoint === endpoint && item.type === message.type && item.replyEpoch === message.epoch);
    if (waiter) {
      try { validateAck(endpoint, message); waiter.resolve(message); }
      catch (error) { fail(error); return; }
    } else if (!['status', 'underrun', 'rebuffered'].includes(message.type)) { discardedMessages++; return; }
    const summary = counters(message);
    if (endpoint === 'worker') workerStatus = { ...workerStatus, ...summary }; else workletStatus = { ...workletStatus, ...summary };
    // Cache every report, emit bounded counter diagnostics at most once per context second.
    if (['status', 'underrun', 'rebuffered'].includes(message.type) && context.currentTime - lastDiagnosticTime >= 1) {
      lastDiagnosticTime = context.currentTime;
      diagnostic({ source: endpoint, type: message.type, epoch, counters: { ...summary } });
    }
  }
  async function ensureTopology(token: number): Promise<void> {
    check(token);
    if (topology?.attached) return;
    musicBufferConfig(context.sampleRate);
    if (!context.audioWorklet?.addModule) throw new Error('AudioWorklet is unavailable');
    if (!modulePromise) {
      modulePromise = context.audioWorklet.addModule(String(options.workletUrl));
      const attempt = modulePromise;
      void attempt.catch(() => { if (modulePromise === attempt) modulePromise = undefined; });
    }
    const loading = wait(token, 'worklet module');
    modulePromise.then(loading.waiter.resolve, error => loading.waiter.reject(errorValue(error)));
    await loading.promise; check(token); // addModule cannot be cancelled; stale completion creates nothing.
    const owner: Topology = { attached: false }; topology = owner;
    owner.worker = createWorker(options.workerUrl);
    owner.node = createNode(context, MUSIC_PROCESSOR, { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2] });
    owner.gain = context.createGain(); owner.gain.gain.setValueAtTime(0, context.currentTime);
    owner.node.connect(owner.gain); owner.gain.connect(destination);
    owner.channel = createChannel();
    owner.worker.onmessage = event => receive(owner, 'worker', event.data);
    owner.node.port.onmessage = event => receive(owner, 'worklet', event.data);
    owner.worker.onerror = event => { event.preventDefault(); if (topology === owner) fail(new Error(event.message || 'Music worker failed')); };
    owner.worker.onmessageerror = () => { if (topology === owner) fail(new Error('Music worker message could not be decoded')); };
    owner.node.onprocessorerror = () => { if (topology === owner) fail(new Error('Music AudioWorklet processor failed')); };
    owner.node.port.onmessageerror = () => { if (topology === owner) fail(new Error('Music worklet message could not be decoded')); };
    owner.node.port.start();
    const attached = all([ack('worker', 'attached', token, 0), ack('worklet', 'attached', token, 0)]);
    post('worker', { ...stamp(0), type: 'attach', port: owner.channel.port1 }, [owner.channel.port1]);
    post('worklet', { ...stamp(0), type: 'attach', port: owner.channel.port2 }, [owner.channel.port2]);
    await attached; check(token); owner.attached = true;
  }

  async function prepare(rawPack: RawNativeMusicPack, signal?: AbortSignal): Promise<void> {
    assertLive(); if (signal?.aborted) throw aborted();
    if (!rawPack || !Array.isArray(rawPack.files) || rawPack.files.some(file => !file || typeof file.name !== 'string' || !(file.buffer instanceof ArrayBuffer))) throw new TypeError('Invalid raw native music pack');
    const files = rawPack.files.map(file => ({ name: file.name, buffer: file.buffer }));
    const token = nextEpoch(); if (topology && !topology.attached) { bestEffortDispose(); cleanup(); } failure = null; setState('preparing');
    const cancel = () => { if (token === epoch) void stop().catch(() => {}); };
    signal?.addEventListener('abort', cancel, { once: true });
    if (signal?.aborted) cancel();
    try {
      await operation(token, async () => {
        await ensureTopology(token); check(token);
        const ready = all([ack('worklet', 'stopped', token), ack('worker', 'prepared', token)]);
        post('worklet', { ...stamp(token), type: 'stop' });
        post('worker', { ...stamp(token), type: 'prepare', manifest: rawPack.manifest, files }, [...new Set(files.map(file => file.buffer))]);
        await ready; check(token); prepared = true; setState('prepared'); check(token);
      });
    } finally { signal?.removeEventListener('abort', cancel); }
  }
  async function start(options: { entry: MusicEntry; when?: number }): Promise<NativeMusicStart> {
    assertLive();
    if (!prepared || !topology?.attached || ['preparing', 'stopping', 'failed'].includes(state)) throw invalidState();
    if (options.entry !== 'music' && options.entry !== 'music-resume') throw new TypeError('Invalid native music entry');
    const when = options.when;
    if (when !== undefined && (!Number.isFinite(when) || when < 0 || !frameNumber(Math.ceil(when * context.sampleRate)))) throw new RangeError('Invalid scheduled native music time');
    const startTimeout = timeoutMs + Math.max(0, (when ?? context.currentTime) - context.currentTime) * 1000;
    if (startTimeout > 2147483647) throw new RangeError('Scheduled native music start exceeds timer range');
    const token = nextEpoch(); entry = options.entry; setState('starting');
    return operation(token, async () => {
      const begun = ack('worklet', 'begun', token);
      post('worklet', { ...stamp(token), type: 'begin', config: musicBufferConfig(context.sampleRate), ...(when === undefined ? {} : { whenContextFrame: Math.ceil(when * context.sampleRate) }) });
      await begun; check(token);
      const actual = ack('worklet', 'started', token, token, startTimeout), producer = ack('worker', 'producer-started', token);
      const started = all([actual, producer]);
      gate(1); // Open before output begins; the worklet emits only silence until primed/when.
      post('worker', { ...stamp(token), type: 'start', entry: options.entry, outputRate: context.sampleRate });
      const [result] = await started; check(token);
      firstContextFrame = result.firstContextFrame as number; missedByFrames = result.missedByFrames as number; setState('playing'); check(token);
      return { epoch: token, entry: options.entry, firstContextFrame, missedByFrames };
    });
  }
  async function boundaryControl(command: 'pause' | 'resume'): Promise<NativeMusicBoundary> {
    assertLive(); if (state !== (command === 'pause' ? 'playing' : 'paused')) throw invalidState();
    const token = epoch; setState(command === 'pause' ? 'pausing' : 'resuming');
    return operation(token, async () => {
      const type = command === 'pause' ? 'paused' : 'resumed';
      const finished = all([ack('worklet', type, token), ack('worker', type, token)]);
      if (command === 'resume') gate(1);
      post('worker', { ...stamp(token), type: command }); post('worklet', { ...stamp(token), type: command });
      const [result] = await finished; check(token);
      if (command === 'pause') gate(0);
      setState(command === 'pause' ? 'paused' : 'playing'); check(token);
      return { epoch: token, contextFrame: result.contextFrame as number, outputConsumed: result.outputConsumed as number };
    });
  }
  async function stop(): Promise<void> {
    if (state === 'disposed') return;
    const token = nextEpoch();
    if (!topology?.attached) { if (topology) bestEffortDispose(); cleanup(); setState(prepared ? 'prepared' : 'idle'); return; }
    setState('stopping');
    return operation(token, async () => {
      const stopped = all([ack('worker', 'stopped', token), ack('worklet', 'stopped', token)]);
      post('worker', { ...stamp(token), type: 'stop' }); post('worklet', { ...stamp(token), type: 'stop' });
      await stopped; check(token); setState(prepared ? 'prepared' : 'idle'); check(token);
    });
  }
  function dispose() {
    if (state === 'disposed') return;
    nextEpoch(); prepared = false; bestEffortDispose(); cleanup(); setState('disposed');
  }
  return {
    prepare, start, pause: () => boundaryControl('pause'), resume: () => boundaryControl('resume'), stop, dispose,
    status(): NativeMusicTransportStatus { return { state, epoch, prepared, outputRate: context.sampleRate, entry, firstContextFrame, missedByFrames,
      discardedMessages, failure, worker: { ...workerStatus }, worklet: { ...workletStatus } }; },
  };
}
