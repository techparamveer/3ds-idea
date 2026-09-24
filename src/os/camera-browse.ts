import type { JsonValue } from './app-types.ts';

/**
 * Source-replayed EUR Camera (0004001000022400) large-density browse strip.
 * Deliberately not imported by stock-apps, stock-native-camera or
 * stock-screen-layout: live gallery still jumps to floor(selection / 6).
 * Replayed by scripts/replay_camera_strip.py; see docs/camera-browse-strip-port.md.
 *
 * One `cameraBrowseUpdate` is one native application update (child slider
 * smoothing, then after-child key handling). Millisecond conversion is a
 * nominal 60 Hz test helper, not measured hardware cadence, and is not live.
 */
export type CameraDirection = 'left' | 'right' | 'up' | 'down';
/** Camera internal masks produced by 0x10e37c from the raw pad bits. */
export const CAMERA_DIRECTION_MASK: Readonly<Record<CameraDirection, number>> = { left: 0x100, right: 0x80, up: 0x200, down: 0x400 };
/** 0x347fc8 large density: 3×2 cells. PageRengeL stride 248. */
export const CAMERA_BROWSE_PER_PAGE = 6;
export const CAMERA_BROWSE_PAGE_WIDTH = 248;
/** 0x2d12a0: candidates and cursor use whole padded pages, not the real count. */
export const cameraBrowsePaddedCount = (count: number) => Math.ceil(Math.max(count, 1) / CAMERA_BROWSE_PER_PAGE) * CAMERA_BROWSE_PER_PAGE;
const COLUMNS = 3, PITCH = 76, MARGIN = 10;
/** 0x1fdb0c: output fraction and snap threshold (float32). */
const FRACTION = Math.fround(0.3), THRESHOLD = Math.fround(0.1);
/** 0x128508 key-manager defaults: first repeat after 20 updates, then every 4. */
const REPEAT_DELAY = 20, REPEAT_INTERVAL = 4;
/** Test/adapter conversion only. Same nominal 60 Hz as HOME; not hardware proof. */
export const CAMERA_BROWSE_UPDATE_MS = 1000 / 60;

export type CameraBrowse = {
  /** Scroll-model anchor; the model position is its lattice position (0x1fdd90). */
  anchor: number;
  /** LytSlider float output +0x4c; the drawn strip offset is its rounded value. */
  output: number;
  /** Held directions by input source (key manager +4 is their union). */
  held: Record<string, CameraDirection>;
  /** Key-manager repeat countdown (+0x18). */
  countdown: number;
  /** Elapsed time not yet consumed by a whole nominal update. */
  clockMs: number;
  /** BrowseThumbnail +0x448: selection committed, notification still owed. */
  pending: boolean;
  /** Selection last notified to the owner (0x1d photo / 0x1f folder / 0x22 blank). */
  preview: number;
  /**
   * Stylus-down gate from 0x2d5740: key handling is skipped. This is not
   * capture, ancestry, 12px drag or slider-history ownership.
   */
  touch: boolean;
};

export const cameraBrowseInitial = (): CameraBrowse => ({ anchor: 0, output: 0, held: {}, countdown: 0, clockMs: 0, pending: false, preview: 0, touch: false });

