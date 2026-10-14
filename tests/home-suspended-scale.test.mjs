import test from 'node:test';
import assert from 'node:assert/strict';
import { createHomeSuspendedScale, enterHomeSuspendedScale, requestHomeSuspendedScale,
  stepHomeSuspendedScale, applyHomeSuspendedScalePass } from '../src/os/home-suspended-scale.ts';
import { createPortfolioState, tickSystem, launchHomeShortcut, reduceSystem, dispatchSystemEvent,
  tickHomeNavigationClockObserved, releaseSystemInputs, setSystemSleeping, launch } from '../src/os/system.ts';
import { enableHomeControls } from '../src/os/home-controls.ts';
import { sampleHomeGrid, selectHomeSlot } from '../src/os/home-navigation.ts';

function home() {
  let state = enableHomeControls(tickSystem(createPortfolioState(), 3001));
  state = launchHomeShortcut(state, 'health-safety', 3010);
  state = tickSystem(state, 6500);
  state = reduceSystem(state, 'home', 7100);
  return tickHomeNavigationClockObserved(state, 7101).state;
}
const button = (state, command, phase, now) => dispatchSystemEvent(state,
  { type: 'button', command, phase, source: 'keyboard:' + command }, now);
const frame = state => state.system.homeSuspendedScale.current;
function away() {
  let state = button(home(), 'right', 'down', 7102);
  state = tickHomeNavigationClockObserved(state, 7136).state;
  state = button(state, 'right', 'up', 7136);
  return tickHomeNavigationClockObserved(state, 7700).state;
}

test('source scale spends admitted upper calls, preserves reversals, and rejects duplicate/backward updates', () => {
  let scale = enterHomeSuspendedScale(createHomeSuspendedScale(), 'health:1', 15);
  scale = requestHomeSuspendedScale(scale, 0);
  const epoch = scale.epoch;
  for (let update = 1; update <= 4; update++) {
    scale = stepHomeSuspendedScale(scale, update);
    assert.equal(scale.current, 15 - update);
    assert.equal(scale.epoch, epoch);
    assert.equal(stepHomeSuspendedScale(scale, update), scale);
    assert.equal(stepHomeSuspendedScale(scale, update - 1), scale);
  }
  assert.equal(stepHomeSuspendedScale(scale, 99, false), scale);
  scale = requestHomeSuspendedScale(scale, 15);
  assert.equal(scale.current, 11); assert.equal(scale.epoch, epoch + 1);
  assert.equal(requestHomeSuspendedScale(scale, 15), scale);
  for (let update = 5; update <= 10; update++) scale = stepHomeSuspendedScale(scale, update);
  assert.equal(scale.current, 15);
  scale = requestHomeSuspendedScale(scale, 0);
  for (let update = 11; update <= 30; update++) scale = stepHomeSuspendedScale(scale, update);
  assert.equal(scale.current, 0);
  for (const invalid of [-1, .5, NaN, Infinity]) assert.throws(() => stepHomeSuspendedScale(scale, invalid), RangeError);
});

test('mode entry initializes once, exit preserves the Resume epoch, and re-entry/replacement retires it', () => {
  let scale = enterHomeSuspendedScale(createHomeSuspendedScale(), 'health:1', 15);
  scale = stepHomeSuspendedScale(requestHomeSuspendedScale(scale, 0), 1);
  assert.equal(enterHomeSuspendedScale(scale, 'health:1', 15), scale);
  const exited = enterHomeSuspendedScale(scale, null, 0);
  assert.equal(exited.kind, 'inactive'); assert.equal(exited.epoch, scale.epoch);
  const returned = enterHomeSuspendedScale(exited, 'health:1', 0);
  assert.equal(returned.current, 0); assert.equal(returned.epoch, scale.epoch + 1);
  const replaced = enterHomeSuspendedScale(returned, 'camera:2', 15);
  assert.equal(replaced.current, 15); assert.equal(replaced.epoch, returned.epoch + 1);
});

