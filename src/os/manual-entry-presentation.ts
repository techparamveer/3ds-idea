export const MANUAL_ENTRY_LAST_FRAME = 20;
// Browser scheduling policy, not a traced Manual caller epoch or native rate.
export const MANUAL_ENTRY_HOST_HZ = 60;
// More than 100ms between accepted host samples is a stall, not motion credit.
// Both phases consume bounded host-clock ticks. This is not a recovered native
// duration.
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
  let presented: { pose: ManualEntryPose; update: number; sampledUpdate: number } | undefined;
  let pending: { pose: ManualEntryPose; update: number } | undefined;
  const revoke = () => { ticket++; pending = undefined; rebase = true; };
  const ready = (next: ManualEntryIdentity | null) => !rebase && sameManualEntryIdentity(identity, next)
    && presented?.pose.phase === 'in' && presented.pose.frame === MANUAL_ENTRY_LAST_FRAME;
  // Browser composition scheduling only. Incoming receipts already passed the
  // opaque outgoing gate; their retained destination must survive a rebase.
  const destinationCompositionAllowed = (next: ManualEntryIdentity | null) => !disposed && sameManualEntryIdentity(identity, next)
    && (presented?.pose.phase === 'in' || !rebase && presented?.pose.phase === 'out' && presented.pose.frame === MANUAL_ENTRY_LAST_FRAME);
  return {
    sample(input: Readonly<{ identity: ManualEntryIdentity | null; elapsedMs: number; eligible: boolean; destinationReady: boolean; reducedMotion: boolean }>): ManualEntryPose | undefined {
      if (disposed) return undefined;
      const update = manualEntryUpdate(input.elapsedMs);
      if (!sameManualEntryIdentity(identity, input.identity)) { revoke(); identity = input.identity; presented = undefined; }
      if (!identity || !input.eligible) { revoke(); return undefined; }
      if (!identity.owner || !/^[a-f0-9]{16}$/.test(identity.manualTitleId) || !Number.isSafeInteger(identity.generation) || identity.generation < 0) throw Error('Invalid Manual entry identity');
      if (ready(identity)) return undefined;
      if (pending) return pending.pose;
      const previous = presented?.pose;
      let phase: ManualEntryPose['phase'] = previous?.phase ?? 'out', frame = previous?.frame ?? 0;
      const receiptUpdates = presented ? update - presented.update : 0;
      if (receiptUpdates < 0) throw Error('Manual entry clock moved backwards');
      // Sampling precedes the paired render receipt. Motion follows the accepted
      // sample so time spent painting does not disappear; the receipt still
      // gates publication.
      const sampledUpdates = presented ? update - presented.sampledUpdate : 0;
      const progress = !rebase && sampledUpdates > 0 && sampledUpdates <= MAX_OBSERVED_UPDATE_GAP ? sampledUpdates : 0;
      if (input.reducedMotion) {
        if (previous?.phase === 'out' && previous.frame === MANUAL_ENTRY_LAST_FRAME && !rebase && input.destinationReady) phase = 'in';
        frame = MANUAL_ENTRY_LAST_FRAME;
      } else if (previous && progress > 0) {
        if (previous.phase === 'out' && previous.frame === MANUAL_ENTRY_LAST_FRAME) {
          if (input.destinationReady) { phase = 'in'; frame = 0; }
        } else frame = Math.min(MANUAL_ENTRY_LAST_FRAME, frame + progress);
      }
      pending = { pose: Object.freeze({ identity: Object.freeze({ ...identity }), ticket, phase, frame }), update };
      return pending.pose;
    },
    present(pose: ManualEntryPose, next: ManualEntryIdentity | null, elapsedMs: number, eligible: boolean, destinationReady: boolean): boolean {
      if (disposed || !eligible || !pending || pose !== pending.pose || pose.ticket !== ticket || !sameManualEntryIdentity(identity, next)
        || pose.phase === 'in' && !destinationReady) return false;
      const update = manualEntryUpdate(elapsedMs);
      if (presented && update < presented.update) return false;
      presented = { pose, update, sampledUpdate: pending.update }; pending = undefined; rebase = false; return true;
    },
    active(next: ManualEntryIdentity | null, destinationReady: boolean): boolean {
      return !disposed && !!next && !ready(next) && (!sameManualEntryIdentity(identity, next) || !!pending
        || rebase || !presented || presented.pose.phase === 'in' || presented.pose.frame < MANUAL_ENTRY_LAST_FRAME || destinationReady || destinationCompositionAllowed(next));
    },
    ready, destinationCompositionAllowed, revoke,
    reset() { revoke(); identity = null; presented = undefined; },
    dispose() { disposed = true; revoke(); identity = null; presented = undefined; },
  };
}
