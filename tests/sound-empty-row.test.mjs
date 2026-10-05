import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(new URL('../package.json', import.meta.url));
const firmware=new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const painter=readFileSync(new URL('../src/os/stock-native-sound.ts', import.meta.url), 'utf8');
const pack=JSON.parse(readFileSync(new URL('packs/sound/contents/0000-0000000b/lyt-S_Common-arc-LZ.json', firmware), 'utf8'));
const messages=JSON.parse(readFileSync(new URL('packs/sound/contents/0000-0000000b/msg-EU_English.json', firmware), 'utf8'));
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const flatten=panes=>panes.flatMap(pane=>[pane, ...flatten(pane.children??[])]);
const sample=(track, frame)=>{
  const keys=track.keys; if(!keys.length)return 0;
  if(keys.length===1||frame<=keys[0].frame)return keys[0].value;
  if(frame>=keys.at(-1).frame)return keys.at(-1).value;
  throw new Error(`unexpected interpolation ${track.target} ${track.property} @ ${frame}`);
};
const requested=painter.match(/alias:'sound-common',layouts:\[([^\]]+)\],animations:\[([^\]]+)\]/)??[];
const unusedPublishedClips=[
  'S_Common-BrwCursor_In', 'S_Common-BrwCursor_Out', 'S_Common-BrwCursor_CurBarIconPushP',
];
const unusedDumpLayouts=[
  'S_Common-BrwCursorB', 'S_Common-IconUGC', 'S_Common-IconUGC48',
  'S_Common-PlayCursor', 'S_Common-RecCursor', 'S_Common-TextTouch', 'S_Common-Null',
];
const unusedDumpClips=[
  'S_Common-BrwCursorB_Defult', 'S_Common-BrwCursorB_In', 'S_Common-BrwCursorB_Out',
  'S_Common-PlayCursor_listCslDefault', 'S_Common-RecCursor_Default',
];
const native14='/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/sound-native14/packs/sound/contents/0000-0000000b/lyt-S_Common-arc-LZ.json';

test('published row chrome already binds BrwCursor Default 18, IconList IconCHG 0 and Text P_BR_00', ()=>{
  assert.equal(pack.titleId, '0004001000022500');
  assert.equal(pack.contentId, '0000000b');
  assert.equal(pack.sourceSha256, '9857e44bf20955e342442d9f190f42264b177db2fc04c8bf3d63eac990d593a4');
  assert.equal(sha(new URL('packs/sound/contents/0000-0000000b/lyt-S_Common-arc-LZ.json', firmware)),
    'e8be90c0cdff577141c7e80fb0f28874c6db621eceb8f5b1eb702d3d3b28428e');
  assert.equal(pack.resourceSources.layouts['S_Common-BrwCursor'].sha256,
    '38e4ef9ff832f17d0e2d5ec2b253acfd43704792383f9b385490d7a195ae1de0');
  assert.equal(pack.resourceSources.animations['S_Common-BrwCursor_Default'].sha256,
    'faa0f0dc43669d65f769ec87ce7053511fab277844e667fe4ab020ae97ac759b');
  assert.equal(pack.resourceSources.layouts['S_Common-IconList'].sha256,
    '55762accaf9776aca29bd2eb030b80a186298cef1f9ce8c66461443342e020bd');
  assert.equal(pack.resourceSources.animations['S_Common-IconList_IconCHG'].sha256,
    '93adc3ffe9a00246ea63fe90e2ef8d73d209f21c53a9297df64d4f2f39c7e08d');
  assert.equal(pack.resourceSources.layouts['S_Common-Text'].sha256,
    '427d59279517d4ba322401ef96ce69f85491a426699cd82d81a61d0729067202');
  assert.equal(pack.resourceSources.textures['V3_BarCursorIcon09.bclim'].sha256,
    'aa4abb48d990d459ea11feba06377be474d3807e7cfc6e4a6ce76368ef635353');
  const bank=messages.messages.S;
  assert.equal(bank.messages[bank.labels.P_BR_00].text, 'Record & Edit Sounds');
  const cursor=flatten(pack.layouts['S_Common-BrwCursor'].roots);
  const bar=cursor.find(pane=>pane.name==='CurBarB0_P0');
  const icon=cursor.find(pane=>pane.name==='IconCurBarO_R');
  assert.equal(bar.kind, 'pic1');
  assert.deepEqual(bar.size, [420, 64]);
  assert.equal(bar.alpha, 88);
  assert.equal(icon.kind, 'pic1');
  assert.deepEqual(icon.size, [32, 32]);
  const list=flatten(pack.layouts['S_Common-IconList'].roots).find(pane=>pane.name==='ListIcon');
  assert.equal(list.kind, 'pic1');
  assert.deepEqual(list.size, [32, 32]);
  const text=flatten(pack.layouts['S_Common-Text'].roots).find(pane=>pane.name==='Null');
  assert.equal(text.kind, 'txt1');
  assert.equal(text.origin, 4);
  assert.equal(text.text.alignment, 3);
  assert.equal(text.text.lineAlignment, 2);
  assert.equal(text.text.font, 0);
  assert.deepEqual(text.text.topColor, [255, 255, 255, 255]);
  assert.equal(pack.layouts['S_Common-Text'].fonts[0], 'cbf_std.bcfnt');
  const def=pack.animations['S_Common-BrwCursor_Default'];
  const pattern=def.tracks.find(track=>track.target==='IconCurBarO_R'&&track.property==='texture.pattern');
  assert.equal(pattern.keys.findLast(key=>key.frame<=18).value, 9);
  assert.equal(def.textures[9], 'V3_BarCursorIcon09.bclim');
  assert.equal(def.tracks.some(track=>track.property==='visible'||track.target==='CurBarB0_P0'), false);
  const chg=pack.animations['S_Common-IconList_IconCHG'];
  const texTracks=chg.tracks.filter(track=>track.target==='ListIcon'&&track.property==='texture.pattern');
  assert.deepEqual(texTracks.map(track=>chg.textures[sample(track, 0)]), ['ListIcon_Bln.bclim', 'ListIcon_Bln_Toon.bclim']);
  assert.equal(Object.keys(pack.animations).filter(name=>name.includes('IconList')).join(), 'S_Common-IconList_IconCHG');
  for(const unused of unusedPublishedClips){
    assert.equal(Object.hasOwn(pack.animations, unused), true, unused);
    assert.equal(pack.animations[unused].tracks.some(track=>track.property==='visible'), false, unused);
    assert.equal(pack.animations[unused].tracks.some(track=>track.target==='CurBarB0_P0'||track.target==='ListIcon'), false, unused);
  }
  for(const unused of unusedDumpLayouts)assert.equal(Object.hasOwn(pack.layouts, unused), false, unused);
  for(const layout of ['S_Common-BrwCursor', 'S_Common-IconList']){
    for(const material of pack.layouts[layout].materials){
      if(!material.textureMaps?.length)continue;
      assert.equal(material.textureMaps.every(map=>map.magFilter===1&&map.minFilter===1), true, material.name);
    }
  }
});

