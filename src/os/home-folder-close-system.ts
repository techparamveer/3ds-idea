import type { MenuState } from './state.ts';
import type { HomeNavigation } from './home-navigation.ts';
import {
  getHomeNavigation, isHomeRootSelectionVisible,
  leaveHomeFolder, settleHomeNavigation, writeHomeNavigation,
} from './home-navigation.ts';
import { beginHomeFolderClose, stepHomeFolderClose, resolveHomeFolderCloseRestoration, type HomeFolderClose, type HomeFolderCloseIdentity } from './home-folder-close.ts';
import { advanceHomeScroll, consumeHomeGridKeyEvent, restoreHomeRootViewport, type HomeScrollObservation, type HomeScrollResult } from './home-scroll-consumer.ts';
import type { HomeKeyEvent } from './home-input-producer.ts';

/** Compatibility preview only; the actual plan is resolved at restoration. */
export const SYSTEM_HOME_FOLDER_CLOSE_VIEWPORT_UPDATES = 10 as const;
export type SystemHomeFolderCloseRecord = Readonly<{
  controller: HomeFolderClose;
  folderSlot: number;
  startedAtUpdate: number;
  restoredAtUpdate: number | null;
  selectionReadyAtUpdate: number | null;
}>;
export type SystemHomeFolderCloseSession = Readonly<{
  /** Local System revision, incremented on successful settings/layout replacement. */
  generation: number;
  nextTransitionId: number;
  current: SystemHomeFolderCloseRecord | null;
  /** Owned navigation reference rejects out-of-band context replacement. */
  navigation: HomeNavigation | null;
  lastUpdate: number | null;
}>;
export function createSystemHomeFolderClose(previous?: SystemHomeFolderCloseSession): SystemHomeFolderCloseSession {
  const generation = (previous?.generation ?? 0) + 1;
  if (!Number.isSafeInteger(generation)) throw new RangeError('HOME folder-close generation exhausted');
  return Object.freeze({ generation, nextTransitionId: previous?.nextTransitionId ?? 1, current: null, navigation: null, lastUpdate: null });
}
function valid(state: MenuState): boolean {
  const session = state.system?.homeFolderClose, record = session?.current;
  if (!session || !record) return false;
  if (record.controller.identity.generation !== `home-close:${session.generation}`) return false;
  if (record.controller.phase === 'complete') return !state.opened && state.system!.homeNavigation.activeFolderSlot === null;
  const expected = record.restoredAtUpdate === null ? record.folderSlot : null;
  return state.system!.homeNavigation === session.navigation
    && state.system!.homeNavigation.activeFolderSlot === expected
    && state.opened === (expected !== null)
    && (expected === null || (state.selected === expected && Object.hasOwn(state.folders, expected)));
}
/** Completed records remain readable until another close or lifecycle/context reset. */
export function sampleSystemHomeFolderClose(state: MenuState): SystemHomeFolderCloseRecord | null {
  return valid(state) ? state.system!.homeFolderClose.current : null;
}
export function isSystemHomeFolderClosing(state: MenuState): boolean {
  const record = sampleSystemHomeFolderClose(state);
  return record !== null && record.controller.phase !== 'complete';
}
function write(state: MenuState, session: SystemHomeFolderCloseSession): MenuState {
  return { ...state, system: { ...state.system!, homeFolderClose: Object.freeze(session) } };
}
function writeScroll(state: MenuState, result: HomeScrollResult): MenuState {
  if (state.system!.homeNavigation === result.state.navigation && state.system!.homeCursorLoop === result.state.cursorLoop) return state;
  state = writeHomeNavigation(state, result.state.navigation);
  return { ...state, system: { ...state.system!, homeCursorLoop: result.state.cursorLoop } };
}

/** Mode44 admits source event7. Restored viewport ownership is ordinary mode3
 * and also receives held/press/repeat events (including pending markers).
 * Identity and navigation ownership must match before any state changes.
 */
