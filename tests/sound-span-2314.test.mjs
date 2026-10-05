import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(new URL('../package.json', import.meta.url));
const room=readFileSync(new URL('../src/scene/sound-room.ts', import.meta.url), 'utf8');
const model=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/models/sound-span/model.json', import.meta.url), 'utf8'));
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');

test('Span resource has no clip and the 32 bars share the silent bind', ()=>{
  assert.equal(model.sourceSha256, 'ff9ce249149f835ecce97f693e3f2e1cabe3a2cfebb6bcdbb124d36d4005cf23');
  assert.equal(model.sourceName, 'S_Vis_Span_U.bcmdl.LZ');
  assert.deepEqual([
    model.skeletalAnimations.length,
    model.materialAnimations.length,
    model.visibilityAnimations.length,
    model.cameraAnimations.length,
  ], [0, 0, 0, 0]);
  const span=model.models[0];
  assert.equal(span.name, 'S_Vis_Span_U');
  assert.equal(span.meshes.length, 34);
  assert.equal(span.skeleton.length, 35);
  const lines=span.skeleton.filter(bone=>/^LightLine\d{2}$/.test(bone.Name));
  assert.equal(lines.length, 32);
  assert.deepEqual([...new Set(lines.map(bone=>[bone.Translation.X, bone.Translation.Y, bone.Translation.Z].join()))], ['0,-45,0']);
  const side=span.skeleton.find(bone=>bone.Name==='LightLineSide');
  assert.deepEqual([side.Translation.X, side.Translation.Y, side.Translation.Z], [0, -40, 0]);
});

test('the Span painter keeps the labelled Base fit and does not write bar heights', ()=>{
  assert.match(room, /colorFit:\{material:'Base',upperY:106,lowerY:111,upperRgb:\[38,104,219\],lowerRgb:\[21,57,120\],opaqueAlpha:true\}/);
  assert.match(room, /span\.group\.position\.set\(0,35\.3,-20\);span\.group\.rotation\.x=0\.611;span\.group\.scale\.set\(1\.27,0\.0068,1\)/);
  assert.equal(room.includes('LightLine'), false);
  assert.equal(room.includes('0x252670'), false);
});

test('the reused HudTime-phase pairs keep Span 2314/2442 and clock 0', async t=>{
  const root='/Users/paramveer/.codex/3ds-artifact-overflow';
  const recap=`${root}/home-fidelity-20261001/sound-clock-recapture-20261004`;
  const files={
    nativeFirst:`${root}/reference/screenshots/Nintendo 3DS Sound_25.09.26_22.27.14.541.png`,
    nativeEmpty:`${root}/reference/screenshots/Nintendo 3DS Sound_25.09.26_22.31.31.595.png`,
    browserFirst:`${recap}/browser-first-run/upper.png`,
    browserEmpty:`${recap}/browser-empty-entry/upper.png`,
    reportFirst:`${recap}/diff-sound-first-run-hudtime-phase/report.json`,
    reportEmpty:`${recap}/diff-sound-empty-entry-hudtime-phase/report.json`,
    mask:new URL('../scripts/native-compare/empty-mask.json', import.meta.url),
  };
  if(![files.nativeFirst, files.nativeEmpty, files.browserFirst, files.browserEmpty, files.reportFirst, files.reportEmpty].every(existsSync)){
    return t.skip('private Sound HudTime-phase pair is absent');
  }
  assert.equal(sha(files.nativeFirst), '9dea0cc2fa7022ccd032c5a94ae59c2dbe37e6b7e800fbf8668b356fc9e5ce69');
  assert.equal(sha(files.nativeEmpty), '65fc5f8819d31c49622d9e2a8ee7ba79c0675fd7dd3a73f783255eb7efe3b4cd');
  assert.equal(sha(files.browserFirst), '16565d8e586edce659beadb9e7f7d72bcd8e2b81479a85bca424480d4294ceab');
  assert.equal(sha(files.browserEmpty), '8d76f568cf79522a1febc689c44ac6b6f8328971e86e4dc4e535c1fe0a7216d0');
  assert.equal(sha(files.reportFirst), 'cb06bed5902eb0bf42f409ad3f3445799e7273fbc53dd1081101490184c3ba45');
  assert.equal(sha(files.reportEmpty), 'd28688a4a28c3c5cabc303cc6fb824045ee4a074f4f25fffcacc07944e5425f2');
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
    let n=0;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(over(pair, x, y)>2)n++;
    return n;
  };
  assert.equal(count(first, 0, 100, 400, 114), 2314);
  assert.equal(count(empty, 0, 100, 400, 114), 2442);
  let onlyEmpty=0, onlyFirst=0, both=0;
  for(let y=100;y<114;y++)for(let x=0;x<400;x++){
    const f=over(first, x, y)>2, e=over(empty, x, y)>2;
    if(f&&e)both++; else if(e)onlyEmpty++; else if(f)onlyFirst++;
  }
  assert.deepEqual({both, onlyFirst, onlyEmpty, split:onlyEmpty-onlyFirst}, {both:2141, onlyFirst:173, onlyEmpty:301, split:128});
  assert.equal(count(first, 95, 216, 194, 240), 0);
  assert.equal(count(empty, 95, 216, 194, 240), 0);
  const reportFirst=JSON.parse(readFileSync(files.reportFirst, 'utf8'));
  const reportEmpty=JSON.parse(readFileSync(files.reportEmpty, 'utf8'));
  assert.equal(reportFirst.screens.upper.pixelsOverThreshold, 6094);
  assert.equal(reportEmpty.screens.upper.pixelsOverThreshold, 6404);
});
