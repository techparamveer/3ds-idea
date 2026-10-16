import test from 'node:test';
import assert from 'node:assert/strict';
import { createPortfolioState, tickSystem, launchHomeShortcut, reduceSystem } from '../src/os/system.ts';
import { createHomeNavigation, activeHomeRecord } from '../src/os/home-navigation.ts';
import { createHomeCursorLoop } from '../src/os/home-cursor-loop.ts';
import { consumeHomeGridKeyEvent, advanceHomeScroll } from '../src/os/home-scroll-consumer.ts';
import { createHomeBannerHost, crossHomeBannerBoundary, stepHomeBannerHost, getHomeBannerHostView,
  resolveHomeBannerHostObservation, resolveHomeBannerHostSelection } from '../src/os/home-banner-host.ts';

const inputs = {managerInhibited:false,sceneInhibited:false,loadInhibited:false,nativeWorkerReady:true,resourceReady:null};
const observation = (patch={}) => ({kind:'banner-resolve',phase:'lower',reason:'idle-update',context:null,
  slot:0,focus:-1,toolbarActive:false,updateOffset:0,updateCount:1,...patch});
const fresh = () => createHomeBannerHost({generation:'snapshot-test',updateCount:0},inputs);

test('a completion request uses its original slot while the pending replay selects the next app',()=>{
  let menu=createPortfolioState(); menu={...menu,system:{...menu.system,phase:'home',layout:{2:'work',3:'about',4:'contact'}}};
  const navigation=createHomeNavigation(0);navigation.rootView.selectedSlot=2;
  let scroll={navigation,cursorLoop:createHomeCursorLoop()};
  scroll=consumeHomeGridKeyEvent(scroll,{type:4,mask:16}).state;
  scroll=consumeHomeGridKeyEvent(scroll,{type:6,mask:16}).state;
  const completed=advanceHomeScroll(scroll,10);
  assert.equal(activeHomeRecord(completed.state.navigation).selectedSlot,4);
  const resolved=completed.observations.find(o=>o.kind==='banner-resolve');assert.equal(resolved.slot,3);
  menu={...menu,selected:4,system:{...menu.system,homeNavigation:completed.state.navigation}};
  assert.deepEqual(resolveHomeBannerHostSelection(menu),{kind:'app',id:'contact'});
  const selection=resolveHomeBannerHostObservation(menu,resolved);
  assert.deepEqual(selection,{kind:'app',id:'about'});
  const host=stepHomeBannerHost(fresh(),{generation:'snapshot-test',updateCount:1},{afterManager:{selection}});
  assert.deepEqual(getHomeBannerHostView(host).selection,{kind:'app',id:'about'});
});

test('resolver snapshots retain the recorded root or child context independently of current UI fields',()=>{
  let state=createPortfolioState();
  state={...state,opened:true,selected:40,folderSelected:5,system:{...state.system,layout:{5:'work'},folderLayouts:{40:{5:'about'},41:{5:'contact'}}}};
  assert.deepEqual(resolveHomeBannerHostObservation(state,observation({context:null,slot:5})),{kind:'app',id:'work'});
  assert.deepEqual(resolveHomeBannerHostObservation(state,observation({context:40,slot:5})),{kind:'app',id:'about'});
  assert.deepEqual(resolveHomeBannerHostObservation(state,observation({context:41,slot:5})),{kind:'app',id:'contact'});
});

test('unchanged idle and a different vacant slot preserve the accepted default request',()=>{
  const state=createPortfolioState();let host=fresh();
  const apply=slot=>{host=crossHomeBannerBoundary(host,host.clock,{selection:resolveHomeBannerHostObservation(state,observation({slot}))});};
  apply(100);const service=host.service,pending=host.pending;
  apply(100);assert.equal(host.service,service);assert.equal(host.pending,pending);
  apply(101);assert.equal(host.service,service);assert.equal(host.pending,pending);
});

test('the eight native toolbar categories never resolve the selected grid app',()=>{
  const state=createPortfolioState(),categories=[2,5,4,6,7,8,2,2];
  assert.deepEqual(resolveHomeBannerHostObservation(state,observation({focus:1,toolbarActive:true})),{kind:'toolbar',focus:1,category:5},'Game Notes is focus 1');
  assert.deepEqual(resolveHomeBannerHostObservation(state,observation({focus:2,toolbarActive:true})),{kind:'toolbar',focus:2,category:4},'Friend List is focus 2');
  for(let focus=0;focus<8;focus++){
    const selection=resolveHomeBannerHostObservation(state,observation({focus,toolbarActive:true}));
    assert.deepEqual(selection,categories[focus]===2?{kind:'default'}:{kind:'toolbar',focus,category:categories[focus]});
    const host=crossHomeBannerBoundary(fresh(),fresh().clock,{selection});
    assert.equal(getHomeBannerHostView(host).status,'pending');
    const targets={1:{kind:'memo',nativeType:15},2:{kind:'friend',nativeType:14},3:{kind:'news',nativeType:16},4:{kind:'web',nativeType:17},5:{kind:'miiverse',nativeType:18}};
    if(targets[focus])assert.deepEqual(host.service.lifecycle.requested.target,{...targets[focus],key:'native:ffffffff:ffffffff:0'});
  }
  for(const patch of [{focus:-1,toolbarActive:true},{focus:8},{slot:300},{context:40,slot:60},{context:-1}]){
    assert.throws(()=>resolveHomeBannerHostObservation(state,observation(patch)),RangeError);
  }
});

test('suspended-owner clear follows the observed content, not current selection or toolbar focus',()=>{
  let state=reduceSystem(tickSystem(launchHomeShortcut(tickSystem(createPortfolioState(),3001),'health-safety',3010),6200),'home',6300);
  const health=Number(Object.entries(state.system.layout).find(([,id])=>id==='health-safety')[0]);
  const camera=Number(Object.entries(state.system.layout).find(([,id])=>id==='camera')[0]);
  const clear={kind:'clear',nativeType:6};
  assert.deepEqual(resolveHomeBannerHostSelection(state),clear);
  state={...state,selected:camera,system:{...state.system,homeNavigation:{...state.system.homeNavigation,
    focus:{...state.system.homeNavigation.focus,toolbarActive:true,currentFocus:1}},folderLayouts:{40:{2:'health-safety',3:'camera'}}}};
  assert.deepEqual(resolveHomeBannerHostObservation(state,observation({slot:health})),clear);
  assert.deepEqual(resolveHomeBannerHostObservation(state,observation({slot:camera})),{kind:'app',id:'camera'});
  assert.deepEqual(resolveHomeBannerHostObservation(state,observation({context:40,slot:2})),clear);
  assert.deepEqual(resolveHomeBannerHostObservation(state,observation({context:40,slot:3})),{kind:'app',id:'camera'});
  assert.deepEqual(resolveHomeBannerHostObservation(state,observation({slot:health,focus:1,toolbarActive:true})),{kind:'toolbar',focus:1,category:5});
  const owner=state.system.runtime.application;
  for(const runtime of [
    {...state.system.runtime,active:owner},
    {...state.system.runtime,homeReturn:null},
    {...state.system.runtime,instances:{...state.system.runtime.instances,[owner]:{...state.system.runtime.instances[owner],suspended:false}}},
  ])assert.deepEqual(resolveHomeBannerHostObservation({...state,system:{...state.system,runtime}},observation({slot:health})),{kind:'app',id:'health-safety'});
});
