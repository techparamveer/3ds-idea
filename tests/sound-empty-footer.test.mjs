import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(new URL('../package.json', import.meta.url));
const firmware=new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const painter=readFileSync(new URL('../src/os/stock-native-sound.ts', import.meta.url), 'utf8');
const pack=JSON.parse(readFileSync(new URL('packs/sound/contents/0000-0000000b/lyt-S_Common-arc-LZ.json', firmware), 'utf8'));
const bg=JSON.parse(readFileSync(new URL('packs/sound/contents/0000-0000000b/lyt-S_BG-arc-LZ.json', firmware), 'utf8'));
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
const unusedDumpClips=[
  'S_Common-OpLBtn_Disable', 'S_Common-OpLBtn_In', 'S_Common-OpLBtn_Out', 'S_Common-OpLBtn_Push',
  'S_Common-OpRBtn_Default', 'S_Common-OpRBtn_In', 'S_Common-OpRBtn_Out', 'S_Common-OpRBtn_Push',
  'S_Common-SetBtn_In', 'S_Common-SetBtn_Out', 'S_Common-SetBtn_Push',
];
const unusedPublishedClips=['S_Common-OpenBtn_Disable', 'S_Common-OpenBtn_In', 'S_Common-OpenBtn_Out', 'S_Common-OpenBtn_Push'];
const native14='/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/sound-native14/packs/sound/contents/0000-0000000b/lyt-S_Common-arc-LZ.json';

