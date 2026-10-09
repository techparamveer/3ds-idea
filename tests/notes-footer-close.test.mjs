import test from 'node:test';
import assert from 'node:assert/strict';
import { createPortfolioState, tickSystem, invokeSystemApplet, launchHomeShortcut, touchSystem, dispatchSystemEvent, reduceSystem, completeNotesFooterClose } from '../src/os/system.ts';
import { createNotesFooterClosePresentation, notesFooterCloseIdentity, notesFooterCloseEligible } from '../src/os/notes-footer-close.ts';

const open = () => invokeSystemApplet(tickSystem(createPortfolioState(), 3001), 'game-notes', 4000);
const close = state => touchSystem(state, 160, 226, 4100);
const ms = step => 5000 + step * 1000 / 60 + .01;
const requested = () => close(open());

test('only the no-caller main-list footer requests presentation and retains the active owner', () => {
  const state = open(), owner = state.system.runtime.active;
  const next = close(state);
  assert.equal(next.system.runtime.active, owner);
  assert.equal(next.system.runtime.instances[owner].state.notesFooterClose, true);
  assert.equal(state.system.runtime.instances[owner].state.notesFooterClose, undefined);
  assert.equal(tickSystem(next, 5000).system.runtime.active, owner);
  assert.equal(reduceSystem(next, 'open', 5100).system.runtime.instances[owner].state.screen, 'main');
  assert.equal(reduceSystem(state, 'back', 4100).system.runtime.instances[owner], undefined);
  assert.equal(reduceSystem(state, 'home', 4100).system.runtime.active, null);
  const drawing = touchSystem(state, 40, 25, 4050);
  assert.equal(drawing.system.runtime.instances[owner].state.screen, 'drawing');
  assert.equal(touchSystem(drawing, 20, 225, 4100).system.runtime.instances[owner].state.notesFooterClose, undefined);
  const caller = launchHomeShortcut(tickSystem(createPortfolioState(), 3001), 'work', 3200);
  const withCaller = invokeSystemApplet(tickSystem(caller, 4001), 'game-notes', 4050);
  const returned = close(withCaller);
  assert.equal(returned.system.runtime.active, caller.system.runtime.application);
  assert.equal(returned.system.runtime.systemApplet, null);
  for (const appId of ['friends', 'notifications', 'browser', 'miiverse']) {
    const other = invokeSystemApplet(tickSystem(createPortfolioState(), 3001), appId, 4000);
    assert.equal(reduceSystem(other, 'back', 4100).system.runtime.systemApplet, null);
  }
});

test('full owned touch release and legacy touch share the Notes footer request', () => {
  let state = open();
  for (const phase of ['down', 'move', 'up']) state = dispatchSystemEvent(state, { type: 'touch', phase, x: 160, y: 226 }, 4100);
  assert.ok(notesFooterCloseIdentity(state, 0));
  assert.equal(completeNotesFooterClose(state, 'old-owner', 4200), state);
  assert.equal(completeNotesFooterClose(state, state.system.runtime.active, NaN), state);
});

test('accepted outgoing endpoint alone permits teardown; recovery has its own current HOME handoff receipt', () => {
  let state = requested();
  const session = createNotesFooterClosePresentation(), owner = state.system.runtime.active, resources = {};
  let step = 0;
  function publish(kind, frame, token = {}) {
    const pose = session.sample(state, 3, ms(step), notesFooterCloseEligible(state), false);
    assert.equal(pose.kind, kind); if (frame !== null) assert.equal(pose.frame, frame);
    assert.equal(session.bind(pose, token, kind === 'feedback' || kind === 'out' ? resources : homeResources), true);
    const result = session.present(pose, state, 3, ms(step), true, token, kind === 'feedback' || kind === 'out' ? resources : homeResources);
    step++; return result;
  }
  publish('feedback', 0); publish('feedback', 1);
  for (let frame = 0; frame < 20; frame++) {
    assert.equal(publish('out', frame), null);
    assert.ok(state.system.runtime.instances[owner]);
  }
  const terminal = session.sample(state, 3, ms(step), true, false), token = {};
  session.bind(terminal, token, resources);
  assert.equal(terminal.frame, 20);
  assert.equal(session.present(terminal, state, 3, ms(step), false, token, resources), null);
  assert.ok(state.system.runtime.instances[owner], 'an offscreen endpoint cannot delete the owner');
  assert.equal(session.present(terminal, state, 3, ms(step), true, {}, resources), null);
  assert.equal(session.present(terminal, state, 3, ms(step), true, token, resources), owner);
  state = completeNotesFooterClose(state, owner, ms(step++));
  assert.equal(state.system.phase, 'home'); assert.equal(state.system.runtime.instances[owner], undefined);
  const homeResources = {};
  for (let frame = 0; frame <= 20; frame++) assert.equal(publish('in', frame), null);
  assert.equal(session.active(state, 3), true);
  assert.equal(publish('handoff', null), null);
  assert.equal(session.active(state, 3), false);
  assert.equal(session.sample(state, 3, ms(step), true, false), undefined);
});

test('duplicate paints, stale receipts, pauses, stalls, resource replacement and owner generations cannot skip poses', () => {
  const state = requested(), session = createNotesFooterClosePresentation(), resources = {}, pair = {};
  const pose = session.sample(state, 0, 0, true, false);
  session.bind(pose, pair, resources); session.present(pose, state, 0, 0, true, pair, resources);
  for (const time of [4, 8, 12]) {
    const same = session.sample(state, 0, time, true, false); assert.equal(same.frame, 0);
    session.bind(same, pair, resources); session.present(same, state, 0, time, true, pair, resources);
  }
  assert.equal(session.sample(state, 0, 17, true, false).frame, 1);
  session.revoke();
  assert.equal(session.present(pose, state, 0, 18, true, pair, resources), null);
  const paused = { ...state, system: { ...state.system, sleeping: true } };
  assert.equal(session.sample(paused, 0, 1000, false, false), undefined);
  const resumed = session.sample(state, 0, 2000, true, false); assert.equal(resumed.frame, 0);
  session.bind(resumed, pair, resources); session.present(resumed, state, 0, 2000, true, pair, resources);
  const stalled = session.sample(state, 0, 4000, true, false); assert.equal(stalled.frame, 0);
  assert.equal(session.bind(stalled, pair, {}), false);
  const restarted = session.sample(state, 0, 4100, true, false); assert.equal(restarted.frame, 0);
  session.bind(restarted, pair, resources);
  assert.equal(session.present(restarted, state, 1, 4100, true, pair, resources), null);
  const generation = session.sample(state, 1, 4200, true, false); assert.equal(generation.frame, 0);
  assert.notEqual(generation.identity.generation, restarted.identity.generation);
  session.dispose(); assert.equal(session.sample(state, 1, 4300, true, false), undefined);
});

test('B and HOME remain recovery escapes and a resumed HOME escape does not restart footer close', () => {
  const state = requested(), owner = state.system.runtime.active;
  assert.equal(reduceSystem(state, 'back', 4300).system.runtime.instances[owner], undefined);
  const home = reduceSystem(state, 'home', 4300);
  assert.equal(home.system.runtime.active, null);
  assert.equal(home.system.runtime.instances[owner].state.notesFooterClose, undefined);
  assert.equal(reduceSystem(state, 'power', 4300).system.runtime.instances[owner], undefined);
});
