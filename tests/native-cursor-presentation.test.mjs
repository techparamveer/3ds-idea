import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {poseNativeLayout} from '../src/os/native-layout.ts';
import {createPortfolioState} from '../src/os/system.ts';
import {advanceHomeCursorLoop,createHomeCursorLoop} from '../src/os/home-cursor-loop.ts';
import {advanceHomeNavigation,enterHomeFolder,getHomeNavigationView,setHomeDensity} from '../src/os/home-navigation.ts';

const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
async function loadPresentation(name,overrides={}){
 const url=new URL(`../src/os/${name}.ts`,import.meta.url);
 const {outputText}=ts.transpileModule(readFileSync(url,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
 // Resolve this browser entry's extensionless imports without changing its body.
 const resolved=outputText.replace(/(from\s*['"])(\.[^'"]+)(['"])/g,(_all,prefix,path,suffix)=>
  prefix+(overrides[path]??new URL(path.endsWith('.ts')?path:`${path}.ts`,url).href)+suffix);
 return import(moduleUrl(resolved));
}
// Asset loading is outside these caller/binding checks; use the real presenter
// with an injected draw endpoint, and the real screen painter with other surfaces
// stubbed. NativeLayoutRenderer's raster transport has its own focused tests.
const {createFirmwareHome}=await loadPresentation('firmware-presentation',{
 './native-renderer':moduleUrl('export class NativeLayoutRenderer {}'),
});
const {createScreens}=await loadPresentation('screens',{
 './native-chrome':moduleUrl('export const createNativeChrome=()=>({ready:Promise.resolve(),draw:()=>true,tile:()=>true});'),
 './portfolio-screens':moduleUrl('export const setPortfolioFont=()=>{};export const createPortfolioGraphics=()=>({ready:Promise.resolve(),selectedApp:()=>undefined,menuIcon(){},menuArtwork(){},overlay(){},dispose(){}});'),
 './firmware-presentation':moduleUrl('export const createFirmwareHome=assets=>assets.presenter;export const loadFirmwarePresentationAssets=()=>{throw Error("Unexpected asset load");};'),
});

test('native cursor submits the exact Loop frame while fractional Scale reaches CLAN sampling',()=>{
 const pane={kind:'pan1',name:'cursor',flags:1,origin:4,alpha:255,translation:[0,0,0],rotation:[0,0,0],scale:[1,1],size:[20,20],children:[]};
 const layout={canvas:{width:320,height:240,origin:1},roots:[pane],materials:[],textures:[],fonts:[],groups:[],unsupported:[]};
 const track=(property,end,from,to)=>({target:'cursor',binding:'pane',property,index:0,component:0,interpolation:'hermite',keys:[{frame:0,value:from,slope:1},{frame:end,value:to,slope:1}]});
 const clip=(frames,loop,tracks)=>({frames,loop,tracks,groups:[],textures:[],childBinding:false});
 const animations={LncCsr_00_Select:clip(6,false,[]),LncCsr_00_Scale:clip(6,false,[track('scale.x',5,1,6)]),LncCsr_00_Loop:clip(60,true,[track('translation.x',59,0,59)])};
 const draws=[],renderer={packs:{launcher:{animations}},draw(ctx,bank,name,options){draws.push({ctx,bank,name,options,pose:poseNativeLayout(layout,animations,options.bindings)});return true;}};
 const home=createFirmwareHome({renderer}),ctx={};
 for(const [loopFrame,pressed] of [[0,false],[1,true],[59,false],[19.375,true]]){
  assert.equal(home.cursor(ctx,10,20,40,2.5,loopFrame,pressed),true);
  const draw=draws.at(-1),frames=Object.fromEntries(draw.options.bindings.map(binding=>[binding.name,binding.frame]));
  assert.equal(draw.ctx,ctx);assert.equal(draw.bank,'launcher');assert.equal(draw.name,'LncCsr_00');
  assert.deepEqual(draw.options.center,[30,40]);
  assert.equal(frames.LncCsr_00_Loop,loopFrame);
  assert.equal(frames.LncCsr_00_Scale,2.5);
  assert.equal(frames.LncCsr_00_Select,pressed?5:0);
  assert.ok(Math.abs(draw.pose.roots[0].translation[0]-loopFrame)<1e-10);
  assert.equal(draw.pose.roots[0].scale[0],3.5);
 }
});

const resourcePack=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/home/launcher.json',import.meta.url)));
const walk=panes=>panes.flatMap(pane=>[pane,...walk(pane.children)]);
function cursorPresenter(){
 const draws=[],renderer={packs:{launcher:resourcePack},result:true,draw(ctx,bank,name,options){
  draws.push({ctx,bank,name,options,pose:poseNativeLayout(resourcePack.layouts[name],resourcePack.animations,options.bindings)});
  return this.result;
 }};
 return {home:createFirmwareHome({renderer}),renderer,draws};
}

test('center cursor preserves native toolbar Scale discontinuities, fractional frames and press groups',()=>{
 const {home,draws}=cursorPresenter(),ctx={},centers=[[26,16],[76,16.5],[118,16.5],[160,16.5],[202,16.5],[244,16.5],[281,16],[307,16]];
 const geometry={10:[[78,72],[69,64],.82],11:[[78,75],[69,66],.82],12:[[68,68],[66,66],.70]};
 for(const [focus,[x,y]]of centers.entries())for(const loopFrame of [0,17.25,59])for(const pressed of [false,true]){
  const scaleFrame=focus===0?10:focus>=6?12:11;
  assert.equal(home.cursorAt(ctx,x,y,scaleFrame,loopFrame,pressed),true);
  const draw=draws.at(-1),panes=Object.fromEntries(walk(draw.pose.roots).map(p=>[p.name,p]));
  assert.equal(draw.ctx,ctx);assert.equal(draw.bank,'launcher');assert.equal(draw.name,'LncCsr_00');
  assert.deepEqual(draw.options,{center:[x,y],bindings:[
   {name:'LncCsr_00_Select',frame:pressed?5:0},{name:'LncCsr_00_Scale',frame:scaleFrame},{name:'LncCsr_00_Loop',frame:loopFrame},
  ]});
  assert.deepEqual(panes.W_CsrF_00.size,geometry[scaleFrame][0]);
  assert.deepEqual(panes.W_CsrLgt_00.size,geometry[scaleFrame][1]);
  assert.deepEqual(panes.W_CsrF_00.scale,[Math.fround(.58),Math.fround(.58)]);
  assert.deepEqual(panes.W_CsrLgt_00.scale,[Math.fround(geometry[scaleFrame][2]),Math.fround(geometry[scaleFrame][2])]);
  assert.equal(panes.N_Scene_00.translation[1],pressed?-2:0,'Select binds only its native parent group');
  assert.ok([panes.W_CsrF_00,panes.W_CsrLgt_00].every(p=>p.translation[1]===0),'unrelated fixed Select tracks stay unbound');
 }
 home.cursorAt(ctx,76,16.5,9.999,17.25);
 const before=walk(draws.at(-1).pose.roots).find(p=>p.name==='W_CsrF_00');assert.deepEqual(before.size,[76,76]);
 home.cursorAt(ctx,118.25,16.5,2.375,19.375);
 assert.equal(draws.at(-1).options.bindings[1].frame,2.375);
 assert.equal(draws.at(-1).options.bindings[2].frame,19.375);
 assert.deepEqual(draws.at(-1).options.center,[118.25,16.5]);
 assert.equal(draws.at(-1).options.bindings[0].frame,0,'default press remains released');
});

test('effect painter uses exact applied Scale and DisAppear frames with native alpha at0/10/20',()=>{
 const {home,draws}=cursorPresenter(),ctx={};
 for(const scaleFrame of [2.375,10,11,12])for(const [disappearFrame,alpha]of [[0,120],[10,60+2.5*Math.fround(-15.6016)],[20,0]]){
  assert.equal(home.cursorEffectAt(ctx,281,16.5,scaleFrame,disappearFrame),true);
  const draw=draws.at(-1),pane=walk(draw.pose.roots).find(p=>p.name==='W_CsrEfct_00');
  assert.equal(draw.ctx,ctx);assert.equal(draw.bank,'launcher');assert.equal(draw.name,'LncCsrEfct_00');
  assert.deepEqual(draw.options,{center:[281,16.5],bindings:[
   {name:'LncCsrEfct_00_Scale',frame:scaleFrame},{name:'LncCsrEfct_00_DisAppear',frame:disappearFrame},
  ]});
  assert.equal(pane.alpha,alpha);
  if(scaleFrame>=10){
   assert.deepEqual(pane.size,scaleFrame===12?[66,66]:[72,69]);
   assert.deepEqual(pane.scale,Array(2).fill(Math.fround(scaleFrame===12?.70:.73)));
  }
 }
 home.cursorEffectAt(ctx,307,16,11,9.375);
 assert.equal(draws.at(-1).options.bindings[1].frame,9.375,'fractional supplied frames are not snapped');
});

test('cursor helpers are read-only, propagate renderer results and retain grid clamp compatibility',()=>{
 const {home,renderer,draws}=cursorPresenter(),ctx=Object.freeze({}),before=JSON.stringify(resourcePack);
 const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
 freeze(resourcePack);
 // Runtime deliberately retains different requested/current and applied values.
 // Only supplied applied frames reach these stateless painters.
 const retained=freeze({scale:{current:12,applied:10},loop:{current:18.25,applied:17.25},disappear:{current:0,applied:9}});
 for(const result of [true,false]){
  renderer.result=result;
  for(let paint=0;paint<3;paint++){
   assert.equal(home.cursorAt(ctx,26,16,retained.scale.applied,retained.loop.applied),result);
   assert.equal(home.cursorEffectAt(ctx,307,16,retained.scale.applied,retained.disappear.applied),result);
  }
  for(const [density,frame]of [[-3,0],[2.375,2.375],[12,5]]){
   assert.equal(home.cursor(ctx,10,20,40,density,19.375,true),result);
   const wrapper=draws.at(-1);assert.equal(home.cursorAt(ctx,30,40,frame,19.375,true),result);
   assert.deepEqual(wrapper.options,draws.at(-1).options);assert.deepEqual(wrapper.pose,draws.at(-1).pose);
  }
 }
 assert.deepEqual(draws[0].options,draws[2].options);assert.deepEqual(draws[1].options,draws[3].options);
 assert.equal(draws[1].options.bindings[1].frame,9,'painting does not apply a pending restart');
 assert.equal(JSON.stringify(resourcePack),before);
 assert.deepEqual(retained,{scale:{current:12,applied:10},loop:{current:18.25,applied:17.25},disappear:{current:0,applied:9}});
});

test('asset loader includes the existing cursor effect layout and shared texture',async()=>{
 const {loadFirmwarePresentationAssets}=await loadPresentation('firmware-presentation',{
  './bitmap-font':moduleUrl('export class BitmapFont {} export const loadBitmapFont=async()=>({dispose(){}});'),
  './native-renderer':moduleUrl('export class NativeLayoutRenderer {diagnostics=[];constructor(packs,textures){this.packs=packs;this.textures=textures;}dispose(){}}'),
 });
 const saved=new Map(['window','fetch'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 const fetched=[];let omitEffect=false;
 Object.assign(globalThis,{window:{location:{href:'https://fixture.invalid/'}},fetch:async url=>{
  const path=new URL(url).pathname;fetched.push(path);
  const bytes=readFileSync(new URL(`../public${path}`,import.meta.url));
  if(omitEffect&&path.endsWith('/launcher.json')){const data=JSON.parse(bytes);delete data.layouts.LncCsrEfct_00;return new Response(JSON.stringify(data));}
  return new Response(bytes);
 }});
 try{
  const assets=await loadFirmwarePresentationAssets();
  try{
   const pack=assets.renderer.packs.launcher;
   assert.deepEqual(pack.layouts.LncCsrEfct_00,resourcePack.layouts.LncCsrEfct_00);
   for(const name of ['Scale','DisAppear'])assert.deepEqual(pack.animations[`LncCsrEfct_00_${name}`],resourcePack.animations[`LncCsrEfct_00_${name}`]);
   for(const name of pack.layouts.LncCsrEfct_00.textures){
    const record=pack.textures[name],pixels=assets.renderer.textures.launcher.get(name);
    assert.deepEqual([pixels.width,pixels.height],[record.width,record.height]);
    assert.equal(fetched.filter(path=>path.endsWith('/'+record.url)).length,1,'shared texture decoded from one fetch');
   }
  }finally{assets.dispose();}
  omitEffect=true;await assert.rejects(loadFirmwarePresentationAssets(),/Missing native layout LncCsrEfct_00/);
 }finally{for(const [key,descriptor]of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}}
});

function canvas(){
 const surface={width:0,height:0},curves=[];
 const context=new Proxy({canvas:surface,globalAlpha:1,curves,
  createLinearGradient:()=>({addColorStop(){}}),quadraticCurveTo:(...args)=>curves.push(args),
  getImageData:(_x,_y,width,height)=>({width,height,data:new Uint8ClampedArray(width*height*4)}),
 },{get:(target,key)=>key in target?target[key]:(()=>{})});
 surface.getContext=()=>context;return surface;
}
async function withScreens(run,{nativeDrawn=true}={}){
 const saved=new Map(['document','Image','FontFace'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 Object.assign(globalThis,{
  document:{createElement:canvas,fonts:{add(){}}},
  Image:class{complete=false;naturalWidth=0;decode(){return Promise.resolve();}},
  FontFace:class{load(){return Promise.resolve(this);}},
 });
 const calls=[],presenter=new Proxy({pressOffset:0,
  cursor(...args){calls.push(args);return nativeDrawn;},
  folderChild(_ctx,_state,_empty,draw){draw(1);},
 },{get:(target,key)=>key in target?target[key]:(()=>true)});
 const screens=createScreens({firmwareAssets:{presenter,sharedFont:{draw(){}},dispose(){}}});
 try{await screens.ready;await run(screens,calls);}
 finally{
  screens.dispose();for(const [key,descriptor] of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}
 }
}
function retainedHome(){
 const state=createPortfolioState();
 return {...state,system:{...state.system,phase:'home',homeCursorLoop:advanceHomeCursorLoop(createHomeCursorLoop(),13,true)}};
}

test('screen paints sample retained phase read-only across elapsed time, density, reduced motion and capture',async()=>{
 await withScreens((screens,calls)=>{
  const state=advanceHomeNavigation(setHomeDensity(retainedHome(),3),7),before=JSON.stringify(state);
  const density=getHomeNavigationView(state).density;
  assert.equal(Number.isInteger(density),false,'fixture must exercise fractional density');
  for(const elapsed of [1000,1999,550000])screens.paint(state,new Date(0),elapsed);
  assert.deepEqual(calls.map(args=>args[5]),[12,12,12]);
  assert.ok(calls.every(args=>args[4]===density));
  screens.setReducedMotion(true);screens.paint(state,new Date(0),600000);
  screens.setReducedMotion(false);screens.paint(state,new Date(0),600001);
  assert.deepEqual(calls.slice(-2).map(args=>args[5]),[0,12]);
  assert.equal(JSON.stringify(state),before);
  screens.paint({...state,system:undefined},new Date(0),700000);
  assert.equal(calls.at(-1)[5],0,'legacy menu callers use frame0');

  const folder=enterHomeFolder({...retainedHome(),folders:{20:'A'}},20),folderBefore=JSON.stringify(folder);
  calls.length=0;screens.paint(folder,new Date(0),800000);screens.paint(folder,new Date(0),800001);
  assert.deepEqual(calls.map(args=>args[5]),[12,12]);
  assert.ok(calls.every(args=>args[0]===screens.bottom.getContext('2d')),'root capture must not paint another primary cursor');
  assert.equal(JSON.stringify(folder),folderBefore);
 });
});

test('fallback cursor retains elapsed-time animation when the native draw is unavailable',async()=>{
 await withScreens((screens,calls)=>{
  const state=retainedHome(),ctx=screens.bottom.getContext('2d');
  const paint=elapsed=>{ctx.curves.length=0;screens.paint(state,new Date(0),elapsed);return structuredClone(ctx.curves);};
  const first=paint(0),later=paint(220);
  assert.equal(first.length,4);assert.equal(later.length,4);assert.notDeepEqual(first,later);
  assert.deepEqual(calls.map(args=>args[5]),[12,12]);
  screens.setReducedMotion(true);assert.deepEqual(paint(0),paint(220));
 },{nativeDrawn:false});
});
