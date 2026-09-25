import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHomeBannerHost, crossHomeBannerBoundary, getHomeBannerHostView } from '../src/os/home-banner-host.ts';

const root = new URL('../public/os/firmware/10.7.0-32E/models/settings-banner/', import.meta.url);
const model = JSON.parse(readFileSync(new URL('model.json', root), 'utf8'));
const controller = JSON.parse(readFileSync(new URL('../docs/evidence/settings-banner-controller-clock.json', import.meta.url), 'utf8'));

test('Settings primary has a complete, bound source texture pack before title activation', () => {
  assert.equal(model.sourceSha256, '96ea28f70671cf2b62aded3e3ef203cdf365929ae9422798255c628499c0910d');
  assert.equal(model.models.length, 1);
  assert.equal(model.models[0].name, 'COMMON');
  assert.equal(model.models[0].meshes.length, 12);
  assert.deepEqual(model.textures.map(({ name }) => name), ['COMMON1', 'COMMON2', 'COMMON3', 'COMMON4', 'COMMON5']);
  const textures = new Map(model.textures.map(texture => [texture.name, texture]));
  for (const texture of model.textures) {
    const png = readFileSync(new URL(texture.url, root));
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', texture.name);
    assert.equal(png.readUInt32BE(16), texture.width, `${texture.name} width`);
    assert.equal(png.readUInt32BE(20), texture.height, `${texture.name} height`);
  }
  for (const material of model.models[0].materials) {
    for (const name of [material.Texture0Name, material.Texture1Name, material.Texture2Name]) {
      if (name) assert.ok(textures.has(name), `${material.Name} references missing ${name}`);
    }
  }
  assert.deepEqual(model.skeletalAnimations.map(clip => [clip.Name, clip.FramesCount, clip.AnimationFlags]),
    [['COMMON', 600, 'IsLooping']]);
  assert.equal(model.materialAnimations.length, 0);
  assert.equal(model.models[0].skeleton.find(bone => bone.Name === 'p_title')?.NativeBillboardMode, 1);
});

test('Settings remains unsupported until title-driven visible submission and scene cadence are proven', () => {
  const clock = { generation: 'settings-gate', updateCount: 0 };
  const inputs = { managerInhibited: false, sceneInhibited: false, loadInhibited: false,
    nativeWorkerReady: true, resourceReady: null };
  let host = createHomeBannerHost(clock, inputs);
  host = crossHomeBannerBoundary(host, clock, { selection: { kind: 'folder', key: 'old-folder', label: 'Old', nativeType: 9 } });
  const formerTicket = getHomeBannerHostView(host).resourceTicket;
  host = crossHomeBannerBoundary(host, clock, { selection: { kind: 'app', id: 'settings' },
    inputs: { ...inputs, resourceReady: formerTicket } });
  assert.deepEqual(getHomeBannerHostView(host), {
    status: 'unsupported', selection: { kind: 'app', id: 'settings' }, resourceTicket: null,
  });
  assert.equal(host.service, null);
  assert.equal(host.inputs.resourceReady, null);
});

test('bounded original controller replay separates start pose submission from attached clock updates', () => {
  assert.equal(controller.homeCodeSha256, '243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9');
  assert.equal(controller.settingsSelectedCgfxSha256, model.sourceSha256);
  assert.deepEqual(controller.rows.map(row => row.currentFrame), [0, 0, 1, 2, 598, 599, 0, 0, 0]);
  assert.equal(controller.firstStartSubmission.submittedFrame, 0);
  assert.equal(controller.firstStartSubmission.attachedScenePasses, 2);
  assert.equal(controller.firstStartSubmission.frameAfterAttachedPasses, 2);
  assert.equal(controller.firstStartSubmission.poseCallbacksAfterAttachedPasses, 0);
  const transition = controller.visibilityTransition;
  assert.equal(transition.titleId, '0004001000022000');
  assert.equal(transition.sceneIndex, 1);
  assert.deepEqual(transition.rows.map(row => [row.actualVisible, row.requestedVisible]),
    [[1, 1], [1, 0], [0, 0]]);
  assert.deepEqual(transition.rows.at(-1).events.map(event => event.address),
    ['0x1f7c78', '0x24f170', '0x1f7c78', '0x24f3b0']);
  const insertion = controller.nativeSceneInsertion;
  assert.equal(insertion.candidatePointerSource, 'synthetic manager +0x50');
  assert.equal(insertion.listCount, 1);
  assert.equal(insertion.actualVisibleByte, 1);
  assert.deepEqual(insertion.controllerFramesAtRenderDispatch, [1, 2]);
  assert.deepEqual(insertion.visited.slice(0, 7),
    ['0x1f9e64', '0x1fa344', '0x1f7c78', '0x24f170', '0x24f30c', '0x230710', '0x24e0c0']);
  assert.equal(insertion.renderDispatchStop, '0x1038c0');
});

test.todo('execute native scene insertion and a visible Settings pose submission with the bound COMMON model');
