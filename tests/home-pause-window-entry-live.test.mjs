import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import { createPortfolioState, launchHomeShortcut, reduceSystem, tickSystem, touchSystem } from '../src/os/system.ts';
import { sampleHomeGrid, selectHomeSlot, settleHomeNavigation } from '../src/os/home-navigation.ts';
import { nativePaneParentPath, poseNativeLayout } from '../src/os/native-layout.ts';
import { drawHomePauseLower } from '../src/os/home-pause-lower.ts';
import { suspendedBackgroundAsset, suspendedBackgroundPlayback } from '../src/scene/home-suspended-background.ts';

const data = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const modules = new Map();
function moduleUrl(path) {
  if (modules.has(path)) return modules.get(path);
  const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
    .replace(/from (['"])([^'"]+)\1/g, (_all, _quote, specifier) => `from ${JSON.stringify(specifier.startsWith('.') ? moduleUrl(resolve(dirname(path), specifier + '.ts')) : import.meta.resolve(specifier))}`);
  const url = data(code); modules.set(path, url); return url;
}
const { createFirmwareModel } = await import(moduleUrl(fileURLToPath(new URL('../src/scene/firmware-model.ts', import.meta.url))));
const background = JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/models/home-background/model.json', import.meta.url)));
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
const firmwareUrl = new URL('../src/os/firmware-presentation.ts', import.meta.url);
const firmwareSource = ts.transpileModule(readFileSync(firmwareUrl, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { createFirmwareHome } = await import(data(firmwareSource.replace(/(from\s*['"])(\.[^'"]+)(['"])/g, (_all, prefix, path, suffix) =>
  prefix + (path === './native-renderer' ? data('export class NativeLayoutRenderer {}') : new URL(path.endsWith('.ts') ? path : `${path}.ts`, firmwareUrl).href) + suffix)));
const resourceRoot = process.env.THREE_DS_RESOURCE_ROOT
  ? pathToFileURL(resolve(process.env.THREE_DS_RESOURCE_ROOT, 'packs/home') + '/')
  : new URL('../public/os/firmware/10.7.0-32E/packs/home/', import.meta.url);
const root = resourceRoot;
const packs = Object.fromEntries([['launcher', 'launcher.json'], ['messages', 'messages-and-loose.json'], ['hud', 'hud.json']].map(([key, path]) => [key, JSON.parse(readFileSync(new URL(path, root)))]));
const suspended = () => reduceSystem(tickSystem(launchHomeShortcut(tickSystem(createPortfolioState(), 3001), 'health-safety', 3010), 6500), 'home', 6600);
function ordinarySuspendedHealth() {
  let state = tickSystem(createPortfolioState(), 3001);
  const slot = Number(Object.entries(state.system.layout).find(([, id]) => id === 'health-safety')[0]);
  state = settleHomeNavigation(selectHomeSlot(state, slot));
  const grid = sampleHomeGrid(state.system.homeNavigation), point = grid.slots[slot];
  state = touchSystem(state, point.x - grid.scrollPixels, point.y, 3010);
  assert.equal(state.system.phase, 'launch', 'ordinary Health tile launches through touch input');
  return reduceSystem(tickSystem(state, 6500), 'home', 6600);
}
const at = (state, updateCount) => ({ ...state, system: { ...state.system, homeClock: { ...state.system.homeClock, updateCount } } });
const window = events => events.find(event => event.name === 'window');
const appear = events => window(events)?.options.bindings.find(binding => binding.groups?.includes('G_Wndw_00'))?.frame;
const launcherSceneFrame = events => window(events)?.options.bindings.find(binding => binding.name === 'LncBase_U_00_SceneIn')?.frame;
const hud = events => events.find(event => event.name === 'hud');
const hudFrame = events => hud(events)?.options.bindings.find(binding => binding.name === 'HudMenu_00_SceneIn')?.frame;
const pane = (event, name) => nativePaneParentPath(event.pose, name).at(-1);

async function fixture(run) {
  const keys = ['document', 'Image', 'FontFace', '__homePauseWindowCapture'];
  const saved = new Map(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const events = []; let fail = false, failHud = false, source = structuredClone(packs), imageReads = 0;
  const backgroundAsset = suspendedBackgroundAsset({ data: background, images: new Map(background.textures.map(texture => [texture.name,
    { width: texture.width, height: texture.height, data: new Uint8ClampedArray(texture.width * texture.height * 4) }])) });
  const backgroundModel = createFirmwareModel(backgroundAsset, suspendedBackgroundPlayback());
  function canvas() {
    const surface = { width: 0, height: 0 };
    const ctx = new Proxy({ canvas: surface, globalAlpha: 1, createLinearGradient: () => ({ addColorStop() {} }),
      getImageData(_x, _y, width, height) { imageReads++; const data = new Uint8ClampedArray(width * height * 4); data[0] = imageReads; return { width, height, data }; } },
    { get: (target, key) => key in target ? target[key] : () => {} });
    surface.getContext = () => ctx; return surface;
  }
  Object.assign(globalThis, { document: { createElement: canvas, fonts: { add() {} } }, Image: class { decode() { return Promise.resolve(); } }, FontFace: class { load() { return Promise.resolve(this); } } });
  const presenter = new Proxy({ pressOffset: 0, tilePressOffset: () => 0,
    hud(...args) { return firmwareHome.hud(...args); },
    pauseLower(ctx, application, home, frame) { events.push({ name: 'pause-lower', application, home, frame }); return drawHomePauseLower(renderer, ctx, application, home, frame); },
    footer(_ctx, _state, _reduced, _entry, _launch, _decide, pauseFrame) { events.push({ name: 'footer', pauseFrame }); return !fail; } },
  { get: (target, key) => key in target ? target[key] : () => true });
  const renderer = { get packs() { return source; }, measureSingleLineText: () => 222,
    draw(_ctx, _pack, name, options) {
      if (name === 'LncPauseFade_D_00') events.push({ name: 'pause-lower-source', options,
        pose: poseNativeLayout(source.launcher.layouts[name], source.launcher.animations, options.bindings, options.overrides) });
      if (name === 'LncBase_U_00') events.push({ name: 'window', options,
        pose: poseNativeLayout(source.launcher.layouts[name], source.launcher.animations, options.bindings, options.overrides) });
      if (name === 'HudMenu_00') {
        events.push({ name: 'hud', options, pose: poseNativeLayout(source.hud.layouts[name], source.hud.animations, options.bindings, options.overrides) });
        if (failHud) return false;
      }
      return !fail;
    } };
  const firmwareHome = createFirmwareHome({ renderer });
  const assets = () => ({ presenter, renderer, sharedFont: { draw() {} }, dispose() {}, diagnostics: [],
    titleIcons: new Map([['0004001000022300', {}]]), titleDescriptions: new Map([['0004001000022300', 'Health and Safety Information']]) });
  const screens = createScreens({ firmwareAssets: assets(), drawHomeBackground: () => true,
    drawSuspendedBackground(_ctx, capture, presentation) {
      backgroundModel.setPlayback(suspendedBackgroundPlayback(presentation)); backgroundModel.update(0);
      const uniforms = backgroundModel.group.children[0].children[0].material.uniforms;
      events.push({ name: 'backdrop', capture, presentation, tint: uniforms.constant0.value.toArray().slice(0, 3) });
      return capture.status === 'none' || capture.status === 'ready' && capture.owner === currentOwner;
    } });
  let currentOwner = suspended().system.runtime.application;
  const capture = (owner = currentOwner, generation = 1, status = 'ready') => { globalThis.__homePauseWindowCapture = {
    status, owner, generation, upper: { width: 400, height: 240, data: new Uint8ClampedArray(400 * 240 * 4) },
    lower: { width: 240, height: 320, data: new Uint8ClampedArray(240 * 320 * 4) } };
  };
  capture();
  const paint = (state, update, receipt = true, verification) => {
    events.length = 0; const current = at(state, update), result = screens.paint(current, new Date(0), 10000 + update * 1000 / 60, verification);
    const presented = receipt && screens.presentHomeEntryMotion(current); return { state: current, result, events, presented };
  };
  try {
    await screens.ready;
    await run({ screens, paint, events, assets, capture, fail: value => fail = value, failHud: value => failHud = value, mutate: fn => fn(source), setOwner: value => currentOwner = value,
      imageReads: () => imageReads });
  } finally {
    screens.dispose(); backgroundModel.dispose();
    for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
  }
}

test('real HOME compositor finishes both retained LCD source dimming phases before revealing HOME', async t => {
  await fixture(({ screens, paint, capture }) => {
    let state = ordinarySuspendedHealth(); const owner = state.system.runtime.application;
    for (let cycle = 0; cycle < 2; cycle++) {
      let firstHome;
      const start = 100 + cycle * 100;
      for (let update = start; update < start + 23; update++) {
        const pair = paint(state, update);
        if (update === start) assert.deepEqual(pair.events.find(event => event.name === 'backdrop').tint, [1, 1, 1],
          'each capture generation starts from the undimmed retained source pose');
        const lower = pair.events.find(event => event.name === 'pause-lower-source');
        if (pane(hud(pair.events), 'N_Scene_00').alpha > 0 || lower && pane(lower, 'P_Lnc_00').alpha > 0) {
          assert.deepEqual(pair.events.find(event => event.name === 'backdrop').tint, [.4, .45, .5],
            'retained upper dimming finishes before either LCD reveals HOME');
        }
        if (lower && pane(lower, 'P_Lnc_00').alpha > 0 && !firstHome) {
          firstHome = { upper: pair.events.find(event => event.name === 'backdrop'), lower,
            receipt: pair.result.entryMotion.pauseFrame, lowerFrame: pair.result.entryMotion.pauseLower.fadeFrame };
        }
      }
      assert.ok(firstHome, 'the actual lower source presenter reveals HOME');
      const { upper, lower, receipt, lowerFrame } = firstHome, app = pane(lower, 'P_App_00');
      assert.deepEqual(lower.pose.materials[app.picture.material].constantColors[0].slice(0, 3), [102, 115, 128]);
      t.diagnostic(JSON.stringify({ cycle, owner, receipt, upper: upper.presentation, lowerFrame,
        lowerHomeAlpha: pane(lower, 'P_Lnc_00').alpha }));
      assert.deepEqual(upper.tint, [.4, .45, .5],
        'upper retained LCD must reach its pinned AppPause dim pose before lower HOME becomes visible');
      assert.equal(screens.homeEntryMotionActive(at(state, start + 22)), false);
      if (cycle === 0) {
        const resumed = touchSystem(state, 160, 226, 7000);
        assert.equal(resumed.system.phase, 'app'); assert.equal(resumed.system.runtime.application, owner);
        state = reduceSystem(resumed, 'home', 7100); capture(owner, 2);
      }
    }
  });
});

test('pinned upper and lower retained dim tracks agree when the real players receive the same source phase', () => {
  const asset = suspendedBackgroundAsset({ data: background, images: new Map(background.textures.map(texture => [texture.name,
    { width: texture.width, height: texture.height, data: new Uint8ClampedArray(texture.width * texture.height * 4) }])) });
  const model = createFirmwareModel(asset, suspendedBackgroundPlayback());
  try {
    for (const frame of [0, 3, 8, 14, 20]) {
      model.setPlayback(suspendedBackgroundPlayback({ skeletal: [{ clip: 'BannerBG_SceneIn', frame }], material: [{ clip: 'BannerBG_AppPause', frame }] }));
      model.update(0);
      const upper = model.group.children[0].children[0].material.uniforms.constant0.value.toArray();
      const lower = poseNativeLayout(packs.launcher.layouts.LncPauseFade_D_00, packs.launcher.animations,
        [{ name: 'LncPauseFade_D_00_SceneIn', frame }]);
      const app = nativePaneParentPath(lower, 'P_App_00').at(-1), tint = lower.materials[app.picture.material].constantColors[0];
      for (let channel = 0; channel < 3; channel++) assert.ok(Math.abs(upper[channel] - tint[channel] / 255) < 1 / 255,
        `source frame ${frame}, channel ${channel} differs only by the native layout's byte quantization`);
    }
  } finally { model.dispose(); }
});

test('actual Health HOME painter holds the source HUD, then enters it while the lower transitions on the exact pair receipt', async () => {
  await fixture(({ screens, paint }) => {
    const state = suspended();
    let pair = paint(state, 100, false); assert.equal(appear(pair.events), 0); assert.equal(pane(window(pair.events), 'N_Wndw_00').alpha, 0);
    assert.equal(launcherSceneFrame(pair.events), 0); assert.equal(pane(window(pair.events), 'N_Root_00').alpha, 0);
    assert.equal(hudFrame(pair.events), 0); assert.equal(pane(hud(pair.events), 'N_Scene_00').alpha, 0);
    assert.equal(pair.events.find(event => event.name === 'pause-lower').frame, 0);
    assert.equal(pair.events.some(event => event.name === 'footer'), false);
    const frozenHome = pair.events.find(event => event.name === 'pause-lower').home;
    pair = paint(state, 103, false); assert.equal(appear(pair.events), 0);
    assert.equal(launcherSceneFrame(pair.events), 0);
    assert.equal(hudFrame(pair.events), 0);
    assert.equal(pair.events.find(event => event.name === 'pause-lower').home, frozenHome);
    pair = paint(state, 500, false); assert.equal(appear(pair.events), 0);
    assert.equal(launcherSceneFrame(pair.events), 0);
    assert.equal(hudFrame(pair.events), 0);
    assert.equal(screens.presentHomeEntryMotion(pair.state), true); assert.equal(screens.presentHomeEntryMotion(pair.state), false);
    for (let frame = 1; frame <= 22; frame++) {
      pair = paint(state, 500 + frame * 3, false);
      assert.equal(appear(pair.events), Math.min(10, Math.max(0, frame - 10)));
      assert.equal(launcherSceneFrame(pair.events), Math.min(20, frame) * 2);
      assert.equal(hudFrame(pair.events), Math.min(20, frame) * 2);
      const launcherRoot = pane(window(pair.events), 'N_Root_00');
      const hudScene = pane(hud(pair.events), 'N_Scene_00');
      if (frame <= 10) {
        assert.equal(launcherRoot.alpha, 0);
        assert.equal(hudScene.alpha, 0);
        assert.ok(Math.abs(hudScene.scale[0] - 1.1) < .000001);
      } else if (frame < 20) {
        assert.ok(launcherRoot.alpha > 0 && launcherRoot.alpha < 255);
        assert.ok(hudScene.alpha > 0 && hudScene.alpha < 255);
        assert.ok(hudScene.scale[0] > 1 && hudScene.scale[0] < 1.1);
      } else {
        assert.equal(launcherRoot.alpha, 255);
        assert.equal(hudScene.alpha, 255);
        assert.deepEqual(hudScene.scale, [1, 1]);
      }
      for (const name of ['T_NetMode_00', 'T_Date_00', 'T_TimeL_00', 'P_Bat_00']) {
        assert.ok(nativePaneParentPath(hud(pair.events).pose, name).some(parent => parent.name === 'N_Scene_00'));
      }
      assert.equal(pair.result.entryMotion.pauseFrame, Math.min(20, frame));
      assert.deepEqual(pair.result.entryMotion.pauseLower, frame < 22 ? {
        fadeFrame: frame < 16 ? Math.round(Math.min(14, frame) * 40 / 14) : null,
        footerFrame: frame >= 16 ? Math.floor((frame - 16) * 14 / 6) : null,
      } : null);
      assert.equal(pair.events.some(event => event.name === 'pause-lower'), frame < 16);
      assert.equal(pair.events.some(event => event.name === 'footer'), frame >= 16);
      assert.equal(pane(window(pair.events), 'N_Hud_00').alpha, 255);
      assert.deepEqual(pane(window(pair.events), 'W_Wndw_00').size, [296, 132]);
      assert.equal(screens.homeEntryMotionActive(pair.state), true, 'each pending pair keeps motion active');
      assert.equal(screens.presentHomeEntryMotion(pair.state), true);
      assert.equal(screens.homeEntryMotionActive(pair.state), frame < 22, 'the footer endpoint receipt ends motion');
    }
    assert.equal(screens.homeEntryMotionActive(pair.state), false);
  });
});

test('lower endpoint holds require distinct receipts before release and survive failed pairs', async () => {
  await fixture(({ screens, paint, fail }) => {
    const state = suspended();
    const assertHeld = (pair, frame) => {
      assert.equal(pair.result.entryMotion.pauseFrame, frame);
      assert.deepEqual(pair.result.entryMotion.pauseLower, { fadeFrame: 40, footerFrame: null });
      assert.equal(pair.events.find(event => event.name === 'pause-lower').frame, 40);
      assert.equal(pair.events.some(event => event.name === 'footer'), false);
    };
    for (let frame = 0; frame <= 14; frame++) paint(state, 100 + frame);
    assertHeld(paint(state, 114), 14);
    for (const update of [115, 115, 118, 500]) assertHeld(paint(state, update, false), 15);
    fail(true);
    assert.equal(paint(state, 501).presented, false);
    fail(false); screens.retryStockScreen();
    assertHeld(paint(state, 502), 14);
    let pair = paint(state, 503, false); assertHeld(pair, 15);
    assert.equal(screens.presentHomeEntryMotion(pair.state), true);
    assert.equal(screens.presentHomeEntryMotion(pair.state), false, 'a receipt cannot be consumed twice');
    assertHeld(paint(state, 503), 15);
    fail(true);
    assert.equal(paint(state, 504).presented, false);
    fail(false); screens.retryStockScreen();
    assertHeld(paint(state, 505), 15);
    pair = paint(state, 506, false);
    assert.deepEqual(pair.result.entryMotion.pauseLower, { fadeFrame: null, footerFrame: 0 });
    assert.equal(pair.events.some(event => event.name === 'pause-lower'), false);
    assert.equal(pair.events.find(event => event.name === 'footer').pauseFrame, 0);
    assert.equal(screens.presentHomeEntryMotion(pair.state), true);
  });
});

test('Health pause spends one step per valid pair across the captured seven-update gaps', async t => {
  // Valid receipts from ipad-health-normal/capture.json at 77de274.
  for (const [frame, before, after] of [[11, 211, 218], [13, 226, 233], [18, 254, 261]]) {
    await t.test(`pause ${frame}, HOME updates ${before} to ${after}`, async () => {
      await fixture(({ screens, paint }) => {
        const state = suspended();
        for (let step = 0; step <= frame; step++) paint(state, before - frame + step);
        const pair = paint(state, after, false);
        assert.equal(pair.result.entryMotion.pauseFrame, frame + 1);
        assert.equal(screens.homeEntryMotionActive(pair.state), true);
        const pending = paint(state, after + 2, false);
        assert.deepEqual(pending.result.entryMotion, pair.result.entryMotion, 'pending pixels retain their selected source step');
        assert.equal(screens.presentHomeEntryMotion(pending.state), true);
        assert.equal(screens.presentHomeEntryMotion(pending.state), false, 'each receipt is consumed once');
        const duplicate = paint(state, after + 2);
        assert.deepEqual(duplicate.result.entryMotion, pair.result.entryMotion, 'same-update paints spend no step');
        assert.equal(paint(state, after + 3).result.entryMotion.pauseFrame, Math.min(20, frame + 2));
      });
    });
  }
});

test('failed window source, diagnostics, context revocation and monotonic retries preserve the last presented late-entry phase', async () => {
  await fixture(({ screens, paint, fail, mutate }) => {
    const state = suspended(); paint(state, 100); let pair = paint(state, 103); assert.equal(appear(pair.events), 0);
    const retainedHome = pair.events.find(event => event.name === 'pause-lower').home;
    paint(state, 104, false); screens.revokeHomeEntryMotionCandidate(); assert.equal(screens.presentHomeEntryMotion(at(state, 105)), false);
    pair = paint(state, 106); assert.equal(appear(pair.events), 0);
    assert.equal(launcherSceneFrame(pair.events), 2);
    assert.equal(hudFrame(pair.events), 2);
    assert.equal(pair.events.find(event => event.name === 'pause-lower').frame, 3); assert.equal(pair.events.find(event => event.name === 'pause-lower').home, retainedHome);
    fail(true); pair = paint(state, 107); assert.equal(screens.stockStatus(pair.state), 'error'); assert.equal(pair.presented, false);
    fail(false); screens.retryStockScreen(); pair = paint(state, 108); assert.equal(appear(pair.events), 0);
    assert.equal(hudFrame(pair.events), 2);
    paint(state, 109, false, { homeCursorLoopFrame: 0 }); assert.equal(screens.presentHomeEntryMotion(at(state, 109)), false);
    pair = paint(state, 110); assert.equal(appear(pair.events), 0);
    assert.equal(hudFrame(pair.events), 2);
    paint({ ...state, system: { ...state.system, sleeping: true } }, 111, false);
    pair = paint(state, 112); assert.equal(appear(pair.events), 0); assert.equal(pair.events.find(event => event.name === 'pause-lower').frame, 3);
    assert.equal(hudFrame(pair.events), 2);
    pair = paint(state, 4000); assert.equal(appear(pair.events), 0);
    assert.equal(hudFrame(pair.events), 4, 'a valid pair after a live gap spends one step');
    pair = paint(state, 4003); assert.equal(appear(pair.events), 0);
    assert.equal(hudFrame(pair.events), 6);
    mutate(source => source.launcher.animations.LncBase_U_00_Appear.groups = ['G_Hud_00', 'G_Btm_00']);
    pair = paint(state, 4004); assert.equal(screens.stockStatus(pair.state), 'error'); assert.match(String(screens.stockFailure()), /appearance source unavailable/); assert.equal(pair.presented, false);
  });
});

test('replacement owner or capture generation cannot acknowledge or advance an old appearance candidate', async () => {
  await fixture(({ screens, paint, capture, setOwner }) => {
    const state = suspended();
    for (let frame = 0; frame <= 14; frame++) paint(state, 100 + frame);
    paint(state, 115, false);
    capture(state.system.runtime.application, 2); assert.equal(screens.presentHomeEntryMotion(at(state, 115)), false);
    let pair = paint(state, 116); assert.equal(appear(pair.events), 0);
    assert.deepEqual(pair.result.entryMotion.pauseLower, { fadeFrame: 0, footerFrame: null });
    pair = paint(state, 117); assert.equal(appear(pair.events), 0);
    assert.equal(hudFrame(pair.events), 2);
    const owner = 'health-safety:replacement';
    const replacement = { ...state, system: { ...state.system, runtime: { ...state.system.runtime, application: owner, homeReturn: owner,
      instances: { [owner]: { ...state.system.runtime.instances[state.system.runtime.application], id: owner } } } } };
    paint(state, 118, false); capture(owner, 3); setOwner(owner);
    assert.equal(screens.presentHomeEntryMotion(at(replacement, 118)), false);
    pair = paint(replacement, 119); assert.equal(appear(pair.events), 0); assert.equal(hudFrame(pair.events), 0);
    assert.deepEqual(pair.result.entryMotion.pauseLower, { fadeFrame: 0, footerFrame: null });
    pair = paint(replacement, 120); assert.equal(appear(pair.events), 0); assert.equal(hudFrame(pair.events), 2);
    capture('foreign', 4); pair = paint(replacement, 121); assert.equal(screens.stockStatus(pair.state), 'error'); assert.equal(pair.presented, false);
  });
});

test('resuming and pausing the same owner starts a fresh lower capture generation', async () => {
  await fixture(({ screens, paint, capture }) => {
    const first = suspended(), owner = first.system.runtime.application;
    let pair = paint(first, 100); const firstApplication = pair.events.find(event => event.name === 'pause-lower').application;
    for (let frame = 1; frame <= 22; frame++) pair = paint(first, 100 + frame);
    assert.equal(pair.result.entryMotion.pauseFrame, 20);
    assert.equal(screens.homeEntryMotionActive(pair.state), false);
    const resumed = touchSystem(first, 160, 226, 7000);
    assert.equal(resumed.system.phase, 'app'); assert.equal(resumed.system.runtime.application, owner);
    const repeated = reduceSystem(resumed, 'home', 7100);
    capture(owner, 2);
    pair = paint(repeated, 201, false);
    assert.equal(hudFrame(pair.events), 0);
    const lower = pair.events.find(event => event.name === 'pause-lower');
    assert.equal(lower.frame, 0); assert.notEqual(lower.application, firstApplication);
    assert.deepEqual(pair.result.entryMotion.pauseLower, { fadeFrame: 0, footerFrame: null });
    assert.equal(screens.presentHomeEntryMotion(pair.state), true);
  });
});

test('reduced window endpoint uses the existing pause receipt and cannot replay a published midpoint', async () => {
  await fixture(({ screens, paint }) => {
    const state = suspended(); paint(state, 100); paint(state, 103); screens.setReducedMotion(true);
    let pair = paint(state, 104, false); assert.equal(appear(pair.events), 10); assert.equal(pair.result.entryMotion.pauseFrame, 20); assert.equal(pair.result.entryMotion.pauseLower, null);
    assert.equal(hudFrame(pair.events), 40); assert.equal(pane(hud(pair.events), 'N_Scene_00').alpha, 255);
    screens.setReducedMotion(false); assert.equal(screens.presentHomeEntryMotion(at(state, 105)), false);
    pair = paint(state, 105); assert.equal(appear(pair.events), 0);
    assert.equal(hudFrame(pair.events), 2);
    screens.setReducedMotion(true); pair = paint(state, 106, false); assert.equal(appear(pair.events), 10);
    assert.equal(screens.presentHomeEntryMotion(pair.state), true);
    screens.setReducedMotion(false); pair = paint(state, 107); assert.equal(appear(pair.events), 10);
    assert.equal(hudFrame(pair.events), 40);
    assert.equal(screens.homeEntryMotionActive(pair.state), false);
  });
  await fixture(({ screens, paint }) => {
    screens.setReducedMotion(true); const pair = paint(suspended(), 100, false); assert.equal(appear(pair.events), 10);
    assert.equal(launcherSceneFrame(pair.events), 40);
    assert.equal(hudFrame(pair.events), 40);
    assert.equal(screens.presentHomeEntryMotion(pair.state), true);
  });
});

test('an unpublished reduced endpoint cannot replace the accepted lower HOME snapshot', async () => {
  await fixture(({ screens, paint }) => {
    const state = suspended(); paint(state, 100);
    let pair = paint(state, 103);
    assert.equal(pair.result.entryMotion.pauseFrame, 1);
    const accepted = pair.events.find(event => event.name === 'pause-lower').home;
    const acceptedByte = accepted.data[0];
    screens.setReducedMotion(true);
    pair = paint(state, 104, false);
    assert.equal(pair.result.entryMotion.pauseFrame, 20);
    assert.equal(pair.result.entryMotion.pauseLower, null);
    screens.setReducedMotion(false);
    pair = paint(state, 105, false);
    assert.equal(pair.result.entryMotion.pauseFrame, 1);
    const rebased = pair.events.find(event => event.name === 'pause-lower').home;
    assert.equal(rebased, accepted);
    assert.equal(rebased.data[0], acceptedByte);
  });
});

test('compact keeps pause appearance while dialog, close, stale capture and disposal keep existing boundaries', async () => {
  await fixture(({ screens, paint, capture, assets }) => {
    const state = suspended(); paint(state, 100);
    const compact = settleHomeNavigation(selectHomeSlot(state, state.selected + 1));
    let pair = paint(compact, 101); assert.equal(appear(pair.events), 0); assert.equal(pane(window(pair.events), 'N_Wndw_00').alpha, 0);
    assert.equal(launcherSceneFrame(pair.events), 2); assert.equal(pane(window(pair.events), 'N_Root_00').alpha, 0);
    assert.equal(hudFrame(pair.events), 2);
    const dialog = reduceSystem(state, 'back', 6700); pair = paint(dialog, 102); assert.equal(appear(pair.events), undefined); assert.equal(pair.events.some(event => event.name === 'pause-lower'), false);
    assert.equal(hudFrame(pair.events), 41, 'dialog retains its settled HUD');
    const close = reduceSystem(dialog, 'open', 6800); pair = paint(close, 103); assert.equal(appear(pair.events), undefined); assert.equal(pair.events.some(event => event.name === 'pause-lower'), false);
    assert.equal(hudFrame(pair.events), 41, 'close retains its settled HUD');
    assert.equal(window(pair.events).options.bindings.find(binding => binding.name.endsWith('_WhiteBlack')).frame, 0, 'close composition retains its existing selector');
    capture(state.system.runtime.application, 1, 'pending'); pair = paint(state, 104); assert.equal(screens.stockStatus(pair.state), 'error'); assert.equal(pair.presented, false); assert.equal(pair.events.some(event => event.name === 'pause-lower'), false);
    capture(); screens.retryStockScreen(); pair = paint(state, 105); assert.equal(appear(pair.events), 0, 'retry retains the pause receipt from the compact pair');
    paint(state, 106, false); screens.setFirmwareAssets(assets()); assert.equal(screens.presentHomeEntryMotion(at(state, 106)), false);
    pair = paint(state, 107, false); assert.equal(appear(pair.events), 0);
    assert.equal(hudFrame(pair.events), 0);
    screens.dispose(); assert.equal(screens.presentHomeEntryMotion(pair.state), false);
  });
});

test('a failed native pause HUD cannot publish the pair or draw the reconstructed status fallback', async () => {
  await fixture(({ screens, paint, failHud }) => {
    const state = suspended(); paint(state, 100);
    failHud(true);
    const failed = paint(state, 101);
    assert.equal(screens.stockStatus(failed.state), 'error');
    assert.match(String(screens.stockFailure()), /Native HOME pause HUD unavailable/);
    assert.equal(failed.presented, false);
    assert.equal(screens.presentHomeEntryMotion(failed.state), false);
    failHud(false); screens.retryStockScreen();
    const retried = paint(state, 102);
    assert.equal(hudFrame(retried.events), 0, 'failure did not spend the accepted phase');
    assert.equal(retried.presented, true);
  });
});

test('ordinary HOME keeps its existing settled HUD dispatch', async () => {
  await fixture(({ paint }) => {
    const pair = paint(tickSystem(createPortfolioState(), 3001), 100);
    assert.equal(hudFrame(pair.events), 41);
    assert.equal(pane(hud(pair.events), 'N_Scene_00').alpha, 255);
    assert.deepEqual(pane(hud(pair.events), 'N_Scene_00').scale, [1, 1]);
  });
});
