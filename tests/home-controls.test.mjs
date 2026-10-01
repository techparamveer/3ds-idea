import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  createPortfolioState, tickSystem, reduceSystem, dispatchSystemEvent, touchSystem,
  tickHomeNavigationClockObserved, releaseSystemInputs, setSystemSleeping,
  saveSettings, restoreSettings, sampleSystemHomeFolderClose,
} from '../src/os/system.ts';
import { enableHomeControls } from '../src/os/home-controls.ts';
import {
  createHomeNavigation, writeHomeNavigation, activeHomeRecord, sampleHomeGrid,
  selectHomeSlot, enterHomeFolder,
} from '../src/os/home-navigation.ts';
import { reduceMenu } from '../src/os/state.ts';
import { getHomeFooter } from '../src/os/home-presentation.ts';
import { consumeSystemHomeFolderCloseInput } from '../src/os/home-folder-close-system.ts';

const T = 4000, FRAME = 1000 / 60;
const scrollOracle = JSON.parse(readFileSync(new URL('./fixtures/home-scroll-consumer.json', import.meta.url)));
const schedule = scrollOracle.timelines.find(row => row.sceneUpdates === 1);
const decode = row => Object.fromEntries(scrollOracle.fields.map((key, i) => [key, row[i]]));
const booted = () => tickSystem(createPortfolioState(), 3001);
const nav = state => state.system.homeNavigation;
const controls = state => state.system.homeControls;
const at = (state, count, reduced = false) => tickHomeNavigationClockObserved(state, T + count * FRAME, reduced);
const now = state => state.system.homeClock.lastNow ?? T;
const button = (state, command, phase, source = 'model:dpad') =>
  dispatchSystemEvent(state, { type: 'button', command, phase, source }, now(state));
const touch = (state, phase, x, y) =>
  dispatchSystemEvent(state, { type: 'touch', phase, pointerId: 7, x, y }, now(state));
const center = (state, slot = activeHomeRecord(nav(state)).selectedSlot) => {
  const grid = sampleHomeGrid(nav(state)), point = grid.slots[slot];
  return { x: point.x - grid.scrollPixels, y: point.y };
};
function initialize(state) {
  state = { ...state, system: { ...state.system,
    homeCursorLoop: Object.freeze({ currentFrame: 17.25, appliedFrame: 16.25, step: 1 }) } };
  return at(enableHomeControls(state), 0).state;
}
function home(density = 0, selected = 0) {
  const navigation = createHomeNavigation(density);
  navigation.rootView = { ...navigation.rootView, selectedSlot: selected };
  return initialize(writeHomeNavigation(booted(), navigation));
}
function folder(counter = 5, visible = false) {
  let state = enterHomeFolder(reduceMenu(selectHomeSlot(booted(), 40), 'open'), 40);
  const navigation = nav(state), left = visible ? navigation.rootView.currentLeftSlot : 34;
  state = writeHomeNavigation(state, { ...navigation,
    rootView: { ...navigation.rootView, currentLeftSlot: left, targetLeftSlot: left },
    mode3: Object.freeze({ entryCount: counter, directionMask: 0, pendingMask: 0 }) });
  return initialize(state);
}
const logical = state => ({ navigation: nav(state), controls: controls(state),
  loop: state.system.homeCursorLoop, count: state.system.homeClock.updateCount });
const journal = pass => ({ count: pass.updateCount, observations: pass.observations,
  unsupported: pass.unsupportedInput, state: logical(pass.state) });
