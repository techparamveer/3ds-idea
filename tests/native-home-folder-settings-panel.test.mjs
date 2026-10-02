import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { createPortfolioState, dispatchSystemEvent, tickSystem, touchSystem, moveHomeItem } from '../src/os/system.ts';
import { reduceMenu } from '../src/os/state.ts';
import { selectHomeLocation } from '../src/os/home-layout.ts';
import { getHomeFolderIdentity } from '../src/os/home-folder-identity.ts';
import { getHomeNavigation } from '../src/os/home-navigation.ts';
import { HOME_FOLDER_NOTICE_TARGET, HOME_FOLDER_SETTINGS_TARGETS, homeFolderNoticeActionAt, homeFolderSettingsActionAt } from '../src/os/stock-screen-layout.ts';
import { nativeMessageOverride } from '../src/os/native-layout.ts';
import { escapeUnreadyNativeScreen, releaseUnreadyNativeInput } from '../src/os/native-screen-system.ts';

const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
async function loadPresentation() {
  const url = new URL('../src/os/firmware-presentation.ts', import.meta.url);
  const { outputText } = ts.transpileModule(readFileSync(url, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return import(moduleUrl(outputText.replace(/(from\s*['"])(\.[^'"]+)(['"])/g, (_all, prefix, path, suffix) =>
    prefix + (path === './native-renderer' ? moduleUrl('export class NativeLayoutRenderer {}') : new URL(path.endsWith('.ts') ? path : `${path}.ts`, url).href) + suffix)));
}
const { createFirmwareHome } = await loadPresentation();
const root = new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.json', root)));
const packs = Object.fromEntries(['launcher', 'messages', 'dialog', 'dialogmask', 'sequence'].map(name =>
  [name, JSON.parse(readFileSync(new URL(manifest.home[name], root)))]));

function presenter(source = packs) {
  const draws = [];
  const renderer = {
    packs: source,
    failed: null,
    draw(_ctx, bank, name, options = {}) {
      draws.push({ bank, name, options });
      return name !== this.failed;
    },
  };
  return { home: createFirmwareHome({ renderer }), renderer, draws };
}

test('Folder Settings composes the settled native mask, frame, rows and source messages without a cursor', () => {
  const before = JSON.stringify(packs), { home, draws } = presenter();
  assert.equal(home.folderSettingsLower({}, { panel: 'folder-settings' }), true);
  assert.deepEqual(draws.map(({ bank, name }) => [bank, name]), [
    ['dialogmask', 'DlgMask_D_00'],
    ['dialog', 'Dlg_B_D_01'],
    ['sequence', 'DlgBtn02_00'],
  ]);
  assert.deepEqual(draws[0].options.bindings, [{ name: 'DlgMask_D_00_FadeIn', frame: 20 }]);
  assert.deepEqual(draws[1].options.bindings, [{ name: 'Dlg_B_D_01_FadeIn', frame: 20 }]);
  assert.equal(draws[1].options.textSampling, 'lcd');
  assert.equal(draws[2].options.textSampling, 'lcd');
  const checks = [
    [1, 'TextBox_00', 'lau_dlg_1b_cance'], [1, 'TextBox_01', 'lau_dlg_1b_cance'],
    [2, 'T_Top_00', 'lau_dlg_folder_setting'],
    [2, 'T_BtnB_00', 'lau_dlg_folder_name'], [2, 'T_BtnF_00', 'lau_dlg_folder_name'],
    [2, 'T_BtnB_01', 'lau_dlg_folder_delete'], [2, 'T_BtnF_01', 'lau_dlg_folder_delete'],
  ];
  for (const [draw, pane, label] of checks) {
    assert.deepEqual(draws[draw].options.overrides[pane], nativeMessageOverride(packs.messages, 'menu_msbt_LZ', label, ''));
  }
  assert.ok(draws.every(draw => !(draw.options.bindings ?? []).some(binding => binding.name.includes('Select'))));
  assert.ok(draws.every(draw => !JSON.stringify(draw.options).includes('PtCsr')));
  assert.equal(JSON.stringify(packs), before, 'painting must not mutate shared decoded resources');
});

test('Folder Settings rejects missing source resources and renderer failures explicitly', () => {
  for (const [remove, error] of [
    [source => delete source.messages.messages.menu_msbt_LZ.labels.lau_dlg_folder_name, /message unavailable: lau_dlg_folder_name/],
    [source => delete source.dialogmask.layouts.DlgMask_D_00, /backing mask unavailable/],
    [source => delete source.dialog.animations.Dlg_B_D_01_FadeIn, /frame unavailable/],
    [source => delete source.sequence.layouts.DlgBtn02_00, /button layout unavailable/],
  ]) {
    const source = structuredClone(packs); remove(source);
    assert.throws(() => presenter(source).home.folderSettingsLower({}, { panel: 'folder-settings' }), error);
  }
  const { home, renderer } = presenter();
  renderer.failed = 'DlgBtn02_00';
  assert.throws(() => home.folderSettingsLower({}, { panel: 'folder-settings' }), /lower layout unavailable/);
});

test('populated-folder notice uses the captured one-button layout and exact source message bindings', () => {
  const before = JSON.stringify(packs), { home, draws } = presenter();
  assert.equal(home.folderNotEmptyLower({}, { panel: 'folder-not-empty' }), true);
  assert.deepEqual(draws.map(({ bank, name }) => [bank, name]), [
    ['dialogmask', 'DlgMask_D_00'],
    ['dialog', 'Dlg_A_D_01'],
  ]);
  assert.deepEqual(draws[0].options.bindings, [{ name: 'DlgMask_D_00_FadeIn', frame: 20 }]);
  assert.equal(draws[1].options.textSampling, 'lcd');
  assert.deepEqual(draws[1].options.overrides.TextBoxDialog,
    nativeMessageOverride(packs.messages, 'menu_msbt_LZ', 'lau_dlg_folder_delete_02', ''));
  for (const pane of ['TextBox_00', 'TextBox_01']) assert.deepEqual(draws[1].options.overrides[pane],
    nativeMessageOverride(packs.messages, 'menu_msbt_LZ', 'lau_dlg_1b_ok', ''));
  assert.equal(draws[1].options.overrides.TextBoxDialog.text, 'Folders containing data\ncannot be deleted.');
  assert.equal(draws[1].options.overrides.TextBoxDialog.messageStyle.fontScale[0], packs.messages.styles['message/EU_English/RI_mstl_LZ.bin'].styles[34].fontScale[0]);
  assert.equal(JSON.stringify(packs), before);
});

test('populated-folder notice fails explicitly when any selected native resource is unavailable', () => {
  for (const [remove, error] of [
    [source => delete source.messages.messages.menu_msbt_LZ.labels.lau_dlg_folder_delete_02, /message unavailable: lau_dlg_folder_delete_02/],
    [source => delete source.messages.messages.menu_msbt_LZ.labels.lau_dlg_1b_ok, /message unavailable: lau_dlg_1b_ok/],
    [source => delete source.dialogmask.animations.DlgMask_D_00_FadeIn, /backing mask unavailable/],
    [source => delete source.dialog.layouts.Dlg_A_D_01, /frame unavailable/],
  ]) {
    const source = structuredClone(packs); remove(source);
    assert.throws(() => presenter(source).home.folderNotEmptyLower({}, { panel: 'folder-not-empty' }), error);
  }
  const { home, renderer } = presenter(); renderer.failed = 'Dlg_A_D_01';
  assert.throws(() => home.folderNotEmptyLower({}, { panel: 'folder-not-empty' }), /lower layout unavailable/);
});

test('Folder Settings source touch bounds are half-open and leave the native gaps inert', () => {
  assert.deepEqual(HOME_FOLDER_SETTINGS_TARGETS, [
    { action: 'rename', x: 20, y: 49, width: 280, height: 70 },
    { action: 'delete', x: 20, y: 121, width: 280, height: 70 },
    { action: 'back', x: 20, y: 192, width: 280, height: 28 },
  ]);
  for (const [point, action] of [
    [[20, 49], 'rename'], [[299, 118], 'rename'], [[160, 119], null], [[20, 121], 'delete'],
    [[299, 190], 'delete'], [[160, 191], null], [[20, 192], 'back'], [[299, 219], 'back'],
    [[19, 80], null], [[300, 80], null], [[160, 220], null],
  ]) assert.equal(homeFolderSettingsActionAt(...point), action, point.join(','));
});

test('populated-folder notice touch uses Dlg_A_D_01 Bounding_00 exactly', () => {
  assert.deepEqual(HOME_FOLDER_NOTICE_TARGET, { action: 'open', x: 20, y: 180, width: 280, height: 40 });
  for (const [point, action] of [
    [[20, 180], 'open'], [[299, 219], 'open'], [[19, 180], null], [[300, 219], null],
    [[160, 179], null], [[160, 220], null],
  ]) assert.equal(homeFolderNoticeActionAt(...point), action, point.join(','));
});

const panel = () => {
  let state = tickSystem(createPortfolioState(), 3001);
  state = reduceMenu(selectHomeLocation(state, { folder: null, slot: 40 }), 'open');
  return { ...state, panel: 'folder-settings', panelChoice: 0 };
};
const touch = (state, phase, x, y, now = 4000) => dispatchSystemEvent(state, { type: 'touch', phase, pointerId: 7, x, y }, now);
const tap = (state, x, y) => touch(touch(state, 'down', x, y), 'up', x, y, 4001);

test('Folder Settings touch keeps Rename inert, deletes an empty folder directly and routes native Cancel', () => {
  const initial = panel();
  assert.equal(touchSystem(initial, 160, 80, 4000), initial, 'legacy Rename path does not invent a keyboard');
  assert.equal(tap(initial, 160, 80).panel, 'folder-settings');
  const deleted = tap(initial, 160, 150);
  assert.equal(deleted.panel, null);
  assert.equal(deleted.panelChoice, 0);
  assert.equal(deleted.folders[40], undefined);
  assert.equal(deleted.system.folderLayouts[40], undefined);
  assert.equal(deleted.system.input.touch, null);
  assert.equal(getHomeFolderIdentity(deleted, 40), undefined);
  assert.equal(getHomeNavigation(deleted).folderViews[40], undefined);
  assert.equal(tap(initial, 160, 205).panel, null);
  assert.equal(tap(initial, 10, 219).panel, 'folder-settings', 'old full-width footer route is gone');
});

test('Folder Settings physical activation shares direct empty deletion and opens the populated native notice', () => {
  const empty = reduceMenu(panel(), 'down');
  const deleted = reduceMenu(empty, 'open');
  assert.equal(deleted.panel, null);
  assert.equal(deleted.folders[40], undefined);
  const populated = moveHomeItem(panel(), { folder: null, slot: 0 }, { folder: 40, slot: 0 });
  const pending = tap(populated, 160, 150);
  assert.equal(pending.panel, 'folder-not-empty');
  assert.equal(pending.folders[40], populated.folders[40]);
  assert.deepEqual(pending.system.folderLayouts[40], { 0: 'work' });
  assert.equal(reduceMenu({ ...populated, panelChoice: 1 }, 'open').panel, 'folder-not-empty');
});

test('notice OK requires same-target release and returns to root with folder contents intact', () => {
  const populated = moveHomeItem(panel(), { folder: null, slot: 0 }, { folder: 40, slot: 2 });
  const notice = tap(populated, 160, 150), before = notice.system.folderLayouts[40];
  let state = touch(notice, 'down', 160, 200, 5000);
  state = touch(state, 'up', 10, 200, 5001);
  assert.equal(state.panel, 'folder-not-empty');
  state = touch(touch(state, 'down', 160, 200, 5010), 'cancel', 160, 200, 5011);
  assert.equal(state.panel, 'folder-not-empty');
  state = tap(state, 160, 200);
  assert.equal(state.panel, null); assert.equal(state.opened, false); assert.equal(state.selected, 40);
  assert.equal(state.folders[40], populated.folders[40]); assert.deepEqual(state.system.folderLayouts[40], before);
  assert.equal(state.system.input.touch, null);
});

test('physical A dismisses the notice; B and HOME are explicit browser recovery adaptations', () => {
  const populated = moveHomeItem(panel(), { folder: null, slot: 0 }, { folder: 40, slot: 2 });
  const notice = reduceMenu({ ...populated, panelChoice: 1 }, 'open'), before = notice.system.folderLayouts[40];
  for (const command of ['open', 'back', 'home']) {
    const source = `test:${command}`;
    let dismissed = dispatchSystemEvent(notice, { type: 'button', command, phase: 'down', source }, 5200);
    dismissed = dispatchSystemEvent(dismissed, { type: 'button', command, phase: 'up', source }, 5201);
    assert.equal(dismissed.panel, null); assert.equal(dismissed.opened, false); assert.equal(dismissed.selected, 40);
    assert.equal(dismissed.folders[40], populated.folders[40]); assert.deepEqual(dismissed.system.folderLayouts[40], before);
    assert.deepEqual(dismissed.system.input.held, {});
  }
});

test('Folder Settings phased touch requires release on the originally owned source target', () => {
  const initial = panel();
  let state = touch(initial, 'down', 160, 80);
  state = touch(state, 'up', 160, 150, 4001);
  assert.equal(state.panel, 'folder-settings', 'Rename-to-Delete drag cannot activate Delete');
  assert.equal(state.system.input.touch, null);
  state = touch(initial, 'down', 160, 150, 4010);
  state = touch(state, 'up', 160, 205, 4011);
  assert.equal(state.panel, 'folder-settings', 'Delete-to-Cancel drag cannot close or delete');
  state = touch(touch(initial, 'down', 160, 150, 4020), 'cancel', 160, 150, 4021);
  assert.equal(state.panel, 'folder-settings');
  assert.equal(state.system.input.touch, null);
});

test('Folder Settings loading/error recovery releases input and lets B or HOME return to HOME', () => {
  for (const [status, initial, point] of [['loading', panel(), [160, 150]], ['error', reduceMenu({ ...moveHomeItem(panel(), { folder: null, slot: 0 }, { folder: 40, slot: 2 }), panelChoice: 1 }, 'open'), [160, 200]]]) {
    let state = touch(initial, 'down', ...point);
    assert.ok(state.system.input.touch);
    state = releaseUnreadyNativeInput(state, status, 4100);
    assert.equal(state.panel, initial.panel);
    assert.equal(state.system.input.touch, null);
    state = escapeUnreadyNativeScreen(state, 4101);
    assert.equal(state.panel, null);
    assert.equal(state.system.phase, 'home');
    assert.equal(state.system.input.touch, null);
  }
});
