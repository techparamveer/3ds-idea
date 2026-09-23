import type { HomeKeyEvent } from './home-input-producer.ts';
import { setHomeCursorLoopStep, type HomeCursorLoop } from './home-cursor-loop.ts';
import {
  activeHomeRecord, gridSnapshot, sampleHomeGrid, homeGridMetrics, maxHomeLeftSlot,
  type HomeNavigation, type HomeViewRecord, type HomeMotion,
} from './home-navigation.ts';

export type HomeScrollState = Readonly<{ navigation: HomeNavigation; cursorLoop: HomeCursorLoop }>;
export type HomeCursorEffectTarget = Readonly<{ kind: 'toolbar'; focus: number; scaleFrame: number }>
  | Readonly<{ kind: 'grid'; slot: number; scaleFrame: number;
    /** Effect-call grid coordinates before scroll subtraction. Keep slot-bound during later motion. */
    anchor: Readonly<{ x: number; y: number; scrollPixels: number }> }>;
export type HomeScrollObservation = Readonly<{
  /** Input-route observations use null; counted advances use zero-based offsets. */
  updateOffset: number | null;
}> & (Readonly<{ kind: 'cue'; cue: 'selection' | 'invalid' | 'toolbar'; eventType: 4 | 6; mask: number; slot: number }>
  | Readonly<{ kind: 'cursor-select'; source: 'direction' | 'touch'; slot: number; context: number | null; effectTarget: HomeCursorEffectTarget }>
  | Readonly<{ kind: 'banner-resolve'; phase: 'lower'; reason: 'idle-update' | 'idle-entry';
    context: number | null; slot: number; focus: number; toolbarActive: boolean;
    /** One attempt per update in [updateOffset, updateOffset + updateCount). */
    updateCount: number }>
  | Readonly<{ kind: 'scale-seek'; frame: number }>
  | Readonly<{ kind: 'mode3-entry'; cause: 'direction' | 'touch' | 'folder-return' | 'explicit'; durationUpdates: 5 | 10; targetLeftSlot: number }>);
