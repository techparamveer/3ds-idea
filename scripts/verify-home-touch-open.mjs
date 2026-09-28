#!/usr/bin/env node
// Exercise the bounded native touch handoff through the existing portfolio app.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { parseArgs } from 'node:util';
const { values } = parseArgs({ options: {
 'artifact-dir': { type: 'string' }, 'browser-bin': { type: 'string', default: 'agent-browser' },
 name: { type: 'string', default: 'home-touch-open' }, session: { type: 'string', default: 'firmware-native-check' },
} });
if (!values['artifact-dir'] || !isAbsolute(values['artifact-dir']) || !/^[a-z0-9-]+$/.test(values.name)) throw Error('Supply absolute --artifact-dir and simple --name');
function browser(...args) {
 const r = spawnSync(values['browser-bin'], ['--session', values.session, ...args], { encoding: 'utf8', timeout: 30000, maxBuffer: 12 * 1024 * 1024 });
 if (r.error || r.status !== 0) throw Error(r.error?.message ?? r.stderr ?? r.stdout);
 return r.stdout.trim();
}
const evaluate = code => JSON.parse(browser('eval', code));
const read = `(()=>{const h=document.querySelector('[role=application]');return {updates:Number(h.dataset.homeUpdates),cursor:JSON.parse(h.dataset.homeCursor),menu:h.dataset.menu,rows:Number(h.dataset.rows),parent:Number(h.dataset.selected),app:h.dataset.app,dialog:h.dataset.dialog,audio:JSON.parse(h.dataset.audio)};})()`;
const wait = fn => browser('wait', '--fn', fn);
const idle = () => wait(`JSON.parse(document.querySelector('[role=application]').dataset.homeCursor).mode===0`);
function focus() {
 const ref = browser('snapshot', '-i').match(/application .* \[ref=(e\d+)\]/)?.[1];assert.ok(ref);browser('focus', `@${ref}`);
}
function navigate(slot) {
 for (let attempts = 0; attempts < 60; attempts++) {
  const s = evaluate(read), current = s.cursor.selectedSlot, rows = s.rows;
  if (current === slot) return;
  const currentColumn = Math.floor(current / rows), targetColumn = Math.floor(slot / rows);
  browser('press', currentColumn !== targetColumn ? currentColumn < targetColumn ? 'ArrowRight' : 'ArrowLeft' : current % rows < slot % rows ? 'ArrowDown' : 'ArrowUp');
  idle();
 }
 throw Error('Could not navigate to requested slot with actual controls');
}
const initial = evaluate(read);assert.equal(initial.menu, 'folder');assert.equal(initial.app, '');focus();
browser('press', 'Escape');wait(`document.querySelector('[role=application]').dataset.menu==='home'`);idle();
navigate(0);
const before = evaluate(read), target = before.rows === 1 ? 'Touch_76_137' : 'Touch_52_76';
const xy = evaluate(`JSON.parse(document.querySelector('[role=application]').dataset.targets)[${JSON.stringify(target)}]`);
browser('mouse', 'move', ...xy.map(v => String(Math.round(v))));
evaluate(`(()=>{const h=document.querySelector('[role=application]');const trace={rows:[],observer:null};trace.observer=new MutationObserver(()=>trace.rows.push(${read}));trace.observer.observe(h,{attributes:true,attributeFilter:['data-home-updates','data-home-cursor','data-menu']});window.__homeOpenReview=trace;return true;})()`);
let trace;
try {
 browser('mouse', 'down');browser('mouse', 'up');
 wait(`document.querySelector('[role=application]').dataset.menu==='app'`);
} finally {
 trace = evaluate('(()=>{const t=window.__homeOpenReview;t.observer.disconnect();delete window.__homeOpenReview;return t.rows;})()');
}
const app = evaluate(read);assert.equal(app.app, 'work');assert.equal(app.audio.lastPlayed, 'open');
assert.ok(trace.some(row => row.cursor.tileTouch.widgets[0]?.state === 2), 'Actual app tile waits for Decide');
const outsideHome = trace.filter(row => row.menu === 'launch' || row.menu === 'app');
assert.ok(outsideHome.length);
assert.ok(outsideHome.every(row => row.updates === outsideHome[0].updates), 'No HOME count catchup after opening handoff');
assert.ok(outsideHome.every(row => row.cursor.currentFrame === outsideHome[0].cursor.currentFrame), 'Primary Loop stops at handoff');
focus();browser('press', 'h');wait(`document.querySelector('[role=application]').dataset.menu==='home'`);
browser('press', 'Escape');wait(`document.querySelector('[role=application]').dataset.dialog==='close'`);
browser('press', 'Enter');wait(`document.querySelector('[role=application]').dataset.app===''`);
navigate(initial.parent);browser('press', 'Enter');wait(`document.querySelector('[role=application]').dataset.menu==='folder'`);
const restored = evaluate(read);assert.equal(restored.parent, initial.parent);assert.equal(restored.cursor.selectedSlot, initial.cursor.selectedSlot);
const errors = browser('errors');assert.ok(!errors || /No errors/i.test(errors), errors);
const summary = { passed: true, pointerOpensWork: true, delayedHandoff: true, noHomeCatchup: true, appClosed: true, referenceRestored: true };
mkdirSync(values['artifact-dir'], { recursive: true });
writeFileSync(join(values['artifact-dir'], `${values.name}.json`), JSON.stringify({ summary, initial, before, trace, app, restored }, null, 2));
console.log(JSON.stringify(summary, null, 2));
