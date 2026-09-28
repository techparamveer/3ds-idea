import { getHomeToolbarCursorAnchor, type HomeCursorCenter } from './home-cursor-presentation.ts';

export type HomePrimaryCursorRequest = 0 | 1 | 2;
export type HomePrimaryCursor = Readonly<{
  request: HomePrimaryCursorRequest;
  shown: boolean;
  layoutVisible: boolean;
  center: HomeCursorCenter;
}>;
export type HomePrimaryCursorFooterInput = Readonly<{
  /** Presence of the two source overlay pointers at this footer boundary. */
  overlayActive: boolean;
  secondaryOverlayActive: boolean;
  mode: number;
  position: Readonly<{ kind: 'toolbar'; focus: number }>
    | Readonly<{ kind: 'grid'; selectedCenter: HomeCursorCenter }>;
}>;
export type HomePrimaryCursorFooterResult = Readonly<{
  state: HomePrimaryCursor;
  /** Executed helper branch, even when its center is numerically unchanged. */
  positionRoute: 'grid' | 'toolbar' | 'mode3-effects' | null;
  /** Native layout-visibility write, not a comparison of old/new actual flags. */
  visibilityWrite: boolean | null;
}>;

function request(value: HomePrimaryCursorRequest): void {
  if (value !== 0 && value !== 1 && value !== 2) throw new RangeError('Invalid HOME primary cursor request');
}
function flag(value: boolean): void {
  if (typeof value !== 'boolean') throw new TypeError('Invalid HOME primary cursor flag');
}
function copyCenter(value: HomeCursorCenter): HomeCursorCenter {
  if (!Number.isFinite(value.x) || !Number.isFinite(value.y)) throw new RangeError('Invalid HOME primary cursor center');
  return Object.freeze({ x: value.x, y: value.y });
}
/** Explicit supplied mature state: no source-native initialization is inferred. */
export function createHomePrimaryCursor(initial: HomePrimaryCursor): HomePrimaryCursor {
  request(initial.request); flag(initial.shown); flag(initial.layoutVisible);
  return Object.freeze({ request: initial.request, shown: initial.shown, layoutVisible: initial.layoutVisible,
    center: copyCenter(initial.center) });
}
/** A request changes neither visibility nor position and has no clock effect. */
export function setHomePrimaryCursorRequest(state: HomePrimaryCursor, next: HomePrimaryCursorRequest): HomePrimaryCursor {
  request(next);
  return next === state.request ? state : Object.freeze({ ...state, request: next });
}

/** Run once at the common lower footer, after completion and pending replay.
 * Supplied grid coordinates are already current native LCD geometry. This
 * reducer neither interpolates/culls them nor advances any animation.
 */
export function updateHomePrimaryCursorFooter(state: HomePrimaryCursor,
  input: HomePrimaryCursorFooterInput): HomePrimaryCursorFooterResult {
  flag(input.overlayActive); flag(input.secondaryOverlayActive);
  if (!Number.isInteger(input.mode) || input.mode < 0 || input.mode > 255) throw new RangeError('Invalid HOME cursor footer mode');
  let positionRoute: HomePrimaryCursorFooterResult['positionRoute'] = null;
  let visibilityWrite: boolean | null = null;
  const done = (): HomePrimaryCursorFooterResult => Object.freeze({ state, positionRoute, visibilityWrite });
  if (input.overlayActive || input.secondaryOverlayActive || input.mode === 185 || input.mode === 186) return done();

  if (state.request === 2) {
    if (state.shown) {
      state = Object.freeze({ ...state, shown: false, layoutVisible: false });
      visibilityWrite = false;
    }
    return done();
  }
  if (!state.shown) {
    state = Object.freeze({ ...state, shown: true, layoutVisible: true });
    visibilityWrite = true;
  }
  if (state.request === 1) return done();

  // The native helper tests toolbar focus before the ordinary grid mode3 path.
  let nextCenter: HomeCursorCenter;
  if (input.position.kind === 'toolbar') {
    positionRoute = 'toolbar'; nextCenter = getHomeToolbarCursorAnchor(input.position.focus).center;
  } else if (input.position.kind === 'grid') {
    if (input.mode === 3) { positionRoute = 'mode3-effects'; return done(); }
    positionRoute = 'grid'; nextCenter = copyCenter(input.position.selectedCenter);
  } else throw new RangeError('Invalid HOME primary cursor position route');
  if (nextCenter.x !== state.center.x || nextCenter.y !== state.center.y) state = Object.freeze({ ...state, center: nextCenter });
  return done();
}

/** Repeated read-only samples cannot accumulate hidden time. */
export const sampleHomePrimaryCursor = (state: HomePrimaryCursor): HomePrimaryCursor => state;
