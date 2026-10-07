import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const scene = readFileSync(new URL('../src/scene/console-scene.ts', import.meta.url), 'utf8');
const render = scene.slice(scene.indexOf('function renderFrame()'), scene.indexOf('function animate('));

test('HOME entry and Notes receipts follow a successful visible renderer publication', () => {
  assert.ok(render.indexOf('renderer.render(scene,camera)') < render.indexOf('if(validPublication)'));
  assert.match(render, /const validPublication=!document\.hidden&&state\.powered&&!state\.system!\.sleeping&&angle>12&&topScreen\.visible&&touchScreen\.visible&&!renderer\.getContext\(\)\.isContextLost\(\);/);
  assert.match(render, /if\(validPublication\)\{[^}]*screens\.presentHomeEntryMotion\(state\);screens\.presentNotesBootCover\(state\);\}/);
  assert.match(render, /else\{[^}]*screens\.revokeHomeEntryMotionCandidate\(\);screens\.revokeNotesBootCoverCandidate\(\);\}/);
});

test('context and hidden revocation include the new paired candidates', () => {
  assert.match(scene, /const revokeTerminalPublications=\(\)=>\{[^}]*screens\.revokeHomeEntryMotionCandidate\(\);screens\.revokeNotesBootCoverCandidate\(\);\};/);
  assert.match(scene, /const resetTerminalPublications=\(\)=>\{contextGeneration\+\+;revokeTerminalPublications\(\);/);
  assert.match(scene, /if\(document\.hidden\)\{homeClockSuspended=true;blur\(\);revokeTerminalPublications\(\);/);
});

test('eligible HOME and Notes motion share the existing transition LCD budget', () => {
  assert.match(scene, /const entryActive=state\.powered&&angle>12&&!homeClockSuspended&&!document\.hidden&&!state\.system!\.sleeping&&topScreen\.visible&&touchScreen\.visible&&!renderer\.getContext\(\)\.isContextLost\(\)\s*&&\(screens\.homeEntryMotionActive\(state\)\|\|screens\.notesBootCoverActive\(state\)\);/);
  assert.match(scene, /const lcdFps=screenPaintFps\(quality,closeAdvanced\|\|entryActive\);/);
  assert.match(scene, /const renderDue=bootPublishDue\|\|quality\.renderFps>=60\|\|now-lastRender>=1000\/quality\.renderFps;/);
});
