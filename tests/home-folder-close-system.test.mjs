import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPortfolioState, tickSystem, reduceSystem, touchSystem, dispatchSystemEvent,
  tickHomeNavigationClock, sampleSystemHomeFolderClose, isSystemHomeFolderClosing,
  releaseSystemInputs, setSystemSleeping, restoreSettings, saveSettings, launch, invokeSystemApplet, moveApp,
} from '../src/os/system.ts';
import { reduceMenu } from '../src/os/state.ts';
import { moveHomeItem } from '../src/os/home-layout.ts';
import {
  enterHomeFolder, leaveHomeFolder, selectHomeSlot, setHomeDensity, settleHomeNavigation,
  getHomeNavigation, getHomeNavigationView, writeHomeNavigation, isHomeRootSelectionVisible,
} from '../src/os/home-navigation.ts';
import { SYSTEM_HOME_FOLDER_CLOSE_VIEWPORT_UPDATES, advanceSystemHomeFolderCloseNative, consumeSystemHomeFolderCloseInput } from '../src/os/home-folder-close-system.ts';

const T = 4000, FRAME = 1000 / 60;
const home = () => tickSystem(createPortfolioState(), 3001);
function folder() { return enterHomeFolder(reduceMenu(selectHomeSlot(home(), 40), 'open'), 40); }
const record = sampleSystemHomeFolderClose;
const close = (state = folder(), now = T) => reduceSystem(state, 'back', now);
const at = (state, updates, start = T, reduced = false) => tickSystem(state, start + updates * FRAME, reduced);
const views = state => JSON.parse(saveSettings(state)).homeView;
const touch = (state, phase, x, y, now = T) => dispatchSystemEvent(state, { type: 'touch', phase, pointerId: 4, x, y }, now);
function offscreen(left = 0) {
  const state = folder(), nav = getHomeNavigation(state);
  return writeHomeNavigation(state, { ...nav, rootView: { ...nav.rootView, currentLeftSlot: left, targetLeftSlot: left } });
}

function acceleratedClose(visible = false) {
  let state = folder(), nav = getHomeNavigation(state);
  const root = nav.rootView;
  const left = visible ? root.currentLeftSlot : root.selectedSlot - 6;
  state = writeHomeNavigation(state, { ...nav, rootView: { ...root, currentLeftSlot: left, targetLeftSlot: left },
    mode3: Object.freeze({ entryCount: 5, directionMask: 0, pendingMask: 0 }) });
  state = { ...state, system: { ...state.system, homeCursorLoop: Object.freeze({ currentFrame: 17.25, appliedFrame: 16.25, step: 1 }) } };
  return close(state);
}
function nativeCloseUpdates(state, updates) {
  state = { ...state, system: { ...state.system, homeClock: { ...state.system.homeClock, updateCount: state.system.homeClock.updateCount + updates } } };
  return advanceSystemHomeFolderCloseNative(state, updates);
}

test('native close resolves acceleration at restoration and spends no viewport update there', () => {
  const initial = acceleratedClose(), result = nativeCloseUpdates(initial, 18), root = result.state;
  assert.equal(record(root).restoredAtUpdate, 18); assert.equal(record(root).selectionReadyAtUpdate, null);
  assert.equal(record(root).controller.viewportDuration, 5); assert.equal(getHomeNavigationView(root).elapsedUpdates, 0);
  assert.deepEqual(root.system.homeCursorLoop, { currentFrame: 17.25, appliedFrame: 16.25, step: 3 });
  assert.deepEqual(result.observations.map(o => [o.kind, o.updateOffset]), [['mode3-entry', 17]]);
  const completed = nativeCloseUpdates(root, 5), complete = completed.state;
  assert.equal(record(complete).selectionReadyAtUpdate, 23); assert.equal(isHomeRootSelectionVisible(complete), true);
  assert.deepEqual(completed.observations.map(o => [o.kind, o.reason, o.context, o.slot, o.updateOffset, o.updateCount]),
    [['banner-resolve', 'idle-entry', null, 40, 4, 1]]);
  assert.deepEqual(nativeCloseUpdates(complete, 0).observations, []);
  const visible = nativeCloseUpdates(acceleratedClose(true), 18);
  assert.equal(record(visible.state).selectionReadyAtUpdate, 18);
  assert.deepEqual(visible.observations.map(o => [o.kind, o.reason, o.context, o.slot, o.updateOffset, o.updateCount]),
    [['banner-resolve', 'idle-entry', null, 40, 17, 1]]);
  assert.equal(getHomeNavigation(visible.state).mode3.entryCount, 5); assert.equal(visible.state.system.homeCursorLoop.step, 1);
});