export type HomeScrollResult = Readonly<{
  state: HomeScrollState;
  observations: readonly HomeScrollObservation[];
  /** Unsupported routes need another owner; they are not silently consumed. */
  disposition: 'handled' | 'unsupported';
}>;
export type HomeDirectionGates = Readonly<{ overlayActive: boolean; managerPresent: boolean; managerInhibited: boolean; sceneInhibited: boolean }>;
/** Apply S+3fd0 at the lower idle-update call site, independently of input handling. */
export type HomeScrollAdvanceOptions = Readonly<{ idleOverlayActive?: boolean }>;
const ordinaryGates: HomeDirectionGates = Object.freeze({ overlayActive: false, managerPresent: true, managerInhibited: false, sceneInhibited: false });
const toolbarScale = (focus: number) => focus === 0 ? 10 : focus >= 6 ? 12 : 11;
// Numeric mappings at root314e74/folder314eec and root314f64/folder315024.
// Root/folder values are identical; these are navigation indices, not labels.
const gridFocus = [
  [1,3,5,0,0,0,0,0,0,0], [1,3,5,0,0,0,0,0,0,0], [0,2,3,4,6,0,0,0,0,0],
  [0,1,2,3,4,5,6,0,0,0], [0,1,1,2,3,4,5,5,6,0], [0,1,1,2,3,3,4,5,5,6],
] as const;
const toolbarColumn = [
  [0,0,1,1,1,2,2,2], [0,0,1,1,1,2,2,2], [0,0,1,2,3,4,4,4],
  [0,1,2,3,4,5,6,6], [0,1,3,4,5,7,8,8], [0,1,3,4,6,7,9,9],
] as const;
const result = (state: HomeScrollState, observations: HomeScrollObservation[] = [],
  disposition: HomeScrollResult['disposition'] = 'handled'): HomeScrollResult => Object.freeze({
  state: Object.freeze({ ...state }), observations: Object.freeze(observations), disposition,
});
function mode3(state: HomeScrollState, change: Partial<HomeNavigation['mode3']>): HomeScrollState {
  return { ...state, navigation: { ...state.navigation, mode3: Object.freeze({ ...state.navigation.mode3, ...change }) } };
}
function record(state: HomeScrollState, view: HomeViewRecord, motion = state.navigation.motion): HomeScrollState {
  const nav = state.navigation, previous = activeHomeRecord(nav);
  return { ...state, navigation: { ...nav, motion,
    selectionRevision: nav.selectionRevision + Number(view.selectedSlot !== previous.selectedSlot),
    ...(nav.activeFolderSlot === null ? { rootView: view } : { folderViews: { ...nav.folderViews, [nav.activeFolderSlot]: view } }),
  } };
}
function startMotion(state: HomeScrollState, target: HomeViewRecord, mode: 2 | 3, durationUpdates: 5 | 10 | 16): HomeScrollState {
  const nav = state.navigation, current = activeHomeRecord(nav);
  const motion: HomeMotion = { mode, elapsedUpdates: 0, durationUpdates,
    currentDensity: current.density, targetDensity: target.density,
    fromGeometry: sampleHomeGrid(nav), targetGeometry: gridSnapshot(nav.activeFolderSlot !== null, target.density, target.targetLeftSlot) };
  return record(state, target, motion);
}
function validate(state: HomeScrollState): void {
  const { entryCount, directionMask, pendingMask } = state.navigation.mode3;
  if (!Number.isInteger(entryCount) || entryCount < 0 || entryCount > 5) throw new RangeError('Invalid HOME mode3 count');
  for (const bits of [directionMask, pendingMask]) {
    if (!Number.isInteger(bits) || bits < 0 || bits > 0x30 || (bits & ~0x30)) throw new RangeError('Invalid HOME horizontal markers');
  }
}
function cursorSelection(state: HomeScrollState, source: 'direction' | 'touch', oldSlot: number, oldFocus: number): HomeScrollObservation {
  const nav = state.navigation, view = activeHomeRecord(nav);
  let effectTarget: HomeCursorEffectTarget;
  if (oldFocus !== -1 && oldFocus !== nav.focus.currentFocus) {
    effectTarget = Object.freeze({ kind: 'toolbar', focus: oldFocus, scaleFrame: toolbarScale(oldFocus) });
  } else {
    const grid = sampleHomeGrid(nav), point = grid.slots[oldSlot];
    effectTarget = Object.freeze({ kind: 'grid', slot: oldSlot, scaleFrame: view.density,
      anchor: Object.freeze({ x: point.x, y: point.y, scrollPixels: grid.scrollPixels }) });
  }
  return Object.freeze({ kind: 'cursor-select', source, slot: view.selectedSlot, context: nav.activeFolderSlot, effectTarget, updateOffset: null });
}
function bannerResolver(state: HomeScrollState, reason: 'idle-update' | 'idle-entry', updateOffset: number | null, updateCount = 1): HomeScrollObservation {
  const nav = state.navigation;
  return Object.freeze({ kind: 'banner-resolve', phase: 'lower', reason, context: nav.activeFolderSlot,
    slot: activeHomeRecord(nav).selectedSlot, focus: nav.focus.currentFocus, toolbarActive: nav.focus.toolbarActive, updateOffset, updateCount });
}

/** Shared actual mode entry, including explicit same-mode re-entry. No cursor
 * frame is submitted or advanced here; the later 2D/layout pass owns that work.
 */
export function enterHomeMode3(state: HomeScrollState, targetLeftSlot: number,
  cause: 'direction' | 'touch' | 'folder-return' | 'explicit' = 'explicit'): HomeScrollResult {
  validate(state);
  const view = activeHomeRecord(state.navigation), folder = state.navigation.activeFolderSlot !== null;
  const { rows } = homeGridMetrics(folder, view.density);
  if (!Number.isInteger(targetLeftSlot) || targetLeftSlot < 0 || targetLeftSlot % rows
    || targetLeftSlot > maxHomeLeftSlot(folder, view.density)) throw new RangeError('Invalid HOME viewport target');
  const count = state.navigation.mode3.entryCount, durationUpdates = count < 5 ? 10 : 5;
  state = mode3(state, { entryCount: Math.min(5, count + 1) });
  if (count >= 5 && state.cursorLoop.step === 1) state = { ...state, cursorLoop: setHomeCursorLoopStep(state.cursorLoop, 3) };
  state = startMotion(state, { ...view, targetLeftSlot }, 3, durationUpdates);
  return result(state, [Object.freeze({ kind: 'mode3-entry', cause, durationUpdates, targetLeftSlot, updateOffset: null })]);
}

