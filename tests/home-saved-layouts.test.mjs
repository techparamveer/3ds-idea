import test from 'node:test';
import assert from 'node:assert/strict';
import { createPortfolioState, tickSystem, launch, reduceSystem } from '../src/os/system.ts';
import { reduceMenu } from '../src/os/state.ts';
import { moveHomeItem, selectHomeLocation } from '../src/os/home-layout.ts';
import { getHomeFolderIdentity } from '../src/os/home-folder-identity.ts';
import { enableHomeControls, queueHomeControlEvent } from '../src/os/home-controls.ts';
import { saveHomeView, enterHomeFolder, setHomeDensity, settleHomeNavigation } from '../src/os/home-navigation.ts';
import { HOME_SAVED_LAYOUT_SLOT_COUNT, saveHomeLayoutSlot, loadHomeLayoutSlot, deleteHomeLayoutSlot,
  serializeHomeSavedLayouts, restoreHomeSavedLayouts, requestHomeLayoutAction, confirmHomeLayoutAction } from '../src/os/home-saved-layouts.ts';

const home = () => tickSystem(createPortfolioState(), 3001);
function arranged() {
  let state = reduceMenu(selectHomeLocation(home(), { folder: null, slot: 40 }), 'open');
  state = moveHomeItem(state, { folder: null, slot: 0 }, { folder: 40, slot: 14 });
  state = settleHomeNavigation(setHomeDensity(enterHomeFolder(state, 40), 3));
  return { ...state, theme: 'blue' };
}
test('saving clones arrangement, theme and per-folder view without runtime or audio', () => {
  const state = arranged(), saved = saveHomeLayoutSlot(state, 3), snapshot = saved.homeSavedLayouts[3];
  assert.equal(saved.homeSavedLayouts.length, HOME_SAVED_LAYOUT_SLOT_COUNT);
  assert.equal(saved.system, state.system);
  assert.deepEqual(snapshot.homeView, saveHomeView(state));
  assert.deepEqual(snapshot.folders, state.folders);
  assert.notEqual(snapshot.folders, state.folders);
  assert.notEqual(snapshot.folderLayouts[40], state.system.folderLayouts[40]);
  assert.equal(snapshot.theme, 'blue');
  assert.deepEqual(Object.keys(snapshot).sort(), ['folderLayouts', 'folders', 'homeView', 'layout', 'nextFolderNumber', 'theme', 'version']);
  assert.equal(state.homeSavedLayouts, undefined);
});
test('loading restores layout and view while keeping suspended owners and current audio preferences', () => {
  let state = saveHomeLayoutSlot(arranged(), 0);
  const expected = serializeHomeSavedLayouts(state).slots[0], oldIdentity = getHomeFolderIdentity(state, 40);
  state = tickSystem(launch(state, 'work', 3010), 6200);
  state = reduceSystem(state, 'home', 6300);
  state = moveHomeItem(state, { folder: 40, slot: 14 }, { folder: null, slot: 50 });
  state = { ...state, theme: 'pink', brightness: .2, powerSaving: true,
    system: { ...state.system, muted: true, volume: .12 } };
  const before = state, restored = loadHomeLayoutSlot(state, 0);
  assert.deepEqual(restored.system.layout, expected.layout);
  assert.deepEqual(restored.system.folderLayouts, expected.folderLayouts);
  assert.deepEqual(saveHomeView(restored), expected.homeView);
  assert.equal(restored.theme, 'blue');
  assert.equal(restored.brightness, .2);
  assert.equal(restored.powerSaving, true);
  assert.equal(restored.system.muted, true);
  assert.equal(restored.system.volume, .12);
  assert.equal(restored.system.runtime, before.system.runtime);
  assert.equal(restored.system.app, before.system.app);
  assert.equal(restored.system.input, before.system.input);
  assert.notEqual(getHomeFolderIdentity(restored, 40), oldIdentity);
  assert.ok(restored.system.homeFolderIdentities.nextAllocation > before.system.homeFolderIdentities.nextAllocation);
  assert.equal(restored.system.homeNavigation.gesture, null);
  assert.equal(restored.system.homeNavigation.motion, null);
  assert.equal(restored.system.homeControls, null);
  assert.equal(restored.system.homeFolderClose.generation, before.system.homeFolderClose.generation + 1);
});
test('round-trip sanitizes corrupt slots individually and cannot inject live state or dangling folders', () => {
  const saved = saveHomeLayoutSlot(saveHomeLayoutSlot(arranged(), 0), 7);
  const payload = JSON.parse(JSON.stringify(serializeHomeSavedLayouts(saved)));
  payload.slots[0].layout[298] = 'work';
  payload.slots[7].homeView.activeFolderSlot = 299;
  payload.slots[7].homeView.folderViews[299] = payload.slots[7].homeView.folderViews[40];
  payload.slots[7].muted = true;
  payload.slots[7].runtime = { active: 'injected' };
  const state = home(), restored = restoreHomeSavedLayouts(state, payload);
  assert.equal(restored.homeSavedLayouts[0], null);
  assert.ok(restored.homeSavedLayouts[7]);
  assert.equal(restored.homeSavedLayouts[7].homeView.activeFolderSlot, null);
  assert.equal(restored.homeSavedLayouts[7].homeView.folderViews[299], undefined);
  assert.equal(restored.homeSavedLayouts[7].runtime, undefined);
  const loaded = loadHomeLayoutSlot(restored, 7);
  assert.equal(loaded.system.runtime, state.system.runtime);
  assert.equal(loaded.system.muted, false);
  assert.equal(loaded.opened, false);
  assert.equal(restoreHomeSavedLayouts(state, { version: 2, slots: payload.slots }), state);
  assert.equal(restoreHomeSavedLayouts(state, { version: 1, slots: [] }), state);
});
test('loading retains enabled native HOME controls with no departed gesture or held direction', () => {
  let state = saveHomeLayoutSlot(enableHomeControls(arranged()), 1);
  state = queueHomeControlEvent(state, { type: 'button', command: 'right', phase: 'down', source: 'test' });
  const before = state.system.homeControls, restored = loadHomeLayoutSlot(state, 1);
  assert.ok(restored.system.homeControls);
  assert.notEqual(restored.system.homeControls, before);
  assert.deepEqual(restored.system.homeControls, enableHomeControls({ ...restored, system: { ...restored.system, homeControls: null } }).system.homeControls);
  assert.equal(restored.system.homeClock, state.system.homeClock);
});
test('save, overwrite, load and delete requests require a selected valid slot and preserve cancellation', () => {
  const empty = { ...home(), panel: 'home-layouts', homeLayoutSlot: 2 };
  assert.equal(requestHomeLayoutAction(empty, 'load'), empty);
  let state = requestHomeLayoutAction(empty, 'save');
  assert.equal(state.homeLayoutConfirm, false);
  assert.equal(state.homeLayoutAction, null, 'empty save does not display an overwrite confirmation');
  assert.ok(state.homeSavedLayouts[2]);
  const overwrite = requestHomeLayoutAction(state, 'save');
  assert.equal(overwrite.homeLayoutAction, 'save');
  assert.equal(reduceMenu(overwrite, 'back').homeSavedLayouts, state.homeSavedLayouts);
  const loaded = reduceMenu({ ...state, homeLayoutAction: null }, 'y');
  assert.equal(loaded.homeLayoutAction, 'load');
  state = confirmHomeLayoutAction(requestHomeLayoutAction({ ...state, theme: 'red' }, 'save'));
  assert.equal(state.homeSavedLayouts[2].theme, 'red');
  state = confirmHomeLayoutAction(requestHomeLayoutAction(state, 'delete'));
  assert.equal(state.homeSavedLayouts[2], null);
  assert.equal(state.homeLayoutAction, null);
  assert.equal(deleteHomeLayoutSlot(state, 2), state);
  for (const slot of [-1, 8, .5, NaN]) {
    assert.equal(saveHomeLayoutSlot(state, slot), state);
    assert.equal(loadHomeLayoutSlot(state, slot), state);
  }
});
