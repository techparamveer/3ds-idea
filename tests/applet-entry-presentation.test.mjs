import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppletEntryPresentation, appletEntryIdentity, appletEntryHomePair, appletEntryBackingMatches, sameAppletEntryIdentity } from '../src/os/applet-entry-presentation.ts';
import { createPortfolioState, tickSystem, invokeSystemApplet, reduceSystem, launchHomeShortcut } from '../src/os/system.ts';
import { enableHomeControls, selectHomeToolbarControlTouch } from '../src/os/home-controls.ts';

const identity={owner:'browser:1',appId:'browser',caller:null,requestId:null,application:null,generation:1};
const ms=step=>10000+step*1000/60+.01;
const sample=(s,step,overrides={})=>s.sample({identity,elapsedMs:ms(step),eligible:true,reducedMotion:false,...overrides});
const present=(s,pose,step,pair)=>s.present(pose,identity,ms(step),true,pair);

test('all 21 outgoing poses survive repeated paints and only a matching destination render receipt releases the cover',()=>{
 const s=createAppletEntryPresentation(),pair={};
 for(let frame=0;frame<=20;frame++){
  const pose=sample(s,frame,{pair});assert.deepEqual([pose.kind,pose.frame],['cover',frame]);
  assert.equal(sample(s,frame+.5,{pair}),pose);assert.equal(s.ready(identity),false);
  assert.equal(present(s,pose,frame,pair),true);assert.equal(present(s,pose,frame,pair),false);
 }
 const handoff=sample(s,21,{pair});assert.equal(handoff.kind,'handoff');assert.equal(s.ready(identity),false);
 assert.equal(present(s,handoff,21,{}),false);assert.equal(s.ready(identity),false);
 const current={};const rebound=s.bindPreparedPair(current);
 assert.equal(present(s,handoff,21,pair),false);assert.equal(present(s,rebound,21,current),true);
 assert.equal(s.ready(identity),true);assert.equal(s.active(identity,current),false);
 assert.equal(sample(s,22,{pair:current}),undefined);
 s.revoke();assert.equal(s.ready(identity),true,'a completed owner resume does not replay the outgoing cover');
});

test('outgoing cover follows bounded elapsed updates at ordinary render cadences instead of receipt count',()=>{
 for(const hz of [60,45,30,20]){
  const s=createAppletEntryPresentation();let receiptCount=0,pose=sample(s,100);present(s,pose,100);
  while(pose.frame<20){
   receiptCount++;const elapsedUpdates=Math.floor(receiptCount*60/hz),observed=100+elapsedUpdates;
   pose=sample(s,observed);assert.deepEqual([pose.kind,pose.frame],['cover',Math.min(20,elapsedUpdates)],`${hz}Hz receipt ${receiptCount}`);
   assert.equal(present(s,pose,observed),true);
  }
  assert.equal(receiptCount,Math.ceil(20*hz/60),`${hz}Hz receipt count`);
 }
});

test('acknowledged cover samples retain ordinary render time without advancing a pending pose',()=>{
 const s=createAppletEntryPresentation();
 const zero=sample(s,0);assert.equal(zero.frame,0);assert.equal(sample(s,1),zero);present(s,zero,1);
 const two=sample(s,2);assert.equal(two.frame,2);assert.equal(sample(s,3),two);present(s,two,3);
 const four=sample(s,4);assert.equal(four.frame,4);assert.equal(sample(s,5),four);present(s,four,5);
 assert.equal(sample(s,6).frame,6);
});

test('bounded pending time becomes eligible only after acknowledgement while render stalls and revocation rebase it',()=>{
 const bounded=createAppletEntryPresentation(),pending=sample(bounded,0);
 assert.equal(sample(bounded,4),pending);present(bounded,pending,5);
 assert.equal(sample(bounded,6).frame,6,'accepted sample origin retains a bounded pending interval');

 const delayed=createAppletEntryPresentation(),late=sample(delayed,0);
 assert.equal(sample(delayed,4),late);present(delayed,late,7);
 const held=sample(delayed,8);assert.equal(held.frame,0,'eight sampled updates are a stall');
 assert.equal(sample(delayed,9),held);present(delayed,held,9);
 assert.equal(sample(delayed,10).frame,2,'the acknowledged hold resets the sample origin');

 const blocked=createAppletEntryPresentation(),old=sample(blocked,0),foreign={...identity,generation:2};
 assert.equal(blocked.present(old,foreign,ms(1),true),false);blocked.revoke();
 assert.equal(present(blocked,old,2),false);
 const rebased=sample(blocked,4);assert.equal(rebased.frame,0);present(blocked,rebased,5);
 assert.equal(sample(blocked,6).frame,2,'revocation discards blocked publication time');
});

