#!/usr/bin/env node
// Real projected browser pointer input. All observation is read-only.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { parseArgs } from 'node:util';
const { values } = parseArgs({ options: {
 'artifact-dir': { type: 'string' }, 'browser-bin': { type: 'string', default: 'agent-browser' },
 name: { type: 'string', default: 'home-live-touch' }, session: { type: 'string', default: 'firmware-native-check' },
} });
if (!values['artifact-dir'] || !isAbsolute(values['artifact-dir']) || !/^[a-z0-9-]+$/.test(values.name)) throw Error('Supply absolute --artifact-dir and simple --name');
function browser(...args) {
 const r = spawnSync(values['browser-bin'], ['--session', values.session, ...args], { encoding: 'utf8', timeout: 30000, maxBuffer: 12 * 1024 * 1024 });
 if (r.error || r.status !== 0) throw Error(r.error?.message ?? r.stderr ?? r.stdout);
 return r.stdout.trim();
}
const evaluate = code => JSON.parse(browser('eval', code));
const read = `(()=>{const h=document.querySelector('[role=application]');return {updates:Number(h.dataset.homeUpdates),cursor:JSON.parse(h.dataset.homeCursor),menu:h.dataset.menu,audio:JSON.parse(h.dataset.audio)};})()`;
const initial = evaluate(read);
assert.equal(initial.menu, 'folder');assert.equal(initial.cursor.selectedSlot, 0);
assert.equal(initial.cursor.focus.toolbarActive, false);
assert.equal(evaluate('matchMedia("(prefers-reduced-motion: reduce)").matches'), false);
const point = name => {
 const xy = evaluate(`JSON.parse(document.querySelector('[role=application]').dataset.targets)[${JSON.stringify(name)}]`);
 assert.ok(Array.isArray(xy));browser('mouse', 'move', ...xy.map(v => String(Math.round(v))));
};
const settled = slot => browser('wait', '--fn', `(()=>{const c=JSON.parse(document.querySelector('[role=application]').dataset.homeCursor);return c.selectedSlot===${slot}&&!c.tileTouch.globalCapture&&Object.values(c.tileTouch.widgets).every(w=>w.state===0);})()`);
function observe() {
 evaluate(`(()=>{const h=document.querySelector('[role=application]');const trace={rows:[],observer:null};trace.observer=new MutationObserver(()=>trace.rows.push(${read}));trace.observer.observe(h,{attributes:true,attributeFilter:['data-home-updates','data-home-cursor']});window.__homeTouchReview=trace;return true;})()`);
}
function finish() {
 return evaluate('(()=>{const t=window.__homeTouchReview;t.observer.disconnect();delete window.__homeTouchReview;return t.rows;})()');
}
point('Touch_160_137');observe();
let rows;
try { browser('mouse', 'down');browser('mouse', 'up');settled(1); }
finally { rows = finish(); }
const pressed = rows.filter(row => row.cursor.tileTouch.widgets[1]?.state === 1);
assert.ok(pressed.length, 'Actual pointer press reaches the native widget');
for (const row of pressed) {
 assert.equal(row.cursor.selectedSlot, 0);
 assert.equal(row.cursor.primary.layoutVisible, true);
 assert.deepEqual(row.cursor.primary.center, initial.cursor.primary.center);
}
for (const row of pressed) assert.equal(row.cursor.currentFrame,
 (initial.cursor.currentFrame + row.updates - initial.updates) % 60,
 'Primary Loop consumes every visible update through the press');
const waiting = rows.filter(row => row.cursor.tileTouch.widgets[1]?.state === 2);
assert.ok(waiting.length, 'Release leaves an observable Decide wait');
assert.ok(waiting.every(row => row.cursor.selectedSlot === 0));
const selected = evaluate(read);assert.equal(selected.cursor.selectedSlot, 1);assert.equal(selected.audio.lastPlayed, 'touch');
assert.deepEqual(selected.cursor.primary.center, { x: 160, y: 137 });
point('Touch_160_137');browser('mouse', 'down');browser('mouse', 'up');settled(1);
const second = evaluate(read);assert.equal(second.menu, 'folder');assert.equal(second.audio.lastPlayed, 'touch');
point('Touch_76_137');browser('mouse', 'down');browser('mouse', 'up');settled(0);
const restored = evaluate(read);assert.equal(restored.cursor.selectedSlot, 0);
const capture = evaluate(`document.querySelector('[role=application]').captureScreensAt(0,'2026-09-23T12:06:00Z')`);
const errors = browser('errors');assert.ok(!errors || /No errors/i.test(errors), errors);
const summary = { passed: true, delayedAcceptance: true, primaryRetainedDuringPress: true,
 loopContinues: true, touchCueOnly: true, sameVacancyInert: true, referenceRestored: true };
mkdirSync(values['artifact-dir'], { recursive: true });
writeFileSync(join(values['artifact-dir'], `${values.name}.json`), JSON.stringify({ summary, initial, rows, selected, second, restored, capture }, null, 2));
writeFileSync(join(values['artifact-dir'], `${values.name}-restored.png`), Buffer.from(capture.bottom.split(',')[1], 'base64'));
console.log(JSON.stringify(summary, null, 2));
