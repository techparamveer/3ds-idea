import test from 'node:test';
import assert from 'node:assert/strict';
import { createNativeScreenInputGate } from '../src/os/native-screen-input.ts';
import { releaseUnreadyNativeInput } from '../src/os/native-screen-system.ts';
import { enableHomeControls } from '../src/os/home-controls.ts';
import { selectHomeSlot, settleHomeNavigation } from '../src/os/home-navigation.ts';
import { createPortfolioState, tickSystem, tickHomeNavigationClockObserved, launch,
  reduceSystem, dispatchSystemEvent, setSystemSleeping, releaseSystemInputs } from '../src/os/system.ts';
import { createHomeInputAdapter } from '../src/os/home-input-adapter.ts';
import { readFileSync } from 'node:fs';

const T = 7000, F = 1000 / 60;
const right = (phase, source = 'key:ArrowRight') => ({ type: 'button', command: 'right', phase, source });
function suspendedHealth() {
  let state = settleHomeNavigation(selectHomeSlot(tickSystem(createPortfolioState(), 3001), 8));
  state = enableHomeControls(state);
  state = tickSystem(launch(state, 'health-safety', 3010), 6200);
  state = reduceSystem(state, 'home', T);
  return tickHomeNavigationClockObserved(state, T).state;
}
function sceneInput(state, gate, event, now, readiness) {
  state = tickHomeNavigationClockObserved(state, now).state;
  const status = typeof readiness === 'function' ? readiness(state) : readiness;
  if (status === 'loading' || status === 'error') gate.cancelHeld(state.system.input, state.system.homeControls?.input);
  state = releaseUnreadyNativeInput(state, status, now);
  return gate(event, status) === 'pass' ? dispatchSystemEvent(state, event, now) : state;
}

for (const source of ['key:ArrowRight', 'pointer:DPAD_right']) for (const status of ['loading', 'error']) {
  test(`HOME ${source} release during ${status} cannot leave a native Right repeat behind`, () => {
    const gate = createNativeScreenInputGate();
    let state = sceneInput(suspendedHealth(), gate, right('down', source), T, 'ready');
    assert.deepEqual(state.system.input.held, {}, 'native HOME directions bypass the generic latch');
    state = sceneInput(state, gate, right('up', source), T + F,
      current => current.selected === 8 ? 'ready' : status);
    assert.equal(state.selected, 10, 'the pre-keyup native sample selected Camera');
    const owner = state.system.runtime.application;
    state = tickHomeNavigationClockObserved(state, T + 190 * F).state;
    assert.equal(state.selected, 10, 'a returned press cannot continue to empty slots');
    assert.deepEqual(state.system.homeControls.input.sources, {});
    assert.equal(state.system.homeControls.producer.repeatCandidate, 0);
    assert.equal(state.system.homeNavigation.mode3.pendingMask, 0);
    assert.equal(state.system.runtime.application, owner);
    assert.equal(state.system.runtime.instances[owner].suspended, true);
  });
}

test('ordinary ready HOME quick press keeps its one source pulse and receives native release', () => {
  const gate = createNativeScreenInputGate();
  let state = sceneInput(suspendedHealth(), gate, right('down'), T, 'ready');
  state = sceneInput(state, gate, right('up'), T, 'ready');
  state = tickHomeNavigationClockObserved(state, T + 190 * F).state;
  assert.equal(state.selected, 10);
  assert.deepEqual(state.system.homeControls.input.sources, {});
  assert.equal(state.system.homeControls.producer.repeatCandidate, 0);
});

test('the live scene quarantines both latch domains before releasing either owner', () => {
  const scene = readFileSync(new URL('../src/scene/console-scene.ts', import.meta.url), 'utf8');
  assert.match(scene, /nativeScreenInput\.cancelHeld\(state\.system!\.input,state\.system!\.homeControls\?\.input\);state=releaseUnreadyNativeInput/);
});

test('two HOME digital sources stay quarantined independently through recovery and repeated readiness', () => {
  const gate = createNativeScreenInputGate();
  let state = sceneInput(suspendedHealth(), gate, right('down'), T, 'ready');
  state = sceneInput(state, gate, right('down', 'pointer:right'), T, 'ready');
  state = sceneInput(state, gate, { type: 'command', command: 'open' }, T + F, 'loading');
  const cancelled = state;
  assert.deepEqual(state.system.homeControls.input.sources, {});
  assert.equal(releaseUnreadyNativeInput(state, 'loading', T + 2 * F), state);
  assert.equal(releaseUnreadyNativeInput(state, 'error', T + 2 * F), state);
  for (const source of ['key:ArrowRight', 'pointer:right']) {
    assert.equal(gate(right('repeat', source), 'ready'), 'block');
    assert.equal(gate(right('down', source), 'ready'), 'block');
  }
  assert.equal(gate(right('up'), 'ready'), 'block', 'resource recovery cannot activate on release');
  assert.equal(gate(right('down'), 'ready'), 'pass');
  assert.equal(gate(right('repeat', 'pointer:right'), 'ready'), 'block', 'the second device is still held');
  assert.equal(gate(right('up', 'pointer:right'), 'error'), 'block');
  assert.equal(gate(right('down', 'pointer:right'), 'ready'), 'pass');
  assert.equal(tickHomeNavigationClockObserved(cancelled, T + 190 * F).state.selected, 10);
});

