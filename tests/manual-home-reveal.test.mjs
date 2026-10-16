import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import ts from 'typescript';
import {createPortfolioState,tickSystem,dispatchSystemEvent,completeManualFooterClose,completeNotesFooterClose,completeNotificationsFooterClose,completeFriendsFooterClose,completeWebFooterClose,invokeSystemApplet} from '../src/os/system.ts';
import {enableHomeControls,selectHomeToolbarControlTouch} from '../src/os/home-controls.ts';
import {selectHomeSlot,settleHomeNavigation} from '../src/os/home-navigation.ts';
import {getHomePresentation} from '../src/os/home-presentation.ts';
import {decodeNativePng} from '../src/os/native-png.ts';
import {nativeTextureSamplePixels} from '../src/os/native-layout.ts';
import {getTitle} from '../src/os/app-registry.ts';
import {homeReturnFirstGroupIndex,homeToolbarReturnRevealFrame,homeToolbarReturnRevealStage} from '../src/os/home-return-reveal.ts';

const data=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
function moduleSource(name,overrides={}){
 const url=new URL(`../src/os/${name}.ts`,import.meta.url);
 return data(ts.transpileModule(readFileSync(url,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
  .replace(/(from\s*['"])(\.[^'"]+)(['"])/g,(_all,prefix,path,suffix)=>prefix+(overrides[path]??new URL(path.endsWith('.ts')?path:`${path}.ts`,url).href)+suffix)+`\n//# sourceURL=manual-reveal-${name}.js`);
}
const rendererModule=moduleSource('native-renderer'),{NativeLayoutRenderer}=await import(rendererModule);
const {createFirmwareHome}=await import(moduleSource('firmware-presentation',{'./native-renderer':rendererModule}));
const {createScreens}=await import(moduleSource('screens',{
 './native-system-presentation':data('export const drawNativeSystemOverlay=()=>false;'),
 './home-suspended-window':data(`export {homeSuspendedApplication,homeSuspendedIconDisappeared,homeSuspendedWindowEntryFrame,retainedSuspendedApplication,selectedSuspendedApplication} from '${new URL('../src/os/home-suspended-window.ts',import.meta.url).href}';export const drawHomeSuspendedWindow=()=>true;`),
 './native-chrome':data('export const createNativeChrome=()=>({ready:Promise.resolve(),draw:()=>true,tile:()=>true});'),
 './home-native-layouts':data('export const createHomeLayoutManager=()=>({});'),
 './firmware-presentation':data('export const createFirmwareHome=a=>a.presenter;export const loadFirmwarePresentationAssets=()=>{};'),
 './portfolio-screens':data('export const setPortfolioFont=()=>{};export const createPortfolioGraphics=()=>globalThis.__manualRevealGraphics;'),
}));
const root=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
const launcher=JSON.parse(readFileSync(new URL('packs/home/launcher.json',root))),manifest=JSON.parse(readFileSync(new URL('manifest.json',root)));
const textureNames=new Set(['LncIconDist_01','LncIconSetSrc_00'].flatMap(name=>launcher.layouts[name].textures));
const textures=new Map();
for(const name of textureNames){const record=launcher.textures[name];textures.set(name,nativeTextureSamplePixels(await decodeNativePng(readFileSync(new URL(record.url,root)),record),record.picaFormat));}
const titlePixels=new Map();
for(const [id,title]of Object.entries(manifest.titles))if(title.icon)titlePixels.set(id,await decodeNativePng(readFileSync(new URL(title.icon,root)),{width:48,height:48}));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const ms=step=>10000+step*1000/60+.01;
let inputAt=6000;
const touch=(state,phase,x=80,y=226)=>dispatchSystemEvent(state,{type:'touch',phase,pointerId:7,x,y},inputAt+=100);
const boot=id=>{const state=tickSystem(createPortfolioState(),3001),slot=Number(Object.entries(state.system.layout).find(([,app])=>app===id)[0]);return settleHomeNavigation(selectHomeSlot(state,slot));};
const routes=[
 {appId:'game-notes',focus:1,key:'notesClose',present:'presentNotesFooterClose',cancel:'cancelNotesFooterClose',complete:completeNotesFooterClose,x:160},
 {appId:'notifications',focus:3,key:'notificationsClose',present:'presentNotificationsFooterClose',cancel:'cancelNotificationsFooterClose',complete:completeNotificationsFooterClose,x:160},
 {appId:'friends',focus:2,key:'friendsClose',present:'presentFriendsFooterClose',cancel:'cancelFriendsFooterClose',complete:completeFriendsFooterClose,x:160},
 {appId:'browser',focus:4,key:'webClose',present:'presentWebFooterClose',cancel:'cancelWebFooterClose',complete:completeWebFooterClose,x:53},
 {appId:'miiverse',focus:5,key:'webClose',present:'presentWebFooterClose',cancel:'cancelWebFooterClose',complete:completeWebFooterClose,x:288},
];

// Runs the real material renderer and records its prepared pixels/placement.
// Canvas transport is not a browser rasterizer or a native pixel oracle.
function canvas(){
 const c={width:0,height:0,draws:[]},stack=[];
 const ctx=new Proxy({canvas:c,globalAlpha:1,globalCompositeOperation:'source-over',
  save(){stack.push([this.globalAlpha,this.globalCompositeOperation]);},restore(){[this.globalAlpha,this.globalCompositeOperation]=stack.pop();},
  createLinearGradient:()=>({addColorStop(){}}),getTransform:()=>undefined,
  createImageData:(width,height)=>({width,height,data:new Uint8ClampedArray(width*height*4)}),
  getImageData(_x,_y,width,height){return this.createImageData(width,height);},
  putImageData(image){c.image={...image,data:image.data.slice()};},
  drawImage(source,...rect){if(source.image)c.draws.push({width:source.width,height:source.height,rgba:sha(source.image.data),rect,alpha:this.globalAlpha,blend:this.globalCompositeOperation});},
 },{get:(target,key)=>key in target?target[key]:()=>{}});
 c.getContext=()=>ctx;return c;
}
async function fixture(run){
 const keys=['document','Image','FontFace','__manualRevealGraphics'],saved=new Map(keys.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 const calls=[],pixels=new Map(titlePixels);let status='ready',pair={},resources={},emptyFailure=false;
 Object.assign(globalThis,{document:{hidden:false,createElement:canvas,fonts:{add(){}}},Image:class{decode(){return Promise.resolve();}},FontFace:class{load(){return Promise.resolve(this);}}});
 const renderer=new NativeLayoutRenderer({launcher},{launcher:new Map(textures)},new Map()),home=createFirmwareHome({renderer,titleIconPixels:pixels});
 const presenter=new Proxy({pressOffset:0,tilePressOffset:()=>0,folderChild(_ctx,_state,_empty,draw){draw(1);return true;},
  ...Object.fromEntries(['tile','ordinaryTitleIcon','empty'].map(name=>[name,(ctx,...args)=>{
   const start=ctx.canvas.draws.length,result=name==='empty'&&emptyFailure?false:home[name](ctx,...args);
   calls.push({name,args,pictures:ctx.canvas.draws.slice(start)});return result;
  }])),
 },{get:(target,key)=>key in target?target[key]:()=>true});
 globalThis.__manualRevealGraphics={ready:Promise.resolve(),selectedApp(){},syncStockView(){},stockStatus:()=>status,stockFailure:()=>status==='error'?Error('Manual resources unavailable'):null,
  preparedStockPair:()=>status==='ready'?pair:undefined,manualFooterCloseResources:()=>status==='ready'?resources:undefined,readSuspendedCapture:()=>({status:'none'}),
  notesFooterCloseResources:()=>status==='ready'?resources:undefined,notificationsFooterCloseResources:()=>status==='ready'?resources:undefined,webFooterCloseResources:()=>status==='ready'?resources:undefined,
  appletIncomingResources:()=>status==='ready'?resources:undefined,drawAppletIncoming:()=>true,setAppletEntryCovered(){},notesBootCoverActive:()=>false,revokeNotesBootCoverCandidate(){},
  banner(){},menuIcon(_ctx,app,x,y,size){calls.push({name:'portfolio',args:[app.id,x,y,size]});},menuArtwork(){},
  overlay(){pair={};},retryStockScreen(){status='ready';return true;},dispose(){},
 };
 const assets=()=>({presenter,sharedFont:{draw(){}},renderer,titleIconPixels:pixels,titleIcons:new Map(),titleDescriptions:new Map(),diagnostics:renderer.diagnostics,dispose(){}});
 const screens=createScreens({firmwareAssets:assets(),drawHomeBackground:()=>true,drawSuspendedBackground:()=>true});
 let step=0;
 const paint=(state,{receipt=true,verification,present='presentManualFooterClose'}={})=>{
  calls.length=0;const before=JSON.stringify(state),now=ms(step++),result=screens.paint(state,new Date(0),now,verification);
  assert.equal(JSON.stringify(state),before,'presentation does not mutate grid/selection/input');
  screens.presentManualEntry(state,now);
  screens.presentAppletEntry(state,now);
  const identity=receipt?screens[present](state,now):null;
  if(receipt)screens.presentToolbarReturnReveal(state);
  return {result,identity,now,calls:structuredClone(calls)};
 };
 const open=state=>{
  paint(state);const held=touch(state,'down',50);paint(held);const entered=touch(held,'up',50);
  for(let count=0;count<50;count++){paint(entered);if(!screens.manualEntryActive(entered))return entered;}
  assert.fail('Manual entry did not settle');
 };
 const close=state=>{
  const held=touch(state,'down');paint(held);const released=touch(held,'up');
  // Manual Close also holds out20 for 120 measured LCD frames ('hold') before retiring the owner.
  for(let count=0;count<200;count++){const sample=paint(released);if(sample.identity)return completeManualFooterClose(released,sample.identity,ms(step));}
  assert.fail('Manual Close did not accept the held out20 cover');
 };
 const openToolbar=(state,route)=>{
  const selected=selectHomeToolbarControlTouch(enableHomeControls(state),route.focus);paint(selected);
  const entered=invokeSystemApplet(selected,route.appId,inputAt+=100);
  for(let count=0;count<50;count++){paint(entered);if(!screens.appletEntryActive(entered))return entered;}
  assert.fail(`${route.appId} entry did not settle: ${screens.stockFailure()}`);
 };
 const closeToolbar=(state,route)=>{
  const held=touch(state,'down',route.x);paint(held,{present:route.present});const released=touch(held,'up',route.x);
  // Toolbar Close now holds out20 for 120 measured LCD frames ('hold') before retiring the owner.
  for(let count=0;count<200;count++){
   const sample=paint(released,{present:route.present});
   assert.equal(screens.stockFailure(),null);assert.ok(['feedback','out','hold'].includes(sample.result?.[route.key]?.kind));
   if(sample.identity)return route.complete(released,sample.identity,ms(step));
  }
  assert.fail(`${route.appId} Close did not accept the held out20 cover: ${screens.stockFailure()}`);
 };
 try{await screens.ready;await run({screens,paint,open,close,openToolbar,closeToolbar,calls,home,renderer,pixels,
  failEmpty:value=>{emptyFailure=value;},setStatus:value=>{status=value;},replaceResources:()=>{resources={};},replaceFirmware:()=>screens.setFirmwareAssets(assets())});}
 finally{screens.dispose();renderer.dispose();for(const[key,descriptor]of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}}
}
function assertSelectedOnly(sample,state,home){
 const view=getHomePresentation(state),selected=state.opened?state.folderSelected:state.selected;
 const retained=view.tiles.find(tile=>tile.index===selected),id=getTitle(retained.appId).titleId;
 assert.deepEqual(sample.calls.filter(call=>call.name==='ordinaryTitleIcon').map(call=>call.args[0]),[id]);
 assert.equal(sample.calls.filter(call=>call.name==='portfolio').length,0);
 const actual=sample.calls.find(call=>call.name==='ordinaryTitleIcon'),expected=canvas();
 assert.equal(home.ordinaryTitleIcon(expected.getContext('2d'),...actual.args),true);
 assert.deepEqual(actual.pictures,expected.draws,'retained title uses actual source pixels');
 for(const tile of view.tiles.filter(tile=>tile.appId&&tile.index!==selected)){
  const blank=sample.calls.find(call=>call.name==='empty'&&call.args[0]===tile.x&&call.args[1]===tile.y);
  assert.ok(blank,`occupied slot ${tile.index} uses the existing empty source`);
  const expected=canvas();assert.equal(home.empty(expected.getContext('2d'),tile.x,tile.y,tile.size,view.density),true);
  assert.deepEqual(blank.pictures,expected.draws,'neighbour is decoded empty material, not hidden pixels or a reconstructed square');
  assert.ok(blank.pictures.length>0);
 }
}
function assertFirstGroup(sample,state,home){
 const view=getHomePresentation(state),selected=state.opened?state.folderSelected:state.selected,first=homeReturnFirstGroupIndex(view.tiles,selected);
 assert.notEqual(first,null,'fixture has a visible first-group neighbour');
 const drawn=[...sample.calls.filter(call=>call.name==='ordinaryTitleIcon'),...sample.calls.filter(call=>call.name==='portfolio')].map(call=>call.args[0]);
 const shown=view.tiles.filter(tile=>tile.index===selected||tile.index===first);
 assert.equal(drawn.length,shown.length);
 for(const tile of shown)assert.ok(drawn.includes(getTitle(tile.appId)?.titleId)||drawn.includes(tile.appId),`slot ${tile.index} is restored`);
 for(const tile of view.tiles.filter(tile=>tile.appId&&!tile.folderLabel&&tile.index!==selected&&tile.index!==first)){
  const blank=sample.calls.find(call=>call.name==='empty'&&call.args[0]===tile.x&&call.args[1]===tile.y);
  assert.ok(blank,`group-2 slot ${tile.index} remains the decoded empty source`);
  const expected=canvas();assert.equal(home.empty(expected.getContext('2d'),tile.x,tile.y,tile.size,view.density),true);assert.deepEqual(blank.pictures,expected.draws);
 }
}
// Measured toolbar adaptation: handoff is the base, group 1 at LCD frame 6,
// group 2 with banner admission at frame 19 (home-return-reveal.ts).
function assertToolbarReveal({screens,paint,home},state,route,handoff){
 assertSelectedOnly(handoff,state,home);
 assert.equal(screens.homeAppletFooterBannerReady(state),false,'a painted but unaccepted handoff cannot admit the banner');
 screens[route.present](state,handoff.now);
 assert.equal(screens.homeAppletFooterBannerReady(state),false,'accepted handoff starts the measured reveal');
 assert.equal(screens.toolbarReturnRevealActive(state),true);
 const firsts=new Map();
 for(let count=0;count<40;count++){
  const sample=paint(state,{present:route.present}),reveal=sample.result?.toolbarReturnReveal;
  assert.equal(sample.result?.[route.key],undefined);assert.ok(reveal);assert.equal(reveal.adaptation,true);
  assert.equal(reveal.frame,homeToolbarReturnRevealFrame(sample.now-handoff.now));assert.equal(reveal.stage,homeToolbarReturnRevealStage(reveal.frame));
  if(!firsts.has(reveal.stage))firsts.set(reveal.stage,reveal.frame);
  if(reveal.stage===0)assertSelectedOnly(sample,state,home);else if(reveal.stage===1)assertFirstGroup(sample,state,home);else assertPopulated(sample,state);
  assert.equal(screens.homeAppletFooterBannerReady(state),reveal.stage===2,'banner admission follows the accepted group-2 receipt');
  if(reveal.stage===2)break;
 }
 assert.deepEqual([...firsts],[[0,0],[1,6],[2,19]]);
 assert.equal(screens.toolbarReturnRevealActive(state),false);
 const clear=paint(state,{present:route.present});assert.equal(clear.result?.toolbarReturnReveal,undefined);assertPopulated(clear,state);
}
function assertPopulated(sample,state){
 const tiles=getHomePresentation(state).tiles.filter(tile=>tile.appId),native=tiles.map(tile=>getTitle(tile.appId)?.titleId).filter(Boolean);
 assert.deepEqual(sample.calls.filter(call=>call.name==='ordinaryTitleIcon').map(call=>call.args[0]),native);
 assert.ok(native.length>1,'control has populated native neighbours');
}

for(const reduced of [false,true])test(`Manual incoming retains actual selection through20 and restores on handoff, repeat and reduced=${reduced}`,async()=>fixture(({screens,paint,open,calls,home})=>{
 screens.setReducedMotion(reduced);let state=boot('camera');
 for(let cycle=0;cycle<2;cycle++){
  assertPopulated(paint(state),state);
  const entered=open(state);assert.equal(entered.system.runtime.instances[entered.system.runtime.active].appId,'manual');assertPopulated({calls},entered);
  const held=touch(entered,'down');assert.equal(held.system.runtime.instances[held.system.runtime.active].state.manualClosePress,true);assertPopulated(paint(held),held);
  const released=touch(held,'up');let accepted;
  let heldFrames=0;
  for(let frame=0;frame<200;frame++){
   const sample=paint(released);assertPopulated(sample,released);
   if(sample.result.manualClose?.kind==='hold')heldFrames++;
   if(sample.identity){accepted=sample.identity;break;}
  }
  assert.equal(heldFrames,reduced?0:120,'measured 120-frame covered hold; none under reduced motion');
  assert.ok(accepted);state=completeManualFooterClose(released,accepted,ms(100));
  for(const frame of reduced?[20]:Array.from({length:21},(_,i)=>i)){
   const sample=paint(state);assert.deepEqual([sample.result.manualClose.kind,sample.result.manualClose.frame],['in',frame]);
   assertSelectedOnly(sample,state,home);assert.equal(screens.homeAppletFooterBannerReady(state),false);assert.equal(screens.stockStatus(state),'loading');
  }
  const handoff=paint(state,{receipt:false});assert.equal(handoff.result.manualClose.kind,'handoff');assertPopulated(handoff,state);
  assert.equal(screens.homeAppletFooterBannerReady(state),false,'painting handoff is not acceptance');
  screens.presentManualFooterClose(state,handoff.now);assert.equal(screens.homeAppletFooterBannerReady(state),true);
  assert.equal(screens.toolbarReturnRevealActive(state),false,'Manual keeps all-at-handoff');
  const clear=paint(state);assert.equal(clear.result?.toolbarReturnReveal,undefined);assertPopulated(clear,state);
  if(!cycle)state=settleHomeNavigation(selectHomeSlot(state,Number(Object.entries(state.system.layout).find(([,id])=>id==='system-settings')[0])));
 }
}));

test('unaccepted terminal, revoked receipts and replaced firmware retain the policy until a valid handoff',async()=>fixture(({screens,paint,open,close,home,replaceFirmware})=>{
 screens.setReducedMotion(true);const state=close(open(boot('camera')));
 assertSelectedOnly(paint(state,{receipt:false}),state,home);
 assertSelectedOnly(paint(state,{receipt:false}),state,home);
 screens.revokeNotesFooterCloseCandidate();assert.equal(screens.presentManualFooterClose(state,ms(100)),null);
 assertSelectedOnly(paint(state,{receipt:false}),state,home);replaceFirmware();
 assert.equal(screens.presentManualFooterClose(state,ms(100)),null);assert.equal(screens.homeAppletFooterBannerReady(state),false);
 for(let i=0;i<2;i++)assertSelectedOnly(paint(state),state,home);
 const handoff=paint(state);assert.equal(handoff.result.manualClose.kind,'handoff');assertPopulated(handoff,state);assert.equal(screens.homeAppletFooterBannerReady(state),true);
}));

test('missing empty or restored title resources fail explicitly and cannot retire the return',async()=>fixture(({screens,paint,open,close,home,failEmpty,pixels})=>{
 screens.setReducedMotion(true);const state=close(open(boot('camera')));
 failEmpty(true);assert.equal(paint(state).result,undefined);assert.match(String(screens.stockFailure()),/HOME return empty slot unavailable/);assert.equal(screens.homeAppletFooterBannerReady(state),false);
 failEmpty(false);screens.retryStockScreen();
 const sound=pixels.get('0004001000022500');pixels.delete('0004001000022500');
 assertSelectedOnly(paint(state),state,home);
 assert.equal(paint(state).result,undefined);assert.match(String(screens.stockFailure()),/ordinary title icon unavailable/);assert.equal(screens.homeAppletFooterBannerReady(state),false);
 pixels.set('0004001000022500',sound);screens.retryStockScreen();
 for(let i=0;i<3&&!screens.homeAppletFooterBannerReady(state);i++)paint(state);
 assert.equal(screens.homeAppletFooterBannerReady(state),true);assertPopulated(paint(state),state);
}));

test('cancelled and replaced Manual owners cannot leave HOME neighbours masked',async()=>fixture(({screens,paint,open,close})=>{
 screens.setReducedMotion(true);const state=close(open(boot('camera')));paint(state,{receipt:false});
 assert.equal(screens.cancelManualFooterClose(state),true);assertPopulated(paint(state),state);assert.equal(screens.homeAppletFooterBannerReady(state),true);
 const returned=close(open(state));paint(returned,{receipt:false});
 const replacement=invokeSystemApplet(returned,'manual',7000,{manualTitleId:'0004001000022400'});
 assert.equal(screens.presentManualFooterClose(replacement,ms(100)),null);assertPopulated(paint(replacement),replacement);
 screens.dispose();assert.equal(paint(returned).result,undefined);
}));

for(const route of routes){
 for(const reduced of [false,true])test(`${route.appId} first/repeated incoming retains the ordinary selection despite toolbar focus, reduced=${reduced}`,async()=>fixture(({screens,paint,openToolbar,closeToolbar,home})=>{
  screens.setReducedMotion(reduced);let state=boot('health-safety');
  for(let cycle=0;cycle<2;cycle++){
   const selected=state.selected;
   state=closeToolbar(openToolbar(state,route),route);
   assert.equal(state.system.phase,'home');assert.equal(state.selected,selected);
   assert.equal(state.system.homeNavigation.focus.toolbarActive,true);assert.equal(state.system.homeNavigation.focus.currentFocus,route.focus);
   for(const frame of reduced?[20]:Array.from({length:21},(_,i)=>i)){
    const sample=paint(state,{present:route.present});assert.deepEqual([sample.result?.[route.key]?.kind,sample.result?.[route.key]?.frame],['in',frame]);
    assertSelectedOnly(sample,state,home);assert.equal(screens.homeAppletFooterBannerReady(state),false);assert.equal(screens.stockStatus(state),'loading');
   }
   const handoff=paint(state,{receipt:false,present:route.present});assert.equal(handoff.result?.[route.key]?.kind,'handoff');
   if(reduced){
    assertPopulated(handoff,state);
    assert.equal(screens.homeAppletFooterBannerReady(state),false,'a painted but unaccepted handoff cannot admit the banner');
    screens[route.present](state,handoff.now);assert.equal(screens.homeAppletFooterBannerReady(state),true);assert.equal(screens.toolbarReturnRevealActive(state),false);
    const clear=paint(state,{present:route.present});assert.equal(clear.result?.[route.key],undefined);assert.equal(clear.result?.toolbarReturnReveal,undefined);assertPopulated(clear,state);
   }else assertToolbarReveal({screens,paint,home},state,route,handoff);
   if(!cycle)state=settleHomeNavigation(selectHomeSlot(state,Number(Object.entries(state.system.layout).find(([,id])=>id==='camera')[0])));
  }
 }));

 test(`${route.appId} rejects unavailable empty graphics and unavailable restored artwork without accepting handoff`,async()=>fixture(({screens,paint,openToolbar,closeToolbar,home,failEmpty,pixels})=>{
  screens.setReducedMotion(true);const state=closeToolbar(openToolbar(boot('health-safety'),route),route),options={present:route.present};
  failEmpty(true);assert.equal(paint(state,options).result,undefined);assert.match(String(screens.stockFailure()),/HOME return empty slot unavailable/);assert.equal(screens.homeAppletFooterBannerReady(state),false);
  failEmpty(false);screens.retryStockScreen();
  const camera=pixels.get('0004001000022400');pixels.delete('0004001000022400');
  assertSelectedOnly(paint(state,options),state,home);
  assert.equal(paint(state,options).result,undefined);assert.match(String(screens.stockFailure()),/ordinary title icon unavailable/);assert.equal(screens.homeAppletFooterBannerReady(state),false);
  pixels.set('0004001000022400',camera);screens.retryStockScreen();
  for(let i=0;i<3&&!screens.homeAppletFooterBannerReady(state);i++)paint(state,options);
  assert.equal(screens.homeAppletFooterBannerReady(state),true);assertPopulated(paint(state,options),state);
 }));

 test(`${route.appId} revoked receipts retain selected-only return; cancellation restores the grid`,async()=>fixture(({screens,paint,openToolbar,closeToolbar,home})=>{
  screens.setReducedMotion(true);const state=closeToolbar(openToolbar(boot('health-safety'),route),route),options={receipt:false,present:route.present};
  assertSelectedOnly(paint(state,options),state,home);
  screens.revokeNotesFooterCloseCandidate();assert.equal(screens[route.present](state,ms(100)),null);
  assertSelectedOnly(paint(state,options),state,home);
  assert.equal(screens[route.cancel](state),true);assertPopulated(paint(state,options),state);assert.equal(screens.homeAppletFooterBannerReady(state),true);
 }));
}

for(const route of routes.slice(0,2))test(`${route.appId} firmware replacement keeps its existing return reset`,async()=>fixture(({screens,paint,openToolbar,closeToolbar,home,replaceFirmware})=>{
 screens.setReducedMotion(true);const state=closeToolbar(openToolbar(boot('health-safety'),route),route),options={receipt:false,present:route.present};
 assertSelectedOnly(paint(state,options),state,home);replaceFirmware();assert.equal(screens[route.present](state,ms(100)),null);
 assertPopulated(paint(state,options),state);assert.equal(screens.homeAppletFooterBannerReady(state),true);
}));

for(const route of routes.slice(2))test(`${route.appId} firmware replacement preserves selected-only return and requires fresh handoff`,async()=>fixture(({screens,paint,openToolbar,closeToolbar,home,replaceFirmware})=>{
 screens.setReducedMotion(false);
 const state=closeToolbar(openToolbar(boot('camera'),route),route),options={present:route.present};
 for(let frame=0;frame<=7;frame++){
  const sample=paint(state,options);assert.equal(sample.result?.[route.key]?.frame,frame);assertSelectedOnly(sample,state,home);
 }
 const stale=paint(state,{...options,receipt:false});assert.equal(stale.result?.[route.key]?.frame,8);assertSelectedOnly(stale,state,home);
 replaceFirmware();
 assert.equal(screens[route.present](state,stale.now),null);assert.equal(screens.homeAppletFooterBannerReady(state),false);
 assert.equal(paint(state,{...options,receipt:false}).result?.[route.key],undefined,'replacement invalidates the old resource receipt');
 assert.equal(screens.homeAppletFooterBannerReady(state),false);
 for(let frame=7;frame<=20;frame++){
  const sample=paint(state,options);assert.deepEqual([sample.result?.[route.key]?.kind,sample.result?.[route.key]?.frame],['in',frame]);assertSelectedOnly(sample,state,home);
  assert.equal(screens.homeAppletFooterBannerReady(state),false);
 }
 const handoff=paint(state,{...options,receipt:false});assert.equal(handoff.result?.[route.key]?.kind,'handoff');
 assertToolbarReveal({screens,paint,home},state,route,handoff);
}));

for(const route of routes.slice(2))test(`${route.appId} replaced outgoing resources reject the stale terminal before selected-only return`,async()=>fixture(({screens,paint,openToolbar,home,replaceResources})=>{
 screens.setReducedMotion(true);const options={present:route.present},entered=openToolbar(boot('camera'),route);
 const held=touch(entered,'down',route.x);paint(held,options);const released=touch(held,'up',route.x);
 assert.equal(paint(released,options).result?.[route.key]?.kind,'feedback');
 const stale=paint(released,{...options,receipt:false});assert.deepEqual([stale.result?.[route.key]?.kind,stale.result?.[route.key]?.frame],['out',20]);
 replaceResources();assert.equal(screens[route.present](released,stale.now),null);
 let identity;
 for(let count=0;count<4;count++){
  const sample=paint(released,options);assert.equal(screens.stockFailure(),null);assertPopulated(sample,released);
  if(sample.identity){assert.equal(sample.result?.[route.key]?.kind,'out');identity=sample.identity;break;}
 }
 assert.ok(identity,'only a freshly bound outgoing terminal can complete');
 const state=route.complete(released,identity,ms(100));
 const incoming=paint(state,options);assert.deepEqual([incoming.result?.[route.key]?.kind,incoming.result?.[route.key]?.frame],['in',20]);assertSelectedOnly(incoming,state,home);
 assert.equal(screens.homeAppletFooterBannerReady(state),false);
 const handoff=paint(state,{...options,receipt:false});assert.equal(handoff.result?.[route.key]?.kind,'handoff');assertPopulated(handoff,state);
 assert.equal(screens.homeAppletFooterBannerReady(state),false);screens[route.present](state,handoff.now);assert.equal(screens.homeAppletFooterBannerReady(state),true);
}));

for(const route of routes)test(`${route.appId} measured reveal is cancelled by new input, reduced motion or firmware replacement`,async()=>fixture(({screens,paint,openToolbar,closeToolbar,home,replaceFirmware})=>{
 screens.setReducedMotion(false);const options={present:route.present};
 const returned=()=>{
  let state=closeToolbar(openToolbar(boot('health-safety'),route),route),sample;
  for(let count=0;count<30;count++){sample=paint(state,{...options,receipt:false});if(sample.result?.[route.key]?.kind==='handoff')break;screens[route.present](state,sample.now);}
  assert.equal(sample.result?.[route.key]?.kind,'handoff');screens[route.present](state,sample.now);
  const first=paint(state,options);assert.equal(first.result?.toolbarReturnReveal?.stage,0);assertSelectedOnly(first,state,home);
  assert.equal(screens.homeAppletFooterBannerReady(state),false);return state;
 };
 let state=returned();
 const moved=settleHomeNavigation(selectHomeSlot(state,Number(Object.entries(state.system.layout).find(([,id])=>id==='camera')[0])));
 const input=paint(moved,options);assert.equal(input.result?.toolbarReturnReveal,undefined);assertPopulated(input,moved);
 assert.equal(screens.homeAppletFooterBannerReady(moved),true);assert.equal(screens.toolbarReturnRevealActive(moved),false);
 state=returned();screens.setReducedMotion(true);
 const reduced=paint(state,options);assert.equal(reduced.result?.toolbarReturnReveal,undefined);assertPopulated(reduced,state);assert.equal(screens.homeAppletFooterBannerReady(state),true);
 screens.setReducedMotion(false);state=returned();replaceFirmware();
 assert.equal(screens.homeAppletFooterBannerReady(state),true);assertPopulated(paint(state,options),state);
}));
