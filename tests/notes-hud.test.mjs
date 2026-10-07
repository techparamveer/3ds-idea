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
const tools = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
const root = new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const json = path => JSON.parse(readFileSync(new URL(path, root)));
const hudPath = 'packs/game-notes/contents/0000-00000007/memo-HudMenuAplt_00-arc-l.json';
const messagePath = 'packs/game-notes/contents/0000-00000007/hud-messages.json';
const hud = json(hudPath), messages = json(messagePath), manifest = json('manifest.json');
const pane = (layout, name) => {
  const visit = panes => { for (const next of panes) { if (next.name === name) return next; const child = visit(next.children); if (child) return child; } };
  return visit(layout.roots);
};

test('Notes main readiness requires its own HUD layout, clips and message pack', () => {
  const view = tools.nativePersonalToolView({ appId: 'game-notes', screen: 'main', rows: [], selection: 0 });
  const hud = view.packs.find(pack => pack.alias === 'notes-hud');
  assert.ok(hud, 'the native upper HUD must be a required title-owned resource');
  assert.deepEqual(hud.layouts, ['HudMenuAplt_00']);
  assert.deepEqual(hud.animations, ['HudMenuAplt_00_SceneIn', 'HudMenuAplt_00_Bat', 'HudMenuAplt_00_NetMode', 'HudMenuAplt_00_NetAtn']);
  assert.ok(view.packs.some(pack => pack.alias === 'notes-hud-messages'));
});

test('published Notes HUD, messages and font retain their original content identity', () => {
  const title = manifest.titles['0004003000009c02'];
  assert.equal(title.version, 4096);
  assert.equal(hud.contentIndex, 0); assert.equal(hud.contentId, '00000007');
  assert.equal(hud.resourceSources.layouts.HudMenuAplt_00.sha256, 'e1d77863cf0a5f0892649fc4dd94e416295625e3abe78b7fa285e333ed3c4dd8');
  assert.equal(hud.resourceSources.animations.HudMenuAplt_00_SceneIn.sha256, '6d3aa8c1ba80080d766eafeaf5d13964c80b235f5682c7c4bd914996a6a238de');
  assert.equal(messages.resourceSources.messages.hud.path, 'lang/EU_English/hud.msbt');
  assert.equal(messages.resourceSources.messages.hud.sha256, '3f9f2ae497bcf9c79de2584c1d4dc99a8727211834ab6728086761217aa44451');
  assert.deepEqual(hud.layouts.HudMenuAplt_00.fonts, ['cbf_std.bcfnt', 'Hud.bcfnt']);
  const font = title.fonts['contents/0000-00000007/Hud.bcfnt'];
  assert.equal(font, 'fonts/game-notes/contents/0000-00000007/Hud/font.json');
  assert.equal(title.fonts['Hud.bcfnt'], font);
  assert.equal(manifest.resources[font].sources[0].path, 'lang/Hud.bcfnt');
  assert.equal(manifest.resources[font].sources[0].sha256, '172b12ad40f2feb04d4422ec67dead3b579a4706ca2a6413f652e1f7de026bb8');
  assert.equal(manifest.resources[hudPath].conversion.version, '1.5.4');
  assert.deepEqual(hud.unsupported, []); assert.deepEqual(messages.unsupported, []);
});

