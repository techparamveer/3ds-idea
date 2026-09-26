import { SLOT_COUNT, type MenuState } from './state.ts';
import type { HomeScrollObservation } from './home-scroll-consumer.ts';
import { isSystemHomeFolderClosing, sampleSystemHomeFolderClose } from './home-folder-close-system.ts';
import { FOLDER_SLOT_COUNT, folderHasItems, homeSlotAppId } from './home-layout.ts';
import { getHomeFolderIdentity, type HomeFolderIdentity } from './home-folder-identity.ts';
import { HOME_BANNER_EMPTY_KEY, type HomeBannerMotion, type HomeBannerTarget } from './home-banner-lifecycle.ts';
import {
  createHomeBannerService, getHomeBannerResourceTicket, requestHomeBannerService, syncHomeBannerService,
  advanceHomeBannerManagerPass, completeHomeBannerScenePass,
  type HomeBannerService, type HomeBannerServiceClock, type HomeBannerServiceInputs, type HomeBannerResourceTicket,
} from './home-banner-service.ts';

export type HomeFolderBannerSelection = Readonly<{
  kind: 'folder'; key: HomeFolderIdentity; label: string; nativeType: 9 | 10;
}>;
export type HomeDefaultBannerSelection = Readonly<{ kind: 'default' }>;
export type HomeClearBannerSelection = Readonly<{ kind: 'clear' }>;
type RenderSelection = HomeFolderBannerSelection | HomeDefaultBannerSelection;
export type HomeSettingsBannerSelection = Readonly<{ kind: 'app'; id: string }>;
type SupportedRenderSelection = RenderSelection | HomeSettingsBannerSelection;
type SupportedSelection = SupportedRenderSelection | HomeClearBannerSelection;
export type HomeToolbarBannerSelection = Readonly<{ kind: 'toolbar'; focus: number; category: number }>;
type UnsupportedSelection = Readonly<{ kind: 'app'; id: string }> | HomeToolbarBannerSelection;
export type HomeBannerHostSelection = SupportedSelection | UnsupportedSelection;
export type HomeBannerHostInputs = Pick<HomeBannerServiceInputs,
  'managerInhibited' | 'sceneInhibited' | 'loadInhibited' | 'nativeWorkerReady' | 'resourceReady'>;
export type HomeBannerHostPresentation = Readonly<{
  generation: string; requestEpoch: number; selection: SupportedSelection;
}>;
export type HomeBannerHostActivePresentation = Readonly<{
  generation: string; requestEpoch: number; activationEpoch: number; selection: SupportedRenderSelection;
}>;
export type HomeBannerHost = Readonly<{
  /** System session generation and last observed shared counter, including unsupported intervals. */
  clock: HomeBannerServiceClock;
  /** Monotonic supported-primary scope allocation within this System session. */
  scope: number;
  selection: HomeBannerHostSelection | null;
  inputs: HomeBannerHostInputs;
  service: HomeBannerService | null;
  /** Latest request snapshot, retained even after it activates. */
  pending: HomeBannerHostPresentation | null;
  active: HomeBannerHostActivePresentation | null;
}>;
export type HomeBannerHostBoundary = Readonly<{
  /** Omit to retain selection; panels/eligibility never imply clear or vacancy. */
  selection?: HomeBannerHostSelection;
  /** Replaces all retained inputs AFTER consuming this boundary's elapsed updates. */
  inputs?: HomeBannerHostInputs;
  /** An explicit prepared-label refresh for the same selected, active instance. */
  refreshActiveLabel?: Readonly<{
    generation: string; activationEpoch: number; key: HomeFolderIdentity; label: string;
  }>;
}>;
type SupportedView = Readonly<{
  generation: string;
  selection: SupportedSelection;
  resourceTicket: HomeBannerResourceTicket | null;
  stage: HomeBannerService['stage'];
  waitUpdates: number;
}>;
export type HomeBannerHostView =
  | Readonly<{ status: 'unsupported'; selection: UnsupportedSelection | null; resourceTicket: null }>
  | (SupportedView & Readonly<{ status: 'pending'; primary: null }>)
  | (SupportedView & Readonly<{ status: 'cleared'; primary: null; resourceTicket: null }>)
  | (SupportedView & Readonly<{
    status: 'active';
    /** This is the retained instance, which can differ from the incoming selection. */
    primary: HomeBannerHostActivePresentation & Readonly<{ motion: HomeBannerMotion }>;
  }>);

