import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(new URL('../package.json', import.meta.url));
const firmware=new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const painter=readFileSync(new URL('../src/os/stock-native-camera.ts', import.meta.url), 'utf8');
const dialog=JSON.parse(readFileSync(new URL('packs/camera/contents/0000-0000001a/lyt-C-Dlg.json', firmware), 'utf8'));
const messages=JSON.parse(readFileSync(new URL('packs/camera/contents/0000-0000001a/msg-EU_English.json', firmware), 'utf8'));
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const flatten=panes=>panes.flatMap(pane=>[pane, ...flatten(pane.children??[])]);
const requested=painter.match(/alias:'camera-dialog',\n  layouts:\[([^\]]+)\],animations:\[([^\]]+)\],/)??[];
const requestedLayouts=requested[1]??'';
const requestedAnims=requested[2]??'';

test('pages 3/4 already bind Guid2 Default 0 and TxtDlg; Push, Disable and _flw stay unused', ()=>{
  assert.equal(dialog.titleId, '0004001000022400');
  assert.equal(dialog.contentId, '0000001a');
  assert.equal(dialog.contentIndex, 0);
  assert.equal(dialog.sourceSha256, '101e184056296119b5b17021ff148211b49090a5729c727d1113fc27b3f47957');
  assert.equal(sha(new URL('packs/camera/contents/0000-0000001a/lyt-C-Dlg.json', firmware)),
    '32ef0772e40f2e1802c8f45cda2c7b0c424c488286720b3232ad5a15d58cfd4c');
  assert.deepEqual(Object.keys(dialog.layouts).sort(), ['C_DlgChA', 'C_DlgGuid1BtnW', 'C_DlgGuid2Btn', 'C_DlgGuid_U']);
  assert.deepEqual(Object.keys(dialog.animations).sort(), [
    'C_DlgGuid1BtnW_Default', 'C_DlgGuid1BtnW_Push',
    'C_DlgGuid2Btn_Default', 'C_DlgGuid2Btn_Disable', 'C_DlgGuid2Btn_Push',
  ]);
  assert.match(requestedLayouts, /'C_DlgGuid2Btn'/);
  assert.match(requestedAnims, /'C_DlgGuid2Btn_Default'/);
  for(const unused of ['C_DlgGuid2Btn_Push', 'C_DlgGuid2Btn_Disable', 'C_DlgGuid1BtnW_Push']){
    assert.equal(requestedAnims.includes(unused), false, unused);
    assert.equal(painter.includes(unused), false, unused);
  }
  assert.equal(dialog.resourceSources.layouts.C_DlgGuid2Btn.sha256,
    '1a93160f30cd0906334d8edff697e52dfe4cf5b9cf55ec048093075d4e57505c');
  assert.equal(dialog.resourceSources.animations.C_DlgGuid2Btn_Default.sha256,
    '4c3bf562754cd65e646b8399c22b2f09a1f728262e58532620f78efc00693ed9');
  assert.equal(dialog.resourceSources.animations.C_DlgGuid2Btn_Push.sha256,
    '8205932431450a7f36101a30411fd48f25f8923597efeb8d0d3f4765dc7e36fd');
  assert.equal(dialog.resourceSources.animations.C_DlgGuid2Btn_Disable.sha256,
    'b7df0790c5093b6358d6d4b3f0c5528dd50195c976d51a5090e2e1ce6c20df49');
  const guid2=flatten(dialog.layouts.C_DlgGuid2Btn.roots);
  const txt=guid2.find(pane=>pane.name==='TxtDlg');
  assert.deepEqual(txt.size, [280, 152]);
  assert.equal(txt.translation.join(','), '0,25,0');
  assert.equal(txt.origin, 4);
  assert.equal(txt.text.alignment, 4);
  assert.equal(txt.text.lineAlignment, 2);
  assert.deepEqual(txt.text.size, [20, 24]);
  assert.equal(dialog.layouts.C_DlgGuid2Btn.fonts[0], 'cbf_std.bcfnt');
  const def=dialog.animations.C_DlgGuid2Btn_Default;
  assert.equal(def.tracks.some(track=>track.target==='TxtDlg'), false);
  assert.equal(def.tracks.every(track=>track.keys.length===1&&track.keys[0].frame===30), true);
  for(const clip of ['C_DlgGuid2Btn_Push', 'C_DlgGuid2Btn_Disable']){
    assert.equal(dialog.animations[clip].tracks.some(track=>track.target==='TxtDlg'||track.property==='visible'||track.property==='alpha'), false, clip);
  }
  const bank=messages.messages.P_tips;
  assert.equal(messages.resourceSources.messages.P_tips.sha256,
    '0fd449e7831698969cd8d0f20a351990c6ddbe89f59df16bbe96ccf9b55bb1e0');
  assert.equal(bank.messages[bank.labels.D_003_2].text,
    'When taking 3D photos\nand videos, make sure the\n3D depth slider is up so\nyou can view them in 3D.');
  assert.equal(bank.messages[bank.labels.D_003_3].text,
    'Try to position the system\nat least 30cm (12in)\nfrom the subject.');
  assert.equal(bank.messages[bank.labels.D_003_2_flw].text.includes('Please remember that this'), true);
  assert.equal(painter.includes('D_003_2_flw'), false);
  assert.equal(painter.includes('D_003_3_flw'), false);
  assert.equal(JSON.stringify(dialog).includes('C_BkMask'), false);
});

