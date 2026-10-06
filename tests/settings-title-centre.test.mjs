import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const settingsUrl=new URL('../src/os/stock-native-settings.ts',import.meta.url);
const compiled=ts.transpileModule(readFileSync(settingsUrl,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
 .replace("'./stock-settings-navigation'",JSON.stringify(new URL('../src/os/stock-settings-navigation.ts',import.meta.url).href))
 .replace("'./native-layout'",JSON.stringify(new URL('../src/os/native-layout.ts',import.meta.url).href))
 .replace("'./device-status-profile.ts'",JSON.stringify(new URL('../src/os/device-status-profile.ts',import.meta.url).href))
 .replace("'./device-status-profile'",JSON.stringify(new URL('../src/os/device-status-profile.ts',import.meta.url).href));
const {drawNativeSettingsMain,settingsTitleGroupX}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));

const firmware=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
const pack=name=>JSON.parse(readFileSync(new URL('packs/settings/contents/0000-0000003d/'+name+'.json',firmware)));
const font=JSON.parse(readFileSync(new URL('fonts/shared/font.json',firmware),'utf8'));
const up=pack('up');
const messages=pack('message_EU');
const bank=messages.messages.mset;
const styles=messages.styles[bank.styleTable].styles;
const flatten=panes=>panes.flatMap(pane=>[pane,...flatten(pane.children??[])]);
const panes=name=>flatten(up.layouts.CommonBG_U_00.roots).filter(pane=>pane.name===name);
const f=Math.fround;
const measure=(text,style)=>{
 const scale=f((font.width??font.height)*style.fontScale[0]/(font.width??font.height));
 let width=0;
 for(const char of text){
  const glyph=font.glyphs[String(char.codePointAt(0))]??font.fallback;
  width=f(width+f((glyph?.advance??0)*scale));
 }
 return width;
};
const groupX=width=>{
 const icon=panes('Icon')[0],title=panes('TextBoxTitle_00')[0],group=panes('Null_Title')[0];
 return settingsTitleGroupX(group.translation[0],icon.translation[0],icon.size[0],title.translation[0],width);
};
const titleOf=label=>{
 const message=bank.messages[bank.labels[label]];
 return {text:message.text,style:styles[message.styleIndex],x:groupX(measure(message.text,styles[message.styleIndex]))};
};
const packs={base:pack('base'),up,layout:pack('layout'),button:pack('button'),messages,hud:pack('hud')};
const measureFor=text=>measure(text.value,text.messageStyle??{fontScale:[text.size[0]/(font.width??font.height)]});
const renderer=()=>{
 const calls=[];
 return {calls,packs,measureSingleLineText(_font,text){return measureFor(text);},draw(_ctx,alias,name,options={}){
  calls.push({alias,name,options});
  for(const attachment of Object.values(options.attachments??{}))attachment();
  return true;
 }};
};
const view={appId:'system-settings',heading:'',rows:[],selection:0,footer:{left:{action:'back',label:'Back'}}};

const expected={
 settings_title:titleOf('settings_title'),
 dat_title_u:titleOf('dat_title_u'),
 dat_sof_title_u:titleOf('dat_sof_title_u'),
 dat_opt_title_u:titleOf('dat_opt_title_u'),
 parental_title_u:titleOf('parental_title_u'),
 net_top_title:titleOf('net_top_title'),
 net_set_title:titleOf('net_set_title'),
 user_info_title:titleOf('user_info_title'),
 date_time_title:titleOf('date_time_title'),
 sound_title:titleOf('sound_title'),
 language:titleOf('language'),
};

test('CommonBG_U_00 title panes keep dump geometry used by 0x2232b4',()=>{
 const icon=panes('Icon')[0],title=panes('TextBoxTitle_00')[0],group=panes('Null_Title')[0];
 assert.deepEqual(up.resourceSources.layouts.CommonBG_U_00,{
  contentId:'0000003d',contentIndex:0,path:'up_LZ.bin/blyt/CommonBG_U_00.bclyt',
  sha256:'a298448098578ecbbaf195fc5b87a76ac7483a363ad5196aaa212b351362f56d',titleId:'0004001000022000',
 });
 assert.deepEqual(group.translation,[-0,-0,0]);
 assert.deepEqual(icon.translation,[-174,82,5]);
 assert.deepEqual(icon.size,[32,32]);
 assert.equal(icon.origin,4);
 assert.deepEqual(title.translation,[-150,82,5]);
 assert.equal(title.origin,3);
 assert.equal(title.text.alignment,3);
 assert.equal(title.text.lineAlignment,0);
 assert.equal(title.text.characterSpacing??0,0);
 assert.equal(flatten(up.layouts.CommonBG_U_00.roots).filter(pane=>pane.text).map(pane=>pane.name).join(),'TextBoxTitle_00');
 assert.equal(icon.picture,undefined);
 assert.equal(font.sourceSha256,'95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581');
 for(const name of ['IconBasic','IconDataMa','IconNet','IconParental']){
  const pictures=flatten(up.layouts[name].roots).filter(pane=>pane.picture).map(pane=>pane.name);
  assert.deepEqual(pictures,['Icon_Shdw','Icon']);
  assert.equal(flatten(up.layouts[name].roots).some(pane=>pane.text),false,name);
 }
});

