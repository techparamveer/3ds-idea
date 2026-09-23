import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import {
 evaluateNativeMaterial, sampleNativeTexture, interpolateNativeQuad, transformNativeUV,
 rasterNativePicture, poseNativeLayout, nativeWindowPatches, nativeTextureSamplePixels, nativeWhite,
} from '../src/os/native-layout.ts';
import { decodeNativePng } from '../src/os/native-png.ts';

// Compose the preserved scalar helpers, independently of prepared selectors,
// scratch registers and raster internals. This is the d30da2e raster algorithm.
export function referenceRaster(layout,picture,width,height,textures,alpha=1,material=layout.materials[picture.material],sampling){
 if(!material)throw new Error(`Missing material ${picture.material}`);
 const sources=material.textureMaps.map(map=>{
  const name=layout.textures[map.texture],pixels=textures.get(name);
  if(!pixels)throw new Error(`Missing native texture ${name}`);return pixels;
 });
 const data=new Uint8ClampedArray(width*height*4),colors=picture.colors.flat();
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const u=(x+(sampling?.x??0)+.5)/(sampling?.fullWidth??width),v=(y+(sampling?.y??0)+.5)/(sampling?.fullHeight??height);
  const primary=interpolateNativeQuad(colors,u,v,4).map(c=>c/255);primary[3]*=alpha;
  const samples=material.textureMaps.map((map,index)=>{
   const generator=material.coordinateGenerators[index];
   if(generator&&(generator.type!==0||generator.source>2))throw new Error(`Unsupported coordinate generator ${generator.type}/${generator.source}`);
   const uv=transformNativeUV(interpolateNativeQuad(picture.uvSets[generator?.source??index]??[0,0,1,0,0,1,1,1],u,v),material.textureMatrices[index]);
   return sampleNativeTexture(sources[index],uv[0],uv[1],map.wrapS,map.wrapT,map.magFilter!==0);
  });
  data.set(evaluateNativeMaterial(material,samples,primary).map(c=>Math.round(c*255)),(y*width+x)*4);
 }
 return {width,height,data};
}
function identical(args,label='raster'){
 const actual=rasterNativePicture(...args),expected=referenceRaster(...args);
 assert.equal(actual.width,expected.width);assert.equal(actual.height,expected.height);
 assert.deepEqual(actual.data,expected.data,label);return actual;
}
const combiner=(mode=0,sources=[0,1,2],operands=[0,0,0],scale=1,savePrevious=false)=>({mode,sources,operands,scale,savePrevious});
const stage=(color=combiner(),alpha=combiner(),constantSelectors=0x21)=>({color,alpha,constantSelectors});
const material=()=>({name:'test',bufferColor:[33,199,57,129],constantColors:[[209,127,15,240],[76,101,244,83],[151,62,189,137],[12,249,77,3],[128,0,255,171],[255,49,126,44]],textureOnly:false,textureMaps:[],textureMatrices:[],coordinateGenerators:[],tevStages:[],unsupported:[]});
const picture=()=>({material:0,colors:[[17,129,255,64],[254,89,91,222],[111,200,23,143],[77,231,198,255]],uvSets:[]});
function fixture(count=4){
 const m=material(),l={materials:[m],textures:[],roots:[],groups:[],fonts:[],unsupported:[],canvas:{width:320,height:240,origin:1}},textures=new Map();
 for(let i=0;i<count;i++){
  const name=`texture${i}`,width=3+i,height=2+i,data=Uint8ClampedArray.from({length:width*height*4},(_,k)=>(k*73+i*47+(k%4===3?51:0))%256);
  l.textures.push(name);textures.set(name,{width,height,data});m.textureMaps.push({texture:i,wrapS:i%3,wrapT:(i+1)%3,minFilter:0,magFilter:i%2});
 }
 return {m,l,textures,p:picture()};
}

