import test from 'node:test';
import assert from 'node:assert/strict';
import { createNotesIntroClock, stepNotesIntroClock, NOTES_INTRO_UPDATE_MS } from '../src/os/notes-intro-clock.ts';

test('owner-bound remainder clock matches the provisional 60 Hz HOME policy', () => {
  let clock = createNotesIntroClock(), step = stepNotesIntroClock(clock, 1000, true);
  clock = step.clock; assert.equal(step.updates, 0);
  step = stepNotesIntroClock(clock, 1008, true); clock = step.clock; assert.equal(step.updates, 0);
  step = stepNotesIntroClock(clock, 1017, true); clock = step.clock; assert.equal(step.updates, 1);
  step = stepNotesIntroClock(clock, 1250, true); clock = step.clock; assert.equal(step.updates, 14); assert.equal(clock.updateCount, 15);
  step = stepNotesIntroClock(clock, 2000, false); clock = step.clock; assert.equal(step.updates, 0);
  step = stepNotesIntroClock(clock, 200000, true); clock = step.clock; assert.equal(step.updates, 0); assert.equal(clock.updateCount, 15);
  step = stepNotesIntroClock(clock, 199000, true); assert.equal(step.updates, 0); assert.equal(step.clock.remainderMs, 0);
  assert.equal(NOTES_INTRO_UPDATE_MS, 1000 / 60);
});

test('inactive samples drop lastNow so late metadata cannot consume queued host time', () => {
  let clock = createNotesIntroClock();
  let step = stepNotesIntroClock(clock, 0, false); clock = step.clock; assert.equal(step.updates, 0);
  step = stepNotesIntroClock(clock, 5000, false); clock = step.clock; assert.equal(step.updates, 0); assert.equal(clock.lastNow, null);
  step = stepNotesIntroClock(clock, 5000, true); clock = step.clock; assert.equal(step.updates, 0); assert.equal(clock.lastNow, 5000);
  step = stepNotesIntroClock(clock, 5000 + 1000 / 60, true);
  assert.equal(step.updates, 1);
});

test('same now and non-finite now are not a step source', () => {
  let clock = createNotesIntroClock();
  clock = stepNotesIntroClock(clock, 10, true).clock;
  assert.equal(stepNotesIntroClock(clock, 10, true).updates, 0);
  assert.equal(stepNotesIntroClock(clock, Number.NaN, true).updates, 0);
  assert.equal(stepNotesIntroClock(clock, Infinity, true).updates, 0);
});
