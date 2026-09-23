import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const module=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const layoutUrl=module(readFileSync(new URL('../src/os/native-layout.ts',import.meta.url),'utf8'));
const {NativeLayoutRenderer}=await import(module(readFileSync(new URL('../src/os/native-renderer.ts',import.meta.url),'utf8').replace("'./native-layout'",JSON.stringify(layoutUrl))));
// The target records actual raster bytes from the renderer's Canvas transport.
// Geometry/compositing fidelity is covered by source/native captures, not this stub.
function canvas(){
 const c={width:1,height:1};c.getContext=()=>ctx;
 const ctx={canvas:c,save(){},restore(){},translate(){},rotate(){},scale(){},beginPath(){},rect(){},clip(){},
  createImageData(w,h){return {width:w,height:h,data:new Uint8ClampedArray(w*h*4)};},
  putImageData(image){c.image=image;},drawImage(source){c.image=source.image;c.source=source;}};
 return c;
}
const pixels=rgb=>({width:1,height:1,data:new Uint8ClampedArray([...rgb,255])});
const white=Array.from({length:4},()=>[255,255,255,255]);
const material={name:'picture',bufferColor:[0,0,0,0],constantColors:[[255,255,255,255]],textureMaps:[{texture:0,wrapS:0,wrapT:0,minFilter:0,magFilter:0}],textureMatrices:[],coordinateGenerators:[],tevStages:[],unsupported:[]};
const pane={kind:'pic1',name:'picture',flags:1,origin:4,alpha:255,translation:[0,0,0],rotation:[0,0,0],scale:[1,1],size:[1,1],children:[],picture:{material:0,colors:white,uvSets:[]}};
const layout={canvas:{width:1,height:1,origin:1},roots:[pane],materials:[material],textures:['dynamic'],fonts:[],groups:[],unsupported:[]};

test('per-draw native texture bindings isolate glyphs and renames, restore the source, and reuse cached raster snapshots',()=>{
 const prior=globalThis.document;globalThis.document={createElement:canvas};
 try{
  const source=pixels([10,20,30]),first=pixels([255,255,255]),second=pixels([64,128,192]);
  const pack={schema:1,layouts:{test:layout},animations:{},textures:{},messages:{}},textures=new Map([['dynamic',source]]),original=JSON.stringify(pack);
  const renderer=new NativeLayoutRenderer({test:pack},{test:textures},new Map()),target=canvas(),ctx=target.getContext('2d');
  const paint=replacement=>{assert.equal(renderer.draw(ctx,'test','test',replacement?{textures:{dynamic:replacement}}:{}),true);return [...target.image.data];};
  assert.deepEqual(paint(first),[255,255,255,255]);const firstSurface=target.source;
  assert.deepEqual(paint(second),[64,128,192,255]);assert.notEqual(target.source,firstSurface);
  assert.deepEqual(paint(first),[255,255,255,255]);assert.equal(target.source,firstSurface);assert.equal(renderer.cacheBytes,8);
  assert.deepEqual(paint(),[10,20,30,255]);assert.equal(textures.get('dynamic'),source);assert.equal(JSON.stringify(pack),original);
  assert.equal(renderer.draw(ctx,'test','test',{textures:{dynamic:{...first,width:0}}}),false);assert.match(renderer.diagnostics.at(-1),/Invalid dynamic native texture/);
  renderer.dispose();assert.equal(renderer.cacheBytes,0);assert.equal(renderer.draw(ctx,'test','test'),false);assert.equal(firstSurface.width,0);
 }finally{globalThis.document=prior;}
});

test('native child layouts inherit parent alpha before TEV and restore it after nested draws or errors',()=>{
 const prior=globalThis.document;globalThis.document={createElement:canvas};
 try{
  const base={...pane,kind:'pan1',picture:undefined,flags:3,name:'outer',alpha:128,children:[{...pane,kind:'pan1',picture:undefined,flags:3,name:'inner',alpha:64}]};
  const parent={...layout,roots:[{...base,name:'root',flags:1,alpha:3,children:[base]}]};
  const pack={schema:1,layouts:{test:layout,parent},animations:{},textures:{},messages:{}};
  const renderer=new NativeLayoutRenderer({test:pack},{test:new Map([['dynamic',pixels([255,255,255])]])},new Map()),target=canvas(),ctx=target.getContext('2d');
  const draw=()=>{assert.equal(renderer.draw(ctx,'test','test'),true);return target.image.data[3];};
  const original=JSON.stringify(pack),alphas=[];
  renderer.withPaneParent(ctx,'test','parent','outer',[],alpha=>{alphas.push(alpha);assert.equal(draw(),128);
   renderer.withPaneParent(ctx,'test','parent','inner',[],inner=>{alphas.push(inner);assert.equal(draw(),16);});
   assert.equal(draw(),128);
  });
  assert.equal(draw(),255);assert.deepEqual(alphas,[128/255,(128/255)*(128/255)*(64/255)]);
  assert.throws(()=>renderer.withPaneParent(ctx,'test','parent','inner',[],()=>{throw new Error('test');}),/test/);
  assert.equal(draw(),255);assert.equal(JSON.stringify(pack),original);
  let invoked=false;assert.equal(renderer.withPaneParent(ctx,'test','parent','absent',[],()=>{invoked=true;}),false);assert.equal(invoked,false);
  renderer.dispose();
 }finally{globalThis.document=prior;}
});

test('real closing folder parents carry source shrink, separate blank alpha, and native origin transforms',()=>{
 const pack=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/home/launcher.json',import.meta.url)));
 const renderer=new NativeLayoutRenderer({launcher:pack},{launcher:new Map()},new Map());
 const ctx=canvas().getContext('2d'),calls=[];for(const name of ['translate','rotate','scale'])ctx[name]=(...values)=>calls.push([name,...values]);
 const before=JSON.stringify(pack.layouts.LncFolder_00),samples=[];
 for(const frame of [16,8,6,0]){
  const sample={frame};for(const name of ['N_Dlg_00','N_BlankAnime_00']){
   calls.length=0;assert.equal(renderer.withPaneParent(ctx,'launcher','LncFolder_00',name,[{name:'LncFolder_00_FadeIn',frame}],alpha=>{sample[name]={alpha,calls:[...calls]};}),true);
  }samples.push(sample);
 }
 assert.equal(samples[0].N_Dlg_00.alpha,1);assert.equal(samples[0].N_BlankAnime_00.alpha,1);
 assert.equal(samples[1].N_Dlg_00.alpha,.625);assert.ok(Math.abs(samples[1].N_BlankAnime_00.alpha-.145)<1e-7);
 assert.equal(samples[2].N_BlankAnime_00.alpha,0);assert.equal(samples[3].N_Dlg_00.alpha,0);
 for(const sample of samples)for(const value of [sample.N_Dlg_00,sample.N_BlankAnime_00]){
  assert.deepEqual(value.calls[0],['translate',160,120]);assert.deepEqual(value.calls.at(-1),['translate',-160,-120]);
 }
 assert.ok(samples[1].N_Dlg_00.calls.some(([name,x,y])=>name==='scale'&&Math.abs(x-.745)<1e-7&&Math.abs(y-.745)<1e-7));
 assert.equal(JSON.stringify(pack.layouts.LncFolder_00),before);renderer.dispose();
});
