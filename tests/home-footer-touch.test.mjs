import test from 'node:test';
import assert from 'node:assert/strict';
import {homeFooterHit,ownedHomeFooterContact} from '../src/os/home-footer-touch.ts';
import {enterHomeFolder,selectHomeSlot,settleHomeNavigation,writeHomeNavigation} from '../src/os/home-navigation.ts';
import {enableHomeControls} from '../src/os/home-controls.ts';
import {createPortfolioState,dispatchSystemEvent,launchHomeShortcut,reduceSystem,tickSystem} from '../src/os/system.ts';
import {HOME_FOOTER_TOUCH_GEOMETRY as geometry} from '../src/os/stock-screen-layout.ts';

const booted=()=>tickSystem(createPortfolioState(),3001);
const selected=(state,id)=>settleHomeNavigation(selectHomeSlot(state,Number(Object.entries(state.system.layout).find(([,value])=>value===id)[0])));
const down=(state,x,y)=>dispatchSystemEvent(state,{type:'touch',phase:'down',pointerId:7,x,y},4000);
const gesture=state=>state.system.homeNavigation.gesture;
const suspendedCamera=()=>reduceSystem(tickSystem(launchHomeShortcut(booted(),'camera',4000),6200),'home',6300);
const openedFolder=()=>{
 const state=booted(),child=state.system.layout[0];
 return settleHomeNavigation(selectHomeSlot(enterHomeFolder({...state,folders:{20:'A'},system:{...state.system,folderLayouts:{20:{2:child}}}},20),2));
};

test('HOME footer hit projection keeps the source bounds and asymmetric two-button split',()=>{
 const state=selected(booted(),'system-settings');
 for(const [x,y,expected]of [[0,212,{action:'manual',side:'left'}],[99.999,239.999,{action:'manual',side:'left'}],[100,212,{action:'open',side:'right'}],[319.999,239.999,{action:'open',side:'right'}],[-.001,226,null],[320,226,null],[50,211.999,null],[50,240,null]]){
  assert.deepEqual(homeFooterHit(state,geometry,x,y),expected);
 }
 assert.throws(()=>homeFooterHit(state,{...geometry,leftWidth:321},50,226),RangeError);
});

test('same-button press ownership survives small movement but never crosses the x100 split',()=>{
 const state=selected(booted(),'system-settings');
 const left=down(state,98,226),right=down(state,102,226);
 assert.deepEqual(ownedHomeFooterContact(left,geometry,gesture(left),90,226),{action:'manual',side:'left'});
 assert.deepEqual(ownedHomeFooterContact(right,geometry,gesture(right),106,226),{action:'open',side:'right'});
 assert.equal(ownedHomeFooterContact(left,geometry,gesture(left),102,226),null);
 assert.equal(ownedHomeFooterContact(right,geometry,gesture(right),98,226),null);
});

test('live Manual contact restores its held feedback after Open and releases through the original owner',()=>{
 let state=down(selected(booted(),'camera'),50,226);
 assert.equal(gesture(state).area,'footer');
 assert.deepEqual(ownedHomeFooterContact(state,geometry,gesture(state)),{action:'manual',side:'left'});
 state=dispatchSystemEvent(state,{type:'touch',phase:'move',pointerId:7,x:217,y:226},4050);
 assert.equal(gesture(state).mode,'press');
 assert.equal(ownedHomeFooterContact(state,geometry,gesture(state)),null);
 state=dispatchSystemEvent(state,{type:'touch',phase:'move',pointerId:7,x:50,y:226},4100);
 assert.equal(gesture(state).mode,'press');
 assert.deepEqual(ownedHomeFooterContact(state,geometry,gesture(state)),{action:'manual',side:'left'});
 state=dispatchSystemEvent(state,{type:'touch',phase:'up',pointerId:7,x:50,y:226},4150);
 const active=state.system.runtime.instances[state.system.runtime.active];
 assert.equal(active.appId,'manual');
 assert.equal(active.state.manualTitleId,'0004001000022400');
});