/** Resolve content only. Overlays, power, suspension and pass eligibility are host inputs. */
export function resolveHomeBannerHostSelection(state: MenuState): HomeBannerHostSelection {
  if (isSystemHomeFolderClosing(state)) return { kind: 'clear' };
  const slot = state.opened ? state.folderSelected : state.selected;
  return resolveContentAt(state, state.opened ? state.selected : null, slot);
}

const toolbarCategories = [2, 5, 4, 6, 7, 8, 2, 2] as const;
/** Resolve the actual lower-call snapshot, before completion replay can change
 * the selected slot. Content/identities must be from that same host pass.
 * Native service readiness gates are owned by the caller, not inferred here.
 */
export function resolveHomeBannerHostObservation(state: MenuState,
  observation: Extract<HomeScrollObservation, { kind: 'banner-resolve' }>): HomeBannerHostSelection {
  const { context, slot, focus, toolbarActive } = observation;
  if (context !== null && (!Number.isInteger(context) || context < 0 || context >= SLOT_COUNT)
    || !Number.isInteger(slot) || slot < 0 || slot >= (context === null ? SLOT_COUNT : FOLDER_SLOT_COUNT)
    || !Number.isInteger(focus) || focus < -1 || focus > 7 || typeof toolbarActive !== 'boolean'
    || toolbarActive && focus < 0) throw new RangeError('Invalid HOME banner resolver snapshot');
  if (toolbarActive) {
    const category = toolbarCategories[focus];
    // Category2 follows the existing default-banner path. Other toolbar packs
    // remain an explicit unsupported handoff, not the selected grid app.
    return category === 2 ? { kind: 'default' } : { kind: 'toolbar', focus, category };
  }
  return resolveContentAt(state, context, slot);
}

function resolveContentAt(state: MenuState, context: number | null, slot: number): HomeBannerHostSelection {
  const app = homeSlotAppId(state, slot, context);
  if (app) return { kind: 'app', id: app };
  if (context === null) {
    const key = getHomeFolderIdentity(state, slot);
    if (key !== undefined) return { kind: 'folder', key, label: state.folders[slot], nativeType: folderHasItems(state, slot) ? 10 : 9 };
  }
  return { kind: 'default' };
}

/** A completed close may restore selection inside one batched HOME-clock tick.
 * Consume old clear work up to this boundary before installing the restored
 * selection. No event queue, timer, or dependency on banner-clear completion.
 */
export function getHomeBannerCloseReadyUpdate(before: MenuState, after: MenuState): number | null {
  const previous = sampleSystemHomeFolderClose(before), next = sampleSystemHomeFolderClose(after);
  if (!previous || !next || previous.controller.identity.generation !== next.controller.identity.generation
    || previous.controller.identity.transitionId !== next.controller.identity.transitionId) return null;
  const ready = next.selectionReadyAtUpdate;
  return previous.selectionReadyAtUpdate === null && ready !== null
    && ready > before.system!.homeClock.updateCount && ready <= after.system!.homeClock.updateCount ? ready : null;
}

