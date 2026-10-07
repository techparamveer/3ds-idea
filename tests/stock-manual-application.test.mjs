import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
import ts from 'typescript';
import { createStockModule, initialSharedData } from '../src/os/stock-apps.ts';
import { getTitle } from '../src/os/app-registry.ts';
import { manualContents, manualSources } from '../src/os/stock-manual-index.ts';

const root = resolve('public/os/firmware/10.7.0-32E'), settings = '0004001000022000', camera = '0004001000022400', browser = '0004003000009d02';
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
const nativeLayoutStub = moduleUrl(`
  export {poseNativeLayout} from ${JSON.stringify(new URL('../src/os/native-layout.ts',import.meta.url).href)};
  export const nativeMessageOverride=()=>({});
  export const nativePaneParentPath=(layout,name)=>{
    let found=null;
    const visit=(panes,path=[])=>{for(const pane of panes??[]){const next=[...path,pane];if(pane.name===name){found=next;return;}visit(pane.children,next);if(found)return;}};
    visit(layout?.roots);return found;
  };
  export const nativeTextMetrics=()=>null;
`);
const helpers = await import(transpile('stock-native-helpers', { './stock-native-amiibo': empty, './native-layout': nativeLayoutStub }));

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

test('Camera manual source is its delivered content-1 English index', () => {
  const cameraSource = manualSources[camera], cameraPack = json(cameraSource.url), title = manifest.titles[camera];
  assert.ok(title.packs.includes(cameraSource.url));
  assert.equal(cameraPack.titleId, camera);
  assert.equal(cameraPack.contentIndex, 1);
  assert.equal(cameraPack.contentId, '00000019');
  assert.deepEqual(Object.keys(cameraPack.layouts), ['Index']);
  assert.deepEqual(cameraPack.manualSelection.pages, []);
  assert.equal(cameraPack.resourceSources.layouts.Index.path, 'Manual.bcma/EUR_en_index.arc/blyt/Index.bclyt');
  assert.equal(cameraSource.heading, title.longDescription);
  assert.equal(cameraSource.iconUrl, '/os/firmware/10.7.0-32E/icons/camera.png');
  const entries = manualContents(cameraPack.layouts.Index);
  assert.equal(entries.filter(entry => entry.kind === 'page').length, 15);
  assert.deepEqual(entries.slice(0, 4), [
    { kind: 'page', page: 0, title: 'Health & Safety', category: 0 },
    { kind: 'category', category: 1, title: 'Basic Information' },
    { kind: 'page', page: 1, title: 'Introduction', category: 1 },
    { kind: 'category', category: 2, title: 'Taking Photos and Videos' },
  ]);
});

test('Browser manual source delivers its application-owned English index and page zero', () => {
  const browserSource = manualSources[browser], browserPack = json(browserSource.url), title = manifest.titles[browser];
  assert.ok(title.packs.includes(browserSource.url));
  assert.ok(title.packs.includes(browserSource.neighborUrl));
  assert.equal(browserPack.titleId, browser);
  assert.equal(browserPack.contentIndex, 1);
  assert.equal(browserPack.contentId, '0000001d');
  assert.equal(browserPack.sourceSha256, '9f04453f23476615912972530a99abccaee22361cc69bc80052d47acf907831b');
  assert.deepEqual(browserPack.manualSelection.pages, [0]);
  assert.deepEqual(Object.keys(browserPack.layouts), ['BcmaInfo', 'Index', 'Page_000_large_0', 'Page_000_large_bg', 'Page_000_large_info', 'Page_000_small_0', 'Page_000_small_bg', 'Page_000_small_info']);
  assert.equal(browserPack.resourceSources.layouts.Index.sha256, 'e8343458ddb5d03e1182f11225484855d82ce36a984ce22cc0c2ff9852e3fca8');
  assert.equal(browserPack.manualSelection.converter.scripts['scripts/firmware/manual_bcma.py'],
    createHash('sha256').update(readFileSync('scripts/firmware/manual_bcma.py')).digest('hex'));
  assert.equal(browserSource.heading, title.name);
  assert.equal(browserSource.iconUrl, '/os/firmware/10.7.0-32E/icons/browser.png');
  const entries = manualContents(browserPack.layouts.Index);
  assert.equal(entries.filter(entry => entry.kind === 'page').length, 12);
  assert.deepEqual(entries.slice(0, 4), [
    { kind: 'page', page: 0, title: 'Health & Safety', category: 0 },
    { kind: 'category', category: 1, title: 'Basic Information' },
    { kind: 'page', page: 1, title: 'Introduction', category: 1 },
    { kind: 'page', page: 2, title: 'Browser Usage Precautions', category: 1 },
  ]);
});

