import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sampleHomeEntryMotion, sampleHomeEntryMotionCandidate, acknowledgeHomeEntryMotionCandidate, homeEntryMotionActive, homeFolderEntryPose, homePauseEntryPresentation, HOME_ENTRY_MAX_OBSERVED_UPDATE_GAP } from '../src/os/home-entry-motion.ts';
import { poseNativeLayout, nativePaneParentPath } from '../src/os/native-layout.ts';
import { suspendedBackgroundPlayback } from '../src/scene/home-suspended-background.ts';

const folder = { kind: 'folder', folder: 'folder:7' };
const pause = { kind: 'pause', owner: 'health:1', captureGeneration: 3 };
const launcher = JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/home/launcher.json', import.meta.url)));
const background = JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/models/home-background/model.json', import.meta.url)));

test('folder entry samples every authored pose and retains each independent endpoint', () => {
  assert.equal(launcher.animations.LncFolder_00_FadeIn.frames, 17);
  assert.equal(launcher.animations.LncFolderCapture_00_Fade.frames, 9);
  const start = sampleHomeEntryMotion(null, folder, 100, true);
  let sampled = start;
  for (let update = 0; update <= 30; update++) {
    sampled = sampleHomeEntryMotion(sampled, folder, 100 + update, true);
    assert.deepEqual(homeFolderEntryPose(sampled), { folderFrame: Math.min(16, update), captureFrame: Math.min(8, update) });
  }
  assert.equal(sampleHomeEntryMotion(start, folder, 100, true), start);
});

test('source parent transforms animate both occupied and blank folder children', () => {
  const first = poseNativeLayout(launcher.layouts.LncFolder_00, launcher.animations, [{ name: 'LncFolder_00_FadeIn', frame: 0 }]);
  const last = poseNativeLayout(launcher.layouts.LncFolder_00, launcher.animations, [{ name: 'LncFolder_00_FadeIn', frame: 16 }]);
  for (const name of ['N_Dlg_00', 'N_BlankAnime_00']) {
    const initial = nativePaneParentPath(first, name), terminal = nativePaneParentPath(last, name);
    assert.ok(initial.reduce((value, pane) => value * pane.scale[0], 1) < 1);
    assert.equal(initial.reduce((value, pane) => value * pane.alpha / 255, 1), 0);
    assert.equal(terminal.reduce((value, pane) => value * pane.scale[0], 1), 1);
    assert.equal(terminal.reduce((value, pane) => value * pane.alpha / 255, 1), 1);
  }
});

test('inhibited updates freeze entry and do not become catch-up work on resume', () => {
  const start = sampleHomeEntryMotion(null, folder, 20, true);
  const moving = sampleHomeEntryMotion(start, folder, 24, true);
  const hidden = sampleHomeEntryMotion(moving, folder, 60, false);
  assert.deepEqual(homeFolderEntryPose(hidden), { folderFrame: 4, captureFrame: 4 });
  const resumed = sampleHomeEntryMotion(hidden, folder, 61, true);
  assert.deepEqual(homeFolderEntryPose(resumed), { folderFrame: 5, captureFrame: 5 });
  assert.equal(sampleHomeEntryMotion(null, folder, 20, false), null);
});

test('folder replacement and a new complete application capture each start fresh motion', () => {
  const current = sampleHomeEntryMotion(sampleHomeEntryMotion(null, folder, 0, true), folder, 5, true);
  assert.equal(sampleHomeEntryMotion(current, { ...folder, folder: 'folder:8' }, 9, true).elapsedUpdates, 0);
  const suspended = sampleHomeEntryMotion(null, pause, 90, true);
  const moving = sampleHomeEntryMotion(suspended, pause, 95, true);
  for (const next of [{ ...pause, owner: 'health:2' }, { ...pause, captureGeneration: 4 }]) {
    assert.equal(sampleHomeEntryMotion(moving, next, 96, true).elapsedUpdates, 0);
  }
  assert.equal(sampleHomeEntryMotion(moving, null, 96, true), null);
});

