import test from 'node:test';
import assert from 'node:assert/strict';
import { createStockModule, initialSharedData } from '../src/os/stock-apps.ts';
import { getTitle } from '../src/os/app-registry.ts';
import { createPortfolioState, tickSystem, invokeSystemApplet, dispatchSystemEvent, touchSystem, reduceSystem, releaseSystemInputs, setSystemSleeping } from '../src/os/system.ts';

const camera='0004001000022400',context={now:0,shared:initialSharedData()};
const module=createStockModule(getTitle('manual'));
const open=()=>invokeSystemApplet(tickSystem(createPortfolioState(),3001),'manual',4000,{manualTitleId:camera});
const app=state=>state.system.runtime.instances[state.system.runtime.active].state;
const touch=(state,phase,x=80,y=226,pointerId=7)=>dispatchSystemEvent(state,{type:'touch',phase,x,y,pointerId},4100);

test('public owned contact paints held state throughout first/repeated holds and requests Close only on release',()=>{
 for(let cycle=0;cycle<2;cycle++){
  const initial=open(),owner=initial.system.runtime.active,held=touch(initial,'down');
  assert.equal(app(initial).manualClosePress,undefined);
  assert.equal(app(held).manualClosePress,true);
  assert.equal(module.view(app(held),context).data.manualClosePress,true);
  assert.equal(app(held).manualFooterClose,undefined);
  assert.equal(app(tickSystem(held,4700)).manualClosePress,true);
  for(const phase of ['down','move','up','cancel'])assert.equal(touch(held,phase,80,226,8),held,'a second pointer cannot steal the held control');
  assert.equal(touch(held,'down'),held,'duplicate down is rejected by the shared latch');
  const pending=touch(touch(held,'move',90,225),'up',90,225);
  assert.equal(pending.system.runtime.active,owner);
  assert.equal(app(pending).manualFooterClose,true);
  assert.equal(app(pending).manualClosePress,undefined);
  assert.deepEqual(touch(pending,'up'),pending,'duplicate release cannot restart feedback');
  assert.deepEqual(module.save(app(held)),{},'contact state is not persisted');
 }
});

test('move-away, outside release, outside origin and cancellation disarm Close through the public latch',()=>{
 const initial=open(),held=touch(initial,'down');
 const sequences=[
  [['up',200,226]],
  [['move',200,226],['move',80,226],['up',80,226]],
  [['move',80,100],['up',80,100]],
  [['cancel',80,226],['up',80,226]],
 ];
 for(const events of sequences){
  let state=held;
  for(const [phase,x,y]of events)state=touch(state,phase,x,y);
  assert.equal(state.system.runtime.active,initial.system.runtime.active);
  assert.equal(app(state).manualClosePress,undefined);
  assert.equal(app(state).manualFooterClose,undefined);
  assert.equal(app(touch(touch(state,'down'),'up')).manualFooterClose,true,'a new contact can close');
 }
 const moved=touch(held,'move',160,226);assert.equal(app(moved).manualClosePress,false);
 assert.equal(app(touch(moved,'move')).manualClosePress,false,'returning to the hit box does not re-arm');
 const outside=touch(touch(touch(initial,'down',200,226),'move'),'up');
 assert.equal(app(outside).manualFooterClose,undefined);
 assert.equal(app(outside).manualClosePress,undefined);
 assert.equal(touch(initial,'up'),initial,'orphan physical release is rejected');
 assert.equal(app(touchSystem(initial,80,226,4200)).manualFooterClose,true,'legacy one-shot helper still closes');
});

test('input release, sleep and HOME clear held feedback without starting a return',()=>{
 const held=touch(open(),'down'),owner=held.system.runtime.active;
 for(const cleared of [releaseSystemInputs(held,4200),setSystemSleeping(held,true,4200),reduceSystem(held,'home',4200)]){
  const state=cleared.system.runtime.instances[owner].state;
  assert.equal(state.manualClosePress,undefined);assert.equal(state.manualFooterClose,undefined);
 }
 const resumed=setSystemSleeping(setSystemSleeping(held,true,4200),false,4300);
 assert.equal(app(touch(resumed,'up')).manualFooterClose,undefined);
 assert.equal(app(touch(touch(resumed,'down'),'up')).manualFooterClose,true);
});

test('unrelated buttons and ignored actions preserve the owned armed or disarmed contact',()=>{
 const ignored=[
  {type:'button',command:'right',phase:'down',source:'keyboard:ArrowRight'},
  {type:'button',command:'right',phase:'up',source:'keyboard:ArrowRight'},
  {type:'button',command:'right',phase:'repeat',source:'keyboard:ArrowRight'},
  {type:'command',command:'right'},
  {type:'command',command:'y'},
  {type:'action',id:'unknown'},
  {type:'action',id:'manual-page-0'},
  {type:'action',id:'manual-page-1'},
 ];
 for(const origin of ['armed','moved-away','outside-origin'])for(const event of ignored){
  let state=touch(open(),'down',origin==='outside-origin'?200:80,226);
  if(origin==='moved-away')state=touch(state,'move',200,226);
  const armed=origin==='armed';
  state=dispatchSystemEvent(state,event,4200);
  assert.equal(state.system.input.touch.pointerId,7);
  assert.equal(app(state).manualClosePress,armed,`${origin}: ${JSON.stringify(event)}`);
  const released=touch(touch(state,'move'),'up');
  assert.equal(app(released).manualFooterClose,armed?true:undefined);
  assert.equal(app(released).manualClosePress,undefined);
 }
 let state=touch(touch(open(),'down'),'move',200,226);
 for(const event of ignored)state=dispatchSystemEvent(state,event,4200);
 assert.equal(app(touch(touch(state,'move'),'up')).manualFooterClose,undefined,'a whole unrelated key/action sequence cannot restore compatibility-tap eligibility');
});

test('pure Manual state clears transient feedback for every lifecycle and semantic path, preserving document controls',()=>{
 const initial=module.create({manualTitleId:'0004001000022000'},null,context);
 const held=module.reduce(initial,{type:'touch',phase:'down',x:80,y:226},context).state;
 for(const phase of ['suspend','resume','sleep','wake','close']){
  const next=module.reduce(held,{type:'lifecycle',phase},context);assert.deepEqual(next.state,initial);assert.equal(next.effects,undefined);
 }
 for(const event of [{type:'command',command:'x'},{type:'action',id:'manual-close'},{type:'command',command:'back'},{type:'button',command:'x',source:'physical-x',phase:'down'}]){
  const next=module.reduce(held,event,context);assert.deepEqual(next.state,initial);assert.deepEqual(next.effects,[{type:'close'}]);
 }
 const page=module.reduce(held,{type:'command',command:'open'},context).state;
 assert.equal(page.screen,'document');assert.equal(page.manualClosePress,undefined);
 assert.equal(module.reduce(page,{type:'touch',phase:'down',x:20,y:226},context).state,page);
 assert.deepEqual(module.reduce(page,{type:'touch',phase:'up',x:20,y:226},context).effects,[{type:'close'}]);
 assert.equal(module.reduce(page,{type:'touch',phase:'up',x:80,y:226},context).state.screen,'main');
 const guide=module.create({},null,context);assert.equal(module.reduce(guide,{type:'touch',phase:'down',x:80,y:226},context).state,guide);
});
