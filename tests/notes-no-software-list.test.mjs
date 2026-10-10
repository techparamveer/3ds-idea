import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { poseNativeLayout } from '../src/os/native-layout.ts';

const source = readFileSync(new URL('../src/os/stock-native-personal-tools.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  .replaceAll("'./native-layout'", JSON.stringify(new URL('../src/os/native-layout.ts', import.meta.url).href))
  .replaceAll("'./stock-screen-layout'", JSON.stringify(new URL('../src/os/stock-screen-layout.ts', import.meta.url).href))
  .replaceAll("'./device-status-profile'", JSON.stringify(new URL('../src/os/device-status-profile.ts', import.meta.url).href));
const { notesNoSoftwareListOverrides } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
const root = new URL('../public/os/firmware/10.7.0-32E/packs/game-notes/', import.meta.url);
const pack = name => JSON.parse(readFileSync(new URL(name, root)));
const image = pack('memo-ImageScreenUp-arc-l.json'), messages = pack('messages-and-loose.json');
const pane = (layout, name) => {
  const visit = panes => { for (const next of panes) { if (next.name === name) return next; const child = visit(next.children); if (child) return child; } };
  return visit(layout.roots);
};

test('no-software list preserves source text geometry and samples only the pane-bound mask endpoint', () => {
  const before = JSON.stringify(image), overrides = notesNoSoftwareListOverrides(image, messages);
  const posed = poseNativeLayout(image.layouts.ImageScreenUp, image.animations, [], overrides);
  const original = pane(image.layouts.ImageScreenUp, 'T_TextList'), text = pane(posed, 'T_TextList');
  assert.equal(text.text.value, 'There is no suspended software.');
  assert.equal(text.flags & 1, 1); assert.equal(text.alpha, 255);
  for (const key of ['translation', 'rotation', 'scale', 'size']) assert.deepEqual(text[key], original[key]);
  for (const key of ['size', 'alignment', 'lineAlignment', 'characterSpacing', 'lineSpacing', 'material', 'font']) assert.deepEqual(text.text[key], original.text[key]);
  assert.deepEqual(posed.materials, image.layouts.ImageScreenUp.materials);
  assert.equal(pane(posed, 'P_Mask').alpha, 0);
  assert.equal(pane(posed, 'P_Mask').flags, pane(image.layouts.ImageScreenUp, 'P_Mask').flags);
  for (const name of ['T_TextWrite', 'W_TextPanel', 'P_ScreenShdwUp', 'P_ScreenShdwDown', 'P_ScreenUpR', 'P_ScreenUpL', 'P_ScreenDown', 'W_ScreenShdwUp', 'W_ScreenShdwDown', 'N_BtnMemoUp'])
    assert.equal(pane(posed, name).flags & 1, 0, name);
  assert.equal(JSON.stringify(image), before);
});

test('the list layout, mask and message retain exact pinned title provenance', () => {
  assert.equal(image.resourceSources.layouts.ImageScreenUp.sha256, 'b042e28a08e66c3fc545688ac79e835503819e82ac08261c20cf082efb9b74f3');
  assert.equal(image.resourceSources.animations.ImageScreenUp_SceneOut.sha256, 'e7316d8069d79db6357cac004ae04d075031553fc645673fe5f496983106dd39');
  assert.equal(messages.resourceSources.messages.message.sha256, 'e42a7a19bfa8a55abbff70357c8cbd02a0d8f1073d97b9801fcfe1a607b61955');
  assert.equal(image.titleId, '0004003000009c02'); assert.equal(messages.titleId, image.titleId);
});

test('missing or unsupported selected mask and messages fail explicitly', () => {
  assert.throws(() => notesNoSoftwareListOverrides({ ...image, animations: {} }, messages), /Unsupported native Notes/);
  for (const changes of [{ frames: 20 }, { loop: true }, { tracks: [...image.animations.ImageScreenUp_SceneOut.tracks, image.animations.ImageScreenUp_SceneOut.tracks.find(track => track.target === 'P_Mask')] }]) {
    const malformed = { ...image, animations: { ...image.animations, ImageScreenUp_SceneOut: { ...image.animations.ImageScreenUp_SceneOut, ...changes } } };
    assert.throws(() => notesNoSoftwareListOverrides(malformed, messages), /Unsupported native Notes/);
  }
  assert.throws(() => notesNoSoftwareListOverrides(image, { ...messages, messages: {} }), /Missing native Notes/);
  const missing = { ...messages, messages: { ...messages.messages, message: { ...messages.messages.message, messages: [] } } };
  assert.throws(() => notesNoSoftwareListOverrides(image, missing), /Missing native Notes/);
});
