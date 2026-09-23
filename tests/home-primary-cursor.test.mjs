import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHomePrimaryCursor,setHomePrimaryCursorRequest,updateHomePrimaryCursorFooter,sampleHomePrimaryCursor} from '../src/os/home-primary-cursor.ts';
import {advanceHomeCursorLoop} from '../src/os/home-cursor-loop.ts';

const oracle=JSON.parse(readFileSync(new URL('./fixtures/home-primary-cursor.json',import.meta.url)));
const lcd=position=>({x:160+position[0],y:120-position[1]});
const create=row=>createHomePrimaryCursor({request:row.request,shown:!!row.shown,layoutVisible:!!row.visible,center:lcd(row.position)});
const ordinary=position=>({overlayActive:false,secondaryOverlayActive:false,mode:0,position});
const geometry=row=>({overlayActive:row.overlay,secondaryOverlayActive:false,mode:row.mode,
  position:{kind:'grid',selectedCenter:lcd([row.selectedGrid[0]-row.scroll,row.selectedGrid[1]])}});
function compareState(actual,row){assert.deepEqual(actual,{request:row.request,shown:!!row.shown,layoutVisible:!!row.visible,center:lcd(row.position)});}
function compareCalls(result,expected){
  assert.equal(result.positionRoute!==null,expected.positionHelper);
  assert.equal(result.positionRoute==='grid'||result.positionRoute==='toolbar',expected.positionWritten);
  assert.deepEqual(result.visibilityWrite===null?[]:[result.visibilityWrite],expected.visibilityWrites);
}

