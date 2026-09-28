import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortfolioState,tickSystem,invokeSystemApplet,reduceSystem,launch,getActiveAppView,setSystemSleeping} from '../src/os/system.ts';
import {deliverCapabilityResult} from '../src/os/app-host.ts';

const home=()=>tickSystem(createPortfolioState(),4000);
const dismiss=state=>reduceSystem(reduceSystem(state,'home',7000),'home',7100);

test('HOME again dismisses suspended Notes to HOME and reopening creates a fresh owner',()=>{
 let state=invokeSystemApplet(home(),'game-notes',4100);
 const owner=state.system.runtime.active;
 state=reduceSystem(state,'open',4200);assert.equal(getActiveAppView(state).screen,'drawing');
 state=reduceSystem(state,'home',4300);
 assert.equal(state.system.runtime.homeReturn,owner);
 state=reduceSystem(state,'home',4400);
 assert.equal(state.system.phase,'home');assert.equal(getActiveAppView(state),null);
 assert.equal(state.system.runtime.active,null);assert.equal(state.system.runtime.homeReturn,null);
 assert.equal(state.system.runtime.systemApplet,null);assert.equal(state.system.runtime.instances[owner],undefined);
 assert.ok(state.system.runtime.effects.some(item=>item.owner===owner&&item.effect.type==='release-capabilities'));
 assert.equal(state.system.runtime.saves['game-notes'],undefined,'UI-only Notes does not acquire a save');
 const closed=state.system.runtime;
 assert.equal(deliverCapabilityResult(closed,owner,{type:'capability-result',requestId:'old',requestToken:1,ok:true},4500),closed,'retired owner cannot receive late completion');
 state=invokeSystemApplet(state,'game-notes',4600);
 assert.notEqual(state.system.runtime.active,owner);assert.equal(state.system.runtime.instances[owner],undefined);
 assert.equal(getActiveAppView(state).screen,'main');
});

test('dismissing Notes keeps its application caller suspended, available for a later HOME press',()=>{
 let state=tickSystem(launch(home(),'health-safety',4100),6100);
 const application=state.system.runtime.active,original=state.system.runtime.instances[application].state;
 state=invokeSystemApplet(state,'game-notes',6200);const notes=state.system.runtime.active;
 assert.equal(state.system.runtime.instances[notes].caller,application);
 state=dismiss(state);
 assert.equal(state.system.phase,'home');assert.equal(state.system.runtime.active,null);
 assert.equal(state.system.runtime.application,application);assert.equal(state.system.runtime.instances[application].suspended,true);
 assert.deepEqual(state.system.runtime.instances[application].state,original);
 assert.equal(state.system.runtime.instances[notes],undefined);assert.equal(state.system.runtime.homeReturn,application);
 state=reduceSystem(state,'home',7200);
 assert.equal(state.system.runtime.active,application);assert.equal(state.system.phase,'app');
 assert.equal(state.system.runtime.instances[notes],undefined);
});

test('Notes entered from HOME without a caller does not remove the suspended application',()=>{
 let state=tickSystem(launch(home(),'health-safety',4100),6100);
 const application=state.system.runtime.active;
 state=reduceSystem(state,'home',6150);state=invokeSystemApplet(state,'game-notes',6200);
 const notes=state.system.runtime.active;assert.equal(state.system.runtime.instances[notes].caller,null);
 state=dismiss(state);
 assert.equal(state.system.runtime.application,application);assert.equal(state.system.runtime.instances[application].suspended,true);
 assert.equal(state.system.runtime.instances[notes],undefined);assert.equal(state.system.runtime.homeReturn,null);
 state=reduceSystem(state,'home',7200);assert.equal(state.system.runtime.active,application);
});

test('other system applets and applications retain their existing HOME resume behavior',()=>{
 for(const start of [state=>invokeSystemApplet(state,'friends',4100),state=>tickSystem(launch(state,'health-safety',4100),6100)]){
  let state=start(home());const owner=state.system.runtime.active;assert.ok(owner);
  state=dismiss(state);assert.equal(state.system.phase,'app');assert.equal(state.system.runtime.active,owner);
  assert.equal(state.system.runtime.instances[owner].suspended,false);
 }
});

test('sleep and invalid clock input cannot close a suspended Notes owner',()=>{
 let state=invokeSystemApplet(home(),'game-notes',4100);const owner=state.system.runtime.active;
 state=reduceSystem(state,'home',4200);
 assert.equal(reduceSystem(state,'home',NaN),state);
 state=setSystemSleeping(state,true,4300);state=reduceSystem(state,'home',4400);
 assert.ok(state.system.runtime.instances[owner]);assert.equal(state.system.runtime.homeReturn,owner);
 state=setSystemSleeping(state,false,4500);state=reduceSystem(state,'home',4600);
 assert.equal(state.system.runtime.instances[owner],undefined);assert.equal(state.system.phase,'home');
});
