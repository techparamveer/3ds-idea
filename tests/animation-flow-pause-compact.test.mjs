import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createContext, runInContext } from 'node:vm';
import sharp from 'sharp';
import { parsePauseCompact, pauseCompactEvidence, pauseCompactRestoreReady, pauseCompactSelectionChanged,
  collectAnimationFrames, observePauseCompactArrowRight, restorePauseCompactSelection, selectPauseCompact,
  validatePauseCompactArrowRight, validatePauseCompactDestination, writeInitialCapture } from '../scripts/verify-animation-flow.mjs';
import { createPortfolioState, dispatchSystemEvent, launchHomeShortcut, tickSystem } from '../src/os/system.ts';
import { selectHomeSlot, settleHomeNavigation } from '../src/os/home-navigation.ts';
import { retainedSuspendedApplication, selectedSuspendedApplication } from '../src/os/home-suspended-window.ts';

const selection = { app: 'health-safety', originalSelected: '8', compactSelected: '10' };
function data(selected = '10', pauseFrame = 2) {
  const cursor = { selectedSlot: Number(selected), focus: { toolbarActive: false } };
  const paint = { at: 100, phase: 'home', cursor, entryMotion: { folder: null, pauseFrame } };
  return { menu: 'home', app: 'health-safety', selected, rows: '2', homeCursor: JSON.stringify(cursor),
    dialog: '', sleeping: 'false', nativeScreen: 'ready', nativeScreenFailure: '', screenPaint: JSON.stringify(paint),
    screenPresented: JSON.stringify({ frame: 1, validPublication: true, paint }) };
}
async function withData(dataset, run) {
  const saved = Object.getOwnPropertyDescriptor(globalThis, 'document');
  globalThis.document = { querySelector: () => ({ dataset }) };
  try { return await run(); } finally { if (saved) Object.defineProperty(globalThis, 'document', saved); else delete globalThis.document; }
}

function tapFixture() {
  let now = 100, raf = null;
  const listeners = new Map(), host = { id: 'console', tagName: 'DIV', dataset: data(),
    contains: target => target === host, screenCanvases: { top: { toDataURL: () => 'raw-top' }, bottom: { toDataURL: () => 'raw-bottom' } } };
  const window = {
    addEventListener(type, callback) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(callback); },
    removeEventListener(type, callback) { listeners.get(type)?.delete(callback); },
  };
  const context = createContext({ window, document: { querySelector: () => host }, performance: { now: () => now },
    Date: { now: () => 1000000 + now }, requestAnimationFrame: callback => raf = callback });
  const page = { evaluate: async (fn, argument) => {
    context.argument = argument;
    const value = runInContext(`(${fn.toString()})(argument)`, context);
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  } };
  const event = (type, at, overrides = {}) => {
    now = at;
    const value = { type, key: 'ArrowRight', code: 'ArrowRight', repeat: false, isTrusted: true, target: host, timeStamp: now, ...overrides };
    for (const callback of listeners.get(type) ?? []) callback(value);
  };
  const sample = at => {
    now = at;
    const paint = JSON.parse(host.dataset.screenPaint); paint.at = at;
    host.dataset.screenPaint = JSON.stringify(paint); host.dataset.screenPresented = JSON.stringify({ validPublication: true, paint });
    raf();
  };
  return { page, host, window, event, sample, listenerCount: () => [...listeners.values()].reduce((count, values) => count + values.size, 0) };
}

