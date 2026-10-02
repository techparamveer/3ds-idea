import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  HOME_APPLICATION_TRANSITION_SOURCE,
  advanceHomeApplicationTransition,
  beginHomeApplicationTransition,
  cancelHomeApplicationTransition,
  homeApplicationTransitionPresentation,
  sampleHomeApplicationTransition,
} from '../src/os/home-application-transition.ts';

const identity = (transitionId = 1, owner = 'health-safety:1', generation = 'system:1') => ({
  generation, transitionId, owner,
});

test('close presentation names and bounds match the delivered BannerBG source', () => {
  const url = new URL('../public/os/firmware/10.7.0-32E/models/home-background/model.json', import.meta.url);
  const source = JSON.parse(readFileSync(url));
  const clips = [...source.skeletalAnimations, ...source.materialAnimations];
  const clip = name => clips.find(candidate => candidate.Name === name);

  for (const record of Object.values(HOME_APPLICATION_TRANSITION_SOURCE)) {
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
});

test('begin is immutable, idempotent for one identity, and replaces only on an explicit fresh identity', () => {
  const first = beginHomeApplicationTransition(null, identity(), { kind: 'close' });
  assert.equal(first.processedUpdates, 0);
  assert.deepEqual(first.observations.map(item => item.kind), ['started']);
  assert.deepEqual(first.state, {
    identity: identity(), intent: { kind: 'close' }, phase: 'closing', appQuitFrame: 0,
  });
  assert.equal(Object.isFrozen(first.state), true);
  assert.equal(beginHomeApplicationTransition(first.state, identity(), { kind: 'switch', appId: 'camera' }).state, first.state);

  const replacement = beginHomeApplicationTransition(first.state, identity(2, 'work:2'), { kind: 'switch', appId: 'about' });
  assert.deepEqual(replacement.state.identity, identity(2, 'work:2'));
  assert.deepEqual(replacement.state.intent, { kind: 'switch', appId: 'about' });
  assert.equal(replacement.state.appQuitFrame, 0);
});

test('AppQuit advances once per eligible host update and stops at a paintable terminal barrier', () => {
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

  const commit = advanceHomeApplicationTransition(terminal.state, identity(), 50, { eligible: true });
  assert.equal(commit.state.phase, 'complete');
  assert.equal(commit.processedUpdates, 1);
  assert.deepEqual(commit.observations.map(item => [item.kind, item.stepOffset]), [['commitOwnerClose', 0]]);
  assert.deepEqual(commit.observations[0].intent, { kind: 'close' });
  assert.equal(homeApplicationTransitionPresentation(commit.state), null);
});

test('large batches still retain frame 20 until a later host call', () => {
  const started = beginHomeApplicationTransition(null, identity(), { kind: 'switch', appId: 'camera' }).state;
  const terminal = advanceHomeApplicationTransition(started, identity(), 100, { eligible: true });
  assert.equal(terminal.state.phase, 'terminal');
  assert.equal(terminal.processedUpdates, 20);
  assert.deepEqual(terminal.observations[0].intent, { kind: 'switch', appId: 'camera' });
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
  assert.equal(cancelHomeApplicationTransition(state, identity()).state, null);
});

test('invalid identities, intents, update counts and eligibility fail explicitly', () => {
  assert.throws(() => beginHomeApplicationTransition(null, identity(1, '', 'system:1'), { kind: 'close' }), RangeError);
  assert.throws(() => beginHomeApplicationTransition(null, identity(), { kind: 'switch', appId: '' }), RangeError);
  const state = beginHomeApplicationTransition(null, identity(), { kind: 'close' }).state;
  assert.throws(() => advanceHomeApplicationTransition(state, identity(), -1, { eligible: true }), RangeError);
  assert.throws(() => advanceHomeApplicationTransition(state, identity(), 1, {}), RangeError);
});
