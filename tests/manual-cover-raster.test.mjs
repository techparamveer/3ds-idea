import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import ts from 'typescript';
import {
  blendNativePixel, nativePaneParentPath, nativeTextureSamplePixels,
} from '../src/os/native-layout.ts';
import { decodeNativePng } from '../src/os/native-png.ts';
import { manualEntryBindings } from '../src/os/manual-entry-assets.ts';

const assetRoot = new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const common = JSON.parse(readFileSync(new URL('packs/home/common.json', assetRoot)));
const textures = new Map();
const names = new Set(['CmnFade_U_00', 'CmnFade_D_00'].flatMap(name => common.layouts[name].textures));
for (const name of common.animations.CmnFade_D_00_Aplt.textures) names.add(name);
for (const name of names) {
  const record = common.textures[name];
  textures.set(name, nativeTextureSamplePixels(await decodeNativePng(readFileSync(new URL(record.url, assetRoot)), record), record.picaFormat));
}
const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText + '\n//# sourceURL=manual-cover-test-fixture.js').toString('base64');
const layoutSource = readFileSync(new URL('../src/os/native-layout.ts', import.meta.url), 'utf8');
const layoutUrl = moduleUrl(layoutSource.replace('export function rasterNativePicture(', `export const pictureRasters=[];
export function rasterNativePicture(...args){const start=performance.now();const output=measuredRaster(...args);pictureRasters.push({name:args[0].materials[args[1].material].name,alpha:args[5]??1,ms:performance.now()-start});return output;}
function measuredRaster(`));
const { pictureRasters, setCompiledRasterEnabled } = await import(layoutUrl);
const rendererUrl = moduleUrl(readFileSync(new URL('../src/os/native-renderer.ts', import.meta.url), 'utf8')
  .replace("'./native-layout'", JSON.stringify(layoutUrl)).replace("'./bitmap-font'", JSON.stringify(new URL('../src/os/bitmap-font.ts', import.meta.url).href)));
const { NativeLayoutRenderer } = await import(rendererUrl);
const presentationUrl = new URL('../src/os/firmware-presentation.ts', import.meta.url);
const { createFirmwareHome } = await import(moduleUrl(readFileSync(presentationUrl, 'utf8').replace(/(from\s*['"])(\.[^'"]+)(['"])/g,
  (_all, prefix, path, suffix) => prefix + (path === './native-renderer' ? rendererUrl : new URL(path.endsWith('.ts') ? path : `${path}.ts`, presentationUrl).href) + suffix)));
const messages = JSON.parse(readFileSync(new URL('packs/home/messages-and-loose.json', assetRoot)));
const launcher = JSON.parse(readFileSync(new URL('packs/home/launcher.json', assetRoot)));

