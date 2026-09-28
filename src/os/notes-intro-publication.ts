import { poseNativeLayout, type NativeAnimation, type NativeLayout, type NativePack } from './native-layout.ts';
import { createNotesPanelPublisher } from './notes-panel-publication.ts';
import {
  createNotesPanelScheduler, type NotesPanelCommand, type NotesPanelContext, type NotesPanelObservation,
} from './notes-panel-scheduler.ts';

/** SceneIn clips are 21 frames (last 20). MemoDecide is 25 frames (last 24). */
const INTRO_LAST = 20, DECIDE_LAST = 24, RETURN_LAST = 20;
type Slot = { enabled: boolean; frame: number; last: number };
type Intro = { slot: Slot; draw: boolean; state: 0 | 1; pending: 0 | 1 };
type List = { sceneOut: Slot; memoDecide: Slot; memoReturnNote: Slot; memoReturnCursor: Slot; sceneIn: Slot };
const slot = (last: number): Slot => ({ enabled: false, frame: 0, last });
const busy = (s: Slot) => s.enabled && s.frame < s.last;
const start = (s: Slot) => { s.enabled = true; s.frame = 0; };
const advance = (s: Slot) => { if (s.enabled) s.frame = Math.min(s.last, s.frame + 1); };
const freeze = (s: Slot) => Object.freeze({ ...s });
const visible = (pane?: { flags: number }) => !!pane && (pane.flags & 1) !== 0;
const find = (state: NativeLayout, name: string) => {
  const visit = (panes: NativeLayout['roots']): NativeLayout['roots'][number] | undefined => {
    for (const pane of panes) { if (pane.name === name) return pane; const child = visit(pane.children); if (child) return child; }
  };
  return visit(state.roots);
};

function updateIntro(scene: Intro) {
  if (scene.state === 0) { if (scene.pending === 1) { scene.state = 1; scene.pending = 0; start(scene.slot); } }
  else if (scene.state === 1 && !busy(scene.slot)) scene.draw = false;
  advance(scene.slot);
}

export type NotesIntroObservation = Readonly<{
  steps: number;
  scene9: Readonly<{ draw: boolean; state: number; sceneIn: Readonly<Slot> }>;
  scene10: Readonly<{ draw: boolean; state: number; sceneIn: Readonly<Slot> }>;
  list: Readonly<{
    sceneOut: Readonly<Slot>; memoDecide: Readonly<Slot>; memoReturnNote: Readonly<Slot>;
    memoReturnCursor: Readonly<Slot>; sceneIn: Readonly<Slot>;
    returnFrame5Started: boolean; openClocksIdle: boolean; returnComplete: boolean;
  }>;
  afterScene3: NotesPanelObservation;
}>;
export type NotesIntroSources = {
  title: { layout: NativeLayout; animations: Record<string, NativeAnimation> };
  upper: { layout: NativeLayout; animations: Record<string, NativeAnimation> };
  lower: { layout: NativeLayout; animations: Record<string, NativeAnimation> };
};
export type NotesIntroComposition = Readonly<{
  title: NativeLayout; upper: NativeLayout; lower: NativeLayout;
  titleUserVisible: boolean; scene9Draw: boolean; scene10Draw: boolean;
}>;

/** Priority-0 SceneIn / list-gate composer around the existing title publisher.
 * The owner-bound session steps it; the live painter only samples compose().
 * Event 0 arms both intros; the first update starts then advances SceneIn.
 * Draw flags clear when SceneIn is not busy. titleUserVisible is scene-10
 * draw off plus an applied visible W_TextPanel. */
