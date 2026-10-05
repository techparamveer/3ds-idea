import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';

const require=createRequire(new URL('../package.json', import.meta.url));
const firmware=new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const painter=readFileSync(new URL('../src/os/stock-native-camera.ts', import.meta.url), 'utf8');
const dialog=JSON.parse(readFileSync(new URL('packs/camera/contents/0000-0000001a/lyt-C-Dlg.json', firmware), 'utf8'));
const guide=JSON.parse(readFileSync(new URL('packs/camera/contents/0000-0000001a/lyt-P_Guid_U-arc-LZ.json', firmware), 'utf8'));
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const pane=(layout,name)=>{
  const walk=panes=>{for(const item of panes){if(item.name===name)return item;const child=walk(item.children??[]);if(child)return child;}};
  return walk(layout.roots);
};

test('page 5 already draws C_DlgGuid_U then P_Guid02_U, with no fitted crop', ()=>{
  assert.match(painter, /\{label:'D_003_0',illustration:null\}/);
  assert.match(painter, /\{label:'D_003_4',illustration:'P_Guid02_U'\}/);
  assert.match(painter, /if\(entry\.illustration\)\{draw\(top,'camera-dialog','C_DlgGuid_U'\);draw\(top,'camera-guide-upper',entry\.illustration\);\}/);
  const frame=dialog.layouts.C_DlgGuid_U;
  assert.equal(dialog.resourceSources.layouts.C_DlgGuid_U.sha256, '63b7f51b16405dd7dd40e1cfc090cf9094dba9864e824aa4a4f287735aa426e1');
  assert.equal(dialog.resourceSources.layouts.C_DlgGuid_U.path, 'lyt/C.LZ/Dlg/blyt/C_DlgGuid_U.bclyt');
  assert.deepEqual(frame.textures, ['C_DlgChBase.bclim', 'C_DlgChLay_U.bclim']);
  assert.equal(dialog.textures['C_DlgChBase.bclim'].sha256, '665505a3deb531c280efd484a261ca8132f6b548ac34655a02f45333c0eecebb');
  assert.equal(dialog.textures['C_DlgChBase.bclim'].sourceSha256, 'a9fa4c68c3ad4222c9e5da2df047b2bc8cf38d227ab296e2e4e04d0bf4a18b03');
  assert.equal(dialog.textures['C_DlgChLay_U.bclim'].sha256, '8f0ff3062701d35fb201cd653f73e1ce1560b1447c26e0a0d8173c41abf1af66');
  assert.equal(dialog.textures['C_DlgChLay_U.bclim'].sourceSha256, '4ace99514177f09014a0b078af175622944068ef8eceab46982f1df112e943e4');
  const left=pane(frame, 'GuidWdwU_L'), right=pane(frame, 'GuidWdwU_R');
  assert.deepEqual(left.size, [368, 230]);
  assert.deepEqual(left.translation.map(value=>value||0), [-10, 0, 0]);
  assert.deepEqual(left.scale, [1, 1]);
  assert.deepEqual(right.size, [20, 230]);
  assert.deepEqual(right.translation.map(value=>value||0), [184, 0, 0]);
  assert.deepEqual(right.scale, [-1, 1]);
  for(const material of frame.materials){
    assert.deepEqual(material.colorBlend, {destinationFactor:5, logic:0, operation:1, sourceFactor:4});
    assert.equal(material.unsupported.length, 0);
  }
  assert.deepEqual(frame.materials[0].textureMatrices[0].scale, [18.399999618530273, 1]);
  assert.equal(Object.keys(dialog.animations).some(name=>name.startsWith('C_DlgGuid_U')), false);
  const art=guide.layouts.P_Guid02_U;
  assert.equal(guide.resourceSources.layouts.P_Guid02_U.sha256, 'f4d871b2c9541a7b53d8b147fee3b6fdcd61389fe83424936e84d801f36728cc');
  assert.deepEqual(art.roots[0].children.map(child=>child.name), ['Ballon', 'Inko', 'Pen', 'Effect_Ballon', 'Effect_Inko']);
  assert.equal(art.roots[0].picture, undefined);
  for(const child of art.roots[0].children){
    const [w,h]=child.size.map((value,index)=>value*Math.abs(child.scale[index]));
    const x=200+child.translation[0], y=120-child.translation[1];
    const radius=Math.hypot(w, h)/2;
    assert.equal(Math.hypot(x-12, y-6)<=radius, false, child.name);
  }
});

