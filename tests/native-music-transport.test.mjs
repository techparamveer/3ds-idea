import test from 'node:test';
import assert from 'node:assert/strict';
import { createNativeMusicTransport } from '../src/os/native-music-transport.ts';
import { MUSIC_PROCESSOR, musicBufferConfig } from '../src/os/native-home-audio/transport-protocol.ts';

const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const microtasks = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
const aborts = promise => assert.rejects(promise, { name: 'AbortError' });

function harness(options = {}) {
  const messages = [], diagnostics = [], workers = [], nodes = [], gains = [], channels = [], timers = new Map();
  let nextTimer = 0, wallTime = 0, moduleCalls = 0;
  const settings = { attach: true, prepare: true, begin: true, producer: true, started: true, stopped: true, workerBoundary: true, ...options };
  const controlAcks = [];
  const context = { sampleRate: 48000, currentTime: 1, state: 'running', closeCalls: 0,
    audioWorklet: { addModule(url) { moduleCalls++; assert.equal(url, '/music.worklet.js'); return settings.module?.promise ?? Promise.resolve(); } },
    createGain() {
      const gain = { value: 1, changes: [], cancelScheduledValues(time) { this.changes.push(['cancel', time]); }, setValueAtTime(value, time) { this.value = value; this.changes.push([value, time]); } };
      const node = { gain, connected: [], disconnected: 0, connect(target) { this.connected.push(target); }, disconnect() { this.disconnected++; } };
      gains.push(node); return node;
    },
    close() { this.closeCalls++; },
  };
  const frame = () => Math.floor(context.currentTime * context.sampleRate);
  function port(name, endpoint) {
    return { name, onmessage: null, onmessageerror: null, starts: 0, closes: 0,
      start() { this.starts++; }, close() { this.closes++; },
      emit(data) { this.onmessage?.({ data }); },
      postMessage(message, transfer = []) {
        if (settings.throwPost === message.type) throw new Error(`Cannot post ${message.type}`);
        const data = message.type === 'prepare' ? structuredClone(message, { transfer }) : message;
        messages.push({ endpoint, data, transfer: [...transfer] });
        if (endpoint) react(endpoint, this, data);
      },
    };
  }
  const reply = (port, epoch, type, extra = {}) => port.emit({ version: 1, epoch, type, ...extra });
  function react(endpoint, port, m) {
    if (m.type === 'attach' && settings.attach) reply(port, 0, 'attached', { source: endpoint });
    if (endpoint === 'worker' && m.type === 'prepare' && settings.prepare) reply(port, m.epoch, 'prepared');
    if (endpoint === 'worklet' && m.type === 'begin') {
      port.begin = m;
      if (settings.begin) reply(port, m.epoch, 'begun', { contextFrame: frame(), config: m.config });
    }
    if (endpoint === 'worker' && m.type === 'start') {
      if (settings.producer) reply(port, m.epoch, 'producer-started', { entry: m.entry, delaySeconds: .001 });
      const output = nodes.at(-1).port, first = settings.firstFrame ?? Math.max(frame(), output.begin.whenContextFrame ?? 0);
      if (settings.started) reply(output, m.epoch, 'started', { firstContextFrame: first, missedByFrames: output.begin.whenContextFrame ? Math.max(0, first - output.begin.whenContextFrame) : 0 });
    }
    if (m.type === 'pause' || m.type === 'resume') {
      const type = m.type === 'pause' ? 'paused' : 'resumed';
      if (endpoint === 'worker' && settings.workerBoundary) reply(port, m.epoch, type);
      if (endpoint === 'worklet') controlAcks.push(() => reply(port, m.epoch, type, { contextFrame: frame(), outputConsumed: settings.consumed ?? 4096 }));
    }
    if (m.type === 'stop' && settings.stopped) reply(port, m.epoch, 'stopped', endpoint === 'worklet' ? { contextFrame: frame() } : {});
  }
  const destination = { name: 'shared-master' };
  const environment = {
    timeoutMs: 100,
    createWorker(url) {
      assert.equal(url, '/music.worker.js'); const worker = { ...port('worker', 'worker'), onerror: null, onmessageerror: null, terminated: 0, terminate() { this.terminated++; } };
      workers.push(worker); return worker;
    },
    createNode(ctx, name, init) {
      assert.equal(ctx, context); assert.equal(name, MUSIC_PROCESSOR);
      assert.deepEqual(init, { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2] });
      if (settings.nodeFailure) throw new Error('No AudioWorkletNode');
      const node = { port: port('control', 'worklet'), onprocessorerror: null, connected: [], disconnected: 0,
        connect(target) { this.connected.push(target); }, disconnect() { this.disconnected++; } };
      nodes.push(node); return node;
    },
    createChannel() { const channel = { port1: port('direct-worker'), port2: port('direct-worklet') }; channels.push(channel); return channel; },
    setTimeout(callback, milliseconds) { const id = ++nextTimer; timers.set(id, { callback, deadline: wallTime + milliseconds }); return id; },
    clearTimeout(id) { timers.delete(id); },
  };
  const transport = createNativeMusicTransport({ context, destination, workerUrl: '/music.worker.js', workletUrl: '/music.worklet.js', environment,
    onDiagnostic(value) { diagnostics.push(value); settings.onDiagnostic?.(value); } });
  const raw = () => ({ manifest: { schema: 1 }, files: [{ name: 'entry.bin', buffer: new ArrayBuffer(8) }, { name: 'wave.bin', buffer: new ArrayBuffer(16) }] });
  return { transport, context, destination, messages, diagnostics, workers, nodes, gains, channels, timers, settings, raw, reply,
    moduleCalls: () => moduleCalls,
    prepare: async () => { await transport.prepare(raw()); },
    start: async () => { await transport.prepare(raw()); return transport.start({ entry: 'music' }); },
    quantum() { for (const ack of controlAcks.splice(0)) ack(); },
    advance(milliseconds) { wallTime += milliseconds; for (const [id, timer] of [...timers]) if (timers.has(id) && timer.deadline <= wallTime) { timers.delete(id); timer.callback(); } },
  };
}

