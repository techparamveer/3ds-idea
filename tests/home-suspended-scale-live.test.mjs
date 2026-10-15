import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import { createPortfolioState, tickSystem, touchSystem, dispatchSystemEvent, setSystemSleeping } from '../src/os/system.ts';
import { sampleHomeGrid, selectHomeSlot, settleHomeNavigation } from '../src/os/home-navigation.ts';
import { homeTitles } from '../src/os/app-registry.ts';
import { nativePaneParentPath, poseNativeLayout } from '../src/os/native-layout.ts';
import { enableHomeControls, isHomeSwitchPresentationActive } from '../src/os/home-controls.ts';
import * as bannerFunctions from '../src/os/home-banner-host.ts';
import { homeTitleBannerKind } from '../src/os/home-title-banner.ts';
import { applicationCloseNeedsReadyScreen } from '../src/scene/application-close-input.ts';
import { tickHomeNavigationClockObserved } from '../src/os/system.ts';
import { createNativeScreenInputGate } from '../src/os/native-screen-input.ts';
import { escapeUnreadyNativeScreen, releaseUnreadyNativeInput } from '../src/os/native-screen-system.ts';
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
const sceneAst = ts.createSourceFile('console-scene.ts', readFileSync(resolve(root, 'src/scene/console-scene.ts'), 'utf8'), ts.ScriptTarget.Latest, true);
const sceneFunctions = [];
function collectSceneFunctions(node) {
  if (ts.isFunctionDeclaration(node) && ['observeFolderBanner', 'advanceBeforeMutation'].includes(node.name?.text)) sceneFunctions.push(node.getText(sceneAst));
  ts.forEachChild(node, collectSceneFunctions);
}
collectSceneFunctions(sceneAst);
assert.equal(sceneFunctions.length, 2);
const sceneDependencies = { ...bannerFunctions, isHomeSwitchPresentationActive, tickHomeNavigationClockObserved, tickSystem, homeTitleBannerKind, applicationCloseNeedsReadyScreen, dispatchSystemEvent };
const createSceneClock = new Function('initial', 'screens', ...Object.keys(sceneDependencies), `
  let state=initial,homeClockSuspended=false,bannerObservedPhase=state.system.phase,lastBannerRestartBootSince=null,bannerEntryFooterBootSince=null,bannerLabelFailure=false;
  const reduced=false,bannerClock=()=>({generation:'resume-scene',updateCount:state.system.homeClock.updateCount});
  let bannerHost=createHomeBannerHost(bannerClock(),{managerInhibited:false,sceneInhibited:false,loadInhibited:false,nativeWorkerReady:true,activationReady:true,resourceReady:null});
  const folderBanner={syncStockTitles:async()=>{},stockTitleStatus:()=>({ready:true}),status:()=>({ready:true,defaultReady:true})};
  const audio={play(){}};
  ${ts.transpileModule(sceneFunctions.join('\n'), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText}
  observeFolderBanner();
  return {get state(){return state;},get host(){return bannerHost;},
    advance(now){advanceBeforeMutation(now);state=tickSystem(state,now);observeFolderBanner();},
    event(event,now){advanceBeforeMutation(now);const before=state;state=dispatchSystemEvent(state,event,now);observeFolderBanner(bannerClock(),homeApplicationBannerBoundary(before,state));},
    replace(next){state=next;observeFolderBanner();},suspend(value){homeClockSuspended=value;observeFolderBanner();}};
`);
const readPack = path => JSON.parse(readFileSync(resolve(root, 'public/os/firmware/10.7.0-32E/' + path)));
const packs = Object.fromEntries([['launcher', 'launcher.json'], ['messages', 'messages-and-loose.json'], ['hud', 'hud.json']]
  .map(([alias, path]) => [alias, readPack('packs/home/' + path)]));
const flush = () => new Promise(resolve => setImmediate(resolve));
const window = pair => pair.events.find(event => event.name === 'LncBase_U_00' && event.options.bindings?.some(binding => binding.name === 'LncBase_U_00_ScaleUpDown'));
const scale = pair => window(pair)?.options.bindings.find(binding => binding.name === 'LncBase_U_00_ScaleUpDown')?.frame;
const pane = (pair, name) => nativePaneParentPath(window(pair).pose, name).at(-1);

