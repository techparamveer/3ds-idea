import {
  activateHomeBanner, advanceHomeBannerClips, advanceHomeBannerManager,
  beginHomeBannerReplacement, createHomeBannerLifecycle, releaseHomeBanner, requestHomeBanner,
  type HomeBannerLifecycle, type HomeBannerTarget,
} from './home-banner-lifecycle.ts';

/** A host-owned session identity changes when System is created/restored. No milliseconds. */
export type HomeBannerServiceClock = Readonly<{ generation: string; updateCount: number }>;
export type HomeBannerResourceTicket = Readonly<{ generation: string; requestEpoch: number }>;
export type HomeBannerServiceRequest = Readonly<{
  target: HomeBannerTarget;
  options?: Parameters<typeof requestHomeBanner>[2];
}>;
export type HomeBannerServiceInputs = Readonly<{
  /** Applied once before the batch, including a zero-update batch. Omit to retain the request. */
  request?: HomeBannerServiceRequest;
  /** Combined manager/wrapper gates. Does not inhibit the separate scene pass. */
  managerInhibited: boolean;
  sceneInhibited: boolean;
  /** Native 0x32f50d gate: freezes the state1 wait counter, not object updates. */
  loadInhibited: boolean;
  /** Native worker completion; checked both before release and in the loading stage. */
  nativeWorkerReady: boolean;
  /** Ready renderable resources for this request. Never inferred from elapsed updates. */
  resourceReady: HomeBannerResourceTicket | null;
  /** When false, gate and loading may proceed but activation waits. Omit for the
   * ordinary ready path. HOME entry sets this from the live footer-14 sample. */
  activationReady?: boolean;
  /** Unsupported app/legacy motion is external. Settings is the bounded title exception. */
  nonFolderPrimary?: Readonly<{ generation: string; activationEpoch: number; visible: boolean }>;
}>;
export type HomeBannerService = Readonly<{
  lifecycle: HomeBannerLifecycle;
  /** Native states1,2,3,6. Settings uses a documented combined-readiness adaptation for states4/5. */
  stage: 'gate' | 'hiding' | 'loading' | 'active';
  waitUpdates: number;
  loadDeferred: boolean;
  /** Last consumed shared counter; this is a cursor, not a second clock accumulator. */
  clock: HomeBannerServiceClock;
}>;

function assertCount(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError('Invalid HOME banner update count');
}
function assertClock(clock: HomeBannerServiceClock): void {
  if (!clock.generation) throw new RangeError('HOME banner clock requires a session generation');
  assertCount(clock.updateCount);
}
export function createHomeBannerService(clock: HomeBannerServiceClock): HomeBannerService {
  assertClock(clock);
  return { lifecycle: createHomeBannerLifecycle(), stage: 'gate', waitUpdates: 0, loadDeferred: false, clock: { ...clock } };
}

/** Request deduplication and same-current reuse remain owned by the lifecycle. */
export function requestHomeBannerService(state: HomeBannerService, request: HomeBannerServiceRequest): HomeBannerService {
  const lifecycle = requestHomeBanner(state.lifecycle, request.target, request.options);
  // Native request setter 0x1ed870 resets this counter even during hiding/loading.
  return lifecycle === state.lifecycle ? state : { ...state, lifecycle, waitUpdates: 0 };
}
export function getHomeBannerResourceTicket(state: HomeBannerService): HomeBannerResourceTicket | null {
  const request = state.lifecycle.requested;
  return !request || request.target.kind === 'clear' ? null : { generation: state.clock.generation, requestEpoch: request.epoch };
}
function resourceReady(state: HomeBannerService, input: HomeBannerServiceInputs): boolean {
  return !!input.resourceReady && input.resourceReady.generation === state.clock.generation
    && input.resourceReady.requestEpoch === state.lifecycle.requested?.epoch;
}
function activationReady(input: HomeBannerServiceInputs): boolean {
  return input.activationReady !== false;
}
function primaryHidden(state: HomeBannerService, input: HomeBannerServiceInputs): boolean {
  const active = state.lifecycle.active;
  if (!active) return true;
  if (active.motion) return !active.motion.visible;
  const external = input.nonFolderPrimary;
  return !!external && external.generation === state.clock.generation
    && external.activationEpoch === active.activationEpoch && !external.visible;
}

