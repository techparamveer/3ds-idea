import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {nativeMessageOverride,nativePaneParentPath,poseNativeLayout} from '../src/os/native-layout.ts';

const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
async function loadPresentation(overrides={}){
 const url=new URL('../src/os/firmware-presentation.ts',import.meta.url);
 const {outputText}=ts.transpileModule(readFileSync(url,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
 return import(moduleUrl(outputText.replace(/(from\s*['"])(\.[^'"]+)(['"])/g,(_all,prefix,path,suffix)=>prefix+(overrides[path]??new URL(path.endsWith('.ts')?path:`${path}.ts`,url).href)+suffix)));
}
const {createFirmwareHome}=await loadPresentation({'./native-renderer':moduleUrl('export class NativeLayoutRenderer {}')});
const root=new URL('../public/os/firmware/10.7.0-32E/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('manifest.json',root)));
const packs=Object.fromEntries(['launcher','petit','messages','MyMenu','dialogmask'].map(name=>[name,JSON.parse(readFileSync(new URL(manifest.home[name],root)))]));
const walk=panes=>panes.flatMap(pane=>[pane,...walk(pane.children)]);

// Model the renderer's source hierarchy and attachment-center cancellation.
// This checks actual row placement without a browser or a fabricated flat mount.
function presenter(source=packs){
 const draws=[],ctx={x:0,y:0,sx:1,sy:1};
 const renderer={packs:source,failed:null,draw(context,bank,name,options={}){
  if(name===this.failed)return false;
  const pose=poseNativeLayout(this.packs[bank].layouts[name],this.packs[bank].animations,options.bindings,options.overrides);
  const center=options.center??[pose.canvas.width/2,pose.canvas.height/2],saved={...context};
  context.x+=center[0]*context.sx;context.y+=center[1]*context.sy;
  draws.push({name,options,pose,center:[context.x,context.y]});
  const visit=pane=>{
   if(!(pane.flags&1))return;
   const before={...context};context.x+=pane.translation[0]*context.sx;context.y-=pane.translation[1]*context.sy;
   context.sx*=pane.scale[0];context.sy*=pane.scale[1];
   pane.children.forEach(visit);
   if(options.attachments?.[pane.name]){
    context.x-=pose.canvas.width/2*context.sx;context.y-=pose.canvas.height/2*context.sy;
    options.attachments[pane.name](1);
   }
   Object.assign(context,before);
  };
  pose.roots.forEach(visit);Object.assign(context,saved);return true;
 }};
 return {home:createFirmwareHome({renderer}),renderer,draws,ctx};
}
const state={panelChoice:0,brightness:1,powerSaving:false};
const drawByName=(draws,name)=>draws.find(draw=>draw.name===name);

test('HOME Settings attaches original-hardware source rows and English styles at native mounts',()=>{
 const before=JSON.stringify(packs),{home,draws,ctx}=presenter();
 assert.equal(home.settingsLower(ctx,state),true);
 for(const [name,center] of [['PtBtnL_Thm_00',[152,66]],['PtBtnM_Mym_00',[152,160]],['PtBtnT_Lgt_00',[152,248]],['PtBtnT_Abl_00',[152,320]]])assert.deepEqual(drawByName(draws,name).center,center);
 assert.equal(drawByName(draws,'PtBtnT_Lgt_01'),undefined,'original hardware uses the 00 brightness layout');
 const checks=[['PtBtnL_Thm_00','T_Base_00','ptt_menu_design'],['PtBtnL_Thm_00','T_Btn_01','ptt_theme'],['PtBtnM_Mym_00','T_Base_00','ptt_menu_mhm'],['PtBtnM_Mym_00','T_Btn_01','ptt_mhm'],['PtBtnT_Lgt_00','T_Base_00','ptt_light_bright'],['PtBtnT_Abl_00','T_Base_00','ptt_light_eco'],['PtBtnT_Abl_00','T_On_00','ptt_light_on'],['PtBtnT_Abl_00','T_Off_00','ptt_light_off']];
 for(const [layout,pane,label] of checks)assert.deepEqual(drawByName(draws,layout).options.overrides[pane],nativeMessageOverride(packs.messages,'menu_msbt_LZ',label,''));
 const contents=drawByName(draws,'PtDlgCnt_CTR').pose,panes=Object.fromEntries(walk(contents.roots).map(pane=>[pane.name,pane]));
 assert.deepEqual([1,2,3,4,5].map(i=>panes[`N_Wrp_0${i}`].translation[1]+0),[0,72,0,56,64]);
 for(const name of ['N_BtnTheme_00','N_BtnMyMenu_00'])assert.equal(panes[name].flags&1,1);
 for(const name of ['N_BtnPrize_00','N_BtnCbnt_00','N_BtnInfo_00'])assert.equal(panes[name].flags&1,0);
 assert.deepEqual(drawByName(draws,'PtDlgBg_D_00').options.clip,[0,0,320,240],'brightness heading at y221 remains visible');
 assert.deepEqual(draws.filter(draw=>draw.name==='PtLine_00').map(draw=>draw.center),[[152,116],[152,204]]);
 assert.equal(JSON.stringify(packs),before,'painting must not mutate shared decoded resources');
});

test('scroll moves content while close and source scrollbar stay attached to the panel',()=>{
 const results=[];
 for(const scroll of [undefined,0,140,900,-20,NaN]){
  const {home,draws,ctx}=presenter();home.settingsLower(ctx,{...state,panelScroll:scroll});results.push(draws);
  const amount=Number.isFinite(scroll)?Math.max(0,Math.min(140,scroll)):0;
  assert.deepEqual(drawByName(draws,'PtBtnM_Mym_00').center,[152,160-amount]);
  assert.deepEqual(drawByName(draws,'PtBtnT_Abl_00').center,[152,320-amount]);
  assert.deepEqual(drawByName(draws,'PtClose_00').center,[160,120]);
  const bar=drawByName(draws,'PtSlideBar');assert.deepEqual(bar.center,[160,120]);
  assert.deepEqual(bar.options.overrides.SBBtn.size,[22,88]);
  assert.deepEqual(bar.options.overrides.N_Slide_00.translation,[0,58-amount/140*116,0]);
 }
 assert.deepEqual(results[0].map(draw=>draw.center),results[1].map(draw=>draw.center));
});

test('source cursor anchors follow each choice and selected brightness/power-saving groups',()=>{
 for(const [panelChoice,brightness,powerSaving,layout,anchor] of [[0,1,false,'PtBtnL_Thm_00','N_CPos_Btn_00'],[1,1,false,'PtBtnM_Mym_00','N_CPos_Btn_00'],[2,.6,false,'PtBtnT_Lgt_00','N_CPos_Lv3_00'],[3,1,false,'PtBtnT_Abl_00','N_CPos_Off_00'],[3,1,true,'PtBtnT_Abl_00','N_CPos_On_00']]){
  const {home,draws,ctx}=presenter();home.settingsLower(ctx,{...state,panelChoice,brightness,powerSaving,panelScroll:140});
  const cursors=draws.filter(draw=>draw.name==='PtCsr_00');assert.equal(cursors.length,1);
  const parent=drawByName(draws,layout),pane=nativePaneParentPath(packs.petit.layouts[layout],anchor).at(-1),cursor=cursors[0];
  assert.deepEqual(cursor.center,[parent.center[0]+pane.translation[0],parent.center[1]-pane.translation[1]]);
  assert.deepEqual(cursor.options.overrides.W_CsrF_00.size,pane.size);
  assert.deepEqual(cursor.options.overrides.W_CsrLgt_00.size,pane.size);
  const brightnessDraw=drawByName(draws,'PtBtnT_Lgt_00');
  assert.deepEqual(brightnessDraw.options.bindings.at(-1).groups,[`G_Lv${Math.round(brightness*5)}_00`]);
  assert.deepEqual(drawByName(draws,'PtBtnT_Abl_00').options.bindings.at(-1).groups,[powerSaving?'G_On_00':'G_Off_00']);
 }
});

test('missing messages, layouts, animation or child draw fail explicitly',()=>{
 for(const [remove,error] of [
  [source=>delete source.messages.messages.menu_msbt_LZ.labels.ptt_mhm,/message unavailable: ptt_mhm/],
  [source=>delete source.petit.layouts.PtBtnM_Mym_00,/layout unavailable: PtBtnM_Mym_00/],
  [source=>delete source.petit.animations.PtDlgCnt_CTR_Theme,/animation unavailable: PtDlgCnt_CTR_Theme/],
 ]){
  const source=structuredClone(packs);remove(source);const {home,ctx}=presenter(source);assert.throws(()=>home.settingsLower(ctx,state),error);
 }
 const {home,renderer,ctx}=presenter();renderer.failed='PtBtnM_Mym_00';assert.throws(()=>home.settingsLower(ctx,state),/lower layout unavailable/);
});

test('asset readiness decodes every Settings and MyMenu texture before publication and rejects missing required layouts',async()=>{
 const {loadFirmwarePresentationAssets}=await loadPresentation({
  './bitmap-font':moduleUrl('export class BitmapFont {} export const loadBitmapFont=async()=>({dispose(){}});'),
  './native-renderer':moduleUrl('export class NativeLayoutRenderer {diagnostics=[];constructor(packs,textures){this.packs=packs;this.textures=textures;}dispose(){for(const images of Object.values(this.textures))images.clear();}}'),
 });
 const saved=new Map(['window','fetch'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 const fetched=[];let missing=null;
 Object.assign(globalThis,{window:{location:{href:'https://fixture.invalid/'}},fetch:async url=>{
  const path=new URL(url).pathname;fetched.push(path);
  const bytes=readFileSync(new URL(`../public${path}`,import.meta.url));
  if(missing&&path.endsWith(`/${missing[0]}.json`)){const pack=JSON.parse(bytes);delete pack.layouts[missing[1]];return new Response(JSON.stringify(pack));}
  return new Response(bytes);
 }});
 try{
  const assets=await loadFirmwarePresentationAssets();
  try{
   for(const [pack,names] of [['petit',['PtDlgBg_D_00','PtDlgCnt_CTR','PtBtnL_Thm_00','PtBtnM_Mym_00','PtBtnT_Lgt_00','PtBtnT_Abl_00','PtClose_00','PtSlideBar','PtLine_00','PtCsr_00']],['MyMenu',Object.keys(packs.MyMenu.layouts)]]){
    for(const name of names)for(const texture of packs[pack].layouts[name].textures){
     const record=packs[pack].textures[texture],pixels=assets.renderer.textures[pack].get(texture);
     assert.deepEqual([pixels.width,pixels.height],[record.width,record.height],`${pack}/${name}/${texture}`);
     assert.equal(fetched.filter(path=>path.endsWith('/'+record.url)).length,1,'shared textures are fetched once');
    }
   }
   assert.ok(assets.diagnostics.some(message=>message.includes('adaptations')));
  }finally{assets.dispose();}
  for(const [bank,layout] of [['petit','PtBtnM_Mym_00'],['petit','PtCsr_00'],['MyMenu','MyMenu_D_00']]){
   missing=[bank,layout];await assert.rejects(loadFirmwarePresentationAssets(),new RegExp(`Missing native layout ${layout}`));
  }
 }finally{for(const [key,descriptor] of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}}
});
