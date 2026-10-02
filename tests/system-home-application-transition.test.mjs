import test from 'node:test';
import assert from 'node:assert/strict';

import { homeApplicationTransitionPresentation } from '../src/os/home-application-transition.ts';
import { selectHomeLocation } from '../src/os/home-layout.ts';
import {
  createPortfolioState,
  dispatchSystemEvent,
  launchHomeShortcut,
  reduceSystem,
  releaseSystemInputs,
  sampleSystemHomeApplicationTransition,
  tickHomeNavigationClockObserved,
  tickSystem,
  touchSystem,
} from '../src/os/system.ts';

const FRAME = 1000 / 60;
const bootHome = () => tickSystem(createPortfolioState(), 3001);
const suspended = (appId = 'work') => reduceSystem(tickSystem(launchHomeShortcut(bootHome(), appId, 4000), 6200), 'home', 6300);

function confirmClose(state, now = 6500) {
  state = reduceSystem(state, 'back', now - 100);
  assert.equal(state.system.dialog, 'close');
  state = reduceSystem(state, 'open', now);
  assert.equal(state.system.dialog, null);
  assert.ok(sampleSystemHomeApplicationTransition(state));
  return state;
}

function confirmSwitch(state, target = 'about', now = 6500) {
  state = launchHomeShortcut(state, target, now - 100);
  assert.equal(state.system.dialog, 'switch');
  assert.equal(state.system.pending, target);
  state = reduceSystem(state, 'open', now);
  assert.equal(state.system.dialog, null);
  assert.equal(state.system.pending, null);
  assert.deepEqual(sampleSystemHomeApplicationTransition(state)?.intent, { kind: 'switch', appId: target });
  return state;
}

function terminal(state, now = 6500) {
  state = tickSystem(state, now);
  const startCount = state.system.homeClock.updateCount;
  state = tickSystem(state, now + 40 * FRAME);
  assert.equal(sampleSystemHomeApplicationTransition(state)?.phase, 'terminal');
  assert.equal(state.system.homeClock.updateCount, startCount + 20, 'outer batch stops at the terminal frame');
  return state;
}

function commitTerminal(state, now = 6500) {
  state = terminal(state, now);
  const sameTimestamp = tickSystem(state, state.system.homeClock.lastNow);
  assert.equal(sampleSystemHomeApplicationTransition(sameTimestamp)?.phase, 'terminal', 'nested same-time tick cannot commit');
  return tickSystem(sameTimestamp, state.system.homeClock.lastNow + FRAME);
}

test('confirmed close retains owner and capture eligibility through a paintable terminal frame', () => {
  let state = confirmClose(suspended());
  const owner = state.system.runtime.application;
  const transition = sampleSystemHomeApplicationTransition(state);
  assert.ok(owner);
  assert.equal(transition.identity.owner, owner);
  assert.equal(transition.identity.transitionId, 1);
  assert.equal(state.system.homeFolderClose.nextTransitionId, 2, 'one shared monotonic HOME allocator owns begin');

  state = terminal(state);
  assert.equal(state.system.runtime.application, owner);
  assert.equal(state.system.runtime.homeReturn, owner);
  assert.equal(state.system.runtime.instances[owner].suspended, true);

  state = tickSystem(state, state.system.homeClock.lastNow + FRAME);
  assert.equal(state.system.homeApplicationTransition, null);
  assert.equal(state.system.runtime.application, null);
  assert.equal(state.system.app, null);
});

test('confirmed switch freezes its target and launches only after retiring the terminal owner', () => {
  let state = confirmSwitch(suspended(), 'about');
  const oldOwner = state.system.runtime.application;
  state = { ...state, selected: 11, system: { ...state.system, pending: 'camera' } };
  state = commitTerminal(state);
  const owner = state.system.runtime.application;
  assert.equal(state.system.phase, 'launch');
  assert.equal(state.system.app, 'about');
  assert.notEqual(owner, oldOwner);
  assert.equal(state.system.runtime.instances[oldOwner], undefined);
  assert.equal(state.system.runtime.instances[owner].appId, 'about');
  assert.equal(state.system.pending, null);
});

