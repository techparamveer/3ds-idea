import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  createNativeKeyboardWidget, updateNativeNicknameKey, routeNativeNicknameKey,
  applyNativeNicknameEditResult, updateNativeNicknameTextTouch,
  createNativeKeyboardDigital, pollNativeKeyboardDigital, NATIVE_KEYBOARD_REPEAT_MASK,
} from '../src/os/native-keyboard-input.ts';

const oracle = JSON.parse(readFileSync(new URL('./fixtures/native-keyboard-input.json', import.meta.url)));
const touch = values => ({ held: false, previous: false, inside: false, enabled: true, blocked: false, finished: false, disablePending: false, ...values });
const digital = values => ({ held: 0, pressed: 0, released: 0, touch: false, capture: false, hostFlags: 0, inhibit: 0, readyA: true, readyB: true, ...values });
const keyFor = kind => kind === 'character' ? { kind, unit: 49 } : { kind };
const compareState = (actual, expected) => { for (const [key, value] of Object.entries(expected)) assert.deepEqual(actual[key], value, key); };

test('input oracle identifies original keyboard code and independent repeat mask', () => {
  assert.equal(oracle.provenance.sourceSHA256, 'a0b78005b0a99116ca703bc9b7625ce1b0f2d4cc45f66fc6fb9ab8a34244d4f0');
  assert.equal(NATIVE_KEYBOARD_REPEAT_MASK, oracle.repeatMask);
  assert.equal(NATIVE_KEYBOARD_REPEAT_MASK, 0xf0);
});

for (const trace of oracle.widgetCases) {
  test(`original ARM key widget: ${trace.name}`, () => {
    let state = createNativeKeyboardWidget();
    for (const [index, row] of trace.rows.entries()) {
      // The isolated oracle injects +258 to test the model-result endpoint.
      state = Object.freeze({ ...state, stopRepeat: row.input.stopRepeat });
      const before = { ...state }, result = updateNativeNicknameKey(state, keyFor(trace.kind), row.input);
      compareState(result.state, row.state);
      assert.deepEqual(result.effects.filter(e => e.type === 'callback').map(e => e.payload), row.callbacks, `callback at ${index}`);
      assert.deepEqual(result.effects.filter(e => e.type === 'animation').map(e => e.index), row.animations, `animation at ${index}`);
      assert.deepEqual(state, before);
      assert.ok(Object.isFrozen(result) && Object.isFrozen(result.state) && Object.isFrozen(result.effects));
      assert.ok(result.effects.every(Object.isFrozen));
      state = result.state;
    }
  });
}

for (const trace of oracle.textCases) {
  test(`original ARM text widget: ${trace.name}`, () => {
    let state = createNativeKeyboardWidget();
    for (const row of trace.rows) {
      const result = updateNativeNicknameTextTouch(state, row.input);
      compareState(result.state, row.state);
      assert.deepEqual(result.effects, row.effects);
      state = result.state;
    }
  });
}

for (const trace of [...oracle.digital, ...oracle.digitalCases]) {
  test(`original ARM digital manager: ${trace.name ?? trace.mask}`, () => {
    let state = createNativeKeyboardDigital();
    for (const row of trace.rows) {
      const before = { ...state }, result = pollNativeKeyboardDigital(state, digital(row.input));
      assert.deepEqual(result.state, row.state);
      assert.deepEqual(result.events, row.events);
      assert.deepEqual(state, before);
      if (row.modelCalls) assert.deepEqual(row.modelCalls, []);
      for (const event of result.events) assert.deepEqual(routeNativeNicknameKey(keyFor('character'), { kind: event.type, payload: event.mask }), []);
      state = result.state;
    }
  });
}

test('full native manager routes the initial press to owner, child and model once', () => {
  for (const [name, key, expected] of [
    ['character', keyFor('character'), { type: 'insert', unit: 49 }],
    ['backspace', keyFor('backspace'), { type: 'backspace' }],
  ]) {
    const trace = oracle.routes.find(c => c.name === name);
    assert.deepEqual(trace.rows[0].modelCalls, [expected]);
    assert.deepEqual(trace.rows.slice(1).flatMap(r => r.modelCalls), []);
    assert.deepEqual(trace.rows[0].callbackRoute.slice(0, 4), ['0x159cb8', '0x1911bc', '0x17f774', name === 'character' ? '0x1401f8' : '0x140050']);
    const result = updateNativeNicknameKey(createNativeKeyboardWidget(), key, touch({ held: true, inside: true }));
    assert.deepEqual(result.effects.filter(e => e.type === 'callback').flatMap(e => routeNativeNicknameKey(key, e)), [expected]);
    assert.deepEqual(result.effects.map(e => e.type), name === 'character' ? ['animation', 'callback'] : ['callback', 'animation']);
  }
});

