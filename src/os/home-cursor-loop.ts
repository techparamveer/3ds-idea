import type { MenuState } from './state.ts';

/** Ordinary primary LncCsr_00_Loop. Native mode3 step acceleration is separate. */
export type HomeCursorLoop = Readonly<{ currentFrame: number; appliedFrame: number }>;
export const createHomeCursorLoop = (): HomeCursorLoop => Object.freeze({ currentFrame: 0, appliedFrame: 0 });

/** Submit before float32 step 1; the looping endpoint 60 is not submitted.
 * Integer phases repeat exactly after 60 updates, so long ordinary batches need
 * only their last submission. Fractional source fixtures retain scalar stepping.
 */
export function advanceHomeCursorLoop(state: HomeCursorLoop, updates: number, eligible: boolean): HomeCursorLoop {
 if (!Number.isSafeInteger(updates) || updates < 0) throw new RangeError('Invalid HOME cursor update count');
 if (!eligible || updates === 0) return state;
 let currentFrame = state.currentFrame, appliedFrame = state.appliedFrame, remaining = updates;
 if (!Number.isFinite(currentFrame) || currentFrame < 0 || currentFrame >= 60) throw new RangeError('Invalid HOME cursor phase');
 if (Number.isInteger(currentFrame)) { currentFrame = (currentFrame + (updates - 1) % 60) % 60; remaining = 1; }
 for (let i = 0; i < remaining; i++) {
  appliedFrame = currentFrame;
  currentFrame = Math.fround(currentFrame + 1);
  if (currentFrame >= 60) currentFrame = Math.fround(currentFrame - 60);
 }
 return currentFrame === state.currentFrame && appliedFrame === state.appliedFrame ? state : Object.freeze({ currentFrame, appliedFrame });
}

/** Sampling and accessibility/capture paints never advance the native clock. */
export function getHomeCursorLoopFrame(state: MenuState, reducedMotion = false): number {
 return reducedMotion ? 0 : state.system?.homeCursorLoop?.appliedFrame ?? 0;
}
