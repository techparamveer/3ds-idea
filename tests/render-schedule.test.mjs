import test from 'node:test';
import assert from 'node:assert/strict';
import { MathUtils } from 'three';
import { createRenderSchedule } from '../src/scene/render-schedule.ts';

test('the first frame renders with shadows, then an unchanged pose is skipped', () => {
  const schedule = createRenderSchedule();
  assert.deepEqual(schedule.plan([155, -.16]), { render: true, shadows: true });
  schedule.presented([155, -.16]);
  assert.deepEqual(schedule.plan([155, -.16]), { render: false, shadows: false });
});

test('LCD, material and buffer invalidation renders once without recomputing shadows', () => {
  const schedule = createRenderSchedule();
  schedule.presented([1, 2]);
  schedule.invalidate();
  assert.deepEqual(schedule.plan([1, 2]), { render: true, shadows: false });
  schedule.presented([1, 2]);
  assert.deepEqual(schedule.plan([1, 2]), { render: false, shadows: false });
});

test('geometry motion, including a released control leaving the sample, renders with shadows', () => {
  const schedule = createRenderSchedule();
  schedule.presented([155, -.16, .6]);
  assert.deepEqual(schedule.plan([155, -.16, .3]), { render: true, shadows: true });
  // A button that returned to rest is removed from the sample.
  assert.deepEqual(schedule.plan([155, -.16]), { render: true, shadows: true });
});

test('a converging damped pose keeps rendering until it is within epsilon, then stops', () => {
  const schedule = createRenderSchedule(1e-6);
  let yaw = .4, frames = 0;
  schedule.presented([yaw]);
  for (let step = 0; step < 2000; step++) {
    yaw = MathUtils.damp(yaw, -.16, 7, 1 / 60);
    const plan = schedule.plan([yaw]);
    if (!plan.render) continue;
    frames++;
    schedule.presented([yaw]);
  }
  assert.ok(frames > 60, 'the visible settle is fully rendered');
  assert.ok(frames < 400, 'rendering stops once the residual is sub-epsilon');
  assert.ok(Math.abs(yaw + .16) < 1e-6);
});

test('changes below epsilon between presented frames accumulate instead of being lost', () => {
  const schedule = createRenderSchedule(1e-6);
  schedule.presented([0]);
  assert.equal(schedule.plan([5e-7]).render, false);
  assert.equal(schedule.plan([1.5e-6]).render, true);
});
