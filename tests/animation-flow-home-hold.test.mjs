import assert from 'node:assert/strict';
import test from 'node:test';
import { createContext, runInContext } from 'node:vm';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { attemptPauseHomeHold, collectAnimationFrames, holdPauseHome, parsePauseHomeHold, validatePauseHomeHold, writeInitialCapture } from '../scripts/verify-animation-flow.mjs';

function browserFixture({ releaseLatencyMs = 0, setupLatencyMs = 0, paintChanges = true, waitFailure = false, suppressDown = false,
  focusFailure = false, targetFailure = false, observerFailure = false } = {}) {
  let now = 100, paint = 0, raf = [], held = false;
  const listeners = new Map(), canvas = { tagName: 'CANVAS', id: 'lcd' };
  const host = { tagName: 'DIV', id: 'console', contains: target => target === host || target === canvas,
    dataset: { menu: 'app', app: 'health-safety', nativeScreen: 'ready',
      screenPaint: '0', screenPresented: JSON.stringify({ paint: 0, validPublication: true }),
      targets: JSON.stringify({ Button_HOME: [300, 200] }) },
    screenCanvases: { top: { toDataURL: () => 'top-pair' }, bottom: { toDataURL: () => 'bottom-pair' } } };
  const window = {
    addEventListener(type, handler) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(handler); },
    removeEventListener(type, handler) { listeners.get(type)?.delete(handler); },
  };
  const context = createContext({ window, document: { querySelector: () => host },
    performance: { now: () => now }, Date: { now: () => 1000000 + now },
    requestAnimationFrame: callback => raf.push(callback) });
  const evaluate = async (fn, argument) => {
    context.argument = argument;
    const result = runInContext(`(${fn.toString()})(argument)`, context);
    return result === undefined ? undefined : JSON.parse(JSON.stringify(result));
  };
  const event = (type, overrides = {}) => {
    const value = { type, target: type.startsWith('pointer') ? canvas : host, key: 'h', code: 'KeyH',
      button: 0, pointerId: 1, clientX: 300, clientY: 200,
      repeat: false, isTrusted: true, timeStamp: now, ...overrides };
    for (const handler of listeners.get(type) ?? []) handler(value);
  };
  const advance = durationMs => {
    const end = now + durationMs;
    while (now < end) {
      now = Math.min(now + 50, end);
      if (paintChanges) {
        host.dataset.screenPaint = String(++paint);
        host.dataset.screenPresented = JSON.stringify({ paint, validPublication: true });
      }
      const callbacks = raf;
      raf = [];
      for (const callback of callbacks) callback();
    }
  };
  const down = type => {
    held = true;
    host.dataset.menu = 'home';
    if (!suppressDown) event(type);
  };
  const up = type => { advance(releaseLatencyMs); event(type); held = false; };
  const page = { evaluate, viewportSize: () => ({ width: 800, height: 600 }),
    locator: () => ({ focus: async () => {
      if (focusFailure) throw new Error('key focus failed');
      advance(setupLatencyMs);
    }, evaluate: async (fn, value) => {
      if (targetFailure) throw new Error('physical target failed');
      advance(setupLatencyMs); return fn(host, value);
    } }),
    keyboard: { down: async () => down('keydown'), up: async () => up('keyup') },
    mouse: { move: async () => {}, down: async () => down('pointerdown'), up: async () => up('pointerup') },
    waitForTimeout: async durationMs => {
      event('keydown', { key: 'x', code: 'KeyX' });
      event('pointerup', { pointerId: 99 });
      advance(waitFailure ? 150 : durationMs);
      if (waitFailure) throw new Error('hold wait failed');
    } };
  if (observerFailure) page.evaluate = async (fn, value) => {
    if (window.animationCapture) throw new Error('observer setup failed');
    return evaluate(fn, value);
  };
  return { page, host, window, advance, event, held: () => held,
    listenerCount: () => [...listeners.values()].reduce((sum, handlers) => sum + handlers.size, 0) };
}

