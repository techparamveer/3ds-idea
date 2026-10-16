import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { PNG } from 'pngjs';
import { createPortfolioState, tickSystem } from '../src/os/system.ts';
import { enterHomeFolder, leaveHomeFolder, getHomeNavigation, writeHomeNavigation, setHomeDensity, settleHomeNavigation, selectHomeSlot } from '../src/os/home-navigation.ts';
import { beginSystemHomeFolderClose, advanceSystemHomeFolderCloseNative, sampleSystemHomeFolderClose } from '../src/os/home-folder-close-system.ts';
import { nativePaneParentPath, poseNativeLayout } from '../src/os/native-layout.ts';

function moduleUrl(name, overrides = {}) {
 const file = new URL(`../src/os/${name}.ts`, import.meta.url);
 const output = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
 const resolved = output.replace(/(from\s*['"])(\.[^'"]+)(['"])/g, (_all, prefix, path, suffix) => prefix
  + (overrides[path] ?? new URL(path.endsWith('.ts') ? path : path + '.ts', file).href) + suffix);
 return 'data:text/javascript;base64,' + Buffer.from(resolved).toString('base64');
}
const rendererUrl = moduleUrl('native-renderer');
const { NativeLayoutRenderer } = await import(rendererUrl);
const { createFirmwareHome } = await import(moduleUrl('firmware-presentation', { './native-renderer': rendererUrl }));
const packUrl = new URL('../public/os/firmware/10.7.0-32E/packs/home/launcher.json', import.meta.url);
const pack = JSON.parse(readFileSync(packUrl));
const textures = new Map(pack.layouts.LncFolder_00.textures.map(name => {
 const decoded = PNG.sync.read(readFileSync(new URL('../../' + pack.textures[name].url, packUrl)), { checkCRC: true });
 return [name, { width: decoded.width, height: decoded.height, data: new Uint8ClampedArray(decoded.data) }];
}));

// Real native layout/material rasterization; this transport records Canvas
// placement instead of claiming browser compositing or native pixel parity.
function canvas() {
 let matrix = [1, 0, 0, 1, 0, 0];
 const stack = [], draws = [], c = { width: 320, height: 240 };
 const multiply = ([a,b,c,d,e,f]) => {
  const [A,B,C,D,E,F] = matrix;
  matrix = [A*a+C*b, B*a+D*b, A*c+C*d, B*c+D*d, A*e+C*f+E, B*e+D*f+F];
 };
 const ctx = { canvas: c, globalAlpha: 1, draws,
  save() { stack.push({ matrix: [...matrix], alpha: this.globalAlpha }); },
  restore() { const saved = stack.pop(); matrix = saved.matrix; this.globalAlpha = saved.alpha; },
  translate(x,y) { multiply([1,0,0,1,x,y]); }, scale(x,y) { multiply([x,0,0,y,0,0]); },
  rotate(r) { multiply([Math.cos(r),Math.sin(r),-Math.sin(r),Math.cos(r),0,0]); },
  resetTransform() { matrix = [1,0,0,1,0,0]; },
  getTransform() { const [a,b,c,d,e,f] = matrix; return { a,b,c,d,e,f }; },
  beginPath() {}, rect() {}, clip() {},
  createImageData(width,height) { return { width,height,data:new Uint8ClampedArray(width*height*4) }; },
  putImageData(image) { c.image = image; },
  drawImage(source,...args) { draws.push({ matrix:[...matrix], source, args }); },
 };
 c.getContext = () => ctx;
 return c;
}
function folder(density, slot, left) {
 let state = tickSystem(createPortfolioState(), 3001);
 state = { ...state, folders: { ...state.folders, [slot]: 'Origin test' } };
 const nav = getHomeNavigation(state);
 state = writeHomeNavigation(state, { ...nav, rootView: { density, selectedSlot: slot, currentLeftSlot: left, targetLeftSlot: left } });
 state = enterHomeFolder(state, slot);
 return settleHomeNavigation(selectHomeSlot(setHomeDensity(state, 5), 17));
}
function withPresenter(run) {
 const prior = globalThis.document;
 globalThis.document = { createElement: canvas };
 const renderer = new NativeLayoutRenderer({ launcher: pack }, { launcher: new Map(textures) }, new Map());
 const chrome = [], children = [], original = JSON.stringify(pack);
 const draw = renderer.draw.bind(renderer), parent = renderer.withPaneParent.bind(renderer);
 renderer.draw = (ctx, bank, layout, options) => { chrome.push(options); return draw(ctx, bank, layout, options); };
 renderer.withPaneParent = (ctx, bank, layout, name, bindings, callback, overrides) => {
  children.push({ name, bindings, overrides });
  return parent(ctx, bank, layout, name, bindings, callback, overrides);
 };
 try { run({ presenter: createFirmwareHome({ renderer }), renderer, chrome, children, ctx: canvas().getContext('2d') }); }
 finally { assert.equal(JSON.stringify(pack), original); renderer.dispose(); globalThis.document = prior; }
}
const cases = [
 { density: 1, slot: 16, left: 12, origin: [84,38] },
 { density: 1, slot: 17, left: 12, origin: [84,-46] },
 { density: 0, slot: 12, left: 11, origin: [0,-41] },
 { density: 2, slot: 23, left: 12, origin: [54,-58] },
 { density: 5, slot: 17, left: 0, origin: [-70,-74] },
];
const expectedTranslation = (origin, frame) => {
 const f = Math.fround, remaining = f(1-f(frame/16));
 return [...origin.map(value => f(f(value*remaining)*remaining)), 0];
};
function assertPose({ presenter, renderer, chrome, children, ctx }, state, frame, origin, entry, reduced = false) {
 const expected = expectedTranslation(origin, reduced ? 16 : frame);
 assert.equal(presenter.folderChrome(ctx, state, reduced, entry), true, renderer.diagnostics.join('\n'));
 const options = chrome.at(-1);
 assert.deepEqual(options.overrides.RootPane?.translation, expected);
 assert.equal(options.bindings[0].frame, reduced ? 16 : frame);
 if (frame > 0 || reduced) assert.ok(ctx.draws.length, 'real renderer publishes source material raster draws');
 const posed = poseNativeLayout(pack.layouts.LncFolder_00, pack.animations, options.bindings, options.overrides);
 const scale = nativePaneParentPath(posed, 'N_Dlg_00').at(-1).scale;
 for (const empty of [false,true]) {
  let observed;
  assert.equal(presenter.folderChild(ctx, state, empty, alpha => { observed = { alpha, matrix: ctx.getTransform() }; }, reduced, entry), true);
  assert.ok(observed);
  if (!reduced) {
   assert.deepEqual(children.at(-1).overrides.RootPane, options.overrides.RootPane, 'chrome and either child parent share the root write');
   assert.equal(observed.matrix.e, 160 + expected[0] - 160*scale[0]);
   assert.equal(observed.matrix.f, 120 - expected[1] - 120*scale[1]);
   assert.equal(observed.matrix.a, scale[0]); assert.equal(observed.matrix.d, scale[1]);
   const path = nativePaneParentPath(posed,empty ? 'N_BlankAnime_00' : 'N_Dlg_00');
   assert.equal(observed.alpha,path.reduce((alpha,pane)=>pane.flags&2 ? alpha*(pane.alpha/255) : alpha,1));
  } else assert.deepEqual(observed.matrix, { a:1,b:0,c:0,d:1,e:0,f:0 });
 }
 assert.deepEqual(ctx.getTransform(), { a:1,b:0,c:0,d:1,e:0,f:0 });
}

