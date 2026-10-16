import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createPortfolioState, tickSystem, invokeSystemApplet, touchSystem, reduceSystem, completeNotificationsFooterClose } from '../src/os/system.ts';
import { createNotificationsFooterClosePresentation } from '../src/os/notifications-footer-close.ts';
import { createNotesFooterClosePresentation, footerCloseDrawPose, footerCloseOutgoing, TOOLBAR_CLOSE_COVER_HOLD_FRAMES } from '../src/os/notes-footer-close.ts';
import { createFriendsFooterClosePresentation } from '../src/os/friends-footer-close.ts';
import { createWebFooterClosePresentation } from '../src/os/web-footer-close.ts';
import { createManualFooterClosePresentation } from '../src/os/manual-footer-close.ts';
import { createAppletFooterClosePresentation } from '../src/os/notes-footer-close.ts';
import { HEALTH_VBLANK_HZ } from '../src/os/stock-health-scroll.ts';

const home = () => tickSystem(createPortfolioState(), 3001);
const requestFor = (appId, x = 160) => touchSystem(invokeSystemApplet(home(), appId, 4000), x, 226, 4100);
const requested = () => requestFor('notifications');
const period = 1000 / HEALTH_VBLANK_HZ;

/** Drives one presentation with an always-valid identity; returns the accepted pose log. */
function drive(session, state, { start = 5000, step = 1000 / 60, reduced = false, generation = 2, until = 'owner' } = {}) {
  const log = [], resources = {};
  let now = start, owner = null;
  for (let i = 0; i < 2000 && !owner; i++, now += step) {
    const pose = session.sample(state, generation, now, true, reduced), pair = {};
    assert.ok(pose);
    assert.equal(session.bind(pose, pair, resources), true);
    owner = session.present(pose, state, generation, now, true, pair, resources);
    log.push({ kind: pose.kind, frame: pose.frame, at: now, pose });
    if (until !== 'owner' && until(pose)) break;
  }
  return { log, owner, now, resources };
}

test('toolbar presentations hold the out20 cover for 120 source LCD frames before retiring the owner', () => {
  assert.equal(TOOLBAR_CLOSE_COVER_HOLD_FRAMES, 120);
  for (const [create, state] of [[createNotesFooterClosePresentation, requestFor('game-notes')], [createNotificationsFooterClosePresentation, requested()],
    [createFriendsFooterClosePresentation, requestFor('friends')], [createWebFooterClosePresentation, requestFor('browser', 53)], [createWebFooterClosePresentation, requestFor('miiverse', 288)]]) {
    const owner = state.system.runtime.active;
    const { log, owner: retired } = drive(create(), state);
    assert.equal(retired, owner);
    const outEnd = log.findIndex(entry => entry.kind === 'out' && entry.frame === 20);
    const held = log.slice(outEnd + 1);
    assert.deepEqual(held.map(entry => entry.kind), Array(120).fill('hold'));
    assert.deepEqual(held.map(entry => entry.frame), Array.from({ length: 120 }, (_, i) => i));
    assert.equal(log.filter(entry => entry.kind === 'out' && entry.frame === 20).length, 1);
  }
});

test('held frames follow LCD time from hold:0 and HOME incoming 0 follows hold:119', () => {
  const session = createNotificationsFooterClosePresentation();
  let state = requested();
  const owner = state.system.runtime.active;
  // A 30 Hz publisher skips held frame indices but keeps the 2.006 s hold.
  const { log, owner: retired, now } = drive(session, state, { step: 1000 / 30 });
  assert.equal(retired, owner);
  const held = log.filter(entry => entry.kind === 'hold');
  assert.equal(held[0].frame, 0); assert.equal(held.at(-1).frame, 119);
  for (let i = 1; i < held.length; i++) assert.ok(held[i].frame > held[i - 1].frame);
  const holdMs = held.at(-1).at - held[0].at;
  assert.ok(Math.abs(holdMs - 119 * period) <= 1000 / 30, `hold:0..119 spans ${holdMs} ms`);
  state = completeNotificationsFooterClose(state, owner, now);
  const incoming = session.sample(state, 2, now + 1000 / 30, true, false);
  assert.equal(incoming.kind, 'in'); assert.equal(incoming.frame, 0);
});

