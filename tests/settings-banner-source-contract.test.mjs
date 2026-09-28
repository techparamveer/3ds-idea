import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHomeBannerHost, crossHomeBannerBoundary, getHomeBannerHostView } from '../src/os/home-banner-host.ts';

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const evidence = read('../docs/evidence/settings-banner-pose-anchors.json');
const model = read('../public/os/firmware/10.7.0-32E/models/settings-banner/model.json');
const camera = read('../public/os/firmware/10.7.0-32E/models/home-camera/camera.json');

test('published Settings resource retains the audited title clip and shared HOME camera', () => {
  assert.equal(evidence.codeSha256, '243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9');
  assert.equal(model.sourceSha256, evidence.modelSourceSha256);
  assert.equal(camera.sourceSha256, evidence.cameraSourceSha256);
  assert.equal(model.models.length, 1);
  assert.equal(model.models[0].name, 'COMMON');
  assert.equal(model.models[0].meshes.length, 12);
  assert.equal(model.textures.length, 5);
  assert.deepEqual(model.skeletalAnimations.map(clip => [clip.Name, clip.FramesCount, clip.AnimationFlags]),
    [['COMMON', 600, 'IsLooping']]);
  assert.deepEqual(model.materialAnimations, []);
  assert.deepEqual(camera.cameras.map(({ name, position, aimTarget, perspectiveFovRadians, aspect, near, far }) =>
    ({ name, position, aimTarget, perspectiveFovRadians, aspect, near, far })), [evidence.camera]);
  assert.equal(evidence.genericPrimaryVtable, '0x3210f0');
  assert.equal(evidence.managerVisibilityHandler, '0x1fa344');
  assert.equal(evidence.commonPoseHandler, '0x24e0c0');
  assert.deepEqual(evidence.executedShowPredicate, {
    matching_current_request: 1,
    retargeted_title_key: 0,
    retargeted_native_type: 0,
    ineligible_primary_pointer: 0,
    manager_flag_set: 0,
  });
});

test('Settings selection cannot acknowledge or display a former folder through the unsupported host handoff', () => {
  const inputs = { managerInhibited: false, sceneInhibited: false, loadInhibited: false,
    nativeWorkerReady: true, resourceReady: null };
  const clock = { generation: 'settings-source-fixture', updateCount: 0 };
  let host = createHomeBannerHost(clock, inputs);
  host = crossHomeBannerBoundary(host, clock, { selection: { kind: 'folder', key: 'folder-a', label: 'A', nativeType: 9 } });
  const staleFolderTicket = getHomeBannerHostView(host).resourceTicket;
  host = crossHomeBannerBoundary(host, clock, { selection: { kind: 'app', id: 'settings' },
    inputs: { ...inputs, resourceReady: staleFolderTicket } });
  assert.deepEqual(getHomeBannerHostView(host), {
    status: 'unsupported', selection: { kind: 'app', id: 'settings' }, resourceTicket: null,
  });
  assert.equal(host.service, null);
  assert.equal(host.active, null);
  assert.equal(host.inputs.resourceReady, null);
});
