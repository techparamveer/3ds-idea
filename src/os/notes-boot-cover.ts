import { poseNativeLayout, type NativeLayout, type NativePack } from './native-layout.ts';
import { createNotesIntroClock, stepNotesIntroClock } from './notes-intro-clock.ts';

const LAST_FRAME = 20;
type Sources = Readonly<{ upper: NativePack; lower: NativePack }>;
export type NotesBootCoverPaint = Readonly<{
  status: 'boot-cover';
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
 * The existing host 60 Hz clock remains a scheduling adaptation. */
export function createNotesBootCoverSession() {
  let owner: string | null = null, ticket = 0, steps = 0;
  let clock = createNotesIntroClock(), paint: NotesBootCoverPaint | undefined;
  let paintSources: Sources | undefined;
  let disposed = false;
  return {
    sync(input: Readonly<{ owner: string | null; now: number; paused: boolean; reducedMotion: boolean; sources?: Sources }>): NotesBootCoverPaint | undefined {
      if (disposed) return undefined;
      if (input.owner !== owner) {
        owner = input.owner; ticket++; steps = 0; clock = createNotesIntroClock(); paint = paintSources = undefined;
      }
      const eligible = owner !== null && !input.paused && !!input.sources;
      const stepped = stepNotesIntroClock(clock, input.now, eligible);
      clock = stepped.clock;
      if (!eligible || !input.sources) return undefined;
      steps = input.reducedMotion ? LAST_FRAME + 1 : Math.min(LAST_FRAME + 1, steps + stepped.updates);
      if (paint?.ticket === ticket && paint.steps === steps
        && paintSources?.upper === input.sources.upper && paintSources.lower === input.sources.lower) return paint;
      const frame = Math.min(LAST_FRAME, steps);
      paint = Object.freeze({
        status: 'boot-cover', ticket, steps,
        scene9Draw: steps <= LAST_FRAME, scene10Draw: steps <= LAST_FRAME,
        upper: poseNativeLayout(input.sources.upper.layouts.ApltBoot_U_00, input.sources.upper.animations,
          [{ name: 'ApltBoot_U_00_SceneIn', frame, groups: ['Group_00'] }]),
        lower: poseNativeLayout(input.sources.lower.layouts.ApltBoot_D_00, input.sources.lower.animations,
          [{ name: 'ApltBoot_D_00_SceneIn', frame, groups: ['G_Scene_00'] }]),
      });
      paintSources = input.sources;
      return paint;
    },
    dispose() { disposed = true; owner = null; ticket++; steps = 0; clock = createNotesIntroClock(); paint = paintSources = undefined; },
  };
}
