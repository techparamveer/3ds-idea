import { createNotesIntroClock, stepNotesIntroClock, type NotesIntroClock } from './notes-intro-clock.ts';
import {
  createNotesIntroComposer, type NotesIntroComposition, type NotesIntroObservation, type NotesIntroSources,
} from './notes-intro-publication.ts';
import type { NotesPanelCommand, NotesPanelContext } from './notes-panel-scheduler.ts';

export type NotesIntroHostInput = NotesPanelContext & {
  now: number;
  screen: string;
  sources?: NotesIntroSources;
};
export type NotesIntroSessionState = Readonly<{
  ticket: number;
  status: string;
  clock: Readonly<NotesIntroClock>;
  pending: readonly NotesPanelCommand[];
  observation?: NotesIntroObservation;
}>;

/** Presentation-owned clock+composer. Host `now` is the Notes tick accumulator,
 * not a paint count or metadata-completion timestamp. Open/return are already-
 * accepted live events; return waits for MemoDecide/SceneOut idle. */
export function createNotesIntroSession() {
  const composer = createNotesIntroComposer();
  let clock = createNotesIntroClock(), ticket = 0, startedDrawing = false;
  let pending: NotesPanelCommand[] = [];
  let lastObservation: NotesIntroObservation | undefined;
  let prevScreen: string | undefined;
  function takeCommand() {
    if (!pending.length) return undefined;
    if (pending[0] === 'return' && lastObservation && !lastObservation.list.openClocksIdle) return undefined;
    return pending.shift();
  }
  function snapshot(): NotesIntroSessionState {
    const inner = composer.getState();
    return Object.freeze({
      ticket: inner.ticket, status: inner.status, clock: Object.freeze({ ...clock }),
      pending: Object.freeze(pending.slice()), observation: lastObservation,
    });
  }
  return {
    getState: snapshot,
    sync(input: NotesIntroHostInput) {
      const state = composer.sync(input);
      if (state.ticket !== ticket) {
        ticket = state.ticket;
        clock = createNotesIntroClock();
        pending = [];
        lastObservation = undefined;
        prevScreen = undefined;
        startedDrawing = input.screen === 'drawing';
      } else if (state.status !== 'ready') {
        startedDrawing = input.screen === 'drawing';
      }
      if (state.status === 'ready') {
        if (prevScreen === undefined) {
          if (startedDrawing || input.screen === 'drawing') pending.push('open');
        } else {
          if (prevScreen === 'main' && input.screen === 'drawing') pending.push('open');
          if (prevScreen === 'drawing' && input.screen === 'main') pending.push('return');
        }
        prevScreen = input.screen;
      }
      const stepped = stepNotesIntroClock(clock, input.now, state.status === 'ready');
      clock = stepped.clock;
      for (let i = 0; i < stepped.updates; i++) {
        const next = composer.step(ticket, takeCommand());
        if (next) {
          lastObservation = next;
          if (input.sources) composer.compose(input.sources);
        }
      }
      return snapshot();
    },
    compose(sources: NotesIntroSources): NotesIntroComposition | undefined {
      return composer.compose(sources);
    },
    dispose() {
      composer.dispose();
      clock = createNotesIntroClock();
      pending = [];
      lastObservation = undefined;
      ticket = 0; startedDrawing = false; prevScreen = undefined;
    },
  };
}
