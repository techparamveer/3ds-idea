import test from 'node:test';
import assert from 'node:assert/strict';

import { homeApplicationTransitionFooterExit, homeApplicationTransitionFooterReturn,
  homeApplicationTransitionPresentation } from '../src/os/home-application-transition.ts';
import { selectHomeLocation } from '../src/os/home-layout.ts';
import { enableHomeControls } from '../src/os/home-controls.ts';
import { getHomeFooter } from '../src/os/home-presentation.ts';
import { enterHomeFolder, selectHomeSlot, settleHomeNavigation } from '../src/os/home-navigation.ts';
import {
  createPortfolioState,
  dispatchSystemEvent,
  launchHomeShortcut,
  reduceSystem,
  releaseSystemInputs,
  sampleSystemHomeApplicationTransition,
  sampleSystemHomeFolderClose,
  setSystemSleeping,
  tickHomeNavigationClockObserved,
  tickSystem,
  touchSystem,
} from '../src/os/system.ts';

const FRAME = 1000 / 60;
const bootHome = () => tickSystem(createPortfolioState(), 3001);
const suspended = (appId = 'work') => reduceSystem(tickSystem(launchHomeShortcut(bootHome(), appId, 4000), 6200), 'home', 6300);

function suspendedFolder(native, appId = 'health-safety') {
  const state = bootHome(), layout = Object.fromEntries(Object.entries(state.system.layout).filter(([, id]) => id !== appId));
  const opened = settleHomeNavigation(selectHomeSlot(enterHomeFolder({ ...state, folders: { 20: 'A' },
    system: { ...state.system, layout, folderLayouts: { 20: { 2: appId } } } }, 20), 2));
  const folder = reduceSystem(tickSystem(touchSystem(opened, 160, 226, 4000), 6200), 'home', 6300);
  return native ? enableHomeControls(folder) : folder;
}

test('folder Health Close release retires software without departing its folder', () => {
  for (const native of [false, true]) {
    let state = suspendedFolder(native);
    const owner = state.system.runtime.application;
    state = dispatchSystemEvent(state, { type: 'touch', phase: 'down', pointerId: 7, x: 52, y: 226 }, 6400);
    state = dispatchSystemEvent(state, { type: 'touch', phase: 'up', pointerId: 7, x: 52, y: 226 }, 6500);
    assert.equal(state.system.dialog, null);
    assert.equal(sampleSystemHomeApplicationTransition(state)?.phase, 'closing');
    assert.equal(sampleSystemHomeFolderClose(state), null);
    assert.equal(state.system.runtime.application, owner);
    state = closeFooterReturnStart(state);
    assert.equal(sampleSystemHomeApplicationTransition(state)?.phase, 'footer-returning');
    assert.equal(state.system.app, null);
    assert.equal(state.system.runtime.application, null);
    assert.equal(state.system.runtime.homeReturn, null);
    assert.equal(state.opened, true);
    assert.equal(state.system.homeNavigation.activeFolderSlot, 20);
    assert.equal(state.folderSelected, 2);
    assert.equal(state.system.folderLayouts[20][2], 'health-safety');
    assert.deepEqual(getHomeFooter(state), { two: false, left: null, right: 'open' });
  }
});

test('non-Health folder software Close retains its confirmation policy', () => {
  for (const native of [false, true]) {
    const state = suspendedFolder(native, 'work'), owner = state.system.runtime.application;
    const closing = touchSystem(state, 52, 226, 6500);
    assert.equal(closing.system.dialog, 'close');
    assert.equal(closing.system.homeApplicationTransition, null);
    assert.equal(closing.system.runtime.application, owner);
    assert.equal(closing.opened, true);
  }
});

test('folder suspended footer cannot transfer a release across Close and Resume', () => {
  for (const native of [false, true]) for (const [start, end, phase] of [[52, 160, 'up'], [160, 52, 'up'], [52, 52, 'cancel']]) {
    let state = suspendedFolder(native);
    const owner = state.system.runtime.application;
    state = dispatchSystemEvent(state, { type: 'touch', phase: 'down', pointerId: 7, x: start, y: 226 }, 6400);
    state = dispatchSystemEvent(state, { type: 'touch', phase, pointerId: 7, x: end, y: 226 }, 6500);
    assert.equal(state.system.homeApplicationTransition, null);
    assert.equal(state.system.runtime.application, owner);
    assert.equal(state.system.phase, 'home');
    assert.equal(state.opened, true);
  }
});

