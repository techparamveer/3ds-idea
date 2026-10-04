import test from 'node:test';
import assert from 'node:assert/strict';
import { getHomeFooter, getHomeLaunchPresentation } from '../src/os/home-presentation.ts';
import { moveHomeItem, selectHomeLocation } from '../src/os/home-layout.ts';
import { createPortfolioState, launchHomeShortcut, tickSystem } from '../src/os/system.ts';

const home=()=>tickSystem(createPortfolioState(),3001);
const launch=(state,id='health-safety',now=4000)=>launchHomeShortcut(state,id,now);
function folderHealth(){
 let state={...home(),folders:{20:'Native'}};
 state=moveHomeItem(state,{folder:null,slot:8},{folder:20,slot:2});
 return selectHomeLocation(state,{folder:20,slot:2});
}

test('fresh root launch retains its selected owner and source footer exit frames',()=>{
 const state=launch(home()),owner=state.system.runtime.application;
 assert.deepEqual(getHomeLaunchPresentation(state,4000),{appId:'health-safety',owner,footerDecideFrame:0,footerSceneOutFrame:0,cursorEffectFrame:0});
 // Decide0..5 plays in place, then Decide5 holds until SceneOut and the ring begin at 10 frames.
 assert.equal(getHomeLaunchPresentation(state,4050).footerDecideFrame,3);
 assert.equal(getHomeLaunchPresentation(state,4050).footerSceneOutFrame,0);
 assert.equal(getHomeLaunchPresentation(state,4084).footerDecideFrame,5);
 assert.equal(getHomeLaunchPresentation(state,4166).footerDecideFrame,5);
 assert.equal(getHomeLaunchPresentation(state,4166).footerSceneOutFrame,0);
 assert.equal(getHomeLaunchPresentation(state,4184).footerSceneOutFrame,1);
 assert.equal(getHomeLaunchPresentation(state,4267).footerSceneOutFrame,6);
 assert.equal(getHomeLaunchPresentation(state,5000).footerSceneOutFrame,14);
 assert.equal(getHomeLaunchPresentation(state,4166).cursorEffectFrame,0);
 assert.equal(getHomeLaunchPresentation(state,4267).cursorEffectFrame,6);
 assert.equal(getHomeLaunchPresentation(state,5167).cursorEffectFrame,60);
 assert.deepEqual(getHomeFooter(state,true),{two:false,left:null,right:'open'});
 assert.deepEqual(getHomeFooter(state),{two:true,left:'close-software',right:'resume'},'without settled banner eligibility launch keeps its prior footer policy');
});

test('folder launch retains the full-width Open footer instead of adopting suspended-software actions',()=>{
 const state=launch(folderHealth()),owner=state.system.runtime.application;
 assert.equal(state.opened,true);assert.equal(state.folderSelected,2);
 assert.deepEqual(getHomeLaunchPresentation(state,4000),{appId:'health-safety',owner,footerDecideFrame:0,footerSceneOutFrame:0,cursorEffectFrame:0});
 assert.deepEqual(getHomeFooter(state,true),{two:false,left:null,right:'open'});
});

test('reduced launch selects the authored footer endpoint without changing ownership',()=>{
 const state=launch(home()),owner=state.system.runtime.application;
 assert.deepEqual(getHomeLaunchPresentation(state,4000,true),{appId:'health-safety',owner,footerDecideFrame:5,footerSceneOutFrame:14,cursorEffectFrame:60});
});

test('stale, replaced and mismatched launch owners cannot retain HOME composition',()=>{
 const state=launch(home()),owner=state.system.runtime.application;
 const cases=[
  {...state,system:{...state.system,runtime:{...state.system.runtime,active:null}}},
  {...state,system:{...state.system,runtime:{...state.system.runtime,application:'health-safety:replacement',active:'health-safety:replacement'}}},
  {...state,system:{...state.system,app:'camera'}},
  {...state,selected:10},
  {...state,system:{...state.system,sleeping:true}},
 ];
 for(const candidate of cases)assert.equal(getHomeLaunchPresentation(candidate,4000),null);
 assert.equal(getHomeLaunchPresentation({...state,system:{...state.system,phase:'app'}},4000),null);
 const replacement='health-safety:2',instance={...state.system.runtime.instances[owner],id:replacement};
 const replaced={...state,system:{...state.system,runtime:{...state.system.runtime,application:replacement,active:replacement,
  instances:{...state.system.runtime.instances,[replacement]:instance}}}};
 assert.equal(getHomeLaunchPresentation(replaced,4000).owner,replacement,'a complete replacement owner gets its own launch identity');
 assert.ok(state.system.runtime.instances[owner]);
});