test('prepare transfers raw bytes and attaches a direct stereo channel once without playing', async () => {
  const h = harness(), pack = h.raw(); await h.transport.prepare(pack);
  assert.equal(h.transport.status().state, 'prepared'); assert.equal(h.transport.status().prepared, true);
  assert.equal(h.moduleCalls(), 1); assert.equal(h.workers.length, 1); assert.equal(h.nodes.length, 1);
  assert.equal(h.gains[0].gain.value, 0); assert.equal(h.nodes[0].connected[0], h.gains[0]); assert.equal(h.gains[0].connected[0], h.destination);
  const attached = h.messages.filter(m => m.data.type === 'attach');
  assert.deepEqual(attached.map(m => [m.endpoint, m.data.version, m.data.epoch]), [['worker', 1, 0], ['worklet', 1, 0]]);
  assert.equal(attached[0].data.port, h.channels[0].port1); assert.equal(attached[0].transfer[0], h.channels[0].port1);
  assert.equal(attached[1].data.port, h.channels[0].port2); assert.equal(attached[1].transfer[0], h.channels[0].port2);
  assert.equal(h.channels[0].port1.onmessage, null); assert.equal(h.channels[0].port2.onmessage, null);
  assert.deepEqual(pack.files.map(f => f.buffer.byteLength), [0, 0]);
  assert.deepEqual(h.messages.find(m => m.data.type === 'prepare').data.files.map(f => f.buffer.byteLength), [8, 16]);
  assert.equal(h.messages.some(m => m.data.type === 'start'), false); assert.equal(h.context.closeCalls, 0);
  assert.equal(h.timers.size, 0);
});

