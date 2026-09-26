import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {poseNativeLayout} from '../src/os/native-layout.ts';

const settingsUrl=new URL('../src/os/stock-native-settings.ts',import.meta.url);
const compiled=ts.transpileModule(readFileSync(settingsUrl,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
 .replace("'./stock-settings-navigation'",JSON.stringify(new URL('../src/os/stock-settings-navigation.ts',import.meta.url).href))
 .replace("'./native-layout'",JSON.stringify(new URL('../src/os/native-layout.ts',import.meta.url).href));
const {drawNativeSettingsMain,settingsDirectButtonClip}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));

const root=new URL('../public/os/firmware/10.7.0-32E/packs/settings/contents/0000-0000003d/',import.meta.url);
const pack=name=>JSON.parse(readFileSync(new URL(name+'.json',root)));
const panes=(roots,name)=>roots.flatMap(node=>[node,...panes(node.children,name)]).filter(node=>node.name===name);

test('selected Other Settings page uses the native raised Decide endpoint',()=>{
 const button=pack('button');
 const layout=button.layouts.T_Page01;
 const decide=settingsDirectButtonClip(layout,button.animations.T_Page01_Decide);
 const select=settingsDirectButtonClip(layout,button.animations.T_Page01_Select);
 const raised=poseNativeLayout(layout,{decide},[{name:'decide',frame:1}]);
 const pressed=poseNativeLayout(layout,{select},[{name:'select',frame:1}]);
 assert.equal(panes(raised.roots,'BtnShdw')[0].flags&1,1);
 assert.equal(panes(pressed.roots,'BtnShdw')[0].flags&1,0);
 assert.equal(panes(raised.roots,'B_Page')[0].translation[1],0);
 assert.equal(panes(pressed.roots,'B_Page')[0].translation[1],-1);
 const packs={base:pack('base'),up:pack('up'),layout:pack('layout'),button,messages:pack('message_EU'),hud:pack('hud')};
 const calls=[];
 const renderer={packs,draw(_ctx,alias,name,options={}){
  calls.push({alias,name,options});
  for(const attachment of Object.values(options.attachments??{}))attachment();
  return true;
 }};
 const view={appId:'system-settings',screen:'other',heading:'Other Settings',rows:[
  {id:'profile',label:'Profile'},{id:'clock',label:'Date & Time'},{id:'touch',label:'Touch Screen'},
 ],selection:0,data:{page:0,selectionActive:false},footer:{left:{action:'back',label:'Back'}}};
 assert.equal(drawNativeSettingsMain(renderer,{}, {},view,false,new Date(2026,8,26,2,22)),true);
 for(const name of ['I_Date','I_Touch']){
  const layout=packs.button.layouts[name],clip=packs.button.animations[name+'_DirectSettings'];
  const posed=poseNativeLayout(layout,{clip},[{name:'clip',frame:0}]);
  for(const edge of ['I_User_L_02','I_User_L_03']){
   assert.equal(panes(posed.roots,edge)[0].size[0],panes(layout.roots,edge)[0].size[0],`${name}/${edge} retains its source width`);
  }
 }
 assert.deepEqual(calls.filter(call=>['I_User','I_Date','I_Touch'].includes(call.name)).map(call=>call.options.bindings[0].name),
  ['I_User_DirectSettings','I_Date_DirectSettings','I_Touch_DirectSettings']);
 const tabs=calls.filter(call=>/^T_Page0[1-4]$/.test(call.name));
 assert.equal(tabs.length,4);
 assert.deepEqual(tabs.map(call=>call.options.bindings[0]),[
  {name:'T_Page01_Decide_DirectSettings',frame:1},
  {name:'T_Page01_DirectSettings',frame:0},
  {name:'T_Page01_DirectSettings',frame:0},
  {name:'T_Page01_DirectSettings',frame:0},
 ]);
 const parent=packs.layout.layouts.BasicTop_D_00;
 const right=panes(parent.roots,'Null_RightPage')[0];
 assert.deepEqual(right.translation,[276,0,0]);
 const rowOffsets=['N_I_Button_00','N_I_Button_01','N_I_Button_02'].map(name=>panes(parent.roots,name)[0].translation[1]);
 assert.deepEqual(rowOffsets,[44,-4,-52]);
 const neighbor=calls.filter(call=>['I_3DTest','I_Sound','I_Mic'].includes(call.name));
 assert.deepEqual(neighbor.map(call=>[call.name,call.options.center]),[
  ['I_3DTest',[160,76]],['I_Sound',[160,124]],['I_Mic',[160,172]],
 ]);
 assert.ok(neighbor.every(call=>call.options.bindings[0].frame===0));
 assert.deepEqual(neighbor.map(call=>call.options.bindings[0].name),
  ['I_3DTest_DirectSettings','I_Sound_DirectSettings','I_Mic_DirectSettings']);
});
