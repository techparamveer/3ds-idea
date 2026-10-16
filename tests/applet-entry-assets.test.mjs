import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { appletEntrySelection, appletEntryBindings, appletEntryOverrides, validateAppletEntryAssets } from '../src/os/applet-entry-assets.ts';
import { manualEntryBindings, validateManualEntryAssets } from '../src/os/manual-entry-assets.ts';
import { nativePaneParentPath, poseNativeLayout } from '../src/os/native-layout.ts';

const root = new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const read = path => readFileSync(new URL(path, root));
const json = path => JSON.parse(read(path));
const common = json('packs/home/common.json'), messages = json('packs/home/messages-and-loose.json');
const pane = (layout, name) => nativePaneParentPath(layout, name).at(-1);
const material = (layout, name) => { const value = pane(layout, name); return layout.materials[value.picture?.material ?? value.text.material]; };
const callers = [
  ['game-notes', 0, 'LncApltPictMemo_00.bclim', 'lau_title_memo', 'Game Notes', [205, 210, 45], [0, 0], [1, 1]],
  ['friends', 1, 'LncApltPictFrd_00.bclim', 'lau_title_fri', 'Friend List', [230, 135, 60], [.5, 0], [2, 1]],
  ['notifications', 2, 'LncApltPictNews_00.bclim', 'lau_title_news', 'Notifications', [55, 205, 165], [.5, 0], [2, 1]],
  ['browser', 3, 'LncApltPictWeb_00.bclim', 'lau_title_web', 'Internet Browser', [40, 165, 230], [.5, .5], [2, 2]],
  ['miiverse', 7, 'LncApltPictOlv_00.bclim', null, null, [0, 200, 0], [.5, 0], [2, 1]],
];

for (const [appId, selector, texture, label, text, tint, translation, scale] of callers) {
  test(`${appId} selects original cover endpoints and its source label or authored logo`, () => {
    const before = JSON.stringify(common);
    validateAppletEntryAssets(common, appId);
    assert.equal(appletEntrySelection(appId).selector, selector);
    assert.equal(appletEntrySelection(appId).texture, texture);
    const overrides = appletEntryOverrides(messages, appId);
    if (label) {
      assert.equal(appletEntrySelection(appId).label, label);
      assert.equal(overrides.T_Aplt_00.text, text);
      assert.deepEqual(overrides.T_Aplt_00.messageStyle, messages.styles[messages.messages.menu_msbt_LZ.styleTable].styles[12]);
      assert.equal(overrides.T_Aplt_00.alpha, undefined);
      assert.equal(overrides.T_Aplt_00.fontSize, undefined);
    } else {
      assert.deepEqual(overrides, {});
      assert.deepEqual(appletEntryOverrides({ messages: {} }, appId), {});
      assert.equal(appletEntrySelection(appId).material, 'Miiverse_logo_01');
      assert.equal(appletEntrySelection(appId).logoTexture, 'Miiverse_logo_00.bclim');
    }
    for (const phase of ['out', 'in']) for (const frame of [0, 20]) {
      const bindings = appletEntryBindings({ appId, phase, frame });
      const suffix = phase === 'out' ? 'SceneOut' : 'SceneIn';
      assert.deepEqual(bindings.upper, [{ name: `CmnFade_U_00_${suffix}`, frame }]);
      assert.deepEqual(bindings.lower, [{ name: 'CmnFade_D_00_Aplt', frame: selector }, { name: `CmnFade_D_00_${suffix}`, frame }]);
      const lower = poseNativeLayout(common.layouts.CmnFade_D_00, common.animations, bindings.lower, overrides);
      const upper = poseNativeLayout(common.layouts.CmnFade_U_00, common.animations, bindings.upper);
      const alpha = phase === 'out' ? (frame === 0 ? 0 : 255) : (frame === 0 ? 255 : 0);
      assert.equal(pane(upper, 'P_Bg_U_00').alpha, alpha);
      assert.equal(pane(lower, 'P_Bg_D_00').alpha, alpha);
      assert.equal(pane(lower, 'P_Belt_00').alpha, alpha);
      assert.equal(pane(lower, 'P_Belt_00').translation[0], phase === 'out' ? (frame === 0 ? 80 : 0) : (frame === 0 ? 0 : -80));
      assert.deepEqual(material(lower, 'P_Belt_00').constantColors[0], [...tint, 255]);
      assert.deepEqual(material(lower, 'P_Aplt_00').bufferColor, [...tint, 0]);
      assert.deepEqual(material(lower, 'P_Aplt_00').textureMatrices[0], { translation, scale, rotation: 0 });
      assert.equal(lower.textures[material(lower, 'P_Aplt_00').textureMaps[0].texture], texture);
      assert.equal(material(lower, 'T_Aplt_00').constantColors[0][3], appId === 'miiverse' ? 1 : 255);
      const logo = material(lower, 'Miiverse_logo_01');
      assert.equal(lower.textures[logo.textureMaps[0].texture], 'Miiverse_logo_00.bclim');
      assert.deepEqual(logo.textureMatrices[0].translation, [0, appId === 'miiverse' ? 0 : 1]);
      assert.equal(pane(lower, 'T_Aplt_00').text.value, text ?? 'Applet Title');
    }
    assert.equal(JSON.stringify(common), before);
  });
}

