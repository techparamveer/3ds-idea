import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(new URL('../package.json', import.meta.url));
const firmware=new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const painter=readFileSync(new URL('../src/os/stock-native-sound.ts', import.meta.url), 'utf8');
const pack=JSON.parse(readFileSync(new URL('packs/sound/contents/0000-0000000b/lyt-C-Dlg.json', firmware), 'utf8'));
const messages=JSON.parse(readFileSync(new URL('packs/sound/contents/0000-0000000b/msg-EU_English.json', firmware), 'utf8'));
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const flatten=panes=>panes.flatMap(pane=>[pane, ...flatten(pane.children??[])]);
const requested=painter.match(/alias:'sound-dialog',layouts:\[([^\]]+)\],animations:\[([^\]]+)\]/)??[];
const unusedPublishedLayouts=['C_DlgGuid_U', 'C_NullDlg'];
const unusedPublishedClips=[
  'C_DlgGuid1BtnW_Push', 'C_Dlg1BtnB_Disable', 'C_Dlg1BtnB_Push',
  'C_DlgGuid2Btn_Disable', 'C_DlgGuid2Btn_Push',
  'C_NullDlg_Dlg_In', 'C_NullDlg_Dlg_InU', 'C_NullDlg_Dlg_Out', 'C_NullDlg_Dlg_OutU',
];
const unusedDumpLayouts=[
  'C_BtnDel', 'C_Dlg0Btn', 'C_Dlg1BtnW', 'C_Dlg2Btn0', 'C_Dlg2Btn1', 'C_Dlg3Btn',
  'C_DlgChB', 'C_DlgChB1BtnW', 'C_DlgHed', 'C_DlgU',
];
const unusedDumpClips=[
  'C_NullDlg_Ap_In', 'C_NullDlg_Ap_Out', 'C_NullDlg_Ap_OutU',
  'C_NullDlg_BlnClose', 'C_NullDlg_BlnOpen', 'C_NullDlg_Dlg_Close', 'C_NullDlg_Dlg_Open',
];
const native14='/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/sound-native14/packs/sound/contents/0000-0000000b/lyt-C-Dlg.json';

test('published guide chrome already binds C_DlgChA and C_DlgGuid1BtnW Default 0', ()=>{
  assert.equal(pack.titleId, '0004001000022500');
  assert.equal(pack.contentId, '0000000b');
  assert.equal(pack.sourceSha256, '96771724c5f571dc6045ba3dd4ffa8a769428f9c4cf9784f3ea49e7cf52e0e26');
  assert.equal(sha(new URL('packs/sound/contents/0000-0000000b/lyt-C-Dlg.json', firmware)),
    '0332bab6ba969d0c6787f82dfde92441bef29eb4a4e618597850eb9b7d41b4d5');
  assert.equal(pack.resourceSources.layouts.C_DlgChA.sha256,
    '4d35e4b38ae75fa7ad8c8f2d2484bd200856b562ee4c493b13adbc765c5eb8d7');
  assert.equal(pack.resourceSources.layouts.C_DlgGuid1BtnW.sha256,
    'aaa3aeceda6930838285e3c03f032170d9d8e23690cabca843f26405c8116773');
  assert.equal(pack.resourceSources.animations.C_DlgGuid1BtnW_Default.sha256,
    '272caa8628864ac6c904bf9c27e56ec470dc8c674e30383d7cb64112a1ec2d7f');
  const cha=flatten(pack.layouts.C_DlgChA.roots);
  const left=cha.find(pane=>pane.name==='ChAWdwL');
  const right=cha.find(pane=>pane.name==='ChAWdwR');
  const bird=cha.find(pane=>pane.name==='Bird');
  assert.equal(left.kind, 'pic1');
  assert.deepEqual(left.size, [288, 230]);
  assert.deepEqual(left.translation, [-10, 0, 0]);
  assert.equal(right.kind, 'pic1');
  assert.deepEqual(right.size, [20, 230]);
  assert.deepEqual(right.translation, [144, 0, 0]);
  assert.equal(bird.kind, 'pic1');
  assert.deepEqual(bird.size, [44, 52]);
  assert.equal(cha.some(pane=>pane.kind==='pic1'&&pane.size[0]>=320&&pane.size[1]>=240), false);
  const guid=flatten(pack.layouts.C_DlgGuid1BtnW.roots);
  assert.deepEqual(guid.filter(pane=>pane.kind==='pic1').map(pane=>pane.name), ['Guid1BtnW']);
  const txtDlg=guid.find(pane=>pane.name==='TxtDlg');
  const n0=guid.find(pane=>pane.name==='TxtNumber0');
  const n1=guid.find(pane=>pane.name==='TxtNumber1');
  assert.deepEqual(txtDlg.size, [280, 152]);
  assert.deepEqual(n0.size, [1, 1]);
  assert.deepEqual(n1.size, [1, 1]);
  assert.equal(txtDlg.text.alignment, 4);
  assert.equal(txtDlg.text.lineAlignment, 2);
  assert.equal(pack.layouts.C_DlgGuid1BtnW.fonts[0], 'cbf_std.bcfnt');
  const bank=messages.messages.S_tips;
  assert.equal(bank.messages[bank.labels.D_001_0].text, 'Welcome to\nNintendo 3DS Sound!');
  assert.equal(bank.messages[bank.labels.Guide_D_N_Btn0].text, 'Next');
  assert.equal(bank.messages[bank.labels.Guide_D_00_00].text, '/ ');
  assert.equal(bank.messages[bank.labels.Guide_D_00_01].text, ' ');
  assert.equal(messages.styles[bank.styleTable].styles[3].unresolvedWords['0'], 48);
  const def=pack.animations.C_DlgGuid1BtnW_Default;
  assert.deepEqual([...new Set(def.tracks.map(track=>track.target))].sort(), ['Guid1BtnW', 'Guid1BtnW_Grp']);
  assert.equal(def.tracks.every(track=>track.keys.length===1&&track.keys[0].frame===30), true);
  assert.equal(def.tracks.some(track=>track.property==='visible'||track.property==='alpha'), false);
  for(const unused of unusedPublishedLayouts)assert.equal(Object.hasOwn(pack.layouts, unused), true, unused);
  for(const unused of unusedPublishedClips)assert.equal(Object.hasOwn(pack.animations, unused), true, unused);
  for(const unused of unusedDumpLayouts)assert.equal(Object.hasOwn(pack.layouts, unused), false, unused);
  for(const layout of ['C_DlgChA', 'C_DlgGuid1BtnW']){
    for(const material of pack.layouts[layout].materials){
      if(!material.textureMaps?.length)continue;
      assert.equal(material.textureMaps.every(map=>map.magFilter===1&&map.minFilter===1), true, material.name);
    }
  }
});

