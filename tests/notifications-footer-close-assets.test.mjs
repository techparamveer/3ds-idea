import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { nativePaneParentPath, poseNativeLayout } from '../src/os/native-layout.ts';
import { notificationsFooterCoverBindings, validateNotificationsFooterCoverAssets, validateNotificationsFooterFeedbackAssets } from '../src/os/notifications-footer-close-assets.ts';

const root = new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root)));
const news = read('packs/notifications/news.json'), common = read('packs/home/common.json');
const sourceUrl = new URL('../src/os/stock-native-personal-tools.ts', import.meta.url);
const compiled = ts.transpileModule(readFileSync(sourceUrl, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  .replace(/(from\s*['"])(\.[^'"]+)(['"])/g, (_all, prefix, path, suffix) => prefix + new URL(path.endsWith('.ts') ? path : `${path}.ts`, sourceUrl).href + suffix);
const tools = await import('data:text/javascript;base64,' + Buffer.from(compiled + '\n//# sourceURL=notifications-footer-close-assets-fixture.js').toString('base64'));

test('delivered forward HOME cover is fitted independently of Notes or candidate Notifications title exits', () => {
  validateNotificationsFooterFeedbackAssets(news); validateNotificationsFooterCoverAssets(common);
  for (const kind of ['out', 'in']) for (const frame of [0, 5, 20]) {
    const bindings = notificationsFooterCoverBindings(kind, frame);
    assert.deepEqual(bindings.upper, [{ name: 'CmnFade_U_00_' + (kind === 'out' ? 'SceneOut' : 'SceneIn'), frame }]);
    const lower = poseNativeLayout(common.layouts.CmnFade_D_00, common.animations, bindings.lower);
    const pane = name => nativePaneParentPath(lower, name).at(-1);
    if (frame === 0 || frame === 20) {
      assert.equal(pane('P_Bg_D_00').alpha, kind === 'out' ? frame ? 255 : 0 : frame ? 0 : 255);
      assert.equal(pane('P_Belt_00').translation[0], kind === 'out' ? frame ? 0 : 80 : frame ? -80 : 0);
    }
    const material = lower.materials[pane('P_Aplt_00').picture.material];
    assert.equal(lower.textures[material.textureMaps[0].texture], 'LncApltPictHome_00.bclim');
    assert.deepEqual(material.bufferColor.slice(0, 3), [160, 160, 160]);
  }
  for (const frame of [-1, 21, .5, NaN]) assert.throws(() => notificationsFooterCoverBindings('out', frame), /Invalid/);
  const missing = structuredClone(common); delete missing.animations.CmnFade_U_00_SceneOut;
  assert.throws(() => validateNotificationsFooterCoverAssets(missing), /Unsupported|unsupported/);
  const unsupported = structuredClone(news); unsupported.animations.NewsTopBtn_D_00_Decide.unsupported.push('unknown');
  assert.throws(() => validateNotificationsFooterFeedbackAssets(unsupported), /Unsupported/);
  const absentFeedback = structuredClone(news); delete absentFeedback.animations.NewsTopBtn_D_00_Decide;
  assert.throws(() => validateNotificationsFooterFeedbackAssets(absentFeedback), /Unsupported/);
});

test('actual Notifications painter preserves the list/unread/HUD and uses only its own white footer confirmation', () => {
  const view = { appId: 'notifications', screen: 'main', selection: 0, rows: Array.from({ length: 9 }, (_, i) => ({ id: String(i), label: `Notification ${i}`, value: 'New' })) };
  const requests = tools.nativePersonalToolView(view).packs;
  const packs = Object.fromEntries(requests.map(request => [request.alias, read(request.url)]));
  const requested = requests.find(request => request.alias === 'notifications').animations;
  assert.ok(requested.includes('NewsTopBtn_D_00_Decide'));
  assert.equal(requested.includes('NewsTopBtn_D_00_SceneOut'), false);
  assert.equal(requested.includes('NewsUnread_U_00_SceneOut'), false);
  const calls = [], top = {}, bottom = {};
  const renderer = { packs, draw(ctx, alias, name, options = {}) {
    const pack = packs[alias], layout = poseNativeLayout(pack.layouts[name], pack.animations, options.bindings ?? [], options.overrides);
    calls.push({ ctx, alias, name, options, layout }); return true;
  } };
  assert.equal(tools.drawNativePersonalToolFrame(renderer, top, bottom, view, { date: new Date(0) }), true);
  const ordinary = calls.splice(0);
  assert.equal(tools.drawNativePersonalToolFrame(renderer, top, bottom, view, { date: new Date(0), notificationsFooterClose: { frame: 20 } }), true);
  const retained = calls => calls.filter(call => call.name !== 'NewsTopBtn_D_00').map(({ ctx, alias, name, layout }) => ({ ctx, alias, name, layout }));
  assert.deepEqual(retained(calls), retained(ordinary));
  assert.equal(calls.some(call => call.alias.startsWith('notes-')), false);
  const footer = calls.find(call => call.name === 'NewsTopBtn_D_00'), pane = nativePaneParentPath(footer.layout, 'P_Btn_00').at(-1);
  assert.deepEqual(footer.layout.materials[pane.picture.material].constantColors[0], [255, 255, 250, 255]);
  assert.deepEqual(footer.options.bindings, [{ name: 'NewsTopBtn_D_00_SceneIn', frame: 20 }, { name: 'NewsTopBtn_D_00_Decide', frame: 5, groups: ['G_BtnEnd_00'] }]);
  for (const frame of [-1, 21, NaN]) assert.throws(() => tools.drawNativePersonalToolFrame(renderer, top, bottom, view, { notificationsFooterClose: { frame } }), /Invalid/);
});