function assertClock(clock: HomeBannerServiceClock): void {
  if (!clock.generation || !Number.isSafeInteger(clock.updateCount) || clock.updateCount < 0) {
    throw new RangeError('Invalid HOME banner host clock');
  }
}
function retainInputs(inputs: HomeBannerHostInputs, service: HomeBannerService | null, previous?: HomeBannerHostInputs): HomeBannerHostInputs {
  const expected = service && getHomeBannerResourceTicket(service), ready = inputs.resourceReady;
  const matches = (ticket: HomeBannerResourceTicket | null | undefined) => !!expected && !!ticket
    && ticket.generation === expected.generation && ticket.requestEpoch === expected.requestEpoch;
  // Null deliberately revokes readiness. A stale completion cannot revoke a newer acknowledgement.
  const accepted = ready === null ? null : matches(ready) ? expected : matches(previous?.resourceReady) ? expected : null;
  // Copy only supported fields; a service request must never sneak into a later batch.
  return {
    managerInhibited: inputs.managerInhibited, sceneInhibited: inputs.sceneInhibited,
    loadInhibited: inputs.loadInhibited, nativeWorkerReady: inputs.nativeWorkerReady,
    resourceReady: accepted ? { ...accepted } : null,
  };
}
function copySelection(selection: HomeBannerHostSelection): HomeBannerHostSelection {
  if (selection.kind === 'folder' && selection.key && typeof selection.label === 'string' && (selection.nativeType === 9 || selection.nativeType === 10)) {
    return { kind: 'folder', key: selection.key, label: selection.label, nativeType: selection.nativeType };
  }
  if (selection.kind === 'app' && selection.id) return { kind: 'app', id: selection.id };
  if (selection.kind === 'toolbar' && Number.isInteger(selection.focus) && selection.focus >= 1 && selection.focus <= 5
    && selection.category === toolbarCategories[selection.focus]) return { kind: 'toolbar', focus: selection.focus, category: selection.category };
  if (selection.kind === 'default' || selection.kind === 'clear') return { kind: selection.kind };
  throw new RangeError('Unsupported HOME banner host selection');
}
function sameFolder(a: HomeFolderBannerSelection, b: HomeFolderBannerSelection): boolean {
  return a.key === b.key && a.nativeType === b.nativeType;
}
function targetFor(selection: SupportedSelection): HomeBannerTarget {
  if (selection.kind === 'folder') return { kind: 'folder', key: selection.key, nativeType: selection.nativeType };
  if (selection.kind === 'app') return { kind: 'app', key: selection.id, nativeType: 1 };
  return selection.kind === 'default'
    ? { kind: 'default', key: HOME_BANNER_EMPTY_KEY, nativeType: 7 }
    : { kind: 'clear', key: HOME_BANNER_EMPTY_KEY, nativeType: 13 };
}

export function createHomeBannerHost(clock: HomeBannerServiceClock, inputs: HomeBannerHostInputs): HomeBannerHost {
  assertClock(clock);
  return { clock: { ...clock }, scope: 0, selection: null, inputs: retainInputs(inputs, null), service: null, pending: null, active: null };
}

function activePresentation(service: HomeBannerService, pending: HomeBannerHostPresentation | null,
  previous: HomeBannerHostActivePresentation | null): HomeBannerHostActivePresentation | null {
  const instance = service.lifecycle.active;
  if (!instance) return null;
  if (previous?.activationEpoch === instance.activationEpoch) return previous;
  if (!pending || pending.selection.kind === 'clear' || pending.requestEpoch !== instance.requestEpoch || pending.generation !== service.clock.generation) {
    throw new Error('Missing HOME primary activation presentation');
  }
  return { ...pending, selection: pending.selection, activationEpoch: instance.activationEpoch };
}

/** One ordinary input→upper manager→lower boundary→global3D pass. Boundaries
 * are explicit observations supplied by the host, never inferred from time.
 * A lower request cannot affect the manager pass that has already happened.
 * Session replacement uses create/cross first; this function consumes only the
 * immediately following count in the current session. */
export function stepHomeBannerHost(host: HomeBannerHost, clock: HomeBannerServiceClock,
  boundaries: Readonly<{ beforeManager?: HomeBannerHostBoundary; afterManager?: HomeBannerHostBoundary }> = {}): HomeBannerHost {
  assertClock(clock);
  if (clock.generation !== host.clock.generation || clock.updateCount !== host.clock.updateCount + 1) {
    throw new RangeError('HOME banner pass requires the next count in its current generation');
  }
  let next = crossHomeBannerBoundary(host, host.clock, boundaries.beforeManager);
  if (next.service) {
    const service = advanceHomeBannerManagerPass(next.service, next.inputs);
    next = { ...next, service, active: activePresentation(service, next.pending, next.active) };
  }
  next = crossHomeBannerBoundary(next, next.clock, boundaries.afterManager);
  const service = next.service && completeHomeBannerScenePass(next.service, next.inputs);
  return { ...next, clock: { ...clock }, service };
}

/** Browser handoff after native input ends the bounded pass. Account for the
 * shared count without inventing the unexecuted manager/global3D phases. */
