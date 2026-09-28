import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { createNotesIntroComposer, notesIntroSourcesFromPacks } from '../src/os/notes-intro-publication.ts';

const moduleSource = readFileSync(new URL('../src/os/stock-native-personal-tools.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(moduleSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  .replaceAll("'./native-layout'", JSON.stringify(new URL('../src/os/native-layout.ts', import.meta.url).href))
  .replaceAll("'./stock-screen-layout'", JSON.stringify(new URL('../src/os/stock-screen-layout.ts', import.meta.url).href));
const { drawNativePersonalToolFrame } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
const root = new URL('../public/os/firmware/10.7.0-32E/packs/game-notes/', import.meta.url);
const pack = name => JSON.parse(readFileSync(new URL(name, root)));
const sources = notesIntroSourcesFromPacks({ 'notes-image': pack('memo-ImageScreenUp-arc-l.json'), 'notes-aplt-u': pack('memo-ApltBoot_U_00-arc-l.json'), 'notes-aplt-d': pack('memo-ApltBoot_D_00-arc-l.json') });
const owner = { notesOwner: 'notes-1', applicationOwner: 'camera-1', captureGeneration: 1, titleId: '0004001000022400' };
function fixture() {
  const composer = createNotesIntroComposer();
  const state = composer.sync({ owner, assetsReady: true, paused: false, startup: 'nonzero-history', metadata: {
    ...owner, status: 'ready', metadata: { selection: { titleId: owner.titleId }, icon: { width: 64, height: 64, data: new Uint8ClampedArray(16384) } },
    capture: { status: 'ready', owner: owner.applicationOwner, generation: 1 },
  } });
  return { composer, step: () => composer.step(state.ticket), compose: () => composer.compose(sources) };
}
function paint(intro) {
  const top = {}, bottom = {}, calls = [];
  const renderer = { packs: { 'notes-messages': pack('messages-and-loose.json') }, draw(ctx, alias, layout, options) { calls.push({ ctx, alias, layout, options }); return true; }, drawLayout(ctx, alias, layout, pose, options) { calls.push({ ctx, alias, layout, pose, options }); return true; } };
  assert.equal(drawNativePersonalToolFrame(renderer, top, bottom, { appId: 'game-notes', screen: 'main', selection: 0, rows: [] }, { notesIntro: intro }), true);
  return calls.filter(c => c.ctx === bottom);
}
test('native lower intro is the last list draw and uses the exact precomposed pose', () => {
  const f = fixture(); f.step(); const composition = f.compose();
  const calls = paint({ status: 'posed', ...composition, scene10Draw: false });
  assert.deepEqual(calls.map(c => c.alias), ['notes-lower', 'notes-list', 'notes-aplt-d']);
  assert.equal(calls.at(-1).pose, composition.lower);
  assert.equal(calls.at(-1).layout, 'ApltBoot_D_00');
  assert.equal(calls.at(-1).options.overrides.T_Aplt_00.text, 'Game Notes');
  assert.deepEqual(paint({ status: 'posed', ...composition }).at(-1).pose, composition.lower, 'repainting does not step source time');
  f.composer.dispose();
});
test('scene9 completion removes lower overlay independently of the upper draw flag', () => {
  const f = fixture(); for (let i = 0; i < 21; i++) f.step();
  const composition = f.compose(); assert.equal(composition.scene9Draw, false);
  assert.deepEqual(paint({ status: 'posed', ...composition, scene10Draw: true }).map(c => c.alias), ['notes-lower', 'notes-list']);
  f.composer.dispose();
});
test('pending ready metadata covers the lower list with original ApltBoot layout', () => {
  const calls = paint({ status: 'pending' });
  assert.deepEqual(calls.map(c => c.alias), ['notes-lower', 'notes-list', 'notes-aplt-d']);
  assert.equal(calls.at(-1).options.overrides.T_Aplt_00.text, 'Game Notes');
  assert.deepEqual(calls.at(-1).options.bindings, [{ name: 'ApltBoot_D_00_SceneIn', frame: 0 }]);
});
test('existing no-metadata fallback has no invented lower intro clock', () => {
  assert.deepEqual(paint(undefined).map(c => c.alias), ['notes-lower', 'notes-list']);
});

test('startup source clip hides HOME label for its entire bounded interval', () => {
  const clip = pack('memo-ApltBoot_D_00-arc-l.json').animations.ApltBoot_D_00_SceneIn;
  assert.deepEqual(clip.tracks.find(t => t.target === 'P_Home_00' && t.property === 'visible').keys, [{ frame: -10, value: 0 }]);
});
