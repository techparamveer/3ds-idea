import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortfolioState,tickSystem,launchHomeShortcut,tickHomeNavigationClock} from '../src/os/system.ts';

// Native keeps the selected cursor's LncCsr_00_Loop light pulsing beneath the
// launch fade (N065..N082). Only that loop advances during launch.
function launched(layoutVisible=true){
 const state=launchHomeShortcut(tickSystem(createPortfolioState(),3001),'health-safety',4000);
 const controls={primary:{request:0,shown:layoutVisible,layoutVisible,center:{x:244,y:137}}};
 return {...state,system:{...state.system,homeControls:controls,homeCursorLoop:{currentFrame:12,appliedFrame:9,step:3}}};
}

test('launch advances only the retained cursor loop at the 60Hz HOME cadence',()=>{
 let state=launched();
 assert.equal(state.system.phase,'launch');
 const updateCount=state.system.homeClock.updateCount;
 state=tickHomeNavigationClock(state,4000);
 const start=state.system.homeCursorLoop;
 state=tickHomeNavigationClock(state,4000+1000/60*4);
 assert.notDeepEqual(state.system.homeCursorLoop,start);
 assert.equal(state.system.homeClock.updateCount,updateCount,'shared HOME update count stays frozen');
 assert.equal(state.system.homeControls.primary.center.x,244,'no HOME input pass runs');
});

test('a hidden cursor, sleep or the app phase keep the loop unchanged',()=>{
 for(const state of [launched(false),{...launched(),system:{...launched().system,sleeping:true}},{...launched(),system:{...launched().system,phase:'app'}}]){
  const first=tickHomeNavigationClock(state,4000),later=tickHomeNavigationClock(first,4100);
  assert.deepEqual(later.system.homeCursorLoop,state.system.homeCursorLoop);
 }
});
