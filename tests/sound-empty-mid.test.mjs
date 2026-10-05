import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(new URL('../package.json', import.meta.url));
const firmware=new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const painter=readFileSync(new URL('../src/os/stock-native-sound.ts', import.meta.url), 'utf8');
const recordPainter=readFileSync(new URL('../src/os/stock-sound-record.ts', import.meta.url), 'utf8');
const pack=JSON.parse(readFileSync(new URL('packs/sound/contents/0000-0000000b/lyt-S_BG-arc-LZ.json', firmware), 'utf8'));
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const flatten=panes=>panes.flatMap(pane=>[pane, ...flatten(pane.children??[])]);
const sample=(track, frame)=>{
  const keys=track.keys; if(!keys.length)return 0;
  if(keys.length===1||frame<=keys[0].frame)return keys[0].value;
  if(frame>=keys.at(-1).frame)return keys.at(-1).value;
  throw new Error(`unexpected interpolation ${track.target} ${track.property} @ ${frame}`);
};
const dumpRoot='/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/assets/stock-ui/extracted/sound/contents/0000-0000000b';
const codePath=`${dumpRoot}/exefs/code.bin`;
const arcPath=`${dumpRoot}/romfs/lyt/S_BG.arc.LZ`;
const nativeRgb=Buffer.from([223, 215, 206]);
const dumpRgba=Buffer.from([229, 224, 216, 255]);

test('S_BG constant 0 is the browser beige and no clip recolors it', ()=>{
  assert.equal(pack.titleId, '0004001000022500');
  assert.equal(pack.contentId, '0000000b');
  assert.equal(pack.sourceSha256, '944b1cf9a81eac5b162001ac6b9a5dfae63513e1dc45981c87496c159fd0d434');
  assert.equal(sha(new URL('packs/sound/contents/0000-0000000b/lyt-S_BG-arc-LZ.json', firmware)),
    'c5af6df22c33b8fbdd8cdcccf1b5b77bb484f2c2a2a71cc82100bf50ed9dd6a0');
  assert.equal(pack.resourceSources.layouts.S_BG.sha256,
    '0f2eca6dbb4813df68ee4e10fe844307a4d9442dfc6d72f8143fcfa725e5e1d0');
  assert.equal(pack.resourceSources.layouts.S_BG.path, 'lyt/S_BG.arc.LZ/blyt/S_BG.bclyt');
  assert.equal(pack.resourceSources.layouts['S_BG-Record'].sha256,
    '5e12e2522526c7670c2f5dc9458df0c725d8050ce60a45350865741ab2202136');
  assert.equal(pack.resourceSources.animations['S_BG-Record_Default'].sha256,
    '5209252d8eecf9607e8703f042bd3aa7630ad54313b2bf23c2e46644d1594426');
  assert.equal(pack.resourceSources.textures['BG_Record_01.bclim'].sha256,
    'fc59c5aa749fb3c074b7e76e89f7a92443101e3693ea3620a40f9ab77844f5ed');
  const bg=flatten(pack.layouts.S_BG.roots).find(pane=>pane.name==='BG');
  const material=pack.layouts.S_BG.materials[bg.picture.material];
  assert.equal(bg.kind, 'pic1');
  assert.deepEqual(bg.size, [400, 240]);
  assert.equal(bg.alpha, 255);
  assert.deepEqual(bg.picture.colors, [[255, 255, 255, 255], [255, 255, 255, 255], [255, 255, 255, 255], [255, 255, 255, 255]]);
  assert.equal(material.name, 'BG');
  assert.deepEqual(material.constantColors[0], [229, 224, 216, 255]);
  assert.deepEqual(material.constantColors[5], [255, 255, 255, 255]);
  assert.deepEqual(material.tevStages, []);
  assert.deepEqual(material.textureMaps, []);
  assert.deepEqual(Object.keys(pack.animations).filter(name=>!name.startsWith('S_BG-Record_')&&!name.startsWith('S_BG_D-')), []);
  for(const clip of Object.values(pack.animations)){
    assert.equal(clip.tracks.some(track=>track.target==='BG'), false, clip.name);
    assert.equal(clip.tracks.some(track=>track.property.includes('color')), false, clip.name);
  }
  const record=flatten(pack.layouts['S_BG-Record'].roots).find(pane=>pane.name==='BG_Record_01');
  assert.deepEqual(record.size, [368, 288]);
  assert.deepEqual(record.translation, [26, 120, 0]);
  assert.deepEqual(record.picture.uvSets, [[0.28125, 0.21875, 1, 0.21875, 0.28125, 0.78125, 1, 0.78125]]);
  const recordMaterial=pack.layouts['S_BG-Record'].materials[record.picture.material];
  assert.equal(recordMaterial.textureMaps[0].magFilter, 1);
  assert.equal(recordMaterial.textureMaps[0].minFilter, 1);
  const resting=pack.animations['S_BG-Record_Default'];
  assert.equal(sample(resting.tracks.find(track=>track.property==='translation.x'), 0), 0);
  assert.equal(sample(resting.tracks.find(track=>track.property==='translation.y'), 0), 0);
  assert.equal(sample(resting.tracks.find(track=>track.property==='scale.x'), 0), 1);
  assert.equal(sample(resting.tracks.find(track=>track.property==='scale.y'), 0), 1);
  const slide=pack.animations['S_BG-Record_In'];
  assert.equal(sample(slide.tracks.find(track=>track.property==='translation.x'), 0), 320);
  assert.match(painter, /entry\(bottom,'sound-bg','S_BG'\);/);
  assert.match(painter, /constantColors\[5\]/);
  assert.equal(painter.includes('223,215,206'), false);
  assert.equal(painter.includes('229,224,216'), false);
  assert.match(recordPainter, /name: screen === 'top' \? 'S_BG-Record_U_Default' : 'S_BG-Record_Default', frame: 0/);
});

