import {systemTransitionDuration} from './system-transitions.ts';
import type { HomeApplicationTransition, HomeApplicationTransitionIntent } from './home-application-transition.ts';
import { advanceSystemHomeApplicationTransition, beginSystemHomeApplicationTransition, cancelSystemHomeApplicationTransition, isSystemHomeApplicationTransitionActive, reconcileSystemHomeApplicationTransition, sampleSystemHomeApplicationTransition } from './system-home-application-transition.ts';
import { createSystemHomeFolderClose, beginSystemHomeFolderClose, advanceSystemHomeFolderClose, cancelSystemHomeFolderClose, reconcileSystemHomeFolderClose, isSystemHomeFolderClosing, sampleSystemHomeFolderClose, type SystemHomeFolderCloseSession } from './home-folder-close-system.ts';
import { createHomeCursorLoop, advanceHomeCursorLoop, type HomeCursorLoop } from './home-cursor-loop.ts';
import { getHomeCursorSlot } from './home-cursor-visibility.ts';
import { cancelHomeControls, cancelHomeControlTouch, isHomeControlsActive, isHomeSwitchPresentationActive, queueHomeControlEvent, queueHomeControlTouch, reconcileHomeControlGesture, reconcileHomeControls, selectHomeControlTouch, stepHomeControls, type HomeControls, type HomeControlPass } from './home-controls.ts';
import { getHomeToolbarCursorAnchor } from './home-cursor-presentation.ts';
export { sampleSystemHomeFolderClose, isSystemHomeFolderClosing, type SystemHomeFolderCloseRecord, type SystemHomeFolderCloseSession } from './home-folder-close-system.ts';
export { sampleSystemHomeApplicationTransition, isSystemHomeApplicationTransitionActive } from './system-home-application-transition.ts';
import { getApp } from './apps.ts';
import { clearHomeFolderIdentities, createHomeFolderIdentities, getHomeFolderIdentities, type HomeFolderIdentities } from './home-folder-identity.ts';
import { getTitle, initialAppLayout, isPreviousDefaultAppLayout } from './app-registry.ts';
import { initialState, reduceMenu, touchMenu, isHomeFolderBackTouch, setHomeSettingsScroll, type MenuState, type Input } from './state.ts';
import { HOME_FOOTER_TOUCH_GEOMETRY, homeFolderNoticeActionAt, homeFolderSettingsActionAt, homeSettingsScrollAt, homeSettingsActionAt, homeLayoutConfirmationAt, softwareDialogActionAt, powerMenuActionAt } from './stock-screen-layout.ts';
import { homeFooterHit, ownedHomeFooterContact } from './home-footer-touch.ts';
import { serializeHomeSavedLayouts, restoreHomeSavedLayouts } from './home-saved-layouts.ts';
import { activeInstance, acknowledgeEffects, closeApplication, completeApplet, createAppRuntime, deliverCapabilityResult, dispatchRuntime, openApplet, resumeRuntimeApplication, runtimeView, setRuntimeSleeping, showRuntimeHome, startApplication, startSettingsHelper, tickRuntime, type AppRuntime } from './app-host.ts';
import { createInputLatch, latchInput, latchTouch, repeatInput, type InputLatch } from './app-input.ts';
import type { AppEvent, AppState, SaveRecord } from './app-types.ts';
import { homeSlotAppId, moveHomeItem, restoreHomeLayout, selectHomeLocation, type FolderLayouts } from './home-layout.ts';
import { cancelHomeGesture, createHomeNavigation, resetHomeNavigation, tickHomeGesture, touchHomeGesture, homeTouchLocation, type HomeNavigation } from './home-gestures.ts';
import { selectHomeSlot, settleHomeNavigation, getHomeNavigation, getHomeExposedExtent, saveHomeView, restoreHomeView, homeDensityIndex, HOME_DENSITIES, writeHomeNavigation, createHomeGridFocus, createHomeUpdateClock, stepHomeUpdateClock, type HomeUpdateClock } from './home-navigation.ts';
import { pageHomeViewport } from './home-scroll-consumer.ts';
export { homeSlotAppId, moveHomeItem } from './home-layout.ts';
export { getHomeGestureView } from './home-gestures.ts';
export type System = {
 phase:'boot'|'home'|'launch'|'app'|'power'|'shutdown'|'off'; since:number; sleeping:boolean;
 app:string|null; pending:string|null; item:number; detail:boolean; page:number; photo:number;
 layout:Record<number,string>; muted:boolean; volume:number; dialog:'switch'|'close'|null;
 returnPhase:'home'|'app'; link:string|null; preferences:boolean; preferenceChoice:number;
 runtime: AppRuntime; input: InputLatch; folderLayouts: FolderLayouts; homeNavigation: HomeNavigation; homeClock: HomeUpdateClock; homeFolderIdentities: HomeFolderIdentities; homeFolderClose: SystemHomeFolderCloseSession; homeApplicationTransition: HomeApplicationTransition | null; homeCursorLoop: HomeCursorLoop; homeControls: HomeControls | null;
};
export function createPortfolioState():MenuState {return {...initialState,folders:{},system:{phase:'boot',since:0,sleeping:false,app:null,pending:null,item:0,detail:false,page:0,photo:0,layout:initialAppLayout(),muted:false,volume:.35,dialog:null,returnPhase:'home',link:null,preferences:false,preferenceChoice:0,runtime:createAppRuntime(),input:createInputLatch(),folderLayouts:{},homeNavigation:createHomeNavigation(),homeClock:createHomeUpdateClock(),homeFolderIdentities:createHomeFolderIdentities(),homeFolderClose:createSystemHomeFolderClose(),homeApplicationTransition:null,homeCursorLoop:createHomeCursorLoop(),homeControls:null}};}
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
 const pending=runtime.pendingLaunch;
 if(pending){
  const helper=startSettingsHelper(runtime,pending,now);
  if(helper!==runtime){
   const next=syncRuntime(state,helper,'launch');
   return {...next,panel:null,system:{...next.system!,since:now,dialog:null,pending:null,input:createInputLatch()}};
  }
 }
 let next=syncRuntime(state,pending?{...runtime,pendingLaunch:null}:runtime);
 if(pending)next=launch(next,pending,now);
 return next;
}
export function launch(state:MenuState,id:string,now:number):MenuState {
 state=reconcileSystemHomeApplicationTransition(state);
 if(isSystemHomeApplicationTransitionActive(state))return state;
 state=resetHomeNavigation(cancelSystemHomeFolderClose(state));
 const s=state.system!, title=getTitle(id);if(!title)return state;
 if(title.kind!=='application')return invokeSystemApplet(state,id,now);
 if(s.app===id)return {...syncRuntime(state,resumeRuntimeApplication(s.runtime,now),'app'),panel:null};
 if(s.app){const released=releaseSystemInputs(state,now);return {...released,panel:null,system:{...released.system!,runtime:showRuntimeHome(released.system!.runtime,now),pending:id,dialog:'switch'}};}
 const started=syncRuntime(state,startApplication(s.runtime,id,now),'launch');
 return {...started,panel:null,system:{...started.system!,since:now,dialog:null,pending:null,input:createInputLatch()}};
}
/** Hidden accessibility title shortcuts should leave HOME focused on the title they opened. */
export function launchHomeShortcut(state:MenuState,id:string,now:number):MenuState {
 state=reconcileSystemHomeApplicationTransition(state);
 const system=state.system;if(!system||system.phase!=='home'||isSystemHomeApplicationTransitionActive(state))return state;
 const root=Object.entries(system.layout).find(([,title])=>title===id);
 if(root)state=selectHomeLocation(state,{folder:null,slot:Number(root[0])});
 else for(const [folder,layout] of Object.entries(system.folderLayouts)){
  const child=Object.entries(layout).find(([,title])=>title===id);
  if(child){state=selectHomeLocation(state,{folder:Number(folder),slot:Number(child[0])});break;}
 }
 return launch(state,id,now);
}
function requestApplicationClose(state:MenuState,now:number):MenuState {
 const s=state.system!;
 const owner=s.runtime.application?s.runtime.instances[s.runtime.application]:undefined;
 // Observed Health HOME Close returns directly; do not generalize its policy to other titles or switching.
 if(s.phase==='home'&&s.app==='health-safety'&&owner?.appId===s.app&&selectedTitle(state)?.id===owner.appId&&owner.suspended&&!owner.closing&&s.runtime.active===null&&s.runtime.homeReturn===owner.id){
  return beginSystemHomeApplicationTransition({...state,system:{...s,dialog:null,pending:null,input:createInputLatch()}},{kind:'close'});
 }
 return {...state,system:{...s,dialog:'close',input:createInputLatch()}};
}
export function invokeSystemApplet(state: MenuState, appId: string, now: number, args: AppState = {}): MenuState {
 state=reconcileSystemHomeApplicationTransition(state);
 if(isSystemHomeApplicationTransitionActive(state))return state;
 state=resetHomeNavigation(cancelSystemHomeFolderClose(state));
 const s=state.system;if(!s||getTitle(appId)?.kind==='application')return state;
 const next=syncRuntime(state,openApplet(s.runtime,appId,`home:${appId}`,args,now));
 return {...next,panel:null,system:{...next.system!,input:createInputLatch()}};
}
/** One logical update source for navigation and presentation-owned clips. */
export function tickHomeNavigationClock(state: MenuState, now: number, reduced = false): MenuState {
 return tickHomeNavigationClockObserved(state,now,reduced).state;
}
/** Scene consumes journals once; nested action reducers see the same timestamp
 * and therefore cannot replay their input, cue or banner observations. */
