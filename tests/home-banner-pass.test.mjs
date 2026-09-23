import test from 'node:test';
import assert from 'node:assert/strict';
import { createHomeBannerHost, crossHomeBannerBoundary, stepHomeBannerHost, getHomeBannerHostView } from '../src/os/home-banner-host.ts';

const inputs = patch => ({ managerInhibited: false, sceneInhibited: false, loadInhibited: false,
 nativeWorkerReady: true, resourceReady: null, ...patch });
const folder = (key = 'a', label = 'Folder A') => ({ kind: 'folder', key, label, nativeType: 9 });
const fresh = () => createHomeBannerHost({ generation: 'ordinary-session', updateCount: 0 }, inputs());
const boundary = (host, change) => crossHomeBannerBoundary(host, host.clock, change);
const pass = (host, changes) => stepHomeBannerHost(host, { ...host.clock, updateCount: host.clock.updateCount + 1 }, changes);
const view = getHomeBannerHostView;
const motion = host => view(host).primary.motion;
function ready(host) { return boundary(host, { inputs: { ...host.inputs, resourceReady: view(host).resourceTicket } }); }
function requested() { return ready(boundary(fresh(), { selection: folder() })); }
function advance(host, updates) { return crossHomeBannerBoundary(host, { ...host.clock, updateCount: host.clock.updateCount + updates }); }

test('phased ordinary passes retain existing native gate, activation, hide and clip observations', () => {
 // The original gate/clip fixtures are asserted in home-banner-service.test.mjs;
 // this differential check protects them while introducing the lower boundary.
 let previous = requested(), phased = previous;
 for (let i = 0; i < 40; i++) {
  if (i === 15) {
   previous = ready(boundary(previous, { selection: folder('b', 'Folder B') }));
   phased = ready(boundary(phased, { selection: folder('b', 'Folder B') }));
  }
  const original = structuredClone(phased);
  previous = advance(previous, 1); phased = pass(phased);
  assert.deepEqual(phased, previous, `ordinary pass${i}`);
  assert.equal(original.clock.updateCount, i);
 }
});

test('input requests run before the same upper pass; lower requests wait for the next upper pass', () => {
 const old = advance(requested(), 13);
 const fromInput = pass(old, { beforeManager: { selection: folder('b', 'B') } });
 const fromLower = pass(old, { afterManager: { selection: folder('b', 'B') } });
 assert.equal(view(fromInput).stage, 'hiding');
 assert.equal(view(fromLower).stage, 'active');
 assert.equal(fromLower.service.lifecycle.requestPending, true);
 assert.equal(view(fromInput).primary.selection.key, 'a');
 assert.equal(view(fromLower).primary.selection.key, 'a');
 assert.equal(view(pass(fromLower)).stage, 'hiding');
 assert.equal(fromInput.clock.updateCount, old.clock.updateCount + 1);
 assert.equal(fromLower.clock.updateCount, old.clock.updateCount + 1);
});

test('activation before a lower retarget retains the activated request identity and label', () => {
 const loading = advance(requested(), 6);
 assert.equal(view(loading).stage, 'loading');
 const host = pass(loading, { afterManager: { selection: folder('b', 'New pending label') } });
 assert.equal(view(host).status, 'active');
 assert.equal(view(host).primary.selection.key, 'a');
 assert.equal(view(host).primary.selection.label, 'Folder A');
 assert.equal(host.pending.selection.label, 'New pending label');
 assert.equal(motion(host).yawCounter, 1);
 assert.equal(motion(host).skeletal.frame, 1);
 assert.equal(motion(host).material.frame, 1);
 assert.equal(host.inputs.resourceReady, null);
 assert.equal(view(pass(host)).stage, 'hiding');
});

