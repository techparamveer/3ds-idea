import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createStockModule, initialSharedData } from '../src/os/stock-apps.ts';
import { getTitle } from '../src/os/app-registry.ts';

const pack = JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/settings/contents/0000-0000003d/base.json', import.meta.url)));
test('source two-control footer retains original Cancel and OK bounds', () => {
  assert.equal(pack.resourceSources.layouts.Base_D_01.sha256, '52134982abf8c89ec50635bf684220696718baeed8190f6ad81bdc28134e3ec3');
  const flatten = panes => panes.flatMap(p => [p, ...flatten(p.children)]);
  const panes = flatten(pack.layouts.Base_D_01.roots);
  for (const [name, x, origin] of [['Bounding_00', -160, 3], ['Bounding_01', 160, 5]]) {
    const pane = panes.find(p => p.name === name);
    assert.deepEqual(pane.translation, [x, -104, 0]);assert.deepEqual(pane.size, [120, 32]);assert.equal(pane.origin, origin);
  }
});
test('Settings Sound Cancel returns to its parent; modes and displayed OK stay inert', () => {
  const module = createStockModule(getTitle('system-settings'));
  const shared = initialSharedData(), before = structuredClone(shared), ctx = { now: 0, shared };
  let state = module.create({}, null, ctx);
  for (const id of ['other', 'settings-next', 'sound']) state = module.reduce(state, { type: 'action', id }, ctx).state;
  assert.equal(state.screen, 'detail');assert.equal(state.field, 'sound');
  const view = module.view(state, ctx);
  assert.deepEqual(view.footer.left, { label: 'Cancel', action: 'back' });
  assert.equal(view.footer.right, undefined);
  for (const event of [{type:'touch',phase:'up',x:260,y:224}, ...[46,102,158].map(y=>({type:'touch',phase:'up',x:160,y})), {type:'command',command:'a'}]) {
    const out = module.reduce(state, event, ctx);assert.equal(out.state, state);assert.equal(out.effects, undefined);
  }
  const out = module.reduce(state, {type:'touch',phase:'up',x:60,y:224}, ctx);
  assert.equal(out.state.screen, 'other');assert.equal(out.state.page, 1);assert.equal(out.effects, undefined);
  assert.deepEqual(shared, before);
});
