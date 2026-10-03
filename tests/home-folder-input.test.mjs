import test from 'node:test';
import assert from 'node:assert/strict';
import { HOME_FOLDER_BACK_BOUNDS, isHomeFolderBackTouch, hasEmptyHomeFolderSelection, reduceMenu, touchMenu } from '../src/os/state.ts';
import { createPortfolioState, tickSystem, touchSystem, reduceSystem, dispatchSystemEvent, saveSettings, sampleSystemHomeFolderClose } from '../src/os/system.ts';
import { selectHomeLocation, moveHomeItem } from '../src/os/home-layout.ts';
import { getHomeNavigation, enterHomeFolder, leaveHomeFolder, setHomeDensity, selectHomeSlot, settleHomeNavigation } from '../src/os/home-navigation.ts';
import { homeTouchLocation, HOME_GESTURE_TIMING, ownedHomeFolderBackContact } from '../src/os/home-gestures.ts';
import { getHomeFooter } from '../src/os/home-presentation.ts';

const home = () => tickSystem(createPortfolioState(), 3001);
const folder = () => enterHomeFolder(reduceMenu(selectHomeLocation(home(), { folder: null, slot: 40 }), 'open'), 40);
const touch = (state, phase, x, y, now = 4000, pointerId = 1) => dispatchSystemEvent(state, { type: 'touch', phase, x, y, pointerId }, now);
const views = state => JSON.parse(saveSettings(state)).homeView;
const completed = state => tickSystem(state, state.system.homeClock.lastNow + 18 * 1000 / 60);

test('Back uses the bottom-centre native boundary, including its four edges, at every folder density', () => {
  assert.deepEqual(HOME_FOLDER_BACK_BOUNDS, { left: 23, top: 43, right: 95, bottom: 65 });
  for (let density = 0; density < 6; density++) {
    const state = settleHomeNavigation(setHomeDensity(folder(), density));
    for (const [x, y] of [[23,43], [95,43], [23,65], [95,65], [59,54], [80,60]]) {
      assert.equal(isHomeFolderBackTouch(state,x,y),true);
      assert.equal(homeTouchLocation(state,x,y),null);
      assert.equal(touchMenu(state,x,y).opened,false);
      const started=touchSystem(state,x,y,4000);assert.equal(started.opened,true);assert.equal(completed(started).opened,false);
      const pressed=touch(state,'down',x,y,4000);assert.equal(pressed.system.homeNavigation.gesture.area,'folder-back');
      const released=touch(pressed,'up',x,y,4010);assert.ok(sampleSystemHomeFolderClose(released));assert.equal(completed(released).opened,false);
    }
    for (const [x, y] of [[22.99,54], [95.01,54], [59,42.99], [59,65.01], [10,40], [NaN,54], [59,Infinity]]) {
      assert.equal(isHomeFolderBackTouch(state,x,y),false);
      assert.equal(touchSystem(state,x,y,4000).opened,true);
    }
  }
  assert.equal(isHomeFolderBackTouch(home(),59,54),false);
  assert.equal(isHomeFolderBackTouch({...folder(),panel:'folder-settings'},59,54),false);
});

test('Back touch and physical B restore the same root and retain both folder histories', () => {
  let state = folder();
  state = settleHomeNavigation(selectHomeSlot(setHomeDensity(state,4),47));
  state = leaveHomeFolder(state);
  state = reduceMenu(selectHomeLocation(state,{folder:null,slot:41}),'open');
  state = settleHomeNavigation(selectHomeSlot(setHomeDensity(enterHomeFolder(state,41),0),21));
  state = enterHomeFolder(leaveHomeFolder(state),40);
  const histories = structuredClone(getHomeNavigation(state).folderViews);
  const physicalClosing = dispatchSystemEvent(state,{type:'button',phase:'down',source:'model:B',command:'back'},4000);
  const pressed = touch(state,'down',80,60);
  assert.equal(pressed.system.homeNavigation.gesture.area,'folder-back');
  assert.equal(pressed.system.homeNavigation.gesture.source,null);
  assert.equal(pressed.opened,true);
  const closing = touch(pressed,'up',80,60,4010);
  assert.equal(closing.opened,true);
  assert.equal(sampleSystemHomeFolderClose(closing).controller.phase,sampleSystemHomeFolderClose(physicalClosing).controller.phase);
  const physical = completed(physicalClosing);
  const tapped = completed(closing);assert.equal(tapped.opened,false);
  assert.deepEqual(views(tapped),views(physical));
  assert.deepEqual(getHomeNavigation(tapped).folderViews,histories);
  assert.equal(tapped.system.homeNavigation.gesture,null);
  assert.equal(tapped.system.input.touch,null);
  assert.equal(enterHomeFolder(tapped,40).folderSelected,47);
});

test('Back contact restores its exact owner after leaving and re-entering without panning or lifting', () => {
  const initial = folder();
  let state = touch(initial,'down',59,55);
  assert.equal(state.system.homeNavigation.gesture.area,'folder-back');
  assert.equal(ownedHomeFolderBackContact(state,state.system.homeNavigation.gesture),true);
  state = tickSystem(state,4000+HOME_GESTURE_TIMING.liftMs+100);
  assert.equal(state.system.homeNavigation.gesture.mode,'press');
  state = touch(state,'move',150,55,4700);
  assert.equal(state.system.homeNavigation.gesture.mode,'press');
  assert.equal(ownedHomeFolderBackContact(state,state.system.homeNavigation.gesture),false);
  state = touch(state,'move',59,55,4710);
  assert.equal(ownedHomeFolderBackContact(state,state.system.homeNavigation.gesture),true);
  state = touch(state,'up',59,55,4720);
  assert.equal(state.opened,true);assert.ok(sampleSystemHomeFolderClose(state));
  state=completed(state);assert.equal(state.opened,false);
  assert.deepEqual(getHomeNavigation(state).rootView,getHomeNavigation(initial).rootView);
  assert.deepEqual(getHomeNavigation(state).folderViews,getHomeNavigation(initial).folderViews);
});

