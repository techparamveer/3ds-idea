#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import sharp from 'sharp';

const { values } = parseArgs({ options: {
  native: { type: 'string' }, browser: { type: 'string' },
  'artifact-dir': { type: 'string' }, name: { type: 'string' },
} });
for (const key of ['native', 'browser', 'artifact-dir']) {
  if (!values[key] || !path.isAbsolute(values[key])) throw new Error(`--${key} must be an absolute path`);
}
if (!values.name || !/^[a-z0-9][a-z0-9-]*$/.test(values.name)) throw new Error('--name must be a simple lowercase filename prefix');
await fs.mkdir(values['artifact-dir'], { recursive: true });
const out = suffix => path.join(values['artifact-dir'], `${values.name}-${suffix}`);

// Azahar's native-resolution combined screenshot centers320x240 below400x240.
const nativeImage = sharp(values.native);
const nativeInfo = await nativeImage.metadata();
if (nativeInfo.width !== 400 || nativeInfo.height !== 480) throw new Error('Expected a native400x480 combined screenshot');
const native = await nativeImage.extract({ left: 40, top: 240, width: 320, height: 240 }).ensureAlpha().raw().toBuffer();
let capture = JSON.parse(await fs.readFile(values.browser, 'utf8'));
if (typeof capture === 'string') capture = JSON.parse(capture); // CLI eval may JSON-wrap its result.
if (!/^data:image\/png;base64,/.test(capture.bottom ?? '')) throw new Error('Expected captureScreensAt JSON with a PNG bottom LCD');
const browserImage = sharp(Buffer.from(capture.bottom.split(',')[1], 'base64'));
const browserInfo = await browserImage.metadata();
if (browserInfo.width !== 320 || browserInfo.height !== 240) throw new Error('Expected browser320x240 lower LCD');
const browser = await browserImage.ensureAlpha().raw().toBuffer();

// These rectangles compare density1 folder geometry with child0 selected.
// They deliberately omit the cursor and differing parent application artwork.
// Notification badges and all upper-display animation phases need separate checks.
const regions = {
  densityDecrease: [269, 5, 24, 24],
  densityIncrease: [294, 5, 24, 24],
  panelInterior: [120, 74, 150, 30],
  backTab: [25, 43, 68, 21],
  leftShadow: [0, 80, 20, 40],
  upperUnderlay: [100, 39, 180, 20],
  capturedBottom: [100, 218, 180, 22],
  secondVacancy: [140, 122, 41, 40],
  thirdVacancy: [224, 122, 41, 40],
};
const report = {
  native: values.native, browser: values.browser,
  scope: 'Static lower-LCD regions only; no whole-screen, cursor-phase or animation-parity assertion.',
  browserCapture: { elapsedMs: capture.elapsedMs, date: capture.date, homeUpdates: capture.homeUpdates },
  regions: {},
};
for (const [name, [x, y, width, height]] of Object.entries(regions)) {
  let sum = 0, max = 0, changedPixels = 0;
  for (let py = y; py < y + height; py++) for (let px = x; px < x + width; px++) {
    const index = (py * 320 + px) * 4;
    let changed = false;
    for (let c = 0; c < 3; c++) {
      const difference = Math.abs(native[index + c] - browser[index + c]);
      sum += difference; max = Math.max(max, difference); changed ||= difference !== 0;
    }
    if (changed) changedPixels++;
  }
  report.regions[name] = { rect: [x, y, width, height], changedPixels, rgbMeanAbsoluteError: sum / (width * height * 3), maxChannelError: max };
}
for (const [name, pixels] of [['native', native], ['browser', browser]]) {
  await sharp(pixels, { raw: { width: 320, height: 240, channels: 4 } }).png().toFile(out(`${name}.png`));
}
await fs.writeFile(out('comparison.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
