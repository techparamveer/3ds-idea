import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  HOME_BANNER_EMPTY_KEY, createHomeBannerLifecycle, requestHomeBanner, beginHomeBannerReplacement,
  activateHomeBanner, advanceHomeBannerManager, advanceHomeBannerClips, setHomeBannerVisibility,
} from '../src/os/home-banner-lifecycle.ts';
import {
  createHomeBannerService, requestHomeBannerService, getHomeBannerResourceTicket, advanceHomeBannerService,
} from '../src/os/home-banner-service.ts';
import { createHomeBannerHost, crossHomeBannerBoundary, getHomeBannerHostView, resolveHomeBannerHostSelection } from '../src/os/home-banner-host.ts';
import { createPortfolioState } from '../src/os/system.ts';
import { reduceMenu, renameFolder } from '../src/os/state.ts';
import { selectHomeLocation } from '../src/os/home-layout.ts';

const defaultTarget = { kind: 'default', key: HOME_BANNER_EMPTY_KEY, nativeType: 7 };
const clearTarget = { kind: 'clear', key: HOME_BANNER_EMPTY_KEY, nativeType: 13 };
const folder = (key = 'f', label = 'Saved folder') => ({ kind: 'folder', key, label, nativeType: 9 });
const inputs = (patch = {}) => ({ managerInhibited: false, sceneInhibited: false, loadInhibited: false, nativeWorkerReady: true, resourceReady: null, ...patch });
const service = () => createHomeBannerService({ generation: 's', updateCount: 0 });
const request = (s, target, options) => requestHomeBannerService(s, { target, options });
const advance = (s, n = 1, patch = {}) => advanceHomeBannerService(s, n, inputs({ resourceReady: getHomeBannerResourceTicket(s), ...patch }));
const motion = s => s.lifecycle.active.motion;
const view = getHomeBannerHostView;
const boundary = (h, observations = {}, count = 0) => crossHomeBannerBoundary(h, { ...h.clock, updateCount: h.clock.updateCount + count }, observations);
const select = (h, selection) => boundary(h, { selection });
const ack = (h, ticket = view(h).resourceTicket) => boundary(h, { inputs: { ...h.inputs, resourceReady: ticket } });
const step = (h, n = 1) => boundary(h, {}, n);
const host = selection => select(createHomeBannerHost({ generation: 's', updateCount: 0 }, inputs()), selection);
const settled = selection => step(ack(host(selection)), 13);

test('default shares source visibility/yaw but has independent 300-loop and 60-nonloop clips', () => {
  let state = activateHomeBanner(beginHomeBannerReplacement(requestHomeBanner(createHomeBannerLifecycle(), defaultTarget)), 1);
  assert.equal(state.active.motion.skeletal.duration, 300); assert.equal(state.active.motion.material.duration, 60);
  assert.equal(state.active.motion.material.looping, false);
  state = advanceHomeBannerManager(state);
  assert.equal(state.active.motion.visible, true); assert.equal(state.active.motion.scale, 0.800000011920929);
  assert.equal(state.active.motion.yawRadians, -0.010471976362168789);
  state = advanceHomeBannerClips(state, 60);
  assert.deepEqual([state.active.motion.material.frame, state.active.motion.material.status, state.active.motion.material.endReached], [60, 1, true]);
  state = advanceHomeBannerClips(state); assert.equal(state.active.motion.material.status, 2);
  state = advanceHomeBannerClips(state); assert.equal(state.active.motion.material.status, 0);
  state = advanceHomeBannerClips(state, 238);
  assert.equal(state.active.motion.skeletal.frame, 0); assert.equal(state.active.motion.material.frame, 60);
  assert.equal(state.active.motion.yawCounter, 1, 'scene passes cannot advance manager yaw');
  state = advanceHomeBannerManager(state, 237); assert.equal(state.active.motion.yawRadians, -2.492330312728882);
  state = advanceHomeBannerManager(state, 362); assert.equal(state.active.motion.yawCounter, 0);
  state = setHomeBannerVisibility(state, false, true);
  const clip = state.active.motion.skeletal;
  state = advanceHomeBannerClips(advanceHomeBannerManager(state, 2), 50);
  assert.equal(state.active.motion.yawCounter, 2); assert.equal(state.active.motion.skeletal, clip);
});

test('default and clear enforce canonical identity and clear completes without an instance or activation increment', () => {
  for (const target of [{ ...defaultTarget, key: 'slot:4' }, { ...clearTarget, nativeType: 7 }]) {
    assert.throws(() => requestHomeBanner(createHomeBannerLifecycle(), target), /identity/);
  }
  let state = beginHomeBannerReplacement(requestHomeBanner(createHomeBannerLifecycle(), clearTarget));
  state = activateHomeBanner(state, state.requested.epoch);
  assert.equal(state.phase, 'active'); assert.equal(state.active, null); assert.equal(state.activationEpoch, 0);
  assert.equal(state.requestPending, false);
  state = beginHomeBannerReplacement(requestHomeBanner(state, defaultTarget));
  assert.equal(state.phase, 'hiding'); assert.equal(state.active, null);
});

