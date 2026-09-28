import type { NotesMetadataState } from './notes-metadata-session';

type ReadyMetadata = Extract<NotesMetadataState, { status: 'ready' }>;
export type NotesPanelOwner = Pick<ReadyMetadata, 'notesOwner' | 'applicationOwner' | 'captureGeneration' | 'titleId'>;
export type NotesPanelCommand = 'open' | 'return' | 'switch';
type Slot = { enabled: boolean; frame: number; reverse: boolean; last: number };
type Controller = { title: Slot[]; hud: Slot[]; phase: -1 | 0 | 1 | 2; mode: number; activity: 'idle' | 'switch' | 'hud'; steps: number };
export type NotesPanelObservation = Readonly<{
  steps: number; phase: Controller['phase']; mode: number; activity: Controller['activity'];
  title: readonly Readonly<Slot>[]; hud: readonly Readonly<Slot>[];
}>;
export type NotesPanelContext = {
  owner?: NotesPanelOwner;
  metadata: NotesMetadataState;
  assetsReady: boolean;
  paused: boolean;
  /** Explicit branch selection. The zero-history/tutorial route is not ported. */
  startup: 'nonzero-history' | 'zero-history';
};

const slot = (last: number): Slot => ({ enabled: false, frame: 0, reverse: false, last });
const busy = (s: Slot) => s.enabled && (s.reverse ? s.frame > 0 : s.frame < s.last);
function start(slots: Slot[], index: number, reset: boolean, reverse?: boolean) {
  slots.forEach((s, i) => { s.enabled = i === index; });
  const s = slots[index];
  if (reverse !== undefined) s.reverse = reverse;
  if (reset) s.frame = s.reverse ? s.last : 0;
}
function advance(slots: Slot[]) {
  for (const s of slots) if (s.enabled) s.frame = s.reverse ? Math.max(0, s.frame - 1) : Math.min(s.last, s.frame + 1);
}
const observe = (c: Controller): NotesPanelObservation => Object.freeze({
  steps: c.steps, phase: c.phase, mode: c.mode, activity: c.activity,
  title: Object.freeze(c.title.map(s => Object.freeze({ ...s }))),
  hud: Object.freeze(c.hud.map(s => Object.freeze({ ...s }))),
});
const ownerKey = (o?: NotesPanelOwner) => o && JSON.stringify([o.notesOwner, o.applicationOwner, o.captureGeneration, o.titleId]);
function ready(context: NotesPanelContext): context is NotesPanelContext & { metadata: ReadyMetadata } {
  const m = context.metadata, o = context.owner;
  return !!o && m.status === 'ready' && ownerKey(o) === ownerKey(m)
    && Number.isSafeInteger(o.captureGeneration) && o.captureGeneration > 0
    && m.capture.owner === o.applicationOwner && m.capture.generation === o.captureGeneration
    && m.metadata.selection.titleId === o.titleId && m.metadata.icon.width === 64 && m.metadata.icon.height === 64
    && m.metadata.icon.data.length === 64 * 64 * 4;
}

/** Bounded source-controller model, deliberately NOT connected to the painter.
 * Observations are stored controller frames, never applied/raster poses. One
 * step is one native manager update; no browser elapsed-time conversion exists.
 * Source addresses and unsupported routes: docs/notes-panel-scheduler.md. */
export function createNotesPanelScheduler() {
  let controller: Controller | undefined, context: NotesPanelContext | undefined;
  let key: string | undefined, resource: ReadyMetadata['metadata'] | undefined;
  let ticket = 0, disposed = false;
  function invalidate() { ticket++; controller = undefined; }
  function eligible() { return !!context && ready(context) && context.startup === 'nonzero-history'; }
  function state() {
    return Object.freeze({ ticket, status: disposed ? 'disposed' : context?.startup === 'zero-history' ? 'unsupported-startup'
      : !controller ? 'waiting' : !context?.assetsReady || context.paused ? 'paused' : 'ready',
    observation: controller && observe(controller) });
  }
  return {
    getState: state,
    sync(next: NotesPanelContext) {
      if (disposed) return state();
      const nextKey = ownerKey(next.owner), nextResource = ready(next) ? next.metadata.metadata : undefined;
      if (nextKey !== key || nextResource !== resource || context?.startup !== next.startup) invalidate();
      key = nextKey; resource = nextResource;
      context = { ...next, owner: next.owner && { ...next.owner } };
      if (!eligible()) { if (controller) invalidate(); return state(); }
      // Native acquisition precedes event 0. A late browser download cannot
      // consume controller time. Temporary pack unavailability pauses a started
      // context; it does not replay initialization after sleep/reload.
      if (!controller && next.assetsReady && !next.paused) {
        controller = { title: [slot(20), slot(120)], hud: [slot(25), slot(25), slot(25), slot(20), slot(20), slot(20)], phase: 0, mode: 0, activity: 'idle', steps: 0 };
        start(controller.title, 0, true);
      }
      return state();
    },
    step(commandTicket: number, command?: NotesPanelCommand) {
      // Check borrowed resource liveness again, even without a new sync.
      if (disposed || !eligible()) { if (controller) invalidate(); return undefined; }
      if (commandTicket !== ticket || !controller || !context?.assetsReady || context.paused) return undefined;
      const c = controller;
      // Scene 2 priority 3: return/event 8 and mode/event 1..3 precede
      // scene 3 priority 4. Event 8 never restarts the title clock.
      if (command === 'return') { start(c.hud, c.mode + 3, true, true); c.activity = 'hud'; }
      if (command === 'switch') {
        c.mode = (c.mode + 1) % 3;
        start(c.hud, c.mode, true); c.activity = 'switch';
        const reset = !busy(c.title[0]) && !busy(c.title[1]);
        start(c.title, 0, reset, false); c.phase = 0;
      }
      const beforeScene3 = observe(c);
      let switchCompleted = false;
      if (c.activity !== 'idle' && !busy(c.hud[c.mode + (c.activity === 'hud' ? 3 : 0)])) {
        switchCompleted = c.activity === 'switch'; c.activity = 'idle';
      }
      // Completion is checked before advancement (0x168698). Reverse starts
      // at 30, above authored last frame 20; do not clamp this stored frame.
      if (c.phase === 0 && !busy(c.title[0])) { start(c.title, 1, true); c.phase = 1; }
      else if (c.phase === 1 && !busy(c.title[1])) { c.title[0].frame = 30; start(c.title, 0, false, true); c.phase = 2; }
      else if (c.phase === 2 && !busy(c.title[0])) { c.title[0].frame = 0; c.phase = -1; }
      advance(c.title); advance(c.hud); c.steps++;
      const afterScene3 = observe(c);
      // Scene 1 priority 6: selected-note event 9 resets HUD after its
      // advance opportunity. Layout application after this late event is open.
      if (command === 'open') { start(c.hud, c.mode + 3, true, false); c.activity = 'hud'; }
      return Object.freeze({ beforeScene3, afterScene3, afterList: observe(c), switchCompleted });
    },
    dispose() { if (disposed) return; disposed = true; invalidate(); context = undefined; resource = undefined; key = undefined; },
  };
}
