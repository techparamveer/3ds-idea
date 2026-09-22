import {settleHomeNavigation} from '../src/os/home-navigation.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, reduceMenu as reduceMenuMotion, touchMenu as touchMenuMotion, pageStart, SLOT_COUNT, menuTiles, rowCount, densities, isFolder, keyboardKeys } from '../src/os/state.ts';
const reduceMenu=(...args)=>settleHomeNavigation(reduceMenuMotion(...args));
const touchMenu=(...args)=>settleHomeNavigation(touchMenuMotion(...args));
const center = tile => [(Math.max(20,tile.x)+Math.min(300,tile.x+tile.size))/2, tile.y + tile.size / 2];
test('D-pad navigation is column-major at every native density and remains in bounds',()=>{
 for(const columns of densities){
  let s={...initialState,columns};const rows=rowCount(s);
  s=reduceMenu(s,'right');assert.equal(s.selected,rows);
  s=reduceMenu(s,'down');assert.equal(s.selected,rows+Math.min(1,rows-1));
  for(let i=0;i<400;i++)s=reduceMenu(s,'right');assert.ok(s.selected<SLOT_COUNT);
  for(let i=0;i<400;i++)s=reduceMenu(s,'left');assert.equal(Math.floor(s.selected/rows),0);assert.equal(pageStart(s),0);
 }
});
test('A opens a folder; folder selection is independent; B restores root while HOME retains the active context',()=>{
 let s=reduceMenu({...initialState,selected:2},'open');assert.equal(s.opened,true);
 s=reduceMenu(s,'right');assert.equal(s.selected,2);assert.equal(s.folderSelected,1);
 assert.equal(reduceMenu(s,'back').opened,false);assert.equal(reduceMenu(s,'home').opened,true);
});
test('Touch selects the drawn icon, and a second tap opens it',()=>{
 const tile=menuTiles(initialState).find(t=>t.index===2);
 let s=touchMenu(initialState,...center(tile));assert.equal(s.selected,2);assert.equal(s.opened,false);
 s=touchMenu(s,...center(tile));assert.equal(s.opened,true);assert.equal(touchMenu(s,160,226).opened,false);
});
test('Power-off ignores all other menu input and wakes without an overlay',()=>{
 const off=reduceMenu({...initialState,panel:'settings'},'power');assert.equal(off.powered,false);
 assert.deepEqual(reduceMenu(off,'open'),off);assert.deepEqual(touchMenu(off,100,100),off);
 const on=reduceMenu(off,'power');assert.equal(on.powered,true);assert.equal(on.panel,null);
});
test('Offscreen, nonfinite and genuine tile-gap touches do nothing',()=>{
 for(const [x,y]of [[-1,0],[320,120],[160,240],[NaN,50],[50,Infinity],[118,80]])assert.deepEqual(touchMenu(initialState,x,y),initialState);
});
test('Empty slots create folders; opening then uses the newly created folder',()=>{
 let s={...initialState,selected:8};assert.equal(isFolder(8,s),false);
 s=reduceMenu(s,'open');assert.equal(isFolder(8,s),true);assert.equal(s.opened,false);
 s=reduceMenu(s,'open');assert.equal(s.opened,true);
});
test('Drawn tiles remain reachable after scrolling or density changes',()=>{
 for(const columns of densities)for(const selected of [0,2,17,72,298,299]){
  const state={...initialState,columns,selected};
  for(const tile of menuTiles(state).filter(t=>t.x<300&&t.x+t.size>20)){
   const touched=touchMenu(state,...center(tile));assert.equal(touched.selected,tile.index);
  }
 }
});
test('one-row icons stay below the label area and density changes retain shared touch bounds',()=>{
 const one={...initialState,columns:3,selected:0},tiles=menuTiles(one);
 assert.deepEqual(tiles.slice(0,3).map(t=>[t.x,t.y,t.size]),[[40,125,72],[124,125,72],[208,125,72]]);
 assert.deepEqual(touchMenu(one,160,118),one,'the old single-row centre is now label space');
 const selected=touchMenu(one,244,161);assert.equal(selected.selected,2);
 const two=touchMenu(selected,307,16);assert.equal(rowCount(two),2);assert.equal(two.selected,2);
 assert.deepEqual(menuTiles(two).slice(0,2).map(t=>[t.y,t.size]),[[46,72],[130,72]]);
 const back=touchMenu(two,277,16);assert.equal(rowCount(back),1);assert.equal(back.selected,2);
 assert.ok(menuTiles(back).every(t=>t.y===125));
});
test('Zoom-in and zoom-out are separate bounded controls, preserving selected software',()=>{
 let s={...initialState,selected:17};
 s=touchMenu(s,307,16);assert.equal(rowCount(s),3);assert.equal(s.selected,17);
 s=touchMenu(s,277,16);assert.equal(rowCount(s),2);
 for(let i=0;i<10;i++)s=reduceMenu(s,'zoom-in');assert.equal(rowCount(s),1);
 for(let i=0;i<10;i++)s=reduceMenu(s,'zoom-out');assert.equal(rowCount(s),6);
});
test('Settings drawer changes brightness and theme without changing the underlying selection',()=>{
 let s=touchMenu(initialState,20,15);assert.equal(s.panel,'settings');
 s=touchMenu(s,70,170);assert.equal(s.brightness,.2);
 s=touchMenu(s,150,65);assert.equal(s.panel,'themes');
 s=touchMenu(s,100,160);assert.equal(s.theme,'blue');assert.equal(s.panel,'settings');
 s=reduceMenu(s,'back');assert.equal(s.panel,null);assert.equal(s.selected,0);
});
test('Rename is transactional, touch keyboard works, and deletion requires confirmation',()=>{
 let s=touchMenu(initialState,50,226);assert.equal(s.panel,'folder-settings');
 s=touchMenu(s,100,90);assert.equal(s.panel,'rename');
 const key=keyboardKeys.find(k=>k.value==='a');s=touchMenu(s,key.x+10,key.y+10);assert.equal(s.nameDraft,'a');assert.equal(s.folders[0],'');
 const cancelled=reduceMenu(s,'back');assert.equal(cancelled.folders[0],'');
 s=touchMenu(s,240,226);assert.equal(s.folders[0],'a');assert.equal(s.panel,null);
 s=touchMenu(s,50,226);s=touchMenu(s,100,150);assert.equal(s.panel,'delete');assert.equal(isFolder(0,s),true);
 s=touchMenu(s,200,180);assert.equal(isFolder(0,s),false);assert.equal(isFolder(0,initialState),true);
});
test('All toolbar applets can be entered and closed without launching a folder',()=>{
 for(const [x,panel]of [[60,'notes'],[105,'friends'],[145,'notifications'],[190,'browser'],[235,'miiverse']]){
  const s=touchMenu(initialState,x,16);assert.equal(s.panel,panel);assert.equal(s.opened,false);
  assert.equal(reduceMenu(s,'home').panel,null);
 }
});
test('Native folder limits apply separately from the 300-slot HOME layout',()=>{
 let s=reduceMenu(initialState,'open');
 for(let i=0;i<350;i++)s=reduceMenu(s,'right');
 for(let i=0;i<6;i++)s=reduceMenu(s,'down');
 assert.equal(s.folderSelected,59);assert.ok(menuTiles(s).every(t=>t.index<60));
 const full={...initialState,selected:65,folders:Object.fromEntries(Array.from({length:60},(_,i)=>[i,'']))};
 assert.deepEqual(reduceMenu(full,'open'),full);
});
