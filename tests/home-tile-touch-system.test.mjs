import test from 'node:test';
import assert from 'node:assert/strict';
import { createPortfolioState, tickSystem, dispatchSystemEvent, reduceSystem, touchSystem,
  tickHomeNavigationClockObserved, releaseSystemInputs, setSystemSleeping } from '../src/os/system.ts';
import { enableHomeControls, queueHomeControlTouch, cancelHomeControlTouch } from '../src/os/home-controls.ts';
import { resetHomeTileTouch } from '../src/os/home-tile-touch.ts';
import { advanceHomeTilePickup2D, createHomeTilePickup, fittedHomePickupAnchor,
  markHomeTilePickupRootVisit, positionHomeTilePickup, retargetHomeTilePickup } from '../src/os/home-tile-pickup.ts';
import { createHomeNavigation, writeHomeNavigation, activeHomeRecord, sampleHomeGrid, enterHomeFolder } from '../src/os/home-navigation.ts';
import { reduceMenu } from '../src/os/state.ts';
import { createHomeBannerHost, crossHomeBannerBoundary, skipHomeBannerHostPass } from '../src/os/home-banner-host.ts';

const T = 4000, FRAME = 1000 / 60;
const at = (state, count) => tickHomeNavigationClockObserved(state, T + count * FRAME);
const nav = s => s.system.homeNavigation;
const ctl = s => s.system.homeControls;
const selected = s => activeHomeRecord(nav(s)).selectedSlot;

test('pickup retarget submits destination Scale while retaining source blank geometry', () => {
  const source = Object.freeze({ folder: 40, slot: 2 });
  const entered = advanceHomeTilePickup2D(createHomeTilePickup(source, 1,
    { x: 244, y: 137 }, { x: 244, y: 137 }, fittedHomePickupAnchor(1)));
  assert.deepEqual(entered.center, { x: 244, y: 123 });
  assert.equal(entered.suppressUpperBanner, false);
  const marked = markHomeTilePickupRootVisit(entered);
  assert.notEqual(marked, entered); assert.equal(entered.suppressUpperBanner, false); assert.equal(marked.suppressUpperBanner, true);
  assert.equal(markHomeTilePickupRootVisit(marked), marked); assert.ok(Object.isFrozen(marked));
  const rootAnchor = fittedHomePickupAnchor(5);
  const retargeted = retargetHomeTilePickup(marked, 5, { x: 59, y: 54 }, rootAnchor);
  assert.deepEqual(retargeted.source, source);
  assert.deepEqual(retargeted.center, { x: 59, y: 49.75 });
  assert.deepEqual(retargeted.anchor, { x: 0, y: -4.25 });
  assert.deepEqual(retargeted.scale, { currentFrame: 5, appliedFrame: 5 });
  assert.deepEqual(retargeted.blankCenter, entered.blankCenter);
  assert.deepEqual(retargeted.blankScale, { currentFrame: 1, appliedFrame: 1 });
  assert.equal(retargeted.suppressUpperBanner, true);
  assert.equal(positionHomeTilePickup(retargeted,{x:60,y:55}).suppressUpperBanner,true);
  assert.equal(retargetHomeTilePickup(retargeted, 5, { x: 59, y: 54 }, rootAnchor), retargeted);
  assert.throws(() => retargetHomeTilePickup(retargeted, 6, { x: 0, y: 0 }, { x: 0, y: 0 }), /density/);
});

test('pickup lift fit names only measured Scale1 and Scale5 while retaining zero gaps', () => {
  assert.deepEqual(fittedHomePickupAnchor(1), { x: 0, y: -14 });
  assert.deepEqual(fittedHomePickupAnchor(5), { x: 0, y: -4.25 });
  for (const density of [0, 2, 2.5, 3, 4]) assert.deepEqual(fittedHomePickupAnchor(density), { x: 0, y: 0 });
  assert.throws(() => fittedHomePickupAnchor(-1), /density/);
});

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

test('occupied press retains its container candidate independently from selection until acceptance', () => {
  for (const folder of [false, true]) {
    let s = home(0, folder);
    if (folder) s = { ...s, system: { ...s.system, folderLayouts: { 40: { 1: 'projects' } } } };
    s = at(touch(s, 'down', 1), 1).state;
    assert.deepEqual(ctl(s).tileCandidate, { folder: folder ? 40 : null, slot: 1 });
    assert.equal(selected(s), 0);
    s = at(touch(s, 'up', 1), 4).state;
    assert.equal(ctl(s).tileCandidate.slot, 1, 'Decide completion does not itself accept');
    s = at(s, 5).state;
    assert.equal(ctl(s).tileCandidate, null);
    assert.equal(selected(s), 1);
  }
  const vacant = at(touch(home(40), 'down', 40), 1).state;
  assert.equal(ctl(vacant).tileCandidate, null);
});