test('folder suspended Resume and top Back keep their distinct actions', () => {
  for (const native of [false, true]) {
    const state = suspendedFolder(native), owner = state.system.runtime.application;
    const resumed = touchSystem(state, 160, 226, 6500);
    assert.equal(resumed.system.phase, 'app');
    assert.equal(resumed.system.runtime.application, owner);
    const back = touchSystem(state, 59, 54, 6500);
    assert.equal(back.system.homeApplicationTransition, null);
    assert.equal(back.system.runtime.application, owner);
    assert.equal(back.system.app, 'health-safety');
    assert.equal(sampleSystemHomeFolderClose(back).controller.phase, 'closing');
  }
});

function confirmClose(state, now = 6500) {
  state = reduceSystem(state, 'back', now - 100);
  assert.equal(state.system.dialog, 'close');
  state = reduceSystem(state, 'open', now);
  assert.equal(state.system.dialog, null);
  assert.ok(sampleSystemHomeApplicationTransition(state));
  return state;
}

function confirmSwitch(state, target = 'about', now = 6500) {
  state = launchHomeShortcut(state, target, now - 100);
  assert.equal(state.system.dialog, 'switch');
  assert.equal(state.system.pending, target);
  state = reduceSystem(state, 'open', now);
  assert.equal(state.system.dialog, null);
  assert.equal(state.system.pending, null);
  assert.deepEqual(sampleSystemHomeApplicationTransition(state)?.intent, { kind: 'switch', appId: target });
  return state;
}

function terminal(state, now = 6500) {
  state = tickSystem(state, now);
  const startCount = state.system.homeClock.updateCount;
  state = tickSystem(state, now + 40 * FRAME);
  assert.equal(sampleSystemHomeApplicationTransition(state)?.phase, 'terminal');
  assert.equal(state.system.homeClock.updateCount, startCount + 20, 'outer batch stops at the terminal frame');
  return state;
}

function commitTerminal(state, now = 6500) {
  state = terminal(state, now);
  const sameTimestamp = tickSystem(state, state.system.homeClock.lastNow);
  assert.equal(sampleSystemHomeApplicationTransition(sameTimestamp)?.phase, 'terminal', 'nested same-time tick cannot commit');
  return tickSystem(sameTimestamp, state.system.homeClock.lastNow + FRAME);
}

function closeExitTerminal(state, now = 6500) {
  state = terminal(state, now);
  state = tickSystem(state, state.system.homeClock.lastNow + FRAME);
  assert.equal(sampleSystemHomeApplicationTransition(state)?.phase, 'exiting');
  assert.equal(sampleSystemHomeApplicationTransition(state)?.dialogExitFrame, 0,
    'a later host update publishes the exit start');
  const startCount = state.system.homeClock.updateCount;
  state = tickSystem(state, state.system.homeClock.lastNow + 40 * FRAME);
  assert.equal(sampleSystemHomeApplicationTransition(state)?.phase, 'exit-terminal');
  assert.equal(sampleSystemHomeApplicationTransition(state)?.dialogExitFrame, 20);
  assert.equal(state.system.homeClock.updateCount, startCount + 20, 'outer batch stops at the exit terminal frame');
  return state;
}

function closeFooterTerminal(state, now = 6500) {
  state = closeExitTerminal(state, now);
  state = tickSystem(state, state.system.homeClock.lastNow + FRAME);
  assert.equal(sampleSystemHomeApplicationTransition(state)?.phase, 'footer-exiting');
  assert.equal(sampleSystemHomeApplicationTransition(state)?.footerExitFrame, 0,
    'a later host update publishes the post-modal footer exit start');
  const startCount = state.system.homeClock.updateCount;
  state = tickSystem(state, state.system.homeClock.lastNow + 40 * FRAME);
  assert.equal(sampleSystemHomeApplicationTransition(state)?.phase, 'footer-terminal');
  assert.equal(sampleSystemHomeApplicationTransition(state)?.footerExitFrame, 6);
  assert.equal(state.system.homeClock.updateCount, startCount + 6,
    'outer batch stops at the post-modal footer terminal frame');
  return state;
}

