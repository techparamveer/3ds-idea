import type { HomeBannerHostView, HomeFolderBannerSelection } from './home-banner-host.ts';
import { advanceHomeBannerClips, advanceHomeBannerManager, createHomeBannerLifecycle, setHomeBannerVisibility, HOME_BANNER_PERIOD,
  type HomeBannerLifecycle } from './home-banner-lifecycle.ts';
import { HOME_FOLDER_ENTRY_LAST_FRAME, type HomeEntryMotion } from './home-entry-motion.ts';
import type { HomeViewRecord } from './home-navigation.ts';

export type HomeFolderEntryBannerOwner = Readonly<{
  folder: string; firmwareGeneration: number; systemGeneration: number; application: string | null;
  navigationRevision: number; closeSequence: number;
  /** Child navigation retains this immutable record; root selection/re-entry replaces it. */
  rootView: Readonly<HomeViewRecord>;
}>;
type FolderPrimary = Extract<HomeBannerHostView, { status: 'active' }>['primary'] & Readonly<{ selection: HomeFolderBannerSelection }>;
export type HomeFolderEntryBannerSource = Readonly<{
  owner: HomeFolderEntryBannerOwner; primary: FolderPrimary; lifecycle: HomeBannerLifecycle;
}>;
export type HomeFolderEntryBannerPose = HomeFolderEntryBannerSource & Readonly<{
  elapsedUpdates: number; ticket: number; phase: 'entry' | 'hiding' | 'hidden';
}>;
export type HomeFolderEntryBannerRelease = Readonly<{ owner: HomeFolderEntryBannerOwner; ticket: number }>;

export function homeFolderEntryBannerDestinationReady(view: HomeBannerHostView | undefined): boolean {
  if (!view || view.status !== 'active' || view.stage !== 'active' || view.selection.kind === 'clear'
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
  return Object.freeze({ owner: Object.freeze({ ...owner }), primary, lifecycle });
}

/** Source ordering puts child refresh after lower-controller completion.
 * Lower-terminal receipt starts the original normal visibility producer. One
 * producer pass per receipt and this start boundary are browser adaptations. */
export function createHomeFolderEntryBanner() {
  let source: HomeFolderEntryBannerSource | null = null;
  let entry: HomeFolderEntryBannerSource | null = null, presented: HomeFolderEntryBannerPose | null = null;
  let pending: HomeFolderEntryBannerPose | null = null, ticket = 0, disposed = false, rebase = true;
  let release: HomeFolderEntryBannerRelease | null = null, releasedOwner: HomeFolderEntryBannerOwner | null = null;
  const revoke = () => { ticket++; pending = null; release = null; rebase = true; };
  const complete = (owner: HomeFolderEntryBannerOwner | null) => !disposed && (sameEntryScope(releasedOwner, owner)
    || sameOwner(entry?.owner ?? null, owner) && presented?.phase === 'hidden' && !presented.primary.motion.visible);
  return {
    complete,
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
    presentRoot(candidate: HomeFolderEntryBannerSource | null, owner: HomeFolderEntryBannerOwner | null): boolean {
      if (disposed || candidate && !sameOwner(candidate.owner, owner)) return false;
      revoke(); source = candidate; entry = null; presented = null; releasedOwner = null; return !!candidate;
    },
    sample(owner: HomeFolderEntryBannerOwner, motion: HomeEntryMotion, destinationReady = true,
      reducedMotion = false): HomeFolderEntryBannerPose | null {
      if (disposed) return null;
      if (typeof reducedMotion !== 'boolean') throw Error('Invalid folder-entry reduced motion');
      if (!owner.rootView) throw Error('Invalid folder-entry banner owner');
      if (motion.identity.kind !== 'folder' || motion.identity.folder !== owner.folder) throw Error('Stale folder-entry banner motion');
      if (sameEntryScope(releasedOwner, owner)) return null;
      if (!sameOwner(entry?.owner ?? null, owner) && !complete(owner)) {
        if (!source || !sameScope(source.owner, owner) || source.owner.navigationRevision + 1 !== owner.navigationRevision) {
          throw Error('Folder entry has no matching presented root banner');
        }
        revoke(); entry = { ...source, owner: Object.freeze({ ...owner }) }; source = null; presented = null;
      }
      if (!entry) throw Error('Folder entry has no retained banner');
      if (complete(owner) && !rebase && destinationReady) return null;
      if (pending) return pending;
      const previous = presented ?? entry;
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
        lifecycle = advanceHomeBannerClips(advanceHomeBannerManager(lifecycle, 1), 1);
        if (phase === 'hiding' && !lifecycle.active?.motion?.visible) phase = 'hidden';
      }
      const nextMotion = lifecycle.active?.motion;
      if (!nextMotion) throw Error('Native retained folder-entry banner unavailable');
      pending = Object.freeze({ owner: Object.freeze({ ...owner }), primary: Object.freeze({ ...entry.primary, motion: nextMotion }),
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
      return release ??= Object.freeze({ owner: Object.freeze({ ...owner }), ticket });
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
