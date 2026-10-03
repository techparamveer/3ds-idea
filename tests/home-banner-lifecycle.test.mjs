import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HOME_BANNER_BG_SCENE_IN_SETTLED_FRAME, HOME_BANNER_EMPTY_KEY,
  createHomeBannerLifecycle, requestHomeBanner, beginHomeBannerReplacement,
  releaseHomeBanner, activateHomeBanner, setHomeBannerVisibility,
  advanceHomeBannerManager, advanceHomeBannerClips, homeBannerYawAtCounter,
  setHomeBannerBackgroundAttached, showHomeBannerBackground,
  setHomeBannerBackgroundMode, startHomeBannerBackgroundLoop, resumeHomeBannerBackgroundLoop,
} from '../src/os/home-banner-lifecycle.ts';

const folder = (key = 'folder:4', nativeType = 9) => ({ kind: 'folder', key, nativeType });
const defaultBanner = { kind: 'default', key: HOME_BANNER_EMPTY_KEY, nativeType: 7 };
const clear = { kind: 'clear', key: HOME_BANNER_EMPTY_KEY, nativeType: 13 };
const memo = { kind: 'memo', key: HOME_BANNER_EMPTY_KEY, nativeType: 15 };
const friend = { kind: 'friend', key: HOME_BANNER_EMPTY_KEY, nativeType: 14 };
const news = { kind: 'news', key: HOME_BANNER_EMPTY_KEY, nativeType: 16 };
const web = { kind: 'web', key: HOME_BANNER_EMPTY_KEY, nativeType: 17 };
const miiverse = { kind: 'miiverse', key: HOME_BANNER_EMPTY_KEY, nativeType: 18 };
const app = { kind: 'app', key: 'app:notes', nativeType: 1 };
const motion = state => state.active.motion;
function activate(state = createHomeBannerLifecycle(), target = folder()) {
  state = beginHomeBannerReplacement(requestHomeBanner(state, target));
  if (state.phase === 'hiding') {
    state = advanceHomeBannerManager(state, 8);
    state = releaseHomeBanner(state);
  }
  return activateHomeBanner(state, state.requested.epoch);
}
const visible = () => advanceHomeBannerManager(activate(), 8);

test('yaw matches isolated native ARM counter samples, including positive zero at wrap', () => {
  // execute-lifecycle.py/native-lifecycle.json; native 0x24e0c0, pinned source hash in docs.
  assert.equal(homeBannerYawAtCounter(1), -0.010471976362168789);
  assert.equal(homeBannerYawAtCounter(238), -2.492330312728882);
  assert.equal(homeBannerYawAtCounter(600), 0);
  assert.equal(homeBannerYawAtCounter(1201), homeBannerYawAtCounter(1));
  assert.ok(Math.abs(homeBannerYawAtCounter(150) + Math.PI / 2) < 1e-6);
});

test('request, activation and first visible update are separate epochs', () => {
  const initial = createHomeBannerLifecycle();
  const requested = requestHomeBanner(initial, folder());
  assert.equal(initial.requested, null);
  assert.equal(requested.active, null);
  const loading = beginHomeBannerReplacement(requested);
  assert.equal(loading.phase, 'loading');
  const waiting = advanceHomeBannerManager(loading, 600);
  assert.equal(waiting.active, null, 'native load readiness is an explicit host event');
  const active = activateHomeBanner(waiting, waiting.requested.epoch);
  assert.equal(active.activationEpoch, 1);
  assert.equal(active.active.activatedAtManagerUpdate, 600);
  assert.deepEqual([motion(active).yawCounter, motion(active).yawRadians], [0, -0.010471975430846214]);
  assert.equal(motion(active).visible, false);
  const beforeAttach = advanceHomeBannerClips(active, 30);
  assert.equal(motion(beforeAttach).skeletal.frame, 0);
  const first = advanceHomeBannerManager(beforeAttach);
  assert.equal(motion(first).visible, true);
  assert.equal(motion(first).yawCounter, 1);
  assert.equal(motion(first).visibilityManagerUpdate, 601);
  assert.equal(motion(first).skeletal.frame, 0, 'manager does not invent a graphics-pass ordering');
  assert.equal(motion(advanceHomeBannerClips(first)).skeletal.frame, 1);
});

