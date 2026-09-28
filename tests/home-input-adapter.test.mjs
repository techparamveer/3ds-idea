import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createHomeInputAdapter, updateHomeInputAdapterButton, setHomeInputAdapterAxis,
  sampleHomeInputAdapter, resetHomeInputAdapter,
} from '../src/os/home-input-adapter.ts';
import { createHomeInputSampler, setHomeDigitalSource, sampleHomeInput } from '../src/os/home-input-sample.ts';
import { createHomeInputProducer, pollHomeInput } from '../src/os/home-input-producer.ts';

const gates = Object.freeze({ touchActive: false, captureActive: false, hostFlags: 0,
  gateWord14: 0, readiness10dc20: true, readiness10cd20: true });
const button = (state, command, phase = 'down', source = 'keyboard') =>
  updateHomeInputAdapterButton(state, { source, command, phase });
const zero = Object.freeze({ held: 0, pressed: 0, released: 0 });
function poll(adapter, producer = createHomeInputProducer()) {
  const result = sampleHomeInputAdapter(adapter);
  const produced = pollHomeInput(producer, { ...gates, ...result.sample.combined });
  return { adapter: result.state, sample: result.sample, producer: produced.state, events: produced.events };
}
function frozenTree(value) {
  if (value && typeof value === 'object') {
    assert.ok(Object.isFrozen(value));
    for (const child of Object.values(value)) frozenTree(child);
  }
}

for (const [direction, mask] of [['right', 0x10], ['left', 0x20], ['up', 0x40], ['down', 0x80]]) {
  test(`browser quick ${direction} click survives exactly one sample, then produces native release`, () => {
    const down = button(createHomeInputAdapter(), direction);
    const pending = button(down, direction, 'up');
    const first = poll(pending);
    assert.deepEqual(first.sample.digital, { held: mask, pressed: mask, released: 0 });
    assert.deepEqual(first.events, [{ type: 4, mask }, { type: 5, mask }]);
    assert.deepEqual(first.adapter.sources, {});
    assert.deepEqual(first.adapter.sampler.digitalSources, {});
    assert.equal(first.adapter.sampler.previousDigitalHeld, mask);
    // The returned native sample describes the observed pulse; only the next
    // adapter snapshot has removed that source after sampling.
    assert.equal(first.sample.state.digitalSources.keyboard, mask);
    const second = poll(first.adapter, first.producer);
    assert.deepEqual(second.sample.digital, { held: 0, pressed: 0, released: mask });
    assert.deepEqual(second.events, [{ type: 7, mask }]);
    assert.deepEqual(poll(second.adapter, second.producer).events, []);
    assert.equal(down.sources.keyboard.pendingRelease, false);
    assert.equal(pending.sources.keyboard.pendingRelease, true);
  });
}

test('minimum pulse is browser policy; raw down/up-between-samples remains empty', () => {
  let raw = setHomeDigitalSource(createHomeInputSampler(), 'click', 16);
  raw = setHomeDigitalSource(raw, 'click', 0);
  assert.deepEqual(sampleHomeInput(raw).combined, zero);
  let adapted = button(createHomeInputAdapter(), 'right', 'down', 'click');
  adapted = button(adapted, 'right', 'up', 'click');
  assert.deepEqual(poll(adapted).sample.combined, { held: 16, pressed: 16, released: 0 });
});

test('ordinary held press uses native20/5 repeat polls with no browser repeat contribution', () => {
  let adapter = createHomeInputAdapter(), producer = createHomeInputProducer();
  const notifications = [];
  for (let index = 0; index <= 77; index++) {
    if (index === 1) adapter = button(adapter, 'right');
    if (index > 1 && index < 77) {
      const before = adapter;
      adapter = button(adapter, 'right', 'repeat');
      assert.equal(adapter, before);
    }
    if (index === 77) adapter = button(adapter, 'right', 'up');
    const result = poll(adapter, producer);
    notifications.push(...result.events.filter(event => event.type !== 5).map(event => [index, event.type, event.mask]));
    adapter = result.adapter; producer = result.producer;
  }
  assert.deepEqual(notifications, [[1,4,16], [21,6,16], [26,6,16], [31,6,16], [36,6,16], [41,6,16],
    [46,6,16], [51,6,16], [56,6,16], [61,6,16], [66,6,16], [71,6,16], [76,6,16], [77,7,16]]);
});

test('a browser repeat on an unknown source neither presses nor cancels its pending release', () => {
  const initial = createHomeInputAdapter();
  assert.equal(button(initial, 'right', 'repeat'), initial);
  const pending = button(button(initial, 'right'), 'right', 'up');
  assert.equal(button(pending, 'right', 'repeat'), pending);
  const result = poll(pending);
  assert.deepEqual(result.adapter.sources, {});
  assert.deepEqual(poll(result.adapter, result.producer).events, [{ type: 7, mask: 16 }]);
});

