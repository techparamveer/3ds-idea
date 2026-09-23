import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const url=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const compile=name=>ts.transpileModule(readFileSync(new URL('../src/os/'+name+'.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const calls=[];
globalThis.__stockPreparationLoad=(...args)=>{let resolve;const pending=new Promise(r=>{resolve=r;});calls.push({args,resolve});return pending;};
const session=url(compile('native-title-session').replace("'./native-title-assets'",JSON.stringify(url('export const loadNativeTitleAssets=(...args)=>globalThis.__stockPreparationLoad(...args)'))));
let source=compile('stock-screen-presentation').replace("'./native-title-session'",JSON.stringify(session));
for(const [file,packs,draw]of [['settings','settingsScreenPacks','drawNativeSettingsMain'],['sound','soundScreenPacks','drawNativeSoundFrame'],['camera','cameraScreenPacks','drawNativeCameraLower'],['health','healthScreenPacks','drawNativeHealthFrame']])source=source.replace(`'./stock-native-${file}'`,JSON.stringify(url(`export const ${packs}=[{url:'${file}.json',alias:'${file}',layouts:[],animations:[]}];export const ${draw}=()=>false;`)));
source=source.replace("'./stock-screen-layout'",JSON.stringify(url('export const stockScreenTargets=()=>[];')));
const {createStockScreenPresentation}=await import(url(source));
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const view=appId=>({appId,screen:'main',heading:'',rows:[],selection:0,footer:{}});
test('launch preparation acquires native assets before any screen is drawn and coalesces the app view',async()=>{
 const old=globalThis.document;globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({})})};calls.length=0;
 const screen=createStockScreenPresentation(),font={};
 try{
  assert.equal(screen.prepare(view('sound'),'sound:1',font).status,'loading');await flush();
  assert.equal(calls.length,1);assert.equal(calls[0].args[1],'0004001000022500');
  let disposed=0;const assets={renderer:{},diagnostics:[],dispose(){disposed++;}};calls[0].resolve(assets);await flush();
  assert.equal(screen.prepare({...view('sound'),screen:'playback'},'sound:1',font).assets,assets);
  assert.equal(calls.length,1);screen.sync(null);assert.equal(disposed,1);assert.equal(screen.getState().status,'idle');
 }finally{screen.dispose();globalThis.document=old;}
});
test('returning HOME during launch aborts a prepared owner and rejects late completion',async()=>{
 const old=globalThis.document;globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({})})};calls.length=0;
 const screen=createStockScreenPresentation();
 try{
  screen.prepare(view('camera'),'camera:1',{});await flush();screen.sync(null);
  assert.equal(calls[0].args[4].aborted,true);let disposed=0;calls[0].resolve({renderer:{},diagnostics:[],dispose(){disposed++;}});await flush();
  assert.equal(disposed,1);assert.equal(screen.getState().status,'idle');
 }finally{screen.dispose();globalThis.document=old;}
});
