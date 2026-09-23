import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  beginHomeFolderClose, stepHomeFolderClose, advanceHomeFolderClose,
  cancelHomeFolderClose, sampleHomeFolderClose,
} from '../src/os/home-folder-close.ts';

const oracle = JSON.parse(readFileSync(new URL('../docs/evidence/native-folder-close-boundary.json', import.meta.url), 'utf8'));
const identity = { generation: 'system:1', transitionId: 1 };
const both = { taskEligible: true, layoutEligible: true };
const taskOnly = { taskEligible: true, layoutEligible: false };
const layoutOnly = { taskEligible: false, layoutEligible: true };
const blocked = { taskEligible: false, layoutEligible: false };
const begin = (restoration = { restoredSelectionVisible: true }, key = identity, current = null) =>
  beginHomeFolderClose(current, key, restoration);
const advance = (state, count, input = both) => advanceHomeFolderClose(state, state.identity, count, input);
const events = result => result.observations.map(({ kind, stepOffset }) => [kind, stepOffset]);
const nativeClip = value => ({ ...value, endReached: Boolean(value.endReached) });

function stepped(state, key, updates, input) {
  const observations = [];
  let processedSteps = 0;
  for (let i = 0; i < updates; i++) {
    const next = stepHomeFolderClose(state, key, input);
    state = next.state;
    if (!next.processedSteps) break;
    processedSteps++;
    observations.push(...next.observations.map(event => ({ ...event, stepOffset: i })));
  }
  return { state, observations, processedSteps };
}

test('begin starts reverse clocks without applying a frame and emits clear boundary once', () => {
  assert.equal(oracle.sourceSha256, '243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9');
  const started = begin();
  assert.equal(started.processedSteps, 0);
  assert.deepEqual(events(started), [['closeStarted', null]]);
  assert.deepEqual(started.observations[0].identity, identity);
  assert.equal(started.state.phase, 'closing');
  assert.deepEqual(started.state.folder, { ...nativeClip(oracle.initial.panel), appliedFrame: null });
  assert.deepEqual(started.state.capture, { ...nativeClip(oracle.initial.capture), appliedFrame: null });
  // Native start leaves the transform alone; fixture appliedFrame0 is zero-filled memory.
  assert.equal(started.state.viewportDuration, null);
  assert.equal(started.state.viewportUpdates, 0);
});

test('every folder and capture ARM clock row matches, including separate endpoint, stop and idle', () => {
  let state = begin().state;
  for (const row of oracle.predicateRows) {
    if (row.completedLayoutPasses > 0) state = stepHomeFolderClose(state, identity, layoutOnly).state;
    assert.deepEqual(state.folder, { ...nativeClip(row.panel), ...(row.completedLayoutPasses === 0 ? { appliedFrame: null } : {}) });
    assert.deepEqual(state.capture, { ...nativeClip(row.capture), ...(row.completedLayoutPasses === 0 ? { appliedFrame: null } : {}) });
    const observed = stepHomeFolderClose(state, identity, taskOnly);
    assert.equal(observed.observations.some(event => event.kind === 'rootRestored'), row.rootCommitReached,
      `native predicate after ${row.completedLayoutPasses} layout passes`);
    assert.equal(state.phase, 'closing', 'predicate probe does not mutate retained input');
  }
});

test('capture completion after10 does not restore root; frame0 and stopped2 still block it', () => {
  const start = begin().state;
  const captureIdle = advance(start, 10);
  assert.equal(captureIdle.state.capture.status, 0);
  assert.equal(captureIdle.state.folder.status, 1);
  assert.deepEqual(captureIdle.observations, []);
  const atZero = advance(start, 16);
  assert.deepEqual([atZero.state.folder.frame, atZero.state.folder.status, atZero.state.folder.appliedFrame], [0, 1, 1]);
  assert.deepEqual(atZero.observations, []);
  const stopped = stepHomeFolderClose(atZero.state, identity, both);
  assert.deepEqual([stopped.state.folder.status, stopped.state.folder.appliedFrame], [2, 0]);
  assert.deepEqual(stopped.observations, []);
  const idle = stepHomeFolderClose(stopped.state, identity, both);
  assert.equal(idle.state.folder.status, 0);
  assert.equal(idle.state.phase, 'closing');
  assert.deepEqual(idle.observations, []);
  const restored = stepHomeFolderClose(idle.state, identity, both);
  assert.deepEqual(events(restored), [['rootRestored', 0], ['rootSelectionReady', 0]]);
  assert.equal(restored.state.phase, 'complete');
  assert.equal(restored.state.folder, idle.state.folder, 'restoring task disables the later layout phase');
  assert.equal(restored.state.capture, idle.state.capture);
});

