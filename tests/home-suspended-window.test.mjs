import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {homeSuspendedApplication,retainedSuspendedApplication,selectedSuspendedApplication,drawHomeSuspendedWindow,drawHomeSuspendedIcon} from '../src/os/home-suspended-window.ts';
import {createPortfolioState,tickSystem,reduceSystem} from '../src/os/system.ts';
import {escapeUnreadyNativeScreen,releaseUnreadyNativeInput} from '../src/os/native-screen-system.ts';
import {selectHomeSlot,settleHomeNavigation} from '../src/os/home-navigation.ts';
import {poseNativeLayout,nativePaneParentPath} from '../src/os/native-layout.ts';
const root=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('manifest.json',root)));
const packs=Object.fromEntries(['launcher','messages'].map(key=>[key,JSON.parse(readFileSync(new URL(manifest.home[key],root)))]));
const suspended=()=>reduceSystem(tickSystem(reduceSystem(tickSystem(createPortfolioState(),3001),'open',4000),6000),'home',6001);
const metadata=()=>({description:'Health and Safety Information',icon:{width:64,height:64,data:new Uint8ClampedArray(64*64*4)}});
const finishClose=(state,now)=>{state=tickSystem(state,now);state=tickSystem(state,now+1000);return tickSystem(state,state.system.homeClock.lastNow+1000/60);};

test('lower highlight retains its application owner across selection and toolbar focus, never foreground or retired owners',()=>{
 const state=suspended(),owner=state.system.runtime.application;
 const other=settleHomeNavigation(selectHomeSlot(state,1));
 assert.equal(homeSuspendedApplication(other).id,owner);
 const toolbar=structuredClone(other);toolbar.system.homeNavigation.focus.toolbarActive=true;
 assert.equal(homeSuspendedApplication(toolbar).id,owner);assert.equal(retainedSuspendedApplication(toolbar),null);
 for(const change of [s=>s.powered=false,s=>s.system.sleeping=true,s=>s.system.preferences=true,s=>s.panel='settings',s=>s.system.runtime.active=owner,s=>s.system.runtime.homeReturn=null,s=>s.system.runtime.instances[owner].closing=true]){
  const copy=structuredClone(state);change(copy);assert.equal(homeSuspendedApplication(copy),null);
 }
});

test('lower source highlight samples authored density sizes, tint and settled opacity without mutating the pack',()=>{
 const before=JSON.stringify(packs);
 for(const [frame,size] of [[0,94],[1,94],[2,67],[3,50],[4,40],[5,34]]){
  let options;drawHomeSuspendedIcon({packs,draw(_ctx,_pack,_name,value){options=value;return true;}},{},[76,160],frame);
  const pose=poseNativeLayout(packs.launcher.layouts.LncIconSleep_00,packs.launcher.animations,options.bindings);
  assert.deepEqual(options.center,[76,160]);
  assert.deepEqual(nativePaneParentPath(pose,'P_Sleep_00').at(-1).size,[size,size]);
  assert.equal(nativePaneParentPath(pose,'N_Sleep_00').at(-1).alpha,140);
  assert.equal(nativePaneParentPath(pose,'P_Sleep_00').at(-1).alpha,255);
  assert.deepEqual(pose.textures,['LncIconSleep_02.bclim']);
 }
 assert.equal(JSON.stringify(packs),before);
 for(const remove of [p=>delete p.launcher.layouts.LncIconSleep_00,p=>delete p.launcher.animations.LncIconSleep_00_Sleep]){
  const source=structuredClone(packs);remove(source);assert.throws(()=>drawHomeSuspendedIcon({packs:source},{},[0,0],1),/unavailable/);
 }
 assert.throws(()=>drawHomeSuspendedIcon({packs,draw(){return false;}},{},[0,0],1),/draw failed/);
});

test('upper and lower suspended presentations sample the same authored Sleep loop frame',()=>{
 let iconOptions,windowOptions;
 drawHomeSuspendedIcon({packs,draw(_ctx,_pack,_name,value){iconOptions=value;return true;}},{},[76,160],0,60);
 drawHomeSuspendedWindow({packs,measureSingleLineText(){return 222;},draw(_ctx,_pack,_name,value){windowOptions=value;return true;}},{},metadata(),'expanded',60);
 const icon=poseNativeLayout(packs.launcher.layouts.LncIconSleep_00,packs.launcher.animations,iconOptions.bindings);
 const window=poseNativeLayout(packs.launcher.layouts.LncBase_U_00,packs.launcher.animations,windowOptions.bindings,windowOptions.overrides);
 assert.equal(nativePaneParentPath(icon,'N_Sleep_00').at(-1).alpha,255);
 assert.equal(nativePaneParentPath(window,'P_Sleep_00').at(-1).alpha,240);
 assert.equal(iconOptions.bindings.find(binding=>binding.name==='LncIconSleep_00_Sleep').frame,60);
 assert.equal(windowOptions.bindings.find(binding=>binding.name==='LncBase_U_00_Sleep').frame,60);
 for(const frame of [-1,.5,120,NaN,Infinity]){
  assert.throws(()=>drawHomeSuspendedIcon({packs},{},[0,0],0,frame),RangeError);
  assert.throws(()=>drawHomeSuspendedWindow({packs},{},metadata(),'expanded',frame),RangeError);
 }
});

