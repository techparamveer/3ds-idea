#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {isAbsolute, join} from 'node:path';
import {parseArgs} from 'node:util';
import sharp from 'sharp';

const {values: options} = parseArgs({options: {
  native: {type: 'string'}, browser: {type: 'string'}, baseline: {type: 'string'}, out: {type: 'string'},
}});
for (const key of ['native', 'browser', 'out']) assert.ok(isAbsolute(options[key] ?? ''), `--${key} must be absolute`);
if (options.baseline) assert.ok(isAbsolute(options.baseline), '--baseline must be absolute');

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const round = value => Number(value.toFixed(6));

async function decode(file, screen) {
  const bytes = await readFile(file);
  const metadata = await sharp(bytes).metadata();
  const size = screen === 'upper' ? {width: 400, height: 240} : {width: 320, height: 240};
  let image = sharp(bytes);
  if (metadata.width === 400 && metadata.height === 480) {
    image = image.extract(screen === 'upper'
      ? {left: 0, top: 0, width: 400, height: 240}
      : {left: 40, top: 240, width: 320, height: 240});
  } else {
    assert.deepEqual({width: metadata.width, height: metadata.height}, size, `${file} has an unexpected size`);
  }
  const decoded = await image.removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject: true});
  assert.equal(decoded.info.channels, 3);
  return {pixels: decoded.data, fileSha256: sha256(bytes), rgbSha256: sha256(decoded.data), ...size};
}

function compareRects(reference, candidate, width, height, rects, dx = 0, dy = 0) {
  let absolute = 0, squared = 0, maximum = 0, pixels = 0, pixelsAbove2 = 0, exact = 0;
  for (const [left, top, regionWidth, regionHeight] of rects) {
    for (let y = top; y < top + regionHeight; y++) for (let x = left; x < left + regionWidth; x++) {
      const candidateX = x + dx, candidateY = y + dy;
      if (candidateX < 0 || candidateX >= width || candidateY < 0 || candidateY >= height) continue;
      const a = (y * width + x) * 3, b = (candidateY * width + candidateX) * 3;
      let over = false, same = true;
      for (let channel = 0; channel < 3; channel++) {
        const difference = Math.abs(reference[a + channel] - candidate[b + channel]);
        absolute += difference; squared += difference * difference; maximum = Math.max(maximum, difference);
        if (difference > 2) over = true;
        if (difference !== 0) same = false;
      }
      pixels++; pixelsAbove2 += Number(over); exact += Number(same);
    }
  }
  assert.ok(pixels > 0);
  return {rects, dx, dy, pixelCount: pixels, pixelsAbove2,
    meanAbsoluteRgbDifference: round(absolute / (pixels * 3)),
    rmseRgbDifference: round(Math.sqrt(squared / (pixels * 3))),
    maxRgbDifference: maximum, exactRgbFraction: round(exact / pixels)};
}

function bestTranslation(reference, candidate, width, height, rects, xRange, yRange) {
  let best;
  for (let dx = xRange[0]; dx <= xRange[1]; dx++) for (let dy = yRange[0]; dy <= yRange[1]; dy++) {
    const result = compareRects(reference, candidate, width, height, rects, dx, dy);
    if (!best || result.rmseRgbDifference < best.rmseRgbDifference ||
      result.rmseRgbDifference === best.rmseRgbDifference && result.meanAbsoluteRgbDifference < best.meanAbsoluteRgbDifference) best = result;
  }
  return best;
}

function bestMaskTranslation(reference, candidate, width, height, rect, xRange, yRange, selected) {
  let best;
  for (let dx = xRange[0]; dx <= xRange[1]; dx++) for (let dy = yRange[0]; dy <= yRange[1]; dy++) {
    let referencePixels = 0, candidatePixels = 0, intersection = 0, union = 0;
    const [left, top, regionWidth, regionHeight] = rect;
    for (let y = top; y < top + regionHeight; y++) for (let x = left; x < left + regionWidth; x++) {
      const candidateX = x + dx, candidateY = y + dy;
      if (candidateX < 0 || candidateX >= width || candidateY < 0 || candidateY >= height) continue;
      const a = (y * width + x) * 3, b = (candidateY * width + candidateX) * 3;
      const referenceSelected = selected(reference, a), candidateSelected = selected(candidate, b);
      referencePixels += Number(referenceSelected); candidatePixels += Number(candidateSelected);
      intersection += Number(referenceSelected && candidateSelected); union += Number(referenceSelected || candidateSelected);
    }
    const result = {rect: [rect], dx, dy, referencePixels, candidatePixels, intersection, union, iou: round(intersection / union)};
    if (!best || result.iou > best.iou || result.iou === best.iou && result.intersection > best.intersection) best = result;
  }
  return best;
}

