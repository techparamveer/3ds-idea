import test from 'node:test';
import assert from 'node:assert/strict';
import { HOME_FOLDER_BACK_BOUNDS, isHomeFolderBackTouch, hasEmptyHomeFolderSelection, reduceMenu, touchMenu } from '../src/os/state.ts';
import { createPortfolioState, tickSystem, touchSystem, reduceSystem, dispatchSystemEvent, saveSettings } from '../src/os/system.ts';
import { selectHomeLocation, moveHomeItem } from '../src/os/home-layout.ts';
import { getHomeNavigation, enterHomeFolder, leaveHomeFolder, setHomeDensity, selectHomeSlot, settleHomeNavigation } from '../src/os/home-navigation.ts';
import { homeTouchLocation, HOME_GESTURE_TIMING } from '../src/os/home-gestures.ts';

const home = () => tickSystem(createPortfolioState(), 3001);
const folder = () => enterHomeFolder(reduceMenu(selectHomeLocation(home(), { folder: null, slot: 40 }), 'open'), 40);
const touch = (state, phase, x, y, now = 4000, pointerId = 1) => dispatchSystemEvent(state, { type: 'touch', phase, x, y, pointerId }, now);
const views = state => JSON.parse(saveSettings(state)).homeView;

test('Back uses the bottom-centre native boundary, including its four edges, at every folder density', () => {
  assert.deepEqual(HOME_FOLDER_BACK_BOUNDS, { left: 23, top: 43, right: 95, bottom: 65 });
  for (let density = 0; density < 6; density++) {
    const state = settleHomeNavigation(setHomeDensity(folder(), density));
    for (const [x, y] of [[23,43], [95,43], [23,65], [95,65], [59,54], [80,60]]) {
      assert.equal(isHomeFolderBackTouch(state,x,y),true);
      assert.equal(homeTouchLocation(state,x,y),null);
      assert.equal(touchMenu(state,x,y).opened,false);
      assert.equal(touchSystem(state,x,y,4000).opened,false);
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
  const physical = dispatchSystemEvent(state,{type:'button',phase:'down',source:'model:B',command:'back'},4000);
  const pressed = touch(state,'down',80,60);
  assert.equal(pressed.system.homeNavigation.gesture.area,'chrome');
  assert.equal(pressed.system.homeNavigation.gesture.source,null);
  assert.equal(pressed.opened,true);
  const tapped = touch(pressed,'up',80,60,4010);
  assert.equal(tapped.opened,false);
  assert.deepEqual(views(tapped),views(physical));
  assert.deepEqual(getHomeNavigation(tapped).folderViews,histories);
  assert.equal(tapped.system.homeNavigation.gesture,null);
  assert.equal(tapped.system.input.touch,null);
  assert.equal(enterHomeFolder(tapped,40).folderSelected,47);
});

test('Back contact cannot pan or lift the grid, and cancelling or crossing its boundary cannot activate it', () => {
  const initial = folder(), before = views(initial);
  let state = touch(initial,'down',59,54);
  state = tickSystem(state,4000+HOME_GESTURE_TIMING.liftMs+100);
  assert.equal(state.system.homeNavigation.gesture.mode,'press');
  assert.equal(state.system.homeNavigation.gesture.area,'chrome');
  state = touch(state,'move',90,54,4700);
  state = touch(state,'up',90,54,4710);
  assert.equal(state.opened,true); assert.deepEqual(views(state),before);
  for (const [start,end] of [[[59,42],[59,43]],[[59,43],[59,42]],[[22,54],[23,54]],[[95,54],[96,54]]]) {
    state=touch(initial,'down',...start);state=touch(state,'up',...end,4010);
    assert.equal(state.opened,true); assert.deepEqual(views(state),before);
  }
  state=touch(initial,'down',59,54);state=touch(state,'cancel',59,54,4010);state=touch(state,'up',59,54,4020);
  assert.equal(state.opened,true);assert.deepEqual(views(state),before);
  state=touch(initial,'down',59,54);state=touch(state,'up',59,54,4010,2);
  assert.equal(state.opened,true);state=touch(state,'up',59,54,4020);assert.equal(state.opened,false);
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
    assert.equal(touchSystem(state,59,54,4000).opened,false);
    assert.equal(reduceSystem(state,'back',4000).opened,false);
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
