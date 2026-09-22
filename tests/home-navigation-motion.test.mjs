import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createPortfolioState, tickSystem, reduceSystem, dispatchSystemEvent, tickHomeNavigationClock, setSystemSleeping, releaseSystemInputs, saveSettings, restoreSettings, launch } from '../src/os/system.ts';
import { menuTiles, reduceMenu } from '../src/os/state.ts';
import { selectHomeLocation, moveHomeItem } from '../src/os/home-layout.ts';
import { getHomeNavigation, getHomeNavigationView, selectHomeSlot, setHomeDensity, enterHomeFolder, advanceHomeNavigation, settleHomeNavigation, homeMotionWeight, createHomeUpdateClock, stepHomeUpdateClock } from '../src/os/home-navigation.ts';
const fixtures = JSON.parse(readFileSync(new URL('./fixtures/home-navigation-motion.json',import.meta.url)));
const home = () => tickSystem(createPortfolioState(),3001);
const f = Math.fround;
const mix = (a,b,w) => f(f(f(1-w)*a)+f(w*b));
const rootOne = () => settleHomeNavigation(setHomeDensity(home(),0));
const folder = () => enterHomeFolder(reduceMenu(selectHomeLocation(home(),{folder:null,slot:40}),'open'),40);

test('edge-follow scroll samples every native float32 fixture and commits exactly at update16', () => {
  let state = selectHomeSlot(selectHomeSlot(rootOne(),1),2);
  const revision = getHomeNavigation(state).selectionRevision;
  state = selectHomeSlot(state,3);
  assert.equal(state.selected,3); assert.equal(getHomeNavigation(state).selectionRevision,revision+1);
  for (const expected of fixtures.scroll16) {
    if (expected.update) state = advanceHomeNavigation(state,1);
    const view = getHomeNavigationView(state);
    assert.equal(homeMotionWeight(expected.update,16),expected.weight);
    assert.equal(view.scrollPixels,expected.scroll0To84);
    assert.equal(view.slots[3].x,328-expected.scroll0To84);
    assert.equal(view.mode,expected.update<16?2:0);
    assert.equal(view.currentLeftSlot,expected.update<16?0:1); assert.equal(view.targetLeftSlot,1);
  }
  assert.equal(getHomeNavigation(state).motion,null);
});
test('selection inside the viewport stays mode0 and reversing follows retained viewport history', () => {
  let state = settleHomeNavigation(selectHomeSlot(rootOne(),6));
  state = selectHomeSlot(state,5); assert.equal(getHomeNavigationView(state).mode,0); assert.equal(getHomeNavigationView(state).scrollPixels,336);
  state = selectHomeSlot(state,4); assert.equal(getHomeNavigationView(state).mode,0);
  state = selectHomeSlot(state,3); assert.equal(getHomeNavigationView(state).mode,2);
  state = advanceHomeNavigation(state,8); assert.equal(getHomeNavigationView(state).scrollPixels,294);
  state = advanceHomeNavigation(state,8); assert.equal(getHomeNavigationView(state).scrollPixels,252);
});
test('density interpolates each slot endpoint for all15 updates without regrouping fractional rows', () => {
  let state = folder(); const before = getHomeNavigationView(state);
  state = setHomeDensity(state,2);
  for (const expected of fixtures.density15) {
    if (expected.update) state = advanceHomeNavigation(state,1);
    const view = getHomeNavigationView(state), w = expected.weight;
    assert.equal(homeMotionWeight(expected.update,15),w);
    assert.equal(view.currentDensity,expected.update<15?1:2); assert.equal(view.targetDensity,2);
    assert.equal(view.mode,expected.update<15?5:0); assert.equal(view.density,mix(1,2,w));
    for (const index of [0,1,2,3,17,59]) {
      const endX = 52+Math.floor(index/2)*54, endY = 109+index%2*54;
      assert.equal(view.slots[index].x,mix(before.slots[index].x,endX,w));
      assert.equal(view.slots[index].y,mix(before.slots[index].y,endY,w));
      assert.equal(view.slots[index].size,mix(72,50,w));
    }
    const tile = menuTiles(state).find(t=>t.index===1), slot = view.slots[1];
    assert.deepEqual([tile.x,tile.y,tile.size],[slot.x-slot.size/2,slot.y-slot.size/2,slot.size]);
  }
});
test('interrupted density/scroll starts from actual sampled slot geometry with no jump', () => {
  let state = advanceHomeNavigation(setHomeDensity(folder(),4),7), before = getHomeNavigationView(state);
  state = setHomeDensity(state,0); let after = getHomeNavigationView(state);
  assert.deepEqual(after.slots,before.slots); assert.equal(after.scrollPixels,before.scrollPixels); assert.equal(after.density,before.density);
  state = advanceHomeNavigation(state,5); before = getHomeNavigationView(state);
  state = selectHomeSlot(state,20); after = getHomeNavigationView(state);
  assert.deepEqual(after.slots,before.slots); assert.equal(after.mode,5); assert.equal(after.selectedSlot,20);
  state = advanceHomeNavigation(state,15); assert.equal(getHomeNavigationView(state).currentDensity,0); assert.equal(getHomeNavigationView(state).currentLeftSlot,18);
  state = advanceHomeNavigation(selectHomeSlot(state,21),5); before = getHomeNavigationView(state);
  state = selectHomeSlot(state,22); after = getHomeNavigationView(state);
  assert.deepEqual(after.slots,before.slots); assert.equal(after.mode,2);
});
test('motion saves the settled target and restores without transient arrays or clocks', () => {
  let state = settleHomeNavigation(selectHomeSlot(folder(),6)); state = advanceHomeNavigation(setHomeDensity(state,2),4);
  const view = getHomeNavigationView(state), raw = saveSettings(state), saved = JSON.parse(raw);
  assert.equal(view.currentDensity,1); assert.equal(view.targetDensity,2);
  assert.deepEqual(saved.homeView.folderViews[40],{selectedSlot:6,currentLeftSlot:0,targetLeftSlot:0,density:2});
  assert.ok(!raw.includes('fromGeometry')&&!raw.includes('lastNow')&&!raw.includes('elapsedUpdates'));
  const restored = restoreSettings(home(),raw); assert.equal(getHomeNavigationView(restored).mode,0); assert.equal(getHomeNavigationView(restored).currentDensity,2);
  assert.equal(saveSettings(restored),raw);
});
test('pure updates reject invalid counts and view reads cannot advance motion', () => {
  const state = setHomeDensity(home(),4), motion = getHomeNavigation(state).motion;
  for (const invalid of [NaN,Infinity,-1,0,.5]) assert.equal(advanceHomeNavigation(state,invalid),state);
  const view=getHomeNavigationView(state);
  assert.throws(()=>{view.slots[0].x=0;},TypeError);assert.throws(()=>{view.mode=0;},TypeError);
  for(let i=0;i<20;i++)assert.equal(getHomeNavigationView(state),view);
  assert.equal(getHomeNavigation(state).motion,motion); assert.equal(motion.elapsedUpdates,0);
});
test('nominal60Hz clock shares accumulated update counts and rebases pauses/backward timestamps', () => {
  let clock = createHomeUpdateClock(), step = stepHomeUpdateClock(clock,1000,true); clock = step.clock; assert.equal(step.updates,0);
  step = stepHomeUpdateClock(clock,1008,true);clock=step.clock;assert.equal(step.updates,0);
  step = stepHomeUpdateClock(clock,1017,true);clock=step.clock;assert.equal(step.updates,1);
  step = stepHomeUpdateClock(clock,1250,true);clock=step.clock;assert.equal(step.updates,14);assert.equal(clock.updateCount,15);
  step = stepHomeUpdateClock(clock,2000,false);clock=step.clock;assert.equal(step.updates,0);
  step = stepHomeUpdateClock(clock,200000,true);clock=step.clock;assert.equal(step.updates,0);assert.equal(clock.updateCount,15);
  step = stepHomeUpdateClock(clock,199000,true);assert.equal(step.updates,0);assert.equal(step.clock.remainderMs,0);
});
test('system clock starts at input, advances once per update, and freezes beneath overlays', () => {
  let state = reduceSystem(rootOne(),'zoom-out',4000); assert.equal(getHomeNavigationView(state).elapsedUpdates,0);
  state = tickSystem(state,4000+1000/60);assert.equal(getHomeNavigationView(state).elapsedUpdates,1);
  state = tickHomeNavigationClock(state,4000+1000/60);assert.equal(getHomeNavigationView(state).elapsedUpdates,1);
  state = {...state,panel:'settings'};state=tickSystem(state,4020);state=tickSystem(state,90000);
  assert.equal(getHomeNavigationView(state).elapsedUpdates,1);
  state={...state,panel:null};state=tickSystem(state,90001);assert.equal(getHomeNavigationView(state).elapsedUpdates,1);
  state=tickSystem(state,90001+1000/60);assert.equal(getHomeNavigationView(state).elapsedUpdates,2);
});
test('sleep, release, launch and reduced motion settle endpoints without erasing context histories', () => {
  const moving = advanceHomeNavigation(setHomeDensity(folder(),5),5), expected = JSON.parse(saveSettings(moving)).homeView;
  for(const transform of [s=>releaseSystemInputs(s,5000),s=>setSystemSleeping(s,true,5000),s=>tickSystem(s,5000,true),s=>launch(s,'work',5000)]){
    let state=transform(moving); assert.equal(getHomeNavigationView(state).mode,0);
    assert.deepEqual(JSON.parse(saveSettings(state)).homeView,expected);
    if(state.system.sleeping){state=tickSystem(state,500000);state=setSystemSleeping(state,false,500001);state=tickSystem(state,500002);assert.equal(state.system.homeClock.updateCount,0);}
    assert.equal(state.opened,true);
  }
});

