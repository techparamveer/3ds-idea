import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  createHomeTileWidget, setHomeTileWidgetEnabled, resetHomeTileWidget,
  updateHomeTileWidgetInput, advanceHomeTileWidget2D,
} from '../src/os/home-tile-widget.ts';

const oracle = JSON.parse(readFileSync(new URL('./fixtures/home-tile-widget-long-press.json', import.meta.url)));
const poseY = pose => !pose ? 0 : pose.clip === 'select' ? (pose.frame === 0 ? 0 : -2) : (pose.frame === 0 ? -2 : 0);
const controller = value => [value.currentFrame, value.appliedFrame, value.status,
  value.direction === 'forward' ? 0 : 1, Number(value.bindingEnabled)];
const snapshot = widget => [widget.state, Number(widget.enabled), Number(widget.capture), widget.heldCount,
  controller(widget.select), controller(widget.decide), widget.pose && [widget.pose.clip, widget.pose.frame],
  poseY(widget.pose), Number(widget.longPressFlag)];
const events = result => result.events.map(event => event.kind === 'cue' ? event.cue : event.value);
const sample = (widget, current, previous, inside = true, globalCapture = widget.capture) =>
  updateHomeTileWidgetInput(widget, { current, previous, inside, globalCapture });
function immutable(value) {
  if (!value || typeof value !== 'object') return;
  assert.ok(Object.isFrozen(value)); Object.values(value).forEach(immutable);
}
function checkedCall(widget, fn) {
  const before = structuredClone(widget), result = fn(widget);
  assert.deepEqual(widget, before, 'previous snapshot remains unchanged');
  immutable(result); return result;
}

test('long-press oracle covers16 sequences and384 boundaries without changing the43-case fixture', () => {
  assert.equal(oracle.cases.length, 16);
  assert.equal(oracle.cases.reduce((sum, source) => sum + source.rows.length, 0), 384);
  assert.equal(oracle.provenance.resultsSHA256, '6e3c97e8524829e2173df5b4cca2f2fabe78eef1f6b3ff8a230ec48c52ff863a');
  assert.equal(oracle.provenance.excerptsVerified, 18);
  assert.deepEqual(oracle.threshold, { address: '0x33c634', value: 20 });
  assert.deepEqual(oracle.stateFields, ['state', 'enabled', 'capture', 'heldCount', 'select', 'decide', 'pose', 'nativeLocalY', 'longPressFlag']);
  assert.deepEqual(oracle.controllerFields, ['currentFrame', 'appliedFrame', 'status', 'directionMode', 'bindingEnabled']);
  const ordinary = readFileSync(new URL('./fixtures/home-tile-widget.json', import.meta.url));
  assert.equal(createHash('sha256').update(ordinary).digest('hex'), 'e231f4260600ce347d8776058c26ecf3c85e4b5ea535b1b2a18439aca564f3a1');
});

for (const source of oracle.cases) test(`original ARM long-press phases: ${source.id}`, () => {
  let widget = createHomeTileWidget();
  assert.deepEqual(snapshot(widget), source.before);
  const observed = [];
  for (const row of source.rows) {
    const label = `${source.id} pass${row.pass}`;
    const input = Object.fromEntries(oracle.inputFields.map((key, i) => [key, row.input[i]]));
    const result = checkedCall(widget, value => updateHomeTileWidgetInput(value, input));
    assert.equal(result.unsupportedLongPress, false, label);
    assert.deepEqual(events(result), row.events, `${label} ordered widget events`);
    observed.push(...events(result));
    widget = result.state;
    assert.deepEqual(snapshot(widget), row.afterInput, `${label} input`);
    assert.equal(Number(input.globalCapture || widget.capture), row.globalAfterInput, `${label} initial capture scan`);
    if (row.advance2D) {
      assert.equal(row.stop, null);
      widget = checkedCall(widget, advanceHomeTileWidget2D);
    } else {
      assert.equal(row, source.rows.at(-1), `${label} source stops here`);
      assert.ok(['pickup-resource', 'ordinary-open'].includes(row.stop));
      assert.equal(row.events.at(-1), row.stop === 'pickup-resource' ? 3 : 1);
      assert.equal(row.hostOpenCues, row.stop === 'ordinary-open' ? 1 : 0);
      assert.deepEqual(row.after2D, row.afterInput, `${label} no later2D was executed`);
    }
    assert.deepEqual(snapshot(widget), row.after2D, `${label} completed2D or input stop`);
    const writers = row.advance2D ? ['select', 'decide'].filter(name => widget[name].bindingEnabled)
      .map(name => [name, widget[name].appliedFrame, poseY({ clip: name, frame: widget[name].appliedFrame })]) : [];
    assert.deepEqual(writers, row.writes, `${label} Select then Decide writes`);
  }
  if (source.id.startsWith('holds')) {
    const occupied = source.sourceLabels.occupied;
    assert.deepEqual(observed, occupied ? ['touch', 0, 3] : ['touch', 0, 3, 4]);
    const h21 = source.rows.find(row => row.pass === 21);
    assert.deepEqual(h21.afterInput[4], [0, 1, 1, 1, 1]);
    assert.deepEqual(h21.after2D[4], occupied ? [0, 1, 1, 1, 1] : [0, 0, 2, 1, 1]);
    assert.equal(h21.advance2D, !occupied);
    if (!occupied) {
      const [release, ownClear, globalClear] = source.rows.slice(-3);
      assert.deepEqual([release.afterInput[0], release.afterInput[2], release.afterInput[8]], [0, 1, 0]);
      assert.deepEqual([ownClear.afterInput[2], ownClear.globalAfterInput, globalClear.globalAfterInput], [0, 1, 0]);
      assert.equal(widget.decide.appliedFrame, null, 'vacant callback4 never starts Decide');
    }
  } else {
    assert.deepEqual(observed, ['touch', 0, 1], 'release before increment remains ordinary acceptance');
    const releasePass = source.sourceLabels.releaseAfterHeldCount + 1;
    const release = source.rows.find(row => row.pass === releasePass);
    assert.equal(release.afterInput[0], 2);
    assert.equal(release.afterInput[8], 0);
    assert.equal(source.rows.at(-1).pass, releasePass + 3, 'callback1 accepts at R+3');
    if (source.sourceLabels.releaseAfterHeldCount === 20) {
      assert.deepEqual(release.writes, [['select', 0, 0], ['decide', 0, -2]]);
      assert.deepEqual(release.after2D[6], ['decide', 0]);
    }
  }
});

