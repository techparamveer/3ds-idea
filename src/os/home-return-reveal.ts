import type { MenuState } from './state.ts';
import type { HomePresentation } from './home-presentation.ts';
import { HEALTH_VBLANK_HZ } from './stock-health-scroll.ts';

/**
 * Measured adaptation, not a traced loader: HOME neighbour reveal after a
 * toolbar applet (Notes, Friend List, Notifications, Internet Browser,
 * Miiverse) returns. Two independent native Notifications Close movies
 * (private `notifications-native-close-2/audit/events.txt`, per-frame LCD
 * region means) show, relative to the settled empty-slot/grid base:
 *   run 1: Health +0.124 s; Camera +0.335, Sound +0.352, Mii Maker +0.375; banner +0.375
 *   run 2: Health +0.094 s; Camera +0.309, Sound +0.309, Mii Maker +0.337; banner +0.337
 * The browser treats its accepted toolbar handoff as the settled base, then
 * restores one first group at LCD frame 6 (~0.100 s) and the remaining
 * visible neighbours plus the banner at frame 19 (~0.318 s). The native
 * loader ranks records by selection priority, viewport penalties, grid
 * distance and an angle term; that ranking is not reproduced. The first group
 * is simply the visible ordinary tile earliest in reading order. Manual and
 * grid-title returns, and reduced motion, keep their prior behaviour.
 */
export const HOME_RETURN_REVEAL_LCD_HZ = HEALTH_VBLANK_HZ;
export const HOME_TOOLBAR_RETURN_FIRST_GROUP_FRAME = 6;
export const HOME_TOOLBAR_RETURN_SECOND_GROUP_FRAME = 19;

/** 0: retained selection only; 1: selection plus the first group; 2: all neighbours and banner. */
export type HomeReturnRevealStage = 0 | 1 | 2;
export type HomeReturnRevealPose = Readonly<{ ticket: number; frame: number; stage: HomeReturnRevealStage }>;

export function homeToolbarReturnRevealFrame(elapsedMs: number): number {
  return Math.max(0, Math.floor(elapsedMs * HOME_RETURN_REVEAL_LCD_HZ / 1000));
}
export function homeToolbarReturnRevealStage(frame: number): HomeReturnRevealStage {
  return frame >= HOME_TOOLBAR_RETURN_SECOND_GROUP_FRAME ? 2 : frame >= HOME_TOOLBAR_RETURN_FIRST_GROUP_FRAME ? 1 : 0;
}

type RevealTile = Pick<HomePresentation['tiles'][number], 'index' | 'x' | 'y' | 'size' | 'appId' | 'folderLabel' | 'source'>;
/** First group: the visible ordinary (non-folder) title earliest in reading
 * order (row, then column), excluding the retained selection. */
export function homeReturnFirstGroupIndex(tiles: readonly RevealTile[], retained: number, clip: { top: number; bottom: number } = { top: 34, bottom: 208 }): number | null {
  let best: RevealTile | null = null;
  for (const tile of tiles) {
    if (!tile.appId || tile.folderLabel !== null || tile.source || tile.index === retained) continue;
    if (tile.x + tile.size <= 0 || tile.x >= 320 || tile.y + tile.size <= clip.top || tile.y >= clip.bottom) continue;
    if (!best || Math.round(tile.y) < Math.round(best.y) || Math.round(tile.y) === Math.round(best.y) && tile.x < best.x) best = tile;
  }
  return best ? best.index : null;
}

/** Input/transition identity of an idle returned HOME. Any change cancels the reveal. */
export function homeReturnRevealKey(state: MenuState): string | null {
  const s = state.system;
  if (!s || !state.powered || s.phase !== 'home' || s.sleeping || s.dialog || s.preferences || state.panel
    || s.runtime.active || s.runtime.systemApplet) return null;
  const n = s.homeNavigation;
  return JSON.stringify([s.runtime.application, s.runtime.sequence, state.selected, state.opened, state.folderSelected, state.columns,
    n.selectionRevision, n.activeFolderSlot, n.rootView, n.focus, n.gesture !== null]);
}

/** Renderer-owned clock: elapsed time from the accepted handoff, published through paired receipts. */
export function createHomeToolbarReturnReveal() {
  let record: { key: string; base: number } | null = null, ticket = 0, disposed = false;
  let pending: HomeReturnRevealPose | undefined;
  const revoke = () => { ticket++; pending = undefined; };
  const reset = () => { revoke(); record = null; };
  const matches = (state: MenuState) => !!record && homeReturnRevealKey(state) === record.key;
  return {
    begin(state: MenuState, base: number, reduced: boolean): boolean {
      reset();
      const key = homeReturnRevealKey(state);
      if (disposed || reduced || !key || !Number.isFinite(base)) return false;
      record = { key, base }; return true;
    },
    sample(state: MenuState, now: number, eligible: boolean, reduced: boolean): HomeReturnRevealPose | undefined {
      if (disposed || !record) return undefined;
      if (reduced || !Number.isFinite(now) || now < record.base || !matches(state)) { reset(); return undefined; }
      if (!eligible) { revoke(); return undefined; }
      const frame = homeToolbarReturnRevealFrame(now - record.base);
      pending = Object.freeze({ ticket, frame, stage: homeToolbarReturnRevealStage(frame) });
      return pending;
    },
    present(pose: HomeReturnRevealPose | undefined, state: MenuState): boolean {
      if (disposed || !pose || pose !== pending || pose.ticket !== ticket || !matches(state)) return false;
      pending = undefined;
      if (pose.stage === 2) record = null;
      return true;
    },
    active(state: MenuState): boolean { return !disposed && matches(state); },
    revoke, reset,
    dispose() { reset(); disposed = true; },
  };
}