function closeFooterReturnStart(state, now = 6500) {
  state = closeFooterTerminal(state, now);
  state = tickSystem(state, state.system.homeClock.lastNow + FRAME);
  assert.equal(sampleSystemHomeApplicationTransition(state)?.phase, 'footer-returning');
  assert.equal(sampleSystemHomeApplicationTransition(state)?.footerReturnFrame, 0,
    'owner retirement publishes the Open-return start');
  return state;
}

test('confirmed close retires at footer departure and retains Open return through its terminal frame', () => {
  let state = confirmClose(suspended());
  const owner = state.system.runtime.application;
  const transition = sampleSystemHomeApplicationTransition(state);
  assert.ok(owner);
  assert.equal(transition.identity.owner, owner);
  assert.equal(transition.identity.transitionId, 1);
  assert.equal(state.system.homeFolderClose.nextTransitionId, 2, 'one shared monotonic HOME allocator owns begin');

  state = closeFooterTerminal(state);
  assert.equal(state.system.runtime.application, owner);
  assert.equal(state.system.runtime.homeReturn, owner);
  assert.equal(state.system.runtime.instances[owner].suspended, true);

  const sameTimestamp = tickSystem(state, state.system.homeClock.lastNow);
  assert.equal(sampleSystemHomeApplicationTransition(sameTimestamp)?.phase, 'footer-terminal');
  state = tickSystem(sameTimestamp, state.system.homeClock.lastNow + FRAME);
  assert.equal(sampleSystemHomeApplicationTransition(state)?.phase, 'footer-returning');
  assert.equal(sampleSystemHomeApplicationTransition(state)?.footerReturnFrame, 0);
  assert.equal(state.system.runtime.application, null);
  assert.equal(state.system.runtime.homeReturn, null);
  assert.equal(state.system.app, null);
  assert.deepEqual(homeApplicationTransitionFooterReturn(sampleSystemHomeApplicationTransition(state)), {
    clip: 'LncBtmBtn_02_ChangeUp', frame: 0,
  });
  assert.equal(homeApplicationTransitionPresentation(sampleSystemHomeApplicationTransition(state)), null);

  const returnStartCount = state.system.homeClock.updateCount;
  state = tickSystem(state, state.system.homeClock.lastNow + 40 * FRAME);
  assert.equal(sampleSystemHomeApplicationTransition(state)?.phase, 'return-terminal');
  assert.equal(sampleSystemHomeApplicationTransition(state)?.footerReturnFrame, 8);
  assert.equal(state.system.homeClock.updateCount, returnStartCount + 8);
  const returnSameTimestamp = tickSystem(state, state.system.homeClock.lastNow);
  assert.equal(sampleSystemHomeApplicationTransition(returnSameTimestamp)?.phase, 'return-terminal');
  state = tickSystem(returnSameTimestamp, state.system.homeClock.lastNow + FRAME);
  assert.equal(state.system.homeApplicationTransition, null);
});

test('confirmed switch freezes its target and launches only after retiring the terminal owner', () => {
  let state = confirmSwitch(suspended(), 'about');
  const oldOwner = state.system.runtime.application;
  state = { ...state, selected: 11, system: { ...state.system, pending: 'camera' } };
  state = commitTerminal(state);
  const owner = state.system.runtime.application;
  assert.equal(state.system.phase, 'launch');
  assert.equal(state.system.app, 'about');
  assert.notEqual(owner, oldOwner);
  assert.equal(state.system.runtime.instances[oldOwner], undefined);
  assert.equal(state.system.runtime.instances[owner].appId, 'about');
  assert.equal(state.system.pending, null);
});

