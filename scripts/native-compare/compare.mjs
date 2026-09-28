#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {readFile, mkdir, writeFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const LCDS = {upper: {width: 400, height: 240}, lower: {width: 320, height: 240}};
const ALLOWED_MASKS = new Set(['live-clock-battery', 'portfolio-content', 'camera-footer', 'inert-ok', 'feature-map-adaptation']);

export function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (!key.startsWith('--') || !argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error(`Expected value after ${key}`);
    options[key.slice(2)] = argv[++i];
  }
  for (const required of ['native', 'browser', 'mask', 'out', 'scenario', 'commit']) {
    if (!options[required]) throw new Error(`Missing --${required}`);
  }
  return options;
}

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

async function loadLcd(file, side, screen) {
  const bytes = await readFile(file);
  const meta = await sharp(bytes).metadata();
  const {width, height} = LCDS[screen];
  let image = sharp(bytes);
  if (meta.width === 400 && meta.height === 480) {
    image = image.extract(screen === 'upper'
      ? {left: 0, top: 0, width: 400, height: 240}
      : {left: 40, top: 240, width: 320, height: 240});
  } else if (meta.width !== width || meta.height !== height) {
    throw new Error(`${side} ${screen}: ${file} is ${meta.width}x${meta.height}; expected ${width}x${height} or 400x480`);
  }
  const {data, info} = await image.removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject: true});
  if (info.channels !== 3) throw new Error(`${side} ${screen}: expected RGB pixels`);
  return {file: path.resolve(file), sha256: sha256(bytes), pixels: data};
}

