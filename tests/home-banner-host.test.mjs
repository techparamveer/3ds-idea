import test from 'node:test';
import assert from 'node:assert/strict';
import { createHomeBannerHost, crossHomeBannerBoundary, getHomeBannerHostBackgroundFrame, getHomeBannerHostView,
  homeApplicationBannerBoundary, resolveHomeBannerHostSelection, HOME_CLOSE_BANNER_REQUEST_EXIT_FRAME, skipHomeBannerHostPass,
  resetHomeBannerPrimary, stepHomeBannerHost } from '../src/os/home-banner-host.ts';
import { createPortfolioState, launchHomeShortcut, reduceSystem, tickSystem } from '../src/os/system.ts';
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
const motion = host => view(host).primary.motion;
const background = getHomeBannerHostBackgroundFrame;
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value); for (const child of Object.values(value)) freeze(child);
  }
  return value;
}
const root = slot => ({ folder: null, slot });
const createFolder = (state, slot, label) => renameFolder(reduceMenu({ ...selectHomeLocation(state, root(slot)), panel: null }, 'open'), label);

function healthCloseAtFooterExitStart() {
  const home = tickSystem(createPortfolioState(), 3001);
  const launched = tickSystem(launchHomeShortcut(home, 'health-safety', 3010), 6200);
  const suspended = reduceSystem(launched, 'home', 6300);
  let state = reduceSystem(suspended, 'back', 6400), before = suspended;
  for (let i = 0; i < 8 && state.system.homeApplicationTransition?.phase !== 'footer-exiting'; i += 1) {
    before = state;
    state = tickSystem(state, state.system.homeClock.lastNow + 1000);
  }
  assert.equal(before.system.homeApplicationTransition?.phase, 'exit-terminal');
  assert.equal(state.system.homeApplicationTransition?.phase, 'footer-exiting');
  assert.equal(state.system.homeApplicationTransition?.footerExitFrame, 0);
  return { suspended, before, state };
}

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

test('software close requests selected content once, at departure frame 4', () => {
  const { suspended, before, state } = healthCloseAtFooterExitStart();
  assert.deepEqual(homeApplicationBannerBoundary(suspended, reduceSystem(suspended, 'back', 6400)), { kind: 'clear' });
  assert.deepEqual(resolveHomeBannerHostSelection(before), { kind: 'clear' });
  assert.equal(homeApplicationBannerBoundary(before, state), undefined, 'departure frame 0 no longer requests');
  assert.deepEqual(resolveHomeBannerHostSelection(state), { kind: 'clear' });
  const frames = [state];
  for (let frame = 1; frame <= 4; frame += 1) frames.push(tickSystem(frames.at(-1), frames.at(-1).system.homeClock.lastNow + 1000 / 60));
  assert.deepEqual(frames.map(item => item.system.homeApplicationTransition?.footerExitFrame), [0, 1, 2, 3, 4]);
  for (let frame = 1; frame <= 3; frame += 1) {
    assert.equal(homeApplicationBannerBoundary(frames[frame - 1], frames[frame]), undefined);
    assert.deepEqual(resolveHomeBannerHostSelection(frames[frame]), { kind: 'clear' });
  }
  const exit4 = frames[4];
  assert.equal(HOME_CLOSE_BANNER_REQUEST_EXIT_FRAME, 4);
  assert.deepEqual(homeApplicationBannerBoundary(frames[3], exit4), { kind: 'app', id: 'health-safety' });
  assert.deepEqual(resolveHomeBannerHostSelection(exit4), { kind: 'app', id: 'health-safety' },
    'the no-controls fallback must retain the request');
  assert.equal(homeApplicationBannerBoundary(exit4, exit4), undefined);
  assert.deepEqual(homeApplicationBannerBoundary(state, tickSystem(state, state.system.homeClock.lastNow + 1000)),
    { kind: 'app', id: 'health-safety' }, 'a batched step crossing frame 4 requests once');

  const footerTerminal = tickSystem(exit4, exit4.system.homeClock.lastNow + 1000);
  assert.equal(footerTerminal.system.homeApplicationTransition?.phase, 'footer-terminal');
  assert.equal(homeApplicationBannerBoundary(exit4, footerTerminal), undefined);
  assert.deepEqual(resolveHomeBannerHostSelection(footerTerminal), { kind: 'app', id: 'health-safety' });
  const returnStart = tickSystem(footerTerminal, footerTerminal.system.homeClock.lastNow + 1000 / 60);
  assert.equal(returnStart.system.homeApplicationTransition?.phase, 'footer-returning');
  assert.equal(returnStart.system.homeApplicationTransition?.footerReturnFrame, 0);
  assert.equal(homeApplicationBannerBoundary(footerTerminal, returnStart), undefined,
    'return0 must not create a duplicate request epoch');

  const cancelled = { ...exit4, system: { ...exit4.system, homeApplicationTransition: null } };
  assert.deepEqual(homeApplicationBannerBoundary(exit4, cancelled), { kind: 'app', id: 'health-safety' });
  const changed = structuredClone(exit4);
  changed.system.homeFolderClose.generation += 1;
  changed.system.homeApplicationTransition.identity.generation = `home-application:${changed.system.homeFolderClose.generation}`;
  assert.notDeepEqual(homeApplicationBannerBoundary(frames[3], changed), { kind: 'app', id: 'health-safety' },
    'a replacement generation cannot consume the reacquisition boundary');
});

