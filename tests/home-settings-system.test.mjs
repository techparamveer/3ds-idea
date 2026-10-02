import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPortfolioState, tickSystem, dispatchSystemEvent, reduceSystem, touchSystem,
  saveSettings, restoreSettings, moveApp,
} from '../src/os/system.ts';
import { enableHomeControls } from '../src/os/home-controls.ts';
import { HOME_SETTINGS_MAX_SCROLL, homeSettingsScrollAt } from '../src/os/stock-screen-layout.ts';

const home = () => enableHomeControls(tickSystem(createPortfolioState(), 3001));
const settings = () => reduceSystem(home(), 'settings', 4000);
const touch = (state, phase, x, y, now = 4010, pointerId = 1) =>
  dispatchSystemEvent(state, { type: 'touch', phase, x, y, pointerId }, now);
const tap = (state, x, y, now = 4010) => touch(touch(state, 'down', x, y, now), 'up', x, y, now + 1);
const press = (state, command, now = 4020, source = 'keyboard:test') => {
  const down = dispatchSystemEvent(state, { type: 'button', command, phase: 'down', source }, now);
  return dispatchSystemEvent(down, { type: 'button', command, phase: 'up', source }, now + 1);
};
const confirm = (state, now = 4050) => reduceSystem(reduceSystem(state, 'right', now), 'open', now + 1);
function savedViaFooter() {
  let state = moveApp({ ...home(), theme: 'blue' }, 0, 40);
  state = reduceSystem(state, 'settings', 4000);
  state = touchSystem(state, 152, 168, 4010);
  state = touchSystem(state, 122, 62, 4020);
  state = touchSystem(state, 220, 225, 4030);
  assert.ok(state.homeSavedLayouts?.[1]);
  assert.equal(state.homeLayoutAction, null);
  return state;
}
function assertSettings(state) {
  assert.equal(state.panel, 'settings');
  assert.equal(state.system.phase, 'home');
  assert.equal(state.system.preferences, false);
}

test('source Save/Load touch entry agrees for legacy touch and the phased pointer path', () => {
  for (const open of [state => touchSystem(state, 152, 168, 4010), state => tap(state, 152, 168)]) {
    const state = settings(), next = open(state);
    assert.equal(next.panel, 'home-layouts');
    assert.equal(next.homeLayoutSlot, 0);
    assert.equal(next.homeLayoutAction, null);
    assert.equal(next.brightness, state.brightness);
    assert.equal(next.powerSaving, state.powerSaving);
    assert.equal(next.system.preferences, false);
    assert.equal(next.system.runtime, state.system.runtime);
    assert.equal(next.system.input.touch, null);
  }
});

test('the native settings rail never opens browser preferences', () => {
  for (const y of [145, 168, 200]) {
    for (const click of [state => touchSystem(state, 276, y, 4010), state => tap(state, 276, y)]) {
      const state = settings(), next = click(state);
      assertSettings(next);
      assert.equal(next.panelScroll, homeSettingsScrollAt(276, y));
      assert.equal(next.system.muted, state.system.muted);
      assert.equal(next.system.volume, state.system.volume);
    }
  }
});

test('settings rail drag remains captured after the pointer leaves its x range', () => {
  const initial = settings();
  let state = touch(initial, 'down', 276, 17);
  assertSettings(state);
  assert.equal(state.system.input.touch.pointerId, 1);
  state = touch(state, 'move', 152, 168, 4020);
  assertSettings(state);
  assert.equal(state.panelScroll, homeSettingsScrollAt(276, 168));
  state = touch(state, 'up', 152, 223, 4030);
  assertSettings(state);
  assert.equal(state.panelScroll, HOME_SETTINGS_MAX_SCROLL);
  assert.equal(state.system.input.touch, null);
  assert.equal(state.system.homeNavigation.gesture, null);
  assert.equal(state.brightness, initial.brightness);
  assert.equal(state.powerSaving, initial.powerSaving);
  assert.equal(state.system.layout, initial.system.layout);
});