// Native sessions, HOME composition and source posing run here. Canvas/GPU and
// asynchronous asset delivery are the browser boundaries supplied by the fixture.
async function fixture(run, options = {}) {
  const saved = new Map(['document', 'Image', 'FontFace', '__scaleLoad'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const events = [], loads = [], homePacks = structuredClone(packs), pixelSnapshots = new Map();
  let failure = null, notice = null;
  function canvas() {
    const surface = { width: 0, height: 0, marks: [] };
    const ctx = new Proxy({ canvas: surface, globalAlpha: 1, globalCompositeOperation: 'source-over',
      clearRect() { surface.marks = []; }, fillRect() { surface.marks.push(['fill', ctx.fillStyle]); },
      drawImage(source) { if (source.marks) surface.marks = source.marks.map(mark => mark.slice()); },
      createLinearGradient: () => ({ addColorStop() {} }),
      getImageData(_x, _y, width, height) {
        const data = new Uint8ClampedArray(width * height * 4), id = pixelSnapshots.size + 1;
        new DataView(data.buffer).setUint32(0, id);
        pixelSnapshots.set(id, surface.marks.map(mark => mark.slice())); return { width, height, data };
      },
      createImageData(width, height) { return { width, height, data: new Uint8ClampedArray(width * height * 4) }; },
      putImageData(image) { surface.marks = (pixelSnapshots.get(new DataView(image.data.buffer).getUint32(0)) ?? [['pixels', image.width, image.height]]).map(mark => mark.slice()); },
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
        events.push({ name, options, pose }); ctx.canvas.marks.push(['native', name]);
        const scale = options.bindings?.find(binding => binding.name === 'LncBase_U_00_ScaleUpDown');
        if (scale) ctx.canvas.marks.push(['upper-scale', scale.frame]);
        return name !== failure;
      }, drawLayout() { return true; }, dispose() {} };
  }
  const assets = { renderer: renderer(homePacks), sharedFont: { draw() {} }, dispose() {}, diagnostics: [],
    titleIconPixels: new Map(homeTitles.filter(title => title.titleId).map(title => [title.titleId.toLowerCase(), { width: 48, height: 48, data: new Uint8ClampedArray(48 * 48 * 4) }])),
    titleIcons: new Map(homeTitles.filter(title => title.titleId).map(title => [title.titleId.toLowerCase(), {}])),
    titleDescriptions: new Map([['0004001000022300', 'Health and Safety Information'], ['0004001000022400', 'Nintendo 3DS Camera']]) };
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

async function initialHome(f, controls = true, appId = 'health-safety') {
  let state = tickSystem(createPortfolioState(), 3001);
  if (controls) state = enableHomeControls(state);
  const slot = Number(Object.entries(state.system.layout).find(([, id]) => id === appId)[0]);
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
  if (appId === 'camera') {
    for (let page = 0; page < 5; page++) state = dispatchSystemEvent(state, { type: 'action', id: 'guide-next' }, 7010 + page);
    f.paint(state); await flush();
    assert.equal(state.system.runtime.instances[state.system.runtime.application].state.screen, 'main');
  }
  assert.equal(f.screens.stockStatus(state), 'ready');
  state = dispatchSystemEvent(state, { type: 'button', command: 'home', phase: 'down', source: 'physical:HOME' }, 7100);
  return dispatchSystemEvent(state, { type: 'button', command: 'home', phase: 'up', source: 'physical:HOME' }, 7101);
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

function controls(f, initial) {
  let state = initial, now = 7101;
  const gate = createNativeScreenInputGate();
  state = tickHomeNavigationClockObserved(state, now).state;
  return {
    get state() { return state; },
    advance(count = 1, paint = true, receipt = true, reduced = false) {
      let pair;
      for (let i = 0; i < count; i++) {
        now += 1000 / 60 - state.system.homeClock.remainderMs + .001;
        state = tickHomeNavigationClockObserved(state, now, reduced, f.screens.homeResumeUpperActive(state)).state;
        if (paint) pair = f.paint(state, receipt);
      }
      return pair;
    },
    event(event) { state = dispatchSystemEvent(state, event, ++now); },
    sceneEvent(event) {
      state = tickHomeNavigationClockObserved(state, ++now).state;
      const status = f.screens.stockStatus(state);
      if (status === 'loading' || status === 'error') gate.cancelHeld(state.system.input, state.system.homeControls?.input);
      state = releaseUnreadyNativeInput(state, status, now);
      const decision = gate(event, f.screens.stockStatus(state), f.screens.homeResumeInputSource(state));
      if (decision === 'home') state = escapeUnreadyNativeScreen(state, now);
      else if (decision === 'pass') state = dispatchSystemEvent(state, event, now);
      return decision;
    },
    consumeHomeResume(sourceState = state) {
      if (!gate.takeHomeResume(f.screens.stockStatus(sourceState), f.screens.homeResumeInputSource(sourceState))) return false;
      this.sceneEvent({ type: 'command', command: 'home' });
      return true;
    },
    cancelHomeResume() { gate.cancelHomeResume(); },
    key(command) {
      this.event({ type: 'button', command, phase: 'down', source: 'keyboard:' + command });
      this.advance(2, false);
      this.event({ type: 'button', command, phase: 'up', source: 'keyboard:' + command });
    },
    touch(slot) {
      const grid = sampleHomeGrid(state.system.homeNavigation), point = grid.slots[slot];
      this.event({ type: 'touch', phase: 'down', x: point.x - grid.scrollPixels, y: point.y, pointerId: 91 });
      this.advance(2, false);
      this.event({ type: 'touch', phase: 'up', x: point.x - grid.scrollPixels, y: point.y, pointerId: 91 });
    },
    resume(route) {
      if (route === 'home') this.event({ type: 'button', command: 'home', phase: 'down', source: 'physical:HOME' });
      else {
        this.event({ type: 'touch', phase: 'down', x: 260, y: 226, pointerId: 73 });
        this.event({ type: 'touch', phase: 'up', x: 260, y: 226, pointerId: 73 });
      }
      assert.equal(state.system.phase, 'app');
      assert.equal(state.system.runtime.active, state.system.runtime.application);
    },
  };
}
const logical = d => d.state.system.homeSuspendedScale;
function settled(state) {
  const nav = state.system.homeNavigation, touch = state.system.homeControls.tileTouch;
  return !nav.motion && !nav.gesture && !state.system.input.touch && !touch.strokeOwned && !touch.globalCapture
    && Object.values(touch.widgets).every(widget => widget.state === 0 && !widget.capture && !widget.select.status && !widget.decide.status);
}
async function compact(f, appId = 'health-safety') {
  const d = controls(f, await initialHome(f, true, appId)), selected = d.state.selected;
  d.advance(40);
  d.key('right'); d.advance(40);
  assert.equal(logical(d).current, 0);
  return { d, selected };
}
function startExpansion(d, selected, route = 'left') {
  if (route === 'touch') d.touch(selected); else d.key('left');
  for (let i = 0; i < 40 && (logical(d).target !== 15 || !settled(d.state)); i++) d.advance(1, false);
  assert.equal(d.state.selected, selected);
  assert.equal(logical(d).target, 15); assert.equal(settled(d.state), true);
  assert.ok(logical(d).current < 15, 'input settles before the source expansion endpoint');
}
function departure(f, d) {
  let pair = f.paint(d.state, false);
  assert.equal(pair.result?.resume?.kind, 'footer');
  assert.notDeepEqual(pair.upper, [['fill', '#000']]); assert.notDeepEqual(pair.lower, [['fill', '#000']]);
  for (let i = 0; pair.result.resume.kind === 'footer' && i < 20; i++) {
    assert.equal(f.screens.presentHomeEntryMotion(d.state), true);
    d.advance(1, false);
    pair = f.paint(d.state, false);
  }
  assert.equal(pair.result.resume.kind, 'departure');
  return pair;
}

function sceneControls(f, initial) {
  const scene = createSceneClock(initial, f.screens, ...Object.values(sceneDependencies));
  let now = 7101;
  scene.advance(now);
  return {
    get state() { return scene.state; }, get host() { return scene.host; },
    replace: next => scene.replace(next), suspend: value => scene.suspend(value),
    advance(count = 1, paint = true, receipt = true) {
      let pair;
      for (let i = 0; i < count; i++) {
        now += 1000 / 60 - scene.state.system.homeClock.remainderMs + .001;
        scene.advance(now); if (paint) pair = f.paint(scene.state, receipt);
      }
      return pair;
    },
    event(event) { scene.event(event, ++now); },
    key(command) {
      this.event({ type: 'button', command, phase: 'down', source: 'keyboard:' + command });
      this.advance(2, false);
      this.event({ type: 'button', command, phase: 'up', source: 'keyboard:' + command });
    },
  };
}

test('public HOME initial Appear stays separate and render samples every ordinary upper scale step', async () => {
  await fixture(async f => {
    const state = await initialHome(f), first = f.paint(state, false), d = controls(f, state);
    assert.equal(scale(first), 15);
    assert.equal(window(first).options.bindings.find(binding => binding.groups?.includes('G_Wndw_00')).frame, 0);
    assert.equal(pane(first, 'N_Wndw_00').alpha, 0);
    d.advance(40); const selected = d.state.selected, owner = d.state.system.runtime.application;
    for (const [command, frames] of [['right', Array.from({ length: 16 }, (_, i) => 15 - i)], ['left', Array.from({ length: 16 }, (_, i) => i)]]) {
      const seen = [logical(d).current];
      d.event({ type: 'button', command, phase: 'down', source: 'keyboard:' + command });
      for (let i = 0; i < 40; i++) {
        const pair = d.advance();
        assert.equal(scale(pair), logical(d).current);
        assert.equal(d.state.system.runtime.application, owner);
        if (seen.at(-1) !== scale(pair)) seen.push(scale(pair));
        if (i === 1) d.event({ type: 'button', command, phase: 'up', source: 'keyboard:' + command });
      }
      assert.deepEqual(seen, frames);
      assert.equal(f.screens.homeEntryMotionActive(d.state), false);
      assert.deepEqual(pane(f.paint(d.state), 'W_Wndw_00').size, command === 'left' ? [296, 132] : [48, 48]);
    }
    assert.equal(d.state.selected, selected);
    assert.equal(f.screens.stockFailure(), null);
  });
});

test('withheld renders spend all upper passes and duplicate paints/receipts do not spend any', async () => {
  await fixture(async f => {
    const { d, selected } = await compact(f);
    startExpansion(d, selected);
    const start = logical(d);
    d.advance(5, false);
    assert.equal(logical(d).current, start.current + 5);
    const expected = logical(d), pair = f.paint(d.state, false);
    assert.equal(scale(pair), expected.current);
    assert.equal(scale(f.paint(d.state, false)), expected.current);
    assert.equal(logical(d), expected);
    assert.equal(f.screens.presentHomeEntryMotion(d.state), true);
    assert.equal(f.screens.presentHomeEntryMotion(d.state), false);
    assert.equal(logical(d), expected);
    d.key('right');
    for (let i = 0; logical(d).target !== 0 && i < 40; i++) d.advance(1, false);
    const reversed = logical(d);
    d.advance(1, false);
    assert.equal(logical(d).current, reversed.current - 1);
    assert.equal(scale(f.paint(d.state)), logical(d).current);
  });
});

test('a delayed receipt accepts its displayed frame after logical scale reaches the endpoint', async () => {
  for (const route of ['touch', 'home']) await fixture(async f => {
    const { d, selected } = await compact(f); startExpansion(d, selected);
    while (logical(d).current < 14) d.advance(1, false);
    const pair = f.paint(d.state, false), before = logical(d);
    assert.equal(scale(pair), 14);
    d.advance(1, false);
    assert.equal(logical(d).current, 15); assert.equal(logical(d).epoch, before.epoch);
    assert.equal(f.screens.presentHomeEntryMotion(d.state), true);
    assert.equal(f.screens.presentHomeEntryMotion(d.state), false);
    d.resume(route);
    assert.equal(scale(departure(f, d)), 15, 'departure requires a newly composed and accepted expanded upper');
  });
});

test('quick footer and physical HOME Resume expand accepted intermediate Health and Camera pairs', async () => {
  for (const appId of ['health-safety', 'camera']) for (const route of ['touch', 'home']) for (const selection of ['touch', 'left']) await fixture(async f => {
    const { d, selected } = await compact(f, appId); startExpansion(d, selected, selection);
    d.advance(2, false);
    const accepted = f.paint(d.state), frame = scale(accepted);
    assert.ok(frame > 0 && frame < 15, JSON.stringify({ appId, route, selection, frame, logical: logical(d), failure: String(f.screens.stockFailure()) }));
    d.advance(2, false);
    assert.equal(scale(f.paint(d.state, false)), frame + 2);
    d.resume(route);
    const pair = departure(f, d);
    assert.equal(scale(pair), 15);
    assert.deepEqual(pane(pair, 'W_Wndw_00').size, [296, 132]);
    assert.equal(f.screens.stockFailure(), null);
  });
});

test('rapid HOME after unpublished Health or Camera reselection cannot expose two black LCDs', async () => {
  for (const appId of ['health-safety', 'camera']) for (const releaseBeforeReceipt of [false, true]) await fixture(async f => {
    const { d, selected } = await compact(f, appId);
    d.key('left'); d.advance(3, false);
    assert.equal(d.state.selected, selected);
    assert.equal(f.screens.stockStatus(d.state), 'loading', 'the selected HOME pair has not been painted or accepted');
    assert.equal(d.sceneEvent({ type: 'button', command: 'home', phase: 'down', source: 'keyboard:KeyH' }), 'block');
    const pair = f.paint(d.state, false);
    assert.notDeepEqual([pair.upper, pair.lower], [[['fill', '#000']], [['fill', '#000']]],
      `early HOME must retain a complete visible pair: ${JSON.stringify({ phase: d.state.system.phase, result: pair.result, status: f.screens.stockStatus(d.state) })}`);
    assert.equal(d.state.system.phase, 'home', 'the request waits for paired publication');
    assert.equal(d.consumeHomeResume(), false, 'a paint alone cannot release the request');
    if (releaseBeforeReceipt) assert.equal(d.sceneEvent({ type: 'button', command: 'home', phase: 'up', source: 'keyboard:KeyH' }), 'block');
    assert.equal(f.screens.presentHomeEntryMotion(d.state), true);
    assert.equal(d.consumeHomeResume(), true, 'the accepted source releases the same pending request');
    assert.equal(d.state.system.phase, 'app');
    assert.equal(d.consumeHomeResume(), false, 'the input is consumed once');
    const resumed = f.paint(d.state, false);
    assert.equal(resumed.result?.resume?.kind, 'footer');
    assert.notDeepEqual([resumed.upper, resumed.lower], [[['fill', '#000']], [['fill', '#000']]]);
    if (!releaseBeforeReceipt) {
      assert.equal(d.sceneEvent({ type: 'button', command: 'home', phase: 'up', source: 'keyboard:KeyH' }), 'block');
      assert.equal(d.state.system.phase, 'app', 'the physical release cannot suspend the resumed owner');
    }
  });
});

test('Resume footer continues the admitted upper scale before expanded SceneOut', async () => {
  for (const appId of ['health-safety', 'camera']) await fixture(async f => {
    const { d, selected } = await compact(f, appId);
    startExpansion(d, selected);
    const accepted = f.paint(d.state), start = scale(accepted);
    assert.ok(start < 15);
    d.resume('home');
    const pair = d.advance();
    assert.equal(pair.result?.resume?.kind, 'footer');
    assert.equal(scale(pair), start + 1, 'Resume must grow the upper window while its footer leaves');
    assert.equal(pair.result.resume.upperScaleFrame, start + 1);
    assert.deepEqual(pair.upper.filter(mark => mark[0] === 'upper-scale'), [['upper-scale', start + 1]], 'the final upper pixels contain the sampled pose');
  });
});

test('actual scene passes grow the resumed upper and retire its outgoing banner during the footer', async () => {
  for (const appId of ['health-safety', 'camera']) {
    let d;
    await fixture(async f => {
      d = sceneControls(f, await initialHome(f, true, appId)); d.advance(40);
      const away = appId === 'health-safety' ? 'right' : 'left', back = away === 'right' ? 'left' : 'right';
      d.key(away); d.advance(40);
      assert.equal(logical(d).current, 0);
      const outgoing = getHomeBannerHostView(d.host).primary;
      assert.equal(outgoing.motion.visible, true);
      d.key(back);
      for (let i = 0; i < 40 && (logical(d).target !== 15 || !settled(d.state)); i++) d.advance(1, false);
      assert.ok(logical(d).current < 15);
      f.paint(d.state);
      d.event({ type: 'button', command: 'home', phase: 'down', source: 'physical:HOME' });
      assert.equal(d.state.system.phase, 'app');
      assert.equal(f.screens.homeResumeUpperActive(d.state), true);
      assert.equal(d.host.inputs.managerInhibited, false);
      const rows = [];
      for (let i = 0; i < 30; i++) {
        if (i === 2) {
          const scale = logical(d), update = d.state.system.homeClock.updateCount, primary = getHomeBannerHostView(d.host).primary;
          d.suspend(true); d.advance(30, false);
          assert.equal(logical(d), scale); assert.equal(d.state.system.homeClock.updateCount, update);
          assert.deepEqual(getHomeBannerHostView(d.host).primary, primary);
          assert.equal(d.host.inputs.managerInhibited, true);
          d.suspend(false);
        }
        const pair = d.advance(), view = getHomeBannerHostView(d.host);
        rows.push({ ...pair.result?.resume, upper: pair.upper, view });
        if (pair.result?.resume?.kind === 'departure') break;
      }
      const footer = rows.filter(row => row.kind === 'footer');
      assert.ok(footer.some(row => row.upperScaleFrame > 0 && row.upperScaleFrame < 15));
      assert.ok(footer.some(row => row.upperScaleFrame === 15));
      assert.ok(footer.some(row => row.upper.some(mark => mark[0] === 'banner')), 'outgoing banner is drawn, not replaced by the selected owner');
      assert.ok(footer.some(row => !row.upper.some(mark => mark[0] === 'banner')), 'its source hide completes during the footer');
      for (const row of footer) {
        assert.deepEqual(row.upper.filter(mark => mark[0] === 'upper-scale'), [['upper-scale', row.upperScaleFrame]]);
        if (row.view.status === 'active') assert.equal(row.view.primary.activationEpoch, outgoing.activationEpoch);
      }
      assert.equal(getHomeBannerHostView(d.host).status, 'cleared');
      assert.equal(rows.at(-1).kind, 'departure'); assert.equal(rows.at(-1).upperScaleFrame, 15);
      assert.equal(f.screens.homeResumeUpperActive(d.state), false);
      const stopped = logical(d), update = d.state.system.homeClock.updateCount;
      d.advance(5, false);
      assert.equal(logical(d), stopped); assert.equal(d.state.system.homeClock.updateCount, update);
      assert.equal(d.host.inputs.managerInhibited, true);
      assert.equal(f.screens.stockFailure(), null);
    }, {
      getHomeBanner: () => d ? getHomeBannerHostView(d.host) : undefined,
      drawStockTitleBannerFrame(ctx, _motion, _ticket, kind) { ctx.canvas.marks.push(['banner', kind]); return true; },
    });
  }
});

test('footer terminal waits for an accepted expanded upper, not the latest unpainted logical frame', async () => {
  for (const appId of ['health-safety', 'camera']) await fixture(async f => {
    const { d, selected } = await compact(f, appId); startExpansion(d, selected);
    f.paint(d.state); d.resume('home');
    const start = logical(d).current;
    for (let i = 0; i < 15; i++) {
      const pair = f.paint(d.state);
      assert.equal(pair.result.resume.kind, 'footer'); assert.equal(pair.result.resume.upperScaleFrame, start);
    }
    const terminal = f.paint(d.state, false);
    assert.equal(terminal.result.resume.frame, 14);
    d.advance(20, false);
    assert.equal(logical(d).current, 15);
    assert.equal(f.screens.presentHomeEntryMotion(d.state), true, 'late receipt accepts exactly the compact paint');
    assert.equal(f.screens.homeResumeUpperActive(d.state), true, 'that receipt cannot claim the unpainted expansion');
    const expanded = f.paint(d.state, false);
    assert.equal(expanded.result.resume.kind, 'footer'); assert.equal(expanded.result.resume.frame, 14);
    assert.deepEqual(expanded.upper.filter(mark => mark[0] === 'upper-scale'), [['upper-scale', 15]]);
    assert.equal(f.screens.homeResumeUpperActive(d.state), true, 'paint alone cannot admit SceneOut');
    assert.equal(f.screens.presentHomeEntryMotion(d.state), true);
    assert.equal(f.screens.presentHomeEntryMotion(d.state), false);
    const departure = f.paint(d.state);
    assert.equal(departure.result.resume.kind, 'departure'); assert.equal(departure.result.resume.frame, 0);
    assert.equal(departure.result.resume.upperScaleFrame, 15); assert.equal(scale(departure), 15);
  });
});

test('ordinary expanded Resume keeps the existing footer0..14 then departure0 sequence', async () => {
  for (const appId of ['health-safety', 'camera']) await fixture(async f => {
    const d = controls(f, await initialHome(f, true, appId)); d.advance(40); f.paint(d.state); d.resume('home');
    for (let frame = 0; frame <= 14; frame++) {
      const pair = f.paint(d.state);
      assert.equal(pair.result.resume.kind, 'footer'); assert.equal(pair.result.resume.frame, frame);
      assert.equal(pair.result.resume.upperScaleFrame, 15);
    }
    const pair = f.paint(d.state);
    assert.equal(pair.result.resume.kind, 'departure'); assert.equal(pair.result.resume.frame, 0); assert.equal(scale(pair), 15);
  });
});

test('Resume upper admission and pending expanded receipt retain invalidation guards', async () => {
  for (const reject of ['hidden', 'sleep', 'power', 'owner', 'origin', 'notice', 'resources', 'revoke', 'dispose']) await fixture(async f => {
    const { d, selected } = await compact(f); startExpansion(d, selected); f.paint(d.state); d.resume('home');
    d.advance(20, false); f.paint(d.state, false);
    let state = d.state;
    if (reject === 'hidden') document.hidden = true;
    if (reject === 'sleep') state = setSystemSleeping(state, true, 10000);
    if (reject === 'power') state = { ...state, powered: false };
    if (reject === 'owner') state = { ...state, system: { ...state.system, runtime: { ...state.system.runtime, application: null } } };
    if (reject === 'origin') state = { ...state, selected: state.selected + 1 };
    if (reject === 'notice') f.notice('Unavailable');
    if (reject === 'resources') f.screens.setFirmwareAssets({ ...f.assets });
    if (reject === 'revoke') f.screens.revokeHomeEntryMotionCandidate();
    if (reject === 'dispose') f.screens.dispose();
    if (reject !== 'revoke') assert.equal(f.screens.homeResumeUpperActive(state), false, reject);
    assert.equal(f.screens.presentHomeEntryMotion(state), false, reject);
    const before = state.system.homeSuspendedScale;
    const advanced = tickHomeNavigationClockObserved(state, 20000, false, f.screens.homeResumeUpperActive(state));
    if (reject !== 'revoke' && reject !== 'power' && reject !== 'owner') assert.equal(advanced.state.system.homeSuspendedScale.current, before.current, reject);
  });
});

test('deferred HOME cannot reuse backing across owner context, resource, visibility or input cancellation', async () => {
  for (const reject of ['origin', 'hidden', 'sleep', 'notice', 'resources', 'sequence', 'cancel', 'draw']) await fixture(async f => {
    const { d, selected } = await compact(f); startExpansion(d, selected);
    d.sceneEvent({ type: 'button', command: 'home', phase: 'down', source: 'keyboard:KeyH' });
    f.paint(d.state, false);
    let receiptState = d.state;
    if (reject === 'origin') { d.key('right'); d.advance(30, false); startExpansion(d, selected); receiptState = d.state; }
    if (reject === 'hidden') document.hidden = true;
    if (reject === 'sleep') receiptState = setSystemSleeping(receiptState, true, 15000);
    if (reject === 'notice') f.notice('Test runtime notice');
    if (reject === 'resources') f.screens.setFirmwareAssets({ ...f.assets });
    if (reject === 'sequence') receiptState = { ...receiptState, system: { ...receiptState.system,
      runtime: { ...receiptState.system.runtime, sequence: receiptState.system.runtime.sequence + 1 } } };
    if (reject === 'cancel') d.cancelHomeResume();
    if (reject === 'draw') { f.fail('LncBase_U_00'); f.paint(d.state, false); }
    f.screens.presentHomeEntryMotion(receiptState);
    assert.equal(d.consumeHomeResume(receiptState), false, reject);
    document.hidden = false; f.notice(null); f.fail(null);
    if (reject === 'draw') f.screens.retryStockScreen();
    f.paint(d.state);
    assert.equal(d.consumeHomeResume(), false, `${reject}: later valid backing cannot restore the cancelled request`);
    assert.equal(d.state.system.phase, 'home');
  });
});

test('unaccepted, stale-target and ineligible pairs cannot authorize Resume backing', async () => {
  for (const reject of ['unaccepted', 'origin', 'hidden', 'sleep', 'notice', 'revoke', 'resources', 'sequence', 'dispose']) await fixture(async f => {
    const { d, selected } = await compact(f); startExpansion(d, selected);
    d.advance(2, false); f.paint(d.state, false);
    const before = logical(d);
    let receiptState = d.state;
    if (reject === 'origin') {
      d.key('right'); d.advance(30, false); startExpansion(d, selected);
      receiptState = d.state;
      assert.notEqual(logical(d).epoch, before.epoch);
    }
    if (reject === 'hidden') document.hidden = true;
    if (reject === 'notice') f.notice('Test runtime notice');
    if (reject === 'revoke') f.screens.revokeHomeEntryMotionCandidate();
    if (reject === 'resources') f.screens.setFirmwareAssets({ ...f.assets });
    if (reject === 'sleep') receiptState = setSystemSleeping(receiptState, true, 15000);
    if (reject === 'sequence') receiptState = { ...receiptState, system: { ...receiptState.system,
      runtime: { ...receiptState.system.runtime, sequence: receiptState.system.runtime.sequence + 1 } } };
    if (reject === 'dispose') f.screens.dispose();
    if (reject !== 'unaccepted') assert.equal(f.screens.presentHomeEntryMotion(receiptState), false, reject);
    document.hidden = false; f.notice(null);
    if (reject === 'dispose') return;
    d.resume('home');
    assert.equal(f.paint(d.state, false).result?.resume, undefined, reject);
  });
});

test('resource replacement, diagnostics, failed paints and reduced sampling cannot reset the logical scale', async () => {
  for (const change of ['resources', 'diagnostic', 'draw', 'source', 'notice', 'hidden', 'reduced']) await fixture(async f => {
    const { d, selected } = await compact(f); startExpansion(d, selected); d.advance(3, false);
    const before = logical(d);
    if (change === 'resources') f.screens.setFirmwareAssets({ ...f.assets });
    if (change === 'notice') f.notice('Test runtime notice');
    if (change === 'hidden') document.hidden = true;
    if (change === 'reduced') f.screens.setReducedMotion(true);
    const clip = f.homePacks.launcher.animations.LncBase_U_00_ScaleUpDown;
    if (change === 'draw') f.fail('LncBase_U_00');
    if (change === 'source') delete f.homePacks.launcher.animations.LncBase_U_00_ScaleUpDown;
    const pair = f.paint(d.state, true, change === 'diagnostic' ? { sampleCalendar: false } : undefined);
    assert.equal(logical(d), before, change);
    if (change !== 'draw' && change !== 'source') assert.equal(scale(pair), before.current);
    if (change === 'draw' || change === 'source') {
      assert.ok(f.screens.stockFailure()); f.fail(null);
      f.homePacks.launcher.animations.LncBase_U_00_ScaleUpDown = clip;
      assert.equal(f.screens.retryStockScreen(), true);
    }
    document.hidden = false; f.notice(null);
    d.advance(1, false, true, change === 'reduced');
    assert.equal(logical(d).current, change === 'reduced' ? 15 : before.current + 1);
    assert.equal(logical(d).epoch, before.epoch);
    assert.equal(scale(f.paint(d.state)), logical(d).current);
  });
});
