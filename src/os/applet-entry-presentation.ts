import type { MenuState } from './state.ts';
import { manualEntryEligible } from './manual-entry-identity.ts';
import { manualEntryUpdate } from './manual-entry-presentation.ts';
import type { AppletEntryAppId } from './applet-entry-assets.ts';

export type AppletEntryIdentity = Readonly<{ owner: string; appId: AppletEntryAppId; caller: string | null; requestId: string | null; application: string | null; generation: number }>;
export type AppletEntryPose = Readonly<{ identity: AppletEntryIdentity; ticket: number }> &
  ({ kind: 'cover'; frame: number } | { kind: 'handoff'; pair: object });
export type AppletEntryHomePair = Readonly<{ application: string | null; appId: AppletEntryAppId; generation: number; selectionRevision: number }>;
const appletIds = ['game-notes', 'friends', 'notifications', 'browser', 'miiverse'] satisfies AppletEntryAppId[];
// The existing Manual browser policy treats gaps above 100ms as stalls.
const MAX_OBSERVED_UPDATE_GAP = 6;
const appletId = (id: string): AppletEntryAppId | null => appletIds.find(value => value === id) ?? null;
export const appletEntryEligible = manualEntryEligible;
export function appletEntryIdentity(state: MenuState, generation: number): AppletEntryIdentity | null {
  const s = state.system, owner = s?.runtime.systemApplet, instance = owner ? s?.runtime.instances[owner] : undefined;
  const appId = instance ? appletId(instance.appId) : null;
  return s?.phase === 'app' && owner && s.runtime.active === owner && instance && !instance.closing && appId
    ? { owner, appId, caller: instance.caller, requestId: instance.requestId, application: s.runtime.application, generation } : null;
}
export function appletEntryHomePair(state: MenuState, generation: number): AppletEntryHomePair | null {
  const s = state.system, focus = s?.homeNavigation.focus;
  const appId = focus?.toolbarActive ? appletIds[focus.currentFocus - 1] : undefined;
  return s?.phase === 'home' && appletEntryEligible(state) && appId
    ? { application: s.runtime.application, appId, generation, selectionRevision: s.homeNavigation.selectionRevision } : null;
}
export const sameAppletEntryIdentity = (a: AppletEntryIdentity | null, b: AppletEntryIdentity | null): boolean => !!a && !!b
  && a.owner === b.owner && a.appId === b.appId && a.caller === b.caller && a.requestId === b.requestId
  && a.application === b.application && a.generation === b.generation;
export const sameAppletEntryHomePair = (a: AppletEntryHomePair | null, b: AppletEntryHomePair | null): boolean => !!a && !!b
  && a.application === b.application && a.appId === b.appId && a.generation === b.generation && a.selectionRevision === b.selectionRevision;
export const appletEntryBackingMatches = (source: AppletEntryHomePair | null, identity: AppletEntryIdentity): boolean => !!source
  && identity.caller === null && source.application === identity.application && source.appId === identity.appId && source.generation === identity.generation;

/** Outgoing source poses only. The existing 60 Hz browser observation policy
 * is adapted scheduling, not a traced applet epoch/rate. Every pose and the
 * destination handoff require a current valid paired-render receipt. */
export function createAppletEntryPresentation() {
  let identity: AppletEntryIdentity | null = null, ticket = 0, disposed = false, rebase = true, handedOff = false;
  let presented: { frame: number; update: number } | undefined, pending: AppletEntryPose | undefined;
  const revoke = () => { ticket++; pending = undefined; rebase = true; };
  const ready = (next: AppletEntryIdentity | null) => !disposed && handedOff && sameAppletEntryIdentity(identity, next);
  return {
    sample(input: Readonly<{ identity: AppletEntryIdentity | null; elapsedMs: number; eligible: boolean; pair?: object; reducedMotion: boolean }>): AppletEntryPose | undefined {
      if (disposed) return undefined;
      const update = manualEntryUpdate(input.elapsedMs);
      if (!sameAppletEntryIdentity(identity, input.identity)) { revoke(); identity = input.identity; presented = undefined; handedOff = false; }
      if (!identity || !input.eligible) { revoke(); return undefined; }
      if (!identity.owner || !Number.isSafeInteger(identity.generation) || identity.generation < 0) throw Error('Invalid applet entry identity');
      if (ready(identity)) return undefined;
      if (pending) return pending;
      const updates = presented ? update - presented.update : 0;
      if (updates < 0) throw Error('Applet entry clock moved backwards');
      const advance = !rebase && (input.reducedMotion || updates > 0 && updates <= MAX_OBSERVED_UPDATE_GAP);
      const base = { identity: Object.freeze({ ...identity }), ticket };
      pending = advance && presented?.frame === 20 && input.pair
        ? Object.freeze({ ...base, kind: 'handoff', pair: input.pair })
        : Object.freeze({ ...base, kind: 'cover', frame: input.reducedMotion ? 20 : Math.min(20, (presented?.frame ?? 0) + (presented && advance ? 1 : 0)) });
      return pending;
    },
    bindPreparedPair(pair: object): AppletEntryPose | undefined {
      if (disposed || pending?.kind !== 'handoff') return undefined;
      pending = Object.freeze({ ...pending, pair });
      return pending;
    },
    present(pose: AppletEntryPose, next: AppletEntryIdentity | null, elapsedMs: number, eligible: boolean, pair?: object): boolean {
      if (disposed || !eligible || pose !== pending || pose.ticket !== ticket || !sameAppletEntryIdentity(identity, next)
        || pose.kind === 'handoff' && (!pair || pose.pair !== pair || presented?.frame !== 20 || rebase)) return false;
      const update = manualEntryUpdate(elapsedMs);
      if (presented && update < presented.update) return false;
      if (pose.kind === 'handoff') handedOff = true;
      else presented = { frame: pose.frame, update };
      pending = undefined; rebase = false; return true;
    },
    active(next: AppletEntryIdentity | null, pair?: object): boolean {
      return !disposed && !!next && !ready(next) && (!sameAppletEntryIdentity(identity, next) || !!pending || rebase || !presented || presented.frame < 20 || !!pair);
    },
    // Accessibility-only adaptation: the existing nonvisual direct shortcut
    // has no selected, presented HOME pair. Do not fabricate one for its cover.
    skipAccessibilityShortcut(next: AppletEntryIdentity) { if(disposed)return;revoke(); identity = Object.freeze({ ...next }); presented = undefined; handedOff = true; },
    ready, revoke,
    reset() { revoke(); identity = null; presented = undefined; handedOff = false; },
    dispose() { disposed = true; revoke(); identity = null; presented = undefined; handedOff = false; },
  };
}
