import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, reduceMenu, renameFolder, MAX_FOLDERS } from '../src/os/state.ts';
import { createPortfolioState, tickSystem, reduceSystem, saveSettings, restoreSettings } from '../src/os/system.ts';
import { moveHomeItem, selectHomeLocation } from '../src/os/home-layout.ts';
import { createHomeFolderIdentities, getHomeFolderIdentities, getHomeFolderIdentity } from '../src/os/home-folder-identity.ts';

const home = () => tickSystem(createPortfolioState(), 3001);
const root = slot => ({ folder: null, slot });
const child = (folder, slot) => ({ folder, slot });
const create = (state, slot) => reduceMenu({ ...selectHomeLocation(state, root(slot)), panel: null }, 'open');
const remove = (state, slot) => reduceMenu({ ...selectHomeLocation(state, root(slot)), panel: 'folder-settings', panelChoice: 1 }, 'open');
const key = getHomeFolderIdentity;
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value); for (const child of Object.values(value)) freeze(child);
  }
  return value;
}

test('new Systems own independent deterministic identity records; lookups do not allocate', () => {
  const a = home(), b = home();
  assert.deepEqual(a.system.homeFolderIdentities, { bySlot: {}, nextAllocation: 1 });
  assert.notEqual(a.system.homeFolderIdentities, b.system.homeFolderIdentities);
  assert.equal(key(a, 40), undefined);
  const createdA = create(freeze(a), 40), createdB = create(b, 40);
  assert.equal(typeof key(createdA, 40), 'string');
  assert.equal(key(createdA, 40), key(createdB, 40), 'keys require a service generation across Systems');
  assert.equal(createdA.system.homeFolderIdentities.nextAllocation, 2);
  assert.deepEqual(a.system.homeFolderIdentities.bySlot, {});
});

test('rename, open, selection and independent default-number wrap preserve identity', () => {
  let state = create({ ...home(), nextFolderNumber: 99 }, 40);
  const original = key(state, 40);
  state = renameFolder(freeze(state), '');
  assert.equal(key(state, 40), original);
  state = reduceMenu(state, 'open');
  assert.equal(key(state, 40), original);
  state = create(state, 41);
  assert.equal(state.nextFolderNumber, 2);
  assert.notEqual(key(state, 41), original);
  assert.equal(key(state, 40), original);
  assert.equal(state.system.homeFolderIdentities.nextAllocation, 3);
});

test('delete retires a key; same-slot same-label recreation receives a new identity', () => {
  const before = renameFolder(create(home(), 40), 'Work'), original = key(before, 40);
  const deleted = remove(freeze(before), 40);
  assert.equal(key(deleted, 40), undefined);
  assert.equal(Object.hasOwn(deleted.system.homeFolderIdentities.bySlot, 40), false);
  assert.equal(deleted.system.homeFolderIdentities.nextAllocation, 2);
  const recreated = renameFolder(create(deleted, 40), 'Work');
  assert.equal(recreated.folders[40], before.folders[40]);
  assert.notEqual(key(recreated, 40), original);
  assert.equal(key(before, 40), original);
});

test('folder swaps carry identities with contents, including identical labels', () => {
  let state = renameFolder(create(home(), 40), 'Same');
  state = renameFolder(create(state, 41), 'Same');
  state = moveHomeItem(state, root(0), child(40, 3));
  const a = key(state, 40), b = key(state, 41), counter = state.system.homeFolderIdentities.nextAllocation;
  const swapped = moveHomeItem(freeze(state), root(40), root(41));
  assert.equal(key(swapped, 40), b); assert.equal(key(swapped, 41), a);
  assert.equal(swapped.system.folderLayouts[41][3], 'work');
  assert.equal(swapped.system.homeFolderIdentities.nextAllocation, counter);
  assert.equal(key(state, 40), a);
});

test('moves to empty and app slots retain identity and vacated slots can create distinct folders', () => {
  let state = create(home(), 40);
  const original = key(state, 40);
  state = moveHomeItem(freeze(state), root(40), root(42));
  assert.equal(key(state, 40), undefined); assert.equal(key(state, 42), original);
  state = moveHomeItem(freeze(state), root(42), root(0));
  assert.equal(key(state, 42), undefined); assert.equal(key(state, 0), original);
  assert.equal(state.system.layout[42], 'work');
  state = create(state, 40);
  assert.notEqual(key(state, 40), original);
});

test('empty/nonempty transitions and rejected nonempty deletion retain the folder key', () => {
  const empty = create(home(), 40), original = key(empty, 40);
  const full = moveHomeItem(freeze(empty), root(0), child(40, 0));
  assert.equal(key(full, 40), original);
  const rejected = remove(freeze(full), 40);
  assert.equal(key(rejected, 40), original);
  assert.equal(rejected.system.homeFolderIdentities, full.system.homeFolderIdentities);
  const emptied = moveHomeItem(rejected, child(40, 0), root(0));
  assert.equal(key(emptied, 40), original);
});

