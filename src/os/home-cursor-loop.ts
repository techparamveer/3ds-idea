import type { MenuState } from './state.ts';

/** Retained primary LncCsr_00_Loop; only its later layout pass advances phase. */
export type HomeCursorLoop = Readonly<{ currentFrame: number; appliedFrame: number; step: 1 | 3 }>;
export const createHomeCursorLoop = (): HomeCursorLoop => Object.freeze({ currentFrame: 0, appliedFrame: 0, step: 1 });

function validate(state: HomeCursorLoop): void {
 if (state.step !== 1 && state.step !== 3) throw new RangeError('Invalid HOME cursor step');
 for (const frame of [state.currentFrame, state.appliedFrame]) {
  if (!Number.isFinite(frame) || frame < 0 || frame >= 60) throw new RangeError('Invalid HOME cursor phase');
 }
}
/** A speed change neither submits nor seeks either retained frame. */
export function setHomeCursorLoopStep(state: HomeCursorLoop, step: 1 | 3): HomeCursorLoop {
 validate(state);
 if (step !== 1 && step !== 3) throw new RangeError('Invalid HOME cursor step');
 return step === state.step ? state : Object.freeze({ ...state, step });
}

/** Submit before float32 step; the looping endpoint 60 is not submitted.
 * Integer phases have exact60/20-update periods. Fractional phases use scalar
 * stepping until an exact cycle recurs, then skip only complete cycles.
 */
export function advanceHomeCursorLoop(state: HomeCursorLoop, updates: number, eligible: boolean): HomeCursorLoop {
 if (!Number.isSafeInteger(updates) || updates < 0) throw new RangeError('Invalid HOME cursor update count');
 validate(state);
 if (!eligible || updates === 0) return state;
 let currentFrame = state.currentFrame, appliedFrame = state.appliedFrame, remaining = updates;
 if (Number.isInteger(currentFrame)) { currentFrame = (currentFrame + ((updates - 1) % (60 / state.step)) * state.step) % 60; remaining = 1; }
 const seen = remaining > 1 ? new Map<number, number>() : null;
 while (remaining > 0) {
  const previousRemaining = seen?.get(currentFrame);
  if (previousRemaining !== undefined) remaining = (remaining - 1) % (previousRemaining - remaining) + 1;
  seen?.set(currentFrame, remaining);
  appliedFrame = currentFrame;
  currentFrame = Math.fround(currentFrame + state.step);
  if (currentFrame >= 60) currentFrame = Math.fround(currentFrame - 60);
  remaining--;
 }
 return currentFrame === state.currentFrame && appliedFrame === state.appliedFrame ? state : Object.freeze({ currentFrame, appliedFrame, step: state.step });
}

/** Sampling and accessibility/capture paints never advance the native clock. */
export function getHomeCursorLoopFrame(state: MenuState, reducedMotion = false): number {
 return reducedMotion ? 0 : state.system?.homeCursorLoop?.appliedFrame ?? 0;
}