test('painter keeps already-bound first-run guide chrome and does not bind unused clips', ()=>{
  assert.match(requested[1]??'', /'C_DlgChA'/);
  assert.match(requested[1]??'', /'C_DlgGuid1BtnW'/);
  assert.match(requested[2]??'', /'C_DlgGuid1BtnW_Default'/);
  for(const unused of [...unusedPublishedLayouts, ...unusedPublishedClips, ...unusedDumpLayouts, ...unusedDumpClips]){
    assert.equal((requested[1]??'').includes(`'${unused}'`), false, unused);
    assert.equal((requested[2]??'').includes(unused), false, unused);
    assert.equal(painter.includes(`name:'${unused}'`), false, unused);
  }
  assert.equal(painter.includes('azahar-12p4-fit'), false);
  assert.deepEqual(painter.match(/textSampling/g), ['textSampling', 'textSampling']);
  assert.match(painter, /textSampling:'lcd-source-size',textSamplingPanes:\['Guid1TxtW'\]/);
  assert.equal(painter.includes('textCoverageAdaptation'), false);
  assert.equal(painter.includes('nativeMipmaps'), false);
  assert.match(painter, /draw\(bottom,'sound-dialog','C_DlgChA'\);/);
  assert.match(painter,
    /entry\(bottom,'sound-dialog','C_DlgGuid1BtnW',\{bindings:\[\{name:'C_DlgGuid1BtnW_Default',frame:0\}\]/);
  assert.match(painter, /size:\[counterWidth,24\]/);
  assert.match(painter, /the 24px raster height remains a capture-fit adapter/);
  assert.match(painter, /message\('S_tips',`D_001_\$\{page\}`\)/);
  assert.match(painter, /message\('S_tips','Guide_D_N_Btn0'\)/);
  assert.match(painter, /message\('S_tips','Guide_D_00_00'\)/);
  assert.match(painter, /message\('S_tips','Guide_D_00_01'\)/);
});

test('dump unused dialog clips do not write a veil or hide the idle guide card', async t=>{
  if(!existsSync(native14))return t.skip('private sound-native14 C-Dlg pack is absent');
  const full=JSON.parse(readFileSync(native14, 'utf8'));
  assert.equal(full.sourceSha256, pack.sourceSha256);
  const hashes={
    C_DlgGuid_U:'63b7f51b16405dd7dd40e1cfc090cf9094dba9864e824aa4a4f287735aa426e1',
    C_NullDlg:'33e40cd3b8a05bf575eb23ff51294c3637c8eded1f23b75a6d0aecfe397949e6',
    C_DlgGuid1BtnW_Push:'13487107a633403dc0a5d56c4986e53624fd926a1eceaf4704441d33640a2088',
    C_DlgChB:'09bd2de3e7b24f0f4bb8bfe2304e51c23db095086eec8c6fefdb10d03f9e8f4e',
    C_DlgChB1BtnW:'f5829c02321c8b64d1a0a026638be4d31c5640e3a76df8adef5b2ba3cc124110',
    C_DlgU:'8649e756450b151fed9cddaf4a665cb0f4bb61d5c6e0dc829ac0b0ae9dc692a0',
    C_DlgHed:'c1467edf6dfaa5582fea2b06ff1716b42e30522c754b70c4ed4fb7935d9781d8',
    C_Dlg0Btn:'0d544aee111befdf4d56f62a6eac99ddb015cebdacfa791f5fbeabb1d785ab01',
    C_Dlg:'4bc2aa1f74aab264d0762847c75260c24b86fc1d92aad79c7e0147ba6a2a3125',
  };
  for(const [name, digest] of Object.entries(hashes)){
    const src=full.resourceSources.layouts[name]??full.resourceSources.animations[name];
    assert.equal(src.sha256, digest, name);
  }
  const nullDlg=flatten(full.layouts.C_NullDlg.roots);
  assert.equal(nullDlg.some(pane=>pane.kind==='pic1'), false);
  const dlg=nullDlg.find(pane=>pane.name==='Dlg');
  assert.equal(dlg.kind, 'pan1');
  assert.deepEqual(dlg.size, [30, 40]);
  const guidU=flatten(full.layouts.C_DlgGuid_U.roots);
  assert.deepEqual(guidU[0].size, [400, 240]);
  const chb=flatten(full.layouts.C_DlgChB.roots);
  assert.deepEqual(chb.find(pane=>pane.name==='ChBWdwL').size, [288, 230]);
  assert.deepEqual(full.layouts.C_DlgChB.textures.includes('C_DlgChBirdB.bclim'), true);
  const zeroBtn=flatten(full.layouts.C_Dlg0Btn.roots);
  assert.equal(zeroBtn.some(pane=>pane.kind==='pic1'), false);
  for(const name of [...unusedPublishedClips, ...unusedDumpClips]){
    const clip=full.animations[name];
    assert.equal(clip.tracks.some(track=>track.property==='visible'||track.property==='alpha'), false, name);
    assert.equal(clip.tracks.some(track=>track.target==='RootPane'||track.target==='ChAWdwL'||track.target==='TxtDlg'), false, name);
  }
  for(const name of unusedDumpClips){
    assert.deepEqual([...new Set(full.animations[name].tracks.map(track=>track.target))], ['Dlg'], name);
  }
});

test('the reused HudTime-phase first-run lower keeps the 6072/195 split', async t=>{
  const root='/Users/paramveer/.codex/3ds-artifact-overflow';
  const recap=`${root}/home-fidelity-20261001/sound-clock-recapture-20261004`;
  const files={
    nativeFirst:`${root}/reference/screenshots/Nintendo 3DS Sound_25.09.26_22.27.14.541.png`,
    nativeEmpty:`${root}/reference/screenshots/Nintendo 3DS Sound_25.09.26_22.31.31.595.png`,
    browserFirst:`${recap}/browser-first-run/lower.png`,
    browserFirstUpper:`${recap}/browser-first-run/upper.png`,
    browserEmpty:`${recap}/browser-empty-entry/lower.png`,
    reportFirst:`${recap}/diff-sound-first-run-hudtime-phase/report.json`,
    contactFirst:`${recap}/diff-sound-first-run-hudtime-phase/lower-contact-sheet.png`,
    mask:new URL('../scripts/native-compare/empty-mask.json', import.meta.url),
  };
  if(![files.nativeFirst, files.nativeEmpty, files.browserFirst, files.browserFirstUpper, files.browserEmpty, files.reportFirst, files.contactFirst].every(existsSync)){
    return t.skip('private Sound HudTime-phase pair is absent');
  }
  assert.equal(sha(files.nativeFirst), '9dea0cc2fa7022ccd032c5a94ae59c2dbe37e6b7e800fbf8668b356fc9e5ce69');
  assert.equal(sha(files.nativeEmpty), '65fc5f8819d31c49622d9e2a8ee7ba79c0675fd7dd3a73f783255eb7efe3b4cd');
  assert.equal(sha(files.browserFirstUpper), '16565d8e586edce659beadb9e7f7d72bcd8e2b81479a85bca424480d4294ceab');
  assert.equal(sha(files.browserFirst), 'b9d1093ab9641460de6e9e0490707ae12d41008085ee8f7c9995d12fd504fbb9');
  assert.equal(sha(files.reportFirst), 'cb06bed5902eb0bf42f409ad3f3445799e7273fbc53dd1081101490184c3ba45');
  assert.equal(sha(files.contactFirst), '64148ff1b2f83946e0a0f97105ee6e88eb2033a68192f4f8fb5bc97804600b29');
  assert.equal(sha(files.mask), 'dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95');
  const sharp=require('sharp');
  const crop=async path=>(await sharp(path).extract({left:40, top:240, width:320, height:240}).ensureAlpha().raw().toBuffer());
  const cropUpper=async path=>(await sharp(path).extract({left:0, top:0, width:400, height:240}).ensureAlpha().raw().toBuffer());
  const load=async path=>(await sharp(path).ensureAlpha().raw().toBuffer());
  const first={native:await crop(files.nativeFirst), browser:await load(files.browserFirst)};
  const empty={native:await crop(files.nativeEmpty), browser:await load(files.browserEmpty)};
  const over=(pair, x, y, width=320)=>{
    const i=(y*width+x)*4;
    return Math.max(
      Math.abs(pair.native[i]-pair.browser[i]),
      Math.abs(pair.native[i+1]-pair.browser[i+1]),
      Math.abs(pair.native[i+2]-pair.browser[i+2]),
    );
  };
  const count=(pair, x0, y0, x1, y1, width=320)=>{
    let n=0, max=0, at=null;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
      const d=over(pair, x, y, width);
      if(d>max){max=d; at=[x, y];}
      if(d>2)n++;
    }
    return {n, max, at};
  };
  const whole=count(first, 0, 0, 320, 240);
  const interior=count(first, 20, 20, 300, 220);
  const next=count(first, 138, 196, 182, 213);
  const top=count(first, 0, 0, 320, 20);
  const left=count(first, 0, 20, 20, 220);
  const right=count(first, 300, 20, 320, 220);
  const bottom=count(first, 0, 220, 320, 240);
  assert.equal(whole.n, 6267);
  assert.equal(whole.max, 166);
  assert.deepEqual(whole.at, [296, 234]);
  assert.equal(interior.n, 195);
  assert.equal(next.n, 195);
  assert.deepEqual(next.at, [139, 211]);
  assert.equal(top.n+left.n+right.n+bottom.n, 6072);
  assert.equal(whole.n-interior.n, 6072);
  assert.deepEqual({top:top.n, left:left.n, right:right.n, bottom:bottom.n},
    {top:1487, left:1200, right:1170, bottom:2215});
  const peak=(296*4)+(234*320*4);
  assert.deepEqual([...first.native.slice(peak, peak+3)], [33, 32, 29]);
  assert.deepEqual([...first.browser.slice(peak, peak+3)], [199, 191, 177]);
  const body=(160*4)+(10*320*4);
  assert.deepEqual([...first.native.slice(body, body+3)], [211, 231, 174]);
  assert.deepEqual([...first.browser.slice(body, body+3)], [211, 231, 174]);
  assert.equal(count(first, 0, 32, 320, 64).n, 384, 'first-run lower row rect is guide veil, not empty-entry');
  assert.equal(count(empty, 0, 0, 320, 240).n, 16021, 'empty-entry lower is not this guide');
  const nativeUpper=await cropUpper(files.nativeFirst);
  const clock=count({native:nativeUpper, browser:await load(files.browserFirstUpper)}, 95, 216, 194, 240, 400);
  assert.equal(clock.n, 0);
  const report=JSON.parse(readFileSync(files.reportFirst, 'utf8'));
  assert.equal(report.screens.upper.pixelsOverThreshold, 6094);
  assert.equal(report.screens.lower.pixelsOverThreshold, 6267);
  assert.deepEqual(report.screens.lower.regions[0],
    {x:0, y:0, width:320, height:240, pixelCount:3955});
});
