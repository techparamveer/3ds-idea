import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const url=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const compile=name=>ts.transpileModule(readFileSync(new URL('../src/os/'+name+'.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const calls=[];
globalThis.__stockPreparationLoad=(...args)=>{let resolve,reject;const pending=new Promise((r,j)=>{resolve=r;reject=j;});calls.push({args,resolve,reject});return pending;};
const session=url(compile('native-title-session').replace("'./native-title-assets'",JSON.stringify(url('export const loadNativeTitleAssets=(...args)=>globalThis.__stockPreparationLoad(...args)'))));
let source=compile('stock-screen-presentation').replace("'./native-title-session'",JSON.stringify(session));
for(const [file,packs,draw]of [['settings','settingsScreenPacks','drawNativeSettingsMain'],['sound','soundScreenPacks','drawNativeSoundFrame'],['camera','cameraScreenPacks','drawNativeCameraFrame'],['health','healthScreenPacks','drawNativeHealthFrame']])source=source.replace(`'./stock-native-${file}'`,JSON.stringify(url(`export const ${packs}=[{url:'${file}.json',alias:'${file}',layouts:[],animations:[]}];export const ${draw}=(renderer,top,bottom,view)=>view.appId==='${file==='settings'?'system-settings':file}'?globalThis.__nativeTestDraw?.(top,bottom)??false:false;`)));
source=source.replace("'./stock-screen-layout'",JSON.stringify(url('export const stockScreenTargets=()=>[];')));
source=source.replace("'./stock-native-personal-tools'",JSON.stringify(url(compile('stock-native-personal-tools').replace("'./native-layout'",JSON.stringify(url(compile('native-layout')))).replace("'./stock-screen-layout'",JSON.stringify(url(compile('stock-screen-layout')))))));
source=source.replace("'./stock-native-web'",JSON.stringify(url("export const browserScreenPacks=[{url:'browser.json',alias:'browser',layouts:[],animations:[]}],miiverseScreenPacks=[{url:'miiverse.json',alias:'miiverse',layouts:[],animations:[]}];export const drawNativeWebFrame=()=>false;")));
source=source.replace("'./stock-native-services'",JSON.stringify(url('export const nativeServiceView=()=>null;export const drawNativeServiceFrame=()=>false;export const zoneClock=()=>({hour:"00",minute:"00",frame:0});export const eshopWelcomeBindings=()=>[];export const eshopWelcomePass=()=>0;')));
source=source.replace("'./stock-native-helpers'",JSON.stringify(url('export const nativeHelperView=()=>null;export const drawNativeHelperFrame=()=>false;')));
source=source.replace("'./stock-native-selectors'",JSON.stringify(url('export const nativeSelectorView=()=>null;export const drawNativeSelectorFrame=()=>false;')));
source=source.replace("'./native-screen-input'",JSON.stringify(url(compile('native-screen-input'))));
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

test('Friend profiles and selected Notes retain loaded native title assets across navigation',async()=>{
 const old=globalThis.document;globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({})})};
 try{for(const [appId,screen]of [['friends','profile'],['game-notes','drawing']]){
  calls.length=0;const presentation=createStockScreenPresentation(),font={},main={...view(appId),rows:appId==='friends'?[{id:'profile',label:'Your friend card'}]:[]};
  presentation.prepare(main,appId+':1',font);await flush();assert.equal(calls.length,1);
  let disposed=0;const assets={renderer:{},diagnostics:[],dispose(){disposed++;}};calls[0].resolve(assets);await flush();
  assert.equal(presentation.prepare({...main,screen,rows:[]},appId+':1',font).assets,assets);assert.equal(calls.length,1);
  assert.equal(presentation.prepare(main,appId+':1',font).assets,assets);presentation.dispose();assert.equal(disposed,1);
 }}finally{globalThis.document=old;}
});

