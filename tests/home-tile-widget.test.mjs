import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  createHomeTileWidget, setHomeTileWidgetEnabled, resetHomeTileWidget,
  updateHomeTileWidgetInput, advanceHomeTileWidget2D,
} from '../src/os/home-tile-widget.ts';

const oracle = JSON.parse(readFileSync(new URL('./fixtures/home-tile-widget.json', import.meta.url)));
const input = (current, previous, inside = true, globalCapture = false) => ({ current, previous, inside, globalCapture });
const sample = (widget, current, previous, inside = true, globalCapture = widget.capture) =>
  updateHomeTileWidgetInput(widget, input(current, previous, inside, globalCapture));
const poseY = pose => !pose ? 0 : pose.clip === 'select' ? (pose.frame === 0 ? 0 : -2) : (pose.frame === 0 ? -2 : 0);
const controller = value => [value.currentFrame, value.appliedFrame, value.status,
  value.direction === 'forward' ? 0 : 1, Number(value.bindingEnabled)];
const snapshot = widget => [widget.state, Number(widget.enabled), Number(widget.capture), widget.heldCount,
  controller(widget.select), controller(widget.decide), widget.pose && [widget.pose.clip, widget.pose.frame], poseY(widget.pose)];
const events = result => result.events.map(event => event.kind === 'cue' ? event.cue : event.value);
function immutable(value) {
  if (!value || typeof value !== 'object') return;
  assert.ok(Object.isFrozen(value)); Object.values(value).forEach(immutable);
}
function checkedCall(widget, fn) {
  const before = structuredClone(widget), result = fn(widget);
  assert.deepEqual(widget, before, 'previous widget snapshot remains unchanged');
  immutable(result); return result;
}

test('compact oracle retains all43 source cases and305 input/2D pass boundaries', () => {
  assert.equal(oracle.cases.length, 43);
  assert.equal(oracle.cases.reduce((n, item) => n + item.rows.length, 0), 305);
  assert.equal(oracle.provenance.resultsSHA256, '66b6f7fc4ae96bd03b531449e9f65a51ef1ca28d035ff1c9693bcd74cffe2174');
  assert.equal(oracle.provenance.excerptsVerified, 40);
  assert.deepEqual(oracle.stateFields, ['state', 'enabled', 'capture', 'heldCount', 'select', 'decide', 'pose', 'nativeLocalY']);
  assert.deepEqual(oracle.controllerFields, ['currentFrame', 'appliedFrame', 'status', 'directionMode', 'bindingEnabled']);
});

for (const source of oracle.cases) test(`original ARM widget phases: ${source.id}`, () => {
  let widget = createHomeTileWidget();
  if (!source.before[1]) widget = setHomeTileWidgetEnabled(widget, false);
  assert.equal(widget.longPressFlag, false);
  assert.deepEqual(snapshot(widget), source.before);
  for (const row of source.rows) {
    const label = `${source.id} pass${row.pass}`;
    for (const operation of row.operations) {
      widget = checkedCall(widget, value => operation.action === 'reset' ? resetHomeTileWidget(value)
        : operation.action === 'disable' ? setHomeTileWidgetEnabled(value, false)
          : operation.action === 'enable' ? setHomeTileWidgetEnabled(value, true) : value);
      // External selection/mapping/record/context mutations have no widget API.
      if (operation.expected) assert.deepEqual(snapshot(widget), operation.expected, `${label} ${operation.action}`);
      if (operation.action === 'reset') assert.deepEqual(operation.writes, [['select', 0, 0]]);
    }
    const supplied = Object.fromEntries(oracle.inputFields.map((key, i) => [key, row.input[i]]));
    const result = row.traversed ? checkedCall(widget, value => updateHomeTileWidgetInput(value, supplied))
      : { state: widget, events: [], unsupportedLongPress: false };
    assert.equal(result.unsupportedLongPress, false, label);
    assert.deepEqual(events(result), row.events, `${label} cue/callback order`);
    widget = result.state;
    assert.equal(widget.longPressFlag, false, `${label} short input leaves flag clear`);
    assert.deepEqual(snapshot(widget), row.afterInput, `${label} input`);
    // Host starts with the capture scan; a new press sets it, while clearing
    // own capture does not retroactively undo the already completed scan.
    if (row.traversed) assert.equal(Number(supplied.globalCapture || widget.capture), row.globalAfterInput, `${label} capture scan`);
    if (row.advance2D) widget = checkedCall(widget, advanceHomeTileWidget2D);
    else {
      assert.equal(row.hostOpenCues, 1, `${label} stopped at host opening handoff`);
      assert.equal(row.events.at(-1), 1, `${label} host acts on input callback1`);
    }
    assert.deepEqual(snapshot(widget), row.after2D, `${label} later2D or stopped pass`);
    assert.equal(widget.longPressFlag, false, `${label} short2D leaves flag clear`);
    const writers = row.advance2D ? ['select', 'decide'].filter(name => widget[name].bindingEnabled)
      .map(name => [name, widget[name].appliedFrame, poseY({ clip: name, frame: widget[name].appliedFrame })]) : [];
    assert.deepEqual(writers, row.writes, `${label} actual enabled binding writes`);
  }
});

