import type { MenuState } from './state.ts';
import { manualEntryEligible } from './manual-entry-identity.ts';
import { HEALTH_VBLANK_HZ } from './stock-health-scroll.ts';

export type NotesFooterCloseIdentity = Readonly<{ owner: string; application: string | null; sequence: number; generation: number }>;
export type NotesFooterClosePaint = Readonly<{ kind: 'feedback' | 'out'; frame: number }>;
export type AppletFooterClosePose<Identity extends NotesFooterCloseIdentity> = Readonly<{ identity: Identity; ticket: number }> &
  (NotesFooterClosePaint | Readonly<{ kind: 'hold'; frame: number }> | Readonly<{ kind: 'in'; frame: number }> | Readonly<{ kind: 'handoff' }>);
/** Measured adaptation: toolbar-applet Close holds the out20 full cover static
 * for 120 source LCD frames before HOME incoming frame 0. Private evidence
 * `notifications-native-close-2/run.md` (Covered hold): two native Notifications
 * Close runs reach the full static cover +0.342 / +0.425 s after release, then
 * stay static 1.992 / 2.050 s (120 frames at 268111856/4481136 Hz = 2.006 s)
 * before HOME population. Notes, Friend List, Internet Browser and Miiverse use
 * it by extension. Manual Close uses the same hold: private
 * `manual-native-close/run.md` measures a native Camera Manual Close holding
 * the full cover with the lower "HOME Menu" belt static for 2.115 s before
 * HOME fades in (its selected-first reveal is separate and unchanged). */
