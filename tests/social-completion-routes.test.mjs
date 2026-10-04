import test from 'node:test';
import assert from 'node:assert/strict';
import { createStockModule, initialSharedData, sourceNotificationProfile } from '../src/os/stock-apps.ts';
import { getTitle } from '../src/os/app-registry.ts';
import { createSuspendedApplicationCapture } from '../src/os/notes-suspended-capture.ts';
import { stockScreenTargets } from '../src/os/stock-screen-layout.ts';
import { createPortfolioState, invokeSystemApplet, launch, reduceSystem, tickSystem } from '../src/os/system.ts';

const moduleFor = id => createStockModule(getTitle(id));
const context = shared => ({ now: 0, shared });
const command = (module, state, name, ctx) => module.reduce(state, { type: 'command', command: name }, ctx);
const action = (module, state, id, ctx) => module.reduce(state, { type: 'action', id }, ctx);

function frame(width, height, marker) {
  const data = new Uint8ClampedArray(width * height * 4);
  data.set([marker, marker + 1, marker + 2, 255]);
  return { width, height, data };
}

function createSurface(width, height) {
  let data = new Uint8ClampedArray(width * height * 4);
  const ctx = {
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    save() {}, resetTransform() {}, restore() {},
    drawImage(source) { data = new Uint8ClampedArray(source.data); },
    getImageData() { return { data }; },
  };
  return { width, height, getContext: type => type === '2d' ? ctx : null };
}

test('C-NOT grid/drawing/Back keeps the selected slot while suspended pixels stay application-owned', () => {
  const strokes = [{ color: 'blue', points: [[12, 20], [30, 42]] }];
  const shared = { ...initialSharedData(), notes: [{ slot: 6, strokes }] };
  const ctx = context(shared), module = moduleFor('game-notes');
  let state = module.create({}, null, ctx);

  for (const direction of ['right', 'down', 'right']) state = command(module, state, direction, ctx).state;
  assert.equal(state.selection, 6);
  state = command(module, state, 'open', ctx).state;
  assert.equal(state.screen, 'drawing');
  assert.equal(state.slot, 6);
  assert.deepEqual(module.view(state, ctx).data.strokes, strokes);
  const returned = command(module, state, 'back', ctx);
  assert.equal(returned.state.screen, 'main');
  assert.equal(returned.state.selection, 6);
  assert.deepEqual(returned.effects ?? [], []);

  const capture = createSuspendedApplicationCapture({ createSurface });
  let system = tickSystem(createPortfolioState(), 3001);
  system = tickSystem(launch(system, 'health-safety', 3010), 6200);
  const application = system.system.runtime.application;
  assert.ok(application);
  assert.equal(capture.record(system.system.runtime, application, frame(400, 240, 10), frame(320, 240, 20)), true);
  system = reduceSystem(system, 'home', 6300);
  system = invokeSystemApplet(system, 'game-notes', 6400);
  const notes = system.system.runtime.active;
  assert.notEqual(notes, application);
  const frozen = capture.read(system.system.runtime);
  assert.equal(frozen.status, 'ready');
  assert.equal(frozen.owner, application);
  assert.equal(capture.record(system.system.runtime, notes, frame(400, 240, 30), frame(320, 240, 40)), false);
  assert.equal(capture.read(system.system.runtime).generation, frozen.generation);
  capture.dispose();
});

test('C-FRD own profile returns locally and a populated friend row reaches the known detail gap', () => {
  const shared = {
    ...initialSharedData(),
    settings: { ...initialSharedData().settings, nickname: 'Ada' },
    friends: [{ id: 'friend-7', name: 'Lin' }],
  };
  const before = structuredClone(shared), ctx = context(shared), module = moduleFor('friends');
  const main = module.create({}, { message: 'Existing status', miiId: 'local-mii' }, ctx);
  assert.deepEqual(module.view(main, ctx).rows.map(row => row.id), ['profile', 'friend-7']);

  const profile = action(module, main, 'profile', ctx).state;
  assert.equal(profile.screen, 'profile');
  assert.equal(module.view(profile, ctx).data.settings.nickname, 'Ada');
  assert.equal(module.view(profile, ctx).data.message, 'Existing status');
  const profileBack = command(module, profile, 'back', ctx);
  assert.equal(profileBack.state.screen, 'main');
  assert.deepEqual(profileBack.effects ?? [], []);

  const friend = action(module, profileBack.state, 'friend-7', ctx).state;
  assert.equal(friend.screen, 'friend');
  assert.equal(friend.friendId, 'friend-7');
  // Do not assert generic detail pixels/text: the native friend-detail painter is a known gap.
  const friendBack = command(module, friend, 'back', ctx);
  assert.equal(friendBack.state.screen, 'main');
  assert.deepEqual(friendBack.effects ?? [], []);
  assert.deepEqual(shared, before);
});

test('C-NTF defaults are nine inert source rows while empty/custom fixtures retain navigation and Back', () => {
  const module = moduleFor('notifications');
  const defaults = initialSharedData(), defaultCtx = context(defaults);
  const defaultState = module.create({}, null, defaultCtx), defaultView = module.view(defaultState, defaultCtx);
  assert.deepEqual(defaults.notifications, sourceNotificationProfile);
  assert.equal(defaultView.rows.length, 9);
  assert.ok(defaultView.rows.every(row => row.disabled === true));
  assert.equal(defaultView.rows.filter(row => row.value === 'New').length, 8);
  assert.equal(defaultView.footer.right, undefined);
  assert.equal(action(module, defaultState, sourceNotificationProfile[0].id, defaultCtx).state, defaultState);

  const emptyCtx = context({ ...initialSharedData(), notifications: [] });
  const empty = module.create({}, null, emptyCtx), emptyView = module.view(empty, emptyCtx);
  assert.deepEqual(emptyView.rows, []);
  assert.deepEqual(emptyView.text, ['There are no notifications.']);

  const notifications = Array.from({ length: 9 }, (_, index) => ({
    id: `custom-${index}`, title: `Custom ${index}`, message: `Body ${index}`, read: index % 2 === 0,
  }));
  const shared = { ...initialSharedData(), notifications }, before = structuredClone(shared);
  const customCtx = context(shared);
  let state = module.create({}, null, customCtx);
  assert.ok(module.view(state, customCtx).rows.every(row => row.disabled !== true));
  for (let index = 0; index < 6; index++) state = command(module, state, 'down', customCtx).state;
  const scrolled = module.view(state, customCtx);
  assert.equal(scrolled.selection, 6);
  assert.equal(scrolled.data.selectionActive, true);
  assert.deepEqual(
    stockScreenTargets(scrolled).filter(target => target.action.startsWith('custom-')).map(target => target.action),
    ['custom-3', 'custom-4', 'custom-5', 'custom-6'],
  );
  // The untraced native thumb rule is intentionally outside this route contract.
  const detail = command(module, state, 'open', customCtx).state;
  assert.equal(detail.screen, 'notification');
  assert.equal(detail.notificationId, 'custom-6');
  assert.deepEqual(module.view(detail, customCtx).text, ['Body 6']);
  const detailBack = command(module, detail, 'back', customCtx);
  assert.equal(detailBack.state.screen, 'main');
  assert.deepEqual(detailBack.effects ?? [], []);
  assert.deepEqual(command(module, detailBack.state, 'back', customCtx).effects, [{ type: 'close' }]);
  assert.deepEqual(shared, before);
});
