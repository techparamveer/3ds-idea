import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(new URL('../package.json', import.meta.url));
const firmware=new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const painter=readFileSync(new URL('../src/os/stock-native-camera.ts', import.meta.url), 'utf8');
const shootScene=readFileSync(new URL('../src/scene/camera-shoot-background.ts', import.meta.url), 'utf8');
const shoot=JSON.parse(readFileSync(new URL('packs/camera/contents/0000-0000001a/lyt-P_Shoot_D-arc-LZ.json', firmware), 'utf8'));
const dialog=JSON.parse(readFileSync(new URL('packs/camera/contents/0000-0000001a/lyt-C-Dlg.json', firmware), 'utf8'));
const model=JSON.parse(readFileSync(new URL('models/camera-shoot-background/model.json', firmware), 'utf8'));
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const requested=painter.match(/alias:'camera-shoot',\n  layouts:\[([^\]]+)\],\n  animations:\[([^\]]+)\],/)??[];
const requestedLayouts=requested[1]??'';
const requestedAnims=requested[2]??'';

test('Welcome already requests Disable / IconPtrn; Default, Push and C_BkMask stay unused', ()=>{
  assert.equal(shoot.titleId, '0004001000022400');
  assert.equal(shoot.sourceSha256, 'a5aa9ae10eb59d400160a85f8aa919a274f6f13d480d041d7f95b91eef0dd41e');
  assert.equal(sha(new URL('packs/camera/contents/0000-0000001a/lyt-P_Shoot_D-arc-LZ.json', firmware)),
    '34c726d1dfb05efac2b1f24923ac0f1413e1b3c935766122e90203c8404e5397');
  assert.deepEqual(Object.keys(shoot.layouts).sort(), ['P_CamBtn', 'P_CamIcon', 'P_Shoot_D']);
  assert.deepEqual(Object.keys(shoot.animations).sort(), [
    'P_CamBtn_Default', 'P_CamBtn_Disable', 'P_CamBtn_Push', 'P_CamIcon_IconPtrn',
    'P_Shoot_D_BtnTxtIn', 'P_Shoot_D_BtnTxtOut', 'P_Shoot_D_Default', 'P_Shoot_D_Disable', 'P_Shoot_D_Push',
  ]);
  assert.match(requestedLayouts, /'P_Shoot_D'/);
  assert.match(requestedLayouts, /'P_CamBtn'/);
  assert.match(requestedLayouts, /'P_CamIcon'/);
  assert.match(requestedAnims, /'P_Shoot_D_Disable'/);
  assert.match(requestedAnims, /'P_CamBtn_Disable'/);
  assert.match(requestedAnims, /'P_CamIcon_IconPtrn'/);
  for(const unused of ['P_Shoot_D_Default', 'P_Shoot_D_Push', 'P_Shoot_D_BtnTxtIn', 'P_Shoot_D_BtnTxtOut', 'P_CamBtn_Default', 'P_CamBtn_Push']){
    assert.equal(requestedAnims.includes(unused), false, unused);
    assert.equal(painter.includes(`name:'${unused}'`), false, unused);
  }
  assert.equal(shoot.resourceSources.animations.P_Shoot_D_Disable.sha256,
    'a129d382126a52af8f615d4348f80fc9a20425134c1d2c3c789abc8b007fc1a1');
  assert.equal(shoot.resourceSources.animations.P_Shoot_D_Default.sha256,
    'd2fa06360380d61d46204aa3645058b85a014842606f5dc1360d80836fc2da54');
  assert.equal(shoot.animations.P_Shoot_D_Disable.tracks.find(track=>track.target==='PhoBase'&&track.property==='translation.y').keys[0].value, 8);
  assert.equal(shoot.animations.P_Shoot_D_Default.tracks.find(track=>track.target==='PhoBase'&&track.property==='translation.y').keys[0].value, 0);
  assert.equal(shoot.animations.P_CamBtn_Disable.tracks.find(track=>track.target==='CamBase'&&track.property==='alpha').keys[0].value, 128);
  assert.equal(shoot.animations.P_CamBtn_Default.tracks.find(track=>track.target==='CamBase'&&track.property==='alpha').keys[0].value, 255);
  assert.deepEqual(Object.keys(dialog.layouts).sort(), ['C_DlgChA', 'C_DlgGuid1BtnW', 'C_DlgGuid2Btn', 'C_DlgGuid_U']);
  assert.equal(JSON.stringify(dialog).includes('C_BkMask'), false);
  assert.equal(JSON.stringify(shoot).includes('C_BkMask'), false);
  assert.equal(painter.includes('C_BkMask'), false);
});