test('HOME hold is opt-in and rejects unsupported paths or requested intervals at least as long as capture', () => {
  const pause = { scenario: 'pause', activation: 'key', durationMs: 1000 };
  assert.equal(parsePauseHomeHold(undefined, pause), null);
  assert.equal(parsePauseHomeHold('500', pause), 500);
  assert.equal(parsePauseHomeHold('1', pause), 1);
  assert.equal(parsePauseHomeHold('999', { ...pause, activation: 'physical' }), 999);
  for (const value of ['', '0', '-1', '0.5', 'NaN', 'Infinity', '1000', '1001']) {
    assert.throws(() => parsePauseHomeHold(value, pause), /HOME hold must/);
  }
  assert.throws(() => parsePauseHomeHold('500', { ...pause, scenario: 'notes' }), /pause-only/);
  for (const activation of ['touch', 'tile', 'accessible']) {
    assert.throws(() => parsePauseHomeHold('500', { ...pause, activation }), /key or physical/);
  }
});

for (const activation of ['key', 'physical']) {
  test(`${activation} HOME records observed events and captures paired paints while held`, async () => {
    const browser = browserFixture({ releaseLatencyMs: 37 }), inputs = [];
    await browser.page.evaluate(collectAnimationFrames, 1000);
    const input = await holdPauseHome(browser.page, activation, 500, inputs);
    browser.advance(63);
    validatePauseHomeHold(input, 1000, browser.window.animationCapture.frames);
    assert.equal(input.requestedHoldDurationMs, 500);
    assert.equal(input.observedHostDurationMs, 537);
    assert.equal(input.down.performanceNowMs, 100);
    assert.equal(input.up.performanceNowMs, 637);
    assert.equal(input.down.epochMs, 1000100);
    assert.equal(input.up.epochMs, 1000637);
    assert.equal(input.down.atMs, 0);
    assert.equal(input.up.atMs, 537);
    assert.equal(input.collectedFrameCountDuringHold, 11);
    assert.equal(input.collectedPaintCountDuringHold, 11);
    assert.equal(input.nativeHoldDurationMs, null);
    assert.equal(input.nativeSourceEpoch, null);
    assert.equal(input.target, activation === 'physical' ? 'Button_HOME' : '.console-stage');
    assert.equal(input.inputPath, activation === 'physical' ? 'projected-physical-HOME-pointer' : 'console-stage-HOME-keyboard');
    assert.deepEqual(input.point, activation === 'physical' ? [300, 200] : null);
    assert.deepEqual(input.down.target, activation === 'physical' ? { tagName: 'CANVAS', id: 'lcd' } : { tagName: 'DIV', id: 'console' });
    assert.equal(input.down.type, activation === 'physical' ? 'pointerdown' : 'keydown');
    assert.equal(input.up.type, activation === 'physical' ? 'pointerup' : 'keyup');
    assert.equal(input.up.isTrusted, true);
    assert.deepEqual(Array.from(browser.window.animationCapture.frames).filter(frame => frame.homeHoldActive).map(frame => frame.at),
      [50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 537]);
    assert.equal(browser.window.animationCapture.frames.at(-1).homeHoldActive, false);
    assert.equal(browser.window.animationCapture.frames[1].data.app, 'health-safety');
    assert.deepEqual(JSON.parse(browser.window.animationCapture.frames[1].data.screenPresented), { paint: 1, validPublication: true });
    assert.equal(browser.window.animationCapture.frames[1].top, 'top-pair');
    assert.equal(browser.window.animationCapture.frames[1].bottom, 'bottom-pair');
    assert.strictEqual(inputs[0], input);
    assert.equal(browser.held(), false);
    assert.equal(browser.listenerCount(), 0);
  });

  test(`${activation} HOME is released and its actual partial interval retained after a wait failure`, async () => {
    const browser = browserFixture({ waitFailure: true }), inputs = [];
    await browser.page.evaluate(collectAnimationFrames, 1000);
    await assert.rejects(holdPauseHome(browser.page, activation, 500, inputs), /hold wait failed/);
    assert.equal(inputs[0].requestedHoldDurationMs, 500);
    assert.equal(inputs[0].observedHostDurationMs, 150);
    assert.equal(inputs[0].up.performanceNowMs, 250);
    assert.equal(inputs[0].collectedFrameCountDuringHold, 3);
    assert.equal(inputs[0].collectedPaintCountDuringHold, 3);
    assert.deepEqual(Array.from(browser.window.animationCapture.frames).filter(frame => frame.homeHoldActive).map(frame => frame.at), [50, 100, 150]);
    assert.equal(browser.held(), false);
    assert.equal(browser.listenerCount(), 0);
  });
}

