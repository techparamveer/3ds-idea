import test from 'node:test';
import assert from 'node:assert/strict';
import {createStockModule, initialSharedData} from '../src/os/stock-apps.ts';
import {getTitle} from '../src/os/app-registry.ts';
import {notesCaptureView, notesNextCaptureView, stockScreenActionAt, stockScreenTargets} from '../src/os/stock-screen-layout.ts';
import {createPortfolioState, tickSystem, reduceSystem, launch, invokeSystemApplet, dispatchSystemEvent} from '../src/os/system.ts';

// Source Game Notes: ImageScreenUp starts at Double; B_BtnSwitch (92,−120) 44×28 cycles Double→Up→Down→Double.
const context={now:0,shared:initialSharedData()};
const openNote=(slot='3')=>{const module=createStockModule(getTitle('game-notes'));return {module,state:module.reduce(module.create({},null,context),{type:'action',id:slot},context).state};};
const tap=(module,state,x,y)=>{for(const phase of ['down','move','up'])state=module.reduce(state,{type:'touch',phase,x,y},context).state;return state;};

test('the switch cycle is Double→Up→Down→Double and unknown modes read as Double',()=>{
 assert.deepEqual(notesNextCaptureView,{double:'up',up:'down',down:'double'});
 for(const value of [undefined,'double','triple',3,true])assert.equal(notesCaptureView({captureView:value}),'double');
 assert.equal(notesCaptureView({captureView:'up'}),'up');assert.equal(notesCaptureView({captureView:'down'}),'down');
});

test('selected Notes exposes the source Back and Switch bounding panes only',()=>{
 const view={appId:'game-notes',screen:'drawing',heading:'',rows:[],selection:0,footer:{left:{label:'Back',action:'back'}}};
 assert.deepEqual(stockScreenTargets(view),[{action:'back',x:0,y:212,width:44,height:28},{action:'switch',x:230,y:212,width:44,height:28}]);
 assert.equal(stockScreenActionAt(view,252,226),'switch');assert.equal(stockScreenActionAt(view,231,213),'switch');assert.equal(stockScreenActionAt(view,273,239),'switch');
 for(const [x,y] of [[228,226],[276,226],[252,210],[114,226],[160,226],[206,226],[298,226]])assert.equal(stockScreenActionAt(view,x,y),null,`${x},${y}`);
});

test('tapping the switch button cycles the display mode for the session without saving or effects',()=>{
 const {module,state:opened}=openNote();
 assert.equal(notesCaptureView(opened),'double');assert.equal(module.view(opened,context).data.captureView,undefined);
 let state=opened;
 for(const expected of ['up','down','double','up']){
  const out=module.reduce(state,{type:'touch',phase:'up',x:252,y:226},context);state=out.state;
  assert.deepEqual(out.effects??[],[]);assert.equal(state.captureView,expected);assert.equal(module.view(state,context).data.captureView,expected);
  assert.equal(state.screen,'drawing');assert.equal(state.slot,3);
 }
 // Down and move phases do nothing; the pen colours and eraser between the two controls have no action.
 for(const phase of ['down','move'])assert.equal(module.reduce(state,{type:'touch',phase,x:252,y:226},context).state,state);
 for(const x of [114,160,206])assert.equal(tap(module,state,x,226),state);
 // Switch is an action only on the selected note.
 assert.deepEqual(module.reduce(module.create({},null,context),{type:'action',id:'switch'},context),{state:module.create({},null,context)});
 assert.deepEqual(module.save(state),{});
 // Back keeps the session mode; reopening any note within the session shows it again.
 const back=module.reduce(state,{type:'command',command:'back'},context).state;
 assert.equal(back.screen,'main');assert.equal(back.selection,3);assert.equal(back.captureView,'up');
 const reopened=module.reduce(back,{type:'action',id:'9'},context).state;assert.equal(reopened.captureView,'up');
 const memo=createStockModule(getTitle('memo'));const memoNote=memo.reduce(memo.create({},null,context),{type:'action',id:'0'},context).state;
 assert.deepEqual(memo.reduce(memoNote,{type:'action',id:'switch'},context),{state:memoNote});
});

test('a lower-LCD tap on the switch pane reaches Game Notes through the system, and a new launch resets to Double',()=>{
 let s=tickSystem(createPortfolioState(),3001);
 s=tickSystem(launch(s,'health-safety',4000),6200);assert.equal(s.system.phase,'app');
 s=reduceSystem(s,'home',6300);s=invokeSystemApplet(s,'game-notes',6400);
 const notes=()=>s.system.runtime.instances[s.system.runtime.active];
 assert.equal(notes().appId,'game-notes');
 s=dispatchSystemEvent(s,{type:'touch',phase:'down',pointerId:1,x:22,y:60},6500);
 s=dispatchSystemEvent(s,{type:'touch',phase:'up',pointerId:1,x:22,y:60},6510);
 assert.equal(notes().state.screen,'drawing');assert.equal(notes().state.captureView,undefined);
 const touch=(x,y,now)=>{s=dispatchSystemEvent(s,{type:'touch',phase:'down',pointerId:1,x,y},now);s=dispatchSystemEvent(s,{type:'touch',phase:'up',pointerId:1,x,y},now+10);};
 touch(252,226,6600);assert.equal(notes().state.captureView,'up');
 touch(252,226,6700);assert.equal(notes().state.captureView,'down');
 touch(160,226,6800);assert.equal(notes().state.captureView,'down','pen buttons do not switch');
 touch(252,226,6900);assert.equal(notes().state.captureView,'double');
 touch(252,226,7000);assert.equal(notes().state.captureView,'up');
 const health=s.system.runtime.application;assert.ok(health);
 // Closing the applet and opening it again starts a fresh session at Double while the application stays suspended.
 s=reduceSystem(s,'home',7100);assert.equal(s.system.phase,'home');
 s=invokeSystemApplet(s,'game-notes',7200);assert.equal(s.system.runtime.application,health);
 touch(22,60,7300);assert.equal(notes().state.screen,'drawing');assert.equal(notes().state.captureView,undefined);
});
