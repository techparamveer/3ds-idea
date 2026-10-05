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
const ENTRY=[42, 113, 235], TITLE=[41, 113, 238], SOURCE=[57, 170, 213];
const flatten=panes=>panes.flatMap(pane=>[pane, ...flatten(pane.children??[])]);

function lcdTop(translationY, height){
  // Root and Back sit on the 320×240 centre. Layout +Y is up.
  return 120-translationY-height/2;
}

test('UserWdwEdge owns empty-entry y=177 and the painter keeps the entry theme', ()=>{
  assert.equal(pack.titleId, '0004001000022500');
  assert.equal(pack.contentId, '0000000b');
  assert.equal(pack.sourceSha256, '944b1cf9a81eac5b162001ac6b9a5dfae63513e1dc45981c87496c159fd0d434');
  assert.equal(pack.resourceSources.layouts['S_BG_D-Ctr'].path, 'lyt/S_BG.arc.LZ/blyt/S_BG_D-Ctr.bclyt');
  assert.equal(pack.resourceSources.layouts['S_BG_D-Ctr'].sha256, 'bf589d12f462d71c2edfd1c6df47eaac095fd346065c7f73ddc73ebd982b3e88');
  const layout=pack.layouts['S_BG_D-Ctr'];
  assert.deepEqual(layout.canvas, {width:320, height:240, origin:1});
  const panes=flatten(layout.roots);
  const back=panes.find(pane=>pane.name==='Back');
  const window=panes.find(pane=>pane.name==='UserWdw');
  const edge=panes.find(pane=>pane.name==='UserWdwEdge');
  const shadow=panes.find(pane=>pane.name==='UserWdwSdw');
  assert.equal(back.translation[0] === 0 && back.translation[1] === 0, true);
  assert.deepEqual(window.size, [320, 66]);
  assert.equal(window.translation[1], -87);
  assert.equal(window.origin, 4);
  assert.equal(window.alpha, 255);
  assert.deepEqual(edge.size, [320, 8]);
  assert.equal(edge.translation[1], -58);
  assert.equal(edge.origin, 4);
  assert.equal(lcdTop(edge.translation[1], edge.size[1]), 174);
  assert.equal(lcdTop(window.translation[1], window.size[1]), 174);
  assert.equal(lcdTop(shadow.translation[1], shadow.size[1]), 166);
  assert.deepEqual(back.children.map(pane=>pane.name), ['UserWdw', 'UserWdwSdw', 'UserWdwEdge']);
  const edgeMaterial=layout.materials[edge.picture.material];
  const windowMaterial=layout.materials[window.picture.material];
  assert.equal(edgeMaterial.name, 'UserWdwEdge');
  assert.deepEqual(edgeMaterial.tevStages, []);
  assert.deepEqual(edgeMaterial.constantColors[0], [255, 255, 255, 255]);
  assert.deepEqual(edgeMaterial.constantColors[5], [255, 255, 255, 255]);
  assert.deepEqual(edgeMaterial.textureMaps, [{magFilter:1, minFilter:1, texture:1, wrapS:0, wrapT:0}]);
  assert.deepEqual(edge.picture.colors, [[255, 255, 255, 255], [255, 255, 255, 255], [255, 255, 255, 255], [255, 255, 255, 255]]);
  assert.equal(layout.textures[edgeMaterial.textureMaps[0].texture], 'V2C_UserWdwEdge.bclim');
  assert.equal(windowMaterial.name, 'UserWdw');
  assert.equal(windowMaterial.tevStages.length, 3);
  assert.deepEqual(windowMaterial.constantColors[5], [...SOURCE, 255]);
  assert.equal(layout.textures[windowMaterial.textureMaps[0].texture], 'V2C_UserWdw.bclim');
  assert.equal(pack.textures['V2C_UserWdwEdge.bclim'].formatName, 'LA8');
  assert.equal(pack.textures['V2C_UserWdwEdge.bclim'].sourceSha256, '86425541097854567d5960fe46c8ed0fa2d191b6e14d086bc2623f286f2c5913');
  assert.equal(pack.textures['V2C_UserWdw.bclim'].formatName, 'L8');
  assert.equal(pack.textures['V2C_UserWdw.bclim'].sourceSha256, 'b9e2229310ed1e097a7188cd2a1fc1776b927db537eed4719407078f1353a5a8');
  assert.match(painter, /entry\(bottom,'sound-bg','S_BG_D-Ctr'\);/);
  assert.match(painter, /\['TitBar','TitBarBvlL','TitBarBvlC'\]\.includes\(material\.name\)\?\[41,113,238,255\]:\[42,113,235,255\]/);
  assert.equal(painter.includes('UserWdw'), false);
});

