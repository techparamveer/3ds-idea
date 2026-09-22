/** Pure HOME banner lifecycle. Inputs are native update counts, never milliseconds.
 * Native addresses, integration ordering and unmeasured scheduling are documented
 * in docs/native-banner-lifecycle.md. This does not own the HOME selection reducer.
 */
export const HOME_BANNER_PERIOD = 600;
export const HOME_BANNER_BG_SCENE_IN_SETTLED_FRAME = 19;
const FOLDER_INITIAL_YAW = -0.010471975430846214; // float32 bits 0xbc2b92a6

export type HomeBannerTarget = Readonly<{
  kind: 'folder' | 'app' | 'blank';
  /** Stable identity, not its displayed name or current grid slot. */
  key: string;
  /** Ordinary folders use 9 (empty) or 10 (nonempty), mapped variants 11/12. */
  nativeType: number;
}>;

export type HomeBannerRequest = Readonly<{
  target: HomeBannerTarget;
  epoch: number;
  managerUpdate: number;
  optionA: number;
  optionB: number;
  forceReload: boolean;
}>;

export type HomeBannerClip = Readonly<{
  duration: number;
  looping: boolean;
  frame: number;
  /** Native controller +0x14: idle, playing, or the one-update stop state. */
  status: 0 | 1 | 2;
  endReached: boolean;
  /** Restart generation within this controller instance. Resume preserves it. */
  epoch: number;
  startedAtSceneUpdate: number | null;
  updates: number;
}>;

export type HomeFolderBannerMotion = Readonly<{
  requestedVisible: boolean;
  visible: boolean;
  visibilityEpoch: number;
  visibilityManagerUpdate: number;
  visibilityCounter: number;
  visibilityProgress: number;
  scale: number;
  yawCounter: number;
  yawRadians: number;
  yawEpoch: number;
  yawResetManagerUpdate: number;
  skeletal: HomeBannerClip;
  material: HomeBannerClip;
}>;

export type HomeBannerInstance = Readonly<{
  target: HomeBannerTarget;
  activationEpoch: number;
  requestEpoch: number;
  activatedAtManagerUpdate: number;
  activatedAtSceneUpdate: number;
  /** App/blank banner geometry and motion are outside this folder adapter. */
  folder: HomeFolderBannerMotion | null;
}>;

export type HomeBannerLifecycle = Readonly<{
  requested: HomeBannerRequest | null;
  requestPending: boolean;
  phase: 'idle' | 'active' | 'hiding' | 'loading';
  activationEpoch: number;
  managerUpdates: number;
  sceneUpdates: number;
  active: HomeBannerInstance | null;
  background: Readonly<{
    attached: boolean;
    mode: 0 | 1 | 2;
    sceneIn: HomeBannerClip;
    loop: HomeBannerClip;
    appPause: HomeBannerClip;
  }>;
}>;

function count(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError('Invalid native update count');
}

/** Counter value after a native update; unlike the old time adapter, adds no tick. */
export function homeBannerYawAtCounter(counter: number): number {
  count(counter);
  const phase = counter % HOME_BANNER_PERIOD;
  if (phase === 0) return 0; // native integer negation converts zero to positive float32 zero
  return Math.fround(Math.fround(Math.fround(-phase * Math.fround(Math.PI)) * 2) * Math.fround(1 / 600));
}

function clip(duration: number, looping: boolean): HomeBannerClip {
  return { duration, looping, frame: 0, status: 0, endReached: false,
    epoch: 0, startedAtSceneUpdate: null, updates: 0 };
}

function startClip(value: HomeBannerClip, sceneUpdate: number, frame = 0): HomeBannerClip {
  return { ...value, frame, status: 1, endReached: false, epoch: value.epoch + 1,
    startedAtSceneUpdate: sceneUpdate, updates: 0 };
}

function pauseClip(value: HomeBannerClip): HomeBannerClip {
  return { ...value, status: 2 };
}

function advanceClip(value: HomeBannerClip): HomeBannerClip {
  const next = { ...value, updates: value.updates + 1 };
  if (value.status !== 1) return { ...next, status: 0 };
  if (value.looping) return { ...next, frame: (value.frame + 1) % value.duration };
  // 0x1bbde4: reaching the end and reporting completion take separate updates.
  if (value.endReached) return { ...next, status: 2 };
  const frame = Math.min(value.duration, value.frame + 1);
  return { ...next, frame, endReached: frame === value.duration };
}

export function createHomeBannerLifecycle(): HomeBannerLifecycle {
  return { requested: null, requestPending: false, phase: 'idle', activationEpoch: 0,
    managerUpdates: 0, sceneUpdates: 0, active: null,
    background: { attached: false, mode: 2, sceneIn: clip(20, false),
      loop: clip(HOME_BANNER_PERIOD, true), appPause: clip(20, false) } };
}

