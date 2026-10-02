/**
 * Pure HOME suspended-application close controller.
 *
 * The pinned BannerBG supplies a 20-frame AppQuit material clip, and the
 * delivered lower dialog supplies a 20-frame FadeOut00 clip. The host maps one
 * eligible HOME update to one source frame as an explicit scheduling
 * adaptation; no millisecond, native APT epoch or native phase gap is inferred.
 */
export const HOME_APPLICATION_TRANSITION_SOURCE = Object.freeze({
  sceneIn: Object.freeze({ clip: 'BannerBG_SceneIn', settledFrame: 20 }),
  appPause: Object.freeze({ clip: 'BannerBG_AppPause', settledFrame: 20 }),
  appQuit: Object.freeze({ clip: 'BannerBG_AppQuit', lastFrame: 20 }),
  closingDialog: Object.freeze({ clip: 'Dlg_A_D_02_FadeOut00', lastFrame: 20 }),
  /** Present in the source pack, but not mapped to the observed close route. */
  appRestart: Object.freeze({ clip: 'BannerBG_AppRestart', lastFrame: 40 }),
  /** Present in the source pack, but its live close predicate is untraced. */
  sceneOut: Object.freeze({ clip: 'BannerBG_SceneOut', lastFrame: 40 }),
} as const);

export type HomeApplicationTransitionIdentity = Readonly<{
  generation: string;
  transitionId: number;
  owner: string;
}>;

export type HomeApplicationTransitionIntent = Readonly<{ kind: 'close' }>
  | Readonly<{ kind: 'switch'; appId: string }>;

export type HomeApplicationTransition = Readonly<{
  identity: HomeApplicationTransitionIdentity;
  intent: HomeApplicationTransitionIntent;
  phase: 'closing' | 'terminal' | 'exiting' | 'exit-terminal' | 'complete';
  appQuitFrame: number;
  dialogExitFrame: number | null;
}>;

export type HomeApplicationTransitionPresentation = Readonly<{
  skeletal: readonly [Readonly<{ clip: 'BannerBG_SceneIn'; frame: 20 }>];
  material: readonly [
    Readonly<{ clip: 'BannerBG_AppPause'; frame: 20 }>,
    Readonly<{ clip: 'BannerBG_AppQuit'; frame: number }>,
  ];
}>;

export type HomeApplicationTransitionObservation = Readonly<{
  identity: HomeApplicationTransitionIdentity;
  intent: HomeApplicationTransitionIntent;
}> & (Readonly<{
  kind: 'started';
  stepOffset: null;
}> | Readonly<{
  kind: 'terminalPresented' | 'exitStarted' | 'exitTerminalPresented' | 'commitOwnerClose';
  stepOffset: number;
}>);

export type HomeApplicationTransitionResult = Readonly<{
  state: HomeApplicationTransition | null;
  observations: readonly HomeApplicationTransitionObservation[];
  /** Eligible/inhibited host updates represented. Begin and cancel consume 0. */
  processedUpdates: number;
}>;

function assertIdentity(identity: HomeApplicationTransitionIdentity): void {
  if (typeof identity.generation !== 'string' || !identity.generation
    || !Number.isSafeInteger(identity.transitionId) || identity.transitionId < 0
    || typeof identity.owner !== 'string' || !identity.owner) {
    throw new RangeError('Invalid HOME application-transition identity');
  }
}

function assertIntent(intent: HomeApplicationTransitionIntent): void {
  if (!intent || (intent.kind !== 'close' && intent.kind !== 'switch')
    || (intent.kind === 'switch' && (typeof intent.appId !== 'string' || !intent.appId))) {
    throw new RangeError('Invalid HOME application-transition intent');
  }
}

function assertUpdates(updates: number): void {
  if (!Number.isSafeInteger(updates) || updates < 0) throw new RangeError('Invalid HOME application-transition update count');
}

function sameIdentity(state: HomeApplicationTransition | null, identity: HomeApplicationTransitionIdentity): boolean {
  return state !== null
    && state.identity.generation === identity.generation
    && state.identity.transitionId === identity.transitionId
    && state.identity.owner === identity.owner;
}

function result(state: HomeApplicationTransition | null,
  observations: HomeApplicationTransitionObservation[] = [], processedUpdates = 0): HomeApplicationTransitionResult {
  return Object.freeze({ state, observations: Object.freeze(observations), processedUpdates });
}

function freezeIdentity(identity: HomeApplicationTransitionIdentity): HomeApplicationTransitionIdentity {
  return Object.freeze({ generation: identity.generation, transitionId: identity.transitionId, owner: identity.owner });
}

function freezeIntent(intent: HomeApplicationTransitionIntent): HomeApplicationTransitionIntent {
  return intent.kind === 'switch'
    ? Object.freeze({ kind: 'switch', appId: intent.appId })
    : Object.freeze({ kind: 'close' });
}

/**
 * Starts at source frame 0 without consuming a HOME update. Repeating the same
 * identity is idempotent and preserves the first intent. A fresh identity is an
 * explicit owner/generation replacement; stale callers cannot advance it.
 */
