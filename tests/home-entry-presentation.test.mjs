import test from 'node:test';
import assert from 'node:assert/strict';
import { createPortfolioState } from '../src/os/system.ts';
import {
  acknowledgeHomeEntryBannerPresentation,
  acknowledgeHomeEntryFooterTerminal,
  bypassHomeEntryBannerPresentation,
  createHomeEntryPresentation,
  getHomeEntryFooterReadiness,
  sampleHomeEntryPresentation,
  HOME_ENTRY_FOOTER_LAST_FRAME,
  HOME_ENTRY_HUD_LAST_FRAME,
} from '../src/os/home-entry-presentation.ts';

const withSystem = (state, patch) => ({ ...state, system: { ...state.system, ...patch } });
const atCount = (state, updateCount) => withSystem(state, { homeClock: { ...state.system.homeClock, updateCount } });
const boot = (since = 100, updateCount = 77) => atCount(withSystem(createPortfolioState(), { since }), updateCount);
const home = state => withSystem(state, { phase: 'home' });

test('boot-owned HOME entry delays footer and HUD, then holds footer14 and HUD zero-alpha until their visible receipts', () => {
  const armed = sampleHomeEntryPresentation(createHomeEntryPresentation(), boot()).presentation;
  for (const [elapsed, footer, hud] of [
    // Footer SceneIn starts three updates and HUD SceneIn seven updates after entry (fitted).
    [0, 0, 0], [3, 0, 0], [7, 4, 0], [14, 11, 7], [17, 14, 10], [20, 14, 13], [27, 14, 20], [40, 14, 20], [75, 14, 20],
  ]) {
    const state = atCount(home(boot()), 77 + elapsed);
    const first = sampleHomeEntryPresentation(armed, state);
    const repaint = sampleHomeEntryPresentation(first.presentation, state);
    assert.deepEqual([first.footerSceneInFrame, first.hudSceneInFrame], [footer, hud]);
    assert.deepEqual(repaint, first);
  }
  const terminalState = atCount(home(boot()), 94);
  const terminal = sampleHomeEntryPresentation(armed, terminalState);
  const acknowledged = acknowledgeHomeEntryFooterTerminal(terminal, terminalState);
  assert.deepEqual(getHomeEntryFooterReadiness(acknowledged), { bootSince: 100, terminalAtUpdate: 94 });
  const bannerState = atCount(home(boot()), 97);
  const bannerSample = sampleHomeEntryPresentation(acknowledged, bannerState);
  const released = acknowledgeHomeEntryBannerPresentation(bannerSample, bannerState);
  assert.deepEqual(sampleHomeEntryPresentation(released, atCount(home(boot()), 104)), {
    presentation: released, footerSceneInFrame: null, hudSceneInFrame: 20,
  });
  assert.deepEqual(sampleHomeEntryPresentation(released, atCount(home(boot()), 124)), {
    presentation: released, footerSceneInFrame: null, hudSceneInFrame: 40,
  });
  assert.deepEqual(sampleHomeEntryPresentation(released, atCount(home(boot()), 125)), {
    presentation: released, footerSceneInFrame: null, hudSceneInFrame: null,
  });
});

test('delayed banner receipt replays authored HUD20 through40 from the retained HOME clock', () => {
  const base = boot(), armed = sampleHomeEntryPresentation(createHomeEntryPresentation(), base).presentation;
  const footerState = atCount(home(base), 152);
  const footer = acknowledgeHomeEntryFooterTerminal(sampleHomeEntryPresentation(armed, footerState), footerState);
  assert.equal(sampleHomeEntryPresentation(footer, footerState).hudSceneInFrame, 20);
  const bannerState = atCount(home(base), 155);
  const banner = acknowledgeHomeEntryBannerPresentation(sampleHomeEntryPresentation(footer, bannerState), bannerState);
  for (const [count, frame] of [[155,20],[156,21],[175,40]]) {
    assert.equal(sampleHomeEntryPresentation(banner, atCount(home(base), count)).hudSceneInFrame, frame);
  }
  assert.equal(sampleHomeEntryPresentation(banner, atCount(home(base), 176)).hudSceneInFrame, null);
});

test('no-dependent-native-banner bypass keeps the original HUD epoch', () => {
  const base = boot(), armed = sampleHomeEntryPresentation(createHomeEntryPresentation(), base).presentation;
  const footerState = atCount(home(base), 94);
  const footer = acknowledgeHomeEntryFooterTerminal(sampleHomeEntryPresentation(armed, footerState), footerState);
  const bypassState = atCount(home(base), 97);
  const bypassed = bypassHomeEntryBannerPresentation(sampleHomeEntryPresentation(footer, bypassState), bypassState);
  assert.equal(bypassed.bannerBypassed, true);
  assert.equal(sampleHomeEntryPresentation(bypassed, atCount(home(base), 124)).hudSceneInFrame, 40);
  assert.equal(sampleHomeEntryPresentation(bypassed, atCount(home(base), 125)).hudSceneInFrame, null);
});

