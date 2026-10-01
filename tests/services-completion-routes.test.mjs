import test from 'node:test';
import assert from 'node:assert/strict';
import { createStockModule, initialSharedData } from '../src/os/stock-apps.ts';
import { getTitle, homeTitles } from '../src/os/app-registry.ts';
import { stockScreenTargets } from '../src/os/stock-screen-layout.ts';

// Module/input contracts only. Source-render/native capture gaps are recorded in
// docs/workstream-handoffs/services.md; these tests do not establish native UI.
function fixture(id) {
  const context = { now: 0, shared: initialSharedData() };
  context.shared.browser = {
    bookmarks: [
      { title: 'First fixture', url: 'https://first.example.invalid/' },
      { title: 'Second fixture', url: 'https://second.example.invalid/' },
    ],
    history: [{ title: 'Earlier fixture', url: 'https://earlier.example.invalid/' }],
  };
  const module = createStockModule(getTitle(id));
  const state = module.create({}, { url: 'https://saved.example.invalid/' }, context);
  return {
    module, state, context,
    view: state => module.view(state, context),
    reduce: (state, event) => module.reduce(state, event, context),
  };
}
const command = command => ({ type: 'command', command });
const button = command => ({ type: 'button', command, phase: 'down', source: 'pad' });
const action = id => ({ type: 'action', id });
function touch(f, state, id) {
  const target = stockScreenTargets(f.view(state)).find(target => target.action === id);
  assert.ok(target, `missing shared touch target: ${id}`);
  return { type: 'touch', phase: 'up', x: target.x + target.width / 2, y: target.y + target.height / 2 };
}
function local(f, state, event) {
  const before = structuredClone(state), shared = structuredClone(f.context.shared);
  const out = f.reduce(state, event);
  assert.deepEqual(out.effects ?? [], [], 'local navigation must not emit effects');
  assert.deepEqual(state, before, 'reducer must not mutate its input');
  assert.deepEqual(f.context.shared, shared, 'local navigation must not modify saved data');
  return out.state;
}
function focus(f, state, index) {
  for (let i = 0; i < index; i++) state = local(f, state, command('down'));
  assert.equal(f.view(state).selection, index);
  return state;
}

test('Browser start destinations agree across semantic, button and shared touch inputs; Back restores focus', () => {
  const f = fixture('browser');
  for (const [index, row] of f.view(f.state).rows.entries()) {
    const selected = focus(f, f.state, index);
    const expected = local(f, selected, action(row.id));
    assert.equal(expected.screen, row.id);
    for (const event of [command('open'), button('open'), touch(f, selected, row.id)]) {
      const opened = local(f, selected, event);
      assert.deepEqual(opened, expected);
      for (const back of [command('back'), button('back'), touch(f, opened, 'back')]) {
        const returned = local(f, opened, back);
        assert.equal(returned.screen, 'main');
        assert.equal(returned.selection, index);
        assert.equal(returned.url, f.state.url);
      }
    }
  }
});

test('Browser settings traverse both pages by input and return through the selected immediate parent', () => {
  const f = fixture('browser');
  const settings = local(f, f.state, touch(f, f.state, 'settings'));
  for (const [index, row] of f.view(settings).rows.entries()) {
    const selected = focus(f, settings, index);
    assert.equal(f.view(selected).data.page, Math.floor(index / 4));
    const expected = local(f, selected, action(row.id));
    for (const event of [command('open'), button('open'), touch(f, selected, row.id)]) {
      const detail = local(f, selected, event);
      assert.deepEqual(detail, expected);
      assert.equal(detail.screen, 'detail');
      assert.equal(detail.field, row.id);
      const returned = local(f, detail, touch(f, detail, 'back'));
      assert.equal(returned.screen, 'settings');
      assert.equal(returned.selection, index);
      assert.equal(f.view(returned).data.page, Math.floor(index / 4));
      const main = local(f, returned, button('back'));
      assert.equal(main.screen, 'main');
      assert.equal(f.view(main).rows[main.selection].id, 'settings');
    }
  }
});

