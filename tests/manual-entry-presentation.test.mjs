import test from 'node:test';
import assert from 'node:assert/strict';
import { createManualEntryPresentation, manualEntryUpdate } from '../src/os/manual-entry-presentation.ts';
const identity={owner:'manual:1',manualTitleId:'0004001000022400',caller:null,requestId:'home:manual',application:'camera:1',generation:1};
const ms=update=>update*1000/60+.01;
const sample=(session,update,options={})=>session.sample({identity,elapsedMs:ms(update),eligible:true,destinationReady:true,reducedMotion:false,...options});
const present=(session,pose,update,ready=true)=>session.present(pose,identity,ms(update),true,ready);

test('cold incoming rebase receipts cannot spend composition time or publish terminal readiness',()=>{
 for(const frame of [9,20]){
  const s=createManualEntryPresentation();
  for(let out=0;out<=20;out++)present(s,sample(s,100+out),100+out);
  for(let incoming=0;incoming<=frame;incoming++)present(s,sample(s,121+incoming),121+incoming);
  const update=122+frame;s.revoke();
  const cold=sample(s,update,{destinationReady:false});assert.deepEqual([cold.phase,cold.frame],['in',frame]);
  assert.equal(present(s,cold,update+5,true),true);assert.equal(s.ready(identity),false);
  assert.equal(s.destinationCompositionAllowed(identity),true);
  const cached=sample(s,update+6);assert.deepEqual([cached.phase,cached.frame],['in',frame]);
  assert.equal(present(s,cached,update+6),true);
  if(frame===20)assert.equal(s.ready(identity),true);
  else assert.equal(sample(s,update+7).frame,frame+1);
 }
});

test('destination scheduling accepts only a matching terminal receipt, without suppressing retained incoming on rebase',()=>{
 const s=createManualEntryPresentation();
 assert.equal(s.destinationCompositionAllowed(identity),false);
 for(let frame=0;frame<=20;frame++){
  const pose=sample(s,100+frame,{destinationReady:false});
  assert.equal(s.destinationCompositionAllowed(identity),false);
  if(frame===20){assert.equal(s.present(pose,{...identity,generation:2},ms(120),true,false),false);assert.equal(s.destinationCompositionAllowed(identity),false);}
  assert.equal(present(s,pose,100+frame,false),true);
 }
 assert.equal(s.destinationCompositionAllowed(identity),true);
 assert.equal(s.active(identity,false),true,'opaque terminal schedules the first not-yet-published destination');
 for(const key of Object.keys(identity)){
  const next={...identity,[key]:key==='generation'?2:key==='manualTitleId'?'0004001000022000':'other:2'};
  assert.equal(s.destinationCompositionAllowed(next),false);
 }
 s.revoke();assert.equal(s.destinationCompositionAllowed(identity),false);assert.equal(s.active(identity,false),true);
 const terminal=sample(s,121,{destinationReady:false});assert.equal(present(s,terminal,121,false),true);
 const incoming=sample(s,122);assert.equal(present(s,incoming,122),true);
 const in9=sample(s,127);present(s,in9,127);const in10=sample(s,132);present(s,in10,132);
 s.revoke();assert.equal(s.destinationCompositionAllowed(identity),true,'incoming rebase still draws its destination');
 assert.equal(s.destinationCompositionAllowed({...identity,generation:2}),false,'retained incoming cannot authorize a new generation');
 s.reset();assert.equal(s.destinationCompositionAllowed(identity),false);s.dispose();assert.equal(s.destinationCompositionAllowed(identity),false);
});

