import type { MenuState } from './state.ts';
import type { Sound } from './audio.ts';
import { sampleSystemHomeFolderClose } from './home-folder-close-system.ts';
import { LAUNCH_FADE_START_MS } from './system-transitions.ts';

/** Compare the state immediately before an action, after elapsed HOME work was
 * consumed. A delayed close completion is not a second input or another cue.
 */
export function getMenuActionSound(previous: MenuState, state: MenuState, input: string): Sound | undefined {
 const before=previous.system,after=state.system;if(!before||!after)return;
 const beforeClose=sampleSystemHomeFolderClose(previous)?.controller.identity;
 const afterClose=sampleSystemHomeFolderClose(state)?.controller.identity;
 if(after.phase!==before.phase){
  if(after.phase==='launch')return 'open';if(after.phase==='power')return 'power';
  if(input==='home')return 'home';if(input==='back')return 'back';return;
 }
 if(afterClose&&(afterClose.generation!==beforeClose?.generation||afterClose.transitionId!==beforeClose?.transitionId))return 'folder-close';
 if(previous.opened!==state.opened){
  if(state.opened)return 'folder-open';
  if(!beforeClose&&!afterClose)return 'folder-close';
  return;
 }
 if(previous.selected!==state.selected||previous.folderSelected!==state.folderSelected||before.item!==after.item||before.page!==after.page)return 'select';
 if(previous.panel!==state.panel||before.detail!==after.detail||before.dialog!==after.dialog||before.preferences!==after.preferences)return input==='back'?'back':'open';
}

/** Successful launch preparation runs after the Open listener's Decide
 * completes: one update dispatches SE_CTR_HOME_START_EFFECT (0x0100001f) and
 * requests the music stop30. Native trace does not tie that update to a fade
 * pose, so the browser places it at fade pose 0, the first stage after the
 * fitted Decide hold: an adaptation. Reduced launches never reach that pose,
 * so they prepare at once. Returns nominal 60Hz updates since preparation,
 * or null before it. */
export function launchPreparationUpdates(launchElapsedMs:number,reduced=false):number|null{
 const elapsed=launchElapsedMs-(reduced?0:LAUNCH_FADE_START_MS);
 return elapsed<-1e-6?null:Math.floor(Math.max(0,elapsed)*60/1000+1e-9);
}
export function launchStartEffectDue(launchElapsedMs:number,reduced=false):boolean{
 return launchPreparationUpdates(launchElapsedMs,reduced)!==null;
}