test('event7 before late restoration selects10; release during the viewport preserves5', () => {
  let state = nativeCloseUpdates(acceleratedClose(), 17).state;
  const identity = record(state).controller.identity;
  const released = consumeSystemHomeFolderCloseInput(state, identity, { type: 7, mask: 16 });
  assert.equal(released.disposition, 'handled'); assert.ok(record(released.state));
  state = nativeCloseUpdates(released.state, 1).state;
  assert.equal(record(state).controller.viewportDuration, 10); assert.equal(getHomeNavigation(state).mode3.entryCount, 1);
  assert.equal(record(nativeCloseUpdates(state, 10).state).selectionReadyAtUpdate, 28);
  state = nativeCloseUpdates(acceleratedClose(), 20).state;
  const before = getHomeNavigation(state).motion;
  state = consumeSystemHomeFolderCloseInput(state, record(state).controller.identity, { type: 7, mask: 0xcfff }).state;
  assert.equal(getHomeNavigation(state).motion, before); assert.equal(before.durationUpdates, 5);
  assert.equal(state.system.homeCursorLoop.step, 1);
  assert.equal(record(nativeCloseUpdates(state, 3).state).selectionReadyAtUpdate, 23);
});

test('close release bridge cannot adopt a stale identity or out-of-band navigation replacement', () => {
  const initial = acceleratedClose(), identity = record(initial).controller.identity;
  for (const key of [{ ...identity, transitionId: identity.transitionId + 1 }, { ...identity, generation: 'old' }]) {
    const result = consumeSystemHomeFolderCloseInput(initial, key, { type: 7, mask: 16 });
    assert.equal(result.state, initial); assert.equal(result.disposition, 'unsupported');
  }
  const pressed = consumeSystemHomeFolderCloseInput(initial, identity, { type: 4, mask: 16 });
  assert.equal(pressed.state, initial); assert.equal(pressed.disposition, 'unsupported');
  const replaced = writeHomeNavigation(initial, { ...getHomeNavigation(initial) });
  assert.equal(record(replaced), null);
  assert.equal(consumeSystemHomeFolderCloseInput(replaced, identity, { type: 7, mask: 16 }).state, replaced);
});

test('Back consumes setup layout at C once and restores at C+18 with retained bounded timestamps', () => {
  let initial = tickHomeNavigationClock(folder(), T);
  initial = at(initial, 7);
  const state = close(initial, T + 7 * FRAME), r = record(state);
  assert.equal(state.system.homeClock.updateCount, 7);
  assert.equal(state.opened, true);
  assert.equal(r.startedAtUpdate, 7);
  assert.equal(r.folderSlot, 40);
  assert.deepEqual([r.controller.folder.appliedFrame, r.controller.folder.frame], [16, 15]);
  assert.deepEqual([r.controller.capture.appliedFrame, r.controller.capture.frame], [8, 7]);
  const again = reduceSystem(state, 'back', T + 7 * FRAME);
  assert.equal(record(again), r);
  assert.equal(again.system.homeFolderClose.nextTransitionId, 2);
  const idle = at(state, 24);
  assert.equal(idle.opened, true);
  assert.equal(record(idle).controller.folder.status, 0);
  assert.equal(record(idle).restoredAtUpdate, null);
  const root = at(idle, 25);
  assert.equal(root.opened, false);
  assert.equal(root.selected, 40);
  assert.equal(record(root).restoredAtUpdate, 25);
  assert.equal(record(root).selectionReadyAtUpdate, 25);
  assert.equal(record(root).controller.phase, 'complete');
  assert.equal(isSystemHomeFolderClosing(root), false);
  assert.equal(record(at(root, 50)), record(root), 'completed record survives ordinary later ticks');
});

