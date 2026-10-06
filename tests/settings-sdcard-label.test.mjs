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
const {drawNativeSettingsMain}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const {nativeTextWriterFlags}=await import('../src/os/bitmap-font.ts');

const firmware=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
const pack=name=>JSON.parse(readFileSync(new URL('packs/settings/contents/0000-0000003d/'+name+'.json',firmware)));
const font=JSON.parse(readFileSync(new URL('fonts/shared/font.json',firmware),'utf8'));
const flatten=panes=>panes.flatMap(pane=>[pane,...flatten(pane.children??[])]);
const up=pack('up');
const layout=up.layouts.SMng_U_01;
const panes=Object.fromEntries(flatten(layout.roots).filter(pane=>pane.text).map(pane=>[pane.name,pane]));

test('SMng_U_01 SD Card pane is writer-0x101 at a half-pixel LCD left',()=>{
 assert.deepEqual(up.resourceSources.layouts.SMng_U_01,{
  contentId:'0000003d',contentIndex:0,path:'up_LZ.bin/blyt/SMng_U_01.bclyt',
  sha256:'a644e5620b65fbae9cc8ce47fcb17ddb7466afb49362f942a49955ba5b4f60c5',titleId:'0004001000022000',
 });
 assert.deepEqual(layout.fonts,['cbf_std.bcfnt']);
 assert.equal(font.sourceSha256,'95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581');
 assert.equal(font.colorMode,'alpha');
 const pane=panes.TextBox_03;
 assert.equal(pane.kind,'txt1');
 assert.equal(pane.origin,4);
 assert.deepEqual(pane.size,[269,24]);
 assert.deepEqual(pane.translation,[-30,34,0]);
 assert.equal(pane.text.alignment,3);
 assert.equal(pane.text.lineAlignment,2);
 assert.equal(pane.text.characterSpacing??0,0);
 assert.equal(nativeTextWriterFlags(3,2),0x101);
 const left=200+(-30)+(-269*(4%3)/2);
 assert.equal(left,35.5);
 for(const char of 'SD Card'){
  const glyph=font.glyphs[String(char.codePointAt(0))]??font.fallback;
  assert.ok(glyph,char);
  assert.ok(glyph.left>=0,char);
 }
 assert.equal(panes.TextBox_04.text.alignment,5);
 assert.equal(panes.TextBox_04.text.lineAlignment,0);
 assert.equal(panes.TextBox_05.text.alignment,4);
 assert.equal(panes.TextBox_00.text.alignment,4);
 assert.match(panes.TextBox_00.text.value,/\n/);
});

test('Software and Extra Data LCD-sample only TextBox_03',()=>{
 const packs={base:pack('base'),up,layout:pack('layout'),button:pack('button'),messages:pack('message_EU'),hud:pack('hud')};
 for(const field of ['software','extra-data']){
  const calls=[];
  const renderer={packs,measureSingleLineText(){return 0;},draw(_ctx,alias,name,options={}){
   calls.push({alias,name,options});
   for(const attachment of Object.values(options.attachments??{}))attachment();
   return true;
  }};
  assert.equal(drawNativeSettingsMain(renderer,{}, {},{
   appId:'system-settings',screen:'detail',heading:field,rows:[],selection:0,
   data:{field,parent:'data-3ds'},footer:{left:{action:'back',label:'Back'}},
  },false,new Date(2026,9,6,15,4)),true,field);
  const upper=calls.find(call=>call.name==='SMng_U_01');
  const title=calls.find(call=>call.name==='CommonBG_U_00');
  assert.equal(upper.options.textSampling,'lcd',field);
  assert.deepEqual(upper.options.textSamplingPanes,['TextBox_03'],field);
  assert.equal(upper.options.textCoverageAdaptation,undefined,field);
  assert.equal(upper.options.overrides.TextBox_03.text,'SD Card',field);
  assert.equal(upper.options.overrides.TextBox_04.text,'Open Blocks',field);
  assert.equal(title.options.textSampling,'lcd',field);
  assert.equal(title.options.textCoverageAdaptation,'azahar-12p4-fit',field);
 }
});
