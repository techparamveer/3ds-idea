import type { HomeBannerHostSelection, HomeBannerHostView, HomeFolderBannerSelection } from './home-banner-host.ts';
import { advanceHomeBannerClips, advanceHomeBannerManager, createHomeBannerLifecycle, setHomeBannerVisibility, HOME_BANNER_PERIOD,
  type HomeBannerLifecycle } from './home-banner-lifecycle.ts';
import { HOME_FOLDER_ENTRY_LAST_FRAME, type HomeEntryMotion } from './home-entry-motion.ts';
import type { HomeViewRecord } from './home-navigation.ts';
import type { HomeGesture } from './home-gestures.ts';
import type { HomeLocation } from './home-layout.ts';

export type HomeFolderEntryBannerOwner = Readonly<{
  folder: string; firmwareGeneration: number; systemGeneration: number; application: string | null;
  navigationRevision: number; closeSequence: number;
  /** Child navigation retains this immutable record; root selection/re-entry replaces it. */
  rootView: Readonly<HomeViewRecord>;
}>;
type FolderPrimary = Extract<HomeBannerHostView, { status: 'active' }>['primary'] & Readonly<{ selection: HomeFolderBannerSelection }>;
export type HomeFolderEntryBannerSource = Readonly<{
  kind: 'folder'; owner: HomeFolderEntryBannerOwner; primary: FolderPrimary; lifecycle: HomeBannerLifecycle;
}>;
export type HomeFolderEntryHeldStroke = Readonly<Pick<HomeGesture, 'pointerId' | 'startedAt' | 'startX' | 'startY'> & {
  source: Readonly<HomeLocation>; app: string; folderSlot: number;
}>;
type HeldSource = Readonly<{
  kind: 'held'; owner: HomeFolderEntryBannerOwner;
  primary: Extract<HomeBannerHostView, { status: 'active' }>['primary'];
  stroke: HomeFolderEntryHeldStroke; entryRevision: number;
}>;
export type HomeFolderEntryRootSource = HomeFolderEntryBannerSource | HeldSource;
export type HomeFolderEntryBannerPose = HomeFolderEntryRootSource & Readonly<{
  elapsedUpdates: number; ticket: number; phase: 'entry' | 'hiding' | 'hidden';
}>;
export type HomeFolderEntryBannerRelease = Readonly<{ owner: HomeFolderEntryBannerOwner; ticket: number; kind: HomeFolderEntryRootSource['kind'] }>;

function sameSelection(a: HomeBannerHostSelection, b: HomeBannerHostSelection): boolean {
  return a.kind === 'default' ? b.kind === 'default' : a.kind === 'clear' ? b.kind === 'clear'
    : a.kind === 'folder' ? b.kind === 'folder' && a.key === b.key
    : a.kind === 'app' ? b.kind === 'app' && a.id === b.id : b.kind === 'toolbar' && a.focus === b.focus;
}
export function homeFolderEntryBannerDestinationReady(view: HomeBannerHostView | undefined,
  selection?: HomeBannerHostSelection): boolean {
  if (!view || view.status !== 'active' || view.stage !== 'active' || view.selection.kind === 'clear'
    || selection && !sameSelection(view.selection, selection)
    || view.selection.kind === 'folder' || !view.primary.motion.visible || !view.primary.motion.requestedVisible
    || view.primary.generation !== view.generation
    || view.resourceTicket?.generation !== view.primary.generation || view.resourceTicket.requestEpoch !== view.primary.requestEpoch) return false;
  const selected = view.selection, primary = view.primary.selection;
  return selected.kind === 'default' ? primary.kind === 'default'
    : selected.kind === 'app' ? primary.kind === 'app' && selected.id === primary.id
    : primary.kind === 'toolbar' && selected.focus === primary.focus;
}

