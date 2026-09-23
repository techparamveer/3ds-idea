/** Pure normal HOME folder close. Native evidence: docs/native-folder-close-boundary.md.
 * Counts eligible passes, never milliseconds; owns no menu, banner or rendering state.
 */
export type HomeFolderCloseIdentity = Readonly<{ generation: string; transitionId: number }>;
export type HomeFolderCloseRestoration = Readonly<{
  restoredSelectionVisible: true;
  viewportDuration?: 5 | 10;
}> | Readonly<{
  restoredSelectionVisible: false;
  /** Caller owns the source acceleration counter; it cannot be inferred here. */
  viewportDuration: 5 | 10;
}>;
export type HomeFolderCloseEligibility = Readonly<{ taskEligible: boolean; layoutEligible: boolean }>;
export type HomeFolderCloseClip = Readonly<{
  frame: number;
  /** No frame has been applied by this transition until its first layout pass. */
  appliedFrame: number | null;
  /** Native +0x14: idle0, playing1, stopped2. Frame0 alone is not completion. */
  status: 0 | 1 | 2;
  endReached: boolean;
}>;
export type HomeFolderClose = Readonly<{
  identity: HomeFolderCloseIdentity;
  phase: 'closing' | 'viewport' | 'complete';
  folder: HomeFolderCloseClip;
  capture: HomeFolderCloseClip;
  restoredSelectionVisible: boolean;
  viewportDuration: 5 | 10 | null;
  viewportUpdates: number;
}>;
export type HomeFolderCloseObservation = Readonly<{
  identity: HomeFolderCloseIdentity;
}> & (Readonly<{
  kind: 'closeStarted';
  /** Begin is not a step. Integration owns its position in the shared update. */
  stepOffset: null;
}> | Readonly<{
  kind: 'rootRestored' | 'rootSelectionReady';
  /** Zero-based index within this operation; single-step observations use0. */
  stepOffset: number;
}>);
export type HomeFolderCloseResult = Readonly<{
  state: HomeFolderClose | null;
  observations: readonly HomeFolderCloseObservation[];
  /** Input steps represented, including inhibited steps; stops at completion.
   * Stale/null/already-complete operations, begin and cancel consume zero steps. */
  processedSteps: number;
}>;

function assertIdentity(identity: HomeFolderCloseIdentity): void {
  if (typeof identity.generation !== 'string' || !identity.generation
    || !Number.isSafeInteger(identity.transitionId) || identity.transitionId < 0) {
    throw new RangeError('Invalid HOME folder-close identity');
  }
}
function assertRestoration(restoration: HomeFolderCloseRestoration): void {
  if (typeof restoration.restoredSelectionVisible !== 'boolean'
    || (restoration.viewportDuration !== undefined && restoration.viewportDuration !== 5 && restoration.viewportDuration !== 10)
    || (!restoration.restoredSelectionVisible && restoration.viewportDuration === undefined)) {
    throw new RangeError('HOME folder-close restoration requires visibility and explicit viewport duration5 or10 when offscreen');
  }
}
function assertEligibility(input: HomeFolderCloseEligibility): void {
  if (typeof input.taskEligible !== 'boolean' || typeof input.layoutEligible !== 'boolean') {
    throw new RangeError('HOME folder-close requires explicit task and layout eligibility');
  }
}
function assertCount(updates: number): void {
  if (!Number.isSafeInteger(updates) || updates < 0) throw new RangeError('Invalid HOME folder-close update count');
}
function matches(state: HomeFolderClose | null, identity: HomeFolderCloseIdentity): boolean {
  return state !== null && state.identity.generation === identity.generation && state.identity.transitionId === identity.transitionId;
}
function result(state: HomeFolderClose | null, observations: HomeFolderCloseObservation[] = [], processedSteps = 0): HomeFolderCloseResult {
  return Object.freeze({ state, observations: Object.freeze(observations), processedSteps });
}
function startClip(frame: number): HomeFolderCloseClip {
  return Object.freeze({ frame, appliedFrame: null, status: 1, endReached: false });
}
function advanceClip(clip: HomeFolderCloseClip): HomeFolderCloseClip {
  if (clip.status === 0) return clip;
  // 0x269430 applies current frame before 0x1bbd94 advances the reverse clock.
  if (clip.status === 2) return Object.freeze({ ...clip, appliedFrame: clip.frame, status: 0 });
  if (clip.endReached) return Object.freeze({ ...clip, appliedFrame: clip.frame, status: 2 });
  const frame = Math.max(0, clip.frame - 1);
  return Object.freeze({ ...clip, appliedFrame: clip.frame, frame, endReached: frame === 0 });
}

