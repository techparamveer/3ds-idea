import assert from 'node:assert/strict';

export function parseFolderFixture(value, { scenario, activation }) {
  assert.ok(['baseline', 'native-six-rows', 'populated-health', 'populated-health-entry'].includes(value), 'Supported folder fixture');
  if (scenario !== 'folder') assert.equal(value, 'baseline', 'Folder fixtures are folder-only');
  if (activation === 'tile') {
    assert.equal(scenario, 'folder', 'Tile activation is folder-only');
    assert.ok(['native-six-rows', 'populated-health', 'populated-health-entry'].includes(value), 'Tile activation requires a six-row fixture');
  }
  if (value.startsWith('populated-health')) assert.equal(activation, 'tile', 'Populated Health capture requires the same root-tile touch route');
  return value;
}

// Standalone for the same observed-state predicate to run in Playwright and offline tests.
export function populatedFolderObservation({ stage, folderIdentity = null, rows = null }) {
  const host = document.querySelector('.console-stage');
  if (!host) return null;
  const data = host.dataset, cursor = JSON.parse(data.homeCursor ?? 'null');
  const banner = JSON.parse(data.folderBanner ?? 'null'), paint = JSON.parse(data.screenPaint ?? 'null');
  const receipt = JSON.parse(data.screenPresented ?? 'null');
  if (data.nativeScreen === 'error' || data.nativeScreenFailure) throw new Error(`Populated folder native readiness failed: ${data.nativeScreenFailure}`);
  if (data.app !== '' || data.dialog || data.sleeping !== 'false'
    || !cursor || cursor.focus?.toolbarActive !== false) return null;
  const expected = {
    density: { menu: 'home', rows, selected: 0 },
    health: { menu: 'home', rows: 6, selected: 8, center: [62, 110] },
    vacant: { menu: 'home', rows: 6, selected: 28, center: [146, 166] },
    root: { menu: 'home', rows: 6, selected: 28, center: [146, 166] },
    pickup: { menu: 'home', rows: 6, selected: 8 },
    hover: { menu: 'folder', rows: 1, selected: 0 },
    child: { menu: 'folder', rows: 1, selected: 2, center: [244, 137] },
  }[stage];
  if (!expected) throw new Error(`Unknown populated folder observation stage ${stage}`);
  if (data.menu !== expected.menu || data.rows !== String(expected.rows) || cursor.selectedSlot !== expected.selected
    || data.selected !== String(data.menu === 'folder' ? 28 : expected.selected)) return null;
  if (expected.center && (cursor.primary?.center?.x !== expected.center[0] || cursor.primary?.center?.y !== expected.center[1])) return null;
  if (stage === 'pickup' || stage === 'hover') {
    if (cursor.mode !== 14 || cursor.tilePickup?.source?.folder !== null || cursor.tilePickup?.source?.slot !== 8) return null;
  } else if (cursor.mode !== 0 || cursor.tilePickup || !cursor.tileTouch || cursor.tileTouch.globalCapture
    || cursor.tileTouch.pending.length || Object.values(cursor.tileTouch.widgets).some(widget => widget.state !== 0)) return null;
  if (stage === 'health' || stage === 'child') {
    if (banner?.selection?.kind !== 'app' || banner.selection.id !== 'health-safety'
      || !/^HOME Menu\. Health and Safety Information\./.test(host.querySelector('[aria-live]')?.textContent ?? '')) return null;
  }
  if (stage === 'vacant' && (banner?.selection?.kind !== 'default'
    || !/^HOME Menu\. Empty slot\./.test(host.querySelector('[aria-live]')?.textContent ?? ''))) return null;
  if (stage === 'root' && (banner?.selection?.kind !== 'folder' || folderIdentity && banner.selection.key !== folderIdentity)) return null;
  if (stage === 'child' || stage === 'hover') {
    if (data.nativeScreen !== 'ready' || paint?.phase !== 'home' || paint.entryMotion?.folder?.folderFrame !== 16
      || paint.entryMotion.folder.captureFrame !== 8 || paint.cursor?.selectedSlot !== expected.selected
      || receipt?.validPublication !== true || JSON.stringify(receipt.paint) !== JSON.stringify(paint)) return null;
    if (stage === 'child' && (paint.cursor?.mode !== 0 || paint.cursor?.tilePickup || paint.cursor?.focus?.toolbarActive !== false
      || paint.cursor?.primary?.center?.x !== 244 || paint.cursor?.primary?.center?.y !== 137)) return null;
  }
  return { stage, menu: data.menu, rows: Number(data.rows), rootSelected: Number(data.selected), selectedSlot: cursor.selectedSlot,
    center: cursor.primary?.center ?? null, selection: banner?.selection ?? null, nativeScreen: data.nativeScreen,
    ...(stage === 'pickup' || stage === 'hover' ? { source: cursor.tilePickup.source, pickupObserved: true } : {}),
    ...(stage === 'child' || stage === 'hover' ? { terminalLower: paint.entryMotion.folder, upperReady: true, pairedReceipt: receipt } : {}) };
}

