import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { nativePaneParentPath, nativeTextureSamplePixels, poseNativeLayout } from '../src/os/native-layout.ts';
import { decodeNativePng } from '../src/os/native-png.ts';

const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
async function loadModule(name, overrides = {}) {
  const url = new URL(`../src/os/${name}.ts`, import.meta.url);
  const { outputText } = ts.transpileModule(readFileSync(url, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return import(moduleUrl(outputText.replace(/(from\s*['"])(\.[^'"]+)(['"])/g, (_all, prefix, path, suffix) =>
    prefix + (overrides[path] ?? new URL(`${path}.ts`, url).href) + suffix)));
}
const { createFirmwareHome } = await loadModule('firmware-presentation', {
  './native-renderer': moduleUrl('export class NativeLayoutRenderer {}'),
});
const resourceRoot = process.env.FIRMWARE_PRESENTATION_ASSETS ?? resolve('public/os/firmware/10.7.0-32E');
const pack = JSON.parse(readFileSync(resolve(resourceRoot, 'packs/home/launcher.json')));
const pickup = 'LncIconPickUp_00', blank = 'LncIconPickUpBlank_00';
const pane = (layout, name) => nativePaneParentPath(layout, name).at(-1);
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-5, `${actual} != ${expected}`);
function presenter() {
  const draws = [], renderer = { packs: { launcher: pack }, result: true,
    draw(ctx, bank, name, options) {
      draws.push({ ctx, bank, name, options, pose: poseNativeLayout(pack.layouts[name], pack.animations, options.bindings, options.overrides) });
      return this.result;
    },
  };
  return { home: createFirmwareHome({ renderer }), renderer, draws };
}

test('pickup passes the applied Scale and LCD center unchanged, including fractions and out-of-density frames', () => {
  const { home, draws } = presenter(), ctx = Object.freeze({});
  for (const frame of [-2, 0, 1, 2, 2.375, 3, 4, 5, 8]) {
    const result = home.pickupAt(ctx, 137.25, 92.5, frame), draw = draws.at(-1);
    assert.equal(draw.ctx, ctx); assert.equal(draw.bank, 'launcher'); assert.equal(draw.name, pickup);
    assert.deepEqual(draw.options, { center: [137.25, 92.5], bindings: [{ name: pickup + '_Scale', frame }],
      textures: undefined, overrides: { P_Icon_00: { visible: false }, P_IconPrize_00: { visible: false } } });
    const width = frame < 2 ? 52 : frame === 2 ? 42 : frame === 2.375 ? 37.5 : frame === 3 ? 30 : frame === 4 ? 26 : 22;
    assert.deepEqual(result, { drawn: true, icon: { x: 137.25 - width / 2, y: 92.5 - width / 2, width, height: width, alpha: 235 / 255 } });
    assert.equal(pane(draw.pose, 'P_Icon_00').flags & 1, 0, 'portfolio artwork is supplied separately');
  }
});

test('ordinary Scale0–5 preserves separate shell ancestry, direct-root artwork and shadow transforms', () => {
  const { home, draws } = presenter();
  const outer = [.72, .72, .5, .36, .30, .26], inner = [1.08, 1.08, 1.10, 1.07, 1.08, 1.10];
  const shellSize = [77.76, 77.76, 55, 38.52, 32.4, 28.6], shadowSize = [96, 96, 62.4, 48, 38.4, 33.6];
  const shadowY = [13, 13, 9.25, 6, 4.25, 3];
  for (let frame = 0; frame <= 5; frame++) {
    home.pickupAt({}, 0, 0, frame); const pose = draws.at(-1).pose;
    const path = nativePaneParentPath(pose, 'P_Btn_00');
    assert.deepEqual(path.map(p => p.name), ['RootPane', 'N_IconRoot_00', 'N_IconRoot_01', 'N_Color_00', 'P_Btn_00']);
    assert.deepEqual(path[1].scale, Array(2).fill(Math.fround(outer[frame])));
    assert.deepEqual(path[2].scale, Array(2).fill(Math.fround(inner[frame])));
    near(path.at(-1).size[0] * path[1].scale[0] * path[2].scale[0], shellSize[frame]);
    near(-path[2].translation[1] * path[1].scale[1], frame < 4 ? outer[frame] : 0);
    const shadow = pane(pose, 'P_BtnShdw_00');
    near(shadow.size[0] * shadow.scale[0], shadowSize[frame]);
    near(shadow.size[1] * shadow.scale[1], shadowSize[frame]);
    assert.equal(-shadow.translation[1], shadowY[frame]); assert.equal(shadow.alpha, 80);
    const artworkPath = nativePaneParentPath(pose, 'P_Icon_00');
    assert.deepEqual(artworkPath.map(p => p.name), ['RootPane', 'P_Icon_00']);
    for (const p of artworkPath) {
      assert.ok(p.translation.every(value => value === 0)); assert.ok(p.rotation.every(value => value === 0));
      assert.deepEqual(p.scale, [1, 1]); assert.equal(p.origin, 4);
    }
    assert.equal(artworkPath[0].alpha, 255);
  }
});

test('Scale texture patterns and hidden picture-branch matrices retain original materials and blend modes', () => {
  const { home, draws } = presenter();
  for (const [frame, suffix] of [[0, '11'], [1, '11'], [1.999, '11'], [2, '13'], [2.375, '13'], [3, '14'], [4, '15'], [5, '16']]) {
    home.pickupAt({}, 50, 60, frame); const pose = draws.at(-1).pose;
    for (const [name, index, destinationFactor] of [['P_Btn_00', 0, 5], ['P_Btn_01', 0, 1], ['P_Btn_10', 1, 5], ['P_Btn_11', 1, 1]]) {
      const material = pose.materials.find(m => m.name === name), original = pack.layouts[pickup].materials.find(m => m.name === name);
      assert.equal(pose.textures[material.textureMaps[index].texture], `LncIcon_${suffix}.bclim`);
      assert.deepEqual(material.colorBlend, { operation: 1, sourceFactor: 4, destinationFactor, logic: 0 });
      assert.deepEqual(material.constantColors, original.constantColors); assert.deepEqual(material.tevStages, original.tevStages);
      if (index === 1) {
        assert.equal(pose.textures[material.textureMaps[0].texture], 'IconDmy.bclim');
        near(material.textureMatrices[0].translation[1], frame >= 4 ? -.02 : 0);
        near(material.textureMatrices[0].scale[1], frame >= 4 ? .96 : 1);
      }
    }
    assert.equal(pane(pose, 'N_Color_00').flags & 1, 1); assert.equal(pane(pose, 'N_Pic_00').flags & 1, 0);
    assert.equal(pane(pose, 'P_Btn_00').alpha, 220); assert.equal(pane(pose, 'P_Btn_01').alpha, 16);
  }
});

test('pickup blank uses its supplied center and native blank/effect sizes, alphas and pattern sequence', () => {
  const { home, draws } = presenter(), sizes = [28, 28, 26, 20, 16, 16];
  for (let frame = 0; frame <= 5; frame++) {
    assert.equal(home.pickupBlankAt({}, 88.5, 103.25, frame), true); const draw = draws.at(-1), pose = draw.pose;
    assert.equal(draw.name, blank); assert.deepEqual(draw.options, { center: [88.5, 103.25], bindings: [{ name: blank + '_Scale', frame }] });
    const base = pane(pose, 'P_Blank_00'), effect = pane(pose, 'P_Effect_00'), window = pane(pose, 'W_Blank_00');
    assert.deepEqual(base.size, [sizes[frame], sizes[frame]]); assert.equal(base.alpha, 200); assert.equal(effect.alpha, 60);
    if (frame < 2) assert.deepEqual(effect.size, [51, 49]);
    else for (const size of effect.size) near(size, 35 - (frame - 2) * 19 / 3);
    assert.deepEqual(window.size, frame < 2 ? [32, 31] : Array(2).fill([28, 24, 20, 18][frame - 2]));
    assert.equal(window.alpha, 50); assert.equal(pane(pose, 'N_Pic_01').flags & 1, 0);
    assert.equal(pose.textures[pose.materials[base.picture.material].textureMaps[0].texture], `LncIconBlankL_${['11', '11', '13', '14', '15', '16'][frame]}.bclim`);
  }
  for (const frame of [-3, 2.375, 9]) {
    home.pickupBlankAt({}, -7.5, 250.25, frame);
    assert.deepEqual(draws.at(-1).options, { center: [-7.5, 250.25], bindings: [{ name: blank + '_Scale', frame }] });
  }
});

test('repeated applied poses are read-only, propagate draw failure and preserve authored wrapper clamping', () => {
  const { home, renderer, draws } = presenter(), before = JSON.stringify(pack), ctx = Object.freeze({});
  const retained = Object.freeze({ current: 4, applied: 2.375 });
  for (const result of [true, false]) {
    renderer.result = result;
    for (let repeat = 0; repeat < 3; repeat++) {
      assert.equal(home.pickupAt(ctx, 137.25, 92.5, retained.applied).drawn, result);
      assert.equal(home.pickupBlankAt(ctx, 88.5, 103.25, retained.applied), result);
      assert.equal(draws.at(-1).options.bindings[0].frame, 2.375);
    }
    for (const [density, frame] of [[-3, 0], [2.375, 2.375], [12, 5]]) {
      const wrapped = home.pickup(ctx, 137.25, 92.5, 999, density, false), options = draws.at(-1).options;
      assert.deepEqual(home.pickupAt(ctx, 137.25, 92.5, frame), wrapped); assert.deepEqual(draws.at(-1).options, options);
      assert.equal(home.liftedSource(ctx, 10, 20, 40, density), result); const sourceOptions = draws.at(-1).options;
      assert.equal(home.pickupBlankAt(ctx, 30, 40, frame), result); assert.deepEqual(draws.at(-1).options, sourceOptions);
    }
  }
  assert.deepEqual(retained, { current: 4, applied: 2.375 }); assert.equal(JSON.stringify(pack), before);
});

test('authored folder pickup preserves glyph installation, folder Scale and density clamp', () => {
  const saved = Object.getOwnPropertyDescriptor(globalThis, 'document');
  globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ({
    getImageData: (_x, _y, width, height) => ({ width, height, data: new Uint8ClampedArray(width * height * 4) }),
  }) }) };
  try {
    const { home, draws } = presenter();
    for (const [density, frame] of [[-3, 0], [2.375, 2.375], [12, 5]]) {
      const result = home.pickup({}, 137.25, 92.5, 1, density, true, 'A'), draw = draws.at(-1);
      assert.equal(draw.name, 'LncIconFolderPickUp_00');
      assert.deepEqual(draw.options.bindings, [{ name: 'LncIconFolderPickUp_00_Scale', frame }]);
      assert.deepEqual(draw.options.overrides.P_Icon_00, { visible: true, textureBindings: { 0: 'runtime:folder-first-character', 1: 'IconMask.bclim' } });
      assert.ok(draw.options.textures['runtime:folder-first-character']);
      const icon = pane(draw.pose, 'P_Icon_00');
      assert.deepEqual(result.icon, { x: 137.25 + icon.translation[0] - icon.size[0] / 2,
        y: 92.5 - icon.translation[1] - icon.size[1] / 2, width: icon.size[0], height: icon.size[1], alpha: icon.alpha / 255 });
    }
    assert.equal(draws.filter(draw => draw.name === 'LncIconFolderText_00').length, 1, 'same first character reuses its surface');
  } finally { if (saved) Object.defineProperty(globalThis, 'document', saved); else delete globalThis.document; }
});

