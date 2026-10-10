import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppletEntryPresentation } from '../src/os/applet-entry-presentation.ts';

const ms = step => 10000 + step * 1000 / 60 + .01;
const identities = ['friends', 'notifications'].map(appId => ({ owner: appId + ':1', appId, caller: null, requestId: null, application: 'camera:1', generation: 2 }));
function fixture(identity = identities[0]) {
  const controller = createAppletEntryPresentation(), resources = {}, pair = {};
  const sample = (step, patch = {}) => controller.sample({ identity, elapsedMs: ms(step), eligible: true, reducedMotion: false, pair, incomingResources: resources, ...patch });
  const present = (pose, step, patch = {}) => controller.present(pose, patch.identity ?? identity, ms(step), patch.eligible ?? true, patch.pair ?? pair, patch.resources ?? resources);
  const outgoing = () => { for (let frame = 0; frame <= 20; frame++) { const pose = sample(frame); assert.equal(pose.kind, 'cover'); assert.equal(pose.frame, frame); assert.equal(present(pose, frame), true); } };
  return { controller, identity, resources, pair, sample, present, outgoing };
}

test('both title incoming producers retain every source pose and require outgoing, incoming terminal and fresh handoff receipts', () => {
  for (const identity of identities) {
    const f = fixture(identity); f.outgoing();
    for (let frame = 0; frame <= 20; frame++) {
      const pose = f.sample(21 + frame);
      assert.deepEqual([pose.kind, pose.frame, pose.resources], ['incoming', frame, f.resources]);
      assert.equal(f.sample(21 + frame + .5), pose, 'offscreen repaint cannot consume a pose');
      assert.equal(f.controller.ready(identity), false);
      assert.equal(f.present(pose, 21 + frame, { pair: {} }), false);
      assert.equal(f.present(pose, 21 + frame, { resources: {} }), false);
      const freshPair = {}, rebound = f.controller.bindPreparedPair(freshPair, f.resources);
      assert.equal(f.present(pose, 21 + frame), false, 'old offscreen pair cannot acknowledge rebound candidate');
      assert.equal(f.present(rebound, 21 + frame, { pair: freshPair }), true);
      assert.equal(f.present(rebound, 21 + frame, { pair: freshPair }), false);
    }
    assert.equal(f.controller.ready(identity), false, 'transparent incoming20 still precedes fresh destination handoff');
    const handoff = f.sample(42), freshPair = {};
    assert.equal(handoff.kind, 'handoff'); assert.equal(handoff.resources, f.resources);
    const rebound = f.controller.bindPreparedPair(freshPair, f.resources);
    assert.equal(f.present(handoff, 42), false);
    assert.equal(f.present(rebound, 42, { pair: freshPair }), true);
    assert.equal(f.controller.ready(identity), true); assert.equal(f.controller.active(identity, freshPair, f.resources), false);
    f.controller.revoke(); assert.equal(f.sample(1000), undefined, 'completed owner does not replay either producer');
  }
});

test('outgoing20 must be presented and exact destination plus incoming resource must be ready before incoming0', () => {
  const f = fixture();
  for (let frame = 0; frame < 20; frame++) f.present(f.sample(frame), frame);
  const terminal = f.sample(20); assert.equal(f.sample(21), terminal); assert.equal(terminal.kind, 'cover');
  f.present(terminal, 21);
  for (const [index, patch] of [{ pair: undefined }, { incomingResources: undefined }, { pair: undefined, incomingResources: undefined }].entries()) {
    const held = f.sample(22 + index, patch); assert.deepEqual([held.kind, held.frame], ['cover', 20]); f.present(held, 22 + index);
    assert.equal(f.controller.ready(f.identity), false);
  }
  assert.equal(f.controller.active(f.identity, f.pair), false);
  assert.equal(f.controller.active(f.identity, undefined, f.resources), false);
  assert.equal(f.controller.active(f.identity, f.pair, f.resources), true);
  assert.deepEqual([f.sample(25).kind, f.sample(25).frame], ['incoming', 0]);
});

test('pending incoming0 or terminal cannot survive missing/foreign pair or resource publication', () => {
  const f = fixture(); f.outgoing();
  const incoming = f.sample(21);
  assert.equal(f.sample(22, { pair: undefined }), undefined);
  assert.equal(f.present(incoming, 22), false);
  const rebase = f.sample(23); assert.deepEqual([rebase.kind, rebase.frame], ['cover', 20]); f.present(rebase, 23);
  const next = f.sample(24); assert.equal(next.frame, 0); assert.equal(next.kind, 'incoming');
  assert.equal(f.controller.bindPreparedPair({}, {}), undefined);
  assert.equal(f.present(next, 25), false);
  const repeated = f.sample(26); assert.equal(repeated.kind, 'cover'); assert.equal(repeated.frame, 20);
});