test('service initial and null-primary replacement passes match executed original ARM fixture', () => {
  const proof = JSON.parse(fs.readFileSync(new URL('../docs/evidence/native-default-banner-order.json', import.meta.url)));
  const nativeStage = { gate: 1, hiding: 2, loading: 3, active: 6 };
  let initial = request(service(), defaultTarget);
  for (const row of proof.initialDefault) { initial = advance(initial); assert.equal(nativeStage[initial.stage], row.state); assert.equal(initial.waitUpdates, row.wait); }
  assert.equal(motion(initial).skeletal.frame, 1); assert.equal(motion(initial).yawCounter, 1);
  let s = request(service(), clearTarget);
  assert.equal(getHomeBannerResourceTicket(s), null);
  for (const row of proof.clearCompletion) { s = advance(s); assert.equal(nativeStage[s.stage], row.state); assert.equal(s.lifecycle.active, null); }
  assert.equal(s.lifecycle.activationEpoch, 0);
  s = request(s, defaultTarget);
  for (const row of proof.clearToDefault) {
    s = advance(s); assert.equal(nativeStage[s.stage], row.state); assert.equal(s.waitUpdates, row.wait);
    assert.equal(!!s.lifecycle.active, row.primary !== 0);
  }
  assert.equal(s.lifecycle.activationEpoch, 1); assert.equal(motion(s).yawCounter, 1);
});

test('clear bypasses load inhibition/counter but waits for actual hide, manager and worker readiness', () => {
  let s = advance(request(service(), defaultTarget), 13), epoch = s.lifecycle.activationEpoch;
  s = request(s, clearTarget);
  s = advance(s, 4, { managerInhibited: true, loadInhibited: true, resourceReady: null });
  assert.equal(s.stage, 'active'); assert.equal(motion(s).visible, true);
  s = advance(s, 5, { loadInhibited: true, nativeWorkerReady: false, resourceReady: null });
  assert.equal(s.stage, 'hiding'); assert.equal(motion(s).visible, false);
  s = advance(s); assert.equal(s.stage, 'gate');
  s = advance(s, 5, { loadInhibited: true, nativeWorkerReady: false });
  assert.equal(s.stage, 'gate'); assert.equal(s.waitUpdates, 0);
  s = advance(s, 1, { loadInhibited: true }); assert.equal(s.stage, 'loading');
  s = advance(s, 3, { nativeWorkerReady: false }); assert.equal(s.stage, 'loading');
  s = advance(s); assert.equal(s.stage, 'active'); assert.equal(s.lifecycle.active, null);
  assert.equal(s.lifecycle.activationEpoch, epoch); assert.equal(s.lifecycle.requestPending, false);
});

test('default resources remain required and retargeted tickets cannot be borrowed from clear or older defaults', () => {
  let s = request(service(), defaultTarget), old = getHomeBannerResourceTicket(s);
  s = advance(s, 20, { resourceReady: null }); assert.equal(s.stage, 'loading'); assert.equal(s.lifecycle.active, null);
  s = request(s, clearTarget); assert.equal(getHomeBannerResourceTicket(s), null);
  s = request(s, defaultTarget); const latest = getHomeBannerResourceTicket(s);
  assert.ok(latest.requestEpoch > old.requestEpoch);
  s = advance(s, 20, { resourceReady: old }); assert.equal(s.lifecycle.active, null);
  s = advance(s, 20, { resourceReady: { ...latest, generation: 'old session' } }); assert.equal(s.lifecycle.active, null);
  s = advance(s); assert.equal(s.lifecycle.active.target.kind, 'default');
});

test('default cached reversal before hide preserves phase; reversal during hide and forced reload create new activation', () => {
  const before = advance(request(service(), defaultTarget), 30);
  assert.equal(request(before, defaultTarget), before);
  const reversed = advance(request(request(before, clearTarget), defaultTarget));
  assert.equal(reversed.lifecycle.activationEpoch, before.lifecycle.activationEpoch);
  assert.equal(motion(reversed).skeletal.frame, motion(before).skeletal.frame + 1);
  for (const forced of [false, true]) {
    let s = forced ? request(before, defaultTarget, { forceReload: true }) : request(advance(request(before, clearTarget)), defaultTarget);
    s = advance(s, 20); assert.equal(s.lifecycle.activationEpoch, 2); assert.equal(s.lifecycle.active.target.kind, 'default');
  }
});

test('real root and child vacancies deduplicate across context/slot without requiring labels', () => {
  let menu = selectHomeLocation(createPortfolioState(), { folder: null, slot: 40 });
  assert.deepEqual(resolveHomeBannerHostSelection(menu), { kind: 'default' });
  let h = settled(resolveHomeBannerHostSelection(menu)), old = view(h), oldMotion = old.primary.motion;
  menu = selectHomeLocation(menu, { folder: null, slot: 41 }); h = select(h, resolveHomeBannerHostSelection(menu));
  assert.deepEqual(view(h).resourceTicket, old.resourceTicket); assert.equal(view(h).primary.motion, oldMotion);
  menu = renameFolder(reduceMenu(menu, 'open'), 'Container');
  menu = selectHomeLocation(menu, { folder: 41, slot: 5 }); h = select(h, resolveHomeBannerHostSelection(menu));
  assert.deepEqual(view(h).resourceTicket, old.resourceTicket); assert.equal(view(h).primary.activationEpoch, old.primary.activationEpoch);
  assert.equal(h.scope, 1); assert.deepEqual(view(h).primary.selection, { kind: 'default' });
  const refresh = { generation: old.generation, activationEpoch: old.primary.activationEpoch, key: 'f', label: 'Wrong' };
  h = boundary(h, { refreshActiveLabel: refresh }); assert.deepEqual(view(h).primary.selection, { kind: 'default' });
});

