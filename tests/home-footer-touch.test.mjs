import test from 'node:test';
import assert from 'node:assert/strict';
import {homeFooterHit,ownedHomeFooterContact} from '../src/os/home-footer-touch.ts';
import {selectHomeSlot,settleHomeNavigation,writeHomeNavigation} from '../src/os/home-navigation.ts';
import {enableHomeControls} from '../src/os/home-controls.ts';
import {createPortfolioState,dispatchSystemEvent,tickSystem} from '../src/os/system.ts';
import {HOME_FOOTER_TOUCH_GEOMETRY as geometry} from '../src/os/stock-screen-layout.ts';

const booted=()=>tickSystem(createPortfolioState(),3001);
const selected=(state,id)=>settleHomeNavigation(selectHomeSlot(state,Number(Object.entries(state.system.layout).find(([,value])=>value===id)[0])));
const down=(state,x,y)=>dispatchSystemEvent(state,{type:'touch',phase:'down',pointerId:7,x,y},4000);
const gesture=state=>state.system.homeNavigation.gesture;

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

test('live HOME release preserves same-button Open and rejects cancelled or scrolling contacts',()=>{
 for(const [end,phase,opens] of [[[164,226],'up',true],[[180,226],'up',false],[[164,226],'cancel',false]]){
  let state=down(selected(booted(),'work'),160,226);
  state=dispatchSystemEvent(state,{type:'touch',phase:'move',pointerId:7,x:end[0],y:end[1]},4050);
  state=dispatchSystemEvent(state,{type:'touch',phase,pointerId:7,x:end[0],y:end[1]},4100);
  assert.equal(state.system.phase,opens?'launch':'home');
 }
});
