import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {poseNativeLayout} from '../src/os/native-layout.ts';

const settingsUrl=new URL('../src/os/stock-native-settings.ts',import.meta.url);
const compiled=ts.transpileModule(readFileSync(settingsUrl,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
 .replace("'./stock-settings-navigation'",JSON.stringify(new URL('../src/os/stock-settings-navigation.ts',import.meta.url).href))
 .replace("'./native-layout'",JSON.stringify(new URL('../src/os/native-layout.ts',import.meta.url).href))
 .replace("'./device-status-profile.ts'",JSON.stringify(new URL('../src/os/device-status-profile.ts',import.meta.url).href))
 .replace("'./device-status-profile'",JSON.stringify(new URL('../src/os/device-status-profile.ts',import.meta.url).href));
const {drawNativeSettingsMain,settingsDirectButtonClip,settingsTitleGroupX}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));

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
 const renderer={packs,measureSingleLineText(){return 149.60000610351562;},draw(_ctx,alias,name,options={}){
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

test('Other page 2 keeps source mounts; Special_00 Scroll pitch is not a settled owner',()=>{
 const packs={base:pack('base'),up:pack('up'),layout:pack('layout'),button:pack('button'),messages:pack('message_EU'),hud:pack('hud')};
 const parent=packs.layout.layouts.BasicTop_D_00;
 const names=[];
 const walk=nodes=>{for(const node of nodes){names.push(node.name);walk(node.children);}};
 walk(parent.roots);
 assert.ok(names.indexOf('Scroll')<names.indexOf('Arrow'),'source paints adjacent pages under the arrows');
 assert.equal(panes(parent.roots,'Null_LeftPage')[0].translation[0],-276);
 assert.equal(panes(parent.roots,'Null_RightPage')[0].translation[0],276);
 const scrollBg=panes(parent.roots,'ScrollBg')[0];
 const window00=panes(parent.roots,'Window_00')[0];
 assert.equal(scrollBg.translation[0],270);
 assert.equal(scrollBg.translation[1],5);
 assert.equal(window00.translation[0],6);
 assert.equal(window00.translation[1],-6);
 assert.deepEqual(window00.size,[830,152]);
 const special=packs.layout.animations.BasicTop_D_00_Special_00;
 const specialIn=packs.layout.animations.BasicTop_D_00_SpecialIn_00;
 const last=(clip,target,property)=>clip.tracks.find(track=>track.target===target&&track.property===property).keys.at(-1).value;
 assert.equal(last(special,'ScrollBg','translation.x'),-6);
 assert.equal(last(special,'Scroll','translation.x'),-276);
 assert.equal(last(specialIn,'ScrollBg','translation.x'),270);
 assert.equal(last(specialIn,'Scroll','translation.x'),0);
 assert.equal(last(specialIn,'N_R_ArrowL_00','translation.x'),-180);
 const arrow=packs.button.layouts.R_ArrowL;
 assert.equal(panes(arrow.roots,'P_arwL_00')[0].alpha,210);
 assert.equal(panes(arrow.roots,'W_arwShdwL_00')[0].alpha,60);
 const calls=[];
 const renderer={packs,measureSingleLineText(){return 149.60000610351562;},draw(_ctx,alias,name,options={}){
  calls.push({alias,name,options});
  for(const attachment of Object.values(options.attachments??{}))attachment();
  return true;
 }};
 const view={appId:'system-settings',screen:'other',heading:'Other Settings',rows:[
  {id:'calibration-3d',label:'3D Calibration'},{id:'sound',label:'Sound'},{id:'mic',label:'Mic Test'},
 ],selection:0,data:{page:1,selectionActive:false},footer:{left:{action:'back',label:'Back'}}};
 assert.equal(drawNativeSettingsMain(renderer,{}, {},view,false,new Date(2026,8,26,21,40,5,978)),true);
 const layout=calls.find(call=>call.name==='BasicTop_D_00');
 assert.deepEqual(layout.options.bindings,[{name:'BasicTop_D_00_SpecialIn_00',frame:1}]);
 assert.deepEqual(layout.options.overrides,{ScrollBg:{translation:[-6,5,0]}});
 assert.equal(layout.options.overrides.Scroll,undefined,'Special_00 Scroll −276 is the transition clip, not a settled bind');
 const left=calls.filter(call=>['I_User','I_Date','I_Touch'].includes(call.name));
 assert.deepEqual(left.map(call=>[call.name,call.options.center]),[
  ['I_User',[160,76]],['I_Date',[160,124]],['I_Touch',[160,172]],
 ]);
 assert.ok(left.every(call=>call.options.bindings[0].frame===0));
 const right=calls.filter(call=>['I_Ocam','I_AnalogPad','I_Trans'].includes(call.name));
 assert.deepEqual(right.map(call=>[call.name,call.options.center]),[
  ['I_Ocam',[160,76]],['I_AnalogPad',[160,124]],['I_Trans',[160,172]],
 ]);
 const current=calls.filter(call=>['I_3DTest','I_Sound','I_Mic'].includes(call.name));
 assert.equal(current.length,3);
 assert.ok(current.every(call=>call.options.center===undefined));
 const arrowCall=calls.find(call=>call.name==='R_ArrowL');
 assert.deepEqual(arrowCall.options.bindings,[{name:'R_ArrowL_Appear',frame:0}]);
});


test('source title centering uses measured advances rather than an integer placement fit',()=>{
 const up=pack('up').layouts.CommonBG_U_00;
 const icon=panes(up.roots,'Icon')[0],title=panes(up.roots,'TextBoxTitle_00')[0],group=panes(up.roots,'Null_Title')[0];
 assert.equal(settingsTitleGroupX(group.translation[0],icon.translation[0],icon.size[0],title.translation[0],149.60000610351562),95.19999694824219);
 assert.equal(settingsTitleGroupX(0,-174,32,-150,100),120,'different source title width changes centering');
});