test('an already released HOME quick pulse is discarded while loading without quarantining a fresh press', () => {
  const gate = createNativeScreenInputGate();
  let state = sceneInput(suspendedHealth(), gate, right('down'), T, 'ready');
  state = sceneInput(state, gate, right('up'), T, 'ready');
  assert.equal(state.system.homeControls.input.sources['key:ArrowRight'].pendingRelease, true);
  state = sceneInput(state, gate, { type: 'command', command: 'open' }, T, 'loading');
  assert.deepEqual(state.system.homeControls.input, createHomeInputAdapter());
  assert.equal(gate(right('down'), 'ready'), 'pass', 'its prior up already returned');
  assert.equal(tickHomeNavigationClockObserved(state, T + 190 * F).state.selected, 8);
});

test('sampled release history is cancelled even when both digital source records are empty', () => {
  const gate = createNativeScreenInputGate();
  let state = sceneInput(suspendedHealth(), gate, right('down'), T, 'ready');
  state = sceneInput(state, gate, right('up'), T + F, 'ready');
  assert.deepEqual(state.system.homeControls.input.sources, {});
  assert.equal(state.system.homeControls.input.sampler.previousDigitalHeld, 16);
  state = releaseUnreadyNativeInput(state, 'error', T + F);
  assert.deepEqual(state.system.homeControls.input, createHomeInputAdapter());
  assert.equal(state.system.homeControls.producer.repeatCandidate, 0);
  assert.equal(tickHomeNavigationClockObserved(state, T + 190 * F).state.selected, 10);
});

for (const status of ['loading', 'error']) test(`HOME primary axis neutral during ${status} releases its native held sample`, () => {
  const gate = createNativeScreenInputGate(), axis = (x, source = 'pointer:circle') => ({ type: 'analog', x, y: 0, source });
  let state = sceneInput(suspendedHealth(), gate, axis(1), T, 'ready');
  assert.deepEqual(state.system.input.analog, {});
  state = sceneInput(state, gate, { type: 'command', command: 'open' }, T + F, status);
  assert.equal(gate(axis(1), 'ready'), 'block');
  assert.equal(gate(axis(1, 'another-source'), 'ready'), 'block', 'HOME has a single primary axis');
  assert.equal(gate(axis(0), status), 'block');
  assert.equal(gate(axis(1), 'ready'), 'pass');
  assert.deepEqual(state.system.homeControls.input, createHomeInputAdapter());
  assert.equal(tickHomeNavigationClockObserved(state, T + 190 * F).state.selected, 10);
});

test('generic buttons and touch retain their existing release quarantine alongside HOME input', () => {
  const gate = createNativeScreenInputGate();
  let state = sceneInput(suspendedHealth(), gate, right('down'), T, 'ready');
  state = dispatchSystemEvent(state, { type: 'button', command: 'select', phase: 'down', source: 'key:Select' }, T);
  // Touch an empty region so this fixture does not activate a footer/widget.
  state = dispatchSystemEvent(state, { type: 'touch', phase: 'down', pointerId: 7, x: 319, y: 200 }, T);
  gate.cancelHeld(state.system.input, state.system.homeControls.input);
  state = releaseUnreadyNativeInput(state, 'loading', T);
  assert.deepEqual(state.system.input, { held: {}, analog: {}, touch: null });
  assert.deepEqual(state.system.homeControls.input, createHomeInputAdapter());
  assert.equal(gate({ type: 'button', command: 'select', phase: 'repeat', source: 'key:Select' }, 'ready'), 'block');
  assert.equal(gate({ type: 'button', command: 'select', phase: 'up', source: 'key:Select' }, 'ready'), 'block');
  assert.equal(gate({ type: 'touch', phase: 'up', pointerId: 7, x: 200, y: 190 }, 'error'), 'block');
  assert.equal(gate({ type: 'button', command: 'power', phase: 'down', source: 'key:KeyP' }, 'loading'), 'pass');
});

test('recovery Retry and sleep still cancel the same native HOME owner', () => {
  for (const cancel of [
    state => releaseSystemInputs(state, T + F),
    state => setSystemSleeping(state, true, T + F),
  ]) {
    const gate = createNativeScreenInputGate();
    const held = sceneInput(suspendedHealth(), gate, right('down'), T, 'ready');
    let state = cancel(held);
    assert.deepEqual(state.system.homeControls.input, createHomeInputAdapter());
    assert.equal(state.system.homeControls.producer.repeatCandidate, 0);
    state = tickSystem(state, T + 190 * F);
    assert.equal(state.selected, 8);
  }
  const gate = createNativeScreenInputGate();
  assert.equal(gate({ type: 'command', command: 'open' }, 'error'), 'retry');
});

test('unready input cancellation preserves an already-started software close and its retained owner', () => {
  const gate = createNativeScreenInputGate();
  let state = sceneInput(suspendedHealth(), gate, right('down'), T, 'ready');
  state = reduceSystem(state, 'x', T);
  const transition = state.system.homeApplicationTransition, owner = state.system.runtime.application;
  assert.ok(transition);
  gate.cancelHeld(state.system.input, state.system.homeControls.input);
  state = releaseUnreadyNativeInput(state, 'loading', T);
  assert.deepEqual(state.system.homeControls.input, createHomeInputAdapter());
  assert.equal(state.system.homeApplicationTransition, transition);
  assert.equal(state.system.runtime.application, owner);
  assert.equal(state.system.runtime.homeReturn, owner);
  assert.equal(gate(right('up'), 'ready'), 'block');
  state = tickSystem(state, T + 190 * F);
  assert.equal(state.selected, 8);
});