test('independent gates are evaluated at their actual manager and scene phases', () => {
 const old = advance(requested(), 13), oldMotion = motion(old);
 const managerOnly = pass(old, { afterManager: { inputs: { ...old.inputs, managerInhibited: true, sceneInhibited: true } } });
 assert.equal(motion(managerOnly).yawCounter, oldMotion.yawCounter + 1);
 assert.equal(motion(managerOnly).skeletal.frame, oldMotion.skeletal.frame);
 const sceneOnly = pass(managerOnly, { afterManager: { inputs: { ...managerOnly.inputs, sceneInhibited: false } } });
 assert.equal(motion(sceneOnly).yawCounter, motion(managerOnly).yawCounter);
 assert.equal(motion(sceneOnly).skeletal.frame, oldMotion.skeletal.frame + 1);
 assert.equal(sceneOnly.service.clock.updateCount, sceneOnly.clock.updateCount);
});

test('readiness before the manager can activate; acknowledgement after it waits one pass', () => {
 const loading = advance(boundary(fresh(), { selection: folder() }), 6);
 const ack = { inputs: { ...loading.inputs, resourceReady: view(loading).resourceTicket } };
 const before = pass(loading, { beforeManager: ack });
 const after = pass(loading, { afterManager: ack });
 assert.equal(view(before).status, 'active'); assert.equal(motion(before).skeletal.frame, 1);
 assert.equal(view(after).status, 'pending'); assert.equal(view(after).stage, 'loading');
 const next = pass(after); assert.equal(view(next).status, 'active'); assert.equal(motion(next).skeletal.frame, 1);
});

test('lower replacement rejects an old request ticket before later activation', () => {
 const loading = advance(requested(), 6), oldTicket = view(loading).resourceTicket;
 let host = pass(loading, { beforeManager: { inputs: { ...loading.inputs, nativeWorkerReady: false } },
  afterManager: { selection: folder('b', 'B'), inputs: inputs({ resourceReady: oldTicket }) } });
 assert.equal(host.inputs.resourceReady, null);
 host = pass(host); assert.equal(view(host).status, 'pending');
 host = ready(host); host = pass(host); assert.equal(view(host).primary.selection.key, 'b');
});

test('unsupported app handoffs retain explicit scope policy across both phase boundaries', () => {
 const old = advance(requested(), 13);
 const dropped = pass(old, { afterManager: { selection: { kind: 'app', id: 'work' } } });
 assert.equal(view(dropped).status, 'unsupported'); assert.equal(dropped.service, null);
 const resumed = pass(dropped, { beforeManager: { selection: folder('a', 'A') } });
 assert.equal(view(resumed).status, 'pending'); assert.equal(resumed.service.waitUpdates, 1);
 assert.equal(resumed.scope, old.scope + 1); assert.equal(resumed.service.clock.updateCount, resumed.clock.updateCount);
});

test('a supported scope first created after the manager gets only the later scene pass', () => {
 for (const beforeManager of [undefined, { selection: { kind: 'app', id: 'work' } }]) {
  const host = pass(fresh(), { beforeManager, afterManager: { selection: folder() } });
  assert.equal(host.service.lifecycle.managerUpdates, 0);
  assert.equal(host.service.lifecycle.sceneUpdates, 1);
  assert.equal(host.service.waitUpdates, 0);
  assert.equal(host.service.clock.updateCount, host.clock.updateCount);
  const next = pass(host); assert.equal(next.service.waitUpdates, 1);
 }
});

test('sampling and zero-count boundaries never execute a pass; invalid pass counters fail atomically', () => {
 const host = advance(requested(), 13), original = structuredClone(host);
 view(host); view(host); assert.deepEqual(boundary(host, {}), host);
 for (const updateCount of [0, 12, 13, 15, 13.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
  assert.throws(() => stepHomeBannerHost(host, { ...host.clock, updateCount }), RangeError);
 }
 assert.throws(() => stepHomeBannerHost(host, { generation: 'new', updateCount: 14 }), RangeError);
 assert.deepEqual(host, original);
});