test('setup-inclusive timeline is setupN, layout18 atN+17, restore and ready atN+18', () => {
  const start = begin();
  const setupUpdate = stepHomeFolderClose(start.state, identity, both); // index N
  assert.deepEqual([setupUpdate.state.folder.appliedFrame, setupUpdate.state.folder.frame], [16, 15]);
  const middle = advance(setupUpdate.state, 17);
  assert.equal(middle.state.folder.status, 0);
  assert.deepEqual(middle.observations, []);
  const next = stepHomeFolderClose(middle.state, identity, both);
  assert.equal(next.state.phase, 'complete');
  const batched = advance(start.state, 100);
  assert.deepEqual(events(batched), [['rootRestored', 18], ['rootSelectionReady', 18]]);
  assert.equal(batched.processedSteps, 19, 'caller retains81 later shared updates to process');
  assert.deepEqual(batched.state, next.state);
});

test('layout inhibition matches both executed source gates and does not spend close advances', () => {
  for (const gate of oracle.layoutGates) {
    const initial = begin().state;
    const waiting = advance(initial, gate.attemptedPasses, taskOnly);
    assert.equal(waiting.state, initial);
    assert.deepEqual(waiting.observations, []);
    assert.equal(waiting.processedSteps, gate.attemptedPasses);
    assert.deepEqual({ ...waiting.state.folder, appliedFrame: 0 }, nativeClip(gate.blocked));
    const resumed = stepHomeFolderClose(waiting.state, identity, both);
    assert.deepEqual(resumed.state.folder, nativeClip(gate.afterOneEligiblePass));
  }
});

test('task inhibition lets layouts finish but defers restoration until an eligible task', () => {
  const idle = advance(begin().state, 18, layoutOnly);
  assert.equal(idle.state.folder.status, 0);
  assert.equal(idle.state.phase, 'closing');
  assert.deepEqual(idle.observations, []);
  const held = advance(idle.state, Number.MAX_SAFE_INTEGER, layoutOnly);
  assert.equal(held.state, idle.state);
  assert.equal(held.processedSteps, Number.MAX_SAFE_INTEGER);
  assert.deepEqual(held.observations, []);
  const restored = stepHomeFolderClose(held.state, identity, taskOnly);
  assert.deepEqual(events(restored), [['rootRestored', 0], ['rootSelectionReady', 0]]);
});

for (const duration of [...new Set(oracle.viewportAdjustment.map(row => row.requiredTaskUpdates))]) {
  test(`offscreen root preserves the executed ${duration}-task viewport boundary`, () => {
    const original = oracle.viewportAdjustment.find(row => row.requiredTaskUpdates === duration);
    const start = begin({ restoredSelectionVisible: false, viewportDuration: duration }).state;
    const restored = advance(start, 19);
    assert.deepEqual(events(restored), [['rootRestored', 18]]);
    assert.equal(restored.state.phase, 'viewport');
    assert.equal(restored.state.viewportUpdates, 0, 'restoration step spends no viewport update');
    const blockedTask = advance(restored.state, 20, layoutOnly);
    assert.equal(blockedTask.state, restored.state);
    assert.deepEqual(blockedTask.observations, []);
    let state = blockedTask.state;
    for (const [i, ready] of original.returns.entries()) {
      const result = stepHomeFolderClose(state, identity, taskOnly);
      assert.equal(result.state.viewportUpdates, i + 1);
      assert.equal(result.state.phase === 'complete', Boolean(ready));
      assert.deepEqual(events(result), ready ? [['rootSelectionReady', 0]] : []);
      assert.equal(result.state.folder, restored.state.folder);
      assert.equal(result.state.capture, restored.state.capture);
      state = result.state;
    }
    const batched = advance(start, 1000);
    assert.deepEqual(events(batched), [['rootRestored', 18], ['rootSelectionReady', 18 + duration]]);
    assert.equal(batched.processedSteps, 19 + duration);
    assert.deepEqual(batched.state, state);
  });
}

