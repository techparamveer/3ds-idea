import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { createPortfolioState, launchHomeShortcut, reduceSystem, tickSystem } from '../src/os/system.ts';
import { selectHomeSlot, settleHomeNavigation } from '../src/os/home-navigation.ts';
import { nativePaneParentPath, poseNativeLayout } from '../src/os/native-layout.ts';

const data = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const sourceUrl = new URL('../src/os/screens.ts', import.meta.url);
const overrides = {
  './native-system-presentation': data('export const drawNativeSystemOverlay=()=>false;'),
  './home-software-dialog': data(`export {homeSoftwareDialogKey,homeSoftwareClosingDialogKey,homeSoftwareDialogTitles} from '${new URL('../src/os/home-software-dialog.ts', import.meta.url).href}';export const drawHomeSoftwareDialog=()=>true;`),
  './home-software-closing-dialog': data('export const drawHomeSoftwareClosingDialog=()=>true;'),
  './native-chrome': data('export const createNativeChrome=()=>({ready:Promise.resolve(),draw:()=>true,tile:()=>true});'),
  './home-native-layouts': data('export const createHomeLayoutManager=()=>({});'),
  './firmware-presentation': data('export const createFirmwareHome=a=>a.presenter;export const loadFirmwarePresentationAssets=()=>{};'),
  './portfolio-screens': data('export const setPortfolioFont=()=>{};export const createPortfolioGraphics=()=>({ready:Promise.resolve(),readSuspendedCapture:()=>globalThis.__homePauseWindowCapture,selectedApp(){},syncStockView(){},stockStatus:()=>"inactive",stockFailure:()=>null,banner(){},menuIcon(){},menuArtwork(){},overlay(){},dispose(){}});'),
};
const { outputText } = ts.transpileModule(readFileSync(sourceUrl, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { createScreens } = await import(data(outputText.replace(/(from\s*['"])(\.[^'"]+)(['"])/g, (_all, prefix, path, suffix) => prefix + (overrides[path] ?? new URL(path.endsWith('.ts') ? path : `${path}.ts`, sourceUrl).href) + suffix)));
const root = new URL('../public/os/firmware/10.7.0-32E/packs/home/', import.meta.url);
const packs = Object.fromEntries([['launcher', 'launcher.json'], ['messages', 'messages-and-loose.json']].map(([key, path]) => [key, JSON.parse(readFileSync(new URL(path, root)))]));
const suspended = () => reduceSystem(tickSystem(launchHomeShortcut(tickSystem(createPortfolioState(), 3001), 'health-safety', 3010), 6500), 'home', 6600);
const at = (state, updateCount) => ({ ...state, system: { ...state.system, homeClock: { ...state.system.homeClock, updateCount } } });
const window = events => events.find(event => event.name === 'window');
const appear = events => window(events)?.options.bindings.find(binding => binding.groups?.includes('G_Wndw_00'))?.frame;
const pane = (event, name) => nativePaneParentPath(event.pose, name).at(-1);

async function fixture(run) {
  const keys = ['document', 'Image', 'FontFace', '__homePauseWindowCapture'];
  const saved = new Map(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const events = []; let fail = false, source = structuredClone(packs);
  function canvas() {
    const surface = { width: 0, height: 0 };
    const ctx = new Proxy({ canvas: surface, globalAlpha: 1, createLinearGradient: () => ({ addColorStop() {} }),
      getImageData(_x, _y, width, height) { return { width, height, data: new Uint8ClampedArray(width * height * 4) }; } },
    { get: (target, key) => key in target ? target[key] : () => {} });
    surface.getContext = () => ctx; return surface;
  }
  Object.assign(globalThis, { document: { createElement: canvas, fonts: { add() {} } }, Image: class { decode() { return Promise.resolve(); } }, FontFace: class { load() { return Promise.resolve(this); } } });
  const presenter = new Proxy({ pressOffset: 0, tilePressOffset: () => 0 }, { get: (target, key) => key in target ? target[key] : () => true });
  const renderer = { get packs() { return source; }, measureSingleLineText: () => 222,
    draw(_ctx, _pack, name, options) {
      if (name === 'LncBase_U_00') events.push({ name: 'window', options,
        pose: poseNativeLayout(source.launcher.layouts[name], source.launcher.animations, options.bindings, options.overrides) });
      return !fail;
    } };
  const assets = () => ({ presenter, renderer, sharedFont: { draw() {} }, dispose() {}, diagnostics: [],
    titleIcons: new Map([['0004001000022300', {}]]), titleDescriptions: new Map([['0004001000022300', 'Health and Safety Information']]) });
  const screens = createScreens({ firmwareAssets: assets(), drawHomeBackground: () => true,
    drawSuspendedBackground(_ctx, capture, presentation) { events.push({ name: 'backdrop', capture, presentation }); return capture.status === 'none' || capture.status === 'ready' && capture.owner === currentOwner; } });
  let currentOwner = suspended().system.runtime.application;
  const capture = (owner = currentOwner, generation = 1, status = 'ready') => { globalThis.__homePauseWindowCapture = { status, owner, generation }; };
  capture();
  const paint = (state, update, receipt = true, verification) => {
    events.length = 0; const current = at(state, update), result = screens.paint(current, new Date(0), 10000 + update * 1000 / 60, verification);
    const presented = receipt && screens.presentHomeEntryMotion(current); return { state: current, result, events, presented };
  };
  try {
    await screens.ready;
    await run({ screens, paint, events, assets, capture, fail: value => fail = value, mutate: fn => fn(source), setOwner: value => currentOwner = value });
  } finally {
    screens.dispose();
    for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
  }
}

test('actual Health HOME painter starts window Appear0 and retains pending poses until the exact pair receipt', async () => {
  await fixture(({ screens, paint }) => {
    const state = suspended();
    let pair = paint(state, 100, false); assert.equal(appear(pair.events), 0); assert.equal(pane(window(pair.events), 'N_Wndw_00').alpha, 0);
    pair = paint(state, 103, false); assert.equal(appear(pair.events), 0);
    pair = paint(state, 500, false); assert.equal(appear(pair.events), 0);
    assert.equal(screens.presentHomeEntryMotion(pair.state), true); assert.equal(screens.presentHomeEntryMotion(pair.state), false);
    for (let frame = 1; frame <= 20; frame++) {
      pair = paint(state, 500 + frame * 3);
      assert.equal(appear(pair.events), Math.min(10, frame));
      assert.equal(pair.result.entryMotion.pauseFrame, frame);
      assert.equal(pane(window(pair.events), 'N_Hud_00').alpha, 255);
      assert.deepEqual(pane(window(pair.events), 'W_Wndw_00').size, [296, 132]);
    }
    assert.equal(screens.homeEntryMotionActive(pair.state), false);
  });
});

test('failed window source, diagnostics, context revocation and monotonic retries preserve the last presented window phase', async () => {
  await fixture(({ screens, paint, fail, mutate }) => {
    const state = suspended(); paint(state, 100); let pair = paint(state, 103); assert.equal(appear(pair.events), 1);
    paint(state, 104, false); screens.revokeHomeEntryMotionCandidate(); assert.equal(screens.presentHomeEntryMotion(at(state, 105)), false);
    pair = paint(state, 106); assert.equal(appear(pair.events), 1);
    fail(true); pair = paint(state, 107); assert.equal(screens.stockStatus(pair.state), 'error'); assert.equal(pair.presented, false);
    fail(false); screens.retryStockScreen(); pair = paint(state, 108); assert.equal(appear(pair.events), 1);
    paint(state, 109, false, { homeCursorLoopFrame: 0 }); assert.equal(screens.presentHomeEntryMotion(at(state, 109)), false);
    pair = paint(state, 110); assert.equal(appear(pair.events), 1);
    paint({ ...state, system: { ...state.system, sleeping: true } }, 111, false);
    pair = paint(state, 112); assert.equal(appear(pair.events), 1);
    pair = paint(state, 4000); assert.equal(appear(pair.events), 1);
    pair = paint(state, 4003); assert.equal(appear(pair.events), 2);
    mutate(source => source.launcher.animations.LncBase_U_00_Appear.groups = ['G_Hud_00', 'G_Btm_00']);
    pair = paint(state, 4004); assert.equal(screens.stockStatus(pair.state), 'error'); assert.match(String(screens.stockFailure()), /appearance source unavailable/); assert.equal(pair.presented, false);
  });
});

test('replacement owner or capture generation cannot acknowledge or advance an old appearance candidate', async () => {
  await fixture(({ screens, paint, capture, setOwner }) => {
    const state = suspended(); paint(state, 100); paint(state, 103, false);
    capture(state.system.runtime.application, 2); assert.equal(screens.presentHomeEntryMotion(at(state, 103)), false);
    let pair = paint(state, 104); assert.equal(appear(pair.events), 0); pair = paint(state, 105); assert.equal(appear(pair.events), 1);
    const owner = 'health-safety:replacement';
    const replacement = { ...state, system: { ...state.system, runtime: { ...state.system.runtime, application: owner, homeReturn: owner,
      instances: { [owner]: { ...state.system.runtime.instances[state.system.runtime.application], id: owner } } } } };
    paint(state, 106, false); capture(owner, 3); setOwner(owner);
    assert.equal(screens.presentHomeEntryMotion(at(replacement, 106)), false);
    pair = paint(replacement, 107); assert.equal(appear(pair.events), 0); pair = paint(replacement, 108); assert.equal(appear(pair.events), 1);
    capture('foreign', 4); pair = paint(replacement, 109); assert.equal(screens.stockStatus(pair.state), 'error'); assert.equal(pair.presented, false);
  });
});

test('reduced window endpoint uses the existing pause receipt and cannot replay a published midpoint', async () => {
  await fixture(({ screens, paint }) => {
    const state = suspended(); paint(state, 100); paint(state, 103); screens.setReducedMotion(true);
    let pair = paint(state, 104, false); assert.equal(appear(pair.events), 10); assert.equal(pair.result.entryMotion.pauseFrame, 20);
    screens.setReducedMotion(false); assert.equal(screens.presentHomeEntryMotion(at(state, 105)), false);
    pair = paint(state, 105); assert.equal(appear(pair.events), 1);
    screens.setReducedMotion(true); pair = paint(state, 106, false); assert.equal(appear(pair.events), 10);
    assert.equal(screens.presentHomeEntryMotion(pair.state), true);
    screens.setReducedMotion(false); pair = paint(state, 107); assert.equal(appear(pair.events), 10);
    assert.equal(screens.homeEntryMotionActive(pair.state), false);
  });
  await fixture(({ screens, paint }) => {
    screens.setReducedMotion(true); const pair = paint(suspended(), 100, false); assert.equal(appear(pair.events), 10);
    assert.equal(screens.presentHomeEntryMotion(pair.state), true);
  });
});

test('compact keeps pause appearance while dialog, close, stale capture and disposal keep existing boundaries', async () => {
  await fixture(({ screens, paint, capture, assets }) => {
    const state = suspended(); paint(state, 100);
    const compact = settleHomeNavigation(selectHomeSlot(state, state.selected + 1));
    let pair = paint(compact, 101); assert.equal(appear(pair.events), 1); assert.equal(pane(window(pair.events), 'N_Wndw_00').alpha, 7);
    const dialog = reduceSystem(state, 'back', 6700); pair = paint(dialog, 102); assert.equal(appear(pair.events), undefined);
    const close = reduceSystem(dialog, 'open', 6800); pair = paint(close, 103); assert.equal(appear(pair.events), undefined);
    assert.equal(window(pair.events).options.bindings.find(binding => binding.name.endsWith('_WhiteBlack')).frame, 0, 'close composition retains its existing selector');
    capture(state.system.runtime.application, 1, 'pending'); pair = paint(state, 104); assert.equal(screens.stockStatus(pair.state), 'error'); assert.equal(pair.presented, false);
    capture(); screens.retryStockScreen(); pair = paint(state, 105); assert.equal(appear(pair.events), 1, 'retry retains the pause receipt from the compact pair');
    paint(state, 106, false); screens.setFirmwareAssets(assets()); assert.equal(screens.presentHomeEntryMotion(at(state, 106)), false);
    pair = paint(state, 107, false); assert.equal(appear(pair.events), 0);
    screens.dispose(); assert.equal(screens.presentHomeEntryMotion(pair.state), false);
  });
});
