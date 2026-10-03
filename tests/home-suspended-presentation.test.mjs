import test from 'node:test';
import assert from 'node:assert/strict';
import {
 HOME_SUSPENDED_SLEEP_FRAMES,createHomeSuspendedPresentation,getHomeSuspendedSleepFrame,syncHomeSuspendedPresentation,
} from '../src/os/home-suspended-presentation.ts';
import {createPortfolioState,tickSystem,reduceSystem} from '../src/os/system.ts';
import {selectHomeSlot,settleHomeNavigation} from '../src/os/home-navigation.ts';

const suspended=()=>reduceSystem(tickSystem(reduceSystem(tickSystem(createPortfolioState(),3001),'open',3900),6000),'home',6001);
const at=(state,update)=>({...state,system:{...state.system,homeClock:{...state.system.homeClock,updateCount:update}}});

test('suspended Sleep phase is relative to the exact retained owner, not the global HOME modulo',()=>{
 const state=suspended(),owner=state.system.runtime.application,start=state.system.homeClock.updateCount;
 let presentation=syncHomeSuspendedPresentation(createHomeSuspendedPresentation(),state);
 assert.deepEqual(presentation,{owner,observedUpdate:start,sleepFrame:0});
 presentation=syncHomeSuspendedPresentation(presentation,at(state,start+60));
 assert.equal(getHomeSuspendedSleepFrame(presentation),60);
 presentation=syncHomeSuspendedPresentation(presentation,at(state,start+HOME_SUSPENDED_SLEEP_FRAMES+61));
 assert.equal(getHomeSuspendedSleepFrame(presentation),61);
 assert.equal(syncHomeSuspendedPresentation(presentation,at(state,start+HOME_SUSPENDED_SLEEP_FRAMES+61)),presentation);
});

test('selection and modal changes preserve the owner phase and renderer-ineligible owners clear it',()=>{
 const state=suspended(),start=state.system.homeClock.updateCount;
 let presentation=syncHomeSuspendedPresentation(createHomeSuspendedPresentation(),state);
 const other=at(settleHomeNavigation(selectHomeSlot(state,1)),start+17);
 presentation=syncHomeSuspendedPresentation(presentation,other);
 assert.equal(presentation.sleepFrame,17);
 const toolbar=structuredClone(at(other,start+23));toolbar.system.homeNavigation.focus.toolbarActive=true;
 presentation=syncHomeSuspendedPresentation(presentation,toolbar);
 assert.equal(presentation.sleepFrame,23);
 const dialog=at(reduceSystem(state,'back',7000),start+29);
 assert.equal(dialog.system.dialog,'close');
 presentation=syncHomeSuspendedPresentation(presentation,dialog);
 assert.equal(presentation.sleepFrame,29);
 for(const change of [s=>s.system.phase='app',s=>s.system.runtime.active=s.system.runtime.application,s=>s.system.runtime.homeReturn=null,s=>s.system.runtime.instances[s.system.runtime.application].closing=true]){
  const copy=structuredClone(dialog);change(copy);
  assert.deepEqual(syncHomeSuspendedPresentation(presentation,copy),createHomeSuspendedPresentation());
 }
});

test('owner replacement, clock rollback and reduced motion restart the unproven host epoch at frame zero',()=>{
 const state=suspended(),start=state.system.homeClock.updateCount;
 let presentation=syncHomeSuspendedPresentation(createHomeSuspendedPresentation(),state);
 presentation=syncHomeSuspendedPresentation(presentation,at(state,start+25));
 const replacement=structuredClone(at(state,start+30)),old=replacement.system.runtime.application,next='application:replacement';
 replacement.system.runtime.application=next;replacement.system.runtime.homeReturn=next;
 replacement.system.runtime.instances[next]={...replacement.system.runtime.instances[old],id:next};
 delete replacement.system.runtime.instances[old];
 presentation=syncHomeSuspendedPresentation(presentation,replacement);
 assert.deepEqual(presentation,{owner:next,observedUpdate:start+30,sleepFrame:0});
 presentation=syncHomeSuspendedPresentation(presentation,at(replacement,start+42));
 assert.equal(presentation.sleepFrame,12);
 presentation=syncHomeSuspendedPresentation(presentation,at(replacement,start+4));
 assert.deepEqual(presentation,{owner:next,observedUpdate:start+4,sleepFrame:0});
 presentation=syncHomeSuspendedPresentation(presentation,at(replacement,start+20));
 assert.equal(presentation.sleepFrame,16);
 presentation=syncHomeSuspendedPresentation(presentation,at(replacement,start+20),true);
 assert.equal(presentation.sleepFrame,0);
 presentation=syncHomeSuspendedPresentation(presentation,at(replacement,start+50),true);
 assert.equal(presentation.sleepFrame,0);
 presentation=syncHomeSuspendedPresentation(presentation,at(replacement,start+51));
 assert.equal(presentation.sleepFrame,1);
});

test('invalid logical HOME counts fail instead of inventing a native phase',()=>{
 const state=suspended();
 for(const update of [-1,.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1]){
  assert.throws(()=>syncHomeSuspendedPresentation(createHomeSuspendedPresentation(),at(state,update)),RangeError);
 }
});