export function tickHomeNavigationClockObserved(state: MenuState, now: number, reduced = false): {state:MenuState;passes:readonly HomeControlPass[]} {
 state=reconcileSystemHomeApplicationTransition(reconcileSystemHomeFolderClose(state));
 const s=state.system;if(!s||!Number.isFinite(now))return {state,passes:[]};
 const applicationTransition=isSystemHomeApplicationTransitionActive(state);
 const applicationTransitionEligible=applicationTransition&&state.powered&&s.phase==='home'&&!s.sleeping&&!s.dialog&&!s.preferences&&!state.panel;
 const active=isHomeControlsActive(state)&&!applicationTransition;
 const stepped=stepHomeUpdateClock(s.homeClock,now,active||isHomeSwitchPresentationActive(state)||applicationTransitionEligible);
 if(applicationTransition){
  const advanced=advanceSystemHomeApplicationTransition(state,stepped.updates,applicationTransitionEligible);
  state=advanced.state;
  const processed=advanced.processedUpdates;
  const clock=processed<stepped.updates
   ?{lastNow:now,remainderMs:0,updateCount:s.homeClock.updateCount+processed}
   :stepped.clock;
  if(state.system!.homeClock!==clock)state={...state,system:{...state.system!,homeClock:clock}};
  if(advanced.commit){
   const transition=state.system!.homeApplicationTransition;
   if(transition&&transition.identity.owner===advanced.commit.identity.owner){
    const intent:HomeApplicationTransitionIntent=advanced.commit.intent;
    const closed=syncRuntime(state,closeApplication(state.system!.runtime,now),'home');
    state={...closed,system:{...closed.system!,homeApplicationTransition:null,dialog:null,pending:null,input:createInputLatch()}};
    if(intent.kind==='switch')state=launch(state,intent.appId,now);
   }
  }
  return {state,passes:[]};
 }
 if(active&&s.homeControls){
  const passes:HomeControlPass[]=[];
  if(stepped.updates===0&&stepped.clock!==s.homeClock)state={...state,system:{...s,homeClock:stepped.clock}};
  for(let i=1;i<=stepped.updates;i++){
   state={...state,system:{...state.system!,homeClock:{...stepped.clock,updateCount:s.homeClock.updateCount+i}}};
   const passNow=now-stepped.clock.remainderMs-(stepped.updates-i)*1000/60;
   const beforeGesture=state,afterGesture=tickHomeGesture(state,passNow);
   state=beforeGesture.system!.homeNavigation.activeFolderSlot!==afterGesture.system!.homeNavigation.activeFolderSlot
    ?reconcileHomeControls(beforeGesture,afterGesture):reconcileHomeControlGesture(afterGesture);
   const pass=stepHomeControls(state);state=pass.state;
   if(pass.handoff){
    // The audited open call ends the native input pass. Existing application
    // and folder lifecycles remain explicit browser bridges after that point.
    state=reduceSystem(state,'open',now);
    state={...state,system:{...state.system!,homeClock:{...state.system!.homeClock,lastNow:null,remainderMs:0}}};
    passes.push(Object.freeze({...pass,state}));break;
   }
   passes.push(pass);
  }
  return {state,passes};
 }
 if(stepped.clock!==s.homeClock)state={...state,system:{...s,homeClock:stepped.clock}};
 return {state:active?advanceHomePresentationClocks(state,stepped.updates,reduced):state,passes:[]};
}
/** Lower navigation tasks precede the cursor layout submission. The close's
 * selection-ready update itself is eligible, followed by any visible tail.
 * Ordinary geometry can expose a selected tile mid-batch; inspect only its
 * bounded motion steps before consuming the remaining stable interval.
 */