test('same folder request and pre-replacement selection reversal preserve active phases', () => {
  const state = advanceHomeBannerClips(visible(), 237);
  assert.equal(requestHomeBanner(state, { ...folder() }), state);
  const away = requestHomeBanner(state, folder('folder:8'));
  assert.equal(away.active, state.active);
  const returned = beginHomeBannerReplacement(requestHomeBanner(away, folder()));
  assert.equal(returned.active, state.active);
  assert.equal(returned.activationEpoch, 1);
  assert.equal(returned.requestPending, false);
  const options = beginHomeBannerReplacement(requestHomeBanner(state, folder(), { optionA: 1 }));
  assert.equal(options.active, state.active, 'same-current native identity guard preserves the object');
});

test('different folder, banner type and forced refresh require fresh activation', () => {
  for (const [target, options] of [[folder('folder:8'), {}], [folder('folder:4', 10), {}], [folder(), { forceReload: true }]]) {
    let state = advanceHomeBannerClips(visible(), 237);
    state = beginHomeBannerReplacement(requestHomeBanner(state, target, options));
    assert.equal(state.phase, 'hiding');
    assert.equal(motion(state).requestedVisible, false);
    assert.equal(motion(state).skeletal.frame, 237);
    assert.equal(releaseHomeBanner(state), state, 'visible primary cannot be released by this transition');
    state = releaseHomeBanner(advanceHomeBannerManager(state, 8));
    state = activateHomeBanner(state, state.requested.epoch);
    assert.equal(state.activationEpoch, 2);
    assert.deepEqual([motion(state).yawCounter, motion(state).skeletal.frame, motion(state).material.frame], [0, 0, 0]);
    assert.deepEqual(state.active.target, target);
  }
});

test('returning after hide began and a stale asynchronous result cannot reuse the old activation', () => {
  let state = beginHomeBannerReplacement(requestHomeBanner(visible(), folder('folder:8')));
  const staleEpoch = state.requested.epoch;
  state = requestHomeBanner(state, folder());
  assert.equal(beginHomeBannerReplacement(state), state);
  state = releaseHomeBanner(advanceHomeBannerManager(state, 8));
  assert.equal(activateHomeBanner(state, staleEpoch), state);
  state = activateHomeBanner(state, state.requested.epoch);
  assert.equal(state.activationEpoch, 2);
  assert.equal(motion(state).yawCounter, 0);
});

test('native visible-in and hide sequence retains the extra detach call and float32 scales', () => {
  // Original 0x1fa344 in isolated ARM; attach/detach/get-transform stubbed only.
  // See private native-transitions.json. These are observed outputs, not a JS oracle.
  const expected = [
    [true, 1, 0, 0.800000011920929], [true, 2, .25, 0.8500000238418579],
    [true, 3, .5, 0.8999999761581421], [true, 4, .75, 0.949999988079071],
    [true, 5, 1, 1], [true, 4, 1, 1], [true, 5, 1, 1], [true, 4, 1, 1],
    [true, 3, .75, 0.949999988079071], [true, 2, .5, 0.8999999761581421],
    [true, 1, .25, 0.8500000238418579], [true, 0, 0, 0.800000011920929],
    [false, 3, .75, 0.949999988079071], [false, 2, .5, 0.8999999761581421],
    [false, 1, .25, 0.8500000238418579], [false, 0, 0, 0.800000011920929],
  ];
  let state = activate();
  for (let i = 0; i < expected.length; i++) {
    if (i === 8) state = setHomeBannerVisibility(state, false);
    state = advanceHomeBannerManager(state);
    const f = motion(state);
    assert.deepEqual([f.visible, f.visibilityCounter, f.visibilityProgress, f.scale], expected[i], `native update ${i + 1}`);
  }
  assert.equal(motion(state).visibilityEpoch, 2);
  assert.equal(motion(state).visibilityManagerUpdate, 13);
});

test('hidden retained yaw advances while detached clips pause; manager inhibition is independent', () => {
  let state = advanceHomeBannerClips(visible(), 237);
  state = advanceHomeBannerManager(setHomeBannerVisibility(state, false), 8);
  const before = motion(state);
  const after = advanceHomeBannerClips(advanceHomeBannerManager(state, 3), 3);
  assert.equal(motion(after).yawCounter, before.yawCounter + 3);
  assert.equal(motion(after).skeletal, before.skeletal);
  assert.equal(advanceHomeBannerManager(after, 100, false), after);
  const attached = setHomeBannerVisibility(after, true, true);
  const clipsOnly = advanceHomeBannerClips(attached, 4);
  assert.equal(motion(clipsOnly).yawCounter, motion(attached).yawCounter);
  assert.equal(motion(clipsOnly).skeletal.frame, 241);
});

