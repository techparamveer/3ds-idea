#!/usr/bin/env node
// Observe real browser Back input without changing reducers or their clock.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { parseArgs } from 'node:util';
const { values } = parseArgs({ options: {
 'artifact-dir': { type: 'string' }, 'browser-bin': { type: 'string', default: 'agent-browser' },
 name: { type: 'string', default: 'home-live-close' }, session: { type: 'string', default: 'firmware-native-check' },
} });
if (!values['artifact-dir'] || !isAbsolute(values['artifact-dir']) || !/^[a-z0-9-]+$/.test(values.name)) throw Error('Supply absolute --artifact-dir and simple --name');
function browser(...args) {
 const r = spawnSync(values['browser-bin'], ['--session', values.session, ...args], { encoding: 'utf8', timeout: 30000, maxBuffer: 12 * 1024 * 1024 });
 if (r.error || r.status !== 0) throw Error(r.error?.message ?? r.stderr ?? r.stdout);
 return r.stdout.trim();
}
const evaluate = code => JSON.parse(browser('eval', code));
const read = `(()=>{const h=document.querySelector('[role=application]');return {updates:Number(h.dataset.homeUpdates),cursor:JSON.parse(h.dataset.homeCursor),close:JSON.parse(h.dataset.folderClose),menu:h.dataset.menu};})()`;
const initial = evaluate(read);assert.equal(initial.menu, 'folder');assert.ok(initial.cursor.primary.layoutVisible);
const ref = browser('snapshot', '-i').match(/application .* \[ref=(e\d+)\]/)?.[1];assert.ok(ref);browser('focus', `@${ref}`);
// The observer stores only existing public diagnostic snapshots; no app state
// injection, event dispatch, scheduler replacement or synthetic elapsed time.
evaluate(`(()=>{const h=document.querySelector('[role=application]');const trace={rows:[],observer:null};trace.observer=new MutationObserver(()=>trace.rows.push(${read}));trace.observer.observe(h,{attributes:true,attributeFilter:['data-home-updates','data-home-cursor','data-folder-close']});window.__homeCloseReview=trace;return true;})()`);
let rows;
try {
 browser('press', 'Escape');
 browser('wait', '--fn', `JSON.parse(document.querySelector('[role=application]').dataset.folderClose)?.controller.phase==='complete'`);
 rows = evaluate('window.__homeCloseReview.rows');
} finally { evaluate('(()=>{window.__homeCloseReview?.observer.disconnect();delete window.__homeCloseReview;return true;})()'); }
const closing = rows.filter(row => row.close?.controller.phase === 'closing');assert.ok(closing.length > 0);
const start = closing[0], C = start.close.startedAtUpdate;
for (const row of rows.filter(row => row.close?.startedAtUpdate === C)) {
 const restored = row.close.restoredAtUpdate;
 if (restored === null) {
  assert.equal(row.cursor.primary.layoutVisible, false);
  assert.equal(row.cursor.currentFrame, start.cursor.currentFrame);
 } else {
  assert.equal(restored, C + 18);assert.equal(row.cursor.primary.layoutVisible, true);
  assert.equal(row.cursor.currentFrame, (start.cursor.currentFrame + row.updates - restored + 1) % 60);
 }
}
const final = evaluate(read);assert.equal(final.menu, 'home');assert.equal(final.close.controller.phase, 'complete');
assert.equal(final.close.restoredAtUpdate, C + 18);
// This observed path requires an in-viewport parent; offscreen cases are in the
// original-ARM/System fixture and are not fabricated by browser state injection.
assert.equal(final.close.selectionReadyAtUpdate, C + 18);
browser('press', 'Enter');browser('wait', '--fn', `document.querySelector('[role=application]').dataset.menu==='folder'`);
const summary = { passed: true, hiddenDuringClose: true, restoredAt18: true, samePassLoopResume: true, folderReopened: true };
mkdirSync(values['artifact-dir'], { recursive: true });
writeFileSync(join(values['artifact-dir'], `${values.name}.json`), JSON.stringify({ summary, initial, rows, final }, null, 2));
console.log(JSON.stringify(summary, null, 2));
