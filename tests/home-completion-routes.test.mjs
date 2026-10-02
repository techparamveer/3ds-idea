import test from 'node:test';
import assert from 'node:assert/strict';
import { apps } from '../src/os/apps.ts';
import { getTitle, initialAppLayout } from '../src/os/app-registry.ts';
import { getHomeFooter } from '../src/os/home-presentation.ts';
import { selectHomeSlot, settleHomeNavigation } from '../src/os/home-navigation.ts';
import { createPortfolioState, reduceSystem, tickSystem, touchSystem } from '../src/os/system.ts';

const titleSlot = id => Number(Object.entries(initialAppLayout()).find(([, title]) => title === id)[0]);
const booted = () => tickSystem(createPortfolioState(), 3001);
const runningWork = () => tickSystem(reduceSystem(booted(), 'open', 4000), 6000);
const suspendedWork = () => reduceSystem(runningWork(), 'home', 6001);
const selectTitle = (state, id) => settleHomeNavigation(selectHomeSlot(state, titleSlot(id)));
const finishClose = (state, now) => {
  state = tickSystem(state, now);
  state = tickSystem(state, now + 1000);
  return tickSystem(state, state.system.homeClock.lastNow + 1000 / 60);
};

function assertSuspendedOwner(state, owner, appId = 'work') {
  const runtime = state.system.runtime;
  assert.equal(state.system.phase, 'home');
  assert.equal(state.system.app, appId);
  assert.equal(runtime.application, owner);
  assert.equal(runtime.active, null);
  assert.equal(runtime.homeReturn, owner);
  assert.equal(runtime.instances[owner].appId, appId);
  assert.equal(runtime.instances[owner].suspended, true);
  assert.notEqual(runtime.instances[owner].closing, true);
}

test('Work HOME suspension keeps one exact owner and exposes Resume for that selected title', () => {
  const running = runningWork();
  const owner = running.system.runtime.application;
  assert.equal(running.system.runtime.active, owner);

  const descriptor = getTitle('work');
  assert.deepEqual({
    id: descriptor.id,
    title: descriptor.title,
    kind: descriptor.kind,
    source: descriptor.source,
    assetPack: descriptor.assetPack,
    titleId: descriptor.titleId,
    icon: apps.find(app => app.id === 'work').icon,
  }, {
    id: 'work', title: 'Work', kind: 'application', source: 'portfolio',
    assetPack: 'portfolio', titleId: undefined, icon: 'case',
  });

  const suspended = reduceSystem(running, 'home', 6001);
  assertSuspendedOwner(suspended, owner);
  assert.equal(suspended.selected, titleSlot('work'));
  assert.deepEqual(getHomeFooter(suspended), { two: true, left: 'close-software', right: 'resume' });

  const resumed = reduceSystem(suspended, 'open', 6002);
  assert.equal(resumed.system.phase, 'app');
  assert.equal(resumed.system.runtime.application, owner);
  assert.equal(resumed.system.runtime.active, owner);
  assert.equal(resumed.system.runtime.homeReturn, null);
  assert.equal(resumed.system.runtime.instances[owner].suspended, false);
  assert.equal(resumed.system.runtime.sequence, running.system.runtime.sequence, 'resume must not create another owner');
});

test('Close software removes the suspended owner before no-software HOME regains Open', () => {
  const suspended = suspendedWork();
  const owner = suspended.system.runtime.homeReturn;
  assertSuspendedOwner(suspended, owner);

  const dialog = touchSystem(suspended, 0, 226, 6002);
  assert.equal(dialog.system.dialog, 'close');
  assertSuspendedOwner(dialog, owner);

  const closing = reduceSystem(dialog, 'open', 6003);
  assertSuspendedOwner(closing, owner);
  const closed = finishClose(closing, 6003);
  assert.equal(closed.system.phase, 'home');
  assert.equal(closed.system.app, null);
  assert.equal(closed.system.runtime.application, null);
  assert.equal(closed.system.runtime.active, null);
  assert.equal(closed.system.runtime.homeReturn, null);
  assert.equal(closed.system.runtime.instances[owner], undefined);
  assert.deepEqual(getHomeFooter(closed), { two: false, left: null, right: 'open' });

  const relaunched = reduceSystem(closed, 'open', 6004);
  assert.equal(relaunched.system.phase, 'launch');
  assert.equal(relaunched.system.app, 'work');
  assert.notEqual(relaunched.system.runtime.application, owner, 'a closed owner cannot be reused');
});

test('switch cancel retains Work while switch confirmation retires it before the new owner', () => {
  const suspended = selectTitle(suspendedWork(), 'about');
  const workOwner = suspended.system.runtime.homeReturn;
  assertSuspendedOwner(suspended, workOwner);
  assert.deepEqual(getHomeFooter(suspended), { two: false, left: null, right: 'open' });

  let switching = reduceSystem(suspended, 'open', 6002);
  assert.equal(switching.system.dialog, 'switch');
  assert.equal(switching.system.pending, 'about');
  assertSuspendedOwner(switching, workOwner);

  const cancelled = reduceSystem(switching, 'back', 6003);
  assert.equal(cancelled.system.dialog, null);
  assert.equal(cancelled.system.pending, null);
  assertSuspendedOwner(cancelled, workOwner);
  assert.deepEqual(getHomeFooter(cancelled), { two: false, left: null, right: 'open' });

  switching = reduceSystem(cancelled, 'open', 6004);
  const closing = reduceSystem(switching, 'open', 6005);
  assertSuspendedOwner(closing, workOwner);
  const launched = finishClose(closing, 6005);
  const aboutOwner = launched.system.runtime.application;
  assert.equal(launched.system.phase, 'launch');
  assert.equal(launched.system.app, 'about');
  assert.equal(launched.system.runtime.instances[workOwner], undefined);
  assert.notEqual(aboutOwner, workOwner);

  const settled = tickSystem(launched, launched.system.since + 2200);
  const aboutHome = reduceSystem(settled, 'home', launched.system.since + 2201);
  assertSuspendedOwner(aboutHome, aboutOwner, 'about');
  assert.deepEqual(getHomeFooter(aboutHome), { two: true, left: 'close-software', right: 'resume' });
});
