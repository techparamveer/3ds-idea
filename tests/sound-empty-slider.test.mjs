import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(new URL('../package.json', import.meta.url));
const firmware=new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const painter=readFileSync(new URL('../src/os/stock-native-sound.ts', import.meta.url), 'utf8');
const pack=JSON.parse(readFileSync(new URL('packs/sound/contents/0000-0000000b/lyt-C-Sld.json', firmware), 'utf8'));
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const flatten=panes=>panes.flatMap(pane=>[pane, ...flatten(pane.children??[])]);
const layout=pack.layouts.C_SldH_L;
const panes=flatten(layout.roots);
const dumpGroups=(groups=[])=>Object.fromEntries(groups.map(group=>[group.name, group.panes??[]]));
const sample=(track, frame)=>{
  const keys=track.keys; if(!keys.length)return 0;
  if(keys.length===1||frame<=keys[0].frame)return keys[0].value;
  if(frame>=keys.at(-1).frame)return keys.at(-1).value;
  throw new Error(`unexpected interpolation ${track.target} ${track.property} @ ${frame}`);
};
const requested=painter.match(/alias:'sound-slider',layouts:\[([^\]]+)\],animations:\[([^\]]+)\]/)??[];
const unusedClips=['C_SldH_L_Disable', 'C_SldH_L_Push', 'C_SldH_L_MRate'];
const native14='/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/sound-native14/packs/sound/contents/0000-0000000b/lyt-C-Sld.json';

test('published C_SldH_L already binds Default 20 + Rate 0; unused dump clips are not in the pack', ()=>{
  assert.equal(pack.titleId, '0004001000022500');
  assert.equal(pack.contentId, '0000000b');
  assert.equal(pack.sourceSha256, '99dfae740200625cdd6d0bbd9f354ea71dd27d0319affffaf9c6076ebe2ab28d');
  assert.equal(sha(new URL('packs/sound/contents/0000-0000000b/lyt-C-Sld.json', firmware)),
    '76bad1dc64b5c36f3ddeb1acd27ee465033dca2ac126d3808e59cb5f079e4ed0');
  assert.deepEqual(Object.keys(pack.layouts).sort(), ['C_SldH_L', 'C_SldT']);
  assert.deepEqual(Object.keys(pack.animations).sort(),
    ['C_SldH_L_Default', 'C_SldH_L_Rate', 'C_SldT_Default', 'C_SldT_Push', 'C_SldT_Rate']);
  assert.equal(pack.resourceSources.layouts.C_SldH_L.sha256,
    '8d85e394cf184602ab0c45eeec499a8741ddf4194894ac01af5d1fee13399303');
  assert.equal(pack.resourceSources.animations.C_SldH_L_Default.sha256,
    '6c4ef2cbb3e025a57fe51260604c785e0b7af1c75fa6bfb2ad939be991f8f429');
  assert.equal(pack.resourceSources.animations.C_SldH_L_Rate.sha256,
    'd3bad77835a0ddc24402804571819d377b10a9011685c1b37db9cfd450a4218d');
  assert.deepEqual(dumpGroups(layout.groups[0].children), {
    Rate: ['S_Rate', 'IconS'], MRate: ['M_Rate'], Btn: ['BtnN', 'BtnP', 'Box'],
  });
  const icon=panes.find(pane=>pane.name==='IconS');
  const box=panes.find(pane=>pane.name==='Box');
  assert.equal(icon.kind, 'pic1');
  assert.equal(icon.flags, 1);
  assert.deepEqual(icon.translation, [-120, -0, 0]);
  assert.deepEqual(icon.size, [8, 16]);
  assert.deepEqual(box.translation, [-0, -1, 0]);
  assert.deepEqual(box.size, [18, 28]);
  assert.equal(layout.materials[icon.picture.material].name, 'IconS');
  assert.deepEqual(layout.materials[icon.picture.material].bufferColor, [22, 6, 6, 0]);
  assert.deepEqual(layout.materials[box.picture.material].bufferColor, [95, 75, 33, 0]);
  assert.equal(pack.textures['C_SldHL_IconS.bclim'].formatName, 'L8');
  assert.equal(pack.textures['C_SldHL_BtnS.bclim'].formatName, 'ETC1A4');
  assert.equal(pack.textures['C_SldHL_IconS.bclim'].sha256,
    'c4efcdbc6d3d35f5791f7b690d3cc51233e991ddef0d5a4c7be8a7f703bc500f');
  assert.equal(pack.resourceSources.textures['C_SldHL_IconS.bclim'].sha256,
    'dba155359fd5eb19f41f50fbeb7c78be214cced4058c27e51d84ad137cc65d2c');
  assert.equal(pack.resourceSources.textures['C_SldHL_BtnS.bclim'].sha256,
    'e7213c21bf6ab2cda4c0ca857b255937ac7bda65e1d62169c9b71d18f5dbdade');
  for(const material of layout.materials){
    assert.deepEqual(material.tevStages, []);
    assert.equal(material.textureMaps.every(map=>map.magFilter===1&&map.minFilter===1), true, material.name);
  }
  const def=pack.animations.C_SldH_L_Default;
  const rate=pack.animations.C_SldH_L_Rate;
  assert.deepEqual(def.groups, ['Btn']);
  assert.deepEqual(rate.groups, ['Rate']);
  assert.equal(def.tracks.some(track=>track.property==='visible'), false);
  assert.equal(rate.tracks.some(track=>track.property==='visible'), false);
  assert.equal(def.tracks.some(track=>track.target==='IconS'&&track.binding==='material'), false);
  assert.equal(rate.tracks.some(track=>track.binding==='material'), false);
  const rateX=rate.tracks.filter(track=>track.target==='IconS'&&track.property==='translation.x');
  assert.equal(rateX.length, 1);
  assert.equal(sample(rateX[0], 0), -120);
  assert.equal(sample(rateX[0], 100), 120);
  const btnColor=def.tracks.filter(track=>track.binding==='material'&&track.target==='Box');
  for(const track of btnColor){
    assert.equal(sample(track, 0), sample(track, 20));
  }
  for(const pane of ['SS-', 'SE-']){
    const placeholder=panes.find(item=>item.name===pane);
    assert.equal(placeholder.kind, 'pan1');
    assert.equal(placeholder.picture, undefined);
  }
  for(const unused of unusedClips)assert.equal(Object.hasOwn(pack.animations, unused), false, unused);
});

