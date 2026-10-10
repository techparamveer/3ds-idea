import test from 'node:test';
import assert from 'node:assert/strict';
import {
  completeNotesFooterClose, completeNotificationsFooterClose, createPortfolioState,
  dispatchSystemEvent, getActiveAppView, launchHomeShortcut, reduceSystem,
  tickHomeNavigationClockObserved, tickSystem,
} from '../src/os/system.ts';
import { enableHomeControls } from '../src/os/home-controls.ts';
import { getHomeToolbarCursorAnchor } from '../src/os/home-cursor-presentation.ts';
import { sampleHomeGrid, selectHomeSlot, settleHomeNavigation } from '../src/os/home-navigation.ts';
import { resolveHomeBannerHostObservation } from '../src/os/home-banner-host.ts';
import { getHomeFooter } from '../src/os/home-presentation.ts';
import { homeSuspendedApplication, selectedSuspendedApplication } from '../src/os/home-suspended-window.ts';

const T = 4000, FRAME = 1000 / 60;
const now = state => state.system.homeClock.lastNow ?? state.system.runtime.lastTick ?? T;
function home() {
  const state = tickSystem(createPortfolioState(), 3001);
  const slot = Number(Object.entries(state.system.layout).find(([, id]) => id === 'health-safety')[0]);
  return tickHomeNavigationClockObserved(enableHomeControls(settleHomeNavigation(selectHomeSlot(state, slot))), T).state;
}
const touch = (state, phase, point) => dispatchSystemEvent(state, {
  type: 'touch', phase, pointerId: 7, ...point,
}, now(state));
const tap = (state, point) => touch(touch(state, 'down', point), 'up', point);
const advance = (state, updates = 12) => tickHomeNavigationClockObserved(state, now(state) + updates * FRAME).state;
const toolbarSelected = focus => advance(tap(home(), getHomeToolbarCursorAnchor(focus).center));
const notificationsSelected = () => toolbarSelected(3);
function tileCenter(state, id) {
  const slot = Number(Object.entries(state.system.layout).find(([, title]) => title === id)[0]);
  const grid = sampleHomeGrid(state.system.homeNavigation), point = grid.slots[slot];
  return { x: point.x - grid.scrollPixels, y: point.y };
}
function suspendHealth(state) {
  state = tickSystem(state, now(state) + 4000);
  const owner = state.system.runtime.application;
  assert.equal(state.system.phase, 'app');
  assert.equal(state.system.runtime.instances[owner].appId, 'health-safety');
  assert.equal(state.system.runtime.instances[owner].suspended, false);
  state = dispatchSystemEvent(state, { type: 'button', source: 'physical:HOME', phase: 'down', command: 'home' }, now(state) + 1);
  state = dispatchSystemEvent(state, { type: 'button', source: 'physical:HOME', phase: 'up', command: 'home' }, now(state) + 1);
  assert.equal(state.system.phase, 'home');
  assert.equal(state.system.runtime.application, owner);
  assert.equal(homeSuspendedApplication(state)?.id, owner);
  return state;
}
function composition(state) {
  state = tickHomeNavigationClockObserved(state, now(state)).state;
  const result = tickHomeNavigationClockObserved(state, now(state) + FRAME);
  const pass = result.passes.at(-1);
  const request = pass.observations.findLast(entry => entry.observation.kind === 'banner-resolve');
  assert.ok(request, 'the real lower pass must resolve its banner selection');
  state = result.state;
  return {
    banner: resolveHomeBannerHostObservation(pass.state, request.observation),
    suspendedWindow: selectedSuspendedApplication(state)?.appId ?? null,
    footer: getHomeFooter(state),
  };
}
const suspendedHealthComposition = {
  banner: { kind: 'app', id: 'health-safety' },
  suspendedWindow: 'health-safety',
  footer: { two: true, left: 'close-software', right: 'resume' },
};

