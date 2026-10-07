import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { createNotesBootCoverSession, createNotesBootCoverPublicationGate, notesBootCoverSourcesFromPacks } from '../src/os/notes-boot-cover.ts';

const root = new URL('../public/os/firmware/10.7.0-32E/packs/game-notes/', import.meta.url);
const pack = name => JSON.parse(readFileSync(new URL(name, root)));
const packs = { 'notes-aplt-u': pack('memo-ApltBoot_U_00-arc-l.json'), 'notes-aplt-d': pack('memo-ApltBoot_D_00-arc-l.json') };
const sources = notesBootCoverSourcesFromPacks(packs);
const input = { owner: 'game-notes:1', now: 0, paused: false, reducedMotion: false, sources };
const publish = (session, sample) => { const pair = session.sync(sample); assert.equal(session.present(pair, sample.now), true); return pair; };
const finish = session => { let pair; for (let step = 0; step <= 21; step++) pair = publish(session, { ...input, now: step * 1000 / 60 }); return pair; };
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
  const session = createNotesBootCoverSession(); publish(session, input);
  const first = publish(session, { ...input, now: 1000 / 60 });
  assert.equal(first.steps, 1);
  assert.ok(pane(first.upper, 'P_Bg_U_00').alpha < 255);
  let terminal;
  for (let step = 2; step <= 20; step++) terminal = publish(session, { ...input, now: step * 1000 / 60 });
  assert.equal(terminal.steps, 20);
  assert.equal(terminal.scene9Draw, true);
  assert.equal(terminal.scene10Draw, true);
  assert.equal(pane(terminal.upper, 'P_Bg_U_00').alpha, 0);
  assert.equal(pane(terminal.lower, 'P_Bg_D_00').alpha, 0);
  const complete = publish(session, { ...input, now: 21 * 1000 / 60 });
  assert.equal(complete.scene9Draw, false);
  assert.equal(complete.scene10Draw, false);
  assert.equal(session.sync({ ...input, now: 2000 }), complete);
});

test('late resources and pause do not consume inactive elapsed time or replay the cover', () => {
  const session = createNotesBootCoverSession();
  assert.equal(session.sync({ ...input, sources: undefined }), undefined);
  assert.equal(publish(session, { ...input, now: 5000 }).steps, 0);
  const active = publish(session, { ...input, now: 5017 });
  assert.equal(active.steps, 1);
  assert.equal(session.sync({ ...input, paused: true, now: 6000 }), undefined);
  assert.equal(publish(session, { ...input, now: 10000 }), active);
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
  assert.equal(session.present(first, 0), false, 'a receipt for replaced source objects is stale');
  assert.equal(session.present(next, 0), true);
});

test('successful paired receipts bound progress and a main-thread stall cannot skip source poses', () => {
  const session = createNotesBootCoverSession(), initial = session.sync(input);
  assert.equal(session.sync({ ...input, now: 1000 }), initial, 'unpublished frame zero cannot expire');
  assert.equal(session.present(initial, 1000), true);
  const first = session.sync({ ...input, now: 2000 });
  assert.equal(first.steps, 1, 'stall catch-up is discarded after a single visible update');
  assert.equal(session.sync({ ...input, now: 3000 }), first, 'the next pair must succeed before another update');
  assert.equal(session.present(first, 3000), true);
  const second = publish(session, { ...input, now: 3017 });
  assert.equal(second.steps, 2);
  const afterStall = publish(session, { ...input, now: 4017 });
  assert.equal(afterStall.steps, 3);
  assert.equal(publish(session, { ...input, now: 4034 }).steps, 4, 'resumption does not retain the stalled remainder');
});

test('mid-cover hidden intervals rebase even if no render sample observes document.hidden', () => {
  const session = createNotesBootCoverSession();
  publish(session, input);
  const before = publish(session, { ...input, now: 17 });
  session.pause();
  assert.equal(session.present(before, 5000), false, 'a hidden late receipt cannot rearm the clock');
  assert.equal(publish(session, { ...input, now: 5000 }), before);
  assert.equal(publish(session, { ...input, now: 5017 }).steps, 2);
  assert.equal(session.sync({ ...input, now: 9000, paused: true }), undefined);
  assert.equal(publish(session, { ...input, now: 12000 }).steps, 2);
  assert.equal(publish(session, { ...input, now: 12017 }).steps, 3);
});

test('a delayed successful render receipt rebases the failed-publication interval', () => {
  const session = createNotesBootCoverSession();
  publish(session, input);
  const candidate = session.sync({ ...input, now: 17 });
  assert.equal(candidate.steps, 1);
  assert.equal(session.present(candidate, 1000), true);
  assert.equal(session.sync({ ...input, now: 1000 }), candidate, 'a late receipt cannot immediately spend failed-render time');
  assert.equal(publish(session, { ...input, now: 1017 }).steps, 2);
});

test('transition cadence remains active for every source pose and the unacknowledged terminal', () => {
  const session = createNotesBootCoverSession();
  assert.equal(session.pending(input.owner), true, 'a newly eligible owner needs its first pair');
  assert.equal(session.sync({ ...input, sources: undefined }), undefined);
  assert.equal(session.pending(input.owner), true, 'resource loading cannot retire the transition');
  for (let step = 0; step <= 20; step++) {
    publish(session, { ...input, now: step * 1000 / 60 });
    assert.equal(session.pending(input.owner), true, `source pose ${step} retains transition cadence`);
  }
  const terminal = session.sync({ ...input, now: 350 });
  assert.equal(terminal.steps, 21);
  assert.equal(session.pending(input.owner), true, 'Canvas terminal without valid render receipt remains pending');
  assert.equal(session.present(terminal, 350), true);
  assert.equal(session.pending(input.owner), false);
  session.pause();assert.equal(session.pending(input.owner), true, 'revocation requires a replacement valid render');
  publish(session, { ...input, now: 5000 });assert.equal(session.pending(input.owner), false);
  assert.equal(session.pending('game-notes:2'), true, 'a replacement owner has no completed receipt');
  session.dispose();assert.equal(session.pending(input.owner), false);
});

