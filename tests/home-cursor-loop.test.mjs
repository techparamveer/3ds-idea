import test from 'node:test';
import assert from 'node:assert/strict';
import { createHomeCursorLoop, advanceHomeCursorLoop, getHomeCursorLoopFrame } from '../src/os/home-cursor-loop.ts';
import { getHomeCursorSlot } from '../src/os/home-cursor-visibility.ts';
import { getHomePresentation } from '../src/os/home-presentation.ts';
import {
 createPortfolioState, tickSystem, tickHomeNavigationClock, reduceSystem, dispatchSystemEvent,
 releaseSystemInputs, setSystemSleeping, restoreSettings, saveSettings, launch, sampleSystemHomeFolderClose,
} from '../src/os/system.ts';
import { initialState, reduceMenu, menuTiles } from '../src/os/state.ts';
import { enterHomeFolder, leaveHomeFolder, selectHomeSlot, setHomeDensity, settleHomeNavigation, getHomeNavigation, writeHomeNavigation } from '../src/os/home-navigation.ts';

const T=4000,F=1000/60;
const loop=state=>state.system.homeCursorLoop;
const home=()=>tickHomeNavigationClock(tickSystem(createPortfolioState(),3001),T);
const at=(state,count,reduced=false)=>tickSystem(state,T+count*F,reduced);
const folder=()=>enterHomeFolder(reduceMenu(selectHomeSlot(home(),40),'open'),40);
const touch=(state,phase,x,y,now)=>dispatchSystemEvent(state,{type:'touch',phase,pointerId:1,x,y},now);