test('the S_BG archive stores only the browser beige and code.bin stores neither colour', t=>{
  if(!existsSync(codePath)||!existsSync(arcPath))return t.skip('private Sound S_BG dump is absent');
  assert.equal(sha(codePath), '3c57f2c4091c1bec6b3834609f1e2a6488712e21775d7548b441c69c60b3e5a9');
  assert.equal(sha(arcPath), '944b1cf9a81eac5b162001ac6b9a5dfae63513e1dc45981c87496c159fd0d434');
  const code=readFileSync(codePath);
  assert.equal(code.includes(nativeRgb), false);
  assert.equal(code.includes(dumpRgba.subarray(0, 3)), false);
  const nameAt=0x2fcc98-0x100000;
  assert.equal(code.subarray(nameAt, nameAt+4).toString(), 'S_BG');
  assert.equal(code[nameAt+4], 0);
  assert.equal(code.includes(Buffer.from([0x98, 0xcc, 0x2f, 0x00])), false);
  const probed=spawnSync('python3', ['-c', `
import hashlib, json, sys
from pathlib import Path
sys.path.insert(0, sys.argv[1])
from unpack_home_resources import decompress, unpack_darc
files = unpack_darc(decompress(Path(sys.argv[2]).read_bytes()))
native, dump = bytes([223, 215, 206]), bytes([229, 224, 216, 255])
print(json.dumps({
  'bclytSha': hashlib.sha256(files['blyt/S_BG.bclyt']).hexdigest(),
  'constant': list(files['blyt/S_BG.bclyt'][80:84]),
  'hasSbgClip': any(name.startswith('anim/S_BG.bclan') or name == 'anim/S_BG_Default.bclan' for name in files),
  'nativeFiles': [name for name, data in files.items() if native in data],
  'dumpHits': {name: data.find(dump) for name, data in files.items() if dump in data},
}))
`, new URL('../scripts', import.meta.url).pathname, arcPath], {encoding:'utf8'});
  assert.equal(probed.status, 0, probed.stderr);
  const archive=JSON.parse(probed.stdout);
  assert.equal(archive.bclytSha, '0f2eca6dbb4813df68ee4e10fe844307a4d9442dfc6d72f8143fcfa725e5e1d0');
  assert.deepEqual(archive.constant, [229, 224, 216, 255]);
  assert.equal(archive.hasSbgClip, false);
  assert.deepEqual(archive.nativeFiles, []);
  assert.deepEqual(archive.dumpHits, {'blyt/S_BG.bclyt':80});
});

