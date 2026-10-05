import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(new URL('../package.json', import.meta.url));
const firmware=new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const painter=readFileSync(new URL('../src/os/stock-native-sound.ts', import.meta.url), 'utf8');
const renderer=readFileSync(new URL('../src/os/native-renderer.ts', import.meta.url), 'utf8');
const pack=JSON.parse(readFileSync(new URL('packs/sound/contents/0000-0000000b/lyt-S_Inf_U-arc-LZ.json', firmware), 'utf8'));
const messages=JSON.parse(readFileSync(new URL('packs/sound/contents/0000-0000000b/msg-EU_English.json', firmware), 'utf8'));
const font=JSON.parse(readFileSync(new URL('fonts/shared/font.json', firmware), 'utf8'));
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const flatten=panes=>panes.flatMap(pane=>[pane, ...flatten(pane.children??[])]);
const title=pack.layouts['S_Inf_U-TitleBar'];
const panes=flatten(title.roots);
const titl=panes.find(pane=>pane.name==='TitlTxt');
const unusedClips=[
  'S_Inf_U-TitleBar_TitleBevelIn', 'S_Inf_U-TitleBar_TitleBevelOut',
  'S_Inf_U-TitleBar_TitleCenterIn', 'S_Inf_U-TitleBar_TitleCenterOut',
  'S_Inf_U-TitleBar_TitleLeftOut',
];
const requested=painter.match(/alias:'sound-info',layouts:\[([^\]]+)\],animations:\[([^\]]+)\]/)??[];

test('TitleBar already binds TitlTxt on cbf_std; unused clips do not target the glyphs', ()=>{
  assert.equal(pack.titleId, '0004001000022500');
  assert.equal(pack.contentId, '0000000b');
  assert.equal(pack.sourceSha256, '2ce1ae0f041e40bfde2467c3323de8a327f0b53d6a96b3a979b228507da4ce7e');
  assert.equal(sha(new URL('packs/sound/contents/0000-0000000b/lyt-S_Inf_U-arc-LZ.json', firmware)),
    'ff48060bf81844c2992394038aa386a064a55a0a7fe5b6e7e6e533a77e4919c9');
  assert.equal(pack.resourceSources.layouts['S_Inf_U-TitleBar'].sha256,
    '9a24808b5af62465d7fc6e07c9ee55971a4b0b8cf3a3bc135a25a8bf664ec273');
  assert.equal(pack.resourceSources.animations['S_Inf_U-TitleBar_TitleLeftIn'].sha256,
    '91ae062746082be9118bfa76d6bcda2ff88854d9060427822d3eab8884dbc3d5');
  assert.deepEqual(title.fonts, ['cbf_std.bcfnt']);
  assert.deepEqual(flatten(title.roots).filter(pane=>pane.kind==='txt1').map(pane=>pane.name), ['TitlTxt']);
  assert.equal(titl.text.font, 0);
  assert.equal(titl.origin, 3);
  assert.deepEqual(titl.translation, [-168, 104, 0]);
  assert.deepEqual(titl.size, [1024, 23]);
  assert.equal(titl.text.alignment, 3);
  assert.equal(titl.text.lineAlignment, 2);
  assert.deepEqual(titl.text.size, [20, 24]);
  assert.deepEqual(titl.text.topColor, [255, 255, 255, 255]);
  const nullPane=panes.find(pane=>pane.name==='Null_00');
  assert.equal(nullPane.kind, 'pan1');
  assert.equal(nullPane.text, undefined);
  assert.deepEqual(nullPane.size, [32, 32]);
  assert.equal(Object.hasOwn(pack.layouts, 'S_Inf_U-Txt'), false);
  assert.equal(font.sourceSha256, '95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581');
  const bank=messages.messages.S;
  const message=bank.messages[bank.labels.C_T_00];
  assert.equal(message.text, 'Nintendo 3DS Sound');
  assert.equal(message.styleIndex, 87);
  assert.equal(messages.styles[bank.styleTable].styles[87].unresolvedWords['0'], 336);
  for(const name of unusedClips){
    assert.deepEqual([...new Set(pack.animations[name].tracks.map(track=>track.target))].sort(),
      ['TitBarBvlC', 'TitBarBvlL'], name);
    assert.equal(pack.animations[name].tracks.some(track=>track.target==='TitlTxt'), false, name);
  }
  assert.deepEqual([...new Set(pack.animations['S_Inf_U-TitleBar_TitleLeftIn'].tracks.map(track=>track.target))].sort(),
    ['TitBarBvlC', 'TitBarBvlL']);
});