function vacantH21() {
  let widget = advanceHomeTileWidget2D(sample(createHomeTileWidget(), true, false).state);
  for (let held = 1; held <= 21; held++) widget = advanceHomeTileWidget2D(sample(widget, true, true).state);
  assert.equal(widget.longPressFlag, true);
  return widget;
}

// Static leaf composition: the16 source sequences always supply inside=true,
// and do not execute reset/enable with flag1. These are not extra native traces.
test('static flag1 branch ignores hit and count, and requires the release edge for callback4', () => {
  const widget = vacantH21();
  for (const [current, previous] of [[true, true], [true, false], [false, false]]) {
    const held = checkedCall(widget, value => sample(value, current, previous, false));
    assert.equal(held.state, widget);
    assert.deepEqual(held.events, []);
  }
  const release = checkedCall(widget, value => sample(value, false, true, false));
  assert.deepEqual(events(release), [4]);
  assert.deepEqual([release.state.state, release.state.longPressFlag, release.state.heldCount, release.state.capture], [0, false, 0, true]);
  assert.equal(release.state.decide, widget.decide);
  assert.equal(release.state.select, widget.select);
  assert.equal(release.state.pose, widget.pose);
});

test('static reset leaf preserves flag1 until eligible state0 input clears it', () => {
  const widget = vacantH21();
  const reset = checkedCall(widget, resetHomeTileWidget);
  assert.deepEqual([reset.state, reset.longPressFlag, reset.capture, reset.heldCount], [0, true, true, 0]);
  const idle = checkedCall(reset, value => sample(value, false, false));
  assert.deepEqual(events(idle), []);
  assert.deepEqual([idle.state.longPressFlag, idle.state.capture, idle.state.heldCount], [false, false, 0]);
  const press = checkedCall(reset, value => sample(value, true, false));
  assert.deepEqual(events(press), ['touch', 0]);
  assert.deepEqual([press.state.state, press.state.longPressFlag, press.state.capture], [1, false, true]);
});

test('static enable leaf preserves flag1 while clearing capture; disabled/global gates defer release', () => {
  const widget = vacantH21();
  const disabled = checkedCall(widget, value => setHomeTileWidgetEnabled(value, false));
  assert.equal(disabled.longPressFlag, true);
  assert.equal(disabled.capture, false);
  assert.equal(sample(disabled, false, true, false).state, disabled);
  const enabled = checkedCall(disabled, value => setHomeTileWidgetEnabled(value, true));
  assert.equal(enabled.longPressFlag, true);
  assert.equal(sample(enabled, false, true, false, true).state, enabled);
  const release = checkedCall(enabled, value => sample(value, false, true, false, false));
  assert.deepEqual(events(release), [4]);
  assert.equal(release.state.capture, false, 'flag1 release does not reacquire capture');
  const sameEnabled = checkedCall(widget, value => setHomeTileWidgetEnabled(value, true));
  assert.equal(sameEnabled.capture, false);
  assert.equal(sameEnabled.longPressFlag, true);
});