test('painter keeps Default 20 / Rate 0 and does not bind unused slider clips', ()=>{
  assert.match(requested[1]??'', /'C_SldH_L'/);
  assert.match(requested[2]??'', /'C_SldH_L_Default'/);
  assert.match(requested[2]??'', /'C_SldH_L_Rate'/);
  for(const unused of unusedClips){
    assert.equal((requested[2]??'').includes(unused), false, unused);
    assert.equal(painter.includes(unused), false, unused);
  }
  assert.equal(painter.includes('C_SldV_L'), false);
  assert.equal(painter.includes('C_SldV_S'), false);
  assert.equal(painter.includes('azahar-12p4-fit'), false);
  assert.deepEqual(painter.match(/textSampling/g), ['textSampling', 'textSampling']);
  assert.match(painter, /textSampling:'lcd-source-size',textSamplingPanes:\['Guid1TxtW'\]/);
  assert.equal(painter.includes('nativeMipmaps'), false);
  assert.match(painter,
    /entry\(bottom,'sound-slider','C_SldH_L',\{center:\[160,159\],bindings:\[\{name:'C_SldH_L_Default',frame:20\},\{name:'C_SldH_L_Rate',frame:0\}\]\}\);/);
  assert.match(painter, /bindings:\[\{name:'S_Inf_U-TitleBar_TitleLeftIn',frame:5\}\],overrides:\{TitlTxt:\{text:message\('S','C_T_00'\)\.text,translation:\[-104,104,0\],size:\[240,23\]\}\}/);
  assert.match(painter, /\{name:'C_HudSndB_Pattern',frame:0\}/);
  assert.match(painter, /soundHudBatteryPatternFrame/);
});

test('dump Disable/Push/MRate do not hide IconS or rewrite its material', async t=>{
  if(!existsSync(native14))return t.skip('private sound-native14 C_Sld pack is absent');
  const full=JSON.parse(readFileSync(native14, 'utf8'));
  assert.equal(full.sourceSha256, pack.sourceSha256);
  assert.equal(full.resourceSources.animations.C_SldH_L_Disable.sha256,
    'ec7e2ae644f1ffbcb6a5a28539b06942074868b654a5dace2e2ab768c90d6303');
  assert.equal(full.resourceSources.animations.C_SldH_L_Push.sha256,
    '7cfe8931afd3391a09d7d364392dc74c9fba45b2de3f786f765e693b83585346');
  assert.equal(full.resourceSources.animations.C_SldH_L_MRate.sha256,
    '4ea3257bf54eac41f29f6cd395991cec47271304517d6c9ab7c6bfa08009cef9');
  const disable=full.animations.C_SldH_L_Disable;
  const push=full.animations.C_SldH_L_Push;
  const mrate=full.animations.C_SldH_L_MRate;
  assert.deepEqual(disable.groups, ['Btn']);
  assert.deepEqual(push.groups, ['Btn']);
  assert.deepEqual(mrate.groups, ['MRate']);
  for(const clip of [disable, push, mrate]){
    assert.equal(clip.tracks.some(track=>track.property==='visible'), false, clip.name??'clip');
    assert.equal(clip.tracks.some(track=>track.target==='IconS'&&track.binding==='material'), false);
  }
  const boxRed=disable.tracks.find(track=>track.binding==='material'&&track.target==='Box'&&track.property==='materialColor.0.0');
  assert.equal(sample(boxRed, 0), 95);
  assert.equal(sample(boxRed, 1), 95);
});

