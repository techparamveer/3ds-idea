import test from 'node:test';
import assert from 'node:assert/strict';
import { pauseCapturePrecondition } from '../scripts/reference/pause-capture-precondition.mjs';

const requested = { app: 'health-safety', nativeStatus: 'ready' };
const dataset = () => ({ menu: 'app', app: 'health-safety', selected: '8',
  nativeScreen: 'ready', nativeScreenFailure: '', sleeping: 'false', dialog: '',
  screenPresented: JSON.stringify({ frame: 10, validPublication: true, paint: { at: 100, phase: 'app' } }),
  screenPaint: JSON.stringify({ at: 100, phase: 'app' }) });
function withHost(t, data) {
  const old = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true,
    value: { querySelector: () => data ? { dataset: data } : null } });
  t.after(() => old ? Object.defineProperty(globalThis, 'document', old) : Reflect.deleteProperty(globalThis, 'document'));
}
function publish(data, after) {
  const paint = { at: after.observedAt + 1, phase: 'app' };
  data.screenPaint = JSON.stringify(paint);
  data.screenPresented = JSON.stringify({ frame: 11, validPublication: true, paint });
}

test('stock pause preparation requires a fresh matching paired publication after readiness', t => {
  const data = dataset(); withHost(t, data);
  const after = pauseCapturePrecondition(requested);
  assert.equal(after.observedFrame, 10);
  assert.equal(pauseCapturePrecondition({ ...requested, after }), false);
  publish(data, after);
  assert.equal(pauseCapturePrecondition({ ...requested, after }), true);
});

test('portfolio has inactive native assets, never fabricated native readiness', t => {
  const data = { ...dataset(), app: 'work', selected: '0', nativeScreen: 'inactive' };
  withHost(t, data);
  assert.equal(pauseCapturePrecondition({ app: 'work', nativeStatus: 'ready' }), null);
  const portfolio = { app: 'work', nativeStatus: 'inactive' };
  const after = pauseCapturePrecondition(portfolio);
  publish(data, after);
  assert.equal(pauseCapturePrecondition({ ...portfolio, after }), true);
});

test('wrong app, failed/loading screen, changed selection, sleep and dialog do not qualify', t => {
  const data = dataset(); withHost(t, data);
  const after = pauseCapturePrecondition(requested); publish(data, after);
  for (const patch of [{ menu: 'home' }, { app: 'camera' }, { nativeScreen: 'loading' },
    { nativeScreen: 'error' }, { nativeScreen: 'inactive' }, { nativeScreenFailure: 'source unavailable' },
    { sleeping: 'true' }, { dialog: 'close' }, { selected: '9' }]) {
    const saved = { ...data }; Object.assign(data, patch);
    assert.ok(!pauseCapturePrecondition({ ...requested, after }), JSON.stringify(patch));
    Object.assign(data, saved);
  }
});

test('invalid, stale, foreign or unrendered paint cannot prepare HOME input', t => {
  const data = dataset(); withHost(t, data);
  const after = pauseCapturePrecondition(requested); publish(data, after);
  const valid = JSON.parse(data.screenPresented);
  for (const receipt of [{ ...valid, validPublication: false }, { ...valid, frame: 10 },
    { ...valid, paint: { ...valid.paint, at: after.observedAt - 1 } },
    { ...valid, paint: { ...valid.paint, phase: 'home' } },
    { ...valid, paint: { ...valid.paint, at: valid.paint.at + 1 } }]) {
    data.screenPresented = JSON.stringify(receipt);
    assert.equal(pauseCapturePrecondition({ ...requested, after }), false);
  }
});

test('absent host cannot prepare a pause', t => {
  withHost(t, null);
  assert.equal(pauseCapturePrecondition(requested), null);
});