test('the frozen page-5 upper pair keeps 7615 and the page-1 finder underneath', async t=>{
  const root='/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001';
  const files={
    native:'/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/camera-guide-replay-20260926/screenshots/Nintendo 3DS Camera_26.09.26_20.38.02.703.png',
    upper:`${root}/camera-welcome-p5-recapture-20261005/browser/upper.png`,
    page1:`${root}/camera-welcome-p1-recapture-20261005/browser/upper.png`,
    report:`${root}/camera-welcome-p5-recapture-20261005/diff/report.json`,
    contact:`${root}/camera-welcome-p5-recapture-20261005/diff/upper-contact-sheet.png`,
    mask:new URL('../scripts/native-compare/empty-mask.json', import.meta.url),
  };
  if(![files.native, files.upper, files.page1, files.report, files.contact].every(existsSync)){
    return t.skip('private Camera Welcome page-5 pair is absent');
  }
  assert.equal(sha(files.native), '616fbeaebdf290656868fd2449cba3f61362bf7be50eb08bf3db08d206cbb18f');
  assert.equal(sha(files.upper), '1df24847d9033b20c9c7619f693172c748765dd8017ce57badfcdc80a45d3467');
  assert.equal(sha(files.page1), 'b642d80f8f219a90f61f38718f58c6be71cfbd48aee421763ffaff878f7ac00e');
  assert.equal(sha(files.report), '87306be0f58c1d4fcae4cbd4531557c4ca8d7243483798c3b619a4610f4b6bb6');
  assert.equal(sha(files.contact), '64755be4230c0543c7616fe59d5e1933b517d9bbf90711805632ae27f83135b8');
  assert.equal(sha(files.mask), 'dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95');
  const sharp=require('sharp');
  const native=await sharp(files.native).extract({left:0, top:0, width:400, height:240}).ensureAlpha().raw().toBuffer();
  const browser=await sharp(files.upper).ensureAlpha().raw().toBuffer();
  const page1=await sharp(files.page1).ensureAlpha().raw().toBuffer();
  const count=(left, right, x0, y0, w, h)=>{
    let n=0, max=0, at=null;
    for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){
      const i=(y*400+x)*4;
      const e=Math.max(Math.abs(left[i]-right[i]), Math.abs(left[i+1]-right[i+1]), Math.abs(left[i+2]-right[i+2]));
      if(e>max){max=e; at=[x, y];}
      if(e>2)n++;
    }
    return {n, max, at};
  };
  const whole=count(native, browser, 0, 0, 400, 240);
  assert.equal(whole.n, 7615);
  assert.equal(whole.max, 128);
  assert.deepEqual(whole.at, [12, 6]);
  assert.deepEqual([native[(6*400+12)*4], native[(6*400+12)*4+1], native[(6*400+12)*4+2]], [127, 127, 127]);
  assert.deepEqual([browser[(6*400+12)*4], browser[(6*400+12)*4+1], browser[(6*400+12)*4+2]], [255, 255, 255]);
  assert.deepEqual([page1[(6*400+12)*4], page1[(6*400+12)*4+1], page1[(6*400+12)*4+2]], [255, 255, 255]);
  assert.equal(count(native, browser, 80, 40, 240, 160).n, 0);
  assert.equal(count(native, browser, 0, 0, 80, 240).n, 2447);
  assert.equal(count(native, browser, 320, 0, 80, 240).n, 2457);
  assert.equal(count(native, browser, 0, 0, 400, 40).n, 2768);
  let unchanged=0, changed=0;
  for(let y=0;y<240;y++)for(let x=0;x<400;x++){
    const i=(y*400+x)*4;
    const nativeDelta=Math.max(Math.abs(native[i]-browser[i]), Math.abs(native[i+1]-browser[i+1]), Math.abs(native[i+2]-browser[i+2]));
    if(nativeDelta<=2)continue;
    const pageDelta=Math.max(Math.abs(page1[i]-browser[i]), Math.abs(page1[i+1]-browser[i+1]), Math.abs(page1[i+2]-browser[i+2]));
    if(pageDelta>2)changed++;else unchanged++;
  }
  assert.equal(unchanged, 7526);
  assert.equal(changed, 89);
  const report=JSON.parse(readFileSync(files.report, 'utf8'));
  assert.equal(report.screens.upper.pixelsOverThreshold, 7615);
  assert.deepEqual(report.screens.upper.regions[0], {x:0, y:0, width:400, height:240, pixelCount:7607});
  assert.deepEqual(report.screens.upper.regions[1], {x:112, y:3, width:3, height:3, pixelCount:8});
});