export async function returnFromPopulatedFolder(folderIdentity, { touch, waitFor }) {
  const child = await waitFor({ stage: 'child', folderIdentity });
  await touch(59, 54);
  const root = await waitFor({ stage: 'root', folderIdentity });
  assert.equal(root.selection.key, folderIdentity, 'Back restores the exact populated folder');
  return { child, root, route: { kind: 'touch', x: 59, y: 54 } };
}

// Verification adaptation: a pre-boot persisted layout replaces setup input, so this sends none.
export async function prepareSeededPopulatedFolderFixture({ seed, waitFor }) {
  assert.ok(typeof seed?.folderIdentity === 'string' && seed.folderIdentity, 'Seed carries its restored folder identity');
  const root = await waitFor({ stage: 'root', folderIdentity: seed.folderIdentity });
  assert.equal(root.rows, 6, 'Seeded root restores six rows');
  assert.equal(root.rootSelected, 28, 'Seeded root restores folder slot 28');
  assert.equal(root.selection?.key, seed.folderIdentity, 'Browser restore keeps the exact seeded folder identity');
  assert.equal(root.selection.nativeType, 10, 'Seeded folder presents as populated');
  return { name: 'populated-health-entry', folderIdentity: seed.folderIdentity, root: { rows: 6, leftSlot: 0, selectedSlot: 28 },
    child: { rows: 1, leftSlot: 0, selectedSlot: 2, app: 'health-safety' },
    entryRoute: { kind: 'touch', x: 136, y: 160 }, backRoute: { kind: 'touch', x: 59, y: 54 },
    seed: { storageKey: seed.storageKey, sha256: seed.sha256, method: seed.method, raw: seed.raw },
    adaptation: 'Verification adaptation: a fresh browser profile is seeded before boot with a HOME layout persisted by saveSettings and imported through openFirmwareStorage legacy preferences and restoreSettings. The seeded setup is not native input parity; no native populated fixture, timing or pixel match is established.',
    method: 'Boot restores root folder 28 holding Health at child 2; wait for exact identity, populated type and settled input before the captured ordinary root-tile entry; header Back precedes each repeat.',
    observedRoot: root, nativeCompared: false };
}

export async function preparePopulatedFolderFixture({ state, touch, pointer, waitFor, prepareRoot }) {
  const initial = await state();
  assert.equal(initial.menu, 'home'); assert.equal(initial.rows, '2'); assert.equal(initial.selected, '0');
  for (const rows of [3, 4, 5, 6]) { await touch(307, 16); await waitFor({ stage: 'density', rows }); }
  await touch(62, 110);
  const health = await waitFor({ stage: 'health' });
  await touch(136, 160);
  const vacant = await waitFor({ stage: 'vacant' });
  await touch(210, 226);
  const created = await waitFor({ stage: 'root' }), folderIdentity = created.selection.key;
  assert.ok(typeof folderIdentity === 'string' && folderIdentity, 'Created folder has an observed identity');
  const sourcePreparation = await prepareRoot(folderIdentity, '28');
  let pickup, hover, held = false;
  try {
    await pointer.down(62, 110);
    held = true;
    pickup = await waitFor({ stage: 'pickup', folderIdentity });
    await pointer.move(146, 166);
    hover = await waitFor({ stage: 'hover', folderIdentity });
    await pointer.move(244, 137);
  } finally { if (held) await pointer.up(); }
  const returned = await returnFromPopulatedFolder(folderIdentity, { touch, waitFor });
  return { name: 'populated-health', folderIdentity, root: { rows: 6, leftSlot: 0, selectedSlot: 28 },
    child: { rows: 1, leftSlot: 0, selectedSlot: 2, app: 'health-safety' },
    entryRoute: { kind: 'touch', x: 136, y: 160 }, backRoute: returned.route,
    healthOrigin: { browserRootSlot: health.selectedSlot, nativeRootSlot: null },
    adaptation: 'Browser portfolio population places Health at root slot 8. A matched native populated fixture has not been established. Pickup movement, folder hover/drop and setup waits use existing browser adaptations. No native timing or pixel match is established.',
    method: 'Ordinary density and tile touches create root folder 28; long-press Health, observe pickup selecting root 8, then hover into the folder; wait for paired lower terminal and upper readiness before moving and releasing at child 2; header Back precedes both captured root-tile entries.',
    health, vacant, created, sourcePreparation, pickup, hover, returned, nativeCompared: false };
}
