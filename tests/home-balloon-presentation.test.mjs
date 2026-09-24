import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createPortfolioState } from '../src/os/system.ts';
import { selectHomeSlot, setHomeDensity, settleHomeNavigation } from '../src/os/home-navigation.ts';
import { createHomeBalloonPresentation, advanceHomeBalloonPresentation } from '../src/os/home-balloon-presentation.ts';
import { poseNativeLayout } from '../src/os/native-layout.ts';

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