export function consumeSystemHomeFolderCloseInput(state: MenuState, identity: HomeFolderCloseIdentity, event: HomeKeyEvent): Readonly<{
  state: MenuState; observations: readonly HomeScrollObservation[]; disposition: 'handled' | 'unsupported';
}> {
  const current = sampleSystemHomeFolderClose(state);
  if (!current || current.controller.phase === 'complete' || event.type !== 7 && current.controller.phase !== 'viewport'
    || current.controller.identity.generation !== identity.generation || current.controller.identity.transitionId !== identity.transitionId) {
    return Object.freeze({ state, observations: Object.freeze([]), disposition: 'unsupported' });
  }
  const consumed = consumeHomeGridKeyEvent({ navigation: getHomeNavigation(state), cursorLoop: state.system!.homeCursorLoop }, event);
  state = writeScroll(state, consumed);
  state = write(state, { ...state.system!.homeFolderClose, navigation: getHomeNavigation(state) });
  return Object.freeze({ state, observations: consumed.observations, disposition: consumed.disposition });
}
/** No ready/restored observation is manufactured on cancellation. */
export function cancelSystemHomeFolderClose(state: MenuState): MenuState {
  const session = state.system?.homeFolderClose;
  return !session?.current ? state : write(state, { ...session, current: null, navigation: null, lastUpdate: null });
}
export function reconcileSystemHomeFolderClose(state: MenuState): MenuState {
  return state.system?.homeFolderClose.current && !valid(state) ? cancelSystemHomeFolderClose(state) : state;
}
/** Caller has cancelled gestures and reached ordinary HOME Back routing. */
export function beginSystemHomeFolderClose(state: MenuState): MenuState {
  state = reconcileSystemHomeFolderClose(state);
  const s = state.system;
  if (!s || isSystemHomeFolderClosing(state) || !state.opened || state.panel || s.phase !== 'home'
    || s.sleeping || s.dialog || s.preferences || !state.powered) return state;
  state = settleHomeNavigation(state);
  const navigation = getHomeNavigation(state), folderSlot = navigation.activeFolderSlot;
  if (folderSlot === null || navigation.gesture || !Object.hasOwn(state.folders, folderSlot)) return state;
  const session = state.system!.homeFolderClose, transitionId = session.nextTransitionId;
  if (!Number.isSafeInteger(transitionId) || transitionId >= Number.MAX_SAFE_INTEGER) throw new RangeError('HOME folder-close allocation exhausted');
  const identity = { generation: `home-close:${session.generation}`, transitionId };
  const restoration = isHomeRootSelectionVisible(state) ? { restoredSelectionVisible: true as const }
    : { restoredSelectionVisible: false as const, viewportDuration: SYSTEM_HOME_FOLDER_CLOSE_VIEWPORT_UPDATES };
  const begun = beginHomeFolderClose(null, identity, restoration);
  // The setup update already exists: consume only its later layout pass at C.
  const controller = stepHomeFolderClose(begun.state, identity, { taskEligible: false, layoutEligible: true }).state!;
  const startedAtUpdate = state.system!.homeClock.updateCount;
  const current = Object.freeze({ controller, folderSlot, startedAtUpdate, restoredAtUpdate: null, selectionReadyAtUpdate: null });
  return write(state, { ...session, nextTransitionId: transitionId + 1, current, navigation, lastUpdate: startedAtUpdate });
}
export type SystemHomeFolderCloseAdvance = Readonly<{ state: MenuState; observations: readonly HomeScrollObservation[] }>;
function advanced(state: MenuState, observations: HomeScrollObservation[] = []): SystemHomeFolderCloseAdvance {
  return Object.freeze({ state, observations: Object.freeze(observations) });
}
function advanceOrdinaryNavigation(state: MenuState, updates: number, reduced: boolean): SystemHomeFolderCloseAdvance {
  if (reduced || state.system!.homeNavigation.gesture) return advanced(reduced ? settleHomeNavigation(state) : state);
  const result = advanceHomeScroll({ navigation: getHomeNavigation(state), cursorLoop: state.system!.homeCursorLoop }, updates);
  return advanced(writeScroll(state, result), [...result.observations]);
}
/** Called only for an active shared-clock batch, after its final count is stored.
 * At most28 close steps are needed; remaining work runs against restored root.
 * No external completion callback can apply a retained transition to new state.
 */
