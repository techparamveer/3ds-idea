import test from 'node:test';
import assert from 'node:assert/strict';
import {appLaunchLogoFrame,appLaunchPose,bootRevealFrame,shutdownTransitionPose,systemTransitionDuration} from '../src/os/system-transitions.ts';
import {createPortfolioState,tickSystem,launch,reduceSystem,touchSystem,dispatchSystemEvent,selectedTitle} from '../src/os/system.ts';
import {enableHomeControls} from '../src/os/home-controls.ts';
import {powerMenuActionAt,powerMenuPressed} from '../src/os/stock-screen-layout.ts';

test('Power touch uses only the source B_Btn_01 boundary, not the HOME-key hint',()=>{
 for(const [x,y] of [[66,166],[160,182],[253.999,201.999]])assert.equal(powerMenuActionAt(x,y),'open');
 for(const [x,y] of [[65.999,182],[254,182],[160,165.999],[160,202],[160,228],[0,239],[319,239],[NaN,182],[160,Infinity]])assert.equal(powerMenuActionAt(x,y),null);
 for(const app of [null,'health-safety']){
  let state=tickSystem(createPortfolioState(),3500);
  if(app)state=tickSystem(launch(state,app,3600),6100);
  const power=reduceSystem(state,'power',6200);
  assert.equal(power.system.phase,'power');
  assert.equal(touchSystem(power,160,228,6201).system.phase,'power');
  assert.equal(touchSystem(power,160,182,6201).system.phase,'shutdown');
  assert.equal(reduceSystem(power,'home',6201).system.phase,'home');
  assert.equal(reduceSystem(power,'back',6201).system.phase,'home');
 }
});
test('Power phased touch requires the same owned target at start and release',()=>{
 const event=(phase,x,y,pointerId=7)=>({type:'touch',phase,x,y,pointerId});
 const initial=reduceSystem(tickSystem(createPortfolioState(),4000),'power',4100);
 const inside=[160,182],outside=[160,107];
 assert.equal(powerMenuPressed({startX:66,startY:166,x:253.999,y:201.999}),'open');
 for(const touch of [null,
  {startX:65.999,startY:182,x:160,y:182},
  {startX:160,startY:165.999,x:160,y:182},
  {startX:160,startY:182,x:254,y:182},
  {startX:160,startY:182,x:160,y:202},
 ])assert.equal(powerMenuPressed(touch),null);

 let held=dispatchSystemEvent(initial,event('down',...inside),4200);
 assert.equal(held.system.phase,'power');assert.equal(powerMenuPressed(held.system.input.touch),'open');
 assert.equal(dispatchSystemEvent(held,event('up',...inside,8),4201),held,'another pointer cannot release the owner');
 let declined=dispatchSystemEvent(held,event('move',...outside),4202);
 assert.equal(declined.system.phase,'power');assert.equal(powerMenuPressed(declined.system.input.touch),null);
 declined=dispatchSystemEvent(declined,event('up',...outside),4203);
 assert.equal(declined.system.phase,'power');assert.equal(declined.system.input.touch,null);

 let outsideOrigin=dispatchSystemEvent(initial,event('down',...outside),4300);
 outsideOrigin=dispatchSystemEvent(outsideOrigin,event('move',...inside),4301);
 assert.equal(powerMenuPressed(outsideOrigin.system.input.touch),null);
 outsideOrigin=dispatchSystemEvent(outsideOrigin,event('up',...inside),4302);
 assert.equal(outsideOrigin.system.phase,'power');assert.equal(outsideOrigin.system.input.touch,null);

 let reentry=dispatchSystemEvent(initial,event('down',...inside),4400);
 reentry=dispatchSystemEvent(reentry,event('move',...outside),4401);
 reentry=dispatchSystemEvent(reentry,event('move',...inside),4402);
 assert.equal(powerMenuPressed(reentry.system.input.touch),'open');
 reentry=dispatchSystemEvent(reentry,event('up',...inside),4403);
 assert.equal(reentry.system.phase,'shutdown');assert.equal(reentry.system.input.touch,null);

 const down=dispatchSystemEvent(initial,event('down',...inside),4500);
 const cancelled=dispatchSystemEvent(down,event('cancel',NaN,NaN),4501);
 assert.equal(cancelled.system.phase,'power');assert.equal(cancelled.system.input.touch,null);
 assert.equal(dispatchSystemEvent(cancelled,event('up',...inside),4502),cancelled);
});
test('app launch holds Open Decide, then fades HOME to source black before the 60/30/15 logo clips',()=>{
 assert.deepEqual(appLaunchPose(166),{fadeFrame:0,logo:null},'Open Decide and its fitted hold keep intact HOME');
 assert.deepEqual(appLaunchPose(184),{fadeFrame:1,logo:null});
 assert.deepEqual(appLaunchPose(499),{fadeFrame:19,logo:null});
 assert.deepEqual(appLaunchPose(500),{fadeFrame:20,logo:null});
 assert.deepEqual(appLaunchPose(683),{fadeFrame:20,logo:null},'fitted black dwell before logo pose 0');
 assert.deepEqual(appLaunchPose(684),{fadeFrame:20,logo:{clip:'A',frame:0}});
 assert.deepEqual(appLaunchPose(1683),{fadeFrame:20,logo:{clip:'A',frame:59}});
 assert.deepEqual(appLaunchPose(1684),{fadeFrame:20,logo:{clip:'B',frame:0}});
 assert.deepEqual(appLaunchPose(2184),{fadeFrame:20,logo:{clip:'C',frame:0}});
 assert.deepEqual(appLaunchPose(2416),{fadeFrame:20,logo:{clip:'C',frame:13}});
 assert.deepEqual(appLaunchPose(2417),{fadeFrame:20,logo:{clip:'C',frame:14}});
 assert.deepEqual(appLaunchPose(2433),{fadeFrame:20,logo:{clip:'C',frame:14}});
 assert.deepEqual(appLaunchLogoFrame(0),{clip:'A',frame:0});assert.deepEqual(appLaunchLogoFrame(1750),{clip:'C',frame:14});
 assert.equal(systemTransitionDuration('launch'),146*1000/60);
 for(let k=0;k<=146;k++){const pose=appLaunchPose(k*1000/60),logo=pose.logo&&({A:0,B:60,C:90}[pose.logo.clip]+pose.logo.frame);
  assert.deepEqual([pose.fadeFrame,logo],[Math.max(0,Math.min(20,k-10)),k<41?null:Math.min(104,k-41)],`exact 60Hz grid frame ${k}`);}
 let state=launch(tickSystem(createPortfolioState(),4000),'work',4000);
 assert.equal(tickSystem(state,6433).system.phase,'launch');assert.equal(tickSystem(state,6434).system.phase,'app');
 assert.deepEqual(appLaunchPose(0,true),{fadeFrame:20,logo:{clip:'B',frame:15}});assert.equal(systemTransitionDuration('launch',true),120);
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
test('shutdown maps Decide then sleep SceneOut and exposes the terminal pose before off',()=>{
 assert.deepEqual(shutdownTransitionPose(0),{decideFrame:0,sleepSceneOutFrame:0});
 assert.deepEqual(shutdownTransitionPose(166),{decideFrame:9,sleepSceneOutFrame:0});
 assert.deepEqual(shutdownTransitionPose(167),{decideFrame:10,sleepSceneOutFrame:0});
 assert.deepEqual(shutdownTransitionPose(183),{decideFrame:10,sleepSceneOutFrame:0});
 assert.deepEqual(shutdownTransitionPose(184),{decideFrame:10,sleepSceneOutFrame:1});
 assert.deepEqual(shutdownTransitionPose(1166),{decideFrame:10,sleepSceneOutFrame:59});
 assert.deepEqual(shutdownTransitionPose(1167),{decideFrame:10,sleepSceneOutFrame:60});
 assert.deepEqual(shutdownTransitionPose(1199),{decideFrame:10,sleepSceneOutFrame:60});
 assert.equal(systemTransitionDuration('shutdown'),1200);
 assert.deepEqual(shutdownTransitionPose(0,true),{decideFrame:10,sleepSceneOutFrame:60});
 assert.deepEqual(shutdownTransitionPose(119,true),{decideFrame:10,sleepSceneOutFrame:60});
 assert.equal(systemTransitionDuration('shutdown',true),120);

 let state=reduceSystem(reduceSystem(tickSystem(createPortfolioState(),3000),'power',3100),'open',3200);
 assert.equal(tickSystem(state,4399).system.phase,'shutdown');
 assert.equal(tickSystem(state,4400).system.phase,'off');
});
test('cold power-on clears stale toolbar focus before opening the selected HOME tile',()=>{
 let state=enableHomeControls(tickSystem(createPortfolioState(),3000));
 assert.equal(selectedTitle(state)?.id,'work');
 state={...state,system:{...state.system,homeNavigation:{...state.system.homeNavigation,
  focus:{toolbarActive:true,currentFocus:4,rememberedFocus:4,savedColumn:0}}}};
 state=reduceSystem(state,'power',3100);
 state=reduceSystem(state,'open',3200);
 state=tickSystem(state,4400);
 assert.equal(state.system.phase,'off');
 state=reduceSystem(state,'power',3800);
 assert.equal(state.system.homeNavigation.focus.toolbarActive,false);
 state=tickSystem(state,6800);
 assert.equal(state.system.phase,'home');
 state=reduceSystem(state,'open',6900);
 assert.equal(state.system.app,'work');
});