test('ordinary command, touch, analog and direct launch input are quarantined during close', () => {
  const state = confirmClose(suspended()), now = 6500;
  const owner = state.system.runtime.application, selected = state.selected;
  for (const next of [
    reduceSystem(state, 'home', now),
    reduceSystem(state, 'right', now),
    touchSystem(state, 250, 120, now),
    dispatchSystemEvent(state, { type: 'analog', x: 1, y: 0 }, now),
    launchHomeShortcut(state, 'about', now),
  ]) {
    assert.equal(next.system.runtime.application, owner);
    assert.equal(next.selected, selected);
    assert.equal(sampleSystemHomeApplicationTransition(next)?.identity.owner, owner);
  }
});

test('allowed global buttons activate on accepted down and consume release without double toggling', () => {
  let state = confirmClose(suspended()), now = 6500;
  state = dispatchSystemEvent(state, { type: 'button', source: 'physical:mute', phase: 'down', command: 'mute' }, now);
  assert.equal(state.system.muted, true);
  assert.equal(sampleSystemHomeApplicationTransition(state)?.phase, 'closing');
  state = dispatchSystemEvent(state, { type: 'button', source: 'physical:mute', phase: 'up', command: 'mute' }, now + 1);
  assert.equal(state.system.muted, true);
  assert.equal(state.system.input.held['physical:mute'], undefined);
});

test('late owner replacement cancels stale close without touching the replacement', () => {
  const state = confirmClose(suspended()), old = state.system.runtime.application, replacement = 'work:999';
  const instance = { ...state.system.runtime.instances[old], id: replacement };
  const replaced = { ...state, system: { ...state.system, runtime: { ...state.system.runtime,
    instances: { [replacement]: instance }, application: replacement, homeReturn: replacement } } };
  const next = tickSystem(replaced, 7000);
  assert.equal(next.system.homeApplicationTransition, null);
  assert.equal(next.system.runtime.application, replacement);
  assert.equal(next.system.runtime.instances[replacement], instance);
});

test('hidden-clock release preserves close progress without replaying hidden elapsed time', () => {
  let state = confirmClose(suspended());
  state = tickSystem(state, 6500);
  state = tickSystem(state, 6500 + 5 * FRAME);
  assert.equal(sampleSystemHomeApplicationTransition(state)?.appQuitFrame, 5);
  state = releaseSystemInputs(state, 6500 + 5 * FRAME);
  assert.equal(state.system.homeClock.lastNow, null);
  state = tickSystem(state, 90000);
  assert.equal(sampleSystemHomeApplicationTransition(state)?.appQuitFrame, 5);
  state = tickSystem(state, 90000 + FRAME);
  assert.equal(sampleSystemHomeApplicationTransition(state)?.appQuitFrame, 6);
});

test('reduced presentation samples the endpoint without skipping logical owner retention', () => {
  let state = confirmClose(suspended()), transition = sampleSystemHomeApplicationTransition(state);
  assert.equal(transition.appQuitFrame, 0);
  assert.equal(homeApplicationTransitionPresentation(transition, true).material[1].frame, 20);
  state = tickSystem(state, 6500, true);
  state = tickSystem(state, 6500 + 40 * FRAME, true);
  transition = sampleSystemHomeApplicationTransition(state);
  assert.equal(transition.phase, 'terminal');
  assert.ok(state.system.runtime.application);
});

test('switch confirmation from an opened folder starts the same retained-owner transition', () => {
  let state = suspended();
  const layout = { ...state.system.layout };
  delete layout[0];
  state = { ...state, folders: { 0: 'Folder' }, system: { ...state.system, layout,
    folderLayouts: { ...state.system.folderLayouts, 0: { 0: 'about' } } } };
  state = selectHomeLocation(state, { folder: 0, slot: 0 });
  assert.equal(state.opened, true);
  state = reduceSystem(state, 'open', 6400);
  assert.equal(state.system.dialog, 'switch');
  state = reduceSystem(state, 'open', 6500);
  assert.deepEqual(sampleSystemHomeApplicationTransition(state)?.intent, { kind: 'switch', appId: 'about' });
});

test('clock observer and nested tick at one timestamp cannot cross the terminal barrier', () => {
  let state = confirmClose(suspended());
  state = tickSystem(state, 6500);
  const observed = tickHomeNavigationClockObserved(state, 6500 + 40 * FRAME);
  assert.equal(sampleSystemHomeApplicationTransition(observed.state)?.phase, 'terminal');
  assert.equal(observed.passes.length, 0);
  const nested = tickSystem(observed.state, 6500 + 40 * FRAME);
  assert.equal(sampleSystemHomeApplicationTransition(nested)?.phase, 'terminal');
  assert.ok(nested.system.runtime.application);
});