function compactFailureBrowser(failure, rawPngs) {
  const fixture = tapFixture(), { page, host } = fixture;
  const trace = [], evaluate = page.evaluate;
  page.evaluate = async (fn, argument) => { trace.push('evaluate'); return evaluate(fn, argument); };
  for (const method of ['addEventListener', 'removeEventListener']) {
    const original = fixture.window[method];
    fixture.window[method] = (...args) => { trace.push(`${method}:${args[0]}`); return original(...args); };
  }
  let waitingForCompact = false;
  host.dataset = data('8');
  host.querySelector = () => ({ textContent: 'Health and Safety Information' });
  for (const screen of ['top', 'bottom']) host.screenCanvases[screen].toDataURL = () => rawPngs[screen];
  page.emulateMedia = page.goto = page.waitForSelector = page.waitForTimeout = async () => {};
  page.on = () => {};
  page.viewportSize = () => ({ width: 1440, height: 1000 });
  page.locator = () => ({ focus: async () => { trace.push('focus'); },
    evaluate: async (fn, argument) => { trace.push('state'); return fn(host, argument); } });
  page.screenshot = ({ path }) => writeFile(path, JSON.stringify({ trace, listeners: fixture.listenerCount() }));
  page.keyboard = { press: async key => {
    trace.push(`key:${key}`);
    if (key === 'Enter') host.dataset.menu = 'app';
    else if (key === 'h') {
      host.dataset.menu = failure === 'not-home' ? 'app' : 'home';
      if (failure === 'wrong-owner') host.dataset.app = 'camera';
      if (failure === 'wrong-slot') host.dataset.selected = '10';
      if (failure === 'toolbar') host.dataset.homeCursor = JSON.stringify({ focus: { toolbarActive: true } });
      fixture.sample(105);
    }
    else if (key === 'ArrowRight' && fixture.window.animationCapture) {
      waitingForCompact = true;
      fixture.event('keydown', 110); fixture.sample(111);
      fixture.event('keyup', 117); fixture.sample(118);
    }
  } };
  page.waitForFunction = async fn => {
    if (fn.name === 'pauseCapturePrecondition') return { jsonValue: async () => ({ frame: 1 }), dispose: async () => {} };
    if (fn.name === 'pauseCompactSelectionChanged') {
      assert.equal(waitingForCompact, true);
      if (failure === 'timeout') throw new Error('Compact selection wait timed out');
      host.dataset = data('10');
      assert.equal(await page.evaluate(fn, { app: 'health-safety', selected: '10' }), true);
      host.dataset = data('12');
      return;
    }
    if (fixture.window.animationCapture) {
      if (!waitingForCompact) fixture.sample(118);
      fixture.sample(1100);
      assert.equal(fixture.window.animationCapture.done, true);
    }
  };
  return { chromium: { launch: async () => ({ newPage: async () => page, close: async () => {} }) } };
}