test('all TEV modes, sources, RGB/alpha operands, complements and scales match scalar byte results',()=>{
 const {m,l,textures,p}=fixture();
 for(let mode=0;mode<8;mode++)for(let source=0;source<8;source++)for(let operand=0;operand<10;operand++){
  const scale=[.5,1,2,4][(mode+source+operand)%4];
  m.tevStages=[stage(combiner(mode,[source,(source+3)%8,(source+6)%8],[operand,(operand+3)%10,(operand+7)%10],scale),
   combiner(mode,[source,(source+2)%8,(source+5)%8],[operand%8,(operand+3)%8,(operand+5)%8],scale))];
  identical([l,p,7,5,textures,.731],`mode${mode}/source${source}/operand${operand}`);
 }
});
test('implicit material, missing texture slots, constants and half-byte Math.round boundaries',()=>{
 for(const count of [0,1,2,3,4,5]){
  const {m,l,textures,p}=fixture(count);
  for(const alpha of [0,.5/255,.5,128/255,.9999999999999999,1]){
   identical([l,p,11,9,textures,alpha],`implicit ${count}/${alpha}`);
   m.tevStages=[stage(combiner(4,[0,3,5]),combiner(1,[3,5,0]))];
   identical([l,p,11,9,textures,alpha],`explicit ${count}/${alpha}`);m.tevStages=[];
  }
  m.constantColors=[];identical([l,p,11,9,textures]);
 }
 const {m,l,textures,p}=fixture(0);p.colors=nativeWhite;m.bufferColor=[0,0,0,0];m.constantColors=[];
 for(const n of [0,1,63,127,128,254])for(const delta of [-Number.EPSILON,0,Number.EPSILON]){
  const alpha=(n+.5)/255+delta;
  const output=identical([l,p,1,1,textures,alpha]);assert.equal(output.data[3],Math.round(alpha*255));
 }
});
test('delayed feedback capture, independently selected constant channels and staged saturation',()=>{
 const {m,l,textures,p}=fixture();
 for(let rgb=0;rgb<=6;rgb++)for(let a=0;a<=6;a++)for(let save=0;save<4;save++){
  m.tevStages=[
   stage(combiner(3,[4,5,0],[3,0,0],2,!!(save&1)),combiner(5,[4,5,1],[2,0,0],4,!!(save&2)),rgb|(a<<4)),
   stage(combiner(6,[6,7,5],[0,0,0],2,true),combiner(7,[6,7,5],[0,0,0],.5,true)),
   stage(combiner(4,[7,6,4]),combiner(4,[7,6,4])),
  ];
  identical([l,p,9,7,textures,.635],`constant${rgb}/${a}/save${save}`);
 }
 // Distinguish capture of preceding output from capture of this stage's result.
 m.tevStages=[stage(combiner(0,[4,4,4]),combiner(0,[4,4,4]),0x11),
  stage(combiner(0,[0,0,0],[0,0,0],1,true),combiner(0,[0,0,0],[0,0,0],1,true)),
  stage(combiner(0,[7,7,7]),combiner(0,[7,7,7]))];
 const out=identical([l,p,1,1,textures]);assert.deepEqual([...out.data],m.constantColors[0]);
});
test('all alpha comparisons retain RGB and use exact unquantized result alpha',()=>{
 const {m,l,textures,p}=fixture(0);m.constantColors[0]=[17,33,199,128];p.colors=nativeWhite;m.bufferColor=[0,0,0,0];
 for(let fn=0;fn<=8;fn++)for(const ref of [0,128/255-Number.EPSILON,128/255,128/255+Number.EPSILON,1]){
  m.alphaCompare={function:fn,reference:ref};const out=identical([l,p,1,1,textures]);assert.deepEqual([...out.data.slice(0,3)],[17,33,199]);
 }
});
test('wrap/filter neighbors, flipped/multi-set UVs, matrix trig and cropped sampling preserve operation order',()=>{
 const {m,l,textures,p}=fixture(3);
 p.uvSets=[[-1.25,-.25,2.75,-.25,-1.25,3.25,2.75,3.25],[1,.5,-1.5,1,2,-2,-.25,-1],[.125,.25,.125,.25,.125,.25,.125,.25]];
 m.coordinateGenerators=[{type:0,source:2},{type:0,source:0},{type:0,source:1}];
 m.tevStages=[stage(combiner(4,[0,1,2]),combiner(4,[0,1,2]))];
 for(let s=0;s<3;s++)for(let t=0;t<3;t++)for(const linear of [0,1])for(const rotation of [0,90,-90,33.3333,359.99999]){
  m.textureMaps.forEach(map=>Object.assign(map,{wrapS:s,wrapT:t,magFilter:linear,minFilter:1-linear}));
  m.textureMatrices=[{translation:[.33,-1.1],scale:[-2.1,.17],rotation},
   {translation:[1/3,0],scale:[0,2],rotation:-rotation}];
  identical([l,p,17,13,textures,.833],`wrap${s}/${t}/linear${linear}/angle${rotation}`);
  const crop={x:3,y:2,fullWidth:17,fullHeight:13},output=identical([l,p,7,5,textures,.833,m,crop]);
  const full=rasterNativePicture(l,p,17,13,textures,.833);
  for(let y=0;y<5;y++)assert.deepEqual(output.data.subarray(y*28,(y+1)*28),full.data.subarray(((y+2)*17+3)*4,((y+2)*17+10)*4));
 }
});
test('adversarial seeded multistage rasters preserve constant/buffer state across every pixel',()=>{
 let seed=0x3d5107;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/0x100000000;},int=n=>Math.floor(random()*n);
 for(let run=0;run<250;run++){
  const {m,l,textures,p}=fixture(int(5));
  m.bufferColor=Array.from({length:4},()=>int(256));m.constantColors=Array.from({length:6},()=>Array.from({length:4},()=>int(256)));
  p.colors=Array.from({length:4},()=>Array.from({length:4},()=>random()*255));p.uvSets=Array.from({length:3},()=>Array.from({length:8},()=>random()*6-3));
  m.textureMatrices=m.textureMaps.map(()=>({translation:[random()-1,random()+1],scale:[random()*3-2,random()*3-2],rotation:random()*720-360}));
  const c=alpha=>combiner(int(8),Array.from({length:3},()=>int(8)),Array.from({length:3},()=>int(alpha?8:10)),[.5,1,2,4][int(4)],!!int(2));
  m.tevStages=Array.from({length:1+int(6)},()=>stage(c(false),c(true),int(7)|(int(7)<<4)));
  m.alphaCompare={function:int(8),reference:random()};
  identical([l,p,13,11,textures,random(),m,{x:7,y:3,fullWidth:31,fullHeight:27}],`seeded case${run}`);
 }
});
test('unsupported material inputs still fail explicitly, including unused TEV arguments',()=>{
 const {m,l,textures,p}=fixture(1);
 for(const [change,pattern] of [
  [()=>{m.coordinateGenerators=[{type:1,source:0}];},/Unsupported coordinate generator/],
  [()=>{m.coordinateGenerators=[{type:0,source:3}];},/Unsupported coordinate generator/],
  [()=>{m.tevStages=[stage(combiner(0,[0,0,8]))];},/Unsupported native TEV source/],
  [()=>{m.tevStages=[stage(combiner(0,[0,0,0],[0,0,10]))];},/Unsupported native TEV operand/],
  [()=>{m.tevStages=[stage(combiner(),combiner(0,[0],[8]))];},/Unsupported native TEV operand/],
  [()=>{m.tevStages=[stage(combiner(8))];},/Unsupported native TEV mode/],
  [()=>{m.tevStages=[stage(combiner(0,[0,4,0]),combiner(),0x0f)];},/Unsupported native TEV constant selector/],
 ]){
  m.coordinateGenerators=[];m.tevStages=[];change();
  assert.throws(()=>rasterNativePicture(l,p,1,1,textures),pattern);assert.throws(()=>referenceRaster(l,p,1,1,textures),pattern);
 }
 m.coordinateGenerators=[];m.tevStages=[stage(combiner(),combiner(),0xff)]; // Unreferenced invalid selector is inert.
 identical([l,p,3,2,textures]);identical([l,p,0,0,textures]);
 assert.throws(()=>rasterNativePicture(l,{...p,material:99},1,1,textures),/Missing material/);
 assert.throws(()=>rasterNativePicture(l,p,1,1,new Map()),/Missing native texture/);
});

