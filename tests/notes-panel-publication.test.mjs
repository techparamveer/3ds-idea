import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { poseNativeLayout } from '../src/os/native-layout.ts';
import { createNotesPanelScheduler } from '../src/os/notes-panel-scheduler.ts';
import { createNotesPanelPublisher } from '../src/os/notes-panel-publication.ts';

const pack = JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/game-notes/memo-ImageScreenUp-arc-l.json', import.meta.url)));
const layout = pack.layouts.ImageScreenUp;
const owner = { notesOwner: 'notes-1', applicationOwner: 'camera-1', captureGeneration: 7, titleId: '0004001000022400' };
function context(overrides = {}) {
  const identity = { ...owner, ...overrides };
  return { owner: identity, assetsReady: true, paused: false, startup: 'nonzero-history', metadata: {
    ...identity, status: 'ready', metadata: { selection: { titleId: identity.titleId }, icon: { width: 64, height: 64, data: new Uint8ClampedArray(16384) } },
    capture: { status: 'ready', owner: identity.applicationOwner, generation: identity.captureGeneration },
  } };
}
function fixture() {
  const scheduler = createNotesPanelScheduler(), publisher = createNotesPanelPublisher(), ctx = context();
  const { ticket } = scheduler.sync(ctx);
  return { scheduler, publisher, ticket, ctx,
    publish: observation => publisher.publish(ticket, observation, layout, pack.animations),
    step: command => scheduler.step(ticket, command) };
}
const find = (state, name) => {
  const visit = panes => { for (const p of panes) { if (p.name === name) return p; const child = visit(p.children); if (child) return child; } };
  return visit(state.roots);
};
const visible = pane => (pane.flags & 1) !== 0;
const titleOnly = (previous, observation) => poseNativeLayout(previous, pack.animations, observation.title.flatMap((slot, i) => slot.enabled
  ? [{ name: ['ImageScreenUp_TextPanelInOut', 'ImageScreenUp_TextPanelStay'][i], frame: slot.frame, groups: ['G_Panel_01'], childBinding: false }] : []));

test('resource defaults hide the title; event 0 does not sample; first scene3 apply uses InOut frame 1', () => {
  const before = JSON.stringify(layout);
  const panel = find(layout, 'W_TextPanel'), capture = find(layout, 'P_ScreenDown');
  assert.equal(visible(panel), false);
  assert.equal(panel.alpha, 0);
  assert.equal(panel.translation[1], -90);
  const f = fixture();
  const started = f.scheduler.getState().observation;
  assert.equal(started.title[0].frame, 0);
  assert.equal(started.title[0].enabled, true);
  const unsampled = f.publish(started);
  assert.equal(visible(find(unsampled, 'W_TextPanel')), false);
  assert.equal(find(unsampled, 'W_TextPanel').alpha, 0);
  assert.deepEqual(find(unsampled, 'P_ScreenDown'), capture);
  const first = f.step();
  assert.equal(first.afterScene3.title[0].frame, 1);
  const composed = f.publisher.publish(f.ticket, first.afterScene3, layout, pack.animations);
  const applied = find(composed, 'W_TextPanel');
  assert.equal(visible(applied), true);
  assert.ok(applied.alpha > 0 && applied.alpha < 255);
  assert.ok(applied.translation[1] > -90 && applied.translation[1] < -80);
  assert.deepEqual(find(composed, 'P_ScreenDown'), capture, 'HUD is not started at init; capture stays at resource defaults');
  assert.notDeepEqual(applied, panel);
  assert.equal(JSON.stringify(layout), before);
});

test('Open afterScene3 must not apply HUD; next scene3 samples HUD over retained title', () => {
  const f = fixture();
  let composed = f.publish(f.step().afterScene3);
  for (let i = 0; i < 4; i++) composed = f.publish(f.step().afterScene3);
  const capture = find(composed, 'P_ScreenDown');
  const open = f.step('open');
  assert.equal(open.afterScene3.hud[3].enabled, false);
  assert.equal(open.afterList.hud[3].frame, 0);
  const late = f.publish(open.afterScene3);
  assert.deepEqual(find(late, 'P_ScreenDown'), capture);
  assert.deepEqual(find(late, 'W_TextPanel'), find(titleOnly(composed, open.afterScene3), 'W_TextPanel'));
  const next = f.step();
  assert.equal(next.afterScene3.hud[3].frame, 1);
  const hud = f.publish(next.afterScene3);
  assert.notDeepEqual(find(hud, 'P_ScreenDown'), capture);
  assert.deepEqual(find(hud, 'W_TextPanel'), find(titleOnly(late, next.afterScene3), 'W_TextPanel'), 'HUD constructor group excludes G_Panel_01');
});

test('Back applies reverse HUD in the same scene3 pass; title is not restarted', () => {
  const f = fixture();
  f.publish(f.step().afterScene3);
  f.step('open');
  const openedStep = f.step();
  const opened = f.publish(openedStep.afterScene3);
  const capture = find(opened, 'P_ScreenDown');
  const back = f.step('return');
  assert.equal(back.beforeScene3.hud[3].frame, 20);
  assert.equal(back.afterScene3.hud[3].frame, 19);
  assert.equal(back.afterScene3.title[0].enabled, true);
  assert.equal(back.afterScene3.title[0].frame, openedStep.afterScene3.title[0].frame + 1, 'Back does not restart InOut');
  const returned = f.publish(back.afterScene3);
  assert.notDeepEqual(find(returned, 'P_ScreenDown'), capture);
  assert.deepEqual(find(returned, 'W_TextPanel'), find(titleOnly(opened, back.afterScene3), 'W_TextPanel'), 'HUD reverse keeps the independent title pose');
});

test('live Notes painter does not import the applied-layout publisher', () => {
  const painter = readFileSync(new URL('../src/os/stock-native-personal-tools.ts', import.meta.url), 'utf8');
  const apps = readFileSync(new URL('../src/os/stock-apps.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(painter, /notes-panel-publication|createNotesPanelPublisher/);
  assert.doesNotMatch(apps, /notes-panel-publication|createNotesPanelPublisher/);
  assert.match(painter, /MemoTutorialUp/);
  assert.match(painter, /W_TextPanel:\{visible:false\}/);
});

test('owner replacement discards retained HUD and reseeds the first title apply', () => {
  const f = fixture();
  f.publish(f.step().afterScene3);
  f.step('open');
  const previous = f.publish(f.step().afterScene3);
  assert.notDeepEqual(find(previous, 'P_ScreenDown'), find(layout, 'P_ScreenDown'));
  const replacement = f.scheduler.sync(context({ notesOwner: 'notes-2', captureGeneration: 8 }));
  assert.notEqual(replacement.ticket, f.ticket);
  const first = f.scheduler.step(replacement.ticket);
  assert.equal(first.afterScene3.title[0].frame, 1);
  const composed = f.publisher.publish(replacement.ticket, first.afterScene3, layout, pack.animations);
  assert.deepEqual(find(composed, 'P_ScreenDown'), find(layout, 'P_ScreenDown'), 'previous owner HUD cannot remain');
  assert.equal(visible(find(composed, 'W_TextPanel')), true);
});
