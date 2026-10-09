import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { homePauseLowerPresentation } from '../src/os/home-entry-motion.ts';
import { paddedHomeLowerCapture, validateHomePauseLowerAssets } from '../src/os/home-pause-lower.ts';

const launcherUrl = process.env.THREE_DS_RESOURCE_ROOT
  ? pathToFileURL(resolve(process.env.THREE_DS_RESOURCE_ROOT, 'packs/home/launcher.json'))
  : new URL('../public/os/firmware/10.7.0-32E/packs/home/launcher.json', import.meta.url);
const launcher = JSON.parse(readFileSync(launcherUrl));
const motion = elapsedUpdates => ({ identity: { kind: 'pause', owner: 'health:1', captureGeneration: 7 }, observedUpdate: 10, elapsedUpdates });

test('lower pause holds both terminal fade samples before releasing to the full footer span', () => {
  assert.deepEqual(homePauseLowerPresentation(motion(0)), { fadeFrame: 0, footerFrame: null });
  assert.deepEqual(homePauseLowerPresentation(motion(7)), { fadeFrame: 20, footerFrame: null });
  assert.deepEqual(homePauseLowerPresentation(motion(14)), { fadeFrame: 40, footerFrame: null });
  assert.deepEqual(homePauseLowerPresentation(motion(15)), { fadeFrame: 40, footerFrame: null });
  for (const [offset, footerFrame] of [0, 2, 4, 7, 9, 11].entries()) {
    assert.deepEqual(homePauseLowerPresentation(motion(16 + offset)), { fadeFrame: null, footerFrame });
  }
  assert.equal(homePauseLowerPresentation(motion(22)), null);
  assert.equal(homePauseLowerPresentation(motion(30)), null);
  assert.equal(homePauseLowerPresentation(motion(0), true), null);
  assert.equal(homePauseLowerPresentation({ ...motion(15), identity: { kind: 'folder', folder: 'folder:7' } }), null);
});

test('lower pause source validation rejects substituted resources', () => {
  assert.doesNotThrow(() => validateHomePauseLowerAssets(launcher));
  const substituted = structuredClone(launcher);
  substituted.resourceSources.animations.LncPauseFade_D_00_SceneIn.sha256 = '0'.repeat(64);
  assert.throws(() => validateHomePauseLowerAssets(substituted), /source unavailable/);
});

test('rotated retained lower capture is padded once for the native texture coordinates', () => {
  const capture = { width: 240, height: 320, data: new Uint8ClampedArray(240 * 320 * 4) };
  capture.data.set([1, 2, 3, 4], (319 * 240 + 239) * 4);
  const padded = paddedHomeLowerCapture(capture);
  assert.equal(paddedHomeLowerCapture(capture), padded);
  assert.deepEqual([padded.width, padded.height], [256, 512]);
  assert.deepEqual([...padded.data.slice((319 * 256 + 239) * 4, (319 * 256 + 240) * 4)], [1, 2, 3, 4]);
  assert.deepEqual([...padded.data.slice((319 * 256 + 240) * 4, (319 * 256 + 241) * 4)], [0, 0, 0, 0]);
  assert.throws(() => paddedHomeLowerCapture({ width: 320, height: 240, data: new Uint8ClampedArray(320 * 240 * 4) }), /Invalid suspended lower/);
});
