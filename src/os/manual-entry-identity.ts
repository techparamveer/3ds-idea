import type { MenuState } from './state.ts';
import { selectedTitle } from './system.ts';
import { getTitle } from './app-registry.ts';
import type { ManualEntryIdentity } from './manual-entry-presentation.ts';

export type ManualEntryOrigin = Readonly<{ kind: 'home' | 'app'; owner: string | null; application: string | null; titleId: string | null; generation: number }>;
export function manualEntryIdentity(state: MenuState, generation: number): ManualEntryIdentity | null {
  const s = state.system, owner = s?.runtime.active, instance = owner ? s?.runtime.instances[owner] : undefined;
  if (!s || s.phase !== 'app' || !owner || instance?.appId !== 'manual') return null;
  return { owner, manualTitleId: typeof instance.state.manualTitleId === 'string' ? instance.state.manualTitleId : '',
    caller: instance.caller, requestId: instance.requestId, application: s.runtime.application, generation };
}
export function manualEntryEligible(state: MenuState): boolean {
  return state.powered && !!state.system && !state.system.sleeping && !state.system.preferences && !state.system.dialog && !state.panel;
}
export function manualEntryOrigin(state: MenuState, generation: number): ManualEntryOrigin | null {
  const s = state.system;
  if (!s || !manualEntryEligible(state)) return null;
  if (s.phase === 'home') {
    const focus = s.homeNavigation.focus;
    const title = focus.toolbarActive && focus.currentFocus === 4 ? getTitle('browser') : selectedTitle(state);
    return { kind: 'home', owner: null, application: s.runtime.application, titleId: title?.titleId?.toLowerCase() ?? null, generation };
  }
  const owner = s.runtime.active, instance = owner ? s.runtime.instances[owner] : undefined;
  return s.phase === 'app' && owner && instance && instance.appId !== 'manual'
    ? { kind: 'app', owner, application: s.runtime.application, titleId: getTitle(instance.appId)?.titleId?.toLowerCase() ?? null, generation } : null;
}
export const sameManualEntryOrigin = (a: ManualEntryOrigin | null, b: ManualEntryOrigin | null): boolean => !!a && !!b
  && a.kind === b.kind && a.owner === b.owner && a.application === b.application && a.titleId === b.titleId && a.generation === b.generation;
export function manualEntryBackingMatches(origin: ManualEntryOrigin | null, identity: ManualEntryIdentity): boolean {
  return !!origin && origin.generation === identity.generation && origin.application === identity.application
    && (origin.kind === 'home' ? identity.caller === null && origin.titleId === identity.manualTitleId
      : origin.owner === identity.caller && (origin.titleId === null || origin.titleId === identity.manualTitleId));
}