test('duplicate downs preserve observation status and cannot turn a normal release into another pulse', () => {
  const down = button(createHomeInputAdapter(), 'right');
  assert.equal(button(down, 'right'), down);
  const first = poll(down);
  assert.equal(button(first.adapter, 'right'), first.adapter);
  const up = button(first.adapter, 'right', 'up');
  assert.deepEqual(up.sources, {});
  const result = poll(up, first.producer);
  assert.deepEqual(result.events, [{ type: 7, mask: 16 }]);
});

test('independent digital sources share aggregate edges and release only the final held owner', () => {
  let adapter = button(createHomeInputAdapter(), 'right', 'down', 'keyboard:ArrowRight');
  adapter = button(adapter, 'right', 'down', 'pointer:RIGHT');
  const first = poll(adapter);
  assert.deepEqual(first.events, [{ type: 4, mask: 16 }, { type: 5, mask: 16 }]);
  const second = poll(button(first.adapter, 'right', 'up', 'keyboard:ArrowRight'), first.producer);
  assert.deepEqual(second.sample.digital, { held: 16, pressed: 0, released: 0 });
  assert.deepEqual(second.events, [{ type: 5, mask: 16 }]);
  const third = poll(button(second.adapter, 'right', 'up', 'pointer:RIGHT'), second.producer);
  assert.deepEqual(third.events, [{ type: 7, mask: 16 }]);
});

test('a quick pulse sharing an already-held digital bit does not create an extra aggregate edge', () => {
  const first = poll(button(createHomeInputAdapter(), 'right', 'down', 'key'));
  let adapter = button(first.adapter, 'right', 'down', 'click');
  adapter = button(adapter, 'right', 'up', 'click');
  const second = poll(adapter, first.producer);
  const third = poll(second.adapter, second.producer);
  assert.deepEqual(second.sample.digital, { held: 16, pressed: 0, released: 0 });
  assert.deepEqual(third.sample.digital, second.sample.digital);
  assert.deepEqual(Object.keys(second.adapter.sources), ['key']);
});

test('digital source handoff between samples preserves aggregate continuity', () => {
  const first = poll(button(createHomeInputAdapter(), 'right', 'down', 'key'));
  let adapter = button(first.adapter, 'right', 'up', 'key');
  adapter = button(adapter, 'right', 'down', 'pointer');
  assert.deepEqual(poll(adapter, first.producer).sample.digital, { held: 16, pressed: 0, released: 0 });
});

test('replacement direction owns the source whole mask; stale up cannot release the newer direction', () => {
  const first = poll(button(createHomeInputAdapter(), 'right'));
  const replaced = button(first.adapter, 'left');
  assert.equal(button(replaced, 'right', 'up'), replaced);
  assert.equal(replaced.sampler.digitalSources.keyboard, 32);
  const second = poll(replaced, first.producer);
  assert.deepEqual(second.sample.digital, { held: 32, pressed: 32, released: 16 });
  assert.deepEqual(second.events, [{ type: 4, mask: 32 }, { type: 5, mask: 32 }, { type: 7, mask: 16 }]);
  assert.deepEqual(poll(button(second.adapter, 'left', 'up'), second.producer).events, [{ type: 7, mask: 32 }]);
});

test('unsampled replacement and release retain only the newest intent for one sample', () => {
  let adapter = button(createHomeInputAdapter(), 'right');
  adapter = button(adapter, 'right', 'up');
  adapter = button(adapter, 'left');
  adapter = button(adapter, 'left', 'up');
  const first = poll(adapter);
  assert.deepEqual(first.events, [{ type: 4, mask: 32 }, { type: 5, mask: 32 }]);
  assert.deepEqual(poll(first.adapter, first.producer).events, [{ type: 7, mask: 32 }]);
});

test('new down cancels an unsampled pending release and remains held after its sample', () => {
  let adapter = button(createHomeInputAdapter(), 'right');
  adapter = button(adapter, 'right', 'up');
  adapter = button(adapter, 'right');
  const first = poll(adapter);
  assert.equal(first.adapter.sources.keyboard.observed, true);
  assert.equal(first.adapter.sources.keyboard.pendingRelease, false);
  const second = poll(first.adapter, first.producer);
  assert.deepEqual(second.events, [{ type: 5, mask: 16 }]);
});

test('up/down before the next sample cancels an observed release without a manufactured edge', () => {
  const first = poll(button(createHomeInputAdapter(), 'right'));
  const up = button(first.adapter, 'right', 'up');
  const down = button(up, 'right');
  const second = poll(down, first.producer);
  assert.deepEqual(second.sample.digital, { held: 16, pressed: 0, released: 0 });
  assert.deepEqual(second.events, [{ type: 5, mask: 16 }]);
});