export function advanceSystemHomeFolderCloseNative(state: MenuState, updates: number, reduced = false): SystemHomeFolderCloseAdvance {
  if (!Number.isSafeInteger(updates) || updates < 0) throw new RangeError('Invalid HOME close update count');
  state = reconcileSystemHomeFolderClose(state);
  if (!isSystemHomeFolderClosing(state)) return advanceOrdinaryNavigation(state, updates, reduced);
  const before = state.system!.homeFolderClose, first = state.system!.homeClock.updateCount - updates;
  if (before.lastUpdate !== first) return advanceOrdinaryNavigation(cancelSystemHomeFolderClose(state), updates, reduced);
  let session = before;
  const observations: HomeScrollObservation[] = [];
  for (let i = 0; i < updates; i++) {
    const record = session.current!, update = first + i + 1;
    let controller = record.controller;
    if (controller.phase === 'closing' && controller.folder.status === 0) {
      const restoredSelectionVisible = isHomeRootSelectionVisible(state);
      const restoration = restoredSelectionVisible ? { restoredSelectionVisible: true as const }
        : { restoredSelectionVisible: false as const, viewportDuration: getHomeNavigation(state).mode3.entryCount < 5 ? 10 as const : 5 as const };
      controller = resolveHomeFolderCloseRestoration(controller, controller.identity, restoration).state!;
    }
    const result = stepHomeFolderClose(controller, controller.identity, { taskEligible: true, layoutEligible: true });
    let restoredAtUpdate = record.restoredAtUpdate, selectionReadyAtUpdate = record.selectionReadyAtUpdate;
    if (result.observations.some(event => event.kind === 'rootRestored')) {
      state = leaveHomeFolder(state);
      // Native ordinary correction is one column. Keep farther damaged history
      // repair explicit at this compatibility boundary.
      const correction = restoreHomeRootViewport({ navigation: getHomeNavigation(state), cursorLoop: state.system!.homeCursorLoop }, { repairFarHistory: true });
      state = writeScroll(state, correction);
      observations.push(...correction.observations.map(observation => Object.freeze({ ...observation, updateOffset: i })));
      restoredAtUpdate = update;
    } else if (record.controller.phase === 'viewport') {
      // Native mode3 geometry advances on each counted viewport task pass.
      const viewport = advanceHomeScroll({ navigation: getHomeNavigation(state), cursorLoop: state.system!.homeCursorLoop }, 1);
      state = writeScroll(state, viewport);
      observations.push(...viewport.observations.map(observation => Object.freeze({ ...observation, updateOffset: i })));
    }
    if (result.observations.some(event => event.kind === 'rootSelectionReady')) selectionReadyAtUpdate = update;
    session = Object.freeze({ ...session, current: Object.freeze({ ...record, controller: result.state!, restoredAtUpdate, selectionReadyAtUpdate }),
      navigation: getHomeNavigation(state), lastUpdate: update });
    state = write(state, session);
    if (result.state!.phase === 'complete') {
      const tail = advanceOrdinaryNavigation(state, updates - i - 1, reduced);
      observations.push(...tail.observations.map(observation => Object.freeze({ ...observation, updateOffset: observation.updateOffset === null ? null : observation.updateOffset + i + 1 })));
      return advanced(tail.state, observations);
    }
  }
  return advanced(state, observations);
}

/** Existing callers retain their state-only shape. The native host must consume
 * advanceSystemHomeFolderCloseNative to deliver ordered replay observations.
 */
export function advanceSystemHomeFolderClose(state: MenuState, updates: number, reduced = false): MenuState {
  return advanceSystemHomeFolderCloseNative(state, updates, reduced).state;
}
