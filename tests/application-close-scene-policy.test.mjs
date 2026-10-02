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