test('Manual header expands the source SMDH large icon into its traced 64x64 texture', () => {
  const data = new Uint8ClampedArray(48 * 48 * 4);
  for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) data.set([x, y, x ^ y, 255], (y * 48 + x) * 4);
  const before = data.slice(), icon = helpers.applicationManualIconPixels({ width: 48, height: 48, data });
  assert.deepEqual({ width: icon.width, height: icon.height, picaFormat: icon.picaFormat }, { width: 64, height: 64, picaFormat: 3 });
  for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++)
    assert.deepEqual([...icon.data.slice((y * 64 + x) * 4, (y * 64 + x + 1) * 4)], [x, y, x ^ y, 255]);
  assert.ok(icon.data.slice(48 * 4, 64 * 4).every(value => value === 0), 'unread texture padding stays transparent');
  assert.deepEqual(data, before, 'published SMDH pixels stay immutable');
  assert.throws(() => helpers.applicationManualIconPixels({ width: 24, height: 24, data: new Uint8ClampedArray(24 * 24 * 4) }), /SMDH large icon/);
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

test('Camera Contents requests its real index, source icon, and Close-only interaction', () => {
  const view = { appId: 'manual', screen: 'main', heading: 'Nintendo 3DS Camera', rows: [], selection: 0, footer: { left: { action: 'back', label: 'Back' } }, data: { manualTitleId: camera } };
  const request = helpers.nativeHelperView(view), calls = [], requestedImages = [];
  assert.deepEqual(request.packs.find(item => item.alias === 'manual-index'), {
    url: manualSources[camera].url, alias: 'manual-index', layouts: ['Index'], animations: [], titleId: camera,
  });
  assert.deepEqual(helpers.nativeHelperTargets(view), [{ action: 'back', x: 0, y: 212, width: 160, height: 28 }]);
  const renderer = {
    packs: Object.fromEntries(request.packs.map(item => [item.alias, json(item.url)])),
    getFontManifest: () => json('fonts/shared/font.json'),
    draw(_context, packName, layout, options) { calls.push({ pack: packName, layout, options }); return true; },
  };
  const pixels = { width: 48, height: 48, data: new Uint8ClampedArray(48 * 48 * 4) };
  const context = { fillStyle: '', fillRect() {}, getTransform: () => ({a:1,b:0,c:0,d:1,e:0,f:0}) };
  assert.equal(helpers.drawNativeHelperFrame(renderer, context, context, view, { nativeImage(url) { requestedImages.push(url); return pixels; } }), true);
  assert.deepEqual(requestedImages, ['/os/firmware/10.7.0-32E/icons/camera.png']);
  const header = calls.find(call => call.pack === 'manual-SoftTitleHeader');
  assert.equal(header.options.overrides.TextBoxTxt_00.text, 'Nintendo 3DS Camera');
  assert.equal(header.options.textures['IconBlank.bclim'].width, 64);
  const module = createStockModule(getTitle('manual')), state = module.create({ manualTitleId: camera }, null, ctx);
  assert.deepEqual(module.reduce(state, { type: 'action', id: 'back' }, ctx).effects, [{ type: 'close' }]);
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
  assert.equal(module.reduce(state, { type: 'command', command: 'open' }, ctx).state.screen, 'document');
  assert.deepEqual(module.reduce(state, { type: 'action', id: 'back' }, ctx).effects, [{ type: 'close' }]);
  assert.equal(module.create({ manualTitleId: 'not-a-title' }, null, ctx).manualTitleId, undefined);
});

