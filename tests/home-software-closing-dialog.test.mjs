import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HOME_SOFTWARE_CLOSING_DIALOG_SOURCE,drawHomeSoftwareClosingDialog} from '../src/os/home-software-closing-dialog.ts';
import {poseNativeLayout,nativePaneParentPath} from '../src/os/native-layout.ts';

const root=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('manifest.json',root)));
const packs=Object.fromEntries(['dialog','dialogmask','messages'].map(key=>[key,JSON.parse(readFileSync(new URL(manifest.home[key],root)))]));
const renderer=(source=packs)=>({packs:source,calls:[],draw(ctx,pack,name,options){this.calls.push({ctx,pack,name,options});return true;}});
const pane=(layout,name)=>{const walk=panes=>{for(const item of panes){if(item.name===name)return item;const found=walk(item.children);if(found)return found;}};return walk(layout.roots);};

test('settled close presentation uses the buttonless source window and lower mask without touching upper',()=>{
 const before=JSON.stringify(packs),r=renderer(),top={},bottom={};
 assert.equal(drawHomeSoftwareClosingDialog(r,top,bottom),true);
 assert.deepEqual(r.calls.map(call=>[call.ctx,call.pack,call.name]),[
  [bottom,'dialogmask','DlgMask_D_00'],[bottom,'dialog','Dlg_A_D_00'],
 ]);
 assert.deepEqual(r.calls.slice(0,1).map(call=>call.options.bindings),[
  [{name:'DlgMask_D_00_FadeIn',frame:20}],
 ]);
 const text=r.calls[1].options.overrides.TextBoxDialog;
 assert.equal(text.text,'Closing software...');assert.ok(text.messageStyle);assert.deepEqual(text.colorSpans,[]);
 assert.equal(r.calls[1].options.textSampling,'lcd');assert.equal(JSON.stringify(packs),before);
});

test('captured entry fade uses compatible decoded donor poses at the existing mask sample',()=>{
 for(const frame of [0,1,9,19,20]){
  const r=renderer();drawHomeSoftwareClosingDialog(r,{}, {},frame);
  assert.deepEqual(r.calls[0].options.bindings[0].frame,frame);
  assert.deepEqual(r.calls[1].options.bindings,[{name:'Dlg_A_D_02_FadeIn',frame}]);
  const pose=poseNativeLayout(packs.dialog.layouts.Dlg_A_D_00,packs.dialog.animations,r.calls[1].options.bindings);
  const group=nativePaneParentPath(pose,'N_Dlg_00').at(-1);
  if(frame===0){assert.equal(group.alpha,0);assert.deepEqual(group.scale,[Math.fround(.95),Math.fround(.95)]);}
  if(frame===20){assert.equal(group.alpha,255);assert.deepEqual(group.scale,[1,1]);}
 }
 for(const frame of [-1,21,.5,NaN]){
  const r=renderer();assert.throws(()=>drawHomeSoftwareClosingDialog(r,{}, {},frame),RangeError);assert.equal(r.calls.length,0);
 }
});

test('source-backed close exit applies the expanding dialog donor and lower mask exit on one sample',()=>{
 for(const frame of [0,1,9,15,19,20]){
  const r=renderer();drawHomeSoftwareClosingDialog(r,{}, {},20,frame);
  assert.deepEqual(r.calls[0].options.bindings,[{name:'DlgMask_D_00_FadeOut00',frame}]);
  assert.deepEqual(r.calls[1].options.bindings,[{name:'Dlg_A_D_02_FadeOut00',frame}]);
 }
 for(const frame of [-1,21,.5,NaN]){
  const r=renderer();assert.throws(()=>drawHomeSoftwareClosingDialog(r,{}, {},20,frame),RangeError);assert.equal(r.calls.length,0);
 }
});

