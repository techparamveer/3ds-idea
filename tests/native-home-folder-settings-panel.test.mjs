import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { createPortfolioState, dispatchSystemEvent, tickSystem, touchSystem } from '../src/os/system.ts';
import { HOME_FOLDER_SETTINGS_TARGETS, homeFolderSettingsActionAt } from '../src/os/stock-screen-layout.ts';
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

const panel = () => ({ ...tickSystem(createPortfolioState(), 3001), panel: 'folder-settings', panelChoice: 0 });
const touch = (state, phase, x, y, now = 4000) => dispatchSystemEvent(state, { type: 'touch', phase, pointerId: 7, x, y }, now);
const tap = (state, x, y) => touch(touch(state, 'down', x, y), 'up', x, y, 4001);

test('Folder Settings touch keeps Rename inert and routes Delete and native Cancel only', () => {
  const initial = panel();
  assert.equal(touchSystem(initial, 160, 80, 4000), initial, 'legacy Rename path does not invent a keyboard');
  assert.equal(tap(initial, 160, 80).panel, 'folder-settings');
  assert.equal(tap(initial, 160, 150).panel, 'delete');
  assert.equal(tap(initial, 160, 205).panel, null);
  assert.equal(tap(initial, 10, 219).panel, 'folder-settings', 'old full-width footer route is gone');
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
  for (const status of ['loading', 'error']) {
    let state = touch(panel(), 'down', 160, 150);
    assert.ok(state.system.input.touch);
    state = releaseUnreadyNativeInput(state, status, 4100);
    assert.equal(state.panel, 'folder-settings');
    assert.equal(state.system.input.touch, null);
    state = escapeUnreadyNativeScreen(state, 4101);
    assert.equal(state.panel, null);
    assert.equal(state.system.phase, 'home');
    assert.equal(state.system.input.touch, null);
  }
});
