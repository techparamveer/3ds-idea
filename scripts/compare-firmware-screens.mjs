/** Compare captured framebuffers without treating intentional content differences as acceptance. */
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import sharp from 'sharp';
import { artifactPath } from './artifact-path.mjs';

const { values } = parseArgs({ options: {
  native: { type: 'string' }, 'browser-top': { type: 'string' },
  'browser-bottom': { type: 'string' }, regions: { type: 'string' },
  suite: { type: 'string', default: 'home-comparison' },
} });
for (const key of ['native', 'browser-top', 'browser-bottom']) {
  if (!values[key]) throw new Error(`Missing --${key} image path`);
}
const out = artifactPath(values.suite);
const sources = {};
async function source(key) {
  const path = resolve(values[key]), data = await readFile(path);
  sources[key] = { path, sha256: createHash('sha256').update(data).digest('hex') };
  return data;
}
const [native, top, bottom] = await Promise.all(['native', 'browser-top', 'browser-bottom'].map(source));
const [nm, tm, bm] = await Promise.all([native, top, bottom].map(data => sharp(data).metadata()));
if (nm.width !== 400 || nm.height !== 480) throw new Error('Native capture must be Azahar 400×480');
if (![400, 800].includes(tm.width) || tm.height !== 240) throw new Error('Browser top must be 400×240 or its 800×240 adapter');
if (bm.width !== 320 || bm.height !== 240) throw new Error('Browser bottom must be 320×240');
const screens = {
  top: {
    width: 400,
    native: await sharp(native).extract({ left: 0, top: 0, width: 400, height: 240 }).ensureAlpha().raw().toBuffer(),
    // The 800-wide texture doubles native horizontal pixels; cover/crop would lose half the screen.
    browser: await sharp(top).resize(400, 240, { fit: 'fill', kernel: 'nearest' }).ensureAlpha().raw().toBuffer(),
  },
  bottom: {
    width: 320,
    native: await sharp(native).extract({ left: 40, top: 240, width: 320, height: 240 }).ensureAlpha().raw().toBuffer(),
    browser: await sharp(bottom).ensureAlpha().raw().toBuffer(),
  },
};
const regions = values.regions ? JSON.parse(await readFile(values.regions, 'utf8')) :
  Object.entries(screens).map(([screen, { width }]) => ({ name: screen, screen, bounds: [0, 0, width, 240] }));
const measurements = [];
for (const region of regions) {
  const screen = screens[region.screen], [x, y, width, height] = region.bounds ?? [];
  if (!screen || ![x, y, width, height].every(Number.isInteger) || x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > screen.width || y + height > 240) throw new Error(`Invalid region: ${region.name}`);
  let sum = 0, squared = 0, exact = 0, changed = 0;
  for (let row = y; row < y + height; row++) for (let col = x; col < x + width; col++) {
    const offset = (row * screen.width + col) * 4;
    let max = 0;
    for (let c = 0; c < 3; c++) {
      const d = Math.abs(screen.native[offset + c] - screen.browser[offset + c]);
      sum += d; squared += d * d; max = Math.max(max, d);
    }
    if (!max) exact++;
    if (max > 8) changed++;
  }
  const pixels = width * height;
  measurements.push({ ...region, pixels, meanAbsoluteRgbError: sum / (pixels * 3),
    rootMeanSquareRgbError: Math.sqrt(squared / (pixels * 3)), exactPixels: exact,
    pixelsWithAnyChannelDifferenceOver8: changed });
}
for (const [name, screen] of Object.entries(screens)) {
  const raw = { width: screen.width, height: 240, channels: 4 };
  const diff = Buffer.alloc(screen.native.length);
  for (let i = 0; i < diff.length; i += 4) {
    for (let c = 0; c < 3; c++) diff[i + c] = Math.min(255, Math.abs(screen.native[i + c] - screen.browser[i + c]) * 3);
    diff[i + 3] = 255;
  }
  await sharp({ create: { width: screen.width * 3, height: 240, channels: 4, background: '#000' } })
    .composite([
      { input: screen.native, raw, left: 0, top: 0 },
      { input: screen.browser, raw, left: screen.width, top: 0 },
      { input: diff, raw, left: screen.width * 2, top: 0 },
    ]).png().toFile(join(out, `${name}-native-browser-difference.png`));
}
const report = { schema: 1, sources, normalization: 'Native upper 400×240; lower 320×240 at (40,240). Browser upper adapter resampled with nearest fit:fill.',
  visualization: 'Native, browser, then absolute RGB difference amplified 3×.',
  acceptance: 'Measurements only. Scene, clock, phase and intentional content differences must be reviewed; no automatic fidelity claim.', measurements };
await writeFile(join(out, 'comparison.json'), JSON.stringify(report, null, 2) + '\n');
console.log(join(out, 'comparison.json'));
