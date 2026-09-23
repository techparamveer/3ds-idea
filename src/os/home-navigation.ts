import type { MenuState } from './state.ts';
import type { HomeGesture } from './home-gestures.ts';

export type HomeDensity = 0 | 1 | 2 | 3 | 4 | 5;
export const HOME_DENSITIES = [3, 4, 6, 8, 10, 12] as const;
export type HomeViewRecord = { selectedSlot: number; currentLeftSlot: number; targetLeftSlot: number; density: HomeDensity };
export type HomeGridSnapshot = ReturnType<typeof homeGridMetrics> & {
  densityValue: number; scrollPixels: number; slots: { index: number; x: number; y: number; size: number }[];
};
export type HomeMotion = {
  mode: 2 | 3 | 5; elapsedUpdates: number; durationUpdates: 5 | 10 | 15 | 16;
  currentDensity: HomeDensity; targetDensity: HomeDensity;
  fromGeometry: HomeGridSnapshot; targetGeometry: HomeGridSnapshot;
};
export type HomeMode3State = Readonly<{ entryCount: number; directionMask: number; pendingMask: number }>;
export const createHomeMode3State = (): HomeMode3State => Object.freeze({ entryCount: 0, directionMask: 0, pendingMask: 0 });
export type HomeGridFocus = Readonly<{ toolbarActive: boolean; currentFocus: number; rememberedFocus: number; savedColumn: number }>;
export const createHomeGridFocus = (): HomeGridFocus => Object.freeze({ toolbarActive: false, currentFocus: -1, rememberedFocus: -1, savedColumn: -1 });
export type HomeNavigation = {
  activeFolderSlot: number | null;
  rootView: HomeViewRecord;
  folderViews: Record<number, HomeViewRecord>;
  motion: HomeMotion | null;
  gesture: HomeGesture | null;
  selectionRevision: number;
  /** Scene-local input state; never part of persisted root/folder view records. */
  mode3: HomeMode3State;
  focus: HomeGridFocus;
};
export const homeDensityIndex = (columns: number): HomeDensity => Math.max(0, HOME_DENSITIES.indexOf(columns as typeof HOME_DENSITIES[number])) as HomeDensity;
export const freshHomeView = (density: HomeDensity = 1): HomeViewRecord => ({ selectedSlot: 0, currentLeftSlot: 0, targetLeftSlot: 0, density });
export const createHomeNavigation = (density: HomeDensity = 1): HomeNavigation => ({ activeFolderSlot: null, rootView: freshHomeView(density), folderViews: {}, motion: null, gesture: null, selectionRevision: 0, mode3: createHomeMode3State(), focus: createHomeGridFocus() });
/** Source tables use centres, not top-left corners. Root capacity remains the portfolio's existing 300. */
export function homeGridMetrics(folder: boolean, density: HomeDensity) {
  return { rows: (folder ? [1, 1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6])[density],
    columns: [3, 3, 5, 7, 9, 10][density], baseX: [76, 76, 52, 40, 32, 34][density],
    baseY: (folder ? [161, 137, 109, 95, 87, 80] : [161, 82, 70, 64, 60, 54])[density],
    pitchX: [84, 84, 54, 40, 32, 28][density], pitchY: [82, 84, 54, 40, 32, 28][density],
    size: [72, 72, 50, 36, 28, 24][density], capacity: folder ? 60 : 300 };
}
export function maxHomeLeftSlot(folder: boolean, density: HomeDensity) {
  const { rows, columns, capacity } = homeGridMetrics(folder, density);
  return Math.max(0, (Math.floor((capacity - 1) / rows) - columns + 1) * rows);
}
/** System-less menu callers get the same records, seeded once from their legacy fields. */
export function getHomeNavigation(state: MenuState): HomeNavigation {
  const stored = state.system?.homeNavigation ?? state.homeNavigation;
  if (stored) return stored;
  const density = homeDensityIndex(state.columns), folder = state.opened, selectedSlot = folder ? state.folderSelected : state.selected;
  const { rows, columns } = homeGridMetrics(folder, density);
  const left = Math.max(0, Math.min(maxHomeLeftSlot(folder, density), (Math.floor(selectedSlot / rows) - Math.floor((columns - 1) / 2)) * rows));
  const record = { selectedSlot, density, currentLeftSlot: left, targetLeftSlot: left };
  const navigation = createHomeNavigation(density);
  return folder ? { ...navigation, activeFolderSlot: state.selected, rootView: { ...navigation.rootView, selectedSlot: state.selected }, folderViews: { [state.selected]: record } } : { ...navigation, rootView: record };
}
export function activeHomeRecord(navigation: HomeNavigation): HomeViewRecord {
  return navigation.activeFolderSlot === null ? navigation.rootView : navigation.folderViews[navigation.activeFolderSlot] ?? freshHomeView();
}
export function writeHomeNavigation(state: MenuState, navigation: HomeNavigation): MenuState {
  const view = activeHomeRecord(navigation), folder = navigation.activeFolderSlot;
  return { ...state, opened: folder !== null, selected: folder ?? view.selectedSlot,
    folderSelected: folder === null ? state.folderSelected : view.selectedSlot, columns: HOME_DENSITIES[view.density],
    ...(state.system ? { system: { ...state.system, homeNavigation: navigation } } : { homeNavigation: navigation }) };
}
function withActiveRecord(state: MenuState, record: HomeViewRecord, changed = false, motion = getHomeNavigation(state).motion): MenuState {
  const nav = getHomeNavigation(state);
  return writeHomeNavigation(state, { ...nav, motion, selectionRevision: nav.selectionRevision + Number(changed),
    ...(nav.activeFolderSlot === null ? { rootView: record } : { folderViews: { ...nav.folderViews, [nav.activeFolderSlot]: record } }) });
}
export function gridSnapshot(folder: boolean, density: HomeDensity, left: number): HomeGridSnapshot {
  const metrics = homeGridMetrics(folder, density);
  return { ...metrics, densityValue: density, scrollPixels: left / metrics.rows * metrics.pitchX,
    slots: Array.from({ length: metrics.capacity }, (_, index) => ({ index,
      x: metrics.baseX + Math.floor(index / metrics.rows) * metrics.pitchX,
      y: metrics.baseY + index % metrics.rows * metrics.pitchY, size: metrics.size })) };
}
const f32 = Math.fround;
/** Native Bezier [0,0,1,1], preserving the VFP operation order (0x17eb34). */
export function homeMotionWeight(update: number, duration: number, linear = false) {
  const t = f32(update / duration); if (linear) return t;
  const omt = f32(1 - t), t2 = f32(t * t), omt2 = f32(omt * omt);
  const p1 = f32(f32(omt2 * t) * 3), p2 = f32(f32(t2 * omt) * 3);
  let value = f32(f32(f32(omt2 * omt) * 0) + f32(p1 * 0));
  value = f32(value + f32(p2 * 1)); return f32(value + f32(f32(t2 * t) * 1));
}
const blend = (from: number, to: number, weight: number) => f32(f32(f32(1 - weight) * from) + f32(weight * to));
export function sampleHomeGrid(nav: HomeNavigation): HomeGridSnapshot {
  const record = activeHomeRecord(nav), motion = nav.motion;
  if (!motion) return gridSnapshot(nav.activeFolderSlot !== null, record.density, record.currentLeftSlot);
  const a = motion.fromGeometry, b = motion.targetGeometry, weight = homeMotionWeight(motion.elapsedUpdates, motion.durationUpdates, motion.mode === 3);
  const scroll = blend(a.scrollPixels, b.scrollPixels, weight);
  return { ...a, densityValue: blend(a.densityValue, b.densityValue, weight),
    baseX: blend(a.baseX, b.baseX, weight), baseY: blend(a.baseY, b.baseY, weight),
    pitchX: blend(a.pitchX, b.pitchX, weight), pitchY: blend(a.pitchY, b.pitchY, weight), size: blend(a.size, b.size, weight),
    scrollPixels: scroll > 0 ? Math.ceil(scroll) : Math.floor(scroll),
    slots: a.slots.map((slot, index) => ({ index, x: blend(slot.x, b.slots[index].x, weight),
      y: blend(slot.y, b.slots[index].y, weight), size: blend(slot.size, b.slots[index].size, weight) })) };
}
const homeViewCache = new WeakMap<HomeNavigation, ReturnType<typeof deriveHomeNavigationView>>();
function deriveHomeNavigationView(state: MenuState) {
  const nav = getHomeNavigation(state), record = activeHomeRecord(nav), grid = sampleHomeGrid(nav);
  const scrollPixels = nav.gesture?.scrollPixels ?? grid.scrollPixels;
  const unscrolledSlots = Object.freeze(grid.slots.map(slot => Object.freeze(slot)));
  const slots = Object.freeze(unscrolledSlots.map(slot => Object.freeze({ ...slot, x: slot.x - scrollPixels })));
  return Object.freeze({ ...grid, context: nav.activeFolderSlot, selectedSlot: record.selectedSlot,
    currentDensity: record.density, targetDensity: nav.motion?.targetDensity ?? record.density, density: grid.densityValue,
    mode: nav.motion?.mode ?? 0, elapsedUpdates: nav.motion?.elapsedUpdates ?? 0,
    currentLeftSlot: record.currentLeftSlot, targetLeftSlot: record.targetLeftSlot, scrollPixels, slots, unscrolledSlots,
    selectionRevision: nav.selectionRevision, selectedAnchorX: slots[record.selectedSlot].x });
}
/** Immutable navigation records allow all geometry consumers to share one sample per update. */
export function getHomeNavigationView(state: MenuState) {
  const nav = getHomeNavigation(state), cached = homeViewCache.get(nav); if (cached) return cached;
  const view = deriveHomeNavigationView(state); homeViewCache.set(nav, view); return view;
}
function startHomeMotion(state: MenuState, target: HomeViewRecord, mode: 2 | 5, changed = false): MenuState {
  const nav = getHomeNavigation(state), current = activeHomeRecord(nav);
  const motion: HomeMotion = { mode, elapsedUpdates: 0, durationUpdates: mode === 2 ? 16 : 15,
    currentDensity: current.density, targetDensity: target.density,
    fromGeometry: sampleHomeGrid(nav), targetGeometry: gridSnapshot(nav.activeFolderSlot !== null, target.density, target.targetLeftSlot) };
  return withActiveRecord(state, { ...current, selectedSlot: target.selectedSlot, targetLeftSlot: target.targetLeftSlot }, changed, motion);
}
/** Pure native update counts. Painting never mutates elapsed progress. */
export function advanceHomeNavigation(state: MenuState, updates: number): MenuState {
  const nav = getHomeNavigation(state), motion = nav.motion;
  if (!motion || !Number.isInteger(updates) || updates <= 0) return state;
  const elapsedUpdates = Math.min(motion.durationUpdates, motion.elapsedUpdates + updates);
  if (elapsedUpdates === motion.durationUpdates) return settleHomeNavigation(state);
  return writeHomeNavigation(state, { ...nav, motion: { ...motion, elapsedUpdates } });
}
/** Explicit accessibility/lifecycle policy: retain the intended endpoint, never replay hidden time. */
export function settleHomeNavigation(state: MenuState): MenuState {
  const nav = getHomeNavigation(state), motion = nav.motion; if (!motion) return state;
  const record = activeHomeRecord(nav);
  return withActiveRecord(state, { ...record, density: motion.targetDensity, currentLeftSlot: record.targetLeftSlot }, false, null);
}
export function selectHomeSlot(state: MenuState, slot: number): MenuState {
  const nav = getHomeNavigation(state), record = activeHomeRecord(nav), folder = nav.activeFolderSlot !== null;
  const density = nav.motion?.targetDensity ?? record.density, { rows, columns, capacity } = homeGridMetrics(folder, density);
  if (!Number.isInteger(slot) || slot < 0 || slot >= capacity) return state;
  const column = Math.floor(slot / rows), left = record.targetLeftSlot / rows;
  const target = Math.max(0, Math.min(maxHomeLeftSlot(folder, density), (column < left ? column : column >= left + columns ? column - columns + 1 : left) * rows));
  const changed = slot !== record.selectedSlot;
  return target === record.targetLeftSlot ? withActiveRecord(state, { ...record, selectedSlot: slot }, changed)
    : startHomeMotion(state, { ...record, density, selectedSlot: slot, targetLeftSlot: target }, nav.motion?.mode === 5 ? 5 : 2, changed);
}
export function stepHomeDirection(state: MenuState, direction: 'left' | 'right' | 'up' | 'down'): MenuState {
  const current = getHomeNavigationView(state), view = { ...current, ...homeGridMetrics(current.context !== null, current.targetDensity) };
  const row = view.selectedSlot % view.rows, col = Math.floor(view.selectedSlot / view.rows);
  const nextCol = direction === 'left' ? Math.max(0, col - 1) : direction === 'right' ? Math.min(Math.ceil(view.capacity / view.rows) - 1, col + 1) : col;
  const nextRow = direction === 'up' ? Math.max(0, row - 1) : direction === 'down' ? Math.min(view.rows - 1, row + 1) : row;
  return selectHomeSlot(state, Math.min(view.capacity - 1, nextCol * view.rows + nextRow));
}
/** Native density touch chooses the earliest left slot nearest the previous selected X (float32). */
export function setHomeDensity(state: MenuState, density: HomeDensity): MenuState {
  const nav = getHomeNavigation(state), record = activeHomeRecord(nav);
  if (density === (nav.motion?.targetDensity ?? record.density)) return state;
  const oldX = Math.fround(getHomeNavigationView(state).selectedAnchorX), folder = nav.activeFolderSlot !== null;
  const { rows, columns, baseX, pitchX } = homeGridMetrics(folder, density), top = record.selectedSlot - record.selectedSlot % rows;
  const first = Math.max(0, top - (columns - 1) * rows), last = Math.min(maxHomeLeftSlot(folder, density), top + (columns - 1) * rows);
  let left = first, distance = Infinity;
  for (let candidate = first; candidate <= last; candidate += rows) {
    const x = Math.fround(baseX + Math.fround((top - candidate) / rows * pitchX)), delta = Math.fround(x - oldX), squared = Math.fround(delta * delta);
    if (squared < distance) { left = candidate; distance = squared; }
  }
  return startHomeMotion(state, { ...record, density, targetLeftSlot: left }, 5);
}
export function enterHomeFolder(state: MenuState, slot: number): MenuState {
  if (!Object.hasOwn(state.folders, slot)) return state;
  state = settleHomeNavigation(state);
  let nav = getHomeNavigation(state);
  if (nav.activeFolderSlot === slot) return state;
  if (nav.activeFolderSlot === null) { state = settleHomeNavigation(selectHomeSlot(state, slot)); nav = getHomeNavigation(state); }
  let record = nav.folderViews[slot] ?? freshHomeView();
  const { rows, columns } = homeGridMetrics(true, record.density);
  if (record.selectedSlot < record.currentLeftSlot || record.selectedSlot >= record.currentLeftSlot + rows * columns) record = { ...record, selectedSlot: record.currentLeftSlot };
  return writeHomeNavigation(state, { ...nav, activeFolderSlot: slot, folderViews: { ...nav.folderViews, [slot]: record }, selectionRevision: nav.selectionRevision + 1 });
}
export function leaveHomeFolder(state: MenuState): MenuState {
  state = settleHomeNavigation(state);
  const nav = getHomeNavigation(state);
  return nav.activeFolderSlot === null ? state : writeHomeNavigation(state, { ...nav, activeFolderSlot: null, selectionRevision: nav.selectionRevision + 1 });
}
/** Restored root visibility uses its own settled geometry, never child density. */
export function isHomeRootSelectionVisible(state: MenuState): boolean {
  const root = getHomeNavigation(state).rootView, { rows, columns } = homeGridMetrics(false, root.density);
  return root.selectedSlot >= root.currentLeftSlot && root.selectedSlot < root.currentLeftSlot + rows * columns;
}
/** Defensive offscreen restoration: native mode3 linear motion with an explicit
 * duration. Nearest visible endpoint also handles damaged/far-off history; its
 * duration/target adapter policy is documented separately from native evidence. */