const cueIds = { selection: 0x100002c, invalid: 0x100002e, toolbar: 0x100003f };
function assertSourceState(state, row, label) {
  const expected = decode(row), navigation = nav(state), view = activeHomeRecord(navigation);
  const actual = { selected: view.selectedSlot, left: view.currentLeftSlot, target: view.targetLeftSlot,
    mode: navigation.motion?.mode ?? 0, counter: navigation.mode3.entryCount, step: state.system.homeCursorLoop.step,
    directionFlags: [Number(!!(navigation.mode3.directionMask & 0x20)), Number(!!(navigation.mode3.directionMask & 0x10))],
    pendingFlags: [Number(!!(navigation.mode3.pendingMask & 0x20)), Number(!!(navigation.mode3.pendingMask & 0x10))],
    toolbar: Number(navigation.focus.toolbarActive), focus: navigation.focus.currentFocus,
    previousFocus: navigation.focus.rememberedFocus, savedColumn: navigation.focus.savedColumn >>> 0 };
  for (const [key, value] of Object.entries(actual)) assert.deepEqual(value, expected[key], `${label}: ${key}`);
  if (expected.mode) {
    assert.equal(navigation.motion.durationUpdates, expected.duration, `${label}: duration`);
    assert.equal(navigation.motion.elapsedUpdates, expected.elapsed, `${label}: elapsed`);
  }
  // This consumer fixture does not submit Loop. Live phase is checked separately.
}

test('native quick clicks sample once, ignore browser repeat, and never populate the legacy latch', () => {
  for (const route of ['model', 'keyboard', 'command']) {
    let state = home();
    if (route === 'command') state = dispatchSystemEvent(state, { type: 'command', command: 'right' }, T);
    else {
      state = button(state, 'right', 'down', route);
      for (let i = 0; i < 4; i++) state = button(state, 'right', 'repeat', route);
      state = button(state, 'right', 'up', route);
    }
    assert.equal(state.selected, 0, 'queueing does not sample');
    assert.equal(state.system.homeClock.updateCount, 0);
    let result = at(state, 1);
    assert.equal(result.state.selected, 1);
    assert.equal(result.passes.flatMap(p => p.observations).filter(o => o.observation.kind === 'cue').length, 1);
    assert.deepEqual(result.state.system.input.held, {});
    assert.deepEqual(controls(result.state).input.sources, {});
    result = at(result.state, 40);
    assert.equal(result.state.selected, 1, 'released minimum pulse cannot repeat');
    assert.equal(result.passes.flatMap(p => p.observations).some(o => o.observation.kind === 'cursor-select'), false);
    assert.equal(controls(result.state).producer.repeatCandidate, 0);
  }
});

test('real System follows all 78 source polls: 20/5 repeat, mode3 acceleration and event7 release', () => {
  let state = home(0, 2), previousLoop = state.system.homeCursorLoop;
  const entries = [];
  for (const row of schedule.rows) {
    if (row.poll === 1) state = button(state, 'right', 'down');
    if (row.poll === 77) state = button(state, 'right', 'up');
    const result = at(state, row.poll + 1), pass = result.passes[0];
    assert.equal(result.passes.length, 1);
    state = result.state;
    assertSourceState(state, row.afterTicks, `poll ${row.poll}`);
    assert.deepEqual(pass.observations.filter(o => o.observation.kind === 'cue').map(o => cueIds[o.observation.cue]), row.cues);
    assert.equal(pass.unsupportedInput, false);
    if (pass.observations.some(o => o.observation.kind === 'mode3-entry')) entries.push(row.poll);
    assert.equal(state.system.homeCursorLoop.appliedFrame, previousLoop.currentFrame);
    assert.equal(state.system.homeCursorLoop.currentFrame, (previousLoop.currentFrame + state.system.homeCursorLoop.step) % 60);
    previousLoop = state.system.homeCursorLoop;
    assert.deepEqual(state.system.input.held, {});
    if (row.poll === 20) assert.equal(controls(state).producer.repeatCounter, 19);
    if (row.poll === 21) assert.equal(controls(state).producer.repeatCounter, 20);
    if (row.poll === 76) assert.equal(state.system.homeCursorLoop.step, 3);
  }
  assert.deepEqual(entries, [1, 21, 30, 41, 50, 61, 65, 71, 75]);
  assert.equal(nav(state).mode3.entryCount, 0);
  assert.equal(nav(state).mode3.pendingMask, 0);
  assert.equal(state.system.homeCursorLoop.step, 1);
  assert.equal(nav(state).motion.durationUpdates, 5, 'release retains the already-started fast duration');
  assert.equal(nav(state).motion.elapsedUpdates, 2);
});

