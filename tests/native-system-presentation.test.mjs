import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
async function loadOverlay(){
 const url=new URL('../src/os/native-system-presentation.ts',import.meta.url);
 const {outputText}=ts.transpileModule(readFileSync(url,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
 const overrides={
  './native-system-fade':moduleUrl('export const drawNativeSystemFade=()=>false;'),
 };
 const resolved=outputText.replace(/(from\s*['"])(\.[^'"]+)(['"])/g,(_all,prefix,path,suffix)=>
  prefix+(overrides[path]??new URL(path.endsWith('.ts')?path:`${path}.ts`,url).href)+suffix);
 return import(moduleUrl(resolved));
}
const {drawNativeSystemOverlay}=await loadOverlay();

function mockCtx(width){
 const fills=[];
 return {canvas:{width,height:240},fillStyle:'',globalAlpha:1,fills,
  getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0}),
  fillRect(...a){fills.push({style:this.fillStyle,a});},
  save(){},restore(){}};
}

function overlay(elapsed,reduced=false,packs={launch:{},common:{}},phase='launch'){
 const draws=[];
 const top=mockCtx(400),bottom=mockCtx(320);
 const assets={renderer:{packs:{messages:{menu_msbt_LZ:{labels:{},messages:[]}},...packs},
  draw(ctx,bank,name,options){draws.push({bank,name,clip:options.bindings[0].name,frame:options.bindings[0].frame,width:ctx.canvas.width});return true;}}};
 const ok=drawNativeSystemOverlay(top,bottom,{system:{phase,since:0,sleeping:false,returnPhase:'home'}},elapsed,reduced,assets);
 return {ok,draws,fills:[...top.fills,...bottom.fills]};
}

test('launch composites matching HOME SceneOutA/B/C fades under the logo without erasing HOME',()=>{
 const start=overlay(0);
 assert.equal(start.ok,true);
 assert.deepEqual(start.fills,[]);
 assert.deepEqual(start.draws.map(d=>({bank:d.bank,clip:d.clip,frame:d.frame})),[
  {bank:'common',clip:'CmnFadeNinLogo_U_00_SceneOutA',frame:0},
  {bank:'common',clip:'CmnFadeNinLogo_D_00_SceneOutA',frame:0},
  {bank:'launch',clip:'NintendoLogo_U_00_SceneOutA',frame:0},
  {bank:'launch',clip:'NintendoLogo_D_00_SceneOutA',frame:0},
 ]);
 const mid=overlay(1000);
 assert.deepEqual(mid.draws.map(d=>d.clip),[
  'CmnFadeNinLogo_U_00_SceneOutB','CmnFadeNinLogo_D_00_SceneOutB',
  'NintendoLogo_U_00_SceneOutB','NintendoLogo_D_00_SceneOutB',
 ]);
 assert.ok(mid.draws.every(d=>d.frame===0));
 const end=overlay(1500);
 assert.ok(end.draws.every(d=>d.clip.endsWith('SceneOutC')&&d.frame===0));
 const reduced=overlay(0,true);
 assert.ok(reduced.draws.every(d=>d.clip.endsWith('SceneOutB')&&d.frame===15));
 assert.deepEqual(reduced.fills,[]);
});

test('boot exposes the paired transparent SceneIn endpoint before its phase deadline',()=>{
 const before=overlay(2983,false,{common:{}},'boot');
 assert.deepEqual(before.draws.map(d=>({clip:d.clip,frame:d.frame})),[
  {clip:'CmnFadeNinLogo_U_00_SceneIn',frame:19},
  {clip:'CmnFadeNinLogo_D_00_SceneIn',frame:19},
 ]);
 const terminal=overlay(2999,false,{common:{}},'boot');
 assert.deepEqual(terminal.draws.map(d=>({clip:d.clip,frame:d.frame})),[
  {clip:'CmnFadeNinLogo_U_00_SceneIn',frame:20},
  {clip:'CmnFadeNinLogo_D_00_SceneIn',frame:20},
 ]);
 assert.deepEqual(terminal.fills,[]);

 const reduced=overlay(299,true,{common:{}},'boot');
 assert.ok(reduced.draws.every(d=>d.clip.endsWith('SceneIn')&&d.frame===20));
});

test('launch without the logo pack keeps the 20-frame HOME SceneOut fallback',()=>{
 const result=overlay(0,false,{common:{}});
 assert.equal(result.ok,true);
 assert.deepEqual(result.draws.map(d=>d.clip),['CmnFadeNinLogo_U_00_SceneOut','CmnFadeNinLogo_D_00_SceneOut']);
 assert.equal(result.draws[0].frame,0);
});