test('worker start waits for begun and start resolves actual output timing, not producer acknowledgement', async () => {
  const h = harness({ begin: false, started: false }); await h.prepare();
  let resolved = false; const starting = h.transport.start({ entry: 'music-resume', when: 1.250001 }).then(result => { resolved = true; return result; });
  await microtasks(); assert.equal(h.messages.some(m => m.data.type === 'start'), false);
  const begin = h.messages.find(m => m.data.type === 'begin').data;
  assert.equal(begin.whenContextFrame, 60001); assert.deepEqual(begin.config, musicBufferConfig(48000));
  h.reply(h.nodes[0].port, begin.epoch, 'begun', { contextFrame: 48000, config: begin.config });
  await microtasks(); assert.equal(h.messages.at(-1).data.type, 'start'); assert.equal(resolved, false); assert.equal(h.gains[0].gain.value, 1);
  h.reply(h.nodes[0].port, begin.epoch, 'started', { firstContextFrame: 60416, missedByFrames: 415 });
  assert.deepEqual(await starting, { epoch: begin.epoch, entry: 'music-resume', firstContextFrame: 60416, missedByFrames: 415 });
  assert.equal(h.transport.status().firstContextFrame, 60416);
});

test('pause/resume preserve epoch and await both endpoints including output process boundary', async () => {
  const h = harness(); const start = await h.start();
  let paused = false; const pause = h.transport.pause().then(value => { paused = true; return value; });
  await microtasks(); assert.equal(paused, false); assert.equal(h.gains[0].gain.value, 1);
  await assert.rejects(h.transport.resume(), { name: 'InvalidStateError' });
  await assert.rejects(h.transport.pause(), { name: 'InvalidStateError' });
  h.context.currentTime = 1.5; h.quantum();
  assert.deepEqual(await pause, { epoch: start.epoch, contextFrame: 72000, outputConsumed: 4096 });
  assert.equal(h.gains[0].gain.value, 0); assert.equal(h.transport.status().state, 'paused');
  const resume = h.transport.resume(); assert.equal(h.gains[0].gain.value, 1);
  h.context.currentTime = 2; h.quantum();
  assert.deepEqual(await resume, { epoch: start.epoch, contextFrame: 96000, outputConsumed: 4096 });
  assert.equal(h.transport.status().state, 'playing');
  assert.deepEqual(h.messages.filter(m => ['pause', 'resume'].includes(m.data.type)).map(m => [m.endpoint, m.data.type, m.data.epoch]),
    [['worker', 'pause', start.epoch], ['worklet', 'pause', start.epoch], ['worker', 'resume', start.epoch], ['worklet', 'resume', start.epoch]]);
});

test('worklet boundary alone cannot complete pause before producer acknowledgement', async () => {
  const h = harness({ workerBoundary: false }); const start = await h.start();
  let complete = false; const pause = h.transport.pause().then(() => { complete = true; });
  h.quantum(); await microtasks(); assert.equal(complete, false);
  h.reply(h.workers[0], start.epoch, 'paused'); await pause; assert.equal(complete, true);
});

test('stop gates immediately, uses a fresh epoch and preserves resources/infrastructure for restart', async () => {
  const h = harness(); const first = await h.start(); h.settings.stopped = false;
  const stopped = h.transport.stop(), epoch = h.transport.status().epoch;
  assert.ok(epoch > first.epoch); assert.equal(h.gains[0].gain.value, 0); assert.equal(h.transport.status().state, 'stopping');
  h.reply(h.workers[0], epoch, 'stopped'); h.reply(h.nodes[0].port, epoch, 'stopped', { contextFrame: 48000 }); await stopped;
  assert.equal(h.transport.status().prepared, true); assert.equal(h.workers[0].terminated, 0); assert.equal(h.nodes[0].disconnected, 0);
  const second = await h.transport.start({ entry: 'music-resume' }); assert.ok(second.epoch > epoch);
  assert.equal(h.workers.length, 1); assert.equal(h.nodes.length, 1); assert.equal(h.messages.filter(m => m.data.type === 'prepare').length, 1);
});

test('stop during noncancellable addModule prevents late node creation; later prepare can reuse the load', async () => {
  const module = deferred(), h = harness({ module });
  const preparing = h.transport.prepare(h.raw()), cancelled = aborts(preparing);
  await h.transport.stop(); await cancelled;
  module.resolve(); await microtasks(); assert.equal(h.nodes.length, 0); assert.equal(h.workers.length, 0);
  await h.prepare(); assert.equal(h.moduleCalls(), 1); assert.equal(h.nodes.length, 1);
});