test('scalar and batched System journals retain every lower pass and the pre-replay banner slot', () => {
  let initial = at(home(0, 2), 1).state;
  initial = button(initial, 'right', 'down');
  const batch = at(initial, 77), scalarPasses = [];
  let state = initial;
  for (let count = 2; count <= 77; count++) {
    const result = at(state, count); state = result.state; scalarPasses.push(...result.passes);
  }
  assert.deepEqual(batch.passes.map(journal), scalarPasses.map(journal));
  assert.deepEqual(logical(batch.state), logical(state));
  assert.equal(batch.passes.length, 76);
  const replay = batch.passes.find(pass => pass.updateCount === 31);
  assert.equal(replay.state.selected, 5);
  assert.deepEqual(replay.observations.map(({ phase, observation: o }) => [phase, o.kind, o.slot ?? null]), [
    ['lower', 'banner-resolve', 4], ['lower', 'mode3-entry', null],
    ['lower', 'cue', 5], ['lower', 'cursor-select', 5],
  ]);
  assert.equal(replay.observations.at(-1).observation.effectTarget.slot, 4);
  const idle = batch.passes.find(pass => pass.updateCount === 12);
  assert.deepEqual(idle.observations.map(o => [o.phase, o.observation.kind, o.observation.reason, o.observation.slot]),
    [['lower', 'banner-resolve', 'idle-update', 3]]);
  assert.deepEqual(at(batch.state, 77).passes, [], 'same timestamp cannot re-emit a journal');
});

test('primary retains mode3 position while departed effects follow geometry and submit through their terminal frame', () => {
  let state = home(0, 2), retained = controls(state).primary.center;
  state = reduceSystem(state, 'right', T);
  let result = at(state, 1); state = result.state;
  assert.deepEqual(result.passes[0].observations.map(o => [o.phase, o.observation.kind]),
    [['input', 'mode3-entry'], ['input', 'cue'], ['input', 'cursor-select']]);
  assert.deepEqual(controls(state).primary.center, retained);
  assert.equal(controls(state).primary.layoutVisible, true);
  let effect = controls(state).presentation.effects[0];
  assert.equal(effect.target.slot, 2);
  assert.deepEqual(effect.center, center(state, 2));
  assert.deepEqual(effect.disappear, { currentFrame: 1, appliedFrame: 0, status: 1 });
  assert.deepEqual(state.system.homeCursorLoop, { currentFrame: 18.25, appliedFrame: 17.25, step: 1 });
  state = at(state, 9).state;
  assert.deepEqual(controls(state).primary.center, retained);
  assert.deepEqual(controls(state).presentation.effects[0].center, center(state, 2));
  state = at(state, 10).state;
  assert.equal(nav(state).motion, null);
  assert.deepEqual(controls(state).primary.center, center(state));
  state = at(state, 21).state; effect = controls(state).presentation.effects[0];
  assert.equal(effect.visible, true);
  assert.deepEqual(effect.disappear, { currentFrame: 20, appliedFrame: 20, status: 2 });
  state = at(state, 22).state;
  assert.equal(controls(state).presentation.effects[0].visible, false);
  assert.equal(controls(state).presentation.effects[0].disappear.status, 0);
});

test('toolbar A/Start opens the focused applet instead of the old selected application', () => {
  const focused = at(reduceSystem(home(), 'up', T), 1).state;
  assert.equal(focused.selected, 0);
  assert.equal(nav(focused).focus.currentFocus, 1);
  assert.deepEqual(controls(focused).primary.center, { x: 76, y: 16.5 });
  assert.equal(controls(focused).presentation.primaryScale.appliedFrame, 11);
  for (const command of ['open', 'start']) {
    const state = button(focused, command, 'down', 'keyboard:Enter');
    assert.equal(state.system.phase, 'app');
    assert.equal(state.system.app, null, 'portfolio Work must not launch');
    assert.ok(Object.values(state.system.runtime.instances).some(instance => instance.appId === 'game-notes'));
    assert.deepEqual(controls(state).input.sources, {});
  }
});

