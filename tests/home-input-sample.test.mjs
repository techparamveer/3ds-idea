import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  createHomeInputSampler, setHomeDigitalSource, setHomePrimaryAxis, sampleHomeInput,
} from '../src/os/home-input-sample.ts';
import { createHomeInputProducer, pollHomeInput } from '../src/os/home-input-producer.ts';

const oracle = JSON.parse(readFileSync(new URL('./fixtures/home-input-sample.json', import.meta.url)));
const gates = Object.freeze({ touchActive: false, captureActive: false, hostFlags: 0,
  gateWord14: 0, readiness10dc20: true, readiness10cd20: true });
const zero = Object.freeze({ held: 0, pressed: 0, released: 0 });
function updateSources(state, sources, axes) {
  for (const id of Object.keys(state.digitalSources)) if (!Object.hasOwn(sources, id)) state = setHomeDigitalSource(state, id, 0);
  for (const [id, held] of Object.entries(sources)) state = setHomeDigitalSource(state, id, held);
  return setHomePrimaryAxis(state, ...axes);
}

test('sampler fixtures pin original ARM source and numeric observations', () => {
  assert.equal(oracle.provenance.sourceSHA256, '243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9');
  assert.equal(oracle.provenance.pinnedFiles['native-input-events/checked.json'], 'e82ba7aa783c3d8d749a36661e58029e2218e8cec725bfa71f1036fbc63346c9');
  assert.equal(oracle.provenance.pinnedFiles['native-input-sample-runtime/checked.json'], '1be5d590dfea653314188e43e6816e9973371a1a65200b3a0ccdb468649afb48');
  assert.equal(oracle.cases.reduce((count, trace) => count + trace.rows.length, 0), 104);
});

for (const trace of oracle.cases) {
  test(`original ARM sample: ${trace.name}`, () => {
    let state = createHomeInputSampler(), producer = createHomeInputProducer();
    for (const [poll, expected] of trace.rows.entries()) {
      state = updateSources(state, expected.digitalSources, expected.primaryAxis);
      const before = structuredClone(state), result = sampleHomeInput(state);
      for (const channel of ['digital', 'primary']) {
        if (expected[channel]) assert.deepEqual(result[channel], expected[channel], `${trace.name} poll${poll} ${channel}`);
      }
      if (expected.digital && expected.primary) {
        const combined = Object.fromEntries(['held', 'pressed', 'released'].map(key => [key, expected.digital[key] | expected.primary[key]]));
        assert.deepEqual(result.combined, combined);
      }
      if (expected.retainedAxis) assert.deepEqual(Object.values(result.state.primaryAxis), expected.retainedAxis);
      const produced = pollHomeInput(producer, { ...gates, ...result.combined });
      if (expected.events) assert.deepEqual(produced.events, expected.events, `${trace.name} poll${poll} producer order`);
      assert.deepEqual(state, before);
      assert.ok(Object.isFrozen(result) && Object.isFrozen(result.state) && Object.isFrozen(result.state.digitalSources));
      assert.ok(Object.isFrozen(result.state.primaryAxis) && Object.isFrozen(result.digital)
        && Object.isFrozen(result.primary) && Object.isFrozen(result.combined));
      state = result.state; producer = produced.state;
    }
  });
}

test('digital source updates are snapshots, with edges consumed only by explicit sampling', () => {
  const initial = createHomeInputSampler();
  let pending = setHomeDigitalSource(initial, 'keyboard', 16);
  pending = setHomeDigitalSource(pending, 'physical', 16);
  pending = setHomePrimaryAxis(pending, -.6, .6);
  assert.equal(pending.previousDigitalHeld, 0); assert.equal(pending.previousPrimaryHeld, 0);
  assert.deepEqual(initial, createHomeInputSampler());
  const first = sampleHomeInput(pending);
  assert.equal(first.digital.pressed, 16); assert.equal(first.primary.pressed, 0x60);
  const again = sampleHomeInput(first.state);
  assert.deepEqual(again.combined, { held: 0x70, pressed: 0, released: 0 });
  const releasedOne = sampleHomeInput(setHomeDigitalSource(again.state, 'keyboard', 0));
  assert.deepEqual(releasedOne.digital, { held: 16, pressed: 0, released: 0 });
  const releasedAll = sampleHomeInput(setHomeDigitalSource(releasedOne.state, 'physical', 0));
  assert.deepEqual(releasedAll.digital, { held: 0, pressed: 0, released: 16 });
  assert.deepEqual(releasedAll.state.digitalSources, {});
});

