import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortfolioState,tickSystem,launch,dispatchSystemEvent,reduceSystem,getActiveAppView,touchSystem} from '../src/os/system.ts';
import {activeInstance,createAppRuntime,startApplication,startSettingsHelper,closeApplication,showRuntimeHome} from '../src/os/app-host.ts';
const act=(state,id,now=6200)=>dispatchSystemEvent(state,{type:'action',id},now);
function settings(){return tickSystem(launch(tickSystem(createPortfolioState(),3001),'system-settings',3010),6200);}
function openHelper(action){
 let s=settings();
 if(action!=='nnid'){
  s=act(s,'other');for(let i=0;i<(action==='transfer'?2:3);i++)s=act(s,'settings-next');
 }
 const parent=s.system.runtime.application;
 s=act(s,action,6210);
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

// The two helper packs independently define a 120×32 lower-left Back control.
// Exercise that actual touch boundary rather than the action-id shortcut.
for(const action of ['transfer','update'])for(const exit of ['touch','physical'])test(`${action}: ${exit} Back restores the full parent after HOME and reopen`,()=>{
 let {state:s,parent}=openHelper(action);s=tickSystem(s,9400);
 const preserved=structuredClone(s.system.runtime.instances[parent].state);
 const shared=structuredClone(s.system.runtime.shared);
 const child=s.system.runtime.active;
 s=reduceSystem(s,'home',9500);s=reduceSystem(s,'home',9600);
 assert.equal(s.system.runtime.active,child);
 // The right edge and the row immediately above the footer are not Back.
 s=touchSystem(s,120,226,9700);s=touchSystem(s,60,207,9800);
 assert.equal(s.system.runtime.active,child);
 s=exit==='touch'?touchSystem(s,119,239,9900):reduceSystem(s,'back',9900);
 assert.equal(s.system.runtime.active,parent);
 assert.deepEqual(s.system.runtime.instances[parent].state,preserved);
 assert.deepEqual(s.system.runtime.shared,shared);
 assert.deepEqual(Object.keys(s.system.runtime.instances),[parent]);
 assert.equal(s.system.runtime.effects.some(item=>['storage','capability','music','invoke'].includes(item.effect.type)),false);
 // A opens the restored selection, then the opposite input can return again.
 s=reduceSystem(s,'open',10000);s=tickSystem(s,13200);
 assert.equal(getActiveAppView(s).appId,action==='transfer'?'system-transfer':'system-updater');
 s=exit==='touch'?reduceSystem(s,'back',13300):touchSystem(s,1,209,13300);
 assert.equal(s.system.runtime.active,parent);
 assert.deepEqual(s.system.runtime.instances[parent].state,preserved);
});

for(const choice of ['3ds','dsi'])test(`Transfer ${choice} detail footer returns locally before restoring Settings`,()=>{
 let {state:s,parent}=openHelper('transfer');s=tickSystem(s,9400);
 const preserved=structuredClone(s.system.runtime.instances[parent].state),child=s.system.runtime.active;
 s=touchSystem(s,160,choice==='3ds'?50:142,9500);
 assert.equal(getActiveAppView(s).screen,'detail');assert.equal(getActiveAppView(s).data.field,choice);
 s=touchSystem(s,119,239,9600);
 assert.equal(s.system.runtime.active,child);assert.equal(getActiveAppView(s).screen,'main');
 s=touchSystem(s,119,239,9700);
 assert.equal(s.system.runtime.active,parent);assert.deepEqual(s.system.runtime.instances[parent].state,preserved);
});