test('painter keeps pages 3/4 on already-bound Guid2 Default 0 plus TxtDlg color spans', ()=>{
  assert.match(painter, /const layout=first\?'C_DlgGuid1BtnW':'C_DlgGuid2Btn'/);
  assert.match(painter, /bindings:\[\{name:layout\+'_Default',frame:0\}\]/);
  assert.match(painter, /TxtDlg:\{\.\.\.message\(entry\.label\),colorSpans:nativeMessageColorSpans\(renderer\.packs\['camera-messages'\],'P_tips',entry\.label\),multilineBlockOrigin:'writer-0x111' as const\}/);
  assert.match(painter, /textSampling:'lcd-source-size'/);
  assert.match(painter, /Guid2TxtB:message\('Guide_D_BN_Btn0'\)/);
  assert.match(painter, /Guid2TxtW:message\(page===4\?'Guide_D_BO_Btn1':'Guide_D_BN_Btn1'\)/);
  assert.equal(painter.includes('colorFit'), false);
  assert.equal(painter.includes('nativeMipmaps'), false);
  assert.equal(painter.includes('azahar-12p4-fit'), false);
});

test('the reused page-3 pair keeps hashed 2480 / 1079 interior / labelled 1401 perimeter', async t=>{
  const root='/Users/paramveer/.codex/3ds-artifact-overflow';
  const files={
    native:'/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/camera-guide-replay-20260926/screenshots/Nintendo 3DS Camera_26.09.26_20.37.10.334.png',
    lower:`${root}/captures-20260926/reference/scenario-matrix/v1/captures/camera-guide-page3-modal-0d7bfea/browser/lower.png`,
    report:`${root}/captures-20260926/reference/scenario-matrix/v1/captures/camera-guide-page3-modal-0d7bfea/diff/report.json`,
    contact:`${root}/captures-20260926/reference/scenario-matrix/v1/captures/camera-guide-page3-modal-0d7bfea/diff/lower-contact-sheet.png`,
    mask:new URL('../scripts/native-compare/empty-mask.json', import.meta.url),
  };
  if(![files.native, files.lower, files.report, files.contact].every(existsSync)){
    return t.skip('private Camera Welcome page-3 pair is absent');
  }
  assert.equal(sha(files.native), '3ad989b5c214caa6be956643b2aa0785df2cc9612ffcc63a32ed5c70270f7c8a');
  assert.equal(sha(files.lower), '57476c312f731b8f52884b8c1d777c590a13f23588f32923664713081b715339');
  assert.equal(sha(files.report), '1e8cf7907e4a9cc6447b10621bb4eb57d974333b46c928ca8b75d4049eed51be');
  assert.equal(sha(files.contact), '122175a1db9ffdf8c84e53d849e9b9b9af907eb184c44eefcf5489e24152be2b');
  assert.equal(sha(files.mask), 'dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95');
  const sharp=require('sharp');
  const nativeLower=await sharp(files.native).extract({left:40, top:240, width:320, height:240}).ensureAlpha().raw().toBuffer();
  const browserLower=await sharp(files.lower).ensureAlpha().raw().toBuffer();
  const count=(native, browser, x0, y0, x1, y1)=>{
    let n=0, max=0, at=null;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
      const i=(y*320+x)*4;
      const e=Math.max(Math.abs(native[i]-browser[i]), Math.abs(native[i+1]-browser[i+1]), Math.abs(native[i+2]-browser[i+2]));
      if(e>max){max=e; at=[x, y];}
      if(e>2)n++;
    }
    return {n, max, at};
  };
  const whole=count(nativeLower, browserLower, 0, 0, 320, 240);
  const interior=count(nativeLower, browserLower, 20, 20, 300, 220);
  assert.equal(whole.n, 2480);
  assert.equal(whole.max, 101);
  assert.deepEqual(whole.at, [315, 167]);
  assert.equal(interior.n, 1079);
  assert.equal(interior.max, 14);
  assert.deepEqual(interior.at, [246, 113]);
  assert.equal(whole.n-interior.n, 1401);
  assert.equal(count(nativeLower, browserLower, 0, 0, 320, 6).n, 588);
  assert.equal(count(nativeLower, browserLower, 0, 0, 6, 240).n, 362);
  assert.equal(count(nativeLower, browserLower, 314, 0, 320, 240).n, 372);
  assert.equal(count(nativeLower, browserLower, 290, 226, 313, 237).n, 78);
  assert.equal(count(nativeLower, browserLower, 104, 184, 232, 224).n, 0);
  assert.equal(count(nativeLower, browserLower, 76, 184, 260, 224).n, 0);
  const report=JSON.parse(readFileSync(files.report, 'utf8'));
  assert.equal(report.screens.lower.pixelsOverThreshold, 2480);
  assert.deepEqual(report.screens.lower.regions[6], {x:28, y:128, width:11, height:17, pixelCount:51});
});

