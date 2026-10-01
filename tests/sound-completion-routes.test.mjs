import test from 'node:test';
import assert from 'node:assert/strict';
import {
  acknowledgeEffects,
  activeInstance,
  closeApplication,
  createAppRuntime,
  dispatchRuntime,
  resumeRuntimeApplication,
  runtimeView,
  setRuntimeSleeping,
  showRuntimeHome,
  startApplication,
} from '../src/os/app-host.ts';
import {getAppModule, getTitle} from '../src/os/app-registry.ts';
import {portfolioMedia} from '../src/os/portfolio-media.ts';
import {createStockModule} from '../src/os/stock-apps.ts';

const syntheticMedia = Object.freeze({
  folders: Object.freeze([]),
  // Test metadata only. The fake effect sink below never creates an Audio object,
  // opens these URLs, fetches a file, or produces audio output.
  tracks: Object.freeze([
    Object.freeze({id: 'alpha', title: 'Synthetic Alpha', artist: 'Fixture', src: '/not-loaded/synthetic-alpha.mp3', duration: 90}),
    Object.freeze({id: 'beta', title: 'Synthetic Beta', artist: 'Fixture', src: '/not-loaded/synthetic-beta.mp3', duration: 120}),
    Object.freeze({id: 'gamma', title: 'Synthetic Gamma', artist: 'Fixture', src: '/not-loaded/synthetic-gamma.mp3', duration: 150}),
  ]),
});

function fakeEffects(runtime, received) {
  const queued = runtime.effects;
  received.push(...queued.map(item => ({owner: item.owner, effect: structuredClone(item.effect)})));
  return acknowledgeEffects(runtime, queued.map(item => item.id));
}

function syntheticHarness() {
  let runtime = startApplication(createAppRuntime(), 'sound', 0), now = 0;
  const received = [];
  const drain = () => {
    const offset = received.length;
    runtime = fakeEffects(runtime, received);
    return received.slice(offset);
  };
  const action = (id, value) => {
    runtime = dispatchRuntime(runtime, {type: 'action', id, ...(value === undefined ? {} : {value})}, ++now);
    return drain();
  };
  const event = value => {
    runtime = dispatchRuntime(runtime, value, ++now);
    return drain();
  };
  return {
    get runtime() { return runtime; },
    set runtime(value) { runtime = value; },
    get now() { return now; },
    nextTime() { return ++now; },
    get state() { return activeInstance(runtime)?.state; },
    received,
    drain,
    action,
    event,
  };
}

const music = effects => effects.filter(item => item.effect.type === 'music').map(item => item.effect);

test('the production-empty Sound route exposes only the three-page guide and inert empty entry', () => {
  assert.deepEqual(portfolioMedia.tracks, [], 'production must not acquire fixture songs');
  let runtime = startApplication(createAppRuntime(), 'sound', 0);
  const owner = runtime.active;
  assert.deepEqual([runtimeView(runtime).screen, runtimeView(runtime).data.guidePage], ['guide', 0]);

  runtime = dispatchRuntime(runtime, {type: 'command', command: 'open'}, 1);
  assert.equal(runtimeView(runtime).data.guidePage, 1);
  runtime = dispatchRuntime(runtime, {type: 'command', command: 'back'}, 2);
  assert.equal(runtimeView(runtime).data.guidePage, 0);
  runtime = dispatchRuntime(runtime, {type: 'command', command: 'open'}, 3);
  runtime = dispatchRuntime(runtime, {type: 'command', command: 'open'}, 4);
  assert.deepEqual(runtimeView(runtime).footer, {
    left: {label: 'Back', action: 'back'}, right: {label: 'OK', action: 'guide-next'},
  });
  runtime = dispatchRuntime(runtime, {type: 'command', command: 'back'}, 5);
  assert.equal(runtimeView(runtime).data.guidePage, 1);
  runtime = dispatchRuntime(runtime, {type: 'command', command: 'open'}, 6);
  runtime = dispatchRuntime(runtime, {type: 'command', command: 'open'}, 7);

  const empty = runtimeView(runtime);
  assert.equal(empty.screen, 'main');
  assert.deepEqual(empty.rows, []);
  assert.deepEqual(empty.text, ['No songs available.']);
  assert.deepEqual(empty.footer, {}, 'empty entry offers no invented playback or Back action');
  assert.equal(dispatchRuntime(runtime, {type: 'command', command: 'back'}, 8), runtime, 'root B is inert; HOME owns exit');

  runtime = closeApplication(runtime, 9);
  runtime = startApplication(runtime, 'sound', 10);
  assert.notEqual(runtime.active, owner);
  assert.deepEqual([runtimeView(runtime).screen, runtimeView(runtime).data.guidePage], ['guide', 0], 'fresh instances repeat Welcome until a native seen-state contract exists');
});