/** Exact ordinary direction masks, including source-proved toolbar navigation.
 * Feature activation and gesture/service routing remain separate host owners.
 */
export function consumeHomeGridKeyEvent(state: HomeScrollState, event: HomeKeyEvent, gates: HomeDirectionGates = ordinaryGates): HomeScrollResult {
  validate(state);
  if (![4, 5, 6, 7].includes(event.type) || !Number.isInteger(event.mask) || event.mask < 0 || event.mask > 0xffff) {
    throw new RangeError('Invalid HOME key event');
  }
  if (event.type === 7) {
    if (event.mask & 0x30) {
      state = mode3(state, { entryCount: 0, pendingMask: 0 });
      state = { ...state, cursorLoop: setHomeCursorLoopStep(state.cursorLoop, 1) };
    }
    return result(state);
  }
  for (const value of [gates.overlayActive, gates.managerPresent, gates.managerInhibited, gates.sceneInhibited]) {
    if (typeof value !== 'boolean') throw new TypeError('Invalid HOME direction gate');
  }
  const recognized = [0x10, 0x20, 0x40, 0x80, 0x50, 0x90, 0x60, 0xa0, 0x30, 0xc0, 0xf0];
  if (!recognized.includes(event.mask)) return result(state, [], 'unsupported');
  if (event.type === 5) return result(state);
  if (gates.overlayActive || !gates.managerPresent || gates.managerInhibited || gates.sceneInhibited) return result(state);
  if ([0x30, 0xc0, 0xf0].includes(event.mask)) return result(state);
  const nav = state.navigation;
  if (nav.gesture) return result(state, [], 'unsupported');
  if (nav.motion) {
    return result(event.mask === 0x10 || event.mask === 0x20 ? mode3(state, { pendingMask: nav.mode3.pendingMask | event.mask }) : state);
  }
  const view = activeHomeRecord(nav), { rows, columns, capacity } = homeGridMetrics(nav.activeFolderSlot !== null, view.density);
  const observations: HomeScrollObservation[] = [];
  const setFocus = (change: Partial<HomeNavigation['focus']>) => {
    state = { ...state, navigation: { ...state.navigation, focus: Object.freeze({ ...state.navigation.focus, ...change }) } };
  };
  const seek = (frame: number) => observations.push(Object.freeze({ kind: 'scale-seek', frame, updateOffset: null }));
  const cue = (cue: 'selection' | 'invalid' | 'toolbar') => observations.push(Object.freeze({ kind: 'cue', cue,
    eventType: event.type as 4 | 6, mask: event.mask, slot: activeHomeRecord(state.navigation).selectedSlot, updateOffset: null }));
  const horizontal = (mask: number) => {
    const focus = state.navigation.focus, current = activeHomeRecord(state.navigation);
    if (focus.toolbarActive) {
      const currentFocus = (focus.currentFocus + (mask === 0x10 ? 1 : 7)) % 8;
      setFocus({ currentFocus, savedColumn: -1, rememberedFocus: -1 });
      seek(toolbarScale(currentFocus)); return;
    }
    const slot = current.selectedSlot + (mask === 0x10 ? rows : -rows);
    if (slot < 0 || slot >= capacity) { if (event.type === 4) cue('invalid'); return; }
    state = record(state, { ...current, selectedSlot: slot });
    if (slot < current.currentLeftSlot || slot >= current.currentLeftSlot + rows * columns) {
      state = mode3(state, { directionMask: state.navigation.mode3.directionMask | mask });
      const entered = enterHomeMode3(state, current.currentLeftSlot + (mask === 0x10 ? rows : -rows), 'direction');
      state = entered.state; observations.push(...entered.observations);
    }
  };
  const vertical = (mask: number): boolean => {
    const focus = state.navigation.focus, current = activeHomeRecord(state.navigation), up = mask === 0x40;
    if (focus.toolbarActive) {
      const column = focus.savedColumn >= 0 ? focus.savedColumn : toolbarColumn[current.density][focus.currentFocus];
      if (column === undefined) return false;
      const slot = current.targetLeftSlot + column * rows + (up ? rows - 1 : 0);
      if (slot < 0 || slot >= capacity) return false;
      state = record(state, { ...current, selectedSlot: slot });
      setFocus({ toolbarActive: false, rememberedFocus: focus.currentFocus, currentFocus: -1, savedColumn: -1 });
      seek(current.density); return true;
    }
    const boundary = up ? current.selectedSlot % rows === 0 : (current.selectedSlot + 1) % rows === 0;
    if (!boundary) { state = record(state, { ...current, selectedSlot: current.selectedSlot + (up ? -1 : 1) }); return true; }
    const savedColumn = Math.trunc((current.selectedSlot - current.targetLeftSlot) / rows);
    const currentFocus = focus.rememberedFocus !== -1 ? focus.rememberedFocus : gridFocus[current.density][savedColumn];
    if (currentFocus === undefined) return false;
    setFocus({ toolbarActive: true, currentFocus, rememberedFocus: -1, savedColumn });
    seek(toolbarScale(currentFocus)); return true;
  };
  const h = event.mask & 0x30, v = event.mask & 0xc0;
  if (h && v) {
    if (nav.focus.toolbarActive) { horizontal(h); if (!vertical(v)) return result(state, observations, 'unsupported'); }
    else {
      if (!vertical(v)) return result(state, observations, 'unsupported');
      if (!(nav.focus.currentFocus === -1 && state.navigation.focus.currentFocus !== -1)) horizontal(h);
    }
  } else if (h) horizontal(h);
  else if (!vertical(v)) return result(state, observations, 'unsupported');
  const slot = activeHomeRecord(state.navigation).selectedSlot;
  if (slot !== view.selectedSlot || state.navigation.focus.currentFocus !== nav.focus.currentFocus) {
    cue(state.navigation.focus.toolbarActive ? 'toolbar' : 'selection');
    observations.push(cursorSelection(state, 'direction', view.selectedSlot, nav.focus.currentFocus));
  }
  return result(state, observations);
}

