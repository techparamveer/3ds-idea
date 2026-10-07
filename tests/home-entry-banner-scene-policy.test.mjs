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
  assert.match(observer, /activationReady:screens\.homeEntryActivationReady\(state\)/);
  assert.doesNotMatch(observer, /setTimeout|performance\.now|HOME_ENTRY_FOOTER_LAST_FRAME/,
    'scene policy must consume the shared owner receipt rather than inventing a delay or frame clock');
});

test('entry worker activation is sampled on the live footer-14 HOME update before the manager pass', () => {
  const stepper = source.slice(source.indexOf('function advanceBeforeMutation'));
  assert.match(stepper, /activationReady:screens\.homeEntryActivationReady\(pass\.state\)/);
});

test('only a visible context-live render promotes entry candidates', () => {
  assert.match(source, /if\(validPublication\)\{screens\.presentHomeEntryFooterTerminal\(\);screens\.presentHomeEntryFooterRelease\(\);screens\.presentHomeEntryBanner\(\);screens\.presentHomeEntryWithoutNativeBanner\(\);screens\.presentHomeEntryMotion\(state\);screens\.presentAppletEntry\(state,performance\.now\(\)-start\);screens\.presentNotesBootCover\(state\);screens\.presentManualEntry\(state,performance\.now\(\)-start\);\}/);
  assert.match(source, /else\{entryPublicationRepaintPending=true;screens\.revokeHomeEntryFooterCandidate\(\);screens\.revokeHomeEntryBannerCandidate\(\);screens\.revokeHomeEntryNoBannerCandidate\(\);screens\.revokeHomeEntryMotionCandidate\(\);screens\.revokeNotesBootCoverCandidate\(\);screens\.revokeManualEntryCandidate\(\);screens\.revokeAppletEntryCandidate\(\);\}/);
  assert.match(source, /const revokeTerminalPublications=\(\)=>\{[^}]*screens\.revokeHomeEntryFooterCandidate\(\);screens\.revokeHomeEntryBannerCandidate\(\);screens\.revokeHomeEntryNoBannerCandidate\(\);screens\.revokeHomeEntryMotionCandidate\(\);screens\.revokeNotesBootCoverCandidate\(\);screens\.revokeManualEntryCandidate\(\);screens\.revokeAppletEntryCandidate\(\);\};/);
  assert.match(source, /const contextLost=\(event:Event\)=>\{event\.preventDefault\(\);resetTerminalPublications\(\);/);
});
