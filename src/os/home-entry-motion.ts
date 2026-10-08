import type { HomeApplicationTransitionPresentation } from './home-application-transition.ts';

export const HOME_FOLDER_ENTRY_LAST_FRAME = 16;
export const HOME_FOLDER_CAPTURE_ENTRY_LAST_FRAME = 8;
export const HOME_PAUSE_ENTRY_LAST_FRAME = 20;
// Browser policy: tolerate one missed nominal 20 FPS pair (two 3-update gaps).
// Larger unobserved jumps rebase without spending motion, not native duration.
export const HOME_ENTRY_MAX_OBSERVED_UPDATE_GAP = 6;

export type HomeEntryMotionIdentity = Readonly<{ kind: 'folder'; folder: string }>
  | Readonly<{ kind: 'pause'; owner: string; captureGeneration: number }>;
export type HomeEntryMotion = Readonly<{
  identity: HomeEntryMotionIdentity;
  observedUpdate: number;
  elapsedUpdates: number;
}>;
export type HomeFolderEntryPose = Readonly<{ folderFrame: number; captureFrame: number }>;
export type HomePauseEntryPresentation = Readonly<{
  skeletal: readonly [Readonly<{ clip: 'BannerBG_SceneIn'; frame: 20 }>];
  material: readonly [Readonly<{ clip: 'BannerBG_AppPause'; frame: number }>];
}>;
export type HomeSuspendedBackgroundPresentation = HomePauseEntryPresentation | HomeApplicationTransitionPresentation;

function sameIdentity(a: HomeEntryMotionIdentity, b: HomeEntryMotionIdentity): boolean {
  return a.kind === 'folder' ? b.kind === 'folder' && a.folder === b.folder
    : b.kind === 'pause' && a.owner === b.owner && a.captureGeneration === b.captureGeneration;
}

export function homeEntryMotionMatches(motion: HomeEntryMotion | null, identity: HomeEntryMotionIdentity | null): boolean {
  return !!motion && !!identity && sameIdentity(motion.identity, identity);
}

export function homeEntryMotionActive(motion: HomeEntryMotion | null, reduced = false): boolean {
  return !reduced && !!motion && motion.elapsedUpdates < (motion.identity.kind === 'folder'
    ? HOME_FOLDER_ENTRY_LAST_FRAME : HOME_PAUSE_ENTRY_LAST_FRAME);
}

/** A successful Canvas pair stays selected until its render receipt. */
export function sampleHomeEntryMotionCandidate(presented: HomeEntryMotion | null, pending: HomeEntryMotion | null,
  identity: HomeEntryMotionIdentity | null, updateCount: number, eligible: boolean,
  rebase = false, reduced = false): HomeEntryMotion | null {
  const sample = sampleHomeEntryMotion(presented, identity, updateCount, eligible && !(rebase && homeEntryMotionMatches(presented, identity)));
  if (sample && eligible && reduced) return Object.freeze({ ...sample, elapsedUpdates: sample.identity.kind === 'folder'
    ? HOME_FOLDER_ENTRY_LAST_FRAME : HOME_PAUSE_ENTRY_LAST_FRAME });
  return homeEntryMotionMatches(pending, identity) ? pending : sample;
}

/** Receipt rebasing never spends the time that the pair waited offscreen. */
export function acknowledgeHomeEntryMotionCandidate(candidate: HomeEntryMotion | null,
  identity: HomeEntryMotionIdentity | null, updateCount: number, eligible: boolean): HomeEntryMotion | null {
  if (!Number.isSafeInteger(updateCount) || updateCount < 0) throw new RangeError('Invalid HOME entry-motion receipt count');
  if (!eligible || !candidate || !homeEntryMotionMatches(candidate, identity) || updateCount < candidate.observedUpdate) return null;
  return Object.freeze({ ...candidate, observedUpdate: updateCount });
}

/** Samples the existing HOME clock. First successful live pair owns frame zero.
 * Folder entry follows bounded eligible nominal-60-Hz HOME deltas; that cadence
 * and pause's existing one-step-per-receipt policy are browser adaptations. */
export function sampleHomeEntryMotion(current: HomeEntryMotion | null,
  identity: HomeEntryMotionIdentity | null, updateCount: number, eligible: boolean): HomeEntryMotion | null {
  if (!Number.isSafeInteger(updateCount) || updateCount < 0) throw new RangeError('Invalid HOME entry-motion update count');
  if (typeof eligible !== 'boolean') throw new TypeError('HOME entry motion requires explicit eligibility');
  if (!identity) return null;
  if (identity.kind === 'folder' ? !identity.folder : !identity.owner
    || !Number.isSafeInteger(identity.captureGeneration) || identity.captureGeneration < 0) {
    throw new RangeError('Invalid HOME entry-motion owner');
  }
  if (!current || !sameIdentity(current.identity, identity)) {
    return eligible ? Object.freeze({ identity: Object.freeze({ ...identity }), observedUpdate: updateCount, elapsedUpdates: 0 }) : null;
  }
  if (updateCount < current.observedUpdate) throw new RangeError('HOME entry-motion clock moved backwards');
  if (updateCount === current.observedUpdate) return current;
  const updates = updateCount - current.observedUpdate;
  const elapsedUpdates = current.elapsedUpdates + (eligible && updates <= HOME_ENTRY_MAX_OBSERVED_UPDATE_GAP
    ? identity.kind === 'folder' ? updates : 1
    : 0);
  return Object.freeze({ ...current, observedUpdate: updateCount,
    elapsedUpdates });
}

export function homeFolderEntryPose(motion: HomeEntryMotion | null, reduced = false): HomeFolderEntryPose | null {
  if (motion?.identity.kind !== 'folder') return null;
  return Object.freeze({
    folderFrame: reduced ? HOME_FOLDER_ENTRY_LAST_FRAME : Math.min(HOME_FOLDER_ENTRY_LAST_FRAME, motion.elapsedUpdates),
    captureFrame: reduced ? HOME_FOLDER_CAPTURE_ENTRY_LAST_FRAME : Math.min(HOME_FOLDER_CAPTURE_ENTRY_LAST_FRAME, motion.elapsedUpdates),
  });
}

export function homePauseEntryPresentation(motion: HomeEntryMotion | null, reduced = false): HomePauseEntryPresentation | null {
  if (motion?.identity.kind !== 'pause') return null;
  return Object.freeze({
    skeletal: Object.freeze([Object.freeze({ clip: 'BannerBG_SceneIn', frame: 20 })] as const),
    material: Object.freeze([Object.freeze({ clip: 'BannerBG_AppPause',
      frame: reduced ? HOME_PAUSE_ENTRY_LAST_FRAME : Math.min(HOME_PAUSE_ENTRY_LAST_FRAME, motion.elapsedUpdates) })] as const),
  });
}
