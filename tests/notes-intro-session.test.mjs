import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createNotesIntroSession } from '../src/os/notes-intro-session.ts';
import { notesIntroPaneSnapshot, notesIntroSourcesFromPacks } from '../src/os/notes-intro-publication.ts';
import { NOTES_INTRO_UPDATE_MS } from '../src/os/notes-intro-clock.ts';
import { createStockModule, initialSharedData } from '../src/os/stock-apps.ts';
import { getTitle } from '../src/os/app-registry.ts';

const root = new URL('../public/os/firmware/10.7.0-32E/packs/game-notes/', import.meta.url);
const titlePack = JSON.parse(readFileSync(new URL('memo-ImageScreenUp-arc-l.json', root)));
const upperPack = JSON.parse(readFileSync(new URL('memo-ApltBoot_U_00-arc-l.json', root)));
const lowerPack = JSON.parse(readFileSync(new URL('memo-ApltBoot_D_00-arc-l.json', root)));
const sources = notesIntroSourcesFromPacks({ 'notes-image': titlePack, 'notes-aplt-u': upperPack, 'notes-aplt-d': lowerPack });
const owner = { notesOwner: 'notes-1', applicationOwner: 'camera-1', captureGeneration: 7, titleId: '0004001000022400' };
const metadata = {
  ...owner, status: 'ready',
  metadata: { selection: { titleId: owner.titleId, description: 'Nintendo 3DS Camera' }, icon: { width: 64, height: 64, data: new Uint8ClampedArray(16384) } },
  capture: { status: 'ready', owner: owner.applicationOwner, generation: owner.captureGeneration },
};
const artifactDir = process.env.FIRMWARE_ARTIFACT_ROOT
  ? `${process.env.FIRMWARE_ARTIFACT_ROOT}/notes-intro-publication`
  : '/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/notes-intro-publication';
function input(overrides = {}) {
  return {
    owner, metadata, assetsReady: true, paused: false, startup: 'nonzero-history',
    now: 0, screen: 'main', sources, ...overrides,
  };
}

test('first ready sample arms the clock; 21 host updates reveal the title under ApltBoot', () => {
  const session = createNotesIntroSession();
  let state = session.sync(input({ now: 0 }));
  assert.equal(state.status, 'ready');
  assert.equal(state.clock.updateCount, 0);
  assert.equal(session.compose(sources), undefined);
  state = session.sync(input({ now: NOTES_INTRO_UPDATE_MS }));
  assert.equal(state.clock.updateCount, 1);
  assert.equal(session.compose(sources).titleUserVisible, false);
  assert.equal(session.compose(sources).scene10Draw, true);
  state = session.sync(input({ now: 21 * NOTES_INTRO_UPDATE_MS }));
  assert.equal(state.clock.updateCount, 21);
  const visible = session.compose(sources);
  assert.equal(visible.titleUserVisible, true);
  assert.equal(visible.scene10Draw, false);
  assert.equal(notesIntroPaneSnapshot(visible).W_TextPanel.alpha, 255);
  session.dispose();
});

test('late metadata ready does not backfill download time; paint-equivalent same-now samples do not step', () => {
  const session = createNotesIntroSession();
  let state = session.sync(input({ now: 4000, assetsReady: false, metadata: { status: 'loading', ...owner } }));
  assert.equal(state.status, 'waiting');
  assert.equal(state.clock.updateCount, 0);
  state = session.sync(input({ now: 4000 }));
  assert.equal(state.clock.updateCount, 0);
  assert.equal(session.compose(sources), undefined);
  state = session.sync(input({ now: 4000 }));
  assert.equal(state.clock.updateCount, 0);
  state = session.sync(input({ now: 4000 + 21 * NOTES_INTRO_UPDATE_MS }));
  assert.equal(state.clock.updateCount, 21);
  assert.equal(session.compose(sources).titleUserVisible, true);
  session.dispose();
});

test('Open→Back follow screen ownership; return waits MemoDecide idle', () => {
  const session = createNotesIntroSession();
  session.sync(input({ now: 0 }));
  session.sync(input({ now: 21 * NOTES_INTRO_UPDATE_MS }));
  assert.equal(session.compose(sources).titleUserVisible, true);
  let state = session.sync(input({ now: 22 * NOTES_INTRO_UPDATE_MS, screen: 'drawing' }));
  assert.equal(state.observation.list.memoDecide.frame, 1);
  assert.equal(state.observation.list.openClocksIdle, false);
  state = session.sync(input({ now: 22 * NOTES_INTRO_UPDATE_MS, screen: 'main' }));
  assert.equal(state.pending[0], 'return');
  assert.equal(state.observation.list.memoReturnNote.enabled, false);
  state = session.sync(input({ now: 46 * NOTES_INTRO_UPDATE_MS, screen: 'main' }));
  assert.equal(state.observation.list.openClocksIdle, true);
  assert.ok(state.observation.list.memoReturnNote.enabled || state.observation.list.returnComplete);
  session.dispose();
});