test('Browser saved bookmark roundtrip is reachable from start and never loads or changes the saved address', () => {
  const f = fixture('browser');
  const bookmarks = local(f, f.state, touch(f, f.state, 'bookmarks'));
  const selected = focus(f, bookmarks, 1);
  const page = local(f, selected, button('open'));
  assert.deepEqual(page, local(f, selected, touch(f, selected, '1')));
  assert.equal(page.screen, 'page');
  assert.deepEqual(f.view(page).data.entry, f.context.shared.browser.bookmarks[1]);
  const savedBefore = f.module.save(f.state);
  for (const event of [
    action('submit'), action('bookmark'), action('delete'), action('address'),
    { type: 'text', value: 'https://changed.example.invalid/' },
    { type: 'applet-result', requestId: 'address', value: 'changed', cancelled: false },
  ]) assert.deepEqual(local(f, page, event), page);
  assert.deepEqual(f.module.save(page), savedBefore);
  const returned = local(f, page, button('back'));
  assert.equal(returned.screen, 'bookmarks');
  assert.equal(returned.selection, 1);
  const main = local(f, returned, touch(f, returned, 'back'));
  assert.equal(main.screen, 'main');
  assert.equal(f.view(main).rows[main.selection].id, 'bookmarks');
});

test('Zone carries each chosen route through shared input and returns locally before HOME', () => {
  const f = fixture('nintendo-zone');
  for (const [index, id] of ['scan', 'information'].entries()) {
    const selected = focus(f, f.state, index);
    for (const event of [action(id), command('open'), button('open'), touch(f, selected, id)]) {
      const detail = local(f, selected, event);
      assert.equal(detail.screen, 'detail');
      assert.equal(f.view(detail).data.field, id, 'retain route identity for a future source-backed painter');
      // Do not assert equal Search/Info pixels: drawZone currently ignores field.
      for (const back of [button('back'), touch(f, detail, 'back')]) {
        const main = local(f, detail, back);
        assert.equal(main.screen, 'main');
        assert.deepEqual(f.reduce(main, button('back')).effects, [{ type: 'home' }]);
      }
      for (const stale of ['scan', 'information', 'connect', 'submit']) {
        assert.deepEqual(local(f, detail, action(stale)), detail);
      }
    }
  }
});

test('Miiverse toolbar input stays local and Back reaches its root before closing', () => {
  const f = fixture('miiverse');
  for (const [index, row] of f.view(f.state).rows.entries()) {
    const selected = focus(f, f.state, index);
    const detail = local(f, selected, touch(f, selected, row.id));
    assert.deepEqual(detail, local(f, selected, button('open')));
    assert.equal(detail.field, row.id);
    for (const id of ['post', 'sign-in', 'create-account', 'submit']) {
      assert.deepEqual(local(f, detail, action(id)), detail);
    }
    const main = local(f, detail, touch(f, detail, 'back'));
    assert.equal(main.screen, 'main');
    assert.deepEqual(f.reduce(main, button('back')).effects, [{ type: 'close' }]);
  }
});

test('service roots emit only HOME or close on Back; internal service helpers gain no HOME entry', () => {
  for (const [id, effect] of [
    ['eshop', 'home'], ['nintendo-zone', 'home'], ['browser', 'close'],
    ['miiverse', 'close'], ['mint', 'close'], ['miiverse-post', 'close'],
  ]) {
    const f = fixture(id), shared = structuredClone(f.context.shared);
    const events = [action('back'), command('back'), button('back')];
    if (['nintendo-zone', 'browser', 'miiverse'].includes(id)) events.push(touch(f, f.state, 'back'));
    for (const event of events) {
      assert.deepEqual(f.reduce(f.state, event), { state: f.state, effects: [{ type: effect }] });
    }
    assert.deepEqual(f.context.shared, shared);
    if (id === 'mint' || id === 'miiverse-post') {
      assert.equal(f.module.descriptor.home, false);
      assert.equal(homeTitles.some(title => title.id === id), false);
      // Direct module construction tests only the boundary, not a production caller.
    }
  }
});