test('native visibility requests reset yaw only if already hidden; immediate attach preserves it', () => {
  const state = advanceHomeBannerManager(visible(), 229);
  assert.equal(motion(state).yawCounter, 237);
  for (const desired of [true, false]) {
    assert.equal(motion(setHomeBannerVisibility(state, desired)).yawCounter, 237);
  }
  const hidden = setHomeBannerVisibility(state, false, true);
  assert.equal(motion(hidden).yawCounter, 237);
  assert.equal(motion(setHomeBannerVisibility(hidden, true, true)).yawCounter, 237);
  for (const desired of [true, false]) {
    const reset = motion(setHomeBannerVisibility(hidden, desired));
    assert.equal(reset.yawCounter, 0);
    assert.equal(reset.yawRadians, -0.010471975430846214);
    assert.equal(reset.yawEpoch, motion(hidden).yawEpoch + 1);
    assert.equal(reset.skeletal, motion(hidden).skeletal);
  }
});

test('folder clip period is 600 even though the skeletal bob curve repeats every 150', () => {
  let state = advanceHomeBannerClips(visible(), 150);
  assert.equal(motion(state).skeletal.frame, 150);
  assert.equal(motion(state).material.frame, 150);
  state = advanceHomeBannerClips(state, 449);
  assert.equal(motion(state).skeletal.frame, 599);
  state = advanceHomeBannerClips(state);
  assert.equal(motion(state).skeletal.frame, 0);
  assert.equal(motion(state).material.frame, 0);
  assert.equal(motion(state).yawCounter, 8);
});

test('Friend type14 shares generic primary motion with source-owned 600/300 looping clips', () => {
  let state = activate(createHomeBannerLifecycle(), friend);
  assert.deepEqual(state.active.target, friend);
  assert.deepEqual([motion(state).skeletal.duration, motion(state).skeletal.looping], [600, true]);
  assert.deepEqual([motion(state).material.duration, motion(state).material.looping], [300, true]);
  state = advanceHomeBannerClips(advanceHomeBannerManager(state), 299);
  assert.deepEqual([motion(state).yawCounter, motion(state).skeletal.frame, motion(state).material.frame], [1, 299, 299]);
  state = advanceHomeBannerClips(state);
  assert.deepEqual([motion(state).skeletal.frame, motion(state).material.frame], [300, 0]);
  assert.throws(() => requestHomeBanner(state, { ...friend, nativeType: 15 }), /Friend banner identity/);
});

test('Notifications type16 shares generic primary motion with source-owned 600/300 looping clips', () => {
  let state = activate(createHomeBannerLifecycle(), news);
  assert.deepEqual(state.active.target, news);
  assert.deepEqual([motion(state).skeletal.duration, motion(state).skeletal.looping], [600, true]);
  assert.deepEqual([motion(state).material.duration, motion(state).material.looping], [300, true]);
  state = advanceHomeBannerClips(advanceHomeBannerManager(state), 299);
  assert.deepEqual([motion(state).yawCounter, motion(state).skeletal.frame, motion(state).material.frame], [1, 299, 299]);
  state = advanceHomeBannerClips(state);
  assert.deepEqual([motion(state).skeletal.frame, motion(state).material.frame], [300, 0]);
  assert.throws(() => requestHomeBanner(state, { ...news, nativeType: 14 }), /Notifications banner identity/);
});

test('Memo15, Web17 and Miiverse18 use the same ticketed generic primary motion', () => {
  for (const target of [memo, web, miiverse]) {
    let state = activate(createHomeBannerLifecycle(), target);
    assert.deepEqual(state.active.target, target);
    assert.deepEqual([motion(state).skeletal.duration, motion(state).material.duration], [600, 300]);
    state = advanceHomeBannerClips(advanceHomeBannerManager(state), 1);
    assert.deepEqual([motion(state).yawCounter, motion(state).skeletal.frame, motion(state).material.frame], [1, 1, 1]);
    assert.throws(() => requestHomeBanner(state, { ...target, nativeType: target.nativeType + 1 }), /banner identity/);
  }
});