async function resolveInputs(input, side) {
  const location = path.resolve(input);
  const s = await stat(location);
  if (s.isFile()) {
    if (side === 'browser') throw new Error('browser: provide separate upper.png and lower.png render-target captures');
    return {upper: location, lower: location};
  }
  if (!s.isDirectory()) throw new Error(`${side}: expected PNG or directory`);
  const files = {};
  for (const screen of Object.keys(LCDS)) {
    const candidates = [`${screen}.png`, `${screen}-lcd.png`, `lcd-${screen}.png`];
    for (const candidate of candidates) {
      const file = path.join(location, candidate);
      try { if ((await stat(file)).isFile()) { files[screen] = file; break; } } catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    if (!files[screen]) throw new Error(`${side}: missing ${screen} PNG in ${location}; expected ${candidates.join(', ')}`);
  }
  return files;
}

export function validateMask(mask) {
  if (!mask || typeof mask !== 'object' || !Array.isArray(mask.regions)) throw new Error('Mask needs a regions array');
  const coverage = {};
  for (const screen of Object.keys(LCDS)) coverage[screen] = new Uint8Array(LCDS[screen].width * LCDS[screen].height);
  for (const [index, region] of mask.regions.entries()) {
    const prefix = `mask region ${index}`;
    const size = LCDS[region.screen];
    if (!size) throw new Error(`${prefix}: invalid screen`);
    if (!ALLOWED_MASKS.has(region.category)) throw new Error(`${prefix}: invalid category`);
    if (typeof region.reason !== 'string' || !region.reason.trim()) throw new Error(`${prefix}: reason required`);
    if (region.category === 'feature-map-adaptation' &&
        (typeof region.featureMapRef !== 'string' || !region.featureMapRef.trim())) {
      throw new Error(`${prefix}: featureMapRef required`);
    }
    const {x, y, width, height} = region;
    if (![x, y, width, height].every(Number.isInteger) || x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > size.width || y + height > size.height) {
      throw new Error(`${prefix}: rectangle outside ${region.screen} LCD`);
    }
    for (let row = y; row < y + height; row++) coverage[region.screen].fill(1, row * size.width + x, row * size.width + x + width);
  }
  return coverage;
}

export function comparePixels(native, browser, width, height, coverage, threshold = 2) {
  if (native.length !== width * height * 3 || browser.length !== native.length || coverage.length !== width * height) throw new Error('Pixel dimensions differ');
  const flagged = new Uint8Array(width * height);
  const heatmap = Buffer.alloc(width * height * 3);
  let masked = 0, compared = 0, totalError = 0, maxRgbError = 0, overThreshold = 0;
  for (let i = 0; i < width * height; i++) {
    if (coverage[i]) { masked++; continue; }
    compared++;
    const p = i * 3;
    const delta = Math.max(Math.abs(native[p] - browser[p]), Math.abs(native[p + 1] - browser[p + 1]), Math.abs(native[p + 2] - browser[p + 2]));
    for (let c = 0; c < 3; c++) totalError += Math.abs(native[p + c] - browser[p + c]);
    maxRgbError = Math.max(maxRgbError, delta);
    if (delta > threshold) { flagged[i] = 1; overThreshold++; }
    heatmap[p] = delta; // red intensity is the largest channel error
    heatmap[p + 1] = delta > threshold ? 0 : delta;
    heatmap[p + 2] = 0;
  }
  return {
    metrics: {width, height, comparedPixels: compared, maskedPixels: masked, meanRgbError: compared ? totalError / (compared * 3) : null, maxRgbError: compared ? maxRgbError : null, pixelsOverThreshold: overThreshold, threshold},
    heatmap,
    regions: connectedRegions(flagged, width, height),
  };
}

export function connectedRegions(flagged, width, height) {
  const seen = new Uint8Array(flagged.length), regions = [];
  for (let start = 0; start < flagged.length; start++) {
    if (!flagged[start] || seen[start]) continue;
    const queue = [start]; seen[start] = 1;
    let head = 0, count = 0, left = width, top = height, right = -1, bottom = -1;
    while (head < queue.length) {
      const p = queue[head++], x = p % width, y = Math.floor(p / width);
      count++; left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
      for (const neighbor of [x > 0 ? p - 1 : -1, x + 1 < width ? p + 1 : -1, y > 0 ? p - width : -1, y + 1 < height ? p + width : -1]) {
        if (neighbor >= 0 && flagged[neighbor] && !seen[neighbor]) { seen[neighbor] = 1; queue.push(neighbor); }
      }
    }
    regions.push({x: left, y: top, width: right - left + 1, height: bottom - top + 1, pixelCount: count});
  }
  return regions.sort((a, b) => b.pixelCount - a.pixelCount || a.y - b.y || a.x - b.x);
}

async function png(pixels, width, height) { return sharp(pixels, {raw: {width, height, channels: 3}}).png().toBuffer(); }

async function contactSheet(native, browser, heatmap, width, height) {
  const pad = 8, cellWidth = width, sheetWidth = cellWidth * 3 + pad * 4, sheetHeight = height + pad * 2;
  const images = await Promise.all([native, browser, heatmap].map(p => png(p, width, height)));
  return sharp({create: {width: sheetWidth, height: sheetHeight, channels: 3, background: '#242424'}})
    .composite(images.map((input, index) => ({input, left: pad + index * (cellWidth + pad), top: pad}))).png().toBuffer();
}

export async function run(options) {
  const nativeFiles = await resolveInputs(options.native, 'native');
  const browserFiles = await resolveInputs(options.browser, 'browser');
  const maskFile = path.resolve(options.mask), maskBytes = await readFile(maskFile);
  const mask = JSON.parse(maskBytes.toString('utf8'));
  const coverage = validateMask(mask);
  const out = path.resolve(options.out);
  await mkdir(out, {recursive: true});
  const report = {schemaVersion: 1, scenarioId: options.scenario, commit: options.commit || null, threshold: 2,
    mask: {file: maskFile, sha256: sha256(maskBytes), regions: mask.regions}, screens: {}, result: 'unexplained-differences'};
  for (const [screen, size] of Object.entries(LCDS)) {
    const [native, browser] = await Promise.all([
      loadLcd(nativeFiles[screen], 'native', screen), loadLcd(browserFiles[screen], 'browser', screen),
    ]);
    const {metrics, regions, heatmap} = comparePixels(native.pixels, browser.pixels, size.width, size.height, coverage[screen]);
    if (metrics.comparedPixels === 0) throw new Error(`${screen}: mask covers the entire LCD`);
    const heatPath = path.join(out, `${screen}-heatmap.png`), sheetPath = path.join(out, `${screen}-contact-sheet.png`);
    await Promise.all([writeFile(heatPath, await png(heatmap, size.width, size.height)), writeFile(sheetPath, await contactSheet(native.pixels, browser.pixels, heatmap, size.width, size.height))]);
    report.screens[screen] = {...metrics, native: {file: native.file, sha256: native.sha256}, browser: {file: browser.file, sha256: browser.sha256}, regions, heatmap: heatPath, contactSheet: sheetPath};
  }
  if (Object.values(report.screens).every(screen => screen.pixelsOverThreshold === 0)) report.result = 'pixel-threshold-pass';
  const reportPath = path.join(out, 'report.json');
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
  return {report, reportPath};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const {report, reportPath} = await run(parseArgs(process.argv.slice(2)));
    process.stdout.write(`${reportPath}\n${report.result}\n`);
    process.exitCode = report.result === 'pixel-threshold-pass' ? 0 : 2;
  } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