// Transport stub records prepared source bytes and Canvas state. It does not
// claim to implement Canvas filtering, destination rasterization, or text ink.
function canvas() {
  const result = { width: 1, height: 1, draws: [] }, stack = [];
  const ctx = { canvas: result, globalAlpha: 1, globalCompositeOperation: 'source-over',
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
function presenter(ordinary = false, limit, pack = common, images = textures) {
  const renderer = new NativeLayoutRenderer({ common: pack, messages, launcher }, { common: new Map(images) },
    new Map([['cbf_std.bcfnt', { manifest: { height: 32 }, drawNative() {} }]]), limit);
  if (ordinary) {
    const draw = renderer.draw.bind(renderer);
    renderer.draw = (ctx, bank, name, options) => draw(ctx, bank, name, { ...options, opaquePictureAlphaPanes: undefined });
  }
  return { renderer, home: createFirmwareHome({ renderer }) };
}
function withCanvas(run) {
  const previous = globalThis.document; globalThis.document = { createElement: canvas };
  try { return run(); } finally { globalThis.document = previous; }
}
function paint(home, appId, phase, frame) {
  const top = canvas(), bottom = canvas();
  const args = [top.getContext('2d'), bottom.getContext('2d'), { appId, phase, frame }];
  assert.equal(appId === 'manual' ? home.manualEntry(...args) : home.appletEntry(...args), true);
  return { upper: top.draws, lower: bottom.draws };
}

test('changing Manual alpha rasterizes each sampled background only once within the existing cache', () => withCanvas(() => {
  const { renderer, home } = presenter(); pictureRasters.length = 0;
  try {
    for (const phase of ['out', 'in']) for (let frame = 0; frame <= 20; frame++) paint(home, 'manual', phase, frame);
    for (const name of ['P_Bg_U_00', 'P_Bg_D_00']) {
      const rasters = pictureRasters.filter(value => value.name === name);
      assert.equal(rasters.length, 1, `${name} must reuse its source samples across all 42 poses`);
      assert.equal(rasters[0].alpha, 1);
    }
    assert.ok(pictureRasters.filter(value => value.name === 'P_Belt_00').length > 20, 'the varying native belt keeps its original raster path');
    assert.ok(renderer.cacheBytes <= 8 * 1024 * 1024);
  } finally { renderer.dispose(); }
}));

test('every Manual and common-applet source pose keeps exact Canvas source bytes and opaque source-over blending', t => withCanvas(() => {
  let draws = 0, bytes = 0;
  const before = JSON.stringify(common);
  try {
    for (const appId of ['manual', 'game-notes', 'friends', 'notifications', 'browser', 'miiverse']) {
      const ordinary = presenter(true), reused = presenter();
      try {
        for (const phase of ['out', 'in']) for (let frame = 0; frame <= 20; frame++) {
          setCompiledRasterEnabled(false); const generic = paint(ordinary.home, appId, phase, frame);
          setCompiledRasterEnabled(true); const optimized = paint(reused.home, appId, phase, frame);
          assert.deepEqual(optimized, generic, `${appId}/${phase}${frame} Canvas sources, dimensions, blend, globalAlpha and draw rectangles`);
          for (const lcd of ['upper', 'lower']) for (let index = 0; index < optimized[lcd].length; index++) {
            const source = optimized[lcd][index], expected = generic[lcd][index];
            for (let at = 0; at < source.data.length; at += 4 * 997) {
              const background = [(at % 256) / 255, ((at * 17 + 23) % 256) / 255, ((at * 31 + 47) % 256) / 255, 1];
              const blend = data => new Uint8ClampedArray(blendNativePixel(Array.from(data.subarray(at, at + 4), value => value / 255), background,
                { operation: 1, sourceFactor: 4, destinationFactor: 5 }).map(value => value * 255));
              assert.deepEqual(blend(source.data), blend(expected.data));
            }
            draws++; bytes += source.data.length;
          }
          assert.ok(reused.renderer.cacheBytes <= 8 * 1024 * 1024);
        }
      } finally { ordinary.renderer.dispose(); reused.renderer.dispose(); }
    }
  } finally { setCompiledRasterEnabled(true); }
  assert.equal(JSON.stringify(common), before);
  t.diagnostic(`All 252 poses: ${draws} Canvas sources and ${bytes} RGBA bytes identical with generic reference; text ink is stubbed, scalar opaque source-over checked`);
}));

test('malformed opacity opt-ins, source programs, selected textures and generators fail explicitly', () => withCanvas(() => {
  const mutations = [
    layout => layout.materials[0].alphaCompare.function = 0,
    layout => layout.materials[0].colorBlend.destinationFactor = 0,
    layout => layout.materials[0].tevStages[2].alpha.mode = 4,
    layout => { layout.materials[0].tevStages[0].color.sources[0] = 5; layout.materials[0].tevStages[0].color.operands[0] = 2; },
    layout => layout.materials[0].name = 'not-a-common-cover-background',
    layout => layout.materials[0].coordinateGenerators[0].source = 3,
    layout => nativePaneParentPath(layout, 'P_Bg_U_00').at(-1).picture.colors[0][3] = 128,
    layout => layout.materials[0].unsupported.push('test'),
  ];
  for (let index = 0; index < mutations.length; index++) {
    const pack = structuredClone(common); mutations[index](pack.layouts.CmnFade_U_00);
    const { renderer } = presenter(false, undefined, pack);
    try {
      assert.equal(renderer.draw(canvas().getContext('2d'), 'common', 'CmnFade_U_00', { bindings: manualEntryBindings({ phase: 'out', frame: 10 }).upper,
        opaquePictureAlphaPanes: ['P_Bg_U_00'] }), false, `mutation ${index}`);
      assert.match(renderer.diagnostics.at(-1), /Unsupported/);
    } finally { renderer.dispose(); }
  }
  for (const names of [['absent'], ['P_Bg_U_00', 'P_Bg_U_00'], ['']]) {
    const { renderer } = presenter();
    assert.equal(renderer.draw(canvas().getContext('2d'), 'common', 'CmnFade_U_00', { opaquePictureAlphaPanes: names }), false);
    assert.match(renderer.diagnostics.at(-1), /opaque picture alpha pane/); renderer.dispose();
  }
  for (const missing of [false, true]) {
    const images = new Map(textures), name = common.layouts.CmnFade_U_00.textures[common.layouts.CmnFade_U_00.materials[0].textureMaps[0].texture];
    if (missing) images.delete(name);
    else { const source = images.get(name); images.set(name, { ...source, data: source.data.slice() }); images.get(name).data[3] = 0; }
    const { renderer } = presenter(false, undefined, common, images);
    assert.equal(renderer.draw(canvas().getContext('2d'), 'common', 'CmnFade_U_00', { opaquePictureAlphaPanes: ['P_Bg_U_00'] }), false);
    assert.match(renderer.diagnostics.at(-1), /opaque picture alpha texture/); renderer.dispose();
  }
  const { renderer } = presenter();
  assert.equal(renderer.draw(canvas().getContext('2d'), 'common', 'CmnFade_D_00', { bindings: manualEntryBindings({ phase: 'out', frame: 10 }).lower,
    opaquePictureAlphaPanes: ['P_Belt_00'] }), false);
  assert.match(renderer.diagnostics.at(-1), /Unsupported native opaque picture alpha reuse/); renderer.dispose();
  const fraction = presenter();
  assert.equal(fraction.renderer.draw(canvas().getContext('2d'), 'common', 'CmnFade_U_00', { opaquePictureAlphaPanes: ['P_Bg_U_00'],
    overrides: { P_Bg_U_00: { alpha: 127.5 } } }), false);
  assert.match(fraction.renderer.diagnostics.at(-1), /Unsupported native opaque picture alpha reuse/); fraction.renderer.dispose();
}));

test('a smaller cache evicts and disposes native opacity rasters without changing their bytes', () => withCanvas(() => {
  const ordinary = presenter(true, 400000), reused = presenter(false, 400000);
  setCompiledRasterEnabled(false);
  try {
    for (const frame of [1, 10, 19, 20, 10, 1]) {
      assert.deepEqual(paint(reused.home, 'manual', 'out', frame), paint(ordinary.home, 'manual', 'out', frame));
      assert.ok(reused.renderer.cacheBytes <= 400000);
    }
    const sources = [...reused.renderer.cache.values()];
    reused.renderer.dispose(); assert.equal(reused.renderer.cacheBytes, 0);
    for (const source of sources) assert.deepEqual([source.width, source.height], [0, 0]);
    assert.equal(reused.renderer.draw(canvas().getContext('2d'), 'common', 'CmnFade_U_00', { opaquePictureAlphaPanes: ['P_Bg_U_00'] }), false);
  } finally { setCompiledRasterEnabled(true); ordinary.renderer.dispose(); reused.renderer.dispose(); }
}));

if (process.env.NATIVE_COVER_BENCHMARK) test('Manual presenter picture CPU measurement excludes real Canvas and native/browser timing', t => withCanvas(() => {
  const measure = ordinary => {
    const { renderer, home } = presenter(ordinary); pictureRasters.length = 0;
    const start = performance.now();
    let firstDrawMs, in0Ms;
    try {
      for (const phase of ['out', 'in']) for (let frame = 0; frame <= 20; frame++) {
        const before = performance.now(); paint(home, 'manual', phase, frame);
        if (phase === 'out' && frame === 1) firstDrawMs = performance.now() - before;
        if (phase === 'in' && frame === 0) in0Ms = performance.now() - before;
      }
      const rasters = pictureRasters.slice();
      return { ms: performance.now() - start, firstDrawMs, in0Ms, backgroundRasters: rasters.filter(value => /P_Bg_[UD]_00/.test(value.name)).length,
        backgroundRasterMs: rasters.filter(value => /P_Bg_[UD]_00/.test(value.name)).reduce((sum, value) => sum + value.ms, 0),
        beltRasters: rasters.filter(value => value.name === 'P_Belt_00').length };
    } finally { renderer.dispose(); }
  };
  const mode = process.env.NATIVE_COVER_BENCHMARK;
  assert.ok(['ordinary', 'reused'].includes(mode), 'run each benchmark mode in a fresh Node process');
  const cold = measure(mode === 'ordinary'), rounds = Array.from({ length: 5 }, () => measure(mode === 'ordinary'));
  t.diagnostic(JSON.stringify({ node: process.version, platform: process.platform, arch: process.arch, poses: 42, mode, cold,
    warmMedianMs: rounds.map(round => round.ms).sort((a, b) => a - b)[2], rounds }));
}));
