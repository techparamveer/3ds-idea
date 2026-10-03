import { columnPitch, homeToolbarHit, menuTiles, pageStart, rowCount, visibleColumns, isHomeFolderBackTouch, type HomeToolbarHit, type MenuState } from './state.ts';
import { homeContainer, homeItemAt, moveHomeItem, resolveHomeDrop, sameHomeLocation, type HomeItem, type HomeLocation } from './home-layout.ts';
import type { AppEvent } from './app-types.ts';
import { getHomeExposedExtent, getHomeNavigation, getHomeNavigationView, settleHomeNavigation, writeHomeNavigation, enterHomeFolder, leaveHomeFolder, commitHomeScroll, type HomeNavigation } from './home-navigation.ts';
import { homeFooterHit } from './home-footer-touch.ts';
import { getHomeDensityControls } from './home-density-controls.ts';
import { HOME_FOOTER_TOUCH_GEOMETRY, homeDensityActionAt, type HomeDensityTouchAction } from './stock-screen-layout.ts';
export { createHomeNavigation, type HomeNavigation } from './home-navigation.ts';

/** Authored defaults. No timing or distance below has been measured on firmware 10.7.0-32E. */
export const HOME_GESTURE_TIMING = { liftMs: 450, slopPixels: 8, folderHoverMs: 500, edgeDelayMs: 350, edgeIntervalMs: 180 } as const;
/** Reuse the existing adapted folder-hover deadline without adding another
 * gesture clock. Folder slots are non-negative, so this cannot alias one. */
const HOME_FOLDER_BACK_HOVER = -1;
export type HomeGesture = {
  pointerId: number; mode: 'press' | 'scroll' | 'drag'; area: 'grid' | 'chrome' | 'toolbar' | 'density' | 'footer' | 'themes';
  x: number; y: number; startX: number; startY: number; startedAt: number; updatedAt: number;
  source: HomeLocation | null; item: HomeItem | null; target: HomeLocation | null;
  viewFolder: number | null; columns: number; panel: MenuState['panel'];
  origin: { navigation: HomeNavigation; panelChoice: number };
  scrollPixels: number | null;
  anchorScroll: number; hoverFolder: number | null; hoverSince: number; edge: -1 | 0 | 1; edgeAt: number;
};
/** Native toolbar feedback and release remain with the exact button that
 * received the down edge. Navigation/context replacement invalidates the
 * owner rather than transferring it to the current pointer target. */
export function ownedHomeToolbarContact(state: MenuState, contact: HomeGesture | null | undefined, endX = contact?.x, endY = contact?.y): HomeToolbarHit | null {
  if (!contact || contact.mode !== 'press' || contact.area !== 'toolbar' || endX === undefined || endY === undefined) return null;
  const live = state.system?.homeNavigation.gesture;
  if (!live || live.pointerId !== contact.pointerId || live.area !== contact.area || live.startX !== contact.startX
    || live.startY !== contact.startY || live.startedAt !== contact.startedAt) return null;
  if (state.panel !== contact.panel || state.columns !== contact.columns || homeContainer(state) !== contact.viewFolder) return null;
  const start = homeToolbarHit(contact.startX, contact.startY), end = homeToolbarHit(endX, endY);
  if (!start || !end || start.action !== end.action || start.focus !== end.focus) return null;
  const current = state.system?.homeNavigation, origin = contact.origin.navigation;
  if (!current || current.selectionRevision !== origin.selectionRevision || current.activeFolderSlot !== origin.activeFolderSlot
    || current.focus.toolbarActive !== origin.focus.toolbarActive || current.focus.currentFocus !== origin.focus.currentFocus) return null;
  const originState = writeHomeNavigation({ ...state, panel: contact.panel, panelChoice: contact.origin.panelChoice }, { ...origin, gesture: null });
  const originView = getHomeNavigationView(originState), currentView = getHomeNavigationView(state);
  return originView.context === currentView.context && originView.targetDensity === currentView.targetDensity ? end : null;
}
/** Density Select/release stays with the original half of the shared source
 * rectangle. Leaving it clears feedback without surrendering capture; only
 * the same still-enabled action can recover ownership on re-entry. */