test('leaving clears candidate and reentry does not acquire it again without callback0', () => {
  let s = at(touch(home(), 'down', 1), 1).state;
  // Drive the widget hit route directly so browser scroll takeover does not
  // replace the native callback2/reentry sequence under test.
  s = queueHomeControlTouch(s, { type: 'touch', phase: 'move', x: -1, y: -1 }).state;
  s = at(s, 2).state;
  assert.equal(ctl(s).tileTouch.widgets[1].state, 3);
  assert.equal(ctl(s).tileCandidate, null);
  s = queueHomeControlTouch(s, { type: 'touch', phase: 'move', ...point(s, 1) }).state;
  s = at(s, 3).state;
  assert.equal(ctl(s).tileTouch.widgets[1].state, 1);
  assert.equal(ctl(s).tileCandidate, null);
  s = at(touch(s, 'up', 1), 7).state;
  assert.equal(selected(s), 1, 'ordinary release still accepts without a pickup candidate');
});

test('controller reset preserves candidate while explicit browser cancellation releases it', () => {
  let s = at(touch(home(), 'down', 1), 1).state;
  const candidate = ctl(s).tileCandidate;
  s = { ...s, system: { ...s.system, homeControls: { ...ctl(s), tileTouch: resetHomeTileTouch(ctl(s).tileTouch) } } };
  assert.deepEqual(ctl(s).tileCandidate, candidate);
  assert.equal(ctl(cancelHomeControlTouch(s)).tileCandidate, null);
  for (const stop of [s => touch(s, 'cancel', 1), s => releaseSystemInputs(s),
    s => setSystemSleeping(s, true, s.system.homeClock.lastNow),
    s => reduceSystem(s, 'preferences', s.system.homeClock.lastNow)]) {
    const held = at(touch(home(), 'down', 1), 1).state;
    assert.equal(ctl(stop(held)).tileCandidate, null);
  }
});

test('occupied H21 enters pickup before lower2D, freezes original tile and primary Loop, and emits grab once', () => {
  for (const folder of [false, true]) for (const same of [false, true]) {
    const target = same ? 0 : 1;
    let s = home(0, folder);
    if (folder) s = { ...s, system: { ...s.system, folderLayouts: { 40: { [target]: 'projects' } } } };
    s = at(touch(s, 'down', target), 1).state;
    const before = at(s, 21); s = before.state; // Initial P1, then H1..H20.
    const oldLoop = s.system.homeCursorLoop, oldPose = ctl(s).tilePoses[target], oldSelect = ctl(s).tileTouch.widgets[target].select;
    assert.equal(ctl(s).tileTouch.widgets[target].heldCount, 20);
    assert.equal(oldSelect.direction, 'reverse');
    assert.equal(ctl(s).tilePickup, null);
    const h21 = at(s, 22); s = h21.state;
    assert.equal(selected(s), target);
    assert.equal(nav(s).gesture.mode, 'drag');
    assert.deepEqual(ctl(s).tileCandidate, { folder: folder ? 40 : null, slot: target });
    const pickup = ctl(s).tilePickup;
    assert.deepEqual(pickup.source, ctl(s).tileCandidate);
    assert.deepEqual(pickup.center, point(s, target));
    assert.deepEqual(pickup.blankCenter, point(s, target));
    assert.deepEqual(pickup.scale, { currentFrame: 2, appliedFrame: 2 });
    assert.deepEqual(pickup.blankScale, { currentFrame: 2, appliedFrame: 2 });
    assert.equal(pickup.priority, 375);
    assert.equal(pickup.rootScale, 1);
    assert.deepEqual(ctl(s).primary, { ...ctl(before.state).primary, request: 2, shown: false, layoutVisible: false });
    assert.deepEqual(s.system.homeCursorLoop, oldLoop);
    assert.equal(ctl(s).tileTouch.widgets[target].longPressFlag, true);
    assert.equal(ctl(s).tileTouch.widgets[target].capture, true);
    assert.deepEqual(ctl(s).tileTouch.widgets[target].select, oldSelect);
    assert.deepEqual(ctl(s).tilePoses[target], oldPose);
    assert.deepEqual(h21.passes[0].sounds, ['grab']);
    assert.deepEqual(h21.passes[0].observations, []);
    assert.equal(h21.passes[0].completed, true);
    const h22 = at(s, 23); s = h22.state;
    assert.deepEqual(h22.passes[0].sounds, []);
    assert.deepEqual(s.system.homeCursorLoop, oldLoop);
    assert.equal(ctl(s).tilePickup, pickup);
    assert.deepEqual(ctl(s).tileTouch.widgets[target].select, oldSelect);
  }
});

