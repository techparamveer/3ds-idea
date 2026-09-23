import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHomeNavigation, activeHomeRecord, gridSnapshot } from '../src/os/home-navigation.ts';
import { createHomeInputProducer } from '../src/os/home-input-producer.ts';
import { stepHomeNavigationPass } from '../src/os/home-navigation-pass.ts';
import { resolveHomeBannerHostObservation, createHomeBannerHost, stepHomeBannerHost } from '../src/os/home-banner-host.ts';
import { createPortfolioState } from '../src/os/system.ts';

const oracle=JSON.parse(readFileSync(new URL('./fixtures/home-navigation-pass.json',import.meta.url)));
const poll=(held=0,pressed=0,released=0)=>({held,pressed,released,touchActive:false,captureActive:false,
  hostFlags:0,gateWord14:0,readiness10dc20:true,readiness10cd20:true});
const eligible={cursorLayoutEligible:()=>true};
function fresh({count=0,motion=false,elapsed=0,pending=0}={}){
  const navigation=createHomeNavigation(0);navigation.rootView.selectedSlot=2;
  navigation.mode3={entryCount:count,directionMask:pending?16:0,pendingMask:pending};
  if(motion){navigation.rootView.targetLeftSlot=1;navigation.motion={mode:3,elapsedUpdates:elapsed,durationUpdates:10,
    currentDensity:0,targetDensity:0,fromGeometry:gridSnapshot(false,0,0),targetGeometry:gridSnapshot(false,0,1)};}
  return {producer:createHomeInputProducer(),scroll:{navigation,cursorLoop:{currentFrame:17.25,appliedFrame:0,step:1}}};
}
function check(state,row){
  const expected=Object.fromEntries(oracle.fields.map((key,i)=>[key,row[i]])),nav=state.scroll.navigation,loop=state.scroll.cursorLoop;
  assert.equal(activeHomeRecord(nav).selectedSlot,expected.selected);
  assert.equal(nav.motion?.mode??0,expected.mode);assert.equal(nav.mode3.entryCount,expected.scrollCounter);
  if(nav.motion){assert.equal(nav.motion.elapsedUpdates,expected.scrollElapsed);assert.equal(nav.motion.durationUpdates,expected.scrollDuration);}
  assert.deepEqual([loop.currentFrame,loop.appliedFrame,loop.step],[expected.loopCurrent,expected.loopSubmitted,expected.loopStep]);
  assert.equal(state.producer.repeatCounter,expected.repeatCounter);
}

test('original ordinary host baseline and accelerated press retain input/lower/layout order',()=>{
  check(stepHomeNavigationPass(fresh({count:5,motion:true}),poll(),eligible).state,oracle.baseline);
  const accelerated=stepHomeNavigationPass(fresh({count:5}),poll(16,16),eligible);
  check(accelerated.state,oracle.directionalPress);
  assert.equal(accelerated.afterInput.navigation.motion.elapsedUpdates,0);
  assert.equal(accelerated.afterInput.cursorLoop.currentFrame,17.25);
  assert.equal(accelerated.afterInput.cursorLoop.appliedFrame,0);
  assert.equal(accelerated.afterInput.cursorLoop.step,3);
  assert.equal(accelerated.state.scroll.navigation.motion.elapsedUpdates,1);
  assert.deepEqual(accelerated.events,[{type:4,mask:16},{type:5,mask:16}]);
});

test('all78 original main-loop polls match selection, acceleration, repeat counter and submitted Loop',()=>{
  let state=fresh(),heldBefore=0;
  for(const [i,held]of oracle.held.entries()){
    const result=stepHomeNavigationPass(state,poll(held,held&~heldBefore,heldBefore&~held),eligible);
    assert.equal(result.disposition,'handled');check(result.state,oracle.rows[i]);
    assert.equal(result.observations.some(o=>o.phase==='input'&&o.observation.kind==='banner-resolve'),false);
    state=result.state;heldBefore=held;
  }
});

test('completion replay changes Loop step before submission and retains the earlier banner slot',()=>{
  const initial=fresh({count:5,motion:true,elapsed:9,pending:16});initial.scroll.navigation.rootView.selectedSlot=3;
  const result=stepHomeNavigationPass(initial,poll(),{cursorLayoutEligible:scroll=>{
    assert.equal(activeHomeRecord(scroll.navigation).selectedSlot,4);assert.equal(scroll.cursorLoop.step,3);return true;
  }});
  assert.deepEqual(result.state.scroll.cursorLoop,{currentFrame:20.25,appliedFrame:17.25,step:3});
  assert.equal(result.state.scroll.navigation.motion.elapsedUpdates,0);
  assert.deepEqual(result.observations.map(o=>[o.phase,o.observation.kind]),[
    ['lower','banner-resolve'],['lower','mode3-entry'],['lower','cue'],['lower','cursor-select'],
  ]);
  const resolver=result.observations[0].observation;assert.equal(resolver.slot,3);
  let content=createPortfolioState();content={...content,system:{...content.system,layout:{3:'work',4:'contact'}}};
  const selection=resolveHomeBannerHostObservation(content,resolver);
  const host=createHomeBannerHost({generation:'joint-pass',updateCount:0},{managerInhibited:false,sceneInhibited:false,loadInhibited:false,nativeWorkerReady:true,resourceReady:null});
  const next=stepHomeBannerHost(host,{generation:'joint-pass',updateCount:1},{afterManager:{selection}});
  assert.deepEqual(next.selection,{kind:'app',id:'work'});
});

test('layout eligibility is independent of lower completion and overlay-gated replay',()=>{
  const initial=fresh({count:5,motion:true,elapsed:9,pending:16});initial.scroll.navigation.rootView.selectedSlot=3;
  const result=stepHomeNavigationPass(initial,poll(),{lower:{idleOverlayActive:true},cursorLayoutEligible:()=>false});
  assert.equal(result.state.scroll.navigation.motion,null);
  assert.equal(activeHomeRecord(result.state.scroll.navigation).selectedSlot,3);
  assert.equal(result.state.scroll.cursorLoop,initial.scroll.cursorLoop);
  assert.deepEqual(result.observations.map(o=>o.observation.kind),['banner-resolve']);
  assert.equal(result.state.scroll.navigation.mode3.pendingMask,0);
});

test('unsupported input/lower routes hand back the original state without partial commits',()=>{
  const initial=fresh();
  for(const event of [poll(1,1),poll(0x100,0x100)]){
    const result=stepHomeNavigationPass(initial,event,eligible);
    assert.equal(result.disposition,'unsupported');assert.equal(result.state,initial);assert.deepEqual(result.observations,[]);
  }
  const blocked=fresh({motion:true});blocked.scroll.navigation.motion.mode=5;
  const result=stepHomeNavigationPass(blocked,poll(),{...eligible,lower:{idleOverlayActive:true}});
  assert.equal(result.disposition,'unsupported');assert.equal(result.state,blocked);
  assert.throws(()=>stepHomeNavigationPass(initial,poll(),{cursorLayoutEligible:()=>undefined}),TypeError);
});