test('zero window alpha leaves the page-1 finder; the 89 rim pixels are delivered coverage', async t=>{
  const textureRoot='/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/camera-ready';
  const pairRoot='/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001';
  const nativePath='/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/camera-guide-replay-20260926/screenshots/Nintendo 3DS Camera_26.09.26_20.38.02.703.png';
  const upper=`${pairRoot}/camera-welcome-p5-recapture-20261005/browser/upper.png`;
  const page1Path=`${pairRoot}/camera-welcome-p1-recapture-20261005/browser/upper.png`;
  const layout=dialog.layouts.C_DlgGuid_U;
  const texturePaths=layout.textures.map(name=>`${textureRoot}/${dialog.textures[name].url}`);
  if(![nativePath, upper, page1Path, ...texturePaths].every(existsSync))return t.skip('private Camera window textures or page-5 pair are absent');
  const sharp=require('sharp');
  const textures=new Map();
  for(const name of layout.textures){
    const entry=dialog.textures[name];
    const decoded=await sharp(readFileSync(`${textureRoot}/${entry.url}`)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    textures.set(name, {width:decoded.info.width, height:decoded.info.height, data:decoded.data, picaFormat:entry.picaFormat});
  }
  const source=readFileSync(new URL('../src/os/native-layout.ts', import.meta.url), 'utf8');
  const compiled=ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.ESNext, target:ts.ScriptTarget.ES2022}}).outputText;
  const {rasterNativePicture}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
  const rasters=['GuidWdwU_L', 'GuidWdwU_R'].map(name=>{
    const item=pane(layout, name);
    return {item, mirror:item.scale[0]<0, pixels:rasterNativePicture(layout, item.picture, item.size[0], item.size[1], textures, 1)};
  });
  const sample=(x,y)=>{
    for(const raster of rasters){
      const left=200+raster.item.translation[0]-raster.item.size[0]/2;
      const top=120-raster.item.translation[1]-raster.item.size[1]/2;
      const lx=x-left, ly=y-top;
      if(lx<0||ly<0||lx>=raster.item.size[0]||ly>=raster.item.size[1])continue;
      const sx=raster.mirror?raster.item.size[0]-1-lx:lx;
      const i=(ly*raster.item.size[0]+sx)*4;
      return raster.pixels.data.subarray(i, i+4);
    }
    return null;
  };
  assert.equal(sample(12, 6)[3], 0);
  const native=await sharp(nativePath).extract({left:0, top:0, width:400, height:240}).ensureAlpha().raw().toBuffer();
  const browser=await sharp(upper).ensureAlpha().raw().toBuffer();
  const page1=await sharp(page1Path).ensureAlpha().raw().toBuffer();
  let zero=0, partial=0, opaque=0;
  for(let y=0;y<240;y++)for(let x=0;x<400;x++){
    const i=(y*400+x)*4;
    const delta=Math.max(Math.abs(native[i]-browser[i]), Math.abs(native[i+1]-browser[i+1]), Math.abs(native[i+2]-browser[i+2]));
    if(delta<=2)continue;
    const pixel=sample(x, y);
    const alpha=pixel?pixel[3]:0;
    if(alpha===0)zero++;
    else if(alpha<255){
      partial++;
      const coverage=alpha/255;
      for(let channel=0;channel<3;channel++){
        const blended=Math.round(pixel[channel]*coverage+page1[i+channel]*(1-coverage));
        assert.ok(Math.abs(blended-browser[i+channel])<=1, `${x},${y} channel ${channel}`);
      }
    }else opaque++;
  }
  assert.equal(zero, 7526);
  assert.equal(partial, 89);
  assert.equal(opaque, 0);
});
