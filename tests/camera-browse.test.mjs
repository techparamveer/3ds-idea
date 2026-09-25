import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  CAMERA_BROWSE_UPDATE_MS, CAMERA_DIRECTION_MASK, cameraAnchorPosition, cameraBrowseButton, cameraBrowseCancel, cameraBrowseCommand,
  cameraBrowseInitial, cameraBrowsePaddedCount, cameraBrowseTick, cameraBrowseTouch, cameraKeyCandidate, cameraMaxAnchor, cameraSmoothStep, cameraStripOffset,
  cameraVisibleAnchor,
} from '../src/os/camera-browse.ts';

// Derived by scripts/replay_camera_strip.py from the hash-pinned EUR Camera executable.
const oracle = JSON.parse(readFileSync(new URL('./fixtures/camera-browse-strip.json', import.meta.url)));
const f32 = hex => new Float32Array(new Uint32Array([Number.parseInt(hex, 16)]).buffer)[0];
const directionOf = mask => Object.entries(CAMERA_DIRECTION_MASK).filter(([, bit]) => mask & bit).map(([name]) => name);
const tick = (step, count, updates = 1) => cameraBrowseTick(step, CAMERA_BROWSE_UPDATE_MS * updates, count);

test('oracle provenance is the pinned Camera executable', () => {
  assert.equal(oracle.provenance.codeSha256, '3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c');
  assert.deepEqual(oracle.provenance.masks, { left: 0x100, right: 0x80, up: 0x200, down: 0x400 });
  assert.deepEqual(CAMERA_DIRECTION_MASK, oracle.provenance.masks);
});

test('configured bounds, anchors and padded pages match the original configurator', () => {
  for (const config of oracle.configurations) {
    assert.equal(cameraBrowsePaddedCount(config.itemCount), config.pages * 6);
    assert.equal(cameraMaxAnchor(config.itemCount), config.maxAnchor);
    assert.equal(cameraAnchorPosition(config.maxAnchor + 5, config.itemCount), config.anchorBounds[1]);
    assert.equal(cameraAnchorPosition(0, config.itemCount), config.anchorBounds[0]);
    assert.deepEqual([config.pageWidth, config.margin, config.pitch], [248, 10, 76]);
    assert.equal(Math.fround(0.3), config.fraction);
  }
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(anchor => cameraAnchorPosition(anchor, 30)), [0, 86, 162, 248, 334, 410, 496]);
});

test('float32 smoothing reproduces every replayed output bit and pixel', () => {
  for (const trace of oracle.smoothing) {
    let output = trace.from;
    trace.floatBits.forEach((bits, index) => {
      const target = trace.reverseToZeroAfter !== null && index >= trace.reverseToZeroAfter ? 0 : trace.to;
      output = cameraSmoothStep(output, target);
      assert.equal(output, f32(bits), `${trace.from}→${trace.to} update ${index + 1}`);
      assert.equal(cameraStripOffset(output), trace.pixels[index]);
    });
  }
});

test('visibility helper matches all replayed anchor/selection cases', () => {
  let cases = 0;
  for (const [count, rows] of Object.entries(oracle.visibilityLattice)) {
    for (const [start, index, target] of rows) {
      const anchor = [...Array(cameraMaxAnchor(Number(count)) + 1).keys()].find(a => cameraAnchorPosition(a, Number(count)) === start);
      assert.notEqual(anchor, undefined);
      assert.equal(cameraAnchorPosition(cameraVisibleAnchor(index, anchor, Number(count)), Number(count)), target, `${count}: ${start}/${index}`);
      cases++;
    }
  }
  assert.equal(cases, 564);
});

test('key candidates use padded pages and native left/right/up/down priority', () => {
  assert.equal(cameraKeyCandidate(0, 0x100, 12), null); // unsigned underflow rejected
  assert.equal(cameraKeyCandidate(5, 0x80, 12), 6);
  assert.equal(cameraKeyCandidate(2, 0x80, 12), 3); // right crosses rows
  assert.equal(cameraKeyCandidate(0, 0x200, 12), 3);
  assert.equal(cameraKeyCandidate(3, 0x400, 12), 0);
  assert.equal(cameraKeyCandidate(6, 0x400, 7), 9); // padded blank
  assert.equal(cameraKeyCandidate(11, 0x80, 7), null);
  assert.equal(cameraKeyCandidate(1, 0x180, 12), 0);
  assert.equal(cameraKeyCandidate(0, 0x480, 12), 1);
  assert.equal(cameraKeyCandidate(0, 0x600, 12), 3);
});

test('press, repeat and release sequences reproduce the replayed key handler', () => {
  const sourceOf = direction => 'pad:' + direction;
  for (const [name, sequence] of Object.entries(oracle.sequences)) {
    const count = sequence.itemCount;
    let step = { selection: 0, browse: cameraBrowseInitial() }, held = 0;
    for (const [index, [mask, selection, target, pending, events]] of sequence.steps.entries()) {
      const before = step.browse.preview;
      for (const direction of directionOf(held & ~mask)) step = cameraBrowseButton(step, sourceOf(direction), direction, 'up', count);
      const pressed = directionOf(mask & ~held);
      // A native update with a new press edge is handled at the event; other
      // updates are browser ticks. Simultaneous edges keep native mask priority.
      if (pressed.length === 1) step = cameraBrowseButton(step, sourceOf(pressed[0]), pressed[0], 'down', count);
      else if (pressed.length > 1) {
        for (const direction of pressed) step = { ...step, browse: { ...step.browse, held: { ...step.browse.held, [sourceOf(direction)]: direction }, countdown: 20 } };
        const candidate = cameraKeyCandidate(step.selection, mask & ~held, count);
        assert.notEqual(candidate, null);
        step = { selection: candidate, browse: { ...step.browse, pending: true, anchor: cameraVisibleAnchor(candidate, step.browse.anchor, count) } };
      } else step = tick(step, count);
      held = mask;
      const label = `${name} step ${index + 1}`;
      assert.equal(step.selection, selection, label);
      assert.equal(cameraAnchorPosition(step.browse.anchor, count), target, label);
      assert.equal(step.browse.pending, pending === 1, label);
      if (events.length) {
        assert.equal(step.browse.preview, selection, label);
        assert.equal(events[0], selection < count ? '0x1d' : '0x22', label);
      } else assert.equal(step.browse.preview, before, label);
    }
  }
});

