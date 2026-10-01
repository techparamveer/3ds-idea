import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { poseNativeLayout, rasterNativePicture, nativeTextureSamplePixels, setCompiledRasterEnabled } from '../src/os/native-layout.ts';
import { decodeNativePng } from '../src/os/native-png.ts';

// The specialized loops must reproduce the generic loop byte for byte. Use the
// app-launch logo: animated texture matrices, clamp and mirror wrapping,
// four-stage TEV with buffer saves, and partial alpha on every pane.
const root = new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.json', root)));
const pack = JSON.parse(readFileSync(new URL(manifest.home.launch, root)));
const textures = new Map();
for (const [name, record] of Object.entries(pack.textures)) textures.set(name, nativeTextureSamplePixels(await decodeNativePng(readFileSync(new URL(record.url, root)), record), record.picaFormat));

function launchJobs() {
  const jobs = [];
  for (const layout of ['NintendoLogo_U_00', 'NintendoLogo_D_00']) for (const [clip, frames] of [['SceneOutA', 60], ['SceneOutB', 30], ['SceneOutC', 15]]) {
    if (!pack.animations[`${layout}_${clip}`]) continue;
    for (let frame = 0; frame < frames; frame += 7) {
      const posed = poseNativeLayout(pack.layouts[layout], pack.animations, [{ name: `${layout}_${clip}`, frame }]);
      const visit = (pane, parentAlpha) => {
        if (!(pane.flags & 1)) return;
        const alpha = parentAlpha * pane.alpha / 255;
        if (pane.picture && alpha > 0) jobs.push([posed, pane.picture, Math.ceil(pane.size[0]), Math.ceil(pane.size[1]), textures, alpha]);
        for (const child of pane.children) visit(child, pane.flags & 2 ? alpha : parentAlpha);
      };
      posed.roots.forEach(pane => visit(pane, 1));
    }
  }
  return jobs;
}

test('specialized raster loops match the generic loop on every launch-logo pane', () => {
  const jobs = launchJobs();
  assert.ok(jobs.length > 100);
  try {
    for (const job of jobs) {
      setCompiledRasterEnabled(true, 0);
      const compiled = rasterNativePicture(...job);
      setCompiledRasterEnabled(false);
      const generic = rasterNativePicture(...job);
      assert.deepEqual(compiled.data, generic.data);
    }
  } finally { setCompiledRasterEnabled(true); }
});

test('only rasters of at least 65,536 px use a specialized loop by default', () => {
  // Observable through equality only; exercise both sides of the threshold.
  const [layout, picture, , , images, alpha] = launchJobs()[0];
  for (const [width, height] of [[255, 256], [256, 256], [400, 240]]) {
    const defaulted = rasterNativePicture(layout, picture, width, height, images, alpha);
    setCompiledRasterEnabled(false);
    try { assert.deepEqual(defaulted.data, rasterNativePicture(layout, picture, width, height, images, alpha).data); }
    finally { setCompiledRasterEnabled(true); }
  }
});

test('sub-rectangles and fractional sampling regions match as well', () => {
  const [layout, picture, width, height, images, alpha] = launchJobs()[3];
  const sampling = { x: 17, y: 9, fullWidth: width + 3, fullHeight: height + 5, localTransform: [0.97, 0.05, -0.04, 1.02, 1.5, -2.25] };
  try {
    setCompiledRasterEnabled(true, 0);
    const compiled = rasterNativePicture(layout, picture, 120, 80, images, alpha, undefined, sampling);
    setCompiledRasterEnabled(false);
    const generic = rasterNativePicture(layout, picture, 120, 80, images, alpha, undefined, sampling);
    assert.deepEqual(compiled.data, generic.data);
  } finally { setCompiledRasterEnabled(true); }
});
