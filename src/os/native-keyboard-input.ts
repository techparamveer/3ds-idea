/** Ordinary English page0 Settings nickname input. One call is one native
 * widget/manager update, never a browser frame or a duration in milliseconds.
 * Hit testing, controller completion and plain-text edits are external owners.
 */
export type NativeNicknameKey =
  | Readonly<{ kind: 'character'; unit: number }>
  | Readonly<{ kind: 'space' }>
  | Readonly<{ kind: 'backspace' }>;
export type NativeKeyboardWidgetState = Readonly<{
  phase: 0 | 1 | 2 | 3 | 5;
  capture: boolean;
  heldCount: number;
  repeatStage: 0 | 1;
  stageCount: number;
  stopRepeat: boolean;
}>;
export type NativeKeyboardTouch = Readonly<{
  held: boolean;
  previous: boolean;
  inside: boolean;
  enabled: boolean;
  /** Global capture latch after the manager scan and preceding widgets. */
  blocked: boolean;
  /** Result of the native release-controller completion query. */
  finished: boolean;
  disablePending: boolean;
}>;
export type NativeKeyboardWidgetEffect =
  | Readonly<{ type: 'callback'; kind: 1; payload: number }>
  | Readonly<{ type: 'animation'; index: 0 | 1 | 2 | 4 }>;
export type NativeKeyboardTextEffect =
  | Readonly<{ type: 'set-cursor'; index: number; resetColumn: true; collapse: boolean }>
  | Readonly<{ type: 'reveal-line'; line: number }>
  | Readonly<{ type: 'collapse-selection' }>;

export function createNativeKeyboardWidget(): NativeKeyboardWidgetState {
  return Object.freeze({ phase: 0, capture: false, heldCount: 0, repeatStage: 0, stageCount: 0, stopRepeat: false });
}

/** 17de3c/17deb0 character and 182eec/182f74 repeat-widget handlers.
 * State5 is disabled; phase4 enable transitions remain with the controller owner.
 * Caller dispatches effects in order and feeds model acceptance back below.
 */
export function updateNativeNicknameKey(
  previous: NativeKeyboardWidgetState, key: NativeNicknameKey, input: NativeKeyboardTouch,
): Readonly<{ state: NativeKeyboardWidgetState; effects: readonly NativeKeyboardWidgetEffect[] }> {
  const state = { ...previous }, effects: NativeKeyboardWidgetEffect[] = [];
  const animation = (index: 0 | 1 | 2 | 4) => effects.push(Object.freeze({ type: 'animation', index }));
  const callback = (payload: number) => effects.push(Object.freeze({ type: 'callback', kind: 1, payload }));
  const repeating = key.kind !== 'character';
  if (input.enabled && (!input.blocked || state.capture)) {
    switch (state.phase) {
      case 0:
        state.capture = false;
        if (input.held && !input.previous && input.inside) {
          if (repeating) {
            state.stopRepeat = false;
            callback(0); // Repeat widgets accept before starting pressed animation.
            state.heldCount = state.stageCount = 0;
            state.repeatStage = 0;
          }
          animation(0);
          state.capture = true;
          state.phase = 1;
          if (!repeating) callback(0);
        }
        break;
      case 1:
        if (!repeating) {
          if (!input.held || !input.inside) { animation(2); state.phase = 2; }
        } else if (!input.held) {
          animation(1);
          state.phase = 0;
        } else if (!input.inside) {
          state.heldCount = state.stageCount = 0;
          state.repeatStage = 0;
          animation(1);
          state.phase = 3;
        } else if (!state.stopRepeat) {
          state.heldCount = (state.heldCount + 1) >>> 0;
          const interval = key.kind === 'space' ? 8 : state.repeatStage === 0 ? 5 : 2;
          if ((state.heldCount | 0) >= 40 && (state.heldCount - 40) % interval === 0) {
            callback(state.repeatStage + 1);
            state.heldCount = 40;
            if (key.kind === 'backspace' && state.repeatStage === 0 && ++state.stageCount >= 31) {
              state.repeatStage = 1;
              state.stageCount = 0;
            }
          }
        }
        break;
      case 2:
        if (input.disablePending) {
          animation(4);
          state.phase = 5;
          state.capture = false;
        } else if (input.finished) state.phase = 0;
        break;
      case 3:
        if (!input.held) state.phase = 0;
        else if (input.inside) { animation(0); state.phase = 1; }
        break;
    }
  }
  return Object.freeze({ state: Object.freeze(state), effects: Object.freeze(effects) });
}

/** 1401a0: a rejected repeat-key edit latches +258, including a failed initial
 * press. Leaving/re-entering does not clear it; the next rising press does.
 * Call only for that widget's emitted accepted-input callback, after the model.
 */
export function applyNativeNicknameEditResult(
  state: NativeKeyboardWidgetState, key: NativeNicknameKey, accepted: boolean,
): NativeKeyboardWidgetState {
  return Object.freeze({ ...state, stopRepeat: state.stopRepeat || (key.kind !== 'character' && !accepted) });
}

/** The ordinary 17f774 consumer handles kind1 only. Digital producer events do
 * not supply keyboard focus, cursor motion or activation in this source path.
 * The caller resolves widget identity and the current resource UTF-16 unit.
 */
