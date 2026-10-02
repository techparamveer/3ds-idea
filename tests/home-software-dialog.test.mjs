import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {homeSoftwareDialogKey,homeSoftwareClosingDialogKey,homeSoftwareSwitchTitles,drawHomeSoftwareDialog as paintDialog} from '../src/os/home-software-dialog.ts';
import {createPortfolioState,tickSystem,reduceSystem,launchHomeShortcut,dispatchSystemEvent} from '../src/os/system.ts';
import {escapeUnreadyNativeScreen} from '../src/os/native-screen-system.ts';
import {poseNativeLayout,nativePaneParentPath} from '../src/os/native-layout.ts';
import {SOFTWARE_DIALOG_BUTTONS} from '../src/os/stock-screen-layout.ts';
const root=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('manifest.json',root)));
const packs=Object.fromEntries(['dialog','dialogmask','messages','sequence'].map(key=>[key,JSON.parse(readFileSync(new URL(manifest.home[key],root)))]));
const icons=[1,2].map(value=>({width:48,height:48,data:new Uint8ClampedArray(48*48*4).fill(value)}));
const drawHomeSoftwareDialog=(r,t,b,s)=>paintDialog(r,t,b,s,icons);
const dialogCall=r=>r.calls.find(c=>c.name==='Dlg_A_D_02');
function suspended(){return reduceSystem(tickSystem(reduceSystem(tickSystem(createPortfolioState(),3001),'open',4000),6200),'home',6300);}
const dialog=kind=>kind==='close'?reduceSystem(suspended(),'back',6400):launchHomeShortcut(suspended(),'about',6400);
const renderer=(source=packs)=>({packs:source,diagnostics:[],calls:[],draw(ctx,pack,name,options){this.calls.push({ctx,pack,name,options});return true;}});

test('closing display keeps one identity through terminal, excludes switch and clears on retirement',()=>{
 const state=reduceSystem(dialog('close'),'open',6500),key=homeSoftwareClosingDialogKey(state);
 assert.ok(key);assert.equal(homeSoftwareDialogKey(state),null);
 for(const frame of [0,1,10,20]){
  const next=structuredClone(state);next.system.homeApplicationTransition.appQuitFrame=frame;
  next.system.homeApplicationTransition.phase=frame===20?'terminal':'closing';
  assert.equal(homeSoftwareClosingDialogKey(next),key);
 }
 const completed=structuredClone(state);completed.system.homeApplicationTransition.phase='complete';
 assert.equal(homeSoftwareClosingDialogKey(completed),null);
 assert.equal(homeSoftwareClosingDialogKey(reduceSystem(dialog('switch'),'open',6500)),null);
 assert.equal(homeSoftwareClosingDialogKey(suspended()),null);
 assert.equal(homeSoftwareClosingDialogKey(dialog('close')),null);
});

test('closing display rejects stale owners, generations and obscuring surfaces',()=>{
 const state=reduceSystem(dialog('close'),'open',6500);
 for(const change of [s=>s.powered=false,s=>s.system.phase='app',s=>s.system.sleeping=true,
  s=>s.system.preferences=true,s=>s.system.dialog='close',s=>s.panel='settings',
  s=>s.system.runtime.homeReturn=null,s=>s.system.runtime.application=null,
  s=>s.system.homeFolderClose.generation++,s=>s.system.runtime.active=s.system.runtime.application,
  s=>s.system.runtime.instances[s.system.runtime.application].closing=true]){
  const copy=structuredClone(state);change(copy);assert.equal(homeSoftwareClosingDialogKey(copy),null);
 }
});

test('failed closing display recovery cancels only the close and preserves its suspended owner',()=>{
 const state=reduceSystem(dialog('close'),'open',6500),owner=state.system.runtime.application;
 const escaped=escapeUnreadyNativeScreen(state,6600);
 assert.equal(homeSoftwareClosingDialogKey(escaped),null);
 assert.equal(escaped.system.homeApplicationTransition,null);
 assert.equal(escaped.system.runtime.application,owner);
 assert.equal(escaped.system.runtime.homeReturn,owner);
 assert.equal(escaped.system.runtime.instances[owner].suspended,true);
 assert.equal(escaped.system.phase,'home');
});

for(const kind of ['close','switch'])test(`${kind} uses original dialog/masks and MSBT glyphs without changing packs`,()=>{
 const before=JSON.stringify(packs),r=renderer(),state=dialog(kind),top={},bottom={};
 assert.ok(homeSoftwareDialogKey(state));assert.equal(drawHomeSoftwareDialog(r,top,bottom,state),true);
 assert.deepEqual(r.calls.map(c=>[c.ctx,c.pack,c.name]),kind==='close'?[[top,'dialogmask','DlgMask_U_00'],[bottom,'dialogmask','DlgMask_D_00'],[bottom,'dialog','Dlg_A_D_02']]:[[bottom,'dialogmask','DlgMask_D_00'],[bottom,'dialog','Dlg_A_D_02'],[bottom,'sequence','LncDlgIcon_D_01']]);
 const options=dialogCall(r).options,body=(kind==='switch'?r.calls.at(-1).options:options).overrides.TextBoxDialog;
 assert.match(body.text,kind==='close'?/^Would you like to close/:/^Close the suspended software/);
 assert.ok(body.messageStyle);assert.ok(body.colorSpans.length);
 assert.equal(options.overrides.TextBox_00.text,'\ue001 Cancel');assert.equal(options.overrides.TextBox_02.text,'\ue000 OK');
 assert.equal(JSON.stringify(packs),before);
 const pose=poseNativeLayout(packs.dialog.layouts.Dlg_A_D_02,packs.dialog.animations,options.bindings,options.overrides);
 for(const [index,target] of SOFTWARE_DIALOG_BUTTONS.entries()){
  const p=nativePaneParentPath(pose,`Bounding_0${index}`).at(-1);
  assert.deepEqual([160+p.translation[0]-p.size[0]*(p.origin%3)/2,120-p.translation[1]-p.size[1]*Math.floor(p.origin/3)/2,...p.size],[target.x,target.y,target.width,target.height]);
 }
 assert.match(r.diagnostics[0],/inline MSBT size controls/);
});

