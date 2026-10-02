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
const homeMessages=JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/home/messages-and-loose.json',import.meta.url),'utf8'));

function mockCtx(width){
 const fills=[];
 return {canvas:{width,height:240},fillStyle:'',globalAlpha:1,fills,
  getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0}),
  fillRect(...a){fills.push({style:this.fillStyle,a});},
  save(){},restore(){}};
}

function overlay(elapsed,reduced=false,packs={launch:{},common:{}},phase='launch',returnPhase='home'){
 const draws=[];
 const top=mockCtx(400),bottom=mockCtx(320);
 const assets={renderer:{packs:{messages:{menu_msbt_LZ:{labels:{},messages:[]}},...packs},
  draw(ctx,bank,name,options){const bindings=options.bindings.map(binding=>({...binding}));draws.push({bank,name,clip:bindings[0].name,frame:bindings[0].frame,bindings,width:ctx.canvas.width,overrides:options.overrides,textSampling:options.textSampling,textSamplingPanes:options.textSamplingPanes});return true;}}};
 const ok=drawNativeSystemOverlay(top,bottom,{system:{phase,since:0,sleeping:false,returnPhase}},elapsed,reduced,assets);
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

test('Power scopes decoded multiline writer metrics and LCD sampling to their source panes',()=>{
 const before=JSON.stringify(homeMessages),result=overlay(350,false,{common:{},sleep:{},messages:homeMessages},'power');
 assert.equal(result.ok,true);
 const upper=result.draws.find(draw=>draw.bank==='sleep'&&draw.name==='Slp_U_00');
 assert.deepEqual(upper.overrides.T_Main_00.lineAdvanceScales,[1,.2,1,.2,1,1]);
 assert.equal(upper.overrides.T_Main_00.multilineBlockOrigin,'writer-0x110');
 assert.equal(upper.overrides.T_Btm_00.multilineBlockOrigin,'writer-0x111');
 assert.equal(upper.overrides.T_Main_00.text,homeMessages.messages.menu_msbt_LZ.messages[homeMessages.messages.menu_msbt_LZ.labels.lau_press_pow_u1].text);
 for(const pane of ['T_Top_00','T_Btm_00'])assert.equal(upper.overrides[pane].lineAdvanceScales,undefined);
 assert.equal(upper.overrides.T_Top_00.multilineBlockOrigin,undefined);
 assert.equal(upper.textSampling,'lcd');assert.deepEqual(upper.textSamplingPanes,['T_Btm_00']);
 const lower=result.draws.find(draw=>draw.bank==='sleep'&&draw.name==='Slp_D_00');
 assert.equal(lower.textSampling,'lcd');assert.deepEqual(lower.textSamplingPanes,['T_BtnB_01','T_BtnF_01']);
 assert.equal(JSON.stringify(homeMessages),before);
});

test('shutdown holds Decide then binds paired sleep SceneOut last without a common fade',()=>{
 const at=(elapsed,returnPhase='home')=>overlay(elapsed,false,{common:{},sleep:{},messages:homeMessages},'shutdown',returnPhase).draws;
 const bindings=(draws,name)=>draws.find(draw=>draw.name===name).bindings;
 assert.deepEqual(bindings(at(0),'Slp_U_00'),[
  {name:'Slp_U_00_SceneIn',frame:20},
  {name:'Slp_U_00_SceneOut',frame:0},
 ]);
 assert.deepEqual(bindings(at(0),'Slp_D_00'),[
  {name:'Slp_D_00_SceneIn',frame:20},
  {name:'Slp_D_00_Decide',frame:0},
  {name:'Slp_D_00_SceneOut',frame:0},
 ]);
 assert.deepEqual(bindings(at(166),'Slp_D_00').slice(1),[
  {name:'Slp_D_00_Decide',frame:9},
  {name:'Slp_D_00_SceneOut',frame:0},
 ]);
 assert.deepEqual(bindings(at(167),'Slp_D_00').slice(1),[
  {name:'Slp_D_00_Decide',frame:10},
  {name:'Slp_D_00_SceneOut',frame:0},
 ]);
 assert.deepEqual(bindings(at(184),'Slp_D_00').slice(1),[
  {name:'Slp_D_00_Decide',frame:10},
  {name:'Slp_D_00_SceneOut',frame:1},
 ]);
 assert.equal(bindings(at(1166),'Slp_U_00').at(-1).frame,59);
 assert.equal(bindings(at(1167),'Slp_U_00').at(-1).frame,60);
 assert.equal(bindings(at(1199),'Slp_U_00').at(-1).frame,60);
 assert.deepEqual(bindings(at(0,'app'),'Slp_D_00').map(binding=>binding.name),[
  'Slp_D_00_SceneInApp','Slp_D_00_Decide','Slp_D_00_SceneOut',
 ]);
 assert.ok(at(230).every(draw=>draw.bank==='sleep'));
});

test('reduced shutdown publishes and holds the paired terminal source pose',()=>{
 const draws=overlay(0,true,{common:{},sleep:{},messages:homeMessages},'shutdown').draws;
 assert.deepEqual(draws.find(draw=>draw.name==='Slp_U_00').bindings,[
  {name:'Slp_U_00_SceneIn',frame:20},
  {name:'Slp_U_00_SceneOut',frame:60},
 ]);
 assert.deepEqual(draws.find(draw=>draw.name==='Slp_D_00').bindings,[
  {name:'Slp_D_00_SceneIn',frame:20},
  {name:'Slp_D_00_Decide',frame:10},
  {name:'Slp_D_00_SceneOut',frame:60},
 ]);
 assert.ok(draws.every(draw=>draw.bank==='sleep'));
});