test('the reused page-4 pair keeps hashed 2093 / 692 interior / labelled 1401 perimeter', async t=>{
  const root='/Users/paramveer/.codex/3ds-artifact-overflow';
  const files={
    native:'/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/camera-guide-replay-20260926/screenshots/Nintendo 3DS Camera_26.09.26_20.37.37.016.png',
    lower:`${root}/captures-20260926/reference/scenario-matrix/v1/captures/camera-guide-page4-modal-0d7bfea/browser/lower.png`,
    report:`${root}/captures-20260926/reference/scenario-matrix/v1/captures/camera-guide-page4-modal-0d7bfea/diff/report.json`,
    contact:`${root}/captures-20260926/reference/scenario-matrix/v1/captures/camera-guide-page4-modal-0d7bfea/diff/lower-contact-sheet.png`,
  };
  if(![files.native, files.lower, files.report, files.contact].every(existsSync)){
    return t.skip('private Camera Welcome page-4 pair is absent');
  }
  assert.equal(sha(files.native), '38c19ca07e7569cb92daf31ce1743f19fab82b3f402fc4304af4f58e49057087');
  assert.equal(sha(files.lower), '4f182d392c6beec47db961e5386076b5c9112cc88b657ca2dd41f6e9ca033df7');
  assert.equal(sha(files.report), 'e13f8841f3afcff1e88e07e65ab31ee7e1f8edea61321c324092b1ef986a87b6');
  assert.equal(sha(files.contact), 'e1ff90fd39f287821895cdf842367416ea873f53c05c059287f70f925af3f188');
  const sharp=require('sharp');
  const nativeLower=await sharp(files.native).extract({left:40, top:240, width:320, height:240}).ensureAlpha().raw().toBuffer();
  const browserLower=await sharp(files.lower).ensureAlpha().raw().toBuffer();
  const count=(native, browser, x0, y0, x1, y1)=>{
    let n=0, max=0, at=null;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
      const i=(y*320+x)*4;
      const e=Math.max(Math.abs(native[i]-browser[i]), Math.abs(native[i+1]-browser[i+1]), Math.abs(native[i+2]-browser[i+2]));
      if(e>max){max=e; at=[x, y];}
      if(e>2)n++;
    }
    return {n, max, at};
  };
  const whole=count(nativeLower, browserLower, 0, 0, 320, 240);
  const interior=count(nativeLower, browserLower, 20, 20, 300, 220);
  assert.equal(whole.n, 2093);
  assert.equal(whole.max, 101);
  assert.deepEqual(whole.at, [315, 167]);
  assert.equal(interior.n, 692);
  assert.equal(interior.max, 14);
  assert.deepEqual(interior.at, [181, 126]);
  assert.equal(whole.n-interior.n, 1401);
  assert.equal(count(nativeLower, browserLower, 104, 184, 232, 224).n, 0);
  assert.equal(count(nativeLower, browserLower, 76, 184, 260, 224).n, 0);
  const report=JSON.parse(readFileSync(files.report, 'utf8'));
  assert.equal(report.screens.lower.pixelsOverThreshold, 2093);
  assert.deepEqual(report.screens.lower.regions[5], {x:132, y:112, width:10, height:17, pixelCount:77});
});