test('pause entry advances the original SceneIn geometry with AppPause scale and tint without an AppQuit override', () => {
  const sceneIn = background.skeletalAnimations.find(animation => animation.Name === 'BannerBG_SceneIn');
  assert.equal(sceneIn.FramesCount, 20);
  assert.equal(sceneIn.AnimationFlags, '0');
  const clip = background.materialAnimations.find(animation => animation.Name === 'BannerBG_AppPause');
  assert.equal(clip.FramesCount, 20);
  assert.equal(clip.AnimationFlags, '0');
  const scale = clip.Elements.find(element => element.TargetType === 'MaterialTexCoord0Scale').Content.X;
  assert.deepEqual(scale.KeyFrames.map(key => [key.Frame, key.Value]), [[0, 1], [1, 1.002], [2, 1], [5, .98], [10, .93], [15, .89], [19, .87]]);
  const start = sampleHomeEntryMotion(null, pause, 60, true);
  let sampled = start;
  for (let update = 0; update <= 40; update++) {
    sampled = sampleHomeEntryMotion(sampled, pause, 60 + update, true);
    const presentation = homePauseEntryPresentation(sampled);
    assert.deepEqual(suspendedBackgroundPlayback(presentation), {
      skeletal: [{ name: 'BannerBG_SceneIn', frame: Math.min(20, update) }],
      material: [{ name: 'BannerBG_AppPause', frame: Math.min(20, update) }],
    });
  }
});

test('browser stall policy rebases large gaps while folder and pause preserve their distinct cadence policies', () => {
  assert.equal(HOME_ENTRY_MAX_OBSERVED_UPDATE_GAP, 6);
  for (const [identity, expected] of [[folder, [3, 9, 12]], [pause, [1, 2, 3]]]) {
    const start = sampleHomeEntryMotion(null, identity, 100, true);
    const moving = sampleHomeEntryMotion(start, identity, 103, true);
    const normal = sampleHomeEntryMotion(moving, identity, 109, true);
    assert.equal(moving.elapsedUpdates, expected[0]);
    assert.equal(normal.elapsedUpdates, expected[1]);
    const stall = sampleHomeEntryMotion(normal, identity, 2000, true);
    assert.equal(stall.elapsedUpdates, expected[1]);
    assert.equal(stall.observedUpdate, 2000);
    assert.equal(sampleHomeEntryMotion(stall, identity, 2000, true), stall);
    const resumed = sampleHomeEntryMotion(stall, identity, 2003, true);
    assert.equal(resumed.elapsedUpdates, expected[2]);
    const anotherStall = sampleHomeEntryMotion(resumed, identity, 2010, true);
    assert.equal(anotherStall.elapsedUpdates, expected[2], 'threshold plus one is inhibited');
    assert.equal(sampleHomeEntryMotion(anotherStall, null, 2011, true), null);
    const fresh = sampleHomeEntryMotion(null, identity, 2012, true);
    assert.equal(fresh.elapsedUpdates, 0, 'a repeated entry starts from zero instead of the old midpoint');
  }
});

test('reduced motion chooses source endpoints without mutating the normal samples', () => {
  const folderMotion = sampleHomeEntryMotion(null, folder, 40, true);
  const pauseMotion = sampleHomeEntryMotion(null, pause, 40, true);
  assert.deepEqual(homeFolderEntryPose(folderMotion, true), { folderFrame: 16, captureFrame: 8 });
  assert.equal(homePauseEntryPresentation(pauseMotion, true).skeletal[0].frame, 20);
  assert.equal(homePauseEntryPresentation(pauseMotion, true).material[0].frame, 20);
  assert.deepEqual(homeFolderEntryPose(folderMotion), { folderFrame: 0, captureFrame: 0 });
  assert.equal(homePauseEntryPresentation(pauseMotion).skeletal[0].frame, 0);
  assert.equal(homePauseEntryPresentation(pauseMotion).material[0].frame, 0);
  assert.equal(homeFolderEntryPose(pauseMotion), null);
  assert.equal(homePauseEntryPresentation(folderMotion), null);
});

test('owner-bound candidates retain the selected pair until receipt and drop offscreen elapsed time', () => {
  for (const identity of [folder, pause]) {
    const candidate = sampleHomeEntryMotionCandidate(null, null, identity, 100, true);
    for (const update of [103, 500, 5000]) assert.equal(sampleHomeEntryMotionCandidate(null, candidate, identity, update, true), candidate);
    assert.equal(acknowledgeHomeEntryMotionCandidate(candidate, identity, 5000, false), null);
    assert.equal(acknowledgeHomeEntryMotionCandidate(candidate, identity, 99, true), null);
    const other = identity.kind === 'folder' ? { ...identity, folder: 'other' } : { ...identity, captureGeneration: 9 };
    assert.equal(acknowledgeHomeEntryMotionCandidate(candidate, other, 5000, true), null);
    const presented = acknowledgeHomeEntryMotionCandidate(candidate, identity, 5000, true);
    assert.equal(presented.elapsedUpdates, 0);
    assert.equal(presented.observedUpdate, 5000);
    assert.equal(homeEntryMotionActive(presented), true);
    const next = sampleHomeEntryMotionCandidate(presented, null, identity, 5001, true);
    assert.equal(next.elapsedUpdates, 1, 'only the HOME update after publication spends phase');
    assert.equal(homeEntryMotionActive(next, true), false);
  }
});

