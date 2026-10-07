import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { validateManualEntryAssets, manualEntryBindings } from '../src/os/manual-entry-assets.ts';
import { nativePaneParentPath, poseNativeLayout } from '../src/os/native-layout.ts';

const root=new URL('../public/os/firmware/10.7.0-32E/packs/home/',import.meta.url);
const common=JSON.parse(readFileSync(new URL('common.json',root))),messages=JSON.parse(readFileSync(new URL('messages-and-loose.json',root))),launcher=JSON.parse(readFileSync(new URL('launcher.json',root)));
const data=source=>'data:text/javascript;base64,'+Buffer.from(source+'\n//# sourceURL=manual-entry-assets-fixture.js').toString('base64');
const sourceUrl=new URL('../src/os/firmware-presentation.ts',import.meta.url);
const {outputText}=ts.transpileModule(readFileSync(sourceUrl,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const {createFirmwareHome}=await import(data(outputText.replace(/(from\s*['"])(\.[^'"]+)(['"])/g,(_all,prefix,path,suffix)=>prefix+(path==='./native-renderer'?data('export class NativeLayoutRenderer {}'):new URL(path.endsWith('.ts')?path:`${path}.ts`,sourceUrl).href)+suffix)));

test('pinned common cover uses source SceneOut/In poses, fixed Manual selector 4 and English source label',()=>{
 validateManualEntryAssets(common);
 const before=JSON.stringify(common),draws=[],presenter=createFirmwareHome({renderer:{packs:{common,messages,launcher},draw(ctx,bank,name,options){draws.push({ctx,bank,name,options});return true;}}});
 for(const phase of ['out','in'])for(const frame of [0,10,20]){
  assert.equal(presenter.manualEntry('upper','lower',{phase,frame}),true);
  const [upper,lower]=draws.slice(-2),bindings=manualEntryBindings({phase,frame});
  assert.deepEqual([upper.ctx,upper.bank,upper.name,upper.options.bindings],['upper','common','CmnFade_U_00',bindings.upper]);
  assert.deepEqual([lower.ctx,lower.bank,lower.name,lower.options.bindings],['lower','common','CmnFade_D_00',bindings.lower]);
  assert.equal(lower.options.overrides.T_Aplt_00.text,'Instruction Manual');
  assert.equal(lower.options.overrides.T_Aplt_00.fontSize,undefined);
  const posed=poseNativeLayout(common.layouts.CmnFade_D_00,common.animations,bindings.lower);
  const belt=nativePaneParentPath(posed,'P_Belt_00').at(-1),applet=nativePaneParentPath(posed,'P_Aplt_00').at(-1);
  assert.equal(belt.alpha,phase==='out'?(frame===0?0:frame===20?255:belt.alpha):(frame===0?255:frame===20?0:belt.alpha));
  assert.equal(posed.textures[posed.materials[applet.picture.material].textureMaps[0].texture],'LncApltPictEbird_00.bclim');
  assert.equal(belt.translation[0],phase==='out'?(frame===0?80:frame===20?0:belt.translation[0]):(frame===0?0:frame===20?-80:belt.translation[0]));
 }
 assert.equal(JSON.stringify(common),before);
 for(const frame of [-1,.5,21,NaN])assert.throws(()=>manualEntryBindings({phase:'out',frame}),/source frame/);
});

test('missing selected clips, mutated curves, selector and parent hierarchy fail explicitly',()=>{
 const mutations=[
  p=>delete p.layouts.CmnFade_U_00,
  p=>delete p.animations.CmnFade_D_00_SceneOut,
  p=>p.animations.CmnFade_U_00_SceneIn.frames=20,
  p=>p.animations.CmnFade_D_00_SceneOut.sourceFrameRange[0]=-19,
  p=>p.animations.CmnFade_D_00_SceneOut.tracks.find(t=>t.target==='P_Belt_00'&&t.property==='translation.x').keys[0].slope=-3,
  p=>p.animations.CmnFade_U_00_SceneOut.tracks.find(t=>t.target==='P_Bg_U_00'&&t.property==='alpha').keys[0].value=1,
  p=>p.animations.CmnFade_D_00_Aplt.tracks.find(t=>t.property==='texture.pattern').keys.find(k=>k.frame===4).value=1,
  p=>delete p.textures['LncApltPictEbird_00.bclim'],
  p=>nativePaneParentPath(p.layouts.CmnFade_D_00,'P_Aplt_00').at(-1).children=[],
  p=>p.layouts.CmnFade_D_00.roots[0].flags=0,
  p=>p.animations.CmnFade_D_00_SceneIn.unsupported.push('test'),
  p=>p.layouts.CmnFade_D_00.groups[0].children.find(g=>g.name==='G_Scene_00').panes=[],
  p=>p.animations.CmnFade_D_00_Aplt.sourceFrameRange.push(8),
  p=>p.animations.CmnFade_D_00_Aplt.tracks.find(t=>t.target==='P_Aplt_00'&&t.property==='materialColor.0.0').keys.filter(k=>k.frame===4).at(-1).value=159,
  p=>p.animations.CmnFade_D_00_Aplt.tracks.find(t=>t.target==='P_Belt_00'&&t.property==='materialColor.1.1').keys.filter(k=>k.frame===4).at(-1).value=159,
  p=>p.animations.CmnFade_D_00_Aplt.tracks.find(t=>t.target==='P_Aplt_00'&&t.property==='texture.translation.x').keys.filter(k=>k.frame===4).at(-1).value=.25,
  p=>p.animations.CmnFade_D_00_Aplt.tracks.find(t=>t.target==='P_Aplt_00'&&t.property==='texture.scale.y').keys.filter(k=>k.frame===4).at(-1).value=2,
  p=>p.animations.CmnFade_D_00_Aplt.tracks.find(t=>t.target==='T_Aplt_00'&&t.property==='materialColor.1.3').keys[0].value=0,
 ];
 for(const [index,mutate]of mutations.entries()){const pack=structuredClone(common);mutate(pack);assert.throws(()=>validateManualEntryAssets(pack),/Unsupported Manual/,`mutation ${index}`);}
});

test('either LCD draw refusal and missing Manual label do not claim a native cover pair',()=>{
 for(const refused of ['CmnFade_U_00','CmnFade_D_00']){
  const presenter=createFirmwareHome({renderer:{packs:{common,messages,launcher},draw(_ctx,_bank,name){return name!==refused;}}});
  assert.equal(presenter.manualEntry({}, {}, {phase:'out',frame:0}),false);
 }
 const absent=structuredClone(messages);delete absent.messages.menu_msbt_LZ.labels.lau_title_manu;
 const presenter=createFirmwareHome({renderer:{packs:{common,messages:absent,launcher},draw(){return true;}}});
 assert.throws(()=>presenter.manualEntry({}, {}, {phase:'out',frame:0}),/Native Manual entry label/);
});
