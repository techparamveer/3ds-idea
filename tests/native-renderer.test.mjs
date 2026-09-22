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
