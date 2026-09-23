import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  createHomeInputProducer, pollHomeInput, HOME_INPUT_REPEAT_MASK,
  HOME_INPUT_INITIAL_REPEAT_POLLS, HOME_INPUT_REPEAT_INTERVAL_POLLS,
} from '../src/os/home-input-producer.ts';

const oracle = JSON.parse(readFileSync(new URL('./fixtures/home-input-producer.json', import.meta.url)));
const sample = (masks = [0, 0, 0], controls = {}) => Object.freeze({
  held: masks[0], pressed: masks[1], released: masks[2],
  touchActive: false, captureActive: false, hostFlags: 0, gateWord14: 0,
  readiness10dc20: true, readiness10cd20: true, ...controls,
});
const caseNamed = name => oracle.cases.find(value => value.name === name);

test('oracle identifies the pinned original ARM observations and repeat settings', () => {
  assert.equal(oracle.provenance.sourceTitle, '0004003000009802');
  assert.equal(oracle.provenance.sourceVersion, 24576);
  assert.equal(oracle.provenance.sourceSHA256, '243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9');
  assert.equal(oracle.provenance.pinnedFiles['native-input-events/checked.json'], 'e82ba7aa783c3d8d749a36661e58029e2218e8cec725bfa71f1036fbc63346c9');
  assert.equal(oracle.provenance.pinnedFiles['native-cursor-acceleration/checked.json'], 'f47f2402079578919cf409c92ae2b8a90f031f13658599c3bec1dcf566401797');
  assert.equal(oracle.provenance.pinnedFiles['native-input-producer-runtime/checked.json'], '28814e9d3bc29b0073230d15fe226f28797773c0e4525bf52a2fc01b2c67f54d');
  assert.deepEqual([HOME_INPUT_REPEAT_MASK, HOME_INPUT_INITIAL_REPEAT_POLLS, HOME_INPUT_REPEAT_INTERVAL_POLLS], [0xc0f0, 20, 5]);
});

for (const trace of oracle.cases) {
  test(`original ARM producer: ${trace.name}`, () => {
    let state = trace.initial ? Object.freeze({ ...trace.initial }) : createHomeInputProducer();
    for (const [poll, expected] of trace.rows.entries()) {
      const input = sample(expected.masks, expected.controls), before = { ...state };
      const result = pollHomeInput(state, input);
      assert.deepEqual(result.events, expected.events, `${trace.name} poll${poll} ordered events`);
      for (const [key, value] of Object.entries(expected.state ?? {})) {
        assert.equal(result.state[key], value, `${trace.name} poll${poll} ${key}`);
      }
      assert.deepEqual(state, before, 'previous state is immutable');
      assert.ok(Object.isFrozen(result) && Object.isFrozen(result.state) && Object.isFrozen(result.events));
      assert.ok(result.events.every(Object.isFrozen));
      state = result.state;
    }
  });
}

for (const expected of oracle.repeatMaskCases) {
  test(`original ARM repeat-mask inclusion: 0x${expected.mask.toString(16)}`, () => {
    let state = createHomeInputProducer();
    const repeats = [];
    for (let poll = 0; poll <= 26; poll++) {
      const result = pollHomeInput(state, sample([poll ? expected.mask : 0, poll === 1 ? expected.mask : 0, 0]));
      if (result.events.some(event => event.type === 6)) repeats.push(poll);
      state = result.state;
    }
    const released = pollHomeInput(state, sample([0, 0, expected.mask]));
    assert.deepEqual(repeats, expected.repeatPolls);
    assert.deepEqual(released.events, expected.releaseEvents);
    for (const [key, value] of Object.entries(expected.releaseState)) assert.equal(released.state[key], value);
  });
}

test('both78-poll experiments preserve the producer stream independently of scene updates', () => {
  const zero = caseNamed('hold78-with-0-scene-updates'), one = caseNamed('hold78-with-1-scene-updates');
  assert.equal(zero.rows.length, 78); assert.equal(one.rows.length, 78);
  assert.deepEqual(zero.rows, one.rows);
  const notifications = zero.rows.flatMap((row, poll) => row.events.filter(event => event.type !== 5).map(event => [poll, event.type]));
  assert.deepEqual(notifications, [[1,4],[21,6],[26,6],[31,6],[36,6],[41,6],[46,6],[51,6],[56,6],[61,6],[66,6],[71,6],[76,6],[77,7]]);
});

test('explicit normalized release can overlap held and is never re-derived by the producer', () => {
  const row = caseNamed('overlappingSources').rows.at(-1);
  assert.deepEqual(row.masks, [16, 0, 16]);
  assert.deepEqual(row.events, [{ type: 5, mask: 16 }, { type: 7, mask: 16 }]);
  const state = Object.freeze({ repeatCandidate: 16, repeatCounter: 0, previousCapture: false });
  assert.deepEqual(pollHomeInput(state, sample(row.masks)).events, row.events);
});

test('constructor and all returned containers are frozen without retaining mutable caller objects', () => {
  const created = createHomeInputProducer();
  assert.deepEqual(created, { repeatCandidate: 0, repeatCounter: 0, previousCapture: false });
  assert.ok(Object.isFrozen(created));
  const callerState = { ...created }, callerInput = { ...sample([16, 16, 0]) };
  const result = pollHomeInput(callerState, callerInput);
  callerState.repeatCounter = 100; callerInput.held = 0;
  assert.equal(result.state.repeatCounter, 0); assert.equal(result.events[1].mask, 16);
  assert.throws(() => { result.state.repeatCounter = 100; }, TypeError);
  assert.throws(() => { result.events[0].mask = 0; }, TypeError);
  assert.throws(() => result.events.push({ type: 7, mask: 0 }), TypeError);
  assert.throws(() => { result.state = created; }, TypeError);
});

test('invalid masks and counters throw before emitting input, even when a gate blocks processing', () => {
  const state = createHomeInputProducer(), neutral = sample();
  for (const field of ['held', 'pressed', 'released']) {
    for (const value of [-1, .5, 0x10000, NaN, Infinity, -Infinity, '16', null, undefined, true]) {
      assert.throws(() => pollHomeInput(state, { ...neutral, hostFlags: 1, [field]: value }), RangeError, field);
    }
  }
  for (const field of ['hostFlags', 'gateWord14']) {
    for (const value of [-1, .5, 0x100000000, NaN, Infinity, '0', null, undefined, false]) {
      assert.throws(() => pollHomeInput(state, { ...neutral, [field]: value }), RangeError, field);
    }
  }
  for (const [field, maximum] of [['repeatCandidate', 0xffff], ['repeatCounter', 0xffffffff]]) {
    for (const value of [-1, .5, maximum + 1, Number.MAX_SAFE_INTEGER, NaN, Infinity, '0', null, undefined, false]) {
      assert.throws(() => pollHomeInput({ ...state, [field]: value }, neutral), RangeError, field);
    }
  }
  assert.deepEqual(state, createHomeInputProducer());
});

test('gate, touch and capture inputs require explicit boolean values', () => {
  const state = createHomeInputProducer(), neutral = sample();
  for (const field of ['touchActive', 'captureActive', 'readiness10dc20', 'readiness10cd20']) {
    for (const value of [0, 1, '', 'false', null, undefined, NaN]) {
      assert.throws(() => pollHomeInput(state, { ...neutral, [field]: value }), TypeError, field);
    }
  }
  for (const value of [0, 1, '', 'false', null, undefined, NaN]) {
    assert.throws(() => pollHomeInput({ ...state, previousCapture: value }, neutral), TypeError);
  }
});
