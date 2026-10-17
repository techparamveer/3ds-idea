import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  HOME_APPLICATION_CLOSE_MEASURED_TIMING,
  HOME_APPLICATION_TRANSITION_SOURCE,
  advanceHomeApplicationTransition,
  beginHomeApplicationTransition,
  cancelHomeApplicationTransition,
  homeApplicationTransitionFooterExit,
  homeApplicationTransitionFooterReturn,
  homeApplicationTransitionPresentation,
  sampleHomeApplicationTransition,
} from '../src/os/home-application-transition.ts';

import { HEALTH_VBLANK_HZ } from '../src/os/stock-health-scroll.ts';

const identity = (transitionId = 1, owner = 'health-safety:1', generation = 'system:1') => ({
  generation, transitionId, owner,
});

test('close presentation names and bounds match the delivered HOME sources', () => {
  const url = new URL('../public/os/firmware/10.7.0-32E/models/home-background/model.json', import.meta.url);
  const source = JSON.parse(readFileSync(url));
  const clips = [...source.skeletalAnimations, ...source.materialAnimations];
  const clip = name => clips.find(candidate => candidate.Name === name);

  const backgroundRecords = ['sceneIn', 'appPause', 'appQuit', 'appRestart', 'sceneOut']
    .map(name => HOME_APPLICATION_TRANSITION_SOURCE[name]);
  for (const record of backgroundRecords) {
    const delivered = clip(record.clip);
    assert.ok(delivered, record.clip);
    assert.equal(delivered.FramesCount, record.lastFrame ?? record.settledFrame, record.clip);
    assert.equal(delivered.AnimationFlags.includes('IsLooping'), false, record.clip);
  }
  assert.equal(source.sourceSha256, '092c8682d0cfabf0a1823a8e3a2c12556515c437afba2aa6f6ac7fc4d5e34595');
  assert.equal(source.compressedSourceSha256, '27d58c2113d2c2d46e3bcc36bb2ae56c35e19d9823488287b6759df998108711');

  const quit = clip('BannerBG_AppQuit');
  const quitAlpha = quit.Elements.find(element => element.TargetType === 'MaterialConstant4').Content.A;
  assert.deepEqual(quitAlpha.KeyFrames.map(key => [key.Frame, key.Value]), [[0, 0], [20, 1]]);
  const restartAnimatedStarts = clip('BannerBG_AppRestart').Elements.flatMap(element => Object.values(element.Content))
    .filter(channel => channel.Exists && channel.EndFrame > 0).map(channel => channel.StartFrame);
  assert.ok(restartAnimatedStarts.length > 0);
  assert.ok(restartAnimatedStarts.every(frame => frame === 20));
  const sceneOutScale = clip('BannerBG_SceneOut').Elements[0].Content.ScaleX.KeyFrames;
  assert.deepEqual(sceneOutScale.slice(0, 3).map(key => [key.Frame, key.Value]), [[0, 1], [19, 1], [20, 1]]);

  const dialogUrl = new URL('../public/os/firmware/10.7.0-32E/packs/home/dialog.json', import.meta.url);
  const dialog = JSON.parse(readFileSync(dialogUrl));
  const closing = dialog.animations[HOME_APPLICATION_TRANSITION_SOURCE.closingDialog.clip];
  assert.ok(closing);
  assert.equal(closing.frames - 1, HOME_APPLICATION_TRANSITION_SOURCE.closingDialog.lastFrame);
  assert.equal(closing.loop, false);

  const maskUrl = new URL('../public/os/firmware/10.7.0-32E/packs/home/dialogmask.json', import.meta.url);
  const mask = JSON.parse(readFileSync(maskUrl)).animations.DlgMask_D_00_FadeOut00;
  assert.equal(mask.frames - 1, HOME_APPLICATION_TRANSITION_SOURCE.closingDialog.lastFrame);
  assert.equal(mask.loop, false);

  const launcherUrl = new URL('../public/os/firmware/10.7.0-32E/packs/home/launcher.json', import.meta.url);
  const launcher = JSON.parse(readFileSync(launcherUrl));
  const footerExit = launcher.animations[HOME_APPLICATION_TRANSITION_SOURCE.postModalFooterExit.clip];
  const footerReturn = launcher.animations[HOME_APPLICATION_TRANSITION_SOURCE.postModalFooterReturn.clip];
  for (const [animation, record] of [[footerExit, HOME_APPLICATION_TRANSITION_SOURCE.postModalFooterExit],
    [footerReturn, HOME_APPLICATION_TRANSITION_SOURCE.postModalFooterReturn]]) {
    assert.ok(animation, record.clip);
    assert.equal(animation.frames - 1, record.lastFrame, record.clip);
    assert.equal(animation.loop, false, record.clip);
    assert.deepEqual(animation.groups, ['G_Scene_00'], record.clip);
  }
  const sceneTracks = animation => animation.tracks.filter(track => track.target === 'N_Scene_00')
    .map(track => [track.property, track.keys.map(key => [key.frame, key.value])]);
  assert.deepEqual(sceneTracks(footerExit), [
    ['translation.y', [[0, 0], [6, -4]]],
    ['alpha', [[0, 255], [6, 0]]],
  ]);
  assert.deepEqual(sceneTracks(footerReturn), [
    ['translation.y', [[0, -4], [8, 0]]],
    ['alpha', [[0, 0], [8, 255]]],
  ]);
});