test('quick release waits through Decide status2 and idle2D before input emits callback1', () => {
  let result = sample(createHomeTileWidget(), true, false);
  assert.deepEqual(result.events, [{ kind: 'cue', cue: 'touch' }, { kind: 'callback', value: 0 }]);
  assert.equal(result.state.pose, null, 'start has not applied a frame');
  let widget = advanceHomeTileWidget2D(result.state);
  result = sample(widget, false, true);
  assert.deepEqual(result.events, []);
  assert.equal(result.state.state, 2);
  assert.deepEqual(result.state.pose, { clip: 'select', frame: 0 }, 'release does not apply Decide synchronously');
  widget = advanceHomeTileWidget2D(result.state);
  assert.equal(widget.select.bindingEnabled, true);
  assert.equal(widget.decide.bindingEnabled, true);
  assert.deepEqual(widget.pose, { clip: 'decide', frame: 0 }, 'Decide is the last of two actual writers');
  widget = advanceHomeTileWidget2D(sample(widget, false, false).state);
  assert.equal(widget.decide.status, 2);
  assert.deepEqual(widget.pose, { clip: 'decide', frame: 1 });
  result = sample(widget, false, false);
  assert.deepEqual(result.events, [], 'terminal submitted status2 is still busy');
  widget = advanceHomeTileWidget2D(result.state);
  assert.equal(widget.decide.status, 0);
  result = sample(widget, false, false);
  assert.deepEqual(result.events, [{ kind: 'callback', value: 1 }]);
  assert.equal(result.state.state, 0);
  assert.equal(result.state.capture, true, 'acceptance leaves capture owned');
  const idle = sample(result.state, false, false, true, true);
  assert.equal(idle.state.capture, false, 'next idle input clears own capture');
  assert.equal(idle.state.pose, result.state.pose);
});

test('disabled input, global capture and skipped traversal are independent from2D completion', () => {
  let widget = advanceHomeTileWidget2D(sample(createHomeTileWidget(), true, false).state);
  const gated = sample(widget, true, true, true, true);
  assert.equal(gated.state.heldCount, 1, 'own capture passes the global gate');
  const releasedCapture = setHomeTileWidgetEnabled(widget, true);
  assert.equal(releasedCapture.capture, false, 'same enable value still clears capture');
  assert.equal(sample(releasedCapture, true, true, true, true).state, releasedCapture);
  const disabled = setHomeTileWidgetEnabled(widget, false);
  assert.equal(sample(disabled, false, true).state, disabled);
  assert.equal(advanceHomeTileWidget2D(disabled).select.status, 2, 'input disabled does not freeze2D');
  // A skipped producer call changes neither widget state nor held count.
  widget = advanceHomeTileWidget2D(widget);
  assert.equal(widget.state, 1);
  assert.equal(widget.heldCount, 0);
  assert.equal(widget.select.status, 2);
});

test('reset writes Select0 immediately and never reapplies disabled Decide history', () => {
  let widget = advanceHomeTileWidget2D(sample(createHomeTileWidget(), true, false).state);
  widget = advanceHomeTileWidget2D(sample(widget, false, true).state);
  assert.deepEqual(widget.pose, { clip: 'decide', frame: 0 });
  const reset = resetHomeTileWidget(widget);
  assert.equal(reset.state, 0);
  assert.equal(reset.capture, true);
  assert.equal(reset.enabled, true);
  assert.deepEqual(reset.pose, { clip: 'select', frame: 0 });
  assert.deepEqual(controller(reset.select), [0, 0, 2, 0, 0]);
  assert.deepEqual(controller(reset.decide), [1, 0, 2, 0, 0]);
  const next = advanceHomeTileWidget2D(reset);
  assert.equal(next.decide.appliedFrame, 1, 'stopped status2 still submits its current frame');
  assert.equal(next.decide.bindingEnabled, false);
  assert.equal(next.pose, reset.pose, 'that disabled submission writes no pane');
  assert.deepEqual(sample(next, false, false).events, []);
});

