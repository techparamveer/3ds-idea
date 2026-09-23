import test from 'node:test';
import assert from 'node:assert/strict';
import { createHomeBannerHost, crossHomeBannerBoundary, getHomeBannerHostView, resolveHomeBannerHostSelection } from '../src/os/home-banner-host.ts';
import { createPortfolioState } from '../src/os/system.ts';
import { initialState, reduceMenu, renameFolder } from '../src/os/state.ts';
import { moveHomeItem, selectHomeLocation } from '../src/os/home-layout.ts';

const folder = (key = 'a', label = 'Folder A', nativeType = 9) => ({ kind: 'folder', key, label, nativeType });
const inputs = (patch = {}) => ({ managerInhibited: false, sceneInhibited: false, loadInhibited: false, nativeWorkerReady: true, resourceReady: null, ...patch });
const fresh = (generation = 'session:1', updateCount = 0) => createHomeBannerHost({ generation, updateCount }, inputs());
const at = (host, updateCount, boundary = {}) => crossHomeBannerBoundary(host, { ...host.clock, updateCount }, boundary);
const step = (host, count = 1) => at(host, host.clock.updateCount + count);
const request = (host, selection = folder()) => at(host, host.clock.updateCount, { selection });
const acknowledge = (host, ticket = getHomeBannerHostView(host).resourceTicket) => at(host, host.clock.updateCount, { inputs: { ...host.inputs, resourceReady: ticket } });
const started = (selection = folder()) => acknowledge(request(fresh(), selection));
const activated = (selection = folder()) => step(started(selection), 7);
const settled = (selection = folder()) => step(activated(selection), 6);
const view = getHomeBannerHostView;
const motion = host => view(host).folder.motion;
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value); for (const child of Object.values(value)) freeze(child);
  }
  return value;
}
const root = slot => ({ folder: null, slot });
const createFolder = (state, slot, label) => renameFolder(reduceMenu({ ...selectHomeLocation(state, root(slot)), panel: null }, 'open'), label);

test('first selection establishes a current-count baseline without replay or implicit readiness', () => {
  let host = at(fresh(), 900, { selection: folder() });
  assert.equal(view(host).status, 'pending'); assert.equal(host.service.lifecycle.managerUpdates, 0);
  assert.equal(host.service.clock.updateCount, 900); assert.equal(host.inputs.resourceReady, null);
  host = step(host, 20);
  assert.equal(view(host).status, 'pending'); assert.equal(view(host).stage, 'loading');
  host = acknowledge(host);
  assert.equal(view(host).status, 'pending');
  host = step(host);
  assert.equal(view(host).status, 'active'); assert.equal(motion(host).yawCounter, 1);
  assert.equal(motion(host).skeletal.frame, 1); assert.equal(motion(host).material.frame, 1);
});

test('a new selection at a later boundary cannot retroactively replace the old request', () => {
  const old = activated(), oldEpoch = view(old).folder.activationEpoch;
  let host = at(freeze(old), 13, { selection: folder('b', 'Folder B') });
  assert.equal(motion(host).yawCounter, 7);
  assert.equal(view(host).stage, 'active'); assert.equal(host.service.lifecycle.requestPending, true);
  assert.equal(view(host).folder.selection.label, 'Folder A');
  assert.equal(host.pending.selection.label, 'Folder B'); assert.equal(host.inputs.resourceReady, null);
  host = acknowledge(host); host = step(host);
  assert.equal(view(host).stage, 'hiding'); assert.equal(view(host).folder.activationEpoch, oldEpoch);
  assert.equal(view(host).folder.selection.label, 'Folder A');
});

test('activation crossed inside the old-input batch binds the old pending label before retargeting', () => {
  const host = at(started(folder('a', 'Captured A')), 7, { selection: folder('b', 'Pending B') });
  assert.equal(view(host).status, 'active'); assert.equal(view(host).folder.selection.label, 'Captured A');
  assert.equal(host.pending.selection.label, 'Pending B'); assert.equal(motion(host).yawCounter, 1);
});

