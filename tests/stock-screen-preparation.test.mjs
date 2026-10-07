import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {createNativeScreenInputGate} from '../src/os/native-screen-input.ts';
import {createPortfolioState,tickSystem,launch,dispatchSystemEvent,getActiveAppView} from '../src/os/system.ts';
const url=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const compile=name=>ts.transpileModule(readFileSync(new URL('../src/os/'+name+'.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const calls=[];
globalThis.__stockPreparationLoad=(...args)=>{let resolve,reject;const pending=new Promise((r,j)=>{resolve=r;reject=j;});calls.push({args,resolve,reject});return pending;};
const session=url(compile('native-title-session').replace("'./native-title-assets'",JSON.stringify(url('export const loadNativeTitleAssets=(...args)=>globalThis.__stockPreparationLoad(...args)'))));
let source=compile('stock-screen-presentation').replace("'./stock-settings-hud'",JSON.stringify(url(compile('stock-settings-hud').replace("'./device-status-profile.ts'",JSON.stringify(url(compile('device-status-profile'))))))).replace("'./stock-health-scroll'",JSON.stringify(url(compile('stock-health-scroll')))).replace("'./native-title-session'",JSON.stringify(session));
for(const [file,packs,draw]of [['settings','settingsScreenPacks','drawNativeSettingsMain'],['sound','soundScreenPacks','drawNativeSoundFrame'],['camera','cameraScreenPacks','drawNativeCameraFrame'],['health','healthScreenPacks','drawNativeHealthFrame']])source=source.replace(`'./stock-native-${file}'`,JSON.stringify(url(`export const ${packs}=[{url:'${file}.json',alias:'${file}',layouts:[],animations:[]}];export const ${draw}=(renderer,top,bottom,view,...args)=>view.appId==='${file==='settings'?'system-settings':file==='health'?'health-safety':file}'?globalThis.__nativeTestDraw?.(top,bottom,...args)??false:false;${file==='sound'?'export const soundHudTimeKey=()=>null;':''}`)));
source=source.replace("'./stock-screen-layout'",JSON.stringify(url('export const stockScreenTargets=()=>[];')));
const layout=url(compile('stock-screen-layout')
 .replace("'./camera-browse.ts'",JSON.stringify(new URL('../src/os/camera-browse.ts',import.meta.url).href))
 .replace("'./stock-manual-index.ts'",JSON.stringify(url('export const manualPageZeroAvailable=()=>false;'))));
source=source.replace("'./stock-native-personal-tools'",JSON.stringify(url(compile('stock-native-personal-tools').replace("'./native-layout'",JSON.stringify(url(compile('native-layout')))).replace("'./stock-screen-layout'",JSON.stringify(layout)).replace("'./device-status-profile'",JSON.stringify(url(compile('device-status-profile')))))));
source=source.replace("'./stock-native-web'",JSON.stringify(url("export const browserScreenPacks=[{url:'browser.json',alias:'browser',layouts:[],animations:[]}],miiverseScreenPacks=[{url:'miiverse.json',alias:'miiverse',layouts:[],animations:[]}];export const drawNativeWebFrame=()=>false;export const browserHudClock=()=>null;")));
source=source.replace("'./stock-native-services'",JSON.stringify(url('export const nativeServiceView=()=>null;export const drawNativeServiceFrame=()=>false;export const zoneClock=()=>({hour:"00",minute:"00",frame:0});export const eshopWelcomePose=()=>null;export const eshopHudClock=()=>({year:0,month:1,day:1,hour:0,minute:0});')));
source=source.replace("'./stock-native-helpers'",JSON.stringify(url('export const nativeHelperView=()=>null;export const drawNativeHelperFrame=()=>false;')));
source=source.replace("'./stock-native-selectors'",JSON.stringify(url('export const nativeSelectorView=()=>null;export const drawNativeSelectorFrame=()=>false;')));
source=source.replace("'./native-screen-input'",JSON.stringify(url(compile('native-screen-input'))));
source=source.replace("'./notes-boot-cover'",JSON.stringify(new URL('../src/os/notes-boot-cover.ts',import.meta.url).href));
const {createStockScreenPresentation,drawStockMediaImage}=await import(url(source));
let graphicsSource=compile('portfolio-screens');
const graphicsDependencies={
 three:`export * from ${JSON.stringify(new URL('../node_modules/three/build/three.module.js',import.meta.url).href)};export class WebGLRenderer{constructor(){throw Error('GPU disabled in unit fixture');}}`,
 './apps':'export const apps=[];export const getApp=()=>undefined;',
 './app-registry':'export const getTitle=()=>undefined;',
 './bitmap-font':'export const measureBitmapText=()=>({width:0});',
 './notes-suspended-capture':"export const createSuspendedApplicationCapture=()=>({sync(){},record(){},read:()=>({status:'none'}),dispose(){}});",
 './notes-metadata-session':"export const createNotesMetadataSession=()=>({sync(){},getState:()=>({status:'none'}),dispose(){}});",
 './notes-intro-publication':'export const notesIntroSourcesFromPacks=packs=>packs?{}:undefined;',
 './notes-intro-session':'export const createNotesIntroSession=()=>({sync(){},compose(){},getState:()=>({}),dispose(){}});',
};
for(const [dependency,stub]of Object.entries(graphicsDependencies))graphicsSource=graphicsSource.replace(`'${dependency}'`,JSON.stringify(url(stub)));
graphicsSource=graphicsSource.replace("'./system'",JSON.stringify(new URL('../src/os/system.ts',import.meta.url).href))
 .replace("'./stock-screen-presentation'",JSON.stringify(url(source)))
 .replace("'./notes-boot-cover'",JSON.stringify(new URL('../src/os/notes-boot-cover.ts',import.meta.url).href));
const {createPortfolioGraphics,setPortfolioFont}=await import(url(graphicsSource));
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
const notesPack=name=>JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/game-notes/'+name,import.meta.url),'utf8'));
const notesAssets=()=>{const assets=nativeAssets();assets.renderer={packs:{'notes-list':notesPack('contents/0000-00000007/memo-MemoListDown-empty-thumbnail.json'),'notes-messages':notesPack('messages-and-loose.json'),'notes-image':notesPack('memo-ImageScreenUp-arc-l.json'),'notes-hud-messages':notesPack('contents/0000-00000007/hud-messages.json')},draw:()=>true,drawLayout:()=>true};return assets;};
const notesCover=(owner,steps=0,ticket=1)=>({status:'boot-cover',owner,ticket,steps,upper:{},lower:{},scene9Draw:steps<=20,scene10Draw:steps<=20});
async function notesFixture(){
 const f=paintFixture();
 let state=tickSystem(launch(tickSystem(createPortfolioState(),3001),'game-notes',3010),6200);
 const owner=state.system.runtime.active,v=getActiveAppView(state),cover=notesCover(owner),terminal=notesCover(owner,21);
 const draw=pair=>f.screen.draw(f.top,f.bottom,v,owner,f.font,undefined,undefined,0,pair);
 const status=pair=>f.screen.status(v,owner,f.font,pair);
 draw(cover);await flush();
 const assets=notesAssets();
 calls[0].resolve(assets);await flush();
 const present=()=>f.screen.presentNotesBootCover(owner,()=>true);
 return {...f,owner,v,cover,terminal,draw,status,present,assets,getState:()=>state,dispatch:event=>{state=dispatchSystemEvent(state,event,6300);}};
}
test('prepared Notes pair is independent of local input readiness but requires both outward copies and current resources',async()=>{
 const f=await notesFixture();
 try{
  assert.equal(f.screen.preparedPair(f.owner),undefined);
  f.draw(f.cover);const first=f.screen.preparedPair(f.owner);assert.ok(first);assert.equal(f.status(f.cover),'loading');
  assert.equal(f.screen.preparedPair('game-notes:old'),undefined);
  f.draw(f.cover);assert.notEqual(f.screen.preparedPair(f.owner),first,'even a cached paint binds the current pair copies');
  const copy=f.bottom.drawImage;f.bottom.drawImage=()=>{throw Error('copy failed');};
  assert.throws(()=>f.draw(f.cover),/copy failed/);assert.equal(f.screen.preparedPair(f.owner),undefined);
  f.bottom.drawImage=copy;f.draw(f.cover);assert.ok(f.screen.preparedPair(f.owner));
  f.assets.renderer.draw=()=>false;assert.equal(f.draw(notesCover(f.owner,1)),false);assert.equal(f.screen.preparedPair(f.owner),undefined);
  assert.equal(f.screen.retry(),true);assert.equal(f.screen.preparedPair(f.owner),undefined);
  f.screen.sync(null);assert.equal(f.screen.preparedPair(f.owner),undefined);
  f.screen.dispose();assert.equal(f.screen.preparedPair(f.owner),undefined);
 }finally{f.dispose();}
});
test('actual graphics pause Notes local source tracks beneath common cover and expose a prepared pair without consuming the local gate',async()=>{
 const f=paintFixture();Object.assign(globalThis.document,{hidden:false,addEventListener(){},removeEventListener(){}});
 const graphics=createPortfolioGraphics();let state=tickSystem(launch(tickSystem(createPortfolioState(),3001),'game-notes',3010),6200);
 const owner=state.system.runtime.active,layouts=[];
 const at=host=>{const runtime=state.system.runtime,instance=runtime.instances[owner];state={...state,system:{...state.system,runtime:{...runtime,instances:{...runtime.instances,[owner]:{...instance,state:{...instance.state,notesHostMs:host}}}}}};};
 const draw=()=>graphics.overlay(f.top,f.bottom,state,6200,false,new Date(2026,8,22,20,18));
 setPortfolioFont(f.top,f.font);setPortfolioFont(f.bottom,f.font);
 try{
  graphics.setAppletEntryCovered(owner);graphics.stockStatus(state,f.top);await flush();
  const assets=notesAssets();Object.assign(assets.renderer.packs,{'notes-aplt-u':notesPack('memo-ApltBoot_U_00-arc-l.json'),'notes-aplt-d':notesPack('memo-ApltBoot_D_00-arc-l.json')});
  assets.renderer.drawLayout=(_ctx,alias,_name,layout)=>{if(alias==='notes-aplt-u')layouts.push(layout);return true;};
  calls[0].resolve(assets);await flush();
  for(let step=0;step<25;step++){at(step*1000/60);draw();assert.ok(graphics.preparedStockPair(state));assert.equal(graphics.presentNotesBootCover(state),false);}
  assert.equal(layouts.length,0,'paused local controller emits no source pose beneath the common cover');
  at(5000);graphics.setAppletEntryCovered(null);draw();const first=layouts.at(-1);assert.ok(first);
  assert.equal(graphics.stockStatus(state,f.top),'loading');assert.ok(graphics.preparedStockPair(state),'local input readiness cannot deadlock the outer handoff');
  assert.equal(graphics.presentNotesBootCover(state),true);at(5000+1000/60+.01);draw();assert.notDeepEqual(layouts.at(-1),first);
  graphics.setAppletEntryCovered(owner);at(10000);draw();assert.equal(graphics.presentNotesBootCover(state),false);
  graphics.setAppletEntryCovered(null);draw();assert.deepEqual(layouts.at(-1),layouts.at(-2),'hidden interval repeats the last source pose');
 }finally{graphics.dispose();setPortfolioFont(f.top);setPortfolioFont(f.bottom);f.dispose();}
});
test('Notes HUD clock repaints a settled pair only when visible calendar or charging phase changes',async()=>{
 const f=await notesFixture();let draws=0;
 f.assets.renderer.draw=(_ctx,alias)=>{if(alias==='notes-hud')draws++;return true;};
 const draw=date=>f.screen.draw(f.top,f.bottom,f.v,f.owner,f.font,undefined,date,0,f.terminal);
 try{
  assert.equal(draw(new Date(2026,8,22,20,18,0)),true);assert.equal(draws,1);
  assert.equal(draw(new Date(2026,8,22,20,18,2)),true);assert.equal(draws,1);
  assert.equal(draw(new Date(2026,8,22,20,18,3)),true);assert.equal(draws,2);
  assert.equal(draw(new Date(2026,8,22,20,19,3)),true);assert.equal(draws,3);
  assert.equal(draw(new Date(2027,8,22,20,19,3)),true);assert.equal(draws,4);
 }finally{f.dispose();}
});
for(const activation of ['A','slot touch'])test(`Notes ${activation} before cover completion cannot enter drawing or carry into readiness`,async()=>{
 const f=await notesFixture(),gate=createNativeScreenInputGate();
 const button=phase=>({type:'button',command:'open',phase,source:'key-a'});
 const touch=phase=>({type:'touch',phase,x:42,y:42,pointerId:3});
 const event=phase=>activation==='A'?button(phase):touch(phase);
 const send=(input,pair)=>{const decision=gate(input,f.status(pair));if(decision==='pass')f.dispatch(input);return decision;};
 try{
  assert.equal(f.draw(f.cover),true,String(f.screen.getFailure()));
  assert.equal(f.status(f.cover),'loading','a complete covered pair is not input-ready');
  assert.equal(send(event('down'),f.cover),'block');
  assert.equal(getActiveAppView(f.getState()).screen,'main');
  assert.equal(gate({type:'button',command:'home',phase:'down',source:'home'},f.status(f.cover)),'home');
  assert.equal(gate({type:'button',command:'power',phase:'down',source:'power'},f.status(f.cover)),'pass');
  assert.equal(f.status(f.terminal),'loading','sampling the terminal does not publish it');
  f.draw(f.terminal);assert.equal(f.status(f.terminal),'loading','the Canvas terminal still awaits valid renderFrame');
  assert.equal(f.present(),true);assert.equal(f.status(f.terminal),'ready');
  assert.equal(send(event('up'),f.terminal),'block','loading input is quarantined through release');
  assert.equal(getActiveAppView(f.getState()).screen,'main');
  assert.equal(send(event('down'),f.terminal),'pass');
  if(activation==='slot touch')assert.equal(send(event('up'),f.terminal),'pass');
  assert.equal(getActiveAppView(f.getState()).screen,'drawing');
 }finally{f.dispose();}
});
test('Notes terminal input receipt waits for both outward LCD copies, rejects a new ticket, and preserves recovery',async()=>{
 const f=await notesFixture();
 try{
  f.draw(f.cover);
  const copy=f.bottom.drawImage;f.bottom.drawImage=()=>{throw Error('LCD copy failed');};
  assert.throws(()=>f.draw(f.terminal),/LCD copy failed/);
  assert.equal(f.status(f.terminal),'loading');
  assert.equal(f.present(),false);
  f.bottom.drawImage=copy;f.draw(f.terminal);assert.equal(f.status(f.terminal),'loading');
  assert.equal(f.screen.presentNotesBootCover('game-notes:old',()=>true),false);
  assert.equal(f.screen.presentNotesBootCover(f.owner,()=>false),false,'failed render acknowledgement cannot release input');
  assert.equal(f.status(f.terminal),'loading');
  assert.equal(f.present(),true);assert.equal(f.status(f.terminal),'ready');
  assert.equal(f.present(),false,'a successful candidate receipt is consumed once');
  f.screen.revokeNotesBootCoverCandidate();assert.equal(f.status(f.terminal),'loading');
  f.draw(f.terminal);assert.equal(f.present(),true);assert.equal(f.status(f.terminal),'ready');
  const next=notesCover(f.owner,0,2);assert.equal(f.status(next),'loading');
  f.assets.renderer.draw=()=>false;
  assert.equal(f.draw(next),false);assert.equal(f.status(next),'error','recovery readiness supersedes the Notes gate');
  assert.equal(createNativeScreenInputGate()({type:'command',command:'open'},f.status(next)),'retry');
 }finally{f.dispose();}
});
test('Notes metadata-ready posed publication keeps its existing readiness path',async()=>{
 const f=await notesFixture();
 try{
  f.draw(f.cover);assert.equal(f.status(f.cover),'loading');
  const posed={status:'posed',title:{},upper:{},lower:{},scene9Draw:true,scene10Draw:true,titleUserVisible:false,ticket:3,steps:0};
  f.draw(posed);assert.equal(f.status(posed),'ready');
 }finally{f.dispose();}
});
test('Notes receipt cannot survive resource owner teardown or acknowledge after disposal',async()=>{
 const f=await notesFixture();
 try{
  f.draw(f.terminal);
  f.screen.sync(null);
  let accepted=0;
  assert.equal(f.screen.presentNotesBootCover(f.owner,()=>{accepted++;return true;}),false);
  assert.equal(accepted,0);assert.equal(f.assets.disposals,1);
  assert.equal(f.status(f.terminal),'loading');
  f.screen.dispose();
  assert.equal(f.screen.presentNotesBootCover(f.owner,()=>{accepted++;return true;}),false);
  assert.equal(accepted,0);
 }finally{f.dispose();}
});
test('Notes transition cadence stops for failed load/draw and resumes only after explicit retry',async()=>{
 const f=paintFixture();Object.assign(globalThis.document,{hidden:false,addEventListener(){},removeEventListener(){}});
 const graphics=createPortfolioGraphics(),state=tickSystem(launch(tickSystem(createPortfolioState(),3001),'game-notes',3010),6200);
 setPortfolioFont(f.top,f.font);setPortfolioFont(f.bottom,f.font);
 const readyAssets=notesAssets;
 try{
  assert.equal(graphics.notesBootCoverActive(state),true);
  assert.equal(graphics.stockStatus(state,f.top),'loading');await flush();
  calls[0].reject(Error('Notes load failed'));await flush();
  assert.equal(graphics.stockStatus(state,f.top),'loading','recovery is gated until its pair is copied');
  assert.match(String(graphics.stockFailure()),/Notes load failed/);
  assert.equal(graphics.notesBootCoverActive(state),false,'load failure cannot boost the recovery screen');
  graphics.overlay(f.top,f.bottom,state,6200,false);
  assert.equal(graphics.stockStatus(state,f.top),'error');
  assert.equal(graphics.retryStockScreen(),true);
  assert.equal(graphics.notesBootCoverActive(state),true,'explicit retry restores incomplete entry cadence');
  graphics.stockStatus(state,f.top);await flush();
  const failedDraw=readyAssets();failedDraw.renderer.draw=()=>false;calls[1].resolve(failedDraw);await flush();
  graphics.overlay(f.top,f.bottom,state,6200,false);
  assert.match(String(graphics.stockFailure()),/Native screen composition failed/);
  assert.equal(graphics.notesBootCoverActive(state),false,'draw failure cannot boost the recovery screen');
  assert.equal(graphics.retryStockScreen(),true);
  assert.equal(graphics.notesBootCoverActive(state),true);
  graphics.stockStatus(state,f.top);await flush();calls[2].resolve(readyAssets());await flush();
  graphics.overlay(f.top,f.bottom,state,6200,false);
  assert.equal(graphics.stockFailure(),null);
  assert.equal(graphics.notesBootCoverActive(state),true,'successful retry still awaits the boot-cover receipt');
 }finally{graphics.dispose();setPortfolioFont(f.top);setPortfolioFont(f.bottom);f.dispose();}
});
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
test('Settings local samples key phase publication and retain phase between source updates',async()=>{
 const f=paintFixture();
 try{
  f.v.data={settingsHudElapsedMs:0};f.draw();await flush();calls[0].resolve(nativeAssets());await flush();
  let draws=0;globalThis.__nativeTestDraw=()=>{draws++;return true;};
  const start=new Date(2026,8,26,3,32,20).getTime();
  for(const elapsed of [5868,6856,7825]){
   f.v.data.settingsHudElapsedMs=elapsed;f.drawAt(new Date(start+elapsed));
  }
  assert.equal(draws,3,'the native observed odd/even/odd phases publish three pairs');
  f.drawAt(new Date(start+7825+60000));assert.equal(draws,3,'same source update retains sampled calendar despite wall-clock change');
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

test('Sound room readiness holds the pair, releases on playback, and preserves recovery/retry',async()=>{
 let roomState={status:'loading'},roomOwner=null,notify=()=>{};const prepares=[];
 const soundRoom={prepare(owner,onChange){roomOwner=owner;prepares.push(owner);notify=onChange;return owner?roomState:{status:'inactive'};},draw(){return roomState.status==='ready';}};
 const f=paintFixture({soundRoom});f.v.appId='sound';
 try{
  f.draw('sound:1');await flush();calls[0].resolve(nativeAssets());await flush();
  f.draw('sound:1');assert.equal(f.screen.status(f.v,'sound:1',f.font),'loading');
  assert.deepEqual(f.top.marks,[['fill','#000']]);assert.deepEqual(f.bottom.marks,[['fill','#000']]);
  roomState={status:'ready'};notify();f.draw('sound:1');assert.equal(f.screen.status(f.v,'sound:1',f.font),'ready');
  f.v.screen='playback';f.draw('sound:1');assert.equal(roomOwner,null);assert.equal(f.screen.status(f.v,'sound:1',f.font),'ready');
  f.v.screen='main';roomState={status:'error',error:Error('room texture unavailable')};notify();f.draw('sound:1');
  assert.equal(f.screen.status(f.v,'sound:1',f.font),'error');assert.match(String(f.screen.getFailure()),/room texture/);
  assert.equal(f.screen.retry(),true);assert.equal(roomOwner,null);
  roomState={status:'ready'};f.draw('sound:1');await flush();calls[1].resolve(nativeAssets());await flush();f.draw('sound:1');
  assert.equal(f.screen.status(f.v,'sound:1',f.font),'ready');f.screen.sync(null);assert.equal(roomOwner,null);
 }finally{f.dispose();}
});

test('a hanging Sound room keeps the original preparation deadline after layouts finish',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const f=paintFixture({deadlineMs:100,soundRoom:{prepare:owner=>({status:owner?'loading':'inactive'}),draw:()=>false}});f.v.appId='sound';
 try{f.draw('sound:1');await flush();calls[0].resolve(nativeAssets());await flush();t.mock.timers.tick(100);f.draw('sound:1');assert.equal(f.screen.status(f.v,'sound:1',f.font),'error');assert.match(String(f.screen.getFailure()),/timed out/);}
 finally{f.dispose();t.mock.timers.reset();}
});


test('Camera mono photos use native contain with no upscaling; other media keeps its existing fit',()=>{
 const calls=[],image={},ctx={drawImage:(...args)=>calls.push(args)};
 drawStockMediaImage(ctx,image,2000,1500,0,0,400,240,'camera-mono');
 assert.deepEqual(calls.pop(),[image,40,0,320,240]);
 drawStockMediaImage(ctx,image,600,1200,0,0,400,240,'camera-mono');
 assert.deepEqual(calls.pop(),[image,140,0,120,240]);
 drawStockMediaImage(ctx,image,100,60,0,0,400,240,'camera-mono');
 assert.deepEqual(calls.pop(),[image,150,90,100,60]);
 drawStockMediaImage(ctx,image,100,60,0,0,400,240);
 assert.deepEqual(calls.pop(),[image,0,0,400,240]);
 drawStockMediaImage(ctx,image,2000,1500,32,43,256,128);
 assert.deepEqual(calls.pop(),[image,32+(256-2000*(128/1500))/2,43,2000*(128/1500),128]);
});

test('explicit MPO verification metadata follows source stereo browse crop',()=>{
 const calls=[],image={};const ctx={save:()=>calls.push('save'),beginPath:()=>calls.push('path'),rect:(...v)=>calls.push(['rect',...v]),clip:()=>calls.push('clip'),drawImage:(...v)=>calls.push(['image',...v]),restore:()=>calls.push('restore')};
 drawStockMediaImage(ctx,image,640,480,0,0,400,240,{kind:'camera-stereo',originalWidth:640,originalHeight:480,parallaxPixels:-44.553070068359375});
 assert.deepEqual(calls,['save','path',['rect',0,0,400,240],'clip',['image',image,-40+44.553070068359375*.75,-60,480,360],'restore']);
});


test('Health source frame keys paired publication and reduced motion freezes it',async()=>{
 let reduced=false,draws=0;const f=paintFixture({reducedMotion:()=>reduced});
 const v={...view('health-safety'),data:{healthElapsedMs:0}},drawAt=(ms,globalMs=900000)=>{v.data.healthElapsedMs=ms;return f.screen.draw(f.top,f.bottom,v,'health:1',f.font,undefined,new Date(2026,8,25),globalMs);};
 try{
  const entryFrames=[];
  globalThis.__nativeTestDraw=(t,b,options)=>{draws++;entryFrames.push(options.healthEntryFrame);t.fillText('health upper');b.fillText('health lower');return true;};
  drawAt(0);await flush();calls[0].resolve(nativeAssets());await flush();
  drawAt(0);assert.equal(draws,1);
  drawAt(1);assert.equal(draws,1,'same source frame reuses complete pair');
  drawAt(1,1900000);assert.equal(draws,1,'global page clock cannot change Health pose');
  drawAt(20);assert.equal(draws,2,'next source frame republishes both LCDs');
  assert.deepEqual(entryFrames,[0,1]);
  assert.deepEqual(f.top.marks,[['text','health upper']]);assert.deepEqual(f.bottom.marks,[['text','health lower']]);
  reduced=true;drawAt(40);assert.equal(draws,3);
  assert.equal(entryFrames.at(-1),20,'reduced motion selects the transparent source endpoint');
  drawAt(12000);assert.equal(draws,3,'reduced motion keeps source frame zero');
 }finally{f.dispose();}
});

test('Health entry reveal waits for the first complete pair instead of expiring during asset loading',async()=>{
 const f=paintFixture(),v={...view('health-safety'),data:{healthElapsedMs:0}},frames=[];
 const draw=ms=>{v.data.healthElapsedMs=ms;return f.screen.draw(f.top,f.bottom,v,'health:slow',f.font);};
 try{
  globalThis.__nativeTestDraw=(_t,_b,options)=>{frames.push(options.healthEntryFrame);return true;};
  draw(0);await flush();
  draw(1000);assert.deepEqual(frames,[],'loading never consumes or draws an entry pose');
  calls[0].resolve(nativeAssets());await flush();
  assert.equal(draw(1000),true);assert.deepEqual(frames,[0],'the first publish is source frame 0 despite late readiness');
  draw(1020);assert.deepEqual(frames,[0,1]);
 }finally{f.dispose();}
});

test('Health entry receipt commits only after success and survives same-owner HOME resume',async()=>{
 const f=paintFixture(),v={...view('health-safety'),data:{healthElapsedMs:1000}},frames=[];
 const draw=(ms,owner='health:receipt')=>{v.data.healthElapsedMs=ms;return f.screen.draw(f.top,f.bottom,v,owner,f.font);};
 try{
  draw(1000);await flush();calls[0].resolve(nativeAssets());await flush();
  globalThis.__nativeTestDraw=(_t,_b,options)=>{frames.push(options.healthEntryFrame);return false;};
  assert.equal(draw(1000),false);assert.deepEqual(frames,[0]);
  assert.equal(f.screen.retry(),true);draw(5000);await flush();calls[1].resolve(nativeAssets());await flush();
  globalThis.__nativeTestDraw=(_t,_b,options)=>{frames.push(options.healthEntryFrame);return true;};
  assert.equal(draw(5000),true);assert.equal(frames.at(-1),0,'failed draw cannot start the reveal clock');
  draw(5400);assert.equal(frames.at(-1),20);
  f.screen.sync(null);draw(9000);await flush();calls[2].resolve(nativeAssets());await flush();draw(9000);
  assert.equal(frames.at(-1),20,'the same resumed owner retains its completed entry');
  draw(9000,'health:replacement');await flush();calls[3].resolve(nativeAssets());await flush();draw(9000,'health:replacement');
  assert.equal(frames.at(-1),0,'a replacement owner receives a new entry reveal');
 }finally{f.dispose();}
});


test('verification Date supplies Settings main and Other pixels without replacing live retained samples',async()=>{
 const f=paintFixture();
 try{
  f.v.data={settingsHudElapsedMs:5000};f.draw();await flush();calls[0].resolve(nativeAssets());await flush();
  const live=new Date(2026,8,26,4,41,10),requested=new Date(2026,8,26,4,31,10),painted=[];
  globalThis.__nativeTestDraw=(_top,_bottom,_reduced,_date,hud)=>{painted.push(hud);return true;};
  // New owner guarantees the live sample begins from the explicit test date.
  f.screen.draw(f.top,f.bottom,f.v,'settings-clock-test',f.font,undefined,live);await flush();
  calls.at(-1).resolve(nativeAssets());await flush();
  const draw=(date,verification)=>f.screen.draw(f.top,f.bottom,f.v,'settings-clock-test',f.font,undefined,date,0,undefined,verification);
  draw(live);const retained=painted.at(-1);assert.equal(new Date(retained.dateMs).getMinutes(),41);
  for(const screen of ['main','other']){
   f.v.screen=screen;draw(requested,{sampleCalendar:true});assert.equal(new Date(painted.at(-1).dateMs).getMinutes(),31);
   draw(new Date(2026,8,26,4,32,10),{sampleCalendar:true});assert.equal(new Date(painted.at(-1).dateMs).getMinutes(),32);
   draw(live);assert.deepEqual(painted.at(-1),retained,'capture cannot overwrite retained live counter/calendar/phase');
  }
 }finally{f.dispose();}
});

test('Camera shoot readiness holds the pair, releases on gallery, and preserves recovery/retry',async()=>{
 let roomState={status:'loading'},roomOwner=null,notify=()=>{};const prepares=[];
 const cameraShoot={prepare(owner,onChange){roomOwner=owner;prepares.push(owner);notify=onChange;return owner?roomState:{status:'inactive'};},draw(){return roomState.status==='ready';}};
 const f=paintFixture({cameraShoot});f.v.appId='camera';f.v.screen='guide';
 try{
  f.draw('camera:1');await flush();calls[0].resolve(nativeAssets());await flush();
  f.draw('camera:1');assert.equal(f.screen.status(f.v,'camera:1',f.font),'loading');
  assert.deepEqual(f.top.marks,[['fill','#000']]);assert.deepEqual(f.bottom.marks,[['fill','#000']]);
  roomState={status:'ready'};notify();f.draw('camera:1');assert.equal(f.screen.status(f.v,'camera:1',f.font),'ready');
  f.v.screen='main';f.draw('camera:1');assert.equal(roomOwner,null);assert.equal(f.screen.status(f.v,'camera:1',f.font),'ready');
  f.v.screen='guide';roomState={status:'error',error:Error('room texture unavailable')};notify();f.draw('camera:1');
  assert.equal(f.screen.status(f.v,'camera:1',f.font),'error');assert.match(String(f.screen.getFailure()),/room texture/);
  assert.equal(f.screen.retry(),true);assert.equal(roomOwner,null);
  roomState={status:'ready'};f.draw('camera:1');await flush();calls[1].resolve(nativeAssets());await flush();f.draw('camera:1');
  assert.equal(f.screen.status(f.v,'camera:1',f.font),'ready');f.screen.sync(null);assert.equal(roomOwner,null);
 }finally{f.dispose();}
});
