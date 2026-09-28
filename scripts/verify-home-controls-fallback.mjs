#!/usr/bin/env node
// Fail only the native presentation manifest; exercise real fallback input.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { parseArgs } from 'node:util';
const { values } = parseArgs({ options: {
 'artifact-dir': { type: 'string' }, 'browser-bin': { type: 'string', default: 'agent-browser' },
 name: { type: 'string', default: 'home-controls-fallback' }, session: { type: 'string', default: 'firmware-native-check' },
} });
if (!values['artifact-dir'] || !isAbsolute(values['artifact-dir']) || !/^[a-z0-9-]+$/.test(values.name)) throw Error('Supply absolute --artifact-dir and simple --name');
const browser = (...args) => {
 const r = spawnSync(values['browser-bin'], ['--session', values.session, ...args], { encoding: 'utf8', timeout: 30000 });
 if (r.error || r.status !== 0) throw Error(r.error?.message ?? r.stderr ?? r.stdout);
 return r.stdout.trim();
};
const evaluate = code => JSON.parse(browser('eval', code));
const read = () => evaluate(`(()=>{const h=document.querySelector('[role=application]');return {firmware:h.dataset.firmware,failure:h.dataset.firmwareFailure,menu:h.dataset.menu,cursor:JSON.parse(h.dataset.homeCursor)};})()`);
const initial = read();assert.equal(initial.firmware, 'native-home');assert.equal(initial.menu, 'folder');assert.equal(initial.cursor.visibleSlot, 0);
const manifest = new URL('/os/firmware/10.7.0-32E/manifest.json', browser('get', 'url')).href;
let result;
browser('network', 'route', manifest, '--abort');
try {
 browser('reload');browser('wait', '--fn', `document.querySelector('[role=application]')?.dataset.ready==='true'&&document.querySelector('[role=application]').dataset.menu==='folder'`);
 const before = read();assert.equal(before.firmware, 'fallback');assert.ok(before.failure);assert.equal(before.cursor.primary, undefined);assert.equal(before.cursor.visibleSlot, 0);
 const ref = browser('snapshot', '-i').match(/application .* \[ref=(e\d+)\]/)?.[1];assert.ok(ref);browser('focus', `@${ref}`);
 browser('press', 'ArrowRight');const moved = read();assert.equal(moved.cursor.visibleSlot, 1);
 browser('press', 'ArrowLeft');const restored = read();assert.equal(restored.cursor.visibleSlot, 0);
 result = { passed: true, missingManifestHandled: true, legacyDirectionRoute: true, manifest, before, moved, restored };
} finally {
 browser('network', 'unroute', manifest);browser('reload');
 browser('wait', '--fn', `document.querySelector('[role=application]')?.dataset.ready==='true'&&document.querySelector('[role=application]').dataset.firmware==='native-home'`);
}
mkdirSync(values['artifact-dir'], { recursive: true });
writeFileSync(join(values['artifact-dir'], `${values.name}.json`), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ passed: true, missingManifestHandled: true, legacyDirectionRoute: true, nativeRestored: true }));