test('expanded window follows the selected suspended instance, never a live, applet or retired owner',()=>{
 const state=suspended(),owner=state.system.runtime.application;
 assert.equal(selectedSuspendedApplication(state).id,owner);
 assert.equal(selectedSuspendedApplication(reduceSystem(state,'home',6100)),null);
 assert.equal(selectedSuspendedApplication(settleHomeNavigation(selectHomeSlot(state,1))),null);
 assert.equal(retainedSuspendedApplication(settleHomeNavigation(selectHomeSlot(state,1))).id,owner);
 for(const change of [s=>s.system.sleeping=true,s=>s.system.preferences=true,s=>s.panel='settings',s=>s.system.runtime.active='other',s=>s.system.runtime.homeReturn=null,s=>s.system.runtime.instances[owner].closing=true,s=>s.system.homeNavigation.focus.toolbarActive=true]){
  const copy=structuredClone(state);change(copy);assert.equal(selectedSuspendedApplication(copy),null);assert.equal(retainedSuspendedApplication(copy),null);
 }
 const dialog=reduceSystem(state,'back',6200);
 assert.equal(dialog.system.dialog,'close');assert.equal(selectedSuspendedApplication(dialog).id,owner);
 const closing=reduceSystem(dialog,'open',6300);assert.equal(selectedSuspendedApplication(closing).id,owner);
 assert.equal(selectedSuspendedApplication(finishClose(closing,6300)),null);
});

test('source compact pose retains the small masked icon and HOME glyph without title or expanded frame',()=>{
 const calls=[],meta=metadata(),renderer={packs,measureSingleLineText(){return 222;},draw(ctx,pack,name,options){calls.push(options);return true;}};
 drawHomeSuspendedWindow(renderer,{},meta,'compact');
 const options=calls[0],pose=poseNativeLayout(packs.launcher.layouts.LncBase_U_00,packs.launcher.animations,options.bindings,options.overrides);
 const pane=name=>nativePaneParentPath(pose,name).at(-1);
 assert.deepEqual(pane('N_WndwScale_00').translation,[-176,78,0]);
 assert.deepEqual(pane('N_IconWrp_00').scale,[Math.fround(.67),Math.fround(.67)]);
 assert.equal(pane('W_Wndw_00').flags&1,0);assert.equal(pane('T_AppTitle_00').flags&1,0);
 assert.equal(pane('T_TextBtmR_00').flags&1,0);assert.ok(pane('P_Home_00').flags&1);
 assert.deepEqual(pane('N_TestCenter_00').translation,[0,0,0]);
 assert.deepEqual(pane('N_TextBtm_00').translation,[0,-27,0]);
 const material=pose.materials[pane('P_Icon_00').picture.material];
 assert.equal(material.textureMaps.length,2);assert.equal(pose.textures[material.textureMaps[0].texture],'runtime:suspended-icon');
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

test('close opacity changes only the fixed window group and selects native light camera hints',()=>{
 const before=JSON.stringify(packs);
 for(const mode of ['expanded','compact'])for(const opacity of [1,.5,0]){
  let options;const renderer={packs,measureSingleLineText(){return 222;},draw(_ctx,_pack,_name,value){options=value;return true;}};
  drawHomeSuspendedWindow(renderer,{},metadata(),mode,0,opacity);
  const pose=poseNativeLayout(packs.launcher.layouts.LncBase_U_00,packs.launcher.animations,options.bindings,options.overrides);
  const pane=name=>nativePaneParentPath(pose,name).at(-1);
  assert.equal(pane('N_Wndw_00').alpha,Math.round(255*opacity));
  assert.deepEqual(pane('N_Root_00').scale,[1,1]);
  assert.deepEqual(pane('N_WndwScale_00').translation,mode==='expanded'?[0,2,3]:[-176,78,0]);
  assert.equal(options.bindings.find(b=>b.name.endsWith('_WhiteBlack')).frame,0);
  assert.ok(!options.bindings.some(b=>b.name.endsWith('_SceneOut')));
 }
 assert.equal(JSON.stringify(packs),before);
 for(const opacity of [-1,1.01,NaN,Infinity])assert.throws(()=>drawHomeSuspendedWindow({packs},{},metadata(),'expanded',0,opacity),RangeError);
});