test('source-frame/caller boundary rejects unsupported selectors without changing Manual selector 4', () => {
  validateManualEntryAssets(common);
  for (const phase of ['out', 'in']) for (const frame of [0, 20]) {
    assert.equal(manualEntryBindings({ phase, frame }).lower[0].frame, 4);
    assert.equal(appletEntryBindings({ appId: 'notifications', phase, frame }).lower[0].frame, 2);
  }
  for (const frame of [-1, .5, 21, NaN]) assert.throws(() => appletEntryBindings({ appId: 'friends', phase: 'out', frame }), /source frame/);
  assert.throws(() => appletEntryBindings({ appId: 'friends', phase: 'hold', frame: 0 }), /phase/);
  for (const appId of ['manual', 'home', 'camera', '', 'toString']) assert.throws(() => appletEntrySelection(appId), /caller/);
});

test('every original selector key, including duplicate-frame values/slopes, is preserved and validated', () => {
  const source = common.animations.CmnFade_D_00_Aplt;
  assert.equal(source.tracks.length, 13);
  for (const [index, track] of source.tracks.entries()) {
    for (const mutate of [
      value => value.keys[0].value += .125,
      value => value.keys.splice(value.keys.findIndex((key, at, keys) => at && key.frame === keys[at - 1].frame), 1),
      value => value.component += 1,
      value => value.interpolation = 'linear',
    ]) {
      const pack = structuredClone(common); mutate(pack.animations.CmnFade_D_00_Aplt.tracks[index]);
      assert.throws(() => validateAppletEntryAssets(pack, 'miiverse'), /Unsupported/, `${track.target}/${track.property}`);
    }
  }
  const pack = structuredClone(common);
  pack.animations.CmnFade_D_00_Aplt.tracks[3].keys.at(-1).slope = 0;
  assert.throws(() => validateAppletEntryAssets(pack, 'game-notes'), /selector keys/);
});

test('missing or malformed selected texture, authored logo material and parent fail explicitly', () => {
  for (const [appId, , texture] of callers) {
    for (const change of [null, { width: 1 }, { height: 1 }, { picaFormat: 3 }, { url: '' }]) {
      const pack = structuredClone(common);
      if (change) Object.assign(pack.textures[texture], change); else delete pack.textures[texture];
      assert.throws(() => validateAppletEntryAssets(pack, appId), /selected applet texture/);
    }
  }
  const changes = [
    p => delete p.textures['Miiverse_logo_00.bclim'],
    p => p.textures['Miiverse_logo_00.bclim'].picaFormat = 9,
    p => delete p.layouts.CmnFade_D_00.materials[9],
    p => p.layouts.CmnFade_D_00.materials[9].name = 'substitute',
    p => p.layouts.CmnFade_D_00.materials[9].textureMaps = [],
    p => p.layouts.CmnFade_D_00.materials[9].textureMatrices[0].scale[0] = 2,
    p => p.layouts.CmnFade_D_00.materials[9].bufferColor[1] = 199,
    p => pane(p.layouts.CmnFade_D_00, 'Miiverse_logo_01').flags = 0,
    p => pane(p.layouts.CmnFade_D_00, 'Miiverse_logo_01').name = 'absent',
    p => pane(p.layouts.CmnFade_D_00, 'Miiverse_logo_01').size[0] = 127,
    p => pane(p.layouts.CmnFade_D_00, 'Miiverse_logo_01').picture.uvSets[0][2] = .5,
    p => p.animations.CmnFade_D_00_Aplt.tracks.find(t => t.target === 'T_Aplt_00').keys.at(-1).value = 0,
    p => p.animations.CmnFade_D_00_Aplt.textures[5] = 'LncApltPictHome_00.bclim',
    p => p.layouts.CmnFade_D_00.groups[0].children.find(g => g.name === 'G_Aplt_00').panes.splice(3, 1),
  ];
  for (const [index, mutate] of changes.entries()) {
    const pack = structuredClone(common); mutate(pack);
    assert.throws(() => validateAppletEntryAssets(pack, 'miiverse'), /Unsupported|unsupported/, `logo mutation ${index}`);
  }
});

test('selected native labels and styles fail without fallback text or guessed typography', () => {
  for (const [appId, , , label] of callers.filter(value => value[3])) {
    const absent = structuredClone(messages); delete absent.messages.menu_msbt_LZ.labels[label];
    assert.throws(() => appletEntryOverrides(absent, appId), /label missing/);
    const malformed = structuredClone(messages); delete malformed.styles[malformed.messages.menu_msbt_LZ.styleTable].styles[12];
    assert.throws(() => appletEntryOverrides(malformed, appId), /native message style/);
    const styleless = structuredClone(messages); styleless.messages.menu_msbt_LZ.messages[styleless.messages.menu_msbt_LZ.labels[label]].styleIndex = null;
    assert.throws(() => appletEntryOverrides(styleless, appId), /label missing or unsupported/);
  }
});

test('unchanged delivered common/messages hashes and selected source mappings match the manifest', () => {
  const manifest = json('manifest.json');
  for (const path of [manifest.home.common, manifest.home.messages]) {
    assert.equal(createHash('sha256').update(read(path)).digest('hex'), manifest.resources[path].sha256);
  }
  assert.equal(manifest.titles['0004003000009802'].version, 24576);
  assert.equal(common.resourceSources.animations.CmnFade_D_00_Aplt.sha256, '1a63a18209ece9d5bd7dbf86f2ead1f008cce5a665ff6cc408f014168a85a801');
  for (const [, , texture] of callers) assert.equal(common.resourceSources.textures[texture].titleId, '0004003000009802');
  assert.equal(common.resourceSources.textures['Miiverse_logo_00.bclim'].sha256, '1814b55ced47189421c8c27f58522932724df2f76f0bc0168d7416d386fff9c5');
  assert.equal(messages.resourceSources.messages.menu_msbt_LZ.sha256, '1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350');
});