test('one large tick equals stepped close work and retains a mid-batch boundary', () => {
  for (const initial of [folder(), offscreen(), offscreen(100)]) {
    const started = close(initial), batch = at(started, 45);
    let stepped = started;
    for (let update = 1; update <= 45; update++) stepped = at(stepped, update);
    assert.deepEqual(record(batch), record(stepped));
    assert.deepEqual(getHomeNavigation(batch), getHomeNavigation(stepped));
    assert.equal(saveSettings(batch), saveSettings(stepped));
    assert.equal(batch.system.homeClock.updateCount, 45);
    assert.equal(record(batch).restoredAtUpdate, 18);
    assert.ok(record(batch).selectionReadyAtUpdate < batch.system.homeClock.updateCount);
    assert.equal(getHomeNavigationView(batch).mode, 0);
  }
});

test('physical, keyboard, command, Back tab and occupied footer share the deferred path', () => {
  const occupied = moveHomeItem(folder(), { folder: null, slot: 0 }, { folder: 40, slot: 2 });
  const routes = [s => close(s),
    s => dispatchSystemEvent(s, { type: 'button', phase: 'down', source: 'model:B', command: 'back' }, T),
    s => dispatchSystemEvent(s, { type: 'button', phase: 'down', source: 'keyboard:Escape', command: 'back' }, T),
    s => dispatchSystemEvent(s, { type: 'command', command: 'back' }, T),
    s => touchSystem(s, 59, 54, T), s => touch(touch(s, 'down', 59, 54), 'up', 59, 54),
    s => touchSystem(s, 59, 226, T), s => touch(touch(s, 'down', 59, 226), 'up', 59, 226)];
  for (const route of routes) {
    const started = route(occupied);
    assert.equal(started.opened, true);
    assert.equal(record(started).startedAtUpdate, 0);
    assert.equal(record(started).controller.folder.appliedFrame, 16);
    assert.equal(started.system.homeNavigation.gesture, null);
    assert.equal(at(started, 18).opened, false);
  }
});

test('ordinary actions and contacts cannot mutate closing or viewport state or queue repeats', () => {
  for (const initial of [close(folder()), at(close(offscreen()), 20)]) {
    const now = initial.system.homeClock.lastNow, before = saveSettings(initial), r = record(initial);
    for (const input of ['left', 'right', 'up', 'down', 'open', 'start', 'x', 'y', 'l', 'r', 'select', 'zoom', 'zoom-in', 'zoom-out', 'settings', 'reset-layout', 'back']) {
      assert.equal(saveSettings(reduceSystem(initial, input, now)), before);
      const pressed = dispatchSystemEvent(initial, { type: 'button', command: input, phase: 'down', source: `test:${input}` }, now);
      assert.equal(saveSettings(pressed), before);
      assert.deepEqual(pressed.system.input.held, {});
      assert.equal(record(pressed), r);
    }
    for (const [x, y] of [[59, 54], [244, 137], [307, 16], [10, 16], [59, 226], [260, 226]]) {
      const touched = touch(touch(initial, 'down', x, y, now), 'up', x, y, now);
      assert.equal(saveSettings(touched), before);
      assert.equal(touched.system.homeNavigation.gesture, null);
      assert.equal(touched.system.input.touch, null);
    }
    const analog = dispatchSystemEvent(initial, { type: 'analog', source: 'circle', x: 1, y: 0 }, now);
    assert.deepEqual(analog.system.input.held, {});
    assert.equal(moveApp(initial, 0, 10), initial);
  }
});

test('close clears held input and cannot release a delayed repeat into restored root', () => {
  let initial = dispatchSystemEvent(folder(), { type: 'button', command: 'right', phase: 'down', source: 'pad' }, T);
  const started = close(initial);
  assert.deepEqual(started.system.input.held, {});
  const root = at(started, 60);
  assert.equal(root.selected, 40);
  assert.equal(root.system.homeNavigation.gesture, null);
  assert.equal(record(root).selectionReadyAtUpdate, 18);
});

