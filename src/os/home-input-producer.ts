/** Pure EUR HOME input producer (0x1039d0), before scene/navigation consumers.
 * Masks already combine independently derived digital and primary-axis edges.
 * Polls are explicit calls, not elapsed time or display frames.
 */
export type HomeKeyEvent = Readonly<{ type: 4 | 5 | 6 | 7; mask: number }>;
export type HomeInputProducer = Readonly<{
  repeatCandidate: number;
  /** Native uint32 storage; the repeat threshold comparison is signed. */
  repeatCounter: number;
  previousCapture: boolean;
}>;
export type HomeInputPoll = Readonly<{
  held: number;
  pressed: number;
  released: number;
  touchActive: boolean;
  /** Aggregate capture byte from the native handler-list scan. */
  captureActive: boolean;
  hostFlags: number;
  /** Native G+0x14. Its wider service/lifecycle meaning remains unassigned. */
  gateWord14: number;
  /** Explicit results of the two native readiness calls, in address order. */
  readiness10dc20: boolean;
  readiness10cd20: boolean;
}>;
export type HomeInputPollResult = Readonly<{
  state: HomeInputProducer;
  events: readonly HomeKeyEvent[];
}>;
export const HOME_INPUT_REPEAT_MASK = 0xc0f0;
export const HOME_INPUT_INITIAL_REPEAT_POLLS = 20;
export const HOME_INPUT_REPEAT_INTERVAL_POLLS = 5;

export function createHomeInputProducer(): HomeInputProducer {
  return Object.freeze({ repeatCandidate: 0, repeatCounter: 0, previousCapture: false });
}

function unsigned(value: number, maximum: number, name: string): void {
  if (!Number.isInteger(value) || value < 0 || value > maximum) throw new RangeError(`Invalid HOME input ${name}`);
}
function boolean(value: boolean, name: string): void {
  if (typeof value !== 'boolean') throw new TypeError(`Invalid HOME input ${name}`);
}

/** One producer call, with source branch order preserved. Skipped calls do not
 * synthesize release. Capture/touch suppress ordinary key notifications; their
 * event7 output is an observation only, never a cursor or navigation mutation.
 * The separately gated additional-axis channel is outside this boundary.
 */
export function pollHomeInput(state: HomeInputProducer, input: HomeInputPoll): HomeInputPollResult {
  unsigned(state.repeatCandidate, 0xffff, 'repeat candidate');
  unsigned(state.repeatCounter, 0xffffffff, 'repeat counter');
  boolean(state.previousCapture, 'previous capture');
  unsigned(input.held, 0xffff, 'held mask');
  unsigned(input.pressed, 0xffff, 'pressed mask');
  unsigned(input.released, 0xffff, 'released mask');
  unsigned(input.hostFlags, 0xffffffff, 'host flags');
  unsigned(input.gateWord14, 0xffffffff, 'gate word');
  boolean(input.touchActive, 'touch flag');
  boolean(input.captureActive, 'capture flag');
  boolean(input.readiness10dc20, 'readiness10dc20');
  boolean(input.readiness10cd20, 'readiness10cd20');

  let { repeatCandidate, repeatCounter, previousCapture } = state;
  const events: HomeKeyEvent[] = [];
  const emit = (type: HomeKeyEvent['type'], mask: number) => events.push(Object.freeze({ type, mask }));
  const finish = (): HomeInputPollResult => Object.freeze({
    state: Object.freeze({ repeatCandidate, repeatCounter, previousCapture }),
    events: Object.freeze(events),
  });

  // 0x103a20 precedes G+0x14 and both readiness queries.
  if (input.hostFlags & 0x107) return finish();
  if (input.gateWord14 !== 0 || !input.readiness10dc20 || !input.readiness10cd20) {
    repeatCandidate = 0;
    return finish();
  }
  if (input.touchActive || input.captureActive) {
    if (input.touchActive && repeatCandidate !== 0) {
      emit(7, repeatCandidate);
      repeatCandidate = 0;
    }
    if (input.captureActive && !previousCapture) emit(7, 0xcfff);
    previousCapture = input.captureActive;
    return finish();
  }

  if (input.pressed !== 0) {
    emit(4, input.pressed);
    repeatCandidate = input.pressed;
    repeatCounter = 0;
  } else {
    const candidate = input.held & HOME_INPUT_REPEAT_MASK;
    if (candidate !== 0 && candidate === repeatCandidate) {
      repeatCounter = (repeatCounter + 1) >>> 0;
      if ((repeatCounter | 0) >= HOME_INPUT_INITIAL_REPEAT_POLLS
        && repeatCounter % HOME_INPUT_REPEAT_INTERVAL_POLLS === 0) emit(6, candidate);
    }
    // A changed candidate does not clear the shared counter.
    repeatCandidate = candidate;
  }
  if (input.held !== 0) emit(5, input.held);
  if (input.released !== 0) emit(7, input.released);
  previousCapture = false;
  return finish();
}
