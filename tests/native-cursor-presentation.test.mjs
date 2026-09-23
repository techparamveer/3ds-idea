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
