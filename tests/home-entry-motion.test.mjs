import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sampleHomeEntryMotion, homeFolderEntryPose, homePauseEntryPresentation } from '../src/os/home-entry-motion.ts';
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
  for (let update = 0; update <= 30; update++) {
    const sampled = sampleHomeEntryMotion(start, folder, 100 + update, true);
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
  const current = sampleHomeEntryMotion(sampleHomeEntryMotion(null, folder, 0, true), folder, 8, true);
  assert.equal(sampleHomeEntryMotion(current, { ...folder, folder: 'folder:8' }, 9, true).elapsedUpdates, 0);
  const suspended = sampleHomeEntryMotion(null, pause, 90, true);
  const moving = sampleHomeEntryMotion(suspended, pause, 95, true);
  for (const next of [{ ...pause, owner: 'health:2' }, { ...pause, captureGeneration: 4 }]) {
    assert.equal(sampleHomeEntryMotion(moving, next, 96, true).elapsedUpdates, 0);
  }
  assert.equal(sampleHomeEntryMotion(moving, null, 96, true), null);
});

test('pause entry selects the original AppPause scale and tint clip without an AppQuit override', () => {
  const clip = background.materialAnimations.find(animation => animation.Name === 'BannerBG_AppPause');
  assert.equal(clip.FramesCount, 20);
  assert.equal(clip.AnimationFlags, '0');
  const scale = clip.Elements.find(element => element.TargetType === 'MaterialTexCoord0Scale').Content.X;
  assert.deepEqual(scale.KeyFrames.map(key => [key.Frame, key.Value]), [[0, 1], [1, 1.002], [2, 1], [5, .98], [10, .93], [15, .89], [19, .87]]);
  const start = sampleHomeEntryMotion(null, pause, 60, true);
  for (const update of [0, 1, 5, 10, 19, 20, 40]) {
    const presentation = homePauseEntryPresentation(sampleHomeEntryMotion(start, pause, 60 + update, true));
    assert.deepEqual(suspendedBackgroundPlayback(presentation), {
      skeletal: [{ name: 'BannerBG_SceneIn', frame: 20 }],
      material: [{ name: 'BannerBG_AppPause', frame: Math.min(20, update) }],
    });
  }
});

test('reduced motion chooses source endpoints without mutating the normal samples', () => {
  const folderMotion = sampleHomeEntryMotion(null, folder, 40, true);
  const pauseMotion = sampleHomeEntryMotion(null, pause, 40, true);
  assert.deepEqual(homeFolderEntryPose(folderMotion, true), { folderFrame: 16, captureFrame: 8 });
  assert.equal(homePauseEntryPresentation(pauseMotion, true).material[0].frame, 20);
  assert.deepEqual(homeFolderEntryPose(folderMotion), { folderFrame: 0, captureFrame: 0 });
  assert.equal(homePauseEntryPresentation(pauseMotion).material[0].frame, 0);
  assert.equal(homeFolderEntryPose(pauseMotion), null);
  assert.equal(homePauseEntryPresentation(folderMotion), null);
});

test('invalid clocks, owners and mixed pause-close stacks fail explicitly', () => {
  for (const update of [-1, .5, Infinity, NaN]) assert.throws(() => sampleHomeEntryMotion(null, folder, update, true), /update count/);
  for (const identity of [{ ...folder, folder: '' }, { ...pause, owner: '' }, { ...pause, captureGeneration: -1 }]) {
    assert.throws(() => sampleHomeEntryMotion(null, identity, 0, true), /owner/);
  }
  const start = sampleHomeEntryMotion(null, pause, 60, true);
  assert.throws(() => sampleHomeEntryMotion(start, pause, 59, true), /backwards/);
  const presentation = homePauseEntryPresentation(start);
  for (const frame of [-1, .5, 21, NaN]) assert.throws(() => suspendedBackgroundPlayback({
    ...presentation, material: [{ clip: 'BannerBG_AppPause', frame }],
  }), /Unsupported native/);
  assert.throws(() => suspendedBackgroundPlayback({ ...presentation,
    material: [{ clip: 'BannerBG_AppPause', frame: 5 }, { clip: 'BannerBG_AppQuit', frame: 0 }],
  }), /Unsupported native/);
});