test('begin is immutable, idempotent for one identity, and replaces only on an explicit fresh identity', () => {
  const first = beginHomeApplicationTransition(null, identity(), { kind: 'close' });
  assert.equal(first.processedUpdates, 0);
  assert.deepEqual(first.observations.map(item => item.kind), ['started']);
  assert.deepEqual(first.state, {
    identity: identity(), intent: { kind: 'close' }, phase: 'closing',
    measuredTiming: false, waitFrame: null, holdFrame: null, appQuitFrame: 0,
    dialogExitFrame: null, footerExitFrame: null, footerReturnFrame: null,
  });
  assert.equal(Object.isFrozen(first.state), true);
  assert.equal(beginHomeApplicationTransition(first.state, identity(), { kind: 'switch', appId: 'camera' }).state, first.state);

  const replacement = beginHomeApplicationTransition(first.state, identity(2, 'work:2'), { kind: 'switch', appId: 'about' });
  assert.deepEqual(replacement.state.identity, identity(2, 'work:2'));
  assert.deepEqual(replacement.state.intent, { kind: 'switch', appId: 'about' });
  assert.equal(replacement.state.appQuitFrame, 0);
  assert.equal(replacement.state.dialogExitFrame, null);
  assert.equal(replacement.state.footerExitFrame, null);
  assert.equal(replacement.state.footerReturnFrame, null);
});