test('applet footer is one Open button independent of the retained grid selection', () => {
  const initial = home(), settings = Number(Object.entries(initial.system.layout).find(([, id]) => id === 'system-settings')[0]);
  for (const slot of [0, settings, 30]) for (const suspended of [null, 'work']) {
    const selected = selectHomeSlot(initial, slot);
    for (const [focus, appId] of [[1, 'game-notes'], [2, 'friends'], [3, 'notifications'], [4, 'browser'], [5, 'miiverse']]) {
      const focused = writeHomeNavigation({ ...selected, system: { ...selected.system, app: suspended } }, {
        ...nav(selected), focus: { toolbarActive: true, currentFocus: focus, rememberedFocus: -1, savedColumn: 0 },
      });
      assert.deepEqual(getHomeFooter(focused), { two: false, left: null, right: 'open' });
      for (const x of [20, 160, 300]) {
        const opened = touchSystem(focused, x, 226, now(focused));
        assert.equal(opened.system.dialog, null, 'left edge must not close suspended software');
        assert.equal(opened.system.runtime.instances[opened.system.runtime.active]?.appId, appId);
        const released = touch(touch(focused, 'down', x, 226), 'up', x, 226);
        assert.equal(released.system.runtime.instances[released.system.runtime.active]?.appId, appId, 'pointer phases share the route');
      }
    }
  }
});

test('accepted toolbar-to-grid touch retains the departed effect and selects before a second tap activates', () => {
  for (const slot of [0, 1]) {
    let state = at(reduceSystem(home(), 'up', T), 1).state;
    assert.ok(controls(state).presentation.effects.some(effect => effect.visible));
    const point = center(state, slot);
    state = touch(touch(state, 'down', point.x, point.y), 'up', point.x, point.y);
    state = at(state, 6).state;
    assert.equal(state.system.phase, 'home');
    assert.equal(state.selected, slot);
    assert.equal(nav(state).focus.toolbarActive, false);
    const effect = controls(state).presentation.effects.find(effect => effect.target?.kind === 'toolbar');
    assert.equal(effect.visible, true);
    assert.equal(effect.target.focus, 1);
    assert.equal(effect.scale.currentFrame, 11);
    assert.deepEqual(effect.center, { x: 76, y: 16.5 });
    state = at(state, 7).state;
    assert.deepEqual(controls(state).primary.center, center(state));
    state = touchSystem(state, point.x, point.y, now(state));
    state = at(state, 12).state;
    assert.equal(state.system.phase, 'launch');
    assert.equal(state.system.app, slot === 0 ? 'work' : 'projects');
  }
});