test('source title widths change Null_Title X; Other Settings stays 95.2',()=>{
 assert.equal(expected.settings_title.text,'Other Settings');
 assert.equal(expected.settings_title.style.fontScale[0],0.8500000238418579);
 assert.equal(measure(expected.settings_title.text,expected.settings_title.style),149.60000610351562);
 assert.equal(expected.settings_title.x,95.19999694824219);
 assert.equal(expected.dat_sof_title_u.text,'Software Management');
 assert.equal(expected.dat_sof_title_u.x,54.399993896484375);
 assert.equal(expected.dat_opt_title_u.text,'Extra Data Management');
 assert.equal(expected.dat_title_u.text,'Data Management');
 assert.ok(expected.dat_sof_title_u.x<expected.dat_title_u.x);
 assert.ok(expected.dat_title_u.x<expected.settings_title.x);
 assert.equal(settingsTitleGroupX(0,-174,32,-150,100),120);
});

test('every CommonBG_U_00 Settings page binds 0x2232b4 and the Other title raster',()=>{
 const cases=[
  [{...view,screen:'other',heading:'Other Settings',rows:[{id:'profile',label:'Profile'}],data:{page:0,selectionActive:false}},'settings_title'],
  [{...view,screen:'data',heading:'Data Management',rows:[{id:'data-3ds',label:'Nintendo 3DS'}]},'dat_title_u'],
  [{...view,screen:'data-3ds',heading:'Nintendo 3DS',rows:[{id:'software',label:'Software'}]},'dat_title_u'],
  [{...view,screen:'detail',heading:'software',rows:[],data:{field:'software',parent:'data-3ds'}},'dat_sof_title_u'],
  [{...view,screen:'detail',heading:'extra-data',rows:[],data:{field:'extra-data',parent:'data-3ds'}},'dat_opt_title_u'],
  [{...view,screen:'parental',heading:'Parental Controls',rows:[{id:'next',label:'Set'}]},'parental_title_u'],
  [{...view,screen:'internet',heading:'Internet Settings',rows:[{id:'connections',label:'Connection Settings'}]},'net_top_title'],
  [{...view,screen:'connections',heading:'Connection Settings',rows:[{id:'connection-1',label:'1'}]},'net_set_title'],
  [{...view,screen:'profile',heading:'Profile',rows:[{id:'nickname',label:'User Name'}]},'user_info_title'],
  [{...view,screen:'clock',heading:'Date & Time',rows:[{id:'date',label:'Date'}]},'date_time_title'],
  [{...view,screen:'detail',heading:'sound',rows:[],data:{field:'sound',parent:'other'}},'sound_title'],
  [{...view,screen:'detail',heading:'language',rows:[],data:{field:'language',parent:'other',settings:{language:'English'}}},'language'],
 ];
 for(const [page,label] of cases){
  const host=renderer();
  assert.equal(drawNativeSettingsMain(host,{}, {},page,false,new Date(2026,9,6,16,0)),true,label);
  const title=host.calls.find(call=>call.name==='CommonBG_U_00');
  assert.ok(title,label);
  assert.equal(title.options.overrides.TextBoxTitle_00.text,expected[label].text,label);
  assert.deepEqual(title.options.overrides.Null_Title,{translation:[expected[label].x,-0,0]},label);
  assert.equal(title.options.textSampling,'lcd',label);
  assert.equal(title.options.textCoverageAdaptation,'azahar-12p4-fit',label);
  const icon=host.calls.find(call=>call.alias==='up'&&call.name!=='CommonBG_U_00'&&call.name.startsWith('Icon'));
  assert.ok(icon,label);
  assert.equal(icon.options.textSampling,undefined,label);
  assert.equal(icon.options.textCoverageAdaptation,undefined,label);
  assert.equal(icon.options.pictureSampling,undefined,label);
 }
});

test('Settings main and DS Profile do not take the CommonBG_U_00 title group',()=>{
 const main=renderer();
 assert.equal(drawNativeSettingsMain(main,{}, {},{
  ...view,screen:'main',heading:'System Settings',
  rows:['internet','parental','data','other','nnid'].map(id=>({id,label:id})),
 },false,new Date(2026,9,6,16,0)),true);
 assert.equal(main.calls.some(call=>call.name==='CommonBG_U_00'),false);
 assert.equal(main.calls.find(call=>call.name==='TopText_U_00').options.overrides.Null_Title,undefined);
 const ds=renderer();
 assert.equal(drawNativeSettingsMain(ds,{}, {},{
  ...view,screen:'detail',heading:'ds-profile',rows:[],data:{field:'ds-profile',parent:'profile'},
 },false,new Date(2026,9,6,16,0)),true);
 assert.equal(ds.calls.some(call=>call.name==='CommonBG_U_00'),false);
 assert.ok(ds.calls.some(call=>call.name==='LsCommonBG_U_00'));
});