test('painter keeps TitleLeftIn and the capture-fitted TitlTxt box; lcd/coverage stay off', ()=>{
  assert.match(requested[1]??'', /'S_Inf_U-TitleBar'/);
  assert.match(requested[2]??'', /'S_Inf_U-TitleBar_TitleLeftIn'/);
  for(const unused of unusedClips){
    assert.equal((requested[2]??'').includes(unused), false, unused);
    assert.equal(painter.includes(`name:'${unused}'`), false, unused);
  }
  assert.equal(painter.includes('S_Inf_U-Txt'), false);
  assert.equal(painter.includes('TitlBlln'), false);
  assert.equal(painter.includes('HudNOTES'), false);
  assert.deepEqual(painter.match(/textSampling/g), ['textSampling', 'textSampling']);
  assert.match(painter, /textSampling:'lcd-source-size',textSamplingPanes:\['Guid1TxtW'\]/);
  assert.equal(painter.includes('textCoverageAdaptation'), false);
  assert.equal(painter.includes('azahar-12p4-fit'), false);
  assert.equal(painter.includes('nativeMipmaps'), false);
  assert.match(painter, /bindings:\[\{name:'S_Inf_U-TitleBar_TitleLeftIn',frame:5\}\],overrides:\{TitlTxt:\{text:message\('S','C_T_00'\)\.text,translation:\[-104,104,0\],size:\[240,23\]\}\}/);
  assert.match(painter, /titleBarCaptureFit&&\['TitBar','TitBarBvlL','TitBarBvlC'\]\.includes\(material\.name\)\?\[41,113,238,255\]/);
  assert.match(renderer, /text\.lineAlignment===0\|\|sourceSize&&text\.alignment===4&&text\.lineAlignment===2/);
  const sourceSize=false;
  const directLine=titl.text.lineAlignment===0||sourceSize&&titl.text.alignment===4&&titl.text.lineAlignment===2;
  assert.equal(directLine, false, 'TitlTxt cannot take the lcd direct writer or azahar-12p4-fit');
});