test('departure-frame4 request preserves service gates and cannot show a primary before return6', () => {
  let host = request(fresh(), { kind: 'clear' });
  host = step(host, 2);
  assert.equal(view(host).status, 'cleared');
  host = acknowledge(request(host, { kind: 'app', id: 'health-safety' }));

  const stages = [];
  for (let update = 1; update <= 8; update += 1) {
    host = step(host);
    const current = view(host);
    stages.push([current.stage, current.waitUpdates]);
    assert.equal(current.status, 'pending');
    assert.equal(current.primary, null);
  }
  assert.deepEqual(stages, [
    ['hiding', 0], ['gate', 0], ['gate', 1], ['gate', 2], ['gate', 3], ['gate', 4],
    ['gate', 5], ['loading', 5],
  ]);
  host = step(host);
  assert.equal(view(host).status, 'active');
  assert.deepEqual(view(host).primary.selection, { kind: 'app', id: 'health-safety' });
  assert.equal(motion(host).visibilityCounter, 1);
  assert.equal(motion(host).scale, Math.fround(.8));
});

test('a new selection at a later boundary cannot retroactively replace the old request', () => {
  const old = activated(), oldEpoch = view(old).primary.activationEpoch;
  let host = at(freeze(old), 13, { selection: folder('b', 'Folder B') });
  assert.equal(motion(host).yawCounter, 7);
  assert.equal(view(host).stage, 'active'); assert.equal(host.service.lifecycle.requestPending, true);
  assert.equal(view(host).primary.selection.label, 'Folder A');
  assert.equal(host.pending.selection.label, 'Folder B'); assert.equal(host.inputs.resourceReady, null);
  host = acknowledge(host); host = step(host);
  assert.equal(view(host).stage, 'hiding'); assert.equal(view(host).primary.activationEpoch, oldEpoch);
  assert.equal(view(host).primary.selection.label, 'Folder A');
});

test('activation crossed inside the old-input batch binds the old pending label before retargeting', () => {
  const host = at(started(folder('a', 'Captured A')), 7, { selection: folder('b', 'Pending B') });
  assert.equal(view(host).status, 'active'); assert.equal(view(host).primary.selection.label, 'Captured A');
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
  assert.equal(view(host).primary.selection.key, 'b'); assert.equal(motion(host).yawCounter, 1);
});