test('ticks drive the strip at nominal 60 Hz and settle without idle churn', () => {
  let step = { selection: 5, browse: cameraBrowseInitial() };
  step = cameraBrowseButton(step, 'keyboard:ArrowRight', 'right', 'down', 8);
  step = cameraBrowseButton(step, 'keyboard:ArrowRight', 'right', 'up', 8);
  assert.equal(step.selection, 6);
  assert.equal(cameraStripOffset(step.browse.output), 0); // input phase follows the smoothing pass
  const offsets = [];
  for (let i = 0; i < 20; i++) { step = tick(step, 8); offsets.push(cameraStripOffset(step.browse.output)); }
  assert.deepEqual(offsets, oracle.smoothing[0].pixels);
  assert.equal(step.browse.preview, 6);
  assert.equal(step.browse.clockMs, 0);
  assert.equal(tick(step, 8), step);
  // Split ticks accumulate to whole updates.
  let split = cameraBrowseCommand({ selection: 5, browse: cameraBrowseInitial() }, 'right', 8);
  split = cameraBrowseTick(split, CAMERA_BROWSE_UPDATE_MS / 2, 8);
  assert.equal(split.browse.output, 0);
  split = cameraBrowseTick(split, CAMERA_BROWSE_UPDATE_MS / 2, 8);
  assert.equal(cameraStripOffset(split.browse.output), 26);
});

test('native repeats replace browser repeat events and a second source is not a new press', () => {
  let step = { selection: 0, browse: cameraBrowseInitial() };
  step = cameraBrowseButton(step, 'pad', 'right', 'down', 30);
  const moved = [1];
  for (let update = 2; update <= 45; update++) {
    const before = step.selection;
    step = cameraBrowseButton(step, 'pad', 'right', 'repeat', 30);
    step = cameraBrowseButton(step, 'keyboard:ArrowRight', 'right', 'down', 30);
    step = tick(step, 30);
    if (step.selection !== before) moved.push(update);
  }
  assert.deepEqual(moved, [1, 21, 25, 29, 33, 37, 41, 45]);
  assert.equal(step.browse.preview, 0);
  step = cameraBrowseButton(step, 'pad', 'right', 'up', 30);
  step = tick(step, 30);
  assert.equal(step.browse.preview, 0, 'another source still holds Right');
  step = cameraBrowseButton(step, 'keyboard:ArrowRight', 'right', 'up', 30);
  step = tick(step, 30);
  assert.equal(step.browse.preview, 8);
});

test('stylus contact skips key handling and holds the pending notification', () => {
  let step = cameraBrowseTouch({ selection: 0, browse: cameraBrowseInitial() }, true);
  const pressed = cameraBrowseButton(step, 'pad', 'right', 'down', 12);
  assert.equal(pressed.selection, 0);
  assert.equal(cameraBrowseCommand(step, 'right', 12), step);
  step = cameraBrowseTouch(cameraBrowseButton({ selection: 0, browse: cameraBrowseInitial() }, 'pad', 'right', 'down', 12), true);
  step = cameraBrowseButton(step, 'pad', 'right', 'up', 12);
  assert.equal(tick(step, 12, 5), step, 'settled while the stylus holds the notification');
  step = tick(cameraBrowseTouch(step, false), 12);
  assert.deepEqual([step.selection, step.browse.preview, step.browse.pending], [1, 1, false]);
});

test('suspension cancels held keys so repeats cannot continue after resume', () => {
  let step = cameraBrowseButton({ selection: 0, browse: cameraBrowseInitial() }, 'pad', 'right', 'down', 30);
  step = cameraBrowseCancel(cameraBrowseTouch(step, true));
  assert.deepEqual([step.browse.held, step.browse.countdown, step.browse.touch], [{}, 0, false]);
  step = tick(step, 30, 40);
  assert.equal(step.selection, 1);
  assert.equal(step.browse.preview, 1);
  assert.equal(cameraBrowseCancel(step), step);
});

test('empty browse ignores directions', () => {
  const step = { selection: 0, browse: cameraBrowseInitial() };
  assert.equal(cameraBrowseCommand(step, 'right', 0).selection, 0);
  assert.equal(cameraBrowseButton(step, 'pad', 'down', 'down', 0).browse.pending, false);
});

test('ring router passes the mapped ready bit without comparing the full logical tag', () => {
  assert.deepEqual(oracle.ringRouterTagCheck, {
    globalIndex: 6, mappingTag: 69, control: 2, readyPassedToWriter: 1, realItem: 1,
  });
  assert.deepEqual(oracle.readyBitsetRewrite, {
    currentPage: 1, itemCount: 7, staleTagsPresent: true, bitsAfterRewrite: '0x7f',
  });
});

test('live Camera navigation, hit targets and painter share the source strip controller', () => {
  for (const file of ['stock-apps.ts', 'stock-native-camera.ts', 'stock-screen-layout.ts']) {
    const text = readFileSync(new URL('../src/os/' + file, import.meta.url), 'utf8');
    assert.equal(text.includes('camera-browse'), true, file);
  }
});
