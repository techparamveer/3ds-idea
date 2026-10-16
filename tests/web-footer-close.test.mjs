import test from 'node:test';
import assert from 'node:assert/strict';
import { createPortfolioState, tickSystem, invokeSystemApplet, touchSystem, dispatchSystemEvent, reduceSystem, launchHomeShortcut, completeWebFooterClose } from '../src/os/system.ts';
import { createWebFooterClosePresentation, webFooterCloseIdentity } from '../src/os/web-footer-close.ts';
import { notesFooterCloseEligible } from '../src/os/notes-footer-close.ts';
import { escapeUnreadyNativeScreen } from '../src/os/native-screen-system.ts';

for (const appId of ['browser', 'miiverse']) {
const home = () => tickSystem(createPortfolioState(), 3001);
const open = state => invokeSystemApplet(state ?? home(), appId, 4000);
const request = state => touchSystem(state, appId === 'browser' ? 53 : 288, 226, 4100);

test(appId + ': Web main footer retains its owner for a published native return cover', () => {
  const state = open(), owner = state.system.runtime.active, pending = request(state);
  assert.equal(pending.system.phase, 'app');
  assert.equal(pending.system.runtime.active, owner);
  assert.equal(pending.system.runtime.instances[owner].state.webFooterClose, true);
  let event = state;
  for (const phase of ['down', 'up']) event = dispatchSystemEvent(event, { type: 'touch', phase, x: appId === 'browser' ? 53 : 288, y: 226 }, 4100);
  assert.deepEqual(event.system.runtime.instances[owner].state, pending.system.runtime.instances[owner].state);
  assert.deepEqual(request(pending).system.runtime.instances[owner].state, pending.system.runtime.instances[owner].state);
  assert.equal(state.system.runtime.instances[owner].state.webFooterClose, undefined);
});

test(appId + ': Web detail Back remains local; main command, keyboard and physical Back share one idempotent Close', () => {
  const state = open();
  const routes = [s => reduceSystem(s, 'back', 4200), s => dispatchSystemEvent(s, {type:'command',command:'back'}, 4200),
    ...['physical-b', 'keyboard-b'].map(source => s => {
      for (const phase of ['down', 'up']) s = dispatchSystemEvent(s, {type:'button', command:'back', phase, source}, 4200);
      return s;
    })];
  for (const route of routes) {
    const pending = route(state), owner = state.system.runtime.active;
    assert.equal(pending.system.runtime.active, owner);
    assert.equal(pending.system.runtime.instances[owner].state.webFooterClose, true);
    assert.deepEqual(route(pending).system.runtime.instances[owner].state, pending.system.runtime.instances[owner].state);
    assert.deepEqual(reduceSystem(pending, 'open', 4300).system.runtime.instances[owner].state, pending.system.runtime.instances[owner].state);
  }
  const profile = reduceSystem(state, 'open', 4100), owner = profile.system.runtime.active;
  assert.notEqual(profile.system.runtime.instances[owner].state.screen, 'main');
  const back = touchSystem(profile, appId === 'browser' ? 53 : 288, 226, 4200);
  assert.equal(back.system.runtime.instances[owner].state.screen, 'main');
  assert.equal(back.system.runtime.instances[owner].state.webFooterClose, undefined);
});

test(appId + ': caller-owned return, HOME suspension, power and explicit unready escape do not strand a pending owner', () => {
  const caller = tickSystem(launchHomeShortcut(home(), 'work', 3200), 4001), child = open(caller);
  assert.equal(request(child).system.runtime.active, caller.system.runtime.active);
  const pending = request(open()), owner = pending.system.runtime.active;
  const suspended = reduceSystem(pending, 'home', 4300);
  assert.equal(suspended.system.runtime.instances[owner].state.webFooterClose, undefined);
  const escaped = escapeUnreadyNativeScreen(pending, 4300);
  assert.equal(escaped.system.phase, 'home');
  assert.equal(escaped.system.runtime.instances[owner].suspended, true);
  assert.equal(escaped.system.runtime.instances[owner].state.webFooterClose, undefined);
  assert.equal(reduceSystem(pending, 'power', 4300).system.runtime.instances[owner], undefined);
  assert.equal(completeWebFooterClose(pending, 'stale', 4300), pending);
  assert.equal(completeWebFooterClose(pending, owner, NaN), pending);
});

const ms = step => 5000 + step * 1000 / 60 + .01;
test(appId + ': first/repeat Close publishes all six Decide frames, original cover 0..20, held cover 0..119, then HOME 0..20 and a fresh handoff', () => {
  for (const reduced of [false, true]) {
    const session = createWebFooterClosePresentation(); let prior, previousOwner;
    for (let cycle = 0; cycle < 2; cycle++) {
      let state = request(open(prior)), step = cycle * 300;
      const owner = state.system.runtime.active, resources = {}, firmware = {};
      assert.notEqual(owner, previousOwner);
      const publish = (kind, frame) => {
        const pose = session.sample(state, 2, ms(step), true, reduced), pair = {};
        assert.equal(pose.kind, kind); if (frame !== null) assert.equal(pose.frame, frame);
        const current = kind === 'feedback' || kind === 'out' || kind === 'hold' ? resources : firmware;
        assert.equal(session.bind(pose, pair, current), true);
        return session.present(pose, state, 2, ms(step++), true, pair, current);
      };
      for (const frame of reduced ? [5] : [0,1,2,3,4,5]) assert.equal(publish('feedback', frame), null);
      for (const frame of reduced ? [] : Array.from({length:20}, (_,i)=>i)) {
        assert.equal(publish('out', frame), null); assert.ok(state.system.runtime.instances[owner]);
      }
      // Toolbar cover hold: out20 no longer retires the owner; 120 held out20 frames do.
      if (reduced) assert.equal(publish('out', 20), owner);
      else {
        assert.equal(publish('out', 20), null);
        for (let frame = 0; frame < 119; frame++) { assert.equal(publish('hold', frame), null); assert.ok(state.system.runtime.instances[owner]); }
        assert.equal(publish('hold', 119), owner);
      }
      state = completeWebFooterClose(state, owner, ms(step));
      assert.equal(state.system.phase, 'home'); assert.equal(state.system.runtime.instances[owner], undefined);
      assert.equal(completeWebFooterClose(state, owner, ms(step)), state);
      for (const frame of reduced ? [20] : Array.from({length:21}, (_,i)=>i)) assert.equal(publish('in', frame), null);
      assert.equal(session.active(state, 2), true); publish('handoff', null);
      assert.equal(session.active(state, 2), false); prior = state; previousOwner = owner;
    }
    session.dispose();
  }
});

test(appId + ': late readiness, changed resources/owner/generation, stale receipts, sleep/stalls and disposal cannot retire Web', () => {
  const state = request(open()), owner = state.system.runtime.active, session = createWebFooterClosePresentation(), pair = {}, resources = {};
  assert.equal(webFooterCloseIdentity(state, 2).owner, owner);
  assert.equal(session.sample(state, 2, 0, false, false), undefined);
  const pose = session.sample(state, 2, 1000, true, false); assert.equal(pose.frame, 0); session.bind(pose, pair, resources);
  const replaced = request(open(completeWebFooterClose(state, owner, 4300)));
  for (const [s,g,eligible,p,r] of [[state,3,true,pair,resources],[replaced,2,true,pair,resources],[state,2,false,pair,resources],[state,2,true,{},resources],[state,2,true,pair,{}],[state,2,true,pair,undefined]])
    assert.equal(session.present(pose,s,g,1000,eligible,p,r),null);
  session.present(pose,state,2,1000,true,pair,resources);
  const stalled=session.sample(state,2,2000,true,false);assert.equal(stalled.frame,0);
  assert.equal(session.bind(stalled,pair,{}),false);
  const fresh=session.sample(state,2,2017,true,false);assert.equal(fresh.frame,0);session.bind(fresh,pair,resources);
  const sleeping={...state,system:{...state.system,sleeping:true}};
  assert.equal(notesFooterCloseEligible(sleeping),false);session.sample(sleeping,2,2034,false,false);
  assert.equal(session.present(fresh,state,2,2034,true,pair,resources),null);
  const resumed=session.sample(state,2,3000,true,true);assert.equal(resumed.frame,5);session.bind(resumed,pair,resources);session.revoke();
  assert.equal(session.present(resumed,state,2,3000,true,pair,resources),null);
  session.dispose();assert.equal(session.sample(state,2,3017,true,true),undefined);assert.ok(state.system.runtime.instances[owner]);
});
}
