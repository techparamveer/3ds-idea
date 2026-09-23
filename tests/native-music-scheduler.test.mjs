import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Worker } from 'node:worker_threads';
import { createTaskScheduler } from '../src/os/native-home-audio/task-scheduler.ts';
import { MusicSynthesisController } from '../src/os/native-home-audio/synthesis-controller.ts';
import { decodeNativeHomeMusicResources } from '../src/os/native-home-audio/resources.ts';
import { createNativeHomeMusic } from '../src/os/native-home-audio/engine.ts';
import { createContinuousMusicResampler } from '../src/os/native-home-audio/continuous-resampler.ts';
import { stamp } from '../src/os/native-home-audio/transport-protocol.ts';

function channelFixture() {
  const posted = [];
  const channel = {
    port1: { onmessage: null, starts: 0, closes: 0, start() { this.starts++; }, close() { this.closes++; } },
    port2: { closes: 0, postMessage(handle) { posted.push(handle); }, close() { this.closes++; } },
  };
  const scheduler = createTaskScheduler(channel), deliver = channel.port1.onmessage;
  return { channel, scheduler, posted, deliver: handle => deliver({ data: handle }) };
}

test('each channel event runs one task; cancellation removes callbacks even after posting', () => {
  const f = channelFixture(), calls = [];
  const cancelled = f.scheduler.schedule(() => calls.push('cancelled'));
  const first = f.scheduler.schedule(() => { calls.push('first'); f.scheduler.schedule(() => calls.push('next')); });
  f.scheduler.cancel(cancelled); assert.deepEqual(calls, []);
  f.deliver(cancelled); f.deliver(first); assert.deepEqual(calls, ['first']);
  assert.equal(f.posted.length, 3); assert.equal(new Set(f.posted).size, 3);
  f.deliver(first); f.deliver(f.posted[2]); f.deliver('invalid');
  assert.deepEqual(calls, ['first', 'next']); assert.equal(f.channel.port1.starts, 1);
  f.scheduler.dispose();
});

test('dispose closes both ports once, drops queued callbacks and rejects further scheduling', () => {
  const f = channelFixture(); let calls = 0;
  const task = f.scheduler.schedule(() => calls++);
  f.scheduler.dispose(); f.deliver(task); f.scheduler.cancel(task); f.scheduler.dispose();
  assert.equal(calls, 0); assert.equal(f.channel.port1.onmessage, null);
  assert.equal(f.channel.port1.closes, 1); assert.equal(f.channel.port2.closes, 1);
  assert.throws(() => f.scheduler.schedule(() => {}), /disposed/);
});

test('posting and task errors propagate and cannot leave a callable orphan', () => {
  const f = channelFixture(); let calls = 0, failedHandle;
  f.channel.port2.postMessage = handle => { failedHandle = handle; throw new Error('post failed'); };
  assert.throws(() => f.scheduler.schedule(() => calls++), /post failed/);
  f.deliver(failedHandle); assert.equal(calls, 0);
  f.channel.port2.postMessage = handle => f.posted.push(handle);
  const task = f.scheduler.schedule(() => { calls++; throw new Error('task failed'); });
  assert.throws(() => f.deliver(task), /task failed/); f.deliver(task); assert.equal(calls, 1);
  f.scheduler.dispose();
});

test('native MessageChannel runs asynchronously and permits microtasks between chained tasks', { timeout: 5000 }, async () => {
  const scheduler = createTaskScheduler(), order = [];
  try {
    const completed = new Promise(resolve => {
      const cancelled = scheduler.schedule(() => order.push('cancelled')); scheduler.cancel(cancelled);
      scheduler.schedule(() => {
        order.push('task1'); queueMicrotask(() => order.push('microtask'));
        scheduler.schedule(() => { order.push('task2'); resolve(); });
      });
    });
    assert.deepEqual(order, []); await completed;
    assert.deepEqual(order, ['task1', 'microtask', 'task2']);
  } finally { scheduler.dispose(); }
});

test('worker entry reports source errors and exits on dispose without a leaked scheduling channel', { timeout: 5000 }, async t => {
  const entry = new URL('../src/os/native-home-audio/music-synthesis.worker.ts', import.meta.url).href;
  const source = `import {parentPort} from 'node:worker_threads';
globalThis.postMessage = value => parentPort.postMessage(value);
globalThis.close = () => parentPort.close();
parentPort.on('message', data => globalThis.onmessage?.({data}));
await import(${JSON.stringify(entry)});
parentPort.postMessage({type:'ready'});`;
  const worker = new Worker(new URL('data:text/javascript,' + encodeURIComponent(source)));
  t.after(() => worker.terminate());
  assert.equal((await once(worker, 'message'))[0].type, 'ready');
  const error = once(worker, 'message'); worker.postMessage({ ...stamp(0), version: 99, type: 'status' });
  assert.deepEqual((await error)[0], { ...stamp(0), type: 'error', source: 'worker', error: 'Error: Invalid music worker protocol' });
  const disposed = once(worker, 'message'), exited = once(worker, 'exit');
  worker.postMessage({ ...stamp(1), type: 'dispose' });
  assert.equal((await disposed)[0].type, 'disposed'); assert.equal((await exited)[0], 0);
});

test('an uncaught task error is visible as a real worker error', { timeout: 5000 }, async t => {
  const entry = new URL('../src/os/native-home-audio/task-scheduler.ts', import.meta.url).href;
  const source = `import {createTaskScheduler} from ${JSON.stringify(entry)};
createTaskScheduler().schedule(() => { throw new Error('visible task failure'); });`;
  const worker = new Worker(new URL('data:text/javascript,' + encodeURIComponent(source)));
  t.after(() => worker.terminate());
  const [error] = await once(worker, 'error'); assert.match(error.message, /visible task failure/);
});