test('four native entry-through-completion sequences retain the mode3 root and expose actual layout eligibility',()=>{
  for(const sequence of oracle.entries){
    let state=create(sequence.before);
    state=setHomePrimaryCursorRequest(state,sequence.afterInput.request);compareState(state,sequence.afterInput);
    let loop={currentFrame:sequence.afterInput.loopCurrent,appliedFrame:sequence.afterInput.loopSubmitted,step:sequence.afterInput.loopStep};
    for(const row of sequence.rows){
      const result=updateHomePrimaryCursorFooter(state,geometry(row));state=result.state;
      compareState(state,row);compareCalls(result,row.calls);
      assert.equal(result.positionRoute,row.mode===3?'mode3-effects':'grid');
      // Composition test only: the footer itself neither owns nor advances Loop.
      loop=advanceHomeCursorLoop(loop,1,state.layoutVisible);
      assert.deepEqual(loop,{currentFrame:row.loopCurrent,appliedFrame:row.loopSubmitted,step:row.loopStep});
    }
  }
});
test('eight native completion boundaries run the footer after replay and preserve overlay-pending requests',()=>{
  for(const row of oracle.completions){
    const initial=create(row.before),requested=setHomePrimaryCursorRequest(initial,row.idleBeforeReplay.request);
    const result=updateHomePrimaryCursorFooter(requested,geometry(row.final));
    compareState(result.state,row.final);compareCalls(result,row.calls);
    assert.equal(result.positionRoute,row.overlayAtCompletion?null:row.pendingReplay?'mode3-effects':'grid');
    const beforeLoop={currentFrame:row.before.loopCurrent,appliedFrame:row.before.loopSubmitted,step:row.before.loopStep};
    const afterLoop=advanceHomeCursorLoop(beforeLoop,1,result.state.layoutVisible);
    assert.deepEqual(afterLoop,{currentFrame:row.final.loopCurrent,appliedFrame:row.final.loopSubmitted,step:row.final.loopStep});
    if(row.overlayAtCompletion){assert.equal(result.state,requested);assert.equal(result.state.request,0);}
    if(row.pendingReplay&&!row.overlayAtCompletion){
      assert.equal(row.idleBeforeReplay.mode,0);assert.equal(row.final.mode,3);
      assert.equal(row.idleBeforeReplay.selected,3);assert.equal(row.final.selected,4);
    }
  }
});
test('84 direct native footer cases preserve independent shown/actual flags and exact helper branches',()=>{
  for(const row of oracle.footer){
    const initial=create(row.before),input={overlayActive:row.overlay,secondaryOverlayActive:row.secondaryOverlay,mode:row.mode,
      position:row.focus===-1?{kind:'grid',selectedCenter:lcd([row.selectedGrid[0]-row.scroll,row.selectedGrid[1]])}:{kind:'toolbar',focus:row.focus}};
    const result=updateHomePrimaryCursorFooter(initial,input);compareState(result.state,row.after);
    const helper=row.trace.some(e=>e.kind==='position-helper');
    assert.equal(result.positionRoute,helper?(row.focus!==-1?'toolbar':row.mode===3?'mode3-effects':'grid'):null);
    assert.deepEqual(result.visibilityWrite===null?[]:[Number(result.visibilityWrite)],row.trace.filter(e=>e.kind==='visibility-write').map(e=>e.value));
    assert.deepEqual(row.before.loop,row.after.loop);assert.deepEqual(row.before.scale,row.after.scale);
    compareState(initial,row.before);
  }
});
test('prior native request0/1/2 visibility matrix and all8 toolbar anchors remain exact',()=>{
  for(const row of oracle.visibility){
    const initial=createHomePrimaryCursor({request:row.request,shown:!!row.previous,layoutVisible:!!row.previous,center:{x:9,y:10}});
    const position=row.focus===-1?{kind:'grid',selectedCenter:{x:106,y:70}}:{kind:'toolbar',focus:row.focus};
    const result=updateHomePrimaryCursorFooter(initial,ordinary(position));assert.equal(result.state.layoutVisible,!!row.visible);
    if(row.request!==0){assert.equal(result.positionRoute,null);assert.equal(result.state.center,initial.center);}
  }
  for(const row of oracle.toolbar){
    const state=createHomePrimaryCursor({request:0,shown:true,layoutVisible:true,center:{x:0,y:0}});
    const result=updateHomePrimaryCursorFooter(state,{...ordinary({kind:'toolbar',focus:row.focus}),mode:3});
    assert.equal(result.positionRoute,'toolbar');assert.deepEqual(result.state.center,{x:row.lcdCenter[0],y:row.lcdCenter[1]});
  }
});
test('request setters and sampling never normalize flags, move the cursor or accumulate hidden time',()=>{
  const center={x:10.25,y:20.5},initial=createHomePrimaryCursor({request:2,shown:true,layoutVisible:false,center});
  center.x=500;assert.equal(initial.center.x,10.25);
  const requested=setHomePrimaryCursorRequest(initial,0);
  assert.equal(requested.shown,true);assert.equal(requested.layoutVisible,false);assert.equal(requested.center,initial.center);
  assert.equal(setHomePrimaryCursorRequest(requested,0),requested);
  const input={...ordinary({kind:'grid',selectedCenter:{x:200,y:100}}),overlayActive:true};
  for(let i=0;i<100;i++){
    assert.equal(sampleHomePrimaryCursor(requested),requested);
    const result=updateHomePrimaryCursorFooter(requested,input);
    assert.equal(result.state,requested);assert.equal(result.positionRoute,null);assert.equal(result.visibilityWrite,null);
  }
  for(const value of [initial,initial.center,requested,updateHomePrimaryCursorFooter(requested,input)])assert.ok(Object.isFrozen(value));
});
test('position-route metadata survives equal coordinates and no viewport culling is introduced',()=>{
  const state=createHomePrimaryCursor({request:0,shown:true,layoutVisible:true,center:{x:106,y:70}});
  const same=updateHomePrimaryCursorFooter(state,ordinary({kind:'grid',selectedCenter:{x:106,y:70}}));
  assert.equal(same.state,state);assert.equal(same.positionRoute,'grid');
  const outside=updateHomePrimaryCursorFooter(state,ordinary({kind:'grid',selectedCenter:{x:-500.125,y:777.75}}));
  assert.equal(outside.state.layoutVisible,true);assert.deepEqual(outside.state.center,{x:-500.125,y:777.75});
  const input={...ordinary({kind:'grid',get selectedCenter(){throw Error('unread grid geometry');}}),mode:3};
  const held=updateHomePrimaryCursorFooter(state,input);assert.equal(held.state,state);assert.equal(held.positionRoute,'mode3-effects');
});
test('unused position data is not read by skipped footer or request1/2 branches',()=>{
  const input={overlayActive:false,secondaryOverlayActive:false,mode:0,get position(){throw Error('unexpected position read');}};
  for(const request of [1,2]){
    const state=createHomePrimaryCursor({request,shown:true,layoutVisible:true,center:{x:1,y:2}});
    assert.equal(updateHomePrimaryCursorFooter(state,input).positionRoute,null);
  }
  const state=createHomePrimaryCursor({request:0,shown:false,layoutVisible:false,center:{x:1,y:2}});
  for(const change of [{overlayActive:true},{secondaryOverlayActive:true},{mode:185},{mode:186}])
    assert.equal(updateHomePrimaryCursorFooter(state,{overlayActive:false,secondaryOverlayActive:false,mode:0,...change,
      get position(){throw Error('unexpected position read');}}).state,state);
});
test('invalid explicit initialization, requests, gate flags, modes and used geometry are rejected',()=>{
  const initial={request:0,shown:true,layoutVisible:false,center:{x:10,y:20}},state=createHomePrimaryCursor(initial);
  for(const request of [-1,3,.5,NaN,undefined,null]){
    assert.throws(()=>createHomePrimaryCursor({...initial,request}),RangeError);
    assert.throws(()=>setHomePrimaryCursorRequest(state,request),RangeError);
  }
  assert.throws(()=>createHomePrimaryCursor({...initial,shown:1}),TypeError);
  assert.throws(()=>createHomePrimaryCursor({...initial,layoutVisible:null}),TypeError);
  assert.throws(()=>createHomePrimaryCursor({...initial,center:{x:Infinity,y:20}}),RangeError);
  const input=ordinary({kind:'grid',selectedCenter:{x:1,y:2}});
  for(const mode of [-1,256,.5,NaN])assert.throws(()=>updateHomePrimaryCursorFooter(state,{...input,mode}),RangeError);
  assert.throws(()=>updateHomePrimaryCursorFooter(state,{...input,overlayActive:0}),TypeError);
  assert.throws(()=>updateHomePrimaryCursorFooter(state,ordinary({kind:'toolbar',focus:8})),RangeError);
  assert.throws(()=>updateHomePrimaryCursorFooter(state,ordinary({kind:'grid',selectedCenter:{x:NaN,y:0}})),RangeError);
});