test('readiness acknowledgement applies after elapsed waiting ticks, never inside them', () => {
  let host = request(fresh()); const ticket = view(host).resourceTicket;
  host = at(host, 20, { inputs: inputs({ resourceReady: ticket }) });
  assert.equal(view(host).status, 'pending'); assert.equal(view(host).stage, 'loading');
  host = step(host); assert.equal(motion(host).yawCounter, 1);
  assert.equal(host.service.lifecycle.active.activatedAtManagerUpdate, 20);
});

test('pass eligibility changes consume the previous gates, then independently inhibit future passes', () => {
  let host = at(started(), 7, { inputs: inputs({ managerInhibited: true }) });
  assert.equal(view(host).status, 'active'); assert.equal(motion(host).yawCounter, 1);
  host = at(host, 12, { inputs: inputs({ sceneInhibited: true }) });
  assert.equal(motion(host).yawCounter, 1); assert.equal(motion(host).skeletal.frame, 6);
  host = step(host, 3);
  assert.equal(motion(host).yawCounter, 4); assert.equal(motion(host).skeletal.frame, 6);
  host = at(host, 15, { inputs: inputs() });
  host = step(host); assert.equal(motion(host).yawCounter, 5); assert.equal(motion(host).skeletal.frame, 7);
});

test('load and worker readiness remain explicit even when resources are prepared', () => {
  let host = started(); host = at(host, 0, { inputs: { ...host.inputs, loadInhibited: true } });
  host = step(host, 20); assert.equal(host.service.waitUpdates, 0);
  host = at(host, 20, { inputs: { ...host.inputs, loadInhibited: false, nativeWorkerReady: false } });
  host = step(host, 20); assert.equal(host.service.waitUpdates, 5); assert.equal(view(host).stage, 'gate');
  host = at(host, 40, { inputs: { ...host.inputs, nativeWorkerReady: true } });
  host = step(host); assert.equal(view(host).stage, 'loading');
  host = step(host); assert.equal(view(host).status, 'active');
});

test('resource revocation prevents activation and a stale request ticket never activates a retarget', () => {
  let host = at(started(), 6, { inputs: inputs() });
  host = step(host, 20); assert.equal(view(host).status, 'pending');
  const stale = view(host).resourceTicket;
  host = request(host, folder('b', 'B')); host = acknowledge(host, stale);
  assert.equal(host.inputs.resourceReady, null);
  host = step(host, 20); assert.equal(view(host).status, 'pending');
  host = acknowledge(host); host = step(host);
  assert.equal(view(host).folder.selection.key, 'b'); assert.equal(motion(host).yawCounter, 1);
});

test('a stale completion cannot revoke a newer valid acknowledgement; explicit null still revokes', () => {
  let host = started(), stale = view(host).resourceTicket;
  host = acknowledge(request(host, folder('b', 'B')));
  const valid = view(host).resourceTicket;
  host = acknowledge(host, stale);
  assert.deepEqual(host.inputs.resourceReady, valid);
  host = step(host, 7); assert.equal(view(host).folder.selection.key, 'b');
  host = acknowledge(request(host, folder('c', 'C')));
  host = acknowledge(host, null); assert.equal(host.inputs.resourceReady, null);
  host = step(host, 40); assert.equal(view(host).status, 'pending');
});

test('old presentation survives every visible and hidden retained stage before replacement activates', () => {
  let host = acknowledge(request(settled(folder('a', 'Old label')), folder('b', 'New label')));
  for (let i = 1; i <= 11; i++) {
    host = step(host);
    assert.equal(view(host).status, 'active'); assert.equal(view(host).folder.selection.label, 'Old label');
    assert.equal(motion(host).visible, i <= 4);
  }
  host = step(host); assert.equal(view(host).status, 'pending'); assert.equal(view(host).folder, null);
  host = step(host); assert.equal(view(host).status, 'active'); assert.equal(view(host).folder.selection.label, 'New label');
  assert.equal(view(host).folder.activationEpoch, 2); assert.equal(motion(host).yawCounter, 1);
});