for (const failure of ['timeout', 'drift', 'not-home', 'wrong-owner', 'wrong-slot', 'toolbar', 'normal']) {
  test(`${failure} CLI preserves compact sequencing, failure artifacts and normal no-flag behavior`, async t => {
    const dir = await mkdtemp(join(tmpdir(), 'pause-compact-selection-failure-'));
    t.after(() => rm(dir, { recursive: true, force: true }));
    const rawPngs = {};
    for (const [screen, width] of [['top', 400], ['bottom', 320]]) {
      const bytes = await sharp({ create: { width, height: 240, channels: 3, background: '#123456' } }).png().toBuffer();
      rawPngs[screen] = `data:image/png;base64,${bytes.toString('base64')}`;
    }
    const module = join(dir, 'mock-playwright.mjs'), output = join(dir, 'capture');
    await writeFile(module, `import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { createContext, runInContext } from 'node:vm';
${data.toString()}
${tapFixture.toString()}
${compactFailureBrowser.toString()}
export const { chromium } = compactFailureBrowser(${JSON.stringify(failure)}, ${JSON.stringify(rawPngs)});
`);
    const result = spawnSync(process.execPath, [new URL('../scripts/verify-animation-flow.mjs', import.meta.url).pathname,
      '--playwright-module', module, '--browser-executable', join(dir, 'unused-browser'),
      '--output', output, '--commit', '0'.repeat(40), '--scenario', 'pause', '--activation', 'key',
      ...(failure === 'normal' ? [] : ['--pause-compact']), '--duration-ms', '1000'], { encoding: 'utf8' });
    assert.equal(result.status, failure === 'normal' ? 0 : 1, result.stderr);
    const expected = { timeout: /Compact selection wait timed out/, drift: /ArrowRight selects the adjacent column/,
      'not-home': /ArrowRight follows actual HOME/, 'wrong-owner': /Requested application is retained before ArrowRight/,
      'wrong-slot': /HOME begins with the retained application selected/, toolbar: /HOME begins on the grid/ }[failure];
    if (expected) assert.match(result.stderr, expected);
    const retained = JSON.parse(await readFile(join(output, 'capture.json'), 'utf8'));
    assert.equal(retained.valid, failure === 'normal');
    const consoleCapture = JSON.parse(await readFile(join(output, 'console.png'), 'utf8'));
    const homeIndex = consoleCapture.trace.indexOf('key:h');
    assert.equal(consoleCapture.listeners, 0);
    if (failure === 'normal') {
      assert.equal(Object.hasOwn(retained, 'compactSelection'), false);
      assert.equal(Object.hasOwn(retained, 'pauseCompact'), false);
      assert.deepEqual(retained.cycleInputs.map(input => input.value), ['h']);
      assert.deepEqual(consoleCapture.trace.slice(homeIndex - 2, homeIndex), ['evaluate', 'focus']);
      assert.equal(consoleCapture.trace.some(entry => entry.startsWith('addEventListener:')), false);
    } else {
      assert.match(retained.compactSelection.adaptation, /Collector-latency adaptation/);
      assert.match(retained.compactSelection.adaptation, /not a recovered native input epoch/);
      assert.deepEqual(consoleCapture.trace.slice(homeIndex - 5, homeIndex),
        ['focus', 'evaluate', 'evaluate', 'addEventListener:keydown', 'addEventListener:keyup']);
      assert.equal(retained.after.selected, retained.compactSelection.afterSelection.selected);
      if (failure === 'timeout' || failure === 'drift') {
        assert.match(retained.compactSelection.selectionFailure, expected);
        assert.equal(retained.compactSelection.homeBeforeSelection.selected, '8');
        assert.equal(retained.compactSelection.afterSelection.selected, failure === 'timeout' ? '8' : '12');
        assert.equal(retained.compactSelection.arrowRightTap.failure, null);
        validatePauseCompactArrowRight(retained.compactSelection.arrowRightTap.observation, 1000);
        assert.deepEqual(retained.compactSelection.arrowRightTap.observation.events.map(event => event.atMs), [10, 17]);
        assert.deepEqual(retained.cycleInputs.map(input => input.value), ['h', 'ArrowRight']);
        assert.deepEqual(consoleCapture.trace.slice(homeIndex, homeIndex + 3), ['key:h', 'state', 'key:ArrowRight']);
        assert.deepEqual(retained.frames.map(frame => frame.at), [0, 5, 11, 18, 1000]);
        assert.equal(retained.frames[2].compactArrowRightActive, true);
        assert.equal(retained.frames[3].compactArrowRightEventCount, 2);
      } else {
        assert.match(retained.compactSelection.arrowRightTap.failure, expected);
        assert.deepEqual(retained.compactSelection.arrowRightTap.observation.events, []);
        assert.equal(retained.compactSelection.arrowRightTap.observation.down, null);
        assert.equal(retained.compactSelection.arrowRightTap.observation.up, null);
        assert.equal(retained.compactSelection.compactSelected, null);
        assert.deepEqual(retained.cycleInputs.map(input => input.value), ['h']);
        assert.deepEqual(retained.compactSelection.homeBeforeSelection, retained.compactSelection.afterSelection);
        assert.deepEqual(retained.frames.map(frame => frame.at), [0, 5, 18, 1000]);
      }
    }
    for (const frame of retained.frames) for (const screen of ['top', 'bottom']) {
      const bytes = await readFile(join(output, frame.files[screen].filename));
      assert.deepEqual(bytes, Buffer.from(rawPngs[screen].split(',')[1], 'base64'));
      assert.equal(frame.files[screen].sha256, createHash('sha256').update(bytes).digest('hex'));
    }
    if (expected) {
      const failed = JSON.parse(await readFile(join(output, 'failure.json'), 'utf8'));
      assert.match(failed.error, expected);
      assert.deepEqual(failed.inputs, retained.inputs);
    } else assert.equal(existsSync(join(output, 'failure.json')), false);
    assert.equal(existsSync(join(output, 'repeat-1-capture.json')), false);
  });
}

