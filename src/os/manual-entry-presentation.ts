export const MANUAL_ENTRY_LAST_FRAME = 20;
// Browser scheduling policy, not a traced Manual caller epoch or native rate.
export const MANUAL_ENTRY_HOST_HZ = 60;
// More than 100ms between adapted host observations is a stall, not motion
// credit. Ordinary 20/30/45Hz paints remain eligible but consume one pose only.
const MAX_OBSERVED_UPDATE_GAP = 6;

export type ManualEntryIdentity = Readonly<{
  owner: string; manualTitleId: string; caller: string | null; requestId: string | null;
  application: string | null; generation: number;
}>;
export type ManualEntryPose = Readonly<{ identity: ManualEntryIdentity; ticket: number; phase: 'out' | 'in'; frame: number }>;
export const sameManualEntryIdentity = (a: ManualEntryIdentity | null, b: ManualEntryIdentity | null): boolean => !!a && !!b
  && a.owner === b.owner && a.manualTitleId === b.manualTitleId && a.caller === b.caller
  && a.requestId === b.requestId && a.application === b.application && a.generation === b.generation;
export function manualEntryUpdate(elapsedMs: number): number {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) throw Error('Invalid Manual entry timestamp');
  const update = Math.floor(elapsedMs * MANUAL_ENTRY_HOST_HZ / 1000);
  if (!Number.isSafeInteger(update)) throw Error('Invalid Manual entry timestamp');
  return update;
}

/** Only presented source poses survive invalidation. Readiness cannot invent
 * the outgoing terminal receipt or spend an unobserved interval. */
export function createManualEntryPresentation() {
  let identity: ManualEntryIdentity | null = null, ticket = 0, disposed = false, rebase = true;
  let presented: { pose: ManualEntryPose; update: number } | undefined, pending: ManualEntryPose | undefined;
  const revoke = () => { ticket++; pending = undefined; rebase = true; };
  const ready = (next: ManualEntryIdentity | null) => !rebase && sameManualEntryIdentity(identity, next)
    && presented?.pose.phase === 'in' && presented.pose.frame === MANUAL_ENTRY_LAST_FRAME;
  return {
    sample(input: Readonly<{ identity: ManualEntryIdentity | null; elapsedMs: number; eligible: boolean; destinationReady: boolean; reducedMotion: boolean }>): ManualEntryPose | undefined {
      if (disposed) return undefined;
      const update = manualEntryUpdate(input.elapsedMs);
      if (!sameManualEntryIdentity(identity, input.identity)) { revoke(); identity = input.identity; presented = undefined; }
      if (!identity || !input.eligible) { revoke(); return undefined; }
      if (!identity.owner || !/^[a-f0-9]{16}$/.test(identity.manualTitleId) || !Number.isSafeInteger(identity.generation) || identity.generation < 0) throw Error('Invalid Manual entry identity');
      if (ready(identity)) return undefined;
      if (pending) return pending;
      const previous = presented?.pose;
      let phase: ManualEntryPose['phase'] = previous?.phase ?? 'out', frame = previous?.frame ?? 0;
      const updates = presented ? update - presented.update : 0;
      if (updates < 0) throw Error('Manual entry clock moved backwards');
      if (input.reducedMotion) {
        if (previous?.phase === 'out' && previous.frame === MANUAL_ENTRY_LAST_FRAME && !rebase && input.destinationReady) phase = 'in';
        frame = MANUAL_ENTRY_LAST_FRAME;
      } else if (previous && !rebase && updates > 0 && updates <= MAX_OBSERVED_UPDATE_GAP) {
        if (previous.phase === 'out' && previous.frame === MANUAL_ENTRY_LAST_FRAME) {
          if (input.destinationReady) { phase = 'in'; frame = 0; }
        } else frame = Math.min(MANUAL_ENTRY_LAST_FRAME, frame + 1);
      }
      pending = Object.freeze({ identity: Object.freeze({ ...identity }), ticket, phase, frame });
      return pending;
    },
    present(pose: ManualEntryPose, next: ManualEntryIdentity | null, elapsedMs: number, eligible: boolean, destinationReady: boolean): boolean {
      if (disposed || !eligible || pose !== pending || pose.ticket !== ticket || !sameManualEntryIdentity(identity, next)
        || pose.phase === 'in' && !destinationReady) return false;
      const update = manualEntryUpdate(elapsedMs);
      if (presented && update < presented.update) return false;
      presented = { pose, update }; pending = undefined; rebase = false; return true;
    },
    active(next: ManualEntryIdentity | null, destinationReady: boolean): boolean {
      return !disposed && !!next && !ready(next) && (!sameManualEntryIdentity(identity, next) || !!pending
        || !presented || presented.pose.phase === 'in' || presented.pose.frame < MANUAL_ENTRY_LAST_FRAME || destinationReady);
    },
    ready, revoke,
    reset() { revoke(); identity = null; presented = undefined; },
    dispose() { disposed = true; revoke(); identity = null; presented = undefined; },
  };
}
