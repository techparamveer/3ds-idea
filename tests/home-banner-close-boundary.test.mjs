import test from 'node:test';
import assert from 'node:assert/strict';
import { createPortfolioState, tickSystem, tickHomeNavigationClock, reduceSystem, restoreSettings, saveSettings, launchHomeShortcut } from '../src/os/system.ts';
import { reduceMenu } from '../src/os/state.ts';
import { enterHomeFolder, selectHomeSlot, writeHomeNavigation, getHomeNavigation } from '../src/os/home-navigation.ts';
import { createHomeBannerHost, crossHomeBannerBoundary, getHomeBannerHostView, resolveHomeBannerHostSelection, getHomeBannerCloseReadyUpdate, homeApplicationBannerBoundary } from '../src/os/home-banner-host.ts';

const T=4000,F=1000/60;
const at=(host,count,boundary={})=>crossHomeBannerBoundary(host,{...host.clock,updateCount:count},boundary);
function select(host,state,count=state.system.homeClock.updateCount){
 host=at(host,count,{selection:resolveHomeBannerHostSelection(state)});
 return at(host,count,{inputs:{...host.inputs,resourceReady:getHomeBannerHostView(host).resourceTicket}});
}
function setup(offscreen=false){
 let state=enterHomeFolder(reduceMenu(selectHomeSlot(tickSystem(createPortfolioState(),3001),40),'open'),40);
 if(offscreen){const nav=getHomeNavigation(state);state=writeHomeNavigation(state,{...nav,rootView:{...nav.rootView,currentLeftSlot:0,targetLeftSlot:0}});}
 state=tickHomeNavigationClock(state,T);
 let host=createHomeBannerHost({generation:'test',updateCount:0},{managerInhibited:false,sceneInhibited:false,loadInhibited:false,nativeWorkerReady:true,resourceReady:null});
 host=select(host,state);state=tickHomeNavigationClock(state,T+13*F);host=at(host,13);
 state=reduceSystem(state,'back',T+13*F);host=select(host,state);
 return {state,host};
}
function advance(pair,count){
 const state=tickHomeNavigationClock(pair.state,T+count*F),ready=getHomeBannerCloseReadyUpdate(pair.state,state);
 let host=pair.host;if(ready!==null)host=select(host,state,ready);
 return {state,host:at(host,count)};
}
for(const [offscreen,readyAt] of [[false,31],[true,41]])test(`close clear and restored request are identical under batched/stepped updates (ready${readyAt})`,()=>{
 const initial=setup(offscreen);assert.deepEqual(resolveHomeBannerHostSelection(initial.state),{kind:'clear'});
 const before=advance(initial,readyAt-1);assert.deepEqual(resolveHomeBannerHostSelection(before.state),{kind:'clear'});
 const boundary=advance(before,readyAt);assert.equal(getHomeBannerCloseReadyUpdate(before.state,boundary.state),readyAt);
 assert.equal(resolveHomeBannerHostSelection(boundary.state).kind,'folder');
 assert.equal(getHomeBannerCloseReadyUpdate(boundary.state,boundary.state),null);
 const batch=advance(initial,65);let stepped=initial;for(let count=14;count<=65;count++)stepped=advance(stepped,count);
 assert.deepEqual(batch.host,stepped.host);assert.deepEqual(batch.state.system.homeFolderClose,stepped.state.system.homeFolderClose);
 const view=getHomeBannerHostView(batch.host);assert.equal(view.status,'active');assert.equal(view.primary.selection.kind,'folder');assert.equal(view.primary.activationEpoch,2);
 // The old end-of-batch observation would still be pending and lose all these updates.
 const delayed=select(at(initial.host,65),batch.state);assert.equal(getHomeBannerHostView(delayed).status,'pending');assert.equal(getHomeBannerHostView(delayed).primary,null);
 assert.notDeepEqual(getHomeBannerHostView(delayed),view);
});
test('settings replacement cannot consume a cancelled transition boundary',()=>{
 const old=setup(),completed=advance(old,40).state,replaced=restoreSettings(completed,saveSettings(completed));
 assert.equal(getHomeBannerCloseReadyUpdate(old.state,replaced),null);
 assert.notEqual(resolveHomeBannerHostSelection(replaced).kind,'clear');
});

test('software close requests reacquisition once at footer departure before owner retirement',()=>{
 const suspended=reduceSystem(tickSystem(launchHomeShortcut(tickSystem(createPortfolioState(),3001),'work',3700),6200),'home',6300);
 const closing=reduceSystem(reduceSystem(suspended,'back',6400),'open',6500);
 assert.deepEqual(homeApplicationBannerBoundary(suspended,closing),{kind:'clear'});
 assert.deepEqual(resolveHomeBannerHostSelection(closing),{kind:'clear'});
 assert.equal(homeApplicationBannerBoundary(closing,closing),undefined);
 let state=closing,retirement,departure;
 for(let i=0;i<12&&state.system.homeApplicationTransition?.phase!=='footer-returning';i++){
  const before=state;state=tickSystem(state,7000+i*500);
  if(state.system.homeApplicationTransition?.phase==='footer-returning')retirement=before;
  if(state.system.homeApplicationTransition?.phase==='footer-exiting'&&state.system.homeApplicationTransition.footerExitFrame===0){
   departure=state;
   assert.deepEqual(homeApplicationBannerBoundary(before,state),resolveHomeBannerHostSelection(state));
   assert.equal(state.system.runtime.application,closing.system.runtime.application);
  }else assert.equal(homeApplicationBannerBoundary(before,state),undefined);
 }
 assert.ok(retirement);
 assert.ok(departure);
 assert.equal(homeApplicationBannerBoundary(retirement,state),undefined);
 assert.equal(homeApplicationBannerBoundary(state,state),undefined);
 let next=tickSystem(state,state.system.homeClock.lastNow+1000);
 assert.equal(next.system.homeApplicationTransition.phase,'return-terminal');
 assert.equal(homeApplicationBannerBoundary(state,next),undefined);
 const complete=tickSystem(next,next.system.homeClock.lastNow+1000);
 assert.equal(complete.system.homeApplicationTransition,null);
 assert.equal(homeApplicationBannerBoundary(next,complete),undefined);
 const cancelled={...closing,system:{...closing.system,homeApplicationTransition:null}};
 assert.deepEqual(homeApplicationBannerBoundary(closing,cancelled),resolveHomeBannerHostSelection(cancelled));
 const replaced=restoreSettings(cancelled,saveSettings(cancelled));
 assert.equal(homeApplicationBannerBoundary(closing,replaced),undefined);
 const invalid=structuredClone(state);invalid.system.homeApplicationTransition.intent={kind:'switch',appId:'about'};
 assert.equal(homeApplicationBannerBoundary(retirement,invalid),undefined);
 const switching=structuredClone(closing);switching.system.homeApplicationTransition.intent={kind:'switch',appId:'about'};
 assert.equal(homeApplicationBannerBoundary(suspended,switching),undefined);
});