export const TOOLBAR_CLOSE_COVER_HOLD_FRAMES = 120;
/** Hold poses paint the out20 full cover exactly; nothing new is drawn. */
export function footerCloseDrawPose<Pose extends AppletFooterClosePose<NotesFooterCloseIdentity>>(pose: Pose): Pose;
export function footerCloseDrawPose<Pose extends AppletFooterClosePose<NotesFooterCloseIdentity>>(pose: Pose | undefined): Pose | undefined;
export function footerCloseDrawPose<Pose extends AppletFooterClosePose<NotesFooterCloseIdentity>>(pose: Pose | undefined): Pose | undefined {
  return pose?.kind === 'hold' ? { ...pose, kind: 'out', frame: 20 } as Pose : pose;
}
/** Feedback, out and the held out20 cover all publish against the applet's outgoing pair. */
export const footerCloseOutgoing = (pose: { kind: string }) => pose.kind === 'feedback' || pose.kind === 'out' || pose.kind === 'hold';
export type NotesFooterClosePose = AppletFooterClosePose<NotesFooterCloseIdentity>;
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
  return createAppletFooterClosePresentation(notesFooterCloseIdentity, undefined, false, 1, TOOLBAR_CLOSE_COVER_HOLD_FRAMES);
}
export function createAppletFooterClosePresentation<Identity extends NotesFooterCloseIdentity>(
  identityOf: (state: MenuState, generation: number) => Identity | null,
  sameIdentity: (a: Identity | null, b: Identity | null) => boolean = same,
  retainRecoveryOnResourceReplacement = false,
  feedbackTerminalFrame = 1,
  coverHoldFrames = 0,
) {
  const holdFramePeriodMs = 1000 / HEALTH_VBLANK_HZ;
  let holdAnchor: number | undefined;
  let identity: Identity | null = null, ticket = 0, disposed = false, recovering = false, done = false;
  let presented: AppletFooterClosePose<Identity> | undefined, acceptedAt: number | undefined;
  let pending: { pose: AppletFooterClosePose<Identity>; sampledAt: number; reduced: boolean; pair?: object; resources?: object } | undefined;
  let resourceOwner: object | undefined;
  const revoke = () => { ticket++; pending = undefined; acceptedAt = undefined; };
  const reset = () => { revoke(); identity = null; presented = undefined; resourceOwner = undefined; holdAnchor = undefined; recovering = done = false; };
  function matches(state: MenuState, generation: number) {
    if (!identity || generation !== identity.generation) return false;
    if (!recovering) return sameIdentity(identity, identityOf(state, generation));
    const s = state.system;
    return s?.phase === 'home' && !s.runtime.active && !s.runtime.systemApplet && !s.runtime.instances[identity.owner]
      && s.runtime.application === identity.application && s.runtime.sequence === identity.sequence;
  }
  return {
    sample(state: MenuState, generation: number, now: number, eligible: boolean, reduced: boolean): AppletFooterClosePose<Identity> | undefined {
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
      let pose: AppletFooterClosePose<Identity>;
      if (recovering) {
        pose = presented?.kind === 'in' && presented.frame === 20 && advance
          ? Object.freeze({ ...base, kind: 'handoff' })
          : Object.freeze({ ...base, kind: 'in', frame: reduced ? 20 : Math.min(20, (presented?.kind === 'in' ? presented.frame : 0) + (advance && presented?.kind === 'in' ? 1 : 0)) });
      } else if (coverHoldFrames > 0 && (presented?.kind === 'hold' || presented?.kind === 'out' && presented.frame === 20 && (advance || reduced))) {
        // Held frames follow source LCD time from the accepted hold:0. A stall
        // or revoked receipt (acceptedAt cleared) repeats the presented frame
        // and re-anchors on its next acceptance, exactly like the out frames.
        const last = coverHoldFrames - 1, held = presented?.kind === 'hold' ? presented.frame : undefined;
        const frame = reduced ? last : held === undefined ? 0 : acceptedAt === undefined || holdAnchor === undefined ? held
          : Math.min(last, Math.max(held, Math.round((now - holdAnchor) / holdFramePeriodMs)));
        pose = Object.freeze({ ...base, kind: 'hold', frame });
      } else if (presented?.kind === 'out' || presented?.kind === 'feedback' && presented.frame === feedbackTerminalFrame && advance) {
        pose = Object.freeze({ ...base, kind: 'out', frame: reduced ? 20 : presented?.kind === 'out' ? Math.min(20, presented.frame + (advance ? 1 : 0)) : 0 });
      } else pose = Object.freeze({ ...base, kind: 'feedback', frame: reduced ? feedbackTerminalFrame : Math.min(feedbackTerminalFrame, (presented?.kind === 'feedback' ? presented.frame : 0) + (advance ? 1 : 0)) });
      pending = { pose, sampledAt: now, reduced }; return pose;
    },
    bind(pose: AppletFooterClosePose<Identity>, pair: object, resources: object): boolean {
      if (disposed || !pending || pending.pose !== pose) return false;
      if (resourceOwner && resourceOwner !== resources) {
        if(recovering&&retainRecoveryOnResourceReplacement){revoke();resourceOwner=undefined;}
        else reset();
        return false;
      }
      resourceOwner = resources; pending = { ...pending, pair, resources }; return true;
    },
    present(pose: AppletFooterClosePose<Identity>, state: MenuState, generation: number, now: number, eligible: boolean, pair: object | undefined, resources: object | undefined): string | null {
      if (disposed || !eligible || !Number.isFinite(now) || !pending || pending.pose !== pose || pose.ticket !== ticket
        || !matches(state, generation) || !pair || pair !== pending.pair || !resources || resources !== pending.resources
        || resources !== resourceOwner || now < pending.sampledAt || acceptedAt !== undefined && now < acceptedAt) return null;
      const changed = !presented || presented.kind !== pose.kind || presented.kind !== 'handoff' && pose.kind !== 'handoff' && presented.frame !== pose.frame;
      const observedAt = now - pending.sampledAt > 100 ? now : pending.sampledAt, reduced = pending.reduced;
      const reanchor = pose.kind === 'hold' && (changed && presented?.kind !== 'hold' || acceptedAt === undefined);
      pending = undefined; presented = pose;
      if (changed || acceptedAt === undefined) acceptedAt = observedAt;
      if (reanchor && pose.kind === 'hold') holdAnchor = observedAt - pose.frame * holdFramePeriodMs;
      if (pose.kind === 'out' && pose.frame === 20 && (coverHoldFrames === 0 || reduced)
        || pose.kind === 'hold' && pose.frame === coverHoldFrames - 1) {
        holdAnchor = undefined;
        recovering = true; resourceOwner = undefined; acceptedAt = undefined;
        return pose.identity.owner;
      }
      if (pose.kind === 'handoff') done = true;
      return null;
    },
    active(state: MenuState, generation: number) {
      return !disposed && (!!identityOf(state, generation) || !done && matches(state, generation));
    },
    /** True once this owner's handoff receipt has been accepted. */
    handoffAccepted() { return !disposed && done; },
    revoke, reset,
    dispose() { reset(); disposed = true; },
  };
}
