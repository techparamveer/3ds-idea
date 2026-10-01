import test from 'node:test';
import assert from 'node:assert/strict';
import { apps } from '../src/os/apps.ts';
import { getAppModule } from '../src/os/app-registry.ts';
import {
  activeInstance,
  closeApplication,
  createAppRuntime,
  dispatchRuntime,
  resumeRuntimeApplication,
  showRuntimeHome,
  startApplication,
} from '../src/os/app-host.ts';

const graph = [
  { feature: 'P-WORK', id: 'work', entries: [
    ['alora', 1, 0, 'link', 'https://www.paramveer.co.uk/experience/alora'],
    ['microsoft', 1, 0, 'link', 'https://www.paramveer.co.uk/experience/microsoft'],
    ['myucat', 2, 0, 'link', 'https://www.myucat.co.uk'],
    ['hackuk-work', 1, 0, 'launch', 'hackuk'],
  ] },
  { feature: 'P-PROJ', id: 'projects', entries: [
    ['ankicram', 2, 0, 'link', 'https://ankicram.com'],
    ['cognilink', 2, 0, 'link', 'https://cognilink.vercel.app'],
    ['renu', 2, 1, 'link', 'https://www.paramveer.co.uk/projects/renu'],
  ] },
  { feature: 'P-HOB', id: 'hobbies', entries: [
    ['buildings', 2, 3, 'link', 'https://pmvrsi.gumroad.com/'],
  ] },
  { feature: 'P-LIFE', id: 'life', entries: [
    ['keele', 1, 0, 'done'],
    ['hack-keele', 1, 0, 'done'],
    ['rws', 1, 0, 'done'],
    ['school', 1, 0, 'done'],
  ] },
  { feature: 'P-HACKUK', id: 'hackuk', entries: [
    ['mission', 2, 1, 'link', 'https://www.hackuk.network/'],
    ['leafhacks', 1, 0, 'link', 'https://www.hackuk.network/'],
    ['campfire', 1, 0, 'link', 'https://www.hackuk.network/'],
    ['counterspell', 1, 1, 'link', 'https://www.hackuk.network/'],
  ] },
  { feature: 'P-NVIDIA', id: 'nvidia', entries: [
    ['renu', 2, 1, 'link', 'https://www.paramveer.co.uk/projects/renu'],
  ] },
  { feature: 'P-ABOUT', id: 'about', entries: [
    ['intro', 2, 0, 'link', 'https://www.paramveer.co.uk/about'],
    ['stack', 1, 0, 'done'],
  ] },
  { feature: 'P-CONTACT', id: 'contact', entries: [
    ['email', 1, 0, 'link', 'mailto:hello@paramveer.co.uk'],
    ['book', 1, 0, 'link', 'https://cal.com/paramveersi'],
    ['github', 1, 0, 'link', 'https://github.com/techparamveer'],
    ['instagram', 1, 0, 'link', 'https://www.instagram.com/techparamveer/'],
    ['youtube', 1, 0, 'link', 'https://www.youtube.com/@techparamveer'],
    ['twitter', 1, 0, 'link', 'https://x.com/techparamveer'],
    ['tiktok', 1, 0, 'link', 'https://www.tiktok.com/@techparamveer'],
  ] },
];

const context = { now: 0, shared: createAppRuntime().shared };
const command = (module, state, value) => module.reduce(state, { type: 'command', command: value }, context);
const outbound = result => (result.effects ?? []).filter(effect => effect.type === 'link' || effect.type === 'launch');

function selectedState(module, index) {
  let state = module.create({}, null, context);
  for (let item = 0; item < index; item += 1) {
    const result = command(module, state, 'down');
    assert.deepEqual(outbound(result), [], `${module.descriptor.id} list Down from entry ${item} is inert`);
    state = result.state;
  }
  return state;
}

test('the eight portfolio modules expose the complete declared entry graph', () => {
  assert.deepEqual(apps.map(app => app.id), graph.map(app => app.id));
  for (const expected of graph) {
    const app = apps.find(candidate => candidate.id === expected.id);
    assert.ok(app, `${expected.feature} is registered`);
    assert.deepEqual(app.entries.map(entry => [
      entry.id,
      entry.pages.length,
      entry.images?.length ?? 0,
      entry.app ? 'launch' : entry.url ? 'link' : 'done',
      ...(entry.app || entry.url ? [entry.app ?? entry.url] : []),
    ]), expected.entries, `${expected.feature} content/action graph`);
  }
});