test('batch equals single steps for every eligibility pair, endpoint and viewport plan', () => {
  for (const restoration of [{ restoredSelectionVisible: true },
    { restoredSelectionVisible: false, viewportDuration: 5 }, { restoredSelectionVisible: false, viewportDuration: 10 }]) {
    for (const warmup of [0, 1, 10, 16, 17, 18, 19, 22, 29]) {
      const initial = advance(begin(restoration).state, warmup).state;
      for (const input of [both, taskOnly, layoutOnly, blocked]) {
        for (const updates of [0, 1, 2, 5, 10, 16, 17, 18, 19, 24, 29, 40]) {
          assert.deepEqual(advance(initial, updates, input), stepped(initial, identity, updates, input));
        }
      }
    }
  }
});

test('split batches preserve global event offsets across changing eligibility', () => {
  const segments = [[4, taskOnly], [10, layoutOnly], [3, blocked], [8, both], [1, taskOnly], [2, layoutOnly], [10, both]];
  let state = begin({ restoredSelectionVisible: false, viewportDuration: 10 }).state;
  let single = state, offset = 0;
  const batchEvents = [], singleEvents = [];
  for (const [updates, input] of segments) {
    const batch = advance(state, updates, input);
    batchEvents.push(...batch.observations.map(event => ({ ...event, stepOffset: event.stepOffset + offset })));
    for (let i = 0; i < updates; i++) {
      const result = stepHomeFolderClose(single, identity, input);
      singleEvents.push(...result.observations.map(event => ({ ...event, stepOffset: offset + i })));
      single = result.state;
    }
    state = batch.state;
    offset += updates;
  }
  assert.deepEqual(state, single);
  assert.deepEqual(batchEvents, singleEvents);
  assert.deepEqual(batchEvents.map(({ kind, stepOffset }) => [kind, stepOffset]), [['rootRestored', 25], ['rootSelectionReady', 37]]);
});

test('same-identity begin is idempotent throughout closing, viewport and completion', () => {
  const restoration = { restoredSelectionVisible: false, viewportDuration: 5 };
  const initial = begin(restoration).state;
  for (const updates of [0, 7, 19, 24]) {
    const current = advance(initial, updates).state;
    const duplicate = beginHomeFolderClose(current, { ...identity }, { restoredSelectionVisible: true });
    assert.equal(duplicate.state, current, 'first plan is retained; a new plan requires a new transition ID');
    assert.deepEqual(duplicate.observations, []);
    assert.equal(duplicate.processedSteps, 0);
  }
});

test('explicit replacement resets clocks; old generation or ID cannot step, batch or cancel it', () => {
  const old = advance(begin().state, 16).state;
  for (const key of [{ generation: identity.generation, transitionId: 2 }, { generation: 'system:2', transitionId: 1 }]) {
    const replacement = begin({ restoredSelectionVisible: false, viewportDuration: 10 }, key, old);
    assert.equal(replacement.state.folder.frame, 16);
    assert.equal(replacement.state.folder.appliedFrame, null);
    assert.deepEqual(events(replacement), [['closeStarted', null]]);
    for (const result of [stepHomeFolderClose(replacement.state, identity, both),
      advanceHomeFolderClose(replacement.state, identity, 50, both), cancelHomeFolderClose(replacement.state, identity)]) {
      assert.equal(result.state, replacement.state);
      assert.deepEqual(result.observations, []);
      assert.equal(result.processedSteps, 0);
    }
    assert.equal(old.folder.frame, 0, 'replacing did not mutate old state');
    assert.notEqual(stepHomeFolderClose(replacement.state, key, both).state, replacement.state);
  }
});

