import {settleHomeNavigation} from '../src/os/home-navigation.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createPortfolioState, tickSystem, reduceSystem, launch, saveSettings, restoreSettings, releaseSystemInputs, setSystemSleeping } from '../src/os/system.ts';
import { reduceMenu, menuTiles } from '../src/os/state.ts';
import { moveHomeItem, selectHomeLocation } from '../src/os/home-layout.ts';
import { getHomeNavigation, getHomeNavigationView, setHomeDensity as setHomeDensityMotion, selectHomeSlot as selectHomeSlotMotion, enterHomeFolder, leaveHomeFolder, maxHomeLeftSlot } from '../src/os/home-navigation.ts';
const setHomeDensity=(state,density)=>settleHomeNavigation(setHomeDensityMotion(state,density));
const selectHomeSlot=(state,slot)=>settleHomeNavigation(selectHomeSlotMotion(state,slot));
const home = () => tickSystem(createPortfolioState(), 3001);
const create = (state, slot) => reduceMenu(selectHomeLocation(state, { folder: null, slot }), 'open');
const record = state => structuredClone(getHomeNavigation(state));

test('folder geometry uses all six native centre/pitch/box tables with 60 slots', () => {
  const expected = [[1,3,76,161,84,82,72,57],[1,3,76,137,84,84,72,57],[2,5,52,109,54,54,50,50],[3,7,40,95,40,40,36,39],[4,9,32,87,32,32,28,24],[5,10,34,80,28,28,24,10]];
  for (let density = 0; density < 6; density++) {
    const state = setHomeDensity(enterHomeFolder(create(home(),40),40), density), view = getHomeNavigationView(state);
    const [rows,columns,x,y,px,py,size,left] = expected[density];
    assert.deepEqual([view.rows,view.columns,view.slots[0].x,view.slots[0].y,view.pitchX,view.pitchY,view.size,maxHomeLeftSlot(true,density)], [rows,columns,x,y,px,py,size,left]);
    assert.equal(view.slots.length,60);
    assert.deepEqual(menuTiles(state)[0],{index:0,x:x-size/2,y:y-size/2,size});
    assert.equal(view.slots[rows].x-x,px);
  }
});
test('new folders start at density1 independently of root; two folders restore independent histories', () => {
  let state = create(create(setHomeDensity(home(),4),40),41);
  assert.equal(getHomeNavigation(state).folderViews[40].density,1);
  state = selectHomeSlot(state,40); const root = record(state).rootView;
  state = selectHomeSlot(setHomeDensity(enterHomeFolder(state,40),0),21); const one = record(state).folderViews[40];
  state = leaveHomeFolder(state); assert.deepEqual(record(state).rootView,root); assert.equal(state.columns,10);
  state = selectHomeSlot(setHomeDensity(enterHomeFolder(state,41),3),38); const two = record(state).folderViews[41];
  state = enterHomeFolder(leaveHomeFolder(state),40);
  assert.deepEqual(record(state).folderViews[40],one); assert.equal(state.folderSelected,21); assert.equal(state.columns,3);
  assert.deepEqual(record(state).folderViews[41],two);
  state = enterHomeFolder(leaveHomeFolder(state),41); assert.equal(state.folderSelected,38); assert.equal(state.columns,8);
});
test('folder density placement uses context rows, with earliest nearest-X tie behavior', () => {
  let state = selectHomeSlot(setHomeDensity(enterHomeFolder(create(home(),40),40),0),6);
  assert.equal(getHomeNavigationView(state).selectedAnchorX,244);
  state = setHomeDensity(state,1); assert.equal(getHomeNavigation(state).folderViews[40].targetLeftSlot,4);
  state = setHomeDensity(state,2); assert.equal(getHomeNavigation(state).folderViews[40].targetLeftSlot,0);
  assert.equal(getHomeNavigationView(state).selectedAnchorX,214);
});
test('moving/swapping folders carries views and deleting/recreating discards the old view', () => {
  let state = create(create(home(),40),41);
  state = selectHomeSlot(setHomeDensity(enterHomeFolder(state,40),4),47); const one = record(state).folderViews[40];
  state = selectHomeSlot(setHomeDensity(enterHomeFolder(leaveHomeFolder(state),41),0),11); const two = record(state).folderViews[41];
  state = moveHomeItem(state,{folder:null,slot:40},{folder:null,slot:41});
  assert.deepEqual(record(state).folderViews[41],one); assert.deepEqual(record(state).folderViews[40],two); assert.equal(record(state).activeFolderSlot,40);
  state = moveHomeItem(state,{folder:null,slot:41},{folder:null,slot:42});
  assert.deepEqual(record(state).folderViews[42],one); assert.equal(record(state).folderViews[41],undefined);
  state = reduceMenu({...selectHomeLocation(state,{folder:null,slot:42}),panel:'delete'},'open'); assert.equal(record(state).folderViews[42],undefined);
  state = create(state,42); assert.deepEqual(record(state).folderViews[42],{selectedSlot:0,currentLeftSlot:0,targetLeftSlot:0,density:1});
});
test('launch and HOME return retain active folder, and overlays/release/sleep keep histories', () => {
  let state = create(home(),40);
  state = moveHomeItem(state,{folder:null,slot:0},{folder:40,slot:14});
  state = setHomeDensity(state,3); const before = JSON.parse(saveSettings(state)).homeView;
  state = tickSystem(launch(state,'work',4000),5200); assert.equal(state.opened,true);
  state = reduceSystem(state,'home',5300); assert.equal(state.system.phase,'home'); assert.equal(state.opened,true);
  assert.deepEqual(JSON.parse(saveSettings(state)).homeView,before);
  state = reduceSystem({...state,panel:'settings'},'home',5400); assert.equal(state.opened,true); assert.equal(state.panel,null);
  state = releaseSystemInputs(state,5500); state = setSystemSleeping(state,true,5600); state = tickSystem(state,100000); state = setSystemSleeping(state,false,100001);
  assert.deepEqual(JSON.parse(saveSettings(state)).homeView,before);
  state = reduceSystem(state,'back',100002); assert.equal(state.opened,false);
});
test('v4 round-trip preserves histories and v1–3 seed density1 folders from valid old layouts', () => {
  let state = create(setHomeDensity(home(),5),40);
  state = selectHomeSlot(setHomeDensity(enterHomeFolder(state,40),2),55);
  const raw = saveSettings(state), restored = restoreSettings(home(),raw);
  assert.equal(saveSettings(restored),raw); assert.equal(restored.opened,true);
  for (const version of [undefined,1,2,3]) {
    const old = JSON.parse(raw); old.version = version; old.columns = 10; delete old.homeView;
    const migrated = restoreSettings(home(),JSON.stringify(old)), nav = getHomeNavigation(migrated);
    assert.equal(nav.rootView.density,4); assert.equal(nav.activeFolderSlot,null);
    assert.deepEqual(nav.folderViews[40],{selectedSlot:0,currentLeftSlot:0,targetLeftSlot:0,density:1});
    assert.deepEqual(migrated.system.layout,state.system.layout);
  }
});
test('invalid v4 view records reset independently without discarding layout or valid sibling records', () => {
  let state = create(create(home(),40),41); state = selectHomeSlot(enterHomeFolder(state,40),25);
  const saved = JSON.parse(saveSettings(state));
  for (const corrupt of [v=>v.density=6,v=>v.selectedSlot=60,v=>v.targetLeftSlot=100,v=>{v.density=3;v.currentLeftSlot=1;}]) {
    const value = structuredClone(saved); corrupt(value.homeView.folderViews[41]);
    const restored = restoreSettings(home(),JSON.stringify(value));
    assert.deepEqual(restored.system.layout,state.system.layout); assert.deepEqual(getHomeNavigation(restored).folderViews[40],saved.homeView.folderViews[40]);
    assert.deepEqual(getHomeNavigation(restored).folderViews[41],{selectedSlot:0,currentLeftSlot:0,targetLeftSlot:0,density:1});
  }
  const value = structuredClone(saved); value.homeView.activeFolderSlot = 99; value.homeView.folderViews[99] = value.homeView.folderViews[40];
  const restored = restoreSettings(home(),JSON.stringify(value)); assert.equal(restored.opened,false); assert.equal(getHomeNavigation(restored).folderViews[99],undefined);
});