test('painter keeps already-bound empty-entry row chrome and does not bind unused clips', ()=>{
  assert.match(requested[1]??'', /'S_Common-BrwCursor'/);
  assert.match(requested[1]??'', /'S_Common-IconList'/);
  assert.match(requested[1]??'', /'S_Common-Text'/);
  assert.match(requested[2]??'', /'S_Common-BrwCursor_Default'/);
  assert.match(requested[2]??'', /'S_Common-IconList_IconCHG'/);
  for(const unused of [...unusedPublishedClips, ...unusedDumpLayouts, ...unusedDumpClips, 'S_Common-ListScroll']){
    assert.equal((requested[1]??'').includes(`'${unused}'`), false, unused);
    assert.equal((requested[2]??'').includes(unused), false, unused);
    assert.equal(painter.includes(`name:'${unused}'`), false, unused);
  }
  assert.equal(painter.includes('azahar-12p4-fit'), false);
  assert.deepEqual(painter.match(/textSampling/g), ['textSampling', 'textSampling']);
  assert.match(painter, /textSampling:'lcd-source-size',textSamplingPanes:\['Guid1TxtW'\]/);
  assert.equal(painter.includes('textCoverageAdaptation'), false);
  assert.equal(painter.includes('nativeMipmaps'), false);
  assert.match(painter,
    /entry\(bottom,'sound-common','S_Common-BrwCursor',\{center:\[160,118\],bindings:\[\{name:'S_Common-BrwCursor_Default',frame:18\}\]\}\);/);
  assert.match(painter,
    /entry\(bottom,'sound-common','S_Common-IconList',\{center:\[43,47\],bindings:\[\{name:'S_Common-IconList_IconCHG',frame:0\}\]\}\);/);
  assert.match(painter,
    /entry\(bottom,'sound-common','S_Common-Text',\{center:\[55,46\],overrides:\{Null:\{text:message\('S','P_BR_00'\)\.text,size:\[264,30\],translation:\[132,0,0\]\}\}\}\);/);
});