test('the reused HudTime-phase pairs keep identical 1774 title glyphs', async t=>{
  const root='/Users/paramveer/.codex/3ds-artifact-overflow';
  const recap=`${root}/home-fidelity-20261001/sound-clock-recapture-20261004`;
  const files={
    nativeFirst:`${root}/reference/screenshots/Nintendo 3DS Sound_25.09.26_22.27.14.541.png`,
    nativeEmpty:`${root}/reference/screenshots/Nintendo 3DS Sound_25.09.26_22.31.31.595.png`,
    browserFirst:`${recap}/browser-first-run/upper.png`,
    browserEmpty:`${recap}/browser-empty-entry/upper.png`,
    reportFirst:`${recap}/diff-sound-first-run-hudtime-phase/report.json`,
    reportEmpty:`${recap}/diff-sound-empty-entry-hudtime-phase/report.json`,
    contactFirst:`${recap}/diff-sound-first-run-hudtime-phase/upper-contact-sheet.png`,
    contactEmpty:`${recap}/diff-sound-empty-entry-hudtime-phase/upper-contact-sheet.png`,
    mask:new URL('../scripts/native-compare/empty-mask.json', import.meta.url),
  };
  if(![files.nativeFirst, files.nativeEmpty, files.browserFirst, files.browserEmpty, files.reportFirst, files.reportEmpty, files.contactFirst, files.contactEmpty].every(existsSync)){
    return t.skip('private Sound HudTime-phase pair is absent');
  }
  assert.equal(sha(files.nativeFirst), '9dea0cc2fa7022ccd032c5a94ae59c2dbe37e6b7e800fbf8668b356fc9e5ce69');
  assert.equal(sha(files.nativeEmpty), '65fc5f8819d31c49622d9e2a8ee7ba79c0675fd7dd3a73f783255eb7efe3b4cd');
  assert.equal(sha(files.browserFirst), '16565d8e586edce659beadb9e7f7d72bcd8e2b81479a85bca424480d4294ceab');
  assert.equal(sha(files.browserEmpty), '8d76f568cf79522a1febc689c44ac6b6f8328971e86e4dc4e535c1fe0a7216d0');
  assert.equal(sha(files.reportFirst), 'cb06bed5902eb0bf42f409ad3f3445799e7273fbc53dd1081101490184c3ba45');
  assert.equal(sha(files.reportEmpty), 'd28688a4a28c3c5cabc303cc6fb824045ee4a074f4f25fffcacc07944e5425f2');
  assert.equal(sha(files.contactFirst), 'a37bd43b49408e3a729029355fbd191e45b29d0714d282e80eb2d10eac4e8356');
  assert.equal(sha(files.contactEmpty), '40a99fb8dfa25654332816161d24293d70f3a4ec37cb600fe61fddfd311a4996');
  assert.equal(sha(files.mask), 'dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95');
  const sharp=require('sharp');
  const crop=async path=>(await sharp(path).extract({left:0, top:0, width:400, height:240}).ensureAlpha().raw().toBuffer());
  const load=async path=>(await sharp(path).ensureAlpha().raw().toBuffer());
  const first={native:await crop(files.nativeFirst), browser:await load(files.browserFirst)};
  const empty={native:await crop(files.nativeEmpty), browser:await load(files.browserEmpty)};
  const over=(pair, x, y)=>{
    const i=(y*400+x)*4;
    return Math.max(
      Math.abs(pair.native[i]-pair.browser[i]),
      Math.abs(pair.native[i+1]-pair.browser[i+1]),
      Math.abs(pair.native[i+2]-pair.browser[i+2]),
    );
  };
  const count=(pair, x0, y0, x1, y1)=>{
    let n=0, max=0, at=null, xs=[], ys=[];
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
      const d=over(pair, x, y);
      if(d>max){max=d; at=[x, y];}
      if(d>2){n++; xs.push(x); ys.push(y);}
    }
    return {n, max, at, bbox:xs.length?[Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]:null};
  };
  const firstTitle=count(first, 0, 3, 400, 30);
  const emptyTitle=count(empty, 0, 3, 400, 30);
  assert.equal(firstTitle.n, 1774);
  assert.equal(emptyTitle.n, 1774);
  assert.equal(firstTitle.max, 148);
  assert.deepEqual(firstTitle.at, [232, 19]);
  assert.deepEqual(firstTitle.bbox, [97, 7, 302, 25]);
  assert.deepEqual(emptyTitle, firstTitle);
  let same=0, onlyFirst=0, onlyEmpty=0;
  for(let y=3;y<30;y++)for(let x=0;x<400;x++){
    const f=over(first, x, y)>2, e=over(empty, x, y)>2;
    if(f&&e)same++; else if(f)onlyFirst++; else if(e)onlyEmpty++;
  }
  assert.deepEqual({same, onlyFirst, onlyEmpty}, {same:1774, onlyFirst:0, onlyEmpty:0});
  assert.equal(count(first, 95, 216, 194, 240).n, 0);
  assert.equal(count(empty, 95, 216, 194, 240).n, 0);
  assert.equal(count(first, 0, 3, 400, 7).n, 0);
  assert.equal(count(first, 0, 26, 400, 30).n, 0);
  const reportFirst=JSON.parse(readFileSync(files.reportFirst, 'utf8'));
  const reportEmpty=JSON.parse(readFileSync(files.reportEmpty, 'utf8'));
  assert.equal(reportFirst.screens.upper.pixelsOverThreshold, 6094);
  assert.equal(reportFirst.screens.lower.pixelsOverThreshold, 6267);
  assert.equal(reportEmpty.screens.upper.pixelsOverThreshold, 6404);
  assert.equal(reportEmpty.screens.lower.pixelsOverThreshold, 16021);
  const titleRegion=report=>report.screens.upper.regions.filter(region=>region.y<30)[0];
  assert.deepEqual(titleRegion(reportFirst), {x:97, y:8, width:13, height:17, pixelCount:167});
  assert.deepEqual(titleRegion(reportEmpty), {x:97, y:8, width:13, height:17, pixelCount:167});
});