test('input resolver targets precede upper work, lower targets follow it, and handoff has no upper call', () => {
  const state = home(), health = state.selected, other = health + 1;
  const observation = slot => ({ kind: 'banner-resolve', phase: 'lower', reason: 'idle-entry',
    context: null, slot, focus: -1, toolbarActive: false, updateOffset: 0, updateCount: 1 });
  const pass = (current, updateCount, observations, completed = true) => ({ state: current, updateCount, observations,
    completed, handoff: completed ? null : 'application', unsupportedInput: false, sounds: [] });
  let next = applyHomeSuspendedScalePass(pass(state, 1, [{ phase: 'lower', observation: observation(other) }])).state;
  assert.equal(frame(next), 15); assert.equal(next.system.homeSuspendedScale.target, 0);
  next = applyHomeSuspendedScalePass(pass(next, 2, [])).state;
  assert.equal(frame(next), 14);
  next = selectHomeSlot(next, other);
  next = applyHomeSuspendedScalePass(pass(next, 3, [{ phase: 'input', observation: observation(health) }])).state;
  assert.equal(frame(next), 15);
  const duplicate = applyHomeSuspendedScalePass(pass(next, 3, [{ phase: 'input', observation: observation(other) }]));
  assert.equal(duplicate.state, next, 'duplicate journals cannot replay target changes');
  const stopped = applyHomeSuspendedScalePass(pass(next, 4, [{ phase: 'input', observation: observation(other) }], false)).state;
  assert.equal(frame(stopped), 15); assert.equal(stopped.system.homeSuspendedScale.target, 0);
  assert.equal(stopped.system.homeSuspendedScale.lastUpperUpdate, 3);
});

test('public controls batch and individual passes agree across lower resolution and reversal without rendering', () => {
  const initial = home(), health = initial.selected;
  let state = button(initial, 'right', 'down', 7102);
  state = tickHomeNavigationClockObserved(state, 7136).state;
  state = button(state, 'right', 'up', 7136);
  const batch = tickHomeNavigationClockObserved(state, 7442);
  let individual = state;
  for (let now = 7153; now <= 7442; now += 17) individual = tickHomeNavigationClockObserved(individual, now).state;
  assert.deepEqual(batch.state.system.homeSuspendedScale, individual.system.homeSuspendedScale);
  const resolver = batch.passes.find(pass => pass.observations.some(entry => entry.observation.kind === 'banner-resolve'));
  assert.equal(resolver.state.system.homeSuspendedScale.current, 15);
  assert.equal(resolver.state.system.homeSuspendedScale.target, 0);
  assert.ok(frame(batch.state) < 15);
  assert.equal(batch.passes.at(-1).state.system.homeSuspendedScale, batch.state.system.homeSuspendedScale);
  assert.equal(tickHomeNavigationClockObserved(batch.state, 7442).state.system.homeSuspendedScale, batch.state.system.homeSuspendedScale);
  const grid = sampleHomeGrid(individual.system.homeNavigation), point = grid.slots[health];
  individual = dispatchSystemEvent(individual, { type: 'touch', phase: 'down', x: point.x - grid.scrollPixels, y: point.y, pointerId: 9 }, 7443);
  individual = tickHomeNavigationClockObserved(individual, 7477).state;
  individual = dispatchSystemEvent(individual, { type: 'touch', phase: 'up', x: point.x - grid.scrollPixels, y: point.y, pointerId: 9 }, 7477);
  const back = tickHomeNavigationClockObserved(individual, 7783);
  let split = individual;
  for (let now = 7494; now <= 7783; now += 17) split = tickHomeNavigationClockObserved(split, now).state;
  assert.deepEqual(back.state.system.homeSuspendedScale, split.system.homeSuspendedScale);
  assert.equal(back.state.system.homeSuspendedScale.target, 15);
  assert.equal(frame(back.state), 14);
  assert.equal(frame(tickHomeNavigationClockObserved(back.state, 7800).state), 15);
});

test('sleep and hidden-host rebasing preserve owner/target and never spend suspended wall time', () => {
  let state = button(home(), 'right', 'down', 7102);
  state = tickHomeNavigationClockObserved(state, 7136).state;
  state = button(state, 'right', 'up', 7136);
  state = tickHomeNavigationClockObserved(state, 7323).state;
  const before = state.system.homeSuspendedScale;
  assert.ok(before.current > 0 && before.current < 15);
  state = setSystemSleeping(state, true, 7323);
  state = tickSystem(state, 20000);
  assert.equal(state.system.homeSuspendedScale, before);
  state = setSystemSleeping(state, false, 20001);
  state = tickSystem(state, 30000);
  assert.equal(state.system.homeSuspendedScale, before, 'first wake tick only rebases');
  state = tickSystem(state, 30017);
  assert.equal(frame(state), before.current - 1);
  const hidden = releaseSystemInputs(state, 30017), frozen = hidden.system.homeSuspendedScale;
  state = tickSystem(hidden, 90000);
  assert.equal(state.system.homeSuspendedScale, frozen, 'scene hidden handling releases/rebases instead of ticking');
  state = tickSystem(state, 90017);
  assert.equal(frame(state), frozen.current - 1);
});

