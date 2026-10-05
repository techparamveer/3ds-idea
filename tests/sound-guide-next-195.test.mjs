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

test('Guid1TxtW is the fractional Next pane and the painter samples only that pane', ()=>{
  assert.equal(pack.titleId, '0004001000022500');
  assert.equal(pack.contentId, '0000000b');
  const guid=flatten(pack.layouts.C_DlgGuid1BtnW.roots);
  const next=guid.find(pane=>pane.name==='Guid1TxtW');
  assert.equal(next.kind, 'txt1');
  assert.deepEqual(next.size, [120, 25.200000762939453]);
  assert.equal(next.text.alignment, 4);
  assert.equal(next.text.lineAlignment, 2);
  assert.deepEqual(next.text.size, [21, 25.200002670288086]);
  assert.equal(next.text.characterSpacing, 0);
  assert.equal(pack.layouts.C_DlgGuid1BtnW.fonts[0], 'cbf_std.bcfnt');
  const bank=messages.messages.S_tips;
  const message=bank.messages[bank.labels.Guide_D_N_Btn0];
  const style=messages.styles[bank.styleTable].styles[message.styleIndex];
  assert.equal(message.text, 'Next');
  assert.equal(style.characterSpacing, 0);
  assert.equal(style.fontScale[0], 0.8399999737739563);
  assert.equal(style.fontScale[1], 0.8399999737739563);
  const word=style.unresolvedWords['8'];
  assert.deepEqual([word&255, (word>>>8)&255, (word>>>16)&255, (word>>>24)&255], [69, 64, 57, 255]);
  const def=pack.animations.C_DlgGuid1BtnW_Default;
  assert.equal(def.tracks.some(track=>track.target==='Guid1TxtW'), false);
  assert.deepEqual(painter.match(/textSampling/g), ['textSampling', 'textSampling']);
  assert.match(painter, /textSampling:'lcd-source-size',textSamplingPanes:\['Guid1TxtW'\]/);
  assert.match(painter, /0x15dce8/);
  assert.match(painter, /0x2a5558/);
  assert.equal(painter.includes('textCoverageAdaptation'), false);
  assert.equal(painter.includes('azahar-12p4-fit'), false);
  assert.match(painter, /entry\(bottom,'sound-dialog','C_DlgGuid2Btn',\{bindings:\[\{name:'C_DlgGuid2Btn_Default',frame:0\}\]/);
});

test('Mac-screen recapture drops the Next interior to 0 and leaves the 6072 perimeter', async t=>{
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
  const count=(x0, y0, x1, y1)=>{
    let n=0;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
      const i=(y*320+x)*4;
      const d=Math.max(Math.abs(native[i]-browser[i]), Math.abs(native[i+1]-browser[i+1]), Math.abs(native[i+2]-browser[i+2]));
      if(d>2)n++;
    }
    return n;
  };
  assert.equal(count(0, 0, 320, 240), 6072);
  assert.equal(count(20, 20, 300, 220), 0);
  assert.equal(count(138, 196, 182, 213), 0);
  assert.equal(count(0, 0, 320, 20)+count(0, 20, 20, 220)+count(300, 20, 320, 220)+count(0, 220, 320, 240), 6072);
  const i=(211*320+139)*4;
  assert.deepEqual([native[i], native[i+1], native[i+2]], [69, 64, 57]);
  assert.deepEqual([browser[i], browser[i+1], browser[i+2]], [69, 64, 57]);
  const report=JSON.parse(readFileSync(files.report, 'utf8'));
  assert.equal(report.screens.lower.pixelsOverThreshold, 6072);
  assert.equal(report.screens.upper.pixelsOverThreshold, 6094);
});
