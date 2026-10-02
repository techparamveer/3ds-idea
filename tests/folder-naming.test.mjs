import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { initialState, reduceMenu, renameFolder, MAX_FOLDERS } from '../src/os/state.ts';
import { createPortfolioState, tickSystem, touchSystem, reduceSystem, saveSettings, restoreSettings, moveHomeItem } from '../src/os/system.ts';
import { openFirmwareStorage } from '../src/os/app-persistence.ts';

import {selectHomeLocation} from '../src/os/home-layout.ts';
const home = () => tickSystem(createPortfolioState(), 3001);
const create = (state, slot) => reduceMenu({ ...selectHomeLocation(state, {folder: null, slot}), panel: null }, 'open');
const remove = (state, slot) => reduceMenu({ ...selectHomeLocation(state, {folder: null, slot}), panel: 'folder-settings', panelChoice: 1 }, 'open');
const root = slot => ({ folder: null, slot });
const child = (folder, slot) => ({ folder, slot });

test('fresh footer creation stores the native first name and icon-leading fullwidth numeral', () => {
  const before = home();
  const after = touchSystem(selectHomeLocation(before, {folder: null, slot: 40}), 210, 226, 4000);
  assert.equal(after.folders[40], '\uff11 (New Folder)');
  assert.equal(after.folders[40].codePointAt(0), 0xff11);
  assert.equal(after.nextFolderNumber, 2);
  assert.equal(after.opened, false);
  assert.deepEqual(after.system.layout, before.system.layout);
  assert.deepEqual(after.system.folderLayouts, before.system.folderLayouts);
  assert.deepEqual(before.folders, {});
  assert.equal(before.nextFolderNumber, 1);
});

test('the creation sequence survives rename and delete without counting labels or live folders', () => {
  let state = create(home(), 40);
  state = renameFolder(state, 'Work');
  state = create(state, 41);
  assert.equal(state.folders[40], 'Work');
  assert.equal(state.folders[41], '\uff12 (New Folder)');
  state = remove(state, 40);
  state = create(state, 42);
  assert.equal(state.folders[42], '\uff13 (New Folder)');
  state = renameFolder(state, '');
  assert.equal(state.folders[42], '');
  state = remove(remove(state, 41), 42);
  assert.deepEqual(state.folders, {});
  state = create(state, 40);
  assert.equal(state.folders[40], '\uff14 (New Folder)');
  assert.equal(state.nextFolderNumber, 5);
});

test('two-digit names use two fullwidth digits and the saved sequence wraps 99 to 1', () => {
  let state = create({ ...home(), nextFolderNumber: 9 }, 40);
  assert.equal(state.folders[40], '\uff19 (New Folder)');
  state = create(state, 41);
  assert.equal(state.folders[41], '\uff11\uff10 (New Folder)');
  state = create({ ...state, nextFolderNumber: 99 }, 42);
  assert.equal(state.folders[42], '\uff19\uff19 (New Folder)');
  assert.equal(state.nextFolderNumber, 1);
  state = create(state, 43);
  assert.equal(state.folders[43], '\uff11 (New Folder)');
  assert.equal(state.nextFolderNumber, 2);
});

test('opening existing folders, rejected creation and nonempty deletion do not consume a number', () => {
  let state = create(home(), 40);
  assert.equal(reduceMenu(state, 'open').nextFolderNumber, 2);
  state = moveHomeItem(state, root(0), child(40, 0));
  assert.equal(remove(state, 40).nextFolderNumber, 2);
  assert.equal(remove(state, 40).folders[40], '\uff11 (New Folder)');
  const occupied = { ...home(), selected: 0, nextFolderNumber: 17 };
  assert.equal(reduceMenu(occupied, 'open'), occupied, 'low-level creation cannot overlap a portfolio title');
  assert.equal(reduceSystem(occupied, 'open', 4000).nextFolderNumber, 17, 'launch does not create a folder');
  const full = { ...initialState, selected: 70, nextFolderNumber: 17,
    folders: Object.fromEntries(Array.from({ length: MAX_FOLDERS }, (_, slot) => [slot, ''])) };
  assert.equal(reduceMenu(full, 'open'), full);
});

test('moving and swapping folders carries labels and contents while retaining the global sequence', () => {
  let state = create(create(home(), 40), 41);
  state = moveHomeItem(state, root(0), child(40, 0));
  state = moveHomeItem(state, root(40), root(41));
  assert.equal(state.folders[41], '\uff11 (New Folder)');
  assert.equal(state.system.folderLayouts[41][0], 'work');
  assert.equal(state.folders[40], '\uff12 (New Folder)');
  assert.equal(state.nextFolderNumber, 3);
  state = moveHomeItem(state, root(41), root(42));
  assert.equal(state.folders[42], '\uff11 (New Folder)');
  assert.equal(state.system.folderLayouts[42][0], 'work');
  assert.equal(state.nextFolderNumber, 3);
  state = create(state, 41);
  assert.equal(state.folders[41], '\uff13 (New Folder)');
});

test('schema 4 round-trips the independent sequence through settings and IndexedDB', async () => {
  const storage = await openFirmwareStorage({ indexedDB: new IDBFactory(), databaseName: 'folder-naming-test' });
  try {
    let state = create({ ...home(), nextFolderNumber: 98 }, 40);
    state = renameFolder(state, 'Personal');
    const raw = saveSettings(state);
    assert.equal(JSON.parse(raw).version, 4);
    await storage.savePreferences(raw);
    const loaded = await storage.load();
    const restored = restoreSettings(home(), loaded.preferences);
    assert.equal(restored.folders[40], 'Personal');
    assert.equal(restored.nextFolderNumber, 99);
    assert.deepEqual(restored.system.layout, state.system.layout);
    assert.equal(create(restored, 41).folders[41], '\uff19\uff19 (New Folder)');
  } finally { storage.dispose(); }
});

test('legacy saves preserve custom and deliberately empty labels without guessing historical numbering', () => {
  for (const version of [undefined, 1, 2]) {
    const saved = JSON.parse(saveSettings(home()));
    if (version === undefined) delete saved.version; else saved.version = version;
    delete saved.nextFolderNumber;
    saved.folders = { 40: 'Custom', 41: '', 42: '\uff19\uff19 (New Folder)' };
    const restored = restoreSettings(home(), JSON.stringify(saved));
    assert.deepEqual(restored.folders, saved.folders);
    assert.deepEqual(restored.system.layout, saved.layout);
    assert.equal(restored.nextFolderNumber, 1, 'migration policy, not inferred from 99 or folder count');
    assert.equal(create(restored, 43).folders[43], '\uff11 (New Folder)');
  }
});

test('invalid or missing schema 4 counters reject the saved layout without losing current state', () => {
  const state = create(home(), 40);
  for (const value of [undefined, null, 0, -1, 100, 1.5, '2']) {
    const saved = JSON.parse(saveSettings(state));
    if (value === undefined) delete saved.nextFolderNumber; else saved.nextFolderNumber = value;
    assert.equal(restoreSettings(state, JSON.stringify(saved)), state);
  }
});

test('the portfolio reset-layout action retains naming history while restoring portfolio placement', () => {
  let state = create(home(), 40);
  state = moveHomeItem(state, root(0), child(40, 0));
  state = reduceSystem({ ...state, system: { ...state.system, preferences: true } }, 'reset-layout', 4500);
  assert.deepEqual(state.system.layout, home().system.layout);
  assert.deepEqual(state.folders, {});
  assert.equal(state.nextFolderNumber, 2);
  assert.equal(create(state, 40).folders[40], '\uff12 (New Folder)');
});
