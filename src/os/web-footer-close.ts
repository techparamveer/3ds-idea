import type { MenuState } from './state.ts';
import { webFooterCloseRequestEligible } from './app-host.ts';
import { createAppletFooterClosePresentation, type NotesFooterCloseIdentity, type NotesFooterClosePose } from './notes-footer-close.ts';

export type WebFooterClosePose = NotesFooterClosePose;
export function webFooterCloseIdentity(state: MenuState, generation: number): NotesFooterCloseIdentity | null {
  const s = state.system, owner = s?.runtime.active, instance = owner ? s?.runtime.instances[owner] : undefined;
  return s?.phase === 'app' && owner && webFooterCloseRequestEligible(s.runtime, owner)
    && instance?.state.webFooterClose === true ? { owner, application: s.runtime.application, sequence: s.runtime.sequence, generation } : null;
}
/** Delivered six-frame feedback followed by HOME common cover/reveal.
 * Footer dispatch, hold duration and the 60 Hz clock are portfolio adaptations. */
export function createWebFooterClosePresentation() {
  return createAppletFooterClosePresentation(webFooterCloseIdentity, undefined, true, 5);
}