test('native button highlight follows only its owned touch and clears in the gutter',()=>{
 let state=dialog('switch');
 for(const button of SOFTWARE_DIALOG_BUTTONS){
  const r=renderer(),down=dispatchSystemEvent(state,{type:'touch',phase:'down',pointerId:1,x:button.x+20,y:200},6500);
  drawHomeSoftwareDialog(r,{}, {},down);
  assert.deepEqual(dialogCall(r).options.bindings.at(-1).groups,[button.action==='back'?'Group_00':'Group_01']);
  const outside=dispatchSystemEvent(down,{type:'touch',phase:'move',pointerId:1,x:160,y:200},6501),clear=renderer();
  drawHomeSoftwareDialog(clear,{}, {},outside);assert.equal(dialogCall(clear).options.bindings.length,2);
 }
});

test('Health-to-Camera uses source no-warning body and ordered icon bindings',()=>{
 const health=reduceSystem(tickSystem(launchHomeShortcut(tickSystem(createPortfolioState(),3001),'health-safety',4000),6200),'home',6300);
 const state=launchHomeShortcut(health,'camera',6400),r=renderer();
 assert.deepEqual(homeSoftwareSwitchTitles(state),['health-safety','camera']);
 drawHomeSoftwareDialog(r,{}, {},state);
 const header=r.calls.at(-1).options;
 assert.equal(header.overrides.TextBoxDialog.text,'Close the suspended software\nand launch this one?');
 assert.equal(dialogCall(r).options.overrides.TextBoxDialog.text,'');
 assert.equal(header.textures['runtime:switch-from'],icons[0]);assert.equal(header.textures['runtime:switch-to'],icons[1]);
 assert.deepEqual(header.overrides.P_Icon_00.textureBindings,{0:'runtime:switch-from'});
 assert.deepEqual(header.overrides.P_Icon_01.textureBindings,{0:'runtime:switch-to'});
 assert.equal(header.overrides.P_Line_00,undefined,'original separator retained');
 assert.equal(header.overrides.LncDlgIconArw_00,undefined,'original dotted arrow retained');
});

test('switch source, metadata and retained-owner failures never substitute blank icons',()=>{
 const state=dialog('switch');
 for(const invalid of [undefined,[],[icons[0],{...icons[1],width:64}]]){
  const r=renderer();assert.throws(()=>paintDialog(r,{}, {},state,invalid),/icons unavailable/);assert.equal(r.calls.length,0);
 }
 const source=structuredClone(packs);delete source.sequence.layouts.LncDlgIcon_D_01;
 const r=renderer(source);assert.throws(()=>drawHomeSoftwareDialog(r,{}, {},state),/header unavailable/);assert.equal(r.calls.length,0);
 for(const mutate of [s=>s.system.runtime.homeReturn=null,s=>s.system.runtime.instances[s.system.runtime.application].closing=true,s=>s.system.pending=null]){
  const copy=structuredClone(state);mutate(copy);assert.throws(()=>homeSoftwareSwitchTitles(copy),/owner unavailable/);
 }
});

test('source gaps fail before any draw; draw failures fail the paired publication',()=>{
 for(const remove of [p=>delete p.dialog.layouts.Dlg_A_D_02,p=>delete p.dialog.animations.Dlg_A_D_02_Select,p=>delete p.dialogmask.layouts.DlgMask_U_00,p=>delete p.messages.messages.menu_msbt_LZ.labels.lau_dlg_quit0]){
  const source=structuredClone(packs);remove(source);const r=renderer(source);
  assert.throws(()=>drawHomeSoftwareDialog(r,{}, {},dialog('close')),/unavailable/);assert.equal(r.calls.length,0);
 }
 const r=renderer();r.draw=()=>false;assert.throws(()=>drawHomeSoftwareDialog(r,{}, {},dialog('close')),/draw failed/);
});

test('dialog readiness applies to unselected retained owners and recovery only cancels',()=>{
 const state=dialog('switch'),owner=state.system.runtime.application,key=homeSoftwareDialogKey(state);
 assert.ok(key);assert.notEqual(key,homeSoftwareDialogKey(dialog('close')));
 const escaped=escapeUnreadyNativeScreen(state,6500);
 assert.equal(escaped.system.dialog,null);assert.equal(escaped.system.pending,null);
 assert.equal(escaped.system.runtime.application,owner);assert.equal(escaped.system.app,'work');
 for(const overlay of ['sleeping','preferences']){const hidden=structuredClone(state);hidden.system[overlay]=true;assert.equal(homeSoftwareDialogKey(hidden),null);const r=renderer();assert.equal(drawHomeSoftwareDialog(r,{}, {},hidden),false);assert.equal(r.calls.length,0);}
 assert.equal(homeSoftwareDialogKey(suspended()),null);
});