test('footer capture permits movement beyond generic slop without transferring release',()=>{
 let state=down(selected(booted(),'camera'),50,226);
 state=dispatchSystemEvent(state,{type:'touch',phase:'move',pointerId:7,x:90,y:226},4050);
 assert.equal(gesture(state).mode,'press');
 assert.deepEqual(ownedHomeFooterContact(state,geometry,gesture(state)),{action:'manual',side:'left'});
 state=dispatchSystemEvent(state,{type:'touch',phase:'up',pointerId:7,x:90,y:226},4100);
 assert.equal(state.system.runtime.instances[state.system.runtime.active].appId,'manual');

 for(const end of [[217,226],[307,16],[-1,226]]){
  const initial=selected(booted(),'camera'),density=initial.system.homeNavigation.rootView.density;
  let cancelled=down(initial,50,226);
  cancelled=dispatchSystemEvent(cancelled,{type:'touch',phase:'move',pointerId:7,x:end[0],y:end[1]},4050);
  cancelled=dispatchSystemEvent(cancelled,{type:'touch',phase:'up',pointerId:7,x:end[0],y:end[1]},4100);
  assert.equal(cancelled.system.phase,'home');
  assert.equal(cancelled.system.runtime.active,null);
  assert.equal(cancelled.system.homeNavigation.rootView.density,density);
  assert.equal(cancelled.system.homeNavigation.gesture,null);
 }
});

test('gap origin, selection replacement and explicit cancel cannot acquire footer ownership',()=>{
 let gap=down(suspendedCamera(),106,226);
 assert.equal(gesture(gap).area,'chrome');
 gap=dispatchSystemEvent(gap,{type:'touch',phase:'move',pointerId:7,x:160,y:226},4050);
 assert.equal(gesture(gap).mode,'scroll');
 gap=dispatchSystemEvent(gap,{type:'touch',phase:'up',pointerId:7,x:160,y:226},4100);
 assert.equal(gap.system.runtime.active,null);

 let replaced=down(selected(booted(),'camera'),50,226);
 replaced=selected(replaced,'work');
 assert.equal(ownedHomeFooterContact(replaced,geometry,gesture(replaced)),null);
 replaced=dispatchSystemEvent(replaced,{type:'touch',phase:'up',pointerId:7,x:50,y:226},4100);
 assert.equal(replaced.system.phase,'home');
 assert.equal(replaced.system.runtime.active,null);

 let cancelled=down(selected(booted(),'camera'),50,226);
 cancelled=dispatchSystemEvent(cancelled,{type:'touch',phase:'move',pointerId:7,x:217,y:226},4050);
 cancelled=dispatchSystemEvent(cancelled,{type:'touch',phase:'move',pointerId:7,x:50,y:226},4100);
 cancelled=dispatchSystemEvent(cancelled,{type:'touch',phase:'cancel',pointerId:7,x:50,y:226},4150);
 assert.equal(cancelled.system.homeNavigation.gesture,null);
 const stale=dispatchSystemEvent(cancelled,{type:'touch',phase:'up',pointerId:7,x:50,y:226},4200);
 assert.equal(stale,cancelled);
 assert.equal(stale.system.runtime.active,null);
});

test('Camera suspended footer uses all three decoded bounding panes and leaves their authored gaps inert',()=>{
 const state=suspendedCamera();
 for(const [x,expected] of [[0,{action:'close-software',side:'left'}],[104.999,{action:'close-software',side:'left'}],[105,null],[106.999,null],[107,{action:'manual',side:'middle'}],[212.999,{action:'manual',side:'middle'}],[213,null],[214.999,null],[215,{action:'resume',side:'right'}],[319.999,{action:'resume',side:'right'}]]){
  assert.deepEqual(homeFooterHit(state,geometry,x,226),expected);
 }
 assert.throws(()=>homeFooterHit(state,{...geometry,three:{...geometry.three,middle:{offset:107,width:321}}},160,226),RangeError);
});

test('three-button ownership cannot cross a source gap or transfer between Camera actions',()=>{
 const state=suspendedCamera();
 for(const [start,end,expected] of [[50,100,{action:'close-software',side:'left'}],[160,170,{action:'manual',side:'middle'}],[267,280,{action:'resume',side:'right'}],[104,107,null],[107,104,null],[212,215,null],[215,212,null],[104,105,null],[107,106,null]]){
  const pressed=down(state,start,226);
  assert.deepEqual(ownedHomeFooterContact(pressed,geometry,gesture(pressed),end,226),expected);
 }
});

test('live Camera Manual release respects its decoded gaps and cancel boundary',()=>{
 for(const [start,end,phase,opens] of [[160,162,'up',true],[212,214,'up',false],[215,212,'up',false],[160,160,'cancel',false]]){
  let state=down(suspendedCamera(),start,226);
  state=dispatchSystemEvent(state,{type:'touch',phase:'move',pointerId:7,x:end,y:226},4050);
  state=dispatchSystemEvent(state,{type:'touch',phase,pointerId:7,x:end,y:226},4100);
  assert.equal(state.system.runtime.active?state.system.runtime.instances[state.system.runtime.active]?.appId:null,opens?'manual':null);
  assert.equal(state.system.runtime.application?state.system.runtime.instances[state.system.runtime.application]?.appId:null,'camera');
 }
});

