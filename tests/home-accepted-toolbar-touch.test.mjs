import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHomeNavigation, activeHomeRecord, homeGridMetrics, gridSnapshot } from '../src/os/home-navigation.ts';
import { selectHomeTouchSlot, advanceHomeScroll } from '../src/os/home-scroll-consumer.ts';
import {
  createHomeCursorPresentation, consumeHomeCursorObservation, advanceHomeCursorPresentation,
} from '../src/os/home-cursor-presentation.ts';

const oracle = JSON.parse(readFileSync(new URL('./fixtures/home-accepted-toolbar-touch.json', import.meta.url)));
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
function setup({ folder = false, density = 2, selected = 3, left = 0, focus = 3,
  remembered = -1, saved = -1, counter = 0, directionMask = 0, pendingMask = 0 } = {}) {
  const navigation = createHomeNavigation(density), view = {
    selectedSlot: selected, currentLeftSlot: left, targetLeftSlot: left, density,
  };
  if (folder) { navigation.activeFolderSlot = 40; navigation.folderViews[40] = view; }
  else navigation.rootView = view;
  navigation.focus = { toolbarActive: focus !== -1, currentFocus: focus, rememberedFocus: remembered, savedColumn: saved };
  navigation.mode3 = { entryCount: counter, directionMask, pendingMask };
  return freeze({ navigation, cursorLoop: { currentFrame: 17.25, appliedFrame: 16.25, step: 1 } });
}
const project = result => result.observations.map(o => [o.kind, o.frame ?? null]);
const apply = (presentation, observations) => observations.reduce(consumeHomeCursorObservation, presentation);

test('all five original accepted-touch fragments reproduce departed anchors/Scale and seek-before-effect order', () => {
  assert.equal(oracle.touch.length, 5);
  assert.deepEqual(oracle.initial, { density: 2, selectedSlot: 3, currentLeftSlot: 0, targetLeftSlot: 0 });
  for (const row of oracle.touch) {
    const initial = setup({ focus: row.oldFocus }), before = structuredClone(initial);
    const result = selectHomeTouchSlot(initial, row.newSlot);
    assert.equal(result.disposition, 'handled');
    assert.equal(activeHomeRecord(result.state.navigation).selectedSlot, row.newSlot);
    assert.deepEqual(result.state.navigation.focus,
      { toolbarActive: false, currentFocus: -1, rememberedFocus: -1, savedColumn: -1 });
    assert.deepEqual(project(result), row.oldFocus === -1
      ? [['cursor-select', null]] : [['scale-seek', 2], ['cursor-select', null]]);
    assert.equal(result.observations.every(o => o.updateOffset === null && Object.isFrozen(o)), true);
    const departure = result.observations.at(-1);
    assert.equal(departure.source, 'touch');
    assert.equal(departure.context, null);
    if (row.oldFocus === -1) {
      assert.equal(departure.effectTarget.kind, 'grid');
      assert.equal(departure.effectTarget.slot, 3);
    } else assert.deepEqual(departure.effectTarget,
      { kind: 'toolbar', focus: row.oldFocus, scaleFrame: row.effect.scale.current });

    const primaryScale = row.oldFocus === -1 ? 2 : row.effect.scale.current;
    const presentation = apply(createHomeCursorPresentation(primaryScale), result.observations);
    const effect = presentation.effects[0];
    assert.deepEqual(effect.center, { x: 160 + row.effect.position[0], y: 120 - row.effect.position[1] });
    assert.equal(effect.visible, !!row.effect.visible);
    assert.equal(effect.target.kind === 'grid' ? effect.target.slot : -1, row.effect.slot);
    assert.equal(effect.scale.currentFrame, row.effect.scale.current);
    assert.equal(effect.disappear.currentFrame, row.effect.disappear.current);
    assert.equal(effect.disappear.status, row.effect.disappear.state);
    // The native fixture uses synthetic applied=-999; hidden adapter poses start0.
    assert.equal(effect.scale.appliedFrame, 0);
    assert.equal(effect.disappear.appliedFrame, 0);
    assert.deepEqual(presentation.primaryScale, { currentFrame: 2, appliedFrame: primaryScale });
    assert.equal(presentation.nextEffectIndex, 1);
    assert.equal(result.state.cursorLoop, initial.cursorLoop, 'accepted selection does not submit or seek Loop');
    assert.deepEqual(initial, before, 'frozen input stays unchanged');
    const submitted = advanceHomeCursorPresentation(presentation, 1,
      { primaryWrapperEligible: true, effectWrapperEligible: [true, true] });
    assert.deepEqual(submitted.primaryScale, { currentFrame: 2, appliedFrame: 2 });
    assert.equal(submitted.effects[0].scale.appliedFrame, row.effect.scale.current);
    assert.deepEqual(submitted.effects[0].disappear, { currentFrame: 1, appliedFrame: 0, status: 1 });
  }
});

