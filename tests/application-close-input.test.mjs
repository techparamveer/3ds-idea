import assert from 'node:assert/strict';
import test from 'node:test';
import { applicationCloseAllowsInput, applicationCloseNeedsReadyScreen } from '../src/scene/application-close-input.ts';
import { createPortfolioState, tickSystem, reduceSystem, launchHomeShortcut } from '../src/os/system.ts';

test('scene input quarantine survives the pre-mutation retirement update', () => {
  let state = tickSystem(createPortfolioState(), 3001);
  state = tickSystem(launchHomeShortcut(state, 'work', 4000), 6200);
  state = reduceSystem(state, 'home', 6300);
  state = reduceSystem(state, 'back', 6400);
  state = reduceSystem(state, 'open', 6500);
  state = tickSystem(state, 6500);
  state = tickSystem(state, 7500);
  assert.equal(state.system.homeApplicationTransition.phase, 'terminal');
  state = tickSystem(state, 8500);
  assert.equal(state.system.homeApplicationTransition.phase, 'exiting');
  state = tickSystem(state, 9500);
  assert.equal(state.system.homeApplicationTransition.phase, 'exit-terminal');
  const before = state, now = state.system.homeClock.lastNow + 1000 / 60;
  for (const input of ['open', 'home', 'right', 'touch', 'analog', 'back', 'x']) {
    const allowed = applicationCloseAllowsInput(before.system.homeApplicationTransition, input);
    let after = tickSystem(before, now);
    assert.equal(after.system.homeApplicationTransition, null);
    if (allowed) after = reduceSystem(after, input, now);
    assert.equal(allowed, false);
    assert.equal(after.system.runtime.application, null);
    assert.equal(after.system.phase, 'home');
    assert.equal(after.selected, before.selected);
  }
});

test('quarantine keeps clock, sleep, release and global controls available', () => {
  const terminal = { phase: 'terminal', intent: { kind: 'close' } };
  for (const input of ['tick', 'hinge', 'blur', 'visibility', 'power', 'mute', 'volume-up', 'volume-down']) {
    assert.equal(applicationCloseAllowsInput(terminal, input), true, input);
  }
  assert.equal(applicationCloseAllowsInput(null, 'open'), true);
});

test('unavailable close paint freezes ticks while admitting only native recovery controls', () => {
  const close = { phase: 'exiting', intent: { kind: 'close' } };
  const switching = { phase: 'terminal', intent: { kind: 'switch', appId: 'about' } };
  for (const status of ['loading', 'error']) {
    assert.equal(applicationCloseNeedsReadyScreen(close, status), true, status);
    assert.equal(applicationCloseAllowsInput(close, 'tick', status), false, status);
    assert.equal(applicationCloseAllowsInput(close, 'back', status), true, status);
    assert.equal(applicationCloseAllowsInput(close, 'home', status), true, status);
    assert.equal(applicationCloseAllowsInput(close, 'right', status), false, status);
  }
  assert.equal(applicationCloseAllowsInput(close, 'open', 'loading'), false);
  assert.equal(applicationCloseAllowsInput(close, 'touch', 'loading'), false);
  assert.equal(applicationCloseAllowsInput(close, 'open', 'error'), false);
  assert.equal(applicationCloseAllowsInput(close, 'touch', 'error'), false);
  assert.equal(applicationCloseNeedsReadyScreen(close, 'ready'), false);
  assert.equal(applicationCloseNeedsReadyScreen(switching, 'error'), false);
  assert.equal(applicationCloseAllowsInput(switching, 'tick', 'error'), true);
  assert.equal(applicationCloseAllowsInput(switching, 'back', 'error'), false);
});