test('a press beginning outside the footer cannot acquire its Select pose or release action',()=>{
 const state=selected(booted(),'system-settings'),fromGap=down(state,160,210);
 assert.equal(gesture(fromGap).mode,'press');
 assert.equal(ownedHomeFooterContact(fromGap,geometry,gesture(fromGap),160,214),null);
 const fromFooter=down(state,160,214);
 assert.deepEqual(ownedHomeFooterContact(fromFooter,geometry,gesture(fromFooter),160,218),{action:'open',side:'right'});
 assert.equal(ownedHomeFooterContact(fromFooter,geometry,gesture(fromFooter),160,210),null);
 assert.equal(ownedHomeFooterContact(fromFooter,geometry,{...gesture(fromFooter),mode:'scroll'},160,218),null);
});

test('navigation changes cannot transfer an in-flight footer contact to the newly selected action',()=>{
 const settings=selected(booted(),'system-settings'),pressed=down(settings,50,226);
 assert.deepEqual(ownedHomeFooterContact(pressed,geometry,gesture(pressed)),{action:'manual',side:'left'});
 const work=selected(pressed,'work');
 assert.deepEqual(homeFooterHit(work,geometry,50,226),{action:'open',side:'right'});
 assert.equal(ownedHomeFooterContact(work,geometry,gesture(work),50,226),null);
});

test('single source button owns the full footer only when the press also began there',()=>{
 const work=selected(booted(),'work');
 for(const x of [0,99,100,319]){
  const pressed=down(work,x,226);
  assert.deepEqual(ownedHomeFooterContact(pressed,geometry,gesture(pressed),319-x,226),{action:'open',side:'right'});
 }
 const gap=down(work,160,210);
 assert.equal(ownedHomeFooterContact(gap,geometry,gesture(gap),160,214),null);
});

test('occupied open-folder Open owns the full footer and never falls back to Close',()=>{
 const state=openedFolder();
 for(const x of [0,99,100,319])assert.deepEqual(homeFooterHit(state,geometry,x,226),{action:'open',side:'right'});
 const pressed=down(state,10,226);
 assert.deepEqual(ownedHomeFooterContact(pressed,geometry,gesture(pressed),319,226),{action:'open',side:'right'});
 let launched=dispatchSystemEvent(pressed,{type:'touch',phase:'up',pointerId:7,x:10,y:226},4100);
 assert.equal(launched.system.phase,'launch');assert.equal(launched.system.app,state.system.folderLayouts[20][2]);
});

test('live HOME release cannot acquire a footer button across the split or from the gap',()=>{
 for(const native of [false,true])for(const [start,end] of [[[98,226],[102,226]],[[102,226],[98,226]],[[160,210],[160,214]],[[160,214],[160,210]]]){
  const initial=selected(booted(),'system-settings');
  let state=down(native?enableHomeControls(initial):initial,...start);
  state=dispatchSystemEvent(state,{type:'touch',phase:'move',pointerId:7,x:end[0],y:end[1]},4050);
  state=dispatchSystemEvent(state,{type:'touch',phase:'up',pointerId:7,x:end[0],y:end[1]},4100);
  assert.equal(state.system.phase,'home');assert.equal(state.system.app,null);assert.equal(state.system.applet,undefined);
 }
});

test('identical Open labels cannot transfer a held contact between titles or into the toolbar',()=>{
 const pressed=down(selected(booted(),'work'),160,226),contact=gesture(pressed);
 const other=selected(pressed,'about');
 assert.deepEqual(homeFooterHit(other,geometry,160,226),{action:'open',side:'right'});
 assert.equal(ownedHomeFooterContact(other,geometry,contact),null);
 const nav=pressed.system.homeNavigation;
 const toolbar=writeHomeNavigation(pressed,{...nav,focus:{...nav.focus,toolbarActive:true,currentFocus:1}});
 assert.deepEqual(homeFooterHit(toolbar,geometry,160,226),{action:'open',side:'right'});
 assert.equal(ownedHomeFooterContact(toolbar,geometry,contact),null);
});

test('live HOME release preserves same-button Open beyond generic slop and rejects cancellation',()=>{
 for(const [end,phase,opens] of [[[164,226],'up',true],[[180,226],'up',true],[[164,226],'cancel',false]]){
  let state=down(selected(booted(),'work'),160,226);
  state=dispatchSystemEvent(state,{type:'touch',phase:'move',pointerId:7,x:end[0],y:end[1]},4050);
  state=dispatchSystemEvent(state,{type:'touch',phase,pointerId:7,x:end[0],y:end[1]},4100);
  assert.equal(state.system.phase,opens?'launch':'home');
 }
});