test('native close shows at C+18 and retains child position until C+23 or C+28 viewport completion', () => {
  for (const counter of [0, 5]) for (const visible of [false, true]) {
    let state = folder(counter, visible), retained = controls(state).primary.center;
    state = reduceSystem(state, 'back', T);
    const identity = sampleSystemHomeFolderClose(state).controller.identity;
    assert.equal(controls(state).primary.shown, false);
    assert.equal(controls(state).primary.layoutVisible, false);
    state = at(state, 17).state;
    assert.equal(sampleSystemHomeFolderClose(state).restoredAtUpdate, null);
    assert.deepEqual(state.system.homeCursorLoop, { currentFrame: 17.25, appliedFrame: 16.25, step: 1 });
    let result = at(state, 18); state = result.state;
    assert.deepEqual(sampleSystemHomeFolderClose(state).controller.identity, identity);
    assert.equal(sampleSystemHomeFolderClose(state).restoredAtUpdate, 18);
    assert.equal(controls(state).primary.shown, true);
    assert.equal(controls(state).primary.layoutVisible, true);
    const step = !visible && counter === 5 ? 3 : 1;
    assert.deepEqual(state.system.homeCursorLoop, { currentFrame: 17.25 + step, appliedFrame: 17.25, step });
    if (visible) {
      assert.equal(sampleSystemHomeFolderClose(state).selectionReadyAtUpdate, 18);
      assert.deepEqual(controls(state).primary.center, center(state));
    } else {
      const complete = counter === 5 ? 23 : 28;
      assert.equal(sampleSystemHomeFolderClose(state).selectionReadyAtUpdate, null);
      assert.equal(nav(state).motion.elapsedUpdates, 0);
      assert.deepEqual(controls(state).primary.center, retained);
      assert.deepEqual(result.passes[0].observations.map(o => o.observation.kind), ['mode3-entry']);
      state = at(state, complete - 1).state;
      assert.deepEqual(controls(state).primary.center, retained);
      result = at(state, complete); state = result.state;
      assert.equal(sampleSystemHomeFolderClose(state).selectionReadyAtUpdate, complete);
      assert.deepEqual(controls(state).primary.center, center(state));
      assert.deepEqual(result.passes[0].observations.map(o => [o.phase, o.observation.kind, o.observation.slot]),
        [['lower', 'banner-resolve', 40]]);
    }
  }
});

test('real event7 during close preserves valid identity; before restoration chooses10, during viewport retains5', () => {
  for (const releaseAt of [17, 20]) {
    let state = at(button(folder(), 'right', 'down'), 1).state;
    state = reduceSystem(state, 'back', now(state));
    const identity = sampleSystemHomeFolderClose(state).controller.identity, C = state.system.homeClock.updateCount;
    state = at(state, C + releaseAt).state;
    state = button(state, 'right', 'up');
    state = at(state, C + releaseAt + 1).state;
    assert.deepEqual(sampleSystemHomeFolderClose(state).controller.identity, identity);
    assert.equal(state.system.homeCursorLoop.step, 1);
    assert.equal(nav(state).mode3.entryCount, releaseAt === 17 ? 1 : 0);
    assert.equal(nav(state).motion.durationUpdates, releaseAt === 17 ? 10 : 5);
    assert.equal(nav(state).mode3.pendingMask, 0);
    const ready = C + (releaseAt === 17 ? 28 : 23);
    state = at(state, ready).state;
    assert.equal(sampleSystemHomeFolderClose(state).selectionReadyAtUpdate, ready);
    assert.deepEqual(sampleSystemHomeFolderClose(state).controller.identity, identity);
  }
});

test('close viewport admits native press/repeat markers without losing session ownership or inventing replay', () => {
  for (const event of ['press', 'repeat']) {
    let state = reduceSystem(folder(0), 'back', T);
    const identity = sampleSystemHomeFolderClose(state).controller.identity;
    if (event === 'repeat') state = button(state, 'right', 'down');
    state = at(state, 17).state;
    assert.equal(nav(state).mode3.pendingMask, 0, 'mode44 rejects presses and held input');
    state = at(state, 18).state;
    assert.equal(sampleSystemHomeFolderClose(state).controller.phase, 'viewport');
    assert.equal(nav(state).mode3.directionMask, 0, 'restoration has no initiating horizontal key');
    if (event === 'press') state = button(state, 'right', 'down');
    state = at(state, event === 'press' ? 19 : 21).state;
    assert.equal(nav(state).mode3.pendingMask, 0x10, event);
    assert.equal(controls(state).producer.repeatCounter, event === 'press' ? 0 : 20);
    assert.deepEqual(sampleSystemHomeFolderClose(state).controller.identity, identity);
    assert.equal(state.system.homeFolderClose.navigation, nav(state));
    const result = at(state, 28); state = result.state;
    assert.equal(sampleSystemHomeFolderClose(state).selectionReadyAtUpdate, 28);
    assert.equal(state.selected, 40, 'pending alone cannot replay without an initiating marker');
    assert.equal(nav(state).mode3.pendingMask, 0x10, 'unserviced source marker survives completion');
    assert.equal(result.passes.flatMap(pass => pass.observations).some(o => o.observation.kind === 'cursor-select'), false);
    state = at(button(state, 'right', 'up'), 29).state;
    assert.equal(nav(state).mode3.pendingMask, 0, 'event7 clears the unserviced marker');
  }
});

