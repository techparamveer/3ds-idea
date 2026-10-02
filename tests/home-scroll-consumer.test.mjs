import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHomeNavigation, activeHomeRecord, gridSnapshot, homeGridMetrics, getHomeNavigation, writeHomeNavigation,
  selectHomeSlot, setHomeDensity, settleHomeNavigation, enterHomeFolder, leaveHomeFolder, saveHomeView, restoreHomeView } from '../src/os/home-navigation.ts';
import { initialState } from '../src/os/state.ts';
import { createHomeCursorLoop, advanceHomeCursorLoop, setHomeCursorLoopStep } from '../src/os/home-cursor-loop.ts';
import { createHomeInputProducer, pollHomeInput } from '../src/os/home-input-producer.ts';
import { consumeHomeGridKeyEvent, advanceHomeScroll, enterHomeMode3, selectHomeTouchSlot, pageHomeViewport, restoreHomeRootViewport } from '../src/os/home-scroll-consumer.ts';

const oracle = JSON.parse(readFileSync(new URL('./fixtures/home-scroll-consumer.json', import.meta.url)));
const effectOracle = JSON.parse(readFileSync(new URL('./fixtures/home-scroll-observations.json', import.meta.url)));
const decoded = row => Array.isArray(row) ? Object.fromEntries(oracle.fields.map((key, i) => [key, row[i]])) : row;
const flags = value => (value[0] ? 0x20 : 0) | (value[1] ? 0x10 : 0);
function setup(folder = false, density = 0, values = {}) {
  const p = { selected: 2, left: 0, target: 0, mode: 0, counter: 0, elapsed: 0, duration: 10, step: 1, phase: 17.25,
    directionFlags: [0,0], pendingFlags: [0,0], toolbar: 0, focus: -1, previousFocus: -1, savedColumn: -1, ...decoded(values) };
  const nav = createHomeNavigation(density), view = { selectedSlot: p.selected, currentLeftSlot: p.left, targetLeftSlot: p.target, density };
  if (folder) { nav.activeFolderSlot = 40; nav.folderViews[40] = view; } else nav.rootView = view;
  nav.mode3 = Object.freeze({ entryCount: p.counter, directionMask: flags(p.directionFlags), pendingMask: flags(p.pendingFlags) });
  nav.focus = Object.freeze({ toolbarActive: !!p.toolbar, currentFocus: p.focus, rememberedFocus: p.previousFocus,
    savedColumn: p.savedColumn === 0xffffffff ? -1 : p.savedColumn });
  if (p.mode) nav.motion = { mode: p.mode, elapsedUpdates: p.elapsed, durationUpdates: p.duration || 10,
    currentDensity: density, targetDensity: density, fromGeometry: gridSnapshot(folder, density, p.left), targetGeometry: gridSnapshot(folder, density, p.target) };
  return Object.freeze({ navigation: nav, cursorLoop: Object.freeze({ currentFrame: p.phase, appliedFrame: p.phase, step: p.step }) });
}
function assertState(state, values, label = '') {
  const p = decoded(values), nav = state.navigation, view = activeHomeRecord(nav);
  const actual = { selected: view.selectedSlot, left: view.currentLeftSlot, target: view.targetLeftSlot, mode: nav.motion?.mode ?? 0,
    counter: nav.mode3.entryCount, step: state.cursorLoop.step, phase: state.cursorLoop.currentFrame,
    directionFlags: [Number(!!(nav.mode3.directionMask & 0x20)), Number(!!(nav.mode3.directionMask & 0x10))],
    pendingFlags: [Number(!!(nav.mode3.pendingMask & 0x20)), Number(!!(nav.mode3.pendingMask & 0x10))],
    toolbar: Number(nav.focus.toolbarActive), focus: nav.focus.currentFocus, previousFocus: nav.focus.rememberedFocus,
    savedColumn: nav.focus.savedColumn === -1 ? 0xffffffff : nav.focus.savedColumn };
  for (const [key, value] of Object.entries(actual)) if (p[key] !== undefined) assert.deepEqual(value, p[key], `${label} ${key}`);
  // Native inactive duration/elapsed fields are not needed by the geometry API.
  if (p.mode && p.duration > 0) {
    assert.equal(nav.motion.durationUpdates, p.duration, `${label} duration`);
    assert.equal(nav.motion.elapsedUpdates, p.elapsed, `${label} elapsed`);
  }
}
const cueIds = { selection: 0x100002c, invalid: 0x100002e, toolbar: 0x100003f };
const observations = result => result.observations.map(o => o.kind === 'cue' ? ['cue', cueIds[o.cue]]
  : o.kind === 'scale-seek' ? [o.kind, o.frame] : o.kind === 'cursor-select' ? [o.kind, o.slot] : [o.kind]);
