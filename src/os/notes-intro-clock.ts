export type NotesIntroClock = { lastNow: number | null; remainderMs: number; updateCount: number };
export const NOTES_INTRO_UPDATE_MS = 1000 / 60;
export const createNotesIntroClock = (): NotesIntroClock => ({ lastNow: null, remainderMs: 0, updateCount: 0 });

/** Owner-bound host remainder clock. Same provisional 60 Hz cadence as HOME
 * `stepHomeUpdateClock`; not a measured native wall-clock. Inactive samples
 * drop lastNow so a late metadata/asset ready cannot consume queued time.
 * Paint and metadata callbacks are not a step source. */
export function stepNotesIntroClock(clock: NotesIntroClock, now: number, active: boolean): { clock: NotesIntroClock; updates: number } {
  if (!Number.isFinite(now)) return { clock, updates: 0 };
  if (!active) return { clock: clock.lastNow === null && clock.remainderMs === 0 ? clock : { ...clock, lastNow: null, remainderMs: 0 }, updates: 0 };
  if (clock.lastNow === null || now < clock.lastNow) return { clock: { ...clock, lastNow: now, remainderMs: 0 }, updates: 0 };
  if (now === clock.lastNow) return { clock, updates: 0 };
  const elapsed = clock.remainderMs + now - clock.lastNow, updates = Math.floor(elapsed / NOTES_INTRO_UPDATE_MS + 1e-9);
  return { clock: { lastNow: now, remainderMs: Math.max(0, elapsed - updates * NOTES_INTRO_UPDATE_MS), updateCount: clock.updateCount + updates }, updates };
}