test('the reused HudTime-phase empty-entry lower keeps slider 4271', async t=>{
  const root='/Users/paramveer/.codex/3ds-artifact-overflow';
  const recap=`${root}/home-fidelity-20261001/sound-clock-recapture-20261004`;
  const files={
    nativeFirst:`${root}/reference/screenshots/Nintendo 3DS Sound_25.09.26_22.27.14.541.png`,
    nativeEmpty:`${root}/reference/screenshots/Nintendo 3DS Sound_25.09.26_22.31.31.595.png`,
    browserFirst:`${recap}/browser-first-run/lower.png`,
    browserEmpty:`${recap}/browser-empty-entry/lower.png`,
    browserEmptyUpper:`${recap}/browser-empty-entry/upper.png`,
    reportEmpty:`${recap}/diff-sound-empty-entry-hudtime-phase/report.json`,
    contactEmpty:`${recap}/diff-sound-empty-entry-hudtime-phase/lower-contact-sheet.png`,
    mask:new URL('../scripts/native-compare/empty-mask.json', import.meta.url),
  };
  if(![files.nativeFirst, files.nativeEmpty, files.browserFirst, files.browserEmpty, files.browserEmptyUpper, files.reportEmpty, files.contactEmpty].every(existsSync)){
    return t.skip('private Sound HudTime-phase pair is absent');
  }
  assert.equal(sha(files.nativeFirst), '9dea0cc2fa7022ccd032c5a94ae59c2dbe37e6b7e800fbf8668b356fc9e5ce69');
  assert.equal(sha(files.nativeEmpty), '65fc5f8819d31c49622d9e2a8ee7ba79c0675fd7dd3a73f783255eb7efe3b4cd');
  assert.equal(sha(files.browserEmptyUpper), '8d76f568cf79522a1febc689c44ac6b6f8328971e86e4dc4e535c1fe0a7216d0');
  assert.equal(sha(files.browserEmpty), 'ee103d93d744f5037fd36f24ad93403bf57298b2e1d74752da09d542023ea38d');
  assert.equal(sha(files.reportEmpty), 'd28688a4a28c3c5cabc303cc6fb824045ee4a074f4f25fffcacc07944e5425f2');
  assert.equal(sha(files.contactEmpty), '4cd485a1adcb1a0d66afb2b7b911b92037262896e6d085df92fed320de31b9f4');
  assert.equal(sha(files.mask), 'dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95');
  const sharp=require('sharp');
  const crop=async path=>(await sharp(path).extract({left:40, top:240, width:320, height:240}).ensureAlpha().raw().toBuffer());
  const load=async path=>(await sharp(path).ensureAlpha().raw().toBuffer());
  const empty={native:await crop(files.nativeEmpty), browser:await load(files.browserEmpty)};
  const first={native:await crop(files.nativeFirst), browser:await load(files.browserFirst)};
  const over=(pair, x, y)=>{
    const i=(y*320+x)*4;
    return Math.max(
      Math.abs(pair.native[i]-pair.browser[i]),
      Math.abs(pair.native[i+1]-pair.browser[i+1]),
      Math.abs(pair.native[i+2]-pair.browser[i+2]),
    );
  };
  const count=(pair, x0, y0, x1, y1)=>{
    let n=0, max=0, at=null;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
      const d=over(pair, x, y);
      if(d>max){max=d; at=[x, y];}
      if(d>2)n++;
    }
    return {n, max, at};
  };
  const slider=count(empty, 0, 144, 320, 175);
  assert.equal(slider.n, 4271);
  assert.equal(slider.max, 195);
  assert.deepEqual(slider.at, [39, 152]);
  const peak=(39*4)+(152*320*4);
  assert.deepEqual([...empty.native.slice(peak, peak+3)], [60, 47, 47]);
  assert.deepEqual([...empty.browser.slice(peak, peak+3)], [255, 51, 68]);
  assert.equal(count(empty, 38, 152, 42, 166).n, 56);
  assert.equal(count(empty, 0, 32, 320, 64).n, 1916);
  assert.equal(count(empty, 0, 178, 320, 240).n, 4707);
  assert.equal(count(first, 0, 144, 320, 175).n, 372, 'first-run lower is guide, not this slider');
  const report=JSON.parse(readFileSync(files.reportEmpty, 'utf8'));
  assert.equal(report.screens.upper.pixelsOverThreshold, 6404);
  assert.equal(report.screens.lower.pixelsOverThreshold, 16021);
  assert.deepEqual(report.screens.lower.regions[0], {x:0, y:144, width:320, height:31, pixelCount:4168});
  const tick=report.screens.lower.regions.find(region=>region.x===38&&region.y===152);
  assert.deepEqual(tick, {x:38, y:152, width:4, height:14, pixelCount:56});
});