test('same-target label observations cannot silently rewrite prepared snapshots', () => {
  let host = request(fresh(), folder('a', 'Prepared label'));
  host = request(host, folder('a', 'Unprepared rename'));
  assert.equal(host.pending.selection.label, 'Prepared label');
  host = step(acknowledge(host), 7);
  assert.equal(view(host).selection.label, 'Unprepared rename');
  assert.equal(view(host).folder.selection.label, 'Prepared label');
});

test('explicit same-instance label refresh changes text without changing motion or tickets', () => {
  const before = settled(), beforeView = view(before);
  const refresh = { generation: beforeView.generation, activationEpoch: beforeView.folder.activationEpoch, key: 'a', label: 'Renamed' };
  const host = at(freeze(before), before.clock.updateCount, { selection: folder('a', 'Renamed'), refreshActiveLabel: refresh });
  assert.equal(view(host).folder.selection.label, 'Renamed'); assert.equal(host.pending.selection.label, 'Renamed');
  assert.equal(motion(host), motion(before)); assert.equal(host.service, before.service);
  assert.deepEqual(view(host).resourceTicket, beforeView.resourceTicket);
  assert.equal(view(before).folder.selection.label, 'Folder A');
});

test('wrong generation/key/activation refreshes and refreshes of outgoing folders are ignored', () => {
  const before = settled(), v = view(before);
  const valid = { generation: v.generation, activationEpoch: v.folder.activationEpoch, key: 'a', label: 'Wrong' };
  for (const patch of [{ generation: 'old' }, { key: 'b' }, { activationEpoch: 0 }]) {
    const host = at(before, before.clock.updateCount, { refreshActiveLabel: { ...valid, ...patch } });
    assert.equal(view(host).folder.selection.label, 'Folder A');
  }
  let host = at(before, before.clock.updateCount, { selection: folder('b', 'B'), refreshActiveLabel: valid });
  assert.equal(view(host).folder.selection.label, 'Folder A');
  host = step(host); host = at(host, host.clock.updateCount, { selection: folder(), refreshActiveLabel: valid });
  assert.equal(view(host).stage, 'hiding'); assert.equal(view(host).folder.selection.label, 'Folder A');
});

test('move retains identity; delete/recreate preserves the outgoing label rather than reading its former slot', () => {
  let menu = createFolder(createPortfolioState(), 40, 'Original');
  let host = settled(resolveHomeBannerHostSelection(menu));
  const active = view(host).folder, ticket = view(host).resourceTicket;
  menu = moveHomeItem(menu, root(40), root(42));
  host = request(host, resolveHomeBannerHostSelection(menu));
  assert.deepEqual(view(host).resourceTicket, ticket); assert.equal(view(host).folder.activationEpoch, active.activationEpoch);
  assert.equal(view(host).folder.motion, active.motion); assert.equal(view(host).folder.selection.label, 'Original');
  menu = reduceMenu({ ...menu, panel: 'delete' }, 'open');
  menu = createFolder(menu, 42, 'Replacement');
  host = step(acknowledge(request(host, resolveHomeBannerHostSelection(menu))));
  assert.equal(view(host).folder.selection.label, 'Original');
  assert.equal(view(host).selection.label, 'Replacement');
  assert.notEqual(view(host).folder.selection.key, view(host).selection.key);
});

test('empty/nonempty native type changes create a new request without reusing its resource ticket', () => {
  const before = settled(), ticket = view(before).resourceTicket;
  let host = request(before, folder('a', 'Now contains software', 10));
  assert.equal(view(host).folder.selection.nativeType, 9); assert.equal(host.inputs.resourceReady, null);
  host = acknowledge(host, ticket); assert.equal(host.inputs.resourceReady, null);
  host = step(acknowledge(host), 13);
  assert.equal(view(host).folder.selection.nativeType, 10); assert.equal(view(host).folder.activationEpoch, 2);
});