export function createNotesIntroComposer() {
  const scheduler = createNotesPanelScheduler(), publisher = createNotesPanelPublisher();
  let ticket = 0, returnFrame5Started = false, composedKey = '';
  let intro: { lower: Intro; upper: Intro } | undefined, list: List | undefined;
  let lastPanel: NotesPanelObservation | undefined;
  let titleApplied: NativeLayout | undefined, upperApplied: NativeLayout | undefined, lowerApplied: NativeLayout | undefined;
  let lastComposition: NotesIntroComposition | undefined;
  function reset() {
    intro = {
      lower: { slot: slot(INTRO_LAST), draw: true, state: 0, pending: 1 },
      upper: { slot: slot(INTRO_LAST), draw: true, state: 0, pending: 1 },
    };
    list = {
      sceneOut: slot(INTRO_LAST), memoDecide: slot(DECIDE_LAST),
      memoReturnNote: slot(RETURN_LAST), memoReturnCursor: slot(RETURN_LAST), sceneIn: slot(INTRO_LAST),
    };
    returnFrame5Started = false; lastPanel = titleApplied = upperApplied = lowerApplied = lastComposition = undefined; composedKey = '';
  }
  function observe(panel: NotesPanelObservation): NotesIntroObservation {
    const l = list!, i = intro!;
    return Object.freeze({
      steps: panel.steps,
      scene9: Object.freeze({ draw: i.lower.draw, state: i.lower.state, sceneIn: freeze(i.lower.slot) }),
      scene10: Object.freeze({ draw: i.upper.draw, state: i.upper.state, sceneIn: freeze(i.upper.slot) }),
      list: Object.freeze({
        sceneOut: freeze(l.sceneOut), memoDecide: freeze(l.memoDecide), memoReturnNote: freeze(l.memoReturnNote),
        memoReturnCursor: freeze(l.memoReturnCursor), sceneIn: freeze(l.sceneIn), returnFrame5Started,
        openClocksIdle: (!l.memoDecide.enabled || !busy(l.memoDecide)) && (!l.sceneOut.enabled || !busy(l.sceneOut)),
        returnComplete: returnFrame5Started && !busy(l.sceneIn) && !busy(l.memoReturnNote) && !busy(l.memoReturnCursor),
      }),
      afterScene3: panel,
    });
  }
  return {
    getState: scheduler.getState,
    sync(next: NotesPanelContext) {
      const state = scheduler.sync(next);
      if (state.ticket !== ticket) {
        ticket = state.ticket;
        if (state.observation) reset();
        else { intro = list = undefined; lastPanel = titleApplied = upperApplied = lowerApplied = lastComposition = undefined; composedKey = ''; }
      } else if (state.observation && !intro) reset();
      return state;
    },
    step(commandTicket: number, command?: NotesPanelCommand) {
      if (!intro || !list) return undefined;
      const panel = scheduler.step(commandTicket, command);
      if (!panel) return undefined;
      if (command === 'return') { start(list.memoReturnNote); start(list.memoReturnCursor); }
      updateIntro(intro.lower); updateIntro(intro.upper);
      if (command === 'open') { start(list.sceneOut); start(list.memoDecide); }
      if (list.memoReturnNote.enabled && list.memoReturnNote.frame === 5 && !list.sceneIn.enabled) {
        start(list.sceneIn); returnFrame5Started = true;
      }
      for (const s of [list.sceneOut, list.memoDecide, list.memoReturnNote, list.memoReturnCursor, list.sceneIn]) advance(s);
      lastPanel = panel.afterScene3;
      return observe(panel.afterScene3);
    },
    compose(sources: NotesIntroSources): NotesIntroComposition | undefined {
      if (!lastPanel || !intro) return undefined;
      const key = JSON.stringify([ticket, lastPanel.steps, intro.upper.draw, intro.upper.slot.frame, intro.lower.slot.frame,
        lastPanel.title, lastPanel.hud]);
      if (key === composedKey && lastComposition) return lastComposition;
      titleApplied = publisher.publish(ticket, lastPanel, sources.title.layout, sources.title.animations);
      if (intro.upper.slot.enabled) {
        upperApplied = poseNativeLayout(upperApplied ?? sources.upper.layout, sources.upper.animations, [
          { name: 'ApltBoot_U_00_SceneIn', frame: intro.upper.slot.frame, groups: ['Group_00'] },
        ]);
      }
      if (intro.lower.slot.enabled) {
        lowerApplied = poseNativeLayout(lowerApplied ?? sources.lower.layout, sources.lower.animations, [
          { name: 'ApltBoot_D_00_SceneIn', frame: intro.lower.slot.frame, groups: ['G_Scene_00'] },
        ]);
      }
      if (!upperApplied || !lowerApplied) return undefined;
      lastComposition = Object.freeze({
        title: titleApplied, upper: upperApplied, lower: lowerApplied,
        titleUserVisible: !intro.upper.draw && visible(find(titleApplied, 'W_TextPanel')),
        scene9Draw: intro.lower.draw, scene10Draw: intro.upper.draw,
      });
      composedKey = key;
      return lastComposition;
    },
    dispose() {
      scheduler.dispose(); publisher.dispose();
      intro = list = undefined; lastPanel = titleApplied = upperApplied = lowerApplied = lastComposition = undefined; composedKey = '';
    },
  };
}

/** Live pack aliases required before the session may start the source clock. */
export function notesIntroSourcesFromPacks(packs: Record<string, NativePack | undefined>): NotesIntroSources | undefined {
  const title = packs['notes-image'], upper = packs['notes-aplt-u'], lower = packs['notes-aplt-d'];
  if (!title?.layouts.ImageScreenUp || !upper?.layouts.ApltBoot_U_00 || !lower?.layouts.ApltBoot_D_00) return undefined;
  if (!title.animations.ImageScreenUp_TextPanelInOut || !title.animations.ImageScreenUp_TextPanelStay
    || !upper.animations.ApltBoot_U_00_SceneIn || !lower.animations.ApltBoot_D_00_SceneIn) return undefined;
  return {
    title: { layout: title.layouts.ImageScreenUp, animations: title.animations },
    upper: { layout: upper.layouts.ApltBoot_U_00, animations: upper.animations },
    lower: { layout: lower.layouts.ApltBoot_D_00, animations: lower.animations },
  };
}

export function notesIntroPaneSnapshot(composition: NotesIntroComposition) {
  const pane = (layout: NativeLayout, name: string) => {
    const next = find(layout, name);
    return next ? { flags: next.flags, alpha: next.alpha, translation: [...next.translation] } : null;
  };
  return Object.freeze({
    titleUserVisible: composition.titleUserVisible,
    scene9Draw: composition.scene9Draw,
    scene10Draw: composition.scene10Draw,
    W_TextPanel: pane(composition.title, 'W_TextPanel'),
    P_Bg_U_00: pane(composition.upper, 'P_Bg_U_00'),
    P_Bg_D_00: pane(composition.lower, 'P_Bg_D_00'),
  });
}