const finite = (value: JsonValue | undefined, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const directions = new Set<string>(['left', 'right', 'up', 'down']);
export function readCameraBrowse(value: JsonValue | undefined): CameraBrowse {
  const initial = cameraBrowseInitial();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return initial;
  const held: Record<string, CameraDirection> = {};
  const heldValue = value.held;
  if (heldValue && typeof heldValue === 'object' && !Array.isArray(heldValue))
    for (const [source, direction] of Object.entries(heldValue)) if (typeof direction === 'string' && directions.has(direction)) held[source] = direction as CameraDirection;
  return {
    anchor: Math.max(0, Math.floor(finite(value.anchor, 0))), output: Math.max(0, finite(value.output, 0)), held,
    countdown: Math.max(0, Math.floor(finite(value.countdown, 0))), clockMs: Math.max(0, finite(value.clockMs, 0)),
    pending: value.pending === true, preview: Math.max(0, Math.floor(finite(value.preview, 0))), touch: value.touch === true,
  };
}
export const cameraBrowseJson = (browse: CameraBrowse): JsonValue => ({ ...browse, held: { ...browse.held } });

const pageCount = (count: number) => cameraBrowsePaddedCount(count) / CAMERA_BROWSE_PER_PAGE;
/** 0x1fd910 configures anchors 0…(pages−1)×3; bounds [0,(pages−1)×248]. */
export const cameraMaxAnchor = (count: number) => (pageCount(count) - 1) * COLUMNS;
/** 0x1fdd90: anchor → model position, clamped to the configured bounds. */
export function cameraAnchorPosition(anchor: number, count: number): number {
  const a = Math.max(0, Math.min(cameraMaxAnchor(count), anchor)), column = a % COLUMNS;
  return Math.floor(a / COLUMNS) * CAMERA_BROWSE_PAGE_WIDTH + (column ? MARGIN + column * PITCH : 0);
}
/** 0x1fbd10: logical column floor(i/6)×3 + (i mod 6) mod 3. */
export const cameraLogicalColumn = (index: number) => Math.floor(index / CAMERA_BROWSE_PER_PAGE) * COLUMNS + (index % CAMERA_BROWSE_PER_PAGE) % COLUMNS;
/** 0x1fbd10: shift the anchor only far enough to show the selected column. */
export function cameraVisibleAnchor(index: number, anchor: number, count: number): number {
  const column = cameraLogicalColumn(index);
  const next = column < anchor ? column : column >= anchor + COLUMNS ? column - (COLUMNS - 1) : anchor;
  return Math.min(cameraMaxAnchor(count), next);
}
/**
 * 0x2ce810 → 0x2d1274: left, right, up, down priority. Left/right cross row and
 * page boundaries; up/down toggle the row in the same page column. Candidates
 * are bounded by whole padded pages, not the real item count.
 */
export function cameraKeyCandidate(index: number, mask: number, count: number): number | null {
  let candidate: number;
  if (mask & CAMERA_DIRECTION_MASK.left) candidate = (index - 1) & 0xffff;
  else if (mask & CAMERA_DIRECTION_MASK.right) candidate = (index + 1) & 0xffff;
  else if (mask & (CAMERA_DIRECTION_MASK.up | CAMERA_DIRECTION_MASK.down)) {
    const slot = index % CAMERA_BROWSE_PER_PAGE, lastRow = Math.floor(slot / COLUMNS) === CAMERA_BROWSE_PER_PAGE / COLUMNS - 1;
    const up = (mask & CAMERA_DIRECTION_MASK.up) !== 0;
    candidate = up ? (slot < COLUMNS ? index + CAMERA_BROWSE_PER_PAGE - COLUMNS : index - COLUMNS) : (lastRow ? index - (CAMERA_BROWSE_PER_PAGE - COLUMNS) : index + COLUMNS);
  } else return null;
  return candidate < cameraBrowsePaddedCount(count) ? candidate : null;
}
/** 0x26fd18: non-fused float32 step toward the model position, then snap. */
export function cameraSmoothStep(output: number, target: number): number {
  const delta = Math.fround(target - output);
  return Math.abs(delta) > THRESHOLD ? Math.fround(output + Math.fround(delta * FRACTION)) : Math.fround(target);
}
/** 0x26fd58: integer output = float + 0.5 converted toward zero. */
export const cameraStripOffset = (output: number) => Math.max(0, Math.trunc(Math.fround(output + 0.5)));

const heldMask = (browse: CameraBrowse) => Object.values(browse.held).reduce((mask, direction) => mask | CAMERA_DIRECTION_MASK[direction], 0);
export type CameraBrowseStep = { selection: number; browse: CameraBrowse };

/** One BrowseThumbnail key-handler pass (0x2ce810) with the supplied emission. */
function keyPass(step: CameraBrowseStep, emission: number, count: number): CameraBrowseStep {
  if (count <= 0) return step; // 0x2ce830: empty browse returns before candidates.
  let { selection, browse } = step;
  const candidate = cameraKeyCandidate(selection, emission, count);
  if (candidate !== null) {
    // 0x2d1274 commits every in-range candidate, marks +0x448 and runs the
    // visibility helper with the immediate (flag 1) model setter.
    selection = candidate;
    browse = { ...browse, pending: true, anchor: cameraVisibleAnchor(candidate, browse.anchor, count) };
  }
  // 0x2ce9b0: notify only on a pass where no direction is held.
  if (!heldMask(browse) && browse.pending) browse = { ...browse, pending: false, preview: selection };
  return { selection, browse };
}

/** A single-shot command (accessible control) is a press without a held key. */
export function cameraBrowseCommand(step: CameraBrowseStep, direction: CameraDirection, count: number): CameraBrowseStep {
  return step.browse.touch ? step : keyPass(step, CAMERA_DIRECTION_MASK[direction], count);
}

/**
 * Button phases from one source. A new direction is a press edge: it restarts
 * the shared 20-update delay and is handled at once, as the input phase of the
 * current update. Browser repeat events are ignored; repeats come from ticks.
 */
export function cameraBrowseButton(step: CameraBrowseStep, source: string, direction: CameraDirection, phase: 'down' | 'up' | 'repeat', count: number): CameraBrowseStep {
  const { browse } = step;
  if (phase === 'repeat') return step;
  if (phase === 'up') {
    if (browse.held[source] !== direction) return step;
    const held = { ...browse.held }; delete held[source];
    const next = { ...browse, held };
    return { ...step, browse: heldMask(next) ? next : { ...next, countdown: 0 } };
  }
  if (browse.held[source] === direction) return step;
  const wasHeld = (heldMask(browse) & CAMERA_DIRECTION_MASK[direction]) !== 0;
  const held = { ...browse.held, [source]: direction };
  const next: CameraBrowseStep = { ...step, browse: { ...browse, held, ...(wasHeld ? {} : { countdown: REPEAT_DELAY }) } };
  return wasHeld || browse.touch ? next : keyPass(next, CAMERA_DIRECTION_MASK[direction], count);
}

/** Native touch path skips keys while the stylus is down. Not capture/drag. */
export function cameraBrowseTouch(step: CameraBrowseStep, down: boolean): CameraBrowseStep {
  return step.browse.touch === down ? step : { ...step, browse: { ...step.browse, touch: down } };
}

/** Suspension, sleep and close drop held keys; a fresh press is required. */
export function cameraBrowseCancel(step: CameraBrowseStep): CameraBrowseStep {
  const { browse } = step;
  return !Object.keys(browse.held).length && !browse.countdown && !browse.touch ? step : { ...step, browse: { ...browse, held: {}, countdown: 0, touch: false } };
}

/** No further update can change the strip until new input arrives. While the
 * stylus is down, a pending notification waits for its release. */
const settled = (browse: CameraBrowse, count: number) => browse.output === cameraAnchorPosition(browse.anchor, count) && !heldMask(browse) && (browse.touch || !browse.pending);

/**
 * One native update: LytSlider smoothing (child pass), then the key manager's
 * repeat and the key handler (after-child input phase).
 */
export function cameraBrowseUpdate(step: CameraBrowseStep, count: number): CameraBrowseStep {
  let { selection, browse } = step;
  browse = { ...browse, output: cameraSmoothStep(browse.output, cameraAnchorPosition(browse.anchor, count)) };
  const mask = heldMask(browse);
  let emission = 0;
  if (!mask) browse = browse.countdown ? { ...browse, countdown: 0 } : browse;
  else if (browse.countdown) {
    const countdown = browse.countdown - 1;
    emission = countdown ? 0 : mask;
    browse = { ...browse, countdown: countdown || REPEAT_INTERVAL };
  }
  if (!browse.touch) ({ selection, browse } = keyPass({ selection, browse }, emission, count));
  return { selection, browse };
}

/**
 * Advance whole nominal updates. Returns the input unchanged when the strip is
 * settled so idle frames would not repaint. Not a live Camera clock.
 */
export function cameraBrowseTick(step: CameraBrowseStep, elapsedMs: number, count: number): CameraBrowseStep {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return step;
  if (settled(step.browse, count)) return step.browse.clockMs ? { ...step, browse: { ...step.browse, clockMs: 0 } } : step;
  let { selection, browse } = step;
  let clock = browse.clockMs + elapsedMs;
  while (clock + 1e-9 >= CAMERA_BROWSE_UPDATE_MS) {
    clock -= CAMERA_BROWSE_UPDATE_MS;
    ({ selection, browse } = cameraBrowseUpdate({ selection, browse }, count));
    if (settled(browse, count)) { clock = 0; break; }
  }
  return { selection, browse: { ...browse, clockMs: Math.max(0, clock) } };
}
