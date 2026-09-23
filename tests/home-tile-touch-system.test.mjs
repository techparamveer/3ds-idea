import test from 'node:test';
import assert from 'node:assert/strict';
import { createPortfolioState, tickSystem, dispatchSystemEvent, reduceSystem, touchSystem,
  tickHomeNavigationClockObserved, releaseSystemInputs, setSystemSleeping } from '../src/os/system.ts';
import { enableHomeControls } from '../src/os/home-controls.ts';
import { createHomeNavigation, writeHomeNavigation, activeHomeRecord, sampleHomeGrid, enterHomeFolder } from '../src/os/home-navigation.ts';
import { reduceMenu } from '../src/os/state.ts';
import { createHomeBannerHost, crossHomeBannerBoundary, skipHomeBannerHostPass } from '../src/os/home-banner-host.ts';

const T = 4000, FRAME = 1000 / 60;
const at = (state, count) => tickHomeNavigationClockObserved(state, T + count * FRAME);
const nav = s => s.system.homeNavigation;
const ctl = s => s.system.homeControls;
const selected = s => activeHomeRecord(nav(s)).selectedSlot;
function home(slot = 0, folder = false) {
  let s = tickSystem(createPortfolioState(), 3001);
  if (folder) s = enterHomeFolder(reduceMenu(writeHomeNavigation(s, { ...createHomeNavigation(), rootView: { ...createHomeNavigation().rootView, selectedSlot: 40 } }), 'open'), 40);
  const navigation = createHomeNavigation(2);
  if (folder) {
    navigation.activeFolderSlot = 40;
    navigation.folderViews = { 40: { ...navigation.rootView, density: 2, selectedSlot: slot } };
    navigation.rootView = { ...navigation.rootView, selectedSlot: 40 };
  } else {
    const left = Math.max(0, Math.floor(slot / 3) * 3 - 6);
    navigation.rootView = { ...navigation.rootView, selectedSlot: slot, currentLeftSlot: left, targetLeftSlot: left };
  }
  return at(enableHomeControls(writeHomeNavigation(s, navigation)), 0).state;
}
function point(s, slot) { const grid = sampleHomeGrid(nav(s)), p = grid.slots[slot]; return { x: p.x - grid.scrollPixels, y: p.y }; }
function touch(s, phase, slot, extra = {}) {
  const p = point(s, slot);
  return dispatchSystemEvent(s, { type: 'touch', phase, pointerId: 1, ...p, ...extra }, s.system.homeClock.lastNow ?? T);
}
const tap = (s, slot) => touch(touch(s, 'down', slot), 'up', slot);

test('sampled press preserves primary; release accepts at R+3 with one press cue and no guessed selection cue', () => {
  for (const folder of [false, true]) {
    let s = home(0, folder), oldCenter = ctl(s).primary.center, loop = s.system.homeCursorLoop.currentFrame;
    s = touch(s, 'down', 1);
    let p = at(s, 1); s = p.state;
    assert.equal(selected(s), 0);
    assert.deepEqual(ctl(s).primary.center, oldCenter);
    assert.equal(ctl(s).primary.layoutVisible, true);
    assert.equal(s.system.homeCursorLoop.currentFrame, loop + 1);
    assert.deepEqual(p.passes[0].sounds, ['touch']);
    assert.deepEqual(ctl(s).tilePoses[1], { clip: 'select', frame: 0 });
    s = at(s, 2).state;
    assert.deepEqual(ctl(s).tilePoses[1], { clip: 'select', frame: 1 });
    s = touch(s, 'up', 1);
    p = at(s, 5); s = p.state;
    assert.equal(selected(s), 0, 'R through R+2 retain selection');
    assert.deepEqual(ctl(s).tilePoses[1], { clip: 'decide', frame: 1 });
    p = at(s, 6); s = p.state;
    assert.equal(selected(s), 1);
    assert.deepEqual(ctl(s).primary.center, point(s, 1));
    assert.deepEqual(p.passes[0].sounds, []);
    assert.equal(p.passes[0].observations.find(o => o.observation.kind === 'cursor-select').phase, 'input');
    assert.equal(p.passes[0].observations.find(o => o.observation.kind === 'banner-resolve').phase, 'lower');
    assert.equal(ctl(s).tileTouch.globalCapture, true);
    assert.equal(ctl(at(s, 7).state).tileTouch.globalCapture, true);
    assert.equal(ctl(at(s, 8).state).tileTouch.globalCapture, false);
  }
});

test('down/up between polls survives as one press and one delayed acceptance', () => {
  const result = at(tap(home(), 1), 12);
  assert.equal(selected(result.state), 1);
  assert.deepEqual(result.passes.flatMap(p => p.sounds), ['touch']);
  const accepted = result.passes.filter(p => p.observations.some(o => o.observation.kind === 'cursor-select'));
  assert.deepEqual(accepted.map(p => p.updateCount), [5]);
  assert.equal(ctl(result.state).tileTouch.globalCapture, false);
});

test('same vacant root and folder taps do not create or open anything', () => {
  for (const folder of [false, true]) {
    let s = home(folder ? 0 : 40, folder), folders = s.folders;
    const result = at(tap(s, selected(s)), 10);
    assert.equal(result.state.system.phase, 'home');
    assert.equal(result.state.opened, s.opened);
    assert.deepEqual(result.state.folders, folders);
    assert.equal(result.passes.some(p => p.handoff !== null), false);
    assert.deepEqual(result.passes.flatMap(p => p.sounds), ['touch']);
  }
});