test('published footer chrome already binds the five buttons + S_BG_D-Ctr; unused dump clips are not in the pack', ()=>{
  assert.equal(pack.titleId, '0004001000022500');
  assert.equal(pack.contentId, '0000000b');
  assert.equal(pack.sourceSha256, '9857e44bf20955e342442d9f190f42264b177db2fc04c8bf3d63eac990d593a4');
  assert.equal(sha(new URL('packs/sound/contents/0000-0000000b/lyt-S_Common-arc-LZ.json', firmware)),
    'e8be90c0cdff577141c7e80fb0f28874c6db621eceb8f5b1eb702d3d3b28428e');
  assert.equal(pack.resourceSources.layouts['S_Common-OpLBtn'].sha256,
    'd0c75cbe6df9a34d18c22bd8f1f56da6020ffc472bba6950b1f97168c4614f71');
  assert.equal(pack.resourceSources.animations['S_Common-OpLBtn_Default'].sha256,
    'e4037e2775e1ddb89abc8802570c7e5f3cce3068b08dccee9dcefe665905e49b');
  assert.equal(pack.resourceSources.layouts['S_Common-OpRBtn'].sha256,
    '0f9e4e19a3df277603103670d23212473ab8b29ea45312b21ca807abf6418904');
  assert.equal(pack.resourceSources.animations['S_Common-OpRBtn_Disable'].sha256,
    '8327c118d62d1a47ae6f698af3e049cf8a050a52cf0bc81b7078bc7c019a4e10');
  assert.equal(pack.resourceSources.layouts['S_Common-OpenBtn'].sha256,
    'd9663a18016abbb2d9bef5e0b6e30b42d40e136ed435114f1ff76673d086505f');
  assert.equal(pack.resourceSources.animations['S_Common-OpenBtn_Default'].sha256,
    'c831653313ed795fdb4e544eefdfb0fd9a335b1032eae297bf0031cbe893a529');
  assert.equal(pack.resourceSources.layouts['S_Common-SetBtn'].sha256,
    '9e6bfad876fab25636b44b520dec6920ca2bef9b1ea7830cb522bfd9fdc4a6d7');
  assert.equal(pack.resourceSources.animations['S_Common-SetBtn_Default'].sha256,
    '2ec0ad227db100745affbb743ec9e059ec4e027322a5355eb809d16b4a69ca95');
  assert.equal(pack.resourceSources.layouts['S_Common-BackBtn'].sha256,
    '09330cbde8a990f04e2899a3dd081689aa3bbf93c2172a0f837a02840b10d4b9');
  assert.equal(pack.resourceSources.animations['S_Common-BackBtn_Disable'].sha256,
    '6664a7f78a9cbfa39591861b2d7b9c2d3ace2ce0e2a68e9b66d5ba863926ee07');
  assert.equal(bg.resourceSources.layouts['S_BG_D-Ctr'].sha256,
    'bf589d12f462d71c2edfd1c6df47eaac095fd346065c7f73ddc73ebd982b3e88');
  const bank=messages.messages.S;
  assert.equal(bank.messages[bank.labels.C_B_04].text, 'StreetPass');
  assert.equal(bank.messages[bank.labels.C_B_03].text, 'Settings');
  assert.equal(bank.messages[bank.labels.P_B_03].text, 'Add...');
  assert.equal(bank.messages[bank.labels.P_B_00].text, 'Open');
  assert.equal(bank.messages[bank.labels.C_B_02].text, 'Back');
  for(const [label, expected] of [['C_B_04', [[1, 0, '5000'], [1, 0, '6400']]], ['C_B_03', [[1, 0, '5000'], [1, 0, '6400']]]]){
    assert.deepEqual(bank.messages[bank.labels[label]].tokens.filter(token=>token.control).map(token=>[token.group, token.type, token.arguments]), expected);
  }
  const opl=flatten(pack.layouts['S_Common-OpLBtn'].roots);
  const open=flatten(pack.layouts['S_Common-OpenBtn'].roots);
  const set=flatten(pack.layouts['S_Common-SetBtn'].roots);
  const txt=(layout, name)=>flatten(pack.layouts[layout].roots).find(pane=>pane.name===name);
  for(const pane of [txt('S_Common-OpLBtn', 'TxtC'), txt('S_Common-OpenBtn', 'TxtC'), txt('S_Common-SetBtn', 'TxtMiniT_W_P0')]){
    assert.equal(pane.kind, 'txt1');
    assert.equal(pane.origin, 4);
    assert.equal(pane.text.alignment, 4);
    assert.equal(pane.text.lineAlignment, 2);
    assert.equal(pane.text.font, 0);
    assert.deepEqual(pane.text.topColor, [0, 0, 0, 255]);
  }
  assert.deepEqual(opl.find(pane=>pane.name==='-O-C-OPL').translation, [-115, -73, 0]);
  assert.deepEqual(open.find(pane=>pane.name==='-O-C-Open').translation, [-0, -89, 0]);
  assert.deepEqual(set.find(pane=>pane.name==='-B-MiniT_W_P0').translation, [115, -105, 0]);
  assert.deepEqual(flatten(pack.layouts['S_Common-BackBtn'].roots).find(pane=>pane.name==='-O-C-Back').translation, [-115, -105, 0]);
  assert.equal(pack.layouts['S_Common-OpLBtn'].fonts[0], 'cbf_std.bcfnt');
  assert.equal(Object.hasOwn(pack.layouts, 'S_Common-CecBtn'), false);
  for(const unused of unusedDumpClips)assert.equal(Object.hasOwn(pack.animations, unused), false, unused);
  const def=pack.animations['S_Common-OpLBtn_Default'];
  const openDef=pack.animations['S_Common-OpenBtn_Default'];
  const setDef=pack.animations['S_Common-SetBtn_Default'];
  for(const clip of [def, openDef, setDef, pack.animations['S_Common-OpRBtn_Disable'], pack.animations['S_Common-BackBtn_Disable']]){
    assert.equal(clip.tracks.some(track=>track.property==='visible'), false);
    assert.equal(clip.tracks.some(track=>track.target==='TxtC'||track.target==='TxtMiniT_W_P0'), false);
  }
  assert.equal(sample(def.tracks.find(track=>track.target==='GrpOPL'&&track.property==='alpha'), 0), 255);
  assert.equal(sample(openDef.tracks.find(track=>track.target==='Grp_Open'&&track.property==='alpha'), 0), 255);
  assert.equal(sample(setDef.tracks.find(track=>track.target==='-B-MiniT_W_P0'&&track.property==='translation.y'), 0), -105);
  for(const layout of ['S_Common-OpLBtn', 'S_Common-OpenBtn', 'S_Common-SetBtn']){
    for(const material of pack.layouts[layout].materials){
      if(!material.textureMaps?.length)continue;
      assert.equal(material.textureMaps.every(map=>map.magFilter===1&&map.minFilter===1), true, material.name);
    }
  }
});

