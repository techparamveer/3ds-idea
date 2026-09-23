import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortfolioState,tickSystem,launch,dispatchSystemEvent,reduceSystem,getActiveAppView,touchSystem} from '../src/os/system.ts';
import {activeInstance,createAppRuntime,startApplication,startSettingsHelper,closeApplication,showRuntimeHome} from '../src/os/app-host.ts';
const act=(state,id,now=7000)=>dispatchSystemEvent(state,{type:'action',id},now);
function settings(){return tickSystem(launch(tickSystem(createPortfolioState(),3001),'system-settings',4000),6200);}
function openHelper(action){
 let s=settings();
 if(action!=='nnid'){
  s=act(s,'other');for(let i=0;i<(action==='transfer'?2:3);i++)s=act(s,'settings-next');
 }
 const parent=s.system.runtime.application;
 s=act(s,action,7200);
 return {state:s,parent};
}
for(const [action,title,screen,page,selection]of [['nnid','nnid-settings','main',undefined,4],['transfer','system-transfer','other',2,2],['update','system-updater','other',3,1]])test(`${title} opens directly and Back restores its exact Settings page`,()=>{
 let {state:s,parent}=openHelper(action);
 assert.equal(s.system.phase,'launch');assert.equal(s.system.dialog,null);assert.equal(s.system.pending,null);
 const child=s.system.runtime.active;assert.equal(activeInstance(s.system.runtime).appId,title);
 assert.equal(activeInstance(s.system.runtime).caller,parent);assert.equal(s.system.runtime.instances[parent].suspended,true);
 assert.equal(Object.keys(s.system.runtime.instances).length,2);
 s=tickSystem(s,9400);assert.equal(getActiveAppView(s).appId,title);
 s=action==='update'?touchSystem(s,50,226,9500):reduceSystem(s,'back',9500);
 assert.equal(s.system.phase,'app');assert.equal(s.system.app,'system-settings');assert.equal(s.system.dialog,null);
 assert.equal(s.system.runtime.application,parent);assert.equal(s.system.runtime.active,parent);assert.equal(s.system.runtime.instances[child],undefined);
 assert.equal(getActiveAppView(s).screen,screen);assert.equal(getActiveAppView(s).selection,selection);
 assert.equal(activeInstance(s.system.runtime).state.page,page);assert.equal(s.system.runtime.instances[parent].suspended,false);
 assert.equal(s.system.runtime.effects.some(item=>item.effect.type==='storage'||item.effect.type==='capability'),false);
});
test('Transfer detail Back stays in the helper, then returns to Settings',()=>{
 let {state:s,parent}=openHelper('transfer');s=tickSystem(s,9400);s=act(s,'3ds',9500);
 s=reduceSystem(s,'back',9600);assert.equal(getActiveAppView(s).appId,'system-transfer');assert.equal(getActiveAppView(s).screen,'main');
 s=reduceSystem(s,'back',9700);assert.equal(s.system.runtime.active,parent);assert.equal(getActiveAppView(s).screen,'other');
});
test('HOME suspends the helper and restores it, while closing removes the entire caller tree',()=>{
 let {state:s,parent}=openHelper('update');s=tickSystem(s,9400);const child=s.system.runtime.active;
 s=reduceSystem(s,'home',9500);assert.equal(s.system.phase,'home');assert.equal(s.system.runtime.homeReturn,child);
 s=reduceSystem(s,'home',9600);assert.equal(s.system.runtime.active,child);assert.equal(s.system.runtime.instances[parent].suspended,true);
 const closed=closeApplication(s.system.runtime,9700);assert.deepEqual(closed.instances,{});assert.equal(closed.application,null);assert.equal(closed.homeReturn,null);
 const another=startApplication(s.system.runtime,'work',9700);assert.equal(Object.keys(another.instances).length,1);assert.equal(activeInstance(another).appId,'work');
});
test('power closes the retained Settings parent and no helper return survives reboot',()=>{
 let {state:s}=openHelper('nnid');s=tickSystem(s,9400);s=reduceSystem(s,'power',9500);
 assert.deepEqual(s.system.runtime.instances,{});assert.equal(s.system.app,null);
});
test('helper route rejects unrelated, suspended, or missing parents',()=>{
 const empty=createAppRuntime();assert.equal(startSettingsHelper(empty,'nnid-settings',0),empty);
 const work=startApplication(empty,'work',0);assert.equal(startSettingsHelper(work,'nnid-settings',1),work);
 const setting=startApplication(empty,'system-settings',0);assert.equal(startSettingsHelper(setting,'camera',1),setting);
 const home=showRuntimeHome(setting,1);assert.equal(startSettingsHelper(home,'system-updater',2),home);
});