test('cancelled settings rail drag cannot activate a row or retain pointer capture', () => {
  const initial = settings();
  let state = touch(touch(initial, 'down', 276, 17), 'move', 276, 100, 4020);
  const scroll = state.panelScroll;
  state = touch(state, 'cancel', 152, 168, 4030);
  assertSettings(state);
  assert.equal(state.panelScroll, scroll);
  assert.equal(state.system.input.touch, null);
  assert.equal(state.system.homeNavigation.gesture, null);
  state = touch(state, 'up', 152, 168, 4040);
  assertSettings(state);
  assert.equal(state.panelScroll, scroll);
  assert.equal(state.brightness, initial.brightness);
  const reopened = reduceSystem(reduceSystem(state, 'back', 4050), 'settings', 4060);
  assert.equal(tap(reopened, 152, 168, 4070).panel, 'home-layouts');
});

test('only a stroke beginning on the rail can scroll and another pointer cannot take it over', () => {
  let state = touch(settings(), 'down', 295, 100);
  state = touch(state, 'move', 276, 223, 4020);
  state = touch(state, 'up', 276, 223, 4030);
  assertSettings(state);
  assert.equal(state.panelScroll ?? 0, 0);
  state = touch(state, 'down', 276, 17, 4040);
  state = touch(state, 'move', 152, 223, 4050, 2);
  assert.equal(state.panelScroll ?? 0, 0);
  state = touch(state, 'up', 152, 223, 4060, 2);
  assert.equal(state.system.input.touch.pointerId, 1);
  state = touch(state, 'move', 152, 223, 4070);
  assert.equal(state.panelScroll, HOME_SETTINGS_MAX_SCROLL);
  state = touch(state, 'cancel', 152, 223, 4080);
  assert.equal(state.system.input.touch, null);
});

test('System X saves and Y loads without zooming or changing brightness in Save/Load', () => {
  let state = touchSystem(settings(), 152, 168, 4010);
  const columns = state.columns, brightness = state.brightness;
  state = press(state, 'x');
  assert.ok(state.homeSavedLayouts?.[0]);
  assert.equal(state.homeLayoutAction, null);
  assert.equal(state.columns, columns);
  assert.equal(state.brightness, brightness);
  state = press(state, 'x', 4040);
  assert.equal(state.homeLayoutAction, 'save');
  assert.equal(state.homeLayoutConfirm, false);
  assert.equal(state.columns, columns);
  assert.equal(state.brightness, brightness);
  state = confirm(state);
  assert.ok(state.homeSavedLayouts[0]);
  state = press(state, 'y', 4070, 'physical:y');
  assert.equal(state.homeLayoutAction, 'load');
  assert.equal(state.columns, columns);
  assert.equal(state.brightness, brightness);
  state = reduceSystem(state, 'back', 4090);
  state = reduceSystem(state, 'x', 4100);
  assert.equal(state.homeLayoutAction, 'save');
  assert.equal(state.columns, columns);
  assert.equal(state.brightness, brightness);
});

test('occupied Save/Load dialogs use source Cancel and Confirm touch targets with an inert center gap', () => {
  let state = { ...savedViaFooter(), theme: 'red' };
  state = touchSystem(state, 220, 225, 4050);
  assert.equal(state.homeLayoutAction, 'save');
  assert.equal(state.homeLayoutConfirm, false);
  state = touchSystem(state, 160, 200, 4060);
  assert.equal(state.homeLayoutAction, 'save');
  assert.equal(state.homeSavedLayouts[1].theme, 'blue');
  state = tap(state, 90, 200, 4070);
  assert.equal(state.homeLayoutAction, null);
  assert.equal(state.homeSavedLayouts[1].theme, 'blue');
  state = touchSystem(state, 220, 225, 4090);
  state = tap(state, 230, 200, 4100);
  assert.equal(state.homeLayoutAction, null);
  assert.equal(state.homeSavedLayouts[1].theme, 'red');
  state = touchSystem({ ...state, theme: 'white' }, 100, 225, 4120);
  assert.equal(state.homeLayoutAction, 'load');
  state = tap(state, 230, 200, 4130);
  assert.equal(state.homeLayoutAction, null);
  assert.equal(state.theme, 'red');
});

