import type { MenuState } from './state.ts';
import { manualEntryEligible } from './manual-entry-identity.ts';
import { manualEntryUpdate } from './manual-entry-presentation.ts';
import type { AppletEntryAppId } from './applet-entry-assets.ts';

export type AppletEntryIdentity = Readonly<{ owner: string; appId: AppletEntryAppId; caller: string | null; requestId: string | null; application: string | null; generation: number }>;
export type AppletEntryPose = Readonly<{ identity: AppletEntryIdentity; ticket: number }> &
  ({ kind: 'cover'; frame: number } | { kind: 'incoming'; frame: number; pair: object; resources: object }
    | { kind: 'handoff'; pair: object; resources?: object });
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

const hasTitleIncoming = (appId: AppletEntryAppId) => appId === 'friends' || appId === 'notifications';
type PresentedAppletEntry = { kind: 'cover'; frame: number; update: number; sampledUpdate: number }
  | { kind: 'incoming'; frame: number; update: number; sampledUpdate: number; resources: object };

/** The shared 60 Hz browser observation is a sequencing adaptation, not
 * native LCD phase-lock or duration. Every published pose and the fresh destination
 * handoff require a current valid paired-render receipt. */
export function createAppletEntryPresentation() {
  let identity: AppletEntryIdentity | null = null, ticket = 0, disposed = false, rebase = true, handedOff = false;
  let presented: PresentedAppletEntry | undefined, pending: { pose: AppletEntryPose; update: number } | undefined;
  const revoke = () => { ticket++; pending = undefined; rebase = true; };
  const ready = (next: AppletEntryIdentity | null) => !disposed && handedOff && sameAppletEntryIdentity(identity, next);
  return {
    sample(input: Readonly<{ identity: AppletEntryIdentity | null; elapsedMs: number; eligible: boolean; pair?: object; incomingResources?: object; reducedMotion: boolean }>): AppletEntryPose | undefined {
      if (disposed) return undefined;
      const update = manualEntryUpdate(input.elapsedMs);
      if (!sameAppletEntryIdentity(identity, input.identity)) { revoke(); identity = input.identity; presented = undefined; handedOff = false; }
      if (!identity || !input.eligible) { revoke(); return undefined; }
      if (!identity.owner || !Number.isSafeInteger(identity.generation) || identity.generation < 0) throw Error('Invalid applet entry identity');
      if (ready(identity)) return undefined;
      if (presented?.kind === 'incoming') {
        if (!input.incomingResources || !input.pair) { revoke(); return undefined; }
        if (presented.resources !== input.incomingResources) {
          // Replacement must re-publish the original outgoing terminal before
          // starting the new title producer; it cannot inherit old clip progress.
          revoke(); presented = { kind: 'cover', frame: 20, update: presented.update, sampledUpdate: presented.sampledUpdate };
        }
      }
      if (pending && pending.pose.kind !== 'cover') {
        if (!input.pair || pending.pose.kind === 'incoming' && !input.incomingResources) { revoke(); return undefined; }
        if (pending.pose.resources !== input.incomingResources) revoke();
      }
      if (pending) return pending.pose;
      const updates = presented ? update - presented.update : 0;
      if (updates < 0) throw Error('Applet entry clock moved backwards');
      // Cover motion follows accepted sample time so ordinary render work is not
      // discarded. The later receipt still gates publication.
      const sampledUpdates = presented ? update - presented.sampledUpdate : 0;
      // An incoming sample can cross a tick that its later receipt also occupies.
      // Retain that one pose without changing the one-pose-per-receipt policy.
      const incomingOverlap = updates === 0 && sampledUpdates > 0 && sampledUpdates <= MAX_OBSERVED_UPDATE_GAP;
      const advance = !rebase && (input.reducedMotion || (updates > 0 && updates <= MAX_OBSERVED_UPDATE_GAP) || incomingOverlap);
      const coverProgress = !rebase && sampledUpdates > 0 && sampledUpdates <= MAX_OBSERVED_UPDATE_GAP ? sampledUpdates : 0;
      const advanceCover = !rebase && (input.reducedMotion || coverProgress > 0);
      const base = { identity: Object.freeze({ ...identity }), ticket };
      let pose: AppletEntryPose;
      if (presented?.kind === 'incoming') {
        if (!input.pair || !input.incomingResources) { revoke(); return undefined; }
        pose = advance && presented.frame === 20
          ? Object.freeze({ ...base, kind: 'handoff', pair: input.pair, resources: presented.resources })
          : Object.freeze({ ...base, kind: 'incoming', frame: input.reducedMotion ? 20 : Math.min(20, presented.frame + (advance ? 1 : 0)), pair: input.pair, resources: presented.resources });
      } else if (advanceCover && presented?.frame === 20 && input.pair && (!hasTitleIncoming(identity.appId) || input.incomingResources)) {
        if (hasTitleIncoming(identity.appId)) {
          if (!input.incomingResources) throw Error('Applet incoming resources unavailable');
          pose = Object.freeze({ ...base, kind: 'incoming', frame: input.reducedMotion ? 20 : 0, pair: input.pair, resources: input.incomingResources });
        } else pose = Object.freeze({ ...base, kind: 'handoff', pair: input.pair });
      } else {
        pose = Object.freeze({ ...base, kind: 'cover', frame: input.reducedMotion ? 20 : Math.min(20, (presented?.frame ?? 0) + coverProgress) });
      }
      pending = { pose, update };
      return pose;
    },
    bindPreparedPair(pair: object, incomingResources?: object): AppletEntryPose | undefined {
      if (disposed || !pending || pending.pose.kind === 'cover') return undefined;
      if (pending.pose.resources !== incomingResources) { revoke(); return undefined; }
      pending = { ...pending, pose: Object.freeze({ ...pending.pose, pair }) };
      return pending.pose;
    },
    present(pose: AppletEntryPose, next: AppletEntryIdentity | null, elapsedMs: number, eligible: boolean, pair?: object, incomingResources?: object): boolean {
      if (disposed || !eligible || !pending || pose !== pending.pose || pose.ticket !== ticket || !sameAppletEntryIdentity(identity, next)) return false;
      if (pose.kind !== 'cover' && (!pair || pose.pair !== pair || pose.resources !== incomingResources)) return false;
      if (pose.kind === 'incoming' && (!identity || !hasTitleIncoming(identity.appId)
        || presented?.kind === 'incoming' && presented.resources !== pose.resources
        || presented?.kind !== 'incoming' && (presented?.frame !== 20 || rebase))) return false;
      if (pose.kind === 'handoff' && (presented?.frame !== 20 || rebase
        || !!identity && hasTitleIncoming(identity.appId) && (presented.kind !== 'incoming' || presented.resources !== pose.resources))) return false;
      const update = manualEntryUpdate(elapsedMs);
      if (presented && update < presented.update) return false;
      if (pose.kind === 'handoff') handedOff = true;
      else presented = pose.kind === 'incoming'
        ? { kind: 'incoming', frame: pose.frame, update, sampledUpdate: pending.update, resources: pose.resources }
        : { kind: 'cover', frame: pose.frame, update, sampledUpdate: pending.update };
      pending = undefined; rebase = false; return true;
    },
    active(next: AppletEntryIdentity | null, pair?: object, incomingResources?: object): boolean {
      if (disposed || !next || ready(next)) return false;
      if (presented?.kind === 'incoming' && sameAppletEntryIdentity(identity, next)) return !!pair && !!incomingResources;
      return !sameAppletEntryIdentity(identity, next) || !!pending || rebase || !presented || presented.frame < 20
        || !!pair && (!hasTitleIncoming(next.appId) || !!incomingResources);
    },
    // Accessibility-only adaptation: the existing nonvisual direct shortcut
    // has no selected, presented HOME pair. Do not fabricate one for its cover.
    skipAccessibilityShortcut(next: AppletEntryIdentity) { if(disposed)return;revoke(); identity = Object.freeze({ ...next }); presented = undefined; handedOff = true; },
    ready, revoke,
    reset() { revoke(); identity = null; presented = undefined; handedOff = false; },
    dispose() { disposed = true; revoke(); identity = null; presented = undefined; handedOff = false; },
  };
}
