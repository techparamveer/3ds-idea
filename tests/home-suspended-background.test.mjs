import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { suspendedBackgroundAsset, paddedHomeCapture } from '../src/scene/home-suspended-background.ts';

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
