import type { MenuState } from './state.ts';
import type { Sound } from './audio.ts';
import { sampleSystemHomeFolderClose } from './home-folder-close-system.ts';

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