test('missing DOM delivery stays unacknowledged and is retained before rejection', async t => {
  const browser = browserFixture({ suppressDown: true }), inputs = [];
  await browser.page.evaluate(collectAnimationFrames, 1000);
  const input = await holdPauseHome(browser.page, 'key', 500, inputs);
  assert.throws(() => validatePauseHomeHold(input, 1000, browser.window.animationCapture.frames), /matching observed host down\/up/);
  assert.equal(inputs[0].requestedHoldDurationMs, 500);
  assert.equal(inputs[0].down, null);
  assert.equal(inputs[0].up, null);
  assert.equal(inputs[0].observedHostDurationMs, null);
  assert.equal(inputs[0].collectedFrameCountDuringHold, null);
  assert.equal(inputs[0].collectedPaintCountDuringHold, null);
  assert.equal(browser.window.animationCapture.frames.length, 11);
  assert.equal(browser.held(), false);
  assert.equal(browser.listenerCount(), 0);
  const dir = await mkdtemp(join(tmpdir(), 'animation-home-hold-missing-event-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const path = join(dir, 'capture.json');
  await assert.rejects(writeInitialCapture(path, { valid: false, durationMs: 1000, pauseHomeHold: input,
    frames: Array.from(browser.window.animationCapture.frames) }), /matching observed host down\/up/);
  const retained = JSON.parse(await readFile(path, 'utf8'));
  assert.equal(retained.valid, false);
  assert.equal(retained.pauseHomeHold.down, null);
  assert.equal(retained.frames.length, 11);
});

for (const activation of ['key', 'physical']) {
  for (const latency of [{ setupLatencyMs: 600 }, { releaseLatencyMs: 600 }]) {
    test(`${activation} ${latency.setupLatencyMs ? 'setup' : 'release'} latency rejects observed window overrun after writing its ledger`, async t => {
      const browser = browserFixture(latency), inputs = [];
      await browser.page.evaluate(collectAnimationFrames, 1000);
      const input = await holdPauseHome(browser.page, activation, parsePauseHomeHold('500',
        { scenario: 'pause', activation, durationMs: 1000 }), inputs);
      assert.equal(input.up.atMs, 1100);
      assert.equal(input.down.atMs, latency.setupLatencyMs ?? 0);
      assert.equal(browser.window.animationCapture.done, true);
      const dir = await mkdtemp(join(tmpdir(), 'animation-home-hold-overrun-'));
      t.after(() => rm(dir, { recursive: true, force: true }));
      const path = join(dir, 'capture.json');
      const result = { valid: false, durationMs: 1000, pauseHomeHold: input,
        frames: Array.from(browser.window.animationCapture.frames) };
      await assert.rejects(writeInitialCapture(path, result), /inside the declared capture window/);
      const retained = JSON.parse(await readFile(path, 'utf8'));
      assert.equal(retained.valid, false);
      assert.equal(retained.pauseHomeHold.up.atMs, 1100);
      assert.equal(retained.pauseHomeHold.requestedHoldDurationMs, 500);
      assert.equal(retained.frames.at(-1).at, 1000);
      assert.equal(retained.frames[0].top, 'top-pair');
      assert.equal(retained.frames[0].bottom, 'bottom-pair');
      assert.equal(browser.held(), false);
      assert.equal(browser.listenerCount(), 0);
    });
  }

  test(`${activation} matching HOME events with no collected paint are rejected after retaining the ledger`, async t => {
    const browser = browserFixture({ paintChanges: false }), inputs = [];
    await browser.page.evaluate(collectAnimationFrames, 1000);
    const input = await holdPauseHome(browser.page, activation, 500, inputs);
    assert.equal(input.down.atMs, 0);
    assert.equal(input.up.atMs, 500);
    assert.equal(input.collectedFrameCountDuringHold, 0);
    assert.equal(input.collectedPaintCountDuringHold, 0);
    const dir = await mkdtemp(join(tmpdir(), 'animation-home-hold-no-paint-'));
    t.after(() => rm(dir, { recursive: true, force: true }));
    const path = join(dir, 'capture.json');
    await assert.rejects(writeInitialCapture(path, { valid: false, durationMs: 1000, pauseHomeHold: input,
      frames: Array.from(browser.window.animationCapture.frames) }), /positive captured frame and distinct-paint counts/);
    const retained = JSON.parse(await readFile(path, 'utf8'));
    assert.equal(retained.valid, false);
    assert.equal(retained.pauseHomeHold.collectedPaintCountDuringHold, 0);
    assert.equal(retained.frames.length, 1);
    assert.equal(browser.held(), false);
    assert.equal(browser.listenerCount(), 0);
  });
}

test('HOME count inconsistencies and negative observed starts are rejected from retained frames', async () => {
  const browser = browserFixture(), inputs = [];
  await browser.page.evaluate(collectAnimationFrames, 1000);
  const input = await holdPauseHome(browser.page, 'key', 500, inputs);
  const frames = browser.window.animationCapture.frames;
  assert.throws(() => validatePauseHomeHold({ ...input, down: { ...input.down, atMs: -1 } }, 1000, frames), /inside the declared capture window/);
  assert.throws(() => validatePauseHomeHold({ ...input, collectedFrameCountDuringHold: 9 }, 1000, frames), /positive captured/);
  assert.throws(() => validatePauseHomeHold({ ...input, collectedFrameCountDuringHold: 11 }, 1000, frames), /held-frame count matches/);
  assert.throws(() => validatePauseHomeHold({ ...input, collectedPaintCountDuringHold: 9 }, 1000, frames), /held-paint count matches/);
});

for (const [activation, failure, message] of [
  ['key', { focusFailure: true }, 'key focus failed'],
  ['physical', { targetFailure: true }, 'physical target failed'],
]) {
  test(`${activation} pre-push failure never labels an earlier launch or Resume as a HOME hold`, async t => {
    const browser = browserFixture(failure), prior = { kind: 'key', value: 'Enter', at: 10 }, inputs = [prior];
    await browser.page.evaluate(collectAnimationFrames, 1000);
    const attempt = await attemptPauseHomeHold(browser.page, activation, 500, inputs);
    browser.advance(200);
    assert.equal(attempt.pauseHomeHold, null);
    assert.equal(attempt.pauseHomeHoldFailure, `Error: ${message}`);
    assert.deepEqual(inputs, [prior]);
    const dir = await mkdtemp(join(tmpdir(), 'animation-home-hold-pre-push-'));
    t.after(() => rm(dir, { recursive: true, force: true }));
    const path = join(dir, 'capture.json');
    await assert.rejects(writeInitialCapture(path, { valid: false, durationMs: 1000,
      ...(attempt.pauseHomeHold ? { pauseHomeHold: attempt.pauseHomeHold } : {}), pauseHomeHoldFailure: attempt.pauseHomeHoldFailure,
      inputs, cycleInputs: inputs.slice(), frames: Array.from(browser.window.animationCapture.frames) }), new RegExp(message));
    const retained = JSON.parse(await readFile(path, 'utf8'));
    assert.equal(retained.valid, false);
    assert.equal(Object.hasOwn(retained, 'pauseHomeHold'), false);
    assert.equal(retained.pauseHomeHoldFailure, `Error: ${message}`);
    assert.deepEqual(retained.inputs, [prior]);
    assert.deepEqual(retained.cycleInputs, [prior]);
    assert.equal(retained.frames.length, 5);
    assert.equal(browser.held(), false);
    assert.equal(browser.listenerCount(), 0);
  });
}

test('observer setup failure retains only the new requested HOME input without invented observed events', async t => {
  const browser = browserFixture({ observerFailure: true }), prior = { kind: 'key', value: 'Enter', at: 10 }, inputs = [prior];
  await browser.page.evaluate(collectAnimationFrames, 1000);
  const attempt = await attemptPauseHomeHold(browser.page, 'key', 500, inputs);
  assert.equal(attempt.pauseHomeHoldFailure, 'Error: observer setup failed');
  assert.strictEqual(attempt.pauseHomeHold, inputs[1]);
  assert.equal(attempt.pauseHomeHold.value, 'h');
  assert.equal(attempt.pauseHomeHold.requestedHoldDurationMs, 500);
  assert.equal(attempt.pauseHomeHold.down, null);
  assert.equal(attempt.pauseHomeHold.up, null);
  assert.equal(attempt.pauseHomeHold.observedHostDurationMs, null);
  const dir = await mkdtemp(join(tmpdir(), 'animation-home-hold-observer-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const path = join(dir, 'capture.json');
  await assert.rejects(writeInitialCapture(path, { valid: false, durationMs: 1000, ...attempt,
    inputs, frames: Array.from(browser.window.animationCapture.frames) }), /observer setup failed/);
  const retained = JSON.parse(await readFile(path, 'utf8'));
  assert.equal(retained.valid, false);
  assert.equal(retained.pauseHomeHold.value, 'h');
  assert.equal(retained.pauseHomeHold.down, null);
  assert.deepEqual(retained.inputs[0], prior);
  assert.equal(browser.held(), false);
  assert.equal(browser.listenerCount(), 0);
});

test('ordinary capture keeps its original frame shape when no HOME hold was requested', async () => {
  const browser = browserFixture();
  await browser.page.evaluate(collectAnimationFrames, 1000);
  browser.advance(100);
  const frames = Array.from(browser.window.animationCapture.frames);
  assert.deepEqual(frames.map(frame => frame.at), [0, 50, 100]);
  assert.deepEqual(Object.keys(frames[0]), ['at', 'data', 'top', 'bottom']);
  assert.deepEqual(Object.keys(frames[1]), ['at', 'data', 'top', 'bottom']);
  assert.deepEqual(JSON.parse(frames[1].data.screenPresented), { paint: 1, validPublication: true });
  assert.equal(frames[1].data.app, 'health-safety');
});

test('repeat holds use a fresh capture and independent event intervals', async () => {
  const browser = browserFixture(), inputs = [];
  await browser.page.evaluate(collectAnimationFrames, 1000);
  await holdPauseHome(browser.page, 'key', 500, inputs);
  browser.advance(500);
  await browser.page.evaluate(collectAnimationFrames, 1000);
  await holdPauseHome(browser.page, 'physical', 200, inputs);
  assert.deepEqual(inputs.map(input => [input.down.performanceNowMs, input.up.performanceNowMs, input.observedHostDurationMs]),
    [[100, 600, 500], [1100, 1300, 200]]);
  assert.equal(browser.window.animationCapture.start, 1100);
  assert.deepEqual(Array.from(browser.window.animationCapture.frames).map(frame => frame.at), [0, 50, 100, 150, 200]);
  assert.equal(browser.listenerCount(), 0);
});
