import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/scene/console-scene.ts', import.meta.url), 'utf8');

test('only an observed Off to awake boot restarts the retained HOME primary once per boot identity', () => {
  assert.match(source, /let bannerObservedPhase=state\.system!\.phase,lastBannerRestartBootSince:number\|null=null;/);
  assert.match(source, /const restartPrimary=bannerObservedPhase==='off'&&system\.phase==='boot'&&!system\.sleeping&&system\.since!==lastBannerRestartBootSince;/);
  const decision = source.indexOf("const restartPrimary=bannerObservedPhase==='off'");
  const observe = source.indexOf('bannerObservedPhase=system.phase;', decision);
  const reset = source.indexOf('bannerHost=resetHomeBannerPrimary(bannerHost)', observe);
  const identity = source.indexOf('lastBannerRestartBootSince=system.since', reset);
  const request = source.indexOf('bannerHost=crossHomeBannerBoundary(bannerHost,clock', identity);
  assert.ok(decision >= 0 && observe > decision && reset > observe && identity > reset && request > identity,
    'retirement must precede the same-clock replacement request');
});

test('warm boot reset preserves the existing host generation and never recreates the session host', () => {
  const observer = source.slice(source.indexOf('function observeFolderBanner'), source.indexOf('function advanceBeforeMutation'));
  assert.match(observer, /resetHomeBannerPrimary\(bannerHost\)/);
  assert.doesNotMatch(observer, /createHomeBannerHost/);
  assert.doesNotMatch(observer, /bannerGeneration=/);
});