test('terminal readiness requires a matching owner/ticket receipt, not a sampled terminal', () => {
  const session = createNotesBootCoverSession(), gate = createNotesBootCoverPublicationGate();
  const first = session.sync(input), terminal = finish(session);
  gate.sync(input.owner, first);
  assert.equal(gate.present(input.owner, first), false);
  gate.sync(input.owner, terminal);
  assert.equal(gate.ready(), false);
  assert.equal(gate.present('game-notes:old', terminal), false);
  assert.equal(gate.present(input.owner, { ...terminal, ticket: terminal.ticket + 1 }), false);
  assert.equal(gate.present(input.owner, terminal), true);
  assert.equal(gate.ready(), true);
  const replacement = session.sync({ ...input, owner: 'game-notes:2' });
  gate.sync(replacement.owner, replacement);
  assert.equal(gate.ready(), false);
  assert.equal(gate.present(replacement.owner, terminal), false);
  assert.equal(session.present(terminal, 5000), false);
  gate.reset();gate.sync(replacement.owner, terminal);
  assert.equal(gate.ready(), false, 'a stale-owner cover must not bypass readiness');
});

const moduleSource = readFileSync(new URL('../src/os/stock-native-personal-tools.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(moduleSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  .replaceAll("'./native-layout'", JSON.stringify(new URL('../src/os/native-layout.ts', import.meta.url).href))
  .replaceAll("'./stock-screen-layout'", JSON.stringify(new URL('../src/os/stock-screen-layout.ts', import.meta.url).href))
  .replaceAll("'./device-status-profile'", JSON.stringify(new URL('../src/os/device-status-profile.ts', import.meta.url).href));
const { drawNativePersonalToolFrame } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
function paint(intro, capture = { status: 'none' }) {
  const top = {}, bottom = {}, calls = [];
  const renderer = { packs: { 'notes-messages': pack('messages-and-loose.json'), 'notes-image': pack('memo-ImageScreenUp-arc-l.json'), 'notes-hud-messages': pack('contents/0000-00000007/hud-messages.json') },
    draw(ctx, alias, layout, options) { calls.push({ ctx, alias, layout, options }); return true; },
    drawLayout(ctx, alias, layout, pose, options) { calls.push({ ctx, alias, layout, pose, options }); return true; } };
  assert.equal(drawNativePersonalToolFrame(renderer, top, bottom, { appId: 'game-notes', screen: 'main', selection: 0, rows: [] }, { notesIntro: intro, suspendedCapture: capture }), true);
  return { upper: calls.filter(call => call.ctx === top), lower: calls.filter(call => call.ctx === bottom) };
}

test('no-software entry draws the original list message beneath both source covers', () => {
  const session = createNotesBootCoverSession(), cover = session.sync(input);
  const first = paint(cover);
  assert.deepEqual(first.upper.map(call => call.alias), ['notes-upper', 'notes-image', 'notes-hud', 'notes-aplt-u']);
  assert.deepEqual(first.lower.map(call => call.alias), ['notes-lower', 'notes-list', 'notes-aplt-d']);
  assert.equal(first.upper.at(-1).pose, cover.upper);
  assert.equal(first.lower.at(-1).pose, cover.lower);
  assert.equal(first.lower.at(-1).options.overrides.T_Aplt_00.text, 'Game Notes');
  assert.equal(first.upper[1].options.overrides.T_TextList.text, 'There is no suspended software.');
  assert.equal(first.upper[1].options.overrides.P_Mask.alpha, 0);
  const terminal = finish(session);
  assert.deepEqual(paint(terminal).upper.map(call => call.alias), ['notes-upper', 'notes-image', 'notes-hud']);
  assert.deepEqual(paint(terminal).lower.map(call => call.alias), ['notes-lower', 'notes-list']);
});

test('application-present captures and missing metadata do not imply no suspended software', () => {
  const cover = createNotesBootCoverSession().sync(input);
  for (const capture of [{ status: 'missing', owner: 'camera:1' }, { status: 'ready', owner: 'camera:1', generation: 1 }]) {
    assert.deepEqual(paint(cover, capture).upper.map(call => call.alias), ['notes-upper', 'notes-help', 'notes-hud', 'notes-aplt-u']);
    assert.deepEqual(paint(undefined, capture).upper.map(call => call.alias), ['notes-upper', 'notes-help', 'notes-hud']);
    assert.deepEqual(paint({ status: 'pending' }, capture).upper.map(call => call.alias), ['notes-upper', 'notes-aplt-u']);
  }
  assert.deepEqual(paint(undefined).upper.map(call => call.alias), ['notes-upper', 'notes-help', 'notes-hud']);
});

test('metadata-ready title publication keeps its existing pose and hides the list message', () => {
  const title = pack('memo-ImageScreenUp-arc-l.json').layouts.ImageScreenUp;
  const cover = createNotesBootCoverSession().sync(input);
  const intro = { ...cover, status: 'posed', title, titleUserVisible: false, description: 'Camera' };
  const upper = paint(intro, { status: 'missing', owner: 'camera:1' }).upper;
  assert.deepEqual(upper.map(call => call.alias), ['notes-upper', 'notes-image', 'notes-hud', 'notes-aplt-u']);
  assert.equal(upper[1].pose, title);
  assert.equal(upper[1].options.overrides.T_TextList.visible, false);
  assert.equal(upper[1].options.overrides.T_TextTitle.text, 'Camera');
});
