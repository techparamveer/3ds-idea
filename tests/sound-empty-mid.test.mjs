import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';

const require=createRequire(new URL('../package.json', import.meta.url));
const firmware=new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const painter=readFileSync(new URL('../src/os/stock-native-sound.ts', import.meta.url), 'utf8');
const pack=JSON.parse(readFileSync(new URL('packs/sound/contents/0000-0000000b/lyt-S_BG-arc-LZ.json', firmware), 'utf8'));
const url=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const layoutModule=await import(url(ts.transpileModule(readFileSync(new URL('../src/os/native-layout.ts', import.meta.url), 'utf8'),
  {compilerOptions:{module:ts.ModuleKind.ESNext, target:ts.ScriptTarget.ES2022}}).outputText));
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const dumpRoot='/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/assets/stock-ui/extracted/sound/contents/0000-0000000b';
const codePath=`${dumpRoot}/exefs/code.bin`;
const arcPath=`${dumpRoot}/romfs/lyt/S_BG.arc.LZ`;
const DARK=[223, 215, 206], LIGHT=[231, 223, 215], FILL=[229, 224, 216];
const is=(data, i, rgb)=>data[i]===rgb[0]&&data[i+1]===rgb[1]&&data[i+2]===rgb[2];

/** Repo renderer raster of the posed S_BG_D-Grid pane at the 320×240 lower. */
async function gridRaster(){
  const sharp=require('sharp');
  const posed=layoutModule.poseNativeLayout(pack.layouts['S_BG_D-Grid'], pack.animations, [{name:'S_BG_D-Grid_Default', frame:0}]);
  const pane=posed.roots[0].children[0], texture=pack.textures['S_BG_Grid.bclim'];
  const decoded=await sharp(new URL(texture.url, firmware).pathname).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const pixels={width:decoded.info.width, height:decoded.info.height, data:new Uint8ClampedArray(decoded.data), picaFormat:texture.picaFormat};
  return layoutModule.rasterNativePicture(posed, pane.picture, 320, 240, new Map([['S_BG_Grid.bclim', pixels]]), pane.alpha/255).data;
}

