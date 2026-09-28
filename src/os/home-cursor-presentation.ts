import type { HomeCursorEffectTarget, HomeScrollObservation } from './home-scroll-consumer.ts';

export type HomeCursorCenter = Readonly<{ x: number; y: number }>;
export type HomeCursorScale = Readonly<{ currentFrame: number; appliedFrame: number }>;
export type HomeCursorDisAppear = HomeCursorScale & Readonly<{ status: 0 | 1 | 2 }>;
export type HomeCursorEffect = Readonly<{
  visible: boolean;
  context: number | null;
  target: HomeCursorEffectTarget | null;
  center: HomeCursorCenter;
  scale: HomeCursorScale;
  disappear: HomeCursorDisAppear;
}>;
export type HomeCursorPresentation = Readonly<{
  primaryScale: HomeCursorScale;
  effects: readonly [HomeCursorEffect, HomeCursorEffect];
  nextEffectIndex: 0 | 1;
}>;
export type HomeCursorLayoutEligibility = Readonly<{
  /** Host/global wrapper opportunity, distinct from inner layout status+5c. */
  primaryWrapperEligible: boolean;
  effectWrapperEligible: readonly [boolean, boolean];
  primaryControllersInhibited?: boolean;
  effectControllersInhibited?: readonly [boolean, boolean];
}>;
export type HomeCursorEffectGeometry = Readonly<{
  mode: number;
  context: number | null;
  scrollPixels: number;
  /** Current unscrolled LCD coordinates, indexed by native slot. */
  slots: readonly HomeCursorCenter[];
}>;
export type HomeCursorPositionResult = Readonly<{
  state: HomeCursorPresentation;
  /** The host must resolve a context replacement; no cross-context mapping is inferred. */
  unmatchedEffectIndices: readonly (0 | 1)[];
}>;

const center = (x: number, y: number): HomeCursorCenter => Object.freeze({ x, y });
const pair = (a: HomeCursorEffect, b: HomeCursorEffect): readonly [HomeCursorEffect, HomeCursorEffect] => Object.freeze([a, b]);
const anchors = Object.freeze([
  ['N_CPos_Lgt_00', 26, 16, 10], ['N_CPos_Memo_00', 76, 16.5, 11],
  ['N_CPos_Frd_00', 118, 16.5, 11], ['N_CPos_News_00', 160, 16.5, 11],
  ['N_CPos_Web_00', 202, 16.5, 11], ['N_CPos_Mvs_00', 244, 16.5, 11],
  ['N_CPos_Dw_00', 281, 16, 12], ['N_CPos_Up_00', 307, 16, 12],
].map(row => Object.freeze({ pane: row[0] as string, center: center(row[1] as number, row[2] as number), scaleFrame: row[3] as number })));

/** Original LncBase_D_01 named-pane centers converted to the320x240 LCD. */
export function getHomeToolbarCursorAnchor(focus: number) {
  if (!Number.isInteger(focus) || focus < 0 || focus > 7) throw new RangeError('Invalid HOME toolbar cursor focus');
  return anchors[focus];
}
function scaleFrame(value: number): number {
  if (typeof value !== 'number') throw new TypeError('Invalid HOME cursor Scale frame');
  const frame = Math.fround(value);
  if (!Number.isFinite(frame) || frame < 0 || frame >= 16) throw new RangeError('Invalid HOME cursor Scale frame');
  return frame;
}
function context(value: number | null): void {
  if (value !== null && (!Number.isSafeInteger(value) || value < 0)) throw new RangeError('Invalid HOME cursor context');
}
function finite(value: number): void {
  if (!Number.isFinite(value)) throw new RangeError('Invalid HOME cursor coordinate');
}
function emptyEffect(): HomeCursorEffect {
  return Object.freeze({ visible: false, context: null, target: null, center: center(0, 0),
    scale: Object.freeze({ currentFrame: 0, appliedFrame: 0 }),
    disappear: Object.freeze({ currentFrame: 0, appliedFrame: 0, status: 0 }) });
}
/** Initial applied poses are an explicit adapter policy: primary=current,
 * hidden effects=0. The source fixture's -999 sentinel is not a native pose.
 */