test('folder/default replacements retain the outgoing presentation through hide and gate in both directions', () => {
  for (const [from, to] of [[folder(), { kind: 'default' }], [{ kind: 'default' }, folder('g', 'Incoming')]]) {
    let h = ack(select(settled(from), to)); const previous = view(h).primary, scope = h.scope;
    for (let i = 1; i <= 11; i++) {
      h = step(h); assert.equal(view(h).status, 'active'); assert.deepEqual(view(h).primary.selection, previous.selection);
      assert.equal(view(h).primary.motion.visible, i <= 4); assert.equal(h.scope, scope);
    }
    h = step(h); assert.equal(view(h).status, 'pending'); assert.equal(view(h).primary, null);
    h = step(h); assert.equal(view(h).status, 'active'); assert.deepEqual(view(h).primary.selection, to);
    assert.equal(view(h).primary.activationEpoch, previous.activationEpoch + 1);
    assert.equal(view(h).primary.motion.skeletal.frame, 1);
  }
});

test('host distinguishes pending clear from completed clear and keeps the same scope for the next default', () => {
  let h = host({ kind: 'clear' }); assert.equal(view(h).status, 'pending'); assert.equal(view(h).resourceTicket, null);
  h = step(h); assert.equal(view(h).status, 'pending');
  h = step(h); assert.equal(view(h).status, 'cleared'); assert.equal(view(h).primary, null);
  assert.equal(h.service.lifecycle.activationEpoch, 0);
  const scope = h.scope; h = select(h, { kind: 'default' });
  assert.equal(view(h).status, 'pending'); assert.ok(view(h).resourceTicket); assert.equal(h.scope, scope);
  h = ack(h); h = step(h, 8); assert.equal(view(h).status, 'pending'); assert.equal(view(h).stage, 'loading');
  h = step(h); assert.equal(view(h).primary.selection.kind, 'default'); assert.equal(view(h).primary.activationEpoch, 1);
});

test('same-counter clear/default requests use latest latch without inventing intermediate completion', () => {
  let h = ack(select(host({ kind: 'clear' }), { kind: 'default' }));
  h = step(h, 7); assert.equal(view(h).status, 'active'); assert.equal(view(h).primary.activationEpoch, 1);
  const before = view(h).primary;
  h = select(select(h, { kind: 'clear' }), { kind: 'default' }); h = step(h);
  assert.equal(view(h).status, 'active'); assert.equal(view(h).primary.activationEpoch, before.activationEpoch);
  assert.equal(view(h).primary.motion.yawCounter, before.motion.yawCounter + 1);
});

test('default resource failures preserve outgoing folder until release and cannot activate a null render', () => {
  let h = select(settled(folder()), { kind: 'default' });
  h = step(h, 11); assert.equal(view(h).primary.selection.label, 'Saved folder'); assert.equal(view(h).primary.motion.visible, false);
  h = step(h, 30); assert.equal(view(h).status, 'pending'); assert.equal(view(h).primary, null);
  h = step(ack(h)); assert.equal(view(h).primary.selection.kind, 'default');
});

test('app handoff is still unsupported and invalidates default tickets and scope', () => {
  let h = settled({ kind: 'default' }), old = view(h).resourceTicket;
  h = select(h, { kind: 'app', id: 'missing-native-banner' }); assert.equal(view(h).status, 'unsupported'); assert.equal(h.service, null);
  h = select(h, { kind: 'default' }); assert.equal(h.scope, 2);
  h = step(ack(h, old), 30); assert.equal(view(h).status, 'pending'); assert.equal(h.inputs.resourceReady, null);
  h = step(ack(h)); assert.equal(view(h).primary.activationEpoch, 1);
});

test('default/clear batches equal individual passes under independent gates and sampling never advances', () => {
  for (const selection of [{ kind: 'default' }, { kind: 'clear' }]) {
    for (const patch of [{}, { managerInhibited: true }, { sceneInhibited: true }, { loadInhibited: true }, { nativeWorkerReady: false }]) {
      let h = ack(select(settled(folder()), selection)); h = boundary(h, { inputs: { ...h.inputs, ...patch } });
      let stepped = h; for (let i = 0; i < 40; i++) stepped = step(stepped);
      assert.deepEqual(step(h, 40), stepped);
      const snapshot = structuredClone(stepped); for (let i = 0; i < 4; i++) view(stepped);
      assert.deepEqual(stepped, snapshot); assert.equal(stepped.service.lifecycle.background.loop.frame, 0);
    }
  }
});
