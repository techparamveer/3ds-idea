import { pollHomeInput, type HomeInputPoll, type HomeInputProducer, type HomeKeyEvent } from './home-input-producer.ts';
import { advanceHomeCursorLoop } from './home-cursor-loop.ts';
import { advanceHomeScroll, consumeHomeGridKeyEvent, type HomeDirectionGates, type HomeScrollAdvanceOptions,
  type HomeScrollObservation, type HomeScrollState } from './home-scroll-consumer.ts';

export type HomeNavigationPassState = Readonly<{ producer: HomeInputProducer; scroll: HomeScrollState }>;
export type HomeNavigationPassObservation = Readonly<{ phase: 'input' | 'lower'; observation: HomeScrollObservation }>;
export type HomeNavigationPassOptions = Readonly<{
  directionGates?: HomeDirectionGates;
  lower?: HomeScrollAdvanceOptions;
  /** Pure host policy evaluated after lower work; never infer this from elapsed time. */
  cursorLayoutEligible: (state: HomeScrollState) => boolean;
}>;
export type HomeNavigationPassResult = Readonly<{
  state: HomeNavigationPassState;
  afterInput: HomeScrollState;
  events: readonly HomeKeyEvent[];
  observations: readonly HomeNavigationPassObservation[];
  disposition: 'handled' | 'unsupported';
}>;

/** One ordinary producer→input→lower→later cursor-layout pass. The upper
 * banner manager and 3D pass remain external: use input/lower observations at
 * their respective phases, not the final selected slot. No wall-clock cadence,
 * touch acceptance, folder-close ownership, sound playback or paint is inferred.
 * An unsupported route returns the original state atomically for another owner.
 */
export function stepHomeNavigationPass(state: HomeNavigationPassState, poll: HomeInputPoll,
  options: HomeNavigationPassOptions): HomeNavigationPassResult {
  const produced = pollHomeInput(state.producer, poll);
  const unsupported = (): HomeNavigationPassResult => Object.freeze({ state, afterInput: state.scroll,
    events: produced.events, observations: Object.freeze([]), disposition: 'unsupported' });
  let scroll = state.scroll;
  const observations: HomeNavigationPassObservation[] = [];
  for (const event of produced.events) {
    const consumed = consumeHomeGridKeyEvent(scroll, event, options.directionGates);
    if (consumed.disposition === 'unsupported') return unsupported();
    scroll = consumed.state;
    observations.push(...consumed.observations.map(observation => Object.freeze({ phase: 'input' as const, observation })));
  }
  const afterInput = scroll, lower = advanceHomeScroll(scroll, 1, options.lower);
  if (lower.disposition === 'unsupported') return unsupported();
  observations.push(...lower.observations.map(observation => Object.freeze({ phase: 'lower' as const, observation })));
  const eligible = options.cursorLayoutEligible(lower.state);
  if (typeof eligible !== 'boolean') throw new TypeError('Invalid HOME cursor layout eligibility');
  scroll = Object.freeze({ ...lower.state, cursorLoop: advanceHomeCursorLoop(lower.state.cursorLoop, 1, eligible) });
  return Object.freeze({ state: Object.freeze({ producer: produced.state, scroll }), afterInput,
    events: produced.events, observations: Object.freeze(observations), disposition: 'handled' });
}