export function createHomeCursorPresentation(initialPrimaryScale: number): HomeCursorPresentation {
  const frame = scaleFrame(initialPrimaryScale);
  return Object.freeze({ primaryScale: Object.freeze({ currentFrame: frame, appliedFrame: frame }),
    effects: pair(emptyEffect(), emptyEffect()), nextEffectIndex: 0 });
}

/** Apply one already-ordered observation at its own host boundary. Offsets do
 * not advance clocks here; unrelated navigation/audio observations are inert.
 */
export function consumeHomeCursorObservation(state: HomeCursorPresentation, observation: HomeScrollObservation): HomeCursorPresentation {
  if (observation.kind === 'scale-seek') {
    const frame = scaleFrame(observation.frame);
    return state.primaryScale.currentFrame === frame ? state : Object.freeze({ ...state,
      primaryScale: Object.freeze({ ...state.primaryScale, currentFrame: frame }) });
  }
  if (observation.kind !== 'cursor-select') return state;
  context(observation.context);
  const supplied = observation.effectTarget;
  let target: HomeCursorEffectTarget, position: HomeCursorCenter;
  if (supplied.kind === 'toolbar') {
    const anchor = getHomeToolbarCursorAnchor(supplied.focus);
    if (supplied.scaleFrame !== anchor.scaleFrame) throw new RangeError('Invalid HOME toolbar effect Scale');
    target = Object.freeze({ kind: 'toolbar', focus: supplied.focus, scaleFrame: anchor.scaleFrame });
    position = anchor.center;
  } else if (supplied.kind === 'grid') {
    if (!Number.isSafeInteger(supplied.slot) || supplied.slot < 0) throw new RangeError('Invalid HOME cursor effect slot');
    if (!Number.isInteger(supplied.scaleFrame) || supplied.scaleFrame < 0 || supplied.scaleFrame > 5) throw new RangeError('Invalid HOME grid effect Scale');
    for (const value of [supplied.anchor.x, supplied.anchor.y, supplied.anchor.scrollPixels]) finite(value);
    target = Object.freeze({ kind: 'grid', slot: supplied.slot, scaleFrame: supplied.scaleFrame,
      anchor: Object.freeze({ ...supplied.anchor }) });
    position = center(supplied.anchor.x - supplied.anchor.scrollPixels, supplied.anchor.y);
    finite(position.x);
  } else throw new RangeError('Invalid HOME cursor effect target');
  const index = state.nextEffectIndex, previous = state.effects[index];
  const effect: HomeCursorEffect = Object.freeze({ visible: true, context: observation.context, target, center: position,
    scale: Object.freeze({ ...previous.scale, currentFrame: target.scaleFrame }),
    disappear: Object.freeze({ ...previous.disappear, currentFrame: 0, status: 1 }) });
  return Object.freeze({ ...state, nextEffectIndex: index === 0 ? 1 : 0,
    effects: index === 0 ? pair(effect, state.effects[1]) : pair(state.effects[0], effect) });
}

const submitScale = (scale: HomeCursorScale): HomeCursorScale => scale.appliedFrame === scale.currentFrame
  ? scale : Object.freeze({ ...scale, appliedFrame: scale.currentFrame });

