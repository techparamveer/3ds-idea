import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import {comparePixels, connectedRegions, run, validateMask} from './compare.mjs';

test('threshold, mean/max RGB, mask and four-neighbour regions', () => {
  const native = Buffer.alloc(4 * 3 * 3), browser = Buffer.from(native);
  browser[0] = 2; // tolerated
  browser[3] = 3; // first region
  browser[6] = 6; // adjacent to first
  browser[(2 * 4 + 3) * 3] = 20; // separate region, masked
  const coverage = new Uint8Array(12); coverage[11] = 1;
  const result = comparePixels(native, browser, 4, 3, coverage);
  assert.equal(result.metrics.comparedPixels, 11);
  assert.equal(result.metrics.maskedPixels, 1);
  assert.equal(result.metrics.maxRgbError, 6);
  assert.equal(result.metrics.pixelsOverThreshold, 2);
  assert.equal(result.metrics.meanRgbError, 11 / 33);
  assert.deepEqual(result.regions, [{x: 1, y: 0, width: 2, height: 1, pixelCount: 2}]);
  assert.deepEqual(connectedRegions(Uint8Array.from([1, 0, 0, 1]), 2, 2), [
    {x: 0, y: 0, width: 1, height: 1, pixelCount: 1},
    {x: 1, y: 1, width: 1, height: 1, pixelCount: 1},
  ]);
});

test('mask needs a bounded rectangle and documented reason', () => {
  assert.throws(() => validateMask({regions: [{screen: 'upper', x: 0, y: 0, width: 1, height: 1, category: 'inert-ok'}]}), /reason required/);
  assert.throws(() => validateMask({regions: [{screen: 'lower', x: 319, y: 0, width: 2, height: 1, category: 'inert-ok', reason: 'Scope'}]}), /outside/);
  assert.throws(() => validateMask({regions: [{screen: 'lower', x: 0, y: 0, width: 1, height: 1, category: 'feature-map-adaptation', reason: 'Adapted'}]}), /featureMapRef/);
});

const encode = (pixels, width, height) => sharp(pixels, {raw: {width, height, channels: 3}}).png().toBuffer();

test('combined Azahar crop and browser LCDs produce reports and images without resampling', async t => {
  const root = await mkdtemp(path.join(tmpdir(), 'native-compare-'));
  t.after(() => rm(root, {recursive: true, force: true}));
  const browser = path.join(root, 'browser'), out = path.join(root, 'out');
  await mkdir(browser);
  const combined = Buffer.alloc(400 * 480 * 3, 10);
  // Distinct lower LCD pixel at combined (40,240) must become lower (0,0).
  combined[(240 * 400 + 40) * 3] = 99;
  const nativeFile = path.join(root, 'native.png');
  await writeFile(nativeFile, await encode(combined, 400, 480));
  const upper = Buffer.alloc(400 * 240 * 3, 10);
  const lower = Buffer.alloc(320 * 240 * 3, 10); lower[0] = 99;
  await writeFile(path.join(browser, 'upper.png'), await encode(upper, 400, 240));
  await writeFile(path.join(browser, 'lower.png'), await encode(lower, 320, 240));
  const mask = path.join(root, 'mask.json'); await writeFile(mask, '{"regions":[]}');
  const {report} = await run({native: nativeFile, browser, mask, out, scenario: 'home-idle', commit: 'fixture-commit'});
  assert.equal(report.result, 'pixel-threshold-pass');
  assert.equal(report.screens.upper.pixelsOverThreshold, 0);
  assert.equal(report.screens.lower.pixelsOverThreshold, 0);
  assert.equal(report.screens.lower.native.sha256.length, 64);
  assert.equal(report.commit, 'fixture-commit');
  for (const name of ['report.json', 'upper-heatmap.png', 'lower-heatmap.png', 'upper-contact-sheet.png', 'lower-contact-sheet.png']) {
    assert.ok((await readFile(path.join(out, name))).length > 0);
  }
  lower[0] = 90;
  await writeFile(path.join(browser, 'lower.png'), await encode(lower, 320, 240));
  const failed = await run({native: nativeFile, browser, mask, out, scenario: 'home-idle', commit: 'fixture-commit'});
  assert.equal(failed.report.result, 'unexplained-differences');
  assert.equal(failed.report.screens.lower.pixelsOverThreshold, 1);
  assert.deepEqual(failed.report.screens.lower.regions, [{x: 0, y: 0, width: 1, height: 1, pixelCount: 1}]);
});