test('eligible second tap stops the HOME input pass and discards remaining batch work', () => {
  const initial = home(), loop = initial.system.homeCursorLoop.currentFrame;
  const result = at(tap(initial, 0), 100);
  assert.equal(result.passes.length, 5);
  assert.equal(result.state.system.phase, 'launch');
  assert.equal(result.state.system.app, 'work');
  assert.equal(result.state.system.homeClock.updateCount, 5);
  assert.equal(result.state.system.homeClock.lastNow, null);
  assert.equal(result.state.system.homeCursorLoop.currentFrame, loop + 4);
  assert.equal(result.passes[4].completed, false);
  assert.equal(result.passes[4].handoff, 'application');
  assert.deepEqual(result.passes.flatMap(p => p.sounds), ['touch', 'open']);
  assert.equal(result.passes[4].observations.some(o => o.phase === 'lower'), false);
  assert.deepEqual(tickHomeNavigationClockObserved(result.state, T + 60000).passes, []);
});

test('waiting acceptance reads live selection and current content rather than press snapshot', () => {
  let s = at(tap(home(), 1), 2).state;
  s = writeHomeNavigation(s, { ...nav(s), rootView: { ...nav(s).rootView, selectedSlot: 1 } });
  const open = at(s, 5);
  assert.equal(open.state.system.app, 'projects');
  s = at(tap(home(), 0), 2).state;
  const layout = { ...s.system.layout }; delete layout[0];
  s = { ...s, system: { ...s.system, layout } };
  const vacant = at(s, 5);
  assert.equal(vacant.state.system.phase, 'home');
  assert.deepEqual(vacant.passes.flatMap(p => p.sounds), []);
});

test('direction edge on delayed acceptance is suppressed by retained capture', () => {
  let s = at(tap(home(), 1), 4).state;
  s = dispatchSystemEvent(s, { type: 'button', command: 'right', phase: 'down', source: 'keyboard:test' }, s.system.homeClock.lastNow);
  const result = at(s, 5);
  assert.equal(selected(result.state), 1);
  assert.equal(result.passes[0].observations.filter(o => o.observation.kind === 'cursor-select').length, 1);
  assert.equal(ctl(result.state).producer.repeatCandidate, 0);
});

test('cancel, blur, sleep and overlay entry cannot deliver a stale pending acceptance', () => {
  for (const stop of [s => releaseSystemInputs(s), s => setSystemSleeping(s, true, s.system.homeClock.lastNow),
    s => reduceSystem(s, 'preferences', s.system.homeClock.lastNow)]) {
    let s = at(tap(home(), 1), 2).state;
    s = stop(s);
    const result = at(s, 50);
    assert.equal(selected(result.state), 0);
    assert.equal(result.passes.some(p => p.observations.some(o => o.observation.kind === 'cursor-select')), false);
  }
  let s = at(touch(home(), 'down', 1), 1).state;
  s = touch(s, 'cancel', 1);
  assert.equal(selected(at(s, 12).state), 0);
  s = at(tap(home(0, true), 1), 2).state;
  s = reduceSystem(s, 'back', s.system.homeClock.lastNow);
  const closing = at(s, 12);
  assert.equal(closing.passes.some(p => p.observations.some(o => o.observation.kind === 'cursor-select')), false);
});

test('authored scroll takeover clears native widget and does not submit a tap', () => {
  let s = at(touch(home(), 'down', 1), 1).state;
  const p = point(s, 1);
  s = touch(s, 'move', 1, { x: p.x - 30 });
  assert.equal(nav(s).gesture.mode, 'scroll');
  assert.equal(ctl(s).tileTouch.strokeOwned, false);
  s = touch(s, 'up', 1, { x: p.x - 30 });
  const result = at(s, 20);
  assert.equal(result.passes.some(p => p.handoff !== null), false);
  // Pointer events may coalesce movement into the release itself.
  s = home();
  const selectedPoint = point(s, 0);
  s = touch(s, 'down', 0);
  s = touch(s, 'up', 0, { x: selectedPoint.x + 10 });
  const coalesced = at(s, 20);
  assert.equal(coalesced.state.system.phase, 'home');
  assert.deepEqual(coalesced.passes.flatMap(p => p.sounds), []);
});

test('one-shot compatibility touch goes through sampled widget; footer creation remains separate', () => {
  let s = home(40), p = point(s, 40);
  s = touchSystem(s, p.x, p.y, T);
  assert.equal(s.folders[40], undefined);
  assert.equal(at(s, 8).state.folders[40], undefined);
  const footer = touchSystem(home(40), 160, 226, T);
  assert.ok(Object.hasOwn(footer.folders, 40));
});

test('banner handoff accounting advances only the shared counter, not native manager or scene', () => {
  let host = createHomeBannerHost({ generation: 'touch-test', updateCount: 0 }, {
    managerInhibited: false, sceneInhibited: false, loadInhibited: false,
    nativeWorkerReady: true, resourceReady: null,
  });
  host = crossHomeBannerBoundary(host, host.clock, { selection: { kind: 'default' } });
  const service = host.service;
  const skipped = skipHomeBannerHostPass(host, { ...host.clock, updateCount: 1 });
  assert.deepEqual(skipped.service.lifecycle, service.lifecycle);
  assert.equal(skipped.service.waitUpdates, service.waitUpdates);
  assert.equal(skipped.service.clock.updateCount, 1);
  assert.throws(() => skipHomeBannerHostPass(skipped, skipped.clock), /next count/);
});
