import assert from 'node:assert/strict';
import test from 'node:test';
import { createFlickDetector, type FlickSample } from './flick-gesture.ts';

const still = { x: 0, y: 0, z: 0 };
const gyro = (t: number, beta: number, alpha = 0, gamma = 0, linear = still): FlickSample => ({ t, acceleration: linear, accelerationIncludingGravity: null, rotationRate: { alpha, beta, gamma } });
const run = (samples: FlickSample[]) => { const detector = createFlickDetector(); return samples.filter(sample => detector.push(sample)).length; };
/** 60 Hz samples of `rate(t)` over `ms`. */
const series = (ms: number, sample: (t: number) => FlickSample, from = 0) => Array.from({ length: Math.round(ms / 16) }, (_, i) => sample(from + i * 16));
const flickAt = (t0: number) => [-60, -280, -420, -300, -90].map((beta, i) => gyro(t0 + i * 16, beta));

test('a sharp pitch flick fires once', () => {
  assert.equal(run([...series(400, t => gyro(t, 5)), ...flickAt(400), ...series(400, t => gyro(t, 4), 480)]), 1);
});

test('either pitch direction counts', () => {
  assert.equal(run(flickAt(0).map(s => ({ ...s, rotationRate: { ...s.rotationRate!, beta: -s.rotationRate!.beta } }))), 1);
});

test('walking with the phone in hand does not fire', () => {
  // ~2 steps per second: pitch sway and vertical bounce at their usual sizes.
  const walk = series(10_000, t => gyro(t, 90 * Math.sin(t / 1000 * 2 * Math.PI * 2), 30 * Math.sin(t / 170), 40 * Math.cos(t / 230), { x: 1.5 * Math.sin(t / 90), y: 5 * Math.sin(t / 80), z: 3 * Math.cos(t / 110) }));
  assert.equal(run(walk), 0);
});

test('hand tremor and a single noisy spike do not fire', () => {
  const jitter = series(3000, t => gyro(t, 25 * Math.sin(t * 1.7) + 10 * Math.cos(t * 3.1)));
  jitter[90] = gyro(jitter[90].t, 900);
  assert.equal(run(jitter), 0);
});

test('a sideways shake or spin about another axis does not fire', () => {
  // The pitch component alone would qualify; the other axis dominates it.
  const shake = (axis: 'alpha' | 'gamma') => [-200, -400, -450, -380, -150, 0].map((v, i) => gyro(i * 16, i === 5 ? 0 : 260, axis === 'alpha' ? v : 0, axis === 'gamma' ? v : 0));
  assert.equal(run(shake('gamma')), 0);
  assert.equal(run(shake('alpha')), 0);
});

test('sustained fast rotation is not a flick', () => {
  assert.equal(run([...series(1200, t => gyro(t, 320)), gyro(1200, 0)]), 0);
  assert.equal(run([...series(160, t => gyro(t, 320)), gyro(160, 0)]), 1, 'the same rate briefly is a flick');
});

test('cooldown suppresses a second flick straight after the first', () => {
  assert.equal(run([...flickAt(0), ...flickAt(300)]), 1);
  assert.equal(run([...flickAt(0), ...flickAt(1600)]), 2);
});

test('reset clears the cooldown so a re-armed detector fires at once', () => {
  const detector = createFlickDetector();
  assert.equal([...flickAt(0), gyro(80, 0)].filter(sample => detector.push(sample)).length, 1);
  detector.reset();
  assert.equal([...flickAt(300), gyro(380, 0)].filter(sample => detector.push(sample)).length, 1);
});

test('a dropped-sample gap breaks the confirming run', () => {
  assert.equal(run([gyro(0, 300), gyro(400, 300)]), 0);
});

test('sensors without a gyroscope use gravity-corrected acceleration', () => {
  const g = { x: 0, y: 9.8, z: 0.5 };
  const tilt = (t: number, y: number, z: number): FlickSample => ({ t, acceleration: null, rotationRate: null, accelerationIncludingGravity: { x: g.x, y: g.y + y, z: g.z + z } });
  assert.equal(run([...series(500, t => tilt(t, 0, 0)), tilt(500, -8, 6), tilt(516, -18, 12), tilt(532, -20, 10), tilt(548, -6, 2)]), 1);
  // Lying the phone down slowly moves gravity from y to z without firing.
  assert.equal(run(series(3000, t => { const k = Math.min(1, t / 3000); return tilt(t, -9.8 * k, 9.3 * k); })), 0);
});