function sameScope(a: HomeFolderEntryBannerOwner | null, b: HomeFolderEntryBannerOwner | null): boolean {
  return !!a && !!b && a.folder === b.folder && a.firmwareGeneration === b.firmwareGeneration
    && a.systemGeneration === b.systemGeneration && a.application === b.application && a.closeSequence === b.closeSequence;
}
function sameOwner(a: HomeFolderEntryBannerOwner | null, b: HomeFolderEntryBannerOwner | null): boolean {
  return sameEntryScope(a, b) && a?.navigationRevision === b?.navigationRevision;
}
function sameEntryScope(a: HomeFolderEntryBannerOwner | null, b: HomeFolderEntryBannerOwner | null): boolean {
  return sameScope(a, b) && a?.rootView === b?.rootView;
}
function sameStroke(a: HomeFolderEntryHeldStroke, b: HomeFolderEntryHeldStroke | null): boolean {
  return !!b && a.pointerId === b.pointerId && a.startedAt === b.startedAt && a.startX === b.startX && a.startY === b.startY
    && a.source.folder === b.source.folder && a.source.slot === b.source.slot && a.app === b.app && a.folderSlot === b.folderSlot;
}

function advanceRetainedBanner(lifecycle: HomeBannerLifecycle, updates: number): HomeBannerLifecycle {
  let next = lifecycle;
  for (let update = 0; update < updates; update++) {
    next = advanceHomeBannerClips(advanceHomeBannerManager(next, 1), 1);
  }
  return next;
}

/** Preparation is not publication. The caller must have drawn this exact
 * native primary and acknowledge its paired WebGL render separately. */
export function homeFolderEntryBannerSource(owner: HomeFolderEntryBannerOwner, view: HomeBannerHostView,
  updateCount: number): HomeFolderEntryBannerSource | null {
  if (!owner.folder || !Number.isSafeInteger(owner.firmwareGeneration) || owner.firmwareGeneration < 0
    || !Number.isSafeInteger(owner.systemGeneration) || owner.systemGeneration < 0
    || !Number.isSafeInteger(owner.navigationRevision) || owner.navigationRevision < 0
    || !Number.isSafeInteger(owner.closeSequence) || owner.closeSequence < 0
    || !Number.isSafeInteger(updateCount) || updateCount < 0 || !owner.rootView) throw Error('Invalid folder-entry banner owner');
  if (view.status !== 'active' || view.stage !== 'active' || view.selection.kind !== 'folder'
    || view.selection.key !== owner.folder || view.primary.selection.kind !== 'folder'
    || view.primary.selection.key !== owner.folder || view.primary.generation !== view.generation
    || view.resourceTicket?.generation !== view.primary.generation
    || view.resourceTicket.requestEpoch !== view.primary.requestEpoch
    || !view.primary.motion.visible || !view.primary.motion.requestedVisible) return null;
  const motion = view.primary.motion;
  if (motion.skeletal.duration !== HOME_BANNER_PERIOD || !motion.skeletal.looping
    || motion.material.duration !== HOME_BANNER_PERIOD || !motion.material.looping) {
    throw Error('Native folder-entry banner clips unavailable');
  }
  // Original visible-in advances counter4 to5 before the following clamp call.
  if (!Number.isSafeInteger(motion.visibilityCounter) || motion.visibilityCounter < 0 || motion.visibilityCounter > 5) {
    throw Error('Native folder-entry visibility counter unavailable');
  }
  const primary = Object.freeze({ ...view.primary, selection: Object.freeze({ ...view.primary.selection }),
    motion: Object.freeze({ ...motion, skeletal: Object.freeze({ ...motion.skeletal }), material: Object.freeze({ ...motion.material }) }) });
  const lifecycle: HomeBannerLifecycle = { ...createHomeBannerLifecycle(), phase: 'active',
    managerUpdates: updateCount, sceneUpdates: updateCount,
    active: { target: { kind: 'folder', key: primary.selection.key, nativeType: primary.selection.nativeType },
      activationEpoch: primary.activationEpoch, requestEpoch: primary.requestEpoch,
      activatedAtManagerUpdate: updateCount, activatedAtSceneUpdate: updateCount, motion: primary.motion } };
  return Object.freeze({ kind: 'folder', owner: Object.freeze({ ...owner }), primary, lifecycle });
}

/** The held-root painter publishes wallpaper/HUD without a title. Its native
 * primary is an identity guard only; it must never supply invented upper pixels. */
