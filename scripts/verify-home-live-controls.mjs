#!/usr/bin/env node
// Real browser inputs only; read-only diagnostics capture retained native state.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { parseArgs } from 'node:util';
const { values } = parseArgs({ options: {
 'artifact-dir': { type: 'string' }, 'browser-bin': { type: 'string', default: 'agent-browser' },
 name: { type: 'string', default: 'home-live-controls' }, session: { type: 'string', default: 'firmware-native-check' },
} });
if (!values['artifact-dir'] || !isAbsolute(values['artifact-dir']) || !/^[a-z0-9-]+$/.test(values.name)) throw Error('Supply absolute --artifact-dir and simple --name');
const browser = (...args) => {
 const r = spawnSync(values['browser-bin'], ['--session', values.session, ...args], { encoding: 'utf8', timeout: 30000, maxBuffer: 12 * 1024 * 1024 });
 if (r.error || r.status !== 0) throw Error(r.error?.message ?? r.stderr ?? r.stdout);
 return r.stdout.trim();
};
const evaluate = code => JSON.parse(browser('eval', code));
const read = `(()=>{const h=document.querySelector('[role=application]');return {updates:Number(h.dataset.homeUpdates),cursor:JSON.parse(h.dataset.homeCursor),banner:JSON.parse(h.dataset.folderBanner),menu:h.dataset.menu,audio:JSON.parse(h.dataset.audio)};})()`;
const sample = ms => evaluate(`new Promise(resolve=>{const frames=[],start=performance.now();function next(){frames.push(${read});if(performance.now()-start>=${ms})resolve(frames);else requestAnimationFrame(next);}requestAnimationFrame(next);})`);
const settle = () => browser('wait', '--fn', `JSON.parse(document.querySelector('[role=application]').dataset.homeCursor).mode===0`);
function focus(pattern) {
 const ref = browser('snapshot', '-i').match(pattern)?.[1];assert.ok(ref, 'Required accessible control exists');browser('focus', `@${ref}`);
}
function point(name) {
 const xy = evaluate(`JSON.parse(document.querySelector('[role=application]').dataset.targets)[${JSON.stringify(name)}]`);
 assert.ok(Array.isArray(xy) && xy.every(Number.isFinite));browser('mouse', 'move', ...xy.map(v => String(Math.round(v))));
}
const initial = evaluate(read);
assert.equal(initial.menu, 'folder');assert.equal(initial.cursor.visibleSlot, 0);
assert.equal(initial.cursor.focus.toolbarActive, false);
assert.equal(evaluate('matchMedia("(prefers-reduced-motion: reduce)").matches'), false);
focus(/application .* \[ref=(e\d+)\]/);
browser('press', 'ArrowUp');settle();
const toolbar = evaluate(read);assert.equal(toolbar.cursor.focus.toolbarActive, true);assert.equal(toolbar.cursor.focus.currentFocus, 1);
assert.deepEqual(toolbar.cursor.primary.center, { x: 76, y: 16.5 });assert.equal(toolbar.cursor.presentation.primaryScale.appliedFrame, 11);
const toolbarCapture = evaluate(`document.querySelector('[role=application]').captureScreensAt(0,'2026-09-23T12:06:00Z')`);
point('Touch_76_137');browser('mouse', 'down');browser('mouse', 'up');settle();
const touchFromToolbar = sample(150);
assert.ok(touchFromToolbar.every(row => !row.cursor.focus.toolbarActive && row.menu === 'folder'));
assert.ok(touchFromToolbar.some(row => row.cursor.presentation.effects.some(effect =>
 effect.target?.kind === 'toolbar' && effect.target.focus === 1 && effect.scale.appliedFrame === 11)), 'Accepted grid touch retains its departed toolbar effect');
assert.equal(evaluate(read).cursor.focus.toolbarActive, false);
focus(/button "Right" \[ref=(e\d+)\]/);browser('press', 'Enter');settle();
const quick = sample(250);assert.ok(quick.every(row => row.cursor.visibleSlot === 1), 'Synchronous accessible down/up moves exactly once');
point('DPAD_left');browser('mouse', 'down');browser('mouse', 'up');settle();
assert.equal(evaluate(read).cursor.visibleSlot, 0);
// The physical circle pad is a drag surface: its down point is neutral origin.
point('CIRCLE_down');browser('mouse', 'down');point('CIRCLE_up');
let circleUp;
try { circleUp = sample(450); }
finally { browser('mouse', 'up'); }
assert.ok(circleUp.some(row => row.cursor.producer.repeatCandidate === 0x40 && row.cursor.focus.toolbarActive && row.cursor.primary.center.y === 16.5));
focus(/application .* \[ref=(e\d+)\]/);
if (!evaluate(read).cursor.focus.toolbarActive) { browser('press', 'ArrowUp');sample(100); }
point('CIRCLE_up');browser('mouse', 'down');point('CIRCLE_down');
let circleDown;
try { circleDown = sample(450); }
finally { browser('mouse', 'up'); }
assert.ok(circleDown.some(row => row.cursor.producer.repeatCandidate === 0x80 && !row.cursor.focus.toolbarActive && row.cursor.primary.center.y === 137));
focus(/application .* \[ref=(e\d+)\]/);
if (evaluate(read).cursor.focus.toolbarActive) { browser('press', 'ArrowDown');sample(100); }
settle();assert.equal(evaluate(read).cursor.visibleSlot, 0);
point('DPAD_right');browser('mouse', 'down');
let held;
try { held = sample(2000); } finally { browser('mouse', 'up'); }
settle();const released = sample(250);
assert.ok(held.some(row => row.cursor.mode === 3), 'Physical held direction enters native scrolling');
assert.ok(held.some(row => row.cursor.mode3.entryCount === 5 && row.cursor.step === 3), 'Repeated mode3 entries accelerate Loop');
assert.ok(held.some(row => row.cursor.presentation.effects.some(effect => effect.visible)), 'Departure effects have live submitted poses');
assert.ok(released.every(row => row.cursor.mode3.entryCount === 0 && row.cursor.mode3.pendingMask === 0 && row.cursor.step === 1));
// Restore the documented reference precondition using the actual physical control.
point('DPAD_left');browser('mouse', 'down');try { sample(3000); } finally { browser('mouse', 'up'); }
settle();assert.equal(evaluate(read).cursor.visibleSlot, 0);
const capture = evaluate(`document.querySelector('[role=application]').captureScreensAt(0,'2026-09-23T12:06:00Z')`);
const errors = browser('errors');assert.ok(!errors || /No errors/i.test(errors), errors);
const summary = { passed: true, nativeToolbar: true, acceptedToolbarTouch: true, quickActivationOnce: true, physicalMode3: true,
 circlePadYDirection: true, acceleratedLoop: true, departedEffects: true, releaseReset: true, referenceRestored: true };
mkdirSync(values['artifact-dir'], { recursive: true });
writeFileSync(join(values['artifact-dir'], `${values.name}.json`), JSON.stringify({ summary, initial, toolbar, touchFromToolbar, quick, circleUp, circleDown, held, released, capture }, null, 2));
writeFileSync(join(values['artifact-dir'], `${values.name}-toolbar.png`), Buffer.from(toolbarCapture.bottom.split(',')[1], 'base64'));
writeFileSync(join(values['artifact-dir'], `${values.name}-restored.png`), Buffer.from(capture.bottom.split(',')[1], 'base64'));
console.log(JSON.stringify(summary, null, 2));
