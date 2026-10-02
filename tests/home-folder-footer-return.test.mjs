import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  HOME_FOOTER_SCENE_IN_SETTLED_FRAME,
  HOME_FOOTER_SCENE_OUT_SETTLED_FRAME,
  selectHomeFolderFooterPose,
} from '../src/os/home-folder-footer-return.ts';

const closing = Object.freeze({
  controller: Object.freeze({ phase: 'closing' }),
  folderSlot: 20,
  startedAtUpdate: 100,
  restoredAtUpdate: null,
  selectionReadyAtUpdate: null,
});
const viewport = Object.freeze({
  ...closing,
  controller: Object.freeze({ phase: 'viewport' }),
  restoredAtUpdate: 118,
});
const complete = Object.freeze({
  ...viewport,
  controller: Object.freeze({ phase: 'complete' }),
  selectionReadyAtUpdate: 123,
});

test('folder footer departs during close and returns from selection readiness on the shared clock', () => {
  assert.deepEqual(selectHomeFolderFooterPose(closing, 100), { clip: 'LncBtmBtn_02_SceneOut', frame: 0 });
  assert.deepEqual(selectHomeFolderFooterPose(closing, 107), { clip: 'LncBtmBtn_02_SceneOut', frame: 7 });
  assert.deepEqual(selectHomeFolderFooterPose(closing, 140), {
    clip: 'LncBtmBtn_02_SceneOut', frame: HOME_FOOTER_SCENE_OUT_SETTLED_FRAME,
  });
  assert.deepEqual(selectHomeFolderFooterPose(viewport, 121), {
    clip: 'LncBtmBtn_02_SceneOut', frame: HOME_FOOTER_SCENE_OUT_SETTLED_FRAME,
  });
  assert.deepEqual(selectHomeFolderFooterPose(complete, 123), { clip: 'LncBtmBtn_02_SceneIn', frame: 0 });
  assert.deepEqual(selectHomeFolderFooterPose(complete, 130), { clip: 'LncBtmBtn_02_SceneIn', frame: 7 });
  assert.deepEqual(selectHomeFolderFooterPose(complete, 200), {
    clip: 'LncBtmBtn_02_SceneIn', frame: HOME_FOOTER_SCENE_IN_SETTLED_FRAME,
  });
});

test('ordinary, stale-reconciled and reduced-motion presentation use the settled source pose', () => {
  const settled = { clip: 'LncBtmBtn_02_SceneIn', frame: HOME_FOOTER_SCENE_IN_SETTLED_FRAME };
  assert.deepEqual(selectHomeFolderFooterPose(null, 0), settled);
  assert.deepEqual(selectHomeFolderFooterPose(closing, 100, true), settled);
  assert.deepEqual(selectHomeFolderFooterPose(complete, 123, true), settled);
  assert.equal(Object.isFrozen(selectHomeFolderFooterPose(complete, 124)), true);
});

test('impossible retained epochs fail instead of manufacturing a footer boundary', () => {
  assert.throws(() => selectHomeFolderFooterPose(closing, 99), /ahead of the shared clock/);
  assert.throws(() => selectHomeFolderFooterPose(complete, 122), /ahead of the shared clock/);
  assert.throws(() => selectHomeFolderFooterPose({ ...complete, selectionReadyAtUpdate: null }, 123), /no selection-ready boundary/);
  assert.throws(() => selectHomeFolderFooterPose(closing, 1.5), /Invalid HOME footer update count/);
});

test('delivered footer clips retain their exact source identities and endpoint tracks', () => {
  const pack = JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/home/launcher.json', import.meta.url)));
  assert.equal(pack.sourceSha256, '826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834');
  assert.deepEqual(pack.resourceSources.animations.LncBtmBtn_02_SceneIn, {
    path: 'launcher_LZ.bin/anim/LncBtmBtn_02_SceneIn.bclan',
    sha256: '9b19c054cbb84c89a4b0c8669a2c05566f386dc7fd681410864065b8dee44a4e',
    titleId: '0004003000009802',
  });
  assert.deepEqual(pack.resourceSources.animations.LncBtmBtn_02_SceneOut, {
    path: 'launcher_LZ.bin/anim/LncBtmBtn_02_SceneOut.bclan',
    sha256: 'df95bfcc74135a116fe14b39604cdd1300197e48b2c864989d3b40d35f13cf1d',
    titleId: '0004003000009802',
  });
  const incoming = pack.animations.LncBtmBtn_02_SceneIn;
  assert.deepEqual([incoming.frames, incoming.loop, incoming.groups, incoming.sourceFrameRange], [15, false, ['G_Scene_00'], [-14, 0]]);
  const tracks = Object.fromEntries(incoming.tracks.filter(track => track.target === 'N_Scene_00').map(track => [track.property, track.keys.map(key => key.value)]));
  assert.deepEqual(tracks, { 'translation.y': [-32, 0], alpha: [0, 255] });
});