test('dispose during addModule rejects prepare and never creates or closes shared context resources', async () => {
  const module = deferred(), h = harness({ module }), preparing = h.transport.prepare(h.raw()), cancelled = aborts(preparing);
  h.transport.dispose(); await cancelled; module.resolve(); await microtasks();
  assert.equal(h.nodes.length, 0); assert.equal(h.workers.length, 0); assert.equal(h.context.closeCalls, 0);
  assert.equal(h.transport.status().state, 'disposed'); assert.equal(h.timers.size, 0);
});

test('superseding incomplete attachment tears down partial resources and accepts only the new setup', async () => {
  const h = harness({ attach: false }); const old = h.transport.prepare(h.raw()), cancelled = aborts(old);
  await microtasks(); const lateWorker = h.workers[0].onmessage, latePort = h.nodes[0].port.onmessage;
  h.settings.attach = true; await h.prepare(); await cancelled;
  assert.equal(h.workers[0].terminated, 1); assert.equal(h.nodes[0].disconnected, 1); assert.equal(h.gains[0].disconnected, 1);
  lateWorker({ data: { version: 1, epoch: 0, type: 'attached' } }); latePort({ data: { version: 1, epoch: 0, type: 'error', error: 'old' } });
  assert.equal(h.transport.status().state, 'prepared'); assert.equal(h.workers.length, 2);
});

test('stop while waiting for begun rejects start and stale begun never starts the worker', async () => {
  const h = harness({ begin: false }); await h.prepare();
  const starting = h.transport.start({ entry: 'music' }), cancelled = aborts(starting);
  const begin = h.messages.find(m => m.data.type === 'begin').data;
  await h.transport.stop(); await cancelled;
  h.reply(h.nodes[0].port, begin.epoch, 'begun', { contextFrame: 48000, config: begin.config }); await microtasks();
  assert.equal(h.messages.some(m => m.data.type === 'start'), false); assert.equal(h.transport.status().state, 'prepared');
});

test('new start supersedes an awaiting playback and stale started/error cannot affect the new epoch', async () => {
  const h = harness({ started: false }); await h.prepare();
  const old = h.transport.start({ entry: 'music' }), cancelled = aborts(old); await microtasks();
  const oldEpoch = h.transport.status().epoch;
  h.settings.started = true; const latest = await h.transport.start({ entry: 'music-resume' }); await cancelled;
  h.reply(h.nodes[0].port, oldEpoch, 'started', { firstContextFrame: 999, missedByFrames: 0 });
  h.reply(h.workers[0], oldEpoch, 'error', { error: 'Late old failure' });
  assert.equal(h.transport.status().epoch, latest.epoch); assert.equal(h.transport.status().entry, 'music-resume');
  assert.equal(h.transport.status().failure, null); assert.equal(h.transport.status().firstContextFrame, latest.firstContextFrame);
});

test('stop cancels a pending pause and ignores its later render-boundary ACK', async () => {
  const h = harness(); await h.start(); const pause = h.transport.pause(), cancelled = aborts(pause);
  await h.transport.stop(); await cancelled; h.quantum();
  assert.equal(h.transport.status().state, 'prepared'); assert.equal(h.gains[0].gain.value, 0);
});

test('AbortSignal cancels worker validation while preserving any previously validated pack', async () => {
  const h = harness(); await h.prepare(); h.settings.prepare = false;
  const signal = new AbortController(), operation = h.transport.prepare(h.raw(), signal.signal), cancelled = aborts(operation);
  await microtasks(); const oldEpoch = h.transport.status().epoch; signal.abort(); await cancelled; await microtasks();
  assert.equal(h.transport.status().prepared, true); assert.equal(h.transport.status().state, 'prepared');
  h.reply(h.workers[0], oldEpoch, 'prepared'); h.reply(h.workers[0], oldEpoch, 'error', { error: 'Stale decode rejection' });
  const started = await h.transport.start({ entry: 'music' }); assert.ok(started.epoch > oldEpoch);
});

test('already aborted prepare leaves live playback untouched and does not transfer buffers', async () => {
  const h = harness(); await h.start(); const before = h.transport.status(), signal = new AbortController(), raw = h.raw();
  signal.abort(); await aborts(h.transport.prepare(raw, signal.signal));
  assert.deepEqual(h.transport.status(), before); assert.deepEqual(raw.files.map(f => f.buffer.byteLength), [8, 16]);
});

