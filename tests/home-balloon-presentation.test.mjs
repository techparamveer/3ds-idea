import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createPortfolioState } from '../src/os/system.ts';
import { selectHomeSlot, setHomeDensity, settleHomeNavigation } from '../src/os/home-navigation.ts';
import { createHomeBalloonPresentation, advanceHomeBalloonPresentation, selectHomeSettingsBalloonText } from '../src/os/home-balloon-presentation.ts';
import { poseNativeLayout } from '../src/os/native-layout.ts';
import { getNativeSettingsTitleBalloon, getHomePresentation } from '../src/os/home-presentation.ts';
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
  const selected = settleHomeNavigation(selectHomeSlot({ ...state, system: { ...state.system, phase: 'home' } }, 8));
  const view = getHomePresentation(selected);
  assert.equal(view.tiles.find(tile => tile.index === 8).y + 36, 82);
  assert.deepEqual(getNativeSettingsTitleBalloon(selected, view), { label: settings.longDescription, baseX: 84, bodyOffsetX: -76 });
  assert.deepEqual(createHomeBalloonPresentation(selected), {
    visible: true, desired: true, clip: 'Appear', frame: 5,
    label: settings.longDescription, baseX: 84, bodyOffsetX: -76, titleId: '0004001000022000',
  });
  const departing = advanceHomeBalloonPresentation(createHomeBalloonPresentation(selected), selectHomeSlot(selected, 7));
  assert.deepEqual([departing.visible, departing.desired, departing.clip, departing.frame], [true, false, 'DisAppear', 0]);
  assert.equal(getNativeSettingsTitleBalloon({ ...selected, panel: 'settings' }, view), null);
  assert.equal(getNativeSettingsTitleBalloon(settleHomeNavigation(setHomeDensity(selected, 0)), getHomePresentation(settleHomeNavigation(setHomeDensity(selected, 0)))), null);
});

test('native HOME balloon painter binds sourced title and publisher without a fallback', () => {
  const manifest = JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/manifest.json', import.meta.url)));
  const launcher = JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/home/launcher.json', import.meta.url)));
  const calls = [];
  const renderer = { packs: { launcher }, draw(_ctx, bank, layout, options) {
    calls.push({ bank, layout, options }); return true;
  } };
  const state = createPortfolioState();
  const selected = settleHomeNavigation(selectHomeSlot({ ...state, system: { ...state.system, phase: 'home' } }, 8));
  const balloon = createHomeBalloonPresentation(selected);
  const live = { ...selected, system: { ...selected.system, homeControls: { balloon } } };
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