test('the reused HudTime-phase empty-entry lower keeps the mid beige pair', async t=>{
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
  assert.equal(sha(files.browserFirst), 'b9d1093ab9641460de6e9e0490707ae12d41008085ee8f7c9995d12fd504fbb9');
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
    let n=0, max=0, at=null, pairN=0;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
      const i=(y*width+x)*4, d=over(pair, x, y, width);
      if(d>max){max=d; at=[x, y];}
      if(d>2)n++;
      if(pair.native[i]===223&&pair.native[i+1]===215&&pair.native[i+2]===206
        &&pair.browser[i]===229&&pair.browser[i+1]===224&&pair.browser[i+2]===216)pairN++;
    }
    return {n, max, at, pairN};
  };
  const left=count(empty, 41, 96, 88, 144);
  const lip=count(empty, 136, 116, 184, 144);
  assert.equal(left.n, 2255);
  assert.equal(left.pairN, 2252);
  assert.equal(left.max, 10);
  assert.deepEqual(left.at, [41, 96]);
  assert.equal(lip.n, 1024);
  assert.equal(lip.pairN, 983);
  assert.equal(lip.max, 10);
  assert.deepEqual(lip.at, [136, 117]);
  assert.equal(count(empty, 232, 137, 279, 144).n, 223);
  assert.equal(count(empty, 0, 32, 320, 64).n, 1916);
  assert.equal(count(empty, 0, 144, 320, 175).n, 4271);
  assert.equal(count(empty, 0, 144, 320, 175).pairN, 2767);
  assert.equal(count(empty, 0, 178, 320, 240).n, 4707);
  assert.equal(count(empty, 0, 0, 320, 240).n, 16021);
  assert.equal(count(first, 41, 96, 88, 144).n, 0);
  assert.equal(count(first, 136, 116, 184, 144).n, 0);
  const nativeUpper=await sharp(files.nativeEmpty).extract({left:0, top:0, width:400, height:240}).ensureAlpha().raw().toBuffer();
  assert.equal(count({native:nativeUpper, browser:await load(files.browserEmptyUpper)}, 95, 216, 194, 240, 400).n, 0);
  const report=JSON.parse(readFileSync(files.reportEmpty, 'utf8'));
  assert.equal(report.mask.sha256, 'dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95');
  assert.equal(report.screens.lower.pixelsOverThreshold, 16021);
  assert.deepEqual(report.screens.lower.regions[2], {x:41, y:96, width:47, height:48, pixelCount:2255});
  assert.deepEqual(report.screens.lower.regions[3], {x:136, y:116, width:48, height:28, pixelCount:1024});
  const texture=pack.textures['BG_Record_01.bclim'];
  const decoded=await sharp(new URL(texture.url, firmware).pathname).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(sha(new URL(texture.url, firmware)), 'dddc006390df2a4a84fa89a2484e3fae716bbd1b3aa23ca0740c9cda3f919a22');
  const uv=[0.28125, 0.21875, 1, 0.21875, 0.28125, 0.78125, 1, 0.78125];
  const width=decoded.info.width, height=decoded.info.height, data=decoded.data;
  const nearestAlpha=(x, y)=>{
    const u=(x-2+0.5)/368, v=(y+144+0.5)/288;
    const tu=u>=v?uv[0]*(1-u)+uv[2]*(u-v)+uv[6]*v:uv[0]*(1-v)+uv[4]*(v-u)+uv[6]*u;
    const tv=u>=v?uv[1]*(1-u)+uv[3]*(u-v)+uv[7]*v:uv[1]*(1-v)+uv[5]*(v-u)+uv[7]*u;
    const px=Math.min(width-1, Math.max(0, Math.floor(tu*width-0.5+0.5)));
    const py=Math.min(height-1, Math.max(0, Math.floor(tv*height-0.5+0.5)));
    return data[(py*width+px)*4+3];
  };
  const clear=(x0, y0, x1, y1)=>{
    let n=0;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(nearestAlpha(x, y)===0)n++;
    return n;
  };
  assert.equal(clear(41, 96, 88, 144), 2252);
  assert.equal(clear(136, 116, 184, 144), 983);
  let nativeTexels=0, dumpTexels=0;
  for(let i=0;i<data.length;i+=4){
    if(data[i]===223&&data[i+1]===215&&data[i+2]===206)nativeTexels++;
    if(data[i]===229&&data[i+1]===224&&data[i+2]===216)dumpTexels++;
  }
  assert.equal(nativeTexels, 0);
  assert.equal(dumpTexels, 0);
});