test('rejected creation and placement do not consume identity allocations', () => {
  const occupied = home();
  assert.equal(create(occupied, 0).system.homeFolderIdentities, occupied.system.homeFolderIdentities);
  const full = { ...initialState, selected: 70, folders: Object.fromEntries(Array.from({ length: MAX_FOLDERS }, (_, i) => [i, ''])) };
  assert.equal(reduceMenu(full, 'open'), full);
  const state = create(create(home(), 40), 41);
  assert.equal(moveHomeItem(state, root(40), child(41, 0)), state);
  assert.equal(moveHomeItem(state, root(40), root(40)), state);
});

test('layout reset clears live keys while retaining allocation history', () => {
  const before = create(create(home(), 40), 41), previous = new Set(Object.values(before.system.homeFolderIdentities.bySlot));
  const reset = reduceSystem({ ...freeze(before), system: { ...before.system, preferences: true } }, 'reset-layout', 4500);
  assert.deepEqual(reset.system.homeFolderIdentities.bySlot, {});
  assert.equal(reset.system.homeFolderIdentities.nextAllocation, 3);
  const created = create(reset, 40);
  assert.equal(previous.has(key(created, 40)), false);
});

test('schema 4 omits identities; validated restore ignores forged identity records and counters', () => {
  let before = create(create(home(), 40), 41);
  before = remove(before, 40); before = create(before, 42);
  const saved = JSON.parse(saveSettings(before));
  assert.equal(saved.version, 4);
  assert.equal(Object.hasOwn(saved, 'homeFolderIdentities'), false);
  assert.equal(Object.hasOwn(saved, 'system'), false);
  const forged = { bySlot: { 41: 'duplicate', 42: 'duplicate' }, nextAllocation: 1 };
  saved.homeFolderIdentities = forged; saved.system = { homeFolderIdentities: forged };
  const restored = restoreSettings(freeze(before), JSON.stringify(saved));
  assert.deepEqual(restored.system.homeFolderIdentities, createHomeFolderIdentities(restored.folders));
  assert.equal(new Set(Object.values(restored.system.homeFolderIdentities.bySlot)).size, 2);
  assert.equal(restored.system.homeClock.updateCount, 0);
  const added = create(restored, 43);
  assert.equal(new Set(Object.values(added.system.homeFolderIdentities.bySlot)).size, 3);
  assert.equal(restoreSettings(before, JSON.stringify({ ...saved, folders: { 0: 'Overlaps app' } })), before);
});

test('legacy restores deterministically mint unique keys without trusting labels or extra fields', () => {
  for (const version of [undefined, 1, 2, 3]) {
    const saved = JSON.parse(saveSettings(home()));
    if (version === undefined) delete saved.version; else saved.version = version;
    if (version !== 3) delete saved.nextFolderNumber;
    saved.folders = { 42: '', 40: '', 41: '' };
    saved.homeFolderIdentities = { bySlot: { 40: 'same', 41: 'same', 42: 'same' }, nextAllocation: -1 };
    const restored = restoreSettings(home(), JSON.stringify(saved));
    assert.equal(new Set([key(restored, 40), key(restored, 41), key(restored, 42)]).size, 3);
    assert.deepEqual(restored.system.homeFolderIdentities, createHomeFolderIdentities({ 40: '', 41: '', 42: '' }));
  }
});

test('isolated menu callers retain fallback keys through creation, rename and deletion', () => {
  const before = { ...initialState, folders: { 7: '', 30: '' } }, a = key(before, 7), b = key(before, 30);
  assert.notEqual(a, b); assert.equal(before.homeFolderIdentities, undefined);
  let state = create(freeze(before), 2);
  assert.equal(state.system, undefined); assert.equal(key(state, 7), a); assert.equal(key(state, 30), b);
  state = renameFolder(selectHomeLocation(state, root(7)), 'Changed');
  assert.equal(key(state, 7), a);
  state = remove(state, 7); state = create(state, 7);
  assert.notEqual(key(state, 7), a); assert.equal(key(state, 30), b);
  assert.equal(restoreSettings(state, saveSettings(home())), state, 'restore requires a complete System');
});

test('legacy Systems without identity storage materialize pre-move keys and retire them on reset', () => {
  const state = { ...home(), folders: { 40: '', 41: '' } };
  delete state.system.homeFolderIdentities;
  const a = key(state, 40), b = key(state, 41);
  const moved = moveHomeItem(freeze(state), root(40), root(41));
  assert.equal(key(moved, 40), b); assert.equal(key(moved, 41), a);
  const reset = reduceSystem({ ...state, system: { ...state.system, preferences: true } }, 'reset-layout', 4500);
  assert.equal(reset.system.homeFolderIdentities.nextAllocation, 3);
  assert.equal([a, b].includes(key(create(reset, 40), 40)), false);
  assert.deepEqual(getHomeFolderIdentities(state), createHomeFolderIdentities(state.folders));
});
