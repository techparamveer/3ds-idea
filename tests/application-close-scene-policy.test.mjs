import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/scene/console-scene.ts', import.meta.url), 'utf8');

test('scene freezes unavailable close clocks and routes B or HOME through native recovery', () => {
  assert.match(source, /applicationCloseNeedsReadyScreen\(state\.system!\.homeApplicationTransition,screens\.stockStatus\(state\)\)/);
  assert.match(source, /if\(homeClockSuspended\|\|closeNeedsReadyScreen\)/);
  assert.match(source, /applicationCloseAllowsInput\(previous\.system!\.homeApplicationTransition,input,screens\.stockStatus\(previous\)\)/);
  assert.match(source, /if\(decision==='home'\)return escapeUnreadyNativeScreen\(current,now\)/);
});

test('scene rebases before hiding and forces resumed close endpoints to the renderer', () => {
  const suspend = source.indexOf('homeClockSuspended=true;blur()');
  assert.ok(suspend >= 0, 'visibility suspension must precede the clock-resetting blur');
  assert.match(source, /resumedApplicationClose=previous\.system!\.sleeping&&!after\.sleeping\|\|input==='visibility'&&!document\.hidden/);
  assert.match(source, /applicationCloseNeedsPaint\(before\.homeApplicationTransition,after\.homeApplicationTransition,reduced,resumedApplicationClose\)/);
  assert.match(source, /if\(mustPaintApplicationClose\)\{paint\(\);if\(started&&!document\.hidden&&!after\.sleeping\)renderFrame\(\);\}/);
});

test('required close publication pins synchronous effect clocks until cleanup ends', () => {
  assert.match(source, /now:\(\)=>closePublicationEffectNow\?\?performance\.now\(\)-start/);
  const pin = source.indexOf('if(mustPaintApplicationClose)closePublicationEffectNow=now;');
  const drain = source.indexOf('try{effects.drain(userGesture);}finally{closePublicationEffectNow=previousEffectNow;}');
  const paint = source.indexOf("if(input!=='tick'||mustPaintApplicationClose", drain);
  assert.ok(pin >= 0 && drain > pin && paint > drain);
});

test('terminal system transitions cannot retire until their native paired terminal was rendered in an earlier animation frame', () => {
  const deadline = source.indexOf('const animationElapsedMs=now-start;');
  const pending = source.indexOf('const shutdownPublicationPending=shutdownTerminalPublicationPending', deadline);
  const paint = source.indexOf('paintScreens(now);renderFrame();', pending);
  const tick = source.indexOf("if(!homeClockSuspended&&!terminalPublicationPending)commit", paint);
  assert.ok(deadline >= 0 && pending > deadline && paint > pending && tick > paint);
  assert.match(source, /lastShutdownPaintIdentity=nativeSystem\?shutdownTerminalIdentity/);
  assert.match(source, /lastShutdownPresentedIdentity=validPublication\?lastShutdownPaintIdentity:null/);
  assert.match(source, /if\(plan\?\.render&&!terminalPublicationPending\)/,
    'the forced publication callback must not perform another scene render or retire Off');
});

test('shutdown publication is invalidated across WebGL loss and restoration', () => {
  assert.match(source, /const contextLost=\(event:Event\)=>\{event\.preventDefault\(\);resetTerminalPublications\(\);schedule\.invalidate\(\);\}/);
  assert.match(source, /const contextRestored=\(\)=>\{resetTerminalPublications\(\);schedule\.invalidate\(\);renderer\.shadowMap\.needsUpdate=true;\}/);
  assert.match(source, /addEventListener\('webglcontextlost',contextLost\)/);
  assert.match(source, /removeEventListener\('webglcontextlost',contextLost\)/);
  assert.match(source, /systemBeforeTick\.sleeping&&!renderer\.getContext\(\)\.isContextLost\(\)/);
});

test('shutdown publication is revoked across hidden and sleeping suspension boundaries', () => {
  assert.match(source, /if\(!before\.sleeping&&after\.sleeping\)revokeTerminalPublications\(\);/);
  const hidden = source.indexOf('if(document.hidden){homeClockSuspended=true;');
  const blur = source.indexOf('blur();', hidden);
  const revoke = source.indexOf('revokeTerminalPublications();', blur);
  const observe = source.indexOf('observeFolderBanner();', revoke);
  assert.ok(hidden >= 0 && blur > hidden && revoke > blur && observe > revoke,
    'hide must finish input cancellation, then revoke both paint and presentation receipts');
  assert.match(source, /const revokeTerminalPublications=\(\)=>\{entryPublicationRepaintPending=true;lastBootPaintIdentity=null;lastBootPresentedIdentity=null;lastLaunchPaintIdentity=null;lastLaunchPresentedIdentity=null;lastShutdownPaintIdentity=null;lastShutdownPresentedIdentity=null;screens\.revokeHomeEntryFooterCandidate\(\);screens\.revokeHomeEntryBannerCandidate\(\);screens\.revokeHomeEntryNoBannerCandidate\(\);screens\.revokeHomeEntryMotionCandidate\(\);screens\.revokeNotesBootCoverCandidate\(\);screens\.revokeManualEntryCandidate\(\);screens\.revokeAppletEntryCandidate\(\);\};/);
});

test('boot, launch, power and shutdown paint success requires the selected native system overlay', () => {
  const screens = readFileSync(new URL('../src/os/screens.ts', import.meta.url), 'utf8');
  assert.match(screens, /state\.system&&!state\.system\.sleeping&&\['boot','launch','power','shutdown'\]\.includes\(state\.system\.phase\)/);
  assert.match(screens, /if\(requiresNativeSystem&&!nativeSystem\)throw Error/);
  assert.match(screens, /return nativeSystem\|\|verificationPaint\|\|entryMotion/);
  assert.match(screens, /nativeSystem\?\{nativeSystem:true as const\}:\{\}/);
});
