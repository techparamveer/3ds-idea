import type { MenuState } from './state';
import type { NativeScreenStatus } from './stock-screen-presentation';
import { releaseSystemInputs, reduceSystem } from './system.ts';
import { reduceMenu } from './state.ts';
import { selectedSuspendedApplication } from './home-suspended-window.ts';
import {homeSoftwareDialogKey,homeSoftwareClosingDialogKey} from './home-software-dialog.ts';
import {cancelSystemHomeApplicationTransition} from './system-home-application-transition.ts';
import {cancelSystemHomeFolderClose} from './home-folder-close-system.ts';

/** Cancel held repeats/touches before the host ticks an unseen application.
 * No fetch, Canvas or readiness state is stored in the deterministic reducer. */
export function releaseUnreadyNativeInput(state:MenuState,status:NativeScreenStatus,now:number):MenuState{
  const s=state.system;
  if(!s||(status!=='loading'&&status!=='error'))return state;
  const home=s.homeControls?.input;
  // Native HOME directions bypass the generic latch, including its pending
  // quick pulse and sampled release history. Cancel the same existing owner.
  const homeHeld=home&&(Object.keys(home.sources).length||home.sampler.previousDigitalHeld
   ||home.sampler.previousPrimaryHeld||home.sampler.primaryAxis.x||home.sampler.primaryAxis.y
   ||s.homeControls?.producer.repeatCandidate);
  return Object.keys(s.input.held).length||Object.keys(s.input.analog).length||s.input.touch||homeHeld?releaseSystemInputs(state,now):state;
}
/** Recovery B/HOME suspends the current owner, preserving Settings/helper callers.
 * Launch normally ignores HOME; this explicit browser escape also works there. */
export function escapeUnreadyNativeScreen(state:MenuState,now:number):MenuState{
 const s=state.system;
 if(homeSoftwareClosingDialogKey(state))return cancelSystemHomeApplicationTransition(releaseSystemInputs(state,now));
 if(homeSoftwareDialogKey(state))return reduceSystem(releaseSystemInputs(state,now),'back',now);
 if(s?.phase==='home'&&state.powered&&state.opened&&!state.panel&&!s.sleeping&&!s.preferences&&!s.dialog){
  // Recovery cannot wait for the unavailable folder's native close resources.
  return cancelSystemHomeFolderClose(reduceMenu(releaseSystemInputs(state,now),'back'));
 }
 if(selectedSuspendedApplication(state))return reduceSystem(releaseSystemInputs(state,now),s?.dialog?'back':'home',now);
 if(s?.phase==='home'&&(state.panel==='settings'||state.panel==='home-layouts'||state.panel==='folder-settings'||state.panel==='folder-not-empty')&&!s.sleeping&&!s.preferences&&!s.dialog)return reduceMenu(releaseSystemInputs(state,now),'home');
  if(!s||s.sleeping||s.preferences||s.dialog||!['launch','app'].includes(s.phase))return state;
  const released=releaseSystemInputs(state,now);
  const active=s.runtime.active?s.runtime.instances[s.runtime.active]:undefined;
  // Unready Manual recovery closes the cover applet before returning HOME.
  // Suspending Manual would replace the application's retained return owner.
  if(s.phase==='app'&&active?.appId==='manual'){
   const closed=reduceSystem(released,'x',now);
   return closed.system?.phase==='app'?reduceSystem(closed,'home',now):closed;
  }
  return reduceSystem({...released,system:{...released.system!,phase:'app'}},'home',now);
}