test('ordinary command, touch, analog and direct launch input are quarantined during close', () => {
  const state = confirmClose(suspended()), now = 6500;
  const owner = state.system.runtime.application, selected = state.selected;
  for (const next of [
    reduceSystem(state, 'home', now),
    reduceSystem(state, 'right', now),
    touchSystem(state, 250, 120, now),
    dispatchSystemEvent(state, { type: 'analog', x: 1, y: 0 }, now),
    launchHomeShortcut(state, 'about', now),
  ]) {
    assert.equal(next.system.runtime.application, owner);
    assert.equal(next.selected, selected);
    assert.equal(sampleSystemHomeApplicationTransition(next)?.identity.owner, owner);
  }
});

test('allowed global buttons activate on accepted down and consume release without double toggling', () => {
  let state = confirmClose(suspended()), now = 6500;
  state = dispatchSystemEvent(state, { type: 'button', source: 'physical:mute', phase: 'down', command: 'mute' }, now);
  assert.equal(state.system.muted, true);
  assert.equal(sampleSystemHomeApplicationTransition(state)?.phase, 'closing');
  state = dispatchSystemEvent(state, { type: 'button', source: 'physical:mute', phase: 'up', command: 'mute' }, now + 1);
  assert.equal(state.system.muted, true);
  assert.equal(state.system.input.held['physical:mute'], undefined);
});

test('late owner replacement cancels stale close without touching the replacement', () => {
  const state = confirmClose(suspended()), old = state.system.runtime.application, replacement = 'work:999';
  const instance = { ...state.system.runtime.instances[old], id: replacement };
  const replaced = { ...state, system: { ...state.system, runtime: { ...state.system.runtime,
    instances: { [replacement]: instance }, application: replacement, homeReturn: replacement } } };
  const next = tickSystem(replaced, 7000);
  assert.equal(next.system.homeApplicationTransition, null);
  assert.equal(next.system.runtime.application, replacement);
  assert.equal(next.system.runtime.instances[replacement], instance);
});

test('post-retirement return rejects replacement, resurrection and generation changes without closing them', () => {
  const returning = closeFooterReturnStart(confirmClose(suspended()));
  const transition = sampleSystemHomeApplicationTransition(returning);
  const replacementOwner = 'work:999';
  const replacementInstance = { id: replacementOwner, appId: 'work', state: {}, caller: null, requestId: null,
    suspended: true, requests: {} };
  const replaced = { ...returning, system: { ...returning.system, app: 'work', runtime: { ...returning.system.runtime,
    instances: { [replacementOwner]: replacementInstance }, application: replacementOwner, homeReturn: replacementOwner } } };
  const afterReplacement = tickSystem(replaced, replaced.system.homeClock.lastNow + FRAME);
  assert.equal(afterReplacement.system.homeApplicationTransition, null);
  assert.equal(afterReplacement.system.runtime.application, replacementOwner);
  assert.equal(afterReplacement.system.runtime.instances[replacementOwner], replacementInstance);

  const resurrectedInstance = { ...replacementInstance, id: transition.identity.owner, appId: 'health-safety' };
  const resurrected = { ...returning, system: { ...returning.system, app: 'health-safety', runtime: {
    ...returning.system.runtime, instances: { [transition.identity.owner]: resurrectedInstance },
    application: transition.identity.owner, homeReturn: transition.identity.owner } } };
  const afterResurrection = tickSystem(resurrected, resurrected.system.homeClock.lastNow + FRAME);
  assert.equal(afterResurrection.system.homeApplicationTransition, null);
  assert.equal(afterResurrection.system.runtime.application, transition.identity.owner);
  assert.equal(afterResurrection.system.runtime.instances[transition.identity.owner], resurrectedInstance);

  const generationChanged = { ...returning, system: { ...returning.system,
    homeFolderClose: { ...returning.system.homeFolderClose, generation: returning.system.homeFolderClose.generation + 1 } } };
  const afterGeneration = tickSystem(generationChanged, generationChanged.system.homeClock.lastNow + FRAME);
  assert.equal(afterGeneration.system.homeApplicationTransition, null);
  assert.equal(afterGeneration.system.runtime.application, null);
});