test('source geometry and provenance match the captured 280 by 200 striped window and full-LCD masks',()=>{
 const source=HOME_SOFTWARE_CLOSING_DIALOG_SOURCE,layout=packs.dialog.layouts[source.dialog.layout];
 assert.deepEqual({root:layout.roots[0].size,shadow:pane(layout,'P_Shdw_00').size,left:pane(layout,'P_WndwL_00').size,
  right:pane(layout,'P_WndwR_00').size,text:pane(layout,'TextBoxDialog').size,textures:layout.textures},
 {root:[320,240],shadow:[312,232],left:[140,200],right:[140,200],text:[264,184],textures:['DlgWndw_00.bclim','DlgWndwLine_8.bclim']});
 assert.deepEqual(packs.dialog.resourceSources.layouts[source.dialog.layout],{
  path:'dialog_LZ.bin/blyt/Dlg_A_D_00.bclyt',sha256:'ccee73ad198e6dba3df6498108ceec64dfd38ab8994cea5422db60fdee72534b',titleId:'0004003000009802',
 });
 for(const item of [source.lowerMask]){
  const animation=packs.dialogmask.animations[item.clip],track=animation.tracks[0];
  assert.deepEqual({frames:animation.frames,loop:animation.loop,groups:animation.groups,range:animation.sourceFrameRange,
   target:track.target,property:track.property,keys:track.keys.map(key=>[key.frame,key.value])},
  {frames:21,loop:false,groups:['Group_Scene'],range:[-20,0],target:'P_Bg_00',property:'alpha',keys:[[0,0],[20,130]]});
 }
 const dialogExit=packs.dialog.animations[source.dialog.exitClip],dialogExitTracks=dialogExit.tracks.filter(track=>track.target==='N_Dlg_00');
 const entry=packs.dialog.animations[source.dialog.entryClip];
 assert.deepEqual({frames:entry.frames,loop:entry.loop,groups:entry.groups,range:entry.sourceFrameRange},
  {frames:21,loop:false,groups:['Group_Scene'],range:[-20,0]});
 assert.deepEqual(packs.dialog.resourceSources.animations[source.dialog.entryClip],{
  path:'dialog_LZ.bin/anim/Dlg_A_D_02_FadeIn.bclan',sha256:'e4dc8547f621e137ac1678823deee1b9817a2b97ff4741520aa04499023745c2',titleId:'0004003000009802',
 });
 assert.deepEqual({frames:dialogExit.frames,loop:dialogExit.loop,groups:dialogExit.groups,range:dialogExit.sourceFrameRange,
  tracks:dialogExitTracks.map(track=>({property:track.property,keys:track.keys.map(key=>[key.frame,key.value,key.slope])}))},
 {frames:21,loop:false,groups:['Group_Scene'],range:[80,100],tracks:[
  {property:'scale.x',keys:[[0,1,.002499997615814209],[20,1.0499999523162842,0]]},
  {property:'scale.y',keys:[[0,1,.002499997615814209],[20,1.0499999523162842,0]]},
  {property:'alpha',keys:[[0,255,-12.75],[20,0,0]]},
 ]});
 const maskExit=packs.dialogmask.animations[source.lowerMask.exitClip],maskExitTrack=maskExit.tracks[0];
 assert.deepEqual({frames:maskExit.frames,loop:maskExit.loop,groups:maskExit.groups,range:maskExit.sourceFrameRange,
  target:maskExitTrack.target,property:maskExitTrack.property,keys:maskExitTrack.keys.map(key=>[key.frame,key.value,key.slope])},
 {frames:21,loop:false,groups:['Group_Scene'],range:[80,100],target:'P_Bg_00',property:'alpha',keys:[
  [0,130,-8.666666984558105],[15,0,0],[40,0,0],[40,110,4.400000095367432],
 ]});
 for(const [name,size] of [['DlgMask_U_00',[400,240]],['DlgMask_D_00',[320,240]]]){
  const maskPane=pane(packs.dialogmask.layouts[name],'P_Bg_00');
  assert.deepEqual({size:maskPane.size,alpha:maskPane.alpha,colors:maskPane.picture.colors},
   {size,alpha:130,colors:Array.from({length:4},()=>[255,255,255,255])});
 }
 assert.deepEqual(packs.dialogmask.resourceSources.layouts.DlgMask_U_00,{path:'dialogmask_LZ.bin/blyt/DlgMask_U_00.bclyt',sha256:'e51db3f8fb8f5d4c8860607cd43aac0d36d8992daa55e4fd8a8b7d4e998236db',titleId:'0004003000009802'});
 assert.deepEqual(packs.dialogmask.resourceSources.layouts.DlgMask_D_00,{path:'dialogmask_LZ.bin/blyt/DlgMask_D_00.bclyt',sha256:'45ffaa6a0379423844784ffd3e450b5f3e2bf46e1724484a234b40ca73afbc86',titleId:'0004003000009802'});
 assert.deepEqual(packs.dialogmask.resourceSources.animations.DlgMask_U_00_FadeIn,{path:'dialogmask_LZ.bin/anim/DlgMask_U_00_FadeIn.bclan',sha256:'400bd1588c04d175c54104110c004f32dc96dd82d0a7cd9d9f0b8da8b2734fe4',titleId:'0004003000009802'});
 assert.deepEqual(packs.dialogmask.resourceSources.animations.DlgMask_D_00_FadeIn,{path:'dialogmask_LZ.bin/anim/DlgMask_D_00_FadeIn.bclan',sha256:'400bd1588c04d175c54104110c004f32dc96dd82d0a7cd9d9f0b8da8b2734fe4',titleId:'0004003000009802'});
 assert.deepEqual(packs.dialog.resourceSources.animations.Dlg_A_D_02_FadeOut00,{path:'dialog_LZ.bin/anim/Dlg_A_D_02_FadeOut00.bclan',sha256:'d2ac804d59218030a877cca1aaf59c6ca198534f90436fe31c61c7e929a62c81',titleId:'0004003000009802'});
 assert.deepEqual(packs.dialogmask.resourceSources.animations.DlgMask_D_00_FadeOut00,{path:'dialogmask_LZ.bin/anim/DlgMask_D_00_FadeOut00.bclan',sha256:'ba904f4847d045d8389e33fdf440af2fa5ddd6886d3d0ef4df2cc799dbbaf50a',titleId:'0004003000009802'});
 const bank=packs.messages.messages.menu_msbt_LZ,index=bank.labels[source.message.label];
 assert.deepEqual(bank.messages[index],{styleIndex:25,text:'Closing software...',tokens:[{text:'Closing software...'}]});
 assert.deepEqual(packs.messages.resourceSources.messages.menu_msbt_LZ,{path:'RomFS/message/EU_English/menu_msbt_LZ.bin',sha256:'1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350',titleId:'0004003000009802'});
});