test('touch during motion hits the displayed slot and freezes navigation until contact ends', () => {
  let state = tickHomeNavigationClock(selectHomeSlot(rootOne(),3),4000);
  state = tickSystem(state,4050); const before = getHomeNavigationView(state);
  const tile = menuTiles(state).find(tile=>tile.index===2), point={x:tile.x+tile.size/2,y:tile.y+tile.size/2};
  state = dispatchSystemEvent(state,{type:'touch',phase:'down',pointerId:1,...point},4050);
  assert.equal(state.system.homeNavigation.gesture.source.slot,2);
  state = tickSystem(state,4200); assert.deepEqual(getHomeNavigationView(state).slots,before.slots);
  state = dispatchSystemEvent(state,{type:'touch',phase:'cancel',pointerId:1,...point},4201);
  assert.equal(getHomeNavigationView(state).elapsedUpdates,before.elapsedUpdates);
  state = tickSystem(state,4218); assert.equal(getHomeNavigationView(state).elapsedUpdates,before.elapsedUpdates+1);
});

test('moving a retained active folder cannot transfer a root scroll animation into its child grid', () => {
  let state=settleHomeNavigation(setHomeDensity(folder(),4));
  state=moveHomeItem(state,{folder:null,slot:40},{folder:null,slot:180});
  const view=getHomeNavigationView(state);
  assert.equal(view.context,180);assert.equal(view.mode,0);assert.equal(view.slots.length,60);
  assert.equal(view.currentDensity,4);assert.equal(view.rows,4);
  assert.equal(getHomeNavigation(state).rootView.selectedSlot,180);
});