test('mid-incoming failure, hidden publication and monotonic retry rebase without catch-up', () => {
  for (const patch of [{ pair: undefined }, { incomingResources: undefined }, { eligible: false }]) {
    const f = fixture(); f.outgoing(); f.present(f.sample(21), 21); f.present(f.sample(22), 22);
    const abandoned = f.sample(23); assert.equal(abandoned.frame, 2);
    assert.equal(f.sample(24, patch), undefined); assert.equal(f.present(abandoned, 24), false);
    const rebase = f.sample(26); assert.equal(rebase.frame, 1); assert.equal(rebase.kind, 'incoming');
    f.present(rebase, 26); assert.equal(f.sample(27).frame, 2);
  }
  const f = fixture(); f.outgoing(); f.present(f.sample(21), 21); f.present(f.sample(22), 22);
  const stalled = f.sample(500); assert.equal(stalled.frame, 1); f.present(stalled, 500);
  assert.equal(f.sample(501).frame, 2);
});

test('replacement source reacknowledges outgoing20 then starts original incoming0 rather than inheriting old progress', () => {
  const f = fixture(); f.outgoing();
  for (let frame = 0; frame < 7; frame++) f.present(f.sample(21 + frame), 21 + frame);
  const old = f.sample(28), replacement = {};
  const terminal = f.sample(29, { incomingResources: replacement });
  assert.deepEqual([terminal.kind, terminal.frame], ['cover', 20]); assert.equal(f.present(old, 29), false);
  assert.equal(f.present(terminal, 29, { resources: replacement }), true);
  const incoming = f.sample(30, { incomingResources: replacement });
  assert.deepEqual([incoming.kind, incoming.frame, incoming.resources], ['incoming', 0, replacement]);
});

test('owner, caller, request, retained application and generation replacement reject incoming and terminal receipts', () => {
  for (const patch of [{ owner: 'friends:2' }, { caller: 'camera:1' }, { requestId: 'other' }, { application: null }, { generation: 3 }, { appId: 'notifications' }]) {
    const f = fixture(); f.outgoing(); const old = f.sample(21), identity = { ...f.identity, ...patch };
    assert.equal(f.present(old, 22, { identity }), false);
    const replacement = f.sample(22, { identity }); assert.equal(replacement.kind, 'cover'); assert.equal(replacement.frame, 0);
    assert.equal(f.present(old, 23), false);
  }
  for (const finish of ['reset', 'dispose']) {
    const f = fixture(); f.outgoing(); const old = f.sample(21); f.controller[finish]();
    assert.equal(f.present(old, 22), false); assert.equal(f.controller.ready(f.identity), false);
  }
});

test('reduced motion retains distinct outgoing20, incoming20 and fresh handoff publications', () => {
  for (const identity of identities) {
    const f = fixture(identity), options = { reducedMotion: true };
    const outgoing = f.sample(0, options); assert.equal(outgoing.kind, 'cover'); assert.equal(outgoing.frame, 20);
    assert.equal(f.sample(0, options), outgoing); f.present(outgoing, 0);
    const incoming = f.sample(0, options); assert.equal(incoming.kind, 'incoming'); assert.equal(incoming.frame, 20);
    assert.equal(f.controller.ready(identity), false); f.present(incoming, 0);
    const handoff = f.sample(0, options); assert.equal(handoff.kind, 'handoff');
    f.controller.revoke(); assert.equal(f.present(handoff, 1), false);
    const retained = f.sample(1, options); assert.equal(retained.kind, 'incoming'); assert.equal(retained.frame, 20); f.present(retained, 1);
    assert.equal(f.present(f.sample(1, options), 1), true); assert.equal(f.controller.ready(identity), true);
  }
});

test('dynamic reduced toggle commits only a rendered endpoint and never replays an acknowledged incoming midpoint', () => {
  const f = fixture(); f.outgoing(); f.present(f.sample(21), 21); f.present(f.sample(22), 22);
  f.controller.revoke(); const reduced = f.sample(23, { reducedMotion: true }); assert.equal(reduced.frame, 20);
  f.controller.revoke(); const retained = f.sample(24); assert.equal(retained.frame, 1); f.present(retained, 24);
  f.controller.revoke(); const endpoint = f.sample(25, { reducedMotion: true }); f.present(endpoint, 25);
  f.controller.revoke(); const disabled = f.sample(26); assert.equal(disabled.frame, 20); assert.equal(disabled.kind, 'incoming');
  f.present(disabled, 26); assert.equal(f.sample(27).kind, 'handoff');
});

