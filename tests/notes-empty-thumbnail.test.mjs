import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import { poseNativeLayout, rasterNativePicture } from '../src/os/native-layout.ts';
import { decodeNativePng } from '../src/os/native-png.ts';

const source = readFileSync(new URL('../src/os/stock-native-personal-tools.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  .replaceAll("'./native-layout'", JSON.stringify(new URL('../src/os/native-layout.ts', import.meta.url).href))
  .replaceAll("'./stock-screen-layout'", JSON.stringify(new URL('../src/os/stock-screen-layout.ts', import.meta.url).href))
  .replaceAll("'./device-status-profile'", JSON.stringify(new URL('../src/os/device-status-profile.ts', import.meta.url).href));
const tools = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
const root = new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const json = path => JSON.parse(readFileSync(new URL(path, root)));
const path = 'packs/game-notes/contents/0000-00000007/memo-MemoListDown-empty-thumbnail.json';
const pack = json(path), original = json('packs/game-notes/memo-MemoListDown-arc-l.json');
const textureName = 'runtime-empty-note-thumbnail', texture = pack.textures[textureName];
const panes = roots => roots.flatMap(pane => [pane, ...panes(pane.children)]);

test('list preparation explicitly requests the derived empty texture through native title readiness', () => {
  const view = tools.nativePersonalToolView({ appId: 'game-notes', screen: 'main', selection: 0, rows: [] });
  const list = view.packs.find(request => request.alias === 'notes-list');
  assert.equal(list.url, path);
  assert.deepEqual(list.textures, [textureName]);
  assert.deepEqual(list.layouts, ['MemoListDown']);
  assert.deepEqual(list.animations, ['MemoListDown_Base', 'MemoListDown_SceneIn', 'MemoListDown_Decide']);
});

test('delivered thumbnail is the RGB565 source initializer, not captured native colors', async () => {
  const bytes = readFileSync(new URL(texture.url, root));
  const pixels = await decodeNativePng(bytes, texture), manifest = json('manifest.json');
  assert.equal(createHash('sha256').update(bytes).digest('hex'), manifest.resources[texture.url].sha256);
  assert.equal(pixels.width, 128); assert.equal(pixels.height, 64);
  for (let at = 0; at < pixels.data.length; at += 4) assert.deepEqual([...pixels.data.slice(at, at + 4)], [231, 231, 231, 255]);
  const binding = manifest.resources[texture.url].conversion.runtimeBinding;
  assert.equal(binding.fillHalfword, '0xe73c');
  assert.equal(binding.sourceCodeSha256, '8a2feea02c2a6ef62c8a8d3e4cc20faa5639fe5af47d3876f8a5d3ea43064cc6');
  assert.deepEqual(binding.logicalSize, [68, 42]);
  assert.deepEqual(binding.storageSize, [128, 64]);
});

test('the new sampler binds all sixteen original thumbnail panes without recoloring or moving them', async () => {
  assert.deepEqual(pack.layouts, original.layouts); assert.deepEqual(pack.animations, original.animations);
  const options = tools.notesEmptyThumbnailOverrides(pack), layout = pack.layouts.MemoListDown;
  const posed = poseNativeLayout(layout, pack.animations,
    [{ name: 'MemoListDown_Base', frame: 0 }, { name: 'MemoListDown_SceneIn', frame: 20 }], options);
  const before = poseNativeLayout(layout, pack.animations,
    [{ name: 'MemoListDown_Base', frame: 0 }, { name: 'MemoListDown_SceneIn', frame: 20 }]);
  const pixels = await decodeNativePng(readFileSync(new URL(texture.url, root)), texture);
  for (let slot = 0; slot < 16; slot++) {
    const name = 'P_BtnMemoThum' + String(slot).padStart(2, '0');
    const pane = panes(posed.roots).find(value => value.name === name), sourcePane = panes(before.roots).find(value => value.name === name);
    for (const key of ['translation', 'size', 'scale', 'alpha', 'flags']) assert.deepEqual(pane[key], sourcePane[key]);
    assert.deepEqual(pane.picture.colors, sourcePane.picture.colors);
    const material = posed.materials[pane.picture.material];
    assert.equal(posed.textures[material.textureMaps[0].texture], textureName);
    const raster = rasterNativePicture(posed, pane.picture, 68, 42, new Map([[textureName, pixels]]));
    assert.ok(raster.data.every((value, at) => value === (at % 4 === 3 ? 255 : 231)));
  }
  assert.equal(Object.keys(options).length, 16);
});

test('absent or wrong selected runtime textures fail instead of retaining the white archive dummy', () => {
  assert.throws(() => tools.notesEmptyThumbnailOverrides(original), /Missing or unsupported/);
  for (const change of [{ width: 68 }, { height: 42 }, { picaFormat: 5 }]) {
    const invalid = structuredClone(pack); Object.assign(invalid.textures[textureName], change);
    assert.throws(() => tools.notesEmptyThumbnailOverrides(invalid), /Missing or unsupported/);
  }
});

test('thumbnail binding preserves list cursor, paired draw failure and independent cover ordering', () => {
  const top = {}, bottom = {}, calls = [];
  const renderer = { packs: { 'notes-list': pack, 'notes-image': json('packs/game-notes/memo-ImageScreenUp-arc-l.json'),
    'notes-messages': json('packs/game-notes/messages-and-loose.json'),
    'notes-hud-messages': json('packs/game-notes/contents/0000-00000007/hud-messages.json') },
    draw(ctx, alias, layout, options) { calls.push({ ctx, alias, layout, options }); return alias !== 'notes-list'; },
    drawLayout(ctx, alias, layout, pose, options) { calls.push({ ctx, alias, layout, pose, options }); return true; } };
  const intro = { status: 'boot-cover', owner: 'notes:1', steps: 8, ticket: 2, upper: {}, lower: {}, scene9Draw: true, scene10Draw: true };
  const identity = JSON.stringify(intro);
  assert.equal(tools.drawNativePersonalToolFrame(renderer, top, bottom,
    { appId: 'game-notes', screen: 'main', selection: 11, rows: [] },
    { notesIntro: intro, suspendedCapture: { status: 'none' }, date: new Date(2026, 8, 22) }), false);
  const lower = calls.filter(call => call.ctx === bottom);
  assert.deepEqual(lower.map(call => call.alias), ['notes-lower', 'notes-list', 'notes-aplt-d']);
  assert.deepEqual(lower[1].options.overrides.N_CsrMemo.translation, [119, -12, 0]);
  for (const [name, value] of Object.entries(tools.notesEmptyThumbnailOverrides(pack))) assert.deepEqual(lower[1].options.overrides[name], value);
  assert.deepEqual(calls.filter(call => call.ctx === top).map(call => call.alias), ['notes-upper', 'notes-image', 'notes-hud', 'notes-aplt-u']);
  assert.equal(JSON.stringify(intro), identity);
});
