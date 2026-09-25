import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createPortfolioState } from '../src/os/system.ts';
import { selectHomeSlot, setHomeDensity, settleHomeNavigation } from '../src/os/home-navigation.ts';
import { createHomeBalloonPresentation, advanceHomeBalloonPresentation } from '../src/os/home-balloon-presentation.ts';
import { poseNativeLayout } from '../src/os/native-layout.ts';
import { getNativeSettingsTitleBalloon, getHomePresentation } from '../src/os/home-presentation.ts';
import { getTitle } from '../src/os/app-registry.ts';

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
  assert.equal(settings.publisher, undefined, 'publisher must not be invented before manifest extraction');
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
    label: settings.longDescription, baseX: 84, bodyOffsetX: -76,
  });
  const departing = advanceHomeBalloonPresentation(createHomeBalloonPresentation(selected), selectHomeSlot(selected, 7));
  assert.deepEqual([departing.visible, departing.desired, departing.clip, departing.frame], [true, false, 'DisAppear', 0]);
  assert.equal(getNativeSettingsTitleBalloon({ ...selected, panel: 'settings' }, view), null);
  assert.equal(getNativeSettingsTitleBalloon(settleHomeNavigation(setHomeDensity(selected, 0)), getHomePresentation(settleHomeNavigation(setHomeDensity(selected, 0)))), null);
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
