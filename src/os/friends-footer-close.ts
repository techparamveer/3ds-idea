import type { MenuState } from './state.ts';
import { friendsFooterCloseRequestEligible } from './app-host.ts';
import { createAppletFooterClosePresentation, type NotesFooterCloseIdentity, type NotesFooterClosePose } from './notes-footer-close.ts';

export type FriendsFooterClosePose = NotesFooterClosePose;
export function friendsFooterCloseIdentity(state: MenuState, generation: number): NotesFooterCloseIdentity | null {
  const s = state.system, owner = s?.runtime.active, instance = owner ? s?.runtime.instances[owner] : undefined;
  return s?.phase === 'app' && owner && friendsFooterCloseRequestEligible(s.runtime, owner)
    && instance?.state.friendsFooterClose === true ? { owner, application: s.runtime.application, sequence: s.runtime.sequence, generation } : null;
}
export function createFriendsFooterClosePresentation() {
  // Decide has six source frames. The browser clock and trigger remain adaptations.
  return createAppletFooterClosePresentation(friendsFooterCloseIdentity, undefined, true, 5);
}