/** Separate scene updates, preserving completion/replay/after-call-clear order.
 * Mode2/5 geometry shares the same endpoint commit. No Loop phase advances.
 */
export function advanceHomeScroll(state: HomeScrollState, updates: number, options: HomeScrollAdvanceOptions = {}): HomeScrollResult {
  validate(state);
  if (!Number.isSafeInteger(updates) || updates < 0) throw new RangeError('Invalid HOME scene update count');
  if (options.idleOverlayActive !== undefined && typeof options.idleOverlayActive !== 'boolean') throw new TypeError('Invalid HOME idle overlay gate');
  const observations: HomeScrollObservation[] = [];
  if (updates > 0 && state.navigation.gesture) return result(state, observations, 'unsupported');
  // Mode2/5 completion is proved only for the ordinary no-overlay route.
  if (updates > 0 && options.idleOverlayActive && state.navigation.motion && state.navigation.motion.mode !== 3) {
    return result(state, observations, 'unsupported');
  }
  let remaining = updates;
  while (remaining > 0 && state.navigation.motion) {
    if (state.navigation.gesture) return result(state, observations, 'unsupported');
    const motion = state.navigation.motion, taken = Math.min(remaining, motion.durationUpdates - motion.elapsedUpdates);
    remaining -= taken;
    const elapsedUpdates = motion.elapsedUpdates + taken;
    if (elapsedUpdates < motion.durationUpdates) {
      state = { ...state, navigation: { ...state.navigation, motion: { ...motion, elapsedUpdates } } }; break;
    }
    const view = activeHomeRecord(state.navigation);
    state = record(state, { ...view, density: motion.targetDensity, currentLeftSlot: view.targetLeftSlot }, null);
    // Idle entry resolves before deferred input can select another slot.
    observations.push(bannerResolver(state, 'idle-entry', updates - remaining - 1));
    if (motion.mode !== 3) continue;
    const markers = state.navigation.mode3;
    const direction = markers.directionMask & 0x20 ? 0x20 : markers.directionMask & 0x10 ? 0x10 : 0;
    if (direction) {
      if (markers.pendingMask & direction) {
        const replay = consumeHomeGridKeyEvent(state, { type: 6, mask: direction }); state = replay.state;
        observations.push(...replay.observations.map(observation => Object.freeze({ ...observation, updateOffset: updates - remaining - 1 })));
        // These writes follow replay, including any marker that replay sets.
        state = mode3(state, { pendingMask: state.navigation.mode3.pendingMask & ~direction });
      }
      state = mode3(state, { directionMask: state.navigation.mode3.directionMask & ~direction });
    }
  }
  if (remaining > 0 && !state.navigation.motion && !options.idleOverlayActive) {
    observations.push(bannerResolver(state, 'idle-update', updates - remaining, remaining));
  }
  return result(state, observations);
}