test('close input bridge rejects true-closing4/6 and stale identities while accepting owned viewport4/6', () => {
  const closing = reduceSystem(folder(0), 'back', T), viewport = at(closing, 18).state;
  const identity = sampleSystemHomeFolderClose(closing).controller.identity;
  for (const type of [4, 6]) {
    const event = { type, mask: 0x20 };
    const blocked = consumeSystemHomeFolderCloseInput(closing, identity, event);
    assert.equal(blocked.disposition, 'unsupported');
    assert.equal(blocked.state, closing);
    for (const stale of [{ ...identity, transitionId: identity.transitionId + 1 }, { ...identity, generation: 'stale' }]) {
      const rejected = consumeSystemHomeFolderCloseInput(viewport, stale, event);
      assert.equal(rejected.disposition, 'unsupported');
      assert.equal(rejected.state, viewport);
    }
    const accepted = consumeSystemHomeFolderCloseInput(viewport, identity, event);
    assert.equal(accepted.disposition, 'handled');
    assert.equal(nav(accepted.state).mode3.pendingMask, 0x20);
    assert.deepEqual(sampleSystemHomeFolderClose(accepted.state).controller.identity, identity);
    const replaced = writeHomeNavigation(viewport, { ...nav(viewport) });
    assert.equal(sampleSystemHomeFolderClose(replaced), null);
    assert.equal(consumeSystemHomeFolderCloseInput(replaced, identity, event).state, replaced);
  }
});

test('overlays and sleep cancel native holds and resume without elapsed-time catchup', () => {
  const routes = [
    { name: 'preferences', stop: s => reduceSystem(s, 'preferences', now(s)), resume: (s, t) => reduceSystem(s, 'back', t) },
    { name: 'settings', stop: s => reduceSystem(s, 'settings', now(s)), resume: (s, t) => reduceSystem(s, 'back', t) },
    { name: 'power', stop: s => reduceSystem(s, 'power', now(s)), resume: (s, t) => reduceSystem(s, 'back', t) },
    { name: 'sleep', stop: s => setSystemSleeping(s, true, now(s)), resume: (s, t) => setSystemSleeping(s, false, t) },
  ];
  for (const route of routes) {
    let state = at(button(home(0, 2), 'right', 'down'), 70).state;
    assert.equal(state.system.homeCursorLoop.step, 3);
    state = route.stop(state);
    assert.deepEqual(controls(state).input.sources, {}, route.name);
    assert.equal(controls(state).producer.repeatCandidate, 0, route.name);
    assert.equal(state.system.homeCursorLoop.step, 1, route.name);
    assert.equal(nav(state).mode3.entryCount, 0, route.name);
    const before = logical(state), paused = tickHomeNavigationClockObserved(state, T + 60000);
    assert.deepEqual(paused.passes, []);
    assert.deepEqual(logical(paused.state), before, route.name);
    state = route.resume(paused.state, T + 60000);
    const resumed = tickHomeNavigationClockObserved(state, T + 120000);
    assert.deepEqual(resumed.passes, [], `${route.name}: first active call rebases`);
    const selected = resumed.state.selected;
    const tail = tickHomeNavigationClockObserved(resumed.state, T + 120000 + 30 * FRAME);
    assert.equal(tail.passes.length, 30);
    assert.equal(tail.state.selected, selected, `${route.name}: held input was cancelled`);
  }
});

