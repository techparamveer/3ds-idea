import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { folderCapturePrecondition } from './reference/folder-capture-precondition.mjs';
import { pauseCapturePrecondition } from './reference/pause-capture-precondition.mjs';

const { values } = parseArgs({ options: {
  'playwright-module': { type: 'string' }, 'browser-executable': { type: 'string' },
  output: { type: 'string' }, scenario: { type: 'string', default: 'notes' },
  url: { type: 'string', default: 'http://127.0.0.1:3021/?lcdCapture=1' },
  width: { type: 'string', default: '1440' }, height: { type: 'string', default: '1000' },
  activation: { type: 'string', default: 'key' }, cycles: { type: 'string', default: '1' },
  title: { type: 'string' }, commit: { type: 'string' },
  'folder-fixture': { type: 'string', default: 'baseline' },
  'duration-ms': { type: 'string', default: '3500' },
  'reduced-motion': { type: 'boolean', default: false },
} });
for (const key of ['playwright-module', 'browser-executable', 'output']) assert.ok(isAbsolute(values[key] ?? ''), key);
assert.ok(['notes', 'friends', 'notifications', 'browser', 'miiverse', 'manual', 'folder', 'pause'].includes(values.scenario));
assert.ok(['key', 'touch', 'physical', 'tile', 'accessible'].includes(values.activation));
if (values.activation === 'accessible') assert.ok(['notes', 'friends', 'notifications', 'browser', 'miiverse'].includes(values.scenario), 'Accessible shortcut is top-row-only');
assert.match(values.commit ?? '', /^[a-f0-9]{40}$/, 'Runtime commit must be supplied');
const title = values.title ?? (values.scenario === 'manual' ? 'settings' : 'health');
const pauseApp = { health: 'health-safety', camera: 'camera', sound: 'sound', portfolio: 'work' }[title];
const pauseNativeStatus = title === 'portfolio' ? 'inactive' : 'ready';
if (values.scenario === 'manual') assert.ok(['settings', 'camera', 'health'].includes(title));
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
const cycles = Number(values.cycles);
assert.ok(Number.isInteger(cycles) && cycles >= 1 && cycles <= 3);
const output = values.output;
await mkdir(dirname(output), { recursive: true });
await mkdir(output);
const { chromium } = await import(pathToFileURL(values['playwright-module']));
const browser = await chromium.launch({ executablePath: values['browser-executable'], headless: true, args: ['--mute-audio'] });
const page = await browser.newPage({ viewport: { width: Number(values.width), height: Number(values.height) } });
await page.emulateMedia({ reducedMotion: values['reduced-motion'] ? 'reduce' : 'no-preference' });
const errors = [], inputs = [];
page.on('pageerror', error => errors.push(String(error)));
const state = () => page.locator('.console-stage').evaluate(host => ({ ...host.dataset, announcement: host.querySelector('[aria-live]')?.textContent }));
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
const appletLabels = { notes: 'Game Notes', friends: 'Friend List', notifications: 'Notifications', browser: 'Internet Browser', miiverse: 'Miiverse' };
const accessible = async () => {
  const label = appletLabels[values.scenario];
  inputs.push({ kind: 'accessible-shortcut', label: `Open ${label}`, at: Date.now() });
  await page.getByRole('button', { name: `Open ${label}`, exact: true }).focus();
  await page.keyboard.press('Enter');
};
const selectTitle = async () => {
  const slot = { portfolio: 0, health: 8, settings: 9, camera: 10, sound: 7 }[title];
  for (let n = 0; n < Math.floor(slot / 2); n++) { await key('ArrowRight'); await page.waitForTimeout(180); }
  if (slot % 2) await key('ArrowDown');
  await page.waitForTimeout(300);
};
try {
  await page.goto(values.url);
  await page.waitForSelector('.console-stage[data-ready="true"][data-intro="false"][data-menu="home"]', { timeout: 90000 });
  await page.waitForFunction(() => Boolean(document.querySelector('.console-stage')?.screenCanvases));
  await page.waitForTimeout(1000);
  const initial = await state();
  let folderSelection, folderIdentity;
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
  await page.evaluate(durationMs => {
    const host = document.querySelector('.console-stage'), frames = [], start = performance.now();
    window.animationCapture = { frames, start, done: false };
    let lastPaint = null;
    const sample = () => {
      const paint = host.dataset.screenPaint, presented = JSON.parse(host.dataset.screenPresented ?? 'null');
      const identity = JSON.stringify([paint, presented?.paint, presented?.validPublication]);
      if (identity !== lastPaint) {
        lastPaint = identity;
        frames.push({ at: performance.now() - start,
          data: Object.fromEntries(['menu', 'phase', 'app', 'selected', 'rows', 'lastInput', 'nativeScreen', 'nativeScreenFailure', 'screenPaint', 'screenPresented', 'homeUpdates', 'folderClose', 'folderBanner', 'homeCursor'].map(k => [k, host.dataset[k]])),
          top: host.screenCanvases.top.toDataURL('image/png'), bottom: host.screenCanvases.bottom.toDataURL('image/png') });
      }
      if (performance.now() - start < durationMs) requestAnimationFrame(sample);
      else window.animationCapture.done = true;
    };
    sample();
  }, durationMs);
  if (values.scenario === 'pause') values.activation === 'physical' ? await physical('HOME') : await key('h');
  else if (values.scenario === 'manual') await touch(50, 226);
  else if (values.activation === 'tile') await touch(136, 160);
  else if (values.activation === 'accessible') await accessible();
  else if (values.activation === 'physical') await physical('A');
  else if (values.activation === 'touch') await touch(160, 226);
  else await key('Enter');
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
    reports.push({ index, at: frame.at, data: frame.data, files });
  }
  await page.screenshot({ path: join(output, `${cycle ? `repeat-${cycle}-` : ''}console.png`) });
  const result = { valid: false, durationMs, scenario: values.scenario, title: ['manual', 'pause'].includes(values.scenario) ? title : values.scenario, commit: values.commit, commitAttestation: 'Coordinator-supplied served-build identity; not independently discovered by this script.', cycle, activation: values.activation, folderFixture: values['folder-fixture'], reducedMotion: values['reduced-motion'], url: values.url, viewport: page.viewportSize(), muted: true,
    method: 'Actual browser inputs; chronological raw screen paints. No diagnostic repaint or closest-pose search.',
    ...(values.activation === 'accessible' ? { adaptation: 'Keyboard activation of the existing screen-reader shortcut from the grid; not a native toolbar input or animation-acceptance scenario.' } : {}),
    initial, before, folderPreparation, pausePreparation, inputs, cycleInputs: inputs.slice(cycleInputOffset), after, frames: reports, errors, nativeCompared: false };
  await writeFile(join(output, `${cycle ? `repeat-${cycle}-` : ''}capture.json`), JSON.stringify(result, null, 2) + '\n');
  assert.ok(frames.length > 2, 'Transition has chronological raw LCD paints');
  assert.deepEqual(errors, [], 'No browser page errors');
  assert.ok(frames.every(frame => frame.data.nativeScreen !== 'error'), 'No native screen recovery during the captured transition');
  assert.equal(after.menu, values.scenario === 'folder' ? 'folder' : values.scenario === 'pause' ? 'home' : 'app', 'Scenario reaches its expected menu');
  assert.notEqual(after.nativeScreen, 'error', `Native screen recovery: ${after.nativeScreenFailure}`);
  if (values.scenario !== 'pause') assert.equal(after.nativeScreen, 'ready', 'Destination reaches paired native readiness');
  if (values.scenario === 'pause') assert.equal(after.app, pauseApp, 'HOME retains the requested suspended app');
  if (Object.hasOwn(appletLabels, values.scenario)) assert.equal(after.announcement?.split('. ')[0], appletLabels[values.scenario], 'Requested applet is the active destination');
  if (values.scenario === 'folder') assert.equal(after.selected, folderSelection);
  result.valid = true;
  await writeFile(join(output, `${cycle ? `repeat-${cycle}-` : ''}capture.json`), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ scenario: result.scenario, frames: reports.length, menu: result.after.menu, phase: result.after.phase, errors, output }));
  }
} catch (error) {
  const failedState = await state().catch(() => null);
  await page.screenshot({ path: join(output, 'failure-console.png') }).catch(() => {});
  await writeFile(join(output, 'failure.json'), JSON.stringify({ valid: false, scenario: values.scenario, title, commit: values.commit,
    failedState, inputs, errors, error: String(error), nativeCompared: false }, null, 2) + '\n');
  throw error;
} finally {
  await browser.close();
}