test('compact pause is opt-in and limited to ordinary key or physical HOME', async () => {
  for (const value of [undefined, false]) {
    assert.equal(parsePauseCompact(value, { scenario: 'notes', activation: 'touch' }), false);
    assert.equal(await selectPauseCompact(value, 'health-safety', '8', {
      key: () => assert.fail('Normal pause has no added input'), state: () => assert.fail('Normal pause has no added snapshot'),
      waitForSelection: () => assert.fail('Normal pause has no added wait') }), null);
  }
  for (const activation of ['key', 'physical']) assert.equal(parsePauseCompact(true, { scenario: 'pause', activation }), true);
  assert.equal(parsePauseCompact(false, { scenario: 'pause', activation: 'key', homeHoldMs: 500 }), false, 'Normal HOME hold remains supported');
  for (const activation of ['key', 'physical']) assert.throws(() => parsePauseCompact(true,
    { scenario: 'pause', activation, homeHoldMs: 500 }), /cannot be combined with --home-hold-ms/);
  for (const scenario of ['notes', 'manual', 'folder']) assert.throws(() => parsePauseCompact(true, { scenario, activation: 'key' }), /pause-only/);
  for (const activation of ['touch', 'tile', 'accessible']) assert.throws(() => parsePauseCompact(true, { scenario: 'pause', activation }), /key or physical HOME/);
  for (const value of ['true', 1, null]) assert.throws(() => parsePauseCompact(value, { scenario: 'pause', activation: 'key' }), /boolean flag/);
});

test('CLI rejects compact plus held HOME before creating output or loading a browser module', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'pause-compact-options-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const output = join(dir, 'capture');
  const result = spawnSync(process.execPath, [new URL('../scripts/verify-animation-flow.mjs', import.meta.url).pathname,
    '--playwright-module', join(dir, 'absent-module.mjs'), '--browser-executable', join(dir, 'absent-browser'),
    '--output', output, '--commit', '0'.repeat(40), '--scenario', 'pause', '--activation', 'key',
    '--pause-compact', '--home-hold-ms', '500'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Compact pause cannot be combined with --home-hold-ms/);
  assert.equal(existsSync(output), false);
});

test('compact collector includes actual overlay state while normal collection retains its original metadata shape', () => {
  const host = { dataset: data(), screenCanvases: { top: { toDataURL: () => 'raw-top' }, bottom: { toDataURL: () => 'raw-bottom' } } };
  const collect = argument => {
    const window = {}, context = createContext({ window, document: { querySelector: () => host }, performance: { now: () => 0 }, requestAnimationFrame: () => {} });
    context.argument = argument;
    runInContext(`(${collectAnimationFrames.toString()})(argument)`, context);
    return JSON.parse(JSON.stringify(window.animationCapture.frames[0]));
  };
  const normal = collect(1000), compact = collect({ durationMs: 1000, pauseCompact: true });
  assert.equal(compact.data.dialog, '');
  assert.equal(compact.data.sleeping, 'false');
  assert.equal(Object.hasOwn(normal.data, 'dialog'), false);
  assert.equal(Object.hasOwn(normal.data, 'sleeping'), false);
  const { dialog, sleeping, ...sameData } = compact.data;
  assert.deepEqual(sameData, normal.data);
  assert.equal(compact.top, 'raw-top');
  assert.equal(compact.bottom, 'raw-bottom');
});

