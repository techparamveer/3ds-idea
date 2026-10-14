import type { MenuState } from './state.ts';
import type { HomeControlPass } from './home-controls.ts';
import type { HomeScrollObservation } from './home-scroll-consumer.ts';
import { homeSlotAppId } from './home-layout.ts';
import { activeHomeRecord } from './home-navigation.ts';

export type HomeSuspendedScale = Readonly<{ kind: 'inactive'; epoch: number }> | Readonly<{
  kind: 'home'; owner: string; epoch: number; current: number; target: 0 | 15; lastUpperUpdate: number | null;
}>;

export function createHomeSuspendedScale(): HomeSuspendedScale {
  return Object.freeze({ kind: 'inactive', epoch: 0 });
}

export function enterHomeSuspendedScale(scale: HomeSuspendedScale, owner: string | null, target: 0 | 15): HomeSuspendedScale {
  if (!owner) return scale.kind === 'inactive' ? scale : Object.freeze({ kind: 'inactive', epoch: scale.epoch });
  if (scale.kind === 'home' && scale.owner === owner) return scale;
  return Object.freeze({ kind: 'home', owner, epoch: scale.epoch + 1, current: target, target, lastUpperUpdate: null });
}

export function requestHomeSuspendedScale(scale: HomeSuspendedScale, target: 0 | 15): HomeSuspendedScale {
  return scale.kind === 'inactive' || scale.target === target ? scale : Object.freeze({ ...scale, target, epoch: scale.epoch + 1 });
}

/** EUR upper 0x286e74 calls 0x285ab0 after banner service, independently of its
 * inhibition gates. One admitted call spends one source step, not one paint. */
export function stepHomeSuspendedScale(scale: HomeSuspendedScale, update: number, admitted = true, reduced = false): HomeSuspendedScale {
  if (!Number.isSafeInteger(update) || update < 0) throw new RangeError('Invalid suspended scale upper update');
  if (!admitted || scale.kind === 'inactive' || scale.lastUpperUpdate !== null && update <= scale.lastUpperUpdate) return scale;
  const current = reduced ? scale.target : Math.max(0, Math.min(15, scale.current + Math.sign(scale.target - scale.current)));
  return Object.freeze({ ...scale, current, lastUpperUpdate: update });
}

function put(state: MenuState, scale: HomeSuspendedScale): MenuState {
  return state.system!.homeSuspendedScale === scale ? state : { ...state, system: { ...state.system!, homeSuspendedScale: scale } };
}

function selectedTarget(state: MenuState, slot: number, context: number | null, toolbar: boolean): 0 | 15 {
  const s = state.system!, owner = s.runtime.application, application = owner ? s.runtime.instances[owner] : undefined;
  return !toolbar && application && application.appId === homeSlotAppId(state, slot, context) ? 15 : 0;
}

/** Initial HOME return remains the existing browser lifecycle bridge. Source
 * mode1 initialization sets both endpoints once; capture/assets are not owners. */
export function reconcileSystemHomeSuspendedScale(state: MenuState): MenuState {
  const s = state.system;
  if (!s) return state;
  const runtime = s.runtime, application = runtime.application ? runtime.instances[runtime.application] : undefined;
  const owner = state.powered && s.phase === 'home' && application?.suspended && !application.closing
    && !runtime.active && runtime.homeReturn === application.id ? application.id : null;
  const nav = s.homeNavigation;
  let scale = enterHomeSuspendedScale(s.homeSuspendedScale, owner,
    selectedTarget(state, activeHomeRecord(nav).selectedSlot, nav.activeFolderSlot, nav.focus.toolbarActive));
  // Legacy/accessibility selection has no native resolver journal.
  if (!s.homeControls) scale = requestHomeSuspendedScale(scale,
    selectedTarget(state, activeHomeRecord(nav).selectedSlot, nav.activeFolderSlot, nav.focus.toolbarActive));
  return put(state, scale);
}

export function observeSystemHomeSuspendedScale(state: MenuState, observations: readonly HomeScrollObservation[]): MenuState {
  const s = state.system;
  if (!s) return state;
  let scale = s.homeSuspendedScale;
  for (const observation of observations) if (observation.kind === 'banner-resolve') {
    scale = requestHomeSuspendedScale(scale, selectedTarget(state, observation.slot, observation.context, observation.toolbarActive));
  }
  return put(state, scale);
}

export function stepSystemHomeSuspendedScale(state: MenuState, update: number, reduced = false): MenuState {
  return state.system ? put(state, stepHomeSuspendedScale(state.system.homeSuspendedScale, update, true, reduced)) : state;
}

/** Fold before the open/handoff bridge, while resolver snapshots still belong
 * to the suspended runtime. Lower requests cannot affect this upper call. */
export function applyHomeSuspendedScalePass(pass: HomeControlPass, reduced = false): HomeControlPass {
  const scale = pass.state.system?.homeSuspendedScale;
  if (scale?.kind === 'home' && scale.lastUpperUpdate !== null && pass.updateCount <= scale.lastUpperUpdate) return pass;
  let state = observeSystemHomeSuspendedScale(pass.state, pass.observations.filter(entry => entry.phase === 'input').map(entry => entry.observation));
  if (pass.completed) state = stepSystemHomeSuspendedScale(state, pass.updateCount, reduced);
  state = observeSystemHomeSuspendedScale(state, pass.observations.filter(entry => entry.phase === 'lower').map(entry => entry.observation));
  return state === pass.state ? pass : Object.freeze({ ...pass, state });
}