export function homeFolderEntryHeldSource(owner: HomeFolderEntryBannerOwner, view: HomeBannerHostView,
  stroke: HomeFolderEntryHeldStroke, selection: HomeBannerHostSelection): HomeFolderEntryRootSource | null {
  if (view.status !== 'active' || view.stage !== 'active' || !sameSelection(view.selection, selection)
    || !sameSelection(view.primary.selection, selection)
    || view.primary.generation !== view.generation || view.resourceTicket?.generation !== view.primary.generation
    || view.resourceTicket.requestEpoch !== view.primary.requestEpoch || !view.primary.motion.visible
    || !view.primary.motion.requestedVisible) return null;
  return Object.freeze({ kind: 'held', owner: Object.freeze({ ...owner }), primary: view.primary,
    stroke: Object.freeze({ ...stroke, source: Object.freeze({ ...stroke.source }) }),
    entryRevision: owner.navigationRevision + (owner.rootView.selectedSlot === stroke.folderSlot ? 1 : 2) });
}

/** Source ordering puts child refresh after lower-controller completion.
 * The lower-terminal receipt starts the original normal visibility producer;
 * that exact receipt boundary remains a browser adaptation. */
export function createHomeFolderEntryBanner() {
  let source: HomeFolderEntryRootSource | null = null;
  let entry: HomeFolderEntryRootSource | null = null, presented: HomeFolderEntryBannerPose | null = null;
  let pending: HomeFolderEntryBannerPose | null = null, ticket = 0, disposed = false, rebase = true;
  let release: HomeFolderEntryBannerRelease | null = null, releasedOwner: HomeFolderEntryBannerOwner | null = null;
  const revoke = () => { ticket++; pending = null; release = null; rebase = true; };
  const complete = (owner: HomeFolderEntryBannerOwner | null) => !disposed && (sameEntryScope(releasedOwner, owner)
    || sameOwner(entry?.owner ?? null, owner) && presented?.phase === 'hidden'
      && (presented.kind === 'held' || !presented.primary.motion.visible));
  return {
    complete,
    destinationReady(view: HomeBannerHostView | undefined, owner: HomeFolderEntryBannerOwner | null,
      selection: HomeBannerHostSelection): boolean {
      if (!homeFolderEntryBannerDestinationReady(view, selection) || view?.status !== 'active') return false;
      const retained = sameEntryScope(entry?.owner ?? null, owner) ? entry : null;
      return retained?.kind !== 'held' || retained.primary.generation !== view.primary.generation
        || retained.primary.requestEpoch !== view.primary.requestEpoch || retained.primary.activationEpoch !== view.primary.activationEpoch;
    },
    requestReady(owner: HomeFolderEntryBannerOwner | null): boolean {
      return !disposed && (sameEntryScope(releasedOwner, owner) || !rebase && !!presented
        && presented.elapsedUpdates >= HOME_FOLDER_ENTRY_LAST_FRAME
        && sameOwner(entry?.owner ?? null, owner));
    },
    activationReady(owner: HomeFolderEntryBannerOwner | null): boolean {
      return !disposed && (sameEntryScope(releasedOwner, owner) || !rebase && complete(owner));
    },
    active(owner: HomeFolderEntryBannerOwner | null): boolean {
      return !disposed && !sameEntryScope(releasedOwner, owner)
        && (entry ? sameEntryScope(entry.owner, owner) : sameScope(source?.owner ?? null, owner));
    },
    presentRoot(candidate: HomeFolderEntryRootSource | null, owner: HomeFolderEntryBannerOwner | null,
      stroke: HomeFolderEntryHeldStroke | null = null): boolean {
      if (disposed || candidate && (!sameOwner(candidate.owner, owner) || candidate.kind === 'held' && !sameStroke(candidate.stroke, stroke))) return false;
      revoke(); source = candidate; entry = null; presented = null; releasedOwner = null; return !!candidate;
    },
    sample(owner: HomeFolderEntryBannerOwner, motion: HomeEntryMotion, destinationReady = true,
      reducedMotion = false, stroke: HomeFolderEntryHeldStroke | null = null): HomeFolderEntryBannerPose | null {
      if (disposed) return null;
      if (typeof reducedMotion !== 'boolean') throw Error('Invalid folder-entry reduced motion');
      if (!owner.rootView) throw Error('Invalid folder-entry banner owner');
      if (motion.identity.kind !== 'folder' || motion.identity.folder !== owner.folder) throw Error('Stale folder-entry banner motion');
      if (sameEntryScope(releasedOwner, owner)) return null;
      if (!sameOwner(entry?.owner ?? null, owner) && !complete(owner)) {
        if (!source || !sameScope(source.owner, owner)
          || (source.kind === 'folder' ? source.owner.navigationRevision + 1 !== owner.navigationRevision
            : source.entryRevision !== owner.navigationRevision || !sameStroke(source.stroke, stroke))) {
          throw Error('Folder entry has no matching presented root banner');
        }
        revoke(); entry = { ...source, owner: Object.freeze({ ...owner }) }; source = null; presented = null;
      }
      if (!entry) throw Error('Folder entry has no retained banner');
      if (complete(owner) && !rebase && destinationReady) return null;
      if (pending) return pending;
      if (entry.kind === 'held') {
        if (!sameStroke(entry.stroke, stroke)) throw Error('Folder entry has no matching held root stroke');
        pending = Object.freeze({ ...entry, elapsedUpdates: motion.elapsedUpdates,
          phase: motion.elapsedUpdates >= HOME_FOLDER_ENTRY_LAST_FRAME ? 'hidden' : 'entry', ticket });
        return pending;
      }
      const previous = presented ?? entry;
      if (previous.kind !== 'folder') throw Error('Stale folder-entry banner source');
      let lifecycle = previous.lifecycle, phase = presented?.phase ?? 'entry';
      if (reducedMotion && (phase !== 'entry' || presented && presented.elapsedUpdates >= HOME_FOLDER_ENTRY_LAST_FRAME)) {
        if (lifecycle.active?.motion?.requestedVisible) lifecycle = setHomeBannerVisibility(lifecycle, false);
        // Accessibility seeks the real detach endpoint, without publishing it.
        while (lifecycle.active?.motion?.visible) lifecycle = advanceHomeBannerClips(advanceHomeBannerManager(lifecycle, 1), 1);
        phase = 'hidden';
      } else if (!reducedMotion && presented && !rebase && motion.elapsedUpdates > presented.elapsedUpdates) {
        if (phase === 'entry' && presented.elapsedUpdates >= HOME_FOLDER_ENTRY_LAST_FRAME) {
          lifecycle = setHomeBannerVisibility(lifecycle, false); phase = 'hiding';
        }
        lifecycle = advanceRetainedBanner(lifecycle, motion.elapsedUpdates - presented.elapsedUpdates);
        if (phase === 'hiding' && !lifecycle.active?.motion?.visible) phase = 'hidden';
      }
      const nextMotion = lifecycle.active?.motion;
      if (!nextMotion) throw Error('Native retained folder-entry banner unavailable');
      pending = Object.freeze({ kind: 'folder', owner: Object.freeze({ ...owner }), primary: Object.freeze({ ...entry.primary, motion: nextMotion }),
        lifecycle, elapsedUpdates: motion.elapsedUpdates, phase, ticket });
      return pending;
    },
    present(candidate: HomeFolderEntryBannerPose, owner: HomeFolderEntryBannerOwner | null, motion: HomeEntryMotion): boolean {
      if (disposed || candidate !== pending || candidate.ticket !== ticket || !sameOwner(candidate.owner, owner)
        || motion.identity.kind !== 'folder' || motion.identity.folder !== candidate.owner.folder
        || motion.elapsedUpdates !== candidate.elapsedUpdates) return false;
      presented = candidate; pending = null; rebase = false; return true;
    },
    sampleRelease(owner: HomeFolderEntryBannerOwner): HomeFolderEntryBannerRelease | null {
      if (!entry || !complete(owner) || rebase || pending || sameEntryScope(releasedOwner, owner)) return null;
      return release ??= Object.freeze({ owner: Object.freeze({ ...owner }), ticket, kind: entry.kind });
    },
    presentRelease(candidate: HomeFolderEntryBannerRelease, owner: HomeFolderEntryBannerOwner | null): boolean {
      if (disposed || candidate !== release || candidate.ticket !== ticket || !sameOwner(candidate.owner, owner)
        || !complete(owner) || rebase || pending) return false;
      releasedOwner = candidate.owner; entry = null; presented = null; release = null; return true;
    },
    revoke,
    leave() { if (entry || releasedOwner) { revoke(); source = null; entry = null; presented = null; releasedOwner = null; } },
    reset() { revoke(); source = null; entry = null; presented = null; releasedOwner = null; },
    dispose() { disposed = true; revoke(); source = null; entry = null; presented = null; releasedOwner = null; },
  };
}
