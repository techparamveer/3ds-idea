import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createNotesPanelScheduler } from '../src/os/notes-panel-scheduler.ts';

const owner = { notesOwner: 'notes-1', applicationOwner: 'camera-1', captureGeneration: 7, titleId: '0004001000022400' };
function context(overrides = {}) {
  const identity = { ...owner, ...overrides };
  return { owner: identity, assetsReady: true, paused: false, startup: 'nonzero-history', metadata: {
    ...identity, status: 'ready', metadata: { selection: { titleId: identity.titleId }, icon: { width: 64, height: 64, data: new Uint8ClampedArray(16384) } },
    capture: { status: 'ready', owner: identity.applicationOwner, generation: identity.captureGeneration },
  } };
}
function fixture() { const scheduler = createNotesPanelScheduler(), ctx = context(); const { ticket } = scheduler.sync(ctx); return { scheduler, ctx, ticket, step: command => scheduler.step(ticket, command) }; }
const run = (f, count) => { let result; for (let i = 0; i < count; i++) result = f.step(); return result; };

test('source packs retain exact nonloop controller lengths; no 30-frame title clipping', () => {
  const pack = JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/game-notes/memo-ImageScreenUp-arc-l.json', import.meta.url)));
  for (const [name, frames] of [['TextPanelInOut',21], ['TextPanelStay',121], ['SwitchDouble',26], ['SwitchUp',26], ['SwitchDown',26], ['HudDoubleInOut',21], ['HudUpInOut',21], ['HudDownInOut',21]]) {
    assert.equal(pack.animations['ImageScreenUp_' + name].frames, frames);
    assert.equal(pack.animations['ImageScreenUp_' + name].loop, false);
  }
});

test('metadata and asset barrier consumes no source steps; initial event precedes first advance', () => {
  const s = createNotesPanelScheduler(), c = context(), ready = c.metadata;
  c.metadata = { ...owner, status: 'loading' };
  const pending = s.sync(c); assert.equal(pending.status, 'waiting');
  assert.equal(s.step(pending.ticket, 'open'), undefined);
  c.metadata = ready; c.assetsReady = false; assert.equal(s.sync(c).status, 'waiting');
  c.assetsReady = true; const started = s.sync(c);
  assert.equal(started.observation.steps, 0); assert.equal(started.observation.title[0].frame, 0);
  assert.equal(s.step(pending.ticket, 'open'), undefined);
  assert.equal(s.step(started.ticket).afterScene3.title[0].frame, 1);
});

test('title checks completion before advancing: 20 in, 120 stay, reverse from 30', () => {
  const f = fixture();
  let pose = run(f, 20).afterScene3;
  assert.equal(pose.phase, 0); assert.equal(pose.title[0].frame, 20);
  pose = f.step().afterScene3; assert.equal(pose.phase, 1); assert.equal(pose.title[1].frame, 1);
  pose = run(f, 119).afterScene3; assert.equal(pose.phase, 1); assert.equal(pose.title[1].frame, 120);
  pose = f.step().afterScene3; assert.equal(pose.phase, 2); assert.equal(pose.title[0].frame, 29);
  pose = run(f, 29).afterScene3; assert.equal(pose.phase, 2); assert.equal(pose.title[0].frame, 0);
  pose = f.step().afterScene3; assert.equal(pose.phase, -1); assert.equal(pose.title[0].frame, 0);
});

test('Open event9 is after scene3; Back event8 is before scene3; neither restarts title', () => {
  const f = fixture(); run(f, 5);
  const open = f.step('open');
  assert.equal(open.afterScene3.hud[3].enabled, false);
  assert.equal(open.afterList.hud[3].frame, 0); assert.equal(open.afterList.hud[3].enabled, true);
  assert.equal(open.afterList.title[0].frame, 6);
  assert.equal(f.step().afterScene3.hud[3].frame, 1);
  const back = f.step('return');
  assert.equal(back.beforeScene3.hud[3].frame, 20); assert.equal(back.afterScene3.hud[3].frame, 19);
  assert.equal(back.afterScene3.title[0].frame, 8);
});