test('synthetic supplied-song routes cover transport and owner lifecycle without playback', async t => {
  const registered = getAppModule('sound');
  const original = {...registered};
  Object.assign(registered, createStockModule(getTitle('sound'), syntheticMedia));
  t.after(() => Object.assign(registered, original));

  await t.test('selection, queue, bounded seek, loop modes, and error dismissal stay on the host route', () => {
    const h = syntheticHarness();
    assert.equal(runtimeView(h.runtime).screen, 'main');
    assert.deepEqual(runtimeView(h.runtime).rows.map(row => row.id), ['track:alpha', 'track:beta', 'track:gamma']);

    let effects = music(h.action('track:alpha'));
    assert.deepEqual(effects.map(effect => effect.command), ['load', 'play']);
    assert.deepEqual(effects.map(effect => [effect.trackId, effect.revision, effect.position]), [['alpha', 1, 0], ['alpha', 1, 0]]);

    effects = music(h.action('previous'));
    assert.equal(h.state.trackId, 'gamma');
    assert.deepEqual(effects.map(effect => [effect.command, effect.trackId]), [['load', 'gamma'], ['play', 'gamma']]);
    effects = music(h.action('next'));
    assert.equal(h.state.trackId, 'alpha');
    assert.deepEqual(effects.map(effect => [effect.command, effect.trackId]), [['load', 'alpha'], ['play', 'alpha']]);

    assert.equal(h.action('seek', -50)[0].effect.position, 0);
    assert.equal(h.state.position, 0);
    assert.equal(h.action('seek', 999)[0].effect.position, 90);
    assert.equal(h.state.position, 90);

    const modes = [];
    for (let index = 0; index < 5; index++) {
      modes.push([h.state.repeat, h.state.shuffle, runtimeView(h.runtime).rows.find(row => row.id === 'mode').value]);
      assert.deepEqual(h.action('mode'), []);
    }
    assert.deepEqual(modes, [
      ['off', false, 'no-loop'],
      ['all', false, 'folder'],
      ['one', false, 'single'],
      ['off', true, 'random'],
      ['off', false, 'no-loop'],
    ]);

    const current = h.state;
    effects = music(h.action('music-error', {trackId: current.trackId, revision: current.revision}));
    assert.deepEqual(effects.map(effect => effect.command), ['pause']);
    assert.equal(h.state.mediaError, true);
    assert.equal(h.state.playing, false);
    const blocked = h.state;
    assert.deepEqual(h.action('next'), []);
    assert.equal(h.state, blocked, 'the modal blocks transport');

    assert.deepEqual(h.event({type: 'button', command: 'open', phase: 'down', source: 'test-pad'}), []);
    assert.equal(h.state.mediaError, false, 'A/OK dismisses the dialog');
    effects = music(h.action('play'));
    assert.deepEqual(effects.map(effect => effect.command), ['load', 'play']);
    assert.equal(h.state.playing, true, 'only the user Play action resumes after the error');

    const resumed = h.state;
    h.action('music-error', {trackId: resumed.trackId, revision: resumed.revision});
    assert.equal(h.state.mediaError, true);
    assert.deepEqual(h.event({type: 'button', command: 'back', phase: 'down', source: 'test-pad'}), []);
    assert.equal(h.state.mediaError, false, 'B dismisses the dialog without leaving playback');
    assert.equal(h.state.screen, 'playback');
  });

  await t.test('HOME, sleep, and close pause; resume is explicit; a new instance resets transport', () => {
    const h = syntheticHarness();
    h.action('track:beta');
    const selected = h.state;
    h.action('music-time', {trackId: selected.trackId, revision: selected.revision, position: 41, duration: 120});
    const owner = h.runtime.active;

    h.runtime = showRuntimeHome(h.runtime, h.nextTime());
    let effects = h.drain();
    assert.deepEqual(music(effects).map(effect => effect.command), ['pause']);
    assert.equal(h.runtime.instances[owner].state.position, 41);
    assert.equal(h.runtime.instances[owner].state.playing, false);

    h.runtime = resumeRuntimeApplication(h.runtime, h.nextTime());
    assert.deepEqual(h.drain(), []);
    assert.equal(h.state.playing, false, 'HOME return does not auto-resume');
    effects = h.action('play');
    assert.deepEqual(music(effects).map(effect => [effect.command, effect.position]), [['play', 41]]);

    h.runtime = setRuntimeSleeping(h.runtime, true, h.nextTime());
    effects = h.drain();
    assert.deepEqual(music(effects).map(effect => effect.command), ['pause']);
    assert.equal(h.state.playing, false);
    h.runtime = setRuntimeSleeping(h.runtime, false, h.nextTime());
    assert.deepEqual(h.drain(), []);
    assert.equal(h.state.playing, false, 'wake does not auto-resume');
    assert.deepEqual(music(h.action('play')).map(effect => [effect.command, effect.position]), [['play', 41]]);

    h.runtime = closeApplication(h.runtime, h.nextTime());
    effects = h.drain();
    assert.deepEqual(music(effects).map(effect => effect.command), ['pause']);
    assert.deepEqual(h.runtime.instances, {});

    h.runtime = startApplication(h.runtime, 'sound', h.nextTime());
    assert.notEqual(h.runtime.active, owner);
    assert.deepEqual(h.state, {
      screen: 'main', selection: 0, trackId: '', playing: false, position: 0,
      duration: 0, repeat: 'off', shuffle: false, revision: 0, guidePage: 0,
    });
    assert.deepEqual(h.drain(), []);
  });
});