test('cover catch-up publishes terminal20 before title incoming0, whose quantized sample and receipt may overlap',()=>{
 const s=createAppletEntryPresentation(),friend={...identity,owner:'friends:1',appId:'friends'},pair={},resources={};
 const friendSample=(step,overrides={})=>s.sample({identity:friend,elapsedMs:ms(step),eligible:true,pair,incomingResources:resources,reducedMotion:false,...overrides});
 const friendPresent=(pose,step)=>s.present(pose,friend,ms(step),true,pair,resources);
 let pose=friendSample(0);friendPresent(pose,0);
 for(const [step,frame]of [[6,6],[12,12],[18,18]]){pose=friendSample(step);assert.equal(pose.frame,frame);friendPresent(pose,step);}
 const terminal=friendSample(20);assert.deepEqual([terminal.kind,terminal.frame],['cover',20]);
 assert.equal(friendSample(21),terminal,'terminal remains the exact pending pose until publication');
 assert.equal(friendPresent(terminal,21),true);
 const incoming=friendSample(22);assert.deepEqual([incoming.kind,incoming.frame],['incoming',0]);friendPresent(incoming,23);
 const one=friendSample(23);assert.deepEqual([one.kind,one.frame],['incoming',1]);
 assert.equal(friendSample(24),one,'an unacknowledged incoming pose remains exact');friendPresent(one,24);
 assert.equal(friendSample(24).frame,2,'a crossed sample tick survives the later receipt quantization');
});

test('incoming elapsed progress waits for acknowledgement while stalls and revocation rebase it',()=>{
 const setup=()=>{
  const s=createAppletEntryPresentation(),title={...identity,owner:'notifications:1',appId:'notifications'},pair={},resources={};
  const next=(step,overrides={})=>s.sample({identity:title,elapsedMs:ms(step),eligible:true,pair,incomingResources:resources,reducedMotion:false,...overrides});
  const accept=(pose,step,nextIdentity=title)=>s.present(pose,nextIdentity,ms(step),true,pair,resources);
  let pose=next(0);accept(pose,0);
  for(const step of [6,12,18,20]){pose=next(step);accept(pose,step);}
  pose=next(21);assert.deepEqual([pose.kind,pose.frame],['incoming',0]);accept(pose,22);
  return {s,title,pair,resources,next,accept};
 };

 const bounded=setup(),pending=bounded.next(23);
 assert.equal(pending.frame,2);assert.equal(bounded.next(27),pending);bounded.accept(pending,28);
 assert.equal(bounded.next(29).frame,8,'bounded pending time becomes eligible only after acknowledgement');

 const ordinary=setup();
 assert.equal(ordinary.next(27).frame,6,'incoming consumes bounded accepted-sample elapsed time');

 const stalled=setup(),held=stalled.next(29);
 assert.equal(held.frame,0,'eight sampled updates are a stall');assert.equal(stalled.next(30),held);stalled.accept(held,30);
 assert.equal(stalled.next(30).frame,1,'the acknowledged hold resets the incoming sample origin');

 const blocked=setup(),old=blocked.next(23),foreign={...blocked.title,generation:2};
 assert.equal(blocked.accept(old,24,foreign),false);blocked.s.revoke();assert.equal(blocked.accept(old,25),false);
 const rebased=blocked.next(26);assert.equal(rebased.frame,0);blocked.accept(rebased,27);
 assert.equal(blocked.next(27).frame,1,'revocation discards blocked incoming publication time');
});

