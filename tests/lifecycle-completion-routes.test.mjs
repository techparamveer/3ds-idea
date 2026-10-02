import test from 'node:test';
import assert from 'node:assert/strict';

import { initialAppLayout } from '../src/os/app-registry.ts';
import {
  createPortfolioState,
  dispatchSystemEvent,
  getActiveAppView,
  launch,
  reduceSystem,
  selectedTitle,
  tickSystem,
} from '../src/os/system.ts';

const titleSlot = id => Number(Object.entries(initialAppLayout()).find(([, title]) => title === id)[0]);
const bootHome = () => tickSystem(createPortfolioState(), 3001);
const settleLaunch = (state, id, now) => tickSystem(launch(state, id, now), now + 2200);
const act = (state, id, now) => dispatchSystemEvent(state, { type: 'action', id }, now);
const finishClose = (state, now) => {
  state = tickSystem(state, now);
  state = tickSystem(state, now + 1000);
  return tickSystem(state, state.system.homeClock.lastNow + 1000 / 60);
};

function assertOnlyOwner(state, owner, appId, { active, homeReturn, suspended }) {
  const runtime = state.system.runtime;
  assert.deepEqual(Object.keys(runtime.instances), [owner]);
  assert.equal(runtime.application, owner);
  assert.equal(runtime.active, active ? owner : null);
  assert.equal(runtime.homeReturn, homeReturn ? owner : null);
  assert.equal(runtime.instances[owner].appId, appId);
  assert.equal(runtime.instances[owner].suspended, suspended);
}

test('life-close-cancel-confirm preserves suspended Work until confirmation and publishes no stale owner', () => {
  let state = settleLaunch(bootHome(), 'work', 4000);
  const owner = state.system.runtime.application;
  assert.ok(owner);

  state = reduceSystem(state, 'home', 6300);
  const sequence = state.system.runtime.sequence;
  const preserved = structuredClone(state.system.runtime.instances[owner].state);
  assertOnlyOwner(state, owner, 'work', { active: false, homeReturn: true, suspended: true });

  state = reduceSystem(state, 'back', 6400);
  assert.equal(state.system.dialog, 'close');
  assert.equal(state.system.pending, null);
  assertOnlyOwner(state, owner, 'work', { active: false, homeReturn: true, suspended: true });

  state = reduceSystem(state, 'back', 6500);
  assert.equal(state.system.dialog, null);
  assert.equal(state.system.runtime.sequence, sequence);
  assert.deepEqual(state.system.runtime.instances[owner].state, preserved);
  assertOnlyOwner(state, owner, 'work', { active: false, homeReturn: true, suspended: true });

  state = reduceSystem(state, 'back', 6600);
  state = reduceSystem(state, 'open', 6700);
  assertOnlyOwner(state, owner, 'work', { active: false, homeReturn: true, suspended: true });
  state = finishClose(state, 6700);
  assert.equal(state.system.phase, 'home');
  assert.equal(state.system.app, null);
  assert.equal(state.system.dialog, null);
  assert.equal(state.system.pending, null);
  assert.equal(state.system.runtime.sequence, sequence);
  assert.deepEqual(state.system.runtime.instances, {});
  assert.equal(state.system.runtime.application, null);
  assert.equal(state.system.runtime.active, null);
  assert.equal(state.system.runtime.homeReturn, null);
  assert.equal(getActiveAppView(state), null);
});

