import test from 'node:test';
import assert from 'node:assert/strict';
import { folderCapturePrecondition } from '../scripts/reference/folder-capture-precondition.mjs';

const selected = { folderIdentity: 'folder:1', folderSelection: '28' };
const view = () => ({ status: 'active', stage: 'active', generation: 'g:1',
  selection: { kind: 'folder', key: 'folder:1' },
  resourceTicket: { generation: 'g:1', requestEpoch: 2 },
  primary: { selection: { kind: 'folder', key: 'folder:1' }, generation: 'g:1',
    requestEpoch: 2, activationEpoch: 3, motion: { visible: true, requestedVisible: true } } });
const receipt = (frame, at, validPublication = true) => ({ frame, validPublication,
  paint: { at, phase: 'home', cursor: { selectedSlot: 28 } } });
function withHost(t, data) {
  const old = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: {
    querySelector: () => ({ dataset: data }),
  } });
  t.after(() => old ? Object.defineProperty(globalThis, 'document', old) : Reflect.deleteProperty(globalThis, 'document'));
}
const dataset = () => ({ menu: 'home', selected: '28', folderBannerFallback: 'false',
  nativeScreenFailure: '', folderBanner: JSON.stringify(view()), screenPresented: JSON.stringify(receipt(10, 100)) });

test('activation after a fresh fallback receipt still requires a subsequent paint and render', t => {
  const data = dataset(); withHost(t, data);
  data.folderBannerFallback = 'true';
  assert.equal(folderCapturePrecondition(selected), null);
  data.folderBannerFallback = 'false';
  const after = folderCapturePrecondition(selected);
  assert.equal(after.observedFrame, 10);
  assert.equal(after.activationEpoch, 3);
  assert.equal(folderCapturePrecondition({ ...selected, after }), false);
  data.screenPresented = JSON.stringify(receipt(11, after.observedAt - 1));
  assert.equal(folderCapturePrecondition({ ...selected, after }), false);
  data.screenPresented = JSON.stringify(receipt(12, after.observedAt + 1));
  assert.equal(folderCapturePrecondition({ ...selected, after }), true);
});

test('a later render cannot qualify a changed generation, request or activation', t => {
  const data = dataset(); withHost(t, data);
  const after = folderCapturePrecondition(selected);
  data.screenPresented = JSON.stringify(receipt(11, after.observedAt + 1));
  for (const field of ['generation', 'requestEpoch', 'activationEpoch']) {
    const changed = view(); changed.primary[field] = field === 'generation' ? 'g:2' : 9;
    if (field === 'generation') changed.generation = changed.resourceTicket.generation = 'g:2';
    if (field === 'requestEpoch') changed.resourceTicket.requestEpoch = 9;
    data.folderBanner = JSON.stringify(changed);
    assert.equal(folderCapturePrecondition({ ...selected, after }), false, field);
  }
});

test('invalid, stale, foreign and failed root publications cannot prepare the fixture', t => {
  const data = dataset(); withHost(t, data);
  const after = folderCapturePrecondition(selected);
  for (const [patch, expected] of [
    [{ screenPresented: JSON.stringify(receipt(11, after.observedAt + 1, false)) }, false],
    [{ screenPresented: JSON.stringify(receipt(10, after.observedAt + 1)) }, false],
    [{ nativeScreenFailure: 'missing source label' }, null],
    [{ menu: 'folder' }, null], [{ selected: '29' }, null],
  ]) {
    const saved = { ...data }; Object.assign(data, patch);
    assert.equal(folderCapturePrecondition({ ...selected, after }), expected);
    Object.assign(data, saved);
  }
});
