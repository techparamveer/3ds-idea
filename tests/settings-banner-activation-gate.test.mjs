import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHomeBannerHost, crossHomeBannerBoundary, getHomeBannerHostView } from '../src/os/home-banner-host.ts';

const root = new URL('../public/os/firmware/10.7.0-32E/models/settings-banner/', import.meta.url);
const model = JSON.parse(readFileSync(new URL('model.json', root), 'utf8'));
const controller = JSON.parse(readFileSync(new URL('../docs/evidence/settings-banner-controller-clock.json', import.meta.url), 'utf8'));
const realWorker = JSON.parse(readFileSync(new URL('../docs/evidence/settings-banner-real-resource-worker.json', import.meta.url), 'utf8'));

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

test('Settings selection gets its own request and rejects a former folder ticket', () => {
  const clock = { generation: 'settings-gate', updateCount: 0 };
  const inputs = { managerInhibited: false, sceneInhibited: false, loadInhibited: false,
    nativeWorkerReady: true, resourceReady: null };
  let host = createHomeBannerHost(clock, inputs);
  host = crossHomeBannerBoundary(host, clock, { selection: { kind: 'folder', key: 'old-folder', label: 'Old', nativeType: 9 } });
  const formerTicket = getHomeBannerHostView(host).resourceTicket;
  host = crossHomeBannerBoundary(host, clock, { selection: { kind: 'app', id: 'system-settings' },
    inputs: { ...inputs, resourceReady: formerTicket } });
  const pending = getHomeBannerHostView(host);
  assert.equal(pending.status, 'pending');
  assert.deepEqual(pending.selection, { kind: 'app', id: 'system-settings' });
  assert.equal(host.service.lifecycle.requested.target.nativeType, 1);
  assert.equal(host.service.lifecycle.requested.target.key, 'system-settings');
  assert.notDeepEqual(pending.resourceTicket, formerTicket);
  assert.equal(host.inputs.resourceReady, null);
  host = crossHomeBannerBoundary(host, { ...clock, updateCount: 15 });
  assert.equal(getHomeBannerHostView(host).status, 'pending', 'readiness must be explicit');
  host = crossHomeBannerBoundary(host, host.clock, { inputs: { ...inputs, resourceReady: pending.resourceTicket } });
  host = crossHomeBannerBoundary(host, { ...clock, updateCount: 16 });
  const active = getHomeBannerHostView(host);
  assert.equal(active.status, 'active');
  assert.equal(active.primary.selection.id, 'system-settings');
  assert.equal(active.primary.motion.skeletal.frame, 1);
  assert.equal(active.primary.motion.material.status, 0);
  host = crossHomeBannerBoundary(host, host.clock, { selection: { kind: 'app', id: 'sound' } });
  assert.equal(getHomeBannerHostView(host).status, 'unsupported');
  assert.equal(host.service, null);
  host = crossHomeBannerBoundary(host, host.clock, { selection: { kind: 'app', id: 'system-settings' }, inputs: { ...inputs, resourceReady: pending.resourceTicket } });
  assert.equal(getHomeBannerHostView(host).status, 'pending');
  assert.equal(host.inputs.resourceReady, null, 'old title ticket cannot activate a new scope');
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

test('real Settings CBMD worker decodes COMMON and constructs generic primaries', () => {
  assert.equal(realWorker.settingsBannerSha256, model.cbmd.cbmdSha256);
  assert.equal(realWorker.selectedCgfxSha256, model.sourceSha256);
  assert.equal(realWorker.usedCommonFallback, true);
  assert.equal(realWorker.nativeSizeCalls, 1);
  assert.equal(realWorker.nativeDecodeCalls, 1);
  assert.equal(realWorker.completionByte, 1);
  assert.equal(realWorker.candidateVtable, '0x3210f0');
  assert.equal(realWorker.nativeConstructorCalls, 2);
  assert.deepEqual(realWorker.commonBindVisits, ['0x24def0', '0x24ed40', '0x2354a0']);
});

test.todo('bind real Settings COMMON candidate and compare a matched native/browser 400x240 frame');


test('Camera uses a title request, waits for readiness and samples its own COMMON clock', () => {
 const clock={generation:'camera-gate',updateCount:0};
 const inputs={managerInhibited:false,sceneInhibited:false,loadInhibited:false,nativeWorkerReady:true,resourceReady:null};
 let host=createHomeBannerHost(clock,inputs);
 host=crossHomeBannerBoundary(host,clock,{selection:{kind:'default'}});
 const previous=getHomeBannerHostView(host).resourceTicket;
 host=crossHomeBannerBoundary(host,clock,{selection:{kind:'app',id:'camera'},inputs:{...inputs,resourceReady:previous}});
 const camera=getHomeBannerHostView(host).resourceTicket;
 assert.notDeepEqual(camera,previous);
 assert.equal(host.inputs.resourceReady,null);
 host=crossHomeBannerBoundary(host,{...clock,updateCount:15});
 assert.equal(getHomeBannerHostView(host).status,'pending');
 host=crossHomeBannerBoundary(host,host.clock,{inputs:{...inputs,resourceReady:camera}});
 host=crossHomeBannerBoundary(host,{...clock,updateCount:16});
 const active=getHomeBannerHostView(host);
 assert.equal(active.status,'active');
 assert.equal(active.primary.selection.id,'camera');
 assert.equal(active.primary.motion.skeletal.frame,1);
 assert.equal(active.primary.motion.material.status,0);
 host=crossHomeBannerBoundary(host,host.clock,{selection:{kind:'app',id:'sound'}});
 assert.equal(getHomeBannerHostView(host).status,'unsupported');
 host=crossHomeBannerBoundary(host,host.clock,{selection:{kind:'app',id:'camera'},inputs:{...inputs,resourceReady:camera}});
 assert.equal(host.inputs.resourceReady,null);
 assert.equal(getHomeBannerHostView(host).status,'pending');
});
