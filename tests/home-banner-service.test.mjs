import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createHomeBannerService, requestHomeBannerService, getHomeBannerResourceTicket,
  advanceHomeBannerService, syncHomeBannerService,
} from '../src/os/home-banner-service.ts';
import {
  setHomeBannerVisibility, setHomeBannerBackgroundAttached, showHomeBannerBackground,
  startHomeBannerBackgroundLoop,
} from '../src/os/home-banner-lifecycle.ts';

const folder = (key='folder-instance:1',nativeType=9) => ({kind:'folder',key,nativeType});
const app = {kind:'app',key:'app:work',nativeType:1};
const blank = {kind:'blank',key:'blank',nativeType:7};
const input = (state,patch={}) => ({managerInhibited:false,sceneInhibited:false,loadInhibited:false,
  nativeWorkerReady:true,resourceReady:getHomeBannerResourceTicket(state),...patch});
const fresh = () => createHomeBannerService({generation:'session:1',updateCount:100});
const request = (state,target=folder(),options) => requestHomeBannerService(state,{target,options});
const advance = (state,n=1,patch={}) => advanceHomeBannerService(state,n,input(state,patch));
const motion = state => state.lifecycle.active.folder;
const activated = target => advance(request(fresh(),target),7);
const settled = () => advance(activated(folder()),6);

test('initial normal-folder gate executes five returns, sixth release, later ready activation then manager and clips',()=>{
  let state=request(fresh());const token=getHomeBannerResourceTicket(state);
  // Original 0x249e84 executed in private banner-scheduling/gate-and-order.json.
  for(const count of [1,2,3,4,5]){
    state=advance(state);assert.equal(state.waitUpdates,count);assert.equal(state.stage,'gate');assert.equal(state.lifecycle.active,null);
  }
  state=advance(state);assert.equal(state.stage,'loading');assert.equal(state.waitUpdates,5);assert.equal(state.lifecycle.active,null);
  state=advance(state,3,{resourceReady:null});assert.equal(state.lifecycle.active,null);
  state=advance(state,2,{nativeWorkerReady:false,resourceReady:token});assert.equal(state.lifecycle.active,null);
  state=advance(state,1,{resourceReady:token});assert.equal(state.stage,'active');
  assert.equal(motion(state).visible,true);assert.equal(motion(state).yawCounter,1);
  assert.equal(motion(state).skeletal.frame,1);assert.equal(motion(state).material.frame,1);
  assert.equal(state.lifecycle.active.activatedAtManagerUpdate,state.lifecycle.managerUpdates-1);
  assert.equal(state.lifecycle.active.activatedAtSceneUpdate,state.lifecycle.sceneUpdates-1);
});

test('visible replacement advances four attached fade frames, detaches, enters gate next pass, then waits',()=>{
  const initial=settled(), oldFrame=motion(initial).skeletal.frame, oldYaw=motion(initial).yawCounter;
  let state=request(initial,folder('folder-instance:2'));
  for(let i=1;i<=4;i++){
    state=advance(state);assert.equal(state.stage,'hiding');assert.equal(motion(state).visible,true);
    assert.equal(motion(state).skeletal.frame,oldFrame+i);assert.equal(state.waitUpdates,0);
  }
  state=advance(state);assert.equal(motion(state).visible,false);assert.equal(state.stage,'hiding');
  assert.equal(motion(state).skeletal.frame,oldFrame+4);
  state=advance(state);assert.equal(state.stage,'gate');assert.equal(state.waitUpdates,0);
  for(const count of [1,2,3,4,5]){
    state=advance(state);assert.equal(state.waitUpdates,count);assert.equal(state.stage,'gate');
    assert.equal(motion(state).skeletal.frame,oldFrame+4);
  }
  assert.equal(motion(state).yawCounter,oldYaw+11);
  state=advance(state);assert.equal(state.stage,'loading');assert.equal(state.lifecycle.active,null);
  state=advance(state);assert.equal(state.lifecycle.active.target.key,'folder-instance:2');
  assert.equal(state.lifecycle.activationEpoch,2);assert.equal(motion(state).yawCounter,1);assert.equal(motion(state).skeletal.frame,1);
});

test('already-hidden primary gets a state2 boundary pass and retains yaw updates through all gate waits',()=>{
  let state=settled();state={...state,lifecycle:setHomeBannerVisibility(state.lifecycle,false,true)};
  state=advance(request(state,folder('folder-instance:2')));assert.equal(state.stage,'hiding');
  const retainedFrame=motion(state).skeletal.frame;
  for(const count of [0,1,2,3,4,5]){
    state=advance(state);assert.equal(state.stage,'gate');assert.equal(state.waitUpdates,count);
    assert.equal(motion(state).skeletal.frame,retainedFrame);
  }
  assert.equal(motion(state).yawCounter,7,'hide of an already-hidden primary resets its native yaw before updating');
  state=advance(state);assert.equal(state.stage,'loading');assert.equal(state.lifecycle.active,null);
});