test('Back ownership cannot transfer across regions, cancellation, stale pointers or navigation replacement', () => {
  const initial=folder(),before=views(initial);
  for(const [x,y] of [[150,55],[59,16],[150,100],[160,226],[-1,55]]){
    let state=touch(initial,'down',59,55);state=touch(state,'move',x,y,4010);
    assert.equal(ownedHomeFolderBackContact(state,state.system.homeNavigation.gesture),false);
    state=touch(state,'up',x,y,4020);assert.equal(state.opened,true);assert.equal(sampleSystemHomeFolderClose(state),null);assert.deepEqual(views(state),before);
  }
  for (const [start,end] of [[[59,42],[59,43]],[[59,43],[59,42]],[[22,54],[23,54]],[[95,54],[96,54]]]) {
    let state=touch(initial,'down',...start);state=touch(state,'up',...end,4010);
    assert.equal(state.opened,true); assert.deepEqual(views(state),before);
  }
  let state=touch(initial,'down',59,54);const stale=state.system.homeNavigation.gesture;
  state=touch(state,'cancel',59,54,4010);assert.equal(ownedHomeFolderBackContact(state,stale),false);state=touch(state,'up',59,54,4020);
  assert.equal(state.opened,true);assert.deepEqual(views(state),before);
  state=touch(initial,'down',59,54);state=touch(state,'up',59,54,4010,2);
  assert.equal(state.opened,true);state=touch(state,'up',59,54,4020);assert.equal(state.opened,true);assert.equal(completed(state).opened,false);

  state=touch(initial,'down',59,54);const owner=state.system.homeNavigation.gesture;
  state=selectHomeSlot(state,1);assert.equal(ownedHomeFolderBackContact(state,owner),false);
  state=touch(state,'up',59,54,4010);assert.equal(sampleSystemHomeFolderClose(state),null);assert.equal(state.opened,true);
});

test('empty selected child suppresses every footer tap and A even when the folder has other software', () => {
  const empty = folder();
  const occupied = moveHomeItem(empty,{folder:null,slot:0},{folder:40,slot:3});
  assert.equal(hasEmptyHomeFolderSelection(occupied),false);
  for (const state of [empty,settleHomeNavigation(selectHomeSlot(occupied,2))]) {
    assert.equal(hasEmptyHomeFolderSelection(state),true);
    const before=saveSettings(state);
    for (const x of [0,59,99,100,159,160,250,319]) for (const y of [212,226,239]) {
      assert.equal(touchMenu(state,x,y),state);
      const legacy=touchSystem(state,x,y,4000);
      assert.equal(legacy.opened,true);assert.equal(legacy.system.phase,'home');assert.equal(saveSettings(legacy),before);
      const tapped=touch(touch(state,'down',x,y),'up',x,y,4010);
      assert.equal(tapped.opened,true);assert.equal(tapped.system.phase,'home');assert.equal(saveSettings(tapped),before);
    }
    const opened=reduceSystem(state,'open',4000);
    assert.equal(opened.opened,true);assert.equal(opened.system.phase,'home');assert.equal(saveSettings(opened),before);
    assert.equal(completed(touchSystem(state,59,54,4000)).opened,false);
    assert.equal(completed(reduceSystem(state,'back',4000)).opened,false);
  }
  const launched=touchSystem(occupied,250,226,4000);
  assert.equal(launched.system.app,'work');assert.equal(launched.system.phase,'launch');
});

test('blank root slots retain Create Folder and opening the new folder has no Close footer', () => {
  const root=selectHomeLocation(home(),{folder:null,slot:40});
  assert.equal(hasEmptyHomeFolderSelection(root),false);
  const created=touchSystem(root,160,226,4000);
  assert.equal(created.folders[40],'１ (New Folder)');assert.equal(created.opened,false);
  const opened=touchSystem(created,160,226,4010);
  assert.equal(opened.opened,true);assert.equal(hasEmptyHomeFolderSelection(opened),true);
  assert.equal(touchSystem(opened,160,226,4020).opened,true);
});

test('occupied folder uses full-width Open while header Back and physical B still close it',()=>{
 const populated=moveHomeItem(folder(),{folder:null,slot:0},{folder:40,slot:2});
 const state=settleHomeNavigation(selectHomeSlot(populated,2)),child=state.system.folderLayouts[40][2];
 assert.deepEqual(getHomeFooter(state),{two:false,left:null,right:'open'});
 assert.equal(touchMenu(state,50,226),state,'pure menu fallback must not reinterpret Open as Close');
 for(const x of [0,59,99,100,160,319]){
  const launched=touchSystem(state,x,226,4100);
  assert.equal(launched.system.phase,'launch');assert.equal(launched.system.app,child);assert.equal(launched.opened,true);
 }
 assert.equal(completed(touchSystem(state,59,54,4200)).opened,false,'header Back remains available');
 assert.equal(completed(reduceSystem(state,'back',4200)).opened,false,'physical B remains available');
});