function coverageDiagnostics(reference, candidate, width, rect, selected, threshold = 2) {
  const groups = {
    sharedInk: {pixels: 0, pixelsAboveThreshold: 0},
    referenceOnlyInk: {pixels: 0, pixelsAboveThreshold: 0},
    candidateOnlyInk: {pixels: 0, pixelsAboveThreshold: 0},
    bothBelowInkThreshold: {pixels: 0, pixelsAboveThreshold: 0},
  };
  let referenceInkPixels = 0, candidateInkPixels = 0;
  const [left, top, regionWidth, regionHeight] = rect;
  for (let y = top; y < top + regionHeight; y++) for (let x = left; x < left + regionWidth; x++) {
    const index = (y * width + x) * 3;
    const referenceInk = selected(reference, index), candidateInk = selected(candidate, index);
    const group = referenceInk
      ? candidateInk ? groups.sharedInk : groups.referenceOnlyInk
      : candidateInk ? groups.candidateOnlyInk : groups.bothBelowInkThreshold;
    const maximumDifference = Math.max(...[0, 1, 2].map(channel => Math.abs(reference[index + channel] - candidate[index + channel])));
    group.pixels++;
    group.pixelsAboveThreshold += Number(maximumDifference > threshold);
    referenceInkPixels += Number(referenceInk);
    candidateInkPixels += Number(candidateInk);
  }
  const intersection = groups.sharedInk.pixels;
  const union = intersection + groups.referenceOnlyInk.pixels + groups.candidateOnlyInk.pixels;
  return {rect: [rect], threshold, referenceInkPixels, candidateInkPixels, intersection, union,
    iou: round(intersection / union), groups};
}

function textSupport(reference, candidate, width, height, rect, selected) {
  const [left, top, regionWidth, regionHeight] = rect;
  const union = new Uint8Array(width * height), support = new Uint8Array(width * height);
  for (let y = top; y < top + regionHeight; y++) for (let x = left; x < left + regionWidth; x++) {
    const index = (y * width + x) * 3;
    union[y * width + x] = Number(selected(reference, index) || selected(candidate, index));
  }
  for (let y = top; y < top + regionHeight; y++) for (let x = left; x < left + regionWidth; x++) {
    for (let neighborY = Math.max(top, y - 1); neighborY <= Math.min(top + regionHeight - 1, y + 1); neighborY++) {
      for (let neighborX = Math.max(left, x - 1); neighborX <= Math.min(left + regionWidth - 1, x + 1); neighborX++) {
        if (union[neighborY * width + neighborX]) support[y * width + x] = 1;
      }
    }
  }
  return support;
}

function bilinearCandidateFit(reference, candidate, width, height, rect, support, dx, dy) {
  const [left, top, regionWidth, regionHeight] = rect;
  let absolute = 0, squared = 0, pixels = 0;
  for (let y = top; y < top + regionHeight; y++) for (let x = left; x < left + regionWidth; x++) {
    if (!support[y * width + x]) continue;
    const sampleX = x + dx, sampleY = y + dy;
    const x0 = Math.floor(sampleX), y0 = Math.floor(sampleY), fractionX = sampleX - x0, fractionY = sampleY - y0;
    if (x0 < 0 || x0 + 1 >= width || y0 < 0 || y0 + 1 >= height) continue;
    const referenceIndex = (y * width + x) * 3;
    for (let channel = 0; channel < 3; channel++) {
      const topSample = candidate[(y0 * width + x0) * 3 + channel] * (1 - fractionX) +
        candidate[(y0 * width + x0 + 1) * 3 + channel] * fractionX;
      const bottomSample = candidate[((y0 + 1) * width + x0) * 3 + channel] * (1 - fractionX) +
        candidate[((y0 + 1) * width + x0 + 1) * 3 + channel] * fractionX;
      const difference = Math.abs(reference[referenceIndex + channel] -
        (topSample * (1 - fractionY) + bottomSample * fractionY));
      absolute += difference;
      squared += difference * difference;
    }
    pixels++;
  }
  assert.ok(pixels > 0);
  return {candidateSampleOffset: [round(dx), round(dy)], pixelCount: pixels,
    meanAbsoluteRgbDifference: round(absolute / (pixels * 3)),
    rmseRgbDifference: round(Math.sqrt(squared / (pixels * 3)))};
}

