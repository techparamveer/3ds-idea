import test from 'node:test';
import assert from 'node:assert/strict';
import { createStockModule, initialSharedData } from '../src/os/stock-apps.ts';
import { getTitle } from '../src/os/app-registry.ts';
import { stockScreenTargets } from '../src/os/stock-screen-layout.ts';

// Explicit route ledger, independent of settingsChoices. This checks input
// wiring, not native pixels or the host's helper ownership/close sequences.
const menus = [
  { path: [], rows: ['internet', 'parental', 'data', 'other', 'nnid'] },
  { path: ['internet'], rows: ['connections', 'spotpass', 'ds-connections', 'internet-info'] },
  { path: ['internet', 'connections'], rows: ['connection-1', 'connection-2', 'connection-3', 'new-connection'] },
  { path: ['parental'], rows: ['next', 'back'] },
  { path: ['parental', 'next'], rows: ['next', 'back'] },
  { path: ['parental', 'next', 'next'], rows: ['back'] },
  { path: ['data'], rows: ['data-3ds', 'data-dsi', 'streetpass', 'blocked-users'] },
  { path: ['data', 'data-3ds'], rows: ['software', 'extra-data', 'add-on-content', 'backup'] },
  { path: ['other'], rows: ['profile', 'clock', 'touch'] },
  { path: ['other', 'settings-page-1'], rows: ['calibration-3d', 'sound', 'mic'] },
  { path: ['other', 'settings-page-2'], rows: ['outer-cameras', 'circle-pad', 'transfer'] },
  { path: ['other', 'settings-page-3'], rows: ['language', 'update', 'format'] },
  { path: ['other', 'profile'], rows: ['nickname', 'birthday', 'region', 'ds-profile'] },
  { path: ['other', 'clock'], rows: ['date', 'time'] },
];
const helperLaunches = { nnid: 'nnid-settings', transfer: 'system-transfer', update: 'system-updater' };
const submenuActions = new Set(['internet', 'parental', 'data', 'other', 'connections', 'data-3ds', 'profile', 'clock']);
const excludedInputs = [
  { type: 'text', value: 'Changed' },
  ...['connect', 'submit', 'confirm', 'delete', 'scan', 'change-pin', 'restrictions'].map(id => ({ type: 'action', id })),
  { type: 'command', command: 'open' },
];
function setup(id = 'system-settings', args = {}) {
  const module = createStockModule(getTitle(id));
  const context = { now: 0, shared: initialSharedData() };
  const initial = module.create(args, null, context);
  return { module, context, initial, send: (state, event) => module.reduce(state, event, context) };
}
const button = (app, state, command, source = 'pad') => app.send(state, { type: 'button', command, phase: 'down', source });
function tap(app, state, action) {
  const target = stockScreenTargets(app.module.view(state, app.context)).find(item => item.action === action);
  assert.ok(target, `${state.screen}/${action} must have an enabled touch target`);
  const point = { x: target.x + target.width / 2, y: target.y + target.height / 2, pointerId: 1 };
  const down = app.send(state, { type: 'touch', phase: 'down', ...point });
  assert.equal(down.effects, undefined);
  return app.send(down.state, { type: 'touch', phase: 'up', ...point });
}
function enter(app, path) {
  return path.reduce((state, action) => {
    const out = tap(app, state, action);
    assert.equal(out.effects, undefined);
    return out.state;
  }, app.initial);
}
// Follow real direction events, including the two tile menus; never inject a
// synthetic selection into state. Exhaustion is a route failure, not a skip.
function focus(app, state, action) {
  const pending = [state], seen = new Set();
  while (pending.length) {
    const current = pending.shift(), view = app.module.view(current, app.context);
    if (view.rows[view.selection]?.id === action) return current;
    if (seen.has(view.selection)) continue;
    seen.add(view.selection);
    // Left/Right on Other change page, while Up/Down select its three rows.
    for (const direction of current.screen === 'other' ? ['up', 'down'] : ['up', 'down', 'left', 'right']) {
      const out = button(app, current, direction);
      assert.equal(out.effects, undefined);
      pending.push(out.state);
    }
  }
  assert.fail(`${state.screen}/${action} is unreachable by directions`);
}

