import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';

const require=createRequire(new URL('../package.json', import.meta.url));
const firmware=new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const painterPath=new URL('../src/os/stock-native-camera.ts', import.meta.url);
const painter=readFileSync(painterPath, 'utf8');
const finder=JSON.parse(readFileSync(new URL('packs/camera/contents/0000-0000001a/lyt-P_Finder_U-arc-LZ.json', firmware), 'utf8'));
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const transpile=(name,overrides={})=>{
  const url=new URL(`../src/os/${name}.ts`, import.meta.url);
  const {outputText}=ts.transpileModule(readFileSync(url, 'utf8'), {compilerOptions:{module:ts.ModuleKind.ESNext, target:ts.ScriptTarget.ES2022}});
  return moduleUrl(outputText.replace(/(from\s*['"])(\.[^'"]+)(['"])/g, (_all, prefix, path, suffix)=>prefix+(overrides[path]??new URL(path.endsWith('.ts')?path:`${path}.ts`, url).href)+suffix));
};
const {
  cameraBrowseFinder3dEnabled,
  cameraFinderViewBadgeOverrides,
  cameraScreenPacks,
  drawNativeCameraFrame,
}=await import(transpile('stock-native-camera', {
  './stock-screen-layout':transpile('stock-screen-layout'),
  './native-layout':transpile('native-layout'),
}));
const packs=Object.fromEntries(cameraScreenPacks.map(p=>[p.alias, JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/'+p.url, import.meta.url), 'utf8'))]));
const find=(panes, name)=>{for(const pane of panes){if(pane.name===name)return pane; const child=find(pane.children??[], name); if(child)return child;}};
const view=(screen, rows=[], data={}, selection=0)=>({appId:'camera', screen, heading:'Nintendo 3DS Camera', rows, selection, footer:{left:{action:'back', label:'Back'}}, data});
function paint(screenView){
  const draws=[], images=[];
  const renderer={
    packs,
    draw(_ctx, pack, layout, opts){draws.push({layout, opts, pack}); return true;},
    drawLayout(_ctx, pack, layout, source, opts){draws.push({layout, opts, pack, source}); return true;},
  };
  const top={fillStyle:'', fillRect(){}}, bottom={
    fillStyle:'', strokeStyle:'', font:'', textAlign:'', textBaseline:'', globalAlpha:1,
    filter:'none', globalCompositeOperation:'source-over',
    fillText(){}, fillRect(){}, beginPath(){}, rect(){}, clip(){}, save(){}, restore(){},
    roundRect(){}, fill(){}, stroke(){},
  };
  const okay=drawNativeCameraFrame(renderer, top, bottom, screenView, {
    image:(_c, url, x, y, w, h, fit)=>{images.push([url, x, y, w, h, ...(fit?[fit]:[])]); return true;},
  });
  return {okay, draws, images};
}

test('0x2fdc6c helper shows 2DView when 3D is off and the inverse when 3D is on', ()=>{
  assert.equal(cameraBrowseFinder3dEnabled, false);
  assert.deepEqual(cameraFinderViewBadgeOverrides(false), {'3DView':{visible:false}, '2DView':{visible:true}});
  assert.deepEqual(cameraFinderViewBadgeOverrides(true), {'3DView':{visible:true}, '2DView':{visible:false}});
  assert.deepEqual(cameraFinderViewBadgeOverrides(0), cameraFinderViewBadgeOverrides(false));
  assert.deepEqual(cameraFinderViewBadgeOverrides(1), cameraFinderViewBadgeOverrides(true));
});

test('published P_FinderVS_U ViewInfo owns both cubes on the same P_IconOth_3D.bclim', ()=>{
  assert.equal(finder.titleId, '0004001000022400');
  assert.equal(finder.contentId, '0000001a');
  assert.equal(finder.contentIndex, 0);
  assert.equal(finder.sourceSha256, '5c75b6dc90e688adbf6b986833d6dc126b4c66b5eef2f7d6919c8e19a206cbb5');
  assert.equal(sha(new URL('packs/camera/contents/0000-0000001a/lyt-P_Finder_U-arc-LZ.json', firmware)),
    '49aa8a88e6f01206551cbea5e7ee931c98a4e8c9ff448aee3efeddc8ee661bea');
  const layout=finder.layouts.P_FinderVS_U;
  const viewInfo=find(layout.roots, 'ViewInfo');
  const three=find(layout.roots, '3DView');
  const two=find(layout.roots, '2DView');
  assert.deepEqual(viewInfo.translation, [183, 103, 0]);
  assert.deepEqual(viewInfo.size, [32, 32]);
  assert.equal(three.picture.material, 18);
  assert.equal(two.picture.material, 19);
  assert.deepEqual(layout.materials[18].constantColors[0], [255, 255, 255, 255]);
  assert.deepEqual(layout.materials[19].constantColors[0], [100, 100, 100, 255]);
  assert.equal(layout.materials[18].textureMaps[0].texture, 21);
  assert.equal(layout.materials[19].textureMaps[0].texture, 21);
  assert.equal(layout.textures[21], 'P_IconOth_3D.bclim');
  assert.equal(finder.resourceSources.layouts.P_FinderVS_U.sha256,
    '4e8555e4e65b45de6965ed6c8e44f95d793d2ecc4ee09d759759cf7a8e9ac16f');
  assert.equal(finder.resourceSources.layouts.P_FinderVS_U.path,
    'lyt/P_Finder_U.arc.LZ/blyt/P_FinderVS_U.bclyt');
  assert.equal(finder.resourceSources.textures['P_IconOth_3D.bclim'].sha256,
    '66a737ff765feec32ec5777e19734906c0ed4775a6ef1fa074c7de39ed01d045');
  assert.equal(finder.resourceSources.layouts.P_Finder_U.sha256,
    '49746852aac6835d7666872460b621b028098f14de694ff2af7e9f139d01d71e');
});

test('stereo HNI browse uses the 3D-enable helper, not stereoPhoto, and Welcome stays 3D-off', ()=>{
  assert.match(painter, /export const cameraBrowseFinder3dEnabled=false/);
  assert.match(painter, /\.\.\.cameraFinderViewBadgeOverrides\(cameraBrowseFinder3dEnabled\)/);
  assert.match(painter, /\.\.\.cameraFinderViewBadgeOverrides\(false\)/);
  assert.equal(painter.includes("'3DView':{visible:stereoPhoto}"), false);
  assert.equal(painter.includes("'3DView':{visible:false},'2DView':{visible:true}"), false);
  const stereo={originalWidth:640, originalHeight:480, parallaxPixels:-44.553070068359375};
  const gallery=paint(view('gallery', [{id:'photo:a', label:'Fixture'}], {
    photos:[{id:'a', src:'/private/HNI_0002.JPG', verificationStereo:stereo}],
  }));
  const upper=gallery.draws.find(d=>d.layout==='P_FinderVS_U').opts.overrides;
  assert.equal(gallery.images[0][5].kind, 'camera-stereo');
  assert.deepEqual(upper.ViewInfo, {visible:true});
  assert.deepEqual(upper['3DView'], cameraFinderViewBadgeOverrides(cameraBrowseFinder3dEnabled)['3DView']);
  assert.deepEqual(upper['2DView'], cameraFinderViewBadgeOverrides(cameraBrowseFinder3dEnabled)['2DView']);
  assert.deepEqual(upper['3DView'], {visible:false});
  assert.deepEqual(upper['2DView'], {visible:true});
  for(const edge of ['Edge0', 'Edge1', 'Edge2', 'Edge3'])assert.deepEqual(upper[edge], {visible:false});
  const welcome=paint(view('guide', [], {guidePage:0}));
  const finderUpper=welcome.draws.find(d=>d.layout==='P_Finder_U').opts.overrides;
  assert.deepEqual(finderUpper['3DView'], cameraFinderViewBadgeOverrides(false)['3DView']);
  assert.deepEqual(finderUpper['2DView'], cameraFinderViewBadgeOverrides(false)['2DView']);
});

test('pinned Camera code.bin has a single 0x2fdc6c caller that sxtb-s a 3D-enable byte', async t=>{
  const codePath='/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/reader-extracted/camera/contents/0000-0000001a/exefs/code.bin';
  if(!existsSync(codePath))return t.skip('private Camera code.bin is absent');
  const code=readFileSync(codePath);
  assert.equal(createHash('sha256').update(code).digest('hex'),
    '3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c');
  const BASE=0x100000;
  const u32=va=>code.readUInt32LE(va-BASE);
  const cstr=va=>{
    const start=va-BASE;
    const end=code.indexOf(0, start);
    return code.subarray(start, end<0?start+16:end).toString('ascii');
  };
  assert.equal(cstr(u32(0x4404cc+0x158)), '3DView');
  assert.equal(cstr(u32(0x4404cc+0x15c)), '2DView');
  assert.equal(u32(0x2a7274), 0xe6af1076); // sxtb r1, r6
  assert.equal(u32(0x2a7278), 0xeb015a7b); // bl 0x2fdc6c
  assert.equal(u32(0x2fdd20), 0xe20110fe); // and r1, r1, #0xfe  (3DView bit0)
  assert.equal(u32(0x2fdd24), 0xe1811004); // orr r1, r1, r4
  assert.equal(u32(0x2fdd30), 0xe2241001); // eor r1, r4, #1     (2DView = r1 XOR 1)
  let callers=0;
  for(let off=0; off+4<=code.length; off+=4){
    const w=code.readUInt32LE(off);
    if((w&0x0f000000)!==0x0b000000)continue;
    let imm=w&0x00ffffff;
    if(imm&0x800000)imm-=0x1000000;
    if(BASE+off+8+imm*4===0x2fdc6c)callers++;
  }
  assert.equal(callers, 1);
});

test('hashed HNI pair keeps the grey-badge residual after the 2DView bind', async t=>{
  const files={
    native:'/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/scenario-matrix/v1/captures/camera-populated-browse-global/native/combined.png',
    white:`/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260928/reference/scenario-matrix/v1/captures/camera-edge-badge-variant/browser/upper.png`,
    grey:`/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260928/reference/scenario-matrix/v1/captures/camera-grey-badge-0928/browser/upper.png`,
    greyLower:`/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260928/reference/scenario-matrix/v1/captures/camera-grey-badge-0928/browser/lower.png`,
    whiteReport:`/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260928/reference/scenario-matrix/v101/comparisons/camera-edge-badge-variant/report.json`,
    greyReport:`/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260928/reference/scenario-matrix/v102/comparisons/camera-grey-badge-14d92d9/report.json`,
    mask:new URL('../scripts/native-compare/empty-mask.json', import.meta.url),
  };
  if(![files.native, files.white, files.grey, files.greyLower, files.whiteReport, files.greyReport].every(existsSync)){
    return t.skip('private Camera HNI badge pair is absent');
  }
  assert.equal(sha(files.native), 'cae793c31bdf9f13d44f0834582bf99fead5bb8d652321913993bedde7ae1652');
  assert.equal(sha(files.white), '32094a1dd8d0fd3993c2b1df291feddc70c04dde2ce2422d63e5fe6a9ea5ab65');
  assert.equal(sha(files.grey), '184bdfdf148d41cecc10d245f14708a38d4afc7c1776c4d9a6bf7eef067694d6');
  assert.equal(sha(files.mask), 'dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95');
  assert.equal(sha(files.whiteReport), '0072e23444af9cba592b14eaef94bee51eca659b6e18f105d17649ef77944976');
  assert.equal(sha(files.greyReport), '1f8251ff2b1380f5d10b69db2bfc67489e02d09a42a37e82654c2d9b48e01278');
  const whiteReport=JSON.parse(readFileSync(files.whiteReport, 'utf8'));
  const greyReport=JSON.parse(readFileSync(files.greyReport, 'utf8'));
  assert.equal(whiteReport.screens.upper.pixelsOverThreshold, 33997);
  assert.deepEqual(whiteReport.screens.upper.regions[2], {x:371, y:3, width:25, height:27, pixelCount:434});
  assert.equal(greyReport.screens.upper.pixelsOverThreshold, 33522);
  assert.notEqual(greyReport.screens.upper.regions[2].pixelCount, 434);
  const sharp=require('sharp');
  const nativeUpper=await sharp(files.native).extract({left:0, top:0, width:400, height:240}).removeAlpha().raw().toBuffer();
  const nativeLower=await sharp(files.native).extract({left:40, top:240, width:320, height:240}).removeAlpha().raw().toBuffer();
  const whiteUpper=await sharp(files.white).removeAlpha().raw().toBuffer();
  const greyUpper=await sharp(files.grey).removeAlpha().raw().toBuffer();
  const greyLower=await sharp(files.greyLower).removeAlpha().raw().toBuffer();
  const count=(native, browser, width, x0, y0, x1, y1)=>{
    let n=0, max=0, at=null;
    for(let y=y0; y<y1; y++)for(let x=x0; x<x1; x++){
      const i=(y*width+x)*3;
      const e=Math.max(Math.abs(native[i]-browser[i]), Math.abs(native[i+1]-browser[i+1]), Math.abs(native[i+2]-browser[i+2]));
      if(e>max){max=e; at=[x, y];}
      if(e>2)n++;
    }
    return {n, max, at};
  };
  const sample=(buf, width, x, y)=>[buf[(y*width+x)*3], buf[(y*width+x)*3+1], buf[(y*width+x)*3+2]];
  assert.equal(count(nativeUpper, whiteUpper, 400, 0, 0, 400, 240).n, 33997);
  assert.equal(count(nativeUpper, greyUpper, 400, 0, 0, 400, 240).n, 33522);
  assert.equal(count(nativeUpper, whiteUpper, 400, 371, 3, 396, 30).n, 481);
  assert.equal(count(nativeUpper, greyUpper, 400, 371, 3, 396, 30).n, 7);
  assert.deepEqual(sample(nativeUpper, 400, 383, 17), [100, 100, 100]);
  assert.deepEqual(sample(whiteUpper, 400, 383, 17), [255, 255, 255]);
  assert.deepEqual(sample(greyUpper, 400, 383, 17), [100, 100, 100]);
  assert.equal(count(nativeLower, greyLower, 320, 0, 0, 320, 240).n, 12872);
});
