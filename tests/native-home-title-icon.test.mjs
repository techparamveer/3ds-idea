import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { decodeNativePng } from '../src/os/native-png.ts';
import { nativePaneParentPath, nativeTextureSamplePixels, poseNativeLayout, rasterNativePicture } from '../src/os/native-layout.ts';

const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
async function loadOsModule(name, overrides = {}) {
  const url = new URL(`../src/os/${name}.ts`, import.meta.url);
  const { outputText } = ts.transpileModule(readFileSync(url, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  const resolved = outputText.replace(/(from\s*['"])(\.[^'"]+)(['"])/g, (_all, prefix, path, suffix) =>
    prefix + (overrides[path] ?? new URL(`${path}.ts`, url).href) + suffix);
  return import(moduleUrl(resolved));
}

const { createFirmwareHome } = await loadOsModule('firmware-presentation', {
  './native-renderer': moduleUrl('export class NativeLayoutRenderer {}'),
});
const root = new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const pack = JSON.parse(readFileSync(new URL('packs/home/launcher.json', root)));
const cameraBytes = new Uint8Array(readFileSync(new URL('icons/camera.png', root)));
const camera = await decodeNativePng(cameraBytes, { width: 48, height: 48 });
const sound = await decodeNativePng(new Uint8Array(readFileSync(new URL('icons/sound.png', root))), { width: 48, height: 48 });

test('ordinary stock title icons preserve rounded footprints and bind only the authored dynamic sampler', () => {
  const draws = [], pixels = new Map([['0004001000022400', camera]]), before = JSON.stringify(pack);
  const renderer = { packs: { launcher: pack }, result: true,
    draw(ctx, bank, name, options) { draws.push({ ctx, bank, name, options }); return this.result; },
  };
  const home = createFirmwareHome({ renderer, titleIconPixels: pixels }), ctx = {};
  for (const [x, y, size] of [[208,125,72],[142.25,81.75,50],[101,62,36],[77.5,45.25,28],[12,34,24]]) {
    assert.equal(home.ordinaryTitleIcon(ctx, '0004001000022400', x, y, size), true);
    const draw = draws.at(-1), width = Math.round(size * 2 / 3);
    const left = Math.round(x + (size - width) / 2), top = Math.round(y + (size - width) / 2);
    assert.equal(draw.ctx, ctx); assert.equal(draw.bank, 'launcher'); assert.equal(draw.name, 'LncIconDist_01');
    assert.deepEqual(draw.options.center, [left + width / 2, top + width / 2]);
    assert.deepEqual(draw.options.overrides, {
      P_IconBtnDmy_00: { size: [0, 0] },
      P_Icon_00: { size: [width, width], textureBindings: { 0: 'runtime:ordinary-title-icon' } },
    });
    assert.equal(draw.options.textures['runtime:ordinary-title-icon'], camera);
    assert.equal(Object.hasOwn(draw.options.overrides.P_Icon_00.textureBindings, 1), false);
    assert.equal(Object.hasOwn(draw.options.overrides.P_Icon_00.textureBindings, 2), false);
  }
  assert.deepEqual(draws[0].options.center, [244, 161], '72px tile retains the byte-proven [220,137) footprint');
  renderer.result = false;
  assert.throws(() => home.ordinaryTitleIcon(ctx, '0004001000022400', 0, 0, 72), /draw unavailable/);
  assert.throws(() => home.ordinaryTitleIcon(ctx, 'ffffffffffffffff', 0, 0, 72), /icon unavailable/);
  assert.equal(draws.length, 6, 'missing icon does not enter the native renderer');
  assert.equal(JSON.stringify(pack), before, 'source layout and material stay immutable');
});

test('ordinary title material identity guard rejects sampler, UV and pane drift', () => {
  for (const mutate of [
    value => { value.layouts.LncIconDist_01.materials[1].textureMaps[1].wrapS = 0; },
    value => { nativePaneParentPath(value.layouts.LncIconDist_01,'P_Icon_00').at(-1).picture.uvSets[1][0] = 0; },
    value => { nativePaneParentPath(value.layouts.LncIconDist_01,'P_Icon_00').at(-1).size[0] = 47; },
  ]) {
    const changed = structuredClone(pack); mutate(changed); let drawn = false;
    const home = createFirmwareHome({ titleIconPixels: new Map([['0004001000022400', camera]]),
      renderer: { packs: { launcher: changed }, draw() { drawn = true; return true; } } });
    assert.throws(() => home.ordinaryTitleIcon({}, '0004001000022400', 208, 125, 72), /material identity/);
    assert.equal(drawn, false);
  }
  const wrong = { ...camera, width: 47 };
  const home = createFirmwareHome({ titleIconPixels: new Map([['0004001000022400', wrong]]),
    renderer: { packs: { launcher: pack }, draw() { throw Error('must not draw'); } } });
  assert.throws(() => home.ordinaryTitleIcon({}, '0004001000022400', 208, 125, 72), /dimensions/);
});

test('authored IconMask raster changes alpha only at the stable 24-corner set', async () => {
  const layout = pack.layouts.LncIconDist_01, needed = new Set(layout.textures), textures = new Map();
  for (const name of needed) {
    const record = pack.textures[name];
    const decoded = await decodeNativePng(new Uint8Array(readFileSync(new URL(record.url, root))), record);
    textures.set(name, nativeTextureSamplePixels(decoded, record.picaFormat));
  }
  textures.set('runtime:ordinary-title-icon', camera);
  const posed = poseNativeLayout(layout, pack.animations, [], {
    P_IconBtnDmy_00: { size: [0, 0] },
    P_Icon_00: { size: [48, 48], textureBindings: { 0: 'runtime:ordinary-title-icon' } },
  });
  const pane = nativePaneParentPath(posed, 'P_Icon_00').at(-1), material = posed.materials[pane.picture.material];
  const raster = rasterNativePicture(posed, pane.picture, 48, 48, textures, 1, material);
  let alpha = 0, rgb = 0, coreRgb = 0;
  for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) {
    const at = (y * 48 + x) * 4;
    if (camera.data[at + 3] !== raster.data[at + 3]) alpha++;
    const changed = [0,1,2].some(channel => camera.data[at + channel] !== raster.data[at + channel]);
    if (changed) rgb++;
    if (changed && x >= 1 && x < 45 && y >= 2 && y < 46) coreRgb++;
  }
  assert.deepEqual({ alpha, rgb, coreRgb }, { alpha: 24, rgb: 0, coreRgb: 0 });
  assert.deepEqual(material.textureMaps.map(map => [map.texture,map.wrapS,map.wrapT,map.minFilter,map.magFilter]), [
    [2,0,0,1,1],[1,2,2,1,1],[0,0,0,1,1],
  ]);
});

function fakeCanvas() {
  const surface = { width: 0, height: 0 };
  const context = new Proxy({ canvas: surface, globalAlpha: 1,
    createImageData: (width, height) => ({ width, height, data: new Uint8ClampedArray(width * height * 4) }),
    getTransform: () => undefined,
  }, { get: (target, key) => key in target ? target[key] : (() => {}) });
  surface.getContext = () => context; return surface;
}

test('renderer cache keys ordinary icon rasters by stable pixel identity', async () => {
  const { NativeLayoutRenderer } = await loadOsModule('native-renderer');
  const names = new Set(pack.layouts.LncIconDist_01.textures), textures = new Map();
  for (const name of names) {
    const record = pack.textures[name], decoded = await decodeNativePng(new Uint8Array(readFileSync(new URL(record.url, root))), record);
    textures.set(name, nativeTextureSamplePixels(decoded, record.picaFormat));
  }
  const saved = Object.getOwnPropertyDescriptor(globalThis, 'document');
  globalThis.document = { createElement: fakeCanvas };
  const renderer = new NativeLayoutRenderer({ launcher: pack }, { launcher: textures }, new Map());
  try {
    const home = createFirmwareHome({ renderer, titleIconPixels: new Map([['0004001000022400', camera],['0004001000022500',sound]]) }), ctx = fakeCanvas().getContext('2d');
    assert.equal(home.ordinaryTitleIcon(ctx, '0004001000022400', 208, 125, 72), true);
    const first = renderer.cacheBytes; assert.ok(first > 0);
    assert.equal(home.ordinaryTitleIcon(ctx, '0004001000022400', 208, 125, 72), true);
    assert.equal(renderer.cacheBytes, first, 'same immutable title pixels reuse the raster cache');
    assert.equal(home.ordinaryTitleIcon(ctx, '0004001000022400', 0, 0, 36), true);
    assert.ok(renderer.cacheBytes > first, 'a distinct destination footprint receives its own bounded raster');
    const beforeSecondIcon=renderer.cacheBytes;
    assert.equal(home.ordinaryTitleIcon(ctx, '0004001000022500', 208, 125, 72),true);
    assert.ok(renderer.cacheBytes>beforeSecondIcon,'the constant runtime key cannot alias a different NativePixels identity');
  } finally {
    renderer.dispose(); if (saved) Object.defineProperty(globalThis, 'document', saved); else delete globalThis.document;
  }
});

test('asset loader publishes raw title pixels, clears them on disposal and propagates abort', async () => {
  const { loadFirmwarePresentationAssets } = await loadOsModule('firmware-presentation', {
    './bitmap-font': moduleUrl('export class BitmapFont {} export const loadBitmapFont=async()=>({dispose(){}});'),
    './native-renderer': moduleUrl('export class NativeLayoutRenderer {diagnostics=[];constructor(packs,textures){this.packs=packs;this.textures=textures;}dispose(){this.disposed=true;}}'),
  });
  const saved = new Map(['window','fetch','Image'].map(key => [key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  const fetched = [];
  Object.assign(globalThis, { window: { location: { href: 'https://fixture.invalid/' } }, fetch: async url => {
    const path = new URL(url).pathname; fetched.push(path);
    return new Response(readFileSync(new URL(`../public${path}`, import.meta.url)));
  } });
  delete globalThis.Image;
  try {
    const assets = await loadFirmwarePresentationAssets();
    const published = assets.titleIconPixels, icon = published.get('0004001000022400');
    assert.deepEqual([icon.width,icon.height],[48,48]);
    assert.deepEqual(icon.data,camera.data);
    assert.equal(fetched.filter(path => path.endsWith('/icons/camera.png')).length,1);
    assert.equal(assets.titleIcons.size,0,'raw publication does not depend on DOM Image');
    assets.dispose(); assets.dispose();
    assert.equal(published.size,0); assert.equal(assets.renderer.disposed,true);

    globalThis.fetch=async url=>{
      const path=new URL(url).pathname;
      if(path.endsWith('/icons/camera.png'))return new Response('missing',{status:404});
      return new Response(readFileSync(new URL(`../public${path}`,import.meta.url)));
    };
    const partial=await loadFirmwarePresentationAssets();
    try{
      assert.equal(partial.titleIconPixels.has('0004001000022400'),false,'non-abort icon failure remains isolated');
      assert.ok(partial.titleIconPixels.has('0004001000022500'),'other decoded title icons still publish');
      const home=createFirmwareHome(partial);
      assert.throws(()=>home.ordinaryTitleIcon({},'0004001000022400',208,125,72),/icon unavailable/);
    }finally{partial.dispose();}

    const abort = new AbortController(); let iconRequest = false;
    globalThis.fetch = async (url, options = {}) => {
      const path = new URL(url).pathname;
      if (path.endsWith('/manifest.json')) return new Response(readFileSync(new URL(`../public${path}`, import.meta.url)));
      if (path.includes('/icons/')) return new Promise((_resolve,reject) => {
        iconRequest = true;
        const fail = () => reject(options.signal.reason ?? new DOMException('Aborted','AbortError'));
        options.signal.addEventListener('abort',fail,{once:true}); queueMicrotask(() => abort.abort(new DOMException('Aborted','AbortError')));
      });
      throw Error(`Unexpected post-icon fetch: ${path}`);
    };
    await assert.rejects(loadFirmwarePresentationAssets(undefined,abort.signal), error => error?.name === 'AbortError');
    assert.equal(iconRequest,true);
  } finally {
    for (const [key,descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis,key,descriptor); else delete globalThis[key]; }
  }
});
