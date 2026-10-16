import assert from 'node:assert/strict';
import test from 'node:test';
import { selectVacantFolderCaptureSlot } from '../scripts/verify-animation-flow.mjs';
import { initialAppLayout } from '../src/os/app-registry.ts';

function fixture(layout, folders = new Set(), override = value => value) {
  let slot = 0;
  const inputs = [];
  return {
    inputs,
    key: async key => { assert.equal(key, 'ArrowRight'); inputs.push(key); slot += 2; },
    wait: async ms => { assert.equal(ms, 180); },
    state: async () => override({ menu: 'home', rows: '2', selected: String(slot),
      homeCursor: JSON.stringify({ focus: { toolbarActive: false } }),
      folderBanner: JSON.stringify({ selection: { kind: layout[slot] ? 'app' : folders.has(slot) ? 'folder' : 'default' } }),
      announcement: `HOME Menu. ${layout[slot] ?? 'Empty slot'}.` }),
  };
}

test('folder capture preserves installed Hack LDN and finds the next vacant first-row slot', async () => {
  const layout = initialAppLayout(), before = { ...layout }, navigation = fixture(layout);
  assert.equal(layout[14], 'hack-ldn-2025');
  assert.equal(await selectVacantFolderCaptureSlot(navigation), '16');
  assert.equal(navigation.inputs.length, 8);
  assert.deepEqual(layout, before);
});

test('folder capture retains the old slot when it is actually vacant', async () => {
  const layout = { ...initialAppLayout() }; delete layout[14];
  const navigation = fixture(layout);
  assert.equal(await selectVacantFolderCaptureSlot(navigation), '14');
  assert.equal(navigation.inputs.length, 7);
});

test('an existing folder is not mistaken for a vacant slot by its announcement', async () => {
  const navigation = fixture(initialAppLayout(), new Set([16]));
  assert.equal(await selectVacantFolderCaptureSlot(navigation), '18');
});

test('folder fixture rejects wrong phase, density, focus and undelivered navigation', async () => {
  for (const override of [value => ({ ...value, menu: 'app' }), value => ({ ...value, rows: '6' }),
    value => ({ ...value, homeCursor: JSON.stringify({ focus: { toolbarActive: true } }) }),
    value => ({ ...value, selected: '0' })]) {
    await assert.rejects(selectVacantFolderCaptureSlot(fixture(initialAppLayout(), new Set(), override)));
  }
});

test('folder fixture stops at the end of the grid without wrapping or opening an app', async () => {
  const navigation = fixture(Object.fromEntries(Array.from({ length: 300 }, (_, slot) => [slot, 'occupied'])));
  await assert.rejects(selectVacantFolderCaptureSlot(navigation), /No vacant first-row/);
  assert.equal(navigation.inputs.length, 149);
});
