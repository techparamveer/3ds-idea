import test from 'node:test';
import assert from 'node:assert/strict';
import {createNativeScreenInputGate} from '../src/os/native-screen-input.ts';
import {releaseUnreadyNativeInput,escapeUnreadyNativeScreen} from '../src/os/native-screen-system.ts';
import {createPortfolioState,tickSystem,launch,dispatchSystemEvent,reduceSystem,getActiveAppView,sampleSystemHomeFolderClose} from '../src/os/system.ts';
import {reduceMenu} from '../src/os/state.ts';
import {enterHomeFolder,selectHomeSlot,getHomeNavigation,settleHomeNavigation} from '../src/os/home-navigation.ts';
import {moveHomeItem} from '../src/os/home-layout.ts';
import {selectedSuspendedApplication} from '../src/os/home-suspended-window.ts';
const button=(command,phase='down',source=command)=>({type:'button',command,phase,source});
const touch=(phase,x=200,y=190,pointerId=1)=>({type:'touch',phase,x,y,pointerId});
function settings(){return tickSystem(launch(tickSystem(createPortfolioState(),3001),'system-settings',3010),6200);}

test('hidden touch, analog, action and hardware activation are blocked; escape and power remain available',()=>{
 const gate=createNativeScreenInputGate();
 for(const event of [button('open'),button('right'),{type:'analog',x:1,y:0,source:'pad'},touch('down'),{type:'action',id:'nnid'},{type:'text',value:'name'}])assert.equal(gate(event,'loading'),'block');
 assert.equal(gate(button('home'),'loading'),'home');assert.equal(gate(button('back'),'loading'),'home');assert.equal(gate(button('power'),'loading'),'pass');
 assert.equal(gate({type:'command',command:'open'},'loading'),'block');assert.equal(gate({type:'command',command:'open'},'error'),'retry');
});
test('controls started during loading must be released before the ready UI accepts new activation',()=>{
 const gate=createNativeScreenInputGate();gate(button('open'),'loading');
 assert.equal(gate(button('open','repeat'),'ready'),'block');assert.equal(gate(button('open','up'),'ready'),'block');assert.equal(gate(button('open'),'ready'),'pass');
 gate({type:'analog',x:1,y:0,source:'pad'},'loading');assert.equal(gate({type:'analog',x:1,y:0,source:'pad'},'ready'),'block');
 assert.equal(gate({type:'analog',x:0,y:0,source:'pad'},'ready'),'block');assert.equal(gate({type:'analog',x:1,y:0,source:'pad'},'ready'),'pass');
 gate(touch('down'),'loading');assert.equal(gate(touch('up'),'error'),'block');
 gate(touch('down'),'loading');assert.equal(gate(touch('up'),'ready'),'block');assert.equal(gate(touch('down'),'ready'),'pass');
});
test('recovery touch requires matching down/up inside the same visible button',()=>{
 const gate=createNativeScreenInputGate();assert.equal(gate(touch('up'),'error'),'block');
 gate(touch('down'),'error');assert.equal(gate(touch('up',40,190),'error'),'block');
 gate(touch('down'),'error');assert.equal(gate(touch('up'),'error'),'retry');
 gate(touch('down',40,190),'error');assert.equal(gate(touch('up',40,190),'error'),'home');
 gate(touch('down'),'error');assert.equal(gate(touch('cancel'),'error'),'block');assert.equal(gate(touch('up'),'ready'),'pass');
});
test('transition to an unseen frame cancels previously held repeats and captures their later releases',()=>{
 let s=dispatchSystemEvent(settings(),button('right'),6300);const gate=createNativeScreenInputGate();gate.cancelHeld(s.system.input);
 s=releaseUnreadyNativeInput(s,'loading',6400);const selection=getActiveAppView(s).selection;
 s=tickSystem(s,8000);assert.equal(getActiveAppView(s).selection,selection);assert.deepEqual(s.system.input.held,{});
 assert.equal(gate(button('right','up'),'ready'),'block');assert.equal(gate(button('right'),'ready'),'pass');
 assert.equal(releaseUnreadyNativeInput(s,'ready',8100),s);
});
test('recovery escape during helper launch preserves caller and its exact Settings return page',()=>{
 let s=settings();s=dispatchSystemEvent(s,{type:'action',id:'nnid'},7000);
 const child=s.system.runtime.active,parent=s.system.runtime.instances[child].caller;assert.equal(s.system.phase,'launch');
 s=escapeUnreadyNativeScreen(s,7050);assert.equal(s.system.phase,'home');assert.equal(s.system.runtime.homeReturn,child);assert.ok(s.system.runtime.instances[parent]);
 s=reduceSystem(s,'home',7100);assert.equal(s.system.runtime.active,child);
 s=reduceSystem(s,'back',7200);assert.equal(s.system.runtime.active,parent);assert.equal(getActiveAppView(s).appId,'system-settings');assert.equal(getActiveAppView(s).selection,4);
});

