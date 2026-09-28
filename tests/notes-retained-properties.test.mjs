import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { poseNativeLayout, boundAnimationTracks } from '../src/os/native-layout.ts';
import { createNotesPanelScheduler } from '../src/os/notes-panel-scheduler.ts';

const pack = JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/game-notes/memo-ImageScreenUp-arc-l.json', import.meta.url)));
const layout = pack.layouts.ImageScreenUp;
const binding = (clip, frame) => ({ name: 'ImageScreenUp_' + clip, frame, groups: [clip.startsWith('Text') ? 'G_Panel_01' : 'G_Panel_00'], childBinding: false });
const apply = (previous, ...bindings) => poseNativeLayout(previous, pack.animations, bindings);
const find = (layout, name) => {
  const visit = panes => { for (const p of panes) { if (p.name === name) return p; const child = visit(p.children); if (child) return child; } };
  return visit(layout.roots);
};

test('disabled capture tracks retain last applied geometry while independent title advances', () => {
  const before = JSON.stringify(layout);
  const captured = apply(layout, binding('HudDoubleInOut', 19));
  const titleOnly = apply(captured, binding('TextPanelInOut', 10));
  assert.deepEqual(find(titleOnly, 'P_ScreenDown'), find(captured, 'P_ScreenDown'));
  assert.notDeepEqual(find(titleOnly, 'P_ScreenDown'), find(apply(layout, binding('TextPanelInOut', 10)), 'P_ScreenDown'), 'restarting from the resource loses retained HUD geometry');
  assert.equal(JSON.stringify(layout), before, 'shared source remains immutable');
});

test('disabled title material tracks retain sampled indicator alpha during HUD-only application', () => {
  const stay = apply(layout, binding('TextPanelStay', 80));
  const material = state => state.materials.find(m => m.name === 'P_ObjIcnUp00');
  assert.notDeepEqual(material(stay), material(layout));
  const hud = apply(stay, binding('HudDoubleInOut', 10));
  assert.deepEqual(material(hud), material(stay));
  assert.notDeepEqual(material(hud), material(apply(layout, binding('HudDoubleInOut', 10))));
  assert.equal(boundAnimationTracks(layout, { ...pack.animations.ImageScreenUp_HudDoubleInOut, groups: ['G_Panel_00'], childBinding: false }).filter(t => t.binding === 'material').length, 0);
});

test('a later enabled title clip overwrites retained material channels at its sampled value', () => {
  const stay = apply(layout, binding('TextPanelStay', 80));
  const resumed = apply(stay, binding('TextPanelInOut', 10));
  const fresh = apply(layout, binding('TextPanelInOut', 10));
  for (const name of ['P_ObjIcnUp00', 'P_ObjIcnDown00']) {
    assert.deepEqual(resumed.materials.find(m => m.name === name), fresh.materials.find(m => m.name === name));
  }
});

test('late Open reset must not replace the applied HUD until a later scene3 update', () => {
  const scheduler = createNotesPanelScheduler();
  const owner = { notesOwner: 'notes', applicationOwner: 'camera', captureGeneration: 1, titleId: '0004001000022400' };
  const { ticket } = scheduler.sync({ owner, assetsReady: true, paused: false, startup: 'nonzero-history', metadata: {
    ...owner, status: 'ready', capture: { status: 'ready', owner: owner.applicationOwner, generation: 1 },
    metadata: { selection: { titleId: owner.titleId }, icon: { width: 64, height: 64, data: new Uint8ClampedArray(16384) } },
  } });
  // Explicit specimen seed, not a claim about native scene initialization.
  const seeded = apply(layout, binding('HudDoubleInOut', 19));
  const open = scheduler.step(ticket, 'open');
  assert.equal(open.afterScene3.hud[3].enabled, false);
  assert.equal(open.afterList.hud[3].frame, 0);
  const published = apply(seeded, binding('TextPanelInOut', open.afterScene3.title[0].frame));
  assert.deepEqual(find(published, 'P_ScreenDown'), find(seeded, 'P_ScreenDown'));
  const incorrectlyLate = apply(published, binding('HudDoubleInOut', open.afterList.hud[3].frame));
  assert.notDeepEqual(find(incorrectlyLate, 'P_ScreenDown'), find(published, 'P_ScreenDown'));
  const next = scheduler.step(ticket);
  assert.equal(next.afterScene3.hud[3].frame, 1);
  const nextPublished = apply(published, binding('HudDoubleInOut', next.afterScene3.hud[3].frame));
  assert.notDeepEqual(find(nextPublished, 'P_ScreenDown'), find(published, 'P_ScreenDown'));
});
