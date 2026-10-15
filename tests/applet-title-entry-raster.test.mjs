import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { drawAppletTitleEntry } from '../src/os/applet-title-entry-assets.ts';
import { nativePaneParentPath, nativeTextureSamplePixels } from '../src/os/native-layout.ts';
import { decodeNativePng } from '../src/os/native-png.ts';

const assetRoot = new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const specs = [
  { appId: 'friends', alias: 'friends-incoming', packPath: 'packs/friends/incoming.json', upper: 'FrdCmnFade_U_00', lower: 'FrdCmnFade_D_00', title: 'Friend List' },
  { appId: 'notifications', alias: 'notifications-incoming', packPath: 'packs/notifications/incoming.json', upper: 'CmnFade_U_00', lower: 'CmnFade_D_00', title: 'Notifications' },
];
for (const spec of specs) {
  spec.pack = JSON.parse(readFileSync(new URL(spec.packPath, assetRoot)));
  spec.textures = new Map();
  for (const [name, record] of Object.entries(spec.pack.textures)) {
    const bytes = readFileSync(new URL(record.url, assetRoot));
    spec.textures.set(name, nativeTextureSamplePixels(await decodeNativePng(bytes, record), record.picaFormat));
  }
}

const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText + '\n//# sourceURL=applet-title-entry-raster-fixture.js').toString('base64');
const layoutSource = readFileSync(new URL('../src/os/native-layout.ts', import.meta.url), 'utf8');
const layoutUrl = moduleUrl(layoutSource.replace('export function rasterNativePicture(', `export const pictureRasters=[];
export function rasterNativePicture(...args){const output=measuredRaster(...args);pictureRasters.push({name:args[0].materials[args[1].material].name,alpha:args[5]??1});return output;}
function measuredRaster(`));
const { pictureRasters, setCompiledRasterEnabled } = await import(layoutUrl);
const rendererUrl = moduleUrl(readFileSync(new URL('../src/os/native-renderer.ts', import.meta.url), 'utf8')
  .replace("'./native-text-diagnostics'", JSON.stringify(new URL('../src/os/native-text-diagnostics.ts', import.meta.url).href))
  .replace("'./native-layout'", JSON.stringify(layoutUrl))
  .replace("'./bitmap-font'", JSON.stringify(new URL('../src/os/bitmap-font.ts', import.meta.url).href)));
const { NativeLayoutRenderer } = await import(rendererUrl);

// This transport stub records prepared source RGBA and Canvas composition state.
// It does not implement filtering, destination rasterization or native text ink.
function canvas() {
  const result = { width: 1, height: 1, draws: [] }, stack = [];
  const ctx = {
    canvas: result, globalAlpha: 1, globalCompositeOperation: 'source-over',
    save() { stack.push([this.globalAlpha, this.globalCompositeOperation]); },
    restore() { [this.globalAlpha, this.globalCompositeOperation] = stack.pop(); },
    translate() {}, rotate() {}, scale() {}, beginPath() {}, rect() {}, clip() {},
    createImageData(width, height) { return { width, height, data: new Uint8ClampedArray(width * height * 4) }; },
    getImageData() { return result.image ? { ...result.image, data: result.image.data.slice() } : this.createImageData(result.width, result.height); },
    putImageData(image) { result.image = { ...image, data: image.data.slice() }; },
    drawImage(source, ...rect) { result.draws.push({ width: source.width, height: source.height, data: source.image.data.slice(), rect, alpha: this.globalAlpha, blend: this.globalCompositeOperation }); },
  };
  result.getContext = () => ctx;
  return result;
}

function createRenderer(spec, { ordinary = false, limit, pack = spec.pack, textures = spec.textures } = {}) {
  const renderer = new NativeLayoutRenderer({ [spec.alias]: pack }, { [spec.alias]: new Map(textures) },
    new Map([['cbf_std.bcfnt', { manifest: { height: 32 }, drawNative() {} }]]), limit);
  const calls = [], draw = renderer.draw.bind(renderer);
  renderer.draw = (ctx, bank, name, options) => {
    const applied = ordinary ? { ...options, opaquePictureAlphaPanes: undefined } : options;
    calls.push({ bank, name, requested: structuredClone(options), applied: structuredClone(applied) });
    return draw(ctx, bank, name, applied);
  };
  return { renderer, calls };
}

function withCanvas(run) {
  const previous = globalThis.document;
  globalThis.document = { createElement: canvas };
  try { return run(); } finally { globalThis.document = previous; }
}