test('module and acknowledgement timeouts are bounded and close only transport-owned resources', async () => {
  for (const settings of [{ module: deferred() }, { attach: false }, { prepare: false }]) {
    const h = harness(settings), operation = h.transport.prepare(h.raw()), failed = assert.rejects(operation, { name: 'TimeoutError' });
    await microtasks(); h.advance(101); await failed;
    assert.equal(h.transport.status().state, 'failed'); assert.equal(h.timers.size, 0); assert.equal(h.context.closeCalls, 0);
    for (const worker of h.workers) assert.equal(worker.terminated, 1);
    for (const node of h.nodes) assert.equal(node.disconnected, 1);
    settings.module?.resolve(); await microtasks(); assert.equal(h.transport.status().state, 'failed');
  }
});

test('scheduled start timeout includes explicit lead time; no first-frame ACK eventually fails', async () => {
  const h = harness({ started: false }); await h.prepare();
  const starting = h.transport.start({ entry: 'music', when: 2 }), failed = assert.rejects(starting, { name: 'TimeoutError' });
  await microtasks(); h.advance(101); await microtasks(); assert.equal(h.transport.status().state, 'starting');
  h.advance(1000); await failed; assert.equal(h.gains[0].gain.value, 0);
});

test('pause acknowledgement timeout gates music and reports unavailable without affecting shared context', async () => {
  const h = harness(); await h.start(); const pause = h.transport.pause(), failed = assert.rejects(pause, { name: 'TimeoutError' });
  h.advance(101); await failed;
  assert.equal(h.gains[0].gain.value, 0); assert.equal(h.transport.status().state, 'failed'); assert.equal(h.context.closeCalls, 0);
});

test('worker errors, processor errors and decode errors reject current work and fully detach', async () => {
  for (const fail of [
    h => h.workers[0].onerror({ message: 'Worker crashed', preventDefault() {} }),
    h => h.nodes[0].onprocessorerror({}),
    h => h.nodes[0].port.onmessageerror({}),
    h => h.reply(h.workers[0], h.transport.status().epoch, 'error', { error: 'Hash mismatch' }),
  ]) {
    const h = harness({ prepare: false }), preparing = h.transport.prepare(h.raw()), failed = assert.rejects(preparing);
    await microtasks(); fail(h); await failed;
    assert.equal(h.transport.status().state, 'failed'); assert.equal(h.workers[0].terminated, 1); assert.equal(h.nodes[0].port.closes, 1);
    assert.equal(h.nodes[0].onprocessorerror, null); assert.equal(h.workers[0].onmessage, null); assert.equal(h.context.closeCalls, 0);
  }
});

test('unsupported output/context and partial construction fail without a fixed-WAV fallback', async () => {
  for (const kind of ['sampleRate', 'audioWorklet', 'node']) {
    const h = harness({ nodeFailure: kind === 'node' });
    if (kind === 'sampleRate') h.context.sampleRate = 1;
    if (kind === 'audioWorklet') h.context.audioWorklet = undefined;
    await assert.rejects(h.transport.prepare(h.raw())); assert.equal(h.transport.status().state, 'failed');
    assert.equal(h.context.closeCalls, 0); assert.equal(h.messages.some(m => m.data.type === 'start'), false);
    for (const worker of h.workers) assert.equal(worker.terminated, 1);
  }
});

test('dispose invalidates playback, terminates, closes direct/control ports and detaches once', async () => {
  const h = harness(); const started = await h.start(); const late = h.nodes[0].port.onmessage;
  h.transport.dispose(); const disposedEpoch = h.transport.status().epoch;
  assert.ok(disposedEpoch > started.epoch); assert.equal(h.gains[0].gain.value, 0); assert.equal(h.context.closeCalls, 0);
  assert.equal(h.workers[0].terminated, 1); assert.equal(h.nodes[0].disconnected, 1); assert.equal(h.gains[0].disconnected, 1);
  assert.equal(h.channels[0].port1.closes, 1); assert.equal(h.channels[0].port2.closes, 1); assert.equal(h.nodes[0].port.closes, 1);
  late({ data: { version: 1, epoch: started.epoch, type: 'error', error: 'Late' } });
  h.transport.dispose(); await h.transport.stop(); assert.equal(h.transport.status().epoch, disposedEpoch);
  await assert.rejects(h.transport.prepare(h.raw()), { name: 'InvalidStateError' });
  assert.equal(h.timers.size, 0);
});

