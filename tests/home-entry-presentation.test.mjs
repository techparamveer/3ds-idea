import test from 'node:test';
import assert from 'node:assert/strict';
import { createPortfolioState } from '../src/os/system.ts';
import {
  createHomeEntryPresentation,
  sampleHomeEntryPresentation,
  HOME_ENTRY_FOOTER_LAST_FRAME,
  HOME_ENTRY_HUD_LAST_FRAME,
} from '../src/os/home-entry-presentation.ts';

const withSystem = (state, patch) => ({ ...state, system: { ...state.system, ...patch } });
const atCount = (state, updateCount) => withSystem(state, { homeClock: { ...state.system.homeClock, updateCount } });
const boot = (since = 100, updateCount = 77) => atCount(withSystem(createPortfolioState(), { since }), updateCount);
const home = state => withSystem(state, { phase: 'home' });

test('boot-owned HOME entry follows counted footer and HUD source frames without repaint advancement', () => {
  const armed = sampleHomeEntryPresentation(createHomeEntryPresentation(), boot()).presentation;
  for (const [elapsed, footer, hud] of [
    [0, 0, 0], [7, 7, 7], [14, 14, 14], [15, null, 15], [20, null, 20], [40, null, 40],
  ]) {
    const state = atCount(home(boot()), 77 + elapsed);
    const first = sampleHomeEntryPresentation(armed, state);
    const repaint = sampleHomeEntryPresentation(first.presentation, state);
    assert.deepEqual([first.footerSceneInFrame, first.hudSceneInFrame], [footer, hud]);
    assert.deepEqual(repaint, first);
  }
  const complete = sampleHomeEntryPresentation(armed, atCount(home(boot()), 118));
  assert.deepEqual(complete, { presentation: createHomeEntryPresentation(), footerSceneInFrame: null, hudSceneInFrame: null });
});

test('warm boot identity owns its current shared-clock origin and replaces stale boot ownership', () => {
  const first = sampleHomeEntryPresentation(createHomeEntryPresentation(), boot(100, 77)).presentation;
  const replacement = sampleHomeEntryPresentation(first, boot(900, 932)).presentation;
  assert.deepEqual(replacement, { bootSince: 900, startedAtUpdate: 932 });
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