/** Upper task phase only. Requests must already be installed. Pair with the
 * later scene phase; callers needing count validation use stepHomeBannerHost. */
export function advanceHomeBannerManagerPass(state: HomeBannerService, input: Omit<HomeBannerServiceInputs, 'request'>): HomeBannerService {
  let { lifecycle, stage, waitUpdates, loadDeferred } = state;
  if (!input.managerInhibited) {
    if (stage === 'active') {
      lifecycle = beginHomeBannerReplacement(lifecycle);
      if (lifecycle.phase === 'hiding') stage = 'hiding';
    } else if (stage === 'hiding') {
      // Native state2 checks actual visibility BEFORE updating the old object.
      // Entering state1 does not execute that gate in the same call.
      if (primaryHidden(state, input)) stage = 'gate';
    } else if (stage === 'gate') {
      const type = lifecycle.requested?.target.nativeType ?? 0;
      if (type !== 0) {
        if (lifecycle.phase === 'idle') lifecycle = beginHomeBannerReplacement(lifecycle);
        const bypass = type === 6 || type === 13;
        if (!bypass && input.loadInhibited) loadDeferred = true;
        else if (!bypass && waitUpdates < 5) waitUpdates++;
        else {
          if (!bypass && loadDeferred) {
            lifecycle = { ...lifecycle, requestPending: false };
            loadDeferred = false;
          }
          if (input.nativeWorkerReady) {
            lifecycle = releaseHomeBanner(lifecycle);
            stage = 'loading';
          }
        }
      }
    } else if (lifecycle.requested?.target.nativeType && input.nativeWorkerReady && activationReady(input) &&
      (lifecycle.requested.target.kind === 'clear' || resourceReady(state, input))) {
      // This branch occurs on a later pass than gate release, even for cached assets.
      lifecycle = activateHomeBanner(lifecycle, lifecycle.requested!.epoch);
      stage = 'active';
    }
    // A newly activated object is updated in this same manager call.
    lifecycle = advanceHomeBannerManager(lifecycle, 1);
  }
  return { ...state, lifecycle, stage, waitUpdates, loadDeferred };
}

/** Later global3D phase, completing one shared pass even when clips are gated.
 * The host pairs this with exactly one preceding manager phase. */
export function completeHomeBannerScenePass(state: HomeBannerService, input: Omit<HomeBannerServiceInputs, 'request'>): HomeBannerService {
  assertCount(state.clock.updateCount + 1);
  return { ...state, lifecycle: input.sceneInhibited ? state.lifecycle : advanceHomeBannerClips(state.lifecycle, 1),
    clock: { ...state.clock, updateCount: state.clock.updateCount + 1 } };
}

function advanceOne(state: HomeBannerService, input: HomeBannerServiceInputs): HomeBannerService {
  return completeHomeBannerScenePass(advanceHomeBannerManagerPass(state, input), input);
}

/** Constant inputs cover the entire batch. Split at every request/readiness/gate change. */
export function advanceHomeBannerService(state: HomeBannerService, updates: number, input: HomeBannerServiceInputs): HomeBannerService {
  assertCount(updates);
  assertCount(state.clock.updateCount + updates);
  let next = input.request ? requestHomeBannerService(state, input.request) : state;
  for (let i = 0; i < updates; i++) next = advanceOne(next, input);
  return next;
}

/** Consume a shared counter without accumulating elapsed wall time. A changed
 * generation resets all lifecycle/tickets and establishes a new baseline. The
 * host must resupply current selection/background setup for the new session.
 */
export function syncHomeBannerService(state: HomeBannerService, clock: HomeBannerServiceClock,
  input: HomeBannerServiceInputs): HomeBannerService {
  assertClock(clock);
  if (clock.generation !== state.clock.generation) return advanceHomeBannerService(createHomeBannerService(clock), 0, input);
  if (clock.updateCount < state.clock.updateCount) throw new RangeError('HOME banner counter reset requires a new generation');
  return advanceHomeBannerService(state, clock.updateCount - state.clock.updateCount, input);
}