/** Explicit authoritative begin: a different identity replaces the retained
 * transition. The same identity is idempotent, even after completion; its first
 * restoration plan wins. After cancellation, callers must mint a fresh identity.
 * Does not consume the setup update's later layout pass; integration supplies it.
 */
export function beginHomeFolderClose(current: HomeFolderClose | null, identity: HomeFolderCloseIdentity,
  restoration: HomeFolderCloseRestoration): HomeFolderCloseResult {
  assertIdentity(identity);
  assertRestoration(restoration);
  if (matches(current, identity)) return result(current);
  const state: HomeFolderClose = Object.freeze({
    identity: Object.freeze({ generation: identity.generation, transitionId: identity.transitionId }),
    phase: 'closing', folder: startClip(16), capture: startClip(8),
    restoredSelectionVisible: restoration.restoredSelectionVisible,
    viewportDuration: restoration.restoredSelectionVisible ? null : restoration.viewportDuration,
    viewportUpdates: 0,
  });
  return result(state, [Object.freeze({ kind: 'closeStarted', identity: state.identity, stepOffset: null })]);
}

function step(state: HomeFolderClose, input: HomeFolderCloseEligibility, stepOffset: number): HomeFolderCloseResult {
  let next = state;
  const observations: HomeFolderCloseObservation[] = [];
  const observe = (kind: 'rootRestored' | 'rootSelectionReady') => {
    observations.push(Object.freeze({ kind, identity: state.identity, stepOffset }));
  };
  if (input.taskEligible) {
    if (state.phase === 'closing' && state.folder.status === 0) {
      // 0x29f110: statuses1 AND2 block. Restoration disables later layout advances.
      next = Object.freeze({ ...state, phase: state.restoredSelectionVisible ? 'complete' : 'viewport' });
      observe('rootRestored');
      if (state.restoredSelectionVisible) observe('rootSelectionReady');
    } else if (state.phase === 'viewport') {
      const viewportUpdates = state.viewportUpdates + 1;
      const complete = viewportUpdates === state.viewportDuration;
      next = Object.freeze({ ...state, viewportUpdates, phase: complete ? 'complete' : 'viewport' });
      if (complete) observe('rootSelectionReady');
    }
  }
  // A task can restore root in this step; do not advance a now-hidden layout.
  if (next.phase === 'closing' && input.layoutEligible) {
    const folder = advanceClip(next.folder), capture = advanceClip(next.capture);
    if (folder !== next.folder || capture !== next.capture) next = Object.freeze({ ...next, folder, capture });
  }
  return result(next, observations, 1);
}

/** One lower-task predicate followed by one eligible layout pass. A stale
 * identity cannot advance or emit events for a replacement transition. */
export function stepHomeFolderClose(state: HomeFolderClose | null, identity: HomeFolderCloseIdentity,
  input: HomeFolderCloseEligibility): HomeFolderCloseResult {
  assertIdentity(identity);
  assertEligibility(input);
  if (!state || !matches(state, identity) || state.phase === 'complete') return result(state);
  return step(state, input, 0);
}

/** Constant eligibility for the whole batch; split at every eligibility change.
 * Observations preserve per-step offsets, not just the final selection. Stops at
 * completion so the caller can process remaining shared updates normally.
 */
export function advanceHomeFolderClose(state: HomeFolderClose | null, identity: HomeFolderCloseIdentity,
  updates: number, input: HomeFolderCloseEligibility): HomeFolderCloseResult {
  assertIdentity(identity);
  assertEligibility(input);
  assertCount(updates);
  if (!state || !matches(state, identity) || state.phase === 'complete') return result(state);
  let next = state;
  const observations: HomeFolderCloseObservation[] = [];
  for (let i = 0; i < updates; i++) {
    const advanced = step(next, input, i);
    observations.push(...advanced.observations);
    const after = advanced.state!;
    if (after.phase === 'complete') return result(after, observations, i + 1);
    // No change with constant inputs means later steps also have no effect.
    // This includes blocked passes and idle clips waiting for an eligible task.
    if (after === next) return result(next, observations, updates);
    next = after;
  }
  return result(next, observations, updates);
}

/** Cancellation drops the matching transition, never restores root or reports
 * readiness. Already-issued observations belong to the caller; none are replayed. */
export function cancelHomeFolderClose(state: HomeFolderClose | null, identity: HomeFolderCloseIdentity): HomeFolderCloseResult {
  assertIdentity(identity);
  return result(matches(state, identity) ? null : state);
}

/** Frozen immutable sample; no event emission, counter change or frame application. */
export function sampleHomeFolderClose(state: HomeFolderClose | null): HomeFolderClose | null {
  return state;
}