for (const [app, slot] of [['health-safety', 8], ['camera', 10], ['sound', 7], ['work', 0]]) {
  test(`${app} ordinary HOME and ArrowRight retain the owner while selecting compact, and ArrowLeft restores repeat Resume`, async () => {
    let state = settleHomeNavigation(selectHomeSlot(tickSystem(createPortfolioState(), 3001), slot));
    state = tickSystem(launchHomeShortcut(state, app, 3010), 6500);
    const owner = state.system.runtime.application;
    state = dispatchSystemEvent(state, { type: 'button', phase: 'down', command: 'home', source: 'key:KeyH' }, 6600);
    state = dispatchSystemEvent(state, { type: 'button', phase: 'up', command: 'home', source: 'key:KeyH' }, 6601);
    let clock = 6610;
    const inputs = [];
    const key = async value => {
      inputs.push(value);
      const command = { ArrowRight: 'right', ArrowLeft: 'left' }[value];
      state = dispatchSystemEvent(state, { type: 'button', phase: 'down', command, source: `key:${value}` }, clock++);
      state = dispatchSystemEvent(state, { type: 'button', phase: 'up', command, source: `key:${value}` }, clock++);
    };
    const snapshot = async () => ({ ...data(String(state.selected)), app: state.system.app, menu: state.system.phase,
      homeCursor: JSON.stringify({ selectedSlot: state.selected, focus: state.system.homeNavigation.focus }) });
    const waitForSelection = async request => {
      for (let step = 0; state.selected !== Number(request.selected) && step < 20; step++) state = tickSystem(state, clock += 1000 / 60);
      await withData(await snapshot(), () => assert.equal(pauseCompactSelectionChanged(request), true));
    };
    const compact = await selectPauseCompact(true, app, String(slot), { key, state: snapshot, waitForSelection });
    assert.deepEqual(inputs, ['ArrowRight']);
    assert.equal(compact.compactSelected, String(slot + 2));
    assert.equal(state.system.runtime.application, owner);
    assert.equal(retainedSuspendedApplication(state).id, owner);
    assert.equal(selectedSuspendedApplication(state), null);
    assert.equal(compact.privateOwner, null);
    assert.equal(compact.nativeSourceEpoch, null);
    await restorePauseCompactSelection(compact, { key, waitForReady: async request => {
      await waitForSelection(request);
      const restored = await snapshot(), cursor = JSON.parse(restored.homeCursor);
      const paint = { at: 200, phase: 'home', cursor };
      restored.screenPaint = JSON.stringify(paint); restored.screenPresented = JSON.stringify({ validPublication: true, paint });
      await withData(restored, () => assert.equal(pauseCompactRestoreReady(request), true));
    } });
    assert.deepEqual(inputs, ['ArrowRight', 'ArrowLeft']);
    assert.equal(selectedSuspendedApplication(state).id, owner);
    state = dispatchSystemEvent(state, { type: 'button', phase: 'down', command: 'open', source: 'key:Enter' }, clock++);
    state = dispatchSystemEvent(state, { type: 'button', phase: 'up', command: 'open', source: 'key:Enter' }, clock++);
    assert.equal(state.system.phase, 'app');
    assert.equal(state.system.runtime.active, owner);
    assert.equal(state.system.dialog, null);
  });
}

test('ordinary pause and failed compact origins cannot add a directional input', async () => {
  await restorePauseCompactSelection(null, { key: () => assert.fail('Normal repeat must not restore'), waitForReady: () => assert.fail() });
  for (const mutate of [d => d.menu = 'app', d => d.app = 'camera', d => d.selected = '9',
    d => d.homeCursor = JSON.stringify({ focus: { toolbarActive: true } }), d => d.rows = '0']) {
    const origin = data('8'); mutate(origin);
    await assert.rejects(selectPauseCompact(true, selection.app, '8', {
      state: async () => origin, key: () => assert.fail('Invalid origin must not press ArrowRight'), waitForSelection: () => assert.fail() }));
  }
});