export function routeNativeNicknameKey(
  key: NativeNicknameKey, event: Readonly<{ kind: number; payload: number }>,
): readonly Readonly<{ type: 'insert'; unit: number } | { type: 'backspace' }>[] {
  if (event.kind !== 1) return Object.freeze([]);
  if (key.kind === 'backspace') return Object.freeze([Object.freeze({ type: 'backspace' })]);
  const unit = key.kind === 'space' ? 0x20 : key.unit;
  if (!Number.isInteger(unit) || unit < 0x20 || unit > 0xffff) throw new RangeError('Expected an ordinary nickname UTF-16 unit');
  return Object.freeze([Object.freeze({ type: 'insert', unit })]);
}

/** 184774/1848e8, with the original point-to-caret/line query resolved by caller.
 * This emits plain model operations; it does not clamp indices, select text,
 * resolve glyph geometry or implement the native offscreen autoscroll branch.
 */
export function updateNativeNicknameTextTouch(
  previous: NativeKeyboardWidgetState,
  input: NativeKeyboardTouch & Readonly<{ caret: number; line: number; selectionCollapsed: boolean }>,
): Readonly<{ state: NativeKeyboardWidgetState; effects: readonly (NativeKeyboardWidgetEffect | NativeKeyboardTextEffect)[] }> {
  const state = { ...previous }, effects: (NativeKeyboardWidgetEffect | NativeKeyboardTextEffect)[] = [];
  const move = (collapse: boolean) => {
    effects.push(Object.freeze({ type: 'set-cursor', index: input.caret, resetColumn: true, collapse }));
    effects.push(Object.freeze({ type: 'reveal-line', line: input.line }));
  };
  if (input.enabled && (!input.blocked || state.capture)) {
    switch (state.phase) {
      case 0:
        state.capture = false;
        if (input.held && !input.previous && input.inside) {
          move(true);
          state.capture = true;
          state.phase = 1;
          effects.push(Object.freeze({ type: 'callback', kind: 1, payload: 0 }));
        }
        break;
      case 1:
        if (input.held) {
          move(false); // Captured drag continues beyond the original hit bound.
          effects.push(Object.freeze({ type: 'callback', kind: 1, payload: 1 }));
        } else {
          if (input.selectionCollapsed) effects.push(Object.freeze({ type: 'collapse-selection' }));
          state.phase = 2;
        }
        break;
      case 2:
        if (input.disablePending) {
          effects.push(Object.freeze({ type: 'animation', index: 4 }));
          state.phase = 5;
          state.capture = false;
        } else if (input.finished) state.phase = 0;
        break;
    }
  }
  return Object.freeze({ state: Object.freeze(state), effects: Object.freeze(effects) });
}

export type NativeKeyboardDigitalState = Readonly<{
  repeatCandidate: number; repeatCounter: number; previousCapture: boolean;
}>;
export type NativeKeyboardDigitalEvent = Readonly<{ type: 4 | 5 | 6 | 7; mask: number }>;
export type NativeKeyboardDigitalSample = Readonly<{
  held: number; pressed: number; released: number;
  touch: boolean;
  /** Manager scan OR any new widget capture in the same pass. */
  capture: boolean;
  hostFlags: number; inhibit: number; readyA: boolean; readyB: boolean;
}>;
export const NATIVE_KEYBOARD_REPEAT_MASK = 0x00f0;
export function createNativeKeyboardDigital(): NativeKeyboardDigitalState {
  return Object.freeze({ repeatCandidate: 0, repeatCounter: 0, previousCapture: false });
}

/** 102a88's digital portion, after eligible widget updates. Gate results must
 * also govern whether the host runs widgets. Unlike HOME's producer, touch
 * alone preserves the repeat candidate and emits no synthetic release.
 */
export function pollNativeKeyboardDigital(
  previous: NativeKeyboardDigitalState, input: NativeKeyboardDigitalSample,
): Readonly<{ state: NativeKeyboardDigitalState; events: readonly NativeKeyboardDigitalEvent[] }> {
  let { repeatCandidate, repeatCounter, previousCapture } = previous;
  const events: NativeKeyboardDigitalEvent[] = [];
  const emit = (type: NativeKeyboardDigitalEvent['type'], mask: number) => events.push(Object.freeze({ type, mask }));
  const finish = () => Object.freeze({ state: Object.freeze({ repeatCandidate, repeatCounter, previousCapture }), events: Object.freeze(events) });
  if (input.hostFlags & 0x107) return finish();
  if (input.inhibit || !input.readyA || !input.readyB) { repeatCandidate = 0; return finish(); }
  if (!input.capture && !input.touch) {
    if (input.pressed) {
      emit(4, input.pressed);
      repeatCandidate = input.pressed;
      repeatCounter = 0;
    } else {
      const candidate = input.held & NATIVE_KEYBOARD_REPEAT_MASK;
      if (candidate && candidate === repeatCandidate) {
        repeatCounter = (repeatCounter + 1) >>> 0;
        if ((repeatCounter | 0) >= 20 && repeatCounter % 5 === 0) emit(6, candidate);
      }
      repeatCandidate = candidate;
    }
    if (input.held) emit(5, input.held);
    if (input.released) emit(7, input.released);
  }
  if (input.capture && !previousCapture) emit(7, 0x0fff);
  previousCapture = input.capture;
  return finish();
}