for (const { path, rows } of menus) test(`Settings route ledger: ${path.join(' → ') || 'main'} touch/A and leaf Back`, () => {
  const app = setup(), before = structuredClone(app.context.shared), menu = enter(app, path);
  assert.deepEqual(app.module.view(menu, app.context).rows.map(row => row.id), rows);
  for (const action of rows) {
    const selected = focus(app, menu, action);
    const touched = tap(app, menu, action);
    const row = app.module.view(menu, app.context).rows.find(item => item.id === action);
    if (row?.disabled) {
      // Empty blocked-user list: Reset stays on Data and binds Invalid. A and
      // touch both refuse the leaf; they may differ only in selectionActive.
      assert.equal(touched.state.screen, menu.screen);
      assert.equal(touched.state.field, undefined);
      for (const source of ['pad', 'keyboard:KeyA']) {
        const opened = button(app, selected, 'open', source);
        assert.equal(opened.state.screen, menu.screen);
        assert.equal(opened.state.field, undefined);
        assert.deepEqual(opened.effects ?? [], []);
        assert.deepEqual(app.send(selected, { type: 'button', command: 'open', phase: 'up', source }), { state: selected });
      }
      continue;
    }
    for (const source of ['pad', 'keyboard:KeyA']) {
      const opened = button(app, selected, 'open', source);
      // A helper retains its parent, including the directional focus pose.
      // Touch entry retains the unfocused pose; route and selection still agree.
      const expected = helperLaunches[action]
        ? { ...touched, state: { ...touched.state, selectionActive: selected.selectionActive } }
        : touched;
      assert.deepEqual(opened, expected, `${action}: touch and A reach the same route`);
      assert.deepEqual(app.send(selected, { type: 'button', command: 'open', phase: 'up', source }), { state: selected });
    }
    if (helperLaunches[action]) {
      assert.deepEqual(touched.effects, [{ type: 'launch', appId: helperLaunches[action] }]);
      assert.equal(touched.state.selection, rows.indexOf(action));
      continue; // Lifecycle owns child launch/return/close/switch sequences.
    }
    assert.equal(touched.effects, undefined);
    if (action === 'back') continue;
    if (submenuActions.has(action) || action === 'next') {
      assert.equal(touched.state.screen, action === 'next'
        ? menu.screen === 'parental' ? 'parental-explain' : 'parental-pin-notice'
        : action);
      continue;
    }
    const leaf = touched.state;
    assert.equal(leaf.screen, 'detail');
    assert.equal(leaf.field, action);
    assert.equal(leaf.parent, menu.screen);
    for (const event of excludedInputs) assert.deepEqual(app.send(leaf, event), { state: leaf }, `${action}: excluded operation`);
    const back = tap(app, leaf, 'back');
    assert.deepEqual(back, button(app, leaf, 'back'));
    assert.equal(back.effects, undefined);
    assert.equal(back.state.screen, menu.screen);
    assert.equal(back.state.selection, rows.indexOf(action), `${action}: Back restores its row`);
    if (menu.screen === 'other') assert.equal(back.state.page, menu.page);
    // A after Back must reopen the same leaf, including Internet slot 2/3.
    assert.deepEqual(button(app, back.state, 'open'), touched);
    assert.deepEqual(app.module.save(leaf), {});
  }
  assert.deepEqual(app.context.shared, before);
});

test('Parental notice touch dismisses locally; PIN and stale helper actions never become callers', () => {
  const app = setup(), notice = enter(app, ['parental', 'next', 'next']);
  const out = tap(app, notice, 'back');
  assert.equal(out.state.screen, 'parental-explain');
  assert.equal(out.state.selection, 0);
  assert.equal(out.effects, undefined);
  for (const path of [[], ['parental'], ['parental', 'next'], ['parental', 'next', 'next'], ['other', 'settings-page-2', 'circle-pad']]) {
    const state = enter(app, path);
    for (const id of ['restrictions', 'rating', 'change-pin', 'amiibo-settings', 'extrapad', 'mii-selector', 'error', 'transfer', 'update']) {
      assert.deepEqual(app.send(state, { type: 'action', id }), { state }, `${path.join('/')}/${id}`);
    }
  }
});

for (const topic of ['3d', 'general', 'usage']) test(`Health ${topic}: touch entry, scrolled Back and fresh re-entry`, () => {
  const app = setup('health-safety'), before = structuredClone(app.context.shared);
  const page = tap(app, app.initial, topic).state;
  const viaA = button(app, focus(app, app.initial, topic), 'open').state;
  assert.equal(viaA.screen, 'document');
  assert.equal(viaA.topic, topic);
  assert.deepEqual(viaA.scroll, page.scroll);
  const scrolled = app.send(app.send(page, { type: 'command', command: 'down' }).state, { type: 'tick', elapsedMs: 50 }).state;
  assert.ok(app.module.view(scrolled, app.context).data.article.paneY > 0);
  const back = tap(app, scrolled, 'back');
  assert.equal(back.effects, undefined);
  assert.equal(back.state.screen, 'main');
  assert.equal(back.state.scroll, undefined);
  assert.equal(back.state.backPress, undefined);
  assert.equal(back.state.selection, 0, 'current Health return resets the menu to row 0');
  assert.equal(button(app, scrolled, 'back').state.screen, 'main');
  const reopened = tap(app, back.state, topic).state;
  assert.deepEqual(app.module.view(reopened, app.context).data.article, { paneY: 0, thumbY: 77, selectFrame: 0 });
  assert.deepEqual(app.context.shared, before);
});

test('Settings Manual page Back reopens the first article; unsupported Contents rows have no action', () => {
  const app = setup('manual', { manualTitleId: '0004001000022000' });
  const page = tap(app, app.initial, 'manual-page-0').state;
  const back = tap(app, page, 'back');
  assert.equal(back.effects, undefined);
  assert.equal(back.state.screen, 'main');
  assert.equal(back.state.manualTitleId, '0004001000022000');
  assert.deepEqual(tap(app, back.state, 'manual-page-0').state, page);
  for (let index = 1; index < 32; index++) {
    assert.deepEqual(app.send(back.state, { type: 'action', id: `manual-page-${index}` }), { state: back.state });
  }
  for (const state of [app.initial, page]) {
    assert.deepEqual(app.send(state, { type: 'command', command: 'y' }), { state }, 'Language/Enlarge remains unsupported');
  }
  assert.deepEqual(tap(app, page, 'manual-close').effects, [{ type: 'close' }]);
});
