import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import {poseNativeLayout,nativeTextureSamplePixels,rasterNativePicture} from '../src/os/native-layout.ts';
import {decodeNativePng} from '../src/os/native-png.ts';

const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
// The presenter imports the renderer with an extensionless path. Supply its
// transpiled module while retaining the actual presenter body and dependencies.
const rendererSource=readFileSync(new URL('../src/os/native-renderer.ts',import.meta.url),'utf8');
const rendererUrl=moduleUrl(ts.transpileModule(rendererSource.replace("'./native-layout'",JSON.stringify(new URL('../src/os/native-layout.ts',import.meta.url).href)),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
const {NativeLayoutRenderer}=await import(rendererUrl);
const presenterSource=readFileSync(new URL('../src/os/firmware-presentation.ts',import.meta.url),'utf8');
const presenterJs=ts.transpileModule(presenterSource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {createFirmwareHome}=await import(moduleUrl(presenterJs.replace(/(from\s*['"])(\.[^'"]+)(['"])/g,(_all,prefix,path,suffix)=>
 prefix+(path==='./native-renderer'?rendererUrl:new URL(`../src/os/${path.slice(2)}.ts`,import.meta.url).href)+suffix)));
const sourceName='LncIconSetSrc_00',finalAlpha=128/255;
const overrides={N_IconRoot_00:{visible:false},P_BtnShdw_00:{visible:false},N_Pic_01:{visible:false}};
const options=(x,y,size,density)=>({center:[x+size/2+32,y+size/2],bindings:[{name:sourceName+'_Scale',frame:density}],overrides});
const root=process.env.FIRMWARE_PRESENTATION_ASSETS??resolve('public/os/firmware/10.7.0-32E');
const packPath=resolve(root,'packs/home/launcher.json'),available=existsSync(packPath);
const pack=available?JSON.parse(readFileSync(packPath)):null;

function stateContext(){
 let state={globalAlpha:.65,globalCompositeOperation:'source-over',imageSmoothingEnabled:true},stack=[];
 return {
  get globalAlpha(){return state.globalAlpha;},set globalAlpha(v){state.globalAlpha=v;},
  get globalCompositeOperation(){return state.globalCompositeOperation;},set globalCompositeOperation(v){state.globalCompositeOperation=v;},
  get imageSmoothingEnabled(){return state.imageSmoothingEnabled;},set imageSmoothingEnabled(v){state.imageSmoothingEnabled=v;},
  save(){stack.push({...state});},restore(){assert.ok(stack.length);state=stack.pop();},
  snapshot(){return {...state,depth:stack.length};},
 };
}

test('empty applies native final opacity once, preserves fractional inputs, and restores Canvas on success/false/throw',()=>{
 const calls=[],renderer={packs:{launcher:{animations:{LncCsr_00_Select:{tracks:[]}}}},draw(ctx,bank,name,args){
  calls.push({alpha:ctx.globalAlpha,bank,name,args});ctx.imageSmoothingEnabled=false;ctx.globalCompositeOperation='copy';
  if(renderer.result instanceof Error)throw renderer.result;return renderer.result;
 },result:true};
 const home=createFirmwareHome({renderer}),ctx=stateContext();
 for(const result of [true,false,new Error('draw failed')]){
  renderer.result=result;const before=ctx.snapshot();
  if(result instanceof Error)assert.throws(()=>home.empty(ctx,12.25,27.75,37.5,2.375),/draw failed/);
  else assert.equal(home.empty(ctx,12.25,27.75,37.5,2.375),result);
  assert.deepEqual(ctx.snapshot(),before);
  assert.deepEqual(calls.at(-1),{alpha:.65*finalAlpha,bank:'launcher',name:sourceName,args:options(12.25,27.75,37.5,2.375)});
 }
 // Subsequent occupied/cursor/pickup draws receive the original caller alpha.
 renderer.draw=(context,_bank,name)=>{calls.push({name,alpha:context.globalAlpha});return true;};
 home.tile(ctx,1,2,40,2,false);home.tile(ctx,1,2,40,2,true);
 home.cursor(ctx,1,2,40,2,7.25);home.liftedSource(ctx,1,2,40,2);
 assert.deepEqual(calls.slice(-4).map(c=>[c.name,c.alpha]),[
  [sourceName,.65],['LncIconFolder_00',.65],['LncCsr_00',.65],['LncIconPickUpBlank_00',.65],
 ]);
});

function activePictures(layout){
 const result=[];
 function visit(panes,parent=1){for(const pane of panes){
  if(!(pane.flags&1))continue;const alpha=parent*pane.alpha/255;
  if(pane.size.every(n=>n>0)&&alpha>0){
   assert.equal(pane.text,undefined);assert.equal(pane.window,undefined);
   if(pane.picture)result.push({pane,alpha,material:layout.materials[pane.picture.material]});
  }
  visit(pane.children,pane.flags&2?alpha:parent);
 }}
 visit(layout.roots);return result;
}
function densitySamples(){
 const values=new Set([...Array.from({length:21},(_,i)=>i/4),Math.SQRT2,Math.PI]);
 for(const track of pack.animations[sourceName+'_Scale'].tracks.filter(t=>t.property==='visible')){
  assert.equal(track.interpolation,'step');
  for(const key of track.keys)if(key.frame>=0&&key.frame<=5)
   for(const delta of [-1e-7,0,1e-7])if(key.frame+delta>=0&&key.frame+delta<=5)values.add(key.frame+delta);
 }
 return [...values].sort((a,b)=>a-b);
}
test('actual SetSrc vacancy has one supported picture at density endpoints, fractions and visibility boundaries',{skip:!available},t=>{
 const before=JSON.stringify(pack),samples=densitySamples(),names=new Set();
 for(const frame of samples){
  const posed=poseNativeLayout(pack.layouts[sourceName],pack.animations,options(0,0,0,frame).bindings,overrides);
  const pictures=activePictures(posed);assert.equal(pictures.length,1,`density ${frame}`);
  const {pane,alpha,material}=pictures[0];names.add(pane.name);
  assert.match(pane.name,/^P_Blank_0[0-3]$/);assert.equal(alpha,1);
  assert.deepEqual(material.colorBlend,{operation:1,sourceFactor:4,destinationFactor:5,logic:0});
  assert.deepEqual(material.alphaCompare,{function:7,reference:0});
  assert.equal(material.alphaBlend,undefined);assert.deepEqual(material.unsupported,[]);
  assert.ok(pane.picture.colors.every(c=>c.every(v=>v===255)));
 }
 assert.deepEqual([...names],['P_Blank_00','P_Blank_01','P_Blank_02','P_Blank_03']);
 assert.equal(JSON.stringify(pack),before);t.diagnostic(`${samples.length} density samples; four mutually exclusive blank pictures`);
});

const canvasModule=process.env.NATIVE_CANVAS_MODULE?await import(pathToFileURL(resolve(process.env.NATIVE_CANVAS_MODULE)).href):null;
const createCanvas=canvasModule?.createCanvas??canvasModule?.default?.createCanvas;
async function textureFixture(){
 const pixels=new Map();
 for(const name of pack.layouts[sourceName].textures){
  const record=pack.textures[name];
  pixels.set(name,nativeTextureSamplePixels(await decodeNativePng(new Uint8Array(readFileSync(resolve(root,record.url))),record),record.picaFormat));
 }
 return pixels;
}
test('actual blank material leaves source RGB intact while inherited alpha remains independent',{skip:!available},async()=>{
 const textures=await textureFixture(),before=[...textures].map(([name,pixels])=>[name,pixels.data.slice()]);
 for(const density of [0,.375,1,1.375,2,2.375,3,3.375,4,4.375,5]){
  const posed=poseNativeLayout(pack.layouts[sourceName],pack.animations,options(0,0,0,density).bindings,overrides);
  const {pane}=activePictures(posed)[0],width=Math.ceil(pane.size[0]),height=Math.ceil(pane.size[1]);
  const source=rasterNativePicture(posed,pane.picture,width,height,textures,1);
  for(const alpha of [0,.145,.625,.865,1]){
   const inherited=rasterNativePicture(posed,pane.picture,width,height,textures,alpha);
   for(let i=0;i<source.data.length;i++)
    assert.equal(inherited.data[i],i%4===3?new Uint8ClampedArray([255*alpha])[0]:source.data[i],`density ${density} alpha ${alpha} byte ${i}`);
  }
 }
 for(const [name,bytes] of before)assert.deepEqual(textures.get(name).data,bytes);
});
function withDocument(run){
 const before=Object.getOwnPropertyDescriptor(globalThis,'document');
 globalThis.document={createElement:()=>createCanvas(1,1)};
 try{return run();}finally{if(before)Object.defineProperty(globalThis,'document',before);else delete globalThis.document;}
}
const image=canvas=>canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
function difference(a,b){let maximum=0,changed=0;for(let i=0;i<a.length;i++){const delta=Math.abs(a[i]-b[i]);maximum=Math.max(maximum,delta);if(delta)changed++;}return {maximum,changed};}
test('optional CPU Canvas: exact integer endpoint projection and measured fractional/inherited intermediate differences',{skip:!available||!createCanvas},async t=>{
 const textures=await textureFixture();
 withDocument(()=>{
  const renderer=new NativeLayoutRenderer({launcher:pack},{launcher:textures},new Map()),home=createFirmwareHome({renderer});
  const before=JSON.stringify(pack),results=[];
  try{
   for(const density of [0,.375,1,1.375,2,2.375,3,3.375,4,4.375,5])for(const closeFrame of [null,16,12,8,6,0])for(const offset of [0,.25]){
    const direct=createCanvas(320,240),group=createCanvas(320,240),source=createCanvas(320,240);
    for(const canvas of [direct,group]){const ctx=canvas.getContext('2d');ctx.fillStyle='rgb(223,219,215)';ctx.fillRect(0,0,320,240);}
    const directCtx=direct.getContext('2d'),sourceCtx=source.getContext('2d');
    const draw=(ctx,callback)=>{
     if(closeFrame===null)return callback();
     assert.equal(renderer.withPaneParent(ctx,'launcher','LncFolder_00','N_BlankAnime_00',[{name:'LncFolder_00_FadeIn',frame:closeFrame}],callback),true);
    };
    const x=100+offset,y=80+offset,size=40;
    draw(directCtx,()=>assert.equal(home.empty(directCtx,x,y,size,density),true));
    draw(sourceCtx,()=>assert.equal(renderer.draw(sourceCtx,'launcher',sourceName,options(x,y,size,density)),true));
    const groupCtx=group.getContext('2d');groupCtx.globalAlpha=finalAlpha;groupCtx.drawImage(source,0,0);
    const directBytes=image(direct),delta=difference(directBytes,image(group));
    assert.ok(directBytes.every((v,i)=>i%4!==3||v===255));
    assert.equal(directCtx.globalAlpha,1);assert.equal(sourceCtx.globalAlpha,1);
    // This full-screen transparent surface is a diagnostic, not the native
    // 64x128 atlas oracle. Only the ordinary integer endpoints are byte-exact.
    if(Number.isInteger(density)&&offset===0&&(closeFrame===null||closeFrame===16))assert.equal(delta.maximum,0);
    results.push({density,closeFrame,offset,...delta});
   }
   const statistics={cases:results.length,exact:results.filter(r=>r.maximum===0).length,
    maximumRgbByteDelta:Math.max(...results.map(r=>r.maximum)),maximumDifferingChannels:Math.max(...results.map(r=>r.changed)),
    byMaximum:[...new Set(results.map(r=>r.maximum))].sort().map(maximum=>({maximum,cases:results.filter(r=>r.maximum===maximum).length}))};
   if(process.env.NATIVE_EMPTY_SLOT_RESULTS)writeFileSync(resolve(process.env.NATIVE_EMPTY_SLOT_RESULTS),JSON.stringify({statistics,results},null,2)+'\n');
   t.diagnostic(JSON.stringify(statistics));
   assert.equal(JSON.stringify(pack),before);assert.deepEqual(renderer.diagnostics,[]);
  }finally{renderer.dispose();}
 });
});