export function skipHomeBannerHostPass(host: HomeBannerHost, clock: HomeBannerServiceClock): HomeBannerHost {
  assertClock(clock);
  if (clock.generation !== host.clock.generation || clock.updateCount !== host.clock.updateCount + 1) {
    throw new RangeError('HOME banner skipped pass requires the next count in its current generation');
  }
  return { ...host, clock: { ...clock }, service: host.service && { ...host.service,
    clock: { ...host.service.clock, updateCount: clock.updateCount } } };
}

/** First settle the old request/inputs; only then install boundary observations. */
export function crossHomeBannerBoundary(host: HomeBannerHost, clock: HomeBannerServiceClock,
  boundary: HomeBannerHostBoundary = {}): HomeBannerHost {
  assertClock(clock);
  if (clock.generation !== host.clock.generation) host = createHomeBannerHost(clock, boundary.inputs ?? host.inputs);
  else if (clock.updateCount < host.clock.updateCount) throw new RangeError('HOME banner counter reset requires a new System generation');

  let { service, pending, active, scope } = host;
  if (service) {
    service = syncHomeBannerService(service, { generation: service.clock.generation, updateCount: clock.updateCount }, host.inputs);
    active = activePresentation(service, pending, active);
  }

  const selection = boundary.selection === undefined ? host.selection : copySelection(boundary.selection);
  if (!selection || selection.kind === 'app' && !['system-settings', 'camera'].includes(selection.id) || selection.kind === 'toolbar') {
    // Authored unsupported handoff: no guessed type, fade or hidden acknowledgement.
    return { clock: { ...clock }, scope, selection, inputs: retainInputs(boundary.inputs ?? host.inputs, null), service: null, pending: null, active: null };
  }
  if (!service) {
    if (!Number.isSafeInteger(scope + 1)) throw new RangeError('HOME primary scope allocation exhausted');
    scope++;
    // Tuple encoding cannot collide when session strings contain arbitrary separators.
    service = createHomeBannerService({ generation: JSON.stringify(['home-primary-scope', clock.generation, scope]), updateCount: clock.updateCount });
  }
  const requested = requestHomeBannerService(service, { target: targetFor(selection) });
  if (requested !== service) {
    pending = { generation: requested.clock.generation, requestEpoch: requested.lifecycle.requested!.epoch, selection: { ...selection } };
  }
  service = requested;
  const refresh = boundary.refreshActiveLabel;
  if (refresh && selection.kind === 'folder' && active?.selection.kind === 'folder' && service.stage === 'active' && sameFolder(selection, active.selection)
    && refresh.generation === active.generation && refresh.activationEpoch === active.activationEpoch && refresh.key === active.selection.key) {
    active = { ...active, selection: { ...active.selection, label: refresh.label } };
    if (pending?.selection.kind === 'folder' && sameFolder(pending.selection, selection)) pending = { ...pending, selection: { ...pending.selection, label: refresh.label } };
  }
  return { clock: { ...clock }, scope, selection, service, pending, active, inputs: retainInputs(boundary.inputs ?? host.inputs, service, host.inputs) };
}

/** Sampling never requests, acknowledges resources, or advances either native pass. */
export function getHomeBannerHostView(host: HomeBannerHost): HomeBannerHostView {
  const { service, selection, active } = host;
  if (!service || !selection || selection.kind === 'app' && !['system-settings', 'camera'].includes(selection.id) || selection.kind === 'toolbar') {
    return { status: 'unsupported', selection: selection?.kind === 'app' || selection?.kind === 'toolbar' ? selection : null, resourceTicket: null };
  }
  const common = { generation: service.clock.generation, selection, resourceTicket: getHomeBannerResourceTicket(service), stage: service.stage, waitUpdates: service.waitUpdates };
  const motion = service.lifecycle.active?.motion;
  if (active && motion) return { ...common, status: 'active', primary: { ...active, motion } };
  if (service.stage === 'active' && !service.lifecycle.requestPending && service.lifecycle.requested?.target.kind === 'clear') {
    return { ...common, status: 'cleared', primary: null, resourceTicket: null };
  }
  return { ...common, status: 'pending', primary: null };
}