export function restoreHomeFolderRoot(state: MenuState, duration: 5 | 10): MenuState {
  if (duration !== 5 && duration !== 10) throw new RangeError('Invalid folder root viewport duration');
  state = leaveHomeFolder(state);
  if (isHomeRootSelectionVisible(state)) return state;
  const nav = getHomeNavigation(state), root = nav.rootView;
  const { rows, columns } = homeGridMetrics(false, root.density), column = Math.floor(root.selectedSlot / rows);
  const targetLeftSlot = Math.max(0, Math.min(maxHomeLeftSlot(false, root.density),
    (root.selectedSlot < root.currentLeftSlot ? column : column - columns + 1) * rows));
  return writeHomeNavigation(state, { ...nav, rootView: { ...root, targetLeftSlot }, motion: {
    mode: 3, elapsedUpdates: 0, durationUpdates: duration, currentDensity: root.density, targetDensity: root.density,
    fromGeometry: gridSnapshot(false, root.density, root.currentLeftSlot), targetGeometry: gridSnapshot(false, root.density, targetLeftSlot),
  } });
}
export function initializeHomeFolderView(state: MenuState, slot: number): MenuState {
  const nav = getHomeNavigation(state);
  return writeHomeNavigation(state, { ...nav, folderViews: { ...nav.folderViews, [slot]: freshHomeView() } });
}
export function deleteHomeFolderView(state: MenuState, slot: number): MenuState {
  state = getHomeNavigation(state).activeFolderSlot === slot ? leaveHomeFolder(state) : state;
  const nav = getHomeNavigation(state), folderViews = { ...nav.folderViews }; delete folderViews[slot];
  return writeHomeNavigation(state, { ...nav, folderViews });
}
export function remapHomeFolderViews(state: MenuState, from: number, to: number, swap: boolean): MenuState {
  state = settleHomeNavigation(state);
  const nav = getHomeNavigation(state), folderViews = { ...nav.folderViews }, source = folderViews[from] ?? freshHomeView(), other = folderViews[to] ?? freshHomeView();
  delete folderViews[from]; delete folderViews[to]; folderViews[to] = source; if (swap) folderViews[from] = other;
  const activeFolderSlot = nav.activeFolderSlot === from ? to : swap && nav.activeFolderSlot === to ? from : nav.activeFolderSlot;
  return writeHomeNavigation(state, { ...nav, folderViews, activeFolderSlot });
}
/** Touch panning commits an aligned viewport and keeps selection inside it. */
export function commitHomeScroll(state: MenuState, column: number): MenuState {
  state = settleHomeNavigation(state);
  const nav = getHomeNavigation(state), record = activeHomeRecord(nav), folder = nav.activeFolderSlot !== null;
  const { rows, columns, capacity } = homeGridMetrics(folder, record.density);
  const left = Math.max(0, Math.min(maxHomeLeftSlot(folder, record.density), Math.round(column) * rows));
  const col = Math.max(left / rows, Math.min(left / rows + columns - 1, Math.floor(record.selectedSlot / rows)));
  const selectedSlot = Math.min(capacity - 1, col * rows + record.selectedSlot % rows);
  return withActiveRecord(state, { ...record, selectedSlot, currentLeftSlot: left, targetLeftSlot: left }, selectedSlot !== record.selectedSlot);
}
export function saveHomeView(state: MenuState) {
  const stored = getHomeNavigation(state), nav = stored.gesture?.origin.navigation ?? stored;
  const settle = (v: HomeViewRecord, active: boolean) => ({ selectedSlot: v.selectedSlot, currentLeftSlot: v.targetLeftSlot, targetLeftSlot: v.targetLeftSlot, density: active && nav.motion ? nav.motion.targetDensity : v.density });
  return { activeFolderSlot: nav.activeFolderSlot, rootView: settle(nav.rootView, nav.activeFolderSlot === null),
    folderViews: Object.fromEntries(Object.keys(state.folders).map(key => [key, settle(nav.folderViews[Number(key)] ?? freshHomeView(), nav.activeFolderSlot === Number(key))])) };
}
const dictionary = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
export function restoreHomeView(state: MenuState, value: unknown, density: HomeDensity): MenuState {
  const nav = createHomeNavigation(density);
  function valid(record: unknown, folder: boolean): HomeViewRecord | null {
    if (!dictionary(record) || !Number.isInteger(record.density) || Number(record.density) < 0 || Number(record.density) > 5) return null;
    const d = record.density as HomeDensity, { rows, capacity } = homeGridMetrics(folder, d);
    if (!Number.isInteger(record.selectedSlot) || Number(record.selectedSlot) < 0 || Number(record.selectedSlot) >= capacity) return null;
    for (const field of ['currentLeftSlot', 'targetLeftSlot']) if (!Number.isInteger(record[field]) || Number(record[field]) < 0 || Number(record[field]) % rows !== 0 || Number(record[field]) > maxHomeLeftSlot(folder, d)) return null;
    return { density: d, selectedSlot: Number(record.selectedSlot), currentLeftSlot: Number(record.targetLeftSlot), targetLeftSlot: Number(record.targetLeftSlot) };
  }
  const saved = dictionary(value) ? value : {};
  nav.rootView = valid(saved.rootView, false) ?? nav.rootView;
  const views = dictionary(saved.folderViews) ? saved.folderViews : {};
  for (const key of Object.keys(state.folders)) nav.folderViews[Number(key)] = valid(views[key], true) ?? freshHomeView();
  if (Number.isInteger(saved.activeFolderSlot) && Object.hasOwn(state.folders, Number(saved.activeFolderSlot))) nav.activeFolderSlot = Number(saved.activeFolderSlot);
  return writeHomeNavigation(state, nav);
}

export type HomeUpdateClock = { lastNow: number | null; remainderMs: number; updateCount: number };
export const createHomeUpdateClock = (): HomeUpdateClock => ({ lastNow: null, remainderMs: 0, updateCount: 0 });
/** Provisional application cadence, NOT a source-measured native duration. */
export function stepHomeUpdateClock(clock: HomeUpdateClock, now: number, active: boolean): { clock: HomeUpdateClock; updates: number } {
  if (!Number.isFinite(now)) return { clock, updates: 0 };
  if (!active) return { clock: clock.lastNow === null && clock.remainderMs === 0 ? clock : { ...clock, lastNow: null, remainderMs: 0 }, updates: 0 };
  if (clock.lastNow === null || now < clock.lastNow) return { clock: { ...clock, lastNow: now, remainderMs: 0 }, updates: 0 };
  if (now === clock.lastNow) return { clock, updates: 0 };
  const elapsed = clock.remainderMs + now - clock.lastNow, step = 1000 / 60, updates = Math.floor(elapsed / step + 1e-9);
  return { clock: { lastNow: now, remainderMs: Math.max(0, elapsed - updates * step), updateCount: clock.updateCount + updates }, updates };
}
