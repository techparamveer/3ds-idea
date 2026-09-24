import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createNotesIntroComposer, notesIntroSourcesFromPacks } from '../src/os/notes-intro-publication.ts';

const root = new URL('../public/os/firmware/10.7.0-32E/packs/game-notes/', import.meta.url);
const titlePack = JSON.parse(readFileSync(new URL('memo-ImageScreenUp-arc-l.json', root)));
const upperPack = JSON.parse(readFileSync(new URL('memo-ApltBoot_U_00-arc-l.json', root)));
const lowerPack = JSON.parse(readFileSync(new URL('memo-ApltBoot_D_00-arc-l.json', root)));
const owner = { notesOwner: 'notes-1', applicationOwner: 'camera-1', captureGeneration: 7, titleId: '0004001000022400' };
function context(overrides = {}) {
  const identity = { ...owner, ...overrides };
  return { owner: identity, assetsReady: true, paused: false, startup: 'nonzero-history', metadata: {
    ...identity, status: 'ready', metadata: { selection: { titleId: identity.titleId }, icon: { width: 64, height: 64, data: new Uint8ClampedArray(16384) } },
    capture: { status: 'ready', owner: identity.applicationOwner, generation: identity.captureGeneration },
  } };
}
function sources() {
  return {
    title: { layout: titlePack.layouts.ImageScreenUp, animations: titlePack.animations },
    upper: { layout: upperPack.layouts.ApltBoot_U_00, animations: upperPack.animations },
    lower: { layout: lowerPack.layouts.ApltBoot_D_00, animations: lowerPack.animations },
  };
}
function fixture() {
  const composer = createNotesIntroComposer(), ctx = context();
  const { ticket } = composer.sync(ctx);
  return { composer, ticket, ctx, sources: sources(),
    step: command => composer.step(ticket, command),
    compose: () => composer.compose(sources()) };
}
const find = (state, name) => {
  const visit = panes => { for (const p of panes) { if (p.name === name) return p; const child = visit(p.children); if (child) return child; } };
  return visit(state.roots);
};
const shown = pane => (pane.flags & 1) !== 0;

test('published ApltBoot archives keep original source identity and SceneIn clocks', () => {
  assert.equal(upperPack.sourceSha256, 'b5ce29b07a28ae27bd813c860bae25a5825a06d26aafdc727ee31c4129469e18');
  assert.equal(lowerPack.sourceSha256, '284c4d476528edbf732599f2066a8af8f573854042b469f1e112d3e19459d4e6');
  for (const [pack, name] of [[upperPack, 'ApltBoot_U_00_SceneIn'], [lowerPack, 'ApltBoot_D_00_SceneIn']]) {
    const clip = pack.animations[name];
    assert.equal(clip.frames, 21);
    assert.equal(clip.loop, false);
    assert.deepEqual(pack.unsupported, []);
  }
  const alpha = next => next(track => track.property === 'alpha' && track.target === 'P_Bg_U_00');
  const keys = alpha(fn => upperPack.animations.ApltBoot_U_00_SceneIn.tracks.find(fn).keys);
  assert.deepEqual(keys.map(k => [k.frame, k.value]), [[0, 255], [20, 0]]);
});

test('first scene3 title apply stays covered by scene-10 draw; SceneIn frame 1 is a fade, not a substitute pixel', () => {
  const before = [JSON.stringify(titlePack.layouts.ImageScreenUp), JSON.stringify(upperPack.layouts.ApltBoot_U_00)];
  const f = fixture();
  const first = f.step();
  assert.equal(first.afterScene3.title[0].frame, 1);
  assert.equal(first.scene10.draw, true);
  assert.equal(first.scene10.sceneIn.frame, 1);
  assert.equal(first.scene9.draw, true);
  const composed = f.compose();
  assert.equal(shown(find(composed.title, 'W_TextPanel')), true);
  assert.equal(composed.titleUserVisible, false, 'priority-0 ApltBoot_U still draws after scene 3');
  const fade = find(composed.upper, 'P_Bg_U_00').alpha;
  assert.ok(fade > 0 && fade < 255, fade);
  assert.equal(JSON.stringify(titlePack.layouts.ImageScreenUp), before[0]);
  assert.equal(JSON.stringify(upperPack.layouts.ApltBoot_U_00), before[1]);
});

test('first user-visible title is the pass that clears scene-10 draw after SceneIn last frame', () => {
  const f = fixture();
  let last;
  for (let i = 0; i < 20; i++) {
    last = f.step();
    assert.equal(last.scene10.draw, true, 'draw stays set while SceneIn is busy');
    assert.equal(f.compose().titleUserVisible, false);
  }
  assert.equal(last.scene10.sceneIn.frame, 20);
  const visible = f.step();
  assert.equal(visible.scene10.draw, false);
  assert.equal(visible.scene9.draw, false);
  assert.equal(visible.scene10.sceneIn.frame, 20);
  assert.equal(visible.afterScene3.title[0].enabled, false);
  assert.equal(visible.afterScene3.title[1].frame, 1, 'Stay starts on the same pass as intro disable');
  const composed = f.compose();
  assert.equal(composed.scene10Draw, false);
  assert.equal(composed.titleUserVisible, true);
  assert.equal(shown(find(composed.title, 'W_TextPanel')), true);
  assert.equal(find(composed.upper, 'P_Bg_U_00').alpha, 0);
  assert.equal(find(composed.lower, 'P_Bg_D_00').alpha, 0);
});