export function ownedHomeDensityContact(state: MenuState, contact: HomeGesture | null | undefined, endX = contact?.x, endY = contact?.y): HomeDensityTouchAction | null {
  if (!contact || contact.mode !== 'press' || contact.area !== 'density' || endX === undefined || endY === undefined) return null;
  if (state.panel !== contact.panel || state.columns !== contact.columns || homeContainer(state) !== contact.viewFolder) return null;
  const start = homeDensityActionAt(contact.startX, contact.startY), end = homeDensityActionAt(endX, endY);
  if (!start || start !== end) return null;
  const originState = writeHomeNavigation({ ...state, panel: contact.panel, panelChoice: contact.origin.panelChoice }, { ...contact.origin.navigation, gesture: null });
  const originView = getHomeNavigationView(originState), currentView = getHomeNavigationView(state);
  if (originView.context !== currentView.context || originView.targetDensity !== currentView.targetDensity) return null;
  const originControls = getHomeDensityControls(originState), currentControls = getHomeDensityControls(state);
  const enabled = start === 'decrease'
    ? originControls.decreaseEnabled && currentControls.decreaseEnabled
    : originControls.increaseEnabled && currentControls.increaseEnabled;
  return enabled ? start : null;
}
export function homeTouchLocation(state: MenuState, x: number, y: number): HomeLocation | null {
  if (isHomeFolderBackTouch(state, x, y) || x < 20 || x >= 300 || y < (state.opened ? 49 : 34) || y >= 204) return null;
  const tile = menuTiles(state).find(t => x >= t.x && x < Math.min(300, t.x + t.size) && y >= t.y && y < t.y + t.size);
  return tile ? { folder: homeContainer(state), slot: tile.index } : null;
}
function eligible(state: MenuState) { const s = state.system; return !!s && state.powered && s.phase === 'home' && !s.sleeping && !s.dialog && !s.preferences; }
function currentSource(state: MenuState, gesture: HomeGesture) {
  if (!gesture.source || !gesture.item) return true;
  const current = homeItemAt(state, gesture.source);
  return current?.kind === gesture.item.kind && (current.kind === 'app' ? current.id === (gesture.item as { id: string }).id : current.label === (gesture.item as { label: string }).label);
}
const setNavigation = writeHomeNavigation;
/** Cancel restores the starting viewport; persistent icon maps were never changed by the preview. */
export function cancelHomeGesture(state: MenuState): MenuState {
  const s = state.system, gesture = s?.homeNavigation?.gesture;
  if (!s || !gesture) return state;
  const restored = setNavigation(state, gesture.origin.navigation);
  return { ...restored, panelChoice: gesture.origin.panelChoice, system: { ...restored.system!, input: { ...s.input, touch: null } } };
}
/** Lifecycle callers release transient input without discarding context histories. */
export const resetHomeNavigation = (state: MenuState) => settleHomeNavigation(cancelHomeGesture(state));

function boundedScroll(state: MenuState, value: number) { return Math.max(0, Math.min(Math.max(0, Math.ceil(getHomeExposedExtent(state) / rowCount(state)) - visibleColumns(state)), value)); }
function dragTarget(state: MenuState, gesture: HomeGesture, now: number): HomeGesture {
  const target = homeTouchLocation(state, gesture.x, gesture.y);
  const back = state.opened && isHomeFolderBackTouch(state, gesture.x, gesture.y);
  const candidate = back ? HOME_FOLDER_BACK_HOVER : target && target.folder === null && homeItemAt(state, target)?.kind === 'folder' && gesture.item?.kind === 'app' && gesture.source && resolveHomeDrop(state, gesture.source, target) ? target.slot : null;
  const edge = gesture.y >= (state.opened ? 49 : 34) && gesture.y < 204 ? gesture.x >= 0 && gesture.x < 20 ? -1 : gesture.x >= 300 && gesture.x < 320 ? 1 : 0 : 0;
  return { ...gesture, target, hoverFolder: candidate, hoverSince: candidate === gesture.hoverFolder ? gesture.hoverSince : now, edge, edgeAt: edge === gesture.edge ? gesture.edgeAt : now + HOME_GESTURE_TIMING.edgeDelayMs };
}
/** Native callback3 owns the lift threshold. Movement, hover and placement after
 * this entry remain the existing browser gesture adapter. */