test('reduced-motion logical pass settles mid-scale without a render-side write', () => {
  let state = away();
  state = button(state, 'left', 'down', 7701);
  state = tickHomeNavigationClockObserved(state, 7735).state;
  state = button(state, 'left', 'up', 7735);
  state = tickHomeNavigationClockObserved(state, 7922).state;
  assert.ok(frame(state) > 0 && frame(state) < 15);
  const epoch = state.system.homeSuspendedScale.epoch;
  state = tickHomeNavigationClockObserved(state, 7939, true).state;
  assert.equal(frame(state), 15); assert.equal(state.system.homeSuspendedScale.epoch, epoch);
});

test('the existing switch-presentation host bridge admits upper work while HOME controls are disabled', () => {
  let state = button(home(), 'right', 'down', 7102);
  state = tickHomeNavigationClockObserved(state, 7136).state;
  state = button(state, 'right', 'up', 7136);
  state = tickHomeNavigationClockObserved(state, 7323).state;
  const current = frame(state);
  state = launch(state, 'camera', 7323);
  assert.equal(state.system.dialog, 'switch');
  state = tickHomeNavigationClockObserved(state, 7324).state;
  assert.equal(frame(state), current);
  const next = tickHomeNavigationClockObserved(state, 7341);
  assert.equal(next.passes.length, 0, 'no input/lower task journal');
  assert.equal(frame(next.state), current - 1);
});

test('held pickup selection without a resolver does not retarget the suspended scale', () => {
  let state = home();
  const before = state.system.homeSuspendedScale, target = state.selected + 1;
  const grid = sampleHomeGrid(state.system.homeNavigation), point = grid.slots[target];
  state = dispatchSystemEvent(state, { type: 'touch', phase: 'down', x: point.x - grid.scrollPixels, y: point.y, pointerId: 12 }, 7102);
  const held = tickHomeNavigationClockObserved(state, 7470);
  state = held.state;
  const pickup = held.passes.find(pass => pass.state.system.homeControls.tilePickup);
  assert.ok(pickup); assert.deepEqual(pickup.observations, []);
  assert.equal(state.selected, target);
  assert.equal(state.system.homeNavigation.gesture.mode, 'drag');
  assert.equal(frame(state), 15); assert.equal(state.system.homeSuspendedScale.target, 15);
  assert.equal(state.system.homeSuspendedScale.epoch, before.epoch);
});

test('toolbar selection retains the logical owner while applet interruption retires its HOME mode', () => {
  let state = home();
  const before = state.system.homeSuspendedScale;
  const touch = (phase, now) => { state = dispatchSystemEvent(state, { type: 'touch', phase, x: 160, y: 16, pointerId: 13 }, now); };
  touch('down', 7102); touch('up', 7103);
  assert.equal(state.system.homeNavigation.focus.toolbarActive, true);
  assert.equal(state.system.homeSuspendedScale.owner, before.owner);
  assert.equal(state.system.homeSuspendedScale.current, 15);
  assert.equal(state.system.homeSuspendedScale.target, 15, 'toolbar touch still awaits its lower resolver');
  state = tickHomeNavigationClockObserved(state, 7120).state;
  assert.equal(frame(state), 15); assert.equal(state.system.homeSuspendedScale.target, 0);
  const epoch = state.system.homeSuspendedScale.epoch;
  state = tickHomeNavigationClockObserved(state, 7137).state;
  assert.equal(frame(state), 14); assert.equal(state.system.homeSuspendedScale.epoch, epoch);
  touch('down', 7138); touch('up', 7139);
  assert.equal(state.system.phase, 'app');
  assert.equal(state.system.runtime.instances[state.system.runtime.active].appId, 'notifications');
  assert.equal(state.system.homeSuspendedScale.kind, 'inactive');
  assert.equal(state.system.homeSuspendedScale.epoch, epoch);
  state = dispatchSystemEvent(state, { type: 'command', command: 'back' }, 7140);
  assert.equal(state.system.phase, 'home');
  assert.equal(state.system.homeSuspendedScale.kind, 'home');
  assert.equal(state.system.homeSuspendedScale.owner, before.owner);
  assert.ok(state.system.homeSuspendedScale.epoch > epoch);
  assert.equal(frame(state), 0, 'new HOME mode initializes from its current category');
});