test('root and independent folder histories survive animation and reopening', () => {
  let initial = settleHomeNavigation(selectHomeSlot(setHomeDensity(folder(), 4), 47));
  initial = leaveHomeFolder(initial);
  initial = reduceMenu(selectHomeSlot(initial, 41), 'open');
  initial = settleHomeNavigation(selectHomeSlot(setHomeDensity(enterHomeFolder(initial, 41), 0), 21));
  initial = enterHomeFolder(leaveHomeFolder(initial), 40);
  const before = views(initial);
  const started = close(initial);
  assert.deepEqual(views(started), before);
  const root = at(started, 18);
  assert.deepEqual(views(root), { ...before, activeFolderSlot: null });
  const reopened = reduceSystem(root, 'open', T + 18 * FRAME);
  assert.equal(reopened.opened, true);
  assert.equal(reopened.folderSelected, 47);
  assert.equal(record(reopened), null, 'old completed transition does not attach to reopened folder');
  const next = close(reopened, T + 18 * FRAME);
  assert.equal(record(next).controller.identity.transitionId, 2);
  assert.equal(record(next).startedAtUpdate, 18);
});

test('offscreen root uses explicit10-update linear mode3 from actual root geometry', () => {
  assert.equal(SYSTEM_HOME_FOLDER_CLOSE_VIEWPORT_UPDATES, 10);
  for (const left of [0, 100]) {
    const initial = offscreen(left), rootHistory = getHomeNavigation(initial).rootView;
    let state = at(close(initial), 18);
    const restored = record(state), start = getHomeNavigationView(state);
    assert.equal(state.opened, false);
    assert.equal(restored.restoredAtUpdate, 18);
    assert.equal(restored.selectionReadyAtUpdate, null);
    assert.equal(start.mode, 3);
    assert.equal(start.currentDensity, rootHistory.density);
    assert.equal(start.currentLeftSlot, left);
    assert.equal(start.elapsedUpdates, 0);
    assert.equal(start.scrollPixels, left / start.rows * start.pitchX);
    const target = start.targetLeftSlot / start.rows * start.pitchX;
    state = at(state, 23);
    const middle = getHomeNavigationView(state);
    assert.equal(middle.elapsedUpdates, 5);
    assert.equal(middle.scrollPixels, (start.scrollPixels + target) / 2);
    assert.equal(record(state).selectionReadyAtUpdate, null);
    state = at(state, 28);
    assert.equal(record(state).selectionReadyAtUpdate, 28);
    assert.equal(record(state).controller.viewportUpdates, 10);
    assert.equal(getHomeNavigationView(state).mode, 0);
    assert.equal(getHomeNavigationView(state).scrollPixels, target);
    assert.equal(isHomeRootSelectionVisible(state), true);
  }
});

for (const phase of ['closing', 'viewport']) {
  test(`${phase} pauses/rebases across sleep, preferences, power, panel and hidden release`, () => {
    const started = close(phase === 'viewport' ? offscreen() : folder());
    const before = at(started, phase === 'viewport' ? 21 : 5);
    const count = before.system.homeClock.updateCount, now = before.system.homeClock.lastNow;
    const scenarios = [
      [s => setSystemSleeping(s, true, now), s => setSystemSleeping(s, false, 90000)],
      [s => reduceSystem(s, 'preferences', now), s => reduceSystem(s, 'back', 90000)],
      [s => reduceSystem(s, 'power', now), s => reduceSystem(s, 'back', 90000)],
      [s => ({ ...s, panel: 'settings' }), s => reduceSystem(s, 'home', 90000)],
      [s => releaseSystemInputs(s, now), s => s],
    ];
    for (const [pause, resume] of scenarios) {
      let state = pause(before);
      if (state.system.homeClock.lastNow !== null || state.system.phase !== 'home' || state.system.sleeping || state.system.preferences || state.panel) state = tickSystem(state, 80000);
      assert.equal(record(state), record(before));
      assert.deepEqual(getHomeNavigationView(state), getHomeNavigationView(before));
      state = resume(state);
      state = tickSystem(state, 90000);
      assert.equal(state.system.homeClock.updateCount, count);
      assert.equal(record(state), record(before));
      state = tickSystem(state, 90000 + FRAME);
      assert.equal(state.system.homeClock.updateCount, count + 1);
      assert.notEqual(record(state), record(before));
    }
  });
}