test('folder cadence follows eligible 60, 30 and 20 FPS-style HOME deltas', () => {
  for (const [fps, gap, expected] of [
    [60, 1, Array.from({ length: 17 }, (_value, frame) => frame)],
    [30, 2, [0, 2, 4, 6, 8, 10, 12, 14, 16]],
    [20, 3, [0, 3, 6, 9, 12, 15, 16]],
  ]) {
    let presented = null, update = 100;
    const actual = [];
    while (!presented || homeEntryMotionActive(presented)) {
      const candidate = sampleHomeEntryMotionCandidate(presented, null, folder, update, true);
      actual.push(homeFolderEntryPose(candidate).folderFrame);
      assert.equal(sampleHomeEntryMotionCandidate(presented, candidate, folder, update + gap, true), candidate);
      presented = acknowledgeHomeEntryMotionCandidate(candidate, folder, update, true);
      update += gap;
    }
    assert.deepEqual(actual, expected, `${fps} FPS-style receipts`);
  }
});

test('pause cadence remains one source step per eligible receipt across ordinary HOME deltas', () => {
  let sampled = sampleHomeEntryMotion(null, pause, 100, true);
  for (const [receipt, gap] of [1, 2, 3, 6].entries()) {
    sampled = sampleHomeEntryMotion(sampled, pause, sampled.observedUpdate + gap, true);
    assert.equal(sampled.elapsedUpdates, receipt + 1);
  }
});

test('revoked pairs rebase the last receipt-backed pose and reduced candidates terminalize only through a receipt', () => {
  for (const identity of [folder, pause]) {
    const start = sampleHomeEntryMotionCandidate(null, null, identity, 100, true);
    let presented = acknowledgeHomeEntryMotionCandidate(start, identity, 100, true);
    const unpresented = sampleHomeEntryMotionCandidate(presented, null, identity, 102, true);
    assert.equal(unpresented.elapsedUpdates, identity.kind === 'folder' ? 2 : 1);
    const resumed = sampleHomeEntryMotionCandidate(presented, null, identity, 104, true, true);
    assert.equal(resumed.elapsedUpdates, 0, 'brief invalid interval must discard the unpresented pose');
    presented = acknowledgeHomeEntryMotionCandidate(resumed, identity, 105, true);
    const reduced = sampleHomeEntryMotionCandidate(presented, null, identity, 106, true, true, true);
    assert.equal(reduced.elapsedUpdates, identity.kind === 'folder' ? 16 : 22);
    assert.equal(presented.elapsedUpdates, 0, 'sampling an endpoint is not a receipt');
    presented = acknowledgeHomeEntryMotionCandidate(reduced, identity, 106, true);
    const normal = sampleHomeEntryMotionCandidate(presented, null, identity, 107, true, true, false);
    assert.equal(homeEntryMotionActive(normal), false, 'disabling reduced cannot revive the midpoint');
  }
});

test('invalid clocks, owners and mixed pause-close stacks fail explicitly', () => {
  for (const update of [-1, .5, Infinity, NaN]) assert.throws(() => sampleHomeEntryMotion(null, folder, update, true), /update count/);
  for (const identity of [{ ...folder, folder: '' }, { ...pause, owner: '' }, { ...pause, captureGeneration: -1 }]) {
    assert.throws(() => sampleHomeEntryMotion(null, identity, 0, true), /owner/);
  }
  const start = sampleHomeEntryMotion(null, pause, 60, true);
  assert.throws(() => sampleHomeEntryMotion(start, pause, 59, true), /backwards/);
  const presentation = homePauseEntryPresentation(start);
  for (const frame of [-1, .5, 21, NaN]) {
    assert.throws(() => suspendedBackgroundPlayback({
      ...presentation, skeletal: [{ clip: 'BannerBG_SceneIn', frame }],
    }), /Unsupported native/);
    assert.throws(() => suspendedBackgroundPlayback({
      ...presentation, material: [{ clip: 'BannerBG_AppPause', frame }],
    }), /Unsupported native/);
  }
  assert.throws(() => suspendedBackgroundPlayback({ ...presentation,
    material: [{ clip: 'BannerBG_AppPause', frame: 5 }, { clip: 'BannerBG_AppQuit', frame: 0 }],
  }), /Unsupported native/);
});
