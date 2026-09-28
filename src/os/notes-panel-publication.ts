import { poseNativeLayout, type NativeAnimation, type NativeLayout } from './native-layout.ts';
import type { NotesPanelObservation } from './notes-panel-scheduler.ts';

const TITLE = ['ImageScreenUp_TextPanelInOut', 'ImageScreenUp_TextPanelStay'] as const;
const HUD = [
  'ImageScreenUp_SwitchDouble', 'ImageScreenUp_SwitchUp', 'ImageScreenUp_SwitchDown',
  'ImageScreenUp_HudDoubleInOut', 'ImageScreenUp_HudUpInOut', 'ImageScreenUp_HudDownInOut',
] as const;

/** Title is G_Panel_01; HUD/Switch are constructor-bound to G_Panel_00 only
 * (0x167844 / 0x1678d0). Resource clips that list both groups must not be
 * applied globally. Disabled slots are omitted so retained values survive. */
function bindings(observation: NotesPanelObservation) {
  return [
    ...observation.title.flatMap((slot, i) => slot.enabled
      ? [{ name: TITLE[i], frame: slot.frame, groups: ['G_Panel_01'] as string[], childBinding: false }] : []),
    ...observation.hud.flatMap((slot, i) => slot.enabled
      ? [{ name: HUD[i], frame: slot.frame, groups: ['G_Panel_00'] as string[], childBinding: false }] : []),
  ];
}

/** Applied-layout composer for afterScene3 observations.
 * Not imported by the live painter. Event 0 / late event 9 only start
 * controllers; the first publish must use the first scene-3 observation.
 * A changed command ticket discards retained values and reseeds the shared
 * resource. The resource itself is never mutated. */
export function createNotesPanelPublisher() {
  let ticket = -1, applied: NativeLayout | undefined;
  return {
    publish(commandTicket: number, observation: NotesPanelObservation, source: NativeLayout, animations: Record<string, NativeAnimation>) {
      if (commandTicket !== ticket) { ticket = commandTicket; applied = undefined; }
      applied = poseNativeLayout(applied ?? source, animations, bindings(observation));
      return applied;
    },
    dispose() { ticket = -1; applied = undefined; },
  };
}