test('accepted toolbar writes preserve remembered focus and clear saved column, unlike directional return', () => {
  // Additional state compositions; field writes come from the existing excerpt.
  for (const folder of [false, true]) for (const focus of [0, 1, 3, 6, 7]) {
    const initial = setup({ folder, focus, remembered: 5, saved: 2,
      counter: 4, directionMask: 0x30, pendingMask: 0x20 });
    const result = selectHomeTouchSlot(initial, 3), navigation = result.state.navigation;
    assert.deepEqual(navigation.focus, { toolbarActive: false, currentFocus: -1, rememberedFocus: 5, savedColumn: -1 });
    assert.equal(navigation.mode3, initial.navigation.mode3);
    assert.equal(navigation.selectionRevision, initial.navigation.selectionRevision, 'same slot still departs toolbar');
    assert.equal(navigation.motion, null);
    assert.deepEqual(project(result), [['scale-seek', 2], ['cursor-select', null]]);
    assert.equal(result.observations[1].effectTarget.focus, focus);
    assert.equal(result.observations[1].context, folder ? 40 : null);
    assert.equal(result.state.cursorLoop, initial.cursorLoop);
    assert.ok(Object.isFrozen(navigation.focus));
  }
  const grid = setup({ focus: -1, remembered: 5, saved: 2 });
  const selected = selectHomeTouchSlot(grid, 8);
  assert.equal(selected.state.navigation.focus, grid.navigation.focus, 'grid-only fragment does not write focus fields');
  assert.deepEqual(project(selected), [['cursor-select', null]]);
});

test('toolbar departure precedes root/folder viewport correction across all densities and acceleration boundaries', () => {
  // Composition coverage, not additional native executions. Keep the source
  // accepted fragment's observations before the already-proved correction.
  for (const folder of [false, true]) for (const density of [0, 1, 2, 3, 4, 5]) {
    const { rows, columns } = homeGridMetrics(folder, density), left = rows;
    for (const counter of [0, 4, 5]) for (const side of ['before', 'first', 'last', 'after']) {
      const slot = { before: left - 1, first: left, last: left + rows * columns - 1, after: left + rows * columns }[side];
      const initial = setup({ folder, density, selected: left, left, focus: 6, counter, remembered: 4, saved: 1 });
      const result = selectHomeTouchSlot(initial, slot), state = result.state;
      const correction = side === 'before' || side === 'after';
      assert.deepEqual(project(result), [
        ['scale-seek', density], ['cursor-select', null], ...(correction ? [['mode3-entry', null]] : []),
      ]);
      assert.equal(result.observations.some(o => o.kind === 'cue'), false);
      assert.deepEqual(result.observations[1].effectTarget, { kind: 'toolbar', focus: 6, scaleFrame: 12 });
      assert.equal(result.observations[1].slot, slot);
      assert.equal(state.navigation.focus.rememberedFocus, 4);
      assert.equal(state.navigation.mode3.directionMask, 0);
      assert.equal(state.navigation.mode3.pendingMask, 0);
      assert.equal(state.cursorLoop.currentFrame, initial.cursorLoop.currentFrame);
      assert.equal(state.cursorLoop.appliedFrame, initial.cursorLoop.appliedFrame);
      if (!correction) {
        assert.equal(state.navigation.motion, null);
        assert.equal(state.navigation.mode3.entryCount, counter);
        assert.equal(state.cursorLoop.step, 1);
        continue;
      }
      const duration = counter < 5 ? 10 : 5, target = side === 'before' ? 0 : 2 * rows;
      assert.deepEqual(result.observations[2],
        { kind: 'mode3-entry', cause: 'touch', durationUpdates: duration, targetLeftSlot: target, updateOffset: null });
      assert.equal(state.navigation.motion.elapsedUpdates, 0);
      assert.equal(state.navigation.mode3.entryCount, Math.min(5, counter + 1));
      assert.equal(state.cursorLoop.step, counter < 5 ? 1 : 3);
      const finished = advanceHomeScroll(state, duration);
      assert.equal(activeHomeRecord(finished.state.navigation).currentLeftSlot, target);
      assert.equal(finished.state.navigation.motion, null);
      assert.equal(finished.observations.length, 1);
      assert.equal(finished.observations[0].kind, 'banner-resolve');
      assert.equal(finished.observations[0].slot, slot);
    }
  }
});