test('decoded LA8 alpha 25 over the entry theme is the browser row, and only the title fit matches native', async ()=>{
  const sharp=require('sharp');
  const load=async name=>{
    const texture=pack.textures[name];
    const decoded=await sharp(new URL(texture.url, firmware).pathname).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    assert.equal(sha(new URL(texture.url, firmware)), texture.sha256);
    return {width:decoded.info.width, height:decoded.info.height, data:new Uint8ClampedArray(decoded.data), picaFormat:texture.picaFormat};
  };
  const edgeImage=await load('V2C_UserWdwEdge.bclim');
  const windowImage=await load('V2C_UserWdw.bclim');
  assert.deepEqual([edgeImage.width, edgeImage.height, edgeImage.picaFormat], [8, 8, 5]);
  assert.deepEqual([windowImage.width, windowImage.height, windowImage.picaFormat], [8, 8, 7]);
  for(let i=0;i<windowImage.data.length;i+=4)assert.deepEqual([...windowImage.data.subarray(i, i+4)], [255, 255, 255, 255]);
  const alphas=[];
  for(let y=0;y<8;y++){
    const row=[];
    for(let x=0;x<8;x++){
      const at=(y*8+x)*4;
      assert.deepEqual([...edgeImage.data.subarray(at, at+3)], [255, 255, 255]);
      row.push(edgeImage.data[at+3]);
    }
    alphas.push(row);
  }
  assert.deepEqual(alphas[3], [25, 25, 25, 25, 25, 25, 25, 25]);
  const layout=structuredClone(pack.layouts['S_BG_D-Ctr']);
  for(const material of layout.materials)if(material.constantColors[5]?.join(',')==='57,170,213,255')material.constantColors[5]=[...ENTRY, 255];
  const panes=flatten(layout.roots);
  const edge=panes.find(pane=>pane.name==='UserWdwEdge');
  const window=panes.find(pane=>pane.name==='UserWdw');
  const textures=new Map([['V2C_UserWdwEdge.bclim', edgeImage], ['V2C_UserWdw.bclim', windowImage]]);
  const edgeRaster=layoutModule.rasterNativePicture(layout, edge.picture, 320, 8, textures);
  const windowRaster=layoutModule.rasterNativePicture(layout, window.picture, 1, 1, textures);
  assert.deepEqual([...windowRaster.data], [...ENTRY, 255]);
  for(let x=0;x<320;x++)assert.deepEqual([...edgeRaster.data.subarray((3*320+x)*4, (3*320+x)*4+4)], [255, 255, 255, 25]);
  const over=(src, dst)=>[0, 1, 2].map(i=>Math.round(src[i]*src[3]/255+dst[i]*(1-src[3]/255)));
  const edgePixel=[255, 255, 255, 25];
  assert.deepEqual(over(edgePixel, [...ENTRY, 255]), [63, 127, 237]);
  assert.deepEqual(over(edgePixel, [...TITLE, 255]), [62, 127, 240]);
  const channel=(target, index)=>{
    const found=[];
    for(let value=0;value<256;value++){
      const blended=Math.round(edgePixel[index]*edgePixel[3]/255+value*(1-edgePixel[3]/255));
      if(blended===target)found.push(value);
    }
    return found;
  };
  assert.deepEqual([channel(63, 0), channel(127, 1), channel(237, 2)], [[42], [113], [235]]);
  assert.deepEqual([channel(62, 0), channel(127, 1), channel(240, 2)], [[41], [113], [238]]);
});