test('Open-return quarantine blocks HOME input until the later completion update', () => {
  const state = closeFooterReturnStart(confirmClose(suspended())), now = state.system.homeClock.lastNow + FRAME;
  const selected = state.selected;
  for (const next of [
    reduceSystem(state, 'right', now),
    touchSystem(state, 250, 120, now),
    dispatchSystemEvent(state, { type: 'analog', x: 1, y: 0 }, now),
    launchHomeShortcut(state, 'about', now),
  ]) {
    assert.equal(next.selected, selected);
    assert.equal(sampleSystemHomeApplicationTransition(next)?.phase, 'footer-returning');
    assert.equal(next.system.runtime.application, null);
  }
});

test('hidden-clock release preserves close progress without replaying hidden elapsed time', () => {
  let state = confirmClose(suspended());
  state = tickSystem(state, 6500);
  state = tickSystem(state, 6500 + 5 * FRAME);
  assert.equal(sampleSystemHomeApplicationTransition(state)?.appQuitFrame, 5);
  state = releaseSystemInputs(state, 6500 + 5 * FRAME);
  assert.equal(state.system.homeClock.lastNow, null);
  state = tickSystem(state, 90000);
  assert.equal(sampleSystemHomeApplicationTransition(state)?.appQuitFrame, 5);
  state = tickSystem(state, 90000 + FRAME);
  assert.equal(sampleSystemHomeApplicationTransition(state)?.appQuitFrame, 6);
});

test('lid sleep retains the close owner and resumes without counting sleep time', () => {
  let state = confirmClose(suspended());
  state = tickSystem(state, 6500);
  state = tickSystem(state, 6500 + 5 * FRAME);
  const transition = state.system.homeApplicationTransition, owner = state.system.runtime.application;
  state = setSystemSleeping(state, true, 6500 + 5 * FRAME);
  state = tickSystem(state, 90000);
  assert.equal(state.system.homeApplicationTransition.appQuitFrame, transition.appQuitFrame);
  assert.equal(state.system.runtime.application, owner);
  state = setSystemSleeping(state, false, 90000);
  state = tickSystem(state, 90000);
  state = tickSystem(state, 90000 + FRAME);
  assert.equal(state.system.homeApplicationTransition.appQuitFrame, transition.appQuitFrame + 1);
});

test('lid sleep pauses the dialog exit clock without replaying hidden elapsed time', () => {
  let state = confirmClose(suspended());
  state = terminal(state);
  state = tickSystem(state, state.system.homeClock.lastNow + FRAME);
  state = tickSystem(state, state.system.homeClock.lastNow + 5 * FRAME);
  const transition = state.system.homeApplicationTransition, owner = state.system.runtime.application;
  assert.equal(transition.phase, 'exiting');
  assert.equal(transition.dialogExitFrame, 5);

  state = setSystemSleeping(state, true, state.system.homeClock.lastNow);
  state = tickSystem(state, 90000);
  assert.equal(state.system.homeApplicationTransition.dialogExitFrame, transition.dialogExitFrame);
  assert.equal(state.system.runtime.application, owner);
  state = setSystemSleeping(state, false, 90000);
  state = tickSystem(state, 90000);
  state = tickSystem(state, 90000 + FRAME);
  assert.equal(state.system.homeApplicationTransition.dialogExitFrame, transition.dialogExitFrame + 1);
});

test('lid sleep pauses the post-modal footer exit without replaying hidden elapsed time', () => {
  let state = confirmClose(suspended());
  state = closeExitTerminal(state);
  state = tickSystem(state, state.system.homeClock.lastNow + FRAME);
  state = tickSystem(state, state.system.homeClock.lastNow + 5 * FRAME);
  const transition = state.system.homeApplicationTransition, owner = state.system.runtime.application;
  assert.equal(transition.phase, 'footer-exiting');
  assert.equal(transition.footerExitFrame, 5);

  state = setSystemSleeping(state, true, state.system.homeClock.lastNow);
  state = tickSystem(state, 90000);
  assert.equal(state.system.homeApplicationTransition.footerExitFrame, transition.footerExitFrame);
  assert.equal(state.system.runtime.application, owner);
  state = setSystemSleeping(state, false, 90000);
  state = tickSystem(state, 90000);
  state = tickSystem(state, 90000 + FRAME);
  assert.equal(state.system.homeApplicationTransition.footerExitFrame, transition.footerExitFrame + 1);
});

