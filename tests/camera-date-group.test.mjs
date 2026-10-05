import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import ts from 'typescript';

const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const transpile=name=>{
  const url=new URL(`../src/os/${name}.ts`,import.meta.url);
  const {outputText}=ts.transpileModule(readFileSync(url,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
  return moduleUrl(outputText.replace(/(from\s*['"])(\.[^'"]+)(['"])/g,(_all,prefix,path,suffix)=>prefix+new URL(path.endsWith('.ts')?path:`${path}.ts`,url).href+suffix));
};
const camera=await import(transpile('stock-native-camera'));
const {cameraScreenPacks,cameraDateGroupOrange,cameraBrowseUserColor,drawNativeCameraLower}=camera;
const pack=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/camera/contents/0000-0000001a/lyt-P_Brws_D-arc-LZ.json',import.meta.url),'utf8'));
const nativePath='/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/scenario-matrix/v1/captures/camera-populated-browse-global/native/combined.png';
const browserLowerPath='/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/camera-3d-badge-sdmc-recapture-20261005/browser/lower.png';
const reportPath='/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/camera-3d-badge-sdmc-recapture-20261005/report.json';
const sha256=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const find=(panes,name)=>{for(const pane of panes){if(pane.name===name)return pane;const child=find(pane.children??[],name);if(child)return child;}};
const view=(rows,selection=0)=>({appId:'camera',screen:'gallery',heading:'Nintendo 3DS Camera',rows,selection,footer:{left:{action:'back',label:'Back'}},data:{photos:[1,2].map(number=>({id:`HNI_000${number}`,src:`/fixture/${number}.jpg`}))}});
function painted(rows,selection=2){
  const draws=[];
  const renderer={
    packs:{'camera-gallery':pack,'camera-messages':{messages:{}}},
    draw(_c,_p,layout,opts){draws.push({layout,opts});return true;},
    drawLayout(_c,_p,layout,source,opts){draws.push({layout,opts,source});return true;},
  };
  const bottom={save(){},restore(){},beginPath(){},rect(){},clip(){}};
  const okay=drawNativeCameraLower(renderer,bottom,view(rows,selection),{image:()=>false});
  return {okay,draws};
}

/** ThmbBase is centred on the large date cell. Canvas Y flips the layout translation. */
function datePaneRect(){
  const pane=find(pack.layouts.P_BrwsFld.roots,'ThmbBase');
  const [cellX,cellY]=[84,74];
  const cx=cellX+pane.translation[0],cy=cellY-pane.translation[1];
  return [cx-pane.size[0]/2,cy-pane.size[1]/2,pane.size[0],pane.size[1]];
}

test('frozen HNI pair hashes and the ThmbBase date rect stay the recorded leftover',async()=>{
  assert.equal(sha256(nativePath),'cae793c31bdf9f13d44f0834582bf99fead5bb8d652321913993bedde7ae1652');
  assert.equal(sha256(browserLowerPath),'0d0ffe41fed0cebe34d78ae196cf1694ffeeb3fde59379a027b8969b35845dea');
  assert.equal(sha256(reportPath),'a6925bfc30c9137ae7fe5ed5a1d53f2b51fc58c232a9ae8e9eca9bc7d40e05b1');
  const report=JSON.parse(readFileSync(reportPath,'utf8'));
  const lower=report.screens.lower;
  assert.equal(lower.pixelsOverThreshold,12872);
  assert.equal(report.screens.upper.pixelsOverThreshold,33522);
  const rect=datePaneRect();
  assert.deepEqual(rect,[52,49,66,52]);
  const official=lower.regions[0];
  assert.deepEqual([official.x,official.y,official.width,official.height,official.pixelCount],[52,49,66,52,3396]);
  const native=await sharp(nativePath).extract({left:40,top:240,width:320,height:240}).removeAlpha().raw().toBuffer();
  const browser=await sharp(browserLowerPath).removeAlpha().raw().toBuffer();
  const sample=(buf,x,y)=>[buf[(y*320+x)*3],buf[(y*320+x)*3+1],buf[(y*320+x)*3+2]];
  assert.deepEqual(sample(native,70,85),[255,161,0]);
  assert.deepEqual(sample(native,85,75),[255,161,0]);
  assert.deepEqual(sample(browser,70,85),[230,209,173]);
  assert.deepEqual(sample(browser,85,75),[178,112,0]);
  let over=0;
  for(let y=rect[1];y<rect[1]+rect[3];y++)for(let x=rect[0];x<rect[0]+rect[2];x++){
    const n=sample(native,x,y),b=sample(browser,x,y);
    if(Math.max(Math.abs(n[0]-b[0]),Math.abs(n[1]-b[1]),Math.abs(n[2]-b[2]))>2)over++;
  }
  assert.equal(over,3396);
});

test('date-group fill binds large PicL_Op and keeps the UserBG orange constant',async()=>{
  const request=cameraScreenPacks.find(item=>item.alias==='camera-gallery');
  assert.ok(request.animations.includes('P_BrwsFld_PicL_Op'));
  const clip=pack.animations.P_BrwsFld_PicL_Op;
  assert.deepEqual(clip.textures,['P_Thmb_Date2x3.bclim']);
  assert.equal(clip.tracks.find(track=>track.property==='texture.pattern').keys[0].value,0);
  assert.deepEqual(pack.animations.P_BrwsFld_PicL.textures,['P_Thmb_Date5x7.bclim','P_Thmb_DatePho2x3.bclim']);
  const source=pack.layouts.P_BrwsFld.materials.find(material=>material.name==='ThmbBase');
  assert.deepEqual(source.constantColors[5],[120,193,31,255]);
  const posed=cameraDateGroupOrange(pack.layouts.P_BrwsFld);
  assert.deepEqual(posed.materials.find(material=>material.name==='ThmbBase').constantColors[5],[...cameraBrowseUserColor]);
  assert.deepEqual([...cameraBrowseUserColor],[255,161,0,255]);
  const texture=name=>sharp(fileURLToPath(new URL(`../public/os/firmware/10.7.0-32E/textures/${name}`,import.meta.url))).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const dateTex=await texture('59599fc9fcbfe5d45994181d5eb770a5b2216578fdefeb26387dcee7d4d012af.png');
  const photoTex=await texture('d1cbc64d8c177a12921b498a06ac8ca366ac2f78ae7e9b765d57f5f9d682c809.png');
  const centre=(image,x,y)=>{const i=(y*image.info.width+x)*4;return [image.data[i],image.data[i+1],image.data[i+2],image.data[i+3]];};
  assert.deepEqual(centre(dateTex,33,26),[255,255,255,255]);
  assert.deepEqual(centre(photoTex,33,26),[178,178,178,255]);
  const tint=luminance=>[255,161,0].map(channel=>Math.round(channel*luminance/255));
  assert.deepEqual(tint(255),[255,161,0]);
  assert.deepEqual(tint(178),[178,112,0]);
  const rows=[{id:'camera-date-group',label:'2026-09-25'},{id:'photo:HNI_0001',label:'HNI_0001'},{id:'photo:HNI_0002',label:'HNI_0002'}];
  const {okay,draws}=painted(rows,2);
  assert.equal(okay,true);
  const date=draws.find(draw=>draw.layout==='P_BrwsFld');
  assert.deepEqual(date.opts.bindings,[{name:'P_BrwsFld_PicL_Op',frame:0}]);
  assert.deepEqual(date.opts.overrides.TxtThmb,{text:'25/09\n2026',size:[49.92,40]});
  assert.deepEqual(date.source.materials.find(material=>material.name==='ThmbBase').constantColors[5],[255,161,0,255]);
  const folderRows=[{id:'folder:building',label:'Building'}];
  const folderView={appId:'camera',screen:'main',heading:'Nintendo 3DS Camera',rows:folderRows,selection:0,footer:{left:{action:'back',label:'Back'}},data:{folders:[{id:'building',photos:[{id:'a'}]}]}};
  const folderDraws=[];
  const renderer={packs:{'camera-gallery':pack,'camera-messages':{messages:{}}},draw(_c,_p,layout,opts){folderDraws.push({layout,opts});return true;},drawLayout(){return true;}};
  assert.equal(drawNativeCameraLower(renderer,{save(){},restore(){},beginPath(){},rect(){},clip(){}},folderView,{image:()=>false}),true);
  assert.deepEqual(folderDraws.find(draw=>draw.layout==='P_BrwsFld').opts.bindings.map(binding=>binding.name),['P_BrwsFld_Default','P_BrwsFld_PicL']);
});