test('painter keeps already-bound empty-entry footer chrome and does not bind unused clips', ()=>{
  assert.match(requested[1]??'', /'S_Common-OpLBtn'/);
  assert.match(requested[1]??'', /'S_Common-OpRBtn'/);
  assert.match(requested[1]??'', /'S_Common-OpenBtn'/);
  assert.match(requested[1]??'', /'S_Common-SetBtn'/);
  assert.match(requested[1]??'', /'S_Common-BackBtn'/);
  assert.match(requested[2]??'', /'S_Common-OpLBtn_Default'/);
  assert.match(requested[2]??'', /'S_Common-OpRBtn_Disable'/);
  assert.match(requested[2]??'', /'S_Common-OpenBtn_Default'/);
  assert.match(requested[2]??'', /'S_Common-SetBtn_Default'/);
  assert.match(requested[2]??'', /'S_Common-BackBtn_Disable'/);
  for(const unused of [...unusedDumpClips, ...unusedPublishedClips, 'S_Common-CecBtn']){
    assert.equal((requested[2]??'').includes(unused), false, unused);
    assert.equal(painter.includes(`name:'${unused}'`), false, unused);
  }
  assert.equal(painter.includes('S_BG_D-Ctr_Down'), false);
  assert.equal(painter.includes('S_BG_D-Ctr_Up'), false);
  assert.equal(painter.includes('azahar-12p4-fit'), false);
  assert.equal(painter.includes('textSampling'), false);
  assert.equal(painter.includes('textCoverageAdaptation'), false);
  assert.equal(painter.includes('nativeMipmaps'), false);
  assert.match(painter, /entry\(bottom,'sound-bg','S_BG_D-Ctr'\);/);
  assert.match(painter,
    /entry\(bottom,'sound-common','S_Common-OpLBtn',\{bindings:\[\{name:'S_Common-OpLBtn_Default',frame:0\}\],overrides:\{TxtC:smallLabel\('C_B_04'\)\}\}\);/);
  assert.match(painter,
    /entry\(bottom,'sound-common','S_Common-OpRBtn',\{bindings:\[\{name:'S_Common-OpRBtn_Disable',frame:1\}\],overrides:\{TxtC:message\('S','P_B_03'\)\}\}\);/);
  assert.match(painter,
    /entry\(bottom,'sound-common','S_Common-OpenBtn',\{bindings:\[\{name:'S_Common-OpenBtn_Default',frame:0\}\],overrides:\{TxtC:message\('S','P_B_00'\)\}\}\);/);
  assert.match(painter,
    /entry\(bottom,'sound-common','S_Common-SetBtn',\{bindings:\[\{name:'S_Common-SetBtn_Default',frame:0\}\],overrides:\{TxtMiniT_W_P0:smallLabel\('C_B_03'\)\}\}\);/);
  assert.match(painter,
    /entry\(bottom,'sound-common','S_Common-BackBtn',\{bindings:\[\{name:'S_Common-BackBtn_Disable',frame:1\}\],overrides:\{TxtC:message\('S','C_B_02'\)\}\}\);/);
});