export function beginHomeApplicationTransition(current: HomeApplicationTransition | null,
  identity: HomeApplicationTransitionIdentity, intent: HomeApplicationTransitionIntent): HomeApplicationTransitionResult {
  assertIdentity(identity);
  assertIntent(intent);
  if (sameIdentity(current, identity)) return result(current);
  const state: HomeApplicationTransition = Object.freeze({
    identity: freezeIdentity(identity),
    intent: freezeIntent(intent),
    phase: 'closing',
    appQuitFrame: 0,
    dialogExitFrame: null,
  });
  return result(state, [Object.freeze({ kind: 'started', identity: state.identity, intent: state.intent, stepOffset: null })]);
}

/**
 * Advances source frames only on eligible HOME updates. Reaching either source
 * frame 20 stops the batch at a terminal-presentation barrier. Switch commits
 * after the AppQuit barrier as before. Close publishes dialog exit frame 0 on
 * the next eligible host call, advances through its own barrier, then commits
 * on a later call so both endpoints can be painted before owner retirement.
 */
export function advanceHomeApplicationTransition(state: HomeApplicationTransition | null,
  identity: HomeApplicationTransitionIdentity, updates: number,
  input: Readonly<{ eligible: boolean }>): HomeApplicationTransitionResult {
  assertIdentity(identity);
  assertUpdates(updates);
  if (typeof input?.eligible !== 'boolean') throw new RangeError('HOME application transition requires explicit eligibility');
  if (!state || !sameIdentity(state, identity) || state.phase === 'complete' || updates === 0) return result(state);
  if (!input.eligible) return result(state, [], updates);

  if (state.phase === 'exit-terminal'
    || (state.phase === 'terminal' && state.intent.kind === 'switch')) {
    const complete = Object.freeze({ ...state, phase: 'complete' as const });
    return result(complete, [Object.freeze({
      kind: 'commitOwnerClose', identity: complete.identity, intent: complete.intent, stepOffset: 0,
    })], 1);
  }

  if (state.phase === 'terminal') {
    const exiting = Object.freeze({ ...state, phase: 'exiting' as const, dialogExitFrame: 0 });
    return result(exiting, [Object.freeze({
      kind: 'exitStarted', identity: exiting.identity, intent: exiting.intent, stepOffset: 0,
    })], 1);
  }

  if (state.phase === 'exiting') {
    let next = state;
    for (let stepOffset = 0; stepOffset < updates; stepOffset += 1) {
      const dialogExitFrame = Math.min(HOME_APPLICATION_TRANSITION_SOURCE.closingDialog.lastFrame,
        next.dialogExitFrame! + 1);
      const terminal = dialogExitFrame === HOME_APPLICATION_TRANSITION_SOURCE.closingDialog.lastFrame;
      next = Object.freeze({ ...next, dialogExitFrame,
        phase: terminal ? 'exit-terminal' as const : 'exiting' as const });
      if (terminal) return result(next, [Object.freeze({
        kind: 'exitTerminalPresented', identity: next.identity, intent: next.intent, stepOffset,
      })], stepOffset + 1);
    }
    return result(next, [], updates);
  }

  let next = state;
  for (let stepOffset = 0; stepOffset < updates; stepOffset += 1) {
    const appQuitFrame = Math.min(HOME_APPLICATION_TRANSITION_SOURCE.appQuit.lastFrame, next.appQuitFrame + 1);
    const terminal = appQuitFrame === HOME_APPLICATION_TRANSITION_SOURCE.appQuit.lastFrame;
    next = Object.freeze({ ...next, appQuitFrame, phase: terminal ? 'terminal' as const : 'closing' as const });
    if (terminal) return result(next, [Object.freeze({
      kind: 'terminalPresented', identity: next.identity, intent: next.intent, stepOffset,
    })], stepOffset + 1);
  }
  return result(next, [], updates);
}

/** Matching lifecycle replacement/teardown drops the presentation only. */
export function cancelHomeApplicationTransition(state: HomeApplicationTransition | null,
  identity: HomeApplicationTransitionIdentity): HomeApplicationTransitionResult {
  assertIdentity(identity);
  return result(sameIdentity(state, identity) ? null : state);
}

/** Immutable logical sample; painting and repeated reads never advance it. */
export function sampleHomeApplicationTransition(state: HomeApplicationTransition | null): HomeApplicationTransition | null {
  return state;
}

/**
 * Renderer contract for the one mapped close clip. Reduced motion selects the
 * same source endpoint while leaving logical ownership/timing to the host.
 */
export function homeApplicationTransitionPresentation(state: HomeApplicationTransition | null,
  reduced = false): HomeApplicationTransitionPresentation | null {
  if (!state || state.phase === 'complete') return null;
  const quitFrame = reduced ? HOME_APPLICATION_TRANSITION_SOURCE.appQuit.lastFrame : state.appQuitFrame;
  const skeletal = Object.freeze([
    Object.freeze({ clip: HOME_APPLICATION_TRANSITION_SOURCE.sceneIn.clip, frame: 20 as const }),
  ] as const);
  const material = Object.freeze([
    Object.freeze({ clip: HOME_APPLICATION_TRANSITION_SOURCE.appPause.clip, frame: 20 as const }),
    Object.freeze({ clip: HOME_APPLICATION_TRANSITION_SOURCE.appQuit.clip, frame: quitFrame }),
  ] as const);
  return Object.freeze({
    skeletal,
    material,
  });
}
