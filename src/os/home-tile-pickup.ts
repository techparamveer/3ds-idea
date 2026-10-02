import type { HomeLocation } from './home-layout.ts';

type Point = Readonly<{ x: number; y: number }>;
type Scale = Readonly<{ currentFrame: number; appliedFrame: number | null }>;
/** The stationary ordinary mode14 entry, with supplied content and anchor.
 * Movement/drop/folder-icon modes have separate, as-yet-untraced owners. */
export type HomeTilePickup = Readonly<{
  source: Readonly<HomeLocation>;
  center: Point;
  blankCenter: Point;
  anchor: Point;
  scale: Scale;
  blankScale: Scale;
  priority: 375;
  rootScale: 1;
}>;

const point = (p: Point): Point => {
  if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) throw new RangeError('Invalid HOME pickup position');
  return Object.freeze({ x: Math.fround(p.x), y: Math.fround(p.y) });
};

/** Own-PNG fitted pointer-to-pickup lifts. Only source folder Scale1 and
 * restored-root Scale5 have matched held captures; all other frames retain the
 * preceding zero-anchor adaptation rather than inventing interpolation. */
export function fittedHomePickupAnchor(density: number): Point {
  if (!Number.isFinite(density) || density < 0 || density > 5) throw new RangeError('Invalid HOME pickup density');
  return point({ x: 0, y: density === 1 ? -14 : density === 5 ? -5.25 : 0 });
}

/** Native mode5 starts/seeks now; neither layout has submitted Scale yet.
 * Anchor is deliberately required: browser callers must name their supplied
 * measured or gap policy instead of deriving it in presentation. */
export function createHomeTilePickup(source: HomeLocation, density: number, blankCenter: Point,
  touch: Point, anchor: Point): HomeTilePickup {
  if (!Number.isInteger(source.slot) || source.slot < 0
    || source.folder !== null && (!Number.isInteger(source.folder) || source.folder < 0)) throw new RangeError('Invalid HOME pickup source');
  if (!Number.isFinite(density) || density < 0 || density > 5) throw new RangeError('Invalid HOME pickup density');
  const offset = point(anchor), currentFrame = Math.fround(density);
  const scale = (): Scale => Object.freeze({ currentFrame, appliedFrame: null });
  return Object.freeze({ source: Object.freeze({ ...source }), anchor: offset,
    center: point({ x: Math.fround(touch.x) + offset.x, y: Math.fround(touch.y) + offset.y }),
    blankCenter: point(blankCenter), scale: scale(), blankScale: scale(), priority: 375, rootScale: 1 });
}

/** Position writer in the grid footer. These are renderer LCD coordinates;
 * the source-native Y conversion belongs to the supplying input adapter. */
export function positionHomeTilePickup(state: HomeTilePickup, touch: Point): HomeTilePickup {
  const center = point({ x: Math.fround(touch.x) + state.anchor.x, y: Math.fround(touch.y) + state.anchor.y });
  return center.x === state.center.x && center.y === state.center.y ? state : Object.freeze({ ...state, center });
}

/** Rebind the moving pickup to a destination grid while retaining the source
 * placeholder's geometry. A context boundary has already submitted this Scale,
 * so the first destination paint must not expose the departed container frame. */
export function retargetHomeTilePickup(state: HomeTilePickup, density: number, touch: Point,
  anchor: Point): HomeTilePickup {
  if (!Number.isFinite(density) || density < 0 || density > 5) throw new RangeError('Invalid HOME pickup density');
  const currentFrame = Math.fround(density), offset = point(anchor);
  const center = point({ x: Math.fround(touch.x) + offset.x, y: Math.fround(touch.y) + offset.y });
  if (state.scale.currentFrame === currentFrame && state.scale.appliedFrame === currentFrame
    && state.anchor.x === offset.x && state.anchor.y === offset.y
    && state.center.x === center.x && state.center.y === center.y) return state;
  return Object.freeze({ ...state, anchor: offset, center,
    scale: Object.freeze({ currentFrame, appliedFrame: currentFrame }) });
}

/** Mode5 submits the seek frame on each eligible layout pass, without advancing. */
export function advanceHomeTilePickup2D(state: HomeTilePickup): HomeTilePickup {
  if (state.scale.appliedFrame === state.scale.currentFrame && state.blankScale.appliedFrame === state.blankScale.currentFrame) return state;
  return Object.freeze({ ...state, scale: Object.freeze({ ...state.scale, appliedFrame: state.scale.currentFrame }),
    blankScale: Object.freeze({ ...state.blankScale, appliedFrame: state.blankScale.currentFrame }) });
}
