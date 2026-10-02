import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createPortfolioState, homeSlotAppId } from '../src/os/system.ts';
import { selectHomeSlot, setHomeDensity, settleHomeNavigation } from '../src/os/home-navigation.ts';
import { createHomeBalloonPresentation, advanceHomeBalloonPresentation, selectHomeSettingsBalloonText, selectHomeHealthBalloonText, selectHomeSoundBalloonText, selectHomeCameraBalloonText } from '../src/os/home-balloon-presentation.ts';
import { poseNativeLayout } from '../src/os/native-layout.ts';
import { getNativeSettingsTitleBalloon, getNativeSoundTitleBalloon, getNativeCameraTitleBalloon, getHomePresentation } from '../src/os/home-presentation.ts';
import { getTitle } from '../src/os/app-registry.ts';
import ts from 'typescript';

const sourceUrl = new URL('../src/os/firmware-presentation.ts', import.meta.url);
const { outputText } = ts.transpileModule(readFileSync(sourceUrl, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const stub = 'data:text/javascript;base64,' + Buffer.from('export class NativeLayoutRenderer {}').toString('base64');
const source = outputText.replace(/(from\s*['"])(\.[^'"]+)(['"])/g, (_match, prefix, path, suffix) =>
  prefix + (path === './native-renderer' ? stub : new URL(path.endsWith('.ts') ? path : `${path}.ts`, sourceUrl).href) + suffix);
const { createFirmwareHome } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

const density0 = state => settleHomeNavigation(setHomeDensity(state, 0));
const home = () => {
  const state = createPortfolioState();
  return density0({ ...state, folders: { 2: '１ (New Folder)' }, system: { ...state.system, phase: 'home' } });
};

test('native folder balloon enters through Appear and retains content through DisAppear', () => {
  const idle = home(), selected = selectHomeSlot(idle, 2);
  let pose = createHomeBalloonPresentation(idle);
  assert.equal(pose.visible, false);
  pose = advanceHomeBalloonPresentation(pose, selected);
  assert.deepEqual([pose.clip, pose.frame, pose.label, pose.baseX, pose.bodyOffsetX],
    ['Appear', 0, '１ (New Folder)', 84, -76]);
  for (let frame = 1; frame <= 5; frame++) {
    pose = advanceHomeBalloonPresentation(pose, selected);
    assert.deepEqual([pose.visible, pose.frame], [true, frame]);
  }
  pose = advanceHomeBalloonPresentation(pose, selectHomeSlot(selected, 1));
  assert.deepEqual([pose.visible, pose.clip, pose.frame, pose.label],
    [true, 'DisAppear', 0, '１ (New Folder)']);
  for (let frame = 1; frame <= 5; frame++) {
    pose = advanceHomeBalloonPresentation(pose, selectHomeSlot(selected, 1));
    assert.deepEqual([pose.visible, pose.frame], [true, frame]);
  }
  pose = advanceHomeBalloonPresentation(pose, selectHomeSlot(selected, 1));
  assert.equal(pose.visible, false);
});

test('initial selected folder uses the source static settled pose', () => {
  const pose = createHomeBalloonPresentation(selectHomeSlot(home(), 2));
  assert.deepEqual([pose.visible, pose.clip, pose.frame], [true, 'Appear', 5]);
});

test('selected Settings title uses the native balloon anchor and a manifest-sourced SMDH title', () => {
  const manifest = JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/manifest.json', import.meta.url)));
  const settings = manifest.titles['0004001000022000'];
  assert.equal(settings.longDescription, 'System Settings');
  assert.equal(settings.longDescriptionSource.path, 'ExeFS/icon');
  assert.equal(settings.longDescriptionSource.sha256, '40a78f71c6560dcdae1e69d6186702379f128df97d95ac34bc080eb5558615f1');
  assert.equal(settings.longDescriptionConversion.languageIndex, 1);
  assert.equal(getTitle('system-settings').title, settings.longDescription);
  assert.equal(settings.publisher, 'Nintendo');
  assert.equal(settings.publisherSource.sha256, settings.longDescriptionSource.sha256);
  assert.equal(settings.publisherConversion.fieldOffset, 0x388);
  assert.equal(selectHomeSettingsBalloonText(manifest), 'System Settings\nNintendo');
  assert.equal(selectHomeSettingsBalloonText({ ...manifest, titles: { ...manifest.titles,
    '0004001000022000': { ...settings, publisherSource: { ...settings.publisherSource, sha256: '0'.repeat(64) } } } }), null);
  assert.equal(manifest.home.launcher, 'packs/home/launcher.json');
  assert.equal(manifest.resources[manifest.home.launcher].sources[0].sha256,
    '826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834');
  const state = createPortfolioState();
  const selected = settleHomeNavigation(selectHomeSlot({ ...state, system: { ...state.system, phase: 'home' } }, 9));
  const view = getHomePresentation(selected);
  assert.equal(view.tiles.find(tile => tile.index === 9).y + 36, 166);
  assert.deepEqual([view.currentDensity, view.targetDensity, view.rows], [1, 1, 2]);
  assert.equal(getNativeSettingsTitleBalloon(selected, view), null, 'settled two-row Settings has no title balloon');
  assert.equal(createHomeBalloonPresentation(selected).visible, false);
  assert.equal(getNativeSettingsTitleBalloon({ ...selected, panel: 'settings' }, view), null);
  const oneRow = density0(selected);
  assert.equal(getHomePresentation(oneRow).tiles.find(tile => tile.index === 9).y + 36, 161);
  assert.deepEqual(getNativeSettingsTitleBalloon(oneRow, getHomePresentation(oneRow)),
    { label: settings.longDescription, baseX: 84, bodyOffsetX: -76 });
  assert.deepEqual(createHomeBalloonPresentation(oneRow), {
    visible: true, desired: true, clip: 'Appear', frame: 5,
    label: settings.longDescription, baseX: 84, bodyOffsetX: -76, titleId: '0004001000022000',
  });
  const departing = advanceHomeBalloonPresentation(createHomeBalloonPresentation(oneRow), selectHomeSlot(oneRow, 0));
  assert.deepEqual([departing.visible, departing.desired, departing.clip, departing.frame], [true, false, 'DisAppear', 0]);
  const changing = setHomeDensity(oneRow, 1);
  assert.equal(getNativeSettingsTitleBalloon(changing, getHomePresentation(changing)), null);
  const returning = setHomeDensity(selected, 0);
  assert.equal(getNativeSettingsTitleBalloon(returning, getHomePresentation(returning)), null);
  const threeRows = settleHomeNavigation(setHomeDensity(oneRow, 2));
  assert.equal(getNativeSettingsTitleBalloon(threeRows, getHomePresentation(threeRows)), null);
});

test('native HOME balloon painter binds sourced title and publisher without a fallback', () => {
  const manifest = JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/manifest.json', import.meta.url)));
  const launcher = JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/home/launcher.json', import.meta.url)));
  const calls = [];
  const renderer = { packs: { launcher }, draw(_ctx, bank, layout, options) {
    calls.push({ bank, layout, options }); return true;
  } };
  const state = createPortfolioState();
  const selected = settleHomeNavigation(selectHomeSlot({ ...state, system: { ...state.system, phase: 'home' } }, 9));
  const oneRow = density0(selected);
  const balloon = createHomeBalloonPresentation(oneRow);
  const live = { ...oneRow, system: { ...oneRow.system, homeControls: { balloon } } };
  const view = getHomePresentation(live);
  const text = selectHomeSettingsBalloonText(manifest);
  const painter = createFirmwareHome({ renderer, settingsBalloonText: text });
  assert.equal(painter.folderBalloon({}, live, view), true);
  assert.deepEqual(calls[0], { bank: 'launcher', layout: 'LncBlln_00', options: {
    bindings: [{ name: 'LncBlln_00_Appear', frame: 5 }], overrides: {
      N_Base_00: { translation: [84, 0, 0] }, N_LR_00: { translation: [-76, -6, 0] },
      T_Blln_00: { text: 'System Settings\nNintendo' },
    },
  } });
  const unavailable = createFirmwareHome({ renderer, settingsBalloonText: null });
  assert.equal(unavailable.folderBalloon({}, live, view), false);
  assert.equal(calls.length, 1, 'missing publisher never draws a title-only native balloon');
});

test('retained frames bind the delivered native opacity clips', () => {
  const pack = JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/home/launcher.json', import.meta.url)));
  for (const [clip, first, last] of [['Appear', 0, 255], ['DisAppear', 255, 0]]) {
    const alphas = [0, 5].map(frame => {
      const layout = poseNativeLayout(pack.layouts.LncBlln_00, pack.animations,
        [{ name: `LncBlln_00_${clip}`, frame }]);
      const base = layout.roots[0].children.find(pane => pane.name === 'N_Base_00');
      return base.alpha;
    });
    assert.deepEqual(alphas, [first, last]);
  }
});


test('Health one-row balloon uses verified SMDH text and disappears on retarget', () => {
  const manifest = JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/manifest.json', import.meta.url)));
  const text = selectHomeHealthBalloonText(manifest);
  assert.equal(text, 'Health and Safety Information\nNintendo');
  const title = manifest.titles['0004001000022300'];
  assert.equal(title.publisherSource.sha256, 'ab6cfc9da9089bb7209bee980ff79b365638e84eacb663e1a792fed58e7a9055');
  const corrupt = structuredClone(manifest);
  corrupt.titles['0004001000022300'].publisherSource.titleId = '0004001000022000';
  assert.equal(selectHomeHealthBalloonText(corrupt), null);
  const base = createPortfolioState();
  const slot = Array.from({ length: 60 }, (_, i) => i).find(i => homeSlotAppId(base, i) === 'health-safety');
  const initial = { ...base, system: { ...base.system, phase: 'home' } };
  const selected = settleHomeNavigation(selectHomeSlot(settleHomeNavigation(setHomeDensity(initial, 0)), slot));
  const balloon = createHomeBalloonPresentation(selected);
  assert.equal(balloon.titleId, '0004001000022300');
  assert.equal(balloon.visible, true);
  const calls = [];
  const renderer = { packs: { launcher: JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/home/launcher.json', import.meta.url))) }, draw(...args) { calls.push(args); return true; } };
  const painter = createFirmwareHome({ renderer, healthBalloonText: text });
  const live = { ...selected, system: { ...selected.system, homeControls: { balloon } } };
  assert.equal(painter.folderBalloon({}, live, getHomePresentation(live)), true);
  assert.equal(calls[0][2], 'LncBlln_00');
  assert.equal(calls[0][3].overrides.T_Blln_00.text, text);
  assert.equal(createFirmwareHome({ renderer, healthBalloonText: null }).folderBalloon({}, live, getHomePresentation(live)), false);
  const departing = advanceHomeBalloonPresentation(balloon, selectHomeSlot(selected, 0));
  assert.equal(departing.clip, 'DisAppear');
  assert.equal(departing.titleId, '0004001000022300');
  assert.equal(createHomeBalloonPresentation(settleHomeNavigation(setHomeDensity(selected, 1))).visible, false);
});


test('Sound one-row title balloon binds verified SMDH metadata and source layout only in eligible HOME states', () => {
  const manifest = JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/manifest.json', import.meta.url)));
  const text = selectHomeSoundBalloonText(manifest);
  assert.equal(text, 'Nintendo 3DS Sound\nNintendo');
  assert.equal(manifest.titles['0004001000022500'].publisherSource.sha256,
    '100f6180ecdd7716d4928676381d729ebad50b94500350f17d52daa16d5ff494');
  const corrupt = structuredClone(manifest);
  corrupt.titles['0004001000022500'].publisherSource.sha256 = '0'.repeat(64);
  assert.equal(selectHomeSoundBalloonText(corrupt), null);
  const base = createPortfolioState();
  const slot = Array.from({ length: 60 }, (_, i) => i).find(i => homeSlotAppId(base, i) === 'sound');
  const selected = settleHomeNavigation(selectHomeSlot(density0({ ...base, system: { ...base.system, phase: 'home' } }), slot));
  const balloon = createHomeBalloonPresentation(selected);
  assert.deepEqual([balloon.visible, balloon.titleId, balloon.frame], [true, '0004001000022500', 5]);
  const view = getHomePresentation(selected);
  for (const mode of [2, 4, 14]) assert.equal(getNativeSoundTitleBalloon(selected, { ...view, mode }), null);
  assert.equal(getNativeSoundTitleBalloon({ ...selected, panel: 'settings' }, view), null);
  assert.equal(getNativeSoundTitleBalloon({ ...selected, opened: true }, view), null);
  assert.equal(getNativeSoundTitleBalloon({ ...selected, system: { ...selected.system, phase: 'app' } }, view), null);
  assert.equal(getNativeSoundTitleBalloon({ ...selected, system: { ...selected.system, homeNavigation: {
    ...selected.system.homeNavigation, focus: { ...selected.system.homeNavigation.focus, toolbarActive: true },
  } } }, view), null);
  assert.equal(createHomeBalloonPresentation(setHomeDensity(selected, 1)).visible, false);
  assert.equal(createHomeBalloonPresentation(settleHomeNavigation(setHomeDensity(selected, 1))).visible, false);
  const calls = [];
  const renderer = { packs: { launcher: JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/home/launcher.json', import.meta.url))) }, draw(...args) { calls.push(args); return true; } };
  const live = { ...selected, system: { ...selected.system, homeControls: { balloon } } };
  assert.equal(createFirmwareHome({ renderer, soundBalloonText: text }).folderBalloon({}, live, view), true);
  assert.equal(calls[0][2], 'LncBlln_00');
  assert.deepEqual(calls[0][3].bindings, [{ name: 'LncBlln_00_Appear', frame: 5 }]);
  assert.equal(calls[0][3].overrides.T_Blln_00.text, text);
  assert.equal(createFirmwareHome({ renderer, soundBalloonText: null }).folderBalloon({}, live, view), false);
  assert.equal(calls.length, 1);
  const departing = advanceHomeBalloonPresentation(balloon, selectHomeSlot(selected, 0));
  assert.deepEqual([departing.titleId, departing.clip, departing.frame], ['0004001000022500', 'DisAppear', 0]);
});

test('Camera one-row title balloon binds verified SMDH metadata and source layout only in eligible HOME states', () => {
  const manifest = JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/manifest.json', import.meta.url)));
  const text = selectHomeCameraBalloonText(manifest);
  assert.equal(text, 'Nintendo 3DS Camera\nNintendo');
  assert.equal(manifest.titles['0004001000022400'].publisherSource.sha256,
    '53534942eaf5b9c11d94e5f5118b4fe1a624e40d83765893185fd2f30a2956a1');
  const corrupt = structuredClone(manifest);
  corrupt.titles['0004001000022400'].publisherSource.sha256 = '0'.repeat(64);
  assert.equal(selectHomeCameraBalloonText(corrupt), null);
  const base = createPortfolioState();
  const slot = Array.from({ length: 60 }, (_, i) => i).find(i => homeSlotAppId(base, i) === 'camera');
  const selected = settleHomeNavigation(selectHomeSlot(density0({ ...base, system: { ...base.system, phase: 'home' } }), slot));
  const balloon = createHomeBalloonPresentation(selected);
  assert.deepEqual([balloon.visible, balloon.titleId, balloon.frame], [true, '0004001000022400', 5]);
  const view = getHomePresentation(selected);
  for (const mode of [2, 4, 14]) assert.equal(getNativeCameraTitleBalloon(selected, { ...view, mode }), null);
  assert.equal(getNativeCameraTitleBalloon({ ...selected, panel: 'settings' }, view), null);
  assert.equal(getNativeCameraTitleBalloon({ ...selected, opened: true }, view), null);
  assert.equal(getNativeCameraTitleBalloon({ ...selected, system: { ...selected.system, phase: 'app' } }, view), null);
  assert.equal(getNativeCameraTitleBalloon({ ...selected, system: { ...selected.system, homeNavigation: {
    ...selected.system.homeNavigation, focus: { ...selected.system.homeNavigation.focus, toolbarActive: true },
  } } }, view), null);
  assert.equal(createHomeBalloonPresentation(setHomeDensity(selected, 1)).visible, false);
  assert.equal(createHomeBalloonPresentation(settleHomeNavigation(setHomeDensity(selected, 1))).visible, false);
  const calls = [];
  const renderer = { packs: { launcher: JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/home/launcher.json', import.meta.url))) }, draw(...args) { calls.push(args); return true; } };
  const live = { ...selected, system: { ...selected.system, homeControls: { balloon } } };
  assert.equal(createFirmwareHome({ renderer, cameraBalloonText: text }).folderBalloon({}, live, view), true);
  assert.equal(calls[0][2], 'LncBlln_00');
  assert.deepEqual(calls[0][3].bindings, [{ name: 'LncBlln_00_Appear', frame: 5 }]);
  assert.equal(calls[0][3].overrides.T_Blln_00.text, text);
  assert.equal(createFirmwareHome({ renderer, cameraBalloonText: null }).folderBalloon({}, live, view), false);
  assert.equal(calls.length, 1);
  const departing = advanceHomeBalloonPresentation(balloon, selectHomeSlot(selected, 0));
  assert.deepEqual([departing.titleId, departing.clip, departing.frame], ['0004001000022400', 'DisAppear', 0]);
});