test('global audio controls remain available without restarting the close identity', () => {
  const started = close();
  const muted = reduceSystem(started, 'mute', T);
  assert.equal(muted.system.muted, true);
  assert.equal(record(muted), record(started));
  const louder = dispatchSystemEvent(muted, { type: 'command', command: 'volume-up' }, T);
  assert.ok(louder.system.volume > started.system.volume);
  assert.equal(record(louder), record(started));
});

test('reduced motion preserves close and viewport counts while ordinary motion still settles', () => {
  for (const source of [folder(), offscreen()]) {
    const started = close(source);
    assert.deepEqual(record(at(started, 10, T, true)), record(at(started, 10)));
    assert.deepEqual(record(at(started, 20, T, true)), record(at(started, 20)));
    assert.deepEqual(getHomeNavigationView(at(started, 20, T, true)), getHomeNavigationView(at(started, 20)));
    assert.deepEqual(record(at(started, 40, T, true)), record(at(started, 40)));
  }
});

test('successful restore replaces generation and discards close state; persistence excludes all transient fields', () => {
  const started = close(), raw = saveSettings(started), saved = JSON.parse(raw);
  assert.equal(saved.homeView.activeFolderSlot, 40);
  for (const forbidden of ['homeFolderClose', 'startedAtUpdate', 'restoredAtUpdate', 'selectionReadyAtUpdate', 'transitionId', 'appliedFrame']) assert.ok(!raw.includes(forbidden));
  const restored = restoreSettings(started, raw);
  assert.equal(record(restored), null);
  assert.equal(restored.system.homeFolderClose.current, null);
  assert.equal(restored.system.homeFolderClose.generation, started.system.homeFolderClose.generation + 1);
  assert.equal(restored.system.homeClock.updateCount, 0);
  const next = close(restored, 90000);
  assert.notDeepEqual(record(next).controller.identity, record(started).controller.identity);
  assert.ok(record(next).controller.identity.transitionId > record(started).controller.identity.transitionId);
  assert.equal(record(at(next, 18, 90000)).selectionReadyAtUpdate, 18);
  assert.equal(restoreSettings(started, '{bad'), started);
  assert.equal(restoreSettings(started, null), started);
});

test('layout reset, launch, applet and confirmed power-off cancel without a root-ready observation', () => {
  const started = close();
  const cases = [
    s => reduceSystem(reduceSystem(s, 'preferences', T), 'reset-layout', T),
    s => launch(s, 'work', T), s => invokeSystemApplet(s, 'game-notes', T),
    s => reduceSystem(reduceSystem(s, 'power', T), 'open', T),
  ];
  for (const replace of cases) {
    const state = replace(started);
    assert.equal(record(state), null);
    assert.equal(state.system.homeFolderClose.current, null);
    assert.equal(record(tickSystem(state, 90000)), null);
    assert.equal(record(started).restoredAtUpdate, null);
  }
});

test('out-of-band context replacement discards a pending close before it can affect a new folder', () => {
  const started = close();
  let changed = leaveHomeFolder(started);
  changed = reduceMenu(selectHomeSlot(changed, 41), 'open');
  changed = enterHomeFolder(changed, 41);
  assert.equal(record(changed), null);
  const after = at(changed, 40);
  assert.equal(after.opened, true);
  assert.equal(after.selected, 41);
  assert.equal(after.system.homeFolderClose.current, null);
  const newClose = close(after, T + 40 * FRAME);
  assert.equal(record(newClose).controller.identity.transitionId, 2);
  assert.equal(record(newClose).folderSlot, 41);
});

test('sampling is immutable, duplicate timestamps are inert and backward time cannot fast-forward', () => {
  const started = at(close(), 5), r = record(started), count = started.system.homeClock.updateCount;
  for (let i = 0; i < 20; i++) assert.equal(record(started), r);
  assert.ok(Object.isFrozen(r));
  assert.throws(() => { r.startedAtUpdate = 999; }, TypeError);
  assert.equal(record(tickSystem(started, started.system.homeClock.lastNow)), r);
  const backwards = tickSystem(started, 1000);
  assert.equal(record(backwards), r);
  assert.equal(backwards.system.homeClock.updateCount, count);
  const forward = tickSystem(backwards, 1000 + FRAME);
  assert.equal(forward.system.homeClock.updateCount, count + 1);
});
