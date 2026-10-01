import test from 'node:test';
import assert from 'node:assert/strict';

import { getTitle } from '../src/os/app-registry.ts';
import { createStockModule, initialSharedData } from '../src/os/stock-apps.ts';

const context = { now: 0, shared: initialSharedData() };
const photos = Array.from({ length: 8 }, (_, index) => ({
  id: `photo-${index + 1}`,
  title: `Photo ${index + 1}`,
  src: `/fixture/photo-${index + 1}.jpg`,
}));
const media = {
  folders: [
    { id: 'first', title: 'First folder', photos: photos.slice(0, 4) },
    { id: 'second', title: 'Second folder', photos: photos.slice(4) },
  ],
  tracks: [],
};

function press(module, state, command, source = 'physical') {
  const down = module.reduce(state, { type: 'button', command, phase: 'down', source }, context);
  const up = module.reduce(down.state, { type: 'button', command, phase: 'up', source }, context);
  assert.deepEqual(down.effects ?? [], []);
  assert.deepEqual(up.effects ?? [], []);
  return up.state;
}

test('Camera completion route joins Welcome, combined paging and physical photo navigation', () => {
  const module = createStockModule(getTitle('camera'), media);
  let state = module.create({}, null, context);
  const guide = [];

  for (let page = 0; page < 5; page++) {
    const view = module.view(state, context);
    guide.push({
      screen: view.screen,
      page: view.data.guidePage,
      left: view.footer.left?.label ?? null,
      right: view.footer.right?.label ?? null,
    });
    if (page < 4) state = press(module, state, 'open');
  }
  assert.deepEqual(guide, [
    { screen: 'guide', page: 0, left: null, right: 'Next' },
    { screen: 'guide', page: 1, left: 'Back', right: 'Next' },
    { screen: 'guide', page: 2, left: 'Back', right: 'Next' },
    { screen: 'guide', page: 3, left: 'Back', right: 'Next' },
    { screen: 'guide', page: 4, left: 'Back', right: 'OK' },
  ]);

  state = press(module, state, 'open');
  assert.deepEqual(module.view(state, context).rows.map(row => row.id), [
    'folder:portfolio-camera-all',
    'folder:first',
    'folder:second',
  ]);

  state = press(module, state, 'open');
  assert.equal(state.screen, 'gallery');
  assert.equal(state.folderId, 'portfolio-camera-all');
  assert.equal(state.selection, 1, 'the display-only date cell leaves the first photo selected');
  assert.deepEqual(module.view(state, context).rows.map(row => row.id), [
    'camera-date-group',
    ...photos.map(photo => `photo:${photo.id}`),
  ]);

  for (let step = 0; step < 5; step++) state = press(module, state, 'right');
  assert.equal(state.selection, 6);
  assert.equal(state.cameraBrowse.anchor, 1, 'selection crossing the six-cell boundary requests page 2');
  assert.equal(module.view(state, context).footer.right.action, 'photo:photo-6');

  state = press(module, state, 'open');
  assert.deepEqual([state.screen, state.photoId], ['photo', 'photo-6']);
  state = press(module, state, 'right');
  assert.equal(state.photoId, 'photo-7');
  state = press(module, state, 'left');
  assert.equal(state.photoId, 'photo-6');
});

test.todo('Camera photo Back restores the nonzero gallery selection that opened it');

test('Camera empty destination stays read-only after final OK', () => {
  const module = createStockModule(getTitle('camera'), { folders: [], tracks: [] });
  let state = module.create({}, null, context);
  for (let page = 0; page < 5; page++) state = press(module, state, 'open');

  const view = module.view(state, context);
  assert.equal(state.screen, 'main');
  assert.deepEqual(view.rows, []);
  assert.deepEqual(view.text, ['There are no photos.']);
  assert.equal(view.footer.right, undefined);
  for (const action of ['capture', 'shoot', 'settings', 'zoom-in', 'zoom-out']) {
    assert.equal(module.reduce(state, { type: 'action', id: action }, context).state, state);
  }
});

test('camera-applet enters the shared folder route without owning Welcome', () => {
  const module = createStockModule(getTitle('camera-applet'), media);
  let state = module.create({}, null, context);
  assert.equal(state.screen, 'main');
  assert.equal(Object.hasOwn(state, 'guidePage'), false);
  assert.equal(module.view(state, context).rows[0].id, 'folder:portfolio-camera-all');

  state = press(module, state, 'open');
  assert.deepEqual([state.screen, state.folderId, state.selection], ['gallery', 'portfolio-camera-all', 1]);
});