function paint(renderer, spec, frame, measured) {
  const top = canvas(), bottom = canvas();
  assert.equal(drawAppletTitleEntry(renderer, top.getContext('2d'), bottom.getContext('2d'), { appId: spec.appId, frame }, measured), true);
  return { upper: top.draws, lower: bottom.draws };
}

function expectedOptions(spec, frame) {
  return [
    { bank: spec.alias, name: spec.upper, options: { bindings: [{ name: spec.upper + '_SceneIn', frame }], opaquePictureAlphaPanes: ['P_Bg_U_00'] } },
    { bank: spec.alias, name: spec.lower, options: { bindings: [{ name: spec.lower + '_SceneIn', frame }], overrides: { T_Aplt_00: { text: spec.title }, T_Home_00: { text: spec.title } }, opaquePictureAlphaPanes: ['P_Bg_D_00'] } },
  ];
}

test('all 42 title incoming poses keep exact Canvas sources while only the validated backgrounds opt into reuse', t => withCanvas(() => {
  let draws = 0, bytes = 0;
  try {
    for (const spec of specs) {
      const before = JSON.stringify(spec.pack), ordinary = createRenderer(spec, { ordinary: true }), reused = createRenderer(spec);
      try {
        for (let frame = 0; frame <= 20; frame++) {
          ordinary.calls.length = 0; reused.calls.length = 0;
          setCompiledRasterEnabled(false); const generic = paint(ordinary.renderer, spec, frame);
          setCompiledRasterEnabled(true); const optimized = paint(reused.renderer, spec, frame);
          assert.deepEqual(optimized, generic, `${spec.appId}/incoming${frame} Canvas sources, dimensions, blend, globalAlpha and draw rectangles`);
          assert.deepEqual(reused.calls.map(call => ({ bank: call.bank, name: call.name, options: call.applied })), expectedOptions(spec, frame));
          assert.deepEqual(ordinary.calls.map(call => ({ bank: call.bank, name: call.name, options: call.applied })),
            expectedOptions(spec, frame).map(call => ({ ...call, options: { ...call.options, opaquePictureAlphaPanes: undefined } })));
          for (const lcd of ['upper', 'lower']) for (const source of optimized[lcd]) { draws++; bytes += source.data.length; }
          assert.ok(reused.renderer.cacheBytes <= 8 * 1024 * 1024);
        }
        assert.equal(JSON.stringify(spec.pack), before, `${spec.appId} source pack remains immutable`);
      } finally { ordinary.renderer.dispose(); reused.renderer.dispose(); }
    }
  } finally { setCompiledRasterEnabled(true); }
  assert.equal(draws, 200);
  assert.equal(bytes, 34_109_440);
  t.diagnostic(`42 actual title-helper poses: ${draws} Canvas sources and ${bytes} source RGBA bytes equal to opt-out route; text ink is stubbed`);
}));

test('the existing cache rasterizes each title background once while leaving the animated belt on its original path', () => withCanvas(() => {
  for (const spec of specs) {
    const { renderer } = createRenderer(spec); pictureRasters.length = 0;
    try {
      for (let frame = 0; frame <= 20; frame++) paint(renderer, spec, frame);
      for (const name of ['P_Bg_U_00', 'P_Bg_D_00']) {
        const rasters = pictureRasters.filter(value => value.name === name);
        assert.equal(rasters.length, 1, `${spec.appId}/${name} reuses one opaque source raster`);
        assert.equal(rasters[0].alpha, 1);
      }
      assert.ok(pictureRasters.filter(value => value.name === 'P_Belt_00').length > 1, `${spec.appId} belt is not opted in`);
      assert.ok(renderer.cacheBytes <= 8 * 1024 * 1024);
    } finally { renderer.dispose(); }
  }
}));