test('the empty-entry lower binds S_BG_D-Grid Default frame 0 over the source ETC1 checker', async ()=>{
  assert.equal(pack.titleId, '0004001000022500');
  assert.equal(pack.contentId, '0000000b');
  assert.equal(pack.sourceSha256, '944b1cf9a81eac5b162001ac6b9a5dfae63513e1dc45981c87496c159fd0d434');
  assert.equal(pack.resourceSources.layouts['S_BG_D-Grid'].path, 'lyt/S_BG.arc.LZ/blyt/S_BG_D-Grid.bclyt');
  assert.equal(pack.resourceSources.layouts['S_BG_D-Grid'].sha256, '925f961ae0eed19b4ab5318d61e0fa609aa465cdd0202f73c6772661647669d6');
  assert.equal(pack.resourceSources.animations['S_BG_D-Grid_Default'].sha256, '4dc57eec9552dd8513f3786a727856d7b8e08c7b27f33083a4619d8c8d2009c9');
  const texture=pack.textures['S_BG_Grid.bclim'];
  assert.equal(texture.sourceSha256, '138b6fc990989d157e970a65d92999e9a81370e9ce02281581da8c6f516c46f3');
  assert.equal(texture.formatName, 'ETC1');
  assert.equal(sha(new URL(texture.url, firmware)), '7407446ca0120cd4b13a02eb1af7215602e82f5aec9f270005715e1732a9b237');
  const layout=pack.layouts['S_BG_D-Grid'], grid=layout.roots[0].children[0], material=layout.materials[grid.picture.material];
  assert.equal(grid.name, 'BG_Grid');
  assert.equal(grid.kind, 'pic1');
  assert.deepEqual(grid.size, [320, 240]);
  assert.deepEqual(grid.translation, [0, 0, 0]);
  assert.deepEqual(material.tevStages, []);
  assert.deepEqual(material.textureMaps, [{magFilter:0, minFilter:0, texture:0, wrapS:1, wrapT:1}]);
  assert.deepEqual(material.textureMatrices[0].scale, [Math.fround(3.35), 2.5]);
  assert.deepEqual(material.textureMatrices[0].translation, [0, 0]);
  const clip=pack.animations['S_BG_D-Grid_Default'];
  assert.deepEqual(clip.tracks.map(track=>[track.target, track.property, track.keys.map(key=>[key.frame, key.value])]), [['BG_Grid', 'alpha', [[0, 255]]]]);
  // The previous browser fill is S_BG BG constant 0; the grid now covers it on the lower.
  const bg=pack.layouts.S_BG.roots.flatMap(pane=>[pane, ...pane.children]).find(pane=>pane.name==='BG');
  assert.deepEqual(pack.layouts.S_BG.materials[bg.picture.material].constantColors[0], [...FILL, 255]);
  assert.match(painter, /entry\(top,'sound-bg','S_BG'\);entry\(bottom,'sound-bg','S_BG_D-Grid',\{bindings:\[\{name:'S_BG_D-Grid_Default',frame:0\}\]\}\);/);
  assert.equal(/entry\(bottom,'sound-bg','S_BG'\)/.test(painter), false);
  assert.equal(painter.includes('223,215,206'), false);
  assert.equal(painter.includes('231,223,215'), false);
  const sharp=require('sharp');
  const decoded=await sharp(new URL(texture.url, firmware).pathname).ensureAlpha().raw().toBuffer();
  let dark=0, light=0;
  for(let i=0;i<decoded.length;i+=4){if(is(decoded, i, DARK)&&decoded[i+3]===255)dark++; if(is(decoded, i, LIGHT)&&decoded[i+3]===255)light++;}
  assert.deepEqual([dark, light, decoded.length/4], [2048, 2048, 4096]);
});