test('a stale completion cannot revoke a newer valid acknowledgement; explicit null still revokes', () => {
  let host = started(), stale = view(host).resourceTicket;
  host = acknowledge(request(host, folder('b', 'B')));
  const valid = view(host).resourceTicket;
  host = acknowledge(host, stale);
  assert.deepEqual(host.inputs.resourceReady, valid);
  host = step(host, 7); assert.equal(view(host).primary.selection.key, 'b');
  host = acknowledge(request(host, folder('c', 'C')));
  host = acknowledge(host, null); assert.equal(host.inputs.resourceReady, null);
  host = step(host, 40); assert.equal(view(host).status, 'pending');
});

test('old presentation survives every visible and hidden retained stage before replacement activates', () => {
  let host = acknowledge(request(settled(folder('a', 'Old label')), folder('b', 'New label')));
  for (let i = 1; i <= 11; i++) {
    host = step(host);
    assert.equal(view(host).status, 'active'); assert.equal(view(host).primary.selection.label, 'Old label');
    assert.equal(motion(host).visible, i <= 4);
  }
  host = step(host); assert.equal(view(host).status, 'pending'); assert.equal(view(host).primary, null);
  host = step(host); assert.equal(view(host).status, 'active'); assert.equal(view(host).primary.selection.label, 'New label');
  assert.equal(view(host).primary.activationEpoch, 2); assert.equal(motion(host).yawCounter, 1);
});

test('Camera to Settings replacement keeps Camera as the painted primary until Settings activates', () => {
  let host = settled({ kind: 'app', id: 'camera' });
  assert.deepEqual(view(host).primary.selection, { kind: 'app', id: 'camera' });
  host = acknowledge(request(host, { kind: 'app', id: 'system-settings' }));
  for (let i = 1; i <= 11; i++) {
    host = step(host);
    const current = view(host);
    assert.equal(current.status, 'active', `hide update ${i}`);
    assert.deepEqual(current.selection, { kind: 'app', id: 'system-settings' });
    assert.deepEqual(current.primary.selection, { kind: 'app', id: 'camera' });
    assert.equal(motion(host).visible, i <= 4);
  }
  host = step(host);
  assert.equal(view(host).status, 'pending');
  assert.equal(view(host).primary, null);
  assert.deepEqual(view(host).selection, { kind: 'app', id: 'system-settings' });
  host = step(host);
  assert.equal(view(host).status, 'active');
  assert.deepEqual(view(host).primary.selection, { kind: 'app', id: 'system-settings' });
  assert.equal(motion(host).yawCounter, 1);
  assert.equal(motion(host).skeletal.frame, 1);
  assert.equal(motion(host).visibilityCounter, 1);
  assert.equal(motion(host).scale, Math.fround(.8));
  host = step(host, 4);
  assert.equal(view(host).primary.selection.id, 'system-settings');
  assert.equal(motion(host).visibilityCounter, 5);
  assert.equal(motion(host).scale, Math.fround(Math.fround(.8) + Math.fround(1 * 0.19999998807907104)));
});

test('same-target label observations cannot silently rewrite prepared snapshots', () => {
  let host = request(fresh(), folder('a', 'Prepared label'));
  host = request(host, folder('a', 'Unprepared rename'));
  assert.equal(host.pending.selection.label, 'Prepared label');
  host = step(acknowledge(host), 7);
  assert.equal(view(host).selection.label, 'Unprepared rename');
  assert.equal(view(host).primary.selection.label, 'Prepared label');
});

test('explicit same-instance label refresh changes text without changing motion or tickets', () => {
  const before = settled(), beforeView = view(before);
  const refresh = { generation: beforeView.generation, activationEpoch: beforeView.primary.activationEpoch, key: 'a', label: 'Renamed' };
  const host = at(freeze(before), before.clock.updateCount, { selection: folder('a', 'Renamed'), refreshActiveLabel: refresh });
  assert.equal(view(host).primary.selection.label, 'Renamed'); assert.equal(host.pending.selection.label, 'Renamed');
  assert.equal(motion(host), motion(before)); assert.equal(host.service, before.service);
  assert.deepEqual(view(host).resourceTicket, beforeView.resourceTicket);
  assert.equal(view(before).primary.selection.label, 'Folder A');
});

