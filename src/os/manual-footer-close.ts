import type { MenuState } from './state.ts';
import { manualFooterCloseRequestEligible } from './app-host.ts';
import { createAppletFooterClosePresentation, type AppletFooterClosePose, type NotesFooterCloseIdentity } from './notes-footer-close.ts';

export type ManualFooterCloseIdentity = NotesFooterCloseIdentity & Readonly<{ manualTitleId: string; screen: 'main'; requestId: string | null }>;
export type ManualFooterClosePose = AppletFooterClosePose<ManualFooterCloseIdentity>;
export function manualFooterCloseIdentity(state: MenuState, generation: number): ManualFooterCloseIdentity | null {
  const s=state.system,owner=s?.runtime.active,instance=owner?s?.runtime.instances[owner]:undefined;
  return s?.phase==='app'&&owner&&manualFooterCloseRequestEligible(s.runtime,owner)
    &&instance?.state.manualFooterClose===true&&typeof instance.state.manualTitleId==='string'
    ?{owner,application:s.runtime.application,sequence:s.runtime.sequence,generation,
      manualTitleId:instance.state.manualTitleId,screen:'main',requestId:instance.requestId}:null;
}
export function sameManualFooterCloseIdentity(a:ManualFooterCloseIdentity|null,b:ManualFooterCloseIdentity|null):boolean {
  return !!a&&!!b&&a.owner===b.owner&&a.application===b.application&&a.sequence===b.sequence&&a.generation===b.generation
    &&a.manualTitleId===b.manualTitleId&&a.screen===b.screen&&a.requestId===b.requestId;
}
/** Source4/5 feedback and accepted-pair 60Hz scheduling are host adaptations. */
export function createManualFooterClosePresentation(){
  return createAppletFooterClosePresentation(manualFooterCloseIdentity,sameManualFooterCloseIdentity,true);
}
