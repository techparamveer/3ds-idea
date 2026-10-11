import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const file=new URL('../src/os/native-renderer.ts',import.meta.url);
const source=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
 .replace(/(from\s*['"])(\.[^'"]+)(['"])/g,(_a,p,n,s)=>p+new URL(n.endsWith('.ts')?n:n+'.ts',file).href+s);
const {NativeLayoutRenderer}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const json=path=>JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/'+path,import.meta.url)));
const manifest=json('fonts/shared/font.json');
const finder=json('packs/camera/contents/0000-0000001a/lyt-P_Finder_U-arc-LZ.json');
const browser=json('packs/camera/contents/0000-0000001a/lyt-P_Brws_D-arc-LZ.json');
const find=(panes,name)=>{for(const pane of panes){if(pane.name===name)return pane;const child=find(pane.children,name);if(child)return child;}};

// Real renderer entry point and Camera pane/material data. Canvas and font ink
// are recorded substitutes: these checks cannot prove production pixel closure.
function fixture({layout,paneName,value,spans,direct}){
 const allocations=[],fontCalls=[];
 const canvas=()=>{
  const c={width:1,height:1},record={canvas:c,requests:[],reads:0,writes:0,blits:0,clears:0};
  const ctx={canvas:c,globalAlpha:1,globalCompositeOperation:'source-over',imageSmoothingEnabled:true,
   save(){},restore(){},translate(){},rotate(){},scale(){},beginPath(){},rect(){},clip(){},
   getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0}),
   clearRect(){record.clears++;},
   getImageData(x,y,w,h){record.reads++;return {width:w,height:h,data:new Uint8ClampedArray(w*h*4).fill(127)};},
   putImageData(){record.writes++;},drawImage(){record.blits++;}};
  c.getContext=(...args)=>{record.requests.push(args);return ctx;};
  allocations.push(record);return c;
 };
 const target=canvas(),ctx=target.getContext('2d');allocations.length=0;
 const prior=globalThis.document;globalThis.document={createElement:canvas};
 const pane=structuredClone(find(layout.roots,paneName));pane.children=[];pane.text.value=value;
 if(spans)pane.text.colorSpans=[{start:3,end:value.length,color:[255,50,0,255]}];
 const source={...layout,roots:[pane]};
 const font={manifest,drawNative(...args){fontCalls.push({ctx:args[0],value:args[1],size:[args[2],args[3]],phase:args[9],direct:args[10],range:args[12]});}};
 const renderer=new NativeLayoutRenderer({camera:{layouts:{main:source},animations:{}}},{camera:new Map()},new Map([['cbf_std.bcfnt',font]]));
 const options=direct?{textSampling:'lcd-source-size',textSamplingPanes:[paneName]}:{};
 return {allocations,fontCalls,renderer,pane,
  paint(){renderer.beginTextDiagnostic();assert.equal(renderer.draw(ctx,'camera','main',options),true,renderer.diagnostics.join('\n'));return renderer.endTextDiagnostic();},
  close(){renderer.dispose();globalThis.document=prior;}};
}

for(const scenario of [
 {name:'generic single run',layout:finder.layouts.P_FinderVS_U,paneName:'Txt_data2',value:'Photos:',direct:false,spans:false},
 {name:'generic color spans',layout:finder.layouts.P_FinderVS_U,paneName:'Txt_data2',value:'Photos:',direct:false,spans:true},
 {name:'direct Slideshow',layout:browser.layouts.P_BrwsMenu_D,paneName:'TxtSShow',value:'Slideshow',direct:true,spans:false},
 {name:'direct Settings',layout:browser.layouts.P_BrwsMenu_D,paneName:'TxtSet',value:'Settings',direct:true,spans:false},
 {name:'direct color spans',layout:browser.layouts.P_BrwsMenu_D,paneName:'TxtSShow',value:'Slideshow',direct:true,spans:true},
])test(`Camera ${scenario.name} preserves ink allocation, sampling and cached readback`,()=>{
 const f=fixture(scenario);
 try{
  const first=f.paint(),runs=scenario.spans?2:1;
  assert.equal(f.allocations.length,scenario.spans?2:1);
  for(const {requests} of f.allocations){
   assert.deepEqual(requests[0],['2d',scenario.direct?undefined:{willReadFrequently:true}],'the first request determines context attributes');
  }
  assert.equal(f.fontCalls.length,runs);
  for(const call of f.fontCalls){
   assert.equal(call.direct,scenario.direct);assert.equal(call.value,scenario.value);
   assert.deepEqual(call.size,scenario.direct?f.pane.size:f.pane.size.map(Math.ceil));
   assert.deepEqual(call.phase,[0,0]);assert.equal(call.ctx.imageSmoothingEnabled,true);
  }
  assert.deepEqual(f.fontCalls.map(call=>call.range),scenario.spans?[[0,3],[3,scenario.value.length]]:[undefined]);
  const output=f.allocations[0],ink=f.allocations.at(-1);
  assert.equal(ink.reads,runs);assert.equal(ink.writes,runs);
  assert.equal(output.blits,scenario.spans?runs:0);
  assert.equal(ink.clears,scenario.spans?runs:0);
  if(scenario.spans){assert.equal(output.reads,0);assert.equal(ink.canvas.width,0);assert.equal(ink.canvas.height,0);}
  const cacheBytes=output.canvas.width*output.canvas.height*4;
  assert.equal(f.renderer.cacheBytes,cacheBytes);
  assert.equal(first.hashCount,runs*2);assert.equal(first.draws[0].cache,'fill');
  const second=f.paint();
  assert.equal(second.draws[0].cache,'hit');assert.equal(second.draws[0].fill,first.draws[0].fill);
  assert.equal(second.hashCount,0);assert.equal(f.allocations.length,scenario.spans?2:1);
  assert.equal(f.fontCalls.length,runs);assert.equal(ink.reads,runs);assert.equal(ink.writes,runs);
  assert.equal(f.renderer.getFontManifest('cbf_std.bcfnt'),manifest,'the borrowed font identity stays unchanged');
  assert.equal(f.renderer.cacheBytes,cacheBytes);
  f.renderer.dispose();assert.equal(f.renderer.cacheBytes,0);
  assert.ok(f.allocations.every(({canvas})=>canvas.width===0&&canvas.height===0));
 }finally{f.close();}
});