test('down after a consumed quick pulse but before release sample continues the newest hold', () => {
  const first = poll(button(button(createHomeInputAdapter(), 'right'), 'right', 'up'));
  const second = poll(button(first.adapter, 'right'), first.producer);
  assert.deepEqual(second.sample.digital, { held: 16, pressed: 0, released: 0 });
  assert.equal(second.adapter.sources.keyboard.observed, true);
  assert.deepEqual(poll(button(second.adapter, 'right', 'up'), second.producer).events, [{ type: 7, mask: 16 }]);
});

test('independent quick clicks in one sample preserve all direction bits without inventing arbitration', () => {
  let adapter = createHomeInputAdapter();
  for (const [source, direction] of [['one', 'right'], ['two', 'up']]) {
    adapter = button(button(adapter, direction, 'down', source), direction, 'up', source);
  }
  const first = poll(adapter);
  assert.deepEqual(first.events, [{ type: 4, mask: 0x50 }, { type: 5, mask: 0x50 }]);
  assert.deepEqual(poll(first.adapter, first.producer).events, [{ type: 7, mask: 0x50 }]);
});

test('digital and primary edges stay independent even when primary release overlaps digital held', () => {
  let adapter = button(createHomeInputAdapter(), 'right');
  adapter = setHomeInputAdapterAxis(adapter, .6, 0);
  const first = poll(adapter);
  assert.deepEqual(first.sample.digital, { held: 16, pressed: 16, released: 0 });
  assert.deepEqual(first.sample.primary, first.sample.digital);
  assert.deepEqual(first.events, [{ type: 4, mask: 16 }, { type: 5, mask: 16 }]);
  const second = poll(setHomeInputAdapterAxis(first.adapter, 0, 0), first.producer);
  assert.deepEqual(second.sample.digital, { held: 16, pressed: 0, released: 0 });
  assert.deepEqual(second.sample.primary, { held: 0, pressed: 0, released: 16 });
  assert.deepEqual(second.events, [{ type: 5, mask: 16 }, { type: 7, mask: 16 }]);
});

test('quick digital pulse release remains independent while its primary-axis bit stays held', () => {
  let adapter = button(button(createHomeInputAdapter(), 'right'), 'right', 'up');
  adapter = setHomeInputAdapterAxis(adapter, .6, -.6);
  const first = poll(adapter);
  assert.deepEqual(first.sample.primary, { held: 0x50, pressed: 0x50, released: 0 });
  const second = poll(first.adapter, first.producer);
  assert.deepEqual(second.sample.combined, { held: 0x50, pressed: 0, released: 0x10 });
  assert.deepEqual(second.events, [{ type: 5, mask: 0x50 }, { type: 7, mask: 0x10 }]);
});

test('primary-axis conversion keeps strict float32 thresholds, browser Y sign, and diagonals', () => {
  const beyond = .5000000596046448;
  const cases = [
    [0, 0, 0], [.5, -.5, 0], [-.5, .5, 0], [.50000001, -.50000001, 0],
    [beyond, 0, 0x10], [-beyond, 0, 0x20], [0, -beyond, 0x40], [0, beyond, 0x80],
    [1, -1, 0x50], [-1, -1, 0x60], [1, 1, 0x90], [-1, 1, 0xa0],
  ];
  for (const [x, y, expected] of cases) {
    const adapter = setHomeInputAdapterAxis(createHomeInputAdapter(), x, y);
    assert.equal(adapter.sampler.primaryAxis.x, Math.fround(x));
    assert.equal(adapter.sampler.primaryAxis.y, Math.fround(-y));
    const result = poll(adapter);
    assert.deepEqual(result.sample.primary, { held: expected, pressed: expected, released: 0 });
    assert.deepEqual(result.events, expected ? [{ type: 4, mask: expected }, { type: 5, mask: expected }] : []);
  }
});

test('the single analog channel retains only its latest endpoint; no minimum pulse is added to axes', () => {
  let adapter = setHomeInputAdapterAxis(createHomeInputAdapter(), .9, -.9);
  adapter = setHomeInputAdapterAxis(adapter, 0, 0);
  assert.deepEqual(poll(adapter).sample.primary, zero);
});

test('updates never consume edge history, expire a pending pulse, or advance an independent producer', () => {
  const producer = createHomeInputProducer();
  let adapter = button(button(createHomeInputAdapter(), 'right'), 'right', 'up');
  const pending = adapter;
  for (let index = 0; index < 100; index++) {
    adapter = setHomeInputAdapterAxis(adapter, 0, index % 2 ? -.6 : 0);
    adapter = button(adapter, 'right', 'repeat');
    adapter = button(adapter, 'left', 'up', 'unknown');
  }
  assert.equal(adapter.sampler.previousDigitalHeld, 0);
  assert.equal(adapter.sampler.previousPrimaryHeld, 0);
  assert.deepEqual(adapter.sources, pending.sources);
  assert.deepEqual(producer, createHomeInputProducer());
  const first = sampleHomeInputAdapter(adapter), sameInput = sampleHomeInputAdapter(adapter);
  assert.deepEqual(first, sameInput);
  assert.deepEqual(first.sample, sampleHomeInput(adapter.sampler));
  assert.deepEqual(first.sample.combined, { held: 0x50, pressed: 0x50, released: 0 });
});

