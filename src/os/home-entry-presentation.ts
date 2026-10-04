import type { MenuState } from './state.ts';

export const HOME_ENTRY_FOOTER_LAST_FRAME = 14 as const;
export const HOME_ENTRY_HUD_ZERO_ALPHA_FRAME = 20 as const;
export const HOME_ENTRY_HUD_LAST_FRAME = 40 as const;
/** Fitted to Azahar's HOME entry (5% playback, three frames per capture by
 * the wallpaper phase): footer SceneIn 0 lands about four frames after the
 * boot fade's terminal pose first shows and HUD SceneIn 0 about four frames
 * after the footer. Pose 20 shows one frame before HOME update 0, so these
 * are three and seven updates. The native caller remains untraced. */
export const HOME_ENTRY_FOOTER_DELAY_UPDATES = 3 as const;
export const HOME_ENTRY_HUD_DELAY_UPDATES = 7 as const;
/** Native activates the entry banner with the footer's terminal frame (N057).
 * A live presented footer frame 10 still releases the worker so loading can
 * occupy SceneIn 10..14. Activation is due on the live footer-14 sample so
 * scale 0.8 shares that paint; the four post-release manager stages no longer
 * each consume a later HOME update. Frame 14 still owns the terminal receipt.
 * Capture fit; adaptation. Do not retune labelled footer+3 / HUD+7. */
export const HOME_ENTRY_BANNER_RELEASE_FOOTER_FRAME = 10 as const;

export type HomeEntryPresentation = Readonly<{
  bootSince: number | null;
  startedAtUpdate: number | null;
  footerReleasedAtUpdate: number | null;
  footerTerminalAtUpdate: number | null;
  bannerPresentedAtUpdate: number | null;
  bannerBypassed: boolean;
}>;

export type HomeEntrySample = Readonly<{
  presentation: HomeEntryPresentation;
  footerSceneInFrame: number | null;
  hudSceneInFrame: number | null;
}>;

export type HomeEntryFooterReadiness = Readonly<{
  bootSince: number | null;
  releasedAtUpdate: number | null;
  terminalAtUpdate: number | null;
}>;

const EMPTY: HomeEntryPresentation = Object.freeze({
  bootSince: null, startedAtUpdate: null, footerReleasedAtUpdate: null, footerTerminalAtUpdate: null,
  bannerPresentedAtUpdate: null, bannerBypassed: false,
});
const emptySample = (presentation: HomeEntryPresentation = EMPTY): HomeEntrySample => Object.freeze({
  presentation, footerSceneInFrame: null, hudSceneInFrame: null,
});

export function createHomeEntryPresentation(): HomeEntryPresentation {
  return EMPTY;
}

function validUpdateCount(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError('Invalid HOME entry update count');
  return value;
}

function isOrdinaryRootHome(state: MenuState): boolean {
  const system = state.system;
  return !!system && state.powered && system.phase === 'home' && !state.opened && !state.panel
    && !system.preferences && !system.dialog && system.app === null && system.pending === null
    && system.runtime.application === null && system.homeApplicationTransition === null
    && system.homeFolderClose.current === null;
}

/**
 * Samples the source-authored HOME-entry clips from the shared HOME update
 * clock. The first awake boot observation owns the origin; paint itself never
 * advances a frame. One HOME update per source frame is an explicit scheduling
 * adaptation because the native clip caller cadence remains untraced.
 */
export function sampleHomeEntryPresentation(
  current: HomeEntryPresentation,
  state: MenuState,
  reduced = false,
): HomeEntrySample {
  const system = state.system;
  if (!system || !state.powered) return emptySample();

  const updateCount = validUpdateCount(system.homeClock.updateCount);
  if (system.phase === 'boot') {
    if (system.sleeping) return emptySample(current);
    if (current.bootSince === system.since) {
      if (current.startedAtUpdate === null) throw new Error('HOME entry owner has no update origin');
      if (updateCount < current.startedAtUpdate) throw new RangeError('HOME entry update clock moved backwards');
      return emptySample(current);
    }
    return emptySample(Object.freeze({
      bootSince: system.since, startedAtUpdate: updateCount,
      footerReleasedAtUpdate: null, footerTerminalAtUpdate: null, bannerPresentedAtUpdate: null, bannerBypassed: false,
    }));
  }

  if (!isOrdinaryRootHome(state)) return emptySample();
  if (system.sleeping || current.bootSince !== system.since || current.startedAtUpdate === null) return emptySample(current);

  const elapsed = updateCount - current.startedAtUpdate;
  if (elapsed < 0) throw new RangeError('HOME entry update clock moved backwards');
  const bannerPending = current.bannerPresentedAtUpdate === null && !current.bannerBypassed;
  const footerElapsed = Math.max(0, elapsed - HOME_ENTRY_FOOTER_DELAY_UPDATES);
  const hudElapsed = Math.max(0, elapsed - HOME_ENTRY_HUD_DELAY_UPDATES);
  const hudZeroAlphaAtUpdate = current.startedAtUpdate + HOME_ENTRY_HUD_DELAY_UPDATES + HOME_ENTRY_HUD_ZERO_ALPHA_FRAME;
  const hudStartAtUpdate = bannerPending ? null : current.bannerBypassed
    ? hudZeroAlphaAtUpdate
    : Math.max(hudZeroAlphaAtUpdate, current.bannerPresentedAtUpdate!);
  if (current.footerTerminalAtUpdate !== null && !bannerPending
    && (reduced ? elapsed > HOME_ENTRY_HUD_LAST_FRAME
      : updateCount > hudStartAtUpdate! + HOME_ENTRY_HUD_LAST_FRAME - HOME_ENTRY_HUD_ZERO_ALPHA_FRAME)) {
    return emptySample(current);
  }
  return Object.freeze({
    presentation: current,
    footerSceneInFrame: reduced ? HOME_ENTRY_FOOTER_LAST_FRAME
      : footerElapsed <= HOME_ENTRY_FOOTER_LAST_FRAME ? footerElapsed
      : current.footerTerminalAtUpdate === null ? HOME_ENTRY_FOOTER_LAST_FRAME : null,
    hudSceneInFrame: reduced ? HOME_ENTRY_HUD_LAST_FRAME
      : bannerPending ? Math.min(hudElapsed, HOME_ENTRY_HUD_ZERO_ALPHA_FRAME)
      : HOME_ENTRY_HUD_ZERO_ALPHA_FRAME + updateCount - hudStartAtUpdate!,
  });
}