const resourceRoot=process.env.FIRMWARE_PRESENTATION_ASSETS??resolve('public/os/firmware/10.7.0-32E');
let realPromise;
function resources(){
 return realPromise??=(async()=>{
  // Missing delivery resources fail this acceptance test instead of silently skipping it.
  const pack=JSON.parse(readFileSync(resolve(resourceRoot,'packs/home/launcher.json'))),textures=new Map();
  const names=new Set(['LncCsr_00','LncFolder_00','LncFolderCapture_00','LncBase_U_00','LncIconFolder_00'].flatMap(name=>pack.layouts[name].textures));
  for(const name of names){const record=pack.textures[name];textures.set(name,nativeTextureSamplePixels(await decodeNativePng(readFileSync(resolve(resourceRoot,record.url)),record),record.picaFormat));}
  return {pack,textures};
 })();
}
const flatten=panes=>panes.flatMap(p=>[p,...flatten(p.children)]);
function patches(layout,textures){
 return flatten(layout.roots).flatMap(p=>p.picture?[{pane:p,picture:p.picture,width:p.size[0],height:p.size[1]}]:p.window?nativeWindowPatches(p,layout,textures).map(patch=>({...patch,pane:p})):[]).filter(p=>p.width>0&&p.height>0);
}
function argsFor(l,p,textures,alpha=1,crop=false){
 const fullWidth=Math.ceil(p.width),fullHeight=Math.ceil(p.height),width=crop?Math.min(fullWidth,19):fullWidth,height=crop?Math.min(fullHeight,13):fullHeight;
 return [l,p.picture,width,height,textures,alpha,p.material??l.materials[p.picture.material],crop?{x:Math.floor((fullWidth-width)/2),y:Math.floor((fullHeight-height)/2),fullWidth,fullHeight}:undefined];
}
test('real decoded cursor windows match at integer/fractional loop phases, all densities, alpha and crops',async t=>{
 const {pack,textures}=await resources();let count=0,bytes=0;
 for(const density of [0,1,2,3,4,5])for(const frame of [0,.001,.5,1,4,4.25,15.5,30,39.999,40,44,44.125,59,59.999,60]){
  const l=poseNativeLayout(pack.layouts.LncCsr_00,pack.animations,[{name:'LncCsr_00_Scale',frame:density},{name:'LncCsr_00_Loop',frame}]);
  for(const p of patches(l,textures))for(const crop of [false,true]){
   const alpha=(p.pane.alpha/255)*(crop ? .371 : 1),args=argsFor(l,p,textures,alpha,crop);
   bytes+=identical(args,`cursor ${p.pane.name}/${density}/${frame}/crop${crop}`).data.length;count++;
  }
 }
 t.diagnostic(`${count} real cursor rasters; ${bytes} RGBA bytes identical`);
});
test('real one/four-frame windows, capture UV1, shadows and upper-base materials match exact bytes',async t=>{
 const {pack,textures}=await resources();let count=0,bytes=0;
 for(const [name,clip,frames] of [['LncFolder_00','FadeIn',[0,6,8.25,16]],['LncFolderCapture_00','Fade',[0,3.5,8]],['LncBase_U_00','WhiteBlack',[0,1]],['LncIconFolder_00','Scale',[0,2.5,4]]]){
  for(const frame of frames){
   const l=poseNativeLayout(pack.layouts[name],pack.animations,[{name:`${name}_${clip}`,frame}]);
   for(const p of patches(l,textures))for(const crop of [false,true]){
    const args=argsFor(l,p,textures,(p.pane.alpha/255)*(crop ? .527 : 1),crop);
    bytes+=identical(args,`${name}/${p.pane.name}/${frame}/crop${crop}`).data.length;count++;
   }
  }
 }
 // Capture replacement contains independent RGB under zero alpha, as real decoded PNGs do.
 const capture=poseNativeLayout(pack.layouts.LncFolderCapture_00,pack.animations,[{name:'LncFolderCapture_00_Fade',frame:4.375}]);
 const dynamic=new Map(textures),data=Uint8ClampedArray.from({length:320*206*4},(_,i)=>i%4===3?(i%7?255:0):(i*73)%256);
 dynamic.set('IconDmy.bclim',{width:320,height:206,data});
 for(const p of patches(capture,dynamic))identical(argsFor(capture,p,dynamic,.612,true),'dynamic capture');
 t.diagnostic(`${count} real window/capture/shadow rasters; ${bytes} RGBA bytes identical`);
});

