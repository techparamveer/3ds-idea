import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createContext, runInContext } from 'node:vm';
import { parsePauseCompact, pauseCompactEvidence, pauseCompactRestoreReady, pauseCompactSelectionChanged,
  collectAnimationFrames, restorePauseCompactSelection, selectPauseCompact, validatePauseCompactDestination, writeInitialCapture } from '../scripts/verify-animation-flow.mjs';
import { createPortfolioState, dispatchSystemEvent, launchHomeShortcut, tickSystem } from '../src/os/system.ts';
import { selectHomeSlot, settleHomeNavigation } from '../src/os/home-navigation.ts';
import { retainedSuspendedApplication, selectedSuspendedApplication } from '../src/os/home-suspended-window.ts';

const selection = { app: 'health-safety', originalSelected: '8', compactSelected: '10' };
function data(selected = '10', pauseFrame = 2) {
  const cursor = { selectedSlot: Number(selected), focus: { toolbarActive: false } };
  const paint = { at: 100, phase: 'home', cursor, entryMotion: { folder: null, pauseFrame } };
  return { menu: 'home', app: 'health-safety', selected, rows: '2', homeCursor: JSON.stringify(cursor),
    dialog: '', sleeping: 'false', nativeScreen: 'ready', screenPaint: JSON.stringify(paint),
    screenPresented: JSON.stringify({ frame: 1, validPublication: true, paint }) };
}
async function withData(dataset, run) {
  const saved = Object.getOwnPropertyDescriptor(globalThis, 'document');
  globalThis.document = { querySelector: () => ({ dataset }) };
  try { return await run(); } finally { if (saved) Object.defineProperty(globalThis, 'document', saved); else delete globalThis.document; }
}

test('compact pause is opt-in and limited to ordinary key or physical HOME', async () => {
  for (const value of [undefined, false]) {
    assert.equal(parsePauseCompact(value, { scenario: 'notes', activation: 'touch' }), false);
    assert.equal(await selectPauseCompact(value, 'health-safety', '8', {
      key: () => assert.fail('Normal pause has no added input'), state: () => assert.fail('Normal pause has no added snapshot'),
      waitForSelection: () => assert.fail('Normal pause has no added wait') }), null);
  }
  for (const activation of ['key', 'physical']) assert.equal(parsePauseCompact(true, { scenario: 'pause', activation }), true);
  for (const scenario of ['notes', 'manual', 'folder']) assert.throws(() => parsePauseCompact(true, { scenario, activation: 'key' }), /pause-only/);
  for (const activation of ['touch', 'tile', 'accessible']) assert.throws(() => parsePauseCompact(true, { scenario: 'pause', activation }), /key or physical HOME/);
  for (const value of ['true', 1, null]) assert.throws(() => parsePauseCompact(value, { scenario: 'pause', activation: 'key' }), /boolean flag/);
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
    d => d.homeCursor = JSON.stringify({ selectedSlot: 8, focus: { toolbarActive: true } }),
    d => d.screenPresented = JSON.stringify({ validPublication: false, paint: JSON.parse(d.screenPaint) }),
    d => d.screenPresented = JSON.stringify({ validPublication: true, paint: { ...JSON.parse(d.screenPaint), at: 99 } }),
    d => { const paint = JSON.parse(d.screenPaint); paint.cursor.selectedSlot = 10; d.screenPaint = JSON.stringify(paint); d.screenPresented = JSON.stringify({ validPublication: true, paint }); }]) {
    const altered = structuredClone(restored); mutate(altered);
    await withData(altered, () => assert.equal(pauseCompactRestoreReady(request), false));
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
  const report = { valid: false, durationMs: 3500, pauseCompact: true, compactSelection: selection,
    compactEvidence: pauseCompactEvidence(frames, selection, false), frames };
  const path = join(dir, 'capture.json'); await writeInitialCapture(path, report);
  const retained = JSON.parse(await readFile(path, 'utf8'));
  assert.equal(retained.compactEvidence.targetPathObserved, false);
  assert.equal(retained.compactEvidence.coverage, 'terminal-or-no-entry-only');
  assert.deepEqual(retained.frames, frames);
  validatePauseCompactDestination(data('10'), selection);
  assert.throws(() => validatePauseCompactDestination(data('8'), selection), /adjacent column/);
});