function advanceHomePresentationClocks(state:MenuState,updates:number,reduced:boolean):MenuState {
 const submitCursor=(current:MenuState,count:number):MenuState=>{
  // Read after lower-task work: a mode3 entry may change step while preserving
  // phase. A cached pre-task cursor would overwrite that same-pass change.
  const cursor=advanceHomeCursorLoop(current.system!.homeCursorLoop,count,getHomeCursorSlot(current)!==null);
  return cursor===current.system!.homeCursorLoop?current:{...current,system:{...current.system!,homeCursorLoop:cursor}};
 };
 if(isSystemHomeFolderClosing(state)){
  const before=sampleSystemHomeFolderClose(state)!;
  state=advanceSystemHomeFolderClose(state,updates,reduced);
  const after=sampleSystemHomeFolderClose(state),ready=after?.selectionReadyAtUpdate;
  if(after&&ready!==null&&ready!==undefined&&before.controller.identity.generation===after.controller.identity.generation
   &&before.controller.identity.transitionId===after.controller.identity.transitionId){
   const count=state.system!.homeClock.updateCount;
   if(ready>count-updates&&ready<=count)state=submitCursor(state,count-ready+1);
  }
 }else{
  let remaining=updates;
  while(remaining>0&&!reduced&&state.system!.homeNavigation.motion&&!state.system!.homeNavigation.gesture){
   state=advanceSystemHomeFolderClose(state,1,reduced);
   state=submitCursor(state,1);remaining--;
  }
  state=advanceSystemHomeFolderClose(state,remaining,reduced);
  state=submitCursor(state,remaining);
 }
 return state;
}
export function tickSystem(state:MenuState,now:number,reduced=false):MenuState {
 let s=state.system;if(!s||!Number.isFinite(now))return state;
 state=reconcileSystemHomeApplicationTransition(state);s=state.system!;
 const applicationTransition=isSystemHomeApplicationTransitionActive(state);
 state=tickHomeNavigationClock(state,now,reduced);s=state.system!;
 if(s.sleeping!==s.runtime.sleeping){state={...state,system:{...s,runtime:setRuntimeSleeping(s.runtime,s.sleeping,now),input:createInputLatch()}};s=state.system!;}
 if(s.sleeping)return cancelHomeGesture(state);
 // One outer host tick owns one close-controller batch. In particular, the
 // terminal frame cannot fall through to repeats/runtime work before painting.
 if(applicationTransition)return state;
 state=isSystemHomeFolderClosing(state)?cancelHomeGesture(state):tickHomeGesture(state,now);s=state.system!;
 const duration=systemTransitionDuration(s.phase,reduced);
 if(s.phase==='shutdown'&&now-s.since>=duration)return {...state,powered:false,panel:null,system:{...s,phase:'off',since:now}};
 if(now-s.since>=duration)return {...state,system:{...s,phase:s.phase==='boot'?'home':'app',runtime:{...s.runtime,lastTick:now}}};
 if(s.phase!=='home'&&s.phase!=='app')return state;
 const repeated=repeatInput(s.input,now);if(repeated.latch!==s.input)state={...state,system:{...s,input:repeated.latch}};
 for(const event of repeated.events)state=state.system!.phase==='app'&&!state.system!.preferences&&!state.system!.dialog?commitRuntime(state,dispatchRuntime(state.system!.runtime,event,now),now):reduceSystem(state,event.command,now);
 if(state.system!.phase==='app'&&!state.system!.preferences&&!state.system!.dialog)return commitRuntime(state,tickRuntime(state.system!.runtime,now),now);
 return state;
}
export function reduceSystem(state:MenuState,input:Input,now:number):MenuState {
 return reconcileHomeControls(state,reduceSystemAction(state,input,now));
}
function reduceSystemAction(state:MenuState,input:Input,now:number):MenuState {
 let s=state.system;if(!s||!Number.isFinite(now))return !s?reduceMenu(state,input):state;
 state=reconcileSystemHomeApplicationTransition(state);
 const applicationTransition=isSystemHomeApplicationTransitionActive(state);
 state=tickHomeNavigationClock(state,now);
 if(applicationTransition&&!['power','mute','volume-up','volume-down'].includes(input))return state;
 if(['left','right','up','down'].includes(input)){
  const queued=queueHomeControlEvent(state,{type:'command',command:input as 'left'|'right'|'up'|'down'});if(queued)return queued;
 }
 state=cancelHomeGesture(state);
 if(['back','home'].includes(input)&&!isSystemHomeFolderClosing(state))state=resetHomeNavigation(state);
 s=state.system!;
 const change=(patch:Partial<System>):MenuState=>({...state,system:{...s!,link:null,...patch}});
 if(input==='power'){
  if(s.phase==='off')return {...state,powered:true,panel:null,system:{...s,phase:'boot',since:now,sleeping:false,app:null,dialog:null,runtime:{...s.runtime,sleeping:false,lastTick:now},input:createInputLatch(),homeCursorLoop:createHomeCursorLoop(),
   // A cold boot starts on the selected HOME tile, not the toolbar focus left
   // behind by the previous session. Keep the saved tile/folder view itself.
   homeNavigation:{...s.homeNavigation,focus:createHomeGridFocus(),gesture:null,motion:null}}};
  if(s.phase==='power'||s.phase==='shutdown')return state;
  state=cancelSystemHomeApplicationTransition(state);s=state.system!;
  state=releaseSystemInputs(state,now);s=state.system!;
  return change({phase:'power',since:now,preferences:false,returnPhase:s.phase==='app'?'app':'home',app:null,runtime:closeApplication(s.runtime,now),dialog:null,input:createInputLatch()});
 }
 if(s.phase==='off'||s.phase==='shutdown'||s.sleeping||s.phase==='boot'||s.phase==='launch')return state;
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
  if(input==='back'||input==='home')return change({phase:'home',input:createInputLatch()});
  if(input==='open')return cancelSystemHomeFolderClose({...change({phase:'shutdown',since:now,app:null,runtime:closeApplication(s.runtime,now),input:createInputLatch()}),panel:null});return state;
 }
 if(s.dialog){
  if(input==='back')return change({dialog:null,pending:null,input:createInputLatch(),runtime:s.phase==='app'?resumeRuntimeApplication(s.runtime,now):s.runtime});
  if(input==='open'){
   const intent:HomeApplicationTransitionIntent=s.pending?{kind:'switch',appId:s.pending}:{kind:'close'};
   return beginSystemHomeApplicationTransition({...state,system:{...s,dialog:null,pending:null,input:createInputLatch()}},intent);
  }return state;
 }
 if(input==='home'){
  if(state.panel)return {...state,panel:null};
  const returning=s.phase==='home'&&s.runtime.homeReturn?s.runtime.instances[s.runtime.homeReturn]:undefined;
  // Notes' accepted HOME exit destroys its scenes before returning to HOME (scene9 → APT 0x101).
  // Complete the applet normally, then keep any caller suspended on HOME; never revive the old Notes owner.
  const closeNotes=returning?.appId==='game-notes'&&returning.suspended&&!returning.closing&&s.runtime.systemApplet===returning.id;
  const runtime=closeNotes?showRuntimeHome(completeApplet(s.runtime,returning.id,null,true,now),now)
   :s.phase==='app'?showRuntimeHome(s.runtime,now):resumeRuntimeApplication(s.runtime,now);
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
 if(input==='open'&&!state.panel&&s.homeControls&&s.homeNavigation.focus.toolbarActive){
  // Existing feature entrypoints remain the adapter for native toolbar focus.
  const anchor=getHomeToolbarCursorAnchor(s.homeNavigation.focus.currentFocus).center;
  return touchSystem(state,anchor.x,anchor.y,now);
 }
 if(input==='open'&&!state.panel){const title=selectedTitle(state);if(title)return launch(state,title.id,now);}
 if((input==='back'||input==='x'&&selectedTitle(state)?.id===s.app)&&!state.panel&&!state.opened&&s.app)return requestApplicationClose(state,now);
 return reduceMenu(state,state.panel==='home-layouts'&&(input==='x'||input==='y')?input:input==='x'?'zoom':input==='y'?'brightness':input==='select'?'zoom':input==='l'?'left':input==='r'?'right':input);
}
const toolbarApps:Record<string,string>={notes:'game-notes',friends:'friends',notifications:'notifications',browser:'browser',miiverse:'miiverse'};
export function touchSystem(state:MenuState,x:number,y:number,now:number):MenuState {
 return reconcileHomeControls(state,touchSystemAction(state,x,y,now));
}
function pageSystemHomeViewport(state:MenuState,direction:'left'|'right'){
 const s=state.system;if(!s)return state;
 const result=pageHomeViewport({navigation:s.homeNavigation,cursorLoop:s.homeCursorLoop,extent:getHomeExposedExtent(state)},direction,1);
 if(result.state.navigation===s.homeNavigation&&result.state.cursorLoop===s.homeCursorLoop)return state;
 state=writeHomeNavigation(state,result.state.navigation);
 return result.state.cursorLoop===s.homeCursorLoop?state:{...state,system:{...state.system!,homeCursorLoop:result.state.cursorLoop}};
}
function touchSystemAction(state:MenuState,x:number,y:number,now:number):MenuState {
 if(!Number.isFinite(now)||!Number.isFinite(x)||!Number.isFinite(y)||x<0||x>=320||y<0||y>=240)return state;
 state=reconcileSystemHomeApplicationTransition(state);
 const applicationTransition=isSystemHomeApplicationTransitionActive(state);
 state=cancelHomeGesture(tickHomeNavigationClock(state,now));
 const s=state.system;if(!s)return touchMenu(state,x,y);
 if(applicationTransition)return state;
 if(s.sleeping||s.phase==='off'||s.phase==='shutdown'||s.phase==='boot'||s.phase==='launch')return state;
 const send=(input:Input)=>reduceSystem(state,input,now);
 if(s.preferences){if(y>=212)return send('back');if(y>=53&&y<92)return send('mute');if(y>=106&&y<147)return send(x<160?'volume-down':'volume-up');if(y>=165&&y<204)return send('reset-layout');return state;}
 if(s.phase==='power'){const action=powerMenuActionAt(x,y);return action?send(action):state;}
 if(s.dialog){const action=softwareDialogActionAt(x,y);return action?send(action):state;}
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
 const focus=s.homeNavigation.focus;
 if(!state.panel&&y>=212&&s.homeControls&&focus.toolbarActive&&focus.currentFocus>=1&&focus.currentFocus<=5)return send('open');
 if(isHomeFolderBackTouch(state,x,y))return send('back');
 if(!state.panel&&y>=212&&selectedTitle(state)){
  const hit=homeFooterHit(state,HOME_FOOTER_TOUCH_GEOMETRY,x,y);
  if(!hit)return state;
  if(hit.action==='close-folder')return send('back');
  if(hit.action==='close-software')return requestApplicationClose(state,now);
  if(hit.action==='manual')return invokeSystemApplet(state,'manual',now,{manualTitleId:selectedTitle(state)!.titleId!});
  return send('open');
 }
 if(!state.panel&&y>=(state.opened?49:34)&&y<204){
  if(y>=104&&y<158&&(x<20||x>=300))return pageSystemHomeViewport(state,x<20?'left':'right');
  const location=homeTouchLocation(state,x,y);if(!location)return state;
  if(s.homeControls&&!s.homeNavigation.motion){
   // Compatibility one-shot touches use the same sampled widget route.
   const down=queueHomeControlTouch(state,{type:'touch',phase:'down',x,y});
   return down.handled?queueHomeControlTouch(down.state,{type:'touch',phase:'up',x,y}).state:state;
  }
  const selected=state.opened?state.folderSelected:state.selected;
  return location.slot===selected&&!s.homeNavigation.focus.toolbarActive&&(!state.opened||homeSlotAppId(state,location.slot))?send('open')
   :selectHomeControlTouch(state,location.slot)??selectHomeSlot(state,location.slot);
 }
 const next=touchMenu(state,x,y);const target=next.panel&&toolbarApps[next.panel];
 return target?invokeSystemApplet({...next,panel:null},target,now):next;
}
/** Full pointer/button protocol for scene adapters. Legacy single-command inputs remain supported. */
export function dispatchSystemEvent(state: MenuState,event: AppEvent,now: number): MenuState {
 return reconcileHomeControls(state,dispatchSystemEventAction(state,event,now));
}
function dispatchSystemEventAction(state: MenuState,event: AppEvent,now: number): MenuState {
 let s=state.system;if(!s||!Number.isFinite(now))return state;
 state=reconcileSystemHomeApplicationTransition(state);s=state.system!;
 const applicationTransition=isSystemHomeApplicationTransitionActive(state);
 if(event.type==='analog'){if(!Number.isFinite(event.x)||!Number.isFinite(event.y))return state;event={...event,x:Math.max(-1,Math.min(1,event.x)),y:Math.max(-1,Math.min(1,event.y))};}
 if((s.sleeping||s.phase==='off'||s.phase==='shutdown'||s.phase==='boot'||s.phase==='launch')&&!(event.type==='button'&&event.command==='power')&&!(event.type==='command'&&event.command==='power'))return state;
 if(applicationTransition){
  state=tickHomeNavigationClock(state,now);
  if(event.type==='command'&&['power','mute','volume-up','volume-down'].includes(event.command))return reduceSystem(state,event.command,now);
  if(event.type==='button'&&['power','mute','volume-up','volume-down'].includes(event.command)){
   const current=state.system!,latched=latchInput(current.input,event,now);
   let next:MenuState={...state,system:{...current,input:latched.latch}};
   for(const command of latched.commands)next=reduceSystem(next,command,now);
   return next;
  }
  return state;
 }
 if(event.type==='touch'){
  const previousTouch=s.input.touch;
  const touched=latchTouch(s.input,event);if(!touched.accepted)return state;
  state=tickHomeNavigationClock(state,now);s=state.system!;
  if(s.phase==='home'&&!s.preferences&&!s.dialog&&isSystemHomeFolderClosing(state))return state;
  state={...state,system:{...s,input:touched.latch}};s=state.system!;
  if(s.dialog&&!s.preferences&&s.phase!=='power'){
   const contact=previousTouch??touched.latch.touch;
   const action=contact&&softwareDialogActionAt(contact.startX,contact.startY);
   return event.phase==='up'&&action&&action===softwareDialogActionAt(event.x,event.y)?touchSystem(state,event.x,event.y,now):state;
  }
  if(s.phase==='home'&&!s.preferences&&!s.dialog&&state.panel==='home-layouts'&&state.homeLayoutAction){
   const contact=previousTouch??touched.latch.touch;
   const action=contact&&homeLayoutConfirmationAt(contact.startX,contact.startY);
   return event.phase==='up'&&action&&action===homeLayoutConfirmationAt(event.x,event.y)?touchSystem(state,event.x,event.y,now):state;
  }
  if(s.phase==='home'&&!s.preferences&&!s.dialog&&state.panel==='settings'){
   const contact=previousTouch??touched.latch.touch;
   if(contact&&homeSettingsScrollAt(contact.startX,contact.startY)!==null){
    if(event.phase==='cancel')return state;
    // A rail contact retains ownership outside its hit rectangle until release.
    return setHomeSettingsScroll(state,homeSettingsScrollAt(contact.startX,Math.max(17,Math.min(223,event.y)))!);
   }
   const startAction=contact&&homeSettingsActionAt(state.panelScroll??0,contact.startX,contact.startY);
   return event.phase==='up'&&startAction&&startAction===homeSettingsActionAt(state.panelScroll??0,event.x,event.y)?touchSystem(state,event.x,event.y,now):state;
  }
  if(s.phase==='home'&&!s.preferences&&!s.dialog&&state.panel==='folder-settings'){
   const contact=previousTouch??touched.latch.touch;
   const startAction=contact&&homeFolderSettingsActionAt(contact.startX,contact.startY);
   return event.phase==='up'&&startAction&&startAction===homeFolderSettingsActionAt(event.x,event.y)?touchSystem(state,event.x,event.y,now):state;
  }
  if(s.phase==='home'&&!s.preferences&&!s.dialog&&state.panel==='folder-not-empty'){
   const contact=previousTouch??touched.latch.touch;
   const startAction=contact&&homeFolderNoticeActionAt(contact.startX,contact.startY);
   return event.phase==='up'&&startAction&&startAction===homeFolderNoticeActionAt(event.x,event.y)?touchSystem(state,event.x,event.y,now):state;
  }
  if(s.phase==='home'&&!s.preferences&&!s.dialog&&!s.sleeping){
   const native=queueHomeControlTouch(state,event);
   const contact=native.state.system?.homeNavigation.gesture;
   const footerRelease=event.phase==='up'?homeFooterHit(native.state,HOME_FOOTER_TOUCH_GEOMETRY,event.x,event.y):null;
   const footerOwner=event.phase==='up'?ownedHomeFooterContact(native.state,HOME_FOOTER_TOUCH_GEOMETRY,contact,event.x,event.y):null;
   const result=touchHomeGesture(native.state,event,now);
   const next=result.nonTapGesture?cancelHomeControlTouch(result.state):reconcileHomeControlGesture(result.state);
   if(!result.tap||native.handled)return next;
   return footerRelease&&!footerOwner?next:touchSystem(next,event.x,event.y,now);
  }
 }
 if(event.type==='button'||event.type==='analog'||event.type==='command'){
  state=tickHomeNavigationClock(state,now);s=state.system!;
  const queued=queueHomeControlEvent(state,event);if(queued)return queued;
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
 state=cancelHomeControls(state);
 const s=state.system;if(!s)return state;
 let runtime=s.runtime;
 for(const [source,held]of Object.entries(s.input.held))runtime=dispatchRuntime(runtime,{type:'button',command:held.command,phase:'up',source,activate:false},now);
 if(s.input.touch)runtime=dispatchRuntime(runtime,{type:'touch',phase:'cancel',...s.input.touch},now);
 return {...state,system:{...s,runtime,input:createInputLatch(),homeClock:{...s.homeClock,lastNow:null,remainderMs:0}}};
}
/** Legacy root-only entry point; scene input should use the phase protocol instead. */
export function moveApp(state:MenuState,from:number,to:number):MenuState {
 state=reconcileSystemHomeApplicationTransition(state);
 if(isSystemHomeApplicationTransitionActive(state)||isSystemHomeFolderClosing(state))return state;
 state=resetHomeNavigation(state);
 return state.system?.layout[from]?moveHomeItem(state,{folder:null,slot:from},{folder:null,slot:to}):state;
}
export const STORAGE_KEY='paramveer-3ds-v1';
export function saveSettings(state:MenuState){const s=state.system!,homeView=saveHomeView(state);return JSON.stringify({version:4,homeView,homeSavedLayouts:serializeHomeSavedLayouts(state),theme:state.theme,brightness:state.brightness,columns:HOME_DENSITIES[homeView.rootView.density],powerSaving:state.powerSaving,folders:state.folders,nextFolderNumber:state.nextFolderNumber,layout:s.layout,folderLayouts:s.folderLayouts,muted:s.muted,volume:s.volume});}
export function restoreSettings(state:MenuState,raw:string|null):MenuState {
 if(!raw||!state.system)return state;
 try{const v=JSON.parse(raw),home=restoreHomeLayout(v);if(!home)return state;
 const {folders,folderLayouts,nextFolderNumber}=home;
 // Only an exact, untouched pre-825b4c5 default adopts the new stock positions.
 const migrateDefault=isPreviousDefaultAppLayout(v.layout)&&!Object.keys(folders).length
   &&!Object.keys(folderLayouts).length&&nextFolderNumber===1;
 const layout=migrateDefault?initialAppLayout():home.layout;
 const restored = {...state,folders,nextFolderNumber,powerSaving:v.powerSaving===true,theme:['white','red','blue','yellow','pink','black'].includes(v.theme)?v.theme:'white',brightness:[.2,.4,.6,.8,1].includes(v.brightness)?v.brightness:1,columns:[3,4,6,8,10,12].includes(v.columns)?v.columns:4,system:{...state.system,layout,folderLayouts,homeNavigation:createHomeNavigation(),homeClock:createHomeUpdateClock(),homeFolderIdentities:createHomeFolderIdentities(folders),homeFolderClose:createSystemHomeFolderClose(state.system.homeFolderClose),homeApplicationTransition:null,muted:v.muted===true,volume:typeof v.volume==='number'&&Number.isFinite(v.volume)?Math.max(0,Math.min(1,v.volume)):.35}};
 let result=restoreHomeView(restored,v.version===4?v.homeView:null,homeDensityIndex(restored.columns));
 if(migrateDefault){
  const before=getHomeNavigation(result).rootView.selectedSlot;
  const selected=({7:11,8:9,9:8,11:7} as Record<number,number>)[before];
  if(selected!==undefined){
   result=settleHomeNavigation(selectHomeSlot(result,selected));
   const nav=getHomeNavigation(result),root=nav.rootView;
   // Previously selected Settings was centered; the native captured position
   // is the right lower column of this two-row viewport.
   if(before===8&&root.density===1)result=writeHomeNavigation(result,{...nav,rootView:{...root,currentLeftSlot:4,targetLeftSlot:4}});
  }
 }
 return restoreHomeSavedLayouts(result,v.homeSavedLayouts);
 }catch{return state;}
}
