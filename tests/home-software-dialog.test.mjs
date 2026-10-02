import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {homeSoftwareDialogKey,drawHomeSoftwareDialog} from '../src/os/home-software-dialog.ts';
import {createPortfolioState,tickSystem,reduceSystem,launchHomeShortcut,dispatchSystemEvent} from '../src/os/system.ts';
import {escapeUnreadyNativeScreen} from '../src/os/native-screen-system.ts';
import {poseNativeLayout,nativePaneParentPath} from '../src/os/native-layout.ts';
import {SOFTWARE_DIALOG_BUTTONS} from '../src/os/stock-screen-layout.ts';
const root=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('manifest.json',root)));
const packs=Object.fromEntries(['dialog','dialogmask','messages'].map(key=>[key,JSON.parse(readFileSync(new URL(manifest.home[key],root)))]));
function suspended(){return reduceSystem(tickSystem(reduceSystem(tickSystem(createPortfolioState(),3001),'open',4000),6200),'home',6300);}
const dialog=kind=>kind==='close'?reduceSystem(suspended(),'back',6400):launchHomeShortcut(suspended(),'about',6400);
const renderer=(source=packs)=>({packs:source,diagnostics:[],calls:[],draw(ctx,pack,name,options){this.calls.push({ctx,pack,name,options});return true;}});

for(const kind of ['close','switch'])test(`${kind} uses original dialog/masks and MSBT glyphs without changing packs`,()=>{
 const before=JSON.stringify(packs),r=renderer(),state=dialog(kind),top={},bottom={};
 assert.ok(homeSoftwareDialogKey(state));assert.equal(drawHomeSoftwareDialog(r,top,bottom,state),true);
 assert.deepEqual(r.calls.map(c=>[c.ctx,c.pack,c.name]),[[top,'dialogmask','DlgMask_U_00'],[bottom,'dialogmask','DlgMask_D_00'],[bottom,'dialog','Dlg_A_D_02']]);
 const options=r.calls[2].options,body=options.overrides.TextBoxDialog;
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
  assert.deepEqual(r.calls[2].options.bindings.at(-1).groups,[button.action==='back'?'Group_00':'Group_01']);
  const outside=dispatchSystemEvent(down,{type:'touch',phase:'move',pointerId:1,x:160,y:200},6501),clear=renderer();
  drawHomeSoftwareDialog(clear,{}, {},outside);assert.equal(clear.calls[2].options.bindings.length,2);
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