test('opened folders resolve selected children or blank; overlays do not fabricate blank selections', () => {
  let menu = createFolder(createPortfolioState(), 40, 'Folder');
  assert.deepEqual(resolveHomeBannerHostSelection(selectHomeLocation(menu, root(0))), { kind: 'app', id: 'work' });
  assert.equal(resolveHomeBannerHostSelection(menu).nativeType, 9);
  menu = moveHomeItem(menu, root(0), { folder: 40, slot: 4 });
  const opened = selectHomeLocation(menu, { folder: 40, slot: 4 });
  assert.deepEqual(resolveHomeBannerHostSelection(opened), { kind: 'app', id: 'work' });
  assert.deepEqual(resolveHomeBannerHostSelection(selectHomeLocation(opened, { folder: 40, slot: 5 })), { kind: 'blank' });
  const parent = selectHomeLocation(opened, root(40)), expected = resolveHomeBannerHostSelection(parent);
  assert.equal(expected.nativeType, 10);
  for (const panel of ['settings', 'rename', 'delete']) assert.deepEqual(resolveHomeBannerHostSelection({ ...parent, panel, powered: false }), expected);
  assert.equal(resolveHomeBannerHostSelection(initialState).kind, 'folder', 'isolated menu identity fallback is supported');
});

test('unsupported app/blank handoff abandons service without guessed native types or visibility', () => {
  let host = at(settled(), 20, { selection: { kind: 'app', id: 'work' } });
  assert.deepEqual(view(host), { status: 'unsupported', selection: { kind: 'app', id: 'work' }, resourceTicket: null });
  assert.equal(host.service, null); assert.equal(host.pending, null); assert.equal(host.active, null); assert.equal(host.inputs.resourceReady, null);
  host = at(host, 200, { selection: { kind: 'blank' } });
  assert.equal(host.scope, 1); assert.equal(host.service, null);
  assert.equal(view(host).status, 'unsupported'); assert.equal(host.clock.updateCount, 200);
});

test('folder-scope reentry is deterministic, starts at the current count and invalidates old tickets', () => {
  const before = settled(), oldTicket = view(before).resourceTicket;
  const unsupported = request(before, { kind: 'blank' });
  let host = at(unsupported, 400, { selection: folder(), inputs: inputs({ resourceReady: oldTicket }) });
  assert.equal(host.scope, 2); assert.equal(host.service.lifecycle.managerUpdates, 0);
  assert.equal(view(host).resourceTicket.requestEpoch, oldTicket.requestEpoch);
  assert.notEqual(view(host).generation, oldTicket.generation); assert.equal(host.inputs.resourceReady, null);
  assert.deepEqual(host, at(unsupported, 400, { selection: folder(), inputs: inputs({ resourceReady: oldTicket }) }));
  host = step(host, 10); assert.equal(view(host).status, 'pending');
  host = step(acknowledge(host)); assert.equal(view(host).folder.activationEpoch, 1); assert.equal(motion(host).yawCounter, 1);
  host = at(host, host.clock.updateCount, { refreshActiveLabel: { generation: oldTicket.generation, activationEpoch: 1, key: 'a', label: 'Previous scope' } });
  assert.equal(view(host).folder.selection.label, 'Folder A');
});