test('close stops at AppQuit, dialog-exit, footer departure and Open-return paint barriers', () => {
  const started = beginHomeApplicationTransition(null, identity(), { kind: 'close' }).state;
  const first = advanceHomeApplicationTransition(started, identity(), 19, { eligible: true });
  assert.equal(first.state.phase, 'closing');
  assert.equal(first.state.appQuitFrame, 19);
  assert.equal(first.processedUpdates, 19);
  assert.deepEqual(first.observations, []);

  const terminal = advanceHomeApplicationTransition(first.state, identity(), 50, { eligible: true });
  assert.equal(terminal.state.phase, 'terminal');
  assert.equal(terminal.state.appQuitFrame, 20);
  assert.equal(terminal.processedUpdates, 1, 'remaining batch updates cannot skip the terminal paint boundary');
  assert.deepEqual(terminal.observations.map(item => [item.kind, item.stepOffset]), [['terminalPresented', 0]]);

  const exitStart = advanceHomeApplicationTransition(terminal.state, identity(), 50, { eligible: true });
  assert.equal(exitStart.state.phase, 'exiting');
  assert.equal(exitStart.state.dialogExitFrame, 0);
  assert.equal(exitStart.processedUpdates, 1, 'exit frame 0 cannot be skipped by a large batch');
  assert.deepEqual(exitStart.observations.map(item => [item.kind, item.stepOffset]), [['exitStarted', 0]]);

  const exitTerminal = advanceHomeApplicationTransition(exitStart.state, identity(), 50, { eligible: true });
  assert.equal(exitTerminal.state.phase, 'exit-terminal');
  assert.equal(exitTerminal.state.dialogExitFrame, 20);
  assert.equal(exitTerminal.processedUpdates, 20, 'remaining batch updates cannot skip the exit terminal boundary');
  assert.deepEqual(exitTerminal.observations.map(item => [item.kind, item.stepOffset]), [['exitTerminalPresented', 19]]);

  const footerStart = advanceHomeApplicationTransition(exitTerminal.state, identity(), 50, { eligible: true });
  assert.equal(footerStart.state.phase, 'footer-exiting');
  assert.equal(footerStart.state.footerExitFrame, 0);
  assert.equal(footerStart.processedUpdates, 1, 'footer frame 0 cannot be skipped by a large batch');
  assert.deepEqual(footerStart.observations.map(item => [item.kind, item.stepOffset]), [['footerExitStarted', 0]]);
  assert.deepEqual(homeApplicationTransitionFooterExit(footerStart.state), {
    clip: 'LncBtmBtn_02_ChangeDw', frame: 0,
  });

  const footerTerminal = advanceHomeApplicationTransition(footerStart.state, identity(), 50, { eligible: true });
  assert.equal(footerTerminal.state.phase, 'footer-terminal');
  assert.equal(footerTerminal.state.footerExitFrame, 6);
  assert.equal(footerTerminal.processedUpdates, 6, 'remaining batch updates cannot skip the footer terminal boundary');
  assert.deepEqual(footerTerminal.observations.map(item => [item.kind, item.stepOffset]), [['footerExitTerminalPresented', 5]]);

  const returnStart = advanceHomeApplicationTransition(footerTerminal.state, identity(), 50, { eligible: true });
  assert.equal(returnStart.state.phase, 'footer-returning');
  assert.equal(returnStart.state.footerReturnFrame, 0);
  assert.equal(returnStart.processedUpdates, 1, 'return frame 0 and owner retirement share one publication barrier');
  assert.deepEqual(returnStart.observations.map(item => [item.kind, item.stepOffset]), [
    ['commitOwnerClose', 0], ['footerReturnStarted', 0],
  ]);
  assert.deepEqual(returnStart.observations[0].intent, { kind: 'close' });
  assert.equal(homeApplicationTransitionFooterExit(returnStart.state), null);
  assert.deepEqual(homeApplicationTransitionFooterReturn(returnStart.state), {
    clip: 'LncBtmBtn_02_ChangeUp', frame: 0,
  });
  assert.equal(homeApplicationTransitionPresentation(returnStart.state), null);

  const returnTerminal = advanceHomeApplicationTransition(returnStart.state, identity(), 50, { eligible: true });
  assert.equal(returnTerminal.state.phase, 'return-terminal');
  assert.equal(returnTerminal.state.footerReturnFrame, 8);
  assert.equal(returnTerminal.processedUpdates, 8, 'remaining batch updates cannot skip the return terminal boundary');
  assert.deepEqual(returnTerminal.observations.map(item => [item.kind, item.stepOffset]), [
    ['footerReturnTerminalPresented', 7],
  ]);

  const complete = advanceHomeApplicationTransition(returnTerminal.state, identity(), 50, { eligible: true });
  assert.equal(complete.state.phase, 'complete');
  assert.equal(complete.processedUpdates, 1);
  assert.deepEqual(complete.observations, []);
});

test('switch retains its close barrier while keeping the settled suspended-background presentation', () => {
  const started = beginHomeApplicationTransition(null, identity(), { kind: 'switch', appId: 'camera' }).state;
  assert.equal(homeApplicationTransitionPresentation(started), null);
  assert.equal(homeApplicationTransitionPresentation(started, true), null);
  const terminal = advanceHomeApplicationTransition(started, identity(), 100, { eligible: true });
  assert.equal(terminal.state.phase, 'terminal');
  assert.equal(terminal.processedUpdates, 20);
  assert.deepEqual(terminal.observations[0].intent, { kind: 'switch', appId: 'camera' });
  assert.equal(terminal.state.dialogExitFrame, null);
  assert.equal(terminal.state.footerExitFrame, null);
  assert.equal(homeApplicationTransitionPresentation(terminal.state), null);

  const commit = advanceHomeApplicationTransition(terminal.state, identity(), 100, { eligible: true });
  assert.equal(commit.state.phase, 'complete');
  assert.equal(commit.state.dialogExitFrame, null);
  assert.equal(commit.state.footerExitFrame, null);
  assert.equal(commit.state.footerReturnFrame, null);
  assert.equal(commit.processedUpdates, 1);
  assert.deepEqual(commit.observations.map(item => [item.kind, item.stepOffset]), [['commitOwnerClose', 0]]);
});

