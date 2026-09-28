#!/usr/bin/env node
// Run against an open empty folder with normal motion. Inputs use real browser
// keypresses; only existing dev diagnostics and read-only capture hooks are read.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { parseArgs } from 'node:util';
const { values } = parseArgs({ options: {
 'artifact-dir': { type: 'string' }, 'browser-bin': { type: 'string', default: 'agent-browser' },
 name: { type: 'string', default: 'home-cursor' }, session: { type: 'string', default: 'firmware-native-check' },
} });
if (!values['artifact-dir'] || !isAbsolute(values['artifact-dir']) || !/^[a-z0-9-]+$/.test(values.name)) throw new Error('Supply an absolute --artifact-dir and simple --name');
const browser = (...args) => {
 const result = spawnSync(values['browser-bin'], ['--session', values.session, ...args], { encoding: 'utf8', timeout: 30000, maxBuffer: 8 * 1024 * 1024 });
 if (result.error || result.status !== 0) throw new Error(result.error?.message ?? result.stderr ?? result.stdout);
 return result.stdout.trim();
};
const evaluate = code => JSON.parse(browser('eval', code));
const read = `(()=>{const h=document.querySelector('[role=application]');return {updates:Number(h.dataset.homeUpdates),cursor:JSON.parse(h.dataset.homeCursor),menu:h.dataset.menu,preferences:h.dataset.preferences,sleeping:h.dataset.sleeping};})()`;
const sample = ms => evaluate(`new Promise(resolve=>{const frames=[],start=performance.now();function next(){frames.push(${read});if(performance.now()-start>=${ms})resolve(frames);else requestAnimationFrame(next);}requestAnimationFrame(next);})`);
function focus(pattern) {
 const ref = browser('snapshot', '-i').match(pattern)?.[1];
 if (!ref) throw new Error('Expected fresh accessible control missing');
 browser('focus', `@${ref}`);
}
function advancing(frames) {
 assert.ok(frames.at(-1).updates > frames[0].updates);
 for (const item of frames) {
  assert.notEqual(item.cursor.visibleSlot, null);
  const delta = item.updates - frames[0].updates;
  assert.equal(item.cursor.currentFrame, (frames[0].cursor.currentFrame + delta) % 60);
  assert.equal(item.cursor.appliedFrame, (item.cursor.currentFrame + 59) % 60);
 }
}
function frozen(frames) {
 for (const item of frames) {
  assert.equal(item.cursor.visibleSlot, null);
  assert.equal(item.updates, frames[0].updates);
  assert.equal(item.cursor.currentFrame, frames[0].cursor.currentFrame);
  assert.equal(item.cursor.appliedFrame, frames[0].cursor.appliedFrame);
 }
}
const initial = evaluate(read);
assert.equal(initial.menu, 'folder');
assert.equal(evaluate('matchMedia("(prefers-reduced-motion: reduce)").matches'), false);
const paints = evaluate(`(()=>{const h=document.querySelector('[role=application]'),a=h.captureScreensAt(1000,'2026-09-23T12:06:00Z'),b=h.captureScreensAt(500000,'2026-09-23T12:06:00Z');return {first:{updates:a.homeUpdates,cursor:a.homeCursor},second:{updates:b.homeUpdates,cursor:b.homeCursor},sameBottom:a.bottom===b.bottom};})()`);
assert.deepEqual(paints.first, paints.second);assert.equal(paints.sameBottom, true);
const normal = sample(800);advancing(normal);
focus(/button "Sound and layout" \[ref=(e\d+)\]/);browser('press', 'Enter');
const overlay = sample(500);assert.ok(overlay.every(item => item.preferences === 'true'));frozen(overlay);
focus(/application .* \[ref=(e\d+)\]/);browser('press', 'Escape');
const resumed = sample(500);advancing(resumed);
assert.equal(resumed[0].cursor.currentFrame, (overlay[0].cursor.currentFrame + resumed[0].updates - overlay[0].updates) % 60);
browser('press', 'Space');
const sleep = sample(500);assert.ok(sleep.every(item => item.sleeping === 'true'));frozen(sleep);
browser('press', 'Space');
const wake = sample(600);advancing(wake);
assert.equal(wake[0].cursor.currentFrame, (sleep[0].cursor.currentFrame + wake[0].updates - sleep[0].updates) % 60);
const summary = { passed: true, repeatedPaintsStable: true, normalUpdates: normal.at(-1).updates-normal[0].updates, overlayFrozen: true, sleepFrozen: true, retainedAfterResume: true };
mkdirSync(values['artifact-dir'], { recursive: true });
writeFileSync(join(values['artifact-dir'], `${values.name}.json`), JSON.stringify({ summary, initial, paints, normal, overlay, resumed, sleep, wake }, null, 2));
console.log(JSON.stringify(summary, null, 2));