for (const item of cases) test(`folder origin follows retained root density${item.density} slot${item.slot} left${item.left}`, () => withPresenter(harness => {
 const state = folder(item.density,item.slot,item.left), before = JSON.stringify(state);
 for (const frame of [0,1,4,8,12,15,16]) assertPose(harness,state,frame,item.origin,{ folderFrame:frame,captureFrame:Math.min(frame,8) });
 assert.equal(JSON.stringify(state),before,'painting does not mutate root or child history');
 const reopened = enterHomeFolder(leaveHomeFolder(state),item.slot);
 assertPose(harness,reopened,4,item.origin,{ folderFrame:4,captureFrame:4 });
}));

for (const item of cases) test(`reverse close uses applied frame at density${item.density} slot${item.slot} left${item.left}`, () => withPresenter(harness => {
 let state = beginSystemHomeFolderClose(folder(item.density,item.slot,item.left));
 assert.equal(sampleSystemHomeFolderClose(state).controller.folder.appliedFrame,16);
 assert.equal(sampleSystemHomeFolderClose(state).controller.folder.frame,15);
 for (let step = 0; step < 18; step++) {
  const record = sampleSystemHomeFolderClose(state);
  assert.equal(record.controller.phase,'closing');
  assertPose(harness,state,record.controller.folder.appliedFrame,item.origin,null);
  state = { ...state, system: { ...state.system, homeClock: { ...state.system.homeClock, updateCount:state.system.homeClock.updateCount+1 } } };
  state = advanceSystemHomeFolderCloseNative(state,1).state;
 }
 assert.equal(state.opened,false);
 assert.equal(harness.presenter.folderChrome(harness.ctx,state),false);
}));

test('settled and reduced-motion folder endpoints retain zero translation and unchanged scale', () => withPresenter(harness => {
 const state = folder(1,17,12);
 assertPose(harness,state,0,[84,-46],{ folderFrame:0,captureFrame:0 },true);
 assert.equal(harness.presenter.folderChrome(harness.ctx,state),true);
 assert.deepEqual(harness.chrome.at(-1).overrides.RootPane.translation,[0,-0,0]);
 assert.equal(harness.chrome.at(-1).bindings[0].frame,16);
 let count=0;harness.presenter.folderChild(harness.ctx,state,false,alpha=>{count++;assert.equal(alpha,1);});
 assert.equal(count,1);
 const closing=beginSystemHomeFolderClose(state);
 assertPose(harness,closing,15,[84,-46],null,true);
}));