test('leave and held reentry reverse/restart Select without a second touch cue or callback0', () => {
  let widget = advanceHomeTileWidget2D(sample(createHomeTileWidget(), true, false).state);
  let result = sample(widget, true, true, false);
  assert.deepEqual(result.events, [{ kind: 'callback', value: 2 }]);
  assert.equal(result.state.state, 3);
  assert.equal(result.state.select.direction, 'reverse');
  assert.equal(result.state.select.currentFrame, 1);
  widget = advanceHomeTileWidget2D(result.state);
  assert.deepEqual(widget.pose, { clip: 'select', frame: 1 });
  result = sample(widget, true, true);
  assert.deepEqual(result.events, []);
  assert.equal(result.state.state, 1);
  assert.equal(result.state.select.direction, 'forward');
  assert.equal(result.state.select.currentFrame, 0);
  assert.equal(result.state.select.appliedFrame, 1, 'restart preserves previously applied frame');
  assert.deepEqual(advanceHomeTileWidget2D(result.state).pose, { clip: 'select', frame: 0 });
});

test('H20 reverses Select and H21 emits callback3 without synchronously applying a pose', () => {
  let widget = advanceHomeTileWidget2D(sample(createHomeTileWidget(), true, false).state);
  for (let count = 1; count < 20; count++) {
    const result = sample(widget, true, true);
    assert.equal(result.unsupportedLongPress, false);
    assert.equal(result.state.heldCount, count);
    assert.deepEqual(result.events, []);
    widget = advanceHomeTileWidget2D(result.state);
  }
  const boundary = sample(widget, true, true);
  assert.equal(boundary.unsupportedLongPress, false);
  assert.equal(boundary.state.heldCount, 20);
  assert.equal(boundary.state.longPressFlag, false);
  assert.deepEqual(controller(boundary.state.select), [1, 1, 1, 1, 1]);
  assert.equal(boundary.state.pose, widget.pose);
  assert.deepEqual(boundary.events, []);
  widget = advanceHomeTileWidget2D(boundary.state);
  assert.deepEqual(controller(widget.select), [0, 1, 1, 1, 1]);
  const pastBoundary = sample(widget, true, true);
  assert.equal(pastBoundary.unsupportedLongPress, false);
  assert.equal(pastBoundary.state.longPressFlag, true);
  assert.equal(pastBoundary.state.heldCount, 0);
  assert.equal(pastBoundary.state.capture, true);
  assert.equal(pastBoundary.state.select, widget.select);
  assert.equal(pastBoundary.state.decide, widget.decide);
  assert.equal(pastBoundary.state.pose, widget.pose);
  assert.deepEqual(events(pastBoundary), [3]);
  const reset = resetHomeTileWidget(boundary.state);
  assert.equal(reset.heldCount, 20, 'native reset preserves held count until idle input');
  assert.equal(sample(reset, false, false).state.heldCount, 0);
});

test('public operations reject malformed input and retain immutable results', () => {
  const widget = createHomeTileWidget(); immutable(widget);
  for (const key of ['current', 'previous', 'inside', 'globalCapture']) {
    assert.throws(() => updateHomeTileWidgetInput(widget, { ...input(false, false), [key]: 1 }), /Invalid HOME tile/);
  }
  assert.throws(() => setHomeTileWidgetEnabled(widget, 1), /Invalid HOME tile enabled/);
  for (const bad of [{ ...widget, state: 4 }, { ...widget, heldCount: -1 }, { ...widget, heldCount: 1.5 },
    { ...widget, longPressFlag: 1 },
    { ...widget, select: { ...widget.select, currentFrame: 2 } }, { ...widget, pose: { clip: 'select', frame: NaN } }]) {
    assert.throws(() => advanceHomeTileWidget2D(bad), /Invalid HOME tile/);
  }
  assert.equal(advanceHomeTileWidget2D(widget), widget);
  assert.equal(setHomeTileWidgetEnabled(widget, true), widget);
});