test('vacant H21 completes reverse pose and release callback4 does not select or start Decide', () => {
  for (const folder of [false, true]) {
    let s = home(folder ? 0 : 40, folder), target = folder ? 1 : 41, initialSelection = selected(s);
    s = at(touch(s, 'down', target), 22).state;
    assert.equal(ctl(s).tilePickup, null);
    assert.equal(ctl(s).tileTouch.widgets[target].longPressFlag, true);
    assert.deepEqual(ctl(s).tilePoses[target], { clip: 'select', frame: 0 });
    const loop = s.system.homeCursorLoop.currentFrame;
    s = at(s, 31).state; // Holding beyond450ms must not create an authored lift.
    assert.equal(nav(s).gesture.mode, 'press');
    assert.equal(s.system.homeCursorLoop.currentFrame, (loop + 9) % 60);
    s = at(touch(s, 'up', target), 32).state;
    assert.equal(selected(s), initialSelection);
    assert.equal(ctl(s).tileTouch.widgets[target].longPressFlag, false);
    assert.equal(ctl(s).tileTouch.widgets[target].decide.appliedFrame, null);
    assert.equal(ctl(s).tileTouch.globalCapture, true);
    assert.equal(ctl(at(s, 33).state).tileTouch.globalCapture, true);
    assert.equal(ctl(at(s, 34).state).tileTouch.globalCapture, false);
  }
});

test('release after H20 still accepts normally; pickup exits cancel state without a stale open', () => {
  let s = at(touch(home(), 'down', 1), 21).state;
  const accepted = at(touch(s, 'up', 1), 25);
  assert.equal(selected(accepted.state), 1);
  assert.equal(ctl(accepted.state).tilePickup, null);
  assert.deepEqual(accepted.passes.flatMap(p => p.sounds), []);
  for (const stop of [s => touch(s, 'cancel', 1), s => releaseSystemInputs(s),
    s => setSystemSleeping(s, true, s.system.homeClock.lastNow),
    s => reduceSystem(s, 'preferences', s.system.homeClock.lastNow)]) {
    s = at(touch(home(), 'down', 1), 22).state;
    const ended = at(stop(s), 40);
    assert.equal(ctl(ended.state).tilePickup, null);
    assert.equal(ctl(ended.state).tileCandidate, null);
    assert.equal(ended.passes.some(p => p.handoff), false);
  }
  s = at(touch(home(), 'down', 1), 22).state;
  const dropped = at(touch(s, 'up', 1), 30);
  assert.equal(dropped.state.system.phase, 'home');
  assert.equal(ctl(dropped.state).tilePickup, null);
  assert.equal(ctl(dropped.state).primary.layoutVisible, true);
});

test('candidate-cleared reentry cannot become an authored lift during physical release', () => {
  let s = home(), grid = sampleHomeGrid(nav(s)), center = point(s, 1);
  const edge = { x: center.x - grid.size / 2 + 1, y: center.y }, layout = s.system.layout;
  s = at(touch(s, 'down', 1, edge), 1).state;
  s = at(touch(s, 'move', 1, { ...edge, x: edge.x - 2 }), 2).state;
  assert.equal(ctl(s).tileCandidate, null);
  s = at(touch(s, 'move', 1, edge), 3).state;
  s = at(s, 31).state;
  assert.equal(ctl(s).tileTouch.widgets[1].longPressFlag, true);
  assert.equal(ctl(s).tilePickup, null);
  assert.equal(nav(s).gesture.mode, 'press');
  s = touch(s, 'up', 2); // Browser coalesces the final displacement into up.
  assert.deepEqual(s.system.layout, layout);
  assert.equal(selected(s), 0);
  assert.equal(ctl(s).tilePickup, null);
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