test('original message substitutions and controller groups preserve HUD geometry and source colors', () => {
  const original = JSON.stringify(hud), date = new Date(2026, 8, 22, 20, 18, 1);
  const options = tools.notesHudPaintOptions(messages, date);
  assert.deepEqual(options.bindings, [
    { name: 'HudMenuAplt_00_SceneIn', frame: 20 },
    { name: 'HudMenuAplt_00_NetMode', frame: 0 },
    { name: 'HudMenuAplt_00_NetAtn', frame: 3 },
    { name: 'HudMenuAplt_00_Bat', frame: 4 },
  ]);
  const posed = poseNativeLayout(hud.layouts.HudMenuAplt_00, hud.animations, options.bindings, options.overrides);
  assert.equal(pane(posed, 'T_NetMode_00').text.value, 'Internet');
  assert.equal(pane(posed, 'T_Date_00').text.value, '22/09 (Tue)');
  assert.equal(pane(posed, 'T_TimeL_00').text.value, '20');
  assert.equal(pane(posed, 'T_TimeR_00').text.value, '18');
  assert.equal(pane(posed, 'T_TimeC_00').flags & 1, 0);
  for (const name of ['T_Date_00', 'T_TimeL_00', 'T_TimeR_00']) {
    const before = pane(hud.layouts.HudMenuAplt_00, name), after = pane(posed, name);
    for (const key of ['translation', 'size', 'scale', 'alpha']) assert.deepEqual(after[key], before[key]);
    assert.equal(after.text.font, before.text.font);
    assert.deepEqual(after.text.size, before.text.size);
  }
  assert.equal(pane(posed, 'N_Scene_00').alpha, 255);
  assert.equal(JSON.stringify(hud), original);
});

test('clock identity tracks only visible calendar and original charging/colon poses', () => {
  const even = new Date(2026, 8, 22, 9, 8, 0), odd = new Date(2026, 8, 22, 9, 8, 1);
  assert.equal(tools.notesHudClock(even).batteryFrame, 5);
  assert.equal(tools.notesHudClock(even).colonVisible, true);
  assert.equal(tools.notesHudClock(odd).batteryFrame, 4);
  assert.equal(tools.notesHudClock(odd).colonVisible, false);
  assert.deepEqual(tools.notesHudClock(even), tools.notesHudClock(new Date(2026, 8, 22, 9, 8, 2, 900)));
  assert.notDeepEqual(tools.notesHudClock(even), tools.notesHudClock(new Date(2027, 8, 22, 9, 8, 0)));
  assert.equal(tools.notesHudPaintOptions(messages, even).overrides.T_TimeL_00.text, '09');
});

test('selected HUD message loss and an unsupported calendar format fail without placeholders', () => {
  const date = new Date(2026, 8, 22);
  for (const label of ['lau_date', 'lau_hours', 'lau_minutes', 'day_22', 'month_9', 'week_tue', 'lau_connect0']) {
    const missing = structuredClone(messages); delete missing.messages.hud.labels[label];
    assert.throws(() => tools.notesHudPaintOptions(missing, date), /Missing native Notes HUD message/);
  }
  const malformed = structuredClone(messages);
  malformed.messages.hud.messages[malformed.messages.hud.labels.lau_date].text = 'native placeholder';
  assert.throws(() => tools.notesHudPaintOptions(malformed, date), /Unsupported native Notes HUD calendar format/);
});

test('a failed own-HUD draw fails the pair while independent covers and capture selection stay unchanged', () => {
  const top = {}, bottom = {}, calls = [];
  const image = json('packs/game-notes/memo-ImageScreenUp-arc-l.json');
  const renderer = { packs: { 'notes-hud-messages': messages, 'notes-image': image, 'notes-messages': json('packs/game-notes/messages-and-loose.json') },
    draw(ctx, alias) { calls.push([ctx, alias]); return alias !== 'notes-hud'; },
    drawLayout(ctx, alias) { calls.push([ctx, alias]); return true; } };
  const intro = { status: 'boot-cover', owner: 'notes:1', steps: 8, ticket: 1, upper: {}, lower: {}, scene9Draw: true, scene10Draw: true };
  const original = JSON.stringify(intro);
  assert.equal(tools.drawNativePersonalToolFrame(renderer, top, bottom, { appId: 'game-notes', screen: 'main', rows: [], selection: 0 },
    { notesIntro: intro, suspendedCapture: { status: 'none' }, date: new Date(2026, 8, 22) }), false);
  assert.deepEqual(calls.filter(([ctx]) => ctx === top).map(([, alias]) => alias), ['notes-upper', 'notes-image', 'notes-hud', 'notes-aplt-u']);
  assert.deepEqual(calls.filter(([ctx]) => ctx === bottom).map(([, alias]) => alias), ['notes-lower', 'notes-list', 'notes-aplt-d']);
  assert.equal(JSON.stringify(intro), original);
});