export function beginHomePickupGesture(state: MenuState, gesture: HomeGesture): MenuState {
  return setNavigation(state, { ...getHomeNavigation(state),
    gesture: dragTarget(state, { ...gesture, mode: 'drag' }, gesture.updatedAt) });
}
export function tickHomeGesture(state: MenuState, now: number): MenuState {
  let gesture = state.system?.homeNavigation?.gesture;
  if (!gesture || !Number.isFinite(now) || now < gesture.updatedAt) return state;
  if (!eligible(state) || state.panel !== gesture.panel || state.columns !== gesture.columns || homeContainer(state) !== gesture.viewFolder || !currentSource(state, gesture)) return cancelHomeGesture(state);
  if (gesture.mode === 'press' && gesture.area === 'grid' && gesture.item) {
    const touch = state.system?.homeControls?.tileTouch;
    // Physical up closes the browser stroke before its queued native release is
    // sampled. Keep ownership through that edge and retained widget capture.
    const nativeOwned = touch && (touch.strokeOwned || touch.pending.length > 0 || Object.values(touch.widgets).some(widget => widget.capture));
    if (!nativeOwned && now - gesture.startedAt >= HOME_GESTURE_TIMING.liftMs) gesture = dragTarget(state, { ...gesture, mode: 'drag' }, now);
  }
  if (gesture.mode === 'drag') {
    if (gesture.hoverFolder !== null && now - gesture.hoverSince >= HOME_GESTURE_TIMING.folderHoverMs) {
      if (gesture.hoverFolder === HOME_FOLDER_BACK_HOVER) {
        state = leaveHomeFolder(state);
        gesture = dragTarget(state, { ...gesture, viewFolder: null, columns: state.columns,
          scrollPixels: null, target: null, hoverFolder: null, edge: 0, edgeAt: now, updatedAt: now }, now);
        return setNavigation(state, { ...getHomeNavigation(state), gesture });
      }
      const folder = gesture.hoverFolder;
      state = enterHomeFolder(state, folder);
      gesture = { ...gesture, viewFolder: folder, columns: state.columns, scrollPixels: null, target: null, hoverFolder: null, edge: 0, updatedAt: now };
      return setNavigation(state, { ...getHomeNavigation(state), gesture });
    }
    if (gesture.edge && now >= gesture.edgeAt) {
      gesture = { ...gesture, scrollPixels: boundedScroll(state, pageStart(state) + gesture.edge) * columnPitch(state) };
      state = setNavigation(state, { ...getHomeNavigation(state), gesture });
      gesture = dragTarget(state, { ...gesture, edgeAt: now + HOME_GESTURE_TIMING.edgeIntervalMs }, now);
    }
  }
  if (gesture === state.system!.homeNavigation.gesture) return state;
  return setNavigation(state, { ...state.system!.homeNavigation, gesture: { ...gesture, updatedAt: now } });
}
/** Called after the shared stylus latch accepts the event. A returned tap is consumed once by touchSystem. */
export function touchHomeGesture(state: MenuState, event: Extract<AppEvent, { type: 'touch' }>, now: number): { state: MenuState; tap: boolean; nonTapGesture?: boolean } {
  if (!eligible(state)) return { state: cancelHomeGesture(state), tap: false };
  if (event.phase === 'cancel') return { state: cancelHomeGesture(state), tap: false };
  if (event.phase === 'down') {
    const source = !state.panel ? homeTouchLocation(state, event.x, event.y) : null;
    const area = state.panel === 'themes' ? 'themes'
      : !state.panel && !isHomeFolderBackTouch(state, event.x, event.y) && event.y >= (state.opened ? 49 : 34) && event.y < 204 ? 'grid'
      : homeFooterHit(state, HOME_FOOTER_TOUCH_GEOMETRY, event.x, event.y) ? 'footer'
      : !state.panel && homeDensityActionAt(event.x, event.y) ? 'density'
      : !state.panel && homeToolbarHit(event.x, event.y) ? 'toolbar' : 'chrome';
    const gesture: HomeGesture = { pointerId: event.pointerId ?? 0, mode: 'press', area, x: event.x, y: event.y, startX: event.x, startY: event.y, startedAt: now, updatedAt: now, source, item: source ? homeItemAt(state, source) : null, target: source, viewFolder: homeContainer(state), columns: state.columns, panel: state.panel,
      origin: { navigation: getHomeNavigation(state), panelChoice: state.panelChoice }, scrollPixels: null, anchorScroll: pageStart(state), hoverFolder: null, hoverSince: now, edge: 0, edgeAt: now };
    return { state: setNavigation(state, { ...state.system!.homeNavigation, gesture }), tap: false };
  }
  const existing = state.system!.homeNavigation.gesture;
  if (!existing || existing.pointerId !== (event.pointerId ?? 0)) return { state, tap: false };
  if (now < existing.updatedAt) return { state: cancelHomeGesture(state), tap: false };
  state = tickHomeGesture(state, now);
  let gesture = state.system!.homeNavigation.gesture;
  if (!gesture) return { state, tap: false };
  gesture = { ...gesture, x: event.x, y: event.y, updatedAt: now };
  // Native footer, density and toolbar buttons retain their original semantic
  // owner while the stylus leaves them, so re-entry can restore Select. Their
  // endpoint owners still decide presentation and release; other chrome keeps
  // the existing slop-to-scroll cancellation behavior.
  if (gesture.mode === 'press' && gesture.area !== 'footer' && gesture.area !== 'density' && gesture.area !== 'toolbar' && Math.hypot(event.x - gesture.startX, event.y - gesture.startY) > HOME_GESTURE_TIMING.slopPixels) gesture.mode = 'scroll';
  let scrollColumn = pageStart(state);
  if (gesture.mode === 'scroll') {
    if (gesture.area === 'grid') {
      const pitch = columnPitch(state);
      scrollColumn = boundedScroll(state, gesture.anchorScroll + (gesture.startX - event.x) / pitch);
    } else if (gesture.area === 'themes') state = { ...state, panelChoice: Math.max(0, Math.min(6, gesture.origin.panelChoice + Math.round((gesture.startY - event.y) / 53))) };
  }
  if (gesture.mode === 'drag') {
    // Leaving the folder area returns to HOME while retaining the source's original container.
    if (state.opened && (event.y < 49 || event.y >= 212) && event.x >= 0 && event.x < 320 && event.y >= 0 && event.y < 240) {
      state = leaveHomeFolder(state);
      gesture = { ...gesture, viewFolder: null, columns: state.columns, scrollPixels: null, hoverFolder: null, edge: 0 };
      state = setNavigation(state, { ...getHomeNavigation(state), gesture });
      scrollColumn = pageStart(state);
    }
    gesture = dragTarget(state, gesture, now);
  }
  state = setNavigation(state, { ...getHomeNavigation(state), gesture: { ...gesture, scrollPixels: scrollColumn * columnPitch(state) } });
  if (event.phase !== 'up') return { state, tap: false };
  if (event.x < 0 || event.x >= 320 || event.y < 0 || event.y >= 240) return { state: cancelHomeGesture(state), tap: false };
  if (gesture.mode === 'drag') {
    if (!gesture.source || !gesture.target || !resolveHomeDrop(state, gesture.source, gesture.target)) return { state: cancelHomeGesture(state), tap: false, nonTapGesture: true };
    state = commitHomeScroll(setNavigation(state, { ...getHomeNavigation(state), gesture: null }), scrollColumn);
    return { state: moveHomeItem(state, gesture.source, gesture.target), tap: false, nonTapGesture: true };
  }
  if (gesture.mode === 'scroll') {
    state = setNavigation(state, { ...getHomeNavigation(state), gesture: null });
    if (gesture.area === 'grid') state = commitHomeScroll(state, scrollColumn);
    return { state, tap: false, nonTapGesture: true };
  }
  const end = !state.panel ? homeTouchLocation(state, event.x, event.y) : null;
  const beganOnBack = isHomeFolderBackTouch(state, gesture.startX, gesture.startY), endedOnBack = isHomeFolderBackTouch(state, event.x, event.y);
  const tap = gesture.area === 'toolbar' ? !!ownedHomeToolbarContact(state, gesture, event.x, event.y)
    : gesture.area === 'density' ? !!ownedHomeDensityContact(state, gesture, event.x, event.y)
    : gesture.area === 'footer' ? !!homeFooterHit(state, HOME_FOOTER_TOUCH_GEOMETRY, event.x, event.y)
    : beganOnBack || endedOnBack ? beganOnBack && endedOnBack : gesture.source ? sameHomeLocation(gesture.source, end) : !end;
  return { state: setNavigation(state, { ...getHomeNavigation(state), gesture: null }), tap };
}
/** Renderer consumes this preview only; it must not implement another gesture recognizer. */
export function getHomeGestureView(state: MenuState) {
  const gesture = state.system?.homeNavigation?.gesture;
  if (!gesture) return null;
  return {
    mode: gesture.mode, pointerId: gesture.pointerId, x: gesture.x, y: gesture.y,
    pressed: gesture.mode === 'press' ? gesture.source : null,
    dragged: gesture.mode === 'drag' ? { source: gesture.source!, item: gesture.item! } : null,
    target: gesture.mode === 'drag' ? gesture.target : null,
    canDrop: gesture.mode === 'drag' && !!gesture.source && !!gesture.target && !!resolveHomeDrop(state, gesture.source, gesture.target),
    scrollColumn: pageStart(state),
  };
}
