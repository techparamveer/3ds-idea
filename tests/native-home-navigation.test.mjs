import {settleHomeNavigation} from '../src/os/home-navigation.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortfolioState,tickSystem,reduceSystem,touchSystem as touchSystemMotion,dispatchSystemEvent} from '../src/os/system.ts';
import {densities,menuTiles,pageStart,rowCount,visibleColumns} from '../src/os/state.ts';
import {getHomeNavigation,getHomePageBoundary,selectHomeSlot,setHomeDensity as setHomeDensityMotion,homeDensityIndex} from '../src/os/home-navigation.ts';
const setHomeDensity=(state,density)=>settleHomeNavigation(setHomeDensityMotion(state,density));
const touchSystem=(...args)=>settleHomeNavigation(touchSystemMotion(...args));
const home=columns=>setHomeDensity(tickSystem(createPortfolioState(),3001),homeDensityIndex(columns));
const at=state=>{const tile=menuTiles(state).find(t=>t.index===state.selected);assert.ok(tile);return tile.x+tile.size/2;};
const move=(state,command)=>settleHomeNavigation(reduceSystem(state,command,4000));
test('native one/two-row RIGHT follows the edge; reversing preserves the viewport',()=>{
 for(const columns of [3,4]){
  let state=home(columns);const rows=rowCount(state),positions=[76];
  for(let i=0;i<6;i++){state=move(state,'right');positions.push(at(state));}
  assert.deepEqual(positions,[76,160,244,244,244,244,244]);
  assert.equal(state.selected,6*rows);assert.equal(pageStart(state),4);
  state=move(state,'left');assert.equal(at(state),160);assert.equal(pageStart(state),4);
  state=move(state,'left');assert.equal(at(state),76);assert.equal(pageStart(state),4);
  state=move(state,'left');assert.equal(at(state),76);assert.equal(pageStart(state),3);
 }
});
test('native density touch preserves selected horizontal placement across one/two rows',()=>{
 let state=home(3);for(let i=0;i<6;i++)state=move(state,'right');
 const selected=state.selected;state=touchSystem(state,307,16,5000);
 assert.equal(rowCount(state),2);assert.equal(state.selected,selected);assert.equal(pageStart(state),1);assert.equal(at(state),244);
 state=touchSystem(state,277,16,5100);assert.equal(rowCount(state),1);assert.equal(pageStart(state),4);assert.equal(at(state),244);
});
test('creating a folder keeps the edge viewport and partial neighbouring column',()=>{
 let state=home(3);for(let i=0;i<20;i++)state=move(state,'right');
 const left=pageStart(state);assert.equal(at(state),244);
 state=move(state,'open');assert.ok(Object.hasOwn(state.folders,state.selected));assert.equal(pageStart(state),left);assert.equal(at(state),244);
 const partial=menuTiles(state).find(t=>t.index===left-1);assert.equal(partial.x,-44);assert.equal(partial.size,72);
});
test('native top-level grid tables share painted/touch geometry at every density',()=>{
 const expected=[[3,76,161,84,72],[3,76,82,84,72],[5,52,70,54,50],[7,40,64,40,36],[9,32,60,32,28],[10,34,54,28,24]];
 for(const [index,columns]of densities.entries()){
  let state=home(columns);const [count,x,y,pitch,size]=expected[index],tiles=menuTiles(state);
  assert.equal(visibleColumns(state),count);assert.deepEqual([tiles[0].x+size/2,tiles[0].y+size/2,tiles[0].size],[x,y,size]);
  assert.equal(tiles[rowCount(state)].x-tiles[0].x,pitch);
  for(let i=0;i<310;i++)state=move(state,'right');
  assert.ok(state.selected<300);assert.ok(pageStart(state)<=Math.ceil(300/rowCount(state))-count);
  const tile=menuTiles(state).find(t=>t.index===state.selected),point={x:tile.x+tile.size/2,y:tile.y+tile.size/2};
  state=dispatchSystemEvent(state,{type:'touch',phase:'down',pointerId:2,...point},9000);
  assert.equal(state.system.homeNavigation.gesture.source.slot,state.selected);
 }
});
test('captured root arrows share the60-slot endpoint with raw edge touch while preserving storage',()=>{
 let state=settleHomeNavigation(selectHomeSlot(home(12),33));
 assert.deepEqual(getHomePageBoundary(state),{extent:60,maxLeftSlot:0,left:false,right:false});
 assert.equal(menuTiles(state).some(tile=>tile.index===60),false,'the first unexposed blank column is not painted or hit-testable');
 const denseBefore=getHomeNavigation(state).rootView;
 state=touchSystem(state,307,137,10000);
 assert.deepEqual(getHomeNavigation(state).rootView,denseBefore,'hidden six-row arrow has no input route');
 state=setHomeDensity(state,4);
 assert.equal(pageStart(state),2);assert.deepEqual(getHomePageBoundary(state),{extent:60,maxLeftSlot:15,left:true,right:true});
 state=touchSystem(state,307,137,10100);
 assert.equal(state.selected,38);assert.equal(pageStart(state),3);
 assert.deepEqual(getHomePageBoundary(state),{extent:60,maxLeftSlot:15,left:true,right:false});
 state=touchSystem(state,10,137,10200);
 assert.equal(state.selected,23);assert.equal(pageStart(state),0);
 assert.deepEqual(getHomePageBoundary(state),{extent:60,maxLeftSlot:15,left:false,right:true});
 const layout={...state.system.layout,299:'preserved-high-slot'};
 state={...state,system:{...state.system,layout}};
 assert.equal(getHomePageBoundary(state).extent,300);assert.equal(state.system.layout[299],'preserved-high-slot');
});