test('blur cancellation cannot resurrect acceleration from a gesture origin', () => {
  let state = at(button(home(0, 2), 'right', 'down'), 70).state;
  assert.equal(nav(state).mode3.entryCount, 5);
  const point = center(state);
  state = touch(state, 'down', Math.max(21, Math.min(299, point.x)), point.y);
  assert.equal(nav(state).gesture.origin.navigation.mode3.entryCount, 5);
  state = at(state, 71).state;
  assert.equal(nav(state).mode3.entryCount, 0, 'touch producer emits event7');
  state = releaseSystemInputs(state, now(state));
  assert.equal(nav(state).gesture, null);
  assert.equal(nav(state).mode3.entryCount, 0, 'restoring origin precedes cancellation');
  assert.equal(nav(state).mode3.pendingMask, 0);
  assert.equal(state.system.homeCursorLoop.step, 1);
  assert.equal(state.system.input.touch, null);
  assert.deepEqual(controls(state).input.sources, {});
  assert.equal(state.system.homeClock.lastNow, null);
  assert.deepEqual(tickHomeNavigationClockObserved(state, T + 60000).passes, []);
});

test('chrome and ordinary grid contact preserve primary visibility and Loop', () => {
  for (const [x, y, area] of [[307, 16, 'chrome'], [76, 161, 'grid']]) {
    let state = home(), loop = state.system.homeCursorLoop;
    state = touch(state, 'down', x, y);
    state = at(state, 1).state;
    assert.equal(nav(state).gesture.area, area);
    assert.equal(controls(state).primary.layoutVisible, true);
    assert.equal(state.system.homeCursorLoop.currentFrame, loop.currentFrame + 1);
    state = touch(state, 'cancel', x, y);
    state = at(state, 2).state;
    assert.equal(nav(state).gesture, null);
    assert.equal(controls(state).primary.layoutVisible, true);
  }
});

test('reduced motion preserves native logical counts, including zero-update calls during mode3', () => {
  const initial = button(home(0, 2), 'right', 'down');
  const ordinary = at(initial, 76), reduced = at(initial, 76, true);
  assert.deepEqual(reduced.passes.map(journal), ordinary.passes.map(journal));
  assert.deepEqual(logical(reduced.state), logical(ordinary.state));
  assert.equal(nav(reduced.state).motion.mode, 3);
  for (const time of [now(reduced.state), now(reduced.state) + 1]) {
    const result = tickHomeNavigationClockObserved(reduced.state, time, true);
    assert.deepEqual(result.passes, []);
    assert.deepEqual(logical(result.state), logical(reduced.state), 'zero updates cannot enter legacy reduced-motion settle');
  }
  for (const counter of [0, 5]) {
    const closed = reduceSystem(folder(counter), 'back', T);
    assert.deepEqual(at(closed, 28, true).passes.map(journal), at(closed, 28).passes.map(journal));
  }
});

test('persistence includes mature views and excludes all native input/cursor controllers', () => {
  const state = at(button(home(0, 2), 'right', 'down'), 70).state;
  const raw = saveSettings(state), saved = JSON.parse(raw);
  for (const field of ['homeControls', 'homeCursorLoop', 'homeClock', 'homeFolderClose', 'producer', 'presentation', 'input', 'mode3', 'motion']) {
    assert.equal(new RegExp(`"${field}"\\s*:`).test(raw), false, field);
  }
  const restored = restoreSettings(booted(), raw);
  assert.deepEqual(JSON.parse(saveSettings(restored)).homeView, saved.homeView);
  assert.equal(controls(restored), null);
  const enabled = enableHomeControls(restored);
  assert.deepEqual(controls(enabled).input.sources, {});
  assert.equal(controls(enabled).producer.repeatCandidate, 0);
  assert.deepEqual(controls(enabled).primary.center, center(enabled));
  assert.equal(controls(enabled).presentation.effects.some(effect => effect.visible), false);
});

test('fallback System keeps immediate legacy input and emits no native journals', () => {
  const state = button(booted(), 'right', 'down');
  assert.equal(controls(state), null);
  assert.equal(state.selected, 2);
  assert.ok(Object.hasOwn(state.system.input.held, 'model:dpad'));
  assert.deepEqual(at(state, 1).passes, []);
});