function fractionalSamplingDiagnostic(reference, candidate, width, height, rect, selected) {
  const support = textSupport(reference, candidate, width, height, rect, selected);
  const zero = bilinearCandidateFit(reference, candidate, width, height, rect, support, 0, 0);
  let best = zero;
  for (let yStep = -8; yStep <= 8; yStep++) for (let xStep = -8; xStep <= 8; xStep++) {
    const result = bilinearCandidateFit(reference, candidate, width, height, rect, support, xStep / 16, yStep / 16);
    const resultDistance = Math.abs(xStep) + Math.abs(yStep);
    const bestDistance = Math.abs(best.candidateSampleOffset[0] * 16) + Math.abs(best.candidateSampleOffset[1] * 16);
    if (result.rmseRgbDifference < best.rmseRgbDifference ||
      result.rmseRgbDifference === best.rmseRgbDifference && result.meanAbsoluteRgbDifference < best.meanAbsoluteRgbDifference ||
      result.rmseRgbDifference === best.rmseRgbDifference && result.meanAbsoluteRgbDifference === best.meanAbsoluteRgbDifference && resultDistance < bestDistance) best = result;
  }
  return {rect: [rect], support: 'one-pixel dilation of the zero-offset ink-mask union',
    search: {minimum: -0.5, maximum: 0.5, step: 0.0625, interpolation: 'bilinear candidate sampling'},
    zero, best, rmseImprovementFraction: round((zero.rmseRgbDifference - best.rmseRgbDifference) / zero.rmseRgbDifference)};
}

const nativeFile = options.native;
const browserFiles = {upper: join(options.browser, 'upper.png'), lower: join(options.browser, 'lower.png')};
const [nativeUpper, nativeLower, browserUpper, browserLower] = await Promise.all([
  decode(nativeFile, 'upper'), decode(nativeFile, 'lower'), decode(browserFiles.upper, 'upper'), decode(browserFiles.lower, 'lower'),
]);
const baselineFiles = options.baseline && {upper: join(options.baseline, 'upper.png'), lower: join(options.baseline, 'lower.png')};
const baseline = baselineFiles && {
  upper: await decode(baselineFiles.upper, 'upper'),
  lower: await decode(baselineFiles.lower, 'lower'),
};

const inputs = {upper: [nativeUpper, browserUpper], lower: [nativeLower, browserLower]};
const regions = {
  upper: {
    heading: [[0, 0, 400, 34]],
    list: [[88, 32, 224, 138]],
    backgroundQuiet: [[0, 0, 8, 240], [392, 0, 8, 240], [8, 30, 384, 3], [8, 168, 384, 3]],
    divider: [[0, 170, 400, 8]],
    footer: [[0, 178, 400, 62]],
  },
  lower: {
    background: [[0, 0, 320, 160]],
    softwareClosed: [[40, 86, 240, 50]],
    buttonArtwork: [[64, 162, 192, 40]],
    buttonLabel: [[104, 170, 112, 24]],
    divider: [[0, 209, 320, 8]],
    footer: [[0, 216, 320, 24]],
  },
};
const regionMetrics = {};
for (const [screen, entries] of Object.entries(regions)) {
  const [native, browser] = inputs[screen];
  regionMetrics[screen] = Object.fromEntries(Object.entries(entries).map(([name, rects]) =>
    [name, compareRects(native.pixels, browser.pixels, native.width, native.height, rects)]));
}
const beforeAfter = baseline && {};
if (baseline) for (const screen of ['upper', 'lower']) {
  const before = baseline[screen], after = screen === 'upper' ? browserUpper : browserLower;
  beforeAfter[screen] = {
    whole: compareRects(before.pixels, after.pixels, before.width, before.height, [[0, 0, before.width, before.height]]),
    regions: Object.fromEntries(Object.entries(regions[screen]).map(([name, rects]) =>
      [name, compareRects(before.pixels, after.pixels, before.width, before.height, rects)])),
  };
}