test('HOME panel recovery blocks destructive input and escapes without resuming suspended software',()=>{
 let s=tickSystem(launch(tickSystem(createPortfolioState(),3001),'work',3010),6200);
 s=reduceSystem(s,'home',6300);
 s={...s,panel:'home-layouts',homeLayoutAction:'delete'};
 const runtime=s.system.runtime,gate=createNativeScreenInputGate();
 assert.equal(gate(button('x'),'error'),'block');
 assert.equal(gate({type:'command',command:'open'},'error'),'retry');
 assert.equal(gate(button('back'),'error'),'home');
 const escaped=escapeUnreadyNativeScreen(s,6400);
 assert.equal(escaped.panel,null);
 assert.equal(escaped.system.phase,'home');
 assert.equal(escaped.system.runtime,runtime);
});

function suspendedFolder(){
 let state=tickSystem(launch(tickSystem(createPortfolioState(),3001),'work',3010),6200);
 state=reduceSystem(state,'home',6300);
 state=reduceMenu(selectHomeSlot(state,40),'open');
 const source=Number(Object.entries(state.system.layout).find(([,id])=>id==='work')[0]);
 state=moveHomeItem(state,{folder:null,slot:source},{folder:40,slot:5});
 return settleHomeNavigation(selectHomeSlot(enterHomeFolder(state,40),5));
}
function assertFolderRecovered(before,after){
 assert.equal(after.opened,false);assert.equal(after.system.phase,'home');
 assert.equal(after.selected,40);assert.equal(getHomeNavigation(after).activeFolderSlot,null);
 assert.deepEqual(getHomeNavigation(after).rootView,getHomeNavigation(before).rootView);
 assert.deepEqual(getHomeNavigation(after).folderViews,getHomeNavigation(before).folderViews);
 assert.equal(after.system.runtime,before.system.runtime,'folder escape cannot resume or retire the selected suspended owner');
 assert.equal(after.system.runtime.active,null);
 assert.equal(after.system.runtime.instances[after.system.runtime.application].suspended,true);
 assert.equal(after.system.runtime.homeReturn,before.system.runtime.homeReturn);
 assert.equal(after.folders,before.folders);assert.equal(after.system.folderLayouts,before.system.folderLayouts);
 assert.equal(sampleSystemHomeFolderClose(after),null);
}
for(const command of ['back','home'])for(const status of ['loading','error'])test(`folder ${status} recovery ${command} leaves through pure folder close without resuming suspended software`,()=>{
 const state=suspendedFolder(),gate=createNativeScreenInputGate();
 assert.ok(selectedSuspendedApplication(state),'fixture selects the retained application inside the failed folder');
 assert.equal(gate(button(command),status),'home');
 const escaped=escapeUnreadyNativeScreen(state,6400);assertFolderRecovered(state,escaped);
 assert.equal(gate(button(command,'up'),'ready'),'block');
 assert.equal(tickSystem(escaped,7400).opened,false);
});
test('folder error recovery touch leaves only after a matching visible HOME-button stroke',()=>{
 const state=suspendedFolder(),gate=createNativeScreenInputGate();
 assert.equal(gate(touch('down',40,190,9),'error'),'block');
 assert.equal(gate(touch('up',40,190,9),'error'),'home');
 assertFolderRecovered(state,escapeUnreadyNativeScreen(state,6400));
 const mismatch=createNativeScreenInputGate();mismatch(touch('down',40,190,9),'error');
 assert.equal(mismatch(touch('up',200,190,9),'error'),'block');
});
test('folder recovery cancels an already-started native close rather than retaining a stale controller',()=>{
 const state=reduceSystem(suspendedFolder(),'back',6400);
 assert.ok(sampleSystemHomeFolderClose(state));assert.equal(state.opened,true);
 const escaped=escapeUnreadyNativeScreen(state,6500);assertFolderRecovered(state,escaped);
 assert.equal(escaped.system.homeFolderClose.current,null);
 assert.equal(tickSystem(escaped,8500).opened,false);
});
test('folder recovery does not bypass sleep, preferences or power, and preserves dialog Back routing',()=>{
 const state=suspendedFolder();
 for(const blocked of [{...state,powered:false},{...state,system:{...state.system,sleeping:true}},
  {...state,system:{...state.system,preferences:true}}]){
  assert.equal(escapeUnreadyNativeScreen(blocked,6400),blocked);
 }
 const dialog={...state,system:{...state.system,dialog:'switch'}},cancelled=escapeUnreadyNativeScreen(dialog,6400);
 assert.equal(cancelled.system.dialog,null);assert.equal(cancelled.opened,true);
 assert.equal(getHomeNavigation(cancelled).activeFolderSlot,40);
 assert.equal(cancelled.system.runtime,state.system.runtime);
});
