import type { MenuState } from './state.ts';
import {
  advanceHomeApplicationTransition,
  beginHomeApplicationTransition,
  type HomeApplicationTransition,
  type HomeApplicationTransitionIntent,
  type HomeApplicationTransitionObservation,
} from './home-application-transition.ts';

export type SystemHomeApplicationTransitionAdvance = Readonly<{
  state: MenuState;
  processedUpdates: number;
  commit: HomeApplicationTransitionObservation | null;
}>;

function generation(state: MenuState): string | null {
  const session = state.system?.homeFolderClose;
  return session ? `home-application:${session.generation}` : null;
}

function valid(state: MenuState, transition: HomeApplicationTransition): boolean {
  const s = state.system, owner = transition.identity.owner;
  const instance = s?.runtime.instances[owner];
  if (!s || !state.powered || s.phase !== 'home' || transition.identity.generation !== generation(state)) return false;
  if (transition.phase === 'footer-returning' || transition.phase === 'return-terminal') {
    return transition.intent.kind === 'close' && !instance && s.runtime.application === null && s.runtime.active === null
      && s.runtime.homeReturn === null && s.app === null;
  }
  return s.runtime.application === owner && s.runtime.active === null && s.runtime.homeReturn === owner
    && s.app === instance?.appId && !!instance?.suspended && !instance.closing;
}

function write(state: MenuState, transition: HomeApplicationTransition | null): MenuState {
  return state.system?.homeApplicationTransition === transition ? state
    : { ...state, system: { ...state.system!, homeApplicationTransition: transition } };
}

/** Invalid owner or System-generation replacement cannot retain a close. */
export function reconcileSystemHomeApplicationTransition(state: MenuState): MenuState {
  const transition = state.system?.homeApplicationTransition;
  return transition && !valid(state, transition) ? write(state, null) : state;
}

export function sampleSystemHomeApplicationTransition(state: MenuState): HomeApplicationTransition | null {
  const transition = state.system?.homeApplicationTransition;
  return transition && valid(state, transition) ? transition : null;
}

export function isSystemHomeApplicationTransitionActive(state: MenuState): boolean {
  const transition = sampleSystemHomeApplicationTransition(state);
  return transition !== null && transition.phase !== 'complete';
}

export function cancelSystemHomeApplicationTransition(state: MenuState): MenuState {
  return state.system?.homeApplicationTransition ? write(state, null) : state;
}

/**
 * Begins from the one HOME transition allocator already owned by System. This
 * keeps application and folder transition IDs monotonic without adding a
 * second public counter. Runtime owner and System generation are guarded here;
 * the presentation owner separately pins the actual suspended-capture
 * generation because a resumed instance can publish a newer capture.
 */
export function beginSystemHomeApplicationTransition(state: MenuState,
  intent: HomeApplicationTransitionIntent): MenuState {
  state = reconcileSystemHomeApplicationTransition(state);
  if (isSystemHomeApplicationTransitionActive(state)) return state;
  const s = state.system, owner = s?.runtime.application, instance = owner ? s?.runtime.instances[owner] : undefined;
  if (!s || !owner || !instance || !state.powered || s.phase !== 'home' || s.sleeping || s.dialog
    || s.preferences || state.panel || s.runtime.active !== null || s.runtime.homeReturn !== owner
    || !instance.suspended || instance.closing || s.app !== instance.appId) return state;
  const transitionId = s.homeFolderClose.nextTransitionId;
  if (!Number.isSafeInteger(transitionId) || transitionId < 0 || transitionId >= Number.MAX_SAFE_INTEGER) {
    throw new RangeError('HOME application-transition allocation exhausted');
  }
  const begun = beginHomeApplicationTransition(null, {
    generation: generation(state)!, transitionId, owner,
  }, intent).state!;
  return { ...state, system: { ...s, homeApplicationTransition: begun,
    homeFolderClose: Object.freeze({ ...s.homeFolderClose, nextTransitionId: transitionId + 1 }) } };
}

/** The caller owns the shared-clock rebase and commits the frozen intent. */
export function advanceSystemHomeApplicationTransition(state: MenuState, updates: number,
  eligible: boolean): SystemHomeApplicationTransitionAdvance {
  if (!Number.isSafeInteger(updates) || updates < 0) throw new RangeError('Invalid HOME application-transition update count');
  state = reconcileSystemHomeApplicationTransition(state);
  const transition = sampleSystemHomeApplicationTransition(state);
  if (!transition) return Object.freeze({ state, processedUpdates: 0, commit: null });
  const result = advanceHomeApplicationTransition(transition, transition.identity, updates, { eligible });
  const commit = result.observations.find(observation => observation.kind === 'commitOwnerClose') ?? null;
  state = write(state, result.state?.phase === 'complete' && !commit ? null : result.state);
  return Object.freeze({ state, processedUpdates: result.processedUpdates, commit });
}