test('the dump grid member decodes through ETC1 and code.bin builds it in the lower constructor', t=>{
  if(!existsSync(codePath)||!existsSync(arcPath))return t.skip('private Sound S_BG dump is absent');
  assert.equal(sha(codePath), '3c57f2c4091c1bec6b3834609f1e2a6488712e21775d7548b441c69c60b3e5a9');
  assert.equal(sha(arcPath), '944b1cf9a81eac5b162001ac6b9a5dfae63513e1dc45981c87496c159fd0d434');
  const probed=spawnSync('python3', ['-c', `
import hashlib, json, sys
from collections import Counter
from pathlib import Path
sys.path.insert(0, sys.argv[1]); sys.path.insert(0, sys.argv[1] + '/firmware')
from unpack_home_resources import decompress, unpack_darc
from texture import decode_bclim
files = unpack_darc(decompress(Path(sys.argv[2]).read_bytes()))
raw = files['timg/S_BG_Grid.bclim']
meta, rgba = decode_bclim(raw)
counts = Counter(tuple(rgba[i:i+4]) for i in range(0, len(rgba), 4))
print(json.dumps({
  'bclimSha': hashlib.sha256(raw).hexdigest(),
  'bclytSha': hashlib.sha256(files['blyt/S_BG_D-Grid.bclyt']).hexdigest(),
  'meta': meta,
  'counts': sorted([list(k), v] for k, v in counts.items()),
  'rawHasNative': bytes([223, 215, 206]) in raw,
}))
`, new URL('../scripts', import.meta.url).pathname, arcPath], {encoding:'utf8'});
  assert.equal(probed.status, 0, probed.stderr);
  const member=JSON.parse(probed.stdout);
  assert.equal(member.bclimSha, '138b6fc990989d157e970a65d92999e9a81370e9ce02281581da8c6f516c46f3');
  assert.equal(member.bclytSha, '925f961ae0eed19b4ab5318d61e0fa609aa465cdd0202f73c6772661647669d6');
  assert.deepEqual(member.meta, {width:64, height:64, format:10, picaFormat:12, formatName:'ETC1'});
  assert.deepEqual(member.counts, [[[...DARK, 255], 2048], [[...LIGHT, 255], 2048]]);
  // ETC1 stores block codes, so a raw byte search cannot find either texel colour.
  assert.equal(member.rawHasNative, false);
  const code=readFileSync(codePath), base=0x100000;
  const word=va=>code.readUInt32LE(va-base);
  const cstr=va=>code.subarray(va-base, code.indexOf(0, va-base)).toString('latin1');
  const adr=va=>{
    const w=word(va); assert.equal(w&0x0fff0000, 0x028f0000, `add rd, pc at ${va.toString(16)}`);
    const rot=((w>>8)&15)*2, imm=w&255;
    return va+8+(rot?((imm>>>rot)|(imm<<(32-rot)))>>>0:imm);
  };
  const bl=va=>{const w=word(va); assert.equal((w>>>24)&0xf, 0xb); return va+8+(((w&0xffffff)<<8)>>6);};
  assert.equal(cstr(adr(0x1c65dc)), 'S_BG_D-Grid');
  assert.equal(cstr(adr(0x1c65e0)), 'S_BG');
  assert.equal(bl(0x1c65e8), 0x1e5b90);
  assert.equal(cstr(adr(0x1c65f0)), 'S_Common-BrwCursorB');
  assert.equal(bl(0x2315b8), 0x1c65c8);
  assert.equal(cstr(adr(0x231614)), 'S_BG_D-Ctr');
  assert.equal(cstr(adr(0x231628)), 'S_BG');
  assert.equal(bl(0x231634), 0x1e5b90);
  assert.equal(cstr(adr(0x231648)), 'S_Guid_D');
  assert.equal(word(0x3211d8), 0x231230);
});

