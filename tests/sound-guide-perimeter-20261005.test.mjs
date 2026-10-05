import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readdirSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(new URL('../package.json', import.meta.url));
const painter=readFileSync(new URL('../src/os/stock-native-sound.ts', import.meta.url), 'utf8');
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const flatten=panes=>panes.flatMap(pane=>[pane, ...flatten(pane.children??[])]);
const native14='/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/sound-native14/packs/sound/contents/0000-0000000b';

test('the settled guide painter does not gain a perimeter veil', ()=>{
  assert.match(painter, /draw\(bottom,'sound-dialog','C_DlgChA'\);/);
  assert.match(painter,
    /entry\(bottom,'sound-dialog','C_DlgGuid1BtnW',\{bindings:\[\{name:'C_DlgGuid1BtnW_Default',frame:0\}\],textSampling:'lcd-source-size',textSamplingPanes:\['Guid1TxtW'\]/);
  assert.deepEqual(painter.match(/textSampling/g), ['textSampling', 'textSampling']);
  for(const name of ['C_BkMask', 'C_TranAlFade', 'C_TranBkFade', 'C_TranDouble', 'C_TranWhFade', 'C_TranWipeLR', 'C--Tran']){
    assert.equal(painter.includes(name), false, name);
  }
  assert.equal(painter.includes('azahar-12p4-fit'), false);
  assert.equal(painter.includes('textCoverageAdaptation'), false);
});

test('transition masks are upper fades and no Sound material uses the darken blend', async t=>{
  const tranPath=`${native14}/lyt-C-Tran_U.json`;
  if(!existsSync(tranPath))return t.skip('private sound-native14 transition pack is absent');
  const tran=JSON.parse(readFileSync(tranPath, 'utf8'));
  assert.equal(tran.titleId, '0004001000022500');
  assert.equal(tran.contentId, '0000000b');
  assert.equal(tran.sourceSha256, 'de6ee71f535ee74df0f055ef6c9aa58ecb66c7f65cdfc82b0e16d9324b904fda');
  assert.equal(tran.resourceSources.layouts.C_BkMask.sha256,
    '81e6534f3f5f54b9ed529d9ce946381bd48824831102872fe99f78a624dd5743');
  assert.equal(tran.resourceSources.animations.C_BkMask_Out.sha256,
    '0d47b487bf8a7645edfd59c1d02b31ae36a55108ba151994fb20290ea591cd51');
  const mask=flatten(tran.layouts.C_BkMask.roots);
  const pict=mask.find(pane=>pane.name==='Pict');
  assert.equal(pict.kind, 'pic1');
  assert.deepEqual(pict.size, [400, 240]);
  assert.equal(pict.alpha, 0);
  const material=tran.layouts.C_BkMask.materials.find(entry=>entry.name==='Pict');
  assert.equal(material.colorBlend, undefined);
  assert.deepEqual(material.constantColors[0], [0, 0, 0, 255]);
  const out=tran.animations.C_BkMask_Out.tracks.find(track=>track.target==='Pict'&&track.property==='alpha');
  assert.deepEqual(out.keys.map(key=>[key.frame, key.value]), [[0, 0], [60, 255]]);
  const doubled=flatten(tran.layouts.C_TranDouble.roots).find(pane=>pane.name==='PictDouble');
  assert.deepEqual(doubled.size, [400, 240]);
  assert.equal(doubled.alpha, 50);
  let darken=0, packs=0;
  for(const file of readdirSync(native14).filter(name=>name.startsWith('lyt-')&&name.endsWith('.json'))){
    packs++;
    const pack=JSON.parse(readFileSync(`${native14}/${file}`, 'utf8'));
    for(const layout of Object.values(pack.layouts)){
      for(const entry of layout.materials??[]){
        const blend=entry.colorBlend;
        if(blend?.operation===1&&blend.sourceFactor===0&&blend.destinationFactor===5)darken++;
      }
    }
  }
  assert.equal(packs, 29);
  assert.equal(darken, 0);
  const dialog=JSON.parse(readFileSync(`${native14}/lyt-C-Dlg.json`, 'utf8'));
  const guid=flatten(dialog.layouts.C_DlgGuid1BtnW.roots);
  assert.equal(guid.some(pane=>pane.kind==='pic1'&&pane.size[0]>=320&&pane.size[1]>=240), false);
  assert.equal(flatten(dialog.layouts.C_NullDlg.roots).some(pane=>pane.kind==='pic1'), false);
  const def=dialog.animations.C_DlgGuid1BtnW_Default;
  assert.equal(def.tracks.some(track=>track.property==='visible'||track.property==='alpha'), false);
});

test('the post-Next first-run lower keeps complement 6072 and interior 0', async t=>{
  const root='/Users/paramveer/.codex/3ds-artifact-overflow';
  const recap=`${root}/home-fidelity-20261001/sound-guide-next-recapture-20261005`;
  const files={
    native:`${root}/reference/screenshots/Nintendo 3DS Sound_25.09.26_22.27.14.541.png`,
    browser:`${recap}/browser/lower.png`,
    upper:`${recap}/browser/upper.png`,
    report:`${recap}/report.json`,
    mask:new URL('../scripts/native-compare/empty-mask.json', import.meta.url),
  };
  if(![files.native, files.browser, files.upper, files.report].every(existsSync)){
    return t.skip('private Sound Next recapture pair is absent');
  }
  assert.equal(sha(files.native), '9dea0cc2fa7022ccd032c5a94ae59c2dbe37e6b7e800fbf8668b356fc9e5ce69');
  assert.equal(sha(files.browser), 'd78f43b62aebae3069e5308f46b59a9071587dca28ee07b38d7f77cd5ca34169');
  assert.equal(sha(files.upper), '16565d8e586edce659beadb9e7f7d72bcd8e2b81479a85bca424480d4294ceab');
  assert.equal(sha(files.report), '3aeaf44296bc98eb0f52be75e8a4b33dd53125e52f3bf4dc28e0f2023287b4ea');
  assert.equal(sha(files.mask), 'dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95');
  const sharp=require('sharp');
  const native=await sharp(files.native).extract({left:40, top:240, width:320, height:240}).ensureAlpha().raw().toBuffer();
  const browser=await sharp(files.browser).ensureAlpha().raw().toBuffer();
  const upperNative=await sharp(files.native).extract({left:0, top:0, width:400, height:240}).ensureAlpha().raw().toBuffer();
  const upperBrowser=await sharp(files.upper).ensureAlpha().raw().toBuffer();
  const count=(source, other, x0, y0, x1, y1, width)=>{
    let n=0, max=0, at=null;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
      const i=(y*width+x)*4;
      const d=Math.max(Math.abs(source[i]-other[i]), Math.abs(source[i+1]-other[i+1]), Math.abs(source[i+2]-other[i+2]));
      if(d>max){max=d; at=[x, y];}
      if(d>2)n++;
    }
    return {n, max, at};
  };
  const whole=count(native, browser, 0, 0, 320, 240, 320);
  const interior=count(native, browser, 20, 20, 300, 220, 320);
  const top=count(native, browser, 0, 0, 320, 20, 320);
  const left=count(native, browser, 0, 20, 20, 220, 320);
  const right=count(native, browser, 300, 20, 320, 220, 320);
  const bottom=count(native, browser, 0, 220, 320, 240, 320);
  assert.equal(whole.n, 6072);
  assert.equal(whole.max, 166);
  assert.deepEqual(whole.at, [296, 234]);
  assert.equal(interior.n, 0);
  assert.equal(count(native, browser, 138, 196, 182, 213, 320).n, 0);
  assert.equal(top.n+left.n+right.n+bottom.n, 6072);
  assert.deepEqual({top:top.n, left:left.n, right:right.n, bottom:bottom.n},
    {top:1487, left:1200, right:1170, bottom:2215});
  const peak=(234*320+296)*4;
  assert.deepEqual([native[peak], native[peak+1], native[peak+2]], [33, 32, 29]);
  assert.deepEqual([browser[peak], browser[peak+1], browser[peak+2]], [199, 191, 177]);
  const chrome=(10*320+160)*4;
  assert.deepEqual([native[chrome], native[chrome+1], native[chrome+2]], [211, 231, 174]);
  assert.deepEqual([browser[chrome], browser[chrome+1], browser[chrome+2]], [211, 231, 174]);
  const next=(211*320+139)*4;
  assert.deepEqual([native[next], native[next+1], native[next+2]], [69, 64, 57]);
  assert.deepEqual([browser[next], browser[next+1], browser[next+2]], [69, 64, 57]);
  assert.equal(count(upperNative, upperBrowser, 95, 216, 194, 240, 400).n, 0);
  const report=JSON.parse(readFileSync(files.report, 'utf8'));
  assert.equal(report.screens.lower.pixelsOverThreshold, 6072);
  assert.equal(report.screens.upper.pixelsOverThreshold, 6094);
});