test('counter diagnostics are bounded, throttled and do not forward PCM or expose engine snapshots', async () => {
  const h = harness(); const started = await h.start(), initialMessages = h.messages.length;
  for (let i = 0; i < 30; i++) h.reply(h.nodes[0].port, started.epoch, 'status', { state: 'starved', underrunFrames: i, outputConsumed: 512,
    engine: { huge: new Float32Array(2048) }, arbitrary: 'ignored', resampler: { delaySeconds: .1, nested: ['ignored'] } });
  const reports = h.diagnostics.filter(d => d.type === 'status'); assert.equal(reports.length, 1);
  assert.equal(h.transport.status().worklet.underrunFrames, 29); assert.equal('engine' in h.transport.status().worklet, false);
  h.reply(h.workers[0], started.epoch, 'pcm', { buffer: new ArrayBuffer(8192), frames: 1024 });
  assert.equal(h.messages.length, initialMessages); assert.ok(h.transport.status().discardedMessages > 0);
  h.context.currentTime += 1; h.reply(h.nodes[0].port, started.epoch, 'underrun', { missingFrames: 17 });
  assert.equal(h.diagnostics.filter(d => d.type === 'underrun').length, 1);
  const snapshot = h.transport.status(); snapshot.worklet.underrunFrames = -1; assert.equal(h.transport.status().worklet.underrunFrames, 29);
  h.context.currentTime += 1;
  const previous = h.transport.status().worker, counters = { maxScheduleDelayMs: 12.5, maxChunkMs: 8, chunksProcessed: 200 };
  h.reply(h.workers[0], started.epoch, 'status', { ...counters, unknown: 99 });
  assert.deepEqual(h.transport.status().worker, { ...previous, ...counters });
  assert.deepEqual(h.diagnostics.at(-1).counters, counters);
  assert.equal(h.messages.length, initialMessages);
});

test('invalid protocol/future epochs cannot satisfy acknowledgements and malformed current timing fails safely', async () => {
  const h = harness({ started: false }); await h.prepare();
  const starting = h.transport.start({ entry: 'music' }), failed = assert.rejects(starting, /Invalid actual music start/);
  await microtasks(); const epoch = h.transport.status().epoch;
  h.nodes[0].port.emit({ version: 9, epoch, type: 'started', firstContextFrame: 1, missedByFrames: 0 });
  h.reply(h.nodes[0].port, epoch + 1, 'started', { firstContextFrame: 1, missedByFrames: 0 });
  assert.equal(h.transport.status().state, 'starting');
  h.reply(h.nodes[0].port, epoch, 'started', { firstContextFrame: NaN, missedByFrames: 0 }); await failed;
  assert.equal(h.gains[0].gain.value, 0);
});

test('postMessage failure rejects operation and cancels sibling waits without leaks', async () => {
  const h = harness({ throwPost: 'prepare' }); await assert.rejects(h.transport.prepare(h.raw()), /Cannot post prepare/);
  assert.equal(h.timers.size, 0); assert.equal(h.workers[0].terminated, 1); assert.equal(h.context.closeCalls, 0);
});

test('invalid calls do not replace valid playback and diagnostic exceptions cannot break cleanup', async () => {
  const h = harness({ onDiagnostic() { throw new Error('Observer'); } }); await h.start(); const before = h.transport.status();
  await assert.rejects(h.transport.start({ entry: 'invalid' }), TypeError);
  for (const when of [-1, NaN, Infinity, 1e20]) await assert.rejects(h.transport.start({ entry: 'music', when }), RangeError);
  await assert.rejects(h.transport.resume(), { name: 'InvalidStateError' });
  assert.deepEqual(h.transport.status(), before); h.transport.dispose(); assert.equal(h.workers[0].terminated, 1);
});