test('deduplicated request and reversal before hiding preserve activation; reversal during hiding reloads',()=>{
  const initial=settled();assert.equal(request(initial),initial);
  const reversed=request(request(initial,folder('folder-instance:2')),folder());
  let state=advance(reversed);assert.equal(state.stage,'active');assert.equal(state.lifecycle.activationEpoch,1);
  assert.equal(motion(state).yawCounter,motion(initial).yawCounter+1);
  state=advance(request(initial,folder('folder-instance:2')));assert.equal(state.stage,'hiding');
  state=request(state,folder());const ticket=getHomeBannerResourceTicket(state);
  state=advance(state,12,{resourceReady:ticket});assert.equal(state.stage,'active');
  assert.equal(state.lifecycle.activationEpoch,2);assert.equal(state.lifecycle.active.target.key,folder().key);
});

test('stale async epochs cannot activate retargeted loading requests; readiness has no implicit timeout',()=>{
  let state=advance(request(fresh()),6), stale=getHomeBannerResourceTicket(state);
  state=request(state,folder('folder-instance:2'));
  assert.equal(state.stage,'loading');assert.equal(state.waitUpdates,0);
  state=advance(state,50,{resourceReady:stale});assert.equal(state.lifecycle.active,null);
  state=advance(state,50,{resourceReady:null});assert.equal(state.lifecycle.active,null);
  state=advance(state);assert.equal(state.lifecycle.active.target.key,'folder-instance:2');assert.equal(motion(state).yawCounter,1);
});

test('retarget during state1 restarts the wait counter but keeps the same native gate stage',()=>{
  let state=advance(request(fresh()),4);assert.equal(state.waitUpdates,4);
  state=request(state,folder('folder-instance:2'));assert.equal(state.waitUpdates,0);assert.equal(state.stage,'gate');
  state=advance(state,5);assert.equal(state.waitUpdates,5);assert.equal(state.stage,'gate');
  state=advance(state);assert.equal(state.stage,'loading');
});

test('load inhibition freezes a partial wait, while eligible manager and scene passes continue',()=>{
  let state=advance(request(fresh()),2);
  const manager=state.lifecycle.managerUpdates,scene=state.lifecycle.sceneUpdates;
  state=advance(state,3,{loadInhibited:true});assert.equal(state.waitUpdates,2);assert.equal(state.loadDeferred,true);
  assert.equal(state.lifecycle.managerUpdates,manager+3);assert.equal(state.lifecycle.sceneUpdates,scene+3);
  for(const count of [3,4,5]){state=advance(state);assert.equal(state.waitUpdates,count);assert.equal(state.loadDeferred,true);}
  state=advance(state,1,{nativeWorkerReady:false});assert.equal(state.stage,'gate');assert.equal(state.loadDeferred,false);
  state=advance(state);assert.equal(state.stage,'loading');
});

test('manager and scene inhibition are independent and consume the host ticks without catch-up',()=>{
  const initial=settled();let state=advance(initial,5,{managerInhibited:true});
  assert.equal(state.lifecycle.managerUpdates,initial.lifecycle.managerUpdates);
  assert.equal(motion(state).yawCounter,motion(initial).yawCounter);
  assert.equal(motion(state).skeletal.frame,motion(initial).skeletal.frame+5);
  state=advance(state,4,{sceneInhibited:true});
  assert.equal(motion(state).yawCounter,motion(initial).yawCounter+4);
  assert.equal(motion(state).skeletal.frame,motion(initial).skeletal.frame+5);
  const waiting=advance(request(fresh()),8,{managerInhibited:true});assert.equal(waiting.waitUpdates,0);assert.equal(waiting.stage,'gate');
  assert.equal(waiting.clock.updateCount,108);assert.equal(advance(waiting).waitUpdates,1);
});

test('type0 waits without counting; native types6/13 bypass counter/inhibition but still require readiness',()=>{
  let state=advance(request(fresh(),{...blank,nativeType:0}),10);assert.equal(state.stage,'gate');assert.equal(state.waitUpdates,0);
  state=request(advance(request(fresh()),6),{...blank,nativeType:0});
  state=advance(state,10);assert.equal(state.stage,'loading');assert.equal(state.lifecycle.active,null,'native state3 also returns for type0');
  for(const type of [6,13]){
    state=request(fresh(),{...blank,nativeType:type});
    state=advance(state,1,{loadInhibited:true,nativeWorkerReady:false});assert.equal(state.stage,'gate');assert.equal(state.waitUpdates,0);
    state=advance(state,1,{loadInhibited:true});assert.equal(state.stage,'loading');assert.equal(state.waitUpdates,0);
  }
});

test('non-folder primary release requires explicit visibility for that activation and session',()=>{
  for(const target of [app,blank]){
    let state=activated(target);assert.equal(state.lifecycle.active.folder,null);
    state=advance(request(state,folder()));assert.equal(state.stage,'hiding');
    state=advance(state,20);assert.equal(state.stage,'hiding');
    for(const stale of [
      {generation:'old-session',activationEpoch:1,visible:false},
      {generation:'session:1',activationEpoch:0,visible:false},
      {generation:'session:1',activationEpoch:1,visible:true},
    ]){state=advance(state,1,{nonFolderPrimary:stale});assert.equal(state.stage,'hiding');}
    state=advance(state,1,{nonFolderPrimary:{generation:'session:1',activationEpoch:1,visible:false}});
    assert.equal(state.stage,'gate');assert.equal(state.waitUpdates,0);
    state=advance(state,7);assert.equal(state.stage,'active');assert.equal(motion(state).yawCounter,1);
  }
});

