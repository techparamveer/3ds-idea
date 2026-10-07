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
 assert.equal(sample(s,701).frame,2);s.revoke();
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
