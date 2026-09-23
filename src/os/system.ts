import { createSystemHomeFolderClose, beginSystemHomeFolderClose, advanceSystemHomeFolderClose, cancelSystemHomeFolderClose, reconcileSystemHomeFolderClose, isSystemHomeFolderClosing, type SystemHomeFolderCloseSession } from './home-folder-close-system.ts';
import { createHomeCursorLoop, type HomeCursorLoop } from './home-cursor-loop.ts';
export { sampleSystemHomeFolderClose, isSystemHomeFolderClosing, type SystemHomeFolderCloseRecord, type SystemHomeFolderCloseSession } from './home-folder-close-system.ts';
import { getApp } from './apps.ts';
import { clearHomeFolderIdentities, createHomeFolderIdentities, getHomeFolderIdentities, type HomeFolderIdentities } from './home-folder-identity.ts';
import { getTitle, initialAppLayout } from './app-registry.ts';
import { initialState, reduceMenu, touchMenu, isHomeFolderBackTouch, type MenuState, type Input } from './state.ts';
import { activeInstance, acknowledgeEffects, closeApplication, createAppRuntime, deliverCapabilityResult, dispatchRuntime, openApplet, resumeRuntimeApplication, runtimeView, setRuntimeSleeping, showRuntimeHome, startApplication, tickRuntime, type AppRuntime } from './app-host.ts';
import { createInputLatch, latchInput, latchTouch, repeatInput, type InputLatch } from './app-input.ts';
import type { AppEvent, AppState, SaveRecord } from './app-types.ts';
import { homeSlotAppId, moveHomeItem, restoreHomeLayout, type FolderLayouts } from './home-layout.ts';
import { cancelHomeGesture, createHomeNavigation, resetHomeNavigation, tickHomeGesture, touchHomeGesture, homeTouchLocation, type HomeNavigation } from './home-gestures.ts';
import { selectHomeSlot, saveHomeView, restoreHomeView, homeDensityIndex, HOME_DENSITIES, writeHomeNavigation, createHomeUpdateClock, stepHomeUpdateClock, type HomeUpdateClock } from './home-navigation.ts';
export { homeSlotAppId, moveHomeItem } from './home-layout.ts';
export { getHomeGestureView } from './home-gestures.ts';
export type System = {
 phase:'boot'|'home'|'launch'|'app'|'power'|'off'; since:number; sleeping:boolean;
 app:string|null; pending:string|null; item:number; detail:boolean; page:number; photo:number;
 layout:Record<number,string>; muted:boolean; volume:number; dialog:'switch'|'close'|null;
 returnPhase:'home'|'app'; link:string|null; preferences:boolean; preferenceChoice:number;
 runtime: AppRuntime; input: InputLatch; folderLayouts: FolderLayouts; homeNavigation: HomeNavigation; homeClock: HomeUpdateClock; homeFolderIdentities: HomeFolderIdentities; homeFolderClose: SystemHomeFolderCloseSession; homeCursorLoop: HomeCursorLoop;
};
export function createPortfolioState():MenuState {return {...initialState,folders:{},system:{phase:'boot',since:0,sleeping:false,app:null,pending:null,item:0,detail:false,page:0,photo:0,layout:initialAppLayout(),muted:false,volume:.35,dialog:null,returnPhase:'home',link:null,preferences:false,preferenceChoice:0,runtime:createAppRuntime(),input:createInputLatch(),folderLayouts:{},homeNavigation:createHomeNavigation(),homeClock:createHomeUpdateClock(),homeFolderIdentities:createHomeFolderIdentities(),homeFolderClose:createSystemHomeFolderClose(),homeCursorLoop:createHomeCursorLoop()}};}
/** Kept for portfolio artwork compatibility; use selectedTitle for every installed title. */
export function selectedApp(state:MenuState){return getApp(homeSlotAppId(state,state.opened?state.folderSelected:state.selected));}
export function selectedTitle(state:MenuState){return getTitle(homeSlotAppId(state,state.opened?state.folderSelected:state.selected));}
export function currentEntry(state:MenuState){const s=state.system;return getApp(s?.app)?.entries[s?.item??0];}
export function getActiveAppView(state: MenuState, now?: number) { return state.system ? runtimeView(state.system.runtime, now) : null; }
function syncRuntime(state: MenuState, runtime: AppRuntime, phase?: System['phase']): MenuState {
 if(runtime.active!==state.system?.runtime.active)state=resetHomeNavigation(cancelSystemHomeFolderClose(state));
 const s=state.system!, application=runtime.application?runtime.instances[runtime.application]:undefined;
 const portfolio=application&&getApp(application.appId)?application.state:null;
 return {...state,system:{...s,runtime,input:runtime.active===s.runtime.active?s.input:createInputLatch(),app:application?.appId??null,phase:phase??(runtime.active?'app':'home'),link:runtime.link,
  ...(portfolio?{item:Number(portfolio.item),detail:portfolio.detail===true,page:Number(portfolio.page),photo:Number(portfolio.photo)}:{item:0,detail:false,page:0,photo:0})}};
}
function commitRuntime(state: MenuState, runtime: AppRuntime, now: number): MenuState {
 const pending=runtime.pendingLaunch;let next=syncRuntime(state,pending?{...runtime,pendingLaunch:null}:runtime);
 if(pending)next=launch(next,pending,now);
 return next;
}
export function launch(state:MenuState,id:string,now:number):MenuState {
 state=resetHomeNavigation(cancelSystemHomeFolderClose(state));
 const s=state.system!, title=getTitle(id);if(!title)return state;
 if(title.kind!=='application')return invokeSystemApplet(state,id,now);
 if(s.app===id)return {...syncRuntime(state,resumeRuntimeApplication(s.runtime,now),'app'),panel:null};
 if(s.app){const released=releaseSystemInputs(state,now);return {...released,panel:null,system:{...released.system!,runtime:showRuntimeHome(released.system!.runtime,now),pending:id,dialog:'switch'}};}
 const started=syncRuntime(state,startApplication(s.runtime,id,now),'launch');
 return {...started,panel:null,system:{...started.system!,since:now,dialog:null,pending:null,input:createInputLatch()}};
}
export function invokeSystemApplet(state: MenuState, appId: string, now: number, args: AppState = {}): MenuState {
 state=resetHomeNavigation(cancelSystemHomeFolderClose(state));
 const s=state.system;if(!s||getTitle(appId)?.kind==='application')return state;
 const next=syncRuntime(state,openApplet(s.runtime,appId,`home:${appId}`,args,now));
 return {...next,panel:null,system:{...next.system!,input:createInputLatch()}};
}
/** One logical update source for navigation and presentation-owned clips. */
export function tickHomeNavigationClock(state: MenuState, now: number, reduced = false): MenuState {
 state=reconcileSystemHomeFolderClose(state);
 const s=state.system;if(!s||!Number.isFinite(now))return state;
 const active=state.powered&&s.phase==='home'&&!s.sleeping&&!s.dialog&&!s.preferences&&!state.panel;
 const stepped=stepHomeUpdateClock(s.homeClock,now,active);
 if(stepped.clock!==s.homeClock)state={...state,system:{...s,homeClock:stepped.clock}};
 return active?advanceSystemHomeFolderClose(state,stepped.updates,reduced):state;
}
export function tickSystem(state:MenuState,now:number,reduced=false):MenuState {
 let s=state.system;if(!s||!Number.isFinite(now))return state;
 state=tickHomeNavigationClock(state,now,reduced);s=state.system!;
 if(s.sleeping!==s.runtime.sleeping){state={...state,system:{...s,runtime:setRuntimeSleeping(s.runtime,s.sleeping,now),input:createInputLatch()}};s=state.system!;}
 if(s.sleeping)return cancelHomeGesture(state);
 state=isSystemHomeFolderClosing(state)?cancelHomeGesture(state):tickHomeGesture(state,now);s=state.system!;
 const duration=s.phase==='boot'?(reduced?300:3000):s.phase==='launch'?(reduced?120:1100):Infinity;
 if(now-s.since>=duration)return {...state,system:{...s,phase:s.phase==='boot'?'home':'app',runtime:{...s.runtime,lastTick:now}}};
 if(s.phase!=='home'&&s.phase!=='app')return state;
 const repeated=repeatInput(s.input,now);if(repeated.latch!==s.input)state={...state,system:{...s,input:repeated.latch}};
 for(const event of repeated.events)state=state.system!.phase==='app'&&!state.system!.preferences&&!state.system!.dialog?commitRuntime(state,dispatchRuntime(state.system!.runtime,event,now),now):reduceSystem(state,event.command,now);
 if(state.system!.phase==='app'&&!state.system!.preferences&&!state.system!.dialog)return commitRuntime(state,tickRuntime(state.system!.runtime,now),now);
 return state;
}
export function reduceSystem(state:MenuState,input:Input,now:number):MenuState {
 let s=state.system;if(!s||!Number.isFinite(now))return !s?reduceMenu(state,input):state;
 state=cancelHomeGesture(tickHomeNavigationClock(state,now));
 if(['back','home'].includes(input)&&!isSystemHomeFolderClosing(state))state=resetHomeNavigation(state);
 s=state.system!;
 const change=(patch:Partial<System>):MenuState=>({...state,system:{...s!,link:null,...patch}});
 if(input==='power'){
  if(s.phase==='off')return {...state,powered:true,panel:null,system:{...s,phase:'boot',since:now,sleeping:false,app:null,dialog:null,runtime:{...s.runtime,sleeping:false,lastTick:now},input:createInputLatch(),homeCursorLoop:createHomeCursorLoop()}};
  if(s.phase==='power')return state;
  state=releaseSystemInputs(state,now);s=state.system!;
  return change({phase:'power',preferences:false,returnPhase:s.phase==='app'?'app':'home',runtime:showRuntimeHome(s.runtime,now),dialog:null,input:createInputLatch()});
 }
 if(s.phase==='off'||s.sleeping||s.phase==='boot'||s.phase==='launch')return state;
 if(input==='mute')return change({muted:!s.muted});
 if(input==='volume-up'||input==='volume-down')return change({volume:Math.max(0,Math.min(1,s.volume+(input==='volume-up'?.1:-.1)))});
 if(input==='preferences'){
  state=releaseSystemInputs(state,now);s=state.system!;
  return change({preferences:!s.preferences,runtime:s.phase==='app'?(s.preferences?resumeRuntimeApplication(s.runtime,now):showRuntimeHome(s.runtime,now)):s.runtime});
 }
 if(s.preferences){
  if(input==='back'||input==='home')return change({preferences:false,input:createInputLatch(),runtime:s.phase==='app'?resumeRuntimeApplication(s.runtime,now):s.runtime});
  if(input==='up'||input==='down')return change({preferenceChoice:Math.max(0,Math.min(2,s.preferenceChoice+(input==='down'?1:-1)))});
  if(input==='left'||input==='right')return reduceSystem(state,input==='left'?'volume-down':'volume-up',now);
  if(input==='open'&&s.preferenceChoice===2)return reduceSystem(state,'reset-layout',now);
  if(input==='reset-layout')return writeHomeNavigation({...state,folders:{},folderSelected:0,system:{...s,layout:initialAppLayout(),folderLayouts:{},homeFolderIdentities:clearHomeFolderIdentities(getHomeFolderIdentities(state)),homeFolderClose:createSystemHomeFolderClose(s.homeFolderClose)}},createHomeNavigation());
  if(input==='open')return change({muted:!s.muted});return state;
 }
 if(s.phase==='power'){
  if(input==='back'||input==='home')return change({phase:s.returnPhase,input:createInputLatch(),runtime:s.returnPhase==='app'?resumeRuntimeApplication(s.runtime,now):s.runtime});
  if(input==='open')return cancelSystemHomeFolderClose({...change({phase:'off',app:null,runtime:closeApplication(s.runtime,now),input:createInputLatch()}),powered:false,panel:null});return state;
 }
 if(s.dialog){
  if(input==='back')return change({dialog:null,pending:null,input:createInputLatch(),runtime:s.phase==='app'?resumeRuntimeApplication(s.runtime,now):s.runtime});
  if(input==='open'){
   const closing=syncRuntime(state,closeApplication(s.runtime,now),'home');const closed={...closing,system:{...closing.system!,dialog:null,pending:null}};
   return s.pending?launch(closed,s.pending,now):closed;
  }return state;
 }
 if(input==='home'){
  if(state.panel)return {...state,panel:null};
  const runtime=s.phase==='app'?showRuntimeHome(s.runtime,now):resumeRuntimeApplication(s.runtime,now);
  return {...syncRuntime(state,runtime),panel:null,system:{...syncRuntime(state,runtime).system!,input:createInputLatch()}};
 }
 if(s.phase==='app'){
  if(input==='brightness')return reduceMenu(state,input);
  const mapping:Partial<Record<Input,import('./app-types.ts').AppCommand>>={left:'left',right:'right',up:'up',down:'down',open:'open',back:'back',x:'x',y:'y',l:'l',r:'r',start:'start',select:'select'};
  const command=mapping[input];return command?commitRuntime(state,dispatchRuntime(s.runtime,{type:'command',command},now),now):state;
 }
 if(isSystemHomeFolderClosing(state))return state;
 if(input==='back'&&!state.panel&&state.opened){
  state=beginSystemHomeFolderClose(state);
  return {...state,system:{...state.system!,input:createInputLatch()}};
 }
 if(input==='start')return reduceSystem(state,'open',now);
 if(input==='open'&&!state.panel){const title=selectedTitle(state);if(title)return launch(state,title.id,now);}
 if(input==='back'&&!state.panel&&!state.opened&&s.app)return change({dialog:'close'});
 return reduceMenu(state,input==='x'?'zoom':input==='y'?'brightness':input==='select'?'zoom':input==='l'?'left':input==='r'?'right':input);
}
const toolbarApps:Record<string,string>={notes:'game-notes',friends:'friends',notifications:'notifications',browser:'browser',miiverse:'miiverse'};
export function touchSystem(state:MenuState,x:number,y:number,now:number):MenuState {
 if(!Number.isFinite(now)||!Number.isFinite(x)||!Number.isFinite(y)||x<0||x>=320||y<0||y>=240)return state;
 state=cancelHomeGesture(tickHomeNavigationClock(state,now));
 const s=state.system;if(!s)return touchMenu(state,x,y);
 if(s.sleeping||s.phase==='off'||s.phase==='boot'||s.phase==='launch')return state;
 const send=(input:Input)=>reduceSystem(state,input,now);
 if(s.preferences){if(y>=212)return send('back');if(y>=53&&y<92)return send('mute');if(y>=106&&y<147)return send(x<160?'volume-down':'volume-up');if(y>=165&&y<204)return send('reset-layout');return state;}
 if(s.phase==='power'||s.dialog)return y>=170?send(x<160?'back':'open'):state;
 if(s.phase==='app'){
  const active=activeInstance(s.runtime);
  if(active&&getTitle(active.appId)?.source==='firmware')return commitRuntime(state,dispatchRuntime(s.runtime,{type:'touch',phase:'up',x,y},now),now);
  if(y>=212){if(x<100)return send('back');if(x>220)return send('open');return s.detail&&(currentEntry(state)?.images?.length??0)>1?send(x<160?'left':'right'):state;}
  if(s.detail){if(y>=174)return send(x<160?'up':'down');if(y<32)return send(x<160?'left':'right');return state;}
  const first=Math.floor(s.item/4)*4,index=first+Math.floor((y-38)/41),app=getApp(s.app);
  if(y>=38&&y<202&&app&&index<app.entries.length){
   if(index===s.item)return send('open');
   if(active){const runtime={...s.runtime,instances:{...s.runtime.instances,[active.id]:{...active,state:{...active.state,item:index,photo:0}}}};return syncRuntime(state,runtime);}
  }
  if(y<32)return send(x<160?'up':'down');return state;
 }
 if(isSystemHomeFolderClosing(state))return state;
 if(isHomeFolderBackTouch(state,x,y))return send('back');
 if(!state.panel&&y>=212&&selectedTitle(state)){if(state.opened)return send(x<100?'back':'open');return x<100&&s.app?{...state,system:{...s,dialog:'close'}}:send('open');}
 if(!state.panel&&y>=(state.opened?49:34)&&y<204){
  if(y>=104&&y<158&&(x<20||x>=300))return send(x<20?'left':'right');
  const location=homeTouchLocation(state,x,y);if(!location)return state;
  const selected=state.opened?state.folderSelected:state.selected;
  return location.slot===selected&&(!state.opened||homeSlotAppId(state,location.slot))?send('open'):selectHomeSlot(state,location.slot);
 }
 if(state.panel==='settings'&&x>=265&&y>=145&&y<201)return send('preferences');
 const next=touchMenu(state,x,y);const target=next.panel&&toolbarApps[next.panel];
 return target?invokeSystemApplet({...next,panel:null},target,now):next;
}
/** Full pointer/button protocol for scene adapters. Legacy single-command inputs remain supported. */
export function dispatchSystemEvent(state: MenuState,event: AppEvent,now: number): MenuState {
 let s=state.system;if(!s||!Number.isFinite(now))return state;
 if(event.type==='analog'){if(!Number.isFinite(event.x)||!Number.isFinite(event.y))return state;event={...event,x:Math.max(-1,Math.min(1,event.x)),y:Math.max(-1,Math.min(1,event.y))};}
 if((s.sleeping||s.phase==='off'||s.phase==='boot'||s.phase==='launch')&&!(event.type==='button'&&event.command==='power')&&!(event.type==='command'&&event.command==='power'))return state;
 if(event.type==='touch'){
  const touched=latchTouch(s.input,event);if(!touched.accepted)return state;
  state=tickHomeNavigationClock(state,now);s=state.system!;
  if(s.phase==='home'&&!s.preferences&&!s.dialog&&isSystemHomeFolderClosing(state))return state;
  state={...state,system:{...s,input:touched.latch}};s=state.system!;
  if(s.phase==='home'&&!s.preferences&&!s.dialog&&!s.sleeping){const result=touchHomeGesture(state,event,now);return result.tap?touchSystem(result.state,event.x,event.y,now):result.state;}
 }
 if(event.type==='button'||event.type==='analog'||event.type==='command'){
  state=tickHomeNavigationClock(state,now);s=state.system!;
  if(s.phase==='home'&&!s.preferences&&!s.dialog&&isSystemHomeFolderClosing(state)
   &&(event.type==='analog'||!['power','home','preferences','mute','volume-up','volume-down'].includes(event.command)))return state;
  const latched=latchInput(s.input,event,now);let next:MenuState={...state,system:{...s,input:latched.latch}};
  const foreground=s.phase==='app'&&!s.sleeping&&!s.preferences&&!s.dialog;
  const globalButton=event.type==='button'&&(event.command==='home'||event.command==='power');
  if(foreground&&event.type==='button'&&!globalButton){
   return commitRuntime(next,dispatchRuntime(s.runtime,{...event,activate:latched.commands.includes(event.command)},now),now);
  }
  if(foreground&&event.type==='analog')next=commitRuntime(next,dispatchRuntime(s.runtime,event,now),now);
  for(const command of latched.commands)next=reduceSystem(next,command,now);
  return next;
 }
 if(s.phase!=='app'||s.sleeping||s.preferences||s.dialog)return event.type==='touch'&&event.phase==='up'?touchSystem(state,event.x,event.y,now):state;
 if(event.type==='touch'&&getTitle(activeInstance(s.runtime)?.appId)?.source==='portfolio'){
  const next=commitRuntime(state,dispatchRuntime(s.runtime,event,now),now);return event.phase==='up'?touchSystem(next,event.x,event.y,now):next;
 }
 return commitRuntime(state,dispatchRuntime(s.runtime,event,now),now);
}
export function resolveSystemCapability(state: MenuState,owner:string,event:Extract<AppEvent,{type:'capability-result'}>,now:number):MenuState {
 if(!state.system)return state;const runtime=deliverCapabilityResult(state.system.runtime,owner,event,now);return runtime===state.system.runtime?state:commitRuntime(state,runtime,now);
}
export function acknowledgeSystemEffects(state: MenuState,ids:readonly number[]):MenuState {return state.system?{...state,system:{...state.system,runtime:acknowledgeEffects(state.system.runtime,ids),link:null}}:state;}
export function restoreRuntimeData(state:MenuState,shared:AppState,saves:Record<string,SaveRecord>):MenuState {return state.system&&state.system.runtime.sequence===0?{...state,system:{...state.system,runtime:createAppRuntime(shared,saves)}}:state;}
export function setSystemSleeping(state:MenuState,sleeping:boolean,now:number):MenuState {
 if(!state.system||!Number.isFinite(now))return state;
 state=releaseSystemInputs(state,now);return {...state,system:{...state.system!,sleeping,input:createInputLatch(),runtime:setRuntimeSleeping(state.system!.runtime,sleeping,now)}};
}
export function releaseSystemInputs(state:MenuState,now=state.system?.runtime.lastTick??0):MenuState {
 state=isSystemHomeFolderClosing(state)?cancelHomeGesture(state):resetHomeNavigation(state);
 const s=state.system;if(!s)return state;
 let runtime=s.runtime;
 for(const [source,held]of Object.entries(s.input.held))runtime=dispatchRuntime(runtime,{type:'button',command:held.command,phase:'up',source,activate:false},now);
 if(s.input.touch)runtime=dispatchRuntime(runtime,{type:'touch',phase:'cancel',...s.input.touch},now);
 return {...state,system:{...s,runtime,input:createInputLatch(),homeClock:{...s.homeClock,lastNow:null,remainderMs:0}}};
}
/** Legacy root-only entry point; scene input should use the phase protocol instead. */
export function moveApp(state:MenuState,from:number,to:number):MenuState {
 if(isSystemHomeFolderClosing(state))return state;
 state=resetHomeNavigation(state);
 return state.system?.layout[from]?moveHomeItem(state,{folder:null,slot:from},{folder:null,slot:to}):state;
}
export const STORAGE_KEY='paramveer-3ds-v1';
export function saveSettings(state:MenuState){const s=state.system!,homeView=saveHomeView(state);return JSON.stringify({version:4,homeView,theme:state.theme,brightness:state.brightness,columns:HOME_DENSITIES[homeView.rootView.density],powerSaving:state.powerSaving,folders:state.folders,nextFolderNumber:state.nextFolderNumber,layout:s.layout,folderLayouts:s.folderLayouts,muted:s.muted,volume:s.volume});}
export function restoreSettings(state:MenuState,raw:string|null):MenuState {
 if(!raw||!state.system)return state;
 try{const v=JSON.parse(raw),home=restoreHomeLayout(v);if(!home)return state;
 const {layout,folders,folderLayouts,nextFolderNumber}=home;
 const restored = {...state,folders,nextFolderNumber,powerSaving:v.powerSaving===true,theme:['white','red','blue','yellow','pink','black'].includes(v.theme)?v.theme:'white',brightness:[.2,.4,.6,.8,1].includes(v.brightness)?v.brightness:1,columns:[3,4,6,8,10,12].includes(v.columns)?v.columns:4,system:{...state.system,layout,folderLayouts,homeNavigation:createHomeNavigation(),homeClock:createHomeUpdateClock(),homeFolderIdentities:createHomeFolderIdentities(folders),homeFolderClose:createSystemHomeFolderClose(state.system.homeFolderClose),muted:v.muted===true,volume:typeof v.volume==='number'&&Number.isFinite(v.volume)?Math.max(0,Math.min(1,v.volume)):.35}};
 return restoreHomeView(restored,v.version===4?v.homeView:null,homeDensityIndex(restored.columns));
 }catch{return state;}
}