test('wrong generation/key/activation refreshes and refreshes of outgoing folders are ignored', () => {
  const before = settled(), v = view(before);
  const valid = { generation: v.generation, activationEpoch: v.primary.activationEpoch, key: 'a', label: 'Wrong' };
  for (const patch of [{ generation: 'old' }, { key: 'b' }, { activationEpoch: 0 }]) {
    const host = at(before, before.clock.updateCount, { refreshActiveLabel: { ...valid, ...patch } });
    assert.equal(view(host).primary.selection.label, 'Folder A');
  }
  let host = at(before, before.clock.updateCount, { selection: folder('b', 'B'), refreshActiveLabel: valid });
  assert.equal(view(host).primary.selection.label, 'Folder A');
  host = step(host); host = at(host, host.clock.updateCount, { selection: folder(), refreshActiveLabel: valid });
  assert.equal(view(host).stage, 'hiding'); assert.equal(view(host).primary.selection.label, 'Folder A');
});

test('move retains identity; delete/recreate preserves the outgoing label rather than reading its former slot', () => {
  let menu = createFolder(createPortfolioState(), 40, 'Original');
  let host = settled(resolveHomeBannerHostSelection(menu));
  const active = view(host).primary, ticket = view(host).resourceTicket;
  menu = moveHomeItem(menu, root(40), root(42));
  host = request(host, resolveHomeBannerHostSelection(menu));
  assert.deepEqual(view(host).resourceTicket, ticket); assert.equal(view(host).primary.activationEpoch, active.activationEpoch);
  assert.equal(view(host).primary.motion, active.motion); assert.equal(view(host).primary.selection.label, 'Original');
  menu = reduceMenu({ ...menu, panel: 'folder-settings', panelChoice: 1 }, 'open');
  menu = createFolder(menu, 42, 'Replacement');
  host = step(acknowledge(request(host, resolveHomeBannerHostSelection(menu))));
  assert.equal(view(host).primary.selection.label, 'Original');
  assert.equal(view(host).selection.label, 'Replacement');
  assert.notEqual(view(host).primary.selection.key, view(host).selection.key);
});

test('empty/nonempty native type changes create a new request without reusing its resource ticket', () => {
  const before = settled(), ticket = view(before).resourceTicket;
  let host = request(before, folder('a', 'Now contains software', 10));
  assert.equal(view(host).primary.selection.nativeType, 9); assert.equal(host.inputs.resourceReady, null);
  host = acknowledge(host, ticket); assert.equal(host.inputs.resourceReady, null);
  host = step(acknowledge(host), 13);
  assert.equal(view(host).primary.selection.nativeType, 10); assert.equal(view(host).primary.activationEpoch, 2);
});

test('opened folders resolve selected children or default; overlays do not fabricate clears', () => {
  let menu = createFolder(createPortfolioState(), 40, 'Folder');
  assert.deepEqual(resolveHomeBannerHostSelection(selectHomeLocation(menu, root(0))), { kind: 'app', id: 'work' });
  assert.equal(resolveHomeBannerHostSelection(menu).nativeType, 9);
  menu = moveHomeItem(menu, root(0), { folder: 40, slot: 4 });
  const opened = selectHomeLocation(menu, { folder: 40, slot: 4 });
  assert.deepEqual(resolveHomeBannerHostSelection(opened), { kind: 'app', id: 'work' });
  assert.deepEqual(resolveHomeBannerHostSelection(selectHomeLocation(opened, { folder: 40, slot: 5 })), { kind: 'default' });
  const parent = selectHomeLocation(opened, root(40)), expected = resolveHomeBannerHostSelection(parent);
  assert.equal(expected.nativeType, 10);
  for (const panel of ['settings', 'rename', 'delete']) assert.deepEqual(resolveHomeBannerHostSelection({ ...parent, panel, powered: false }), expected);
  assert.equal(resolveHomeBannerHostSelection(initialState).kind, 'folder', 'isolated menu identity fallback is supported');
});