test('new System generation clears presentation/readiness and requires selection to be supplied again', () => {
  const before = settled(), oldTicket = view(before).resourceTicket;
  const cleared = crossHomeBannerBoundary(freeze(before), { generation: 'session:2', updateCount: 900 });
  assert.equal(view(cleared).status, 'unsupported'); assert.equal(cleared.selection, null); assert.equal(cleared.scope, 0);
  let host = crossHomeBannerBoundary(before, { generation: 'session:2', updateCount: 900 }, { selection: folder(), inputs: inputs({ resourceReady: oldTicket }) });
  assert.equal(host.scope, 1); assert.equal(host.service.lifecycle.managerUpdates, 0); assert.equal(host.inputs.resourceReady, null);
  host = step(host, 7); assert.equal(view(host).status, 'pending');
  host = step(acknowledge(host)); assert.equal(motion(host).yawCounter, 1);
  const refresh = { generation: oldTicket.generation, activationEpoch: 1, key: 'a', label: 'Stale session label' };
  host = at(host, host.clock.updateCount, { refreshActiveLabel: refresh });
  assert.equal(view(host).folder.selection.label, 'Folder A');
});

test('same-current reversal before hiding reuses active presentation, reversal during hiding activates anew', () => {
  const before = settled();
  let host = step(request(request(before, folder('b', 'B')), folder('a', 'New A observation')));
  assert.equal(view(host).folder.activationEpoch, 1); assert.equal(view(host).folder.selection.label, 'Folder A');
  host = step(request(before, folder('b', 'B')));
  host = step(acknowledge(request(host, folder('a', 'Reloaded A'))), 12);
  assert.equal(view(host).folder.activationEpoch, 2); assert.equal(view(host).folder.selection.label, 'Reloaded A');
});

test('sampling and zero-count boundaries leave motion unchanged; background stays separate', () => {
  const host = freeze(settled()), snapshot = structuredClone(host);
  for (let i = 0; i < 20; i++) {
    assert.deepEqual(view(host), view(host));
    assert.equal(motion(at(host, host.clock.updateCount)), motion(host));
  }
  assert.deepEqual(host, snapshot);
  assert.equal(host.service.lifecycle.background.attached, false);
  assert.equal(host.service.lifecycle.background.loop.frame, 0);
});

test('constant-input batching equals one-tick stepping through replacement and independent passes', () => {
  for (const patch of [{}, { managerInhibited: true }, { sceneInhibited: true }, { loadInhibited: true }, { nativeWorkerReady: false }]) {
    let host = acknowledge(request(settled(), folder('b', 'B')));
    host = at(host, host.clock.updateCount, { inputs: { ...host.inputs, ...patch } });
    let stepped = host;
    for (let i = 0; i < 40; i++) stepped = step(stepped);
    assert.deepEqual(step(host, 40), stepped);
  }
});

test('input/selection observations are copied and arbitrary extra service requests cannot enter batches', () => {
  const suppliedInputs = inputs(), suppliedSelection = folder();
  let host = createHomeBannerHost({ generation: 'session:1', updateCount: 0 }, suppliedInputs);
  suppliedInputs.managerInhibited = true;
  host = request(host, suppliedSelection); suppliedSelection.label = 'Mutated';
  const ready = { ...view(host).resourceTicket };
  host = at(host, 0, { inputs: { ...host.inputs, resourceReady: ready, request: { target: { kind: 'blank', key: 'invalid', nativeType: 0 } } } });
  ready.requestEpoch = 999;
  host = step(host, 7);
  assert.equal(view(host).folder.selection.label, 'Folder A'); assert.equal(host.service.lifecycle.requested.target.kind, 'folder');
});

test('clock validation covers unsupported intervals and scope generation encoding is unambiguous', () => {
  for (const updateCount of [-1, .5, NaN, Infinity]) assert.throws(() => createHomeBannerHost({ generation: 's', updateCount }, inputs()), RangeError);
  assert.throws(() => fresh(''), RangeError);
  const unsupported = at(fresh(), 10);
  assert.throws(() => at(unsupported, 9), /new System generation/);
  assert.throws(() => request(fresh(), folder('a', 'Invalid type', 0)), RangeError);
  const session = 'session:"1",2';
  assert.deepEqual(JSON.parse(view(request(fresh(session))).generation), ['home-folder-scope', session, 1]);
});
