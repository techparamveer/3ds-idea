import assert from 'node:assert/strict';
import test from 'node:test';
import { HANDHELD_INTRO, INTRO_DURATION_SECONDS, MAX_LID_DEGREES, REST_YAW, sampleIntroPose } from './motion.ts';

test('the desktop intro still opens to the rest pose', () => {
  assert.deepEqual(sampleIntroPose(INTRO_DURATION_SECONDS), { yaw: REST_YAW, angle: MAX_LID_DEGREES, done: true });
  assert.ok(sampleIntroPose(2).angle > 90);
});

test('the handheld intro turns but keeps the lid shut', () => {
  for (let s = 0; s <= INTRO_DURATION_SECONDS; s += .1) assert.equal(sampleIntroPose(s, HANDHELD_INTRO).angle, 0);
  assert.deepEqual(sampleIntroPose(INTRO_DURATION_SECONDS, HANDHELD_INTRO), { yaw: 0, angle: 0, done: true });
  assert.ok(sampleIntroPose(.9, HANDHELD_INTRO).yaw < -.5, 'the leftward turn remains');
});