test('unsupported app handoff abandons service without guessed native types or visibility', () => {
  let host = at(settled(), 20, { selection: { kind: 'app', id: 'work' } });
  assert.deepEqual(view(host), { status: 'unsupported', selection: { kind: 'app', id: 'work' }, resourceTicket: null });
  assert.equal(host.service, null); assert.equal(host.pending, null); assert.equal(host.active, null); assert.equal(host.inputs.resourceReady, null);
  host = at(host, 200, { selection: { kind: 'app', id: 'notes' } });
  assert.equal(host.scope, 1); assert.equal(host.service, null);
  assert.equal(view(host).status, 'unsupported'); assert.equal(host.clock.updateCount, 200);
});

test('all five toolbar applets use their ticketed native generic-primary identities', () => {
  for (const [focus, category, kind, nativeType] of [
    [1, 5, 'memo', 15], [2, 4, 'friend', 14], [3, 6, 'news', 16],
    [4, 7, 'web', 17], [5, 8, 'miiverse', 18],
  ]) {
    const selection = { kind: 'toolbar', focus, category };
    let host = request(fresh(), selection);
    assert.equal(view(host).status, 'pending');
    assert.deepEqual(host.service.lifecycle.requested.target, {
      kind, key: 'native:ffffffff:ffffffff:0', nativeType,
    });
    host = acknowledge(host); host = step(host, 7);
    assert.equal(view(host).status, 'active');
    assert.deepEqual(view(host).primary.selection, selection);
    assert.deepEqual([motion(host).yawCounter, motion(host).skeletal.duration, motion(host).material.duration], [1, 600, 300]);
  }
});

test('Notifications toolbar focus uses the ticketed type16 generic primary lifecycle', () => {
  const news = { kind: 'toolbar', focus: 3, category: 6 };
  let host = request(fresh(), news);
  assert.equal(view(host).status, 'pending');
  assert.deepEqual(host.service.lifecycle.requested.target, {
    kind: 'news', key: 'native:ffffffff:ffffffff:0', nativeType: 16,
  });
  host = acknowledge(host); host = step(host, 7);
  assert.equal(view(host).status, 'active');
  assert.deepEqual(view(host).primary.selection, news);
  assert.deepEqual([motion(host).yawCounter, motion(host).skeletal.duration, motion(host).material.duration], [1, 600, 300]);
});

test('Friend to Notifications changes native identity despite the shared key and rejects stale readiness', () => {
  const friend = { kind: 'toolbar', focus: 2, category: 4 };
  const news = { kind: 'toolbar', focus: 3, category: 6 };
  let host = settled(friend), friendTicket = view(host).resourceTicket;
  host = request(host, news);
  const newsTicket = view(host).resourceTicket;
  assert.notDeepEqual(newsTicket, friendTicket);
  assert.deepEqual(host.service.lifecycle.requested.target, {
    kind: 'news', key: 'native:ffffffff:ffffffff:0', nativeType: 16,
  });
  host = acknowledge(host, friendTicket);
  assert.equal(host.inputs.resourceReady, null);
  host = acknowledge(host, newsTicket);
  assert.deepEqual(host.inputs.resourceReady, newsTicket);
  host = step(host, 13);
  assert.equal(view(host).status, 'active');
  assert.deepEqual(view(host).primary.selection, news);
  assert.equal(view(host).primary.activationEpoch, 2);
});