function sameTarget(a: HomeBannerTarget, b: HomeBannerTarget): boolean {
  return a.kind === b.kind && a.key === b.key && a.nativeType === b.nativeType;
}

/** Queue selection separately from activation. No banner clock changes here. */
export function requestHomeBanner(state: HomeBannerLifecycle, target: HomeBannerTarget,
  options: { optionA?: number; optionB?: number; forceReload?: boolean } = {}): HomeBannerLifecycle {
  const { optionA = 0, optionB = 0, forceReload = false } = options;
  const previous = state.requested;
  if (!forceReload && previous && sameTarget(previous.target, target)
    && previous.optionA === optionA && previous.optionB === optionB) return state;
  return { ...state, requested: { target: { ...target }, epoch: (previous?.epoch ?? 0) + 1,
    managerUpdate: state.managerUpdates, optionA, optionB, forceReload }, requestPending: true };
}

function requestVisibility(folder: HomeFolderBannerMotion, visible: boolean, update: number): HomeFolderBannerMotion {
  // 0x1f9e64 resets only when actual +0x3c is clear, for either requested value.
  return folder.visible ? { ...folder, requestedVisible: visible } : {
    ...folder, requestedVisible: visible, yawCounter: 0, yawRadians: FOLDER_INITIAL_YAW,
    yawEpoch: folder.yawEpoch + 1, yawResetManagerUpdate: update,
  };
}

/** Consume the pending request at the host's manager boundary. Once hiding has
 * begun, returning to the old key does not cancel the native replacement path. */
export function beginHomeBannerReplacement(state: HomeBannerLifecycle): HomeBannerLifecycle {
  if (!state.requestPending || !state.requested || state.phase === 'hiding' || state.phase === 'loading') return state;
  if (state.active?.folder && sameTarget(state.active.target, state.requested.target) && !state.requested.forceReload) {
    return { ...state, requestPending: false };
  }
  if (!state.active) return { ...state, phase: 'loading', requestPending: false };
  const folder = state.active.folder;
  return { ...state, phase: 'hiding', requestPending: false, active: { ...state.active,
    folder: folder ? requestVisibility(folder, false, state.managerUpdates) : null } };
}

/** Explicit native primary-slot release. The asynchronous load gate is owned by
 * the host; reaching hidden alone does not invent an activation deadline. */
export function releaseHomeBanner(state: HomeBannerLifecycle): HomeBannerLifecycle {
  if (state.phase !== 'hiding' || state.active?.folder?.visible) return state;
  return { ...state, phase: 'loading', active: null };
}

/** Commit a ready request; stale loader callbacks cannot activate an old target.
 * The host must release a hidden previous banner first. No implicit update here. */
export function activateHomeBanner(state: HomeBannerLifecycle, requestEpoch: number): HomeBannerLifecycle {
  if (state.phase !== 'loading' || !state.requested || requestEpoch !== state.requested.epoch) return state;
  const activationEpoch = state.activationEpoch + 1;
  const folder: HomeFolderBannerMotion | null = state.requested.target.kind !== 'folder' ? null : {
    requestedVisible: true, visible: false, visibilityEpoch: 0, visibilityManagerUpdate: state.managerUpdates,
    visibilityCounter: 0, visibilityProgress: 0, scale: 1, yawCounter: 0,
    yawRadians: FOLDER_INITIAL_YAW, yawEpoch: 1, yawResetManagerUpdate: state.managerUpdates,
    skeletal: startClip(clip(HOME_BANNER_PERIOD, true), state.sceneUpdates),
    material: startClip(clip(HOME_BANNER_PERIOD, true), state.sceneUpdates),
  };
  return { ...state, phase: 'active', activationEpoch, requestPending: false, active: {
    target: state.requested.target, activationEpoch, requestEpoch,
    activatedAtManagerUpdate: state.managerUpdates, activatedAtSceneUpdate: state.sceneUpdates, folder,
  } };
}

/** Requested visibility is not actual attachment. Immediate matches 0x1f7c60
 * and deliberately preserves yaw; the normal request matches 0x1f9e64. */
export function setHomeBannerVisibility(state: HomeBannerLifecycle, visible: boolean,
  immediate = false): HomeBannerLifecycle {
  const active = state.active, folder = active?.folder;
  if (!active || !folder) return state;
  const next = immediate ? { ...folder, requestedVisible: visible, visible,
    visibilityCounter: folder.visible ? 4 : 0,
    visibilityEpoch: folder.visibilityEpoch + Number(folder.visible !== visible),
    visibilityManagerUpdate: folder.visible !== visible ? state.managerUpdates : folder.visibilityManagerUpdate,
  } : requestVisibility(folder, visible, state.managerUpdates);
  return { ...state, active: { ...active, folder: next } };
}