test('lid sleep pauses the Open-footer return without replaying hidden elapsed time', () => {
  let state = closeFooterReturnStart(confirmClose(suspended()));
  state = tickSystem(state, state.system.homeClock.lastNow + 5 * FRAME);
  const transition = state.system.homeApplicationTransition;
  assert.equal(transition.phase, 'footer-returning');
  assert.equal(transition.footerReturnFrame, 5);
  assert.equal(state.system.runtime.application, null);

  state = setSystemSleeping(state, true, state.system.homeClock.lastNow);
  state = tickSystem(state, 90000);
  assert.equal(state.system.homeApplicationTransition.footerReturnFrame, transition.footerReturnFrame);
  state = setSystemSleeping(state, false, 90000);
  state = tickSystem(state, 90000);
  state = tickSystem(state, 90000 + FRAME);
  assert.equal(state.system.homeApplicationTransition.footerReturnFrame, transition.footerReturnFrame + 1);
});

test('reduced presentation samples the endpoint without skipping logical owner retention', () => {
  let state = confirmClose(suspended()), transition = sampleSystemHomeApplicationTransition(state);
  assert.equal(transition.appQuitFrame, 0);
  assert.equal(homeApplicationTransitionPresentation(transition, true).material[1].frame, 20);
  state = tickSystem(state, 6500, true);
  state = tickSystem(state, 6500 + 40 * FRAME, true);
  transition = sampleSystemHomeApplicationTransition(state);
  assert.equal(transition.phase, 'terminal');
  assert.ok(state.system.runtime.application);

  state = closeExitTerminal(confirmClose(suspended()), 6500);
  state = tickSystem(state, state.system.homeClock.lastNow + FRAME, true);
  transition = sampleSystemHomeApplicationTransition(state);
  assert.equal(transition.phase, 'footer-exiting');
  assert.deepEqual(homeApplicationTransitionFooterExit(transition), { clip: 'LncBtmBtn_02_ChangeDw', frame: 0 });
  assert.deepEqual(homeApplicationTransitionFooterExit(transition, true), { clip: 'LncBtmBtn_02_ChangeDw', frame: 6 });
  assert.ok(state.system.runtime.application, 'reduced presentation cannot retire the owner before logical terminal');

  state = closeFooterReturnStart(confirmClose(suspended()), 6500);
  transition = sampleSystemHomeApplicationTransition(state);
  assert.deepEqual(homeApplicationTransitionFooterReturn(transition), { clip: 'LncBtmBtn_02_ChangeUp', frame: 0 });
  assert.deepEqual(homeApplicationTransitionFooterReturn(transition, true), { clip: 'LncBtmBtn_02_ChangeUp', frame: 8 });
  assert.equal(homeApplicationTransitionPresentation(transition, true), null);
  assert.equal(state.system.runtime.application, null, 'reduced sampling cannot retain the retired owner');
});

test('switch confirmation from an opened folder starts the same retained-owner transition', () => {
  let state = suspended();
  const layout = { ...state.system.layout };
  delete layout[0];
  state = { ...state, folders: { 0: 'Folder' }, system: { ...state.system, layout,
    folderLayouts: { ...state.system.folderLayouts, 0: { 0: 'about' } } } };
  state = selectHomeLocation(state, { folder: 0, slot: 0 });
  assert.equal(state.opened, true);
  state = reduceSystem(state, 'open', 6400);
  assert.equal(state.system.dialog, 'switch');
  state = reduceSystem(state, 'open', 6500);
  assert.deepEqual(sampleSystemHomeApplicationTransition(state)?.intent, { kind: 'switch', appId: 'about' });
});

test('clock observer and nested tick at one timestamp cannot cross the terminal barrier', () => {
  let state = confirmClose(suspended());
  state = tickSystem(state, 6500);
  const observed = tickHomeNavigationClockObserved(state, 6500 + 40 * FRAME);
  assert.equal(sampleSystemHomeApplicationTransition(observed.state)?.phase, 'terminal');
  assert.equal(observed.passes.length, 0);
  const nested = tickSystem(observed.state, 6500 + 40 * FRAME);
  assert.equal(sampleSystemHomeApplicationTransition(nested)?.phase, 'terminal');
  assert.ok(nested.system.runtime.application);
});