for (const [steps, expectedFrame, expectedPhase] of [[5,6,0], [21,20,1], [141,29,1], [158,13,0], [171,1,0]]) {
  test(`switch retrigger at source step ${steps} preserves busy InOut frame or resets idle`, () => {
    const f = fixture(); run(f, steps); const changed = f.step('switch');
    // At frame 29, forward is already not busy: the same update selects Stay,
    // retaining disabled InOut frame 29 instead of clamping it to frame 20.
    assert.equal(changed.afterScene3.title[0].frame, expectedFrame);
    assert.equal(changed.afterScene3.phase, expectedPhase);
    assert.equal(changed.afterScene3.title[0].reverse, false);
    assert.equal(changed.afterScene3.hud[1].frame, 1);
  });
}

test('switch completion is observed on the pass after frame25; modes select matching HUD', () => {
  const f = fixture(); f.step('switch');
  assert.equal(run(f, 24).switchCompleted, false);
  assert.equal(f.step().switchCompleted, true);
  assert.equal(f.step().switchCompleted, false);
  let opened = f.step('open'); assert.equal(opened.afterList.hud[4].enabled, true);
  f.step('switch'); opened = f.step('open'); assert.equal(opened.afterList.hud[5].enabled, true);
  f.step('switch'); opened = f.step('open'); assert.equal(opened.afterList.hud[3].enabled, true);
});

test('sleep and temporary asset loss freeze same epoch; no queued command replays on wake', () => {
  const f = fixture(); run(f, 8); const before = f.scheduler.getState();
  f.ctx.paused = true; f.scheduler.sync(f.ctx); assert.equal(f.step('open'), undefined);
  f.ctx.paused = false; f.ctx.assetsReady = false; f.scheduler.sync(f.ctx); assert.equal(f.step('return'), undefined);
  f.ctx.assetsReady = true; const awake = f.scheduler.sync(f.ctx);
  assert.equal(awake.ticket, before.ticket); assert.deepEqual(awake.observation, before.observation);
  const after = f.step(); assert.equal(after.afterList.hud[3].enabled, false); assert.equal(after.afterList.title[0].frame, 9);
});

for (const change of [{ notesOwner: 'notes-2' }, { applicationOwner: 'camera-2' }, { captureGeneration: 8 }, { titleId: '0004001000022300' }]) {
  test(`retired command ticket cannot affect replacement ${Object.keys(change)[0]}`, () => {
    const f = fixture(); run(f, 9); const replacement = f.scheduler.sync(context(change));
    assert.notEqual(replacement.ticket, f.ticket); assert.equal(f.step('open'), undefined);
    assert.equal(replacement.observation.steps, 0);
    assert.equal(f.scheduler.step(replacement.ticket).afterScene3.title[0].frame, 1);
  });
}

test('metadata mismatch, wrong capture, unsupported entry and disposed resources cannot start', () => {
  for (const mutate of [c => c.metadata.capture.owner = 'other', c => c.metadata.capture.generation++, c => c.metadata.notesOwner = 'other', c => c.metadata.metadata.selection.titleId = 'other', c => c.metadata.metadata.icon.data = new Uint8ClampedArray(), c => c.owner.captureGeneration = NaN]) {
    const s = createNotesPanelScheduler(), c = context(); mutate(c);
    const state = s.sync(c); assert.equal(state.status, 'waiting'); assert.equal(s.step(state.ticket), undefined);
  }
  const f = fixture(); f.ctx.startup = 'zero-history'; assert.equal(f.scheduler.sync(f.ctx).status, 'unsupported-startup'); assert.equal(f.step(), undefined);
  const g = fixture(); g.ctx.metadata.metadata.icon.data = new Uint8ClampedArray(); assert.equal(g.step(), undefined); assert.equal(g.scheduler.getState().observation, undefined);
});

test('resource replacement invalidates ticket; snapshots immutable; dispose cannot restart', () => {
  const f = fixture(), observation = f.step().afterScene3;
  assert.throws(() => { observation.title[0].frame = 99; }, TypeError);
  const changed = f.scheduler.sync(context()); assert.notEqual(changed.ticket, f.ticket); assert.equal(f.step(), undefined);
  f.scheduler.dispose(); assert.equal(f.scheduler.sync(context()).status, 'disposed'); assert.equal(f.scheduler.step(changed.ticket), undefined);
});
