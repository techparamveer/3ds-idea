import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortfolioState,tickSystem,reduceSystem,dispatchSystemEvent,touchSystem,launchHomeShortcut,releaseSystemInputs,setSystemSleeping,sampleSystemHomeApplicationTransition} from '../src/os/system.ts';
import {SOFTWARE_DIALOG_BUTTONS,softwareDialogActionAt,softwareDialogPressed} from '../src/os/stock-screen-layout.ts';

function suspended(){
 let state=tickSystem(createPortfolioState(),3001);
 state=tickSystem(reduceSystem(state,'open',4000),6200);
 return reduceSystem(state,'home',6300);
}
const dialog=kind=>kind==='close'?reduceSystem(suspended(),'back',6400):launchHomeShortcut(suspended(),'about',6400);
const touch=(state,phase,x,y,pointerId=1)=>dispatchSystemEvent(state,{type:'touch',phase,x,y,pointerId},6500);
const tap=(state,x,y)=>touch(touch(state,'down',x,y),'up',x,y);
const finishClose=(state,now=6500)=>{const ticks=sampleSystemHomeApplicationTransition(state).intent.kind==='close'?4:2;for(let i=0;i<ticks;i++)state=tickSystem(state,now+i*1000);return tickSystem(state,state.system.homeClock.lastNow+1000/60);};

test('paint and touch share bounded button rectangles and owned pressed feedback',()=>{
 for(const r of SOFTWARE_DIALOG_BUTTONS){
  for(const [x,y] of [[r.x,r.y],[r.x+r.width-.01,r.y+r.height-.01]])assert.equal(softwareDialogActionAt(x,y),r.action);
  assert.equal(softwareDialogActionAt(r.x+r.width,r.y),null);
  assert.equal(softwareDialogActionAt(r.x,r.y+r.height),null);
  assert.equal(softwareDialogPressed({startX:r.x,startY:r.y,x:r.x+1,y:r.y+1}),r.action);
  assert.equal(softwareDialogPressed({startX:r.x,startY:r.y,x:160,y:188}),null);
 }
 assert.equal(softwareDialogPressed(null),null);
 assert.equal(softwareDialogPressed({startX:87,startY:188,x:233,y:188}),null);
 assert.equal(softwareDialogPressed({startX:160,startY:188,x:233,y:188}),null);
 for(const n of [NaN,Infinity,-Infinity])assert.equal(softwareDialogActionAt(n,188),null);
});

for(const kind of ['close','switch']){
 test(`${kind}: blank margins, gutter and underlying footer never confirm or cancel`,()=>{
  for(const [x,y] of [[0,188],[19,188],[159,188],[160,188],[300,188],[319,188],[232,179],[232,220],[232,225]]){
   const initial=dialog(kind);
   for(const next of [touchSystem(initial,x,y,6500),tap(initial,x,y)]){
    assert.equal(next.system.dialog,kind,`${x},${y}`);
    assert.equal(next.system.runtime,initial.system.runtime);
    assert.equal(next.system.pending,initial.system.pending);
   }
  }
 });
 test(`${kind}: complete same-button contact owns activation`,()=>{
  for(const [start,end] of [[[87,188],[233,188]],[[233,188],[87,188]],[[160,150],[233,188]],[[233,188],[319,225]]]){
   const initial=dialog(kind),next=touch(touch(initial,'down',...start),'up',...end);
   assert.equal(next.system.dialog,kind);
   assert.equal(next.system.runtime,initial.system.runtime);
   assert.equal(next.system.input.touch,null);
  }
  const initial=dialog(kind),down=touch(initial,'down',233,188);
  assert.equal(down.system.runtime,initial.system.runtime);
  const cancelled=tap(initial,87,188);
  assert.equal(cancelled.system.dialog,null);assert.equal(cancelled.system.app,'work');
  assert.equal(cancelled.system.pending,null);
  const confirmed=touch(down,'up',233,188);
  assert.equal(confirmed.system.dialog,null);
  assert.deepEqual(sampleSystemHomeApplicationTransition(confirmed).intent,kind==='close'?{kind:'close'}:{kind:'switch',appId:'about'});
  assert.equal(confirmed.system.app,'work');
  assert.equal(confirmed.system.phase,'home');
  assert.equal(confirmed.system.input.touch,null);
  const duplicate=touch(confirmed,'up',233,188);
  assert.equal(duplicate.system.runtime,confirmed.system.runtime);
  assert.equal(sampleSystemHomeApplicationTransition(duplicate),sampleSystemHomeApplicationTransition(confirmed));
  const completed=finishClose(confirmed);
  assert.equal(completed.system.app,kind==='close'?null:'about');
  assert.equal(completed.system.phase,kind==='close'?'home':'launch');
 });
 test(`${kind}: cancellation and a second pointer cannot release the owner's button`,()=>{
  const initial=dialog(kind),down=touch(initial,'down',233,188);
  assert.equal(touch(down,'up',233,188,2),down);
  const cancelled=touch(down,'cancel',233,188);
  assert.equal(cancelled.system.dialog,kind);
  assert.equal(touch(cancelled,'up',233,188),cancelled);
  for(const interrupted of [releaseSystemInputs(down,6501),setSystemSleeping(down,true,6501)]){
   const next=touch(interrupted,'up',233,188);
   assert.equal(next.system.dialog,kind);assert.equal(next.system.app,'work');
   assert.equal(next.system.input.touch,null);
  }
 });
 test(`${kind}: A/B commands retain the same confirm/cancel semantics`,()=>{
  for(const command of ['open','back']){
   const initial=dialog(kind);
   const expected=reduceSystem(initial,command,6500);
   const actual=dispatchSystemEvent(initial,{type:'button',phase:'down',source:'physical:A',command},6500);
   assert.equal(actual.system.dialog,expected.system.dialog);
   assert.equal(actual.system.app,expected.system.app);
   assert.equal(actual.system.phase,expected.system.phase);
  }
 });
}

test('a pointer held before the close dialog opens cannot confirm it on release',()=>{
 const down=touch(suspended(),'down',233,188);
 const opened=reduceSystem(down,'back',6501);
 assert.equal(opened.system.dialog,'close');
 assert.equal(opened.system.input.touch,null);
 const released=touch(opened,'up',233,188);
 assert.equal(released.system.dialog,'close');assert.equal(released.system.app,'work');
});
