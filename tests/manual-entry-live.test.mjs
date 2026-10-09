import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { createPortfolioState, tickSystem, launchHomeShortcut, reduceSystem, invokeSystemApplet } from '../src/os/system.ts';
import { manualEntryIdentity, manualEntryOrigin, manualEntryBackingMatches } from '../src/os/manual-entry-identity.ts';
import { escapeUnreadyNativeScreen } from '../src/os/native-screen-system.ts';
import { createNativeScreenInputGate } from '../src/os/native-screen-input.ts';

const data=source=>'data:text/javascript;base64,'+Buffer.from(source+'\n//# sourceURL=manual-entry-live-fixture.js').toString('base64');
const sourceUrl=new URL('../src/os/screens.ts',import.meta.url);
const overrides={
 './native-system-presentation':data('export const drawNativeSystemOverlay=()=>false;'),
 './home-suspended-window':data(`export {homeSuspendedApplication,homeSuspendedIconDisappeared,homeSuspendedWindowEntryFrame,retainedSuspendedApplication,selectedSuspendedApplication} from '${new URL('../src/os/home-suspended-window.ts',import.meta.url).href}';export const drawHomeSuspendedWindow=()=>true;`),
 './native-chrome':data('export const createNativeChrome=()=>({ready:Promise.resolve(),draw:()=>true,tile:()=>true});'),
 './home-native-layouts':data('export const createHomeLayoutManager=()=>({});'),
 './firmware-presentation':data('export const createFirmwareHome=a=>a.presenter;export const loadFirmwarePresentationAssets=()=>{};'),
 './portfolio-screens':data('export const setPortfolioFont=()=>{};export const createPortfolioGraphics=()=>globalThis.__manualGraphics;'),
};
const {outputText}=ts.transpileModule(readFileSync(sourceUrl,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const {createScreens}=await import(data(outputText.replace(/(from\s*['"])(\.[^'"]+)(['"])/g,(_all,prefix,path,suffix)=>prefix+(overrides[path]??new URL(path.endsWith('.ts')?path:`${path}.ts`,sourceUrl).href)+suffix)));
const camera=()=>tickSystem(launchHomeShortcut(tickSystem(createPortfolioState(),3001),'camera',3010),6200);
const cameraHome=()=>reduceSystem(camera(),'home',6300);
const manual=state=>invokeSystemApplet(state,'manual',6400,{manualTitleId:'0004001000022400'});
const ms=step=>10000+step*1000/60+.01;

async function fixture(run,{measurePaint=true}={}){
 const saved=new Map(['document','Image','FontFace','__manualGraphics'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 const events=[],canvases=[];let status='ready',coverFailure=false;
 function canvas(){
  const surface={width:0,height:0};
  const ctx=new Proxy({canvas:surface,globalAlpha:1,record(name,args=[]){events.push({name,args,ctx});},drawImage(...args){ctx.record('drawImage',args);},createLinearGradient:()=>({addColorStop(){}}),getImageData(_x,_y,w,h){return {width:w,height:h,data:new Uint8ClampedArray(w*h*4)};}},{get:(target,key)=>key in target?target[key]:(()=>{})});
  surface.getContext=()=>ctx;canvases.push(surface);return surface;
 }
 Object.assign(globalThis,{document:{createElement:canvas,fonts:{add(){}}},Image:class {decode(){return Promise.resolve();}},FontFace:class {load(){return Promise.resolve(this);}},__manualGraphics:{ready:Promise.resolve(),selectedApp(){},syncStockView(){},readSuspendedCapture(runtime){return {status:'ready',owner:runtime.application,generation:1};},stockStatus:()=>status,stockFailure:()=>status==='error'?Error('Manual destination failed'):null,retryStockScreen(){status='ready';return true;},banner(){},menuIcon(){},menuArtwork(){},overlay(t,b){t.record('destination-upper');b.record('destination-lower');},dispose(){}}});
 const presenter=new Proxy({pressOffset:0,tilePressOffset:()=>0,folderChild(_ctx,_state,_empty,draw){draw(1);return true;},manualEntry(t,b,pose){t.record('cover-upper',[pose]);b.record('cover-lower',[pose]);return !coverFailure;}},{get:(target,key)=>key in target?target[key]:()=>true});
 const screens=createScreens({measurePaint,firmwareAssets:{presenter,sharedFont:{draw(){}},dispose(){},diagnostics:[],titleIcons:new Map([['0004001000022400',{}]]),titleDescriptions:new Map([['0004001000022400','Nintendo 3DS Camera']])},drawHomeBackground:()=>true,drawSuspendedBackground:()=>true});
 const paint=(state,step,receipt=true,verification)=>{
  events.length=0;const result=screens.paint(state,new Date(0),ms(step),verification);
  if(receipt)screens.presentManualEntry(state,ms(step));return result;
 };
 try{await screens.ready;await run({screens,paint,events,canvases,setStatus:value=>status=value,failCover:value=>coverFailure=value,presenter});}
 finally{screens.dispose();for(const [key,descriptor]of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}}
}

test('paint timing is opt-in, returned by value and cleared on disposal',async()=>{
 for(const measurePaint of [false,true])await fixture(({screens,paint})=>{
  assert.equal(screens.paintTiming(),null);
  paint(cameraHome(),0);
  const timing=screens.paintTiming();
  if(measurePaint){
   assert.ok(Number.isFinite(timing.startedAt)&&timing.overlayMs>=0);
   timing.overlayMs=-1;assert.ok(screens.paintTiming().overlayMs>=0);
  }else assert.equal(timing,null);
  screens.dispose();assert.equal(screens.paintTiming(),null);
 },{measurePaint});
});

test('Manual requires a matching WebGL-presented caller pair, not an offscreen paint',async()=>{
 await fixture(({screens,paint})=>{
  const home=cameraHome(),state=manual(home);paint(home,0,false);paint(state,1);
  assert.equal(screens.stockStatus(state),'error');assert.match(String(screens.stockFailure()),/matching presented caller pair/);
  paint(home,2);paint(state,3,false);assert.equal(screens.stockStatus(state),'loading',String(screens.stockFailure()));
  assert.equal(screens.presentManualEntry(state,ms(3)),true);assert.equal(screens.stockStatus(state),'loading');
 });
});

test('live Manual preserves every pose, holds an acknowledged opaque pair and gates input until reveal receipt',async()=>{
 await fixture(({screens,paint,setStatus,events})=>{
  const home=cameraHome(),state=manual(home);paint(home,0);setStatus('loading');
  for(let frame=0;frame<=20;frame++){const result=paint(state,frame+1);assert.ok(result,String(screens.stockFailure()));assert.deepEqual(result.manualEntry,{phase:'out',frame,owner:state.system.runtime.active});assert.equal(screens.stockStatus(state),'loading');}
  assert.equal(screens.manualEntryActive(state),false);assert.equal(paint(state,22).manualEntry.frame,20);
  const timing=screens.paintTiming();assert.ok(timing&&Number.isFinite(timing.startedAt)&&Number.isFinite(timing.overlayMs),'paint timing diagnostic');
  setStatus('ready');
  for(let frame=0;frame<=20;frame++){
   const step=23+frame,result=paint(state,step,false);assert.deepEqual([result.manualEntry.phase,result.manualEntry.frame],['in',frame]);
   assert.equal(screens.stockStatus(state),'loading');assert.equal(events.filter(e=>e.name.startsWith('cover-')).length,2);
   assert.equal(screens.presentManualEntry(state,ms(step)),true);
  }
  assert.equal(screens.stockStatus(state),'ready');assert.equal(screens.manualEntryActive(state),false);assert.equal(paint(state,44),undefined);
 });
});

test('loading entry quarantines actions and preserves B, HOME and power escapes through the existing gate',async()=>{
 await fixture(({screens,paint})=>{
  const home=cameraHome(),state=manual(home);paint(home,0);paint(state,1);
  const gate=createNativeScreenInputGate(),status=screens.stockStatus(state);
  for(const event of [{type:'command',command:'open'},{type:'action',id:'manual-section:1'},{type:'touch',phase:'down',x:100,y:80,pointerId:1}])assert.equal(gate(event,status),'block');
  for(const command of ['back','home'])assert.equal(gate({type:'command',command},status),'home');
  assert.equal(gate({type:'command',command:'power'},status),'pass');
  const escaped=escapeUnreadyNativeScreen(state,6500);assert.equal(escaped.system.phase,'home');assert.equal(escaped.system.runtime.application,home.system.runtime.application);
  assert.equal(escaped.system.runtime.instances[state.system.runtime.active],undefined);
 });
});

test('sleep, power-off and firmware replacement revoke unpresented poses and reject stale caller backing',async()=>{
 await fixture(({screens,paint,presenter})=>{
  const home=cameraHome(),state=manual(home);paint(home,0);paint(state,1);paint(state,2);
  const asleep={...state,system:{...state.system,sleeping:true}};paint(asleep,3,false);
  assert.equal(screens.presentManualEntry(asleep,ms(3)),false);assert.equal(paint(state,4).manualEntry.frame,1);
  screens.setFirmwareAssets({presenter,sharedFont:{draw(){}},dispose(){},diagnostics:[],titleIcons:new Map([['0004001000022400',{}]]),titleDescriptions:new Map([['0004001000022400','Nintendo 3DS Camera']])});paint(state,5);
  assert.equal(screens.stockStatus(state),'error');assert.match(String(screens.stockFailure()),/matching presented caller pair/);
  paint(home,6);paint(state,7);assert.equal(screens.stockStatus(state),'loading');
  paint({...state,powered:false},8,false);paint(state,9);
  assert.equal(screens.stockStatus(state),'error');assert.match(String(screens.stockFailure()),/matching presented caller pair/);
 });
});

test('HOME suspension discards an unpresented Manual pose and rebases the retained owner on resume',async()=>{
 await fixture(({screens,paint})=>{
  const caller=camera(),state=manual(caller);paint(caller,0);paint(state,1);paint(state,2);
  assert.equal(paint(state,3,false).manualEntry.frame,2);
  const suspended=reduceSystem(state,'home',6500);paint(suspended,4);
  assert.equal(screens.presentManualEntry(state,ms(5)),false);
  const resumed=reduceSystem(suspended,'home',6600);assert.equal(resumed.system.runtime.active,state.system.runtime.active);
  assert.equal(paint(resumed,6).manualEntry.frame,1);assert.equal(paint(resumed,7).manualEntry.frame,2);
 });
});

test('cover refusal, diagnostic capture, monotonic Retry and context revocation rebase the last visible pose',async()=>{
 await fixture(({screens,paint,failCover})=>{
  const home=cameraHome(),state=manual(home);paint(home,0);paint(state,1);paint(state,2);
  assert.equal(paint(state,3,false).manualEntry.frame,2);screens.revokeManualEntryCandidate();
  assert.equal(screens.presentManualEntry(state,ms(4)),false);assert.equal(paint(state,4).manualEntry.frame,1);
  failCover(true);assert.equal(paint(state,5),undefined);assert.equal(screens.stockStatus(state),'error');assert.equal(screens.manualEntryActive(state),false);
  failCover(false);assert.equal(screens.retryStockScreen(),true);assert.equal(paint(state,6).manualEntry.frame,1);assert.equal(paint(state,7).manualEntry.frame,2);
  screens.paint(state,new Date(0),ms(8),{sampleCalendar:true});assert.equal(screens.presentManualEntry(state,ms(8)),false);assert.equal(paint(state,9).manualEntry.frame,2);
  assert.equal(paint(state,500).manualEntry.frame,2);assert.equal(paint(state,501).manualEntry.frame,3);
 });
});

test('app-origin Manual retains its caller owner; reduced endpoints need receipts and do not replay',async()=>{
 await fixture(({screens,paint,setStatus,canvases})=>{
  const caller=camera(),owner=caller.system.runtime.active,state=manual(caller);paint(caller,0);paint(state,1);paint(state,2);
  assert.equal(state.system.runtime.instances[owner].suspended,true);assert.equal(state.system.runtime.application,owner);
  screens.setReducedMotion(true);assert.deepEqual([paint(state,3,false).manualEntry.phase,paint(state,3,false).manualEntry.frame],['out',20]);
  assert.equal(screens.stockStatus(state),'loading');screens.presentManualEntry(state,ms(3));
  assert.deepEqual(paint(state,4,false).manualEntry,{phase:'in',frame:20,owner:state.system.runtime.active});
  assert.equal(screens.stockStatus(state),'loading');screens.presentManualEntry(state,ms(4));assert.equal(screens.stockStatus(state),'ready');
  screens.setReducedMotion(false);const restored=paint(state,5);assert.deepEqual([restored.manualEntry.phase,restored.manualEntry.frame],['in',20]);assert.equal(screens.stockStatus(state),'ready');
  setStatus('error');paint(state,6);assert.equal(screens.stockStatus(state),'error');
  const escaped=escapeUnreadyNativeScreen(state,6500);assert.equal(escaped.system.phase,'home');assert.equal(escaped.system.runtime.application,owner);assert.equal(escaped.system.runtime.instances[owner].suspended,true);assert.equal(escaped.system.runtime.homeReturn,owner);assert.equal(escaped.system.runtime.instances[state.system.runtime.active],undefined);
  screens.dispose();assert.ok(canvases.slice(3,7).every(c=>c.width===0&&c.height===0));assert.equal(screens.presentManualEntry(state,ms(7)),false);
 });
});

test('fresh Manual observations progress reduced first and repeat cycles when rAF predates the last receipt',async()=>{
 await fixture(({screens,paint})=>{
  let home=cameraHome();screens.setReducedMotion(true);
  for(let cycle=0;cycle<2;cycle++){
   const step=cycle*10,state=manual(home);paint(home,step);
   const outgoing=screens.paint(state,new Date(0),ms(step+1),{manualEntryObservedElapsedMs:ms(step+2)});
   assert.deepEqual(outgoing.manualEntry,{phase:'out',frame:20,owner:state.system.runtime.active});
   assert.equal(screens.stockStatus(state),'loading');assert.equal(screens.presentManualEntry(state,ms(step+3)),true);
   assert.ok(ms(step+2)<ms(step+3));
   const incoming=screens.paint(state,new Date(0),ms(step+2),{manualEntryObservedElapsedMs:ms(step+4)});
   assert.ok(incoming,String(screens.stockFailure()));
   assert.deepEqual(incoming.manualEntry,{phase:'in',frame:20,owner:state.system.runtime.active});
   assert.equal(screens.stockStatus(state),'loading');
   assert.deepEqual(screens.paint(state,new Date(0),ms(step+3),{manualEntryObservedElapsedMs:ms(step+5)}).manualEntry,incoming.manualEntry);
   assert.equal(screens.stockStatus(state),'loading');assert.equal(screens.presentManualEntry(state,ms(step+6)),true);
   assert.equal(screens.stockStatus(state),'ready');assert.equal(screens.stockFailure(),null);
   home=reduceSystem(state,'x',6500+cycle*100);assert.equal(home.system.phase,'home');
  }
 });
});

test('fresh Manual observations retain elapsed progress, pending poses and context-rebase position despite stale rAF',async()=>{
 await fixture(({screens,paint})=>{
  const home=cameraHome(),state=manual(home);paint(home,0);
  const sample=(raf,observed)=>screens.paint(state,new Date(0),ms(raf),{manualEntryObservedElapsedMs:ms(observed)});
  assert.equal(sample(1,2).manualEntry.frame,0);assert.equal(screens.presentManualEntry(state,ms(3)),true);
  assert.equal(sample(2,4).manualEntry.frame,2);assert.equal(sample(3,5).manualEntry.frame,2);
  assert.equal(screens.presentManualEntry(state,ms(6)),true);
  assert.equal(sample(5,7).manualEntry.frame,5);screens.revokeManualEntryCandidate();
  assert.equal(screens.presentManualEntry(state,ms(8)),false);
  assert.equal(sample(5,9).manualEntry.frame,2);assert.equal(screens.presentManualEntry(state,ms(10)),true);
  assert.equal(sample(9,11).manualEntry.frame,4);assert.equal(screens.presentManualEntry(state,ms(12)),true);
  assert.equal(screens.stockStatus(state),'loading');assert.equal(screens.stockFailure(),null);
 });
});

test('a genuinely backwards or invalid fresh Manual observation still publishes paired recovery',async()=>{
 for(const observed of [ms(2),-1,NaN,Infinity])await fixture(({screens,paint})=>{
  const home=cameraHome(),state=manual(home);paint(home,0);paint(state,1,false);
  assert.equal(screens.presentManualEntry(state,ms(3)),true);
  assert.equal(screens.paint(state,new Date(0),ms(4),{manualEntryObservedElapsedMs:observed}),undefined);
  assert.equal(screens.stockStatus(state),'error');
  assert.match(String(screens.stockFailure()),Number.isFinite(observed)&&observed>=0?/clock moved backwards/:/Invalid Manual entry timestamp/);
  assert.equal(screens.presentManualEntry(state,ms(5)),false);
 });
});

test('caller, title, generation and runtime application prevent stale outgoing backing reuse',()=>{
 for(const base of [cameraHome(),camera()]){
  const origin=manualEntryOrigin(base,1),identity=manualEntryIdentity(manual(base),1);assert.equal(manualEntryBackingMatches(origin,identity),true);
  for(const patch of [{generation:2},{manualTitleId:'0004001000022000'},{application:'other:1'},{caller:base.system.phase==='home'?'other:1':null}])assert.equal(manualEntryBackingMatches(origin,{...identity,...patch}),false);
 }
});