export function selectHomeTouchSlot(state: HomeScrollState, slot: number): HomeScrollResult {
  validate(state);
  if (state.navigation.motion || state.navigation.gesture || state.navigation.focus.toolbarActive) return result(state, [], 'unsupported');
  const view = activeHomeRecord(state.navigation), { rows, columns, capacity } = homeGridMetrics(state.navigation.activeFolderSlot !== null, view.density);
  if (!Number.isInteger(slot) || slot < 0 || slot >= capacity) throw new RangeError('Invalid HOME tile slot');
  state = record(state, { ...view, selectedSlot: slot });
  const observations: HomeScrollObservation[] = [cursorSelection(state, 'touch', view.selectedSlot, -1)];
  if (slot < view.currentLeftSlot || slot >= view.currentLeftSlot + rows * columns) {
    const target = Math.floor(slot / rows) * rows - (slot < view.currentLeftSlot ? 0 : (columns - 1) * rows);
    const entered = enterHomeMode3(state, target, 'touch'); state = entered.state; observations.push(...entered.observations);
  }
  return result(state, observations);
}

/** Ordinary idle arrow route with an explicit native selection-status endpoint.
 * Status0's immediate exit and mode14 remain outside this proved subset.
 */
export function pageHomeViewport(state: HomeScrollState, direction: 'left' | 'right', selectionStatus: 0 | 1): HomeScrollResult {
  validate(state);
  if (direction !== 'left' && direction !== 'right') throw new RangeError('Invalid HOME page direction');
  if (selectionStatus !== 0 && selectionStatus !== 1) throw new RangeError('Invalid HOME selection status');
  if (selectionStatus === 0 || state.navigation.motion || state.navigation.gesture || state.navigation.focus.toolbarActive) return result(state, [], 'unsupported');
  const nav = state.navigation, view = activeHomeRecord(nav), folder = nav.activeFolderSlot !== null;
  const { rows, columns, capacity } = homeGridMetrics(folder, view.density), page = rows * columns;
  if (direction === 'left' ? view.currentLeftSlot < rows : view.currentLeftSlot + page >= capacity) return result(state);
  const targetLeftSlot = Math.min(maxHomeLeftSlot(folder, view.density), Math.max(0, view.targetLeftSlot + (direction === 'right' ? page : -page)));
  const selectedSlot = Math.min(capacity - 1, Math.max(0, view.selectedSlot + targetLeftSlot - view.currentLeftSlot));
  return result(startMotion(state, { ...view, selectedSlot, targetLeftSlot }, 2, 16));
}

/** Called after root restoration. Normal correction moves exactly one column.
 * Far-history repair is opt-in adapter policy; neither route sets a marker.
 */
export function restoreHomeRootViewport(state: HomeScrollState, options: Readonly<{ repairFarHistory?: boolean }> = {}): HomeScrollResult {
  validate(state);
  if (options.repairFarHistory !== undefined && typeof options.repairFarHistory !== 'boolean') throw new TypeError('Invalid HOME history repair policy');
  if (state.navigation.activeFolderSlot !== null || state.navigation.motion || state.navigation.gesture) return result(state, [], 'unsupported');
  const view = state.navigation.rootView, { rows, columns } = homeGridMetrics(false, view.density);
  const before = view.selectedSlot < view.currentLeftSlot, after = view.selectedSlot >= view.currentLeftSlot + rows * columns;
  if (!before && !after) return result(state, [bannerResolver(state, 'idle-entry', null)]);
  let target = view.currentLeftSlot + (before ? -rows : rows);
  if (options.repairFarHistory && (view.selectedSlot < target || view.selectedSlot >= target + rows * columns)) {
    target = Math.floor(view.selectedSlot / rows) * rows - (before ? 0 : (columns - 1) * rows);
  }
  return enterHomeMode3(state, target, 'folder-return');
}