test('incoming elapsed catch-up still publishes title terminal20 before handoff and preserves reduced receipts',()=>{
 const create=(reducedMotion=false)=>{
  const s=createAppletEntryPresentation(),title={...identity,owner:'notifications:1',appId:'notifications'},pair={},resources={};
  const next=(step)=>s.sample({identity:title,elapsedMs:ms(step),eligible:true,pair,incomingResources:resources,reducedMotion});
  const accept=(pose,step)=>s.present(pose,title,ms(step),true,pair,resources);
  return {s,next,accept};
 };
 const normal=create();let pose=normal.next(0);normal.accept(pose,0);
 for(const step of [6,12,18,20]){pose=normal.next(step);normal.accept(pose,step);}
 pose=normal.next(21);normal.accept(pose,22);
 for(const [step,frame]of [[27,6],[33,12],[39,18]]){pose=normal.next(step);assert.deepEqual([pose.kind,pose.frame],['incoming',frame]);normal.accept(pose,step+1);}
 pose=normal.next(41);assert.deepEqual([pose.kind,pose.frame],['incoming',20]);
 assert.equal(normal.next(42),pose,'incoming20 remains pending until its own receipt');normal.accept(pose,42);
 assert.equal(normal.next(42).kind,'handoff','incoming20 requires its own receipt before handoff');

 const reduced=create(true),cover20=reduced.next(0);assert.deepEqual([cover20.kind,cover20.frame],['cover',20]);reduced.accept(cover20,0);
 const incoming20=reduced.next(0);assert.deepEqual([incoming20.kind,incoming20.frame],['incoming',20]);reduced.accept(incoming20,0);
 const handoff=reduced.next(0);assert.equal(handoff.kind,'handoff');
});

test('absent prepared pairs hold the source terminal; stalls and invalid publication rebase that hold',()=>{
 const s=createAppletEntryPresentation();
 for(let frame=0;frame<=20;frame++)present(s,sample(s,frame),frame);
 assert.equal(s.active(identity),false);const held=sample(s,21);assert.deepEqual([held.kind,held.frame],['cover',20]);
 assert.equal(s.active(identity),true,'an unacknowledged held pair remains pending');present(s,held,21);
 assert.equal(s.active(identity),false);
 const pair={};assert.equal(s.active(identity,pair),true);
 const stalled=sample(s,500,{pair});assert.deepEqual([stalled.kind,stalled.frame],['cover',20]);present(s,stalled,500,pair);
 const release=sample(s,501,{pair});assert.equal(release.kind,'handoff');s.revoke();
 assert.equal(present(s,release,502,pair),false);
 const repeat=sample(s,502,{pair});assert.deepEqual([repeat.kind,repeat.frame],['cover',20]);present(s,repeat,502,pair);
 assert.equal(sample(s,503,{pair}).kind,'handoff');
});

test('hidden, failed and delayed receipts never spend elapsed time as source motion',()=>{
 const s=createAppletEntryPresentation();present(s,sample(s,0),0);present(s,sample(s,1),1);
 const abandoned=sample(s,2);s.revoke();assert.equal(present(s,abandoned,3),false);
 const repeat=sample(s,500);assert.equal(repeat.frame,1);present(s,repeat,700);
 const delayed=sample(s,701);assert.equal(delayed.frame,1,'a long paint is a stall, not retained motion');present(s,delayed,701);
 assert.equal(sample(s,702).frame,2);s.revoke();
 assert.equal(sample(s,702,{eligible:false}),undefined);
 const shown=sample(s,1000);assert.equal(shown.frame,1);present(s,shown,1000);
 const stalled=sample(s,1500);assert.equal(stalled.frame,1);present(s,stalled,1500);
 assert.equal(sample(s,1501).frame,2);
});

test('reduced motion needs source20 then a distinct handoff receipt and cannot skip a revoked endpoint',()=>{
 const s=createAppletEntryPresentation(),pair={};
 const endpoint=sample(s,0,{reducedMotion:true,pair});assert.equal(endpoint.frame,20);assert.equal(s.ready(identity),false);
 present(s,endpoint,0,pair);const handoff=sample(s,0,{reducedMotion:true,pair});assert.equal(handoff.kind,'handoff');
 s.revoke();const repeated=sample(s,100,{reducedMotion:true,pair});assert.equal(repeated.kind,'cover');assert.equal(repeated.frame,20);
 present(s,repeated,100,pair);assert.equal(present(s,sample(s,100,{reducedMotion:true,pair}),100,pair),true);
 assert.equal(s.ready(identity),true);assert.equal(sample(s,101,{pair}),undefined);
});

