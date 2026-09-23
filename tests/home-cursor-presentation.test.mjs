import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  createHomeCursorPresentation, consumeHomeCursorObservation, advanceHomeCursorPresentation,
  updateHomeCursorEffectPositions, sampleHomeCursorPresentation, getHomeToolbarCursorAnchor,
} from '../src/os/home-cursor-presentation.ts';

const oracle=JSON.parse(readFileSync(new URL('./fixtures/home-cursor-presentation.json',import.meta.url)));
const ordinary={primaryWrapperEligible:true,effectWrapperEligible:[true,true]};
const seek=frame=>({kind:'scale-seek',frame,updateOffset:null});
const toolbar=focus=>({kind:'cursor-select',source:'direction',slot:3,context:null,updateOffset:null,
  effectTarget:{kind:'toolbar',focus,scaleFrame:focus===0?10:focus>=6?12:11}});
const grid=(context=null)=>({kind:'cursor-select',source:'direction',slot:6,context,updateOffset:null,
  effectTarget:{kind:'grid',slot:3,scaleFrame:2,anchor:{x:106,y:70,scrollPixels:0}}});
const advance=(state,n,input=ordinary)=>advanceHomeCursorPresentation(state,n,input);
const apply=(state,observation)=>consumeHomeCursorObservation(state,observation);
const normalized=frame=>frame===-999?0:frame;
function compareScale(actual,expected){
  assert.deepEqual(actual,{currentFrame:expected.current,appliedFrame:normalized(expected.applied)});
  assert.equal(expected.state,1);assert.equal(expected.mode,5);
}
function compareEffect(actual,expected){
  assert.equal(actual.visible,!!expected.visible);
  if(actual.target){
    assert.deepEqual(actual.center,{x:160+expected.position[0],y:120-expected.position[1]});
    assert.equal(actual.target.kind==='grid'?actual.target.slot:-1,expected.slot);
  }else assert.equal(expected.visible,0); // Unused hidden center/slot are adapter state.
  compareScale(actual.scale,expected.scale);
  assert.deepEqual(actual.disappear,{currentFrame:expected.disappear.current,
    appliedFrame:normalized(expected.disappear.applied),status:expected.disappear.state});
}
function compareGate(state,name){
  const expected=oracle.gates.find(row=>row.name===name);assert.ok(expected,name);
  compareScale(state.primaryScale,expected.primary);
  state.effects.forEach((effect,i)=>compareEffect(effect,expected.effects[i]));
}