test('the reused empty-entry pair is the grid under transparent record; the bind predicts the mid closing', async t=>{
  const root='/Users/paramveer/.codex/3ds-artifact-overflow';
  const recap=`${root}/home-fidelity-20261001/sound-clock-recapture-20261004`;
  const files={
    nativeFirst:`${root}/reference/screenshots/Nintendo 3DS Sound_25.09.26_22.27.14.541.png`,
    nativeEmpty:`${root}/reference/screenshots/Nintendo 3DS Sound_25.09.26_22.31.31.595.png`,
    browserFirst:`${recap}/browser-first-run/lower.png`,
    browserEmpty:`${recap}/browser-empty-entry/lower.png`,
    reportEmpty:`${recap}/diff-sound-empty-entry-hudtime-phase/report.json`,
  };
  if(!Object.values(files).every(existsSync))return t.skip('private Sound HudTime-phase pair is absent');
  assert.equal(sha(files.nativeFirst), '9dea0cc2fa7022ccd032c5a94ae59c2dbe37e6b7e800fbf8668b356fc9e5ce69');
  assert.equal(sha(files.nativeEmpty), '65fc5f8819d31c49622d9e2a8ee7ba79c0675fd7dd3a73f783255eb7efe3b4cd');
  assert.equal(sha(files.browserEmpty), 'ee103d93d744f5037fd36f24ad93403bf57298b2e1d74752da09d542023ea38d');
  assert.equal(sha(files.browserFirst), 'b9d1093ab9641460de6e9e0490707ae12d41008085ee8f7c9995d12fd504fbb9');
  assert.equal(sha(files.reportEmpty), 'd28688a4a28c3c5cabc303cc6fb824045ee4a074f4f25fffcacc07944e5425f2');
  const sharp=require('sharp');
  const crop=path=>sharp(path).extract({left:40, top:240, width:320, height:240}).ensureAlpha().raw().toBuffer();
  const load=path=>sharp(path).ensureAlpha().raw().toBuffer();
  const native={empty:await crop(files.nativeEmpty), first:await crop(files.nativeFirst)};
  const browser={empty:await load(files.browserEmpty), first:await load(files.browserFirst)};
  const grid=await gridRaster();
  const count=(a, b, [x0, y0, x1, y1])=>{
    let n=0;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
      const i=(y*320+x)*4;
      if(Math.max(Math.abs(a[i]-b[i]), Math.abs(a[i+1]-b[i+1]), Math.abs(a[i+2]-b[i+2]))>2)n++;
    }
    return n;
  };
  // Offline estimate: the grid is opaque and sits under everything, so only
  // pixels where the browser showed the bare S_BG fill take the grid texel.
  const predict=pixels=>{
    const out=Buffer.from(pixels);
    for(let i=0;i<out.length;i+=4)if(is(out, i, FILL))for(let c=0;c<3;c++)out[i+c]=grid[i+c];
    return out;
  };
  const rects={whole:[0, 0, 320, 240], left:[41, 96, 88, 144], lip:[136, 116, 184, 144], discLip:[232, 137, 279, 144],
    row:[0, 32, 320, 64], slider:[0, 144, 320, 175], footer:[0, 178, 320, 240]};
  const measure=(a, b)=>Object.fromEntries(Object.entries(rects).map(([name, rect])=>[name, count(a, b, rect)]));
  let nativeGrid=0, fillAtGrid=0, rasterAgrees=0, nativeDark=0, nativeLight=0, browserFill=0;
  for(let i=0;i<grid.length;i+=4){
    const dark=is(native.empty, i, DARK), light=is(native.empty, i, LIGHT);
    nativeDark+=+dark; nativeLight+=+light;
    if(is(browser.empty, i, FILL))browserFill++;
    if(!dark&&!light)continue;
    nativeGrid++;
    if(is(browser.empty, i, FILL))fillAtGrid++;
    if(is(native.empty, i, grid.subarray(i, i+3)))rasterAgrees++;
  }
  assert.deepEqual([nativeDark, nativeLight, browserFill], [7411, 7290, 14701]);
  assert.equal(fillAtGrid, nativeGrid);
  assert.equal(rasterAgrees, nativeGrid);
  assert.deepEqual(measure(native.empty, browser.empty),
    {whole:16021, left:2255, lip:1024, discLip:223, row:1916, slider:4271, footer:4707});
  assert.deepEqual(measure(native.empty, predict(browser.empty)),
    {whole:8610, left:3, lip:41, discLip:39, row:1916, slider:1504, footer:4707});
  // First-run guide: native shows the same grid at half intensity outside the
  // card (the labelled veil gap). The bind leaves its counts unchanged.
  let half=0, halfAgrees=0;
  for(let y=0;y<240;y++)for(let x=0;x<320;x++){
    if(x>=20&&x<300&&y>=20&&y<220)continue;
    const i=(y*320+x)*4;
    if(!is(native.first, i, [111, 107, 103])&&!is(native.first, i, [115, 111, 107]))continue;
    half++;
    if(is(native.first, i, [grid[i]>>1, grid[i+1]>>1, grid[i+2]>>1]))halfAgrees++;
  }
  assert.deepEqual([half, halfAgrees], [884, 864]);
  const first=measure(native.first, browser.first);
  assert.deepEqual(measure(native.first, predict(browser.first)), first);
  assert.deepEqual([first.whole, first.left, first.lip], [6267, 0, 0]);
  const report=JSON.parse(readFileSync(files.reportEmpty, 'utf8'));
  assert.equal(report.screens.lower.pixelsOverThreshold, 16021);
  assert.deepEqual(report.screens.lower.regions[2], {x:41, y:96, width:47, height:48, pixelCount:2255});
  assert.deepEqual(report.screens.lower.regions[3], {x:136, y:116, width:48, height:28, pixelCount:1024});
});