test('native selection callbacks precede replacement/deletion without duplicating edit arithmetic', () => {
  for (const name of ['selection-insert', 'selection-backspace']) {
    const trace = oracle.routes.find(c => c.name === name);
    assert.equal(trace.rows[0].modelCalls[0].collapse, true);
    assert.equal(trace.rows[1].modelCalls[0].collapse, false);
    assert.deepEqual(trace.rows[2].modelCalls, []);
    assert.deepEqual(trace.rows[6].modelCalls, [name === 'selection-insert' ? { type: 'insert', unit: 49 } : { type: 'backspace' }]);
    assert.equal(trace.rows.at(-1).model.text, name === 'selection-insert' ? 'A1' : 'A');
  }
});

test('all 45 page0 character identities, Space and Backspace reach the original plain edit entry', () => {
  assert.equal(oracle.keyRoutes.length, 47);
  for (const row of oracle.keyRoutes) {
    assert.equal(row.calls.length, 1);
    const call = row.calls[0];
    const key = row.index === 46 ? keyFor('backspace') : row.index === 45 ? keyFor('space') : { kind: 'character', unit: call.arguments[0] };
    if (row.index < 46) {
      assert.equal(call.address, '0x1401f8');
      assert.deepEqual(call.arguments.slice(1), [0, 0], 'no composing submode');
      assert.deepEqual(routeNativeNicknameKey(key, { kind: 1, payload: 0 }), [{ type: 'insert', unit: call.arguments[0] }]);
    } else {
      assert.equal(call.address, '0x140050');
      assert.deepEqual(routeNativeNicknameKey(key, { kind: 1, payload: 0 }), [{ type: 'backspace' }]);
    }
  }
});

test('full manager retains the capture latch beyond character release and controller completion', () => {
  const trace = oracle.routes.find(c => c.name === 'character');
  assert.deepEqual(trace.rows.map(r => r.widgetStates.character), [1, 1, 2, 0, 0, 0]);
  assert.deepEqual(trace.rows.map(r => r.busy), [1, 1, 1, 1, 1, 0]);
});

test('failed native backspace edit latches repeats after the final empty-buffer attempt', () => {
  const trace = oracle.routes.find(c => c.name === 'backspace-to-empty');
  let state = createNativeKeyboardWidget();
  const key = keyFor('backspace'), seen = [];
  for (const [index, row] of trace.rows.entries()) {
    const result = updateNativeNicknameKey(state, key, touch({ ...row.input, held: !!row.input.held, previous: !!row.input.previous, inside: row.input.hit === 'G_key_Bsp' }));
    state = result.state;
    const callbacks = result.effects.filter(e => e.type === 'callback');
    assert.deepEqual(callbacks.flatMap(e => routeNativeNicknameKey(key, e)), row.modelCalls);
    if (callbacks.length) {
      seen.push(index);
      const accepted = index === 0 || row.model.text !== trace.rows[index - 1].model.text;
      state = applyNativeNicknameEditResult(state, key, accepted);
    }
    assert.equal(state.stopRepeat, row.backspaceStopRepeat);
    assert.equal(state.phase, row.widgetStates.backspace);
  }
  assert.deepEqual(seen, [0, 40, 45, 50]);
});

test('rejected repeat latch survives leaving/re-entry and clears on a new press', () => {
  const key = keyFor('backspace');
  let state = updateNativeNicknameKey(createNativeKeyboardWidget(), key, touch({ held: true, inside: true })).state;
  state = applyNativeNicknameEditResult(state, key, false);
  state = updateNativeNicknameKey(state, key, touch({ held: true, previous: true })).state;
  state = updateNativeNicknameKey(state, key, touch({ held: true, previous: true, inside: true })).state;
  assert.equal(state.stopRepeat, true);
  state = updateNativeNicknameKey(state, key, touch()).state;
  const next = updateNativeNicknameKey(state, key, touch({ held: true, inside: true }));
  assert.equal(next.state.stopRepeat, false);
  assert.deepEqual(next.effects.filter(e => e.type === 'callback').map(e => e.payload), [0]);
});

test('browser cancel adaptation as held=false creates no extra edit or rollback', () => {
  for (const kind of ['character', 'space', 'backspace']) {
    const key = keyFor(kind), down = updateNativeNicknameKey(createNativeKeyboardWidget(), key, touch({ held: true, inside: true }));
    const cancelled = updateNativeNicknameKey(down.state, key, touch({ previous: true }));
    assert.deepEqual(cancelled.effects.filter(e => e.type === 'callback'), []);
    assert.equal(cancelled.state.phase, kind === 'character' ? 2 : 0);
  }
});
