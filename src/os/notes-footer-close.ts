import type { MenuState } from './state.ts';
import { manualEntryEligible } from './manual-entry-identity.ts';

export type NotesFooterCloseIdentity = Readonly<{ owner: string; application: string | null; sequence: number; generation: number }>;
export type NotesFooterClosePaint = Readonly<{ kind: 'feedback' | 'out'; frame: number }>;
export type NotesFooterClosePose = Readonly<{ identity: NotesFooterCloseIdentity; ticket: number }> &
  (NotesFooterClosePaint | Readonly<{ kind: 'in'; frame: number }> | Readonly<{ kind: 'handoff' }>);
export function notesFooterCloseIdentity(state: MenuState, generation: number): NotesFooterCloseIdentity | null {
  const s = state.system, owner = s?.runtime.active, instance = owner ? s?.runtime.instances[owner] : undefined;
  return s?.phase === 'app' && owner && s.runtime.systemApplet === owner && instance?.appId === 'game-notes'
    && !instance.closing && !instance.suspended && instance.caller === null && instance.state.screen === 'main'
    && instance.state.notesFooterClose === true ? { owner, application: s.runtime.application, sequence: s.runtime.sequence, generation } : null;
}
const same = (a: NotesFooterCloseIdentity | null, b: NotesFooterCloseIdentity | null) => !!a && !!b
  && a.owner === b.owner && a.application === b.application && a.sequence === b.sequence && a.generation === b.generation;
export const notesFooterCloseEligible = manualEntryEligible;

/** Fitted footer feedback and 60 Hz scheduling are adaptations. The recording
 * establishes order, not dispatch, elapsed duration or native LCD cadence. */
export function createNotesFooterClosePresentation() {
  return createAppletFooterClosePresentation(notesFooterCloseIdentity);
}
export function createAppletFooterClosePresentation(identityOf: typeof notesFooterCloseIdentity) {
  let identity: NotesFooterCloseIdentity | null = null, ticket = 0, disposed = false, recovering = false, done = false;
  let presented: NotesFooterClosePose | undefined, acceptedAt: number | undefined;
  let pending: { pose: NotesFooterClosePose; sampledAt: number; pair?: object; resources?: object } | undefined;
  let resourceOwner: object | undefined;
  const revoke = () => { ticket++; pending = undefined; acceptedAt = undefined; };
  const reset = () => { revoke(); identity = null; presented = undefined; resourceOwner = undefined; recovering = done = false; };
  function matches(state: MenuState, generation: number) {
    if (!identity || generation !== identity.generation) return false;
    if (!recovering) return same(identity, identityOf(state, generation));
    const s = state.system;
    return s?.phase === 'home' && !s.runtime.active && !s.runtime.systemApplet && !s.runtime.instances[identity.owner]
      && s.runtime.application === identity.application && s.runtime.sequence === identity.sequence;
  }
  return {
    sample(state: MenuState, generation: number, now: number, eligible: boolean, reduced: boolean): NotesFooterClosePose | undefined {
      if (disposed || !Number.isFinite(now)) return undefined;
      const next = identityOf(state, generation);
      if (!identity && next) identity = Object.freeze({ ...next });
      if (identity && !matches(state, generation)) { reset(); if (next) identity = Object.freeze({ ...next }); }
      if (!identity || done || !eligible) { revoke(); return undefined; }
      if (pending) return pending.pose;
      const gap = acceptedAt === undefined ? 0 : now - acceptedAt;
      if (gap < 0 || gap > 100) acceptedAt = undefined;
      const advance = acceptedAt !== undefined && (reduced || gap >= 1000 / 60 - .01 && gap <= 100);
      const base = { identity, ticket };
      let pose: NotesFooterClosePose;
      if (recovering) {
        pose = presented?.kind === 'in' && presented.frame === 20 && advance
          ? Object.freeze({ ...base, kind: 'handoff' })
          : Object.freeze({ ...base, kind: 'in', frame: reduced ? 20 : Math.min(20, (presented?.kind === 'in' ? presented.frame : 0) + (advance && presented?.kind === 'in' ? 1 : 0)) });
      } else if (presented?.kind === 'out' || presented?.kind === 'feedback' && presented.frame === 1 && advance) {
        pose = Object.freeze({ ...base, kind: 'out', frame: reduced ? 20 : presented?.kind === 'out' ? Math.min(20, presented.frame + (advance ? 1 : 0)) : 0 });
      } else pose = Object.freeze({ ...base, kind: 'feedback', frame: reduced ? 1 : Math.min(1, (presented?.kind === 'feedback' ? presented.frame : 0) + (advance ? 1 : 0)) });
      pending = { pose, sampledAt: now }; return pose;
    },
    bind(pose: NotesFooterClosePose, pair: object, resources: object): boolean {
      if (disposed || !pending || pending.pose !== pose) return false;
      if (resourceOwner && resourceOwner !== resources) { reset(); return false; }
      resourceOwner = resources; pending = { ...pending, pair, resources }; return true;
    },
    present(pose: NotesFooterClosePose, state: MenuState, generation: number, now: number, eligible: boolean, pair: object | undefined, resources: object | undefined): string | null {
      if (disposed || !eligible || !Number.isFinite(now) || !pending || pending.pose !== pose || pose.ticket !== ticket
        || !matches(state, generation) || !pair || pair !== pending.pair || !resources || resources !== pending.resources
        || resources !== resourceOwner || now < pending.sampledAt || acceptedAt !== undefined && now < acceptedAt) return null;
      const changed = !presented || presented.kind !== pose.kind || presented.kind !== 'handoff' && pose.kind !== 'handoff' && presented.frame !== pose.frame;
      const observedAt = now - pending.sampledAt > 100 ? now : pending.sampledAt;
      pending = undefined; presented = pose;
      if (changed || acceptedAt === undefined) acceptedAt = observedAt;
      if (pose.kind === 'out' && pose.frame === 20) {
        recovering = true; resourceOwner = undefined; acceptedAt = undefined;
        return pose.identity.owner;
      }
      if (pose.kind === 'handoff') done = true;
      return null;
    },
    active(state: MenuState, generation: number) {
      return !disposed && !done && (matches(state, generation) || !!identityOf(state, generation));
    },
    revoke, reset,
    dispose() { reset(); disposed = true; },
  };
}