test('life-switch-cancel-confirm keeps Work through cancel and creates About only after confirmation', () => {
  let state = settleLaunch(bootHome(), 'work', 4000);
  const workOwner = state.system.runtime.application;
  assert.ok(workOwner);
  state = reduceSystem(state, 'home', 6300);
  state = { ...state, selected: titleSlot('about') };
  assert.equal(selectedTitle(state)?.id, 'about');

  const sequence = state.system.runtime.sequence;
  const preserved = structuredClone(state.system.runtime.instances[workOwner].state);
  state = reduceSystem(state, 'open', 6400);
  assert.equal(state.system.dialog, 'switch');
  assert.equal(state.system.pending, 'about');
  assert.equal(state.system.runtime.sequence, sequence);
  assert.equal(Object.values(state.system.runtime.instances).some(instance => instance.appId === 'about'), false);
  assertOnlyOwner(state, workOwner, 'work', { active: false, homeReturn: true, suspended: true });

  state = reduceSystem(state, 'back', 6500);
  assert.equal(state.system.dialog, null);
  assert.equal(state.system.pending, null);
  assert.deepEqual(state.system.runtime.instances[workOwner].state, preserved);
  assertOnlyOwner(state, workOwner, 'work', { active: false, homeReturn: true, suspended: true });

  state = reduceSystem(state, 'home', 6600);
  assert.equal(state.system.phase, 'app');
  assert.equal(state.system.app, 'work');
  assertOnlyOwner(state, workOwner, 'work', { active: true, homeReturn: false, suspended: false });
  state = reduceSystem(state, 'home', 6700);
  state = reduceSystem(state, 'open', 6800);
  assert.equal(state.system.dialog, 'switch');
  assert.equal(state.system.runtime.sequence, sequence);
  assertOnlyOwner(state, workOwner, 'work', { active: false, homeReturn: true, suspended: true });

  state = reduceSystem(state, 'open', 6900);
  assertOnlyOwner(state, workOwner, 'work', { active: false, homeReturn: true, suspended: true });
  state = finishClose(state, 6900);
  const aboutOwner = state.system.runtime.application;
  assert.ok(aboutOwner);
  assert.notEqual(aboutOwner, workOwner);
  assert.equal(state.system.phase, 'launch');
  assert.equal(state.system.app, 'about');
  assert.equal(state.system.dialog, null);
  assert.equal(state.system.pending, null);
  assert.equal(state.system.runtime.sequence, sequence + 1);
  assert.equal(state.system.runtime.instances[workOwner], undefined);
  assertOnlyOwner(state, aboutOwner, 'about', { active: true, homeReturn: false, suspended: false });

  state = tickSystem(state, state.system.since + 2200);
  assert.equal(state.system.phase, 'app');
  assert.equal(getActiveAppView(state)?.appId, 'about');
  assertOnlyOwner(state, aboutOwner, 'about', { active: true, homeReturn: false, suspended: false });
});

test('life-helper-return restores exact Transfer and Update Settings focus without publishing the retired helper', () => {
  for (const route of [
    { action: 'transfer', appId: 'system-transfer', page: 2, selection: 2 },
    { action: 'update', appId: 'system-updater', page: 3, selection: 1 },
  ]) {
    let state = settleLaunch(bootHome(), 'system-settings', 4000);
    state = act(state, 'other', 6300);
    for (let page = 0; page < route.page; page += 1) state = act(state, 'settings-next', 6400 + page);
    const parent = state.system.runtime.application;
    assert.ok(parent, route.action);

    state = act(state, route.action, 7000);
    const child = state.system.runtime.application;
    assert.ok(child, route.action);
    assert.notEqual(child, parent, route.action);
    assert.equal(state.system.phase, 'launch', route.action);
    assert.equal(state.system.runtime.instances[parent].suspended, true, route.action);
    assert.equal(state.system.runtime.instances[child].caller, parent, route.action);
    assert.equal(state.system.runtime.instances[child].appId, route.appId, route.action);
    assert.deepEqual(Object.keys(state.system.runtime.instances), [parent, child], route.action);

    state = tickSystem(state, 9200);
    assert.equal(getActiveAppView(state)?.appId, route.appId, route.action);
    state = reduceSystem(state, 'back', 9300);

    const view = getActiveAppView(state);
    const restored = state.system.runtime.instances[parent];
    assert.equal(state.system.phase, 'app', route.action);
    assert.equal(state.system.app, 'system-settings', route.action);
    assert.equal(state.system.dialog, null, route.action);
    assert.equal(state.system.pending, null, route.action);
    assert.equal(state.system.runtime.pendingLaunch, null, route.action);
    assert.equal(state.system.runtime.application, parent, route.action);
    assert.equal(state.system.runtime.active, parent, route.action);
    assert.equal(state.system.runtime.homeReturn, null, route.action);
    assert.equal(state.system.runtime.instances[child], undefined, route.action);
    assert.deepEqual(Object.keys(state.system.runtime.instances), [parent], route.action);
    assert.equal(restored.suspended, false, route.action);
    assert.equal(restored.state.screen, 'other', route.action);
    assert.equal(restored.state.page, route.page, route.action);
    assert.equal(restored.state.selection, route.selection, route.action);
    assert.equal(view?.appId, 'system-settings', route.action);
    assert.equal(view?.screen, 'other', route.action);
    assert.equal(view?.selection, route.selection, route.action);
  }
});