test('repeat readiness requires actual restored grid and matching valid HOME pair, not an elapsed sleep', async () => {
  const restored = data('8'), request = { app: selection.app, selected: '8' };
  await withData(restored, () => assert.equal(pauseCompactRestoreReady(request), true));
  for (const mutate of [d => d.selected = '10', d => d.app = 'camera', d => d.menu = 'app', d => d.dialog = 'switch',
    d => d.nativeScreen = 'loading', d => d.nativeScreen = 'error', d => d.nativeScreenFailure = 'Source unavailable',
    d => d.homeCursor = JSON.stringify({ selectedSlot: 8, focus: { toolbarActive: true } }),
    d => d.screenPresented = JSON.stringify({ validPublication: false, paint: JSON.parse(d.screenPaint) }),
    d => d.screenPresented = JSON.stringify({ validPublication: true, paint: { ...JSON.parse(d.screenPaint), at: 99 } }),
    d => { const paint = JSON.parse(d.screenPaint); paint.cursor.selectedSlot = 10; d.screenPaint = JSON.stringify(paint); d.screenPresented = JSON.stringify({ validPublication: true, paint }); }]) {
    const altered = structuredClone(restored); mutate(altered);
    await withData(altered, () => assert.equal(pauseCompactRestoreReady(request), false));
  }
});

test('loading or recovery cannot become compact destination or target-path evidence even with matching paired publication', async () => {
  validatePauseCompactDestination(data(), selection);
  for (const mutate of [d => d.nativeScreen = 'loading', d => d.nativeScreen = 'error', d => delete d.nativeScreen,
    d => d.nativeScreenFailure = 'Source unavailable', d => delete d.nativeScreenFailure]) {
    const altered = data(); mutate(altered);
    assert.throws(() => validatePauseCompactDestination(altered, selection), /native readiness|native failure/);
    const evidence = pauseCompactEvidence([{ index: 0, at: 100, data: altered }], selection, false);
    assert.equal(evidence.firstMatchingReceipt, null);
    assert.equal(evidence.firstAppearanceReceipt, null);
    assert.equal(evidence.targetPathObserved, false);
    assert.equal(evidence.coverage, 'missing-valid-pair');
    await withData(altered, () => assert.equal(pauseCompactSelectionChanged({ app: selection.app, selected: '10' }), false));
  }
});

test('chronological compact evidence rejects stale/mismatched pairs and distinguishes entry sampling from terminal-only', () => {
  const frames = [
    { index: 0, at: 0, data: data('8', 0) },
    { index: 1, at: 10, data: { ...data('10', 0), screenPresented: JSON.stringify({ validPublication: false }) } },
    { index: 2, at: 20, data: { ...data('10', 1), screenPresented: data('10', 0).screenPresented } },
    { index: 3, at: 30, data: data('10', 2) },
    { index: 4, at: 300, data: data('10', 20) },
  ];
  const before = structuredClone(frames), evidence = pauseCompactEvidence(frames, selection, false);
  assert.deepEqual(evidence.firstMatchingReceipt, { index: 3, at: 30, pauseFrame: 2, selected: '10' });
  assert.deepEqual(evidence.firstAppearanceReceipt, evidence.firstMatchingReceipt);
  assert.deepEqual(evidence.firstTerminalReceipt, { index: 4, at: 300, pauseFrame: 20, selected: '10' });
  assert.equal(evidence.targetPathObserved, true);
  assert.equal(evidence.coverage, 'appearance-during-entry');
  assert.equal(evidence.nativeCompared, false);
  assert.equal(evidence.captureGeneration, null);
  assert.deepEqual(frames, before);
  const terminal = pauseCompactEvidence(frames.slice(4), selection, false);
  assert.equal(terminal.coverage, 'terminal-or-no-entry-only');
  assert.equal(terminal.targetPathObserved, false);
  assert.equal(terminal.firstAppearanceReceipt, null);
  assert.match(terminal.limitation, /does not verify the compact fade/);
  assert.equal(pauseCompactEvidence(frames.slice(4), selection, true).coverage, 'reduced-endpoint');
  assert.equal(pauseCompactEvidence(frames.slice(0, 3), selection, false).coverage, 'missing-valid-pair');
});

