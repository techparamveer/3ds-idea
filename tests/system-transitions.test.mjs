import test from 'node:test';
import assert from 'node:assert/strict';
import {appLaunchLogoFrame,bootRevealFrame,systemTransitionDuration} from '../src/os/system-transitions.ts';
import {createPortfolioState,tickSystem,launch,reduceSystem,touchSystem,selectedTitle} from '../src/os/system.ts';
import {enableHomeControls} from '../src/os/home-controls.ts';
import {powerMenuActionAt} from '../src/os/stock-screen-layout.ts';

test('Power touch uses only the source B_Btn_01 boundary, not the HOME-key hint',()=>{
 for(const [x,y] of [[66,166],[160,182],[253.999,201.999]])assert.equal(powerMenuActionAt(x,y),'open');
 for(const [x,y] of [[65.999,182],[254,182],[160,165.999],[160,202],[160,228],[0,239],[319,239],[NaN,182],[160,Infinity]])assert.equal(powerMenuActionAt(x,y),null);
 for(const app of [null,'health-safety']){
  let state=tickSystem(createPortfolioState(),4000);
  if(app)state=tickSystem(launch(state,app,4100),6100);
  const power=reduceSystem(state,'power',6200);
  assert.equal(power.system.phase,'power');
  assert.equal(touchSystem(power,160,228,6201).system.phase,'power');
  assert.equal(touchSystem(power,160,182,6201).system.phase,'shutdown');
  assert.equal(reduceSystem(power,'home',6201).system.phase,'home');
  assert.equal(reduceSystem(power,'back',6201).system.phase,'home');
 }
});
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
test('boot reveal gives all 21 SceneIn poses a slot before the browser boot deadline',()=>{
 assert.equal(bootRevealFrame(0),0);
 assert.equal(bootRevealFrame(2649),0);
 assert.equal(bootRevealFrame(2650),0);
 assert.equal(bootRevealFrame(2666),0);
 assert.equal(bootRevealFrame(2667),1);
 assert.equal(bootRevealFrame(2983),19);
 assert.equal(bootRevealFrame(2984),20);
 assert.equal(bootRevealFrame(2999),20);
 assert.equal(bootRevealFrame(3000),20);
 assert.equal(systemTransitionDuration('boot'),3000);

 assert.equal(bootRevealFrame(179,true),0);
 assert.equal(bootRevealFrame(180,true),0);
 assert.equal(bootRevealFrame(294,true),19);
 assert.equal(bootRevealFrame(295,true),20);
 assert.equal(bootRevealFrame(299,true),20);
 assert.equal(systemTransitionDuration('boot',true),300);
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
