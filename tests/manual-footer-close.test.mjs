import test from 'node:test';
import assert from 'node:assert/strict';
import { createPortfolioState, tickSystem, launchHomeShortcut, reduceSystem, touchSystem, dispatchSystemEvent, invokeSystemApplet, completeManualFooterClose } from '../src/os/system.ts';
import { createManualFooterClosePresentation, manualFooterCloseIdentity } from '../src/os/manual-footer-close.ts';
import { notesFooterCloseEligible } from '../src/os/notes-footer-close.ts';
import { escapeUnreadyNativeScreen } from '../src/os/native-screen-system.ts';

const camera='0004001000022400';
const home=()=>tickSystem(createPortfolioState(),3001);
const open=()=>invokeSystemApplet(home(),'manual',4000,{manualTitleId:camera});
const request=state=>{
 for(const phase of ['down','up'])state=dispatchSystemEvent(state,{type:'touch',phase,x:80,y:226},4100);
 return state;
};

test('actual top-level Camera Manual footer release retains the owner until paired outgoing terminal',()=>{
 const state=open(),owner=state.system.runtime.active,pending=request(state);
 assert.equal(pending.system.runtime.active,owner);
 assert.equal(pending.system.runtime.instances[owner].state.manualFooterClose,true);
 assert.equal(tickSystem(pending,5000).system.runtime.active,owner);
});

test('semantic Close, root Back, physical and keyboard X share one idempotent request; document Back and caller returns stay unchanged',()=>{
 const state=open(),owner=state.system.runtime.active;
 const routes=[s=>request(s),s=>touchSystem(s,80,226,4100),s=>reduceSystem(s,'back',4100),s=>reduceSystem(s,'x',4100),s=>dispatchSystemEvent(s,{type:'action',id:'manual-close'},4100),s=>{
  s=dispatchSystemEvent(s,{type:'button',command:'x',phase:'down',source:'physical-x'},4100);
  return dispatchSystemEvent(s,{type:'button',command:'x',phase:'up',source:'physical-x'},4110);
 },s=>dispatchSystemEvent(s,{type:'command',command:'x'},4100)];
 for(const route of routes){const pending=route(state);assert.equal(pending.system.runtime.active,owner);assert.equal(pending.system.runtime.instances[owner].state.manualFooterClose,true);assert.deepEqual(request(pending).system.runtime.instances[owner].state,pending.system.runtime.instances[owner].state);assert.deepEqual(reduceSystem(pending,'open',4200).system.runtime.instances[owner].state,pending.system.runtime.instances[owner].state);}
 for(const [appId,title]of[['camera',camera],['system-settings','0004001000022000']]){
  const caller=tickSystem(launchHomeShortcut(home(),appId,3100),6200),manual=invokeSystemApplet(caller,'manual',6400,{manualTitleId:title}),returned=request(manual);
  assert.equal(returned.system.runtime.active,caller.system.runtime.active);assert.equal(returned.system.runtime.instances[manual.system.runtime.active],undefined);
 }
 const document=reduceSystem(invokeSystemApplet(home(),'manual',4000,{manualTitleId:'0004001000022000'}),'open',4100),back=reduceSystem(document,'back',4200);
 assert.equal(document.system.runtime.instances[document.system.runtime.active].state.screen,'document');assert.equal(back.system.runtime.instances[back.system.runtime.active].state.screen,'main');assert.equal(back.system.runtime.instances[back.system.runtime.active].state.manualFooterClose,undefined);
 assert.equal(reduceSystem(document,'x',4200).system.runtime.systemApplet,null,'document Close is not fitted to Contents feedback');
 const pending=request(state),escaped=escapeUnreadyNativeScreen(pending,4300);assert.equal(escaped.system.phase,'home');assert.equal(escaped.system.runtime.instances[owner],undefined);
 const suspended=reduceSystem(pending,'home',4300);assert.equal(suspended.system.runtime.instances[owner].state.manualFooterClose,undefined);
});

const ms=n=>5000+n*1000/60+.01;
test('first/repeat owner survives every accepted outgoing partial and retires once at out20; HOME requires in20 plus handoff',()=>{
 for(const reduced of[false,true]){
  const p=createManualFooterClosePresentation();let prior;
  for(let cycle=0;cycle<2;cycle++){
   let state=request(invokeSystemApplet(prior??home(),'manual',4000+cycle*2000,{manualTitleId:camera})),step=cycle*100;const owner=state.system.runtime.active,resources={},firmware={};
   const publish=(kind,frame)=>{const pose=p.sample(state,2,ms(step),true,reduced),pair={};assert.equal(pose.kind,kind);if(frame!==null)assert.equal(pose.frame,frame);const r=kind==='out'||kind==='feedback'?resources:firmware;assert.equal(p.bind(pose,pair,r),true);return[p.present(pose,state,2,ms(step++),true,pair,r),pose.identity];};
   for(const frame of reduced?[1]:[0,1])assert.equal(publish('feedback',frame)[0],null);
   for(const frame of reduced?[]:Array.from({length:20},(_,i)=>i)){assert.equal(publish('out',frame)[0],null);assert.ok(state.system.runtime.instances[owner]);}
   const [result,identity]=publish('out',20);assert.equal(result,owner);state=completeManualFooterClose(state,identity,ms(step));assert.equal(state.system.runtime.instances[owner],undefined);assert.equal(state.system.phase,'home');assert.equal(completeManualFooterClose(state,identity,ms(step)),state);
   for(const frame of reduced?[20]:Array.from({length:21},(_,i)=>i))assert.equal(publish('in',frame)[0],null);
   assert.equal(p.active(state,2),true);publish('handoff',null);assert.equal(p.active(state,2),false);prior=state;
  }p.dispose();
 }
});

test('stale title/request/sequence/generation/pair/resource and hidden sleep revocation cannot consume a terminal',()=>{
 const state=request(open()),identity=manualFooterCloseIdentity(state,2),owner=identity.owner,p=createManualFooterClosePresentation(),resources={},pair={};
 const first=p.sample(state,2,0,true,false);p.bind(first,pair,resources);
 for(const [key,value]of[['manualTitleId','0004001000022000'],['requestId','different']]){
  const i=state.system.runtime.instances[owner],changed={...state,system:{...state.system,runtime:{...state.system.runtime,instances:{...state.system.runtime.instances,[owner]:key==='requestId'?{...i,requestId:value}:{...i,state:{...i.state,[key]:value}}}}}};
  assert.equal(p.present(first,changed,2,0,true,pair,resources),null);assert.equal(completeManualFooterClose(changed,identity,0),changed);
 }
 assert.equal(p.present(first,state,3,0,true,pair,resources),null);assert.equal(p.present(first,state,2,0,true,{},resources),null);assert.equal(p.present(first,state,2,0,true,pair,{}),null);assert.equal(p.present(first,state,2,0,false,pair,resources),null);assert.equal(p.present(first,state,2,0,true,pair,undefined),null);
 assert.equal(completeManualFooterClose(state,{...identity,sequence:identity.sequence+1},0),state);
 const asleep={...state,system:{...state.system,sleeping:true}};assert.equal(notesFooterCloseEligible(asleep),false);assert.equal(p.sample(asleep,2,100,false,false),undefined);assert.equal(p.present(first,state,2,100,true,pair,resources),null);
 const resumed=p.sample(state,2,1000,true,false);assert.equal(resumed.frame,0);p.bind(resumed,pair,resources);p.revoke();assert.equal(p.present(resumed,state,2,1000,true,pair,resources),null);p.dispose();assert.equal(p.sample(state,2,1017,true,true),undefined);
});