test('batching interleaves native passes and is identical to one-tick stepping under constant inputs',()=>{
  for(const count of [0,1,4,5,6,11,12,13,30,610]) for(const initial of [request(fresh()),request(settled(),folder('folder-instance:2'))]){
    for(const patch of [{},{managerInhibited:true},{sceneInhibited:true},{loadInhibited:true},{nativeWorkerReady:false}]){
      const inputs=input(initial,patch);let stepped=initial;
      for(let i=0;i<count;i++)stepped=advanceHomeBannerService(stepped,1,inputs);
      assert.deepEqual(advanceHomeBannerService(initial,count,inputs),stepped);
    }
  }
  const initial=settled(),inputs=input(initial,{request:{target:folder(),options:{forceReload:true}},resourceReady:null});
  const batch=advanceHomeBannerService(initial,5,inputs);
  let stepped=advanceHomeBannerService(initial,1,inputs);
  for(let i=1;i<5;i++)stepped=advanceHomeBannerService(stepped,1,{...inputs,request:undefined});
  assert.deepEqual(batch,stepped);assert.equal(batch.lifecycle.requested.epoch,2,'request is applied once, not per batched tick');
});

test('shared counter sampling is idempotent; generation reset invalidates tickets and never replays old elapsed time',()=>{
  let state=request(fresh());const token=getHomeBannerResourceTicket(state),inputs=input(state);
  state=syncHomeBannerService(state,{generation:'session:1',updateCount:107},inputs);
  assert.equal(motion(state).yawCounter,1);
  assert.equal(syncHomeBannerService(state,{generation:'session:1',updateCount:107},inputs),state);
  assert.throws(()=>syncHomeBannerService(state,{generation:'session:1',updateCount:0},inputs),/new generation/);
  state=syncHomeBannerService(state,{generation:'session:2',updateCount:900},{...inputs,request:{target:folder()}});
  assert.equal(state.clock.updateCount,900);assert.equal(state.lifecycle.managerUpdates,0);assert.equal(state.waitUpdates,0);
  assert.equal(state.lifecycle.requested.epoch,token.requestEpoch,'session distinguishes otherwise identical request numbers');
  state=syncHomeBannerService(state,{generation:'session:2',updateCount:907},{...inputs,resourceReady:token});
  assert.equal(state.stage,'loading');assert.equal(state.lifecycle.active,null);
  state=syncHomeBannerService(state,{generation:'session:2',updateCount:908},input(state));assert.equal(motion(state).yawCounter,1);
});

test('counter bridge processes a request at unchanged time without activating or advancing clocks',()=>{
  const initial=settled();const state=syncHomeBannerService(initial,initial.clock,input(initial,{request:{target:folder('folder-instance:2')}}));
  assert.equal(state.stage,'active');assert.equal(state.lifecycle.requestPending,true);
  assert.equal(state.lifecycle.active,initial.lifecycle.active);assert.equal(state.lifecycle.managerUpdates,initial.lifecycle.managerUpdates);
  assert.equal(advance(state).stage,'hiding');
});

test('background clock advances only in scene passes and survives ordinary folder replacement',()=>{
  let state=settled();let lifecycle=setHomeBannerBackgroundAttached(state.lifecycle,true);
  lifecycle=startHomeBannerBackgroundLoop(showHomeBannerBackground(lifecycle,false));state={...state,lifecycle};
  const loopEpoch=lifecycle.background.loop.epoch;
  state=advance(request(state,folder('folder-instance:2')),13);
  assert.equal(state.lifecycle.background.loop.frame,13);assert.equal(state.lifecycle.background.loop.epoch,loopEpoch);
  assert.equal(state.lifecycle.background.sceneIn.frame,20);assert.equal(motion(state).skeletal.frame,1);
});

test('same stable identity reuses; new identity, type or forced reload creates a new activation',()=>{
  const initial=settled();assert.equal(request(initial,{...folder()}),initial);
  for(const [target,options] of [[folder('folder-instance:2'),undefined],[folder(folder().key,10),undefined],[folder(),{forceReload:true}]]){
    const state=advance(request(initial,target,options),13);
    assert.equal(state.lifecycle.activationEpoch,2);assert.equal(motion(state).yawCounter,1);
  }
});

test('invalid counters and empty session identity fail before mutating the service',()=>{
  const state=settled(),before=structuredClone(state);
  for(const n of [-1,.5,NaN,Infinity,Number.MAX_SAFE_INTEGER])assert.throws(()=>advance(state,n),RangeError);
  assert.throws(()=>createHomeBannerService({generation:'',updateCount:0}),RangeError);
  assert.deepEqual(state,before);
});
