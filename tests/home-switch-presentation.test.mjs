import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortfolioState,tickSystem,launchHomeShortcut,reduceSystem,tickHomeNavigationClockObserved,dispatchSystemEvent,setSystemSleeping} from '../src/os/system.ts';
import {enableHomeControls,isHomeControlsActive,isHomeSwitchPresentationActive} from '../src/os/home-controls.ts';
import {createHomeBannerHost,crossHomeBannerBoundary,getHomeBannerHostView} from '../src/os/home-banner-host.ts';

function switching(){
 const home=enableHomeControls(tickSystem(createPortfolioState(),3001));
 const health=reduceSystem(tickSystem(launchHomeShortcut(home,'health-safety',3310),6500),'home',6600);
 return launchHomeShortcut(health,'camera',6700);
}

test('switch presentation advances the shared clock without executing HOME controls or changing selection',()=>{
 let state=switching();assert.equal(isHomeControlsActive(state),false);assert.equal(isHomeSwitchPresentationActive(state),true);
 state=tickHomeNavigationClockObserved(state,6800).state;
 const start=state.system.homeClock.updateCount,controls=state.system.homeControls,nav=state.system.homeNavigation,cursor=state.system.homeCursorLoop;
 const tick=tickHomeNavigationClockObserved(state,7300);state=tick.state;
 assert.equal(state.system.homeClock.updateCount,start+30);assert.deepEqual(tick.passes,[]);
 assert.equal(state.system.homeControls,controls);assert.equal(state.system.homeNavigation,nav);assert.equal(state.system.homeCursorLoop,cursor);
 const selected=state.selected;
 state=dispatchSystemEvent(state,{type:'button',source:'keyboard:ArrowRight',phase:'down',command:'right'},7350);
 assert.equal(state.selected,selected);assert.equal(state.system.dialog,'switch');assert.equal(state.system.pending,'camera');
 state=dispatchSystemEvent(state,{type:'touch',phase:'tap',pointerId:1,x:280,y:120},7360);
 assert.equal(state.selected,selected);assert.equal(state.system.dialog,'switch');
});

test('existing banner host replaces stale Health with pending Camera and keeps its clips moving in a switch',()=>{
 let state=switching();
 const clock=()=>({generation:'switch-test',updateCount:state.system.homeClock.updateCount});
 const inputs={managerInhibited:false,sceneInhibited:false,loadInhibited:false,nativeWorkerReady:true,resourceReady:null};
 let host=crossHomeBannerBoundary(createHomeBannerHost(clock(),inputs),clock(),{selection:{kind:'app',id:'health-safety'}});
 const advance=now=>{state=tickHomeNavigationClockObserved(state,now).state;host=crossHomeBannerBoundary(host,clock());};
 host=crossHomeBannerBoundary(host,clock(),{inputs:{...inputs,resourceReady:getHomeBannerHostView(host).resourceTicket}});
 advance(6800);advance(7300);
 assert.equal(getHomeBannerHostView(host).primary.selection.id,'health-safety');
 host=crossHomeBannerBoundary(host,clock(),{selection:{kind:'app',id:state.system.pending}});
 host=crossHomeBannerBoundary(host,clock(),{inputs:{...inputs,resourceReady:getHomeBannerHostView(host).resourceTicket}});
 advance(8300);advance(9300);
 const before=getHomeBannerHostView(host);assert.equal(before.primary.selection.id,'camera');
 advance(9400);const after=getHomeBannerHostView(host);
 assert.notDeepEqual(after.primary.motion,before.primary.motion);
 assert.equal(state.system.dialog,'switch');
});

test('sleep, close, power, preferences and panels do not inherit the switch clock exception',()=>{
 for(const mutate of [s=>setSystemSleeping(s,true,6750),s=>({...s,system:{...s.system,dialog:'close'}}),s=>({...s,system:{...s.system,phase:'power'}}),s=>({...s,system:{...s.system,preferences:true}}),s=>({...s,panel:'settings'}),s=>({...s,powered:false})]){
  const state=mutate(switching()),start=state.system.homeClock.updateCount;
  assert.equal(isHomeSwitchPresentationActive(state),false);
  const next=tickHomeNavigationClockObserved(state,9000);assert.equal(next.state.system.homeClock.updateCount,start);assert.deepEqual(next.passes,[]);
 }
});