test('inhibited updates are consumed without catch-up and stale owners cannot advance or cancel', () => {
  const state = beginHomeApplicationTransition(null, identity(), { kind: 'close' }).state;
  const inhibited = advanceHomeApplicationTransition(state, identity(), 30, { eligible: false });
  assert.equal(inhibited.state, state);
  assert.equal(inhibited.processedUpdates, 30);

  const stale = identity(1, 'health-safety:old');
  assert.equal(advanceHomeApplicationTransition(state, stale, 10, { eligible: true }).state, state);
  assert.equal(cancelHomeApplicationTransition(state, stale).state, state);
  assert.equal(sampleHomeApplicationTransition(state), state);

  const terminal = advanceHomeApplicationTransition(state, identity(), 20, { eligible: true }).state;
  const exiting = advanceHomeApplicationTransition(terminal, identity(), 1, { eligible: true }).state;
  const pausedExit = advanceHomeApplicationTransition(exiting, identity(), 30, { eligible: false });
  assert.equal(pausedExit.state, exiting);
  assert.equal(pausedExit.state.dialogExitFrame, 0);
  assert.equal(pausedExit.processedUpdates, 30);
  assert.equal(advanceHomeApplicationTransition(exiting, stale, 10, { eligible: true }).state, exiting);
  assert.equal(cancelHomeApplicationTransition(exiting, stale).state, exiting);
  assert.equal(cancelHomeApplicationTransition(exiting, identity()).state, null);

  const exitTerminal = advanceHomeApplicationTransition(exiting, identity(), 20, { eligible: true }).state;
  const footerExiting = advanceHomeApplicationTransition(exitTerminal, identity(), 1, { eligible: true }).state;
  const pausedFooter = advanceHomeApplicationTransition(footerExiting, identity(), 30, { eligible: false });
  assert.equal(pausedFooter.state, footerExiting);
  assert.equal(pausedFooter.state.footerExitFrame, 0);
  assert.equal(pausedFooter.processedUpdates, 30);
  assert.equal(advanceHomeApplicationTransition(footerExiting, stale, 10, { eligible: true }).state, footerExiting);
  assert.equal(cancelHomeApplicationTransition(footerExiting, stale).state, footerExiting);

  const footerTerminal = advanceHomeApplicationTransition(footerExiting, identity(), 6, { eligible: true }).state;
  const footerReturning = advanceHomeApplicationTransition(footerTerminal, identity(), 1, { eligible: true }).state;
  const pausedReturn = advanceHomeApplicationTransition(footerReturning, identity(), 30, { eligible: false });
  assert.equal(pausedReturn.state, footerReturning);
  assert.equal(pausedReturn.state.footerReturnFrame, 0);
  assert.equal(pausedReturn.processedUpdates, 30);
  assert.equal(advanceHomeApplicationTransition(footerReturning, stale, 10, { eligible: true }).state, footerReturning);
  assert.equal(cancelHomeApplicationTransition(footerReturning, stale).state, footerReturning);

  const replacement = beginHomeApplicationTransition(exiting, identity(2, 'camera:2'),
    { kind: 'switch', appId: 'about' }).state;
  assert.deepEqual(replacement.identity, identity(2, 'camera:2'));
  assert.deepEqual(replacement.intent, { kind: 'switch', appId: 'about' });
  assert.equal(replacement.phase, 'closing');
  assert.equal(replacement.dialogExitFrame, null);
  assert.equal(replacement.footerExitFrame, null);
  assert.equal(replacement.footerReturnFrame, null);
});