test('painter and CGFX underlay stay on the already-bound Welcome path', ()=>{
  assert.match(painter, /bindings:\[\{name:'P_Shoot_D_Disable',frame:0\}\]/);
  assert.match(painter, /bindings:\[\{name:'P_CamBtn_Disable',frame:0\}\]/);
  assert.match(painter, /bindings:\[\{name:'P_CamIcon_IconPtrn',frame:0\}\]/);
  assert.match(painter, /bottom\.globalAlpha=128\/255;bottom\.fillStyle='#000';bottom\.fillRect\(0,0,320,240\)/);
  assert.match(painter, /if\(options\.cameraShoot\)okay=options\.cameraShoot\.draw\(bottom\)&&okay;/);
  assert.match(painter, /textSampling:'lcd-source-size'/);
  assert.equal(painter.includes('P_Shoot_D_Default'), false);
  assert.equal(painter.includes('colorFit'), false);
  assert.equal(painter.includes('nativeMipmaps'), false);
  assert.equal(model.sourceSha256, '728ff7412764350ab15fd978236e29dfc0a5bd850803b7a2f343ad82ca0294a1');
  assert.equal(sha(new URL('models/camera-shoot-background/model.json', firmware)),
    'fbcf4aefc917396979cef9a4993508e5bdb2e68dbf5f0e34e34e717cc1a7bafe');
  assert.deepEqual(model.models.map(item=>item.name), ['P_Shoot_D', 'X_Arw', 'Z_Arw', 'A_stick']);
  assert.equal(model.cameras[0].Projection.AspectRatio, 1.5);
  assert.equal(model.cameras[0].Projection.FOVY, 0.660595);
  assert.match(shootScene, /aspect:320\/240/);
  assert.match(shootScene, /setRGB\(233\/255,224\/255,208\/255/);
  assert.match(shootScene, /child\.visible=index===0/);
  assert.equal(shootScene.includes('colorFit'), false);
  assert.equal(shootScene.includes('nativeMipmaps'), false);
});

test('the reused page-1 pair keeps the hashed 0 / 1401 residual and official clusters', async t=>{
  const root='/Users/paramveer/.codex/3ds-artifact-overflow';
  const files={
    native:'/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/scenario-matrix/v1/captures/camera-first-run/native/combined.png',
    upper:`${root}/captures-20260926/reference/scenario-matrix/v1/captures/camera-guide-page1-modal-0d7bfea/browser/upper.png`,
    lower:`${root}/captures-20260926/reference/scenario-matrix/v1/captures/camera-guide-page1-modal-0d7bfea/browser/lower.png`,
    report:`${root}/captures-20260926/reference/scenario-matrix/v1/captures/camera-guide-page1-modal-0d7bfea/diff/report.json`,
    contact:`${root}/captures-20260926/reference/scenario-matrix/v1/captures/camera-guide-page1-modal-0d7bfea/diff/lower-contact-sheet.png`,
    mask:new URL('../scripts/native-compare/empty-mask.json', import.meta.url),
  };
  if(![files.native, files.upper, files.lower, files.report, files.contact].every(existsSync)){
    return t.skip('private Camera Welcome page-1 pair is absent');
  }
  assert.equal(sha(files.native), '52a6dcf75c85d9be6cdc9e245f5767acfcf4373400a06c584f5dbd3a915bdf6b');
  assert.equal(sha(files.upper), 'b642d80f8f219a90f61f38718f58c6be71cfbd48aee421763ffaff878f7ac00e');
  assert.equal(sha(files.lower), '230864dc8b338b25efd2b3724e76aa1f436c34eb6a09e6b8ce707e3fff10f56b');
  assert.equal(sha(files.report), 'b4d96e28336c4eaa439b831c26487153a166aa2509328b770281218678937584');
  assert.equal(sha(files.contact), '8f15b9878484f375f7de3d1dc00b5d83487c02b60977feb5a4285a9597b9568e');
  assert.equal(sha(files.mask), 'dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95');
  const sharp=require('sharp');
  const nativeUpper=await sharp(files.native).extract({left:0, top:0, width:400, height:240}).ensureAlpha().raw().toBuffer();
  const nativeLower=await sharp(files.native).extract({left:40, top:240, width:320, height:240}).ensureAlpha().raw().toBuffer();
  const browserUpper=await sharp(files.upper).ensureAlpha().raw().toBuffer();
  const browserLower=await sharp(files.lower).ensureAlpha().raw().toBuffer();
  const count=(native, browser, width, x0, y0, x1, y1)=>{
    let n=0, max=0, at=null;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
      const i=(y*width+x)*4;
      const e=Math.max(Math.abs(native[i]-browser[i]), Math.abs(native[i+1]-browser[i+1]), Math.abs(native[i+2]-browser[i+2]));
      if(e>max){max=e; at=[x, y];}
      if(e>2)n++;
    }
    return {n, max, at};
  };
  assert.equal(count(nativeUpper, browserUpper, 400, 0, 0, 400, 240).n, 0);
  const whole=count(nativeLower, browserLower, 320, 0, 0, 320, 240);
  assert.equal(whole.n, 1401);
  assert.equal(whole.max, 101);
  assert.deepEqual(whole.at, [315, 167]);
  assert.equal(count(nativeLower, browserLower, 320, 20, 20, 300, 220).n, 0);
  assert.equal(count(nativeLower, browserLower, 320, 0, 0, 320, 6).n, 588);
  assert.equal(count(nativeLower, browserLower, 320, 183, 0, 236, 6).n, 308);
  assert.equal(count(nativeLower, browserLower, 320, 84, 0, 127, 6).n, 255);
  assert.equal(count(nativeLower, browserLower, 320, 0, 0, 6, 240).n, 362);
  assert.equal(count(nativeLower, browserLower, 320, 314, 0, 320, 240).n, 372);
  assert.equal(count(nativeLower, browserLower, 320, 290, 226, 313, 237).n, 78);
  assert.equal(count(nativeLower, browserLower, 320, 8, 227, 9, 228).n, 1);
  const report=JSON.parse(readFileSync(files.report, 'utf8'));
  assert.equal(report.screens.upper.pixelsOverThreshold, 0);
  assert.equal(report.screens.lower.pixelsOverThreshold, 1401);
  assert.deepEqual(report.screens.lower.regions[0], {x:183, y:0, width:53, height:6, pixelCount:308});
  assert.deepEqual(report.screens.lower.regions[1], {x:84, y:0, width:43, height:6, pixelCount:255});
  assert.deepEqual(report.screens.lower.regions[2], {x:0, y:98, width:6, height:36, pixelCount:199});
  assert.deepEqual(report.screens.lower.regions[3], {x:314, y:98, width:6, height:34, pixelCount:193});
  assert.deepEqual(report.screens.lower.regions[4], {x:290, y:226, width:23, height:11, pixelCount:78});
  assert.deepEqual(report.screens.lower.regions.slice(5, 11).map(region=>region.pixelCount), [63, 49, 48, 44, 41, 40]);
});
