import test from 'node:test';
import assert from 'node:assert/strict';
import { createPortfolioState, tickSystem, launchHomeShortcut, reduceSystem, invokeSystemApplet } from '../src/os/system.ts';
import { createNativeScreenInputGate } from '../src/os/native-screen-input.ts';
import { escapeUnreadyNativeScreen } from '../src/os/native-screen-system.ts';

function application(id){return tickSystem(launchHomeShortcut(tickSystem(createPortfolioState(),3001),id,3010),6200);}
function openManual(base,title){return invokeSystemApplet(base,'manual',6400,{manualTitleId:title});}
const titles=[['camera','0004001000022400'],['system-settings','0004001000022000']];

for(const [id,title]of titles)for(const origin of ['home','app'])test(`${id} ${origin}-origin Manual B/HOME recovery closes only Manual and restores application HOME ownership`,()=>{
 const applicationState=application(id),base=origin==='home'?reduceSystem(applicationState,'home',6300):applicationState;
 const state=openManual(base,title),owner=state.system.runtime.application,manualOwner=state.system.runtime.active;
 assert.equal(state.system.runtime.instances[manualOwner].caller,origin==='app'?owner:null);
 for(const current of [state,reduceSystem(state,'open',6450)])for(const command of ['back','home'])for(const status of ['loading','error'])for(const type of ['command','button']){
  const gate=createNativeScreenInputGate();assert.equal(gate(type==='button'?{type,command,phase:'down',source:`physical-${command}`}:{type,command},status),'home');
  const escaped=escapeUnreadyNativeScreen(current,6500),runtime=escaped.system.runtime;
  assert.equal(escaped.system.phase,'home');assert.equal(runtime.active,null);assert.equal(runtime.application,owner);assert.equal(runtime.homeReturn,owner);
  assert.equal(runtime.instances[manualOwner],undefined);assert.equal(runtime.instances[owner].suspended,true);assert.equal(runtime.instances[owner].caller,null);
  const resumed=reduceSystem(escaped,'home',6600);assert.equal(resumed.system.phase,'app');assert.equal(resumed.system.runtime.active,owner);assert.equal(resumed.system.runtime.instances[manualOwner],undefined);
 }
});

test('normal ready app-origin Manual Back keeps its established caller return instead of invoking recovery',()=>{
 for(const [id,title]of titles){
  const caller=application(id),state=openManual(caller,title),manualOwner=state.system.runtime.active;
  const gate=createNativeScreenInputGate();assert.equal(gate({type:'command',command:'back'},'ready'),'pass');
  const closed=reduceSystem(state,'back',6500);assert.equal(closed.system.phase,'app');assert.equal(closed.system.runtime.active,caller.system.runtime.active);
  assert.equal(closed.system.runtime.instances[manualOwner],undefined);assert.equal(closed.system.runtime.instances[caller.system.runtime.active].suspended,false);
 }
});

test('HOME-origin Manual without software closes to ownerless HOME and other applet recovery is unchanged',()=>{
 const home=tickSystem(createPortfolioState(),3001),state=openManual(home,titles[0][1]);
 const escaped=escapeUnreadyNativeScreen(state,6500);assert.equal(escaped.system.phase,'home');assert.equal(escaped.system.runtime.application,null);assert.equal(escaped.system.runtime.homeReturn,null);assert.equal(escaped.system.runtime.active,null);assert.equal(escaped.system.runtime.instances[state.system.runtime.active],undefined);
 const notes=invokeSystemApplet(application('camera'),'game-notes',6400),notesOwner=notes.system.runtime.active;
 const retained=escapeUnreadyNativeScreen(notes,6500);assert.equal(retained.system.runtime.homeReturn,notesOwner);assert.equal(retained.system.runtime.instances[notesOwner].suspended,true);
});
