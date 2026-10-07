import assert from 'node:assert/strict';
import test from 'node:test';
import { createContext, runInContext } from 'node:vm';
import { collectAnimationFrames, holdPauseHome, parsePauseHomeHold } from '../scripts/verify-animation-flow.mjs';

function browserFixture({ releaseLatencyMs = 0, waitFailure = false, suppressDown = false } = {}) {
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
      host.dataset.screenPaint = String(++paint);
      host.dataset.screenPresented = JSON.stringify({ paint, validPublication: true });
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
    locator: () => ({ focus: async () => {}, evaluate: async (fn, value) => fn(host, value) }),
    keyboard: { down: async () => down('keydown'), up: async () => up('keyup') },
    mouse: { move: async () => {}, down: async () => down('pointerdown'), up: async () => up('pointerup') },
    waitForTimeout: async durationMs => {
      event('keydown', { key: 'x', code: 'KeyX' });
      event('pointerup', { pointerId: 99 });
      advance(waitFailure ? 150 : durationMs);
      if (waitFailure) throw new Error('hold wait failed');
    } };
  return { page, host, window, advance, event, held: () => held,
    listenerCount: () => [...listeners.values()].reduce((sum, handlers) => sum + handlers.size, 0) };
}

test('HOME hold is opt-in and rejects unsupported paths or release outside the capture window', () => {
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

test('missing DOM delivery fails without synthesizing a down, up or measured interval', async () => {
  const browser = browserFixture({ suppressDown: true }), inputs = [];
  await browser.page.evaluate(collectAnimationFrames, 1000);
  await assert.rejects(holdPauseHome(browser.page, 'key', 500, inputs), /matching observed host down\/up/);
  assert.equal(inputs[0].requestedHoldDurationMs, 500);
  assert.equal(inputs[0].down, null);
  assert.equal(inputs[0].up, null);
  assert.equal(inputs[0].observedHostDurationMs, null);
  assert.equal(inputs[0].collectedFrameCountDuringHold, null);
  assert.equal(inputs[0].collectedPaintCountDuringHold, null);
  assert.equal(browser.window.animationCapture.frames.length, 11);
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
