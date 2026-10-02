import assert from 'node:assert/strict';
import test from 'node:test';
import { applicationCloseAllowsInput } from '../src/scene/application-close-input.ts';
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
  const terminal = { phase: 'terminal' };
  for (const input of ['tick', 'hinge', 'blur', 'visibility', 'power', 'mute', 'volume-up', 'volume-down']) {
    assert.equal(applicationCloseAllowsInput(terminal, input), true, input);
  }
  assert.equal(applicationCloseAllowsInput(null, 'open'), true);
});
