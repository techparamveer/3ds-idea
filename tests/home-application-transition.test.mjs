import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  HOME_APPLICATION_TRANSITION_SOURCE,
  advanceHomeApplicationTransition,
  beginHomeApplicationTransition,
  cancelHomeApplicationTransition,
  homeApplicationTransitionFooterExit,
  homeApplicationTransitionPresentation,
  sampleHomeApplicationTransition,
} from '../src/os/home-application-transition.ts';

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
  const footerExit = JSON.parse(readFileSync(launcherUrl)).animations[HOME_APPLICATION_TRANSITION_SOURCE.postModalFooterExit.clip];
  assert.ok(footerExit);
  assert.equal(footerExit.frames - 1, HOME_APPLICATION_TRANSITION_SOURCE.postModalFooterExit.lastFrame);
  assert.equal(footerExit.loop, false);
  assert.deepEqual(footerExit.groups, ['G_Scene_00']);
  const footerSceneTracks = footerExit.tracks.filter(track => track.target === 'N_Scene_00');
  assert.deepEqual(footerSceneTracks.map(track => [track.property, track.keys.map(key => [key.frame, key.value])]), [
    ['translation.y', [[0, 0], [14, -32]]],
    ['alpha', [[0, 255], [14, 0]]],
  ]);
});

test('begin is immutable, idempotent for one identity, and replaces only on an explicit fresh identity', () => {
  const first = beginHomeApplicationTransition(null, identity(), { kind: 'close' });
  assert.equal(first.processedUpdates, 0);
  assert.deepEqual(first.observations.map(item => item.kind), ['started']);
  assert.deepEqual(first.state, {
    identity: identity(), intent: { kind: 'close' }, phase: 'closing', appQuitFrame: 0,
    dialogExitFrame: null, footerExitFrame: null,
  });
  assert.equal(Object.isFrozen(first.state), true);
  assert.equal(beginHomeApplicationTransition(first.state, identity(), { kind: 'switch', appId: 'camera' }).state, first.state);

  const replacement = beginHomeApplicationTransition(first.state, identity(2, 'work:2'), { kind: 'switch', appId: 'about' });
  assert.deepEqual(replacement.state.identity, identity(2, 'work:2'));
  assert.deepEqual(replacement.state.intent, { kind: 'switch', appId: 'about' });
  assert.equal(replacement.state.appQuitFrame, 0);
  assert.equal(replacement.state.dialogExitFrame, null);
  assert.equal(replacement.state.footerExitFrame, null);
});

test('close stops at AppQuit, dialog-exit and post-modal footer paint barriers before commit', () => {
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
    clip: 'LncBtmBtn_02_SceneOut', frame: 0,
  });

  const footerTerminal = advanceHomeApplicationTransition(footerStart.state, identity(), 50, { eligible: true });
  assert.equal(footerTerminal.state.phase, 'footer-terminal');
  assert.equal(footerTerminal.state.footerExitFrame, 14);
  assert.equal(footerTerminal.processedUpdates, 14, 'remaining batch updates cannot skip the footer terminal boundary');
  assert.deepEqual(footerTerminal.observations.map(item => [item.kind, item.stepOffset]), [['footerExitTerminalPresented', 13]]);

  const commit = advanceHomeApplicationTransition(footerTerminal.state, identity(), 50, { eligible: true });
  assert.equal(commit.state.phase, 'complete');
  assert.equal(commit.processedUpdates, 1);
  assert.deepEqual(commit.observations.map(item => [item.kind, item.stepOffset]), [['commitOwnerClose', 0]]);
  assert.deepEqual(commit.observations[0].intent, { kind: 'close' });
  assert.equal(homeApplicationTransitionPresentation(commit.state), null);
});

test('switch retains the original AppQuit terminal-to-commit lifecycle', () => {
  const started = beginHomeApplicationTransition(null, identity(), { kind: 'switch', appId: 'camera' }).state;
  const terminal = advanceHomeApplicationTransition(started, identity(), 100, { eligible: true });
  assert.equal(terminal.state.phase, 'terminal');
  assert.equal(terminal.processedUpdates, 20);
  assert.deepEqual(terminal.observations[0].intent, { kind: 'switch', appId: 'camera' });
  assert.equal(terminal.state.dialogExitFrame, null);
  assert.equal(terminal.state.footerExitFrame, null);

  const commit = advanceHomeApplicationTransition(terminal.state, identity(), 100, { eligible: true });
  assert.equal(commit.state.phase, 'complete');
  assert.equal(commit.state.dialogExitFrame, null);
  assert.equal(commit.state.footerExitFrame, null);
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

  const replacement = beginHomeApplicationTransition(exiting, identity(2, 'camera:2'),
    { kind: 'switch', appId: 'about' }).state;
  assert.deepEqual(replacement.identity, identity(2, 'camera:2'));
  assert.deepEqual(replacement.intent, { kind: 'switch', appId: 'about' });
  assert.equal(replacement.phase, 'closing');
  assert.equal(replacement.dialogExitFrame, null);
  assert.equal(replacement.footerExitFrame, null);
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
  assert.deepEqual(homeApplicationTransitionFooterExit(state), { clip: 'LncBtmBtn_02_SceneOut', frame: 0 });
  assert.deepEqual(homeApplicationTransitionFooterExit(state, true), { clip: 'LncBtmBtn_02_SceneOut', frame: 14 });
  assert.equal(cancelHomeApplicationTransition(state, identity()).state, null);
});

test('invalid identities, intents, update counts and eligibility fail explicitly', () => {
  assert.throws(() => beginHomeApplicationTransition(null, identity(1, '', 'system:1'), { kind: 'close' }), RangeError);
  assert.throws(() => beginHomeApplicationTransition(null, identity(), { kind: 'switch', appId: '' }), RangeError);
  const state = beginHomeApplicationTransition(null, identity(), { kind: 'close' }).state;
  assert.throws(() => advanceHomeApplicationTransition(state, identity(), -1, { eligible: true }), RangeError);
  assert.throws(() => advanceHomeApplicationTransition(state, identity(), 1, {}), RangeError);
});