test('Open→Back waits MemoDecide then MemoReturn/SceneIn; Back does not restart the title', () => {
  const f = fixture();
  while (f.compose()?.titleUserVisible !== true) f.step();
  const opened = f.step('open');
  assert.equal(opened.afterScene3.hud[3].enabled, false, 'late event 9 does not sample HUD this pass');
  assert.equal(opened.list.memoDecide.frame, 1);
  assert.equal(opened.list.sceneOut.frame, 1);
  let pass = opened;
  while (!pass.list.openClocksIdle) pass = f.step();
  assert.equal(pass.list.memoDecide.frame, 24);
  assert.equal(pass.list.sceneOut.frame, 20);
  const stayAtOpen = pass.afterScene3.title[1].frame;
  const back = f.step('return');
  assert.equal(back.afterScene3.hud[3].frame, 19);
  assert.equal(back.list.memoReturnNote.frame, 1);
  assert.equal(back.list.returnFrame5Started, false);
  pass = back;
  while (!pass.list.returnFrame5Started) pass = f.step();
  assert.equal(pass.list.memoReturnNote.frame, 6);
  assert.equal(pass.list.sceneIn.frame, 1);
  while (!pass.list.returnComplete) pass = f.step();
  assert.equal(pass.list.memoReturnNote.frame, 20);
  assert.equal(pass.list.sceneIn.frame, 20);
  assert.equal(pass.list.memoReturnCursor.frame, 20);
  assert.equal(pass.afterScene3.title[1].enabled, true);
  assert.ok(pass.afterScene3.title[1].frame > stayAtOpen, 'Back continues Stay; it does not restart InOut');
  assert.equal(f.compose().titleUserVisible, true);
});

test('owner replacement reseeds title apply and restarts both intro draw flags', () => {
  const f = fixture();
  while (f.compose()?.titleUserVisible !== true) f.step();
  f.step('open'); f.step();
  const previous = f.compose();
  assert.notDeepEqual(find(previous.title, 'P_ScreenDown'), find(titlePack.layouts.ImageScreenUp, 'P_ScreenDown'));
  const replacement = f.composer.sync(context({ notesOwner: 'notes-2', captureGeneration: 8 }));
  assert.notEqual(replacement.ticket, f.ticket);
  const first = f.composer.step(replacement.ticket);
  assert.equal(first.scene10.draw, true);
  assert.equal(first.scene9.draw, true);
  assert.equal(first.afterScene3.title[0].frame, 1);
  const composed = f.composer.compose(f.sources);
  assert.equal(composed.titleUserVisible, false);
  assert.deepEqual(find(composed.title, 'P_ScreenDown'), find(titlePack.layouts.ImageScreenUp, 'P_ScreenDown'));
  assert.equal(shown(find(composed.title, 'W_TextPanel')), true);
});

test('late asset ready arms intro without inventing a manager pass', () => {
  const composer = createNotesIntroComposer(), ctx = context();
  ctx.assetsReady = false;
  const waiting = composer.sync(ctx);
  assert.equal(waiting.status, 'waiting');
  assert.equal(composer.step(waiting.ticket), undefined);
  ctx.assetsReady = true;
  const ready = composer.sync(ctx);
  const first = composer.step(ready.ticket);
  assert.equal(first.scene10.draw, true);
  assert.equal(first.scene10.sceneIn.frame, 1);
  assert.equal(composer.compose(sources()).titleUserVisible, false);
});

test('compose is idempotent for one observation; live packs require ApltBoot and title clips', () => {
  const f = fixture();
  f.step();
  const first = f.compose(), second = f.compose();
  assert.equal(first, second);
  assert.deepEqual(notesIntroSourcesFromPacks({
    'notes-image': titlePack, 'notes-aplt-u': upperPack, 'notes-aplt-d': lowerPack,
  })?.title.layout, titlePack.layouts.ImageScreenUp);
  assert.equal(notesIntroSourcesFromPacks({ 'notes-image': titlePack, 'notes-aplt-u': upperPack }), undefined);
});

test('live Notes painter samples a precomposed pose and does not import the composers', () => {
  const painter = readFileSync(new URL('../src/os/stock-native-personal-tools.ts', import.meta.url), 'utf8');
  const apps = readFileSync(new URL('../src/os/stock-apps.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(painter, /notes-intro-publication|createNotesIntroComposer|notes-intro-session|notes-panel-publication|createNotesPanelPublisher/);
  assert.doesNotMatch(apps, /notes-intro-publication|createNotesIntroComposer|notes-panel-publication|createNotesPanelPublisher/);
  assert.match(painter, /MemoTutorialUp/);
  assert.match(painter, /notesIntro|drawLayout/);
  assert.match(painter, /W_TextPanel:\{visible:false\}/);
});
