import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/scene/console-scene.ts', import.meta.url), 'utf8');

test('only an observed Off to awake boot restarts the retained HOME primary once per boot identity', () => {
  assert.match(source, /let bannerObservedPhase=state\.system!\.phase,lastBannerRestartBootSince:number\|null=null,bannerEntryFooterBootSince:number\|null=null;/);
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

test('the restarted primary uses the paired-screen footer release receipt at the existing worker release boundary', () => {
  const observer = source.slice(source.indexOf('function observeFolderBanner'), source.indexOf('function advanceBeforeMutation'));
  assert.match(observer, /bannerEntryFooterBootSince=system\.since/);
  assert.match(observer, /const entryFooter=screens\.homeEntryFooterReadiness\(\)/);
  assert.match(observer, /entryFooter\.bootSince===bannerEntryFooterBootSince&&entryFooter\.releasedAtUpdate!==null/);
  assert.match(observer, /loadInhibited:false,nativeWorkerReady:bannerEntryFooterBootSince===null/);
  assert.doesNotMatch(observer, /setTimeout|performance\.now|HOME_ENTRY_FOOTER_LAST_FRAME/,
    'scene policy must consume the shared owner receipt rather than inventing a delay or frame clock');
});

test('only a visible context-live render promotes entry candidates', () => {
  assert.match(source, /if\(validPublication\)\{screens\.presentHomeEntryFooterTerminal\(\);screens\.presentHomeEntryFooterRelease\(\);screens\.presentHomeEntryBanner\(\);screens\.presentHomeEntryWithoutNativeBanner\(\);\}/);
  assert.match(source, /else\{screens\.revokeHomeEntryFooterCandidate\(\);screens\.revokeHomeEntryBannerCandidate\(\);screens\.revokeHomeEntryNoBannerCandidate\(\);\}/);
  assert.match(source, /const revokeTerminalPublications=\(\)=>\{[^}]*screens\.revokeHomeEntryFooterCandidate\(\);screens\.revokeHomeEntryBannerCandidate\(\);screens\.revokeHomeEntryNoBannerCandidate\(\);\};/);
  assert.match(source, /const contextLost=\(event:Event\)=>\{event\.preventDefault\(\);resetTerminalPublications\(\);/);
});
