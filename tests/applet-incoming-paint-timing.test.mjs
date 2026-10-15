import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { createPortfolioState, invokeSystemApplet, tickSystem } from '../src/os/system.ts';
import { enableHomeControls, selectHomeToolbarControlTouch } from '../src/os/home-controls.ts';

const data = source => 'data:text/javascript;base64,' + Buffer.from(source + '\n//# sourceURL=applet-incoming-paint-timing-fixture.js').toString('base64');
const sourceUrl = new URL('../src/os/screens.ts', import.meta.url);
const overrides = {
  './native-system-presentation': data('export const drawNativeSystemOverlay=()=>false;'),
  './home-suspended-window': data(`export {homeSuspendedApplication,homeSuspendedIconDisappeared,homeSuspendedWindowEntryFrame,retainedSuspendedApplication,selectedSuspendedApplication} from '${new URL('../src/os/home-suspended-window.ts', import.meta.url).href}';export const drawHomeSuspendedWindow=()=>true;`),
  './native-chrome': data('export const createNativeChrome=()=>({ready:Promise.resolve(),draw:()=>true,tile:()=>true});'),
  './home-native-layouts': data('export const createHomeLayoutManager=()=>({});'),
  './firmware-presentation': data('export const createFirmwareHome=a=>a.presenter;export const loadFirmwarePresentationAssets=()=>{};'),
  './portfolio-screens': data('export const setPortfolioFont=()=>{};export const createPortfolioGraphics=()=>globalThis.__incomingTimingGraphics;'),
};
const { outputText } = ts.transpileModule(readFileSync(sourceUrl, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { createScreens } = await import(data(outputText.replace(/(from\s*['"])(\.[^'"]+)(['"])/g, (_all, prefix, path, suffix) => prefix + (overrides[path] ?? new URL(path.endsWith('.ts') ? path : `${path}.ts`, sourceUrl).href) + suffix)));
const ms = step => 10000 + step * 1000 / 60 + .01;
const home = () => selectHomeToolbarControlTouch(enableHomeControls(tickSystem(createPortfolioState(), 3001)), 2);
const open = caller => invokeSystemApplet(caller, 'friends', 6400);

async function fixture(measurePaint, run) {
  const saved = new Map(['document', 'Image', 'FontFace', 'performance', '__incomingTimingGraphics'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const events = [];
  let pair;
  let preparedOwner;
  let readings = [];
  let nowCalls = 0;
  function canvas() {
    const surface = { width: 0, height: 0 };
    const ctx = new Proxy({ canvas: surface, globalAlpha: 1, drawImage() {}, createLinearGradient: () => ({ addColorStop() {} }), getImageData(_x, _y, width, height) { return { width, height, data: new Uint8ClampedArray(width * height * 4) }; } }, { get: (target, key) => key in target ? target[key] : (() => {}) });
    surface.getContext = () => ctx;
    return surface;
  }
  const clock = {
    now() {
      nowCalls++;
      const value = readings.length ? readings.shift() : 0;
      events.push(`now:${value}`);
      return value;
    },
  };
  const graphics = {
    ready: Promise.resolve(), selectedApp() {}, syncStockView() {}, readSuspendedCapture: () => ({ status: 'none' }),
    stockStatus: () => 'ready', stockFailure: () => null, retryStockScreen: () => true,
    preparedStockPair: state => preparedOwner === state.system.runtime.active ? pair : undefined,
    appletIncomingResources: state => preparedOwner === state.system.runtime.active && pair ? graphics.resources : undefined,
    resources: {}, setAppletEntryCovered() {}, revokeNotesBootCoverCandidate() {}, notesBootCoverActive: () => false,
    drawAppletIncoming(_state, _top, _bottom, _frame, resources) { assert.equal(resources, graphics.resources); events.push('incoming'); return true; },
    banner() {}, menuIcon() {}, menuArtwork() {},
    overlay(_top, _bottom, state) { events.push('overlay'); pair = {}; preparedOwner = state.system.runtime.active; },
    dispose() { pair = undefined; },
  };
  Object.assign(globalThis, {
    document: { createElement: canvas, fonts: { add() {} } },
    Image: class { decode() { return Promise.resolve(); } },
    FontFace: class { load() { return Promise.resolve(this); } },
    performance: clock,
    __incomingTimingGraphics: graphics,
  });
  const presenter = new Proxy({ pressOffset: 0, tilePressOffset: () => 0, folderChild(_ctx, _state, _empty, draw) { draw(1); return true; }, appletEntry() { events.push('cover'); return true; } }, { get: (target, key) => key in target ? target[key] : (() => true) });
  const screens = createScreens({ measurePaint, firmwareAssets: { presenter, sharedFont: { draw() {} }, dispose() {}, diagnostics: [], titleIcons: new Map(), titleDescriptions: new Map() }, drawHomeBackground: () => true, drawSuspendedBackground: () => true });
  const setReadings = values => { readings = [...values]; nowCalls = 0; events.length = 0; };
  try {
    await screens.ready;
    await run({ screens, events, setReadings, nowCalls: () => nowCalls });
  } finally {
    screens.dispose();
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
}

test('measured applet paints isolate pre-overlay and title incoming cost without changing publication order', async () => {
  for (const measurePaint of [false, true]) await fixture(measurePaint, ({ screens, events, setReadings, nowCalls }) => {
    const caller = home();
    screens.paint(caller, new Date(0), ms(0));
    screens.presentAppletEntry(caller, ms(0));
    screens.setReducedMotion(true);
    const state = open(caller);
    assert.deepEqual(screens.paint(state, new Date(0), ms(1))?.appletEntry, { kind: 'cover', frame: 20, owner: state.system.runtime.active });
    assert.equal(screens.presentAppletEntry(state, ms(1)), true);

    setReadings([100, 107, 110, 115, 124]);
    const incoming = screens.paint(state, new Date(0), ms(2));
    assert.deepEqual(incoming?.appletEntry, { kind: 'incoming', frame: 20, owner: state.system.runtime.active });
    assert.deepEqual(events.filter(event => event === 'overlay' || event === 'incoming'), ['overlay', 'incoming']);
    const timing = screens.paintTiming();
    if (measurePaint) {
      assert.deepEqual(timing, { startedAt: 100, preOverlayMs: 7, overlayMs: 3, titleIncomingMs: 9 });
      assert.equal(nowCalls(), 5);
      timing.preOverlayMs = -1;
      timing.titleIncomingMs = -1;
      assert.deepEqual(screens.paintTiming(), { startedAt: 100, preOverlayMs: 7, overlayMs: 3, titleIncomingMs: 9 });
      assert.equal(screens.presentAppletEntry(state, ms(2)), true, 'measurement does not change incoming publication');
      setReadings([200, 205, 207]);
      screens.paint(state, new Date(0), ms(3), { sampleCalendar: true });
      assert.deepEqual(screens.paintTiming(), { startedAt: 200, preOverlayMs: 5, overlayMs: 2, titleIncomingMs: null });
    } else {
      assert.equal(timing, null);
      assert.equal(nowCalls(), 0, 'disabled diagnostics add no timing reads');
    }
    screens.dispose();
    assert.equal(screens.paintTiming(), null);
  });
});
