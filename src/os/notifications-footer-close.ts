import type { MenuState } from './state.ts';
import { createAppletFooterClosePresentation, type NotesFooterCloseIdentity, type NotesFooterClosePose } from './notes-footer-close.ts';
export type NotificationsFooterClosePose = NotesFooterClosePose;
export function notificationsFooterCloseIdentity(state: MenuState, generation: number): NotesFooterCloseIdentity | null {
  const s = state.system, owner = s?.runtime.active, instance = owner ? s?.runtime.instances[owner] : undefined;
  return s?.phase === 'app' && owner && s.runtime.systemApplet === owner && instance?.appId === 'notifications'
    && !instance.closing && !instance.suspended && instance.caller === null && instance.state.screen === 'main'
    && instance.state.notificationsFooterClose === true ? { owner, application: s.runtime.application, sequence: s.runtime.sequence, generation } : null;
}
export function createNotificationsFooterClosePresentation() {
  return createAppletFooterClosePresentation(notificationsFooterCloseIdentity);
}
