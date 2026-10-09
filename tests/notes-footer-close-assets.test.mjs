import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { nativePaneParentPath, poseNativeLayout, nativeMessageOverride } from '../src/os/native-layout.ts';
import { notesFooterReturnBindings, validateNotesFooterCloseAssets, validateNotesFooterReturnAssets } from '../src/os/notes-footer-close-assets.ts';

const root = new URL('../public/os/firmware/10.7.0-32E/packs/', import.meta.url);
const pack = path => JSON.parse(readFileSync(new URL(path, root)));
const packs = {
  'notes-upper': pack('game-notes/memo-Bg_U_00-arc-l.json'), 'notes-lower': pack('game-notes/memo-Bg_D_00-arc-l.json'),
  'notes-list': pack('game-notes/contents/0000-00000007/memo-MemoListDown-empty-thumbnail.json'),
  'notes-aplt-u': pack('game-notes/memo-ApltBoot_U_00-arc-l.json'), 'notes-aplt-d': pack('game-notes/memo-ApltBoot_D_00-arc-l.json'),
  'notes-image': pack('game-notes/memo-ImageScreenUp-arc-l.json'), 'notes-messages': pack('game-notes/messages-and-loose.json'),
  'notes-hud': pack('game-notes/contents/0000-00000007/memo-HudMenuAplt_00-arc-l.json'),
  'notes-hud-messages': pack('game-notes/contents/0000-00000007/hud-messages.json'),
};
const common = pack('home/common.json'), messages = pack('home/messages-and-loose.json');
const homeLabel = nativeMessageOverride(messages, 'menu_msbt_LZ', 'lau_title_menu', '');
const pane = (layout, name) => nativePaneParentPath(layout, name)?.at(-1);
const sourceUrl = new URL('../src/os/stock-native-personal-tools.ts', import.meta.url);
const compiled = ts.transpileModule(readFileSync(sourceUrl, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  .replace(/(from\s*['"])(\.[^'"]+)(['"])/g, (_all, prefix, path, suffix) => prefix + new URL(path.endsWith('.ts') ? path : `${path}.ts`, sourceUrl).href + suffix);
const { drawNativePersonalToolFrame } = await import('data:text/javascript;base64,' + Buffer.from(compiled + '\n//# sourceURL=notes-footer-close-assets-fixture.js').toString('base64'));

test('Notes outgoing and HOME incoming use their delivered forward source resources', () => {
  validateNotesFooterCloseAssets(packs); validateNotesFooterReturnAssets(common);
  assert.equal(homeLabel.text, 'HOME Menu');
  for (const frame of [0, 5, 10, 20]) {
    const upper = poseNativeLayout(packs['notes-aplt-u'].layouts.ApltBoot_U_00, packs['notes-aplt-u'].animations, [{ name: 'ApltBoot_U_00_SceneOut', frame }]);
    const lower = poseNativeLayout(packs['notes-aplt-d'].layouts.ApltBoot_D_00, packs['notes-aplt-d'].animations, [{ name: 'ApltBoot_D_00_SceneOut', frame }]);
    assert.equal(pane(upper, 'P_Bg_U_00').alpha, pane(lower, 'P_Bg_D_00').alpha);
    assert.equal(pane(lower, 'P_Home_00').flags & 1, 1); assert.equal(pane(lower, 'P_Aplt_00').flags & 1, 0);
  }
  for (const frame of [0, 20]) {
    const bindings = notesFooterReturnBindings(frame), lower = poseNativeLayout(common.layouts.CmnFade_D_00, common.animations, bindings.lower);
    assert.equal(pane(lower, 'P_Bg_D_00').alpha, frame ? 0 : 255);
    assert.equal(pane(lower, 'P_Belt_00').translation[0], frame ? -80 : 0);
    const icon = pane(lower, 'P_Aplt_00'), material = lower.materials[icon.picture.material];
    assert.equal(lower.textures[material.textureMaps[0].texture], 'LncApltPictHome_00.bclim');
  }
  for (const bad of [-1, 21, .5, NaN]) assert.throws(() => notesFooterReturnBindings(bad), /Invalid/);
});

test('actual Notes painter keeps list geometry, fits footer feedback and cursor removal, then draws two Notes-owned covers', () => {
  const calls = [], top = {}, bottom = {};
  const renderer = { packs, draw(ctx, alias, name, options = {}) {
    const source = packs[alias]; assert.ok(source?.layouts[name]);
    const layout = poseNativeLayout(source.layouts[name], source.animations, options.bindings ?? [], options.overrides);
    calls.push({ ctx, alias, name, options, layout }); return true;
  }, drawLayout() { throw Error('The settled list must not replay its intro during close'); } };
  const view = { appId: 'game-notes', screen: 'main', rows: [], selection: 0, data: {} };
  let listBefore;
  for (const close of [{ kind: 'feedback', frame: 0 }, { kind: 'feedback', frame: 1 }, { kind: 'out', frame: 10 }, { kind: 'out', frame: 20 }]) {
    calls.length = 0;
    assert.equal(drawNativePersonalToolFrame(renderer, top, bottom, view, { date: new Date(0), notesIntro: {status:'boot-cover',scene9Draw:false,scene10Draw:false}, notesFooterClose: { ...close, homeLabel } }), true);
    const list = calls.find(call => call.alias === 'notes-list').layout;
    assert.equal(pane(list, 'N_CsrMemo').flags & 1, close.kind === 'feedback' && close.frame === 0 ? 1 : 0);
    const material = list.materials[pane(list, 'P_Btn_00').picture.material];
    assert.deepEqual(material.constantColors[0].slice(0, 3), [255, 255, 250]);
    const geometry = Array.from({ length: 16 }, (_, slot) => pane(list, `N_BtnMemo${String(slot).padStart(2, '0')}`).translation);
    if (listBefore) assert.deepEqual(geometry, listBefore); else listBefore = geometry;
    const outgoing = calls.filter(call => call.alias.startsWith('notes-aplt'));
    assert.equal(outgoing.length, close.kind === 'out' ? 2 : 0);
    if (close.kind === 'out') {
      assert.equal(pane(outgoing.find(call => call.ctx === bottom).layout, 'T_Home_00').text.value, 'HOME Menu');
      assert.ok(outgoing.every(call => call.options.bindings[0].name.endsWith('_SceneOut')));
    }
  }
});

test('missing selected clips, unsupported fields and replacement HOME selector fail explicitly', () => {
  for (const alias of ['notes-aplt-u', 'notes-aplt-d', 'notes-list']) {
    const missing = { ...packs, [alias]: { ...packs[alias], animations: {} } };
    assert.throws(() => validateNotesFooterCloseAssets(missing), /Unsupported Notes/);
  }
  const broken = structuredClone(packs);
  broken['notes-aplt-d'].animations.ApltBoot_D_00_SceneOut.unsupported.push('unknown');
  assert.throws(() => validateNotesFooterCloseAssets(broken), /Unsupported Notes/);
  const missingHome = structuredClone(common); delete missingHome.textures['LncApltPictHome_00.bclim'];
  assert.throws(() => validateNotesFooterReturnAssets(missingHome), /Unsupported Notes/);
});