test('Manual preserves every outgoing pose and requires the incoming first and terminal receipts',()=>{
 const s=createManualEntryPresentation();
 let update=100;
 for(let frame=0;frame<=20;frame++,update++){
  const pose=sample(s,update);assert.deepEqual([pose.phase,pose.frame],['out',frame]);
  assert.equal(sample(s,update+2),pose);assert.equal(s.ready(identity),false);assert.equal(present(s,pose,update),true);
 }
 const incoming=sample(s,update);assert.deepEqual([incoming.phase,incoming.frame],['in',0]);
 assert.equal(sample(s,update+5000),incoming,'unpresented incoming frame zero cannot disappear');
 assert.equal(present(s,incoming,update),true);
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
test('accepted sample elapsed survives later Manual receipts at 20, 30, 45 and 60Hz in both phases',()=>{
 for(const hz of [60,45,30,20]){
  const s=createManualEntryPresentation();let origin=100,receipt=0;
  let pose=sample(s,origin);assert.deepEqual([pose.phase,pose.frame],['out',0]);
  assert.equal(present(s,pose,origin+1),true);
  while(pose.frame<20){
   receipt++;const observed=origin+Math.floor(receipt*60/hz);pose=sample(s,observed);
   assert.deepEqual([pose.phase,pose.frame],['out',Math.min(20,observed-origin)],`${hz}Hz outgoing receipt ${receipt}`);
   assert.equal(sample(s,observed+.4),pose,'pending outgoing pose cannot be replaced');
   assert.equal(present(s,pose,observed+1),true);
  }
  receipt++;const boundary=origin+Math.floor(receipt*60/hz),incoming=sample(s,boundary);
  assert.deepEqual([incoming.phase,incoming.frame],['in',0],`${hz}Hz boundary has no outgoing carry`);
  assert.equal(sample(s,boundary+.4),incoming,'incoming zero requires its own receipt');
  assert.equal(present(s,incoming,boundary+1),true);
  origin=boundary;receipt=0;pose=incoming;
  while(pose.frame<20){
   receipt++;const observed=origin+Math.floor(receipt*60/hz);pose=sample(s,observed);
   assert.deepEqual([pose.phase,pose.frame],['in',Math.min(20,observed-origin)],`${hz}Hz incoming receipt ${receipt}`);
   assert.equal(sample(s,observed+.4),pose,'pending incoming pose cannot be replaced');
   assert.equal(present(s,pose,observed+1),true);
  }
  assert.equal(s.ready(identity),true);
 }
});
test('Manual stalls mint no elapsed credit across recovery or the outgoing-to-incoming boundary',()=>{
 const s=createManualEntryPresentation();
 let pose=sample(s,100);assert.deepEqual([pose.phase,pose.frame],['out',0]);present(s,pose,101);
 pose=sample(s,108);assert.deepEqual([pose.phase,pose.frame],['out',0],'eight accepted-sample ticks are a stall');present(s,pose,109);
 for(const [update,frame]of [[111,3],[117,9],[123,15],[129,20]]){
  pose=sample(s,update);assert.deepEqual([pose.phase,pose.frame],['out',frame]);present(s,pose,update+1);
 }
 pose=sample(s,135);assert.deepEqual([pose.phase,pose.frame],['in',0],'bounded terminal elapsed cannot carry into incoming');present(s,pose,136);
 pose=sample(s,142);assert.deepEqual([pose.phase,pose.frame],['in',0],'incoming stall cannot spend its rejected gap');present(s,pose,143);
 pose=sample(s,145);assert.deepEqual([pose.phase,pose.frame],['in',3],'recovery starts from the accepted stalled sample');present(s,pose,146);
});
test('fresh samples and later paired render receipts cannot strand outgoing Manual in one quantized tick',()=>{
 const s=createManualEntryPresentation();
 for(let frame=0;frame<=12;frame++)present(s,sample(s,100+frame),100+frame);
 // The live scene samples before painting, then acknowledges after rendering.
 // Each receipt crosses a 60Hz boundary ahead of the next sample's tick.
 let update=112;
 const repeated=sample(s,update+.9);assert.deepEqual([repeated.phase,repeated.frame],['out',12]);
 assert.equal(present(s,repeated,update+1.02),true);
 for(let frame=13;frame<=20;frame++){
  update++;const pose=sample(s,update+.9);
  assert.deepEqual([pose.phase,pose.frame],['out',frame]);
  assert.equal(sample(s,update+.95),pose,'only the paired render receipt acknowledges the pending pose');
  assert.equal(s.ready(identity),false);assert.equal(present(s,pose,update+1.02),true);
 }
 update++;const incoming=sample(s,update+.9);
 assert.deepEqual([incoming.phase,incoming.frame],['in',0]);assert.equal(present(s,incoming,update+1.02),true);
 for(let frame=1;frame<=20;frame++){
  update++;const pose=sample(s,update+.9);assert.deepEqual([pose.phase,pose.frame],['in',frame]);
  assert.equal(s.ready(identity),false);assert.equal(present(s,pose,update+1.02),true);
 }
 assert.equal(s.ready(identity),true);
});
test('repeated observations in the same tick cannot mint Manual progress or accept a backwards receipt',()=>{
 const s=createManualEntryPresentation();
 present(s,sample(s,100.1),100.2);
 for(const update of [100.3,100.5,100.8]){
  const pose=sample(s,update);assert.deepEqual([pose.phase,pose.frame],['out',0]);assert.equal(present(s,pose,update+.01),true);
 }
 const advanced=sample(s,101.9);assert.equal(advanced.frame,1);assert.equal(present(s,advanced,102.02),true);
 const overlap=sample(s,102.9);assert.equal(overlap.frame,2);
 assert.equal(present(s,overlap,101.9),false,'receipt monotonicity still uses the accepted render clock');
 assert.equal(sample(s,103.9),overlap);assert.equal(present(s,overlap,104.02),true);
 assert.throws(()=>sample(s,103.9),/backwards/);
});
test('delayed Manual receipts and stalled clocks cannot spend pending time as incoming catch-up',()=>{
 const s=createManualEntryPresentation();
 for(let frame=0;frame<=20;frame++)present(s,sample(s,100+frame),100+frame);
 const incoming=sample(s,121);assert.deepEqual([incoming.phase,incoming.frame],['in',0]);
 for(const update of [122,130,1000])assert.equal(sample(s,update),incoming);
 assert.equal(present(s,incoming,1001.02),true);
 const resumed=sample(s,1001.9);assert.deepEqual([resumed.phase,resumed.frame],['in',0]);
 assert.equal(present(s,resumed,1002.02),true);
 const next=sample(s,1002.9);assert.equal(next.frame,1);assert.equal(present(s,next,1003.02),true);
 const stall=sample(s,1010.9);assert.equal(stall.frame,1);assert.equal(present(s,stall,1011.02),true);
 const wake=sample(s,1011.9);assert.equal(wake.frame,2);s.revoke();assert.equal(present(s,wake,1012.02),false);
 const rebase=sample(s,1012.9);assert.equal(rebase.frame,1);assert.equal(present(s,rebase,1013.02),true);
 assert.equal(sample(s,1013.9).frame,2);assert.equal(s.ready(identity),false);
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
 assert.equal(s.active(identity,false),true);
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