test('ordinary touchscreen Health selection clears Notifications before physical HOME composition', () => {
  let state = notificationsSelected();
  assert.equal(state.system.homeNavigation.focus.currentFocus, 3);
  const point = tileCenter(state, 'health-safety');
  state = advance(tap(state, point));
  assert.equal(state.system.homeNavigation.focus.toolbarActive, false);
  state = advance(tap(state, point));
  assert.equal(state.system.phase, 'launch');
  assert.deepEqual(composition(suspendHealth(state)), suspendedHealthComposition);
});

test('accessibility Health shortcut replaces prior Notifications focus before physical HOME composition', () => {
  const selected = notificationsSelected();
  assert.deepEqual(composition(selected).banner, { kind: 'toolbar', focus: 3, category: 6 });
  const launched = launchHomeShortcut(selected, 'health-safety', now(selected));
  assert.equal(launched.system.phase, 'launch');
  assert.deepEqual(composition(suspendHealth(launched)), suspendedHealthComposition);
});

test('accessibility Health shortcut from an untouched grid retains correct physical HOME composition', () => {
  const selected = home();
  const launched = launchHomeShortcut(selected, 'health-safety', now(selected));
  assert.deepEqual(composition(suspendHealth(launched)), suspendedHealthComposition);
});

test('accessibility Health shortcut selects its child container and clears prior toolbar focus', () => {
  let selected = notificationsSelected();
  const layout = { ...selected.system.layout };
  delete layout[selected.selected];
  selected = { ...selected, folders: { 40: 'Health' }, system: { ...selected.system, layout,
    folderLayouts: { 40: { 2: 'health-safety' } } } };
  const launched = launchHomeShortcut(selected, 'health-safety', now(selected));
  assert.equal(launched.opened, true);
  assert.equal(launched.selected, 40);
  assert.equal(launched.folderSelected, 2);
  assert.deepEqual(composition(suspendHealth(launched)), suspendedHealthComposition);
});

for (const [id, focus, category] of [
  ['game-notes', 1, 5], ['friends', 2, 4], ['notifications', 3, 6],
  ['browser', 4, 7], ['miiverse', 5, 8],
]) test(`accessibility ${id} shortcut selects its own toolbar destination and returns there`, () => {
  const selected = toolbarSelected(focus === 3 ? 1 : 3);
  let state = launchHomeShortcut(selected, id, now(selected));
  assert.equal(state.system.phase, 'app');
  assert.equal(state.system.runtime.instances[state.system.runtime.active].appId, id);
  assert.equal(getActiveAppView(state).screen, 'main');
  assert.equal(state.system.homeNavigation.focus.toolbarActive, true);
  assert.equal(state.system.homeNavigation.focus.currentFocus, focus);
  state = reduceSystem(state, 'back', now(state) + 1);
  assert.equal(state.system.phase, 'home');
  assert.equal(state.system.runtime.active, null);
  assert.deepEqual(composition(state), {
    banner: { kind: 'toolbar', focus, category }, suspendedWindow: null,
    footer: focus === 4 ? { two: true, left: 'manual', right: 'open' } : { two: false, left: null, right: 'open' },
  });
});

test('Notes and Notifications footer-close history cannot retain toolbar focus over a Health shortcut', () => {
  let state = home();
  for (const [id, focus, complete] of [
    ['game-notes', 1, completeNotesFooterClose], ['notifications', 3, completeNotificationsFooterClose],
  ]) {
    const point = getHomeToolbarCursorAnchor(focus).center;
    state = advance(tap(state, point));
    state = tap(state, point);
    const owner = state.system.runtime.active;
    assert.equal(state.system.runtime.instances[owner].appId, id);
    state = tap(state, { x: 160, y: 226 });
    assert.equal(state.system.runtime.instances[owner].state[id === 'game-notes' ? 'notesFooterClose' : 'notificationsFooterClose'], true);
    state = complete(state, owner, now(state) + 1);
    assert.equal(state.system.phase, 'home');
    assert.equal(state.system.runtime.instances[owner], undefined);
  }
  assert.equal(state.system.homeNavigation.focus.currentFocus, 3);
  state = launchHomeShortcut(state, 'health-safety', now(state));
  assert.deepEqual(composition(suspendHealth(state)), suspendedHealthComposition);
});
