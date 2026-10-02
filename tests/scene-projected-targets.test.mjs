import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/scene/console-scene.ts', import.meta.url), 'utf8');
const projection = source.slice(source.indexOf('function publishProjectedTargets('), source.indexOf('function renderFrame()'));
const render = source.slice(source.indexOf('function renderFrame()'), source.indexOf('function animate('));
const resize = source.slice(source.indexOf('function resize()'), source.indexOf('const observer='));

test('rendered frames refresh eligible QA targets after current world and projection matrices', () => {
  const world = render.indexOf('scene.updateMatrixWorld(true)');
  const fit = render.indexOf('fitConsole()');
  const camera = render.indexOf('camera.updateProjectionMatrix()');
  const publish = render.indexOf('publishProjectedTargets(plan.shadows)');
  const draw = render.indexOf('renderer.render(scene,camera)');
  assert.ok(world >= 0 && world < fit && fit < camera && camera < publish && publish < draw);
});

test('resize-driven immediate renders refresh targets even when only viewport dimensions changed', () => {
  assert.match(resize, /renderer\.setDrawingBufferSize\(w,h,ratio\)/);
  assert.match(resize, /schedule\.invalidate\(\);if\(started&&!disposed\)renderFrame\(\)/);
  assert.match(projection, /width===projectedTargetWidth&&height===projectedTargetHeight/);
});

test('LCD-only renders do not repeat target projection at an unchanged CSS size', () => {
  assert.match(projection, /if\(!geometryMoved&&host\.dataset\.targets&&width===projectedTargetWidth&&height===projectedTargetHeight\)return/);
});

test('projected QA publication remains diagnostic-only and preserves the real raycast touch route', () => {
  assert.match(projection, /if\(!diagnostics\|\|intro\)return/);
  assert.match(source, /const h=hit\(e\)/);
  assert.match(source, /drag\.touch=\{x:h\.uv\.x\*320,y:\(1-h\.uv\.y\)\*240\}/);
});
