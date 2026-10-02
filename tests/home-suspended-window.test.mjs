import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectedSuspendedApplication,drawHomeSuspendedWindow} from '../src/os/home-suspended-window.ts';
import {createPortfolioState,tickSystem,reduceSystem} from '../src/os/system.ts';
import {escapeUnreadyNativeScreen,releaseUnreadyNativeInput} from '../src/os/native-screen-system.ts';
import {selectHomeSlot,settleHomeNavigation} from '../src/os/home-navigation.ts';
import {poseNativeLayout,nativePaneParentPath} from '../src/os/native-layout.ts';
const root=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('manifest.json',root)));
const packs=Object.fromEntries(['launcher','messages'].map(key=>[key,JSON.parse(readFileSync(new URL(manifest.home[key],root)))]));
const suspended=()=>reduceSystem(tickSystem(reduceSystem(tickSystem(createPortfolioState(),3001),'open',4000),6000),'home',6001);
const metadata=()=>({description:'Health and Safety Information',icon:{width:64,height:64,data:new Uint8ClampedArray(64*64*4)}});

test('expanded window follows the selected suspended instance, never a live, applet or retired owner',()=>{
 const state=suspended(),owner=state.system.runtime.application;
 assert.equal(selectedSuspendedApplication(state).id,owner);
 assert.equal(selectedSuspendedApplication(reduceSystem(state,'home',6100)),null);
 assert.equal(selectedSuspendedApplication(settleHomeNavigation(selectHomeSlot(state,1))),null);
 for(const change of [s=>s.system.sleeping=true,s=>s.system.preferences=true,s=>s.panel='settings',s=>s.system.runtime.active='other',s=>s.system.runtime.homeReturn=null,s=>s.system.runtime.instances[owner].closing=true,s=>s.system.homeNavigation.focus.toolbarActive=true]){
  const copy=structuredClone(state);change(copy);assert.equal(selectedSuspendedApplication(copy),null);
 }
 const dialog=reduceSystem(state,'back',6200);
 assert.equal(dialog.system.dialog,'close');assert.equal(selectedSuspendedApplication(dialog).id,owner);
 assert.equal(selectedSuspendedApplication(reduceSystem(dialog,'open',6300)),null);
});

test('unready window can escape to the retained app or cancel an overlaid dialog without closing it',()=>{
 const state=suspended(),owner=state.system.runtime.application;
 assert.equal(releaseUnreadyNativeInput(state,'ready',6100),state);
 const escaped=escapeUnreadyNativeScreen(state,6200);
 assert.equal(escaped.system.phase,'app');assert.equal(escaped.system.runtime.active,owner);
 const escapedDialog=escapeUnreadyNativeScreen(reduceSystem(state,'back',6200),6300);
 assert.equal(escapedDialog.system.dialog,null);assert.equal(escapedDialog.system.runtime.application,owner);
});

test('source expanded window keeps native frame geometry, message styles and icon mask sampler',()=>{
 const before=JSON.stringify(packs),calls=[],meta=metadata();
 const renderer={packs,measureSingleLineText(){return 222;},draw(ctx,pack,name,options){calls.push(options);return true;}};
 drawHomeSuspendedWindow(renderer,{},meta);
 const options=calls[0],pose=poseNativeLayout(packs.launcher.layouts.LncBase_U_00,packs.launcher.animations,options.bindings,options.overrides);
 const pane=name=>nativePaneParentPath(pose,name).at(-1);
 assert.deepEqual(pane('W_Wndw_00').size,[296,132]);assert.ok(pane('W_Wndw_00').flags&1);
 assert.deepEqual(pane('N_WndwScale_00').translation,[0,2,3]);
 assert.equal(pane('T_TextTop_00').text.value,'Suspended software');
 assert.equal(pane('T_AppTitle_00').text.value,meta.description);
 assert.equal(pane('T_TextBtmR_00').text.value,'HOME: Resume suspended software');
 assert.deepEqual(pane('N_TestCenter_00').translation,[14,0,0]);
 assert.ok(pane('T_TextTop_00').text.messageStyle);
 const material=pose.materials[pane('P_Icon_00').picture.material];
 assert.equal(pose.textures[material.textureMaps[0].texture],'runtime:suspended-icon');
 assert.equal(material.textureMaps.length,2);assert.notEqual(pose.textures[material.textureMaps[1].texture],'runtime:suspended-icon');
 assert.equal(options.textures['runtime:suspended-icon'],meta.icon);
 assert.equal(JSON.stringify(packs),before);
});

test('unavailable window sources and metadata fail explicitly instead of drawing placeholder native artwork',()=>{
 for(const remove of [p=>delete p.launcher.layouts.LncBase_U_00,p=>delete p.launcher.animations.LncBase_U_00_Sleep,p=>delete p.messages.messages.menu_msbt_LZ.labels.lau_pose_title_u]){
  const source=structuredClone(packs);remove(source);let called=false;
  assert.throws(()=>drawHomeSuspendedWindow({packs:source,draw(){called=true;}},{},metadata()),/unavailable/);assert.equal(called,false);
 }
 assert.throws(()=>drawHomeSuspendedWindow({packs,draw(){return true;}},{},{...metadata(),description:''}),/metadata unavailable/);
 assert.throws(()=>drawHomeSuspendedWindow({packs,measureSingleLineText(){return 222;},draw(){return false;}},{},metadata()),/draw failed/);
});
