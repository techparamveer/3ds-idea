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
const {drawNativeSettingsMain,settingsOpenBlocksText,SETTINGS_PORTFOLIO_SD_OPEN_BLOCKS,SETTINGS_OPEN_BLOCKS_DISPLAY_LIMIT}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));

const firmware=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
const pack=name=>JSON.parse(readFileSync(new URL('packs/settings/contents/0000-0000003d/'+name+'.json',firmware)));
const flatten=panes=>panes.flatMap(pane=>[pane,...flatten(pane.children??[])]);
const softwareView={appId:'system-settings',screen:'detail',heading:'software',rows:[],selection:0,data:{field:'software',parent:'data-3ds'},footer:{left:{action:'back',label:'Back'}}};

test('Open Blocks pane and shared font keep dump provenance',()=>{
 const up=pack('up');
 const layout=up.layouts.SMng_U_01;
 const pane=flatten(layout.roots).find(item=>item.name==='TextBox_05');
 assert.deepEqual(up.resourceSources.layouts.SMng_U_01,{
  contentId:'0000003d',contentIndex:0,path:'up_LZ.bin/blyt/SMng_U_01.bclyt',
  sha256:'a644e5620b65fbae9cc8ce47fcb17ddb7466afb49362f942a49955ba5b4f60c5',titleId:'0004001000022000',
 });
 assert.deepEqual(layout.fonts,['cbf_std.bcfnt']);
 assert.equal(pane.kind,'txt1');
 assert.equal(pane.origin,4);
 assert.equal(pane.text.font,0);
 assert.equal(pane.text.alignment,4);
 assert.equal(pane.text.lineAlignment,2);
 assert.deepEqual(pane.text.size,[25,30]);
 assert.deepEqual(pane.size,[120,36]);
 assert.equal(pane.text.capacity,14);
 assert.equal(pane.text.value,'888888');
 const font=JSON.parse(readFileSync(new URL('fonts/shared/font.json',firmware),'utf8'));
 assert.equal(font.sourceSha256,'95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581');
 for(const char of ['6','5',',','3'])assert.ok(font.glyphs[String(char.codePointAt(0))],char);
});

test('empty-SD Open Blocks fixture formats the captured EUR English string',()=>{
 assert.equal(SETTINGS_PORTFOLIO_SD_OPEN_BLOCKS,65536);
 assert.equal(SETTINGS_OPEN_BLOCKS_DISPLAY_LIMIT,0xf423f);
 assert.equal(settingsOpenBlocksText(),'65,536');
 assert.equal(settingsOpenBlocksText(65536),'65,536');
 assert.equal(settingsOpenBlocksText(SETTINGS_OPEN_BLOCKS_DISPLAY_LIMIT+1),'999,999');
});

test('Software and Extra Data assign TextBox_05 through the native pane path',()=>{
 const packs={base:pack('base'),up:pack('up'),layout:pack('layout'),button:pack('button'),messages:pack('message_EU'),hud:pack('hud')};
 for(const field of ['software','extra-data']){
  const calls=[];
  const renderer={packs,measureSingleLineText(){return 0;},draw(_ctx,alias,name,options={}){
   calls.push({alias,name,options});
   for(const attachment of Object.values(options.attachments??{}))attachment();
   return true;
  }};
  assert.equal(drawNativeSettingsMain(renderer,{}, {},{...softwareView,data:{...softwareView.data,field},heading:field},false,new Date(2026,8,26,15,4)),true);
  const upper=calls.find(call=>call.name==='SMng_U_01');
  assert.ok(upper,field);
  assert.deepEqual(upper.options.bindings,[{name:'SMng_U_01_NonSD',frame:1}]);
  assert.equal(upper.options.overrides.TextBox_05.text,'65,536');
  assert.equal(upper.options.overrides.TextBox_05.fontSize,undefined);
  assert.equal(upper.options.overrides.TextBox_04.text,'Open Blocks');
 }
});
