import test from 'node:test';
import assert from 'node:assert/strict';
import { getMenuActionSound } from '../src/os/menu-action-sound.ts';
import { createPortfolioState, tickSystem, tickHomeNavigationClock, reduceSystem } from '../src/os/system.ts';
import { reduceMenu } from '../src/os/state.ts';
import { moveHomeItem } from '../src/os/home-layout.ts';
import { enterHomeFolder, selectHomeSlot } from '../src/os/home-navigation.ts';
const T=4000,F=1000/60;
function opened(){return enterHomeFolder(reduceMenu(selectHomeSlot(tickSystem(createPortfolioState(),3001),40),'open'),40);}
test('normal close emits at begin only; duplicate Back and later restoration emit nothing',()=>{
 const a=opened(),b=reduceSystem(a,'back',T);assert.equal(getMenuActionSound(a,b,'back'),'folder-close');
 const duplicate=reduceSystem(b,'back',T);assert.equal(getMenuActionSound(b,duplicate,'back'),undefined);
 const complete=tickHomeNavigationClock(b,T+18*F);assert.equal(getMenuActionSound(b,complete,'tick'),undefined);
});
test('preferences layout reset cancels close without replaying its sound',()=>{
 const closing=reduceSystem(opened(),'back',T),preferences=reduceSystem(closing,'preferences',T),reset=reduceSystem(preferences,'reset-layout',T);
 assert.equal(reset.opened,false);assert.equal(getMenuActionSound(preferences,reset,'reset-layout'),undefined);
});
test('Open after elapsed close completion uses the post-advance action state and emits folder-open',()=>{
 const closing=reduceSystem(opened(),'back',T),beforeAction=tickHomeNavigationClock(closing,T+40*F),reopened=reduceSystem(beforeAction,'open',T+40*F);
 assert.equal(closing.opened,true);assert.equal(beforeAction.opened,false);assert.equal(reopened.opened,true);
 assert.equal(getMenuActionSound(beforeAction,reopened,'open'),'folder-open');
});

test('occupied and vacant folder child moves emit the native icon-selection cue; blocked movement does not',()=>{
 let state=moveHomeItem(opened(),{folder:null,slot:0},{folder:40,slot:1});
 for(const command of ['right','right','left']){const next=reduceSystem(state,command,T);assert.equal(getMenuActionSound(state,next,command),'select');state=next;}
 const left=reduceSystem(reduceSystem(state,'left',T),'left',T);assert.equal(getMenuActionSound(left,reduceSystem(left,'left',T),'left'),undefined);
});