test('terminal-only sampling limitation remains in the written original capture without a retry', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'pause-compact-terminal-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const frames = [{ index: 0, at: 1000, data: data('10', 20) }];
  const browser = tapFixture(); await browser.page.evaluate(collectAnimationFrames, { durationMs: 3500, pauseCompact: true });
  const tap = await observePauseCompactArrowRight(browser.page, async () => {
    browser.event('keydown', 110); browser.event('keyup', 120);
  });
  const report = { valid: false, durationMs: 3500, pauseCompact: true, compactSelection: { ...selection, arrowRightTap: tap },
    compactEvidence: pauseCompactEvidence(frames, selection, false), frames };
  const path = join(dir, 'capture.json'); await writeInitialCapture(path, report);
  const retained = JSON.parse(await readFile(path, 'utf8'));
  assert.equal(retained.compactEvidence.targetPathObserved, false);
  assert.equal(retained.compactEvidence.coverage, 'terminal-or-no-entry-only');
  assert.deepEqual(retained.frames, frames);
  validatePauseCompactDestination(data('10'), selection);
  assert.throws(() => validatePauseCompactDestination(data('8'), selection), /adjacent column/);
});

test('ordinary ArrowRight window observations record actual down/up, trust, target, repeats and host timing without altering input', async () => {
  const browser = tapFixture(), keys = [];
  await browser.page.evaluate(collectAnimationFrames, { durationMs: 1000, pauseCompact: true });
  const tap = await observePauseCompactArrowRight(browser.page, async () => {
    keys.push('ArrowRight');
    browser.event('keydown', 110); browser.sample(111);
    browser.event('keyup', 117); browser.sample(118);
    browser.event('keydown', 119, { key: 'x', code: 'KeyX' });
  });
  assert.deepEqual(keys, ['ArrowRight']);
  assert.equal(tap.failure, null);
  assert.equal(tap.observation.down.type, 'keydown');
  assert.equal(tap.observation.up.type, 'keyup');
  assert.equal(tap.observation.down.atMs, 10);
  assert.equal(tap.observation.up.atMs, 17);
  assert.equal(tap.observation.observedHostDurationMs, 7);
  assert.equal(tap.observation.down.epochMs, 1000110);
  assert.equal(tap.observation.down.isTrusted, true);
  assert.equal(tap.observation.up.withinConsoleStage, true);
  assert.deepEqual(tap.observation.events.map(event => event.repeat), [false, false]);
  assert.equal(tap.observation.nativeHoldDurationMs, null);
  assert.equal(tap.observation.nativeSourceEpoch, null);
  assert.equal(browser.window.animationCapture.frames[1].compactArrowRightActive, true);
  assert.equal(browser.window.animationCapture.frames[1].compactArrowRightEventCount, 1);
  assert.equal(browser.window.animationCapture.frames[2].compactArrowRightActive, false);
  assert.equal(browser.window.animationCapture.frames[2].compactArrowRightEventCount, 2);
  assert.equal(browser.listenerCount(), 0);
  validatePauseCompactArrowRight(tap.observation, 1000);
});