// The decoder intentionally accepts only audited private resources. Keep those bytes out of tests/git.
const packPath = process.env.NATIVE_MUSIC_TEST_PACK;
async function synthesisFixture() {
  const manifest = JSON.parse(await fs.readFile(path.join(packPath, 'music.json'), 'utf8'));
  const files = new Map(await Promise.all(Object.keys(manifest.resources).map(async name => [name, new Uint8Array(await fs.readFile(path.join(packPath, name)))])));
  const resources = await decodeNativeHomeMusicResources(manifest, files);
  const events = [], output = [], tasks = new Map(), callbacks = []; let next = 0, now = 0, chunkMs = 0;
  const scheduler = {
    schedule(run) { const handle = ++next; tasks.set(handle, run); callbacks.push(run); return handle; },
    cancel(handle) { tasks.delete(handle); },
  };
  const port = { onmessage: null, postMessage(message) { output.push(message); if (message.type === 'pcm') now += chunkMs; }, close() { this.closed = true; } };
  const controller = new MusicSynthesisController(message => events.push(message), scheduler, async () => resources, () => now);
  await controller.control({ ...stamp(0), type: 'attach', port });
  await controller.control({ ...stamp(1), type: 'prepare', manifest: {}, files: [] });
  await controller.control({ ...stamp(2), type: 'start', entry: 'music', outputRate: 48000 });
  const credit = (creditEnd, epoch = 2) => port.onmessage({ data: { ...stamp(epoch), type: 'credit', creditEnd } });
  return { controller, port, scheduler, resources, events, output, tasks, callbacks, credit,
    setTime(value) { now = value; },
    run(at, duration) { now = at; chunkMs = duration; const [handle, run] = tasks.entries().next().value; tasks.delete(handle); run(); },
  };
}

test('chunk counters measure queue delay and work separately, preserve exact PCM and reset per stream', { skip: !packPath }, async () => {
  const f = await synthesisFixture(); f.credit(4096); assert.equal(f.tasks.size, 1);
  f.run(12, 7); assert.equal(f.output.filter(m => m.type === 'pcm').length, 1); assert.equal(f.tasks.size, 1);
  f.run(44, 3); assert.equal(f.output.filter(m => m.type === 'pcm').length, 2);
  let status = f.controller.status();
  assert.equal(status.maxScheduleDelayMs, 25); assert.equal(status.maxChunkMs, 7); assert.equal(status.chunksProcessed, 2);
  assert.equal(status.outputProduced, 2048); assert.equal(f.events.some(m => m.type === 'status'), false);
  await f.controller.control({ ...stamp(2), type: 'status' });
  assert.deepEqual(f.events.at(-1), { ...stamp(2), type: 'status', source: 'worker', ...status });
  const stale = f.callbacks.at(-1);
  await f.controller.control({ ...stamp(2), type: 'pause' }); assert.equal(f.tasks.size, 0);
  f.setTime(99); stale(); assert.equal(f.controller.status().chunksProcessed, 2);
  assert.equal(f.controller.status().maxScheduleDelayMs, 25);
  f.setTime(100); await f.controller.control({ ...stamp(2), type: 'resume' }); f.run(103, 2);
  assert.equal(f.controller.status().chunksProcessed, 3); assert.equal(f.controller.status().maxChunkMs, 7);
  const engine = createNativeHomeMusic(f.resources, 'music'), resampler = createContinuousMusicResampler(48000);
  for (const message of f.output.filter(m => m.type === 'pcm')) {
    const expected = new Float32Array(2048); let written = 0;
    while (written < 1024) { written += resampler.readInto(expected, written).frames; if (written < 1024) resampler.push(engine.renderFrame()); }
    assert.deepEqual(new Float32Array(message.buffer), expected);
  }
  const oldTask = f.callbacks.at(-1);
  await f.controller.control({ ...stamp(3), type: 'stop' }); oldTask();
  status = f.controller.status(); assert.equal(status.maxScheduleDelayMs, 0); assert.equal(status.maxChunkMs, 0); assert.equal(status.chunksProcessed, 0);
  await f.controller.control({ ...stamp(4), type: 'start', entry: 'music-resume', outputRate: 48000 });
  f.credit(2048, 4); f.run(109, 1); assert.equal(f.controller.status().chunksProcessed, 1);
  const pending = f.callbacks.at(-1), count = f.output.length;
  await f.controller.control({ ...stamp(5), type: 'dispose' }); pending();
  assert.equal(f.output.length, count); assert.equal(f.tasks.size, 0); assert.equal(f.port.closed, true);
});

test('scheduler posting and chunk delivery failures remain visible worker source errors', { skip: !packPath }, async () => {
  for (const mode of ['schedule', 'delivery']) {
    const f = await synthesisFixture();
    if (mode === 'schedule') f.scheduler.schedule = () => { throw new Error('scheduling failed'); };
    else f.port.postMessage = () => { throw new Error('delivery failed'); };
    f.credit(2048); if (mode === 'delivery') f.run(1, 1);
    assert.equal(f.controller.status().state, 'failed'); assert.equal(f.tasks.size, 0);
    assert.equal(f.events.at(-1).source, 'worker'); assert.equal(f.events.at(-1).type, 'error');
    assert.match(f.events.at(-1).error, /failed/);
    await f.controller.control({ ...stamp(3), type: 'dispose' });
  }
});