test('unsupported source gaps fail before drawing and draw failures reject paired publication',()=>{
 for(const remove of [
  p=>delete p.dialog.layouts.Dlg_A_D_00,p=>delete p.dialogmask.layouts.DlgMask_D_00,
  p=>delete p.dialogmask.animations.DlgMask_D_00_FadeIn,p=>delete p.dialog.animations.Dlg_A_D_02_FadeIn,
  p=>delete p.messages.messages.menu_msbt_LZ.labels.lau_dlg_quit4,
 ]){
  const source=structuredClone(packs);remove(source);const r=renderer(source);
  assert.throws(()=>drawHomeSoftwareClosingDialog(r,{},{}),/unavailable/);assert.equal(r.calls.length,0);
 }
 for(const remove of [p=>delete p.dialog.animations.Dlg_A_D_02_FadeOut00,p=>delete p.dialogmask.animations.DlgMask_D_00_FadeOut00]){
  const source=structuredClone(packs);remove(source);const r=renderer(source);
  assert.throws(()=>drawHomeSoftwareClosingDialog(r,{}, {},20,0),/unavailable/);assert.equal(r.calls.length,0);
 }
 const r=renderer();r.draw=()=>false;assert.throws(()=>drawHomeSoftwareClosingDialog(r,{},{}),/draw failed/);
});