test('Settings Contents loads source chrome, lets Close act, and leaves unfinished controls inert', () => {
  const view = { appId: 'manual', screen: 'main', heading: 'System Settings', rows: [], selection: 0, footer: { left: { action: 'back', label: 'Back' } }, data: { manualTitleId: settings } };
  const request = helpers.nativeHelperView(view);
  assert.equal(request.titleId, '0004003000009b02');
  const index = request.packs.find(item => item.alias === 'manual-index');
  assert.deepEqual(index, { url: source.url, alias: 'manual-index', layouts: ['Index'], animations: [], titleId: settings });
  assert.deepEqual(request.packs.find(item => item.alias === 'manual-all-root'), {
    url: 'packs/manual/layout-AllNull.json', alias: 'manual-all-root', layouts: ['AllNull'], animations: ['AllNull_Wait'],
  });
  for (const item of request.packs.filter(item => item !== index)) assert.ok(manifest.titles['0004003000009b02'].packs.includes(item.url));
  assert.equal(request.packs.some(item => /BtnClose00|BtnBack00|PageNum|PageBg00/.test(item.url)), false, 'no substitute footer or page chrome');
  assert.deepEqual(helpers.nativeHelperTargets(view), [{ action: 'manual-page-0', x: 24, y: 67.5, width: 272, height: 37 }, { action: 'back', x: 0, y: 212, width: 160, height: 28 }]);
  const module = createStockModule(getTitle('manual'));
  const state = module.create({ manualTitleId: settings }, null, ctx);
  assert.deepEqual(module.reduce(state, { type: 'action', id: 'back' }, ctx).effects, [{ type: 'close' }]);
  const unknown = helpers.nativeHelperView({ ...view, data: { manualTitleId: '0004001000022300' } });
  assert.equal(manifest.titles['0004001000022300'].packs.includes(unknown.packs.at(-1).url), false, 'an undelivered manual fails to load');
  assert.equal(helpers.APPLICATION_MANUAL_HEADER_CENTRE[1], -22);
  assert.deepEqual(helpers.APPLICATION_MANUAL_LOWER_FIT, {
    rowBodyY: 2,
    secondCategoryRegister: [118, 183, 218],
    languageGlyphX: -43,
    languageLabelX: 13,
  });
});

test('Manual title arguments stay within source-backed routes, stock rendering and read-only entry consumers', () => {
  const files = readdirSync(resolve('src'), { recursive: true }).filter(file => /\.(ts|tsx)$/.test(file));
  const users = files.filter(file => readFileSync(resolve('src', file), 'utf8').includes('manualTitleId')).sort();
  assert.deepEqual(users, ['os/manual-entry-identity.ts', 'os/manual-entry-presentation.ts', 'os/stock-apps.ts', 'os/stock-helper-views.ts', 'os/stock-native-helpers.ts', 'os/stock-screen-layout.ts', 'os/system.ts']);
});


test('page 1 opens through A or its row; B returns and X closes from either screen', () => {
  const module=createStockModule(getTitle('manual')), state=module.create({manualTitleId:settings},null,ctx);
  const page=module.reduce(state,{type:'command',command:'open'},ctx).state;
  assert.equal(page.page,0);assert.equal(page.screen,'document');
  assert.deepEqual(module.reduce(state,{type:'touch',phase:'up',x:160,y:86},ctx).state,page);
  const back=module.reduce(page,{type:'command',command:'back'},ctx);
  assert.equal(back.state.screen,'main');assert.equal(back.effects,undefined);
  for(const s of [state,page])assert.deepEqual(module.reduce(s,{type:'command',command:'x'},ctx).effects,[{type:'close'}]);
  for(const command of ['left','right','up','down','y'])assert.deepEqual(module.reduce(page,{type:'command',command},ctx).state,page);
  assert.deepEqual(module.reduce(state,{type:'action',id:'manual-page-1'},ctx).state,state);
  const requests=helpers.nativeHelperView(module.view(page,ctx)).packs;
  assert.deepEqual(requests.find(p=>p.alias==='manual-index').layouts,['Index','Page_000_small_0','Page_000_small_bg']);
  assert.ok(requests.find(p=>p.alias==='manual-row').animations.includes('BtnHeadLineTxt_ChangeWait'));
  assert.equal(helpers.nativeHelperView(module.view(state,ctx)).packs.find(p=>p.alias==='manual-row').animations.includes('BtnHeadLineTxt_ChangeWait'),false,'page request must not mutate shared contents packs');
  assert.deepEqual(helpers.nativeHelperTargets(module.view(page,ctx)).map(t=>t.action),['manual-close','back']);
});

test('Settings Manual page 0 samples its Back glyphs at final LCD pixel centres', () => {
  const module=createStockModule(getTitle('manual'));
  const state=module.create({manualTitleId:settings},null,ctx);
  const page=module.reduce(state,{type:'command',command:'open'},ctx).state;
  const view=module.view(page,ctx),request=helpers.nativeHelperView(view),calls=[];
  const renderer={
    packs:Object.fromEntries(request.packs.map(item=>[item.alias,json(item.url)])),
    draw(_context,pack,layout,options){calls.push({pack,layout,options});return true;},
  };
  assert.equal(helpers.drawNativeHelperFrame(renderer,{}, {},view),true);
  const back=calls.find(call=>call.pack==='manual-back'&&call.layout==='BtnBack00');
  assert.equal(back.options.textSampling,'lcd-source-size');
  assert.ok(back.options.overrides.T_BtnF_Text);
  assert.ok(back.options.overrides.T_BtnF_Pict);
  const titles=calls.filter(call=>call.layout==='ManualRowImportant'||call.layout==='ManualRowGettingStarted');
  assert.ok(titles.length>=2);
  for(const title of titles){
    assert.equal(title.options.pictureSampling,'lcd');
    assert.deepEqual(title.options.bindings,[{name:'BtnHeadLineTxt_ChangeWait',frame:0}]);
    assert.equal(title.options.textCoverageAdaptation,undefined);
  }
  assert.equal(calls.some(call=>call.layout==='ScrollIndicator'),false);
});