test('returned snapshots are deeply frozen, preserve old snapshots, and retain no caller event objects', () => {
  const initial = createHomeInputAdapter();
  const event = { source: 'key', command: 'right', phase: 'down' };
  const down = updateHomeInputAdapterButton(initial, event);
  event.command = 'left'; event.phase = 'up'; event.source = 'other';
  const pending = button(down, 'right', 'up', 'key');
  const axis = setHomeInputAdapterAxis(pending, .6, -.6);
  const before = structuredClone(axis), result = sampleHomeInputAdapter(axis);
  for (const snapshot of [initial, down, pending, axis, result, resetHomeInputAdapter()]) frozenTree(snapshot);
  assert.deepEqual(axis, before);
  assert.deepEqual(initial, createHomeInputAdapter());
  assert.equal(down.sources.key.pendingRelease, false);
  assert.equal(pending.sources.key.pendingRelease, true);
  assert.equal(down.sampler.digitalSources.key, 16);
  assert.throws(() => { axis.sources.key.observed = true; }, TypeError);
  assert.throws(() => { result.state.sampler.previousDigitalHeld = 0; }, TypeError);
  assert.throws(() => { result.sample.combined.pressed = 0; }, TypeError);
});

test('all valid source identities, including prototype names, retain and release their own pulses', () => {
  let adapter = createHomeInputAdapter();
  const names = ['__proto__', 'constructor', 'toString'];
  for (const name of names) adapter = button(adapter, 'right', 'down', name);
  for (const name of names) assert.ok(Object.hasOwn(adapter.sources, name));
  const first = poll(adapter);
  assert.equal(Object.getPrototypeOf(first.adapter.sources), Object.prototype);
  for (const name of names) assert.ok(first.adapter.sources[name].observed);
  adapter = first.adapter;
  for (const name of names) adapter = button(adapter, 'right', 'up', name);
  assert.deepEqual(poll(adapter, first.producer).events, [{ type: 7, mask: 16 }]);
  for (const name of names) adapter = button(button(adapter, 'left', 'down', name), 'left', 'up', name);
  const pulses = poll(adapter);
  assert.deepEqual(pulses.sample.digital, { held: 32, pressed: 32, released: 16 });
  assert.deepEqual(pulses.adapter.sources, {});
});

test('invalid button and axis input throws atomically, including values that negation could coerce', () => {
  const state = poll(button(createHomeInputAdapter(), 'right')).adapter;
  const before = structuredClone(state);
  for (const invalid of [NaN, Infinity, -Infinity, 1.01, -1.01, '0', '', null, undefined, false, true]) {
    assert.throws(() => setHomeInputAdapterAxis(state, invalid, 0), RangeError);
    assert.throws(() => setHomeInputAdapterAxis(state, 0, invalid), RangeError);
  }
  for (const source of ['', ' ', 1, null, undefined, Symbol('key')]) {
    assert.throws(() => updateHomeInputAdapterButton(state, { source, command: 'right', phase: 'down' }), TypeError);
  }
  for (const command of ['open', 'toString', '__proto__', null, undefined, 16, { toString: () => 'right' }]) {
    assert.throws(() => updateHomeInputAdapterButton(state, { source: 'key', command, phase: 'down' }), RangeError);
  }
  for (const phase of ['press', null, undefined, 0, true]) {
    assert.throws(() => updateHomeInputAdapterButton(state, { source: 'key', command: 'right', phase }), TypeError);
  }
  assert.deepEqual(state, before);
  assert.deepEqual(poll(state).sample.digital, { held: 16, pressed: 0, released: 0 });
});

test('explicit reset clears held sources, pending pulses, axes and both edge histories without cancellation events', () => {
  let adapter = button(createHomeInputAdapter(), 'right');
  adapter = poll(setHomeInputAdapterAxis(adapter, .6, -.6)).adapter;
  adapter = button(button(adapter, 'left', 'down', 'click'), 'left', 'up', 'click');
  const before = structuredClone(adapter);
  const reset = resetHomeInputAdapter();
  assert.deepEqual(reset, createHomeInputAdapter());
  assert.deepEqual(poll(reset).events, []);
  assert.deepEqual(adapter, before);
  const fresh = poll(button(reset, 'right'));
  assert.deepEqual(fresh.events, [{ type: 4, mask: 16 }, { type: 5, mask: 16 }]);
});
