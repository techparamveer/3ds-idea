import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { suspendedBackgroundAsset, suspendedBackgroundPlayback, paddedHomeCapture } from '../src/scene/home-suspended-background.ts';

const data = JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/models/home-background/model.json', import.meta.url)));
const asset = () => ({ data: structuredClone(data), images: new Map(data.textures.map(t => [t.name, { width: t.width, height: t.height, data: new Uint8ClampedArray(t.width * t.height * 4) }])) });

test('suspended backdrop uses the original capture mask without changing the idle source', () => {
  const input = asset(), before = JSON.stringify(input.data), result = suspendedBackgroundAsset(input);
  assert.equal(JSON.stringify(input.data), before);
  const material = result.data.models[0].materials[0];
  assert.equal(material.Texture0Name, 'BG_DmyApp_00');
  assert.equal(material.Texture1Name, 'BG_CapMask_00');
  assert.equal(material.Texture2Name, 'BG_64_00');
  assert.deepEqual(material.TextureMappers[1], material.TextureMappers[0]);
  assert.equal(result.images, input.images);
  assert.deepEqual(result.data.models[0].meshes, input.data.models[0].meshes);
  assert.deepEqual(result.data.materialAnimations, input.data.materialAnimations);
  assert.deepEqual(material.MaterialParams, input.data.models[0].materials[0].MaterialParams);
});

test('missing or unsupported suspended assets fail explicitly', () => {
  for (const name of ['BG_CapMask_00', 'BG_DmyApp_00', 'BG_64_00']) {
    const input = asset(); input.images.delete(name);
    assert.throws(() => suspendedBackgroundAsset(input), /Missing native/);
  }
  const changed = asset(); changed.data.sourceSha256 = 'unknown';
  assert.throws(() => suspendedBackgroundAsset(changed), /Unsupported native/);
  const missingQuit = asset(); missingQuit.data.materialAnimations = missingQuit.data.materialAnimations.filter(clip => clip.Name !== 'BannerBG_AppQuit');
  assert.throws(() => suspendedBackgroundAsset(missingQuit), /Unsupported native/);
  const changedAlpha = asset();
  changedAlpha.data.materialAnimations.find(clip => clip.Name === 'BannerBG_AppQuit').Elements
    .find(element => element.TargetType === 'MaterialConstant4').Content.A.KeyFrames.at(-1).Value = .5;
  assert.throws(() => suspendedBackgroundAsset(changedAlpha), /Unsupported native/);
});

test('suspended close playback preserves the source override order and bounded frame', () => {
  assert.deepEqual(suspendedBackgroundPlayback(), {
    skeletal: [{ name: 'BannerBG_SceneIn', frame: 20 }],
    material: [{ name: 'BannerBG_AppPause', frame: 20 }],
  });
  const presentation = {
    skeletal: [{ clip: 'BannerBG_SceneIn', frame: 20 }],
    material: [{ clip: 'BannerBG_AppPause', frame: 20 }, { clip: 'BannerBG_AppQuit', frame: 13 }],
  };
  assert.deepEqual(suspendedBackgroundPlayback(presentation), {
    skeletal: [{ name: 'BannerBG_SceneIn', frame: 20 }],
    material: [{ name: 'BannerBG_AppPause', frame: 20 }, { name: 'BannerBG_AppQuit', frame: 13 }],
  });
  for (const frame of [-1, 21, 1.5]) assert.throws(() => suspendedBackgroundPlayback({
    ...presentation, material: [presentation.material[0], { ...presentation.material[1], frame }],
  }), /Unsupported native suspended presentation/);
  assert.throws(() => suspendedBackgroundPlayback({
    ...presentation, material: [...presentation.material].reverse(),
  }), /Unsupported native suspended presentation/);
});

test('pinned AppQuit source channels are the alpha reveal and step-scale override', () => {
  const quit = data.materialAnimations.find(clip => clip.Name === 'BannerBG_AppQuit');
  const alpha = quit.Elements.find(element => element.TargetType === 'MaterialConstant4').Content.A;
  const scale = quit.Elements.find(element => element.TargetType === 'MaterialTexCoord0Scale');
  assert.deepEqual(alpha.KeyFrames.map(({ Frame, Value }) => [Frame, Value]), [[0, 0], [20, 1]]);
  assert.equal(alpha.InterpolationType, 'Hermite');
  for (const channel of ['X', 'Y']) {
    assert.deepEqual(scale.Content[channel].KeyFrames.map(({ Frame, Value }) => [Frame, Value]), [[0, .87], [20, 1]]);
    assert.equal(scale.Content[channel].InterpolationType, 'Step');
  }
});

test('capture padding preserves every rotated LCD byte in the source mask extent', () => {
  const input = { width: 240, height: 400, data: Uint8ClampedArray.from({ length: 240 * 400 * 4 }, (_, i) => i % 251) };
  const result = paddedHomeCapture(input);
  assert.deepEqual([result.width, result.height], [256, 512]);
  for (let y = 0; y < 512; y++) {
    const row = result.data.subarray(y * 1024, (y + 1) * 1024);
    if (y >= 56 && y < 456) {
      assert.deepEqual(row.subarray(0, 960), input.data.subarray((y - 56) * 960, (y - 55) * 960));
      assert.ok(row.subarray(960).every(value => value === 0));
    } else assert.ok(row.every(value => value === 0));
  }
  assert.throws(() => paddedHomeCapture({ ...input, width: 239 }), /Invalid suspended/);
});
