import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
let source=ts.transpileModule(readFileSync(new URL('../src/os/stock-native-health.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
for(const [dependency,replacement] of [
 ['./bitmap-font','export const rasterNativeAlphaGlyph=()=>{};'],
 ['./native-layout','export const evaluateNativeMaterial=()=>[];export const nativeMessageOverride=(_p,_b,label)=>({text:label});export const nativePaneParentPath=()=>null;'],
 ['./stock-health-scroll','export const healthTopLoopFrame=()=>18;'],
 ['./stock-health-layout','export const healthDocumentArticles={};'],
 ['./stock-health-article','export const healthArticleLayout=()=>({});'],
])source=source.replace(`'${dependency}'`,JSON.stringify(moduleUrl(replacement)));
const {drawNativeHealthFrame,healthScreenPacks}=await import(moduleUrl(source));

const packUrl=new URL('../public/os/firmware/10.7.0-32E/packs/health-and-safety/common.json',import.meta.url);
const manifestUrl=new URL('../public/os/firmware/10.7.0-32E/manifest.json',import.meta.url);

test('published Health upper reveal retains the exact decoded source identity and clip',()=>{
 const bytes=readFileSync(packUrl),pack=JSON.parse(bytes),manifest=JSON.parse(readFileSync(manifestUrl,'utf8'));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'d65ffb1c6e37c2b4414a957ba5b642007c36429418c3224706c402c7c26c0627');
 assert.equal(pack.titleId,'0004001000022300');
 assert.equal(pack.sourceSha256,'b1d9ef2b160c04a3e27af4b84e87dc91c658b987a8636b0b64eba651f20b5b39');
 assert.deepEqual(pack.resourceSources.layouts.CmnFade_U_00,{
  path:'common_LZ.bin/blyt/CmnFade_U_00.bclyt',sha256:'9e08884a935bdb425e9b2448e19b55774dc77483a3678d33b436648bae2944c9',titleId:'0004001000022300',
 });
 assert.deepEqual(pack.resourceSources.animations.CmnFade_U_00_SceneIn,{
  path:'common_LZ.bin/anim/CmnFade_U_00_SceneIn.bclan',sha256:'2eb8644587e537d3d615acdce431d439d85f0dc76c95a2e571b9cb9d54079155',titleId:'0004001000022300',
 });
 const clip=pack.animations.CmnFade_U_00_SceneIn;
 assert.deepEqual([clip.frames,clip.loop,clip.sourceFrameRange,clip.groups],[21,false,[-20,0],['G_Scene_00']]);
 assert.deepEqual(clip.tracks.map(({target,property,keys})=>[target,property,keys]),[
  ['P_00','alpha',[{frame:0,slope:0,value:255},{frame:20,slope:0,value:0}]],
 ]);
 assert.ok(manifest.titles[pack.titleId].packs.includes('packs/health-and-safety/common.json'));
 assert.deepEqual(manifest.resources['packs/health-and-safety/common.json'].sources,[{
  path:'common_LZ.bin',sha256:pack.sourceSha256,titleId:pack.titleId,
 }]);
 assert.deepEqual(healthScreenPacks[0],{
  url:'packs/health-and-safety/common.json',alias:'health-common',layouts:['CmnFade_U_00'],animations:['CmnFade_U_00_SceneIn'],
 });
});

test('Health applies its entry fade after the upper artwork and never masks the settled lower screen',()=>{
 const top={},bottom={},calls=[];
 const messages=['title','base_1b_menu','article_title_1','article_title_2','article_title_3'];
 const renderer={
  packs:{'health-messages':{messages:{safe_msbt_LZ:{labels:Object.fromEntries(messages.map((name,index)=>[name,index])),messages:messages.map(text=>({text}))}}}},
  draw(ctx,pack,layout,options={}){calls.push({ctx,pack,layout,options});return true;},
 };
 const view={appId:'health-safety',screen:'main',heading:'',rows:[],selection:0,footer:{},data:{healthElapsedMs:0,selectionActive:false}};
 assert.equal(drawNativeHealthFrame(renderer,top,bottom,view,{healthEntryFrame:7}),true);
 assert.deepEqual(calls.map(({ctx,pack,layout})=>[ctx===top?'upper':'lower',pack,layout]),[
  ['upper','health-bg','Bg_U_00'],
  ['upper','health-common','CmnFade_U_00'],
  ['lower','health-bg','Bg_D_00'],
  ['lower','health-pages','SafeTop_D_00'],
 ]);
 assert.deepEqual(calls[1].options.bindings,[{name:'CmnFade_U_00_SceneIn',frame:7}]);
 assert.equal(calls.filter(call=>call.ctx===bottom&&call.pack==='health-common').length,0);
});