test('failed or stale final destination handoff keeps terminal ownership until a freshly rendered pair is acknowledged', () => {
  const f = fixture(), options = { reducedMotion: true };
  f.present(f.sample(0, options), 0); f.present(f.sample(0, options), 0);
  const handoff = f.sample(0, options);
  assert.equal(f.present(handoff, 1, { resources: {} }), false);
  assert.equal(f.present(handoff, 1, { pair: {} }), false);
  assert.equal(f.present(handoff, 1, { eligible: false }), false);
  assert.equal(f.controller.ready(f.identity), false);
  assert.equal(f.sample(2, { pair: undefined, reducedMotion: true }), undefined);
  assert.equal(f.present(handoff, 2), false);
  const terminal = f.sample(3, options); assert.equal(terminal.kind, 'incoming'); assert.equal(terminal.frame, 20); f.present(terminal, 3);
  const current = f.sample(3, options), freshPair = {}, rebound = f.controller.bindPreparedPair(freshPair, f.resources);
  assert.equal(f.present(current, 3), false); assert.equal(f.present(rebound, 3, { pair: freshPair }), true);
  assert.equal(f.controller.ready(f.identity), true);
});

test('Back, power escape and same-title reentry cannot reuse a previous incoming ticket or terminal', () => {
  const f = fixture(); f.outgoing(); const old = f.sample(21);
  assert.equal(f.sample(22, { identity: null }), undefined);
  const identity = { ...f.identity, owner: 'friends:2' }, next = f.sample(23, { identity });
  assert.equal(next.kind, 'cover'); assert.equal(next.frame, 0);
  assert.equal(f.present(old, 23), false); assert.equal(f.controller.ready(identity), false);
  f.controller.reset(); assert.equal(f.controller.present(next, identity, ms(24), true, f.pair, f.resources), false);
  assert.equal(f.sample(25, { identity }).frame, 0);
});

test('incoming follows bounded accepted-sample time at ordinary render cadences and rejects true backwards clocks', () => {
  for (const hz of [60, 45, 30, 20]) {
    const f = fixture(); f.outgoing(); const incoming = f.sample(21);
    assert.deepEqual([incoming.kind, incoming.frame], ['incoming', 0]); f.present(incoming, 22);
    let receiptCount = 0, pose = incoming;
    while (pose.frame < 20) {
      receiptCount++; const elapsedUpdates = Math.floor(receiptCount * 60 / hz), step = 21 + elapsedUpdates;
      pose = f.sample(step); assert.deepEqual([pose.kind, pose.frame], ['incoming', Math.min(20, elapsedUpdates)], `${hz}Hz receipt ${receiptCount}`);
      assert.equal(f.sample(step + .5), pose); assert.equal(f.present(pose, step + 1), true);
    }
    assert.equal(receiptCount, Math.ceil(20 * hz / 60), `${hz}Hz receipt count`);
    assert.equal(f.sample(22 + Math.floor(receiptCount * 60 / hz)).kind, 'handoff');
  }
  const f = fixture(); f.outgoing(); f.present(f.sample(21), 21); f.present(f.sample(23), 23);
  assert.throws(() => f.sample(22), /clock moved backwards/);
  for (const elapsedMs of [-1, NaN, Infinity]) assert.throws(() => f.sample(24, { elapsedMs }), /timestamp/);
});

test('Notes keeps its direct handoff while Browser and Miiverse use common incoming without title readiness', () => {
 const notes = fixture({ ...identities[0], appId: 'game-notes', owner: 'game-notes:1' });
 for (let frame = 0; frame <= 20; frame++) { const pose = notes.sample(frame, { incomingResources: undefined }); assert.equal(pose.kind, 'cover'); notes.controller.present(pose, notes.identity, ms(frame), true, notes.pair); }
 const notesHandoff = notes.sample(21, { incomingResources: undefined }); assert.equal(notesHandoff.kind, 'handoff');
 assert.equal(notes.controller.present(notesHandoff, notes.identity, ms(21), true, notes.pair), true);

 for (const appId of ['browser', 'miiverse']) {
  const f = fixture({ ...identities[0], appId, owner: appId + ':1' });
  for (let frame = 0; frame <= 20; frame++) { const pose = f.sample(frame, { incomingResources: undefined }); assert.equal(pose.kind, 'cover'); f.controller.present(pose, f.identity, ms(frame), true, f.pair); }
  for (let frame = 0; frame <= 20; frame++) {
   const pose = f.sample(21 + frame, { incomingResources: undefined });assert.deepEqual([pose.kind,pose.frame,pose.resources],['incoming',frame,undefined]);
   assert.equal(f.controller.present(pose, f.identity, ms(21 + frame), true, f.pair), true);
  }
  const handoff=f.sample(42,{incomingResources:undefined});assert.equal(handoff.kind,'handoff');
  assert.equal(f.controller.present(handoff,f.identity,ms(42),true,f.pair),true);assert.equal(f.controller.ready(f.identity),true);
 }
});
