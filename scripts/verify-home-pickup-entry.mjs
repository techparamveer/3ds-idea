#!/usr/bin/env node
// Actual projected pointer input, with read-only state/paint observations.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { parseArgs } from 'node:util';
const { values } = parseArgs({ options: {
 'artifact-dir': { type: 'string' }, 'browser-bin': { type: 'string', default: 'agent-browser' },
 name: { type: 'string', default: 'home-pickup-entry' }, session: { type: 'string', default: 'firmware-native-check' },
 reduced: { type: 'boolean', default: false },
} });
if (!values['artifact-dir'] || !isAbsolute(values['artifact-dir']) || !/^[a-z0-9-]+$/.test(values.name)) throw Error('Supply absolute --artifact-dir and simple --name');
function browser(...args) {
 const r = spawnSync(values['browser-bin'], ['--session', values.session, ...args], { encoding: 'utf8', timeout: 30000, maxBuffer: 16 * 1024 * 1024 });
 if (r.error || r.status !== 0) throw Error(r.error?.message ?? r.stderr ?? r.stdout);
 return r.stdout.trim();
}
const evaluate = code => JSON.parse(browser('eval', code));
const read = `(()=>{const h=document.querySelector('[role=application]');return {updates:Number(h.dataset.homeUpdates),cursor:JSON.parse(h.dataset.homeCursor),paint:JSON.parse(h.dataset.screenPaint),menu:h.dataset.menu,rows:Number(h.dataset.rows),parent:Number(h.dataset.selected),app:h.dataset.app,audio:JSON.parse(h.dataset.audio)};})()`;
const wait = fn => browser('wait', '--fn', fn);
const idle = () => wait(`(()=>{const c=JSON.parse(document.querySelector('[role=application]').dataset.homeCursor);return c.mode===0&&!c.tileTouch.globalCapture&&!c.tileTouch.pending.length;})()`);
function focus() {
 const ref = browser('snapshot', '-i').match(/application .* \[ref=(e\d+)\]/)?.[1];assert.ok(ref);browser('focus', `@${ref}`);
}
function navigate(slot) {
 for (let attempts = 0; attempts < 60; attempts++) {
  const s = evaluate(read), current = s.cursor.selectedSlot, rows = s.rows;
  if (current === slot) return;
  browser('press', Math.floor(current / rows) !== Math.floor(slot / rows)
   ? current < slot ? 'ArrowRight' : 'ArrowLeft' : current % rows < slot % rows ? 'ArrowDown' : 'ArrowUp');
  idle();
 }
 throw Error('Could not navigate to requested slot with actual controls');
}
function point(name) {
 const xy = evaluate(`JSON.parse(document.querySelector('[role=application]').dataset.targets)[${JSON.stringify(name)}]`);
 assert.ok(Array.isArray(xy));browser('mouse', 'move', ...xy.map(v => String(Math.round(v))));
}
function observe() {
 evaluate(`(()=>{const h=document.querySelector('[role=application]');const t={rows:[],observer:null};t.observer=new MutationObserver(()=>t.rows.push(${read}));t.observer.observe(h,{attributes:true,attributeFilter:['data-home-updates','data-home-cursor']});window.__pickupReview=t;return true;})()`);
}
function finish() { return evaluate('(()=>{const t=window.__pickupReview;t.observer.disconnect();delete window.__pickupReview;return t.rows;})()'); }
const capture = () => evaluate(`document.querySelector('[role=application]').captureScreensAt(0,'2026-09-23T12:06:00Z')`);
wait(`document.querySelector('[role=application]')?.dataset.menu==='folder'`);
const initial = evaluate(read);assert.equal(initial.menu, 'folder');assert.equal(initial.cursor.selectedSlot, 0);assert.equal(initial.app, '');
assert.equal(evaluate('matchMedia("(prefers-reduced-motion: reduce)").matches'), values.reduced);
focus();browser('press', 'Escape');wait(`document.querySelector('[role=application]').dataset.menu==='home'`);idle();navigate(0);
point(evaluate(read).rows === 1 ? 'Touch_76_137' : 'Touch_52_76');observe();
let held, heldCapture, rootTrace;
try {
 browser('mouse', 'down');wait(`JSON.parse(document.querySelector('[role=application]').dataset.homeCursor).mode===14`);
 held = evaluate(read);heldCapture = capture();
 wait(`Number(document.querySelector('[role=application]').dataset.homeUpdates)>=${held.updates + 4}`);
} finally { browser('mouse', 'up');rootTrace = finish(); }
idle();
const rows = rootTrace.filter(row => row.cursor.tilePickup);
assert.ok(rows.length >= 2, 'Stationary pickup survives multiple browser updates');
assert.ok(rootTrace.some(row => row.cursor.tileTouch.widgets[0]?.state === 1 && !row.cursor.tilePickup), 'Press precedes pickup');
for (const row of rows) {
 const c = row.cursor, widget = c.tileTouch.widgets[0];
 assert.equal(c.mode, 14);assert.equal(c.primary.layoutVisible, false);assert.equal(c.primary.request, 2);
 assert.equal(c.currentFrame, rows[0].cursor.currentFrame);assert.equal(c.appliedFrame, rows[0].cursor.appliedFrame);
 assert.deepEqual(c.tileCandidate, { folder: null, slot: 0 });
 assert.equal(widget.longPressFlag, true);assert.equal(widget.capture, true);
 assert.deepEqual(c.tilePoses[0], { clip: 'select', frame: 1 });
 assert.equal(widget.select.currentFrame, 0);assert.equal(widget.select.status, 1);
 assert.equal(c.tilePickup.scale.appliedFrame, c.tilePickup.scale.currentFrame);
 assert.equal(c.tilePickup.blankScale.appliedFrame, c.tilePickup.blankScale.currentFrame);
 assert.equal(c.tilePickup.priority, 375);assert.equal(c.tilePickup.rootScale, 1);
}
assert.equal(held.audio.lastPlayed, 'grab');assert.equal(held.menu, 'home');
if (values.reduced) assert.deepEqual(held.paint.cursor.tilePickup, held.cursor.tilePickup, 'Reduced-motion LCD refreshes the newly submitted pickup');
const dropped = evaluate(read);assert.equal(dropped.cursor.tilePickup, null);assert.equal(dropped.cursor.primary.layoutVisible, true);assert.equal(dropped.menu, 'home');
focus();navigate(initial.parent);browser('press', 'Enter');wait(`document.querySelector('[role=application]').dataset.menu==='folder'`);idle();
point('Touch_160_137');observe();
let vacantHeld, vacantTrace;
try {
 browser('mouse', 'down');wait(`JSON.parse(document.querySelector('[role=application]').dataset.homeCursor).tileTouch.widgets[1]?.longPressFlag===true`);
 vacantHeld = evaluate(read);
} finally { browser('mouse', 'up');vacantTrace = finish(); }
idle();
assert.equal(vacantHeld.cursor.tilePickup, null);assert.equal(vacantHeld.cursor.selectedSlot, 0);
assert.equal(vacantHeld.cursor.primary.layoutVisible, true);assert.equal(vacantHeld.audio.lastPlayed, 'touch');
assert.deepEqual(vacantHeld.cursor.tilePoses[1], { clip: 'select', frame: 0 });
const restored = evaluate(read);assert.equal(restored.cursor.selectedSlot, 0);assert.equal(restored.parent, initial.parent);
assert.equal(restored.cursor.tileTouch.widgets[1].decide.appliedFrame, null);
assert.equal(restored.cursor.tileTouch.globalCapture, false);
const errors = browser('errors');assert.ok(!errors || /No errors/i.test(errors), errors);
const summary = { passed: true, countedPickup: true, originalAndPrimaryFrozen: true, nativeGrabCue: true,
 vacancyDoesNotPickUpOrSelect: true, browserDropBridge: true, referenceRestored: true, reducedMotion: values.reduced,
 limits: ['Zero-anchor browser placement; native initializer unresolved', 'Authored movement/drop bridge', 'No Azahar pickup pixel comparison'] };
mkdirSync(values['artifact-dir'], { recursive: true });
writeFileSync(join(values['artifact-dir'], `${values.name}.json`), JSON.stringify({ summary, initial, held, rootTrace, dropped, vacantHeld, vacantTrace, restored, heldCapture }, null, 2));
writeFileSync(join(values['artifact-dir'], `${values.name}-held.png`), Buffer.from(heldCapture.bottom.split(',')[1], 'base64'));
console.log(JSON.stringify(summary, null, 2));