test('new ticket consumes pre-ready screens on main and enqueues one already-accepted open on drawing', () => {
  const session = createNotesIntroSession();
  session.sync(input({ now: 0, assetsReady: false, screen: 'drawing' }));
  session.sync(input({ now: 0, assetsReady: false, screen: 'main' }));
  session.sync(input({ now: 0, screen: 'main' }));
  let state = session.sync(input({ now: NOTES_INTRO_UPDATE_MS, screen: 'main' }));
  assert.deepEqual([...state.pending], []);
  assert.equal(state.observation.list.memoDecide.enabled, false);
  const nextOwner = { ...owner, notesOwner: 'notes-2', captureGeneration: 8 };
  const nextMetadata = {
    ...nextOwner, status: 'ready',
    metadata: { selection: { titleId: nextOwner.titleId }, icon: { width: 64, height: 64, data: new Uint8ClampedArray(16384) } },
    capture: { status: 'ready', owner: nextOwner.applicationOwner, generation: nextOwner.captureGeneration },
  };
  session.sync(input({ owner: nextOwner, metadata: nextMetadata, now: 100, screen: 'drawing' }));
  state = session.sync(input({ owner: nextOwner, metadata: nextMetadata, now: 100 + NOTES_INTRO_UPDATE_MS, screen: 'drawing' }));
  assert.equal(state.observation.list.memoDecide.frame, 1);
  session.dispose();
});

test('stock Notes host clock stays out of saves and does not invent memo editing', () => {
  const context = { now: 0, shared: initialSharedData() };
  const module = createStockModule(getTitle('game-notes'));
  let state = module.create({}, null, context);
  state = module.reduce(state, { type: 'tick', elapsedMs: 50 }, context).state;
  assert.equal(state.notesHostMs, 50);
  assert.equal(module.view(state, context).data.notesHostMs, 50);
  state = module.reduce(state, { type: 'action', id: '3' }, context).state;
  assert.equal(state.screen, 'drawing');
  state = module.reduce(state, { type: 'command', command: 'back' }, context).state;
  assert.equal(state.screen, 'main');
  assert.deepEqual(module.save(state), {});
  const memo = createStockModule(getTitle('memo'));
  const opened = memo.reduce(memo.create({}, null, context), { type: 'action', id: '0' }, context).state;
  assert.equal(opened.notesHostMs, undefined);
});

test('source-render specimens record covered and first-visible poses from the owner-bound clock', () => {
  const session = createNotesIntroSession();
  session.sync(input({ now: 0 }));
  session.sync(input({ now: NOTES_INTRO_UPDATE_MS }));
  const covered = notesIntroPaneSnapshot(session.compose(sources));
  session.sync(input({ now: 21 * NOTES_INTRO_UPDATE_MS }));
  const visible = notesIntroPaneSnapshot(session.compose(sources));
  assert.equal(covered.titleUserVisible, false);
  assert.equal(covered.scene10Draw, true);
  assert.ok(covered.P_Bg_U_00.alpha > 0 && covered.P_Bg_U_00.alpha < 255);
  assert.equal(visible.titleUserVisible, true);
  assert.equal(visible.scene10Draw, false);
  assert.equal(visible.W_TextPanel.alpha, 255);
  assert.equal(visible.W_TextPanel.translation[1], -80);
  assert.equal(visible.P_Bg_U_00.alpha, 0);
  mkdirSync(artifactDir, { recursive: true });
  writeFileSync(`${artifactDir}/live-clock-first-covered-title-pose.json`, `${JSON.stringify({
    method: 'Owner-bound 60 Hz remainder clock plus published intro composer; pane snapshot only',
    startup: 'nonzero-history', updates: 1, ...covered,
  }, null, 2)}\n`);
  writeFileSync(`${artifactDir}/live-clock-first-visible-title-pose.json`, `${JSON.stringify({
    method: 'Owner-bound 60 Hz remainder clock plus published intro composer; pane snapshot only',
    startup: 'nonzero-history', updates: 21, ...visible,
  }, null, 2)}\n`);
  session.dispose();
});