const gates = { overlayActive: false, managerPresent: true, managerInhibited: false, sceneInhibited: false };
const expandResolvers = observations => observations.flatMap(o => o.kind === 'banner-resolve'
  ? Array.from({length:o.updateCount},(_,i)=>({...o,updateOffset:o.updateOffset+i,updateCount:1})) : [o]);

test('1,980 original ARM cardinal/diagonal/opposing cases preserve state and observation order', () => {
  assert.equal(oracle.directions.length, 1980);
  for (const [i, [folder,density,event,mask,before,after,expected]] of oracle.directions.entries()) {
    const initial = setup(folder,density,before), result = consumeHomeGridKeyEvent(initial,{type:event,mask});
    assert.equal(result.disposition, 'handled', `case${i}`); assertState(result.state,after,`case${i}`);
    assert.deepEqual(observations(result),expected,`case${i} observations`); assertState(initial,before);
    assert.ok(result.observations.every(o => o.updateOffset === null));
  }
});
test('144 native toolbar round trips and12 remembered-focus overrides', () => {
  for (const [folder,density,out,back,before,entered,restored,after,expected] of oracle.roundTrips) {
    let state = setup(folder,density,before); const seen=[];
    for (const [mask,target] of [[out,entered],[back,restored],[back^0xc0,after]]) {
      const result=consumeHomeGridKeyEvent(state,{type:4,mask});state=result.state;assertState(state,target);seen.push(...observations(result));
    }
    assert.deepEqual(seen,expected);
  }
  for (const [folder,density,event,mask,before,after,expected] of oracle.rememberedFocus) {
    const result=consumeHomeGridKeyEvent(setup(folder,density,before),{type:event,mask});assertState(result.state,after);assert.deepEqual(observations(result),expected);
  }
});
test('34 native direction departures and accepted grid touch preserve the departed effect target', () => {
  const check=(result,row)=>{
    const effect=result.observations.find(o=>o.kind==='cursor-select');
    assert.equal(effect.slot,row.newSlot);assert.equal(effect.context,null);
    assert.equal(effect.effectTarget.scaleFrame,row.effect.scaleFrame);
    if(row.oldFocus===-1){
      assert.equal(effect.effectTarget.kind,'grid');assert.equal(effect.effectTarget.slot,row.effect.slot);
      const p=effect.effectTarget.anchor;
      assert.deepEqual([p.x-p.scrollPixels-160,120-p.y],row.effect.position);
    }else{
      assert.equal(effect.effectTarget.kind,'toolbar');assert.equal(effect.effectTarget.focus,row.oldFocus);
      assert.equal(row.effect.slot,0xffffffff);
    }
    assert.ok(Object.isFrozen(effect.effectTarget));
  };
  for(const row of effectOracle.departures){
    const initial=setup(false,2,{selected:3,toolbar:Number(row.oldFocus!==-1),focus:row.oldFocus});
    const result=consumeHomeGridKeyEvent(initial,{type:4,mask:row.key});
    assert.equal(result.state.navigation.focus.currentFocus,row.newFocus);check(result,row);
    assert.equal(result.observations.at(-2).kind,'cue');assert.equal(result.observations.at(-1).kind,'cursor-select');
  }
  for(const row of effectOracle.touch)check(selectHomeTouchSlot(setup(false,2,{selected:3}),row.newSlot),row);
});
test('70 native gate cases and busy diagonal inertness', () => {
  const changes={overlay:{overlayActive:true},'missing-manager':{managerPresent:false},'manager-inhibit':{managerInhibited:true},'scene-inhibit':{sceneInhibited:true},'busy-mode3':{}};
  for (const [gate,type,mask,before,after] of oracle.gates) {
    const result=consumeHomeGridKeyEvent(setup(false,2,before),{type,mask},{...gates,...changes[gate]});assertState(result.state,after);assert.deepEqual(result.observations,[]);
  }
});
test('native mode3 entry threshold and same-mode re-entry preserve both cursor phases', () => {
  let state=setup();
  for (const expected of oracle.entries) {
    const before=state.cursorLoop,result=enterHomeMode3(state,0);state=result.state;assertState(state,expected);
    assert.equal(state.cursorLoop.currentFrame,before.currentFrame);assert.equal(state.cursorLoop.appliedFrame,before.appliedFrame);
    assert.deepEqual(result.observations.map(o=>o.kind),['mode3-entry']);
  }
});
test('busy single-axis inputs coalesce while held5 never selects', () => {
  for (const expected of oracle.busy) {
    const initial=setup(false,0,{mode:3,counter:3});let state=initial;
    for(let i=0;i<3;i++){const result=consumeHomeGridKeyEvent(state,{type:expected.event,mask:Number(expected.key)});state=result.state;assert.deepEqual(result.observations,[]);}
    assertState(state,expected);assert.equal(state.navigation.motion,initial.navigation.motion);
  }
  for (const expected of oracle.held) {
    let state=setup(false,0,{mode:expected.mode,counter:4});
    for(let i=0;i<expected.calls;i++)state=consumeHomeGridKeyEvent(state,{type:5,mask:Number(expected.key)}).state;
    assertState(state,expected);
  }
});
test('native completion replay coalesces and clears markers after the replay callback', () => {
  for (const expected of oracle.queue) {
    let state=setup(false,0,{selected:expected.initiating===16?2:3,left:expected.initiating===16?0:3,target:expected.initiating===16?0:3,counter:4});
    state=consumeHomeGridKeyEvent(state,{type:4,mask:expected.initiating}).state;
    if(expected.pending)for(let i=0;i<3;i++)state=consumeHomeGridKeyEvent(state,{type:6,mask:expected.pending}).state;
    if(expected.releaseBeforeCompletion)state=consumeHomeGridKeyEvent(state,{type:7,mask:expected.initiating}).state;
    assertState(state,expected.before);const result=advanceHomeScroll(state,10);assertState(result.state,expected.after);
    assert.ok(result.observations.every(o=>o.updateOffset===9));
    assert.equal(result.observations.filter(o=>o.kind==='cue').length,Number(expected.pending===expected.initiating&&!expected.releaseBeforeCompletion));
  }
});
test('source event7 preserves in-flight duration, elapsed, phase and initiating markers', () => {
  for(const expected of oracle.release){
    const initial=setup(false,0,{mode:3,counter:5,step:3,duration:5,elapsed:2,pendingFlags:[1,1]});
    const result=consumeHomeGridKeyEvent(initial,{type:7,mask:Number(expected.mask)});assertState(result.state,expected);
    assert.equal(result.state.navigation.motion,initial.navigation.motion);assert.equal(result.state.cursorLoop.appliedFrame,initial.cursorLoop.appliedFrame);
    assert.deepEqual(result.observations,[]);
  }
  const initial=setup(false,0,{mode:3,counter:5,step:3,duration:5,elapsed:2,directionFlags:[1,1],pendingFlags:[1,1]});
  assert.equal(consumeHomeGridKeyEvent(initial,{type:7,mask:16}).state.navigation.mode3.directionMask,0x30);
});
test('36 native absolute touch selections enter mode3 with no new direction marker', () => {
  for(const row of oracle.touch){
    const expected=decoded(row.after),initial=setup(row.folder,row.density,{...expected,selected:expected.selected+1,mode:0,duration:0,step:1});
    const result=selectHomeTouchSlot(initial,expected.selected);assertState(result.state,row.after);
    assert.equal(result.observations[0].kind,'cursor-select');
    assert.equal(result.state.navigation.mode3.directionMask,0);
  }
  for(const row of oracle.touchOrder){
    const result=selectHomeTouchSlot(setup(false,0,row.before),row.slot);assertState(result.state,row.after);
    assert.deepEqual(result.observations.map(o=>o.kind),row.order);
  }
});
test('94 native page-arrow boundary cases preserve mode2/16 and never increment acceleration', () => {
  for(const [i,row]of oracle.pages.entries()){
    const result=pageHomeViewport(setup(row.folder,row.density,row.before),row.side,1);assertState(result.state,row.after,`page${i}`);
    assert.deepEqual(result.observations,[]);
  }
});
test('captured60 root exposure pages to the five-row endpoint and closes at six rows',()=>{
 let six=setup(false,5,{selected:33,left:0,target:0});
 let result=pageHomeViewport({...six,extent:60},'right',1);
 assert.equal(result.state.navigation,six.navigation);assert.equal(result.state.navigation.motion,null);
 const five=setup(false,4,{selected:33,left:10,target:10});
 result=pageHomeViewport({...five,extent:60},'right',1);
 assertState(result.state,{selected:38,left:10,target:15,mode:2,duration:16,elapsed:0});
 const endpoint=setup(false,4,{selected:38,left:15,target:15});
 result=pageHomeViewport({...endpoint,extent:60},'right',1);
 assert.equal(result.state.navigation,endpoint.navigation);
 result=pageHomeViewport({...endpoint,extent:60},'left',1);
 assertState(result.state,{selected:23,left:15,target:0,mode:2,duration:16,elapsed:0});
});
test('captured60 root exposure clamps keyboard navigation at slot59 without growing storage',()=>{
 let state=setup(false,5,{selected:59,left:0,target:0});
 let result=consumeHomeGridKeyEvent({...state,extent:60},{type:4,mask:0x20});
 assertState(result.state,{selected:53,left:0,target:0,mode:0});
 result=consumeHomeGridKeyEvent({...result.state,extent:60},{type:4,mask:0x10});
 assertState(result.state,{selected:59,left:0,target:0,mode:0});
 result=consumeHomeGridKeyEvent({...result.state,extent:60},{type:4,mask:0x10});
 assertState(result.state,{selected:59,left:0,target:0,mode:0});
 assert.equal(result.observations.some(o=>o.kind==='cursor-select'),false);
 assert.equal(result.observations.some(o=>o.kind==='cue'&&o.cue==='invalid'),true);
 assert.equal(result.state.navigation.rootView.selectedSlot,59);
});
test('native root-return correction moves one column; far-history repair is explicit', () => {
  for(const row of oracle.folderReturn){const result=restoreHomeRootViewport(setup(false,0,{selected:row.selected,left:row.left,target:row.left,counter:5}));assertState(result.state,row.after);}
  const far=setup(false,0,{selected:100});
  assert.equal(restoreHomeRootViewport(far).state.navigation.rootView.targetLeftSlot,1);
  assert.equal(restoreHomeRootViewport(far,{repairFarHistory:true}).state.navigation.rootView.targetLeftSlot,98);
});
test('both78-poll native schedules preserve source state and cue requests', () => {
  for(const schedule of oracle.timelines){
    let state=setup(),producer=createHomeInputProducer();
    for(const row of schedule.rows){
      const poll=row.poll,produced=pollHomeInput(producer,{held:poll>=1&&poll<=76?16:0,pressed:poll===1?16:0,released:poll===77?16:0,
        touchActive:false,captureActive:false,hostFlags:0,gateWord14:0,readiness10dc20:true,readiness10cd20:true});producer=produced.state;
      assert.deepEqual(produced.events,row.inputs);const seen=[];
      for(const event of produced.events){const result=consumeHomeGridKeyEvent(state,event);state=result.state;seen.push(...observations(result));}
      assertState(state,row.afterInput,`poll${poll} input`);
      const result=advanceHomeScroll(state,schedule.sceneUpdates);state=result.state;seen.push(...observations(result));assertState(state,row.afterTicks,`poll${poll} lower`);
      assert.deepEqual(seen.filter(o=>o[0]==='cue').map(o=>o[1]),row.cues,`poll${poll} cues`);
    }
  }
});
test('partitioned scene updates preserve replay observation offsets without advancing Loop phase', () => {
  let initial=consumeHomeGridKeyEvent(setup(false,0,{counter:4}),{type:4,mask:16}).state;
  initial=consumeHomeGridKeyEvent(initial,{type:6,mask:16}).state;
  const batch=advanceHomeScroll(initial,40);let state=initial,offset=0;const seen=[];
  for(const n of [2,0,8,4,6,20]){const result=advanceHomeScroll(state,n);state=result.state;seen.push(...result.observations.map(o=>({...o,updateOffset:o.updateOffset+offset})));offset+=n;}
  assert.deepEqual(state,batch.state);assert.deepEqual(expandResolvers(seen),expandResolvers(batch.observations));assert.equal(state.cursorLoop.currentFrame,initial.cursorLoop.currentFrame);
  assert.deepEqual(advanceHomeScroll(state,0).observations,[]);
  assert.deepEqual(advanceHomeScroll(state,100).observations.map(o=>[o.kind,o.updateOffset,o.updateCount]),[['banner-resolve',0,100]]);
});
test('lower resolver attempts precede pending replay and preserve every unchanged idle update', () => {
  const initial=setup(false,0,{counter:4});
  const input=consumeHomeGridKeyEvent(initial,{type:4,mask:16});
  assert.equal(input.observations.some(o=>o.kind==='banner-resolve'),false);
  const busy=consumeHomeGridKeyEvent(input.state,{type:6,mask:16});
  const batch=advanceHomeScroll(busy.state,20);
  assert.deepEqual(batch.observations.map(o=>[o.kind,o.slot??null,o.updateOffset,o.updateCount??null]),[
    ['banner-resolve',3,9,1],['mode3-entry',null,9,null],['cue',4,9,null],['cursor-select',4,9,null],
    ['banner-resolve',4,14,1],['banner-resolve',4,15,5],
  ]);
  const effects=batch.observations.filter(o=>o.kind==='cursor-select');
  assert.equal(effects[0].effectTarget.slot,3);assert.equal(effects[0].effectTarget.anchor.scrollPixels,84);
  const inView=consumeHomeGridKeyEvent(setup(false,0,{selected:0}),{type:4,mask:16});
  assert.deepEqual(advanceHomeScroll(inView.state,3).observations.map(o=>[o.reason,o.slot,o.updateOffset,o.updateCount]),[['idle-update',1,0,3]]);
  assert.deepEqual(advanceHomeScroll(inView.state,3,{idleOverlayActive:true}).observations,[]);
  const huge=advanceHomeScroll(inView.state,Number.MAX_SAFE_INTEGER);
  assert.equal(huge.observations.length,1);assert.equal(huge.observations[0].updateCount,Number.MAX_SAFE_INTEGER);
});
test('mode3 completion resolves under overlay while the replay callback stays gated', () => {
  const initial = setup(false,0,{selected:3,left:0,target:1,mode:3,elapsed:9,duration:10,counter:5,
    directionFlags:[0,1],pendingFlags:[0,1]});
  const gated = advanceHomeScroll(initial,1,{idleOverlayActive:true});
  assert.equal(gated.disposition,'handled');
  assertState(gated.state,{selected:3,left:1,target:1,mode:0,counter:5,directionFlags:[0,0],pendingFlags:[0,0]});
  assert.deepEqual(gated.observations.map(o=>[o.kind,o.slot,o.updateOffset,o.updateCount]),[['banner-resolve',3,0,1]]);
  const ordinary = advanceHomeScroll(initial,1);
  assertState(ordinary.state,{selected:4,left:1,target:2,mode:3,elapsed:0,duration:5,counter:5,
    directionFlags:[0,0],pendingFlags:[0,0]});
  assert.deepEqual(ordinary.observations.map(o=>o.kind),['banner-resolve','mode3-entry','cue','cursor-select']);
  assert.equal(ordinary.observations[0].slot,3);
});

