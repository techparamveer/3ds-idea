import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: {
  'playwright-module': { type: 'string' }, 'browser-executable': { type: 'string' },
  output: { type: 'string' }, scenario: { type: 'string', default: 'notes' },
  url: { type: 'string', default: 'http://127.0.0.1:3021/?lcdCapture=1' },
  width: { type: 'string', default: '1440' }, height: { type: 'string', default: '1000' },
} });
for (const key of ['playwright-module', 'browser-executable', 'output']) assert.ok(isAbsolute(values[key] ?? ''), key);
assert.ok(['notes', 'friends', 'notifications', 'browser', 'miiverse', 'manual', 'folder', 'pause'].includes(values.scenario));
const { chromium } = await import(pathToFileURL(values['playwright-module']));
const browser = await chromium.launch({ executablePath: values['browser-executable'], headless: true, args: ['--mute-audio'] });
const page = await browser.newPage({ viewport: { width: Number(values.width), height: Number(values.height) } });
const errors = [], inputs = [], output = values.output;
page.on('pageerror', error => errors.push(String(error)));
await mkdir(output, { recursive: true });
const state = () => page.locator('.console-stage').evaluate(host => ({ ...host.dataset }));
const touch = async (x, y) => {
  const point = await page.locator('.console-stage').evaluate((host, key) => JSON.parse(host.dataset.targets)[key], `Touch_${x}_${y}`);
  assert.ok(Array.isArray(point) && point.length === 2 && point.every(Number.isFinite), `Projected touch ${x},${y}`);
  const viewport = page.viewportSize();
  assert.ok(point[0] >= 0 && point[0] < viewport.width && point[1] >= 0 && point[1] < viewport.height, 'Touch is inside viewport');
  inputs.push({ kind: 'touch', x, y, point, at: Date.now() });
  await page.mouse.click(point[0], point[1]);
};
const key = async value => {
  inputs.push({ kind: 'key', value, at: Date.now() });
  await page.locator('.console-stage').focus();
  await page.keyboard.press(value);
};
try {
  await page.goto(values.url);
  await page.waitForSelector('.console-stage[data-ready="true"][data-intro="false"][data-menu="home"]', { timeout: 90000 });
  await page.waitForFunction(() => Boolean(document.querySelector('.console-stage')?.screenCanvases));
  await page.waitForTimeout(1000);
  const initial = await state();
  if (values.scenario === 'pause') {
    for (let n = 0; n < 4; n++) { await key('ArrowRight'); await page.waitForTimeout(180); }
    await key('Enter');
    await page.waitForFunction(() => document.querySelector('.console-stage').dataset.menu === 'app', { timeout: 30000 });
    await page.waitForTimeout(500);
  } else if (values.scenario === 'manual') {
    // Select Settings through ordinary navigation, without opening software.
    for (let n = 0; n < 4; n++) { await key('ArrowRight'); await page.waitForTimeout(180); }
    await key('ArrowDown');
    await page.waitForTimeout(300);
  } else if (values.scenario === 'folder') {
    // An empty slot's ordinary Open action creates a native folder.
    for (let n = 0; n < 7; n++) { await key('ArrowRight'); await page.waitForTimeout(180); }
    await touch(210, 226);
    await page.waitForTimeout(300);
  } else {
    const x = { notes: 70, friends: 105, notifications: 145, browser: 190, miiverse: 235 }[values.scenario];
    await touch(x, 16);
    await page.waitForTimeout(300);
  }
  const before = await state();
  await page.evaluate(() => {
    const host = document.querySelector('.console-stage'), frames = [], start = performance.now();
    window.animationCapture = { frames, start, done: false };
    let lastPaint = null;
    const sample = () => {
      const paint = host.dataset.screenPaint;
      if (paint !== lastPaint) {
        lastPaint = paint;
        frames.push({ at: performance.now() - start,
          data: Object.fromEntries(['menu', 'phase', 'app', 'nativeScreen', 'nativeScreenFailure', 'screenPaint', 'screenPresented', 'homeUpdates', 'folderClose', 'folderBanner', 'homeCursor'].map(k => [k, host.dataset[k]])),
          top: host.screenCanvases.top.toDataURL('image/png'), bottom: host.screenCanvases.bottom.toDataURL('image/png') });
      }
      if (performance.now() - start < 3500) requestAnimationFrame(sample);
      else window.animationCapture.done = true;
    };
    requestAnimationFrame(sample);
  });
  if (values.scenario === 'pause') await key('h');
  else if (values.scenario === 'manual') await touch(50, 226);
  else await key('Enter');
  await page.waitForFunction(() => window.animationCapture.done, { timeout: 10000 });
  const frames = await page.evaluate(() => window.animationCapture.frames), reports = [];
  assert.ok(frames.length > 2, 'Transition has chronological raw LCD paints');
  for (const [index, frame] of frames.entries()) {
    const id = String(index).padStart(3, '0'), files = {};
    for (const screen of ['top', 'bottom']) {
      const bytes = Buffer.from(frame[screen].split(',')[1], 'base64'), filename = `${id}-${screen}.png`;
      await writeFile(join(output, filename), bytes);
      files[screen] = { filename, sha256: createHash('sha256').update(bytes).digest('hex') };
    }
    reports.push({ index, at: frame.at, data: frame.data, files });
  }
  await page.screenshot({ path: join(output, 'console.png') });
  const result = { scenario: values.scenario, url: values.url, viewport: page.viewportSize(), muted: true,
    method: 'Actual browser inputs; chronological raw screen paints. No diagnostic repaint or closest-pose search.',
    initial, before, inputs, after: await state(), frames: reports, errors, nativeCompared: false };
  await writeFile(join(output, 'capture.json'), JSON.stringify(result, null, 2) + '\n');
  assert.deepEqual(errors, [], 'No browser page errors');
  assert.equal(result.after.menu, values.scenario === 'folder' ? 'folder' : values.scenario === 'pause' ? 'home' : 'app', 'Scenario reaches its expected menu');
  console.log(JSON.stringify({ scenario: result.scenario, frames: reports.length, menu: result.after.menu, phase: result.after.phase, errors, output }));
} catch (error) {
  await writeFile(join(output, 'failure.json'), JSON.stringify({ scenario: values.scenario, inputs, errors, error: String(error), nativeCompared: false }, null, 2) + '\n');
  throw error;
} finally {
  await browser.close();
}
