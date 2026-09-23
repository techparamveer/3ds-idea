#!/usr/bin/env node
// Real projected touchscreen input; capture hooks are read-only diagnostics.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { parseArgs } from 'node:util';
const { values } = parseArgs({ options: {
 'artifact-dir': { type: 'string' }, 'browser-bin': { type: 'string', default: 'agent-browser' },
 name: { type: 'string', default: 'home-density-controls' }, session: { type: 'string', default: 'firmware-native-check' },
} });
if (!values['artifact-dir'] || !isAbsolute(values['artifact-dir']) || !/^[a-z0-9-]+$/.test(values.name)) throw new Error('Supply absolute --artifact-dir and simple --name');
const browser = (...args) => {
 const result = spawnSync(values['browser-bin'], ['--session', values.session, ...args], { encoding: 'utf8', timeout: 30000, maxBuffer: 8 * 1024 * 1024 });
 if (result.error || result.status !== 0) throw new Error(result.error?.message ?? result.stderr ?? result.stdout);
 return result.stdout.trim();
};
const evaluate = code => JSON.parse(browser('eval', code));
const capture = () => evaluate(`(()=>{const h=document.querySelector('[role=application]');return {menu:h.dataset.menu,rows:Number(h.dataset.rows),selected:Number(h.dataset.selected),theme:h.dataset.theme,capture:h.captureScreensAt(0,'2026-09-23T12:06:00Z')};})()`);
const settle = () => evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true))))');
function point(name) {
 const target = evaluate(`JSON.parse(document.querySelector('[role=application]').dataset.targets)[${JSON.stringify(name)}]`);
 assert.ok(Array.isArray(target) && target.length === 2 && target.every(Number.isFinite));
 browser('mouse', 'move', ...target.map(value => String(Math.round(value))));
}
assert.equal(evaluate('matchMedia("(prefers-reduced-motion: reduce)").matches'), true);
const before = capture();
assert.equal(before.menu, 'folder'); assert.equal(before.rows, 1); assert.equal(before.theme, 'white');
assert.equal(before.capture.homeCursor.visibleSlot, 0, 'Select child slot0 for the reference density round trip; other slots may legitimately change viewport');
point('Touch_277_16'); browser('mouse', 'down');
const disabledDown = capture(); browser('mouse', 'up'); settle();
const disabledUp = capture();
for (const item of [disabledDown, disabledUp]) {
 assert.equal(item.menu, before.menu); assert.equal(item.rows, before.rows); assert.equal(item.selected, before.selected);
 assert.ok(item.capture.bottom === before.capture.bottom, 'Disabled control must retain the full lower LCD at fixed pose');
}
point('Touch_307_16'); browser('mouse', 'down');
const enabledDown = capture(); browser('mouse', 'up'); settle();
const increased = capture();
assert.notEqual(enabledDown.capture.bottom, before.capture.bottom, 'Enabled control retains its pressed pose');
assert.equal(increased.rows, 2); assert.equal(increased.menu, 'folder'); assert.equal(increased.selected, before.selected);
point('Touch_277_16'); browser('mouse', 'down'); browser('mouse', 'up'); settle();
const restored = capture();
assert.equal(restored.rows, 1); assert.equal(restored.menu, 'folder'); assert.equal(restored.selected, before.selected);
assert.ok(restored.capture.bottom === before.capture.bottom, 'Density round trip returns to the original lower LCD');
const summary = { passed: true, disabledPressUnchanged: true, disabledTapUnchanged: true,
 enabledPressedPose: true, increasedRows: increased.rows, roundTripExact: true };
mkdirSync(values['artifact-dir'], { recursive: true });
writeFileSync(join(values['artifact-dir'], `${values.name}.json`), JSON.stringify({ summary, before, disabledDown, disabledUp, enabledDown, increased, restored }, null, 2));
writeFileSync(join(values['artifact-dir'], `${values.name}-capture.json`), JSON.stringify(restored.capture));
console.log(JSON.stringify(summary, null, 2));
