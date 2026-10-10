import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { appletEntryBindings, appletEntryOverrides } from '../src/os/applet-entry-assets.ts';
const root=new URL('../public/os/firmware/10.7.0-32E/packs/home/',import.meta.url);
const json=name=>JSON.parse(readFileSync(new URL(name,root)));
const common=json('common.json'),messages=json('messages-and-loose.json'),launcher=json('launcher.json');
const data=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const sourceUrl=new URL('../src/os/firmware-presentation.ts',import.meta.url);
const {outputText}=ts.transpileModule(readFileSync(sourceUrl,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const {createFirmwareHome}=await import(data(outputText.replace(/(from\s*['"])(\.[^'"]+)(['"])/g,(_all,prefix,path,suffix)=>prefix+(path==='./native-renderer'?data('export class NativeLayoutRenderer {}'):new URL(path.endsWith('.ts')?path:`${path}.ts`,sourceUrl).href)+suffix)));
const ids=['game-notes','friends','notifications','browser','miiverse'];

test('actual Notifications footer cover uses selected HOME common resources and fails on either unavailable LCD or label',()=>{
 const draws=[],top={},bottom={},presenter=createFirmwareHome({renderer:{packs:{common,messages,launcher},draw(ctx,bank,name,options){draws.push({ctx,bank,name,options});return true;}}});
 for(const kind of ['out','in'])for(const frame of [0,20]){
  assert.equal(presenter.notificationsFooterCover(top,bottom,kind,frame),true);
  const [upper,lower]=draws.slice(-2);
  assert.deepEqual([upper.ctx,upper.bank,upper.name,upper.options.bindings],[top,'common','CmnFade_U_00',[{name:'CmnFade_U_00_'+(kind==='out'?'SceneOut':'SceneIn'),frame}]]);
  assert.deepEqual([lower.ctx,lower.bank,lower.name,lower.options.bindings],[bottom,'common','CmnFade_D_00',[{name:'CmnFade_D_00_Aplt',frame:6},{name:'CmnFade_D_00_'+(kind==='out'?'SceneOut':'SceneIn'),frame}]]);
  assert.equal(lower.options.overrides.T_Aplt_00.text,'HOME Menu');
 }
 for(const refused of ['CmnFade_U_00','CmnFade_D_00']){
  const broken=createFirmwareHome({renderer:{packs:{common,messages,launcher},draw:(_ctx,_bank,name)=>name!==refused}});
  assert.equal(broken.notificationsFooterCover(top,bottom,'out',20),false);
 }
 const absent=structuredClone(messages);delete absent.messages.menu_msbt_LZ.labels.lau_title_menu;
 const noLabel=createFirmwareHome({renderer:{packs:{common,messages:absent,launcher},draw:()=>true}});
 assert.throws(()=>noLabel.notificationsFooterCover(top,bottom,'out',0),/label/);
});

test('actual painter composes each outgoing selector and Browser/Miiverse common incoming over both caller LCDs',()=>{
 const before=JSON.stringify(common),draws=[],presenter=createFirmwareHome({renderer:{packs:{common,messages,launcher},draw(ctx,bank,name,options){draws.push({ctx,bank,name,options});return true;}}});
 for(const appId of ids)for(const phase of ['out',...(['browser','miiverse'].includes(appId)?['in']:[])])for(const frame of [0,20]){
  assert.equal(presenter.appletEntry('upper','lower',{appId,phase,frame}),true);
  const [upper,lower]=draws.slice(-2),bindings=appletEntryBindings({appId,phase,frame});
  assert.deepEqual([upper.ctx,upper.bank,upper.name,upper.options],['upper','common','CmnFade_U_00',{bindings:bindings.upper,opaquePictureAlphaPanes:['P_Bg_U_00']}]);
  assert.deepEqual([lower.ctx,lower.bank,lower.name,lower.options],['lower','common','CmnFade_D_00',{bindings:bindings.lower,overrides:appletEntryOverrides(messages,appId),opaquePictureAlphaPanes:['P_Bg_D_00']}]);
 }
 assert.equal(JSON.stringify(common),before);
});

test('both LCD draw failures and selected missing/malformed clips, labels and logo remain explicit',()=>{
 for(const appId of ids)for(const refused of ['CmnFade_U_00','CmnFade_D_00']){
  const presenter=createFirmwareHome({renderer:{packs:{common,messages,launcher},draw(_ctx,_bank,name){return name!==refused;}}});
  assert.equal(presenter.appletEntry({}, {}, {appId,phase:'out',frame:0}),false);
 }
 for(const mutate of [p=>delete p.animations.CmnFade_U_00_SceneOut,p=>delete p.textures['LncApltPictFrd_00.bclim'],p=>p.animations.CmnFade_D_00_SceneOut.tracks[0].keys[0].value++]){
  const pack=structuredClone(common);mutate(pack);const presenter=createFirmwareHome({renderer:{packs:{common:pack,messages,launcher},draw(){return true;}}});
  assert.throws(()=>presenter.appletEntry({}, {}, {appId:'friends',phase:'out',frame:0}),/unsupported/i);
 }
 const absent=structuredClone(messages);delete absent.messages.menu_msbt_LZ.labels.lau_title_news;
 const presenter=createFirmwareHome({renderer:{packs:{common,messages:absent,launcher},draw(){return true;}}});
 assert.throws(()=>presenter.appletEntry({}, {}, {appId:'notifications',phase:'out',frame:0}),/label/);
 const pack=structuredClone(common);delete pack.textures['Miiverse_logo_00.bclim'];
 const missingLogo=createFirmwareHome({renderer:{packs:{common:pack,messages,launcher},draw(){return true;}}});
 assert.throws(()=>missingLogo.appletEntry({}, {}, {appId:'miiverse',phase:'in',frame:20}),/unsupported/i);
});