test('every held pose paints exactly the out20 full-cover pose and keeps outgoing resources', () => {
  const state = requestFor('browser', 53), { log } = drive(createWebFooterClosePresentation(), state);
  const out20 = log.find(entry => entry.kind === 'out' && entry.frame === 20).pose;
  for (const entry of log.filter(e => e.kind === 'hold')) {
    const drawn = footerCloseDrawPose(entry.pose);
    assert.equal(drawn.kind, 'out'); assert.equal(drawn.frame, 20);
    assert.equal(drawn.identity, out20.identity);
    assert.equal(footerCloseOutgoing(entry.pose), true);
  }
  for (const entry of log.filter(e => e.kind !== 'hold')) assert.equal(footerCloseDrawPose(entry.pose), entry.pose);
  assert.equal(footerCloseDrawPose(undefined), undefined);
  // Telemetry: the browser close diagnostics publish pose.kind / pose.frame, so
  // held paints report { kind: 'hold', frame: 0..119 }; the four toolbar draws map hold to out20.
  const screens = readFileSync(new URL('../src/os/screens.ts', import.meta.url), 'utf8');
  for (const name of ['notes', 'notifications', 'web', 'friends']) {
    assert.match(screens, new RegExp(`${name}CloseDrawPose=footerCloseDrawPose\\(${name}ClosePose\\)`));
    if (name !== 'notes') assert.match(screens, new RegExp(`${name}Close:FooterCloseDiagnostic\\|undefined=${name}CloseCandidate\\?\\{kind:${name}CloseCandidate\\.pose\\.kind`));
  }
  assert.doesNotMatch(screens, /footerCloseDrawPose\(manualClosePose\)/);
});

test('Manual Close and hold-free presentations still retire on out20', () => {
  const state = requested(), owner = state.system.runtime.active;
  const plain = drive(createAppletFooterClosePresentation(() => ({ owner, application: null, sequence: 0, generation: 2 })), state);
  assert.equal(plain.log.at(-1).kind, 'out'); assert.equal(plain.log.at(-1).frame, 20);
  assert.equal(plain.log.some(entry => entry.kind === 'hold'), false);
  const manualSource = readFileSync(new URL('../src/os/manual-footer-close.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(manualSource, /COVER_HOLD/);
  assert.equal(typeof createManualFooterClosePresentation, 'function');
});

test('reduced motion has no hold, and turning reduced on mid-hold ends it at hold:119', () => {
  const state = requested(), owner = state.system.runtime.active;
  const reduced = drive(createNotificationsFooterClosePresentation(), state, { reduced: true });
  assert.equal(reduced.owner, owner);
  assert.equal(reduced.log.at(-1).kind, 'out'); assert.equal(reduced.log.at(-1).frame, 20);
  assert.equal(reduced.log.some(entry => entry.kind === 'hold'), false);
  const session = createNotificationsFooterClosePresentation();
  const partial = drive(session, state, { until: pose => pose.kind === 'hold' && pose.frame === 10 });
  const pose = session.sample(state, 2, partial.now + 1000 / 60, true, true), pair = {};
  assert.equal(pose.kind, 'hold'); assert.equal(pose.frame, 119);
  assert.equal(session.bind(pose, pair, partial.resources), true);
  assert.equal(session.present(pose, state, 2, partial.now + 1000 / 60, true, pair, partial.resources), owner);
});

test('cancellation, stalls, sleep and revoked receipts during the hold follow the out-frame rules', () => {
  const state = requested(), owner = state.system.runtime.active;
  const session = createNotificationsFooterClosePresentation();
  const { now, resources } = drive(session, state, { until: pose => pose.kind === 'hold' && pose.frame === 30 });
  // Stall (>100 ms gap): the presented held frame repeats and re-anchors; no skip.
  const stalled = session.sample(state, 2, now + 500, true, false), pair = {};
  assert.equal(stalled.kind, 'hold'); assert.equal(stalled.frame, 30);
  session.bind(stalled, pair, resources); session.present(stalled, state, 2, now + 500, true, pair, resources);
  const next = session.sample(state, 2, now + 500 + period, true, false);
  assert.equal(next.frame, 31);
  // Revoked receipt: the unpresented pose cannot publish; the next sample repeats the presented frame.
  session.bind(next, {}, resources); session.revoke();
  assert.equal(session.present(next, state, 2, now + 500 + period, true, {}, resources), null);
  assert.equal(session.sample(state, 2, now + 600, true, false).frame, 30);
  session.revoke();
  // Sleep / ineligible: nothing publishes and the owner is retained.
  const sleeping = { ...state, system: { ...state.system, sleeping: true } };
  assert.equal(session.sample(sleeping, 2, now + 2000, false, false), undefined);
  assert.equal(session.sample(state, 2, now + 5000, true, false).frame, 30, 'resume does not jump through the hold');
  session.revoke();
  // HOME cancel (screens reset + HOME escape): the owner is never retired by the presentation.
  assert.equal(session.active(state, 2), true);
  session.reset();
  const escaped = reduceSystem(state, 'home', 6000);
  assert.equal(session.sample(escaped, 2, now + 6000, true, false), undefined);
  assert.equal(session.active(escaped, 2), false);
  assert.equal(escaped.system.runtime.instances[owner].state.notificationsFooterClose, undefined);
});
