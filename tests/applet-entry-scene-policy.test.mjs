import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { completeNotesFooterClose, completeNotificationsFooterClose, createPortfolioState, tickSystem, invokeSystemApplet, touchSystem } from '../src/os/system.ts';
import { createHomeBannerHost, crossHomeBannerBoundary, getHomeBannerHostView, getHomeBannerHostBackgroundFrame, resetHomeBannerPrimary, resolveHomeBannerHostSelection } from '../src/os/home-banner-host.ts';
import { enableHomeControls, selectHomeToolbarControlTouch } from '../src/os/home-controls.ts';
import { createNotesFooterClosePresentation } from '../src/os/notes-footer-close.ts';
import { createNotificationsFooterClosePresentation } from '../src/os/notifications-footer-close.ts';
const source=readFileSync(new URL('../src/scene/console-scene.ts',import.meta.url),'utf8');
const ast=ts.createSourceFile('console-scene.ts',source,ts.ScriptTarget.Latest,true);
const functions=new Map();
function visit(node){if(ts.isFunctionDeclaration(node)&&node.name)functions.set(node.name.text,node);ts.forEachChild(node,visit);}
visit(ast);
const render=ts.transpileModule(functions.get('renderFrame').getText(ast),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const loadScene=new Function('runtime','banner',`
 const {document,angle,topScreen,touchScreen,renderer,screens,performance}=runtime;
 const liveLcdRecorder=runtime.liveLcdRecorder??{observe(){},unavailable(){}},host=runtime.host??{dataset:{}};
 let state=runtime.state;
 let bannerHost=runtime.bannerHost??banner.createHomeBannerHost({generation:'test',updateCount:0},{managerInhibited:false,sceneInhibited:false,loadInhibited:false,nativeWorkerReady:true,resourceReady:null});
 const resetHomeBannerPrimary=banner.resetHomeBannerPrimary;
 const completeNotesFooterClose=runtime.completeNotesFooterClose,observeFolderBanner=runtime.observeFolderBanner??(()=>{}),effects=runtime.effects??{drain(){}},paint=runtime.paint??(()=>{});
 const completeNotificationsFooterClose=runtime.completeNotificationsFooterClose;
 const start=1000,scene={updateMatrixWorld(){}},camera={updateProjectionMatrix(){}},schedule={plan:()=>({shadows:false}),presented(){}};
 const poseSample=()=>({}),fitConsole=()=>{},publishProjectedTargets=()=>{},paintScreens=()=>{};
 const revokeTerminalPublications=()=>screens.revokeAppletEntryCandidate();
 let entryPublicationRepaintPending=false,frame=0,lastBootPresentedFrame,lastBootPaintFrame;
 let lastBootPresentedIdentity,lastBootPaintIdentity,lastLaunchPresentedIdentity,lastLaunchPaintIdentity,lastShutdownPresentedIdentity,lastShutdownPaintIdentity;
 const diagnostics=false;
 ${render}
 renderFrame.state=()=>state;renderFrame.banner=()=>bannerHost;return renderFrame;
`);
const load=runtime=>loadScene(runtime,{createHomeBannerHost,resetHomeBannerPrimary});

const observe=ts.transpileModule(functions.get('observeFolderBanner').getText(ast),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const screensSource=readFileSync(new URL('../src/os/screens.ts',import.meta.url),'utf8');
const screensAst=ts.createSourceFile('screens.ts',screensSource,ts.ScriptTarget.Latest,true);let readyFunction;
function findReady(node){if(ts.isFunctionDeclaration(node)&&node.name?.text==='homeAppletFooterBannerReady')readyFunction=node;ts.forEachChild(node,findReady);}
findReady(screensAst);
const readyCode=ts.transpileModule(readyFunction.getText(screensAst),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const bindReady=new Function('notesClosePresentation','notificationsClosePresentation',`${readyCode};const appletGeneration=2;return homeAppletFooterBannerReady;`);
const bindObserver=new Function('runtime','banner',`
 const {crossHomeBannerBoundary,getHomeBannerHostView,resolveHomeBannerHostSelection,resetHomeBannerPrimary}=banner;
 const {screens}=runtime;
 let state=runtime.state,bannerHost=runtime.bannerHost,bannerObservedPhase=state.system.phase,bannerEntryFooterBootSince=null,lastBannerRestartBootSince=null,bannerLabelFailure=false;
 const homeClockSuspended=false,bannerClock=()=>({...bannerHost.clock,updateCount:runtime.count}),isHomeSwitchPresentationActive=()=>false,homeTitleBannerKind=()=>null;
 const folderBanner={syncStockTitles(){},status:()=>({memoReady:true,newsReady:true})};
 ${observe}
 return (next,count)=>{state=next;runtime.count=count;observeFolderBanner();return bannerHost;};
`);
const bannerApi={crossHomeBannerBoundary,getHomeBannerHostView,resolveHomeBannerHostSelection,resetHomeBannerPrimary};
function selectedBanner(focus){
 let host=createHomeBannerHost({generation:'test',updateCount:0},{managerInhibited:false,sceneInhibited:false,loadInhibited:false,nativeWorkerReady:true,resourceReady:null});
 host=crossHomeBannerBoundary(host,host.clock,{selection:{kind:'toolbar',focus,category:focus===1?5:6}});
 host=crossHomeBannerBoundary(host,host.clock,{inputs:{...host.inputs,resourceReady:getHomeBannerHostView(host).resourceTicket}});
 return crossHomeBannerBoundary(host,{...host.clock,updateCount:13});
}

for(const [appId,focus,createPresentation,complete] of [
 ['game-notes',1,createNotesFooterClosePresentation,completeNotesFooterClose],
 ['notifications',3,createNotificationsFooterClosePresentation,completeNotificationsFooterClose],
])for(const reduced of [false,true])test(`actual ${appId} first/repeat footer return retires only its primary and waits for accepted HOME handoff (reduced ${reduced})`,()=>{
 const presentation=createPresentation(),other=createPresentation();
 const ready=bindReady(presentation,other);
 let home=selectHomeToolbarControlTouch(enableHomeControls(tickSystem(createPortfolioState(),3001)),focus),host=selectedBanner(focus),step=0;
 const now=()=>5000+step++*1000/60+.01;
 for(let cycle=0;cycle<2;cycle++){
  let state=touchSystem(invokeSystemApplet(home,appId,6400+cycle*1000),160,226,6401+cycle*1000);
  const owner=state.system.runtime.active,resources={},firmware={};
  function candidate(){const time=now(),pose=presentation.sample(state,2,time,true,reduced),pair={};assert.equal(presentation.bind(pose,pair,pose.kind==='feedback'||pose.kind==='out'?resources:firmware),true);return {time,pose,pair};}
  function accept(value){return presentation.present(value.pose,state,2,value.time,true,value.pair,value.pose.kind==='feedback'||value.pose.kind==='out'?resources:firmware);}
  let endpoint;
  for(let i=0;i<25;i++){
   const value=candidate();
   if(value.pose.kind==='out'&&value.pose.frame===20){endpoint=value;break;}
   assert.equal(accept(value),null);
  }
  assert.equal(endpoint.pose.frame,20);
  const original=host,background=getHomeBannerHostBackgroundFrame(host),clock={...host.clock},scope=host.scope;
  const screens=new Proxy({
   presentNotesFooterClose:current=>appId==='game-notes'?presentation.present(endpoint.pose,current,2,endpoint.time,true,endpoint.pair,resources):null,
   presentNotificationsFooterClose:current=>appId==='notifications'?presentation.present(endpoint.pose,current,2,endpoint.time,true,endpoint.pair,resources):null,
  },{get:(target,key)=>target[key]??(()=>null)});
  const run=load({document:{hidden:false},state,bannerHost:host,angle:100,topScreen:{visible:true},touchScreen:{visible:true},screens,
   renderer:{getContext:()=>({isContextLost:()=>false}),render(){}},performance:{now:()=>endpoint.time+1000},
   completeNotesFooterClose:complete,completeNotificationsFooterClose:complete});
  run();state=run.state();host=run.banner();
  assert.equal(state.system.phase,'home');assert.equal(state.system.runtime.instances[owner],undefined);
  assert.equal(host.service,null);assert.equal(host.active,null);assert.equal(host.scope,scope);
  assert.deepEqual(host.clock,clock);assert.deepEqual(getHomeBannerHostBackgroundFrame(host),background);
  assert.equal(getHomeBannerHostView(original).primary.motion.visible,true);
  const observeHost=bindObserver({state,bannerHost:host,screens:{homeAppletFooterBannerReady:ready,homeEntryFooterReadiness:()=>({}),homeFolderBannerRequestReady:()=>true,homeEntryActivationReady:()=>true,homeFolderBannerActivationReady:()=>true}},bannerApi);
  let count=clock.updateCount;
  host=observeHost(state,count);
  const replacementTicket=getHomeBannerHostView(host).resourceTicket;
  assert.notDeepEqual(replacementTicket,getHomeBannerHostView(original).resourceTicket);
  assert.equal(host.scope,scope+1);
  let handoff;
  for(let i=0;i<24;i++){
   const value=candidate();
   host=observeHost(state,++count);
   assert.equal(getHomeBannerHostView(host).primary,null);
   const liveBackground=getHomeBannerHostBackgroundFrame(host);
   assert.equal(liveBackground.loopEpoch,background.loopEpoch);
   assert.equal(liveBackground.sceneInEpoch,background.sceneInEpoch);
   assert.equal(liveBackground.loopFrame,(background.loopFrame+count-clock.updateCount)%600);
   assert.equal(ready(state),false);
   if(value.pose.kind==='handoff'){handoff=value;break;}
   assert.equal(accept(value),null);
  }
  assert.equal(handoff.pose.kind,'handoff');
  assert.equal(presentation.present(handoff.pose,state,2,handoff.time,false,handoff.pair,firmware),null);
  assert.equal(presentation.present(handoff.pose,state,3,handoff.time,true,handoff.pair,firmware),null);
  assert.equal(presentation.present(handoff.pose,state,2,handoff.time,true,{},firmware),null);
  host=observeHost(state,++count);assert.equal(getHomeBannerHostView(host).primary,null);assert.equal(ready(state),false);
  assert.equal(accept(handoff),null);assert.equal(ready(state),true);
  host=observeHost(state,count);assert.equal(getHomeBannerHostView(host).primary,null);
  for(let i=0;i<7&&getHomeBannerHostView(host).status!=='active';i++)host=observeHost(state,++count);
  assert.deepEqual(getHomeBannerHostView(host).primary.selection,{kind:'toolbar',focus,category:focus===1?5:6});
  assert.equal(getHomeBannerHostView(host).primary.motion.scale,Math.fround(.8));
  for(let i=0;i<6;i++)host=observeHost(state,++count);
  assert.equal(getHomeBannerHostView(host).primary.motion.scale,1);
  assert.equal(host.clock.generation,'test');assert.equal(host.clock.updateCount,count);
  home=state;
 }
});

test('actual footer publication cannot reset a primary when the receipt owner no longer completes',()=>{
 const state=touchSystem(invokeSystemApplet(tickSystem(createPortfolioState(),3001),'notifications',3100),160,226,3200),host=selectedBanner(3);
 for(const receiptOwner of [null,'stale-owner']){
  const screens=new Proxy({presentNotesFooterClose:()=>null,presentNotificationsFooterClose:()=>receiptOwner},{get:(target,key)=>target[key]??(()=>null)});
  const run=load({document:{hidden:false},state,bannerHost:host,angle:100,topScreen:{visible:true},touchScreen:{visible:true},screens,
   renderer:{getContext:()=>({isContextLost:()=>false}),render(){}},performance:{now:()=>5000},completeNotificationsFooterClose});
  run();assert.equal(run.state(),state);assert.equal(run.banner(),host);
  assert.equal(getHomeBannerHostView(run.banner()).primary.motion.visible,true);
 }
});

test('actual render acknowledges common cover after WebGL success, before Notes, with a fresh clock and strict visible/context guards',()=>{
 for(const patch of [{},{hidden:true},{powered:false},{sleeping:true},{angle:12},{upper:false},{lower:false},{lost:true},{renderFailure:true}]){
  const events=[],screens=new Proxy({},{get:(_target,name)=>name==='presentAppletEntry'?(_state,elapsed)=>events.push([name,elapsed]):()=>{events.push([name]);return null;}});
  const renderer={getContext:()=>({isContextLost:()=>!!patch.lost}),render(){events.push(['render']);if(patch.renderFailure)throw Error('GPU failed');}};
  const run=load({document:{hidden:!!patch.hidden},state:{powered:patch.powered??true,system:{sleeping:!!patch.sleeping}},angle:patch.angle??100,topScreen:{visible:patch.upper??true},touchScreen:{visible:patch.lower??true},renderer,screens,performance:{now:()=>1400}});
  if(patch.renderFailure)assert.throws(run,/GPU failed/);else run();
  if(Object.keys(patch).length===0){assert.ok(events.findIndex(e=>e[0]==='render')<events.findIndex(e=>e[0]==='presentAppletEntry'));assert.ok(events.findIndex(e=>e[0]==='presentAppletEntry')<events.findIndex(e=>e[0]==='presentNotesBootCover'));assert.deepEqual(events.find(e=>e[0]==='presentAppletEntry'),['presentAppletEntry',400]);}
  else{assert.equal(events.some(e=>e[0]==='presentAppletEntry'),false);assert.ok(events.some(e=>e[0]==='revokeAppletEntryCandidate'));}
 }
});

test('actual Notifications removal requires a visible awake paired render, including context/sleep/lid/dispose-candidate guards',()=>{
 for(const patch of [{},{hidden:true},{sleeping:true},{powered:false},{angle:12},{upper:false},{lower:false},{lost:true},{renderFailure:true}]){
  const events=[];
  let state=touchSystem(invokeSystemApplet(tickSystem(createPortfolioState(),3001),'notifications',3100),160,226,3200),owner=state.system.runtime.active;
  state={...state,powered:patch.powered??true,system:{...state.system,sleeping:!!patch.sleeping}};
  const screens=new Proxy({presentNotesFooterClose:()=>null,presentNotificationsFooterClose(){events.push('receipt');return owner;}},{get:(target,key)=>target[key]??(()=>null)});
  const bannerHost=selectedBanner(3);
  const run=load({document:{hidden:!!patch.hidden},state,bannerHost,angle:patch.angle??100,topScreen:{visible:patch.upper??true},touchScreen:{visible:patch.lower??true},screens,
   renderer:{getContext:()=>({isContextLost:()=>!!patch.lost}),render(){events.push('render');if(patch.renderFailure)throw Error('GPU failed');}},performance:{now:()=>5000},
   completeNotificationsFooterClose(current,id,now){events.push('complete');return completeNotificationsFooterClose(current,id,now);},
   effects:{drain(){events.push('cleanup');}},observeFolderBanner(){events.push('banner');},paint(){events.push('paint');}});
  if(patch.renderFailure)assert.throws(run,/GPU failed/);else run();
  if(Object.keys(patch).length===0){assert.deepEqual(events,['render','receipt','complete','banner','cleanup','paint']);assert.equal(run.state().system.runtime.instances[owner],undefined);assert.equal(run.state().system.phase,'home');}
  else{assert.equal(events.includes('receipt'),false);assert.ok(run.state().system.runtime.instances[owner]);assert.equal(run.banner(),bannerHost);assert.equal(getHomeBannerHostView(run.banner()).primary.motion.visible,true);}
 }
});

test('actual scene removes Notes only after a valid outgoing terminal receipt, then drains the existing cleanup and repaints HOME',()=>{
 for(const valid of [true,false]){
  const events=[];
  const state=touchSystem(invokeSystemApplet(tickSystem(createPortfolioState(),3001),'game-notes',3100),160,226,3200),owner=state.system.runtime.active;
  const screens=new Proxy({presentNotesFooterClose(){events.push('close-receipt');return owner;}},{get:(target,key)=>target[key]??(()=>null)});
  const bannerHost=selectedBanner(1);
  const run=load({document:{hidden:!valid},state,bannerHost,angle:100,topScreen:{visible:true},touchScreen:{visible:true},
   renderer:{getContext:()=>({isContextLost:()=>false}),render(){events.push('render');}},screens,performance:{now:()=>5000},
   completeNotesFooterClose(current,id,now){events.push('complete');return completeNotesFooterClose(current,id,now);},
   effects:{drain(){events.push('cleanup');}},observeFolderBanner(){events.push('banner');},paint(){events.push('paint');}});
  run();
  if(valid){assert.deepEqual(events,['render','close-receipt','complete','banner','cleanup','paint']);assert.equal(run.state().system.runtime.instances[owner],undefined);}
  else{assert.deepEqual(events,['render']);assert.ok(run.state().system.runtime.instances[owner]);assert.equal(run.banner(),bannerHost);assert.equal(getHomeBannerHostView(run.banner()).primary.motion.visible,true);}
 }
});

test('common entry joins only the existing guarded transition LCD cadence; diagnostics retain kind/frame/owner',()=>{
 const cadence=source.slice(source.indexOf('const entryActive='),source.indexOf('const bootFrame=',source.indexOf('const entryActive=')));
 assert.match(cadence,/const entryActive=state\.powered&&angle>12&&!homeClockSuspended&&!document\.hidden&&!state\.system!\.sleeping&&topScreen\.visible&&touchScreen\.visible&&!renderer\.getContext\(\)\.isContextLost\(\)\s*&&\([^;]*screens\.appletEntryActive\(state\)\)/);
 assert.match(cadence,/const lcdFps=screenPaintFps\(quality,closeAdvanced\|\|entryActive\)/);
 assert.match(source,/appletEntry:appletEntry\?\?null/);
 assert.match(functions.get('paintScreens').getText(ast),/manualEntryObservedElapsedMs:performance\.now\(\)-start/);
 assert.match(functions.get('paintScreens').getText(ast),/painted\?\.appletEntry/);
});