test('dump unused footer clips do not write TxtC / TxtMiniT_W_P0 or hide glyphs', async t=>{
  if(!existsSync(native14))return t.skip('private sound-native14 S_Common pack is absent');
  const full=JSON.parse(readFileSync(native14, 'utf8'));
  assert.equal(full.sourceSha256, pack.sourceSha256);
  const hashes={
    'S_Common-OpLBtn_Disable':'547887493dc882f7eacc115f3f1841044911cd682937c5d81ee09f4bd5c71c8f',
    'S_Common-OpLBtn_In':'65d6503f699d699bc85ecff23cc9c3f263af435561c26d2e1164fc867392ebb4',
    'S_Common-OpLBtn_Out':'7164a275569d0f2ee11f51f6c68fb383a1cd35e84fffc867fa75350c43004ce1',
    'S_Common-OpLBtn_Push':'997f03d92ac10b31603aac213a9b6c37f012b616de87242303c1d0bb358ca584',
    'S_Common-OpRBtn_Default':'b093540bc9b3fed5c28d5d6f902e606867fdc43856288333c5442ed0db5574e0',
    'S_Common-SetBtn_In':'6bd98fcb0bfb6b14076d184cca23a889361659b6096502dadd91c93591ecdea1',
    'S_Common-SetBtn_Push':'bb8bb48caf901b2014b6a0d6b68092a10c3f1487a50a89670f023bda31ce3ead',
    'S_Common-CecBtn_Default':'72973f5bd0fd826ee6e9434a1b6664104eed6f92132a2ade205e6551ab014dba',
  };
  for(const [name, digest] of Object.entries(hashes)){
    assert.equal(full.resourceSources.animations[name].sha256, digest, name);
  }
  assert.equal(full.resourceSources.layouts['S_Common-CecBtn'].sha256,
    '24acf65ff90e27934353d1a60e505f42c1b0a157324b728fe044f8cb8bea6928');
  const cecParent=flatten(full.layouts['S_Common-CecBtn'].roots).find(pane=>pane.name==='-B-Cec');
  assert.deepEqual(cecParent.translation, [-115, -105, 0]);
  assert.equal(Object.hasOwn(full.animations, 'S_Common-SetBtn_Disable'), false);
  for(const name of [...unusedDumpClips, 'S_Common-CecBtn_Default', 'S_Common-CecBtn_In', 'S_Common-CecBtn_Out', 'S_Common-CecBtn_Push', ...unusedPublishedClips]){
    const clip=full.animations[name];
    assert.equal(clip.tracks.some(track=>track.property==='visible'), false, name);
    assert.equal(clip.tracks.some(track=>track.target==='TxtC'||track.target==='TxtMiniT_W_P0'||track.target==='TxtCec'), false, name);
  }
  const disable=full.animations['S_Common-OpLBtn_Disable'];
  assert.equal(sample(disable.tracks.find(track=>track.target==='GrpOPL'&&track.property==='alpha'), 0), 128);
  assert.equal(sample(disable.tracks.find(track=>track.target==='GrpOPL'&&track.property==='alpha'), 1), 128);
  const openDisable=full.animations['S_Common-OpenBtn_Disable'];
  assert.equal(sample(openDisable.tracks.find(track=>track.target==='Grp_Open'&&track.property==='alpha'), 0), 128);
  const setIn=full.animations['S_Common-SetBtn_In'];
  assert.equal(sample(setIn.tracks.find(track=>track.target==='-B-MiniT_W_P0'&&track.property==='translation.y'), 0), -137);
});

test('the reused HudTime-phase empty-entry lower keeps footer 4707', async t=>{
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
  const load=async (path, width=320)=>(await sharp(path).ensureAlpha().raw().toBuffer());
  const empty={native:await crop(files.nativeEmpty), browser:await load(files.browserEmpty)};
  const first={native:await crop(files.nativeFirst), browser:await load(files.browserFirst)};
  const upperEmpty=await load(files.browserEmptyUpper, 400);
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
  const footer=count(empty, 0, 178, 320, 240);
  assert.equal(footer.n, 4707);
  assert.equal(footer.max, 174);
  assert.deepEqual(footer.at, [244, 229]);
  const peak=(244*4)+(229*320*4);
  assert.deepEqual([...empty.native.slice(peak, peak+3)], [206, 201, 190]);
  assert.deepEqual([...empty.browser.slice(peak, peak+3)], [32, 31, 29]);
  assert.equal(count(empty, 0, 178, 92, 209).n, 957);
  assert.equal(count(empty, 228, 209, 320, 240).n, 889);
  assert.equal(count(empty, 98, 178, 222, 238).n, 646);
  assert.equal(count(empty, 0, 32, 320, 64).n, 1916);
  assert.equal(count(empty, 0, 144, 320, 175).n, 4271);
  assert.equal(count(first, 0, 178, 320, 240).n, 2914, 'first-run lower is guide, not this footer');
  const nativeUpper=await sharp(files.nativeEmpty).extract({left:0, top:0, width:400, height:240}).ensureAlpha().raw().toBuffer();
  const clock=count({native:nativeUpper, browser:upperEmpty}, 95, 216, 194, 240, 400);
  assert.equal(clock.n, 0);
  const report=JSON.parse(readFileSync(files.reportEmpty, 'utf8'));
  assert.equal(report.screens.upper.pixelsOverThreshold, 6404);
  assert.equal(report.screens.lower.pixelsOverThreshold, 16021);
  assert.deepEqual(report.screens.lower.regions.find(region=>region.x===0&&region.y===179),
    {x:0, y:179, width:112, height:61, pixelCount:897});
  assert.deepEqual(report.screens.lower.regions.find(region=>region.x===208&&region.y===179),
    {x:208, y:179, width:112, height:61, pixelCount:979});
  assert.deepEqual(report.screens.lower.regions.find(region=>region.x===134&&region.y===199),
    {x:134, y:199, width:14, height:19, pixelCount:169});
});