test('page preview requests source adjacent geometry and only delivered small page 2', () => {
  const module=createStockModule(getTitle('manual')), state=module.create({manualTitleId:settings},null,ctx);
  const page=module.reduce(state,{type:'command',command:'open'},ctx).state;
  const requests=helpers.nativeHelperView(module.view(page,ctx)).packs;
  const neighbor=requests.find(p=>p.alias==='manual-neighbor');
  assert.equal(neighbor.titleId,settings);
  assert.deepEqual(neighbor.layouts,['Page_001_small_0','Page_001_small_bg']);
  assert.ok(manifest.titles[settings].packs.includes(neighbor.url));
  const converted=json(neighbor.url);
  assert.deepEqual(converted.manualSelection.pages,[1]);
  assert.deepEqual(converted.manualSelection.layoutVariants,['small']);
  assert.equal(converted.sourceSha256,pack.sourceSha256);
  assert.equal(requests.find(p=>p.alias==='manual-main-root').url,'packs/manual/layout-MainNull.json');
});

test('Browser Contents loads and draws its own source, then opens only delivered page zero', () => {
  const module=createStockModule(getTitle('manual')), state=module.create({manualTitleId:browser},null,ctx), view=module.view(state,ctx);
  assert.equal(view.heading,'Internet Browser');
  assert.deepEqual(helpers.nativeHelperTargets(view),[{action:'manual-page-0',x:24,y:67.5,width:272,height:37},{action:'back',x:0,y:212,width:160,height:28}]);
  const request=helpers.nativeHelperView(view), index=request.packs.find(item=>item.alias==='manual-index'), calls=[], images=[];
  assert.deepEqual(index,{url:manualSources[browser].url,alias:'manual-index',layouts:['Index'],animations:[],titleId:browser});
  const renderer={packs:Object.fromEntries(request.packs.map(item=>[item.alias,json(item.url)])),getFontManifest:()=>json('fonts/shared/font.json'),draw(_context,packName,layout,options){calls.push({pack:packName,layout,options});return true;}};
  const pixels={width:48,height:48,data:new Uint8ClampedArray(48*48*4)},context={fillStyle:'',fillRect(){},getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0})};
  assert.equal(helpers.drawNativeHelperFrame(renderer,context,context,view,{nativeImage(url){images.push(url);return pixels;}}),true);
  assert.deepEqual(images,['/os/firmware/10.7.0-32E/icons/browser.png']);
  assert.equal(calls.find(call=>call.pack==='manual-SoftTitleHeader').options.overrides.TextBoxTxt_00.text,'Internet Browser');
  const page=module.reduce(state,{type:'command',command:'open'},ctx).state;
  assert.equal(page.screen,'document');assert.equal(page.page,0);
  const pageView=module.view(page,ctx),pageRequests=helpers.nativeHelperView(pageView).packs;
  assert.equal(pageRequests.find(item=>item.alias==='manual-neighbor').url,manualSources[browser].neighborUrl);
  assert.equal(pageRequests.find(item=>item.alias==='manual-neighbor').titleId,browser);
  const pageCalls=[],pageRenderer={packs:Object.fromEntries(pageRequests.map(item=>[item.alias,json(item.url)])),draw(_context,packName,layout,options){pageCalls.push({pack:packName,layout,options});return true;}};
  assert.equal(helpers.drawNativeHelperFrame(pageRenderer,context,context,pageView),true);
  assert.ok(pageCalls.some(call=>call.pack==='manual-index'&&call.layout==='Page_000_small_0'));
  assert.ok(pageCalls.some(call=>call.pack==='manual-neighbor'&&call.layout==='Page_001_small_0'));
  const missing={...renderer,packs:{...renderer.packs}};delete missing.packs['manual-index'];
  assert.equal(helpers.drawNativeHelperFrame(missing,context,context,view),false,'missing selected Browser index fails the native draw');
});
