import test from 'node:test';
import assert from 'node:assert/strict';
import { createPortfolioState } from '../src/os/system.ts';
import {
  createHomeEntryPresentation,
  homeEntryBannerActivationDue,
  sampleHomeEntryPresentation,
  HOME_ENTRY_BANNER_RELEASE_FOOTER_FRAME,
  HOME_ENTRY_FOOTER_DELAY_UPDATES,
  HOME_ENTRY_FOOTER_LAST_FRAME,
  HOME_ENTRY_HUD_DELAY_UPDATES,
} from '../src/os/home-entry-presentation.ts';
import {
  createHomeBannerHost, crossHomeBannerBoundary, getHomeBannerHostView, resetHomeBannerPrimary,
  stepHomeBannerHost,
} from '../src/os/home-banner-host.ts';
import {
  createHomeBannerService, getHomeBannerResourceTicket, requestHomeBannerService, advanceHomeBannerService,
} from '../src/os/home-banner-service.ts';

const withSystem = (state, patch) => ({ ...state, system: { ...state.system, ...patch } });
const atCount = (state, updateCount) => withSystem(state, { homeClock: { ...state.system.homeClock, updateCount } });
const boot = (since = 100, updateCount = 77) => atCount(withSystem(createPortfolioState(), { since }), updateCount);
const home = state => withSystem(state, { phase: 'home' });
const inputs = (patch = {}) => ({
  managerInhibited: false, sceneInhibited: false, loadInhibited: false,
  nativeWorkerReady: true, activationReady: true, resourceReady: null, ...patch,
});
const view = getHomeBannerHostView;

function cameraHost(updateCount = 77) {
  let host = createHomeBannerHost({ generation: 'entry-scale', updateCount }, inputs({
    managerInhibited: true, nativeWorkerReady: false, activationReady: false,
  }));
  host = resetHomeBannerPrimary(host);
  host = crossHomeBannerBoundary(host, host.clock, {
    selection: { kind: 'app', id: 'camera' },
    inputs: inputs({ managerInhibited: true, nativeWorkerReady: false, activationReady: false }),
  });
  const ticket = view(host).resourceTicket;
  return crossHomeBannerBoundary(host, host.clock, {
    inputs: inputs({ managerInhibited: true, nativeWorkerReady: false, activationReady: false, resourceReady: ticket }),
  });
}

function stepEntry(host, armed, updateCount, { workerLag = 0 } = {}) {
  const state = atCount(home(boot()), updateCount);
  const sample = sampleHomeEntryPresentation(armed, state);
  const released = sample.footerSceneInFrame !== null
    && sample.footerSceneInFrame >= HOME_ENTRY_BANNER_RELEASE_FOOTER_FRAME;
  const nativeWorkerReady = workerLag === 0 ? released
    : sample.footerSceneInFrame !== null && sample.footerSceneInFrame >= HOME_ENTRY_BANNER_RELEASE_FOOTER_FRAME + workerLag;
  return {
    host: stepHomeBannerHost(host, { ...host.clock, updateCount }, {
      beforeManager: { inputs: {
        ...host.inputs, managerInhibited: false, sceneInhibited: false,
        nativeWorkerReady, activationReady: homeEntryBannerActivationDue(sample),
        resourceReady: view(host).resourceTicket ?? host.inputs.resourceReady,
      } },
    }),
    sample,
  };
}

test('SceneIn 10 release, frame 14 terminal, and labelled footer+3/HUD+7 stay unchanged', () => {
  assert.equal(HOME_ENTRY_BANNER_RELEASE_FOOTER_FRAME, 10);
  assert.equal(HOME_ENTRY_FOOTER_LAST_FRAME, 14);
  assert.equal(HOME_ENTRY_FOOTER_DELAY_UPDATES, 3);
  assert.equal(HOME_ENTRY_HUD_DELAY_UPDATES, 7);
});

