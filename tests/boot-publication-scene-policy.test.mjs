import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const source=readFileSync(new URL('../src/scene/console-scene.ts',import.meta.url),'utf8');

test('boot failure announces Retry only while other native recovery wording stays unchanged',()=>{
 assert.match(source,/nativeStatus==='error'\?\(s\.phase==='boot'\?'Website display unavailable\. A to retry\.':'Website display unavailable\. A to retry\. B or HOME to return to HOME Menu\.'\)/);
});

test('boot cannot hand off until its native terminal pair was rendered in an earlier callback',()=>{
 const deadline=source.indexOf('const animationElapsedMs=now-start;');
 const pending=source.indexOf('const bootPublicationPending=bootTerminalPublicationPending',deadline);
 const paint=source.indexOf('paintScreens(now);renderFrame();',pending);
 const tick=source.indexOf("if(!homeClockSuspended&&!terminalPublicationPending)commit",paint);
 assert.ok(deadline>=0&&pending>deadline&&paint>pending&&tick>paint);
 assert.match(source,/lastBootPaintIdentity=nativeSystem\?bootTerminalIdentity/,
  'only a successful native paired paint may create the boot receipt candidate');
 assert.match(source,/lastBootPresentedIdentity=validPublication\?lastBootPaintIdentity:null/,
  'only a visible awake successful render may publish the receipt');
 assert.match(source,/if\(plan\?\.render&&!terminalPublicationPending\)/,
  'the forced publication callback must not render twice or retire boot');
});

test('failed paints cannot reuse a boot candidate and retries remain selected',()=>{
 const clear=source.indexOf('lastBootPaintIdentity=null;lastLaunchPaintIdentity=null;lastShutdownPaintIdentity=null;const painted=screens.paint');
 const record=source.indexOf('recordScreenPaint(now-start,painted?.nativeSystem===true,painted?.entryMotion,painted?.manualEntry,painted?.appletEntry,painted?.notesClose,painted?.notificationsClose)',clear);
 const failure=source.indexOf("host.dataset[bootPublicationPending?'bootPublicationFailure':launchPublicationPending?'launchPublicationFailure':'shutdownPublicationFailure']=String(error)");
 assert.ok(clear>=0&&record>clear&&failure>record);
 assert.match(source,/lastBootPaintIdentity=nativeSystem\?bootTerminalIdentity/);
});

test('boot, launch and shutdown receipts share visibility, sleep and context invalidation',()=>{
 assert.match(source,/if\(!before\.sleeping&&after\.sleeping\)revokeTerminalPublications\(\);/);
 const hidden=source.indexOf('if(document.hidden){homeClockSuspended=true;');
 const blur=source.indexOf('blur();',hidden);
 const revoke=source.indexOf('revokeTerminalPublications();',blur);
 assert.ok(hidden>=0&&blur>hidden&&revoke>blur);
 assert.match(source,/const contextLost=\(event:Event\)=>\{liveLcdRecorder\?\.unavailable\('context-lost'\);event\.preventDefault\(\);resetTerminalPublications\(\);schedule\.invalidate\(\);\}/);
 assert.match(source,/const contextRestored=\(\)=>\{resetTerminalPublications\(\);schedule\.invalidate\(\);renderer\.shadowMap\.needsUpdate=true;\}/);
 assert.match(source,/const revokeTerminalPublications=\(\)=>\{entryPublicationRepaintPending=true;lastBootPaintIdentity=null;lastBootPresentedIdentity=null;lastLaunchPaintIdentity=null;lastLaunchPresentedIdentity=null;lastShutdownPaintIdentity=null;lastShutdownPresentedIdentity=null;screens\.revokeHomeEntryFooterCandidate\(\);screens\.revokeHomeEntryBannerCandidate\(\);screens\.revokeHomeEntryNoBannerCandidate\(\);screens\.revokeHomeEntryMotionCandidate\(\);screens\.revokeNotesBootCoverCandidate\(\);screens\.revokeManualEntryCandidate\(\);screens\.revokeAppletEntryCandidate\(\);screens\.revokeNotesFooterCloseCandidate\(\);\};/);
});
