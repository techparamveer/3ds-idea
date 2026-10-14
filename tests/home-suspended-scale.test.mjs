import test from 'node:test';
import assert from 'node:assert/strict';
import { createHomeSuspendedScalePresentation } from '../src/os/home-suspended-presentation.ts';

const identity=Object.freeze({owner:'health:1',captureGeneration:1,resourceGeneration:2,sequence:3});
test('ScaleUpDown spends one source step per accepted pair and changed HOME update, in both directions',()=>{
 const p=createHomeSuspendedScalePresentation();
 let pose=p.sample(identity,'selected',15,100,true);
 assert.equal(pose.frame,15,'initial HOME Appear keeps its existing expanded endpoint');
 assert.equal(p.ready(identity,'selected',15),false);
 assert.equal(p.present(pose,identity,'selected',15,true),true);
 assert.equal(p.present(pose,identity,'selected',15,true),false,'duplicate receipt');
 let update=101;
 for(const [target,origin,frames] of [[0,'away',Array.from({length:15},(_,i)=>14-i)],[15,'back',Array.from({length:15},(_,i)=>i+1)]]){
  for(const frame of frames){
   pose=p.sample(identity,origin,target,update++,true);
   assert.equal(pose.frame,frame);
   assert.equal(p.sample(identity,origin,target,update+1000,true),pose,'missed publication never skips a pending pose');
   assert.equal(p.ready(identity,origin,target),false);
   assert.equal(p.present(pose,identity,origin,target,true),true);
   const duplicateUpdate=p.sample(identity,origin,target,pose.update,true);
   assert.equal(duplicateUpdate.frame,frame,'same HOME update cannot advance');
   assert.equal(p.present(duplicateUpdate,identity,origin,target,true),true);
  }
  assert.equal(p.ready(identity,origin,target),true);
 }
});

test('rapid reversal starts from the last accepted frame, never an unaccepted candidate',()=>{
 const p=createHomeSuspendedScalePresentation();
 const initial=p.sample(identity,'selected',15,0,true);p.present(initial,identity,'selected',15,true);
 const down=p.sample(identity,'away',0,1,true);p.present(down,identity,'away',0,true);
 assert.equal(p.sample(identity,'away',0,2,true).frame,13);
 const up=p.sample(identity,'back',15,2,true);assert.equal(up.frame,15);
 assert.equal(p.present(up,identity,'back',15,true),true);
 const away=p.sample(identity,'away-again',0,3,true);assert.equal(away.frame,14);
 assert.equal(p.present(up,identity,'back',15,true),false,'superseded receipt');
 assert.equal(p.frame(),15);
 assert.equal(p.ready(identity,'away-again',0),false);
 assert.equal(p.present(away,identity,'away-again',0,true),true,'stale receipt cannot revoke the current pending pair');
});

test('a regressed logical update cannot allow the same later update to advance twice',()=>{
 const p=createHomeSuspendedScalePresentation();
 let pose=p.sample(identity,'selected',15,100,true);p.present(pose,identity,'selected',15,true);
 pose=p.sample(identity,'away',0,101,true);p.present(pose,identity,'away',0,true);
 pose=p.sample(identity,'away',0,50,true);assert.equal(pose.frame,14);p.present(pose,identity,'away',0,true);
 pose=p.sample(identity,'away',0,101,true);assert.equal(pose.frame,14);p.present(pose,identity,'away',0,true);
 assert.equal(p.sample(identity,'away',0,102,true).frame,13);
});

test('hidden, rejected, stale-owner/origin, resource replacement and reset cannot inherit an unaccepted pose',()=>{
 for(const reject of [pose=>[pose,identity,'selected',15,false],pose=>[pose,{...identity,owner:'other'},'selected',15,true],pose=>[pose,identity,'stale',15,true],pose=>[pose,identity,'selected',0,true]]){
  const p=createHomeSuspendedScalePresentation(),pose=p.sample(identity,'selected',15,0,true);
  assert.equal(p.present(...reject(pose)),false);assert.equal(p.frame(),undefined);
 }
 const p=createHomeSuspendedScalePresentation();
 let pose=p.sample(identity,'away',0,0,true);p.present(pose,identity,'away',0,true);
 assert.equal(p.sample(identity,'back',15,1,false),undefined);assert.equal(p.frame(),0);
 pose=p.sample(identity,'back',15,100,true);assert.equal(pose.frame,1);
 p.revoke();assert.equal(p.present(pose,identity,'back',15,true),false);assert.equal(p.frame(),0);
 for(const field of ['captureGeneration','resourceGeneration','sequence','owner']){
  const next={...identity,[field]:field==='owner'?'new-owner':identity[field]+1};
  pose=p.sample(next,'selected',15,101,true);assert.equal(pose.frame,15);assert.equal(p.frame(),undefined);
 }
 p.reset();assert.equal(p.frame(),undefined);assert.equal(p.ready(identity,'selected',15),false);
 assert.equal(p.sample(null,'',0,0,true),undefined);
});

test('reduced motion settles only on its own accepted pair; invalid epochs fail explicitly',()=>{
 const p=createHomeSuspendedScalePresentation();
 let pose=p.sample(identity,'away',0,0,true);p.present(pose,identity,'away',0,true);
 pose=p.sample(identity,'back',15,0,true,true);assert.equal(pose.frame,15);assert.equal(p.ready(identity,'back',15),false);
 assert.equal(p.present(pose,identity,'back',15,true),true);assert.equal(p.ready(identity,'back',15),true);
 for(const value of [-1,.5,NaN,Infinity])assert.throws(()=>p.sample(identity,'back',15,value,true),RangeError);
});