test('presentation layers AppQuit over the settled suspended source pose', () => {
  let state = beginHomeApplicationTransition(null, identity(), { kind: 'close' }).state;
  state = advanceHomeApplicationTransition(state, identity(), 7, { eligible: true }).state;
  assert.deepEqual(homeApplicationTransitionPresentation(state), {
    skeletal: [{ clip: 'BannerBG_SceneIn', frame: 20 }],
    material: [
      { clip: 'BannerBG_AppPause', frame: 20 },
      { clip: 'BannerBG_AppQuit', frame: 7 },
    ],
  });
  assert.equal(homeApplicationTransitionPresentation(state, true).material[1].frame, 20);
  assert.equal(homeApplicationTransitionFooterExit(state), null);

  state = advanceHomeApplicationTransition(state, identity(), 13, { eligible: true }).state;
  state = advanceHomeApplicationTransition(state, identity(), 1, { eligible: true }).state;
  state = advanceHomeApplicationTransition(state, identity(), 20, { eligible: true }).state;
  state = advanceHomeApplicationTransition(state, identity(), 1, { eligible: true }).state;
  assert.equal(state.phase, 'footer-exiting');
  assert.deepEqual(homeApplicationTransitionFooterExit(state), { clip: 'LncBtmBtn_02_ChangeDw', frame: 0 });
  assert.deepEqual(homeApplicationTransitionFooterExit(state, true), { clip: 'LncBtmBtn_02_ChangeDw', frame: 6 });
  assert.equal(homeApplicationTransitionFooterReturn(state), null);
  state = advanceHomeApplicationTransition(state, identity(), 6, { eligible: true }).state;
  state = advanceHomeApplicationTransition(state, identity(), 1, { eligible: true }).state;
  assert.equal(state.phase, 'footer-returning');
  assert.deepEqual(homeApplicationTransitionFooterReturn(state), { clip: 'LncBtmBtn_02_ChangeUp', frame: 0 });
  assert.deepEqual(homeApplicationTransitionFooterReturn(state, true), { clip: 'LncBtmBtn_02_ChangeUp', frame: 8 });
  assert.equal(homeApplicationTransitionPresentation(state), null);
  assert.equal(cancelHomeApplicationTransition(state, identity()).state, null);
});

test('invalid identities, intents, update counts and eligibility fail explicitly', () => {
  assert.throws(() => beginHomeApplicationTransition(null, identity(1, '', 'system:1'), { kind: 'close' }), RangeError);
  assert.throws(() => beginHomeApplicationTransition(null, identity(), { kind: 'switch', appId: '' }), RangeError);
  const state = beginHomeApplicationTransition(null, identity(), { kind: 'close' }).state;
  assert.throws(() => advanceHomeApplicationTransition(state, identity(), -1, { eligible: true }), RangeError);
  assert.throws(() => advanceHomeApplicationTransition(state, identity(), 1, {}), RangeError);
});

const eligible = { eligible: true };
const step = (state, updates, input = eligible) => advanceHomeApplicationTransition(state, identity(), updates, input);

test('measured close timing matches the private native Health Close runs at the LCD rate', () => {
  assert.deepEqual(HOME_APPLICATION_CLOSE_MEASURED_TIMING, { preDialogWaitFrames: 60, dialogHoldFrames: 83 });
  assert.equal(Object.isFrozen(HOME_APPLICATION_CLOSE_MEASURED_TIMING), true);
  // run.md: wait 1.035 / 0.956 s, hold 1.37 / 1.388 s.
  assert.ok(Math.abs(60 / HEALTH_VBLANK_HZ - 1.003) < 0.001);
  assert.ok(Math.abs(83 / HEALTH_VBLANK_HZ - 1.387) < 0.001);
});