/** Record only a successful live paired-screen draw of the source footer
 * terminal. A skipped clock interval therefore cannot release a dependent
 * banner before frame 14 has actually been painted. */
export function acknowledgeHomeEntryFooterTerminal(
  sample: HomeEntrySample,
  state: MenuState,
): HomeEntryPresentation {
  const system = state.system, current = sample.presentation;
  if (!system || system.sleeping || !isOrdinaryRootHome(state)
    || current.bootSince !== system.since || current.startedAtUpdate === null
    || sample.footerSceneInFrame !== HOME_ENTRY_FOOTER_LAST_FRAME) {
    throw new Error('Invalid HOME entry footer terminal receipt');
  }
  const updateCount = validUpdateCount(system.homeClock.updateCount);
  if (updateCount < current.startedAtUpdate) throw new RangeError('HOME entry update clock moved backwards');
  if (current.footerTerminalAtUpdate !== null) return current;
  return Object.freeze({ ...current, footerReleasedAtUpdate: current.footerReleasedAtUpdate ?? updateCount,
    footerTerminalAtUpdate: updateCount });
}

/** Record a successful live paired-screen draw of footer frame 10 or later.
 * It releases the banner worker so activation coincides with the terminal. */
export function acknowledgeHomeEntryFooterRelease(
  sample: HomeEntrySample,
  state: MenuState,
): HomeEntryPresentation {
  const system = state.system, current = sample.presentation;
  if (!system || system.sleeping || !isOrdinaryRootHome(state)
    || current.bootSince !== system.since || current.startedAtUpdate === null
    || sample.footerSceneInFrame === null || sample.footerSceneInFrame < HOME_ENTRY_BANNER_RELEASE_FOOTER_FRAME) {
    throw new Error('Invalid HOME entry footer release receipt');
  }
  const updateCount = validUpdateCount(system.homeClock.updateCount);
  if (updateCount < current.startedAtUpdate) throw new RangeError('HOME entry update clock moved backwards');
  if (current.footerReleasedAtUpdate !== null) return current;
  return Object.freeze({ ...current, footerReleasedAtUpdate: updateCount });
}

export function getHomeEntryFooterReadiness(current: HomeEntryPresentation): HomeEntryFooterReadiness {
  return Object.freeze({ bootSince: current.bootSince, releasedAtUpdate: current.footerReleasedAtUpdate,
    terminalAtUpdate: current.footerTerminalAtUpdate });
}

/** Ordinary hosts omit this and stay ready. A live entry sample is due only on
 * footer SceneIn 14 (or after that terminal receipt), so activation can share
 * the native N057 paint instead of consuming four later worker updates. */
export function homeEntryBannerActivationDue(sample: HomeEntrySample): boolean {
  const { presentation, footerSceneInFrame } = sample;
  if (presentation.startedAtUpdate === null) return true;
  if (presentation.bannerBypassed || presentation.bannerPresentedAtUpdate !== null) return true;
  return footerSceneInFrame === HOME_ENTRY_FOOTER_LAST_FRAME
    || presentation.footerTerminalAtUpdate !== null;
}

/** Release the HUD only after the matching native banner pixels have been
 * drawn into a live paired screen and that screen has been visibly presented. */
export function acknowledgeHomeEntryBannerPresentation(
  sample: HomeEntrySample,
  state: MenuState,
): HomeEntryPresentation {
  const system = state.system, current = sample.presentation;
  if (!system || system.sleeping || !isOrdinaryRootHome(state)
    || current.bootSince !== system.since || current.startedAtUpdate === null
    || current.footerTerminalAtUpdate === null) {
    throw new Error('Invalid HOME entry banner receipt');
  }
  const updateCount = validUpdateCount(system.homeClock.updateCount);
  if (updateCount < current.footerTerminalAtUpdate) throw new RangeError('HOME entry banner preceded footer terminal');
  if (current.bannerPresentedAtUpdate !== null || current.bannerBypassed) return current;
  return Object.freeze({ ...current, bannerPresentedAtUpdate: updateCount });
}

/** Resolve an entry whose selected content has no dependent native banner.
 * This is distinct from a draw receipt and keeps the original HUD epoch. */
export function bypassHomeEntryBannerPresentation(
  sample: HomeEntrySample,
  state: MenuState,
): HomeEntryPresentation {
  const system = state.system, current = sample.presentation;
  if (!system || system.sleeping || !isOrdinaryRootHome(state)
    || current.bootSince !== system.since || current.startedAtUpdate === null
    || current.footerTerminalAtUpdate === null) {
    throw new Error('Invalid HOME entry banner bypass');
  }
  const updateCount = validUpdateCount(system.homeClock.updateCount);
  if (updateCount < current.footerTerminalAtUpdate) throw new RangeError('HOME entry banner bypass preceded footer terminal');
  if (current.bannerPresentedAtUpdate !== null || current.bannerBypassed) return current;
  return Object.freeze({ ...current, bannerBypassed: true });
}
