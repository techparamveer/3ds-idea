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
const {drawNativeSettingsMain,settingsDirectButtonClip,settingsScreenPacks}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));

const root=new URL('../public/os/firmware/10.7.0-32E/packs/settings/contents/0000-0000003d/',import.meta.url);
const pack=name=>JSON.parse(readFileSync(new URL(name+'.json',root)));
const panes=(roots,name)=>roots.flatMap(node=>[node,...panes(node.children,name)]).filter(node=>node.name===name);

test('published button pack requests B_L_Invalid for the empty blocked-user Reset',()=>{
 const button=settingsScreenPacks.find(item=>item.alias==='button');
 assert.ok(button.animations.includes('B_L_Invalid'));
 assert.ok(button.layouts.includes('B_S'));
});

test('B_L_Invalid frame 1 shows B_S N_Invalid chrome and hides enabled N_Picture',()=>{
 const button=pack('button');
 const layout=button.layouts.B_S;
 const clip=settingsDirectButtonClip(layout,button.animations.B_L_Invalid);
 assert.deepEqual(clip.shares,[]);
 const disabled=poseNativeLayout(layout,{clip},[{name:'clip',frame:1}]);
 const enabled=poseNativeLayout(layout,{clip},[{name:'clip',frame:0}]);
 assert.equal(panes(disabled.roots,'N_Invalid')[0].flags&1,1);
 assert.equal(panes(disabled.roots,'N_Picture')[0].flags&1,0);
 assert.equal(panes(enabled.roots,'N_Invalid')[0].flags&1,0);
 assert.equal(panes(enabled.roots,'N_Picture')[0].flags&1,1);
 const invalid=panes(layout.roots,'N_Invalid')[0];
 assert.deepEqual(invalid.children.map(child=>child.name),[
  'B_LInvalid01_00','B_LInvalid01_01','B_LInvalid01_02','B_LInvalid01_03','B_LInvalid03_00','B_LInvalid03_01','Window_00',
 ]);
});

test('Data root touch-entry paints white 3DS/DSi tiles and Invalid Reset',()=>{
 const packs={base:pack('base'),up:pack('up'),layout:pack('layout'),button:pack('button'),messages:pack('message_EU'),hud:pack('hud')};
 const calls=[];
 const renderer={packs,measureSingleLineText(){return 0;},draw(_ctx,alias,name,options={}){
  calls.push({alias,name,options});
  for(const attachment of Object.values(options.attachments??{}))attachment();
  return true;
 }};
 const view={appId:'system-settings',screen:'data',heading:'Data Management',rows:[
  {id:'data-3ds',label:'Nintendo 3DS'},{id:'data-dsi',label:'Nintendo DSiWare'},
  {id:'streetpass',label:'StreetPass Management'},{id:'blocked-users',label:'Reset blocked-user settings',disabled:true},
 ],selection:0,data:{selectionActive:false},footer:{left:{action:'back',label:'Back'}}};
 assert.equal(drawNativeSettingsMain(renderer,{}, {},view,false,new Date(2026,8,26,14,57)),true);
 const tiles=calls.filter(call=>['B_SMngCTRO','B_SMngDSiO','B_M','B_S'].includes(call.name));
 assert.deepEqual(tiles.map(call=>[call.name,call.options.bindings[0]]),[
  ['B_SMngCTRO',{name:'B_SMngCTRO_DirectSettings',frame:0}],
  ['B_SMngDSiO',{name:'B_SMngDSiO_DirectSettings',frame:0}],
  ['B_M',{name:'B_L_DirectSettings',frame:0}],
  ['B_S',{name:'B_L_Invalid_DirectSettings',frame:1}],
 ]);
});

test('Internet touch-entry keeps Connection Settings on Select frame 0',()=>{
 const packs={base:pack('base'),up:pack('up'),layout:pack('layout'),button:pack('button'),messages:pack('message_EU'),hud:pack('hud')};
 const calls=[];
 const renderer={packs,measureSingleLineText(){return 0;},draw(_ctx,alias,name,options={}){
  calls.push({alias,name,options});
  for(const attachment of Object.values(options.attachments??{}))attachment();
  return true;
 }};
 const view={appId:'system-settings',screen:'internet',heading:'Internet Settings',rows:[
  {id:'connections',label:'Connection Settings'},{id:'spotpass',label:'SpotPass'},
  {id:'ds-connections',label:'Nintendo DS Connections'},{id:'internet-info',label:'Other Information'},
 ],selection:0,data:{selectionActive:false},footer:{left:{action:'back',label:'Back'}}};
 assert.equal(drawNativeSettingsMain(renderer,{}, {},view,false,new Date(2026,8,26,14,55)),true);
 const connection=calls.find(call=>call.name==='B_LBlue');
 assert.deepEqual(connection.options.bindings,[{name:'B_LBlue_DirectSettings',frame:0}]);
});
