import type { MenuState } from './state.ts';
import { folderHasItems, homeSlotAppId } from './home-layout.ts';
import { getHomeFolderIdentity, type HomeFolderIdentity } from './home-folder-identity.ts';
import { HOME_BANNER_EMPTY_KEY, type HomeBannerMotion, type HomeBannerTarget } from './home-banner-lifecycle.ts';
import {
  createHomeBannerService, getHomeBannerResourceTicket, requestHomeBannerService, syncHomeBannerService,
  type HomeBannerService, type HomeBannerServiceClock, type HomeBannerServiceInputs, type HomeBannerResourceTicket,
} from './home-banner-service.ts';

export type HomeFolderBannerSelection = Readonly<{
  kind: 'folder'; key: HomeFolderIdentity; label: string; nativeType: 9 | 10;
}>;
export type HomeDefaultBannerSelection = Readonly<{ kind: 'default' }>;
export type HomeClearBannerSelection = Readonly<{ kind: 'clear' }>;
type RenderSelection = HomeFolderBannerSelection | HomeDefaultBannerSelection;
type SupportedSelection = RenderSelection | HomeClearBannerSelection;
export type HomeBannerHostSelection = SupportedSelection | Readonly<{ kind: 'app'; id: string }>;
export type HomeBannerHostInputs = Pick<HomeBannerServiceInputs,
  'managerInhibited' | 'sceneInhibited' | 'loadInhibited' | 'nativeWorkerReady' | 'resourceReady'>;
export type HomeBannerHostPresentation = Readonly<{
  generation: string; requestEpoch: number; selection: SupportedSelection;
}>;
export type HomeBannerHostActivePresentation = Readonly<{
  generation: string; requestEpoch: number; activationEpoch: number; selection: RenderSelection;
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
  | Readonly<{ status: 'unsupported'; selection: Extract<HomeBannerHostSelection, { kind: 'app' }> | null; resourceTicket: null }>
  | (SupportedView & Readonly<{ status: 'pending'; primary: null }>)
  | (SupportedView & Readonly<{ status: 'cleared'; primary: null; resourceTicket: null }>)
  | (SupportedView & Readonly<{
    status: 'active';
    /** This is the retained instance, which can differ from the incoming selection. */
    primary: HomeBannerHostActivePresentation & Readonly<{ motion: HomeBannerMotion }>;
  }>);

/** Resolve content only. Overlays, power, suspension and pass eligibility are host inputs. */
export function resolveHomeBannerHostSelection(state: MenuState): HomeBannerHostSelection {
  const slot = state.opened ? state.folderSelected : state.selected;
  const app = homeSlotAppId(state, slot, state.opened ? state.selected : null);
  if (app) return { kind: 'app', id: app };
  if (!state.opened) {
    const key = getHomeFolderIdentity(state, slot);
    if (key !== undefined) return { kind: 'folder', key, label: state.folders[slot], nativeType: folderHasItems(state, slot) ? 10 : 9 };
  }
  return { kind: 'default' };
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
  if (selection.kind === 'default' || selection.kind === 'clear') return { kind: selection.kind };
  throw new RangeError('Unsupported HOME banner host selection');
}
function sameFolder(a: HomeFolderBannerSelection, b: HomeFolderBannerSelection): boolean {
  return a.key === b.key && a.nativeType === b.nativeType;
}
function targetFor(selection: SupportedSelection): HomeBannerTarget {
  if (selection.kind === 'folder') return { kind: 'folder', key: selection.key, nativeType: selection.nativeType };
  return selection.kind === 'default'
    ? { kind: 'default', key: HOME_BANNER_EMPTY_KEY, nativeType: 7 }
    : { kind: 'clear', key: HOME_BANNER_EMPTY_KEY, nativeType: 13 };
}

export function createHomeBannerHost(clock: HomeBannerServiceClock, inputs: HomeBannerHostInputs): HomeBannerHost {
  assertClock(clock);
  return { clock: { ...clock }, scope: 0, selection: null, inputs: retainInputs(inputs, null), service: null, pending: null, active: null };
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
    const instance = service.lifecycle.active;
    if (!instance) active = null;
    else if (!active || active.activationEpoch !== instance.activationEpoch) {
      if (!pending || pending.selection.kind === 'clear' || pending.requestEpoch !== instance.requestEpoch || pending.generation !== service.clock.generation) {
        throw new Error('Missing HOME primary activation presentation');
      }
      active = { ...pending, selection: pending.selection, activationEpoch: instance.activationEpoch };
    }
  }

  const selection = boundary.selection === undefined ? host.selection : copySelection(boundary.selection);
  if (!selection || selection.kind === 'app') {
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
  if (!service || !selection || selection.kind === 'app') return { status: 'unsupported', selection: selection?.kind === 'app' ? selection : null, resourceTicket: null };
  const common = { generation: service.clock.generation, selection, resourceTicket: getHomeBannerResourceTicket(service), stage: service.stage, waitUpdates: service.waitUpdates };
  const motion = service.lifecycle.active?.motion;
  if (active && motion) return { ...common, status: 'active', primary: { ...active, motion } };
  if (service.stage === 'active' && !service.lifecycle.requestPending && service.lifecycle.requested?.target.kind === 'clear') {
    return { ...common, status: 'cleared', primary: null, resourceTicket: null };
  }
  return { ...common, status: 'pending', primary: null };
}