test('measured close waits 60 static frames, then holds the FadeIn terminal pose 83 frames', () => {
  const begun = beginHomeApplicationTransition(null, identity(), { kind: 'close' }, { measuredTiming: true });
  assert.deepEqual(begun.state, {
    identity: identity(), intent: { kind: 'close' }, phase: 'waiting', measuredTiming: true,
    waitFrame: 0, holdFrame: null, appQuitFrame: 0, dialogExitFrame: null, footerExitFrame: null, footerReturnFrame: null,
  });
  assert.deepEqual(begun.observations.map(item => item.kind), ['started']);
  for (const reduced of [false, true]) assert.equal(homeApplicationTransitionPresentation(begun.state, reduced), null,
    'the wait presents the suspended HOME unchanged');

  const waiting = step(begun.state, 59);
  assert.equal(waiting.state.phase, 'waiting');
  assert.equal(waiting.state.waitFrame, 59);
  assert.equal(waiting.state.appQuitFrame, 0);
  assert.equal(waiting.processedUpdates, 59);
  assert.deepEqual(waiting.observations, []);
  assert.equal(homeApplicationTransitionPresentation(waiting.state), null);

  const closing = step(begun.state, 500);
  assert.equal(closing.state.phase, 'closing');
  assert.equal(closing.state.waitFrame, 60);
  assert.equal(closing.state.appQuitFrame, 0);
  assert.equal(closing.processedUpdates, 60, 'closing frame 0 is a paint barrier');
  assert.deepEqual(closing.observations.map(item => [item.kind, item.stepOffset]), [['closingStarted', 59]]);

  const terminal = step(step(closing.state, 19).state, 50);
  assert.equal(terminal.state.phase, 'terminal');
  assert.equal(terminal.processedUpdates, 1, 'fade-in clip length is unchanged');
  const terminalPose = homeApplicationTransitionPresentation(terminal.state);

  const holdStart = step(terminal.state, 1);
  assert.equal(holdStart.state.phase, 'held');
  assert.equal(holdStart.state.holdFrame, 1);
  const held = step(terminal.state, 500);
  assert.equal(held.state.phase, 'held');
  assert.equal(held.state.holdFrame, 83);
  assert.equal(held.processedUpdates, 83);
  assert.deepEqual(held.observations.map(item => [item.kind, item.stepOffset]), [['holdTerminalPresented', 82]]);
  let pose = terminal.state;
  for (let frame = 1; frame <= 83; frame += 1) {
    pose = step(pose, 1).state;
    assert.equal(pose.holdFrame, frame);
    assert.equal(pose.appQuitFrame, 20);
    assert.equal(pose.dialogExitFrame, null);
    for (const reduced of [false, true]) assert.deepEqual(homeApplicationTransitionPresentation(pose, reduced),
      homeApplicationTransitionPresentation(terminal.state, reduced), 'held pose is the terminal pose exactly');
  }
  assert.deepEqual(homeApplicationTransitionPresentation(pose), terminalPose);
  assert.equal(homeApplicationTransitionFooterExit(pose), null);

  const exitStart = step(held.state, 50);
  assert.equal(exitStart.state.phase, 'exiting');
  assert.equal(exitStart.state.dialogExitFrame, 0);
  assert.equal(exitStart.processedUpdates, 1);
  assert.deepEqual(exitStart.observations.map(item => item.kind), ['exitStarted']);
  const exitTerminal = step(exitStart.state, 50);
  assert.equal(exitTerminal.state.phase, 'exit-terminal');
  assert.equal(exitTerminal.processedUpdates, 20, 'fade-out clip length is unchanged');

  const telemetry = JSON.parse(JSON.stringify(held.state));
  assert.deepEqual([telemetry.phase, telemetry.measuredTiming, telemetry.waitFrame, telemetry.holdFrame], ['held', true, 60, 83]);
});

test('measured wait and hold follow eligibility, identity and cancellation rules', () => {
  const begun = beginHomeApplicationTransition(null, identity(), { kind: 'close' }, { measuredTiming: true }).state;
  const inhibited = step(begun, 12, { eligible: false });
  assert.equal(inhibited.state, begun);
  assert.equal(inhibited.processedUpdates, 12);
  assert.equal(advanceHomeApplicationTransition(begun, identity(2), 12, eligible).state, begun, 'stale identity cannot advance');
  assert.equal(cancelHomeApplicationTransition(begun, identity()).state, null);
  assert.equal(cancelHomeApplicationTransition(begun, identity(2)).state, begun);
  assert.equal(beginHomeApplicationTransition(begun, identity(), { kind: 'close' }).state, begun, 'same identity stays idempotent');

  let held = step(step(step(begun, 60).state, 20).state, 30).state;
  assert.equal(held.phase, 'held');
  assert.equal(step(held, 5, { eligible: false }).state, held);
  assert.equal(cancelHomeApplicationTransition(held, identity()).state, null);
});

test('measured timing is close-only and leaves source-timed close and switch unchanged', () => {
  assert.throws(() => beginHomeApplicationTransition(null, identity(), { kind: 'switch', appId: 'camera' }, { measuredTiming: true }), RangeError);
  for (const intent of [{ kind: 'close' }, { kind: 'switch', appId: 'camera' }]) {
    const begun = beginHomeApplicationTransition(null, identity(), intent).state;
    assert.equal(begun.phase, 'closing');
    assert.equal(begun.measuredTiming, false);
    assert.equal(begun.waitFrame, null);
    const terminal = step(begun, 50).state;
    assert.equal(terminal.phase, 'terminal');
    const after = step(terminal, 50);
    assert.equal(after.processedUpdates, 1);
    assert.equal(after.state.phase, intent.kind === 'close' ? 'exiting' : 'complete');
    assert.equal(after.state.holdFrame, null);
  }
});