function advanceEffect(effect: HomeCursorEffect, updates: number, wrapperEligible: boolean, controllersInhibited: boolean): HomeCursorEffect {
  // The global list filters hidden layouts before invoking their wrapper.
  if (!wrapperEligible || !effect.visible || updates === 0) return effect;
  const before = effect.disappear;
  if (before.status === 2) {
    // Wrapper hide precedes the base layout's status+5c==2 controller gate.
    return Object.freeze({ ...effect, visible: false,
      scale: controllersInhibited ? effect.scale : submitScale(effect.scale),
      disappear: controllersInhibited ? before : Object.freeze({ ...before, status: 0 }) });
  }
  if (controllersInhibited) return effect;
  const scale = submitScale(effect.scale);
  if (before.status === 0) return scale === effect.scale ? effect : Object.freeze({ ...effect, scale });
  const untilTerminalSubmission = 21 - before.currentFrame;
  const terminal = updates >= untilTerminalSubmission;
  const disappear: HomeCursorDisAppear = Object.freeze(terminal
    ? { currentFrame: 20, appliedFrame: 20, status: updates === untilTerminalSubmission ? 2 : 0 }
    : { currentFrame: before.currentFrame + updates, appliedFrame: before.currentFrame + updates - 1, status: 1 });
  return Object.freeze({ ...effect, scale, disappear, visible: updates <= untilTerminalSubmission });
}
function eligibility(input: HomeCursorLayoutEligibility): void {
  if (input.primaryControllersInhibited !== undefined && typeof input.primaryControllersInhibited !== 'boolean') {
    throw new TypeError('Invalid HOME primary controller inhibition');
  }
  if (input.effectControllersInhibited !== undefined && !Array.isArray(input.effectControllersInhibited)) {
    throw new TypeError('Invalid HOME effect controller inhibition');
  }
  if (input.effectWrapperEligible.length !== 2 || (input.effectControllersInhibited && input.effectControllersInhibited.length !== 2)) {
    throw new RangeError('HOME cursor eligibility requires two effects');
  }
  for (const value of [input.primaryWrapperEligible, ...input.effectWrapperEligible,
    input.primaryControllersInhibited ?? false, ...(input.effectControllersInhibited ?? [false, false])]) {
    if (typeof value !== 'boolean') throw new TypeError('Invalid HOME cursor update eligibility');
  }
}
/** Counts eligible layout opportunities, never elapsed wall time. Primary
 * visibility and scene lifecycle are supplied by the host, not inferred here.
 */
export function advanceHomeCursorPresentation(state: HomeCursorPresentation, updates: number,
  input: HomeCursorLayoutEligibility): HomeCursorPresentation {
  if (!Number.isSafeInteger(updates) || updates < 0) throw new RangeError('Invalid HOME cursor layout update count');
  eligibility(input);
  if (updates === 0) return state;
  const primaryScale = input.primaryWrapperEligible && !input.primaryControllersInhibited ? submitScale(state.primaryScale) : state.primaryScale;
  const first = advanceEffect(state.effects[0], updates, input.effectWrapperEligible[0], input.effectControllersInhibited?.[0] ?? false);
  const second = advanceEffect(state.effects[1], updates, input.effectWrapperEligible[1], input.effectControllersInhibited?.[1] ?? false);
  return primaryScale === state.primaryScale && first === state.effects[0] && second === state.effects[1] ? state
    : Object.freeze({ ...state, primaryScale, effects: pair(first, second) });
}

/** Only the proved mode3 follow route. No controller seeks or updates occur. */
export function updateHomeCursorEffectPositions(state: HomeCursorPresentation, geometry: HomeCursorEffectGeometry): HomeCursorPositionResult {
  const unmatchedEffectIndices: (0 | 1)[] = [];
  const done = (next: HomeCursorPresentation): HomeCursorPositionResult => Object.freeze({ state: next,
    unmatchedEffectIndices: Object.freeze(unmatchedEffectIndices) });
  if (geometry.mode !== 3) return done(state);
  context(geometry.context); finite(geometry.scrollPixels);
  const follow = (effect: HomeCursorEffect, index: 0 | 1): HomeCursorEffect => {
    if (!effect.visible || effect.target?.kind !== 'grid') return effect;
    if (effect.context !== geometry.context) { unmatchedEffectIndices.push(index); return effect; }
    const point = geometry.slots[effect.target.slot];
    if (!point) throw new RangeError('Missing HOME cursor effect slot geometry');
    finite(point.x); finite(point.y);
    const x = point.x - geometry.scrollPixels; finite(x);
    return x === effect.center.x && point.y === effect.center.y ? effect
      : Object.freeze({ ...effect, center: center(x, point.y) });
  };
  const first = follow(state.effects[0], 0), second = follow(state.effects[1], 1);
  return done(first === state.effects[0] && second === state.effects[1] ? state
    : Object.freeze({ ...state, effects: pair(first, second) }));
}

/** Painting samples retained applied poses. It does not submit or advance. */
export const sampleHomeCursorPresentation = (state: HomeCursorPresentation): HomeCursorPresentation => state;
