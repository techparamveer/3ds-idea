import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import { createPortfolioState, tickSystem, touchSystem, reduceSystem, dispatchSystemEvent, setSystemSleeping } from '../src/os/system.ts';
import { sampleHomeGrid, selectHomeSlot, settleHomeNavigation } from '../src/os/home-navigation.ts';
import { homeTitles } from '../src/os/app-registry.ts';
import { nativePaneParentPath, poseNativeLayout } from '../src/os/native-layout.ts';
import { enableHomeControls } from '../src/os/home-controls.ts';
import { tickHomeNavigationClockObserved } from '../src/os/system.ts';
import { createHomeBannerHost, crossHomeBannerBoundary, stepHomeBannerHost, skipHomeBannerHostPass,
  getHomeBannerHostView, resolveHomeBannerHostSelection, resolveHomeBannerHostObservation,
  homeApplicationBannerBoundary } from '../src/os/home-banner-host.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const data = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const overrides = new Map(Object.entries({
  'native-system-presentation': 'export const drawNativeSystemOverlay=()=>true;',
  'native-chrome': 'export const createNativeChrome=()=>({ready:Promise.resolve(),draw:()=>true,tile:()=>true});',
  'home-native-layouts': 'export const createHomeLayoutManager=()=>({});',
  'native-title-assets': 'export const loadNativeTitleAssets=(...args)=>globalThis.__scaleLoad(...args);',
  'native-renderer': 'export class NativeLayoutRenderer {}',
  'nvidia-banner': 'export const createNvidiaBanner=()=>({ready:Promise.resolve(),draw:()=>false,reset(){},dispose(){}});',
  'hack-ldn-banner': 'export const createHackLdnBanner=()=>({ready:Promise.resolve(),draw:()=>false,reset(){},dispose(){}});',
}).map(([name, source]) => [resolve(root, 'src/os/' + name + '.ts'), data(source)]));
const modules = new Map();
function moduleUrl(path) {
  if (path === resolve(root, 'src/os/system.ts')) return pathToFileURL(path).href;
  if (overrides.has(path)) return overrides.get(path);
  if (modules.has(path)) return modules.get(path);
  const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
    .replace(/from (['"])([^'"]+)\1/g, (_all, _quote, specifier) => {
      const dependency = specifier.startsWith('.') ? resolve(dirname(path), specifier.endsWith('.ts') ? specifier : specifier + '.ts') : null;
      const url = dependency ? specifier.endsWith('.ts') ? pathToFileURL(dependency).href : moduleUrl(dependency) : specifier === 'three'
        ? data(`export * from '${import.meta.resolve('three')}';export class WebGLRenderer{constructor(){throw Error('GPU disabled in fixture');}}`)
        : import.meta.resolve(specifier);
      return `from ${JSON.stringify(url)}`;
    });
  const url = data(code); modules.set(path, url); return url;
}
const { createScreens } = await import(moduleUrl(resolve(root, 'src/os/screens.ts')));
const readPack = path => JSON.parse(readFileSync(resolve(root, 'public/os/firmware/10.7.0-32E/' + path)));
const packs = Object.fromEntries([['launcher', 'launcher.json'], ['messages', 'messages-and-loose.json'], ['hud', 'hud.json']]
  .map(([alias, path]) => [alias, readPack('packs/home/' + path)]));
const flush = () => new Promise(resolve => setImmediate(resolve));
const at = (state, updateCount) => ({ ...state, system: { ...state.system, homeClock: { ...state.system.homeClock, updateCount } } });
const window = pair => pair.events.find(event => event.name === 'LncBase_U_00' && event.options.bindings?.some(binding => binding.name === 'LncBase_U_00_ScaleUpDown'));
const scale = pair => window(pair)?.options.bindings.find(binding => binding.name === 'LncBase_U_00_ScaleUpDown')?.frame;
const pane = (pair, name) => nativePaneParentPath(window(pair).pose, name).at(-1);

// Native sessions, HOME composition and source posing run here. Canvas/GPU and
// asynchronous asset delivery are the browser boundaries supplied by the fixture.
async function fixture(run, options = {}) {
  const saved = new Map(['document', 'Image', 'FontFace', '__scaleLoad'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const events = [], loads = [], homePacks = structuredClone(packs);
  let failure = null, notice = null;
  function canvas() {
    const surface = { width: 0, height: 0, marks: [] };
    const ctx = new Proxy({ canvas: surface, globalAlpha: 1, globalCompositeOperation: 'source-over',
      clearRect() { surface.marks = []; }, fillRect() { surface.marks.push(['fill', ctx.fillStyle]); },
      drawImage(source) { if (source.marks) surface.marks = source.marks.map(mark => mark.slice()); },
      createLinearGradient: () => ({ addColorStop() {} }),
      getImageData(_x, _y, width, height) { return { width, height, data: new Uint8ClampedArray(width * height * 4).fill(127) }; },
      createImageData(width, height) { return { width, height, data: new Uint8ClampedArray(width * height * 4) }; },
      putImageData(image) { surface.marks = [['pixels', image.width, image.height, image.data[0]]]; },
    }, { get: (target, key) => key in target ? target[key] : () => {} });
    surface.getContext = () => ctx; return surface;
  }
  Object.assign(globalThis, {
    document: { createElement: canvas, fonts: { add() {} }, addEventListener() {}, removeEventListener() {}, hidden: false },
    Image: class { decode() { return Promise.resolve(); } }, FontFace: class { load() { return Promise.resolve(this); } },
    __scaleLoad(...args) { let resolve; const pending = new Promise(r => { resolve = r; }); loads.push({ args, resolve }); return pending; },
  });
  function renderer(source) {
    return { packs: source, measureSingleLineText: () => 222,
      draw(ctx, alias, name, options = {}) {
        const pack = source[alias], pose = poseNativeLayout(pack.layouts[name], pack.animations, options.bindings, options.overrides);
        events.push({ name, options, pose }); ctx.canvas.marks.push(['native', name]); return name !== failure;
      }, drawLayout() { return true; }, dispose() {} };
  }
  const assets = { renderer: renderer(homePacks), sharedFont: { draw() {} }, dispose() {}, diagnostics: [],
    titleIconPixels: new Map(homeTitles.filter(title => title.titleId).map(title => [title.titleId.toLowerCase(), { width: 48, height: 48, data: new Uint8ClampedArray(48 * 48 * 4) }])),
    titleIcons: new Map(homeTitles.filter(title => title.titleId).map(title => [title.titleId.toLowerCase(), {}])),
    titleDescriptions: new Map([['0004001000022300', 'Health and Safety Information']]) };
  const screens = createScreens({ firmwareAssets: assets, drawHomeBackground: () => true, runtimeNotice: () => notice,
    drawSuspendedBackground(ctx, capture) {
      events.push({ name: 'retained-upper', capture });
      if (capture.status === 'ready') ctx.canvas.marks.push(['retained', capture.owner, capture.generation]);
      return capture.status === 'none' || capture.status === 'ready';
    }, ...options });
  let now = 10000;
  const paint = (state, receipt = true, verification) => {
    events.length = 0;
    const result = screens.paint(state, new Date(0), now++, verification);
    const pending = screens.homeEntryMotionPublicationPending();
    const presented = receipt && screens.presentHomeEntryMotion(state);
    return { result, events: events.slice(), pending, presented, upper: screens.nativeTop.marks.slice(), lower: screens.bottom.marks.slice() };
  };
  const resolveLoad = async () => {
    const selected = loads.at(-1), source = Object.fromEntries(selected.args[2].map(request => [request.alias, readPack(request.url)]));
    selected.resolve({ renderer: renderer(source), diagnostics: [], dispose() {} }); await flush();
  };
  try { await screens.ready; await run({ screens, paint, resolveLoad, assets, homePacks, fail: name => { failure = name; }, notice: value => { notice = value; } }); }
  finally { screens.dispose(); for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } }
}

async function initialHome(f, controls = false) {
  let state = tickSystem(createPortfolioState(), 3001);
  if (controls) state = enableHomeControls(state);
  const slot = Number(Object.entries(state.system.layout).find(([, id]) => id === 'health-safety')[0]);
  state = settleHomeNavigation(selectHomeSlot(state, slot));
  const grid = sampleHomeGrid(state.system.homeNavigation), point = grid.slots[slot];
  if (controls) {
    const touch = phase => ({ type: 'touch', phase, x: point.x - grid.scrollPixels, y: point.y, pointerId: 89 });
    state = dispatchSystemEvent(state, touch('down'), 3010);
    state = dispatchSystemEvent(state, touch('up'), 3020);
    for (let now = 3037; now <= 3230 && state.system.phase === 'home'; now += 17) state = tickSystem(state, now);
  } else state = touchSystem(state, point.x - grid.scrollPixels, point.y, 3010);
  assert.equal(state.system.phase, 'launch'); f.paint(state); await flush(); await f.resolveLoad();
  state = tickSystem(state, 6500); f.paint(state); state = tickSystem(state, 7000); f.paint(state);
  assert.equal(f.screens.stockStatus(state), 'ready');
  if (!controls) return reduceSystem(state, 'home', 7100);
  state = dispatchSystemEvent(state, { type: 'button', command: 'home', phase: 'down', source: 'physical:HOME' }, 7100);
  return dispatchSystemEvent(state, { type: 'button', command: 'home', phase: 'up', source: 'physical:HOME' }, 7101);
}
function settle(f, state) {
  for (let update = 100; update <= 122; update++) { state = at(state, update); f.paint(state); }
  assert.equal(f.screens.homeEntryMotionActive(state), false); return state;
}
function select(state, slot) {
  const grid = sampleHomeGrid(state.system.homeNavigation), point = grid.slots[slot];
  const next = touchSystem(state, point.x - grid.scrollPixels, point.y, 7200);
  assert.equal(next.selected, slot); return next;
}

test('public HOME reselection retains outgoing Camera through hiding without exposing the suspended Health banner', async () => {
  for (const route of ['touch', 'left']) for (const initialWait of [0, 40]) {
    let host;
    await fixture(async f => {
      let state = await initialHome(f, true), now = 7101;
      const health = state.selected, rows = [];
      const clock = () => ({ generation: 'suspended-banner', updateCount: state.system.homeClock.updateCount });
      const inputs = { managerInhibited: false, sceneInhibited: false, loadInhibited: false,
        nativeWorkerReady: true, activationReady: true, resourceReady: null };
      // Launch retains this primary while foreground software inhibits its manager.
      host = createHomeBannerHost({ ...clock(), updateCount: 0 }, inputs);
      host = crossHomeBannerBoundary(host, host.clock, { selection: { kind: 'app', id: 'health-safety' } });
      host = crossHomeBannerBoundary(host, host.clock, { inputs: { ...inputs, resourceReady: getHomeBannerHostView(host).resourceTicket } });
      host = crossHomeBannerBoundary(host, { ...host.clock, updateCount: 20 });
      host = { ...host, clock: clock(), service: { ...host.service, clock: { ...host.service.clock, updateCount: clock().updateCount } } };
      assert.equal(getHomeBannerHostView(host).primary.selection.id, 'health-safety');
      function paint() {
        const pair = f.paint(state), view = getHomeBannerHostView(host);
        const row = { selected: state.system.layout[state.selected], frame: scale(pair),
          primary: view.status === 'active' ? view.primary : null,
          banners: pair.upper.filter(mark => mark[0] === 'banner').map(mark => mark[1]), owner: state.system.runtime.application };
        if (row.banners.length && row.frame !== undefined) {
          assert.ok(pair.upper.findIndex(mark => mark[0] === 'banner') < pair.upper.findIndex(mark => mark[0] === 'native' && mark[1] === 'LncBase_U_00'),
            'retained primary is composed beneath the suspended window');
        }
        rows.push(row); return row;
      }
      function observe(selection) {
        host = crossHomeBannerBoundary(host, clock(), { selection });
        host = crossHomeBannerBoundary(host, clock(), { inputs: { ...host.inputs, resourceReady: getHomeBannerHostView(host).resourceTicket } });
      }
      function advance(ms = 17) {
        now += ms;
        const before = state, advanced = tickHomeNavigationClockObserved(state, now);
        for (const pass of advanced.passes) {
          state = pass.state;
          let beforeManager, afterManager;
          for (const entry of pass.observations) if (entry.observation.kind === 'banner-resolve') {
            const selection = resolveHomeBannerHostObservation(pass.state, entry.observation);
            if (entry.phase === 'input') beforeManager = selection; else afterManager = selection;
          }
          host = pass.completed ? stepHomeBannerHost(host, clock(), {
            beforeManager: { selection: beforeManager, inputs: { ...host.inputs,
              activationReady: f.screens.homeEntryActivationReady(state) && f.screens.homeFolderBannerActivationReady(state)
                && f.screens.homeAppletFooterBannerReady(state) } },
            afterManager: afterManager ? { selection: afterManager } : undefined,
          }) : skipHomeBannerHostPass(host, clock());
          observe();
        }
        state = advanced.state;
        host = crossHomeBannerBoundary(host, clock());
        observe(homeApplicationBannerBoundary(before, state));
        return paint();
      }
      function event(event) {
        advance(1);
        const before = state;
        state = dispatchSystemEvent(state, event, now);
        observe(homeApplicationBannerBoundary(before, state));
        return paint();
      }
      const wait = count => { for (let i = 0; i < count; i++) advance(); };
      const button = (command, phase) => event({ type: 'button', command, phase, source: 'keyboard:' + command });
      const key = command => { button(command, 'down'); wait(2); button(command, 'up'); };
      const touch = (x, y) => {
        event({ type: 'touch', phase: 'down', x, y, pointerId: 91 }); wait(2);
        event({ type: 'touch', phase: 'up', x, y, pointerId: 91 });
      };
      assert.deepEqual(paint().banners, [], 'initial HOME must not expose its retained launch primary');
      wait(initialWait);
      for (let repeat = 0; repeat < 2; repeat++) {
        const awayStart = rows.length;
        key('right'); wait(40);
        assert.equal(state.system.layout[state.selected], 'camera');
        assert.ok(rows.slice(awayStart).every(row => !row.banners.includes('health')), 'selection-away cannot expose the suspended owner primary');
        assert.deepEqual(rows.at(-1).banners, ['camera']); assert.equal(rows.at(-1).frame, 0);
        const primary = getHomeBannerHostView(host).primary, returnStart = rows.length;
        if (route === 'left') key('left');
        else {
          const grid = sampleHomeGrid(state.system.homeNavigation), point = grid.slots[health];
          touch(point.x - grid.scrollPixels, point.y);
        }
        wait(40);
        const returning = rows.slice(returnStart).filter(row => row.selected === 'health-safety');
        const visible = returning.filter(row => row.primary?.selection.id === 'camera' && row.primary.motion.visible);
        assert.ok(visible.some(row => row.frame > 0 && row.frame < 15), 'the old primary survives into expansion');
        for (const row of visible) {
          assert.deepEqual(row.banners, ['camera'], 'actual outgoing visibility, not selected owner, controls drawing');
          assert.equal(row.primary.activationEpoch, primary.activationEpoch);
          assert.equal(row.primary.requestEpoch, primary.requestEpoch);
        }
        assert.ok(returning.some(row => row.primary?.selection.id === 'camera' && !row.primary.motion.visible));
        assert.ok(returning.every(row => !row.banners.includes('health')));
        assert.equal(getHomeBannerHostView(host).status, 'cleared');
        assert.equal(host.service.lifecycle.requested.target.nativeType, 6);
        assert.equal(rows.at(-1).frame, 15); assert.deepEqual(rows.at(-1).banners, []);
      }
      touch(52, 226); assert.equal(state.system.homeApplicationTransition?.intent.kind, 'close');
      wait(100);
      assert.equal(state.system.runtime.application, null);
      assert.equal(state.system.homeApplicationTransition, null);
      assert.deepEqual(getHomeBannerHostView(host).selection, { kind: 'app', id: 'health-safety' });
      assert.deepEqual(rows.at(-1).banners, ['health'], 'the existing Close request restores the ordinary title banner');
      assert.equal(f.screens.stockFailure(), null);
    }, {
      getHomeBanner: () => host ? getHomeBannerHostView(host) : undefined,
      drawStockTitleBannerFrame(ctx, _motion, _ticket, kind) { ctx.canvas.marks.push(['banner', kind]); return true; },
    });
  }
});

test('real HOME keeps initial Appear separate and presents every source scale pose on away/back', async () => {
  await fixture(async f => {
    let state = await initialHome(f);
    const first = f.paint(at(state, 100), false);
    assert.equal(scale(first), 15);
    assert.equal(window(first).options.bindings.find(binding => binding.groups?.includes('G_Wndw_00')).frame, 0);
    assert.equal(pane(first, 'N_Wndw_00').alpha, 0);
    state = settle(f, state);
    const selected = state.selected, owner = state.system.runtime.application;
    let update = 123;
    for (const [slot, frames] of [[selected + 1, Array.from({ length: 15 }, (_, i) => 14 - i)], [selected, Array.from({ length: 15 }, (_, i) => i + 1)]]) {
      state = select(state, slot);
      for (const frame of frames) {
        state = at(state, update++);
        const pair = f.paint(state, false);
        assert.equal(scale(pair), frame); assert.equal(pair.pending, true);
        assert.equal(state.system.runtime.application, owner);
        assert.equal(f.screens.homeEntryMotionActive(state), true, 'terminal is active until its own pair receipt');
        assert.equal(f.screens.presentHomeEntryMotion(state), true);
        assert.equal(f.screens.presentHomeEntryMotion(state), false, 'duplicate receipt');
      }
      assert.equal(f.screens.homeEntryMotionActive(state), false);
      const endpoint = f.paint(state);
      assert.equal(scale(endpoint), slot === selected ? 15 : 0);
      assert.deepEqual(pane(endpoint, 'W_Wndw_00').size, slot === selected ? [296, 132] : [48, 48]);
      assert.equal(f.screens.stockFailure(), null);
    }
  });
});

test('missing pairs and rapid reversals use the last accepted compositor pose', async () => {
  await fixture(async f => {
    let state = settle(f, await initialHome(f)), selected = state.selected;
    state = at(select(state, selected + 1), 123);
    assert.equal(scale(f.paint(state)), 14);
    const pending = at(state, 124);
    assert.equal(scale(f.paint(pending, false)), 13);
    assert.equal(scale(f.paint(at(pending, 200), false)), 13, 'missed receipt cannot skip source poses');
    state = at(select(pending, selected), 201);
    assert.equal(f.screens.presentHomeEntryMotion(state), false, 'selection invalidates the pending shrinking pair');
    assert.equal(scale(f.paint(state)), 15, 'reversal starts at accepted 14');
    state = at(select(state, selected + 1), 202);
    assert.equal(scale(f.paint(state)), 14);
    assert.equal(scale(f.paint(state)), 14, 'repainting the same logical HOME update cannot advance');
  });
});

test('hidden, sleeping, diagnostic, covered, failed and revoked pairs cannot spend compositor scale progress', async () => {
  for (const reject of ['hidden', 'sleep', 'diagnostic', 'notice', 'draw', 'source', 'revoke']) await fixture(async f => {
    let state = settle(f, await initialHome(f));
    state = at(select(state, state.selected + 1), 123);
    assert.equal(scale(f.paint(state)), 14);
    state = at(state, 124); assert.equal(scale(f.paint(state, false)), 13);
    if (reject === 'hidden') { document.hidden = true; assert.equal(f.screens.presentHomeEntryMotion(state), false); document.hidden = false; }
    if (reject === 'sleep') assert.equal(f.screens.presentHomeEntryMotion(setSystemSleeping(state, true, 7300)), false);
    if (reject === 'notice') { f.notice('Test runtime notice'); assert.equal(f.screens.presentHomeEntryMotion(state), false); f.notice(null); }
    if (reject === 'diagnostic') assert.equal(f.paint(state, true, { sampleCalendar: false }).presented, false);
    if (reject === 'revoke') { f.screens.revokeHomeEntryMotionCandidate(); assert.equal(f.screens.presentHomeEntryMotion(state), false); }
    if (reject === 'draw' || reject === 'source') {
      const clip = f.homePacks.launcher.animations.LncBase_U_00_ScaleUpDown;
      if (reject === 'draw') f.fail('LncBase_U_00'); else delete f.homePacks.launcher.animations.LncBase_U_00_ScaleUpDown;
      assert.equal(f.paint(state).presented, false); assert.ok(f.screens.stockFailure());
      f.fail(null); f.homePacks.launcher.animations.LncBase_U_00_ScaleUpDown = clip;
      assert.equal(f.screens.retryStockScreen(), true);
    }
    assert.equal(scale(f.paint(at(state, 300))), 13, reject + ' cannot promote an unpresented pose');
    assert.equal(f.screens.stockFailure(), null);
  });
});

test('resource replacement, runtime identity and disposal retire pending scale receipts', async () => {
  for (const replace of ['resources', 'sequence', 'dispose']) await fixture(async f => {
    let state = settle(f, await initialHome(f));
    state = at(select(state, state.selected + 1), 123); f.paint(state);
    state = at(state, 124); assert.equal(scale(f.paint(state, false)), 13);
    if (replace === 'resources') f.screens.setFirmwareAssets({ ...f.assets });
    if (replace === 'sequence') state = { ...state, system: { ...state.system, runtime: { ...state.system.runtime, sequence: state.system.runtime.sequence + 1 } } };
    if (replace === 'dispose') f.screens.dispose();
    assert.equal(f.screens.presentHomeEntryMotion(state), false);
    if (replace !== 'dispose') assert.equal(scale(f.paint(at(state, 200))), 0, 'new identity starts at its own initial endpoint');
    else assert.equal(f.screens.homeEntryMotionActive(state), false);
  });
});

async function compactHome(f) {
  let state = settle(f, await initialHome(f)), selected = state.selected;
  state = select(state, selected + 1);
  for (let frame = 14; frame >= 0; frame--) { state = at(state, 137 - frame); assert.equal(scale(f.paint(state)), frame); }
  return { state, selected };
}
function resume(state, route) {
  if (route === 'home') return reduceSystem(state, 'home', 7400);
  state = dispatchSystemEvent(state, { type: 'touch', phase: 'down', x: 210, y: 226, pointerId: 73 }, 7400);
  return dispatchSystemEvent(state, { type: 'touch', phase: 'up', x: 210, y: 226, pointerId: 73 }, 7410);
}

test('rapid Resume retains the accepted expansion pair on both LCDs and keeps its scale through departure', async t => {
  for (const route of ['touch', 'home']) for (const acceptedFrame of [1, 7, 15]) await fixture(async f => {
    let { state, selected } = await compactHome(f);
    state = select(state, selected);
    let acceptedPair;
    for (let frame = 1; frame <= acceptedFrame; frame++) {
      state = at(state, 137 + frame); acceptedPair = f.paint(state); assert.equal(scale(acceptedPair), frame);
    }
    assert.equal(f.screens.stockStatus(state), 'ready');
    state = resume(state, route); assert.equal(state.system.phase, 'app');
    let pair = f.paint(state, false);
    t.diagnostic(JSON.stringify({ route, acceptedFrame, resume: pair.result?.resume ?? null, upper: pair.upper, lower: pair.lower }));
    assert.notDeepEqual(pair.upper, [['fill', '#000']], 'accepted intermediate source must cover pending Health on upper LCD');
    assert.notDeepEqual(pair.lower, [['fill', '#000']], 'accepted intermediate source must cover pending Health on lower LCD');
    assert.equal(pair.result?.resume?.kind, 'footer');
    assert.ok(pair.upper.some(mark => mark[0] === 'pixels' && mark[3] === 127));
    for (let frame = 0; frame <= 14; frame++) {
      assert.equal(pair.result.resume.kind, 'footer'); assert.equal(pair.result.resume.frame, frame);
      assert.ok(pair.upper.some(mark => mark[0] === 'pixels' && mark[3] === 127));
      assert.ok(pair.lower.some(mark => mark[0] === 'pixels' && mark[3] === 127));
      assert.equal(f.screens.presentHomeEntryMotion(state), true); pair = f.paint(state, false);
    }
    for (let frame = 0; frame <= 40; frame++) {
      assert.equal(pair.result.resume.kind, 'departure'); assert.equal(pair.result.resume.frame, frame);
      assert.equal(scale(pair), acceptedFrame, 'SceneOut preserves the accepted ScaleUpDown pose');
      assert.deepEqual(pane(pair, 'N_WndwScale_00').translation, pane(acceptedPair, 'N_WndwScale_00').translation);
      assert.deepEqual(pane(pair, 'W_Wndw_00').size, pane(acceptedPair, 'W_Wndw_00').size);
      assert.ok(pair.upper.some(mark => mark[0] === 'retained'));
      assert.ok(pair.lower.some(mark => mark[0] === 'native' && mark[1] === 'LncPauseFade_D_00'));
      assert.equal(f.screens.presentHomeEntryMotion(state), true); pair = f.paint(state, false);
    }
    assert.equal(f.screens.stockFailure(), null);
  });
});

test('unpresented expansion cannot become a Resume source and a later unpresented pose cannot replace an accepted source', async () => {
  for (const acceptedFrame of [0, 1, 14]) await fixture(async f => {
    let { state, selected } = await compactHome(f); state = select(state, selected);
    for (let frame = 1; frame <= acceptedFrame; frame++) { state = at(state, 137 + frame); f.paint(state); }
    state = at(state, 138 + acceptedFrame); assert.equal(scale(f.paint(state, false)), acceptedFrame + 1);
    state = resume(state, 'touch');
    let pair = f.paint(state, false);
    if (!acceptedFrame) { assert.equal(pair.result?.resume, undefined); return; }
    assert.equal(pair.result.resume.kind, 'footer');
    while (pair.result.resume.kind === 'footer') { f.screens.presentHomeEntryMotion(state); pair = f.paint(state, false); }
    assert.equal(scale(pair), acceptedFrame);
  });
});

test('stale or ineligible expansion receipts cannot authorize the retained Resume source', async () => {
  for (const reject of ['origin', 'hidden', 'sleep', 'notice', 'revoke', 'resources']) await fixture(async f => {
    let { state, selected } = await compactHome(f);
    state = at(select(state, selected), 138); assert.equal(scale(f.paint(state, false)), 1);
    if (reject === 'origin') state = select(select(state, selected + 1), selected);
    if (reject === 'hidden') document.hidden = true;
    if (reject === 'notice') f.notice('Test runtime notice');
    if (reject === 'revoke') f.screens.revokeHomeEntryMotionCandidate();
    if (reject === 'resources') f.screens.setFirmwareAssets({ ...f.assets });
    assert.equal(f.screens.presentHomeEntryMotion(reject === 'sleep' ? setSystemSleeping(state, true, 7300) : state), false);
    document.hidden = false; f.notice(null);
    state = resume(state, 'home'); assert.equal(f.paint(state, false).result?.resume, undefined, reject);
  });
});

test('reversal and reduced Resume retain their own accepted scale pose', async () => {
  for (const reduced of [false, true]) for (const receipt of [false, true]) await fixture(async f => {
    let state = settle(f, await initialHome(f)), selected = state.selected;
    state = select(state, selected + 1);
    for (let frame = 14; frame >= 10; frame--) { state = at(state, 137 - frame); f.paint(state); }
    state = at(select(state, selected), 128); f.screens.setReducedMotion(reduced);
    const expected = reduced ? 15 : 11; assert.equal(scale(f.paint(state, receipt)), expected);
    state = resume(state, 'home'); let pair = f.paint(state, false);
    if (!receipt) { assert.equal(pair.result?.resume, undefined); return; }
    assert.equal(pair.result.resume.kind, 'footer');
    while (pair.result.resume.kind === 'footer') { f.screens.presentHomeEntryMotion(state); pair = f.paint(state, false); }
    assert.equal(scale(pair), expected);
    assert.notDeepEqual(pair.upper, [['fill', '#000']]); assert.notDeepEqual(pair.lower, [['fill', '#000']]);
  });
});