const rgbTranslationFits = {
  upperFirstListBlock: bestTranslation(nativeUpper.pixels, browserUpper.pixels, 400, 240, [[88, 40, 224, 48]], [-3, 3], [-20, 20]),
  upperLaterListBlocks: bestTranslation(nativeUpper.pixels, browserUpper.pixels, 400, 240, [[88, 90, 224, 80]], [-3, 3], [-3, 3]),
  lowerButtonLabel: bestTranslation(nativeLower.pixels, browserLower.pixels, 320, 240, [[104, 170, 112, 24]], [-4, 4], [-4, 4]),
};
const lightText = (pixels, index) => Math.min(pixels[index], pixels[index + 1], pixels[index + 2]) > 100;
const darkButtonText = (pixels, index) => Math.max(pixels[index], pixels[index + 1], pixels[index + 2]) < 130;
const maskTranslationFits = {
  upperFirstListBlock: bestMaskTranslation(nativeUpper.pixels, browserUpper.pixels, 400, 240, [88, 48, 224, 38], [-3, 3], [-20, 20], lightText),
  upperSecondListBlock: bestMaskTranslation(nativeUpper.pixels, browserUpper.pixels, 400, 240, [88, 92, 224, 18], [-3, 3], [-4, 4], lightText),
  upperThirdListBlock: bestMaskTranslation(nativeUpper.pixels, browserUpper.pixels, 400, 240, [88, 118, 224, 40], [-3, 3], [-20, 20], lightText),
  lowerButtonLabel: bestMaskTranslation(nativeLower.pixels, browserLower.pixels, 320, 240, [104, 170, 112, 24], [-4, 4], [-4, 4], darkButtonText),
};
const rasterCases = {
  upperFirstListBlock: {reference: nativeUpper, candidate: browserUpper, rect: [88, 48, 224, 38], selected: lightText},
  upperSecondListBlock: {reference: nativeUpper, candidate: browserUpper, rect: [88, 92, 224, 18], selected: lightText},
  upperThirdListBlock: {reference: nativeUpper, candidate: browserUpper, rect: [88, 118, 224, 40], selected: lightText},
  lowerButtonLabel: {reference: nativeLower, candidate: browserLower, rect: [104, 170, 112, 24], selected: darkButtonText},
};
const rasterDiagnostics = Object.fromEntries(Object.entries(rasterCases).map(([name, entry]) => [name, {
  coverageAtZero: coverageDiagnostics(entry.reference.pixels, entry.candidate.pixels, entry.reference.width, entry.rect, entry.selected),
  fractionalCandidateSampling: fractionalSamplingDiagnostic(entry.reference.pixels, entry.candidate.pixels,
    entry.reference.width, entry.reference.height, entry.rect, entry.selected),
}]));

const report = {
  scenario: 'home-power-menu-settled', threshold: 2, comparison: 'Empty-mask source-pane regions; translations are diagnostics, not correction proposals.',
  inputs: {
    native: {file: nativeFile, fileSha256: nativeUpper.fileSha256, upperRgbSha256: nativeUpper.rgbSha256, lowerRgbSha256: nativeLower.rgbSha256},
    browser: {
      upper: {file: browserFiles.upper, fileSha256: browserUpper.fileSha256, rgbSha256: browserUpper.rgbSha256},
      lower: {file: browserFiles.lower, fileSha256: browserLower.fileSha256, rgbSha256: browserLower.rgbSha256},
    },
    ...(baseline && {baseline: {
      upper: {file: baselineFiles.upper, fileSha256: baseline.upper.fileSha256, rgbSha256: baseline.upper.rgbSha256},
      lower: {file: baselineFiles.lower, fileSha256: baseline.lower.fileSha256, rgbSha256: baseline.lower.rgbSha256},
    }}),
  },
  regions: regionMetrics, ...(baseline && {beforeAfter}), rgbTranslationFits, maskTranslationFits, rasterDiagnostics,
  limitations: ['Settled semantic path matches; input cadence and phase do not.', 'No mask is applied.', 'Translation fits identify residual shape/placement only and do not authorize a runtime offset.', 'Bilinear candidate sampling can reduce coverage error without proving a source coordinate or runtime correction.'],
};
await mkdir(options.out, {recursive: true});
const output = join(options.out, 'power-regions.json');
await writeFile(output, JSON.stringify(report, null, 2) + '\n');
process.stdout.write(`${output}\n`);