test('32 original ARM resolver scenarios preserve host offsets, focus, completion and overlay boundaries', () => {
  const banner=result=>expandResolvers(result.observations).filter(o=>o.kind==='banner-resolve');
  const check=(seen,row)=>assert.deepEqual(seen.map(o=>[o.reason,o.updateOffset,o.context,o.slot,o.focus,o.toolbarActive]),
    row.resolvers.map(o=>[o.caller==='0x296468'?'idle-update':'idle-entry',o.pass,o.folder===-1?null:o.folder,o.selected,o.focus,o.toolbarActive]),row.kind??row.gate);
  const shifted=(result,offset)=>banner(result).map(o=>({...o,updateOffset:(o.updateOffset??0)+offset}));
  for(const row of effectOracle.bannerScenarios){
    let state=setup(row.folder>=0,0,{selected:row.kind==='deferred-replay'?2:row.kind==='direction'?row.selected:0,counter:5});
    if(row.folder>=0)state={...state,navigation:{...state.navigation,activeFolderSlot:row.folder,folderViews:{[row.folder]:activeHomeRecord(state.navigation)}}};
    if(row.kind==='vacancy-dedup'){
      const first=advanceHomeScroll(state,2);state=consumeHomeGridKeyEvent(first.state,{type:6,mask:16}).state;
      check([...banner(first),...shifted(advanceHomeScroll(state,1),2)],row);continue;
    }
    const input=row.kind==='touch-tile'?selectHomeTouchSlot(state,row.selected):consumeHomeGridKeyEvent(state,{type:row.event??4,mask:16});
    assert.deepEqual(banner(input),[]);state=input.state;
    if(row.kind==='deferred-replay')state=consumeHomeGridKeyEvent(state,{type:6,mask:16}).state;
    const result=advanceHomeScroll(state,row.final.hostPasses);check(banner(result),row);
    assert.equal(activeHomeRecord(result.state.navigation).selectedSlot,row.final.selected);
    assert.equal(result.state.navigation.motion?.mode??0,row.final.mode);
  }
  for(const row of effectOracle.bannerTransitions){
    if(row.kind==='root-ready'){
      const entry=restoreHomeRootViewport(setup(false,0,{selected:row.restoredSlot,left:row.restoredLeft,target:row.restoredLeft,counter:5}));
      check([...shifted(entry,0),...shifted(advanceHomeScroll(entry.state,row.final.hostPasses-1),1)],row);
    }else if(row.kind==='motion-completion'){
      const initial=setup(false,0,{selected:1,mode:row.initialMode,elapsed:row.initialElapsed,duration:10,counter:5});
      const result=advanceHomeScroll(initial,1);check(banner(result),row);
      assert.equal(result.state.navigation.motion?.mode??0,row.final.mode);
      assert.equal(advanceHomeScroll(initial,1,{idleOverlayActive:true}).disposition,'unsupported');
    }else{
      // Source executes the idle-entry body with overlay present directly.
      const initial=setup(false,0,{selected:1,mode:3,elapsed:9,duration:10,counter:5});
      check(banner(advanceHomeScroll(initial,1,{idleOverlayActive:true})),row);
    }
  }
  for(const row of effectOracle.bannerToolbar)check(banner(advanceHomeScroll(setup(false,0,{selected:1,focus:row.focus,toolbar:1}),1)),row);
  for(const row of effectOracle.bannerGates)check(banner(advanceHomeScroll(setup(false,0,{selected:1}),1,{idleOverlayActive:row.gate==='idle-overlay'})),row);
});
test('Loop step3 matches original submitted frames and fractional updates', () => {
  let loop=Object.freeze({currentFrame:58,appliedFrame:0,step:3});
  for(const expected of oracle.loopFast){loop=advanceHomeCursorLoop(loop,1,true);assert.deepEqual(loop,{currentFrame:expected.current,appliedFrame:expected.submitted,step:expected.step});}
  for(const expected of oracle.loopFractional.filter(r=>r.step===1||r.step===3)){
    const next=advanceHomeCursorLoop({currentFrame:expected.phase,appliedFrame:0,step:expected.step},1,true);
    assert.deepEqual(next,{currentFrame:expected.current,appliedFrame:expected.submitted,step:expected.step});
  }
  for(const step of [1,3])for(const phase of [0,17.25,58.5,Math.fround(1/3)]){
    const initial={currentFrame:phase,appliedFrame:phase,step};let scalar=initial;
    for(let i=0;i<241;i++)scalar=advanceHomeCursorLoop(scalar,1,true);
    assert.deepEqual(advanceHomeCursorLoop(initial,241,true),scalar);
    const a=advanceHomeCursorLoop(initial,Number.MAX_SAFE_INTEGER-100,true),b=advanceHomeCursorLoop(a,100,true);
    assert.deepEqual(advanceHomeCursorLoop(initial,Number.MAX_SAFE_INTEGER,true),b);
  }
  const initial=advanceHomeCursorLoop(createHomeCursorLoop(),17,true),fast=setHomeCursorLoopStep(initial,3);
  assert.deepEqual([fast.currentFrame,fast.appliedFrame],[initial.currentFrame,initial.appliedFrame]);assert.equal(setHomeCursorLoopStep(fast,3),fast);
});
test('unsupported routes and invalid counts stay explicit; zero updates never duplicate effects', () => {
  const initial=setup();assert.equal(consumeHomeGridKeyEvent(initial,{type:4,mask:1}).disposition,'unsupported');
  assert.equal(pageHomeViewport(initial,'right',0).disposition,'unsupported');
  for(const value of [-1,.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>advanceHomeScroll(initial,value),RangeError);
  for(const step of [0,.5,2,4,NaN])assert.throws(()=>setHomeCursorLoopStep(initial.cursorLoop,step),RangeError);
  assert.deepEqual(advanceHomeScroll(initial,0).observations,[]);
});
test('scene-local acceleration and focus survive compatibility view changes but never persist', () => {
  const native=setup(false,0,{counter:5,directionFlags:[1,0],pendingFlags:[0,1],previousFocus:3});
  const {mode3,focus}=native.navigation;
  let state=writeHomeNavigation({...initialState,folders:{40:'Folder'}},native.navigation);
  for(const change of [s=>selectHomeSlot(s,8),s=>setHomeDensity(s,2),s=>enterHomeFolder(s,40),
    s=>setHomeDensity(s,5),leaveHomeFolder]){
    state=settleHomeNavigation(change(state));
    assert.equal(getHomeNavigation(state).mode3,mode3);assert.equal(getHomeNavigation(state).focus,focus);
  }
  const saved=saveHomeView(state);
  assert.deepEqual(Object.keys(saved).sort(),['activeFolderSlot','folderViews','rootView']);
  for(const view of [saved.rootView,...Object.values(saved.folderViews)])
    assert.deepEqual(Object.keys(view).sort(),['currentLeftSlot','density','selectedSlot','targetLeftSlot']);
  const restored=getHomeNavigation(restoreHomeView(state,saved,0)),fresh=createHomeNavigation();
  assert.deepEqual(restored.mode3,fresh.mode3);assert.deepEqual(restored.focus,fresh.focus);
});