test('missing keyup skips selection waiting and preserves the original observation and raw frame ledger before rejection', async t => {
  const browser = tapFixture(); await browser.page.evaluate(collectAnimationFrames, { durationMs: 1000, pauseCompact: true });
  const compact = await selectPauseCompact(true, 'health-safety', '8', {
    state: async () => data('8'), key: async value => { assert.equal(value, 'ArrowRight'); browser.event('keydown', 110); browser.sample(115); },
    observeTap: press => observePauseCompactArrowRight(browser.page, press),
    waitForSelection: () => assert.fail('Missing up must not wait away the retained capture') });
  assert.match(compact.arrowRightTap.failure, /observed down\/up/);
  assert.equal(compact.arrowRightTap.observation.down.isTrusted, true);
  assert.equal(compact.arrowRightTap.observation.up, null);
  assert.equal(compact.arrowRightTap.observation.observedHostDurationMs, null);
  assert.equal(browser.listenerCount(), 0);
  const dir = await mkdtemp(join(tmpdir(), 'pause-compact-missing-up-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const path = join(dir, 'capture.json'), frames = JSON.parse(JSON.stringify(browser.window.animationCapture.frames));
  await assert.rejects(writeInitialCapture(path, { valid: false, durationMs: 1000, pauseCompact: true, compactSelection: compact, frames }), /observed down\/up/);
  const retained = JSON.parse(await readFile(path, 'utf8'));
  assert.equal(retained.valid, false);
  assert.equal(retained.compactSelection.arrowRightTap.observation.up, null);
  assert.deepEqual(retained.frames, frames);
  assert.equal(retained.frames[1].top, 'raw-top');
  assert.equal(retained.frames[1].bottom, 'raw-bottom');
});

test('repeated, untrusted, wrong-code, outside-stage, reversed and out-of-window taps stay explicit invalid observations', async () => {
  const cases = [
    fixture => { fixture.event('keydown', 110); fixture.event('keydown', 112, { repeat: true }); fixture.event('keyup', 117); },
    fixture => { fixture.event('keydown', 110, { isTrusted: false }); fixture.event('keyup', 117); },
    fixture => { fixture.event('keydown', 110); fixture.event('keyup', 117, { code: 'KeyX' }); },
    fixture => { fixture.event('keydown', 110); fixture.event('keyup', 117, { target: { tagName: 'BUTTON', id: 'other' } }); },
    fixture => { fixture.event('keyup', 110); fixture.event('keydown', 117); },
    fixture => { fixture.event('keydown', 110); fixture.event('keyup', 1200); },
  ];
  for (const press of cases) {
    const browser = tapFixture(); await browser.page.evaluate(collectAnimationFrames, { durationMs: 1000, pauseCompact: true });
    const tap = await observePauseCompactArrowRight(browser.page, async () => press(browser));
    assert.equal(tap.observation.events.length >= 2, true);
    assert.equal(typeof tap.failure, 'string');
    assert.throws(() => validatePauseCompactArrowRight(tap.observation, 1000));
    assert.equal(browser.listenerCount(), 0);
  }
  const browser = tapFixture(); await browser.page.evaluate(collectAnimationFrames, { durationMs: 1000, pauseCompact: true });
  const repeated = await observePauseCompactArrowRight(browser.page, async () => cases[0](browser));
  assert.deepEqual(repeated.observation.events.map(event => event.repeat), [false, true, false]);
});

test('sender or observer setup failure is recorded without inventing release delivery', async () => {
  const browser = tapFixture(); await browser.page.evaluate(collectAnimationFrames, { durationMs: 1000, pauseCompact: true });
  const tap = await observePauseCompactArrowRight(browser.page, async () => {
    browser.event('keydown', 110); throw new Error('Host sender failed');
  });
  assert.equal(tap.failure, 'Error: Host sender failed');
  assert.equal(tap.observation.up, null);
  assert.equal(browser.listenerCount(), 0);
  const inactive = tapFixture();
  const failed = await observePauseCompactArrowRight(inactive.page, () => assert.fail('Observer setup failure must not send a tap'));
  assert.equal(failed.observation, null);
  assert.match(failed.failure, /fresh active capture/);
  assert.equal(inactive.listenerCount(), 0);
});