test('owner, caller, request, runtime application, applet and firmware generation reject stale receipts',()=>{
 for(const patch of [{owner:'friends:2'},{caller:'camera:1'},{requestId:'request:2'},{application:'camera:1'},{appId:'notifications'},{generation:2}]){
  const s=createAppletEntryPresentation(),pose=sample(s,0),next={...identity,...patch};
  assert.equal(sameAppletEntryIdentity(identity,next),false);assert.equal(s.present(pose,next,ms(1),true),false);
  const replacement=sample(s,2,{identity:next});assert.equal(replacement.frame,0);assert.notEqual(replacement,pose);
  assert.equal(s.present(pose,identity,ms(3),true),false);
 }
 const s=createAppletEntryPresentation(),pose=sample(s,0);s.reset();assert.equal(present(s,pose,1),false);
 const next=sample(s,2);s.dispose();assert.equal(present(s,next,3),false);assert.equal(sample(s,4),undefined);assert.equal(s.active(identity,{}),false);
});

test('matching HOME source requires the original selected toolbar applet, runtime application and generation',()=>{
 const home=enableHomeControls(tickSystem(createPortfolioState(),3001));
 for(const [focus,appId]of ['game-notes','friends','notifications','browser','miiverse'].entries()){
  const selected=selectHomeToolbarControlTouch(home,focus+1),state=invokeSystemApplet(selected,appId,3010);
  const source=appletEntryHomePair(selected,1),id=appletEntryIdentity(state,1);
  assert.equal(source.appId,appId);assert.equal(appletEntryBackingMatches(source,id),true);
  for(const patch of [{generation:2},{appId:appId==='friends'?'browser':'friends'},{application:'camera:1'},{caller:'camera:1'}])assert.equal(appletEntryBackingMatches(source,{...id,...patch}),false);
  assert.equal(appletEntryHomePair(home,1),null);assert.equal(appletEntryHomePair(state,1),null);
  assert.equal(appletEntryIdentity({...state,system:{...state.system,runtime:{...state.system.runtime,active:'other'}}},1),null);
 }
 const camera=tickSystem(launchHomeShortcut(home,'camera',3010),6200),suspended=reduceSystem(camera,'home',6300);
 const selected=selectHomeToolbarControlTouch(suspended,1),notes=invokeSystemApplet(selected,'game-notes',6400);
 assert.equal(appletEntryBackingMatches(appletEntryHomePair(selected,1),appletEntryIdentity(notes,1)),true);
 assert.equal(notes.system.runtime.application,camera.system.runtime.active);
});

test('invalid fresh clocks and genuinely backwards observations fail explicitly',()=>{
 for(const elapsedMs of [-1,NaN,Infinity,Number.MAX_VALUE])assert.throws(()=>sample(createAppletEntryPresentation(),0,{elapsedMs}),/timestamp/);
 const s=createAppletEntryPresentation();present(s,sample(s,0),3);
 assert.throws(()=>sample(s,2),/clock moved backwards/);
 assert.throws(()=>sample(createAppletEntryPresentation(),0,{identity:{...identity,generation:-1}}),/identity/);
});

test('accessibility adaptation completes only its exact identity and cannot be inherited by replacement, reset or disposal',()=>{
 for(const patch of [{owner:'friends:2'},{caller:'camera:1'},{requestId:'other'},{application:'camera:1'},{appId:'friends'},{generation:2}]){
  const s=createAppletEntryPresentation();s.skipAccessibilityShortcut(identity);assert.equal(s.ready(identity),true);
  const next={...identity,...patch};assert.equal(s.ready(next),false);assert.equal(sample(s,0,{identity:next}).frame,0);
 }
 const s=createAppletEntryPresentation();s.skipAccessibilityShortcut(identity);s.reset();assert.equal(s.ready(identity),false);
 s.skipAccessibilityShortcut(identity);s.dispose();assert.equal(s.ready(identity),false);s.skipAccessibilityShortcut(identity);assert.equal(s.ready(identity),false);
});