test('dump unused row clips do not write CurBarB0 / ListIcon fill or hide the idle row', async t=>{
  if(!existsSync(native14))return t.skip('private sound-native14 S_Common pack is absent');
  const full=JSON.parse(readFileSync(native14, 'utf8'));
  assert.equal(full.sourceSha256, pack.sourceSha256);
  const hashes={
    'S_Common-BrwCursorB':'9b269026936b539c898101d3795ba148463289678af05afb8629207f294ecc9e',
    'S_Common-BrwCursorB_Defult':'7b869a8f1e1289e16000dc688a0cec8735a4da9f645647db321b27494396b7bf',
    'S_Common-BrwCursorB_In':'83a6c55a2d79eec5267ea88bc5bcc8de1e6973b295659fba6069428f5e2017af',
    'S_Common-IconUGC':'680cd0e884fe5a272588b9ae5b24c54583d03dcd1f3f3aca367e40a2e48704a8',
    'S_Common-IconUGC48':'26bc7ddd98412aff74e8230868d90525c62f1e9587fda76ced853f7d964970c4',
    'S_Common-PlayCursor':'c3f0459be760519546baa6ad53b73dbe54af3de5844524d3531c2cfc8b82048d',
    'S_Common-RecCursor':'988dab1c33a47186a01b26c9fc49687acc5504f0d39928916a0c106cc8dbd59c',
    'S_Common-TextTouch':'4613843e42d1546082c071d8709e2fb24fd81620722c1f808a4f9d26f7eee34f',
    'S_Common-Null':'61b5a2d6118cacea7e239988a6017bef105bd6bded9a65383e28e8ffdf69e75b',
  };
  for(const [name, digest] of Object.entries(hashes)){
    const src=full.resourceSources.layouts[name]??full.resourceSources.animations[name];
    assert.equal(src.sha256, digest, name);
  }
  const back=flatten(full.layouts['S_Common-BrwCursorB'].roots).find(pane=>pane.name==='CurBarB_BackP0');
  assert.equal(back.kind, 'pic1');
  assert.deepEqual(back.size, [420, 32]);
  assert.equal(back.alpha, 192);
  assert.deepEqual(full.layouts['S_Common-BrwCursorB'].textures, ['V3_BarCursorBase3.bclim']);
  const defult=full.animations['S_Common-BrwCursorB_Defult'];
  assert.equal(defult.tracks.some(track=>track.property==='visible'), false);
  assert.equal(sample(defult.tracks.find(track=>track.target==='CurBarBackP0'&&track.property==='scale.y'), 40), 1);
  for(const name of [...unusedDumpClips, ...unusedPublishedClips]){
    const clip=full.animations[name];
    assert.equal(clip.tracks.some(track=>track.property==='visible'), false, name);
    assert.equal(clip.tracks.some(track=>track.target==='CurBarB0_P0'||track.target==='ListIcon'||track.target==='Null'), false, name);
  }
  assert.equal(Object.keys(full.animations).filter(name=>name.includes('IconList')).join(), 'S_Common-IconList_IconCHG');
});

test('the reused HudTime-phase empty-entry lower keeps row 1916', async t=>{
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
  const row=count(empty, 0, 32, 320, 64);
  assert.equal(row.n, 1916);
  assert.equal(row.max, 241);
  assert.deepEqual(row.at, [18, 43]);
  const peak=(18*4)+(43*320*4);
  assert.deepEqual([...empty.native.slice(peak, peak+3)], [14, 39, 82]);
  assert.deepEqual([...empty.browser.slice(peak, peak+3)], [255, 255, 255]);
  const fill=count(empty, 0, 38, 7, 57);
  assert.equal(fill.n, 133);
  assert.equal(fill.max, 101);
  assert.deepEqual(fill.at, [0, 56]);
  assert.equal(count(empty, 56, 37, 280, 57).n, 0);
  assert.equal(count(empty, 0, 144, 320, 175).n, 4271);
  assert.equal(count(empty, 0, 178, 320, 240).n, 4707);
  assert.equal(count(first, 0, 32, 320, 64).n, 384, 'first-run lower is guide, not this row');
  const nativeUpper=await sharp(files.nativeEmpty).extract({left:0, top:0, width:400, height:240}).ensureAlpha().raw().toBuffer();
  const clock=count({native:nativeUpper, browser:await load(files.browserEmptyUpper)}, 95, 216, 194, 240, 400);
  assert.equal(clock.n, 0);
  const report=JSON.parse(readFileSync(files.reportEmpty, 'utf8'));
  assert.equal(report.screens.upper.pixelsOverThreshold, 6404);
  assert.equal(report.screens.lower.pixelsOverThreshold, 16021);
  assert.deepEqual(report.screens.lower.regions[1],
    {x:0, y:33, width:320, height:63, pixelCount:3215});
});
