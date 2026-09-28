import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { nativePaneParentPath, poseNativeLayout } from '../src/os/native-layout.ts';

const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const sourceUrl = new URL('../src/os/firmware-presentation.ts', import.meta.url);
const { outputText } = ts.transpileModule(readFileSync(sourceUrl, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const resolved = outputText.replace(/(from\s*['"])(\.[^'"]+)(['"])/g, (_all, prefix, path, suffix) =>
  prefix + (path === './native-renderer' ? moduleUrl('export class NativeLayoutRenderer {}')
    : new URL(path.endsWith('.ts') ? path : `${path}.ts`, sourceUrl).href) + suffix);
const { createFirmwareHome } = await import(moduleUrl(resolved));
const pack = JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/home/launcher.json', import.meta.url)));
const home = (data = pack) => createFirmwareHome({ renderer: { packs: { launcher: data }, draw() { throw Error('Sampling must not draw'); } } });
const densities = [0, .375, 1, 1.625, 2, 2.375, 3, 3.5, 4, 4.75, 5];
const pane = 'P_IconBtnDmy_00', name = 'LncIconDist_01';

test('actual tile resource ancestry places density geometry below or outside the animated translation', () => {
  const layout = pack.layouts[name], path = nativePaneParentPath(layout, pane);
  assert.deepEqual(path.map(p => p.name), ['RootPane', pane]);
  assert.deepEqual(path.map(p => [p.translation, p.rotation, p.scale].map(values => values.map(value => value === 0 ? 0 : value))), [
    [[0, 0, 0], [0, 0, 0], [1, 1]], [[0, 0, 0], [0, 0, 0], [1, 1]],
  ]);
  assert.equal(pack.animations[name + '_Scale'], undefined);
  assert.equal(nativePaneParentPath(layout, 'P_Icon_00').at(-2).name, pane);
  assert.deepEqual(nativePaneParentPath(layout, 'B_Icon_00').map(p => p.name), ['RootPane', 'B_Icon_00']);
  for (const clip of ['Select', 'Decide']) {
    const animation = pack.animations[`${name}_${clip}`];
    assert.equal(animation.frames, 2); assert.equal(animation.loop, false); assert.equal(animation.childBinding, false);
    assert.deepEqual(animation.groups, ['G_Icon_00']);
    assert.deepEqual(animation.tracks.map(track => [track.target, track.property]), [[pane, 'translation.y']]);
  }
});

test('source Select/Decide duplicate endpoints produce the recorded local writes and resource LCD offsets at every density', () => {
  const presenter = home();
  // Local native writes are pinned in GRID_STYLUS_EVIDENCE, not inferred from
  // primary-cursor Select or from the size of the separately assembled plate.
  for (const [clip, frame, localY, offset] of [['select', 0, 0, 0], ['select', 1, -2, 2],
    ['decide', 0, -2, 2], ['decide', 1, 0, 0]]) {
    const pose = Object.freeze({ clip, frame });
    const binding = `${name}_${clip === 'select' ? 'Select' : 'Decide'}`;
    const posed = poseNativeLayout(pack.layouts[name], pack.animations, [{ name: binding, frame }]);
    assert.equal(nativePaneParentPath(posed, pane).at(-1).translation[1], localY);
    assert.deepEqual(nativePaneParentPath(posed, 'B_Icon_00').at(-1), nativePaneParentPath(pack.layouts[name], 'B_Icon_00').at(-1));
    for (const density of densities) assert.equal(presenter.tilePressOffset(pose, density), offset, `${clip}${frame} density${density}`);
  }
});

test('only the retained writer is sampled; null poses and fractional endpoints preserve the native key snap', () => {
  const presenter = home();
  for (const density of densities) {
    assert.equal(presenter.tilePressOffset(null, density), 0);
    assert.equal(presenter.tilePressOffset(undefined, density), 0);
    for (const frame of [.125, .5, .998]) {
      assert.equal(presenter.tilePressOffset({ clip: 'select', frame }, density), 0);
      assert.equal(presenter.tilePressOffset({ clip: 'decide', frame }, density), 2);
    }
    // Original HOME209cd0 snaps within the strict0.001 key boundary.
    assert.equal(presenter.tilePressOffset({ clip: 'select', frame: .999999 }, density), 2);
    assert.equal(presenter.tilePressOffset({ clip: 'decide', frame: .999999 }, density), 0);
    // Decide1 restored the pane; a subsequent Select0 cannot be overwritten
    // by any old Decide0 applied frame because the API receives only its writer.
    const poses = [{ clip: 'select', frame: 1 }, { clip: 'decide', frame: 1 },
      { clip: 'select', frame: 0 }, { clip: 'select', frame: 1 }];
    assert.deepEqual(poses.map(pose => presenter.tilePressOffset(pose, density)), [2, 0, 0, 2]);
  }
});

test('ancestor transform scales displacement, while the target and its descendant scales do not', () => {
  const adjusted = structuredClone(pack), layout = adjusted.layouts[name];
  const [root, target] = nativePaneParentPath(layout, pane);
  root.scale = [3, .5]; root.translation = [17, -23, 0];
  target.scale = [.25, .25]; target.children[0].scale = [.125, .125];
  const presenter = home(adjusted);
  for (const density of densities) assert.equal(presenter.tilePressOffset({ clip: 'select', frame: 1 }, density), 1);
  root.rotation[2] = 180;
  assert.ok(Math.abs(presenter.tilePressOffset({ clip: 'select', frame: 1 }, 2) + 1) < 1e-12);
  root.rotation[2] = 0; root.rotation[0] = 60;
  assert.ok(Math.abs(presenter.tilePressOffset({ clip: 'select', frame: 1 }, 2) - .5) < 1e-12);
});

test('sampling respects the actual binding group and requires the translated pane', () => {
  const wrongGroup = structuredClone(pack);
  wrongGroup.animations.LncIconDist_01_Select.groups = ['G_Scale_00'];
  assert.throws(() => home(wrongGroup).tilePressOffset({ clip: 'select', frame: 1 }, 2), /Missing native tile press transform/);
  const missingPane = structuredClone(pack);
  missingPane.layouts[name].roots[0].children = [];
  assert.throws(() => home(missingPane).tilePressOffset({ clip: 'decide', frame: 0 }, 2), /Missing native tile press transform/);
});

test('sampling stays read-only and validates nonfinite values without touching renderer or controllers', () => {
  const data = structuredClone(pack), before = JSON.stringify(data), presenter = home(data);
  const pose = Object.freeze({ clip: 'select', frame: 1 });
  for (let count = 0; count < 3; count++) for (const density of densities) presenter.tilePressOffset(pose, density);
  assert.deepEqual(pose, { clip: 'select', frame: 1 }); assert.equal(JSON.stringify(data), before);
  for (const value of [NaN, Infinity, -Infinity, '1', null]) {
    assert.throws(() => presenter.tilePressOffset({ clip: 'select', frame: value }, 2), RangeError);
    assert.throws(() => presenter.tilePressOffset(pose, value), RangeError);
  }
  assert.throws(() => presenter.tilePressOffset({ clip: 'loop', frame: 1 }, 2), RangeError);
});

test('the real assembled folder plate and generated first-character layer share the sampled displacement', () => {
  const saved = Object.getOwnPropertyDescriptor(globalThis, 'document'), calls = [];
  globalThis.document = { createElement() {
    return { width: 0, height: 0, getContext() { return {
      getImageData: (_x, _y, width, height) => ({ width, height, data: new Uint8ClampedArray(width * height * 4) }),
    }; } };
  } };
  const renderer = { packs: { launcher: pack }, draw(ctx, bank, name, options) { calls.push({ ctx, bank, name, options }); return true; } };
  try {
    const presenter = createFirmwareHome({ renderer }), ctx = {};
    for (const density of densities) for (const pose of [{ clip: 'select', frame: 0 }, { clip: 'select', frame: 1 },
      { clip: 'decide', frame: 0 }, { clip: 'decide', frame: 1 }]) {
      calls.length = 0;
      const offset = presenter.tilePressOffset(pose, density);
      assert.equal(presenter.tile(ctx, 20, 50 + offset, 48, density, true, false, 'A'), true);
      const layers = calls.filter(call => call.ctx === ctx);
      assert.deepEqual(layers.map(call => call.name), ['LncIconFolder_00', 'LncIconDist_01']);
      assert.deepEqual(layers.map(call => call.options.center), [[44, 74 + offset], [44, 74 + offset]]);
      assert.deepEqual(layers[0].options.bindings, [{ name: 'LncIconFolder_00_Scale', frame: density }]);
      assert.equal(layers[1].options.bindings, undefined, 'the translated glyph is not animated a second time');
      assert.deepEqual(layers[1].options.overrides.P_IconBtnDmy_00.size, [0, 0]);
      assert.ok(layers[1].options.textures['runtime:folder-first-character']);
    }
  } finally {
    if (saved) Object.defineProperty(globalThis, 'document', saved); else delete globalThis.document;
  }
});
