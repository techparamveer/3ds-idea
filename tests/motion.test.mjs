import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleIntroPose, INTRO_DURATION_SECONDS, MAX_LID_DEGREES, REST_YAW } from '../src/scene/motion.ts';

test('presentation stays within a three-quarter turn and the mechanical lid stops', () => {
  let previousAngle = 0;
  let minYaw = Infinity;
  let maxYaw = -Infinity;
  for (let time = 0; time <= 5; time += 0.005) {
    const pose = sampleIntroPose(time);
    assert.ok(pose.angle >= previousAngle - 1e-8, 'lid reverses during opening');
    assert.ok(pose.angle >= 0 && pose.angle <= MAX_LID_DEGREES);
    previousAngle = pose.angle;
    minYaw = Math.min(minYaw, pose.yaw);
    maxYaw = Math.max(maxYaw, pose.yaw);
  }
  assert.ok(maxYaw - minYaw < Math.PI / 2, 'intro makes an excessive rotation');
  assert.ok(sampleIntroPose(0.9).yaw < sampleIntroPose(0).yaw, 'initial turn must go left');
});

test('intro begins closed and settles continuously into the readable pose within three seconds', () => {
  assert.equal(sampleIntroPose(0).angle, 0);
  assert.equal(sampleIntroPose(0.6).angle, 0);
  assert.ok(INTRO_DURATION_SECONDS >= 2.5 && INTRO_DURATION_SECONDS <= 3);
  const rest = sampleIntroPose(INTRO_DURATION_SECONDS);
  assert.equal(rest.done, true);
  assert.ok(Math.abs(rest.angle - MAX_LID_DEGREES) < 1e-8);
  assert.ok(Math.abs(rest.yaw - REST_YAW) < 1e-8);
  assert.deepEqual(sampleIntroPose(30), rest);
  const previous = sampleIntroPose(INTRO_DURATION_SECONDS - 0.001);
  assert.ok(Math.abs(previous.angle - rest.angle) < 0.001);
  assert.ok(Math.abs(previous.yaw - rest.yaw) < 0.0001);
});