test('warm boot identity owns its current shared-clock origin and replaces stale boot ownership', () => {
  const first = sampleHomeEntryPresentation(createHomeEntryPresentation(), boot(100, 77)).presentation;
  const replacement = sampleHomeEntryPresentation(first, boot(900, 932)).presentation;
  assert.deepEqual(replacement, { bootSince: 900, startedAtUpdate: 932,
    footerTerminalAtUpdate: null, bannerPresentedAtUpdate: null, bannerBypassed: false });
  assert.deepEqual(sampleHomeEntryPresentation(replacement, home(boot(900, 932))), {
    presentation: replacement, footerSceneInFrame: 0, hudSceneInFrame: 0,
  });
  const unobserved = sampleHomeEntryPresentation(createHomeEntryPresentation(), home(boot(900, 932)));
  assert.deepEqual(unobserved, { presentation: createHomeEntryPresentation(), footerSceneInFrame: null, hudSceneInFrame: null });
});

test('reduced motion selects authored endpoints without inventing an entry duration', () => {
  const state = boot(), armed = sampleHomeEntryPresentation(createHomeEntryPresentation(), state).presentation;
  const sample = sampleHomeEntryPresentation(armed, home(state), true);
  assert.deepEqual([sample.footerSceneInFrame, sample.hudSceneInFrame], [HOME_ENTRY_FOOTER_LAST_FRAME, HOME_ENTRY_HUD_LAST_FRAME]);
});

test('sleep retains a matching owner and resumes from the unchanged shared count', () => {
  const state = boot(), armed = sampleHomeEntryPresentation(createHomeEntryPresentation(), state).presentation;
  const sleepingBoot = withSystem(state, { sleeping: true });
  assert.equal(sampleHomeEntryPresentation(armed, sleepingBoot).presentation, armed);
  const sleepingHome = withSystem(home(state), { sleeping: true });
  const asleep = sampleHomeEntryPresentation(armed, sleepingHome);
  assert.equal(asleep.presentation, armed);
  assert.deepEqual([asleep.footerSceneInFrame, asleep.hudSceneInFrame], [null, null]);
  assert.deepEqual(sampleHomeEntryPresentation(asleep.presentation, home(state)), {
    presentation: armed, footerSceneInFrame: 0, hudSceneInFrame: 0,
  });
});

test('non-HOME contexts revoke entry ownership', () => {
  const state = boot(), armed = sampleHomeEntryPresentation(createHomeEntryPresentation(), state).presentation;
  const ordinary = home(state);
  const cases = [
    { ...ordinary, powered: false },
    { ...ordinary, opened: true },
    { ...ordinary, panel: 'settings' },
    withSystem(ordinary, { preferences: true }),
    withSystem(ordinary, { dialog: 'close' }),
    withSystem(ordinary, { app: 'camera' }),
    withSystem(ordinary, { pending: 'camera' }),
    withSystem(ordinary, { phase: 'launch' }),
    withSystem(ordinary, { phase: 'app' }),
    withSystem(ordinary, { phase: 'power' }),
    withSystem(ordinary, { phase: 'shutdown' }),
    withSystem(ordinary, { phase: 'off' }),
    withSystem(ordinary, { runtime: { ...ordinary.system.runtime, application: 'runtime:1' } }),
    withSystem(ordinary, { homeApplicationTransition: { intent: { kind: 'close' } } }),
    withSystem(ordinary, { homeFolderClose: { ...ordinary.system.homeFolderClose, current: {} } }),
  ];
  for (const candidate of cases) assert.equal(sampleHomeEntryPresentation(armed, candidate).presentation.bootSince, null);
});

test('same-identity clock rollback fails explicitly', () => {
  const armed = sampleHomeEntryPresentation(createHomeEntryPresentation(), boot(100, 77)).presentation;
  assert.throws(() => sampleHomeEntryPresentation(armed, boot(100, 76)), /moved backwards/);
  assert.throws(() => sampleHomeEntryPresentation(armed, home(boot(100, 76))), /moved backwards/);
  assert.throws(() => sampleHomeEntryPresentation(armed, atCount(boot(), -1)), /Invalid HOME entry update count/);
});

test('footer terminal receipts require the matching ordinary live entry sample', () => {
  const state = boot(), armed = sampleHomeEntryPresentation(createHomeEntryPresentation(), state).presentation;
  const entered = atCount(home(state), 94), terminal = sampleHomeEntryPresentation(armed, entered);
  assert.equal(terminal.footerSceneInFrame, HOME_ENTRY_FOOTER_LAST_FRAME);
  assert.throws(() => acknowledgeHomeEntryFooterTerminal(terminal, withSystem(entered, { sleeping: true })), /Invalid HOME entry/);
  assert.throws(() => acknowledgeHomeEntryFooterTerminal({ ...terminal, footerSceneInFrame: 13 }, entered), /Invalid HOME entry/);
  const receipt = acknowledgeHomeEntryFooterTerminal(terminal, entered);
  assert.equal(acknowledgeHomeEntryFooterTerminal({ ...terminal, presentation: receipt }, entered), receipt);
  assert.throws(() => acknowledgeHomeEntryBannerPresentation(terminal, entered), /Invalid HOME entry banner/);
  assert.throws(() => bypassHomeEntryBannerPresentation(terminal, entered), /Invalid HOME entry banner bypass/);
  assert.throws(() => acknowledgeHomeEntryBannerPresentation(
    { ...terminal, presentation: receipt }, withSystem(entered, { sleeping: true })), /Invalid HOME entry banner/);
  const banner = acknowledgeHomeEntryBannerPresentation({ ...terminal, presentation: receipt }, entered);
  assert.equal(acknowledgeHomeEntryBannerPresentation({ ...terminal, presentation: banner }, entered), banner);
});