if(process.env.NATIVE_RASTER_BENCHMARK)test('CPU benchmark (local cold-raster evidence, no Canvas or browser)',async t=>{
 const {pack,textures}=await resources(),cases=[];
 for(const frame of [0,.5,4.25,15.5,30,39.999,44.125,59.999]){
  const l=poseNativeLayout(pack.layouts.LncCsr_00,pack.animations,[{name:'LncCsr_00_Scale',frame:1},{name:'LncCsr_00_Loop',frame}]);
  for(const p of patches(l,textures))cases.push(argsFor(l,p,textures,p.pane.alpha/255));
 }
 const run=fn=>{let checksum=0;const start=performance.now();for(const args of cases){const out=fn(...args);for(let i=0;i<out.data.length;i+=37)checksum=(Math.imul(checksum,31)+out.data[i])>>>0;}return {ms:performance.now()-start,checksum};};
 const coldPrepared=run(rasterNativePicture),coldReference=run(referenceRaster),rounds=[];
 for(let i=0;i<7;i++)rounds.push(i%2?{reference:run(referenceRaster),prepared:run(rasterNativePicture)}:{prepared:run(rasterNativePicture),reference:run(referenceRaster)});
 for(const round of rounds)assert.equal(round.reference.checksum,round.prepared.checksum);
 assert.equal(coldReference.checksum,coldPrepared.checksum);
 const median=key=>rounds.map(r=>r[key].ms).sort((a,b)=>a-b)[3];
 t.diagnostic(JSON.stringify({node:process.version,platform:process.platform,arch:process.arch,rasters:cases.length,pixels:cases.reduce((n,a)=>n+a[2]*a[3],0),coldPrepared,coldReference,medianPreparedMs:median('prepared'),medianReferenceMs:median('reference'),speedup:median('reference')/median('prepared'),rounds}));
});