function paintFixture(options={}){
 const old=globalThis.document;
 function context(canvas){
  const ctx={canvas,marks:[],fillStyle:'',resetTransform(){},clearRect(){this.marks=[];},fillRect(){this.marks.push(['fill',this.fillStyle]);},strokeRect(){},fillText(value){this.marks.push(['text',value]);},drawImage(source){this.marks=structuredClone(source.ctx.marks);}};
  return ctx;
 }
 globalThis.document={createElement:()=>{const canvas={width:0,height:0};canvas.ctx=context(canvas);canvas.getContext=()=>canvas.ctx;return canvas;}};
 const top=context({width:400,height:240}),bottom=context({width:320,height:240}),font={draw(ctx,value){ctx.fillText(value);}};
 calls.length=0;
 const screen=createStockScreenPresentation(options),v=view('system-settings');
 globalThis.__nativeTestDraw=(t,b)=>{t.fillText('native upper');b.fillText('native lower');return true;};
 const draw=(owner='settings:1',chosenFont=font)=>screen.draw(top,bottom,v,owner,chosenFont);
 const drawAt=date=>screen.draw(top,bottom,v,'settings:1',font,undefined,date);
 return {screen,v,font,top,bottom,draw,drawAt,dispose(){screen.dispose();globalThis.document=old;delete globalThis.__nativeTestDraw;}};
}
const nativeAssets=()=>({renderer:{},diagnostics:[],disposals:0,dispose(){this.disposals++;}});
test('absent font and repeated deferred paints show only source black, then publish both native screens',async()=>{
 const f=paintFixture();
 try{
  f.screen.draw(f.top,f.bottom,f.v,'settings:1');
  assert.equal(f.screen.status(f.v,'settings:1'),'loading');assert.equal(calls.length,0);
  assert.deepEqual(f.top.marks,[['fill','#000']]);assert.deepEqual(f.bottom.marks,[['fill','#000']]);
  f.draw();await flush();for(let i=0;i<10;i++)f.draw();assert.equal(calls.length,1);
  assert.deepEqual(f.top.marks,[['fill','#000']]);assert.deepEqual(f.bottom.marks,[['fill','#000']]);
  calls[0].resolve(nativeAssets());await flush();
  assert.equal(f.screen.status(f.v,'settings:1',f.font),'loading','assets alone do not publish pixels');
  f.draw();assert.equal(f.screen.status(f.v,'settings:1',f.font),'ready');
  assert.deepEqual(f.top.marks,[['text','native upper']]);assert.deepEqual(f.bottom.marks,[['text','native lower']]);
 }finally{f.dispose();}
});
test('failure is explicit, stable, and retries only on an explicit recovery action',async()=>{
 const f=paintFixture();
 try{
  f.draw();await flush();calls[0].reject(Error('HTTP 404'));await flush();
  assert.equal(f.screen.status(f.v,'settings:1',f.font),'loading','recovery controls are gated until their frame is visible');f.draw();
  assert.equal(f.screen.status(f.v,'settings:1',f.font),'error');
  assert.ok(f.top.marks.some(([,text])=>text==='Website display unavailable'));
  assert.ok(f.bottom.marks.some(([,text])=>text==='A: Retry'));
  for(let i=0;i<10;i++)f.draw();await flush();assert.equal(calls.length,1);
  assert.equal(f.screen.retry(),true);f.draw();await flush();assert.equal(calls.length,2);
  calls[1].resolve(nativeAssets());await flush();f.draw();assert.equal(f.screen.status(f.v,'settings:1',f.font),'ready');
  assert.equal(f.screen.retry(),false);
 }finally{f.dispose();}
});
for(const mode of ['false','throw'])test(`native renderer ${mode} discards the partially drawn pair and never paints generic fallback`,async()=>{
 const f=paintFixture();
 try{
  f.draw();await flush();const assets=nativeAssets();calls[0].resolve(assets);await flush();
  globalThis.__nativeTestDraw=(t)=>{t.fillText('partial native upper');if(mode==='throw')throw Error('bad pane');return false;};
  f.draw();assert.equal(f.screen.status(f.v,'settings:1',f.font),'error');assert.equal(assets.disposals,1);
  assert.equal(f.top.marks.some(([,value])=>value==='partial native upper'),false);
  assert.ok(f.top.marks.some(([,value])=>value==='Website display unavailable'));
  assert.ok(f.bottom.marks.some(([,value])=>value==='A: Retry'));
 }finally{f.dispose();}
});
test('owned deadline covers missing fonts and hangs, disposes late results, and resets on owner replacement',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const f=paintFixture({deadlineMs:100});
 try{
  f.screen.draw(f.top,f.bottom,f.v,'settings:1');t.mock.timers.tick(100);f.screen.draw(f.top,f.bottom,f.v,'settings:1');
  assert.equal(f.screen.status(f.v,'settings:1'),'error');assert.equal(calls.length,0);
  f.screen.retry();f.draw();await flush();t.mock.timers.tick(100);
  assert.equal(calls[0].args[4].aborted,true);const late=nativeAssets();calls[0].resolve(late);await flush();assert.equal(late.disposals,1);
  f.draw('settings:2');await flush();t.mock.timers.tick(99);assert.equal(f.screen.status(f.v,'settings:2',f.font),'loading');
  const ready=nativeAssets();calls[1].resolve(ready);await flush();t.mock.timers.tick(500);f.draw('settings:2');
  assert.equal(f.screen.status(f.v,'settings:2',f.font),'ready');assert.equal(ready.disposals,0);
  f.screen.sync(null);assert.equal(ready.disposals,1);t.mock.timers.tick(500);assert.equal(f.screen.getFailure(),null);
 }finally{f.dispose();t.mock.timers.reset();}
});
test('only a published application pair is complete, and suspended-capture identity repaints without keying pixels',async()=>{
 const f=paintFixture();
 try{
  assert.equal(f.draw(),false,'source black while loading is not an application frame');
  await flush();calls[0].resolve(nativeAssets());await flush();
  let draws=0;globalThis.__nativeTestDraw=(t,b)=>{draws++;t.fillText('native upper');b.fillText('native lower');return true;};
  assert.equal(f.draw(),true);assert.equal(f.draw(),true);assert.equal(draws,1,'unchanged pairs are republished, not repainted');
  const pixels={width:1,height:1,data:new Uint8ClampedArray(4)},capture=generation=>({status:'ready',owner:'health-safety:1',generation,upper:pixels,lower:pixels});
  const draw=value=>f.screen.draw(f.top,f.bottom,f.v,'settings:1',f.font,value);
  assert.equal(draw(capture(1)),true);assert.equal(draws,2);
  assert.equal(draw(capture(1)),true);assert.equal(draws,2);
  assert.equal(draw(capture(2)),true);assert.equal(draws,3,'a new frozen generation repaints');
  globalThis.__nativeTestDraw=()=>false;
  assert.equal(draw({status:'missing',owner:'health-safety:1'}),false,'recovery is never reported complete');
  assert.ok(f.top.marks.some(([,text])=>text==='Website display unavailable'));
 }finally{f.dispose();}
});
test('Settings HUD cache repaints by local minute and date, not seconds',async()=>{
 const f=paintFixture();
 try{
  f.draw();await flush();calls[0].resolve(nativeAssets());await flush();
  let draws=0;globalThis.__nativeTestDraw=()=>{draws++;return true;};
  f.drawAt(new Date(2026,8,24,6,31,0));assert.equal(draws,1);
  f.drawAt(new Date(2026,8,24,6,31,59));assert.equal(draws,1);
  f.drawAt(new Date(2026,8,24,6,32,0));assert.equal(draws,2);
  f.drawAt(new Date(2027,8,24,6,32,0));assert.equal(draws,3,'weekday-bearing date keys the year');
 }finally{f.dispose();}
});
test('a new owner cannot display a completed old native frame',async()=>{
 const f=paintFixture();
 try{
  f.draw();await flush();calls[0].resolve(nativeAssets());await flush();f.draw();
  f.draw('settings:2');await flush();assert.deepEqual(f.top.marks,[['fill','#000']]);assert.deepEqual(f.bottom.marks,[['fill','#000']]);
  assert.equal(f.screen.status(f.v,'settings:2',f.font),'loading');
 }finally{f.dispose();}
});