function advanceFolder(folder: HomeFolderBannerMotion, update: number): HomeFolderBannerMotion {
  let visible = folder.visible, visibilityCounter = folder.visibilityCounter;
  let visibilityProgress = folder.visibilityProgress, scale = folder.scale;
  let writeScale = false;
  if (folder.requestedVisible) {
    if (!visible) { visible = true; visibilityCounter = 0; }
    if (visibilityCounter > 4) visibilityCounter = 4;
    else { visibilityProgress = visibilityCounter * .25; visibilityCounter++; writeScale = true; }
  } else {
    if (visible && visibilityCounter <= 0) { visible = false; visibilityCounter = 4; }
    if (visibilityCounter > 0) {
      visibilityCounter = Math.min(visibilityCounter, 4) - 1;
      visibilityProgress = visibilityCounter * .25; writeScale = true;
    }
  }
  // 0x1fa344 uses VMLA with float32 0.8 and 0x3e4ccccc (not rounded JS 0.2).
  if (writeScale) scale = Math.fround(Math.fround(.8) + Math.fround(visibilityProgress * 0.19999998807907104));
  const yawCounter = (folder.yawCounter + 1) % HOME_BANNER_PERIOD;
  return { ...folder, visible, visibilityCounter, visibilityProgress, scale, yawCounter,
    yawRadians: homeBannerYawAtCounter(yawCounter),
    visibilityEpoch: folder.visibilityEpoch + Number(folder.visible !== visible),
    visibilityManagerUpdate: folder.visible !== visible ? update : folder.visibilityManagerUpdate };
}

/** One count means one eligible native manager update. Global manager inhibition
 * freezes this path, while the scene clip pass remains independently callable. */
export function advanceHomeBannerManager(state: HomeBannerLifecycle, updates = 1,
  enabled = true): HomeBannerLifecycle {
  count(updates);
  if (!enabled || updates === 0) return state;
  let next = state;
  for (let i = 0; i < updates; i++) {
    const managerUpdates = next.managerUpdates + 1, active = next.active;
    next = { ...next, managerUpdates, active: active?.folder
      ? { ...active, folder: advanceFolder(active.folder, managerUpdates) } : active };
  }
  return next;
}

/** Separate native visible-scene pass. A hidden retained folder still gets yaw
 * updates above but is absent from the controller list traversed by 0x103850. */
export function advanceHomeBannerClips(state: HomeBannerLifecycle, updates = 1): HomeBannerLifecycle {
  count(updates);
  let next = state;
  for (let i = 0; i < updates; i++) {
    const active = next.active, folder = active?.folder, background = next.background;
    next = { ...next, sceneUpdates: next.sceneUpdates + 1,
      active: active && folder?.visible ? { ...active, folder: { ...folder,
        skeletal: advanceClip(folder.skeletal), material: advanceClip(folder.material) } } : active,
      background: background.attached ? { ...background, sceneIn: advanceClip(background.sceneIn),
        loop: advanceClip(background.loop), appPause: advanceClip(background.appPause) } : background };
  }
  return next;
}

export function setHomeBannerBackgroundAttached(state: HomeBannerLifecycle, attached: boolean): HomeBannerLifecycle {
  return state.background.attached === attached ? state : { ...state, background: { ...state.background, attached } };
}

/** Native SceneIn start then optional duration-1 seek. It is not a pause. */
export function showHomeBannerBackground(state: HomeBannerLifecycle, animated: boolean): HomeBannerLifecycle {
  return { ...state, background: { ...state.background,
    sceneIn: startClip(state.background.sceneIn, state.sceneUpdates,
      animated ? 0 : HOME_BANNER_BG_SCENE_IN_SETTLED_FRAME) } };
}

/** 0x1ed1c4: same-mode requests preserve phase; an actual return to mode 0
 * restarts Loop, while mode 1 pauses Loop and starts AppPause. */
export function setHomeBannerBackgroundMode(state: HomeBannerLifecycle, mode: 0 | 1): HomeBannerLifecycle {
  const background = state.background;
  if (background.mode === mode) return state;
  return { ...state, background: { ...background, mode,
    loop: mode === 0 ? startClip(background.loop, state.sceneUpdates) : pauseClip(background.loop),
    appPause: mode === 1 ? startClip(background.appPause, state.sceneUpdates) : pauseClip(background.appPause) } };
}

/** Explicit 0x24dc14 restart, also used by the native AppQuit-completion path. */
export function startHomeBannerBackgroundLoop(state: HomeBannerLifecycle): HomeBannerLifecycle {
  return { ...state, background: { ...state.background,
    loop: startClip(state.background.loop, state.sceneUpdates) } };
}

/** 0x24da2c calls play (+0x14), unlike start (+0x10); preserve frame/epoch. */
export function resumeHomeBannerBackgroundLoop(state: HomeBannerLifecycle): HomeBannerLifecycle {
  return { ...state, background: { ...state.background,
    loop: { ...state.background.loop, status: 1, endReached: false } } };
}