test('the dump LA8 member matches the published PNG and code.bin has neither blue', t=>{
  if(!existsSync(codePath)||!existsSync(arcPath))return t.skip('private Sound S_BG dump is absent');
  assert.equal(sha(codePath), '3c57f2c4091c1bec6b3834609f1e2a6488712e21775d7548b441c69c60b3e5a9');
  assert.equal(sha(arcPath), '944b1cf9a81eac5b162001ac6b9a5dfae63513e1dc45981c87496c159fd0d434');
  const probed=spawnSync('python3', ['-c', `
import hashlib, json, sys
from pathlib import Path
sys.path.insert(0, sys.argv[1]); sys.path.insert(0, sys.argv[1] + '/firmware')
from unpack_home_resources import decompress, unpack_darc
from texture import decode_bclim
files = unpack_darc(decompress(Path(sys.argv[2]).read_bytes()))
edge, edge_rgba = decode_bclim(files['timg/V2C_UserWdwEdge.bclim'])
body, body_rgba = decode_bclim(files['timg/V2C_UserWdw.bclim'])
code = Path(sys.argv[3]).read_bytes()
needles = {
  'source': bytes([57, 170, 213, 255]),
  'entry': bytes([42, 113, 235, 255]),
  'title': bytes([41, 113, 238, 255]),
}
print(json.dumps({
  'edgeSha': hashlib.sha256(files['timg/V2C_UserWdwEdge.bclim']).hexdigest(),
  'bodySha': hashlib.sha256(files['timg/V2C_UserWdw.bclim']).hexdigest(),
  'ctrSha': hashlib.sha256(files['blyt/S_BG_D-Ctr.bclyt']).hexdigest(),
  'edge': edge,
  'body': body,
  'edgeAlpha': [edge_rgba[y*8*4+3] for y in range(8) for _ in range(1)],
  'edgeRow3': list(edge_rgba[3*8*4:3*8*4+4]),
  'bodyWhite': all(body_rgba[i:i+4] == b'\\xff\\xff\\xff\\xff' for i in range(0, len(body_rgba), 4)),
  'colours': {name: needle in code for name, needle in needles.items()},
  'userWdw': b'UserWdw' in code,
  'ctr': b'S_BG_D-Ctr' in code,
}))
`, new URL('../scripts', import.meta.url).pathname, arcPath, codePath], {encoding:'utf8'});
  assert.equal(probed.status, 0, probed.stderr);
  const member=JSON.parse(probed.stdout);
  assert.equal(member.edgeSha, '86425541097854567d5960fe46c8ed0fa2d191b6e14d086bc2623f286f2c5913');
  assert.equal(member.bodySha, 'b9e2229310ed1e097a7188cd2a1fc1776b927db537eed4719407078f1353a5a8');
  assert.equal(member.ctrSha, 'bf589d12f462d71c2edfd1c6df47eaac095fd346065c7f73ddc73ebd982b3e88');
  assert.deepEqual(member.edge, {width:8, height:8, format:3, picaFormat:5, formatName:'LA8'});
  assert.deepEqual(member.body, {width:8, height:8, format:0, picaFormat:7, formatName:'L8'});
  assert.deepEqual(member.edgeRow3, [255, 255, 255, 25]);
  assert.equal(member.bodyWhite, true);
  assert.deepEqual(member.colours, {source:false, entry:false, title:false});
  assert.equal(member.userWdw, false);
  assert.equal(member.ctr, true);
});

test('frozen empty-entry lowers still differ by 320 on y=177', async t=>{
  const root='/Users/paramveer/.codex/3ds-artifact-overflow';
  const files={
    native:`${root}/reference/screenshots/Nintendo 3DS Sound_25.09.26_22.31.31.595.png`,
    oldBrowser:`${root}/home-fidelity-20261001/sound-clock-recapture-20261004/browser-empty-entry/lower.png`,
    gridBrowser:`${root}/home-fidelity-20261001/sound-grid-recapture-20261005/browser-sound-empty-entry/lower.png`,
    mask:new URL('../scripts/native-compare/empty-mask.json', import.meta.url),
  };
  if(![files.native, files.oldBrowser, files.gridBrowser].every(existsSync))return t.skip('private Sound empty-entry lowers are absent');
  assert.equal(sha(files.native), '65fc5f8819d31c49622d9e2a8ee7ba79c0675fd7dd3a73f783255eb7efe3b4cd');
  assert.equal(sha(files.oldBrowser), 'ee103d93d744f5037fd36f24ad93403bf57298b2e1d74752da09d542023ea38d');
  assert.equal(sha(files.gridBrowser), '860b3222fd21e1976ee5e5af6caf6072a90abf54b5831cc84aa8a592742aacd5');
  assert.equal(sha(files.mask), 'dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95');
  const sharp=require('sharp');
  const native=await sharp(files.native).extract({left:40, top:240, width:320, height:240}).removeAlpha().raw().toBuffer();
  const oldBrowser=await sharp(files.oldBrowser).removeAlpha().raw().toBuffer();
  const gridBrowser=await sharp(files.gridBrowser).removeAlpha().raw().toBuffer();
  let over=0, max=0;
  for(let x=0;x<320;x++){
    const i=(177*320+x)*3;
    assert.deepEqual([...native.subarray(i, i+3)], [62, 127, 240]);
    assert.deepEqual([...oldBrowser.subarray(i, i+3)], [63, 127, 237]);
    assert.deepEqual([...gridBrowser.subarray(i, i+3)], [63, 127, 237]);
    const delta=Math.max(Math.abs(native[i]-63), Math.abs(native[i+1]-127), Math.abs(native[i+2]-237));
    if(delta>max)max=delta;
    if(delta>2)over++;
  }
  assert.equal(over, 320);
  assert.equal(max, 3);
});