test('all8 native named-pane centers and Scale seeks preserve current/applied separation',()=>{
  for(const row of oracle.toolbar){
    const initial=createHomeCursorPresentation(2),state=apply(initial,seek(row.beforeUpdate.current));
    const anchor=getHomeToolbarCursorAnchor(row.focus);
    assert.deepEqual(anchor.center,{x:row.lcdCenter[0],y:row.lcdCenter[1]});assert.equal(anchor.pane,row.pane);
    assert.equal(anchor.scaleFrame,row.beforeUpdate.current);
    compareScale(state.primaryScale,row.beforeUpdate);
    compareScale(advance(state,1).primaryScale,row.afterUpdate);
    assert.equal(state.effects,initial.effects);assert.equal(state.nextEffectIndex,0);
  }
});
test('original two-effect modulo2 alternation and24-update DisAppear lifetime',()=>{
  let state=createHomeCursorPresentation(2);
  for(const [i,focus]of [0,3,6,7].entries()){
    state=apply(state,toolbar(focus));const expected=oracle.alternation[i];
    assert.equal(state.nextEffectIndex,expected.indexAfter);
    compareEffect(state.effects[0],expected.effect0);compareEffect(state.effects[1],expected.effect1);
  }
  for(const expected of oracle.lifecycle){state=advance(state,1);compareEffect(state.effects[0],expected);}
  assert.equal(state.effects.length,2);assert.equal(state.effects[0].visible,false);
});
test('reusing a visible effect seeks current while preserving its previously applied poses',()=>{
  let state=advance(apply(createHomeCursorPresentation(2),toolbar(0)),10);
  compareEffect(state.effects[0],oracle.restart.before);
  state=apply(apply(state,toolbar(3)),toolbar(7));
  compareEffect(state.effects[0],oracle.restart.afterStart);
  assert.equal(state.effects[0].disappear.appliedFrame,9);
  compareEffect(advance(state,1).effects[0],oracle.restart.afterUpdate);
});
test('original hidden and active-inhibited global passes preserve all effect controllers',()=>{
  let state=createHomeCursorPresentation(2);compareGate(state,'hidden-before');
  assert.equal(advance(state,7),state);compareGate(state,'hidden-after7');
  state=apply(createHomeCursorPresentation(2),toolbar(0));compareGate(state,'active-inhibited-before');
  const inhibited={...ordinary,effectControllersInhibited:[true,false]};
  assert.equal(advance(state,5,inhibited),state);compareGate(state,'active-inhibited-after5');
  compareGate(advance(state,1),'active-resumed');
});
test('terminal wrapper hides before inhibition; later hidden passes do not finish its controller',()=>{
  let state=advance(apply(createHomeCursorPresentation(2),toolbar(0)),21);
  compareGate(state,'terminal-before-inhibit');
  assert.equal(advance(state,7,{...ordinary,effectWrapperEligible:[false,true]}),state);
  state=advance(state,1,{...ordinary,effectControllersInhibited:[true,false]});compareGate(state,'terminal-hidden-inhibited');
  assert.equal(advance(state,3),state);compareGate(state,'terminal-stays-hidden');
  // The original fixture explicitly reuses E0; consume E1 first to preserve the public modulo2 API.
  state=apply(apply(state,toolbar(3)),toolbar(7));
  compareEffect(state.effects[0],oracle.gates.find(r=>r.name==='terminal-restarted').effects[0]);
  compareEffect(advance(state,1).effects[0],oracle.gates.find(r=>r.name==='terminal-restarted-update').effects[0]);
});
test('host-supplied hide pauses an unfinished effect and primary inhibition is independent',()=>{
  let state=advance(apply(createHomeCursorPresentation(2),toolbar(0)),5);compareGate(state,'running-before-hide');
  // Visibility lifecycle is host-owned; supply the native explicit-hide result.
  state=Object.freeze({...state,effects:Object.freeze([Object.freeze({...state.effects[0],visible:false}),state.effects[1]])});
  assert.equal(advance(state,7),state);compareGate(state,'running-hidden-after7');
  state=apply(apply(createHomeCursorPresentation(2),toolbar(6)),seek(11));compareGate(state,'primary-inhibited-before');
  state=advance(state,3,{...ordinary,primaryControllersInhibited:true});compareGate(state,'primary-inhibited-after3');
  compareGate(advance(state,1),'primary-resumed');
});
test('mode3 follows the original grid slot, retains toolbar position, and never seeks a controller',()=>{
  const initial=apply(apply(createHomeCursorPresentation(2),grid()),toolbar(6));
  const slots=Array.from({length:4},()=>({x:0,y:0}));slots[3]={x:264.5,y:58.75};
  const followed=updateHomeCursorEffectPositions(initial,{mode:3,context:null,scrollPixels:31.75,slots});
  assert.deepEqual(followed.unmatchedEffectIndices,[]);
  compareEffect(followed.state.effects[0],oracle.mode3Positions.gridEffect);
  compareEffect(followed.state.effects[1],oracle.mode3Positions.toolbarEffect);
  assert.equal(followed.state.primaryScale,initial.primaryScale);
  for(let i=0;i<2;i++){
    assert.equal(followed.state.effects[i].scale,initial.effects[i].scale);
    assert.equal(followed.state.effects[i].disappear,initial.effects[i].disappear);
  }
  assert.equal(updateHomeCursorEffectPositions(initial,{mode:0,context:null,scrollPixels:31.75,slots}).state,initial);
});
test('context mismatches are explicit and do not map an old grid slot into a replacement context',()=>{
  const initial=apply(apply(createHomeCursorPresentation(2),grid(40)),grid(41));
  const slots=Array.from({length:4},()=>({x:150,y:80}));
  const followed=updateHomeCursorEffectPositions(initial,{mode:3,context:40,scrollPixels:10,slots});
  assert.deepEqual(followed.unmatchedEffectIndices,[1]);assert.equal(followed.state.effects[1],initial.effects[1]);
  assert.deepEqual(followed.state.effects[0].center,{x:140,y:80});
  const neither=updateHomeCursorEffectPositions(initial,{mode:3,context:null,scrollPixels:10,slots});
  assert.equal(neither.state,initial);assert.deepEqual(neither.unmatchedEffectIndices,[0,1]);
});
test('batched and partitioned layouts agree for all lifetime boundaries and eligibility combinations',()=>{
  const initial=apply(apply(apply(createHomeCursorPresentation(2),grid()),toolbar(7)),seek(10));
  for(const primaryWrapperEligible of [false,true])for(const first of [false,true])for(const second of [false,true])
    for(const primaryControllersInhibited of [false,true])for(const inhibit0 of [false,true])for(const inhibit1 of [false,true]){
      const gates={primaryWrapperEligible,effectWrapperEligible:[first,second],primaryControllersInhibited,effectControllersInhibited:[inhibit0,inhibit1]};
      let scalar=initial;
      for(let n=0;n<=24;n++){
        assert.deepEqual(advance(initial,n,gates),scalar,`count${n}`);scalar=advance(scalar,1,gates);
      }
      let partitioned=initial;for(const n of [3,0,7,10,1,1,2])partitioned=advance(partitioned,n,gates);
      assert.deepEqual(partitioned,advance(initial,24,gates));
      assert.deepEqual(advance(initial,Number.MAX_SAFE_INTEGER,gates),advance(initial,100,gates));
    }
});
test('target copies and samples are deeply immutable; unrelated observations and zero updates are inert',()=>{
  const observation=grid(40),initial=createHomeCursorPresentation(2),state=apply(initial,observation);
  observation.effectTarget.anchor.x=999;observation.effectTarget.slot=50;
  assert.deepEqual(state.effects[0].center,{x:106,y:70});assert.equal(state.effects[0].target.slot,3);
  assert.notEqual(state.effects[0].target,observation.effectTarget);
  for(const value of [state,state.effects,state.effects[0],state.effects[0].target,state.effects[0].target.anchor,
    state.effects[0].center,state.effects[0].scale,state.effects[0].disappear,state.primaryScale])assert.ok(Object.isFrozen(value));
  for(let i=0;i<5;i++)assert.equal(sampleHomeCursorPresentation(state),state);
  assert.equal(advance(state,0),state);
  assert.equal(advance(state,100,{primaryWrapperEligible:false,effectWrapperEligible:[false,false]}),state);
  for(const kind of ['cue','mode3-entry','banner-resolve'])assert.equal(apply(state,{kind}),state);
  assert.deepEqual(initial.effects.map(e=>e.visible),[false,false]);
});
test('invalid external frames, targets, coordinates and counts are rejected at their boundary',()=>{
  const state=createHomeCursorPresentation(2);
  for(const value of [-1,16,NaN,Infinity]){
    assert.throws(()=>createHomeCursorPresentation(value),RangeError);assert.throws(()=>apply(state,seek(value)),RangeError);
  }
  for(const value of [-1,.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>advance(state,value),RangeError);
  for(const value of [-1,8,.5])assert.throws(()=>getHomeToolbarCursorAnchor(value),RangeError);
  assert.throws(()=>apply(state,{...toolbar(0),effectTarget:{kind:'toolbar',focus:0,scaleFrame:11}}),RangeError);
  assert.throws(()=>apply(state,{...grid(),context:-1}),RangeError);
  assert.throws(()=>apply(state,{...grid(),effectTarget:{...grid().effectTarget,anchor:{x:Infinity,y:0,scrollPixels:0}}}),RangeError);
  assert.throws(()=>advance(state,1,{...ordinary,effectWrapperEligible:[true]}),RangeError);
  assert.throws(()=>advance(state,1,{...ordinary,primaryWrapperEligible:1}),TypeError);
  for(const value of [null,'2',undefined])assert.throws(()=>createHomeCursorPresentation(value),TypeError);
  assert.throws(()=>advance(state,1,{...ordinary,primaryControllersInhibited:null}),TypeError);
  assert.throws(()=>advance(state,1,{...ordinary,effectControllersInhibited:null}),TypeError);
  const active=apply(state,grid());
  assert.throws(()=>updateHomeCursorEffectPositions(active,{mode:3,context:null,scrollPixels:0,slots:[]}),RangeError);
});