test('folder-scope reentry is deterministic, starts at the current count and invalidates old tickets', () => {
  const before = settled(), oldTicket = view(before).resourceTicket;
  const unsupported = request(before, { kind: 'app', id: 'work' });
  let host = at(unsupported, 400, { selection: folder(), inputs: inputs({ resourceReady: oldTicket }) });
  assert.equal(host.scope, 2); assert.equal(host.service.lifecycle.managerUpdates, 0);
  assert.equal(view(host).resourceTicket.requestEpoch, oldTicket.requestEpoch);
  assert.notEqual(view(host).generation, oldTicket.generation); assert.equal(host.inputs.resourceReady, null);
  assert.deepEqual(host, at(unsupported, 400, { selection: folder(), inputs: inputs({ resourceReady: oldTicket }) }));
  host = step(host, 10); assert.equal(view(host).status, 'pending');
  host = step(acknowledge(host)); assert.equal(view(host).primary.activationEpoch, 1); assert.equal(motion(host).yawCounter, 1);
  host = at(host, host.clock.updateCount, { refreshActiveLabel: { generation: oldTicket.generation, activationEpoch: 1, key: 'a', label: 'Previous scope' } });
  assert.equal(view(host).primary.selection.label, 'Folder A');
});

test('entry reset retires only the primary and reacquires with a noncolliding scope', () => {
  const before = freeze(settled({ kind: 'app', id: 'camera' }));
  const previous = view(before), previousBackground = background(before);
  const reset = resetHomeBannerPrimary(before);
  assert.equal(reset.clock, before.clock);
  assert.equal(reset.background, before.background);
  assert.equal(reset.scope, before.scope);
  assert.deepEqual(reset.selection, { kind: 'app', id: 'camera' });
  assert.equal(reset.service, null); assert.equal(reset.pending, null); assert.equal(reset.active, null);
  assert.equal(reset.inputs.resourceReady, null);
  assert.deepEqual(background(reset), previousBackground);

  let restarted = at(reset, reset.clock.updateCount, { inputs: inputs({
    managerInhibited: true, sceneInhibited: true, resourceReady: previous.resourceTicket,
  }) });
  const replacement = view(restarted);
  assert.equal(replacement.status, 'pending'); assert.equal(replacement.stage, 'gate');
  assert.equal(replacement.waitUpdates, 0); assert.equal(replacement.primary, null);
  assert.equal(restarted.scope, before.scope + 1);
  assert.notEqual(replacement.generation, previous.generation);
  assert.equal(restarted.inputs.resourceReady, null, 'old scope readiness cannot acknowledge the replacement');
  assert.equal(restarted.clock.updateCount, before.clock.updateCount);
  assert.deepEqual(background(restarted), previousBackground);

  restarted = at(restarted, restarted.clock.updateCount, { inputs: inputs({
    nativeWorkerReady: false, resourceReady: replacement.resourceTicket,
  }) });
  restarted = step(restarted, 20);
  assert.equal(view(restarted).status, 'pending'); assert.equal(view(restarted).stage, 'gate');
  assert.equal(view(restarted).waitUpdates, 5, 'entry dependency preserves the existing native wait progression');
  restarted = at(restarted, restarted.clock.updateCount, { inputs: inputs({ resourceReady: replacement.resourceTicket }) });
  restarted = step(restarted, 2);
  assert.equal(view(restarted).status, 'active');
  assert.deepEqual(view(restarted).primary.selection, { kind: 'app', id: 'camera' });
  assert.equal(motion(restarted).visibilityCounter, 1);
  assert.equal(motion(restarted).scale, Math.fround(.8));
});

test('new System generation clears presentation/readiness and requires selection to be supplied again', () => {
  const before = settled(), oldTicket = view(before).resourceTicket;
  const cleared = crossHomeBannerBoundary(freeze(before), { generation: 'session:2', updateCount: 900 });
  assert.equal(view(cleared).status, 'unsupported'); assert.equal(cleared.selection, null); assert.equal(cleared.scope, 0);
  assert.deepEqual([background(cleared).sceneInFrame, background(cleared).loopFrame, background(cleared).loopEpoch], [19, 0, 1]);
  let host = crossHomeBannerBoundary(before, { generation: 'session:2', updateCount: 900 }, { selection: folder(), inputs: inputs({ resourceReady: oldTicket }) });
  assert.equal(host.scope, 1); assert.equal(host.service.lifecycle.managerUpdates, 0); assert.equal(host.inputs.resourceReady, null);
  host = step(host, 7); assert.equal(view(host).status, 'pending');
  host = step(acknowledge(host)); assert.equal(motion(host).yawCounter, 1);
  const refresh = { generation: oldTicket.generation, activationEpoch: 1, key: 'a', label: 'Stale session label' };
  host = at(host, host.clock.updateCount, { refreshActiveLabel: refresh });
  assert.equal(view(host).primary.selection.label, 'Folder A');
});

