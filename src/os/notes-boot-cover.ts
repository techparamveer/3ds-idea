import { poseNativeLayout, type NativeLayout, type NativePack } from './native-layout.ts';
import { createNotesIntroClock, stepNotesIntroClock } from './notes-intro-clock.ts';

const LAST_FRAME = 20;
type Sources = Readonly<{ upper: NativePack; lower: NativePack }>;
export type NotesBootCoverPaint = Readonly<{
  status: 'boot-cover';
  owner: string;
  upper: NativeLayout;
  lower: NativeLayout;
  scene9Draw: boolean;
  scene10Draw: boolean;
  ticket: number;
  steps: number;
}>;

export function notesBootCoverSourcesFromPacks(packs: Record<string, NativePack | undefined>): Sources | undefined {
  const upper = packs['notes-aplt-u'], lower = packs['notes-aplt-d'];
  if (!upper?.layouts.ApltBoot_U_00 || !lower?.layouts.ApltBoot_D_00
    || !upper.animations.ApltBoot_U_00_SceneIn || !lower.animations.ApltBoot_D_00_SceneIn) return undefined;
  return { upper, lower };
}

/** Scenes 9/10 start before advance, then clear draw on the update after
 * frame 20. Their initialization does not require scene-3 title metadata.
 * The 60 Hz host clock is a scheduling adaptation. One successful paired
 * publication permits at most one update; missed updates are never caught up. */
export function createNotesBootCoverSession() {
  let owner: string | null = null, ticket = 0, steps = 0;
  let clock = createNotesIntroClock(), paint: NotesBootCoverPaint | undefined;
  let paintSources: Sources | undefined;
  let disposed = false, eligible = false, presented = false;
  const rebase = () => { clock = createNotesIntroClock(); eligible = presented = false; };
  return {
    sync(input: Readonly<{ owner: string | null; now: number; paused: boolean; reducedMotion: boolean; sources?: Sources }>): NotesBootCoverPaint | undefined {
      if (disposed) return undefined;
      if (input.owner !== owner) {
        owner = input.owner; ticket++; steps = 0; rebase(); paint = paintSources = undefined;
      }
      eligible = owner !== null && !input.paused && !!input.sources;
      const stepped = stepNotesIntroClock(clock, input.now, eligible && presented);
      clock = stepped.clock;
      if (!eligible || !input.sources || owner === null) { presented = false; return undefined; }
      const nextSteps = input.reducedMotion ? LAST_FRAME + 1 : Math.min(LAST_FRAME + 1, steps + Math.min(1, stepped.updates));
      if (stepped.updates > 1) clock = stepNotesIntroClock(createNotesIntroClock(), input.now, true).clock;
      if (nextSteps !== steps) { steps = nextSteps; presented = false; }
      if (paint?.ticket === ticket && paint.steps === steps
        && paintSources?.upper === input.sources.upper && paintSources.lower === input.sources.lower) return paint;
      presented = false;
      const frame = Math.min(LAST_FRAME, steps);
      paint = Object.freeze({
        status: 'boot-cover', owner, ticket, steps,
        scene9Draw: steps <= LAST_FRAME, scene10Draw: steps <= LAST_FRAME,
        upper: poseNativeLayout(input.sources.upper.layouts.ApltBoot_U_00, input.sources.upper.animations,
          [{ name: 'ApltBoot_U_00_SceneIn', frame, groups: ['Group_00'] }]),
        lower: poseNativeLayout(input.sources.lower.layouts.ApltBoot_D_00, input.sources.lower.animations,
          [{ name: 'ApltBoot_D_00_SceneIn', frame, groups: ['G_Scene_00'] }]),
      });
      paintSources = input.sources;
      return paint;
    },
    present(pair: NotesBootCoverPaint, now: number): boolean {
      if (disposed || !eligible || pair !== paint || pair.owner !== owner || !Number.isFinite(now)) return false;
      clock = clock.lastNow === null || now < clock.lastNow
        ? stepNotesIntroClock(createNotesIntroClock(), now, true).clock : { ...clock, lastNow: now };
      presented = true;
      return true;
    },
    pending(nextOwner: string): boolean {
      return !disposed && (nextOwner !== owner || steps <= LAST_FRAME || !presented);
    },
    pause: rebase,
    dispose() { disposed = true; owner = null; ticket++; steps = 0; rebase(); paint = paintSources = undefined; },
  };
}

/** The asset-ready pair is not input-ready until this entry's terminal pair. */
export function createNotesBootCoverPublicationGate() {
  let owner: string | null = null, ticket: number | null = null, terminal = false, required = false;
  return {
    sync(nextOwner: string | null, pair?: NotesBootCoverPaint) {
      if (nextOwner !== owner) { owner = nextOwner; ticket = null; terminal = required = false; }
      if (pair) {
        required = true;
        if (pair.owner !== owner) terminal = false;
        else if (pair.ticket !== ticket) { ticket = pair.ticket; terminal = false; }
      }
    },
    present(nextOwner: string, pair: NotesBootCoverPaint): boolean {
      if (owner !== nextOwner || pair.owner !== owner || pair.ticket !== ticket) return false;
      if (pair.steps === LAST_FRAME + 1 && !pair.scene9Draw && !pair.scene10Draw) terminal = true;
      return terminal;
    },
    ready: () => !required || terminal,
    revoke() { terminal = false; },
    reset() { owner = null; ticket = null; terminal = required = false; },
  };
}