test('cancellation in every phase emits no fabricated completion; repeat cancellation is a no-op', () => {
  const initial = begin({ restoredSelectionVisible: false, viewportDuration: 5 }).state;
  for (const updates of [0, 8, 18, 19, 24]) {
    const current = advance(initial, updates).state;
    const cancelled = cancelHomeFolderClose(current, identity);
    assert.deepEqual(cancelled, { state: null, observations: [], processedSteps: 0 });
    assert.deepEqual(cancelHomeFolderClose(cancelled.state, identity), cancelled);
    assert.deepEqual(stepHomeFolderClose(cancelled.state, identity, both), cancelled);
    assert.deepEqual(advanceHomeFolderClose(cancelled.state, identity, 100, both), cancelled);
    assert.equal(sampleHomeFolderClose(cancelled.state), null);
    const restarted = begin({ restoredSelectionVisible: true }, { ...identity, transitionId: 2 }, cancelled.state);
    assert.deepEqual(events(restarted), [['closeStarted', null]]);
    assert.equal(restarted.state.folder.frame, 16);
  }
});

test('completed state never repeats events or consumes remaining shared steps', () => {
  const complete = advance(begin().state, 19).state;
  for (const result of [stepHomeFolderClose(complete, identity, both), advance(complete, Number.MAX_SAFE_INTEGER)]) {
    assert.equal(result.state, complete);
    assert.deepEqual(result.observations, []);
    assert.equal(result.processedSteps, 0);
  }
});

test('immutable snapshots and observations cannot be changed through caller aliases or sampling', () => {
  const key = { ...identity };
  const options = { restoredSelectionVisible: false, viewportDuration: 5 };
  const start = begin(options, key);
  key.generation = 'changed'; options.viewportDuration = 10;
  assert.deepEqual(start.state.identity, identity);
  assert.equal(start.state.viewportDuration, 5);
  const original = JSON.stringify(start);
  for (let i = 0; i < 20; i++) assert.equal(sampleHomeFolderClose(start.state), start.state);
  for (const value of [start, start.state, start.state.identity, start.state.folder, start.state.capture,
    start.observations, start.observations[0], start.observations[0].identity]) assert.ok(Object.isFrozen(value));
  assert.throws(() => { sampleHomeFolderClose(start.state).folder.frame = 2; }, TypeError);
  assert.throws(() => { start.observations.push({ kind: 'rootSelectionReady' }); }, TypeError);
  advance(start.state, 100);
  assert.equal(JSON.stringify(start), original);
});

test('zero and fully inhibited batches preserve state and emit nothing', () => {
  const state = begin().state;
  assert.deepEqual(advance(state, 0), { state, observations: [], processedSteps: 0 });
  const frozen = advance(state, Number.MAX_SAFE_INTEGER, blocked);
  assert.equal(frozen.state, state);
  assert.deepEqual(frozen.observations, []);
  assert.equal(frozen.processedSteps, Number.MAX_SAFE_INTEGER);
});

test('invalid visibility or missing/unsupported viewport duration fails explicitly at begin', () => {
  for (const options of [{}, { restoredSelectionVisible: 1 }, { restoredSelectionVisible: false },
    ...[null, 0, 1, 4, 6, 9, 11, '5', NaN].map(viewportDuration => ({ restoredSelectionVisible: false, viewportDuration }))]) {
    assert.throws(() => beginHomeFolderClose(null, identity, options), /explicit viewport duration/);
  }
  assert.equal(begin({ restoredSelectionVisible: true, viewportDuration: 5 }).state.viewportDuration, null);
});

test('invalid identities, eligibility and batch counts fail without changing input state', () => {
  const state = begin().state;
  for (const key of [{ generation: '', transitionId: 1 }, { generation: 1, transitionId: 1 },
    ...[-1, 0.1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '1'].map(transitionId => ({ generation: 'system:1', transitionId }))]) {
    assert.throws(() => beginHomeFolderClose(null, key, { restoredSelectionVisible: true }), /identity/);
    assert.throws(() => stepHomeFolderClose(state, key, both), /identity/);
    assert.throws(() => advanceHomeFolderClose(state, key, 1, both), /identity/);
    assert.throws(() => cancelHomeFolderClose(state, key), /identity/);
  }
  for (const input of [{}, { taskEligible: true }, { taskEligible: 1, layoutEligible: true }]) {
    assert.throws(() => stepHomeFolderClose(state, identity, input), /eligibility/);
    assert.throws(() => advanceHomeFolderClose(state, identity, 1, input), /eligibility/);
  }
  for (const updates of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => advance(state, updates), /update count/);
  }
  assert.equal(state.folder.frame, 16);
});
