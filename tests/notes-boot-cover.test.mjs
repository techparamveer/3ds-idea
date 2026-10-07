import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { createNotesBootCoverSession, notesBootCoverSourcesFromPacks } from '../src/os/notes-boot-cover.ts';

const root = new URL('../public/os/firmware/10.7.0-32E/packs/game-notes/', import.meta.url);
const pack = name => JSON.parse(readFileSync(new URL(name, root)));
const packs = { 'notes-aplt-u': pack('memo-ApltBoot_U_00-arc-l.json'), 'notes-aplt-d': pack('memo-ApltBoot_D_00-arc-l.json') };
const sources = notesBootCoverSourcesFromPacks(packs);
const input = { owner: 'game-notes:1', now: 0, paused: false, reducedMotion: false, sources };
const pane = (layout, name) => {
  const visit = panes => { for (const next of panes) { if (next.name === name) return next; const child = visit(next.children); if (child) return child; } };
  return visit(layout.roots);
};

test('the original boot packs are sufficient without title metadata or a capture', () => {
  assert.ok(sources);
  assert.equal(notesBootCoverSourcesFromPacks({ 'notes-aplt-u': packs['notes-aplt-u'] }), undefined);
  assert.equal(packs['notes-aplt-u'].resourceSources.animations.ApltBoot_U_00_SceneIn.sha256, 'd5e5dad524a7d074362ddc5de840dd64be715c021229c0fb8b0d1aa93d54d805');
  assert.equal(packs['notes-aplt-d'].resourceSources.animations.ApltBoot_D_00_SceneIn.sha256, 'f6fb9ecc5f19a6865edc4a49c5d6fe35ce2436ec4d3f901367abb8f2e7c3ef44');
  const before = JSON.stringify(packs), session = createNotesBootCoverSession();
  const first = session.sync(input);
  assert.equal(first.status, 'boot-cover');
  assert.equal(first.steps, 0);
  assert.equal(pane(first.upper, 'P_Bg_U_00').alpha, 255);
  assert.equal(pane(first.lower, 'P_Bg_D_00').alpha, 255);
  assert.equal(JSON.stringify(packs), before);
});

test('source SceneIn advances before draw and clears on the following completion update', () => {
  const session = createNotesBootCoverSession(); session.sync(input);
  const first = session.sync({ ...input, now: 1000 / 60 });
  assert.equal(first.steps, 1);
  assert.ok(pane(first.upper, 'P_Bg_U_00').alpha < 255);
  const terminal = session.sync({ ...input, now: 20 * 1000 / 60 });
  assert.equal(terminal.steps, 20);
  assert.equal(terminal.scene9Draw, true);
  assert.equal(terminal.scene10Draw, true);
  assert.equal(pane(terminal.upper, 'P_Bg_U_00').alpha, 0);
  assert.equal(pane(terminal.lower, 'P_Bg_D_00').alpha, 0);
  const complete = session.sync({ ...input, now: 21 * 1000 / 60 });
  assert.equal(complete.scene9Draw, false);
  assert.equal(complete.scene10Draw, false);
  assert.equal(session.sync({ ...input, now: 2000 }), complete);
});

test('late resources and pause do not consume inactive elapsed time or replay the cover', () => {
  const session = createNotesBootCoverSession();
  assert.equal(session.sync({ ...input, sources: undefined }), undefined);
  assert.equal(session.sync({ ...input, now: 5000 }).steps, 0);
  const active = session.sync({ ...input, now: 5017 });
  assert.equal(active.steps, 1);
  assert.equal(session.sync({ ...input, paused: true, now: 6000 }), undefined);
  assert.equal(session.sync({ ...input, now: 10000 }), active);
  assert.equal(session.sync({ ...input, now: 10017 }).steps, 2);
  const replacement = session.sync({ ...input, owner: 'game-notes:2', now: 10018 });
  assert.equal(replacement.steps, 0);
  assert.ok(replacement.ticket > active.ticket);
  assert.equal(session.sync({ ...input, owner: null, now: 10019 }), undefined);
  session.dispose();
  assert.equal(session.sync(input), undefined);
});

test('reduced motion selects the source terminal without changing its pixels', () => {
  const session = createNotesBootCoverSession();
  const complete = session.sync({ ...input, reducedMotion: true });
  assert.equal(complete.steps, 21);
  assert.equal(complete.scene9Draw, false);
  assert.equal(complete.scene10Draw, false);
  assert.equal(pane(complete.upper, 'P_Bg_U_00').alpha, 0);
});

test('a replacement pack reposes the same source update without retaining its old layout', () => {
  const session = createNotesBootCoverSession(), first = session.sync(input);
  const replacement = notesBootCoverSourcesFromPacks(structuredClone(packs));
  const next = session.sync({ ...input, sources: replacement });
  assert.equal(next.steps, first.steps);
  assert.equal(next.ticket, first.ticket);
  assert.notEqual(next.upper, first.upper);
  assert.deepEqual(next.upper, first.upper);
});

const moduleSource = readFileSync(new URL('../src/os/stock-native-personal-tools.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(moduleSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  .replaceAll("'./native-layout'", JSON.stringify(new URL('../src/os/native-layout.ts', import.meta.url).href))
  .replaceAll("'./stock-screen-layout'", JSON.stringify(new URL('../src/os/stock-screen-layout.ts', import.meta.url).href))
  .replaceAll("'./device-status-profile'", JSON.stringify(new URL('../src/os/device-status-profile.ts', import.meta.url).href));
const { drawNativePersonalToolFrame } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
function paint(intro) {
  const top = {}, bottom = {}, calls = [];
  const renderer = { packs: { 'notes-messages': pack('messages-and-loose.json') },
    draw(ctx, alias, layout, options) { calls.push({ ctx, alias, layout, options }); return true; },
    drawLayout(ctx, alias, layout, pose, options) { calls.push({ ctx, alias, layout, pose, options }); return true; } };
  assert.equal(drawNativePersonalToolFrame(renderer, top, bottom, { appId: 'game-notes', screen: 'main', selection: 0, rows: [] }, { notesIntro: intro }), true);
  return { upper: calls.filter(call => call.ctx === top), lower: calls.filter(call => call.ctx === bottom) };
}

test('metadata-free entry draws the original covers last on each LCD and preserves the tutorial', () => {
  const session = createNotesBootCoverSession(), cover = session.sync(input);
  const first = paint(cover);
  assert.deepEqual(first.upper.map(call => call.alias), ['notes-upper', 'notes-help', 'notes-aplt-u']);
  assert.deepEqual(first.lower.map(call => call.alias), ['notes-lower', 'notes-list', 'notes-aplt-d']);
  assert.equal(first.upper.at(-1).pose, cover.upper);
  assert.equal(first.lower.at(-1).pose, cover.lower);
  assert.equal(first.lower.at(-1).options.overrides.T_Aplt_00.text, 'Game Notes');
  assert.deepEqual(paint(session.sync({ ...input, now: 350 })).upper.map(call => call.alias), ['notes-upper', 'notes-help']);
  assert.deepEqual(paint(session.sync({ ...input, now: 350 })).lower.map(call => call.alias), ['notes-lower', 'notes-list']);
});