test('source handoff between samples does not manufacture release/press edges', () => {
  const first = sampleHomeInput(setHomeDigitalSource(createHomeInputSampler(), 'a', 16));
  const pending = setHomeDigitalSource(setHomeDigitalSource(first.state, 'a', 0), 'b', 16);
  assert.deepEqual(sampleHomeInput(pending).digital, { held: 16, pressed: 0, released: 0 });
  const unsampledTap = setHomeDigitalSource(setHomeDigitalSource(createHomeInputSampler(), 'a', 16), 'a', 0);
  assert.deepEqual(sampleHomeInput(unsampledTap).combined, zero);
});

test('independent primary release remains observable while a digital button stays held', () => {
  let state = setHomeDigitalSource(createHomeInputSampler(), 'key', 16);
  state = sampleHomeInput(setHomePrimaryAxis(state, .6, 0)).state;
  const result = sampleHomeInput(setHomePrimaryAxis(state, 0, 0));
  const expected = oracle.cases.find(trace => trace.name === 'independent-digital-primary-edges').rows[3];
  assert.deepEqual(result.digital, expected.digital); assert.deepEqual(result.primary, expected.primary);
  assert.deepEqual(pollHomeInput(createHomeInputProducer(), { ...gates, ...result.combined }).events, expected.events);
});

test('all source and result snapshots are frozen and detached from mutable caller records', () => {
  const initial = createHomeInputSampler();
  assert.ok(Object.isFrozen(initial) && Object.isFrozen(initial.digitalSources) && Object.isFrozen(initial.primaryAxis));
  const supplied = { digitalSources: { key: 16 }, primaryAxis: { x: .6, y: 0 }, previousDigitalHeld: 0, previousPrimaryHeld: 0 };
  const result = sampleHomeInput(supplied);
  supplied.digitalSources.key = 0; supplied.primaryAxis.x = 0;
  assert.equal(result.state.digitalSources.key, 16); assert.equal(result.state.primaryAxis.x, Math.fround(.6));
  assert.throws(() => { result.state.digitalSources.key = 0; }, TypeError);
  assert.throws(() => { result.state.primaryAxis.x = 0; }, TypeError);
  assert.throws(() => { result.digital.held = 0; }, TypeError);
  assert.throws(() => { result.state = initial; }, TypeError);
});

test('source identity names cannot access or mutate object prototypes', () => {
  let state = createHomeInputSampler();
  for (const id of ['__proto__', 'constructor', 'toString']) state = setHomeDigitalSource(state, id, 16);
  for (const id of ['__proto__', 'constructor', 'toString']) assert.ok(Object.hasOwn(state.digitalSources, id));
  assert.deepEqual(sampleHomeInput(state).digital, { held: 16, pressed: 16, released: 0 });
  for (const id of ['__proto__', 'constructor', 'toString']) state = setHomeDigitalSource(state, id, 0);
  assert.deepEqual(state.digitalSources, {}); assert.equal(Object.getPrototypeOf(state.digitalSources), Object.prototype);
});

test('invalid source samples throw atomically instead of clamping or clearing held controls', () => {
  const state = sampleHomeInput(setHomeDigitalSource(createHomeInputSampler(), 'key', 16)).state;
  const before = structuredClone(state);
  for (const value of [NaN, Infinity, -Infinity, -1.01, 1.01, '0', null, undefined, false]) {
    assert.throws(() => setHomePrimaryAxis(state, value, 0), RangeError);
    assert.throws(() => setHomePrimaryAxis(state, 0, value), RangeError);
  }
  for (const value of [-1, .5, 0x10000, NaN, Infinity, '16', null, undefined, true]) {
    assert.throws(() => setHomeDigitalSource(state, 'key', value), RangeError);
  }
  for (const value of ['', ' ', 1, null, undefined, Symbol('key')]) assert.throws(() => setHomeDigitalSource(state, value, 0), TypeError);
  assert.deepEqual(state, before);
  assert.deepEqual(sampleHomeInput(state).digital, { held: 16, pressed: 0, released: 0 });
});

test('malformed retained channel histories and source records are rejected on sampling', () => {
  const state = createHomeInputSampler();
  for (const field of ['previousDigitalHeld', 'previousPrimaryHeld']) {
    for (const value of [-1, .5, NaN, Infinity, 0x10000, null, undefined]) {
      assert.throws(() => sampleHomeInput({ ...state, [field]: value }), RangeError);
    }
  }
  assert.throws(() => sampleHomeInput({ ...state, previousDigitalHeld: 0x2000 }), RangeError);
  assert.throws(() => sampleHomeInput({ ...state, previousPrimaryHeld: 1 }), RangeError);
  for (const digitalSources of [null, [], new Date(), new Map(), 16, 'keys']) {
    assert.throws(() => sampleHomeInput({ ...state, digitalSources }), TypeError);
  }
  assert.throws(() => sampleHomeInput({ ...state, digitalSources: { key: NaN } }), RangeError);
  assert.throws(() => sampleHomeInput({ ...state, primaryAxis: { x: 0, y: NaN } }), RangeError);
});