test('entry banner activation is due only on the live footer-14 sample', () => {
  const armed = sampleHomeEntryPresentation(createHomeEntryPresentation(), boot()).presentation;
  for (const [elapsed, footer, due] of [
    [0, 0, false], [3, 0, false], [12, 9, false], [13, 10, false], [16, 13, false], [17, 14, true],
  ]) {
    const sample = sampleHomeEntryPresentation(armed, atCount(home(boot()), 77 + elapsed));
    assert.equal(sample.footerSceneInFrame, footer);
    assert.equal(homeEntryBannerActivationDue(sample), due);
  }
  assert.equal(homeEntryBannerActivationDue({presentation:createHomeEntryPresentation(),footerSceneInFrame:null,hudSceneInFrame:null}), true,
    'boot-owned empty samples with no HOME origin stay on the ordinary ready path');
});

test('Camera entry loading occupies SceneIn 10..13 and scale 0.8 activates on footer 14', () => {
  const armed = sampleHomeEntryPresentation(createHomeEntryPresentation(), boot()).presentation;
  let host = cameraHost(77);
  assert.equal(view(host).status, 'pending');
  const timeline = [];
  for (let elapsed = 1; elapsed <= 17; elapsed += 1) {
    const stepped = stepEntry(host, armed, 77 + elapsed);
    host = stepped.host;
    timeline.push({
      elapsed, footer: stepped.sample.footerSceneInFrame, due: homeEntryBannerActivationDue(stepped.sample),
      status: view(host).status, stage: view(host).stage,
      scale: view(host).primary?.motion.scale ?? null,
    });
  }
  const atFooter = frame => timeline.find(row => row.footer === frame);
  assert.equal(atFooter(9).status, 'pending');
  assert.equal(atFooter(10).status, 'pending');
  assert.equal(atFooter(10).stage, 'loading');
  assert.equal(atFooter(13).status, 'pending');
  assert.equal(atFooter(13).due, false);
  const terminal = atFooter(14);
  assert.equal(terminal.status, 'active');
  assert.equal(terminal.due, true);
  assert.equal(terminal.scale, Math.fround(.8));
  assert.deepEqual(view(host).primary.selection, { kind: 'app', id: 'camera' });
});

test('a one-update worker-present lag still activates on footer 14 rather than four later stages', () => {
  const armed = sampleHomeEntryPresentation(createHomeEntryPresentation(), boot()).presentation;
  let host = cameraHost(77);
  for (let elapsed = 1; elapsed <= 17; elapsed += 1) {
    host = stepEntry(host, armed, 77 + elapsed, { workerLag: 1 }).host;
  }
  assert.equal(view(host).status, 'active');
  assert.equal(view(host).primary.motion.scale, Math.fround(.8));
});

test('source 0.8 to 1 visibility ramp still takes four updates after the shared terminal paint', () => {
  const armed = sampleHomeEntryPresentation(createHomeEntryPresentation(), boot()).presentation;
  let host = cameraHost(77);
  for (let elapsed = 1; elapsed <= 17; elapsed += 1) host = stepEntry(host, armed, 77 + elapsed).host;
  assert.equal(view(host).primary.motion.scale, Math.fround(.8));
  const scales = [];
  for (let elapsed = 18; elapsed <= 21; elapsed += 1) {
    host = stepEntry(host, armed, 77 + elapsed).host;
    scales.push(view(host).primary.motion.scale);
  }
  assert.equal(scales[0], Math.fround(Math.fround(.8) + Math.fround(.25 * 0.19999998807907104)));
  assert.equal(scales[3], 1);
});

test('ordinary hosts that omit activationReady still activate on the later pass after gate release', () => {
  const folder = { kind: 'folder', key: 'folder-instance:1', nativeType: 9 };
  let state = requestHomeBannerService(createHomeBannerService({ generation: 'session:1', updateCount: 100 }), { target: folder });
  const token = getHomeBannerResourceTicket(state);
  const input = (patch = {}) => ({ managerInhibited: false, sceneInhibited: false, loadInhibited: false,
    nativeWorkerReady: true, resourceReady: token, ...patch });
  for (let n = 0; n < 5; n += 1) {
    state = advanceHomeBannerService(state, 1, input());
    assert.equal(state.stage, 'gate');
  }
  state = advanceHomeBannerService(state, 1, input());
  assert.equal(state.stage, 'loading');
  assert.equal(state.lifecycle.active, null);
  state = advanceHomeBannerService(state, 1, input());
  assert.equal(state.stage, 'active');
  assert.equal(state.lifecycle.active.motion.scale, Math.fround(.8));
});
