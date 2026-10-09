import assert from 'node:assert/strict';
import { lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { basename, dirname, isAbsolute, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual, parseArgs } from 'node:util';
import { folderCapturePrecondition } from './reference/folder-capture-precondition.mjs';
import { pauseCapturePrecondition } from './reference/pause-capture-precondition.mjs';

export function manualCaptureHeading(title) {
  const headings = { settings: 'System Settings', camera: 'Nintendo 3DS Camera', browser: 'Internet Browser' };
  assert.ok(Object.hasOwn(headings, title), 'Manual requires a delivered application manual');
  return headings[title];
}

export function validateManualCaptureOrigin(before, title) {
  manualCaptureHeading(title);
  assert.equal(before.menu, 'home', 'Manual begins from HOME');
  const focus = JSON.parse(before.homeCursor ?? 'null')?.focus;
  if (title === 'browser') {
    assert.equal(focus?.toolbarActive, true, 'Browser Manual requires toolbar focus');
    assert.equal(focus.currentFocus, 4, 'Browser remains the Manual caller');
  } else {
    assert.equal(focus?.toolbarActive, false, 'Application Manual requires grid focus');
    assert.equal(before.selected, title === 'settings' ? '9' : '10', 'Requested application remains selected');
  }
}

export function validateManualCaptureDestination(after, title) {
  assert.equal(after.announcement?.split('. ')[0], manualCaptureHeading(title), 'Requested application Manual is the destination');
}

export async function selectAnimationTitle(title, { key, touch, wait }) {
  if (title === 'browser') {
    await touch(190, 16);
    await wait(300);
    return;
  }
  const slot = { portfolio: 0, health: 8, settings: 9, camera: 10, sound: 7 }[title];
  assert.ok(Number.isInteger(slot), 'Supported title selection');
  for (let n = 0; n < Math.floor(slot / 2); n++) { await key('ArrowRight'); await wait(180); }
  if (slot % 2) await key('ArrowDown');
  await wait(300);
}

export function parsePauseHomeHold(value, { scenario, activation, durationMs }) {
  if (value === undefined) return null;
  assert.equal(scenario, 'pause', 'HOME hold is pause-only');
  assert.ok(['key', 'physical'].includes(activation), 'HOME hold requires key or physical activation');
  const holdMs = Number(value);
  assert.ok(Number.isInteger(holdMs) && holdMs > 0 && holdMs < durationMs,
    'HOME hold must be an integer >=1ms and shorter than the capture duration');
  return holdMs;
}

export function parsePauseCompact(value, { scenario, activation, homeHoldMs = null }) {
  if (value === undefined || value === false) return false;
  assert.equal(value, true, 'Compact pause requires a boolean flag');
  assert.equal(scenario, 'pause', 'Compact pause is pause-only');
  assert.ok(['key', 'physical'].includes(activation), 'Compact pause requires key or physical HOME');
  assert.equal(homeHoldMs, null, 'Compact pause cannot be combined with --home-hold-ms');
  return true;
}

export function validatePauseCompactDestination(data, selection) {
  assert.equal(data.menu, 'home', 'Compact pause remains on HOME');
  assert.equal(data.app, selection.app, 'Compact pause retains the requested application');
  assert.equal(data.nativeScreen, 'ready', 'Compact pause requires native readiness');
  assert.equal(data.nativeScreenFailure, '', 'Compact pause has no native failure');
  const cursor = JSON.parse(data.homeCursor ?? 'null');
  assert.equal(cursor?.focus?.toolbarActive, false, 'Compact pause remains on the grid');
  assert.equal(cursor.selectedSlot, Number(data.selected), 'Compact cursor follows the actual selection');
  assert.equal(data.selected, selection.compactSelected, 'ArrowRight selects the adjacent column');
  assert.notEqual(data.selected, selection.originalSelected, 'Retained application is no longer selected');
  assert.equal(data.dialog, '', 'Compact pause has no dialog overlay');
  assert.equal(data.sleeping, 'false', 'Compact pause is awake');
}

export async function selectPauseCompact(enabled, app, originalSelected, { key, state, waitForSelection, observeTap, activateHome }) {
  if (!enabled) return null;
  let homeBeforeSelection = null, compactSelected = null, arrowRightTap = null;
  const press = async () => {
    if (activateHome) await activateHome();
    homeBeforeSelection = await state();
    assert.equal(homeBeforeSelection.menu, 'home', 'ArrowRight follows actual HOME');
    assert.equal(homeBeforeSelection.app, app, 'Requested application is retained before ArrowRight');
    assert.equal(homeBeforeSelection.selected, originalSelected, 'HOME begins with the retained application selected');
    assert.equal(JSON.parse(homeBeforeSelection.homeCursor ?? 'null')?.focus?.toolbarActive, false, 'HOME begins on the grid');
    const slot = Number(originalSelected), rows = Number(homeBeforeSelection.rows);
    assert.ok(Number.isSafeInteger(slot) && slot >= 0 && Number.isSafeInteger(rows) && rows > 0, 'HOME selection and row count are explicit');
    compactSelected = String(slot + rows);
    await key('ArrowRight');
  };
  if (observeTap) arrowRightTap = await observeTap(press);
  else await press();
  let selectionFailure = null;
  if (!arrowRightTap?.failure) {
    try { await waitForSelection({ app, selected: compactSelected }); }
    catch (error) { selectionFailure = String(error); }
  }
  const afterSelection = await state();
  const selection = { app, originalSelected, compactSelected, homeBeforeSelection, afterSelection,
    method: 'Focus before capture; install the trusted ArrowRight observer before HOME; check actual HOME, retained app and original grid selection immediately before one ordinary ArrowRight. No fixed delay or diagnostic repaint.',
    adaptation: 'Collector-latency adaptation removes redundant focus and listener-installation round trips between HOME and ArrowRight; not a recovered native input epoch, duration or compact activation boundary.',
    ...(arrowRightTap ? { arrowRightTap } : {}), selectionFailure, privateOwner: null, captureGeneration: null, nativeSourceEpoch: null };
  if (!arrowRightTap?.failure && !selectionFailure) {
    try { validatePauseCompactDestination(afterSelection, selection); }
    catch (error) { selection.selectionFailure = String(error); }
  }
  return selection;
}

export function validatePauseCompactArrowRight(observation, durationMs) {
  assert.ok(observation?.down && observation.up, 'Compact ArrowRight tap requires observed down/up events');
  assert.deepEqual(observation.events, [observation.down, observation.up], 'Compact ArrowRight tap requires exactly one down/up pair without repeats');
  for (const [index, event] of observation.events.entries()) {
    assert.equal(event.type, index ? 'keyup' : 'keydown', 'Compact ArrowRight event order');
    assert.equal(event.key, 'ArrowRight'); assert.equal(event.code, 'ArrowRight');
    assert.equal(event.repeat, false, 'Compact ArrowRight is one ordinary tap, not a repeat');
    assert.equal(event.isTrusted, true, 'Compact ArrowRight requires trusted browser delivery');
    assert.equal(event.withinConsoleStage, true, 'Compact ArrowRight must reach the console-stage input path');
    assert.ok(Number.isFinite(event.performanceNowMs) && Number.isFinite(event.atMs)
      && event.atMs >= 0 && event.atMs <= durationMs, 'Compact ArrowRight observations remain inside the capture window');
  }
  const elapsed = observation.up.performanceNowMs - observation.down.performanceNowMs;
  assert.ok(elapsed >= 0 && observation.up.atMs >= observation.down.atMs, 'Compact ArrowRight has monotonic down/up observations');
  assert.equal(observation.observedHostDurationMs, elapsed, 'Compact ArrowRight observed duration matches its events');
}

export async function observePauseCompactArrowRight(page, press) {
  let observation = null, durationMs = null;
  try {
    await page.evaluate(() => {
      const capture = window.animationCapture, host = document.querySelector('.console-stage');
      if (!capture || capture.done || capture.compactArrowRight || !host) throw new Error('Compact ArrowRight requires a fresh active capture');
      const observation = capture.compactArrowRight = { down: null, up: null, events: [], observedHostDurationMs: null,
        hostClock: 'performance.now() at window capture listener; epochMs is Date.now()',
        inputPath: 'console-stage-ArrowRight-keyboard', nativeHoldDurationMs: null, nativeSourceEpoch: null };
      const observe = event => {
        if (window.animationCapture !== capture || event.key !== 'ArrowRight') return;
        const performanceNowMs = performance.now(), recorded = { type: event.type, key: event.key, code: event.code,
          repeat: event.repeat, isTrusted: event.isTrusted, withinConsoleStage: host.contains(event.target),
          target: { tagName: event.target?.tagName ?? null, id: event.target?.id ?? null },
          performanceNowMs, atMs: performanceNowMs - capture.start, epochMs: Date.now(), eventTimeStampMs: event.timeStamp };
        observation.events.push(recorded);
        if (event.type === 'keydown' && !observation.down) observation.down = recorded;
        if (event.type === 'keyup' && !observation.up) observation.up = recorded;
        if (observation.down && observation.up) observation.observedHostDurationMs = observation.up.performanceNowMs - observation.down.performanceNowMs;
      };
      window.addEventListener('keydown', observe, true); window.addEventListener('keyup', observe, true);
      capture.compactArrowRightCleanup = () => {
        window.removeEventListener('keydown', observe, true); window.removeEventListener('keyup', observe, true);
      };
    });
    try { await press(); } finally {
      ({ observation, durationMs } = await page.evaluate(() => {
        const capture = window.animationCapture;
        capture.compactArrowRightCleanup(); delete capture.compactArrowRightCleanup;
        return { observation: capture.compactArrowRight, durationMs: capture.durationMs };
      }));
    }
    validatePauseCompactArrowRight(observation, durationMs);
    return { observation, failure: null };
  } catch (error) { return { observation, failure: String(error) }; }
}

export function pauseCompactSelectionChanged({ app, selected }) {
  const data = document.querySelector('.console-stage')?.dataset;
  const cursor = JSON.parse(data?.homeCursor ?? 'null');
  return data?.menu === 'home' && data.app === app && data.selected === selected
    && data.nativeScreen === 'ready' && data.nativeScreenFailure === ''
    && cursor?.focus?.toolbarActive === false && cursor.selectedSlot === Number(selected);
}

// Standalone browser predicate: repeat Resume must follow a fresh HOME receipt.
export function pauseCompactRestoreReady({ app, selected }) {
  const data = document.querySelector('.console-stage')?.dataset;
  if (!data || data.menu !== 'home' || data.app !== app || data.selected !== selected || data.dialog || data.sleeping === 'true'
    || data.nativeScreen !== 'ready' || data.nativeScreenFailure !== '') return false;
  const cursor = JSON.parse(data.homeCursor ?? 'null'), paint = JSON.parse(data.screenPaint ?? 'null'), receipt = JSON.parse(data.screenPresented ?? 'null');
  return cursor?.focus?.toolbarActive === false && cursor.selectedSlot === Number(selected)
    && paint?.phase === 'home' && paint.cursor?.selectedSlot === Number(selected) && paint.cursor?.focus?.toolbarActive === false
    && receipt?.validPublication === true && JSON.stringify(receipt.paint) === JSON.stringify(paint);
}

export async function restorePauseCompactSelection(selection, { key, waitForReady }) {
  if (!selection) return;
  await key('ArrowLeft');
  await waitForReady({ app: selection.app, selected: selection.originalSelected });
}

export function pauseCompactEvidence(frames, selection, reducedMotion) {
  const matching = frames.filter(frame => {
    try { validatePauseCompactDestination(frame.data, selection); } catch { return false; }
    const paint = JSON.parse(frame.data.screenPaint ?? 'null'), receipt = JSON.parse(frame.data.screenPresented ?? 'null');
    return paint?.phase === 'home' && paint.cursor?.selectedSlot === Number(selection.compactSelected)
      && paint.cursor?.focus?.toolbarActive === false && receipt?.validPublication === true && isDeepStrictEqual(receipt.paint, paint);
  });
  const appearance = matching.find(frame => {
    const frameNumber = JSON.parse(frame.data.screenPaint).entryMotion?.pauseFrame;
    return Number.isInteger(frameNumber) && frameNumber >= 0 && frameNumber < 10;
  });
  const terminal = matching.find(frame => {
    const entry = JSON.parse(frame.data.screenPaint).entryMotion;
    return entry?.pauseFrame === 20 && entry.pauseLower === null;
  });
  const describe = frame => frame ? { index: frame.index, at: frame.at,
    pauseFrame: JSON.parse(frame.data.screenPaint).entryMotion?.pauseFrame ?? null,
    selected: frame.data.selected } : null;
  return { firstMatchingReceipt: describe(matching[0]), firstAppearanceReceipt: describe(appearance), firstTerminalReceipt: describe(terminal),
    targetPathObserved: !reducedMotion && Boolean(appearance),
    coverage: !matching.length ? 'missing-valid-pair' : reducedMotion ? terminal ? 'reduced-endpoint' : 'reduced-no-entry-only' : appearance ? 'appearance-during-entry' : 'terminal-or-no-entry-only',
    limitation: !reducedMotion && !appearance ? 'Host input latency or publication sampling missed compact Appear0..9. This capture does not verify the compact fade; preserve it without automatic retry.' : null,
    privateOwner: null, captureGeneration: null, nativeSourceEpoch: null, nativeCompared: false };
}

export function collectAnimationFrames(durationOrOptions) {
  const compact = typeof durationOrOptions === 'object' && durationOrOptions.pauseCompact === true;
  const durationMs = compact ? durationOrOptions.durationMs : durationOrOptions;
  const host = document.querySelector('.console-stage'), frames = [], start = performance.now();
  window.animationCapture = { frames, start, done: false, ...(compact ? { durationMs } : {}) };
  let lastPaint = null;
  const sample = () => {
    const paint = host.dataset.screenPaint, presented = JSON.parse(host.dataset.screenPresented ?? 'null');
    const identity = JSON.stringify([paint, presented?.paint, presented?.validPublication]);
    if (identity !== lastPaint) {
      lastPaint = identity;
      frames.push({ at: performance.now() - start,
        ...(window.animationCapture.homeHold ? { homeHoldActive: Boolean(window.animationCapture.homeHold.down && !window.animationCapture.homeHold.up) } : {}),
        ...(window.animationCapture.compactArrowRight ? {
          compactArrowRightActive: Boolean(window.animationCapture.compactArrowRight.down && !window.animationCapture.compactArrowRight.up),
          compactArrowRightEventCount: window.animationCapture.compactArrowRight.events.length } : {}),
        data: Object.fromEntries(['menu', 'phase', 'app', 'selected', 'rows', 'lastInput', 'nativeScreen', 'nativeScreenFailure', 'screenPaint', 'screenPresented', 'homeUpdates', 'folderClose', 'folderBanner', 'homeCursor', ...(compact ? ['dialog', 'sleeping'] : [])].map(k => [k, host.dataset[k]])),
        top: host.screenCanvases.top.toDataURL('image/png'), bottom: host.screenCanvases.bottom.toDataURL('image/png') });
    }
    if (performance.now() - start < durationMs) requestAnimationFrame(sample);
    else window.animationCapture.done = true;
  };
  sample();
}

export async function holdPauseHome(page, activation, requestedHoldDurationMs, inputs) {
  const target = activation === 'physical' ? 'Button_HOME' : '.console-stage';
  let point = null;
  if (activation === 'physical') {
    point = await page.locator('.console-stage').evaluate((host, key) => JSON.parse(host.dataset.targets)[key], target);
    assert.ok(Array.isArray(point) && point.length === 2 && point.every(Number.isFinite), `Projected target ${target}`);
    const viewport = page.viewportSize();
    assert.ok(point[0] >= 0 && point[0] < viewport.width && point[1] >= 0 && point[1] < viewport.height, 'HOME is inside viewport');
    await page.mouse.move(point[0], point[1]);
  } else {
    await page.locator('.console-stage').focus();
  }
  const input = { ...(activation === 'physical' ? { kind: 'physical', button: 'HOME' } : { kind: 'key', value: 'h' }),
    target, point, at: Date.now(), requestedHoldDurationMs,
    down: null, up: null, observedHostDurationMs: null, collectedFrameCountDuringHold: null, collectedPaintCountDuringHold: null,
    inputPath: activation === 'physical' ? 'projected-physical-HOME-pointer' : 'console-stage-HOME-keyboard',
    timingScope: 'Browser DOM event observations; not native button duration or a source epoch.',
    nativeHoldDurationMs: null, nativeSourceEpoch: null };
  inputs.push(input);
  await page.evaluate(({ activation, point }) => {
    const capture = window.animationCapture, host = document.querySelector('.console-stage');
    if (!capture || capture.done || capture.homeHold) throw new Error('HOME hold requires a current active capture');
    const observation = capture.homeHold = { down: null, up: null, observedHostDurationMs: null,
      hostClock: 'performance.now() at matching DOM event observer; epochMs is Date.now()' };
    const downType = activation === 'physical' ? 'pointerdown' : 'keydown';
    const upType = activation === 'physical' ? 'pointerup' : 'keyup';
    const observe = event => {
      if (window.animationCapture !== capture) return;
      if (activation === 'physical') {
        if (event.button !== 0) return;
        if (event.type === downType && (!host.contains(event.target)
          || Math.abs(event.clientX - point[0]) > 1 || Math.abs(event.clientY - point[1]) > 1)) return;
        if (event.type === upType && event.pointerId !== observation.down?.pointerId) return;
      } else if (event.key.toLowerCase() !== 'h' || event.repeat || !host.contains(event.target)) return;
      const performanceNowMs = performance.now();
      const recorded = { type: event.type, performanceNowMs, atMs: performanceNowMs - capture.start,
        epochMs: Date.now(), eventTimeStampMs: event.timeStamp, isTrusted: event.isTrusted,
        target: { tagName: event.target?.tagName ?? null, id: event.target?.id ?? null },
        ...(activation === 'physical' ? { button: event.button, pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY }
          : { key: event.key, code: event.code }) };
      if (event.type === downType && !observation.down) observation.down = recorded;
      if (event.type === upType && observation.down && !observation.up) {
        observation.up = recorded;
        observation.observedHostDurationMs = performanceNowMs - observation.down.performanceNowMs;
        const heldFrames = capture.frames.filter(frame => frame.homeHoldActive
          && frame.at >= observation.down.atMs && frame.at <= recorded.atMs);
        observation.collectedFrameCountDuringHold = heldFrames.length;
        observation.collectedPaintCountDuringHold = new Set(heldFrames.map(frame => frame.data.screenPaint)).size;
      }
    };
    window.addEventListener(downType, observe, true);
    window.addEventListener(upType, observe, true);
    capture.homeHoldCleanup = () => {
      window.removeEventListener(downType, observe, true);
      window.removeEventListener(upType, observe, true);
    };
  }, { activation, point });
  try {
    if (activation === 'physical') await page.mouse.down();
    else await page.keyboard.down('h');
    await page.waitForTimeout(requestedHoldDurationMs);
  } finally {
    try {
      if (activation === 'physical') await page.mouse.up();
      else await page.keyboard.up('h');
    } finally {
      Object.assign(input, await page.evaluate(() => {
        const capture = window.animationCapture;
        capture.homeHoldCleanup();
        delete capture.homeHoldCleanup;
        return capture.homeHold;
      }));
    }
  }
  return input;
}

export function validatePauseHomeHold(input, durationMs, frames) {
  assert.ok(input.down && input.up, 'HOME hold has matching observed host down/up events');
  assert.ok(Number.isFinite(input.down.atMs) && input.down.atMs >= 0
    && Number.isFinite(input.up.atMs) && input.up.atMs >= input.down.atMs && input.up.atMs <= durationMs,
  'Observed HOME down/up must be inside the declared capture window');
  assert.ok(Number.isFinite(input.observedHostDurationMs) && input.observedHostDurationMs >= 0,
    'HOME hold has a monotonic observed host duration');
  assert.ok(Number.isInteger(input.collectedFrameCountDuringHold) && input.collectedFrameCountDuringHold > 0
    && Number.isInteger(input.collectedPaintCountDuringHold) && input.collectedPaintCountDuringHold > 0
    && input.collectedPaintCountDuringHold <= input.collectedFrameCountDuringHold,
  'HOME hold requires positive captured frame and distinct-paint counts');
  const heldFrames = frames.filter(frame => frame.homeHoldActive
    && frame.at >= input.down.atMs && frame.at <= input.up.atMs);
  assert.equal(input.collectedFrameCountDuringHold, heldFrames.length, 'HOME held-frame count matches retained evidence');
  assert.equal(input.collectedPaintCountDuringHold, new Set(heldFrames.map(frame => frame.data.screenPaint)).size,
    'HOME held-paint count matches retained evidence');
}

export async function attemptPauseHomeHold(page, activation, durationMs, inputs) {
  const holdInputOffset = inputs.length;
  try { return { pauseHomeHold: await holdPauseHome(page, activation, durationMs, inputs), pauseHomeHoldFailure: null }; }
  catch (error) { return { pauseHomeHold: inputs[holdInputOffset] ?? null, pauseHomeHoldFailure: String(error) }; }
}

export async function writeInitialCapture(path, result) {
  await writeFile(path, JSON.stringify(result, null, 2) + '\n');
  if (result.pauseCompact) {
    const tap = result.compactSelection?.arrowRightTap;
    if (tap?.failure) throw new Error(tap.failure);
    validatePauseCompactArrowRight(tap?.observation, result.durationMs);
    if (result.compactSelection.selectionFailure) throw new Error(result.compactSelection.selectionFailure);
  }
  if (result.pauseHomeHoldFailure) throw new Error(result.pauseHomeHoldFailure);
  if (result.pauseHomeHold) validatePauseHomeHold(result.pauseHomeHold, result.durationMs, result.frames);
}

export function parseVisibleWindow(values) {
  const keys = ['window-x', 'window-y', 'window-width', 'window-height', 'ready-file', 'continue-file', 'window-timeout-ms'];
  if (!values['visible-window']) {
    assert.ok(keys.every(key => values[key] === undefined), 'Window options require --visible-window');
    return null;
  }
  const bounds = {};
  for (const key of ['x', 'y', 'width', 'height']) {
    const value = values[`window-${key}`];
    assert.match(value ?? '', /^-?\d+$/, `--window-${key} requires an explicit integer`);
    bounds[key] = Number(value);
    assert.ok(Number.isSafeInteger(bounds[key]) && (['x', 'y'].includes(key) || bounds[key] > 0), `--window-${key}`);
  }
  for (const key of ['ready-file', 'continue-file']) assert.ok(isAbsolute(values[key] ?? ''), `--${key} requires an absolute fresh path`);
  const timeoutMs = Number(values['window-timeout-ms'] ?? 120000);
  assert.ok(Number.isInteger(timeoutMs) && timeoutMs >= 1 && timeoutMs <= 300000, 'Window timeout must be 1..300000ms');
  return { bounds, readyFile: values['ready-file'], continueFile: values['continue-file'], timeoutMs };
}

export function animationBrowserLaunchOptions(executablePath, visibleWindow) {
  return { executablePath, headless: !visibleWindow, args: ['--mute-audio', ...(visibleWindow ? [
    `--window-position=${visibleWindow.bounds.x},${visibleWindow.bounds.y}`,
    `--window-size=${visibleWindow.bounds.width},${visibleWindow.bounds.height}`,
  ] : [])] };
}

export async function assertFreshWindowGate(config) {
  const paths = [];
  for (const path of [config.readyFile, config.continueFile]) {
    paths.push(join(await realpath(dirname(path)), basename(path)));
    try { await lstat(path); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    throw new Error(`Window gate path already exists: ${path}`);
  }
  assert.notEqual(paths[0], paths[1], 'Ready and continue paths must be distinct, including directory aliases');
}

export async function waitForVisibleWindow(config, page, diagnosticPath) {
  await assertFreshWindowGate(config);
  assert.equal(page.url(), 'about:blank', 'Window confirmation must precede navigation');
  const ready = { event: 'animation-window-ready', token: randomUUID(), pid: process.pid,
    readyAt: new Date().toISOString(), requestedBounds: config.bounds, viewport: page.viewportSize(),
    readyFile: config.readyFile, continueFile: config.continueFile, timeoutMs: config.timeoutMs,
    muted: true, pageUrl: page.url(),
    confirmation: 'Coordinator verifies actual OS window bounds on Sidecar, then writes JSON with this token to the fresh continueFile. Requested bounds are not observed geometry.' };
  let diagnostic = { ...ready, status: 'waiting' };
  const save = () => writeFile(diagnosticPath, JSON.stringify(diagnostic, null, 2) + '\n');
  try {
    await save();
    await writeFile(config.readyFile, JSON.stringify(ready, null, 2) + '\n', { flag: 'wx' });
    console.log(JSON.stringify(ready));
    const deadline = performance.now() + config.timeoutMs;
    while (performance.now() < deadline) {
      let confirmation;
      try {
        const stat = await lstat(config.continueFile);
        assert.ok(stat.isFile() && !stat.isSymbolicLink(), 'Continue signal must be a regular file');
        confirmation = JSON.parse(await readFile(config.continueFile, 'utf8'));
      } catch (error) {
        if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error;
      }
      if (confirmation !== undefined) {
        assert.equal(confirmation?.token, ready.token, 'Continue signal must match this fresh ready token');
        diagnostic = { ...ready, status: 'confirmed', confirmedAt: new Date().toISOString(),
          displayVerification: 'Coordinator confirmation; OS placement is not measured by this script.' };
        await save();
        return diagnostic;
      }
      await delay(Math.min(50, Math.max(1, deadline - performance.now())));
    }
    throw new Error(`Window confirmation timed out after ${config.timeoutMs}ms`);
  } catch (error) {
    diagnostic = { ...diagnostic, status: 'failed', error: String(error) };
    await save();
    throw error;
  }
}

export async function main(args = process.argv.slice(2)) {
const { values } = parseArgs({ args, options: {
  'playwright-module': { type: 'string' }, 'browser-executable': { type: 'string' },
  output: { type: 'string' }, scenario: { type: 'string', default: 'notes' },
  url: { type: 'string', default: 'http://127.0.0.1:3021/?lcdCapture=1' },
  width: { type: 'string', default: '1440' }, height: { type: 'string', default: '1000' },
  activation: { type: 'string', default: 'key' }, cycles: { type: 'string', default: '1' },
  title: { type: 'string' }, commit: { type: 'string' },
  'folder-fixture': { type: 'string', default: 'baseline' },
  'duration-ms': { type: 'string', default: '3500' },
  'home-hold-ms': { type: 'string' },
  'pause-compact': { type: 'boolean', default: false },
  'reduced-motion': { type: 'boolean', default: false },
  'visible-window': { type: 'boolean', default: false },
  'window-x': { type: 'string' }, 'window-y': { type: 'string' },
  'window-width': { type: 'string' }, 'window-height': { type: 'string' },
  'ready-file': { type: 'string' }, 'continue-file': { type: 'string' },
  'window-timeout-ms': { type: 'string' },
} });
for (const key of ['playwright-module', 'browser-executable', 'output']) assert.ok(isAbsolute(values[key] ?? ''), key);
assert.ok(['notes', 'friends', 'notifications', 'browser', 'miiverse', 'manual', 'folder', 'pause'].includes(values.scenario));
assert.ok(['key', 'touch', 'physical', 'tile', 'accessible'].includes(values.activation));
if (values.activation === 'accessible') assert.ok(['notes', 'friends', 'notifications', 'browser', 'miiverse'].includes(values.scenario), 'Accessible shortcut is top-row-only');
assert.match(values.commit ?? '', /^[a-f0-9]{40}$/, 'Runtime commit must be supplied');
const title = values.title ?? (values.scenario === 'manual' ? 'settings' : 'health');
const pauseApp = { health: 'health-safety', camera: 'camera', sound: 'sound', portfolio: 'work' }[title];
const pauseNativeStatus = title === 'portfolio' ? 'inactive' : 'ready';
if (values.scenario === 'manual') manualCaptureHeading(title);
if (values.scenario === 'pause') assert.ok(['health', 'camera', 'sound', 'portfolio'].includes(title));
if (values.scenario === 'manual') assert.equal(values.activation, 'touch', 'Manual requires --activation touch');
if (values.scenario === 'pause') assert.notEqual(values.activation, 'touch', 'Pause supports key or physical HOME');
assert.ok(['baseline', 'native-six-rows'].includes(values['folder-fixture']));
if (values.scenario !== 'folder') assert.equal(values['folder-fixture'], 'baseline');
if (values.activation === 'tile') {
  assert.equal(values.scenario, 'folder', 'Tile activation is folder-only');
  assert.equal(values['folder-fixture'], 'native-six-rows', 'Tile activation requires the captured six-row fixture');
}
for (const key of ['width', 'height']) assert.ok(Number.isInteger(Number(values[key])) && Number(values[key]) > 0, key);
const durationMs = Number(values['duration-ms']);
assert.ok(Number.isInteger(durationMs) && durationMs >= 1000 && durationMs <= 30000, 'Capture duration must be 1000..30000ms');
const homeHoldMs = parsePauseHomeHold(values['home-hold-ms'], { scenario: values.scenario, activation: values.activation, durationMs });
const pauseCompact = parsePauseCompact(values['pause-compact'], { scenario: values.scenario, activation: values.activation, homeHoldMs });
const cycles = Number(values.cycles);
assert.ok(Number.isInteger(cycles) && cycles >= 1 && cycles <= 3);
const visibleWindow = parseVisibleWindow(values);
if (visibleWindow) await assertFreshWindowGate(visibleWindow);
const output = values.output;
await mkdir(dirname(output), { recursive: true });
await mkdir(output);
const { chromium } = await import(pathToFileURL(values['playwright-module']));
let browser, page, windowConfirmation;
const errors = [], inputs = [];
const state = () => page.locator('.console-stage').evaluate(host => ({ ...host.dataset, announcement: host.querySelector('[aria-live]')?.textContent }));
try {
browser = await chromium.launch(animationBrowserLaunchOptions(values['browser-executable'], visibleWindow));
page = await browser.newPage({ viewport: { width: Number(values.width), height: Number(values.height) } });
await page.emulateMedia({ reducedMotion: values['reduced-motion'] ? 'reduce' : 'no-preference' });
page.on('pageerror', error => errors.push(String(error)));
if (visibleWindow) windowConfirmation = await waitForVisibleWindow(visibleWindow, page, join(output, 'visible-window.json'));
const clickTarget = async (target, input) => {
  const point = await page.locator('.console-stage').evaluate((host, key) => JSON.parse(host.dataset.targets)[key], target);
  assert.ok(Array.isArray(point) && point.length === 2 && point.every(Number.isFinite), `Projected target ${target}`);
  const viewport = page.viewportSize();
  assert.ok(point[0] >= 0 && point[0] < viewport.width && point[1] >= 0 && point[1] < viewport.height, 'Touch is inside viewport');
  inputs.push({ ...input, target, point, at: Date.now() });
  await page.mouse.click(point[0], point[1]);
};
const touch = (x, y) => clickTarget(`Touch_${x}_${y}`, { kind: 'touch', x, y });
const physical = button => clickTarget(`Button_${button}`, { kind: 'physical', button });
const key = async value => {
  inputs.push({ kind: 'key', value, at: Date.now() });
  await page.locator('.console-stage').focus();
  await page.keyboard.press(value);
};
const focusedKey = async value => {
  inputs.push({ kind: 'key', value, at: Date.now() });
  await page.keyboard.press(value);
};
const appletLabels = { notes: 'Game Notes', friends: 'Friend List', notifications: 'Notifications', browser: 'Internet Browser', miiverse: 'Miiverse' };
const accessible = async () => {
  const label = appletLabels[values.scenario];
  inputs.push({ kind: 'accessible-shortcut', label: `Open ${label}`, at: Date.now() });
  await page.getByRole('button', { name: `Open ${label}`, exact: true }).focus();
  await page.keyboard.press('Enter');
};
const selectTitle = () => selectAnimationTitle(title, { key, touch, wait: ms => page.waitForTimeout(ms) });
  await page.goto(values.url);
  await page.waitForSelector('.console-stage[data-ready="true"][data-intro="false"][data-menu="home"]', { timeout: 90000 });
  await page.waitForFunction(() => Boolean(document.querySelector('.console-stage')?.screenCanvases));
  await page.waitForTimeout(1000);
  const initial = await state();
  let folderSelection, folderIdentity, previousPauseCompact = null;
  if (values.scenario === 'pause') {
    await selectTitle();
    await key('Enter');
    await page.waitForFunction(() => document.querySelector('.console-stage').dataset.menu === 'app', { timeout: 30000 });
    await page.waitForTimeout(500);
  } else if (values.scenario === 'manual') {
    await selectTitle();
  } else if (values.scenario === 'folder') {
    // An empty slot's ordinary Open action creates a native folder.
    if (values['folder-fixture'] === 'native-six-rows') {
      assert.equal(initial.rows, '2');
      for (let n = 0; n < 4; n++) { await touch(307, 16); await page.waitForTimeout(300); }
      assert.equal((await state()).rows, '6');
      await touch(136, 160);
      await page.waitForTimeout(300);
    } else {
      for (let n = 0; n < 7; n++) { await key('ArrowRight'); await page.waitForTimeout(180); }
      assert.equal((await state()).selected, '14');
    }
    const vacant = await state();
    assert.equal(vacant.menu, 'home');
    assert.match(vacant.announcement, /Empty slot/);
    folderSelection = vacant.selected;
    await touch(210, 226);
    await page.waitForTimeout(300);
    const created = JSON.parse((await state()).folderBanner).selection;
    assert.equal(created?.kind, 'folder');
    folderIdentity = created.key;
  } else if (values.activation !== 'accessible') {
    const x = { notes: 70, friends: 105, notifications: 145, browser: 190, miiverse: 235 }[values.scenario];
    await touch(x, 16);
    await page.waitForTimeout(300);
  }
  for (let cycle = 0; cycle < cycles; cycle++) {
  const cycleInputOffset = inputs.length;
  if (cycle > 0) {
    if (previousPauseCompact) await restorePauseCompactSelection(previousPauseCompact, { key,
      waitForReady: request => page.waitForFunction(pauseCompactRestoreReady, request, { timeout: 10000 }) });
    await key(values.scenario === 'folder' || values.scenario === 'manual' ? 'Escape' : values.scenario === 'pause' ? 'Enter' : 'h');
    await page.waitForFunction(menu => document.querySelector('.console-stage').dataset.menu === menu, values.scenario === 'pause' ? 'app' : 'home');
    await page.waitForTimeout(500);
  }
  let folderPreparation = null;
  let pausePreparation = null;
  if (values.scenario === 'pause') {
    const requested = { app: pauseApp, nativeStatus: pauseNativeStatus };
    const active = await page.waitForFunction(pauseCapturePrecondition, requested, { timeout: 30000 });
    const identity = await active.jsonValue();
    await active.dispose();
    const prepared = await page.waitForFunction(pauseCapturePrecondition, { ...requested, after: identity }, { timeout: 10000 });
    await prepared.dispose();
    pausePreparation = { identity, app: pauseApp, nativeStatus: pauseNativeStatus,
      method: 'Wait for the exact foreground app, its stock-ready or portfolio-inactive native status, then a later valid paired app render before HOME.',
      adaptation: 'Browser fixture preparation wait; not a recovered native input epoch or duration.' };
  }
  if (values.scenario === 'folder') {
    const active = await page.waitForFunction(folderCapturePrecondition,
      { folderIdentity, folderSelection }, { timeout: 10000 });
    const identity = await active.jsonValue();
    await active.dispose();
    const prepared = await page.waitForFunction(folderCapturePrecondition,
      { folderIdentity, folderSelection, after: identity }, { timeout: 10000 });
    await prepared.dispose();
    folderPreparation = {
      identity,
      method: 'Snapshot matching active native folder generation/request/activation, then wait for a later fresh valid paired WebGL root receipt while that identity remains current.',
      adaptation: 'Browser fixture preparation wait; not a recovered native input epoch or duration.',
    };
  }
  const before = await state();
  if (values.scenario === 'manual') validateManualCaptureOrigin(before, title);
  if (values.scenario === 'pause') {
    assert.equal(before.menu, 'app');
    assert.equal(before.app, pauseApp, 'Requested pause owner is foreground');
    assert.equal(before.nativeScreen, pauseNativeStatus, 'Pause begins from the requested stock or portfolio screen');
  }
  if (values.scenario === 'folder') {
    assert.equal(before.menu, 'home');
    assert.equal(before.selected, folderSelection);
    const selection = JSON.parse(before.folderBanner).selection;
    assert.equal(selection?.kind, 'folder');
    assert.equal(selection.key, folderIdentity);
  }
  if (pauseCompact) await page.locator('.console-stage').focus();
  await page.evaluate(collectAnimationFrames, pauseCompact ? { durationMs, pauseCompact: true } : durationMs);
  let pauseHomeHold = null, pauseHomeHoldFailure = null;
  if (values.scenario === 'pause' && homeHoldMs !== null) {
    ({ pauseHomeHold, pauseHomeHoldFailure } = await attemptPauseHomeHold(page, values.activation, homeHoldMs, inputs));
  }
  else if (values.scenario === 'pause') {
    if (!pauseCompact) values.activation === 'physical' ? await physical('HOME') : await key('h');
  }
  else if (values.scenario === 'manual') await touch(50, 226);
  else if (values.activation === 'tile') await touch(136, 160);
  else if (values.activation === 'accessible') await accessible();
  else if (values.activation === 'physical') await physical('A');
  else if (values.activation === 'touch') await touch(160, 226);
  else await key('Enter');
  const compactSelection = pauseCompact && !pauseHomeHoldFailure
    ? await selectPauseCompact(true, pauseApp, before.selected, { key: focusedKey, state,
      activateHome: () => values.activation === 'physical' ? physical('HOME') : focusedKey('h'),
      observeTap: press => observePauseCompactArrowRight(page, press),
      waitForSelection: request => page.waitForFunction(pauseCompactSelectionChanged, request, { timeout: 10000 }) }) : null;
  previousPauseCompact = compactSelection;
  await page.waitForFunction(() => window.animationCapture.done, { timeout: durationMs + 10000 });
  const frames = await page.evaluate(() => window.animationCapture.frames), reports = [];
  const after = await state();
  for (const [index, frame] of frames.entries()) {
    const id = String(index).padStart(3, '0'), files = {};
    for (const screen of ['top', 'bottom']) {
      const bytes = Buffer.from(frame[screen].split(',')[1], 'base64'), filename = `${cycle ? `repeat-${cycle}-` : ''}${id}-${screen}.png`;
      assert.equal(bytes.readUInt32BE(16), screen === 'top' ? 400 : 320, 'Raw native LCD width');
      assert.equal(bytes.readUInt32BE(20), 240, 'Raw native LCD height');
      await writeFile(join(output, filename), bytes);
      files[screen] = { filename, sha256: createHash('sha256').update(bytes).digest('hex') };
    }
    reports.push({ index, at: frame.at, ...(homeHoldMs !== null ? { homeHoldActive: Boolean(frame.homeHoldActive) } : {}),
      ...(pauseCompact ? { compactArrowRightActive: frame.compactArrowRightActive ?? null,
        compactArrowRightEventCount: frame.compactArrowRightEventCount ?? null } : {}), data: frame.data, files });
  }
  await page.screenshot({ path: join(output, `${cycle ? `repeat-${cycle}-` : ''}console.png`) });
  const result = { valid: false, durationMs, scenario: values.scenario, title: ['manual', 'pause'].includes(values.scenario) ? title : values.scenario, commit: values.commit, commitAttestation: 'Coordinator-supplied served-build identity; not independently discovered by this script.', cycle, activation: values.activation, folderFixture: values['folder-fixture'], reducedMotion: values['reduced-motion'], url: values.url, viewport: page.viewportSize(), muted: true,
    ...(windowConfirmation ? { visibleWindow: windowConfirmation } : {}),
    method: 'Actual browser inputs; chronological raw screen paints. No diagnostic repaint or closest-pose search.',
    ...(values.activation === 'accessible' ? { adaptation: 'Keyboard activation of the existing screen-reader shortcut from the grid; not a native toolbar input or animation-acceptance scenario.' } : {}),
    initial, before, folderPreparation, pausePreparation, ...(pauseHomeHold ? { pauseHomeHold } : {}),
    ...(pauseHomeHoldFailure ? { pauseHomeHoldFailure } : {}), inputs, cycleInputs: inputs.slice(cycleInputOffset), after, frames: reports, errors, nativeCompared: false };
  if (pauseCompact) Object.assign(result, { pauseCompact: true, compactSelection,
    compactEvidence: compactSelection ? pauseCompactEvidence(reports, compactSelection, values['reduced-motion']) : null });
  await writeInitialCapture(join(output, `${cycle ? `repeat-${cycle}-` : ''}capture.json`), result);
  assert.ok(frames.length > 2, 'Transition has chronological raw LCD paints');
  assert.deepEqual(errors, [], 'No browser page errors');
  assert.ok(frames.every(frame => frame.data.nativeScreen !== 'error'), 'No native screen recovery during the captured transition');
  assert.equal(after.menu, values.scenario === 'folder' ? 'folder' : values.scenario === 'pause' ? 'home' : 'app', 'Scenario reaches its expected menu');
  assert.notEqual(after.nativeScreen, 'error', `Native screen recovery: ${after.nativeScreenFailure}`);
  if (values.scenario !== 'pause') assert.equal(after.nativeScreen, 'ready', 'Destination reaches paired native readiness');
  if (values.scenario === 'manual') validateManualCaptureDestination(after, title);
  if (values.scenario === 'pause') assert.equal(after.app, pauseApp, 'HOME retains the requested suspended app');
  if (pauseCompact) {
    validatePauseCompactDestination(after, compactSelection);
    assert.ok(result.compactEvidence?.firstMatchingReceipt, 'Compact pause requires a captured valid matching HOME pair');
  }
  if (Object.hasOwn(appletLabels, values.scenario)) assert.equal(after.announcement?.split('. ')[0], appletLabels[values.scenario], 'Requested applet is the active destination');
  if (values.scenario === 'folder') assert.equal(after.selected, folderSelection);
  result.valid = true;
  await writeFile(join(output, `${cycle ? `repeat-${cycle}-` : ''}capture.json`), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ scenario: result.scenario, frames: reports.length, menu: result.after.menu, phase: result.after.phase, errors, output }));
  }
} catch (error) {
  const failedState = page ? await state().catch(() => null) : null;
  if (page) await page.screenshot({ path: join(output, 'failure-console.png') }).catch(() => {});
  await writeFile(join(output, 'failure.json'), JSON.stringify({ valid: false, scenario: values.scenario, title, commit: values.commit,
    ...(visibleWindow ? { visibleWindow, windowConfirmation: windowConfirmation ?? null } : {}),
    ...(pauseCompact ? { pauseCompact: true } : {}), failedState, inputs, errors, error: String(error), nativeCompared: false }, null, 2) + '\n');
  throw error;
} finally {
  if (browser) await browser.close();
}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