test('ordinary Loop submits before float32 step1 and excludes endpoint60',()=>{
 const initial=createHomeCursorLoop();assert.deepEqual(initial,{currentFrame:0,appliedFrame:0,step:1});
 for(const [count,currentFrame,appliedFrame] of [[0,0,0],[1,1,0],[59,59,58],[60,0,59],[61,1,0],[121,1,0]]){
  const next=advanceHomeCursorLoop(initial,count,true);assert.deepEqual(next,{currentFrame,appliedFrame,step:1});assert.ok(Object.isFrozen(next));
 }
 assert.equal(advanceHomeCursorLoop(initial,0,true),initial);
 for(const count of [-1,.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>advanceHomeCursorLoop(initial,count,true),RangeError);
 const count=Number.MAX_SAFE_INTEGER;
 assert.deepEqual(advanceHomeCursorLoop(initial,count,true),{currentFrame:count%60,appliedFrame:(count-1)%60,step:1});
 // The ordinary live phase is integer; a fractional source fixture still uses scalar float32 steps.
 assert.deepEqual(advanceHomeCursorLoop({currentFrame:59.5,appliedFrame:58.5,step:1},2,true),{currentFrame:1.5,appliedFrame:.5,step:1});
});
test('pure batching and hidden/show retain both phase fields',()=>{
 const initial=createHomeCursorLoop(),before=advanceHomeCursorLoop(initial,17,true);
 assert.equal(advanceHomeCursorLoop(before,999,false),before);
 assert.deepEqual(advanceHomeCursorLoop(before,1,true),{currentFrame:18,appliedFrame:17,step:1});
 let stepped=initial;for(let i=0;i<121;i++)stepped=advanceHomeCursorLoop(stepped,1,true);
 assert.deepEqual(advanceHomeCursorLoop(initial,121,true),stepped);
 let split=initial;for(const count of [7,0,43,1,70])split=advanceHomeCursorLoop(split,count,true);
 assert.deepEqual(split,stepped);
});
test('System uses eligible HOME counts, including repeated timestamps and long batches',()=>{
 for(const count of [0,1,59,60,61,121]){
  const state=at(home(),count);assert.deepEqual(loop(state),advanceHomeCursorLoop(createHomeCursorLoop(),count,true));
  assert.equal(loop(tickSystem(state,state.system.homeClock.lastNow)),loop(state));
  assert.equal(loop(tickHomeNavigationClock(state,state.system.homeClock.lastNow)),loop(state));
 }
 const start=home(),batch=at(start,121);let stepped=start;for(let i=1;i<=121;i++)stepped=at(stepped,i);
 assert.deepEqual(loop(batch),loop(stepped));
 const boot=createPortfolioState();assert.deepEqual(loop(tickSystem(boot,500)),createHomeCursorLoop());
});
test('read-only sampling, reduced motion and legacy callers cannot advance the clock',()=>{
 const state=at(home(),17),before=loop(state),saved=JSON.stringify(state);
 for(let i=0;i<100;i++){
  assert.equal(getHomeCursorLoopFrame(state),16);assert.equal(getHomeCursorLoopFrame(state,true),0);
  getHomePresentation(state);getHomeCursorSlot(state);
 }
 assert.equal(loop(state),before);assert.equal(JSON.stringify(state),saved);
 assert.equal(getHomeCursorLoopFrame(initialState),0);assert.equal(getHomeCursorLoopFrame(initialState,true),0);
 const reduced=at(state,18,true);assert.deepEqual(loop(reduced),{currentFrame:18,appliedFrame:17,step:1});
 assert.equal(getHomeCursorLoopFrame(reduced,true),0);assert.equal(getHomeCursorLoopFrame(reduced),17);
});
test('selection, density, root/folder transitions and independent histories retain phase',()=>{
 let state=at(home(),9);const before=loop(state),now=T+9*F;
 state=reduceSystem(state,'right',now);assert.equal(loop(state),before);
 state=setHomeDensity(state,4);assert.equal(loop(state),before);
 state=settleHomeNavigation(selectHomeSlot(state,40));state=enterHomeFolder(reduceMenu(state,'open'),40);
 assert.equal(loop(state),before);
 state=settleHomeNavigation(selectHomeSlot(setHomeDensity(state,2),13));
 state=leaveHomeFolder(state);assert.equal(loop(state),before);
 state=enterHomeFolder(state,40);assert.equal(state.folderSelected,13);assert.equal(loop(state),before);
 state=at(state,10);assert.deepEqual(loop(state),{currentFrame:10,appliedFrame:9,step:1});
});
test('geometry revealing an offscreen selection is identical under batched and stepped clocks',()=>{
 for(const transform of [s=>selectHomeSlot(s,100),s=>setHomeDensity(settleHomeNavigation(selectHomeSlot(s,100)),0)]){
  const initial=transform(home()),batch=at(initial,45);let stepped=initial,visible=0;
  for(let i=1;i<=45;i++){stepped=at(stepped,i);visible+=Number(getHomeCursorSlot(stepped)!==null);}
  assert.deepEqual(loop(batch),loop(stepped));
  assert.deepEqual(loop(batch),advanceHomeCursorLoop(createHomeCursorLoop(),visible,true));
 }
 const initial=selectHomeSlot(home(),100);assert.equal(getHomeCursorSlot(initial),null);
 assert.ok(loop(at(initial,45)).currentFrame<45,'hidden part of scroll must not advance');
});
test('counted close completion update itself submits the retained cursor, including viewport completion',()=>{
 for(const offscreen of [false,true])for(const reduced of [false,true]){
  let initial=at(folder(),7);
  if(offscreen){const nav=getHomeNavigation(initial);initial=writeHomeNavigation(initial,{...nav,rootView:{...nav.rootView,currentLeftSlot:0,targetLeftSlot:0}});}
  const started=reduceSystem(initial,'back',T+7*F),before=loop(started),ready=7+(offscreen?28:18);
  assert.equal(getHomeCursorSlot(started),null);
  const hidden=at(started,ready-1,reduced);assert.equal(loop(hidden),before);assert.equal(getHomeCursorSlot(hidden),null);
  const completed=at(hidden,ready,reduced);
  assert.equal(sampleSystemHomeFolderClose(completed).selectionReadyAtUpdate,ready);
  assert.deepEqual(loop(completed),advanceHomeCursorLoop(before,1,true));
  const batch=at(started,60,reduced);let stepped=started;for(let i=8;i<=60;i++)stepped=at(stepped,i,reduced);
  assert.deepEqual(loop(batch),loop(stepped));
  assert.deepEqual(loop(batch),advanceHomeCursorLoop(before,60-ready+1,true));
 }
});
test('sleep, overlays and clock suspension freeze without changing the retained phase',()=>{
 const initial=at(home(),17),now=T+17*F,before=loop(initial);
 const scenarios=[
  [s=>setSystemSleeping(s,true,now),s=>setSystemSleeping(s,false,90000)],
  [s=>reduceSystem(s,'preferences',now),s=>reduceSystem(s,'back',90000)],
  [s=>reduceSystem(s,'power',now),s=>reduceSystem(s,'back',90000)],
  [s=>({...s,panel:'settings'}),s=>({...s,panel:null})],
  [s=>({...s,system:{...s.system,dialog:'close'}}),s=>({...s,system:{...s.system,dialog:null}})],
 ];
 for(const [pause,resume] of scenarios){
  let state=pause(initial);assert.equal(getHomeCursorSlot(state),null);state=tickSystem(state,80000);assert.equal(loop(state),before);
  state=resume(state);state=tickSystem(state,90000);assert.equal(loop(state),before);
  state=tickSystem(state,90000+F);assert.deepEqual(loop(state),advanceHomeCursorLoop(before,1,true));
 }
 // The scene suppresses shared ticks while hidden; release rebases the first resume tick.
 let released=releaseSystemInputs(initial,now);assert.equal(loop(released),before);
 released=tickSystem(released,90000);assert.equal(loop(released),before);
 assert.deepEqual(loop(tickSystem(released,90000+F)),advanceHomeCursorLoop(before,1,true));
});
test('app launch, suspension and return retain the HOME controller',()=>{
 const initial=at(home(),23),before=loop(initial),now=T+23*F;
 let state=launch(initial,'work',now);assert.equal(loop(state),before);assert.equal(getHomeCursorSlot(state),null);
 state=tickSystem(state,now+2500);assert.equal(state.system.phase,'app');assert.equal(loop(state),before);
 state=reduceSystem(state,'home',10000);assert.equal(state.system.phase,'home');assert.equal(loop(state),before);
 state=tickSystem(state,10000);state=tickSystem(state,10000+F);assert.deepEqual(loop(state),advanceHomeCursorLoop(before,1,true));
 const resumed=reduceSystem(state,'home',10000+F);assert.equal(resumed.system.phase,'app');assert.equal(loop(resumed),loop(state));
});
test('settings restoration and layout reset retain phase; true off-to-boot resets it',()=>{
 const initial=at(home(),29),before=loop(initial),raw=saveSettings(initial),now=T+29*F;
 assert.ok(!raw.includes('homeCursorLoop'));assert.ok(!raw.includes('currentFrame'));assert.ok(!raw.includes('appliedFrame'));
 let restored=restoreSettings(initial,raw);assert.equal(loop(restored),before);assert.equal(restored.system.homeClock.updateCount,0);
 restored=tickSystem(restored,90000);assert.equal(loop(restored),before);
 assert.deepEqual(loop(tickSystem(restored,90000+F)),advanceHomeCursorLoop(before,1,true));
 const reset=reduceSystem(reduceSystem(initial,'preferences',now),'reset-layout',now);assert.equal(loop(reset),before);
 let state=reduceSystem(reduceSystem(initial,'power',now),'open',now);assert.equal(state.system.phase,'shutdown');state=tickSystem(state,now+1200);assert.equal(state.system.phase,'off');assert.equal(loop(state),before);
 state=reduceSystem(state,'power',10000);assert.equal(state.system.phase,'boot');assert.deepEqual(loop(state),createHomeCursorLoop());
 state=tickSystem(state,13001);state=tickSystem(state,13002);assert.deepEqual(loop(state),createHomeCursorLoop());
 assert.deepEqual(loop(tickSystem(state,13002+F)),{currentFrame:1,appliedFrame:0,step:1});
});
test('shared cursor predicate freezes scroll and dragging without a painted target, then resumes on a valid drop',()=>{
 let state=at(home(),5),now=T+5*F;
 const source=menuTiles(state).find(t=>t.index===0),x=source.x+source.size/2,y=source.y+source.size/2;
 state=touch(state,'down',x,y,now);state=touch(state,'move',x-20,y,now);
 assert.equal(state.system.homeNavigation.gesture.mode,'scroll');assert.equal(getHomeCursorSlot(state),null);
 assert.ok(getHomePresentation(state).tiles.every(t=>!t.cursor));
 const before=loop(state);state=at(state,20);assert.equal(loop(state),before);
 state=touch(state,'up',x-20,y,T+20*F);state=at(state,21);assert.deepEqual(loop(state),advanceHomeCursorLoop(before,1,true));

 state=home();state=touch(state,'down',x,y,T);state=tickSystem(state,T+451);now=T+451;
 assert.equal(state.system.homeNavigation.gesture.mode,'drag');assert.equal(getHomeCursorSlot(state),null);
 const dragged=loop(state);state=tickSystem(state,now+F);now+=F;assert.equal(loop(state),dragged);
 const target=menuTiles(state).find(t=>t.index===2);
 state=touch(state,'move',target.x+target.size/2,target.y+target.size/2,now);
 assert.equal(getHomeCursorSlot(state),2);assert.deepEqual(getHomePresentation(state).tiles.filter(t=>t.cursor).map(t=>t.index),[2]);
 state=tickSystem(state,now+F);now+=F;assert.deepEqual(loop(state),advanceHomeCursorLoop(dragged,1,true));
 state=touch(state,'move',310,y,now);assert.equal(getHomeCursorSlot(state),null);
 const hidden=loop(state);state=tickSystem(state,now+F);assert.equal(loop(state),hidden);
});
