import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {createPortfolioState,tickSystem,invokeSystemApplet,touchSystem,completeManualFooterClose} from '../src/os/system.ts';

const data=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64'),url=new URL('../src/os/screens.ts',import.meta.url);
const overrides={
 './native-system-presentation':data('export const drawNativeSystemOverlay=()=>false;'),
 './home-suspended-window':data(`export {homeSuspendedApplication,homeSuspendedIconDisappeared,homeSuspendedWindowEntryFrame,retainedSuspendedApplication,selectedSuspendedApplication} from '${new URL('../src/os/home-suspended-window.ts',import.meta.url).href}';export const drawHomeSuspendedWindow=()=>true;`),
 './native-chrome':data('export const createNativeChrome=()=>({ready:Promise.resolve(),draw:()=>true,tile:()=>true});'),
 './home-native-layouts':data('export const createHomeLayoutManager=()=>({});'),
 './firmware-presentation':data('export const createFirmwareHome=a=>a.presenter;export const loadFirmwarePresentationAssets=()=>{};'),
 './portfolio-screens':data('export const setPortfolioFont=()=>{};export const createPortfolioGraphics=()=>globalThis.__closeGraphics;'),
};
const compiled=ts.transpileModule(readFileSync(url,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/(from\s*['"])(\.[^'"]+)(['"])/g,(_a,p,n,s)=>p+(overrides[n]??new URL(n.endsWith('.ts')?n:n+'.ts',url).href)+s);
const {createScreens}=await import(data(compiled));
const request=()=>touchSystem(invokeSystemApplet(tickSystem(createPortfolioState(),3001),'manual',4000,{manualTitleId:'0004001000022400'}),80,226,4100);
const ms=n=>10000+n*1000/60+.01;
async function fixture(run){
 const keys=['document','Image','FontFace','__closeGraphics'],saved=new Map(keys.map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 let status='ready',resources={},pair,coverOkay=true;const events=[];
 function canvas(){const c={width:0,height:0},ctx=new Proxy({canvas:c,drawImage(){},createLinearGradient:()=>({addColorStop(){}}),getImageData(_x,_y,w,h){return{data:new Uint8ClampedArray(w*h*4)};}},{get:(o,k)=>k in o?o[k]:()=>{}});c.getContext=()=>ctx;return c;}
 const graphics={ready:Promise.resolve(),selectedApp(){},stockStatus:()=>status,stockFailure:()=>status==='error'?Error('missing Manual resources'):null,syncStockView(){},preparedStockPair:()=>status==='ready'?pair:undefined,manualFooterCloseResources:()=>status==='ready'?resources:undefined,readSuspendedCapture:()=>({status:'none'}),banner(){},menuIcon(){},menuArtwork(){},overlay(_t,_b,_s,_time,_reduced,_native,_date,_verify,defer,_notes,_news,manual){assert.equal(defer,false);pair={};events.push(['stock',manual]);},retryStockScreen(){status='ready';return true;},dispose(){}};
 Object.assign(globalThis,{document:{hidden:false,createElement:canvas,fonts:{add(){}}},Image:class{decode(){return Promise.resolve();}},FontFace:class{load(){return Promise.resolve(this);}},__closeGraphics:graphics});
 const presenter=new Proxy({pressOffset:0,tilePressOffset:()=>0,manualFooterCover(_t,_b,kind,frame){events.push(['cover',kind,frame]);return coverOkay;}},{get:(o,k)=>k in o?o[k]:()=>true});
 const assets=()=>({presenter,sharedFont:{draw(){}},dispose(){},diagnostics:[],titleIcons:new Map(),titleDescriptions:new Map()});
 const screens=createScreens({firmwareAssets:assets(),drawHomeBackground:()=>true,drawSuspendedBackground:()=>true});
 try{await screens.ready;await run({screens,events,paint(state,n,receipt=true){events.length=0;const result=screens.paint(state,new Date(0),ms(n));const identity=receipt?screens.presentManualFooterClose(state,ms(n)):null;return{result,identity};},replaceResources(){resources={};},replaceFirmware(){screens.setFirmwareAssets(assets());},setStatus(s){status=s;},failCover(){coverOkay=false;}});}
 finally{screens.dispose();for(const[k,d]of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
}

for(const reduced of[false,true])test(`actual paired painter holds Manual and HOME through both terminal receipts, banner handoff and repeat (reduced ${reduced})`,async()=>fixture(({screens,paint,events})=>{
 screens.setReducedMotion(reduced);let step=0,previous;
 for(let cycle=0;cycle<2;cycle++){
  let state=cycle?touchSystem(invokeSystemApplet(previous,'manual',ms(step),{manualTitleId:'0004001000022400'}),80,226,ms(step)):request();const owner=state.system.runtime.active;
  for(const f of reduced?[1]:[0,1]){const{result,identity}=paint(state,step++);assert.equal(identity,null);assert.deepEqual(result.manualClose,{kind:'feedback',frame:f,owner,adaptation:true});assert.deepEqual(events.find(e=>e[0]==='stock'),['stock',{frame:f}]);}
  for(const f of reduced?[]:Array.from({length:20},(_,i)=>i)){const{result,identity}=paint(state,step++);assert.equal(identity,null);assert.equal(result.manualClose.frame,f);assert.deepEqual(events.find(e=>e[0]==='cover'),['cover','out',f]);assert.ok(state.system.runtime.instances[owner]);}
  const candidate=paint(state,step++,false);assert.equal(candidate.result.manualClose.frame,20);assert.ok(state.system.runtime.instances[owner]);assert.equal(screens.homeAppletFooterBannerReady(state),false);
  screens.revokeNotesFooterCloseCandidate();assert.equal(screens.presentManualFooterClose(state,ms(step)),null,'context/render invalidation revokes an unpresented terminal');
  paint(state,step++);const accepted=paint(state,step++);assert.equal(accepted.identity.owner,owner);state=completeManualFooterClose(state,accepted.identity,ms(step));assert.equal(state.system.runtime.instances[owner],undefined);assert.equal(state.system.phase,'home');
  for(const f of reduced?[20]:Array.from({length:21},(_,i)=>i)){const{result,identity}=paint(state,step++);assert.equal(identity,null);assert.equal(result.manualClose.kind,'in');assert.equal(result.manualClose.frame,f);assert.equal(screens.homeAppletFooterBannerReady(state),false);assert.equal(screens.stockStatus(state),'loading');}
  const handoff=paint(state,step++,false);assert.equal(handoff.result.manualClose.kind,'handoff');assert.equal(screens.homeAppletFooterBannerReady(state),false);assert.equal(screens.presentManualFooterClose(state,ms(step)),null);assert.equal(screens.homeAppletFooterBannerReady(state),true);previous=state;
 }
}));

test('hidden/sleep, failed source/cover and firmware replacement cannot consume or drop a retained Manual return',async()=>fixture(({screens,paint,replaceFirmware,replaceResources,setStatus,failCover})=>{
 screens.setReducedMotion(true);let state=request(),step=0;paint(state,step++);const out=paint(state,step++,false);
 document.hidden=true;assert.equal(screens.presentManualFooterClose(state,ms(step)),null);document.hidden=false;screens.revokeNotesFooterCloseCandidate();
 paint(state,step++,false);const asleep={...state,system:{...state.system,sleeping:true}};assert.equal(screens.presentManualFooterClose(asleep,ms(step)),null);screens.revokeNotesFooterCloseCandidate();
 replaceResources();paint(state,step++);paint(state,step++);const accepted=paint(state,step++);assert.ok(accepted.identity);state=completeManualFooterClose(state,accepted.identity,ms(step));
 paint(state,step++,false);replaceFirmware();assert.equal(screens.presentManualFooterClose(state,ms(step)),null);assert.equal(screens.homeAppletFooterBannerReady(state),false);
 // First bind notices the changed firmware identity and revokes, second binds
 // the same incoming pose. Neither may expose a ready banner or skip handoff.
 paint(state,step++);assert.equal(screens.homeAppletFooterBannerReady(state),false);paint(state,step++);assert.equal(screens.homeAppletFooterBannerReady(state),false);paint(state,step++);assert.equal(screens.homeAppletFooterBannerReady(state),true);
 state=request();setStatus('error');paint(state,step++);assert.equal(screens.presentManualFooterClose(state,ms(step)),null);assert.ok(state.system.runtime.instances[state.system.runtime.active]);setStatus('ready');screens.retryStockScreen();failCover();paint(state,step++);paint(state,step++);assert.match(String(screens.stockFailure()),/HOME cover/);assert.equal(screens.presentManualFooterClose(state,ms(step)),null);
}));