test('settings close and theme return clear the overlay without launching or opening preferences', () => {
  for (const close of [state => touchSystem(state, 20, 220, 4010), state => tap(state, 20, 220), state => reduceSystem(state, 'back', 4010)]) {
    const state = close(settings());
    assert.equal(state.panel, null);
    assert.equal(state.system.phase, 'home');
    assert.equal(state.system.preferences, false);
    assert.equal(state.system.app, null);
  }
  let state = tap(settings(), 152, 71);
  assert.equal(state.panel, 'themes');
  state = press(state, 'back', 4030);
  assertSettings(state);
  assert.equal(state.panelChoice, 0);
  assert.equal(state.panelScroll, 0);
  state = reduceSystem(reduceSystem(state, 'down', 4050), 'open', 4060);
  assert.equal(state.panel, 'home-layouts');
  state = touchSystem(state, 20, 225, 4070);
  assertSettings(state);
  assert.equal(state.panelChoice, 1);
});

test('System settings round-trip preserves saved layouts separately from the current arrangement', () => {
  const saved = savedViaFooter(), snapshot = saved.homeSavedLayouts[1];
  let current = reduceSystem(saved, 'back', 4080);
  current = reduceSystem(current, 'back', 4090);
  current = moveApp({ ...current, theme: 'pink' }, 40, 0);
  const serialized = JSON.parse(saveSettings(current));
  assert.equal(serialized.version, 4);
  assert.equal(serialized.homeSavedLayouts.version, 1);
  assert.equal(serialized.homeSavedLayouts.slots.length, 8);
  assert.deepEqual(serialized.homeSavedLayouts.slots[1], snapshot);
  assert.equal(serialized.homeLayoutAction, undefined);
  assert.equal(serialized.panelScroll, undefined);
  const restored = restoreSettings(createPortfolioState(), JSON.stringify(serialized));
  assert.deepEqual(restored.system.layout, current.system.layout);
  assert.equal(restored.theme, 'pink');
  assert.deepEqual(restored.homeSavedLayouts[1], snapshot);
  assert.notEqual(restored.homeSavedLayouts[1], snapshot);
  let loaded = tickSystem(restored, 5000);
  loaded = reduceSystem(loaded, 'settings', 5010);
  loaded = touchSystem(loaded, 152, 168, 5020);
  loaded = touchSystem(loaded, 122, 62, 5030);
  loaded = touchSystem(loaded, 100, 225, 5040);
  assert.equal(loaded.homeLayoutAction, 'load');
  loaded = confirm(loaded, 5050);
  assert.deepEqual(loaded.system.layout, snapshot.layout);
  assert.equal(loaded.theme, snapshot.theme);
});

test('legacy System saves without the optional saved-layout payload still restore normally', () => {
  const original = savedViaFooter(), serialized = JSON.parse(saveSettings(original));
  delete serialized.homeSavedLayouts;
  const restored = restoreSettings(createPortfolioState(), JSON.stringify(serialized));
  assert.deepEqual(restored.system.layout, original.system.layout);
  assert.equal(restored.theme, original.theme);
  assert.equal(restored.homeSavedLayouts?.some(Boolean) ?? false, false);
});

test('System restore discards one corrupt saved slot without discarding current HOME or a valid sibling', () => {
  let saved = savedViaFooter();
  saved = touchSystem(saved, 198, 62, 4080);
  saved = touchSystem(saved, 220, 225, 4090);
  assert.ok(saved.homeSavedLayouts?.[2]);
  const serialized = JSON.parse(saveSettings(saved));
  serialized.homeSavedLayouts.slots[1].layout[299] = 'work';
  serialized.homeSavedLayouts.slots[2].runtime = { active: 'forged' };
  serialized.homeSavedLayouts.slots[2].muted = !serialized.muted;
  const restored = restoreSettings(createPortfolioState(), JSON.stringify(serialized));
  assert.deepEqual(restored.system.layout, saved.system.layout);
  assert.equal(restored.homeSavedLayouts[1], null);
  assert.deepEqual(restored.homeSavedLayouts[2], saved.homeSavedLayouts[2]);
  assert.equal(restored.homeSavedLayouts[2].runtime, undefined);
  assert.equal(restored.homeSavedLayouts[2].muted, undefined);
  assert.equal(restored.system.runtime.active, null);
  assert.equal(restored.system.muted, saved.system.muted);
});
