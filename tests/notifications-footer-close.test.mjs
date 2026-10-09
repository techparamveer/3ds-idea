import test from 'node:test';
import assert from 'node:assert/strict';
import { createPortfolioState, tickSystem, invokeSystemApplet, launchHomeShortcut, touchSystem, dispatchSystemEvent, reduceSystem, completeNotificationsFooterClose } from '../src/os/system.ts';
import { createNotificationsFooterClosePresentation, notificationsFooterCloseIdentity } from '../src/os/notifications-footer-close.ts';
import { notesFooterCloseEligible } from '../src/os/notes-footer-close.ts';

const home = () => tickSystem(createPortfolioState(), 3001);
const open = state => invokeSystemApplet(state ?? home(), 'notifications', 4000);
const request = state => touchSystem(state, 160, 226, 4100);
const ms = step => 5000 + step * 1000 / 60 + .01;

test('only no-caller Notifications main footer retains its owner; B/HOME/subscreen/caller routes are unchanged', () => {
  const state = open(), owner = state.system.runtime.active, pending = request(state);
  assert.equal(pending.system.runtime.active, owner);
  assert.equal(pending.system.runtime.instances[owner].state.notificationsFooterClose, true);
  assert.equal(state.system.runtime.instances[owner].state.notificationsFooterClose, undefined);
  assert.equal(tickSystem(pending, 5000).system.runtime.active, owner);
  assert.equal(reduceSystem(pending, 'down', 5001).system.runtime.instances[owner].state.selection, 0);
  assert.equal(reduceSystem(state, 'back', 4100).system.runtime.instances[owner], undefined);
  const escaped = reduceSystem(pending, 'home', 4200);
  assert.equal(escaped.system.runtime.active, null);
  assert.equal(escaped.system.runtime.instances[owner].state.notificationsFooterClose, undefined);
  assert.equal(reduceSystem(pending, 'power', 4200).system.runtime.instances[owner], undefined);
  const instance = state.system.runtime.instances[owner];
  const detail = { ...state, system: { ...state.system, runtime: { ...state.system.runtime,
    instances: { ...state.system.runtime.instances, [owner]: { ...instance, state: { ...instance.state, screen: 'notification' } } } } } };
  const back = touchSystem(detail, 20, 226, 4200);
  assert.equal(back.system.runtime.instances[owner].state.screen, 'main');
  assert.equal(back.system.runtime.instances[owner].state.notificationsFooterClose, undefined);
  const caller = tickSystem(launchHomeShortcut(home(), 'work', 3200), 4001), withCaller = open(caller);
  const returned = request(withCaller);
  assert.equal(returned.system.runtime.active, caller.system.runtime.application);
  assert.equal(returned.system.runtime.systemApplet, null);
  for (const appId of ['friends', 'browser', 'miiverse']) {
    const other = invokeSystemApplet(home(), appId, 4000);
    assert.equal(reduceSystem(other, 'back', 4100).system.runtime.systemApplet, null);
  }
});

test('owned release shares the footer path and invalid completion identities cannot retire it', () => {
  let state = open();
  for (const phase of ['down', 'move', 'up']) state = dispatchSystemEvent(state, { type: 'touch', phase, x: 160, y: 226 }, 4100);
  assert.equal(notificationsFooterCloseIdentity(state, 2).owner, state.system.runtime.active);
  assert.equal(completeNotificationsFooterClose(state, 'stale', 4200), state);
  assert.equal(completeNotificationsFooterClose(state, state.system.runtime.active, NaN), state);
});

test('first and repeated close retain both outgoing identity and owner through accepted out20, then require HOME handoff', () => {
  let homeState = home(), previousOwner;
  const session = createNotificationsFooterClosePresentation();
  for (let cycle = 0; cycle < 2; cycle++) {
    let state = request(open(homeState)), step = cycle * 100;
    const owner = state.system.runtime.active, resources = {}, firmware = {};
    assert.notEqual(owner, previousOwner);
    function publish(kind, frame) {
      const pose = session.sample(state, 2, ms(step), true, false), pair = {};
      assert.equal(pose.kind, kind); if (frame !== null) assert.equal(pose.frame, frame);
      const current = kind === 'feedback' || kind === 'out' ? resources : firmware;
      assert.equal(session.bind(pose, pair, current), true);
      const result = session.present(pose, state, 2, ms(step++), true, pair, current);
      return result;
    }
    publish('feedback', 0); publish('feedback', 1);
    for (let frame = 0; frame < 20; frame++) { assert.equal(publish('out', frame), null); assert.ok(state.system.runtime.instances[owner]); }
    assert.equal(publish('out', 20), owner);
    state = completeNotificationsFooterClose(state, owner, ms(step));
    assert.equal(state.system.runtime.instances[owner], undefined); assert.equal(state.system.phase, 'home');
    for (let frame = 0; frame <= 20; frame++) assert.equal(publish('in', frame), null);
    assert.equal(session.active(state, 2), true); publish('handoff', null);
    assert.equal(session.active(state, 2), false);
    homeState = state; previousOwner = owner;
  }
});

test('missing/replaced resources, stale pair/owner/generation, invalid publication, sleep, stalls and disposal fail closed', () => {
  const state = request(open()), owner = state.system.runtime.active, session = createNotificationsFooterClosePresentation(), pair = {}, resources = {};
  const first = session.sample(state, 0, 0, true, false);
  session.bind(first, pair, resources);
  assert.equal(session.present(first, state, 0, 0, true, pair, undefined), null);
  assert.equal(session.present(first, state, 0, 0, true, {}, resources), null);
  assert.equal(session.present(first, state, 0, 0, false, pair, resources), null);
  assert.equal(session.present(first, state, 1, 0, true, pair, resources), null);
  const replacement = request(open(completeNotificationsFooterClose(state, owner, 1)));
  assert.equal(session.present(first, replacement, 0, 0, true, pair, resources), null);
  assert.equal(session.present(first, state, 0, 0, true, pair, resources), null);
  const stalled = session.sample(state, 0, 1000, true, false); assert.equal(stalled.frame, 0);
  assert.equal(session.bind(stalled, pair, {}), false);
  const restarted = session.sample(state, 0, 1017, true, false); assert.equal(restarted.frame, 0);
  session.bind(restarted, pair, resources); session.present(restarted, state, 0, 1017, true, pair, resources);
  const sleeping = { ...state, system: { ...state.system, sleeping: true } };
  assert.equal(notesFooterCloseEligible(sleeping), false); assert.equal(session.sample(sleeping, 0, 1034, false, false), undefined);
  const resumed = session.sample(state, 0, 2000, true, false); assert.equal(resumed.frame, 0);
  session.bind(resumed, pair, resources); session.revoke();
  assert.equal(session.present(resumed, state, 0, 2000, true, pair, resources), null);
  const terminal = session.sample(state, 0, 2017, true, true); assert.equal(terminal.kind, 'feedback'); assert.equal(terminal.frame, 1);
  session.bind(terminal, pair, resources); session.present(terminal, state, 0, 2017, true, pair, resources);
  const out = session.sample(state, 0, 2034, true, true); assert.equal(out.kind, 'out'); assert.equal(out.frame, 20);
  session.bind(out, pair, resources); session.dispose();
  assert.equal(session.present(out, state, 0, 2034, true, pair, resources), null);
  assert.equal(session.sample(state, 0, 2051, true, true), undefined); assert.ok(state.system.runtime.instances[owner]);
});
