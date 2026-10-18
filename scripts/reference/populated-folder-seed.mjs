import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { apps } from '../../src/os/apps.ts';
import { enableHomeControls } from '../../src/os/home-controls.ts';
import { getHomeFolderIdentity } from '../../src/os/home-folder-identity.ts';
import { moveHomeItem, selectHomeLocation } from '../../src/os/home-layout.ts';
import { getHomeNavigation, homeGridMetrics } from '../../src/os/home-navigation.ts';
import { createPortfolioState, dispatchSystemEvent, restoreSettings, saveSettings, STORAGE_KEY, tickSystem } from '../../src/os/system.ts';

const ROOT_SLOT = 28, HEALTH_ROOT_SLOT = 8, CHILD_SLOT = 2;
const METHOD = 'Offline reducers: four density touches, vacant root 28 touch and Create folder, then moveHomeItem places Health root 8 at child 2; saveSettings persists the root-selected layout.';

// The browser imports the same record through openFirmwareStorage legacy preferences and restoreSettings.
export function validatePopulatedFolderSeed(raw) {
  const saved = JSON.parse(raw), initial = createPortfolioState(), restored = restoreSettings(initial, raw);
  assert.notEqual(restored, initial, 'Real restoreSettings accepts the seed');
  assert.equal(saved.version, 4, 'Seed uses the current persisted schema');
  assert.deepEqual(Object.keys(saved.folders ?? {}), [String(ROOT_SLOT)], 'Exactly one root folder at slot 28');
  assert.equal(saved.folders[ROOT_SLOT], '\uFF11 (New Folder)', 'Seed keeps the generated folder label');
  assert.deepEqual(saved.folderLayouts, { [ROOT_SLOT]: { [CHILD_SLOT]: 'health-safety' } }, 'Health alone at folder child 2');
  const rootIds = Object.values(saved.layout ?? {});
  assert.ok(!rootIds.includes('health-safety'), 'Health is not also on the root');
  assert.equal(apps.length, 9, 'Nine portfolio apps');
  for (const app of apps) assert.ok(rootIds.includes(app.id), `Portfolio app ${app.id} stays on the root`);
  const nav = getHomeNavigation(restored), root = nav.rootView, child = nav.folderViews[ROOT_SLOT];
  assert.equal(nav.activeFolderSlot, null, 'Boot starts on the root');
  assert.deepEqual([root.selectedSlot, root.currentLeftSlot, homeGridMetrics(false, root.density).rows], [ROOT_SLOT, 0, 6], 'Root folder 28 selected, six rows, left slot 0');
  assert.deepEqual([child?.selectedSlot, child?.currentLeftSlot, child && homeGridMetrics(true, child.density).rows], [CHILD_SLOT, 0, 1], 'Health child 2 in one folder row');
  return { folderIdentity: getHomeFolderIdentity(restored, ROOT_SLOT) };
}

export function buildPopulatedFolderSeed() {
  let state = enableHomeControls(tickSystem(createPortfolioState(), 3001)), now = 4000;
  const tap = (x, y) => {
    for (const phase of ['down', 'up']) state = dispatchSystemEvent(state, { type: 'touch', phase, x, y, pointerId: 1 }, now++);
    now += 700; state = tickSystem(state, now);
  };
  for (let n = 0; n < 4; n++) tap(307, 16);
  tap(136, 160); tap(210, 226);
  assert.ok(Object.hasOwn(state.folders, ROOT_SLOT), 'Create folder fills vacant root 28');
  assert.equal(state.system.layout[HEALTH_ROOT_SLOT], 'health-safety', 'Health starts at root 8');
  state = moveHomeItem(state, { folder: null, slot: HEALTH_ROOT_SLOT }, { folder: ROOT_SLOT, slot: CHILD_SLOT });
  const raw = saveSettings(selectHomeLocation(state, { folder: null, slot: ROOT_SLOT }));
  return { storageKey: STORAGE_KEY, raw, sha256: createHash('sha256').update(raw).digest('hex'), method: METHOD, ...validatePopulatedFolderSeed(raw) };
}
