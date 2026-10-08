import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { createPortfolioState, reduceSystem, tickSystem } from '../src/os/system.ts';
import { enterHomeFolder, selectHomeSlot, getHomeNavigation } from '../src/os/home-navigation.ts';
import { createHomeBannerHost, crossHomeBannerBoundary, stepHomeBannerHost, getHomeBannerHostView, resolveHomeBannerHostSelection } from '../src/os/home-banner-host.ts';
import { escapeUnreadyNativeScreen } from '../src/os/native-screen-system.ts';
import { getHomeFolderIdentity } from '../src/os/home-folder-identity.ts';
import { createNativeScreenInputGate } from '../src/os/native-screen-input.ts';

const data=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const sourceUrl=new URL('../src/os/screens.ts',import.meta.url);
const overrides={
 './native-system-presentation':data('export const drawNativeSystemOverlay=()=>false;'),
 './home-suspended-window':data(`export {homeSuspendedApplication,homeSuspendedIconDisappeared,homeSuspendedWindowEntryFrame,retainedSuspendedApplication,selectedSuspendedApplication} from '${new URL('../src/os/home-suspended-window.ts',import.meta.url).href}';export const drawHomeSuspendedWindow=()=>true;`),
 './native-chrome':data('export const createNativeChrome=()=>({ready:Promise.resolve(),draw:()=>true,tile:()=>true});'),
 './home-native-layouts':data('export const createHomeLayoutManager=()=>({});'),
 './firmware-presentation':data('export const createFirmwareHome=a=>a.presenter;export const loadFirmwarePresentationAssets=()=>{};'),
 './portfolio-screens':data('export const setPortfolioFont=()=>{};export const createPortfolioGraphics=()=>({ready:Promise.resolve(),selectedApp(){},syncStockView(){},stockStatus:()=>"inactive",stockFailure:()=>null,banner(){},menuIcon(){},menuArtwork(){},overlay(){},dispose(){}});'),
};
const {outputText}=ts.transpileModule(readFileSync(sourceUrl,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const {createScreens}=await import(data(outputText.replace(/(from\s*['"])(\.[^'"]+)(['"])/g,(_all,prefix,path,suffix)=>prefix+(overrides[path]??new URL(path.endsWith('.ts')?path:`${path}.ts`,sourceUrl).href)+suffix)));
const root=()=>selectHomeSlot({...tickSystem(createPortfolioState(),3001),folders:{19:'Folder'}},19);
const at=(state,updateCount)=>({...state,system:{...state.system,homeClock:{...state.system.homeClock,updateCount}}});
function activeView(selection,generation='folder-entry:1'){
 const inputs={managerInhibited:false,sceneInhibited:false,loadInhibited:false,nativeWorkerReady:true,resourceReady:null};
 let host=createHomeBannerHost({generation,updateCount:0},inputs);
 host=crossHomeBannerBoundary(host,host.clock,{selection});
 host=crossHomeBannerBoundary(host,host.clock,{inputs:{...inputs,resourceReady:getHomeBannerHostView(host).resourceTicket}});
 return getHomeBannerHostView(crossHomeBannerBoundary(host,{...host.clock,updateCount:20}));
}

async function fixture(run){
 const saved=new Map(['document','Image','FontFace'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 const events=[];let host=activeView({kind:'default'}),fail=false,defaultFail=false,labelMissing=false;
 function canvas(){
  const surface={width:0,height:0};
  const ctx=new Proxy({canvas:surface,globalAlpha:1,record(name,args=[]){events.push({name,args,ctx});},createLinearGradient:()=>({addColorStop(){}}),getImageData(_x,_y,w,h){return{width:w,height:h,data:new Uint8ClampedArray(w*h*4)};}},{get:(target,key)=>key in target?target[key]:()=>{}});
  surface.getContext=()=>ctx;return surface;
 }
 Object.assign(globalThis,{document:{createElement:canvas,fonts:{add(){}}},Image:class {decode(){return Promise.resolve();}},FontFace:class {load(){return Promise.resolve(this);}}});
 const label={width:1,height:1,data:new Uint8ClampedArray([255,255,255,255])};
 const presenter=new Proxy({pressOffset:0,tilePressOffset:()=>0,folderBannerLabel:()=>labelMissing?undefined:label,
  folderChild(_ctx,_state,_empty,draw){draw(1);return true;},folderChrome(ctx,_state,_reduced,entry){ctx.record('lower-entry',[entry]);return true;},
  hud(ctx){ctx.record('hud');return true;}},{get:(target,key)=>key in target?target[key]:()=>true});
 const assets=()=>({presenter,sharedFont:{draw(){}},dispose(){},diagnostics:[]});
 const screens=createScreens({firmwareAssets:assets(),getHomeBanner:()=>host,
  drawHomeBackground(ctx){ctx.record('wallpaper');return true;},
  drawFolderBannerFrame(ctx,motion,label){ctx.record('folder-banner',[motion,label]);return !fail;},
  drawDefaultBannerFrame(ctx,motion){ctx.record('default-banner',[motion]);return !defaultFail;}});
 const paint=(state,update,receipt=true,verification)=>{
  events.length=0;const current=at(state,update),result=screens.paint(current,new Date(0),10000+update*1000/60,verification);
  if(receipt)screens.presentHomeEntryMotion(current);return{state:current,result,events};
 };
 try{await screens.ready;await run({screens,paint,events,presenter,assets,setHost:value=>host=value,fail:value=>fail=value,failDefault:value=>defaultFail=value,missingLabel:value=>labelMissing=value});}
 finally{screens.dispose();for(const[key,descriptor]of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}}
}
const banner=events=>events.find(e=>e.name==='folder-banner');
const lower=events=>events.find(e=>e.name==='lower-entry').args[0];
function prepare(rootState,setHost,paint){setHost(activeView(resolveHomeBannerHostSelection(rootState)));paint(rootState,100);setHost(activeView({kind:'default'}));return enterHomeFolder(rootState,19);}
function finishHide(state,paint,update){
 let pair;
 do{pair=paint(state,++update);}while(banner(pair.events)?.args[0].visible);
 return update;
}

test('actual folder painter retains its source upper through FadeIn16, then hides it with native manager poses before the child',async()=>{
 await fixture(({screens,paint,setHost})=>{
  const state=prepare(root(),setHost,paint);let terminal;
  for(let frame=0;frame<=16;frame++){
   const pair=paint(state,101+frame,frame!==16);assert.ok(pair.result,String(screens.stockFailure()));
   assert.equal(lower(pair.events).folderFrame,frame);assert.ok(banner(pair.events));assert.ok(!pair.events.some(e=>e.name==='default-banner'));
   assert.ok(pair.events.some(e=>e.name==='wallpaper'));assert.ok(pair.events.some(e=>e.name==='hud'));
   if(frame===16)terminal=structuredClone(banner(pair.events).args[0]);
  }
  let pair=paint(state,118,false);assert.equal(lower(pair.events).folderFrame,16);assert.deepEqual(banner(pair.events).args[0],terminal);
  assert.equal(screens.presentHomeEntryMotion(pair.state),true);
  for(const [offset,visible,scale] of [[0,true,.949999988079071],[1,true,.8999999761581421],[2,true,.8500000238418579],[3,true,.800000011920929],[4,false,.949999988079071]]){
   pair=paint(state,119+offset,offset!==4);assert.equal(lower(pair.events).folderFrame,16);
   assert.equal(banner(pair.events).args[0].visible,visible);assert.equal(banner(pair.events).args[0].scale,scale);
   assert.ok(!pair.events.some(e=>e.name==='default-banner'));assert.equal(screens.stockStatus(state),'loading');assert.equal(screens.homeEntryMotionActive(state),true);
  }
  assert.equal(screens.presentHomeEntryMotion(pair.state),true);assert.equal(screens.stockStatus(state),'loading');
  pair=paint(state,124);assert.ok(!banner(pair.events));assert.ok(pair.events.some(e=>e.name==='default-banner'));assert.equal(screens.homeEntryMotionActive(state),false);assert.equal(screens.stockStatus(state),'ready');
 });
});

test('real host defers child request and activation until source receipts, then grows a fresh native child without resets',async()=>{
 for(const reduced of [false,true])await fixture(({screens,paint,setHost})=>{
  const caller=root(),inputs={managerInhibited:false,sceneInhibited:false,loadInhibited:false,nativeWorkerReady:true,resourceReady:null};
  let host=createHomeBannerHost({generation:'live-folder:1',updateCount:0},inputs);
  host=crossHomeBannerBoundary(host,host.clock,{selection:resolveHomeBannerHostSelection(caller)});
  host=crossHomeBannerBoundary(host,host.clock,{inputs:{...inputs,resourceReady:getHomeBannerHostView(host).resourceTicket}});
  host=crossHomeBannerBoundary(host,{...host.clock,updateCount:100});setHost(getHomeBannerHostView(host));paint(caller,100);
  let rootEpoch=getHomeBannerHostView(host).primary.activationEpoch,rootRequest=host.pending.requestEpoch;
  let state=enterHomeFolder(caller,19);screens.setReducedMotion(reduced);
  const advance=(count=3)=>{
   for(let i=0;i<count;i++){
    const selection=screens.homeFolderBannerRequestReady(state)?resolveHomeBannerHostSelection(state):undefined;
    const ready={...host.inputs,activationReady:screens.homeEntryActivationReady(state)&&screens.homeFolderBannerActivationReady(state)};
    host=stepHomeBannerHost(host,{...host.clock,updateCount:host.clock.updateCount+1},{beforeManager:{selection,inputs:ready}});
    host=crossHomeBannerBoundary(host,host.clock,{selection,inputs:{...ready,resourceReady:getHomeBannerHostView(host).resourceTicket}});
   }
   setHost(getHomeBannerHostView(host));return host.clock.updateCount;
  };
  for(let cycle=0;cycle<2;cycle++){
  const frames=reduced?[16]:[0,3,6,9,12,15,16];
  for(const frame of frames){
   const pair=paint(state,advance(),frame!==16);assert.equal(lower(pair.events).folderFrame,frame);
   assert.equal(host.selection.kind,'folder');assert.equal(host.pending.requestEpoch,rootRequest);
   assert.equal(getHomeBannerHostView(host).primary.activationEpoch,rootEpoch);
  }
  advance(30);assert.equal(host.selection.kind,'folder','pending terminal is not a child request receipt');
  paint(state,host.clock.updateCount,false);assert.equal(screens.presentHomeEntryMotion(at(state,host.clock.updateCount)),true);
  assert.equal(screens.homeFolderBannerRequestReady(state),true);assert.equal(screens.homeFolderBannerActivationReady(state),false);
  let pair;
  do{
   pair=paint(state,advance(),false);
   assert.equal(host.selection.kind,'default');
   assert.ok(!host.service.lifecycle.active||host.service.lifecycle.active.target.kind==='folder','no child instance or clips advance behind retained root');
   if(banner(pair.events).args[0].visible)screens.presentHomeEntryMotion(pair.state);
  }while(banner(pair.events).args[0].visible);
  advance(30);assert.equal(host.service.stage,'loading');assert.equal(host.service.lifecycle.active,null);assert.equal(screens.stockStatus(state),'loading');
  assert.equal(screens.homeFolderBannerActivationReady(state),false);
  screens.revokeHomeEntryMotionCandidate();assert.equal(screens.homeFolderBannerRequestReady(state),false);
  paint(state,advance(),false);assert.equal(host.service.lifecycle.active,null);
  assert.equal(screens.presentHomeEntryMotion(at(state,host.clock.updateCount)),true);
  for(let retry=0;!screens.homeFolderBannerActivationReady(state);retry++){
   assert.ok(retry<3,'retry rebases the last receipt before finishing the native hide');
   paint(state,advance());assert.equal(host.service.lifecycle.active,null);
  }
  assert.equal(screens.homeFolderBannerActivationReady(state),true);
  pair=paint(state,advance());const child=getHomeBannerHostView(host).primary;
  assert.equal(child.selection.kind,'default');assert.equal(child.activationEpoch,rootEpoch+1);
  assert.equal(child.motion.visibilityCounter,3);assert.equal(child.motion.scale,.8999999761581421);
  assert.equal(child.motion.skeletal.frame,3);assert.equal(child.motion.material.frame,3);
  assert.ok(!banner(pair.events));assert.ok(pair.events.some(e=>e.name==='default-banner'));
  assert.equal(screens.homeEntryMotionActive(state),false);assert.equal(screens.stockStatus(state),'ready');
  advance();assert.equal(getHomeBannerHostView(host).primary.motion.scale,1);
  if(cycle===0){
   state=tickSystem(reduceSystem(at(state,host.clock.updateCount),'back',20000),21000);
   assert.equal(state.opened,false);advance(20);
   const returned=getHomeBannerHostView(host);assert.equal(returned.stage,'active');assert.equal(returned.primary.selection.kind,'folder');
   paint(state,host.clock.updateCount);rootEpoch=returned.primary.activationEpoch;rootRequest=host.pending.requestEpoch;
   state=enterHomeFolder(state,19);assert.equal(screens.homeFolderBannerRequestReady(state),false);assert.equal(screens.homeFolderBannerActivationReady(state),false);
  }
  }
 });
});

test('unpresented, foreign, replaced and failed root resources cannot invent folder entry pixels',async()=>{
 for(const kind of ['unpresented','foreign','replacement','failed','label'])await fixture(({screens,paint,setHost,fail,missingLabel,assets})=>{
  const caller=root();setHost(activeView(resolveHomeBannerHostSelection(caller)));if(kind==='failed')fail(true);if(kind==='label')missingLabel(true);
  paint(caller,100,kind!=='unpresented');fail(false);missingLabel(false);
  if(kind==='replacement')screens.setFirmwareAssets(assets());
  const state=enterHomeFolder(kind==='foreign'?{...caller,folders:{19:'Folder',20:'Other'},selected:20}:caller,kind==='foreign'?20:19);
  setHost(activeView({kind:'default'}));paint(state,101);assert.equal(screens.stockStatus(state),'error',kind);
  assert.match(String(screens.stockFailure()),/matching presented root banner/,kind);assert.equal(screens.presentHomeEntryMotion(at(state,102)),false);
 });
});

test('context, sleep, diagnostic and monotonic retry rebase source motion; terminal restoration still needs a receipt',async()=>{
 await fixture(({screens,paint,setHost,fail})=>{
  const state=prepare(root(),setHost,paint);paint(state,101);let pair=paint(state,104),visible=structuredClone(banner(pair.events).args[0]);
  assert.equal(lower(pair.events).folderFrame,3);
  paint(state,105,false);screens.revokeHomeEntryMotionCandidate();assert.equal(screens.presentHomeEntryMotion(at(state,106)),false);
  pair=paint(state,107);assert.equal(lower(pair.events).folderFrame,3);assert.deepEqual(banner(pair.events).args[0],visible);
  pair=paint(state,108);visible=structuredClone(banner(pair.events).args[0]);assert.equal(lower(pair.events).folderFrame,4);
  fail(true);paint(state,109);assert.equal(screens.stockStatus(state),'error');fail(false);screens.retryStockScreen();
  pair=paint(state,110);assert.equal(lower(pair.events).folderFrame,4);assert.deepEqual(banner(pair.events).args[0],visible);
  paint(state,111,false,{homeCursorLoopFrame:0});assert.equal(screens.presentHomeEntryMotion(at(state,111)),false);
  pair=paint(state,112);assert.equal(lower(pair.events).folderFrame,4);assert.deepEqual(banner(pair.events).args[0],visible);
  paint({...state,system:{...state.system,sleeping:true}},113,false);assert.equal(screens.presentHomeEntryMotion(at(state,113)),false);
  pair=paint(state,114);assert.equal(lower(pair.events).folderFrame,4);assert.deepEqual(banner(pair.events).args[0],visible);
  for(let update=115;update<=128;update++)pair=paint(state,update);
  assert.equal(lower(pair.events).folderFrame,16);const terminal=structuredClone(banner(pair.events).args[0]);
  screens.revokeHomeEntryMotionCandidate();pair=paint(state,129,false);assert.deepEqual(banner(pair.events).args[0],terminal);
  assert.equal(screens.presentHomeEntryMotion(pair.state),true);const hiddenAt=finishHide(state,paint,129);pair=paint(state,hiddenAt+1);assert.ok(!banner(pair.events));
 });
});

test('failed-entry escape and new root receipt replace the retained owner before re-entry',async()=>{
 await fixture(({screens,paint,setHost,missingLabel})=>{
  const caller=root(),state=prepare(caller,setHost,paint);paint(state,101);missingLabel(true);paint(state,102);
  assert.equal(screens.stockStatus(state),'error');assert.match(String(screens.stockFailure()),/retained folder-entry banner unavailable/);
  const escaped=escapeUnreadyNativeScreen(at(state,102),7000);assert.equal(escaped.opened,false);assert.equal(escaped.system.phase,'home');assert.equal(getHomeFolderIdentity(escaped,19),getHomeFolderIdentity(caller,19));
  missingLabel(false);setHost(activeView(resolveHomeBannerHostSelection(escaped)));paint(escaped,103);assert.equal(screens.stockStatus(escaped),'inactive');assert.equal(screens.stockFailure(),null);
  setHost(activeView({kind:'default'}));const reentered=enterHomeFolder(escaped,19),pair=paint(reentered,104);assert.equal(lower(pair.events).folderFrame,0);assert.ok(banner(pair.events));
 });
});

test('a repeated entry cannot reuse the previous root receipt after an unpresented return',async()=>{
 await fixture(({screens,paint,setHost})=>{
  const caller=root(),state=prepare(caller,setHost,paint);paint(state,101);
  setHost(activeView(resolveHomeBannerHostSelection(caller)));paint(caller,102,false);
  setHost(activeView({kind:'default'}));paint(enterHomeFolder(caller,19),103);
  assert.equal(screens.stockStatus(state),'error');assert.match(String(screens.stockFailure()),/matching presented root banner/);
 });
});

test('a real Back and re-entry without any root paint rejects the old revision and terminal candidate',async()=>{
 await fixture(({screens,paint,setHost})=>{
  const caller=root(),state=prepare(caller,setHost,paint);paint(state,101);
  const escaped=escapeUnreadyNativeScreen(at(state,101),7000),reentered=enterHomeFolder(escaped,19);
  assert.equal(escaped.opened,false);assert.equal(reentered.opened,true);
  assert.equal(screens.presentHomeEntryMotion(at(reentered,102)),false);
  paint(reentered,102);assert.equal(screens.stockStatus(reentered),'error');
  assert.match(String(screens.stockFailure()),/matching presented root banner/);
 });
 await fixture(({screens,paint,setHost})=>{
  const state=prepare(root(),setHost,paint);for(let frame=0;frame<16;frame++)paint(state,101+frame);
  paint(state,117,false);const escaped=escapeUnreadyNativeScreen(at(state,117),7000),reentered=enterHomeFolder(escaped,19);
  assert.equal(screens.presentHomeEntryMotion(at(reentered,118)),false);
  paint(reentered,118);assert.equal(screens.stockStatus(reentered),'error');
  assert.match(String(screens.stockFailure()),/matching presented root banner/);
 });
});

test('folder input waits for the lower and native hide terminal receipts, then child navigation and normal Back remain available',async()=>{
 await fixture(({screens,paint,setHost})=>{
  const state=prepare(root(),setHost,paint),gate=createNativeScreenInputGate();paint(state,101);
  const command=command=>gate({type:'command',command},screens.stockStatus(state));
  assert.equal(screens.stockStatus(state),'loading');assert.equal(command('right'),'block');assert.equal(command('open'),'block');
  assert.equal(command('back'),'home');assert.equal(command('home'),'home');assert.equal(command('power'),'pass');
  for(let frame=1;frame<16;frame++)paint(state,101+frame);
  let pair=paint(state,117,false);assert.equal(screens.stockStatus(state),'loading');assert.equal(command('right'),'block');
  assert.equal(screens.presentHomeEntryMotion(pair.state),true);assert.equal(screens.stockStatus(state),'loading');assert.equal(command('right'),'block');
  const hiddenAt=finishHide(state,paint,117);assert.equal(screens.stockStatus(state),'loading');assert.equal(command('right'),'block');
  paint(state,hiddenAt+1);assert.equal(screens.stockStatus(state),'ready');assert.equal(command('right'),'pass');
  const child=selectHomeSlot(pair.state,1);pair=paint(child,hiddenAt+1);assert.equal(screens.stockStatus(child),'ready');assert.equal(lower(pair.events).folderFrame,16);assert.ok(!banner(pair.events));
  const closing=reduceSystem(child,'back',7000);assert.equal(closing.system.homeFolderClose.nextTransitionId,child.system.homeFolderClose.nextTransitionId+1);
  const returned=tickSystem(closing,8000);assert.equal(returned.opened,false);
  setHost(activeView({kind:'default'}));const reentered=enterHomeFolder(returned,19);paint(reentered,returned.system.homeClock.updateCount+1);
  assert.equal(screens.stockStatus(reentered),'error');assert.match(String(screens.stockFailure()),/matching presented root banner/);
  const escaped=escapeUnreadyNativeScreen(reentered,8100);setHost(activeView(resolveHomeBannerHostSelection(escaped)));paint(escaped,returned.system.homeClock.updateCount+2);
  setHost(activeView({kind:'default'}));const fresh=enterHomeFolder(escaped,19);pair=paint(fresh,returned.system.homeClock.updateCount+3);
  assert.equal(lower(pair.events).folderFrame,0);assert.ok(banner(pair.events));assert.equal(screens.stockStatus(fresh),'loading');
 });
});

test('reduced motion publishes visible lower terminal and hidden endpoint separately; disposal rejects stale acknowledgements',async()=>{
 await fixture(({screens,paint,setHost})=>{
  const state=prepare(root(),setHost,paint);screens.setReducedMotion(true);
  let pair=paint(state,101,false);assert.equal(lower(pair.events).folderFrame,16);assert.ok(banner(pair.events));
  assert.equal(banner(pair.events).args[0].visible,true);assert.equal(screens.stockStatus(state),'loading');
  pair=paint(state,102,false);assert.ok(banner(pair.events));assert.equal(screens.presentHomeEntryMotion(pair.state),true);
  assert.equal(screens.stockStatus(state),'loading');pair=paint(state,103,false);
  assert.equal(banner(pair.events).args[0].visible,false);assert.equal(banner(pair.events).args[1],undefined);assert.equal(screens.stockStatus(state),'loading');
  assert.equal(screens.presentHomeEntryMotion(pair.state),true);assert.equal(screens.stockStatus(state),'loading');
  screens.setReducedMotion(false);pair=paint(state,104);assert.equal(lower(pair.events).folderFrame,16);assert.equal(banner(pair.events).args[0].visible,false);
  pair=paint(state,105);assert.ok(!banner(pair.events));assert.equal(screens.stockStatus(state),'ready');screens.dispose();assert.equal(screens.presentHomeEntryMotion(pair.state),false);
 });
});

test('a mid-entry reduced toggle cannot skip the visible terminal receipt or replay an acknowledged hidden midpoint',async()=>{
 await fixture(({screens,paint,setHost})=>{
  const state=prepare(root(),setHost,paint);paint(state,101);paint(state,102);screens.setReducedMotion(true);
  let pair=paint(state,103,false);assert.equal(lower(pair.events).folderFrame,16);assert.equal(banner(pair.events).args[0].visible,true);
  pair=paint(state,104,false);assert.equal(banner(pair.events).args[0].visible,true);assert.equal(screens.stockStatus(state),'loading');
  assert.equal(screens.presentHomeEntryMotion(pair.state),true);pair=paint(state,105,false);assert.equal(banner(pair.events).args[0].visible,false);
  assert.equal(screens.presentHomeEntryMotion(pair.state),true);screens.setReducedMotion(false);
  pair=paint(state,106);assert.equal(banner(pair.events).args[0].visible,false);pair=paint(state,107);assert.ok(!banner(pair.events));
 });
});

test('only a valid child publication retires the terminal source; later revocations never resurrect it',async()=>{
 await fixture(({screens,paint,setHost})=>{
  const state=prepare(root(),setHost,paint);for(let frame=0;frame<=16;frame++)paint(state,101+frame);
  let update=finishHide(state,paint,117),pair=paint(state,++update,false);assert.ok(pair.events.some(e=>e.name==='default-banner'));
  screens.revokeHomeEntryMotionCandidate();pair=paint(state,++update);assert.equal(lower(pair.events).folderFrame,16);assert.equal(banner(pair.events).args[0].visible,false);
  pair=paint(state,++update);assert.ok(!banner(pair.events));assert.ok(pair.events.some(e=>e.name==='default-banner'));
  screens.revokeHomeEntryMotionCandidate();pair=paint(state,++update);assert.ok(!banner(pair.events));
  paint(state,++update,false,{homeCursorLoopFrame:0});assert.equal(screens.presentHomeEntryMotion(at(state,update)),false);
  pair=paint(state,++update);assert.ok(!banner(pair.events));
  paint({...state,system:{...state.system,sleeping:true}},++update,false);pair=paint(state,++update);assert.ok(!banner(pair.events));
  screens.setReducedMotion(true);pair=paint(state,++update);assert.ok(!banner(pair.events));
  screens.setReducedMotion(false);pair=paint(state,++update);assert.ok(!banner(pair.events));assert.equal(screens.stockStatus(state),'ready');
 });
});

test('unready or failed child resources retain the terminal source, and a retargeted child receipt cannot retire it',async()=>{
 await fixture(({screens,paint,setHost,failDefault})=>{
  const state=prepare(root(),setHost,paint);for(let frame=0;frame<=16;frame++)paint(state,101+frame);
  let update=finishHide(state,paint,117);
  const ready=activeView({kind:'default'});setHost({...ready,stage:'loading'});
  let pair=paint(state,++update);assert.ok(banner(pair.events));assert.equal(lower(pair.events).folderFrame,16);assert.equal(screens.stockStatus(state),'loading');
  setHost(ready);failDefault(true);paint(state,++update);assert.equal(screens.stockStatus(state),'error');assert.match(String(screens.stockFailure()),/child banner unavailable/);
  failDefault(false);screens.retryStockScreen();pair=paint(state,++update);assert.ok(banner(pair.events));
  pair=paint(state,++update,false);assert.ok(!banner(pair.events));setHost(activeView({kind:'default'},'folder-entry:2'));
  assert.equal(screens.presentHomeEntryMotion(pair.state),false);assert.equal(screens.stockStatus(state),'loading');pair=paint(state,++update);assert.ok(banner(pair.events));
  pair=paint(state,++update);assert.ok(!banner(pair.events));assert.equal(screens.stockStatus(state),'ready');screens.revokeHomeEntryMotionCandidate();pair=paint(state,++update);assert.ok(!banner(pair.events));
 });
});

test('acknowledged hidden root cannot release or authorize a rapid recovery re-entry before a child pair receipt',async()=>{
 await fixture(({screens,paint,setHost})=>{
  const state=prepare(root(),setHost,paint);screens.setReducedMotion(true);paint(state,101);paint(state,102);
  assert.equal(screens.homeFolderBannerRequestReady(state),true);assert.equal(screens.homeFolderBannerActivationReady(state),true);
  assert.equal(screens.stockStatus(state),'loading');
  const pending=paint(state,103,false),escaped=escapeUnreadyNativeScreen(pending.state,7000),reentered=enterHomeFolder(escaped,19);
  assert.equal(screens.homeFolderBannerRequestReady(reentered),false);assert.equal(screens.homeFolderBannerActivationReady(reentered),false);
  assert.equal(screens.presentHomeEntryMotion(at(reentered,104)),false);
  paint(reentered,104);assert.equal(screens.stockStatus(reentered),'error');assert.match(String(screens.stockFailure()),/matching presented root banner/);
 });
});

test('a released child cannot authorize failure recovery and re-entry without a fresh root receipt',async()=>{
 for(const reduced of [false,true])await fixture(({screens,paint,setHost,presenter})=>{
  let state=prepare(root(),setHost,paint),update=100;screens.setReducedMotion(reduced);
  for(const frame of reduced?[16]:Array.from({length:17},(_,i)=>i))paint(state,++update);
  update=finishHide(state,paint,update);paint(state,++update);
  assert.equal(screens.stockStatus(state),'ready');
  const rootView=getHomeNavigation(state).rootView;
  state=selectHomeSlot(state,1);assert.equal(getHomeNavigation(state).rootView,rootView);
  paint(state,++update);assert.equal(screens.stockStatus(state),'ready');
  const chrome=presenter.folderChrome;presenter.folderChrome=()=>false;
  paint(state,++update);assert.equal(screens.stockStatus(state),'error');
  const escaped=escapeUnreadyNativeScreen(at(state,update),7000),reentered=enterHomeFolder(escaped,19);
  assert.equal(escaped.opened,false);assert.equal(reentered.opened,true);
  assert.notEqual(getHomeNavigation(reentered).rootView,rootView);
  assert.deepEqual(getHomeNavigation(reentered).rootView,rootView,'unchanged root geometry does not imply the same entry');
  assert.equal(reentered.system.homeFolderClose.nextTransitionId,state.system.homeFolderClose.nextTransitionId,
   'failure recovery does not allocate a normal close transition');
  presenter.folderChrome=chrome;screens.retryStockScreen();
  assert.equal(screens.homeFolderBannerRequestReady(reentered),false);
  assert.equal(screens.homeFolderBannerActivationReady(reentered),false);
  paint(reentered,++update);assert.equal(screens.stockStatus(reentered),'error');
  assert.match(String(screens.stockFailure()),/matching presented root banner/);
  const returned=escapeUnreadyNativeScreen(at(reentered,update),7100);
  setHost(activeView(resolveHomeBannerHostSelection(returned)));paint(returned,++update);
  setHost(activeView({kind:'default'}));const fresh=enterHomeFolder(returned,19),pair=paint(fresh,++update);
  assert.equal(lower(pair.events).folderFrame,reduced?16:0);assert.equal(banner(pair.events).args[0].visible,true);
  assert.equal(screens.stockStatus(fresh),'loading');
 });
});

test('folder host gates leave root policy unchanged and reject sleep, failures and firmware replacement',async()=>{
 await fixture(({screens,paint,setHost,fail,assets})=>{
  const caller=root(),state=prepare(caller,setHost,paint);
  assert.equal(screens.homeFolderBannerRequestReady(caller),true);assert.equal(screens.homeFolderBannerActivationReady(caller),true);
  screens.setReducedMotion(true);paint(state,101);paint(state,102);
  for(const hidden of [{...state,system:{...state.system,sleeping:true}},{...state,powered:false},{...state,panel:'settings'}]){
   assert.equal(screens.homeFolderBannerRequestReady(hidden),false);assert.equal(screens.homeFolderBannerActivationReady(hidden),false);
  }
  fail(true);screens.revokeHomeEntryMotionCandidate();paint(state,103);assert.equal(screens.stockStatus(state),'error');
  assert.equal(screens.homeFolderBannerRequestReady(state),false);assert.equal(screens.homeFolderBannerActivationReady(state),false);
  fail(false);screens.retryStockScreen();paint(state,104);assert.equal(screens.homeFolderBannerActivationReady(state),true);
  screens.setFirmwareAssets(assets());assert.equal(screens.homeFolderBannerRequestReady(state),false);assert.equal(screens.homeFolderBannerActivationReady(state),false);
 });
});

test('root resource replacement between paint and receipt cannot become a retained entry source',async()=>{
 await fixture(({screens,paint,setHost})=>{
  const caller=root(),selection=resolveHomeBannerHostSelection(caller);setHost(activeView(selection));const pair=paint(caller,100,false);
  setHost(activeView(selection,'folder-entry:2'));assert.equal(screens.presentHomeEntryMotion(pair.state),false);
  setHost(activeView({kind:'default'}));const entered=enterHomeFolder(caller,19);paint(entered,101);
  assert.equal(screens.stockStatus(entered),'error');assert.match(String(screens.stockFailure()),/matching presented root banner/);
 });
});

test('mid-hide failed, diagnostic, context and stalled pairs rebase without skipping the native producer, and stale hidden receipt cannot release re-entry',async()=>{
 await fixture(({screens,paint,setHost,fail})=>{
  const state=prepare(root(),setHost,paint);for(let frame=0;frame<=16;frame++)paint(state,101+frame);
  let pair=paint(state,118);assert.equal(banner(pair.events).args[0].scale,.949999988079071);
  pair=paint(state,121);assert.equal(banner(pair.events).args[0].scale,.800000011920929);
  const shown=structuredClone(banner(pair.events).args[0]);paint(state,122,false);
  fail(true);paint(state,123);assert.equal(screens.stockStatus(state),'error');fail(false);screens.retryStockScreen();
  pair=paint(state,124);assert.deepEqual(banner(pair.events).args[0],shown);assert.equal(screens.stockStatus(state),'loading');
  paint(state,125,false,{homeCursorLoopFrame:0});pair=paint(state,126);assert.deepEqual(banner(pair.events).args[0],shown);
  pair=paint(state,1000);assert.deepEqual(banner(pair.events).args[0],shown,'oversized HOME observations cannot spend hide motion');
  pair=paint(state,1001);assert.equal(banner(pair.events).args[0].scale,.949999988079071);
  const prior=structuredClone(banner(pair.events).args[0]);screens.revokeHomeEntryMotionCandidate();
  pair=paint(state,1002);assert.deepEqual(banner(pair.events).args[0],prior);
  pair=paint(state,1003);assert.ok(!banner(pair.events));assert.ok(pair.events.some(e=>e.name==='default-banner'));
  pair=paint(state,1004,false);assert.ok(!banner(pair.events));assert.equal(screens.stockStatus(state),'ready');
  const escaped=escapeUnreadyNativeScreen(pair.state,30000),reentered=enterHomeFolder(escaped,19);
  assert.equal(screens.presentHomeEntryMotion(at(reentered,1005)),false);paint(reentered,1005);
  assert.equal(screens.stockStatus(reentered),'error');assert.match(String(screens.stockFailure()),/matching presented root banner/);
 });
});