test('every entry opens; every page and photo is reachable and bounded; B resets detail state', () => {
  for (const expectedApp of graph) {
    const module = getAppModule(expectedApp.id);
    assert.ok(module, `${expectedApp.feature} module`);
    assert.deepEqual(
      module.view(module.create({}, null, context), context).rows.map(row => row.id),
      expectedApp.entries.map(([id]) => id),
      `${expectedApp.feature} entry rows`,
    );

    expectedApp.entries.forEach(([entryId, pageCount, photoCount, action, target], index) => {
      const label = `${expectedApp.feature}/${entryId}`;
      let state = selectedState(module, index);
      assert.equal(module.view(state, context).selection, index, `${label} selection`);

      let result = command(module, state, 'open');
      assert.deepEqual(outbound(result), [], `${label} entry activation is local`);
      state = result.state;
      assert.equal(state.detail, true, `${label} opens detail`);
      assert.deepEqual([state.page, state.photo], [0, 0], `${label} starts at first content`);

      result = command(module, state, 'up');
      assert.deepEqual([result.state.page, result.state.photo], [0, 0], `${label} page lower bound`);
      state = result.state;
      for (let page = 1; page < pageCount; page += 1) {
        result = command(module, state, 'down');
        assert.deepEqual(outbound(result), [], `${label} page navigation has no outbound action`);
        state = result.state;
        assert.equal(state.page, page, `${label} reaches page ${page}`);
      }
      state = command(module, state, 'down').state;
      assert.equal(state.page, pageCount - 1, `${label} page upper bound`);

      state = command(module, state, 'left').state;
      assert.equal(state.photo, 0, `${label} photo lower bound`);
      for (let photo = 1; photo < Math.max(1, photoCount); photo += 1) {
        result = command(module, state, 'right');
        assert.deepEqual(outbound(result), [], `${label} photo navigation has no outbound action`);
        state = result.state;
        assert.equal(state.photo, photo, `${label} reaches photo ${photo}`);
      }
      state = command(module, state, 'right').state;
      assert.equal(state.photo, Math.max(0, photoCount - 1), `${label} photo upper bound`);

      const returned = command(module, state, 'back');
      assert.deepEqual(outbound(returned), [], `${label} B does not emit an outbound action`);
      assert.deepEqual(
        { item: returned.state.item, detail: returned.state.detail, page: returned.state.page, photo: returned.state.photo },
        { item: index, detail: false, page: 0, photo: 0 },
        `${label} B returns to the same entry and resets content position`,
      );
      const home = command(module, returned.state, 'back');
      assert.deepEqual(home.effects, [{ type: 'home' }], `${label} second B requests HOME`);

      const explicit = command(module, state, 'open');
      if (action === 'done') {
        assert.equal(explicit.state.detail, false, `${label} Done returns to entries`);
        assert.deepEqual(outbound(explicit), [], `${label} Done stays local`);
      } else {
        assert.deepEqual(outbound(explicit), [{ type: action, [action === 'link' ? 'url' : 'appId']: target }], `${label} explicit activation emits its declared action`);
      }
    });
  }
});

test('list navigation and detail entry are inert until explicit link or launch activation', () => {
  for (const expectedApp of graph) {
    const module = getAppModule(expectedApp.id);
    expectedApp.entries.forEach(([entryId, , , action, target], index) => {
      const label = `${expectedApp.feature}/${entryId}`;
      const state = selectedState(module, index);
      for (const direction of ['up', 'down', 'left', 'right']) {
        const navigation = command(module, state, direction);
        assert.deepEqual(outbound(navigation), [], `${label} list ${direction} is inert`);
      }
      const detail = command(module, state, 'open');
      assert.deepEqual(outbound(detail), [], `${label} detail entry is inert`);
      if (action === 'link' || action === 'launch') {
        const effect = { type: action, [action === 'link' ? 'url' : 'appId']: target };
        assert.deepEqual(command(module, detail.state, 'open').effects, [effect], `${label} emits only on explicit activation`);
      }
    });
  }
});

test('live HOME resume preserves each app instance, while a fresh instance resets its route', () => {
  for (const expectedApp of graph) {
    let runtime = startApplication(createAppRuntime(), expectedApp.id, 0);
    const originalOwner = runtime.active;
    const lastIndex = expectedApp.entries.length - 1;
    for (let item = 0; item < lastIndex; item += 1) runtime = dispatchRuntime(runtime, { type: 'command', command: 'down' }, item + 1);
    runtime = dispatchRuntime(runtime, { type: 'command', command: 'open' }, 20);
    const liveState = structuredClone(activeInstance(runtime).state);
    assert.equal(liveState.detail, true, `${expectedApp.feature} entered detail before HOME`);

    runtime = showRuntimeHome(runtime, 30);
    assert.equal(runtime.active, null, `${expectedApp.feature} suspended at HOME`);
    assert.deepEqual(runtime.instances[originalOwner].state, liveState, `${expectedApp.feature} retained its live route while suspended`);
    runtime = resumeRuntimeApplication(runtime, 40);
    assert.equal(runtime.active, originalOwner, `${expectedApp.feature} resumed the same owner`);
    assert.deepEqual(activeInstance(runtime).state, liveState, `${expectedApp.feature} resumed the same route`);

    runtime = closeApplication(runtime, 50);
    runtime = startApplication(runtime, expectedApp.id, 60);
    assert.notEqual(runtime.active, originalOwner, `${expectedApp.feature} fresh launch uses a new owner`);
    assert.deepEqual(
      activeInstance(runtime).state,
      { item: 0, detail: false, page: 0, photo: 0 },
      `${expectedApp.feature} fresh launch resets navigation`,
    );
  }
});
