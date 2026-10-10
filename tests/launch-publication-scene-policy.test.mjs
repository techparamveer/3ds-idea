import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const scene=readFileSync(new URL('../src/scene/console-scene.ts',import.meta.url),'utf8');
const screens=readFileSync(new URL('../src/os/screens.ts',import.meta.url),'utf8');

test('launch cannot retire until a successful paired terminal was rendered in an earlier callback',()=>{
 const deadline=scene.indexOf('const animationElapsedMs=now-start;');
 const pending=scene.indexOf('const launchPublicationPending=launchTerminalPublicationPending',deadline);
 const paint=scene.indexOf('paintScreens(now);renderFrame();',pending);
 const tick=scene.indexOf("if(!homeClockSuspended&&!terminalPublicationPending)commit",paint);
 assert.ok(deadline>=0&&pending>deadline&&paint>pending&&tick>paint);
 assert.match(scene,/lastLaunchPaintIdentity=nativeSystem\?launchTerminalIdentity/,
  'only a successful native paired paint may create the launch receipt candidate');
 assert.match(scene,/lastLaunchPresentedIdentity=validPublication\?lastLaunchPaintIdentity:null/,
  'only a visible awake render may publish the launch receipt');
 assert.match(scene,/const terminalPublicationPending=bootPublicationPending\|\|launchPublicationPending\|\|shutdownPublicationPending/);
 assert.match(scene,/if\(plan\?\.render&&!terminalPublicationPending\)/,
  'the forced C14 callback cannot render twice or retire launch');
});

test('hidden, sleeping, closed-lid and lost-context launch endpoints cannot publish',()=>{
 assert.match(scene,/const validPublication=!document\.hidden&&state\.powered&&!state\.system!\.sleeping&&angle>12&&topScreen\.visible&&touchScreen\.visible&&!renderer\.getContext\(\)\.isContextLost\(\)/);
 assert.match(scene,/if\(!homeClockSuspended&&terminalPublicationPending&&state\.powered&&angle>12&&!document\.hidden&&!systemBeforeTick\.sleeping&&!renderer\.getContext\(\)\.isContextLost\(\)\)/);
 assert.match(scene,/if\(!before\.sleeping&&after\.sleeping\)revokeTerminalPublications\(\);/);
 assert.match(scene,/const contextLost=\(event:Event\)=>\{liveLcdRecorder\?\.unavailable\('context-lost'\);event\.preventDefault\(\);resetTerminalPublications\(\);schedule\.invalidate\(\);\}/);
 assert.match(scene,/const contextRestored=\(\)=>\{resetTerminalPublications\(\);schedule\.invalidate\(\);renderer\.shadowMap\.needsUpdate=true;\}/);
 const hidden=scene.indexOf('if(document.hidden){homeClockSuspended=true;');
 const revoke=scene.indexOf('revokeTerminalPublications();',hidden);
 assert.ok(hidden>=0&&revoke>hidden);
 assert.match(scene,/lastLaunchPaintIdentity=null;lastLaunchPresentedIdentity=null/);
});

test('launch is a mandatory owner-keyed native panel and failed terminal paints stay recoverable',()=>{
 assert.match(screens,/\['boot','launch','power','shutdown'\]\.includes\(state\.system\.phase\)/);
 assert.match(screens,/JSON\.stringify\(\['system',state\.system\.phase,state\.system\.since,state\.system\.returnPhase,state\.system\.app,state\.system\.runtime\.application,state\.system\.runtime\.active\]\)/);
 assert.match(screens,/if\(requiresNativeSystem&&!nativeSystem\)throw Error\(`Native \$\{state\.system!\.phase\} screen unavailable`\)/);
 assert.match(scene,/launchPublicationPending\?'launchPublicationFailure':'shutdownPublicationFailure'/);
});