test('opt-in title detail measures validation and each unchanged draw with retained-cache deltas', () => withCanvas(() => {
  const saved = Object.getOwnPropertyDescriptor(globalThis, 'performance');
  const spec = specs[0], { renderer, calls } = createRenderer(spec);
  let readings = [10, 13, 14, 21, 22, 31], detail;
  Object.defineProperty(globalThis, 'performance', { configurable: true, value: { now: () => readings.shift() } });
  try {
    paint(renderer, spec, 0, value => { detail = value; });
    assert.deepEqual(calls.map(call => call.name), [spec.upper, spec.lower], 'measurement preserves native draw order');
    assert.deepEqual({ validationMs: detail.validationMs, upperDrawMs: detail.upperDrawMs, lowerDrawMs: detail.lowerDrawMs },
      { validationMs: 3, upperDrawMs: 7, lowerDrawMs: 9 });
    assert.equal(detail.upperCacheEntriesDelta + detail.lowerCacheEntriesDelta, 5);
    assert.equal(detail.upperCacheBytesDelta + detail.lowerCacheBytesDelta, 852736);
    assert.ok(detail.upperCacheEntriesDelta > 0 && detail.lowerCacheEntriesDelta > 0);
    assert.ok(detail.upperCacheBytesDelta > 0 && detail.lowerCacheBytesDelta > 0);
    assert.equal(renderer.cacheEntryCount, 5);

    calls.length = 0; detail = undefined; readings = [40, 42, 43, 48, 49, 55];
    paint(renderer, spec, 0, value => { detail = value; });
    assert.deepEqual(calls.map(call => call.name), [spec.upper, spec.lower]);
    assert.deepEqual({
      upperCacheEntriesDelta: detail.upperCacheEntriesDelta,
      upperCacheBytesDelta: detail.upperCacheBytesDelta,
      lowerCacheEntriesDelta: detail.lowerCacheEntriesDelta,
      lowerCacheBytesDelta: detail.lowerCacheBytesDelta,
    }, { upperCacheEntriesDelta: 0, upperCacheBytesDelta: 0, lowerCacheEntriesDelta: 0, lowerCacheBytesDelta: 0 });
    assert.equal(renderer.cacheEntryCount, 5);
  } finally {
    renderer.dispose();
    if (saved) Object.defineProperty(globalThis, 'performance', saved); else delete globalThis.performance;
  }
}));

test('invalid title source data fails before or inside the unchanged opaque-alpha guard', () => withCanvas(() => {
  const spec = specs[0], invalidPack = structuredClone(spec.pack);
  nativePaneParentPath(invalidPack.layouts[spec.upper], 'P_Bg_U_00').at(-1).picture.colors[0][3] = 128;
  const invalidLayout = createRenderer(spec, { pack: invalidPack });
  try {
    assert.throws(() => paint(invalidLayout.renderer, spec, 0), /Unsupported title incoming background geometry/);
    assert.equal(invalidLayout.calls.length, 0, 'validation rejects the pack before either draw');
  } finally { invalidLayout.renderer.dispose(); }

  const background = nativePaneParentPath(spec.pack.layouts[spec.upper], 'P_Bg_U_00').at(-1).picture;
  const material = spec.pack.layouts[spec.upper].materials[background.material];
  const textureName = spec.pack.layouts[spec.upper].textures[material.textureMaps[0].texture];
  const invalidTextures = new Map(spec.textures), pixels = invalidTextures.get(textureName);
  invalidTextures.set(textureName, { ...pixels, data: pixels.data.slice() });
  invalidTextures.get(textureName).data[3] = 0;
  const invalidTexture = createRenderer(spec, { textures: invalidTextures });
  try {
    const top = canvas(), bottom = canvas();
    assert.equal(drawAppletTitleEntry(invalidTexture.renderer, top.getContext('2d'), bottom.getContext('2d'), { appId: spec.appId, frame: 0 }), false);
    assert.match(invalidTexture.renderer.diagnostics.join('\n'), /opaque picture alpha texture|nonopaque native picture alpha source/);
  } finally { invalidTexture.renderer.dispose(); }
}));

test('a small existing cache evicts and disposal releases title rasters without changing source bytes', () => withCanvas(() => {
  const spec = specs[1], ordinary = createRenderer(spec, { ordinary: true, limit: 400000 }), reused = createRenderer(spec, { limit: 400000 });
  setCompiledRasterEnabled(false);
  try {
    for (const frame of [0, 10, 19, 20, 10, 0]) {
      assert.deepEqual(paint(reused.renderer, spec, frame), paint(ordinary.renderer, spec, frame));
      assert.ok(reused.renderer.cacheBytes <= 400000);
    }
    const sources = [...reused.renderer.cache.values()];
    assert.ok(sources.length > 0);
    reused.renderer.dispose();
    assert.equal(reused.renderer.cacheBytes, 0);
    assert.equal(reused.renderer.cacheEntryCount, 0);
    for (const source of sources) assert.deepEqual([source.width, source.height], [0, 0]);
    const top = canvas(), bottom = canvas();
    assert.equal(drawAppletTitleEntry(reused.renderer, top.getContext('2d'), bottom.getContext('2d'), { appId: spec.appId, frame: 0 }), false);
  } finally { setCompiledRasterEnabled(true); ordinary.renderer.dispose(); reused.renderer.dispose(); }
}));
