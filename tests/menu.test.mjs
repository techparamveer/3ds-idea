import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, reduceMenu, touchMenu, pageStart, SLOT_COUNT } from '../src/os/state.ts';
test('D-pad navigation uses column-major rows and stays in the grid',()=>{
 let s={...initialState};s=reduceMenu(s,'right');assert.equal(s.selected,2);s=reduceMenu(s,'down');assert.equal(s.selected,3);
 for(let i=0;i<50;i++)s=reduceMenu(s,'right');assert.equal(s.selected,SLOT_COUNT-1);
 for(let i=0;i<50;i++)s=reduceMenu(s,'left');assert.equal(s.selected,1);assert.equal(pageStart(s),0);
});
test('A opens, B and HOME return, navigation cannot alter an open folder',()=>{
 let s=reduceMenu(initialState,'open');assert.equal(s.opened,true);assert.equal(reduceMenu(s,'right').selected,0);
 assert.equal(reduceMenu(s,'back').opened,false);assert.equal(reduceMenu(s,'home').opened,false);
});
test('Touch selects the same cell as the buttons; second tap opens it',()=>{
 let s=touchMenu(initialState,125,70);assert.equal(s.selected,2);assert.equal(s.opened,false);
 s=touchMenu(s,125,70);assert.equal(s.opened,true);assert.equal(touchMenu(s,160,220).opened,false);
});
test('Powered-off hardware ignores menu inputs and wakes cleanly',()=>{
 const off=reduceMenu(initialState,'power');assert.equal(off.powered,false);assert.deepEqual(reduceMenu(off,'open'),off);
 assert.deepEqual(touchMenu(off,100,100),off);const on=reduceMenu(off,'power');assert.equal(on.powered,true);assert.equal(on.opened,false);
});
test('Offscreen touches do not change selection',()=>{for(const [x,y]of [[-1,0],[321,120],[160,241]])assert.deepEqual(touchMenu(initialState,x,y),initialState);});
