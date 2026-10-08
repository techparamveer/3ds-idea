import test from 'node:test';
import assert from 'node:assert/strict';
import { createManualEntryPresentation, manualEntryUpdate } from '../src/os/manual-entry-presentation.ts';
const identity={owner:'manual:1',manualTitleId:'0004001000022400',caller:null,requestId:'home:manual',application:'camera:1',generation:1};
const ms=update=>update*1000/60+.01;
const sample=(session,update,options={})=>session.sample({identity,elapsedMs:ms(update),eligible:true,destinationReady:true,reducedMotion:false,...options});
const present=(session,pose,update,ready=true)=>session.present(pose,identity,ms(update),true,ready);

test('Manual preserves every outgoing pose and requires the incoming first and terminal receipts',()=>{
 const s=createManualEntryPresentation();
 let update=100;
 for(let frame=0;frame<=20;frame++,update+=3){
  const pose=sample(s,update);assert.deepEqual([pose.phase,pose.frame],['out',frame]);
  assert.equal(sample(s,update+2),pose);assert.equal(s.ready(identity),false);assert.equal(present(s,pose,update),true);
 }
 const incoming=sample(s,update);assert.deepEqual([incoming.phase,incoming.frame],['in',0]);
 assert.equal(sample(s,update+5000),incoming,'unpresented incoming frame zero cannot disappear');
 assert.equal(present(s,incoming,update+5000),true);update+=5000;
 let terminal;
 for(const frame of [5,10,15,20]){update+=5;terminal=sample(s,update);assert.deepEqual([terminal.phase,terminal.frame],['in',frame]);if(frame<20)present(s,terminal,update);}
 assert.equal(s.ready(identity),false);assert.equal(sample(s,update+5000),terminal,'unpresented incoming terminal cannot disappear');
 assert.equal(present(s,terminal,update),true);
 assert.equal(s.ready(identity),true);assert.equal(s.active(identity,true),false);assert.equal(sample(s,update),undefined);
});
test('incoming follows bounded elapsed updates at ordinary render cadences instead of receipt count',()=>{
 for(const hz of [60,45,30,20]){
  const s=createManualEntryPresentation();let update=100;
  for(let frame=0;frame<=20;frame++,update++)present(s,sample(s,update),update);
  const first=sample(s,update);assert.deepEqual([first.phase,first.frame],['in',0]);present(s,first,update);
  let receiptCount=1;
  while(!s.ready(identity)){
   const elapsedUpdates=Math.floor(receiptCount*60/hz),observed=update+elapsedUpdates;
   const pose=sample(s,observed);assert.deepEqual([pose.phase,pose.frame],['in',Math.min(20,elapsedUpdates)],`${hz}Hz receipt ${receiptCount}`);
   assert.equal(present(s,pose,observed),true);receiptCount++;
  }
  assert.equal(receiptCount-1,Math.ceil(20*hz/60),`${hz}Hz receipt count`);
 }
});
test('a reset repeats the incoming cadence without carrying elapsed credit from the prior opening',()=>{
 const s=createManualEntryPresentation();
 for(const start of [100,1000]){
  let update=start;
  for(let frame=0;frame<=20;frame++,update++)present(s,sample(s,update),update);
  let pose=sample(s,update);assert.deepEqual([pose.phase,pose.frame],['in',0]);present(s,pose,update);
  for(const frame of [4,8,12,16,20]){update+=4;pose=sample(s,update);assert.deepEqual([pose.phase,pose.frame],['in',frame]);present(s,pose,update);}
  assert.equal(s.ready(identity),true);s.reset();
 }
});
test('destination readiness cannot synthesize an outgoing terminal or spend an opaque hold',()=>{
 const s=createManualEntryPresentation();let pose;
 for(let update=0;update<=20;update++){pose=sample(s,update,{destinationReady:false});present(s,pose,update,false);}
 assert.equal(s.active(identity,false),false);
 const hold=sample(s,21,{destinationReady:false});assert.deepEqual([hold.phase,hold.frame],['out',20]);
 assert.equal(sample(s,22,{destinationReady:true}),hold,'readiness does not overwrite an unpresented hold');
 present(s,hold,22);
 const incoming=sample(s,23);assert.deepEqual([incoming.phase,incoming.frame],['in',0]);
 assert.equal(present(s,incoming,23,false),false,'a missing complete destination pair rejects reveal receipt');
});
test('hidden, failed, Retry and stalled intervals rebase the last presented pose without catch-up',()=>{
 const s=createManualEntryPresentation();let update=100;
 for(let frame=0;frame<=20;frame++,update++)present(s,sample(s,update),update);
 present(s,sample(s,update),update);
 const unpresented=sample(s,update+2);assert.equal(unpresented.frame,2);s.revoke();
 assert.equal(present(s,unpresented,update+4),false);
 const resumed=sample(s,update+5);assert.equal(resumed.frame,0);present(s,resumed,update+5);
 const next=sample(s,update+6);assert.equal(next.frame,1);present(s,next,update+6);
 const stall=sample(s,5000);assert.equal(stall.frame,1);present(s,stall,5000);
 assert.equal(sample(s,5003).frame,4);
 s.revoke();assert.equal(sample(s,5004,{eligible:false}),undefined);
 const wake=sample(s,5005);assert.equal(wake.frame,1);present(s,wake,5005);
 assert.equal(sample(s,5006).frame,2);
});
test('owner, title, caller, request, application and generation invalidate old receipts; reset and disposal are final',()=>{
 for(const key of Object.keys(identity)){
  const s=createManualEntryPresentation(),old=sample(s,100);
  const next={...identity,[key]:key==='generation'?2:key==='manualTitleId'?'0004001000022000':'other:2'};
  const fresh=sample(s,101,{identity:next});assert.equal(fresh.frame,0);
  assert.equal(s.present(old,identity,ms(101),true,true),false);
  assert.equal(s.present(fresh,next,ms(101),true,true),true);
  s.reset();assert.equal(sample(s,102).frame,0);s.dispose();assert.equal(sample(s,103),undefined);
 }
});
test('reduced motion still requires outgoing endpoint then incoming endpoint receipts and cannot replay',()=>{
 const s=createManualEntryPresentation(),out=sample(s,100,{reducedMotion:true});
 assert.deepEqual([out.phase,out.frame],['out',20]);assert.equal(s.ready(identity),false);present(s,out,100);
 const incoming=sample(s,101,{reducedMotion:true});assert.deepEqual([incoming.phase,incoming.frame],['in',20]);
 s.revoke();assert.equal(present(s,incoming,102),false);
 const rebase=sample(s,102,{reducedMotion:true});assert.equal(rebase.phase,'out');present(s,rebase,102);
 const terminal=sample(s,103,{reducedMotion:true});present(s,terminal,103);
 assert.equal(s.ready(identity),true);s.revoke();assert.equal(s.ready(identity),false);
 const restored=sample(s,104);assert.deepEqual([restored.phase,restored.frame],['in',20]);present(s,restored,104);assert.equal(s.ready(identity),true);
});
test('invalid clocks and selected Manual identities fail explicitly',()=>{
 for(const now of [-1,NaN,Infinity])assert.throws(()=>manualEntryUpdate(now),/timestamp/);
 assert.throws(()=>sample(createManualEntryPresentation(),0,{identity:{...identity,manualTitleId:''}}),/identity/);
 const s=createManualEntryPresentation();present(s,sample(s,100),100);assert.throws(()=>sample(s,99),/backwards/);
});
