import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { createPortfolioState, tickSystem, invokeSystemApplet, reduceSystem, launchHomeShortcut, dispatchSystemEvent, releaseSystemInputs, touchSystem, completeNotesFooterClose, completeNotificationsFooterClose } from '../src/os/system.ts';
import { enableHomeControls, selectHomeToolbarControlTouch } from '../src/os/home-controls.ts';
import { escapeUnreadyNativeScreen } from '../src/os/native-screen-system.ts';
import { createNativeScreenInputGate } from '../src/os/native-screen-input.ts';

const data=source=>'data:text/javascript;base64,'+Buffer.from(source+'\n//# sourceURL=applet-entry-live-fixture.js').toString('base64');
const sourceUrl=new URL('../src/os/screens.ts',import.meta.url);
const overrides={
 './native-system-presentation':data('export const drawNativeSystemOverlay=()=>false;'),
 './home-suspended-window':data(`export {homeSuspendedApplication,homeSuspendedIconDisappeared,homeSuspendedWindowEntryFrame,retainedSuspendedApplication,selectedSuspendedApplication} from '${new URL('../src/os/home-suspended-window.ts',import.meta.url).href}';export const drawHomeSuspendedWindow=()=>true;`),
 './native-chrome':data('export const createNativeChrome=()=>({ready:Promise.resolve(),draw:()=>true,tile:()=>true});'),
 './home-native-layouts':data('export const createHomeLayoutManager=()=>({});'),
 './firmware-presentation':data('export const createFirmwareHome=a=>a.presenter;export const loadFirmwarePresentationAssets=()=>{};'),
 './portfolio-screens':data('export const setPortfolioFont=()=>{};export const createPortfolioGraphics=()=>globalThis.__appletGraphics;'),
};
const {outputText}=ts.transpileModule(readFileSync(sourceUrl,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const {createScreens}=await import(data(outputText.replace(/(from\s*['"])(\.[^'"]+)(['"])/g,(_all,prefix,path,suffix)=>prefix+(overrides[path]??new URL(path.endsWith('.ts')?path:`${path}.ts`,sourceUrl).href)+suffix)));
const ids=['game-notes','friends','notifications','browser','miiverse'];
const home=(appId='browser',base=tickSystem(createPortfolioState(),3001))=>selectHomeToolbarControlTouch(enableHomeControls(base),ids.indexOf(appId)+1);
const open=(caller,appId='browser')=>invokeSystemApplet(caller,appId,6400);
const ms=step=>10000+step*1000/60+.01;
const sceneSource=readFileSync(new URL('../src/scene/console-scene.ts',import.meta.url),'utf8');
const sceneAst=ts.createSourceFile('console-scene.ts',sceneSource,ts.ScriptTarget.Latest,true);let shortcut;
function findShortcut(node){if(ts.isForOfStatement(node)&&node.getText(sceneAst).includes('skipAppletEntryForAccessibilityShortcut'))shortcut=node;ts.forEachChild(node,findShortcut);}
findShortcut(sceneAst);assert.ok(shortcut);
const shortcutCode=ts.transpileModule(shortcut.getText(sceneAst),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const bindShortcuts=new Function('state','screens','invokeSystemApplet','onCommit',`
 const buttons=[],getTitle=id=>({title:id}),addControl=(title,click)=>buttons.push({title,click});
 const commit=transform=>{state=transform(state,6400);onCommit(state);};
 ${shortcutCode}
 return {buttons,state:()=>state};
`);
let sceneDispatch;
function findDispatch(node){if(ts.isFunctionDeclaration(node)&&node.name?.text==='dispatch')sceneDispatch=node;ts.forEachChild(node,findDispatch);}
findDispatch(sceneAst);assert.ok(sceneDispatch);
const dispatchCode=ts.transpileModule(sceneDispatch.getText(sceneAst),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const bindDispatch=new Function('state','screens','onPaint','createNativeScreenInputGate','dispatchSystemEvent','escapeUnreadyNativeScreen','releaseSystemInputs','tickSystem',`
 let now=state.system.runtime.lastTick+10;const nativeScreenInput=createNativeScreenInputGate(),audio={unlock:()=>Promise.resolve()};
 const commit=transform=>{now+=20;state=tickSystem(state,now);state=transform(state,now);onPaint(state);};
 ${dispatchCode}
 return {dispatch,state:()=>state};
`);

async function fixture(run,withFirmware=true){
 const saved=new Map(['document','Image','FontFace','__appletGraphics'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 const events=[],canvases=[];let status='ready',coverFailure=false,pair,covered=null,notesStep=0,copyReady=true,incomingResources={},incomingAvailable=true,incomingFailure=false,preparedOwner;
 function canvas(){
  const surface={width:0,height:0};
  const ctx=new Proxy({canvas:surface,globalAlpha:1,record(name,args=[]){events.push({name,args,ctx});},drawImage(...args){ctx.record('drawImage',args);},createLinearGradient:()=>({addColorStop(){}}),getImageData(_x,_y,w,h){return {width:w,height:h,data:new Uint8ClampedArray(w*h*4)};}},{get:(target,key)=>key in target?target[key]:(()=>{})});
  surface.getContext=()=>ctx;canvases.push(surface);return surface;
 }
 const graphics={ready:Promise.resolve(),selectedApp(){},syncStockView(){},readSuspendedCapture(runtime){return {status:'ready',owner:runtime.application,generation:1};},
  stockStatus(state){return state.system.phase==='app'&&state.system.runtime.instances[state.system.runtime.active]?.appId==='game-notes'&&status==='ready'&&notesStep<21?'loading':status;},
  stockFailure:()=>status==='error'?Error('Destination failed'):null,retryStockScreen(){status='ready';pair=undefined;return true;},
  preparedStockPair:()=>pair,notesFooterCloseResources:()=>pair?incomingResources:undefined,notificationsFooterCloseResources:()=>pair&&incomingAvailable?incomingResources:undefined,setAppletEntryCovered(owner){covered=owner;events.push({name:'covered',args:[owner]});},
  appletIncomingResources(state){const owner=state.system.runtime.active,appId=state.system.runtime.instances[owner]?.appId;return pair&&preparedOwner===owner&&incomingAvailable&&['friends','notifications'].includes(appId)?incomingResources:undefined;},
  drawAppletIncoming(state,t,b,frame,resources){if(!pair||preparedOwner!==state.system.runtime.active||resources!==incomingResources||!incomingAvailable||incomingFailure)return false;t.record('incoming-upper',[frame,resources]);b.record('incoming-lower',[frame,resources]);return true;},
  revokeNotesBootCoverCandidate(){events.push({name:'notes-revoke',args:[]});},
  presentNotesBootCover(state){if(covered||status!=='ready'||state.system.runtime.instances[state.system.runtime.active]?.appId!=='game-notes')return false;notesStep++;return true;},
  notesBootCoverActive:()=>notesStep<21,banner(){},menuIcon(){},menuArtwork(){},
  overlay(t,b,state,_time,_reduced,_native,_date,_verification,_defer,notesClose,notificationsClose){pair=status==='ready'&&copyReady?{}:undefined;preparedOwner=state.system.runtime.active;t.record('destination-upper');b.record('destination-lower');if(notesClose)t.record('notes-close',[notesClose]);if(notificationsClose)t.record('notifications-feedback',[notificationsClose]);if(state.system.runtime.instances[state.system.runtime.active]?.appId==='game-notes')t.record('notes-step',[notesStep,covered]);},dispose(){pair=undefined;},
 };
 Object.assign(globalThis,{document:{createElement:canvas,fonts:{add(){}}},Image:class {decode(){return Promise.resolve();}},FontFace:class {load(){return Promise.resolve(this);}},__appletGraphics:graphics});
 const presenter=new Proxy({pressOffset:0,tilePressOffset:()=>0,folderChild(_ctx,_state,_empty,draw){draw(1);return true;},notesFooterReturnLabel:()=>({text:'HOME Menu'}),notesFooterReturn(t,b,frame){t.record('notes-return-upper',[frame]);b.record('notes-return-lower',[frame]);return !coverFailure;},notificationsFooterCover(t,b,kind,frame){t.record('notifications-'+kind+'-upper',[frame]);b.record('notifications-'+kind+'-lower',[frame]);return !coverFailure;},appletEntry(t,b,pose){const name=pose.phase==='in'?'common-incoming':'cover';t.record(name+'-upper',[pose]);b.record(name+'-lower',[pose]);return !coverFailure;}},{get:(target,key)=>key in target?target[key]:()=>true});
 const assets=()=>({presenter,sharedFont:{draw(){}},dispose(){},diagnostics:[],titleIcons:new Map([['0004001000022400',{}]]),titleDescriptions:new Map([['0004001000022400','Nintendo 3DS Camera']])});
 const screens=createScreens({firmwareAssets:withFirmware?assets():undefined,drawHomeBackground:()=>true,drawSuspendedBackground:()=>true});
 const paint=(state,step,receipt=true,verification)=>{
  events.length=0;const result=screens.paint(state,new Date(0),ms(step),verification);
  if(receipt)screens.presentAppletEntry(state,ms(step));return result;
 };
 try{await screens.ready;await run({screens,paint,events,canvases,assets,graphics,setStatus(value){status=value;if(value!=='ready')pair=undefined;},failCover:value=>coverFailure=value,setCopyReady:value=>copyReady=value,setIncomingAvailable:value=>incomingAvailable=value,failIncoming:value=>incomingFailure=value,replaceIncomingResources(){incomingResources={};},replacePair(){pair={};},notesStep:()=>notesStep,covered:()=>covered});}
 finally{screens.dispose();for(const [key,descriptor]of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}}
}

test('actual Notifications first/repeat footer retains both list LCDs under the common HOME cover and gates fresh HOME handoff',async()=>{
 await fixture(({screens,paint,events,setCopyReady,setIncomingAvailable,replaceIncomingResources})=>{
  let homeState=home('notifications'),previousOwner;
  for(let cycle=0;cycle<2;cycle++){
   let state=open(homeState,'notifications'),step=cycle*200;
   screens.skipAppletEntryForAccessibilityShortcut(state);paint(state,step++);
   const owner=state.system.runtime.active;assert.notEqual(owner,previousOwner);
   state=touchSystem(state,160,226,6401);
   const receipt=(kind,frame)=>{
    const result=paint(state,step,false);
    assert.deepEqual(result?.notificationsClose,{kind,frame,owner,adaptation:true},String(screens.stockFailure()));
    assert.equal(result.notesClose,undefined);
    if(kind==='out'||kind==='in'){
     const upper=events.findIndex(e=>e.name==='notifications-'+kind+'-upper'),lower=events.findIndex(e=>e.name==='notifications-'+kind+'-lower');
     assert.ok(upper>events.findIndex(e=>e.name==='destination-lower'));assert.ok(lower>upper);
     assert.deepEqual(events[upper].args,[frame]);
    }
    return screens.presentNotificationsFooterClose(state,ms(step++));
   };
   receipt('feedback',0);receipt('feedback',1);
   if(cycle===0){
    setCopyReady(false);assert.equal(paint(state,step++,false)?.notificationsClose,undefined);
    assert.equal(screens.presentNotificationsFooterClose(state,ms(step)),null);assert.ok(state.system.runtime.instances[owner]);
    setCopyReady(true);setIncomingAvailable(false);assert.equal(paint(state,step++,false)?.notificationsClose,undefined);
    setIncomingAvailable(true);replaceIncomingResources();assert.equal(paint(state,step++,false)?.notificationsClose,undefined);
    receipt('feedback',0);receipt('feedback',1);
   }
   for(let frame=0;frame<20;frame++){assert.equal(receipt('out',frame),null);assert.ok(state.system.runtime.instances[owner]);}
   const terminal=paint(state,step,false);assert.equal(terminal.notificationsClose.frame,20);
   screens.revokeNotesFooterCloseCandidate();assert.equal(screens.presentNotificationsFooterClose(state,ms(step++)),null);
   receipt('out',19);assert.equal(receipt('out',20),owner);
   state=completeNotificationsFooterClose(state,owner,ms(step));assert.equal(state.system.runtime.instances[owner],undefined);
   for(let frame=0;frame<=20;frame++){assert.equal(receipt('in',frame),null);assert.equal(screens.homeAppletFooterBannerReady(state),false);}
   assert.equal(screens.stockStatus(state),'loading');receipt('handoff',null);
   assert.equal(screens.homeAppletFooterBannerReady(state),true);
   assert.equal(screens.notificationsFooterCloseActive(state),false);
   assert.equal(paint(state,step++)?.notificationsClose,undefined);assert.equal(screens.stockStatus(state),'ready');
   homeState=state;previousOwner=owner;
  }
 });
});

test('Notifications outgoing/incoming cover failure retains a recoverable owner or HOME and retry/B/HOME remain available',async()=>{
 for(const failing of ['out','in'])await fixture(({screens,paint,failCover})=>{
  let state=open(home('notifications'),'notifications');screens.skipAppletEntryForAccessibilityShortcut(state);paint(state,0);
  state=touchSystem(state,160,226,6401);screens.setReducedMotion(true);
  paint(state,1,false);screens.presentNotificationsFooterClose(state,ms(1));
  if(failing==='in'){
   paint(state,2,false);const owner=screens.presentNotificationsFooterClose(state,ms(2));assert.equal(owner,state.system.runtime.active);
   state=completeNotificationsFooterClose(state,owner,ms(2));
  }
  failCover(true);paint(state,3,false);
  assert.match(screens.stockFailure().message,/Notifications HOME cover/);assert.equal(screens.stockStatus(state),'error');
  assert.equal(screens.homeAppletFooterBannerReady(state),false);
  assert.equal(screens.presentNotificationsFooterClose(state,ms(3)),null);
  if(failing==='out')assert.equal(state.system.runtime.instances[state.system.runtime.active].appId,'notifications');
  else assert.equal(state.system.phase,'home');
  failCover(false);assert.equal(screens.retryStockScreen(),true);paint(state,4,false);assert.equal(screens.stockFailure(),null);
  if(failing==='out')screens.presentNotificationsFooterClose(state,ms(4));
  failCover(true);paint(state,5,false);
  const binding=bindDispatch(state,screens,next=>paint(next,6),createNativeScreenInputGate,dispatchSystemEvent,escapeUnreadyNativeScreen,releaseSystemInputs,tickSystem);
  binding.dispatch({type:'command',command:'home'});
  assert.equal(binding.state().system.phase,'home');assert.equal(screens.stockStatus(binding.state()),'ready');
  assert.equal(screens.homeAppletFooterBannerReady(binding.state()),true);
 });
});

test('Notifications post-paint firmware or title-renderer replacement rejects the old outgoing endpoint and accepts only fresh stable publication',async()=>{
 for(const replacement of ['firmware','renderer'])await fixture(({screens,paint,assets,replaceIncomingResources})=>{
  let state=open(home('notifications'),'notifications');screens.skipAppletEntryForAccessibilityShortcut(state);paint(state,0);
  state=touchSystem(state,160,226,6401);screens.setReducedMotion(true);const owner=state.system.runtime.active;
  paint(state,1,false);screens.presentNotificationsFooterClose(state,ms(1));
  assert.deepEqual(paint(state,2,false).notificationsClose,{kind:'out',frame:20,owner,adaptation:true});
  if(replacement==='firmware')screens.setFirmwareAssets(assets());else replaceIncomingResources();
  assert.equal(screens.presentNotificationsFooterClose(state,ms(2)),null);
  assert.equal(state.system.runtime.active,owner);assert.equal(state.system.runtime.instances[owner].state.notificationsFooterClose,true);
  let completed=null;const fresh=[];
  for(let step=3;step<8&&!completed;step++){
   const result=paint(state,step,false);if(result?.notificationsClose)fresh.push(result.notificationsClose.kind);
   completed=screens.presentNotificationsFooterClose(state,ms(step));
  }
  assert.deepEqual(fresh,['feedback','out'],replacement+': '+String(screens.stockFailure()));assert.equal(completed,owner,replacement);
  state=completeNotificationsFooterClose(state,completed,ms(8));assert.equal(state.system.phase,'home');assert.equal(state.system.runtime.instances[owner],undefined);
 });
});

test('Notifications hidden/stalled publication and disposed screens cannot complete a prepared outgoing endpoint',async()=>{
 await fixture(({screens,paint})=>{
  let state=open(home('notifications'),'notifications');screens.skipAppletEntryForAccessibilityShortcut(state);paint(state,0);
  state=touchSystem(state,160,226,6401);screens.setReducedMotion(true);const owner=state.system.runtime.active;
  paint(state,1,false);screens.presentNotificationsFooterClose(state,ms(1));
  assert.equal(paint(state,2,false).notificationsClose.frame,20);
  document.hidden=true;assert.equal(screens.presentNotificationsFooterClose(state,ms(2)),null);document.hidden=false;
  screens.revokeNotesFooterCloseCandidate();
  assert.equal(paint(state,1000,false).notificationsClose.kind,'feedback');
  assert.equal(screens.presentNotificationsFooterClose(state,ms(1000)),null);
  paint(state,1001,false);screens.dispose();
  assert.equal(screens.presentNotificationsFooterClose(state,ms(1001)),null);assert.ok(state.system.runtime.instances[owner]);
 });
});

test('actual Notes footer compositor retains the owner through out20 and accepts a fresh HOME handoff after in20',async()=>{
 await fixture(({screens,paint,events,setStatus})=>{
  let state=open(home('game-notes'),'game-notes');
  assert.equal(screens.skipAppletEntryForAccessibilityShortcut(state),true);
  for(let step=0;step<=21;step++){paint(state,step);screens.presentNotesBootCover(state);}
  const owner=state.system.runtime.active;
  state=touchSystem(state,160,226,6401);
  assert.equal(state.system.runtime.active,owner);
  let step=30;
  const receipt=(expectedKind,frame)=>{
   const result=paint(state,step,false);
   assert.deepEqual(result?.notesClose,{kind:expectedKind,frame,owner,adaptation:true},String(screens.stockFailure()));
   assert.equal(screens.notesFooterCloseActive(state),true);
   if(expectedKind==='in')assert.equal(events.filter(e=>e.name.startsWith('notes-return-')).length,2);
   const completed=screens.presentNotesFooterClose(state,ms(step++));
   return completed;
  };
  receipt('feedback',0);receipt('feedback',1);
  setStatus('error');paint(state,step++);
  assert.ok(state.system.runtime.instances[owner]);
  assert.equal(screens.presentNotesFooterClose(state,ms(step)),null);
  setStatus('ready');
  // A failure interval repeats the accepted feedback pose before advancing.
  receipt('feedback',1);
  for(let frame=0;frame<20;frame++){assert.equal(receipt('out',frame),null);assert.ok(state.system.runtime.instances[owner]);}
  const endpoint=paint(state,step,false);
  assert.equal(endpoint.notesClose.frame,20);assert.ok(state.system.runtime.instances[owner]);
  screens.revokeNotesFooterCloseCandidate();
  assert.equal(screens.presentNotesFooterClose(state,ms(step++)),null);
  assert.equal(receipt('out',19),null);
  assert.equal(receipt('out',20),owner);
  state=completeNotesFooterClose(state,owner,ms(step));
  assert.equal(state.system.runtime.instances[owner],undefined);
  for(let frame=0;frame<=20;frame++){assert.equal(receipt('in',frame),null);assert.equal(screens.homeAppletFooterBannerReady(state),false);}
  assert.equal(screens.stockStatus(state),'loading','covered HOME cannot accept ordinary input');
  receipt('handoff',null);
  assert.equal(screens.homeAppletFooterBannerReady(state),true);
  assert.equal(screens.notesFooterCloseActive(state),false);
  assert.equal(paint(state,step)?.notesClose,undefined);
  assert.equal(screens.stockStatus(state),'ready');
 });
});

test('failed Notes HOME return remains explicit and B/HOME recovery can abandon its unavailable cover',async()=>{
 await fixture(({screens,paint,failCover})=>{
  let state=open(home('game-notes'),'game-notes');screens.skipAppletEntryForAccessibilityShortcut(state);
  for(let step=0;step<=21;step++){paint(state,step);screens.presentNotesBootCover(state);}
  state=touchSystem(state,160,226,6401);screens.setReducedMotion(true);
  paint(state,30,false);assert.equal(screens.presentNotesFooterClose(state,ms(30)),null);
  paint(state,31,false);const owner=screens.presentNotesFooterClose(state,ms(31));assert.ok(owner);
  state=completeNotesFooterClose(state,owner,ms(31));
  failCover(true);paint(state,32,false);assert.match(screens.stockFailure().message,/Notes HOME return/);
  assert.equal(screens.homeAppletFooterBannerReady(state),false);
  assert.equal(screens.stockStatus(state),'error');assert.equal(screens.presentNotesFooterClose(state,ms(32)),null);
  assert.equal(screens.cancelNotesFooterClose(state),true);failCover(false);
  paint(state,33);assert.equal(screens.notesFooterCloseActive(state),false);assert.equal(screens.stockStatus(state),'ready');
  assert.equal(screens.homeAppletFooterBannerReady(state),true);
 });
});

for(const appId of ids)test(`${appId} outgoing cover requires a matching presented HOME pair then all source poses and a destination receipt`,async()=>{
 await fixture(({screens,paint,events,setStatus})=>{
  const caller=home(appId),state=open(caller,appId);paint(caller,0);setStatus('loading');
  assert.equal(screens.homeAppletFooterBannerReady(state),true);
  for(let frame=0;frame<=20;frame++){
   const result=paint(state,frame+1);assert.ok(result,String(screens.stockFailure()));
   assert.deepEqual(result.appletEntry,{kind:'cover',frame,owner:state.system.runtime.active});
   assert.equal(events.filter(e=>e.name.startsWith('cover-')).length,2);assert.equal(screens.stockStatus(state),'loading');
  }
  assert.equal(screens.appletEntryActive(state),false);assert.equal(paint(state,22).appletEntry.frame,20);
  setStatus('ready');assert.equal(paint(state,23).appletEntry.frame,20,'the pair must be prepared before release is selected');
  let handoffStep=24;
  if(['friends','notifications','browser','miiverse'].includes(appId)){
   for(let frame=0;frame<=20;frame++){
    const result=paint(state,24+frame,false);assert.deepEqual(result.appletEntry,{kind:'incoming',frame,owner:state.system.runtime.active});
    const prefix=['friends','notifications'].includes(appId)?'incoming-':'common-incoming-';
    assert.equal(events.filter(e=>e.name.startsWith(prefix)).length,2);assert.equal(events.some(e=>e.name.startsWith('cover-')),false);
    assert.equal(screens.stockStatus(state),'loading');assert.equal(screens.presentAppletEntry(state,ms(24+frame)),true);
   }
   handoffStep=45;
  }
  const handoff=paint(state,handoffStep,false);assert.deepEqual(handoff.appletEntry,{kind:'handoff',frame:null,owner:state.system.runtime.active});
  assert.equal(events.some(e=>e.name.startsWith('cover-')),false);assert.equal(screens.stockStatus(state),'loading');
  assert.equal(screens.presentAppletEntry(state,ms(handoffStep)),true);assert.equal(screens.appletEntryActive(state),false);
  assert.equal(screens.stockStatus(state),appId==='game-notes'?'loading':'ready');
 });
});

test('offscreen HOME, wrong toolbar, runtime application and firmware generation never supply a substituted backing',async()=>{
 await fixture(({screens,paint,assets})=>{
  const caller=home(),state=open(caller);paint(caller,0,false);assert.equal(paint(state,1),undefined);
  assert.match(String(screens.stockFailure()),/matching presented HOME pair/);
  paint(home('friends'),2);assert.equal(paint(state,3),undefined);assert.match(String(screens.stockFailure()),/matching presented HOME pair/);
  paint(caller,4);paint(state,5);assert.equal(screens.stockStatus(state),'loading');
  screens.setFirmwareAssets(assets());assert.equal(paint(state,6),undefined);assert.match(String(screens.stockFailure()),/matching presented HOME pair/);
  paint(caller,7);assert.equal(paint(state,8).appletEntry.frame,0);
  const camera=tickSystem(launchHomeShortcut(tickSystem(createPortfolioState(),3001),'camera',3010),6200);
  const suspended=home('friends',reduceSystem(camera,'home',6300)),withApplication=open(suspended);
  assert.equal(paint(withApplication,9),undefined);assert.match(String(screens.stockFailure()),/matching presented HOME pair/);
 });
});

test('absent original HOME common resources fail explicitly rather than publishing a rebuilt applet cover',async()=>{
 await fixture(({screens,paint})=>{
  const caller=home(),state=open(caller);paint(caller,0);assert.equal(paint(state,1),undefined);
  assert.equal(screens.stockStatus(state),'error');assert.match(String(screens.stockFailure()),/Native applet entry cover unavailable/);
  assert.equal(screens.appletEntryActive(state),false);
 },false);
});

test('Notes prepared pair bypasses only its local readiness barrier; the hidden controller receives no receipts even at source20',async()=>{
 await fixture(({screens,paint,notesStep,events,covered})=>{
  const caller=home('game-notes'),state=open(caller,'game-notes');paint(caller,0);
  for(let frame=0;frame<=20;frame++){
   assert.equal(paint(state,frame+1).appletEntry.frame,frame);
   assert.equal(covered(),state.system.runtime.active);assert.equal(screens.presentNotesBootCover(state),false);
   assert.equal(notesStep(),0);assert.equal(screens.notesBootCoverActive(state),false);
   assert.equal(events.find(e=>e.name==='notes-step').args[0],0);
  }
  const result=paint(state,22,false);assert.equal(result.appletEntry.kind,'handoff');assert.equal(covered(),null);
  assert.equal(screens.presentNotesBootCover(state),false,'the destination paint still lacks its own common handoff receipt');
  assert.equal(screens.presentAppletEntry(state,ms(22)),true);assert.equal(screens.presentNotesBootCover(state),true);
  assert.equal(notesStep(),1);assert.equal(screens.stockStatus(state),'loading');assert.equal(screens.notesBootCoverActive(state),true);
  for(let step=23;step<43;step++){paint(state,step);screens.presentNotesBootCover(state);}
  assert.equal(screens.stockStatus(state),'ready');assert.equal(notesStep(),21);
 });
});

test('a failed destination paint or replaced prepared token retains and rebases source20 instead of acknowledging hidden Notes',async()=>{
 await fixture(({screens,paint,events,setCopyReady,replacePair,notesStep,covered})=>{
  const caller=home('game-notes'),state=open(caller,'game-notes');screens.setReducedMotion(true);paint(caller,0);paint(state,1);
  setCopyReady(false);assert.equal(paint(state,2,false),undefined);assert.equal(covered(),state.system.runtime.active);
  assert.equal(events.filter(e=>e.name==='cover-upper').at(-1).args[0].frame,20,'failed fresh destination copies retain the opaque source cover without a candidate');
  assert.equal(screens.presentNotesBootCover(state),false);assert.equal(notesStep(),0);assert.equal(screens.presentAppletEntry(state,ms(2)),false);
  setCopyReady(true);assert.equal(paint(state,3).appletEntry.frame,20);
  assert.equal(paint(state,4,false).appletEntry.kind,'handoff');replacePair();assert.equal(screens.presentAppletEntry(state,ms(4)),false);
  assert.equal(screens.presentNotesBootCover(state),false);assert.equal(notesStep(),0);
  assert.equal(paint(state,5).appletEntry.frame,20);assert.equal(paint(state,6).appletEntry.kind,'handoff');
  assert.equal(screens.presentNotesBootCover(state),true);
 });
});

test('loading and explicit source/title failures quarantine A/touch while retaining B, HOME, power and retry',async()=>{
 await fixture(({screens,paint,failCover,setStatus})=>{
  const caller=home(),state=open(caller);paint(caller,0);paint(state,1);
  const gate=createNativeScreenInputGate(),status=screens.stockStatus(state);
  for(const event of [{type:'command',command:'open'},{type:'action',id:'profile'},{type:'touch',phase:'down',x:100,y:80,pointerId:1}])assert.equal(gate(event,status),'block');
  for(const command of ['back','home'])assert.equal(gate({type:'command',command},status),'home');
  assert.equal(gate({type:'command',command:'power'},status),'pass');
  const escaped=escapeUnreadyNativeScreen(state,6500);assert.equal(escaped.system.phase,'home');assert.equal(escaped.system.runtime.systemApplet,state.system.runtime.active);assert.equal(escaped.system.runtime.instances[state.system.runtime.active].suspended,true);
  failCover(true);assert.equal(paint(state,2),undefined);assert.equal(screens.stockStatus(state),'error');assert.equal(screens.appletEntryActive(state),false);
  assert.equal(gate({type:'command',command:'open'},screens.stockStatus(state)),'retry');
  failCover(false);assert.equal(screens.retryStockScreen(),true);assert.equal(paint(state,3).appletEntry.frame,0);
  setStatus('error');paint(state,4);assert.equal(screens.stockStatus(state),'error');assert.equal(screens.appletEntryActive(state),false);
  assert.equal(screens.retryStockScreen(),true);assert.equal(paint(state,5).appletEntry.frame,0);
 });
});

test('invalid publication, hidden/sleep, diagnostic and clock stalls repeat the last visible source pose',async()=>{
 await fixture(({screens,paint})=>{
  const caller=home(),state=open(caller);paint(caller,0);paint(state,1);paint(state,2);
  assert.equal(paint(state,3,false).appletEntry.frame,2);screens.revokeAppletEntryCandidate();assert.equal(screens.presentAppletEntry(state,ms(4)),false);
  assert.equal(paint(state,4).appletEntry.frame,1);assert.equal(paint(state,5).appletEntry.frame,2);
  const asleep={...state,system:{...state.system,sleeping:true}};paint(asleep,6,false);assert.equal(screens.presentAppletEntry(asleep,ms(6)),false);
  assert.equal(paint(state,7).appletEntry.frame,2);
  screens.paint(state,new Date(0),ms(8),{sampleCalendar:true});assert.equal(screens.presentAppletEntry(state,ms(8)),false);
  assert.equal(paint(state,9).appletEntry.frame,2);assert.equal(paint(state,500).appletEntry.frame,2);assert.equal(paint(state,501).appletEntry.frame,3);
 });
});

test('HOME return/resume retains an unfinished owner, completed resume does not replay, and reopen receives source0',async()=>{
 await fixture(({screens,paint})=>{
  const caller=home(),state=open(caller);paint(caller,0);paint(state,1);paint(state,2);paint(state,3,false);
  const suspended=reduceSystem(state,'home',6500);paint(suspended,4);
  assert.equal(screens.presentAppletEntry(state,ms(5)),false);
  const resumed=reduceSystem(suspended,'home',6600);assert.equal(resumed.system.runtime.active,state.system.runtime.active);
  assert.equal(paint(resumed,6).appletEntry.frame,1);screens.setReducedMotion(true);
  assert.equal(paint(resumed,7).appletEntry.frame,20);assert.equal(paint(resumed,8).appletEntry.kind,'incoming');
  assert.equal(paint(resumed,9).appletEntry.kind,'handoff');
  const completedHome=reduceSystem(resumed,'home',6700);paint(completedHome,10);
  const completedResume=reduceSystem(completedHome,'home',6800);assert.equal(paint(completedResume,11),undefined);assert.equal(screens.stockStatus(completedResume),'ready');
  const closed=home('browser',escapeUnreadyNativeScreen(completedResume,6900));paint(closed,12);screens.setReducedMotion(false);
  const reopened=open(closed);assert.notEqual(reopened.system.runtime.active,state.system.runtime.active);assert.equal(paint(reopened,13).appletEntry.frame,0);
 });
});

test('fresh observations accept stale rAF timestamps for normal/reduced cycles; invalid clocks recover and dispose clears backing',async()=>{
 await fixture(({screens,paint,canvases})=>{
  let caller=home();screens.setReducedMotion(true);
  for(let cycle=0;cycle<2;cycle++){
   const state=open(caller),step=cycle*10;paint(caller,step);
   const sample=(raf,fresh)=>screens.paint(state,new Date(0),ms(raf),{manualEntryObservedElapsedMs:ms(fresh)});
   assert.equal(sample(step+1,step+2).appletEntry.frame,20);assert.equal(screens.presentAppletEntry(state,ms(step+3)),true);
   assert.equal(sample(step+2,step+4).appletEntry.kind,'incoming');assert.equal(sample(step+3,step+5).appletEntry.kind,'incoming');
   assert.equal(screens.stockStatus(state),'loading');assert.equal(screens.presentAppletEntry(state,ms(step+6)),true);
   assert.equal(sample(step+4,step+7).appletEntry.kind,'handoff');assert.equal(screens.presentAppletEntry(state,ms(step+8)),true);assert.equal(screens.stockStatus(state),'ready');
   caller=home('browser',escapeUnreadyNativeScreen(state,6500+cycle*100));
  }
  screens.setReducedMotion(false);paint(caller,21);const next=open(caller);
  assert.equal(screens.paint(next,new Date(0),ms(22),{manualEntryObservedElapsedMs:NaN}),undefined);assert.equal(screens.stockStatus(next),'error');
  screens.dispose();assert.ok(canvases.slice(7,11).every(c=>c.width===0&&c.height===0));assert.equal(screens.presentAppletEntry(next,ms(23)),false);
 });
});

test('actual sr-only callback preserves arbitrary-focus direct opens without inventing a HOME pair; visual reopen cannot inherit its skip',async()=>{
 for(const appId of ids)await fixture(({screens,paint,events,setStatus})=>{
  const initial=tickSystem(createPortfolioState(),3001),buttons=bindShortcuts(initial,screens,invokeSystemApplet,state=>paint(state,1));
  buttons.buttons.find(button=>button.title===`Open ${appId}`).click();const state=buttons.state();
  assert.equal(state.system.runtime.instances[state.system.runtime.active].appId,appId);assert.equal(screens.stockFailure(),null);
  assert.equal(events.some(e=>e.name.startsWith('cover-')),false);assert.equal(screens.appletEntryActive(state),false);
  assert.equal(screens.stockStatus(state),appId==='game-notes'?'loading':'ready','Notes retains its own boot input quarantine');
  setStatus('error');paint(state,2);assert.equal(screens.stockStatus(state),'error');screens.retryStockScreen();paint(state,3);
  assert.equal(screens.stockFailure(),null);
  const returned=escapeUnreadyNativeScreen(state,6500);paint(returned,4);
  const other=open(returned,appId==='friends'?'browser':'friends');assert.equal(paint(other,5),undefined);assert.match(String(screens.stockFailure()),/matching presented HOME pair/);
 });
 await fixture(({screens,paint,assets})=>{
  const initial=home('browser'),state=open(initial,'friends');assert.equal(screens.skipAppletEntryForAccessibilityShortcut(state),true);paint(state,1);assert.equal(screens.stockFailure(),null);
  screens.setFirmwareAssets(assets());assert.equal(paint(state,2),undefined);assert.match(String(screens.stockFailure()),/matching presented HOME pair/);
 });
 const visualSource=sceneSource.replace(shortcut.getText(sceneAst),'');assert.equal(visualSource.includes('skipAppletEntryForAccessibilityShortcut('),false,'no physical/touch/keyboard adapter invokes this accessibility exception');
});

for(const appId of ['friends','notifications'])test(`${appId} incoming paired publication, resource loss and retry never expose an unguarded destination`,async()=>{
 await fixture(({screens,paint,events,setIncomingAvailable,replaceIncomingResources,setCopyReady,failIncoming})=>{
  const caller=home(appId),state=open(caller,appId);paint(caller,0);screens.setReducedMotion(true);
  assert.equal(paint(state,1).appletEntry.frame,20);
  assert.equal(paint(state,2,false).appletEntry.kind,'incoming');
  assert.equal(screens.stockStatus(state),'loading');
  screens.revokeAppletEntryCandidate();assert.equal(screens.presentAppletEntry(state,ms(2)),false);
  const rebased=paint(state,3);assert.equal(rebased.appletEntry.kind,'cover');
  const terminal=paint(state,4,false);assert.equal(terminal.appletEntry.kind,'incoming');assert.equal(terminal.appletEntry.frame,20);
  replaceIncomingResources();assert.equal(screens.presentAppletEntry(state,ms(4)),false);
  assert.equal(screens.stockStatus(state),'loading');
  assert.equal(paint(state,5).appletEntry.kind,'cover');
  setIncomingAvailable(false);paint(state,6,false);
  assert.equal(events.filter(e=>e.name==='cover-upper').at(-1).args[0].frame,20);
  assert.equal(events.some(e=>e.name.startsWith('incoming-')),false);assert.equal(screens.stockStatus(state),'loading');
  setIncomingAvailable(true);paint(state,7);paint(state,8);
  setCopyReady(false);paint(state,9,false);
  assert.equal(events.some(e=>e.name==='cover-upper'),true);assert.equal(screens.stockStatus(state),'loading');
  setCopyReady(true);paint(state,10);paint(state,11);
  failIncoming(true);screens.revokeAppletEntryCandidate();paint(state,12);paint(state,13);
  assert.equal(screens.stockStatus(state),'error');assert.match(String(screens.stockFailure()),/incoming paired cover unavailable/);
  failIncoming(false);assert.equal(screens.retryStockScreen(),true);paint(state,14);paint(state,15);paint(state,16);
  assert.equal(screens.stockStatus(state),'ready');
});
});

for(const appId of ['browser','miiverse'])test(`${appId} common incoming overlays the prepared destination and rejects stale, missing or failed pairs`,async()=>{
 await fixture(({screens,paint,events,replacePair,setCopyReady,failCover})=>{
  const caller=home(appId),state=open(caller,appId);paint(caller,0);screens.setReducedMotion(true);
  assert.equal(paint(state,1).appletEntry.frame,20);
  const incoming=paint(state,2,false);assert.deepEqual(incoming.appletEntry,{kind:'incoming',frame:20,owner:state.system.runtime.active});
  const destinationIndex=events.findIndex(event=>event.name==='destination-upper');
  const incomingIndex=events.findIndex(event=>event.name==='common-incoming-upper');
  assert.ok(destinationIndex>=0&&incomingIndex>destinationIndex,'the source SceneIn overlays the freshly prepared destination');
  assert.equal(events.some(event=>event.name.startsWith('incoming-')),false,'title-owned incoming is not used');
  replacePair();assert.equal(screens.presentAppletEntry(state,ms(2)),false,'a replaced prepared pair cannot acknowledge old pixels');
  assert.equal(paint(state,3).appletEntry.kind,'cover');
  setCopyReady(false);assert.equal(paint(state,4,false),undefined);
  assert.equal(events.filter(event=>event.name==='cover-upper').at(-1).args[0].frame,20);
  assert.equal(screens.presentAppletEntry(state,ms(4)),false);
  setCopyReady(true);assert.equal(paint(state,5).appletEntry.frame,20);
  failCover(true);assert.equal(paint(state,6),undefined);
  assert.equal(screens.stockStatus(state),'error');assert.match(String(screens.stockFailure()),/common incoming paired cover unavailable/);
  failCover(false);assert.equal(screens.retryStockScreen(),true);
  assert.equal(paint(state,7).appletEntry.frame,20);assert.equal(paint(state,8).appletEntry.kind,'incoming');
  assert.equal(paint(state,9).appletEntry.kind,'handoff');assert.equal(screens.stockStatus(state),'ready');
 });
});

for(const appId of ['friends','notifications'])test(`${appId} incoming visibility and HOME resume preserve the last acknowledged pose before reduced handoff`,async()=>{
 await fixture(({screens,paint,events})=>{
  const caller=home(appId),state=open(caller,appId);paint(caller,0);
  for(let frame=0;frame<=20;frame++)assert.equal(paint(state,frame+1).appletEntry.frame,frame);
  assert.deepEqual(paint(state,22).appletEntry,{kind:'incoming',frame:0,owner:state.system.runtime.active});
  assert.equal(paint(state,23).appletEntry.frame,1);
  const sleeping={...state,system:{...state.system,sleeping:true}};
  paint(sleeping,24,false);assert.equal(screens.presentAppletEntry(sleeping,ms(24)),false);
  assert.equal(paint(state,25).appletEntry.frame,1,'sleep did not consume a hidden source pose');
  const suspended=reduceSystem(state,'home',6500);paint(suspended,26);
  assert.equal(screens.presentAppletEntry(state,ms(26)),false);
  const resumed=reduceSystem(suspended,'home',6600);assert.equal(resumed.system.runtime.active,state.system.runtime.active);
  assert.equal(paint(resumed,27),undefined,'the first resumed body pair has not yet supplied a selected incoming resource');
  assert.equal(events.filter(e=>e.name==='cover-upper').at(-1).args[0].frame,20);assert.equal(screens.presentAppletEntry(resumed,ms(27)),false);
  assert.equal(paint(resumed,28).appletEntry.frame,1,'the retained owner and unchanged resources resume from their acknowledged source pose');
  assert.equal(paint(resumed,29).appletEntry.frame,2);
  paint(resumed,30,false,{sampleCalendar:true});assert.equal(screens.presentAppletEntry(resumed,ms(30)),false);
  assert.equal(paint(resumed,31).appletEntry.frame,2,'diagnostic paint cannot consume motion');
  screens.setReducedMotion(true);const endpoint=paint(resumed,32,false);
  assert.deepEqual(endpoint.appletEntry,{kind:'incoming',frame:20,owner:state.system.runtime.active});
  assert.equal(events.filter(e=>e.name.startsWith('incoming-')).length,2);assert.equal(screens.stockStatus(resumed),'loading');
  assert.equal(screens.presentAppletEntry(resumed,ms(32)),true);assert.equal(screens.stockStatus(resumed),'loading');
  const handoff=paint(resumed,33,false);assert.equal(handoff.appletEntry.kind,'handoff');
  assert.equal(screens.presentAppletEntry(resumed,ms(33)),true);assert.equal(screens.stockStatus(resumed),'ready');
  paint(reduceSystem(resumed,'home',6700),34);assert.equal(paint(reduceSystem(reduceSystem(resumed,'home',6700),'home',6800),35),undefined);
 });
});

for(const suspended of [false,true])for(const activation of ['second touch','keyboard A','physical A'])test(`actual scene ${activation} after toolbar selection waits for a fresh HOME render receipt, suspended=${suspended}`,async()=>{
 await fixture(({screens,paint})=>{
  const awake=tickSystem(createPortfolioState(),3001),camera=tickSystem(launchHomeShortcut(awake,'camera',3010),6200);
  const initial=enableHomeControls(suspended?reduceSystem(camera,'home',6300):awake);let step=0;
  paint(initial,step++);
  const host=bindDispatch(initial,screens,state=>paint(state,step++,false),createNativeScreenInputGate,dispatchSystemEvent,escapeUnreadyNativeScreen,releaseSystemInputs,tickSystem);
  const touch=phase=>({type:'touch',phase,x:105,y:16,pointerId:1});
  host.dispatch(touch('down'));host.dispatch(touch('up'));assert.equal(host.state().system.homeNavigation.focus.currentFocus,2);
  assert.equal(screens.stockStatus(host.state()),'loading');
  const event=phase=>activation==='second touch'?touch(phase):({type:'button',command:'open',phase,source:activation==='keyboard A'?'key-a':'physical-a'});
  host.dispatch(event('down'));host.dispatch(event('up'));assert.equal(host.state().system.phase,'home');assert.equal(screens.stockFailure(),null);
  const gate=createNativeScreenInputGate();assert.equal(gate({type:'command',command:'home'},screens.stockStatus(host.state())),'home');assert.equal(gate({type:'command',command:'power'},screens.stockStatus(host.state())),'pass');
  screens.presentAppletEntry(host.state(),ms(step));assert.equal(screens.stockStatus(host.state()),'ready');
  host.dispatch(event('down'));host.dispatch(event('up'));
  assert.equal(host.state().system.phase,'app');assert.equal(host.state().system.runtime.instances[host.state().system.runtime.active].appId,'friends');
  assert.equal(host.state().system.runtime.application,suspended?camera.system.runtime.active:null);
  assert.equal(screens.stockFailure(),null);assert.equal(screens.stockStatus(host.state()),'loading');
 });
});

test('a valid grid HOME receipt clears old toolbar backing and reselection requires its own revision receipt',async()=>{
 await fixture(({screens,paint})=>{
  const first=home();paint(first,0);assert.equal(screens.stockStatus(first),'ready');
  const grid=enableHomeControls(tickSystem(createPortfolioState(),3001));paint(grid,1);
  const selected=home('friends',grid);assert.equal(screens.stockStatus(selected),'loading');paint(selected,2,false);assert.equal(screens.stockStatus(selected),'loading');
  screens.presentAppletEntry(selected,ms(2));assert.equal(screens.stockStatus(selected),'ready');
  const changed={...selected,system:{...selected.system,homeNavigation:{...selected.system.homeNavigation,selectionRevision:selected.system.homeNavigation.selectionRevision+1}}};
  assert.equal(screens.stockStatus(changed),'loading');
 });
});