test('normal child app or default selection, explicit clear and return activate a parent folder afresh', () => {
  for (const child of [app, defaultBanner]) {
    let state = advanceHomeBannerClips(visible(), 200);
    state = activate(state, child);
    assert.equal(state.active.motion === null, child.kind === 'app');
    // Native close requests clear, then restored parent; host selection owns this sequence.
    state = activate(state, clear); assert.equal(state.active, null);
    state = activate(state, folder());
    assert.equal(motion(state).yawCounter, 0);
    assert.equal(motion(state).skeletal.frame, 0);
    assert.ok(state.activationEpoch >= 3);
  }
});

function background() {
  let state = setHomeBannerBackgroundAttached(createHomeBannerLifecycle(), true);
  state = showHomeBannerBackground(state, false);
  return setHomeBannerBackgroundMode(state, 0);
}

test('background frame 509 and new folder yaw/clip epochs remain independent', () => {
  const before = advanceHomeBannerClips(background(), 509);
  const state = activate(before);
  assert.equal(state.background, before.background);
  assert.equal(state.background.loop.frame, 509);
  assert.equal(motion(state).yawCounter, 0);
  assert.equal(motion(state).skeletal.frame, 0);
  const next = advanceHomeBannerClips(advanceHomeBannerManager(state));
  assert.equal(next.background.loop.frame, 510);
  assert.equal(motion(next).yawCounter, 1);
  assert.equal(motion(next).skeletal.frame, 1);
});

test('SceneIn nonanimated seek is 19; native controller can subsequently reach frame 20', () => {
  let state = background();
  assert.equal(HOME_BANNER_BG_SCENE_IN_SETTLED_FRAME, 19);
  assert.equal(state.background.sceneIn.frame, 19);
  assert.equal(state.background.sceneIn.status, 1, 'native start+seek is not a pause');
  // Original 0x1bbd94 executed with duration20/start0/step1/frame19/mode0.
  for (const status of [1, 2, 0, 0]) {
    state = advanceHomeBannerClips(state);
    assert.equal(state.background.sceneIn.frame, 20);
    assert.equal(state.background.sceneIn.status, status);
    assert.equal(state.background.sceneIn.endReached, true);
  }
  const loop = state.background.loop;
  state = showHomeBannerBackground(state, true);
  assert.equal(state.background.sceneIn.frame, 0);
  assert.equal(state.background.sceneIn.epoch, 2);
  assert.equal(state.background.loop, loop);
});

test('background mode equality preserves Loop; explicit restart and resume have different epochs', () => {
  let state = advanceHomeBannerClips(background(), 237);
  assert.equal(setHomeBannerBackgroundMode(state, 0), state);
  const epoch = state.background.loop.epoch;
  state = setHomeBannerBackgroundMode(state, 1);
  state = advanceHomeBannerClips(state, 8);
  assert.equal(state.background.loop.frame, 237);
  assert.equal(state.background.appPause.frame, 8);
  state = advanceHomeBannerClips(resumeHomeBannerBackgroundLoop(state));
  assert.equal(state.background.loop.frame, 238);
  assert.equal(state.background.loop.epoch, epoch);
  state = setHomeBannerBackgroundMode(state, 0);
  assert.equal(state.background.loop.frame, 0);
  assert.equal(state.background.loop.epoch, epoch + 1);
  state = startHomeBannerBackgroundLoop(advanceHomeBannerClips(state, 10));
  assert.equal(state.background.loop.frame, 0);
  assert.equal(state.background.loop.epoch, epoch + 2);
});

test('background detachment freezes its clips while visible folder clips can advance', () => {
  let state = advanceHomeBannerManager(activate(background()));
  state = setHomeBannerBackgroundAttached(state, false);
  const bg = state.background;
  const next = advanceHomeBannerClips(state, 10);
  assert.equal(next.background, bg);
  assert.equal(motion(next).skeletal.frame, 10);
});

test('invalid native counts fail and zero updates preserve state', () => {
  const state = visible();
  for (const value of [-1, .5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => homeBannerYawAtCounter(value), /native update count/);
    assert.throws(() => advanceHomeBannerManager(state, value), /native update count/);
    assert.throws(() => advanceHomeBannerClips(state, value), /native update count/);
  }
  assert.equal(advanceHomeBannerManager(state, 0), state);
  assert.equal(advanceHomeBannerClips(state, 0), state);
});
