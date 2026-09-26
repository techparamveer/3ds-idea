import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import ts from 'typescript';
import { createStockModule, initialSharedData } from '../src/os/stock-apps.ts';
import { getTitle } from '../src/os/app-registry.ts';
import { manualContents, manualSources } from '../src/os/stock-manual-index.ts';

const root = resolve('public/os/firmware/10.7.0-32E'), settings = '0004001000022000';
const json = path => JSON.parse(readFileSync(join(root, path), 'utf8'));
const manifest = json('manifest.json'), source = manualSources[settings], pack = json(source.url);
const ctx = { now: 0, shared: initialSharedData() };
const moduleUrl = text => 'data:text/javascript;base64,' + Buffer.from(text).toString('base64');
const transpile = (name, overrides = {}) => {
  const url = new URL(`../src/os/${name}.ts`, import.meta.url);
  const { outputText } = ts.transpileModule(readFileSync(url, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
  return moduleUrl(outputText.replace(/(from\s*['"])(\.[^'"]+?)(\.ts)?(['"])/g, (_all, prefix, path, _ext, suffix) => prefix + (overrides[path] ?? new URL(`${path}.ts`, url).href) + suffix));
};
const empty = moduleUrl('export const drawNativeAmiibo=()=>false;export const amiiboScreenPacks=[];');
const helpers = await import(transpile('stock-native-helpers', { './stock-native-amiibo': empty, './native-layout': moduleUrl('export const nativeMessageOverride=()=>({});export const nativePaneParentPath=()=>null;export const nativeTextMetrics=()=>null;') }));

test('Settings manual source is the delivered content-1 pack with its SMDH heading', () => {
  const title = manifest.titles[settings];
  assert.ok(title.packs.includes(source.url), 'the application, not the applet, lists its manual');
  assert.equal(manifest.titles['0004003000009b02'].packs.includes(source.url), false);
  assert.equal(pack.titleId, settings);
  assert.equal(pack.contentIndex, source.contentIndex);
  assert.equal(pack.contentId, source.contentId);
  assert.equal(pack.resourceSources.layouts.Index.path, 'Manual.bcma/EUR_en_index.arc/blyt/Index.bclyt');
  assert.equal(pack.manualSelection.language, 'en');
  assert.equal(pack.manualSelection.region, 'EUR');
  assert.equal(source.heading, title.longDescription);
  assert.equal(title.longDescriptionSource.titleId, settings);
  assert.equal(title.longDescriptionSource.path, 'ExeFS/icon');
});

test('Contents order, numbers and category bands come from Index user metadata', () => {
  const entries = manualContents(pack.layouts.Index);
  assert.deepEqual(entries.slice(0, 4), [
    { kind: 'page', page: 0, title: 'Important Information', category: 0 },
    { kind: 'category', category: 1, title: 'Getting Started' },
    { kind: 'page', page: 1, title: 'Using the System Settings', category: 1 },
    { kind: 'category', category: 2, title: 'Nintendo Network ID' },
  ]);
  const pages = entries.filter(entry => entry.kind === 'page');
  assert.deepEqual(pages.map(entry => entry.page), Array.from({ length: 32 }, (_, page) => page));
  // Category_000 (__CATEGORY_INVALID__, IsValid 0) contributes page 0 without a band.
  assert.deepEqual(entries.filter(entry => entry.kind === 'category').map(entry => entry.title),
    ['Getting Started', 'Nintendo Network ID', 'Internet Settings', 'Parental Controls', 'Data Management', 'Other Settings']);
});

test('malformed Index metadata fails instead of inventing contents', () => {
  const mutate = edit => { const layout = structuredClone(pack.layouts.Index); edit(layout.roots[0].children); return () => manualContents(layout); };
  const pane = (panes, name) => panes.find(item => item.name === name);
  const meta = (panes, name, key) => pane(panes, name).metadata.find(item => item.name === key);
  assert.throws(mutate(panes => { meta(panes, 'Category_001', 'PageID_000').value = [2]; }), /page order/);
  assert.throws(mutate(panes => { meta(panes, 'MetaData', 'PageNum').value = [33]; }), /Missing manual index text/);
  assert.throws(mutate(panes => { meta(panes, 'Category_006', 'CategoryPageNum').value = [6]; }), /omits pages/);
  assert.throws(mutate(panes => { pane(panes, 'PageTitle_004').text.value = ''; }), /Missing manual index text/);
  assert.throws(mutate(panes => { meta(panes, 'Category_000', 'IsValid').value = [2]; }), /IsValid/);
});

test('the manual applet enters Settings Contents only through an explicit argument', () => {
  const module = createStockModule(getTitle('manual'));
  const guide = module.view(module.create({}, null, ctx), ctx);
  assert.equal(guide.heading, 'Instruction Manual');
  assert.deepEqual(guide.rows.map(row => row.id), ['contents', 'controls', 'support'], 'portfolio guide is unchanged');
  const state = module.create({ manualTitleId: '0004001000022000' }, null, ctx), view = module.view(state, ctx);
  assert.equal(view.heading, 'System Settings');
  assert.equal(view.data.manualTitleId, settings);
  assert.deepEqual(view.rows, []);
  assert.deepEqual(view.text, [], 'no guide text is mixed into the source manual');
  assert.deepEqual(module.reduce(state, { type: 'command', command: 'open' }, ctx).state, state);
  assert.deepEqual(module.reduce(state, { type: 'action', id: 'back' }, ctx).effects, [{ type: 'close' }]);
  assert.equal(module.create({ manualTitleId: 'not-a-title' }, null, ctx).manualTitleId, undefined);
});

test('Settings Contents loads source chrome, lets Close act, and leaves unfinished controls inert', () => {
  const view = { appId: 'manual', screen: 'main', heading: 'System Settings', rows: [], selection: 0, footer: { left: { action: 'back', label: 'Back' } }, data: { manualTitleId: settings } };
  const request = helpers.nativeHelperView(view);
  assert.equal(request.titleId, '0004003000009b02');
  const index = request.packs.find(item => item.alias === 'manual-index');
  assert.deepEqual(index, { url: source.url, alias: 'manual-index', layouts: ['Index'], animations: [], titleId: settings });
  for (const item of request.packs.filter(item => item !== index)) assert.ok(manifest.titles['0004003000009b02'].packs.includes(item.url));
  assert.equal(request.packs.some(item => /BtnClose00|BtnBack00|PageNum|PageBg00/.test(item.url)), false, 'no substitute footer or page chrome');
  assert.deepEqual(helpers.nativeHelperTargets(view), [{ action: 'back', x: 0, y: 212, width: 160, height: 28 }]);
  const module = createStockModule(getTitle('manual'));
  const state = module.create({ manualTitleId: settings }, null, ctx);
  assert.deepEqual(module.reduce(state, { type: 'action', id: 'back' }, ctx).effects, [{ type: 'close' }]);
  const unknown = helpers.nativeHelperView({ ...view, data: { manualTitleId: '0004001000022300' } });
  assert.equal(manifest.titles['0004001000022300'].packs.includes(unknown.packs.at(-1).url), false, 'an undelivered manual fails to load');
  assert.equal(helpers.APPLICATION_MANUAL_HEADER_CENTRE[1], -22);
});

test('only the Settings HOME route supplies a manual title argument', () => {
  const files = readdirSync(resolve('src'), { recursive: true }).filter(file => /\.(ts|tsx)$/.test(file));
  const users = files.filter(file => readFileSync(resolve('src', file), 'utf8').includes('manualTitleId')).sort();
  assert.deepEqual(users, ['os/stock-apps.ts', 'os/stock-helper-views.ts', 'os/stock-native-helpers.ts', 'os/system.ts']);
});