test('touch reuses one departed-effect slot without clearing the other or submitting either controller', () => {
  const first = selectHomeTouchSlot(setup({ focus: 0 }), 8);
  let presentation = apply(createHomeCursorPresentation(10), first.observations);
  presentation = advanceHomeCursorPresentation(presentation, 4,
    { primaryWrapperEligible: true, effectWrapperEligible: [true, true] });
  const effect0 = presentation.effects[0];
  const second = selectHomeTouchSlot(setup({ focus: 7 }), 8);
  presentation = apply(presentation, second.observations);
  assert.equal(presentation.effects[0], effect0);
  assert.deepEqual(presentation.effects[1].target, { kind: 'toolbar', focus: 7, scaleFrame: 12 });
  assert.equal(presentation.nextEffectIndex, 0);
  const effect1 = presentation.effects[1];
  presentation = apply(presentation, first.observations);
  assert.equal(presentation.effects[1], effect1);
  assert.equal(presentation.effects[0].scale.appliedFrame, effect0.scale.appliedFrame);
  assert.equal(presentation.effects[0].disappear.appliedFrame, effect0.disappear.appliedFrame);
  assert.equal(presentation.effects[0].disappear.currentFrame, 0);
});

test('busy and gesture routes remain unsupported without mutation; invalid accepted slots/focus throw', () => {
  const initial = setup();
  const busy = freeze({ ...initial, navigation: { ...initial.navigation, motion: {
    mode: 3, durationUpdates: 10, elapsedUpdates: 2, currentDensity: 2, targetDensity: 2,
    fromGeometry: gridSnapshot(false, 2, 0), targetGeometry: gridSnapshot(false, 2, 3),
  } } });
  const gesture = freeze({ ...initial, navigation: { ...initial.navigation, gesture: { mode: 'press' } } });
  for (const state of [busy, gesture]) for (const slot of [8, -1]) {
    const result = selectHomeTouchSlot(state, slot);
    assert.equal(result.disposition, 'unsupported');
    assert.equal(result.state.navigation, state.navigation);
    assert.equal(result.state.cursorLoop, state.cursorLoop);
    assert.deepEqual(result.observations, []);
  }
  for (const folder of [false, true]) for (const slot of [-1, 1.5, NaN, Infinity, folder ? 60 : 300]) {
    assert.throws(() => selectHomeTouchSlot(setup({ folder }), slot), /Invalid HOME tile slot/);
  }
  for (const focus of [-1, 8, 1.5, NaN, Infinity]) {
    const invalid = freeze({ ...initial, navigation: { ...initial.navigation,
      focus: { ...initial.navigation.focus, toolbarActive: true, currentFocus: focus } } });
    assert.throws(() => selectHomeTouchSlot(invalid, 8), /Invalid HOME toolbar focus/);
  }
});
