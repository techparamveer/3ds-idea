import test from 'node:test';
import assert from 'node:assert/strict';
import {appLaunchLogoFrame,systemTransitionDuration} from '../src/os/system-transitions.ts';
import {createPortfolioState,tickSystem,launch,reduceSystem,selectedTitle} from '../src/os/system.ts';
import {enableHomeControls} from '../src/os/home-controls.ts';
test('app launch maps the paired 60/30/15 HOME fade and logo clips',()=>{
 assert.deepEqual(appLaunchLogoFrame(0),{clip:'A',frame:0});
 assert.deepEqual(appLaunchLogoFrame(333),{clip:'A',frame:19});
 assert.deepEqual(appLaunchLogoFrame(334),{clip:'A',frame:20});
 assert.deepEqual(appLaunchLogoFrame(1000),{clip:'B',frame:0});
 assert.deepEqual(appLaunchLogoFrame(1500),{clip:'C',frame:0});
 assert.deepEqual(appLaunchLogoFrame(1749),{clip:'C',frame:14});
 assert.equal(systemTransitionDuration('launch'),1750);
 let state=launch(tickSystem(createPortfolioState(),4000),'work',4000);
 assert.equal(tickSystem(state,5749).system.phase,'launch');assert.equal(tickSystem(state,5750).system.phase,'app');
 assert.deepEqual(appLaunchLogoFrame(0,true),{clip:'B',frame:15});assert.equal(systemTransitionDuration('launch',true),120);
});
test('cold power-on clears stale toolbar focus before opening the selected HOME tile',()=>{
 let state=enableHomeControls(tickSystem(createPortfolioState(),3000));
 assert.equal(selectedTitle(state)?.id,'work');
 state={...state,system:{...state.system,homeNavigation:{...state.system.homeNavigation,
  focus:{toolbarActive:true,currentFocus:4,rememberedFocus:4,savedColumn:0}}}};
 state=reduceSystem(state,'power',3100);
 state=reduceSystem(state,'open',3200);
 state=tickSystem(state,3750);
 assert.equal(state.system.phase,'off');
 state=reduceSystem(state,'power',3800);
 assert.equal(state.system.homeNavigation.focus.toolbarActive,false);
 state=tickSystem(state,6800);
 assert.equal(state.system.phase,'home');
 state=reduceSystem(state,'open',6900);
 assert.equal(state.system.app,'work');
});