test('same-current reversal before hiding reuses active presentation, reversal during hiding activates anew', () => {
  const before = settled();
  let host = step(request(request(before, folder('b', 'B')), folder('a', 'New A observation')));
  assert.equal(view(host).primary.activationEpoch, 1); assert.equal(view(host).primary.selection.label, 'Folder A');
  host = step(request(before, folder('b', 'B')));
  host = step(acknowledge(request(host, folder('a', 'Reloaded A'))), 12);
  assert.equal(view(host).primary.activationEpoch, 2); assert.equal(view(host).primary.selection.label, 'Reloaded A');
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
  assert.deepEqual(background(host), { attached: true, mode: 0, sceneInFrame: 20, loopFrame: 13,
    appPauseFrame: 0, sceneInEpoch: 1, loopEpoch: 1, appPauseEpoch: 0 });
});

test('background starts once per System generation and consumes only eligible completed scene passes', () => {
  let host = fresh();
  assert.deepEqual(background(host), { attached: true, mode: 0, sceneInFrame: 19, loopFrame: 0,
    appPauseFrame: 0, sceneInEpoch: 1, loopEpoch: 1, appPauseEpoch: 0 });
  host = stepHomeBannerHost(host, { ...host.clock, updateCount: 1 });
  assert.deepEqual([background(host).sceneInFrame, background(host).loopFrame], [20, 1]);
  const skipped = skipHomeBannerHostPass(host, { ...host.clock, updateCount: 2 });
  assert.deepEqual(background(skipped), background(host), 'skipped native pass has no global3D update');
  host = at(skipped, 5, { inputs: inputs({ sceneInhibited: true }) });
  assert.equal(background(host).loopFrame, 4, 'elapsed passes use the previous eligible input');
  host = at(host, 20);
  assert.equal(background(host).loopFrame, 4, 'inhibited passes are consumed without catch-up');
  host = at(host, 20, { inputs: inputs() });
  host = at(host, 23);
  assert.equal(background(host).loopFrame, 7);
});

test('background ownership survives unsupported and supported primary scopes without selection resets', () => {
  let host = at(fresh(), 37, { selection: { kind: 'app', id: 'work' } });
  const epoch = background(host).loopEpoch;
  assert.equal(view(host).status, 'unsupported'); assert.equal(background(host).loopFrame, 37);
  host = at(host, 91, { selection: { kind: 'toolbar', focus: 2, category: 4 } });
  assert.equal(background(host).loopFrame, 91); assert.equal(background(host).loopEpoch, epoch);
  host = request(host, { kind: 'toolbar', focus: 3, category: 6 });
  host = request(host, { kind: 'app', id: 'system-settings' });
  assert.equal(background(host).loopFrame, 91); assert.equal(background(host).loopEpoch, epoch);
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
  assert.equal(view(host).primary.selection.label, 'Folder A'); assert.equal(host.service.lifecycle.requested.target.kind, 'folder');
});

test('clock validation covers unsupported intervals and scope generation encoding is unambiguous', () => {
  for (const updateCount of [-1, .5, NaN, Infinity]) assert.throws(() => createHomeBannerHost({ generation: 's', updateCount }, inputs()), RangeError);
  assert.throws(() => fresh(''), RangeError);
  const unsupported = at(fresh(), 10);
  assert.throws(() => at(unsupported, 9), /new System generation/);
  assert.throws(() => request(fresh(), folder('a', 'Invalid type', 0)), RangeError);
  const session = 'session:"1",2';
  assert.deepEqual(JSON.parse(view(request(fresh(session))).generation), ['home-primary-scope', session, 1]);
});