const canvasModule = process.env.NATIVE_CANVAS_MODULE ? await import(pathToFileURL(resolve(process.env.NATIVE_CANVAS_MODULE)).href) : null;
const createCanvas = canvasModule?.createCanvas ?? canvasModule?.default?.createCanvas;
test('real renderer paints resource shell/blank at all six frames, retains caller state and repeats identical pixels', { skip: !createCanvas }, async () => {
  const { NativeLayoutRenderer } = await loadModule('native-renderer'), textures = new Map();
  const names = new Set();
  for (const name of [pickup, blank]) {
    pack.layouts[name].textures.forEach(n => names.add(n));
    pack.animations[name + '_Scale'].textures.forEach(n => names.add(n));
  }
  assert.equal(names.size, 14);
  for (const name of names) {
    const record = pack.textures[name];
    textures.set(name, nativeTextureSamplePixels(await decodeNativePng(new Uint8Array(readFileSync(resolve(resourceRoot, record.url))), record), record.picaFormat));
  }
  const saved = Object.getOwnPropertyDescriptor(globalThis, 'document');
  globalThis.document = { createElement: () => createCanvas(1, 1) };
  const renderer = new NativeLayoutRenderer({ launcher: pack }, { launcher: textures }, new Map()), home = createFirmwareHome({ renderer });
  try {
    const ctx = createCanvas(320, 240).getContext('2d');
    ctx.translate(3, 4); ctx.globalAlpha = .65;
    const transform = ctx.getTransform().toString(), alpha = ctx.globalAlpha;
    for (const method of ['pickupAt', 'pickupBlankAt']) for (let frame = 0; frame <= 5; frame++) {
      const paint = () => {
        ctx.clearRect(-3, -4, 320, 240);
        const result = home[method](ctx, 137.25, 92.5, frame);
        assert.equal(method === 'pickupAt' ? result.drawn : result, true);
        assert.equal(ctx.globalAlpha, alpha); assert.equal(ctx.getTransform().toString(), transform);
        return ctx.getImageData(0, 0, 320, 240).data;
      };
      const first = paint(); assert.ok(first.some((value, index) => index % 4 === 3 && value > 0));
      assert.deepEqual(paint(), first);
      assert.equal(first[3], 0, 'no LCD-wide accidental background');
    }
    assert.deepEqual(renderer.diagnostics, []);
  } finally {
    renderer.dispose(); if (saved) Object.defineProperty(globalThis, 'document', saved); else delete globalThis.document;
  }
});
