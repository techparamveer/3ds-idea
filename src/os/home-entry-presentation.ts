import type { MenuState } from './state.ts';

export const HOME_ENTRY_FOOTER_LAST_FRAME = 14 as const;
export const HOME_ENTRY_HUD_ZERO_ALPHA_FRAME = 20 as const;
export const HOME_ENTRY_HUD_LAST_FRAME = 40 as const;
/** Fitted to Azahar's HOME entry (5% playback; footer/HUD bands and the
 * wallpaper phase against browser update deltas): footer SceneIn 0 lands
 * three updates after the boot fade's terminal pose and HUD SceneIn 0 nine
 * updates after it. The native caller remains untraced; adaptations. */
export const HOME_ENTRY_FOOTER_DELAY_UPDATES = 3 as const;
export const HOME_ENTRY_HUD_DELAY_UPDATES = 9 as const;

export type HomeEntryPresentation = Readonly<{
  bootSince: number | null;
  startedAtUpdate: number | null;
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
  terminalAtUpdate: number | null;
}>;

const EMPTY: HomeEntryPresentation = Object.freeze({
  bootSince: null, startedAtUpdate: null, footerTerminalAtUpdate: null,
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
      footerTerminalAtUpdate: null, bannerPresentedAtUpdate: null, bannerBypassed: false,
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
  return Object.freeze({ ...current, footerTerminalAtUpdate: updateCount });
}

export function getHomeEntryFooterReadiness(current: HomeEntryPresentation): HomeEntryFooterReadiness {
  return Object.freeze({ bootSince: current.bootSince, terminalAtUpdate: current.footerTerminalAtUpdate });
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
