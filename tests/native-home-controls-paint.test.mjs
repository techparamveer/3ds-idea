import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { createPortfolioState } from '../src/os/system.ts';
import { createHomeInputAdapter } from '../src/os/home-input-adapter.ts';
import { createHomeInputProducer } from '../src/os/home-input-producer.ts';
import { createHomeCursorPresentation } from '../src/os/home-cursor-presentation.ts';
import { enterHomeFolder, getHomeNavigation, writeHomeNavigation, setHomeDensity, settleHomeNavigation } from '../src/os/home-navigation.ts';
import { beginSystemHomeFolderClose, isSystemHomeFolderClosing } from '../src/os/home-folder-close-system.ts';
import { getHomePresentation } from '../src/os/home-presentation.ts';
import { touchHomeGesture } from '../src/os/home-gestures.ts';
import { getHomeDensityControls } from '../src/os/home-density-controls.ts';
import { poseNativeLayout } from '../src/os/native-layout.ts';

const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
async function loadPresentation(name, overrides = {}) {
  const sourceUrl = new URL(`../src/os/${name}.ts`, import.meta.url);
  const { outputText } = ts.transpileModule(readFileSync(sourceUrl, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  const resolved = outputText.replace(/(from\s*['"])(\.[^'"]+)(['"])/g, (_all, prefix, path, suffix) =>
    prefix + (overrides[path] ?? new URL(path.endsWith('.ts') ? path : `${path}.ts`, sourceUrl).href) + suffix);
  return import(moduleUrl(resolved));
}
// Execute the real screen painter. Resource transport and unrelated artwork
// are stubbed; real resource/controller bindings have their own focused tests.
const overrides = {
  './native-chrome': moduleUrl('export const createNativeChrome=()=>({ready:Promise.resolve(),draw:()=>true,tile:()=>true});'),
  './portfolio-screens': moduleUrl('export const setPortfolioFont=()=>{};export const createPortfolioGraphics=()=>({ready:Promise.resolve(),selectedApp:()=>undefined,menuIcon(){},menuArtwork(){},overlay(_top,bottom){bottom.record("overlay");},dispose(){}});'),
  './firmware-presentation': moduleUrl('export const createFirmwareHome=assets=>assets.presenter;export const loadFirmwarePresentationAssets=()=>{throw Error("Unexpected asset load");};'),
};
const { createScreens } = await loadPresentation('screens', overrides);
const { createFirmwareHome } = await loadPresentation('firmware-presentation', {
  './native-renderer': moduleUrl('export class NativeLayoutRenderer {}'),
});
const pack = JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/home/launcher.json', import.meta.url)));
const nativeCursorNames = new Set(['cursor', 'cursorAt', 'cursorEffectAt']);

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
function home() {
  const state = createPortfolioState(), presentation = createHomeCursorPresentation(0);
  const effect = (index, center, scale, disappear) => ({ ...presentation.effects[index], visible: true, center,
    scale: { currentFrame: scale + 1, appliedFrame: scale },
    disappear: { currentFrame: disappear + 1, appliedFrame: disappear, status: 1 },
  });
  return { ...state, system: { ...state.system, phase: 'home',
    homeCursorLoop: { currentFrame: 20.25, appliedFrame: 17.25, step: 3 },
    homeControls: {
      input: createHomeInputAdapter(), producer: createHomeInputProducer(),
      primary: { request: 0, shown: true, layoutVisible: true, center: { x: 26, y: 16 } },
      presentation: { ...presentation, primaryScale: { currentFrame: 12, appliedFrame: 10 },
        effects: [effect(0, { x: -35.5, y: 131 }, 2.375, 9.375), effect(1, { x: 370, y: 16.5 }, 11, 4.25)],
      },
    },
  } };
}
function controls(state, patch) {
  return { ...state, system: { ...state.system, homeControls: { ...state.system.homeControls, ...patch } } };
}
function canvas(events) {
  const surface = { width: 0, height: 0 }, stack = [];
  let clips = [], path = [];
  const context = new Proxy({ canvas: surface, globalAlpha: 1, curves: [],
    record(name, args = []) { events.push({ name, args, context, clips: structuredClone(clips), depth: stack.length }); },
    save() { stack.push({ clips: structuredClone(clips), alpha: context.globalAlpha }); },
    restore() {
      const previous = stack.pop(); assert.ok(previous, 'canvas save/restore must remain balanced');
      clips = previous.clips; context.globalAlpha = previous.alpha;
    },
    beginPath() { path = []; }, rect(...args) { path.push(args); }, clip() { clips.push(...structuredClone(path)); },
    createLinearGradient: () => ({ addColorStop() {} }),
    quadraticCurveTo(...args) { context.curves.push(args); },
    getImageData(_x, _y, width, height) {
      context.record('capture-read');
      return { width, height, data: new Uint8ClampedArray(width * height * 4) };
    },
  }, { get: (target, key) => key in target ? target[key] : (() => {}) });
  surface.getContext = () => context;
  return surface;
}
async function withScreens(run, { native = true, legacyCursorDrawn = true, realToolbar = false } = {}) {
  const saved = new Map(['document', 'Image', 'FontFace'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const events = [];
  Object.assign(globalThis, {
    document: { createElement: () => canvas(events), fonts: { add() {} } },
    Image: class { complete = false; naturalWidth = 0; decode() { return Promise.resolve(); } },
    FontFace: class { load() { return Promise.resolve(this); } },
  });
  const toolbar = realToolbar ? createFirmwareHome({ renderer: { packs: { launcher: pack },
    draw(ctx, bank, name, options) {
      ctx.record('toolbar-layout', [bank, name, options, poseNativeLayout(pack.layouts[name], pack.animations, options.bindings, options.overrides)]);
      return true;
    },
  } }).toolbar : null;
  const presenter = new Proxy({ pressOffset: 0,
    toolbar(ctx, ...args) { ctx.record('toolbar', args); return toolbar ? toolbar(ctx, ...args) : true; },
    folderBannerLabel() {},
    folderChild(ctx, _state, _empty, draw) { ctx.record('folderChild'); draw(1); },
    cursor(ctx, ...args) { ctx.record('cursor', args); return legacyCursorDrawn; },
  }, { get: (target, key) => key in target ? target[key] : ((ctx, ...args) => { ctx.record(key, args); return true; }) });
  const screens = createScreens(native ? { firmwareAssets: { presenter, sharedFont: { draw() {} }, diagnostics: [], dispose() {} } } : {});
  const paint = (state, elapsed = 1000) => {
    events.length = 0; screens.bottom.getContext('2d').curves.length = 0;
    screens.paint(state, new Date(0), elapsed);
    return events;
  };
  const cursorCalls = () => events.filter(event => nativeCursorNames.has(event.name));
  try { await screens.ready; await run({ screens, paint, events, cursorCalls }); }
  finally {
    screens.dispose();
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  }
}

test('retained primary and both effects paint in order outside tile clipping using applied poses', async () => {
  await withScreens(({ screens, paint, events, cursorCalls }) => {
    const state = freeze(home()), before = JSON.stringify(state);
    paint(state);
    const calls = cursorCalls();
    assert.deepEqual(calls.map(({ name, args }) => [name, ...args]), [
      ['cursorAt', 26, 16, 10, 17.25],
      ['cursorEffectAt', -35.5, 131, 2.375, 9.375],
      ['cursorEffectAt', 370, 16.5, 11, 4.25],
    ]);
    assert.ok(calls.every(call => call.context === screens.bottom.getContext('2d') && call.clips.length === 0 && call.depth === 0));
    const tiles = events.filter(event => ['tile', 'empty'].includes(event.name));
    assert.ok(tiles.length > 0);
    assert.ok(tiles.every(event => event.clips.some(rect => JSON.stringify(rect) === '[0,34,320,174]')));
    const names = events.filter(event => event.context === screens.bottom.getContext('2d')).map(event => event.name);
    assert.ok(names.indexOf('toolbar') < names.indexOf('homePlate'));
    assert.ok(names.indexOf('homePlate') < names.indexOf('folderChrome'));
    assert.ok(names.indexOf('folderChrome') < names.indexOf('cursorAt'));
    assert.ok(names.lastIndexOf('tile') < names.indexOf('cursorAt') && names.lastIndexOf('empty') < names.indexOf('cursorAt'));
    assert.ok(names.indexOf('cursorEffectAt') < names.indexOf('arrows'));
    assert.ok(names.indexOf('arrows') < names.indexOf('folderBalloon'));
    assert.ok(names.indexOf('folderBalloon') < names.indexOf('footer'));
    assert.ok(names.indexOf('footer') < names.indexOf('overlay'));
    assert.equal(JSON.stringify(state), before);
  });
});

test('culled selected tiles cannot suppress a retained toolbar primary or offscreen departing effects', async () => {
  await withScreens(({ paint, cursorCalls }) => {
    let state = home(); const navigation = getHomeNavigation(state);
    state = writeHomeNavigation(state, { ...navigation, rootView: { ...navigation.rootView, selectedSlot: 299 } });
    const view = getHomePresentation(state);
    assert.ok(!view.tiles.some(tile => tile.index === 299));
    assert.ok(view.tiles.every(tile => !tile.cursor));
    paint(freeze(state));
    assert.deepEqual(cursorCalls().map(({ name }) => name), ['cursorAt', 'cursorEffectAt', 'cursorEffectAt']);
  });
});

test('actual layoutVisible controls primary drawing independently of request and shown bookkeeping', async () => {
  await withScreens(({ paint, cursorCalls }) => {
    const state = home(), primary = state.system.homeControls.primary;
    for (const request of [0, 1, 2]) for (const shown of [false, true]) for (const layoutVisible of [false, true]) {
      const supplied = freeze(controls(state, { primary: { ...primary, request, shown, layoutVisible } }));
      paint(supplied);
      assert.equal(cursorCalls().filter(call => call.name === 'cursorAt').length, layoutVisible ? 1 : 0);
      assert.equal(cursorCalls().filter(call => call.name === 'cursorEffectAt').length, 2);
      assert.ok(cursorCalls().every(call => call.name !== 'cursor'));
    }
  });
});

test('effects use their own visible flags and retain tuple order, including the terminal applied pose', async () => {
  await withScreens(({ paint, cursorCalls }) => {
    const state = home(), presentation = state.system.homeControls.presentation;
    for (const first of [false, true]) for (const second of [false, true]) {
      const effects = presentation.effects.map((effect, i) => ({ ...effect, visible: i === 0 ? first : second,
        disappear: { currentFrame: 20, appliedFrame: 20, status: 2 },
      }));
      paint(freeze(controls(state, { presentation: { ...presentation, effects } })));
      const calls = cursorCalls().filter(call => call.name === 'cursorEffectAt');
      assert.deepEqual(calls.map(call => call.args), effects.filter(effect => effect.visible)
        .map(effect => [effect.center.x, effect.center.y, effect.scale.appliedFrame, 20]));
    }
  });
});

test('elapsed paint time and reduced-motion toggles never advance or replace retained controllers', async () => {
  await withScreens(({ screens, paint, cursorCalls }) => {
    const state = freeze(home()), before = JSON.stringify(state);
    const frames = [];
    for (const time of [0, 1234, 999999]) { paint(state, time); frames.push(cursorCalls().map(call => [call.name, ...call.args])); }
    assert.deepEqual(frames[0], frames[1]); assert.deepEqual(frames[1], frames[2]);
    screens.setReducedMotion(true); paint(state, 1000000);
    assert.deepEqual(cursorCalls().map(call => [call.name, ...call.args]), [['cursorAt', 26, 16, 10, 0]]);
    screens.setReducedMotion(false); paint(state, 1000001);
    assert.deepEqual(cursorCalls().map(call => [call.name, ...call.args]), frames[0]);
    assert.equal(JSON.stringify(state), before);
  });
});

test('folder background capture excludes all controls while the live child paints them outside its clip', async () => {
  await withScreens(({ screens, paint, events, cursorCalls }) => {
    const state = freeze(enterHomeFolder({ ...home(), folders: { 20: 'A' } }, 20)), before = JSON.stringify(state);
    paint(state);
    const capture = events.find(event => event.name === 'capture-read');
    assert.ok(capture && capture.context !== screens.bottom.getContext('2d'));
    assert.ok(!events.some(event => event.context === capture.context && nativeCursorNames.has(event.name)));
    assert.equal(cursorCalls().length, 3);
    assert.ok(cursorCalls().every(call => call.context === screens.bottom.getContext('2d') && call.clips.length === 0));
    assert.ok(events.some(event => event.name === 'empty' && event.context === screens.bottom.getContext('2d')
      && event.clips.some(rect => JSON.stringify(rect) === '[0,49,320,159]')));
    paint(state);
    assert.ok(!events.some(event => event.name === 'capture-read'), 'same folder capture remains cached');
    assert.equal(cursorCalls().length, 3);
    assert.equal(JSON.stringify(state), before);
  });
});

test('an active normal folder close does not override retained native layout visibility', async () => {
  await withScreens(({ paint, cursorCalls }) => {
    const folder = enterHomeFolder({ ...home(), folders: { 20: 'A' } }, 20);
    const closing = beginSystemHomeFolderClose(folder);
    assert.equal(isSystemHomeFolderClosing(closing), true);
    assert.ok(getHomePresentation(closing).tiles.every(tile => !tile.cursor));
    paint(freeze(closing));
    assert.deepEqual(cursorCalls().map(call => call.name), ['cursorAt', 'cursorEffectAt', 'cursorEffectAt']);
    const { primary, presentation } = closing.system.homeControls;
    const hidden = controls(closing, { primary: { ...primary, request: 2, shown: false, layoutVisible: false },
      presentation: { ...presentation, effects: presentation.effects.map(effect => ({ ...effect, visible: false })) },
    });
    paint(freeze(hidden)); assert.deepEqual(cursorCalls(), []);
  });
});

test('inactive HOME, sleep, panels, preferences and dialogs explicitly suppress the whole native group', async () => {
  await withScreens(({ paint, cursorCalls }) => {
    const state = home(), variations = [
      { ...state, powered: false }, { ...state, panel: 'notes' },
      ...['boot', 'launch', 'app', 'power', 'off'].map(phase => ({ ...state, system: { ...state.system, phase } })),
      ...[{ sleeping: true }, { preferences: true }, { dialog: 'switch' }, { dialog: 'close' }]
        .map(patch => ({ ...state, system: { ...state.system, ...patch } })),
    ];
    for (const supplied of variations) {
      freeze(supplied); const before = JSON.stringify(supplied);
      paint(supplied); assert.deepEqual(cursorCalls(), []);
      assert.equal(JSON.stringify(supplied), before);
    }
  });
});

for (const mode of ['press', 'scroll', 'drag']) {
  test(`active grid ${mode} gesture suppresses retained controls without falling back to a tile cursor`, async () => {
    await withScreens(({ paint, cursorCalls }) => {
      const state = home(), tile = getHomePresentation(state).tiles.find(tile => tile.appId);
      assert.ok(tile);
      let gestureState = touchHomeGesture(state, { type: 'touch', phase: 'down', x: tile.x + tile.size / 2,
        y: tile.y + tile.size / 2, pointerId: 4 }, 0).state;
      const nav = getHomeNavigation(gestureState);
      gestureState = writeHomeNavigation(gestureState, { ...nav, gesture: { ...nav.gesture, mode } });
      assert.equal(getHomePresentation(gestureState).gesture.mode, mode);
      assert.equal(gestureState.system.homeNavigation.gesture.area, 'grid');
      freeze(gestureState); const before = JSON.stringify(gestureState);
      paint(gestureState); assert.deepEqual(cursorCalls(), []);
      assert.equal(JSON.stringify(gestureState), before);
    });
  });
}

for (const moved of [false, true]) {
  test(`chrome ${moved ? 'scroll' : 'press'} retains primary and effects using the gesture's original area`, async () => {
    await withScreens(({ paint, cursorCalls }) => {
      const state = home();
      paint(state); const baseline = cursorCalls().map(({ name, args }) => [name, ...args]);
      let pressed = touchHomeGesture(state, { type: 'touch', phase: 'down', x: 76, y: 16, pointerId: 4 }, 0).state;
      if (moved) pressed = touchHomeGesture(pressed, { type: 'touch', phase: 'move', x: 76, y: 80, pointerId: 4 }, 1).state;
      assert.equal(pressed.system.homeNavigation.gesture.area, 'chrome');
      const view = getHomePresentation(pressed);
      assert.equal(view.gesture.mode, moved ? 'scroll' : 'press');
      assert.equal(Object.hasOwn(view.gesture, 'area'), false, 'derived view deliberately has no area');
      freeze(pressed); const before = JSON.stringify(pressed);
      paint(pressed);
      assert.deepEqual(cursorCalls().map(({ name, args }) => [name, ...args]), baseline);
      assert.equal(JSON.stringify(pressed), before);
    });
  });
}

test('disabled density chrome presses preserve real toolbar poses and all retained cursor calls', async () => {
  await withScreens(({ screens, paint, events, cursorCalls }) => {
    for (const [folder, density, x, availability] of [[false, 0, 282, 'decreaseEnabled'],
      [true, 1, 282, 'decreaseEnabled'], [false, 5, 307, 'increaseEnabled']]) {
      let state = home();
      if (folder) state = enterHomeFolder({ ...state, folders: { 20: 'A' } }, 20);
      state = settleHomeNavigation(setHomeDensity(state, density));
      assert.equal(getHomeDensityControls(state)[availability], false);
      const toolbarDraw = () => events.find(event => event.name === 'toolbar-layout' && event.context === screens.bottom.getContext('2d')).args;
      paint(state);
      const baselineToolbar = structuredClone(toolbarDraw()), baselineCursors = cursorCalls().map(({ name, args }) => [name, ...args]);
      const pressed = freeze(touchHomeGesture(state, { type: 'touch', phase: 'down', x, y: 16, pointerId: 4 }, 0).state);
      const before = JSON.stringify(pressed);
      assert.equal(pressed.system.homeNavigation.gesture.area, 'chrome');
      paint(pressed);
      assert.deepEqual(toolbarDraw(), baselineToolbar);
      assert.ok(!toolbarDraw()[2].bindings.some(binding => binding.name === 'LncBase_D_01_Select'));
      assert.deepEqual(cursorCalls().map(({ name, args }) => [name, ...args]), baselineCursors);
      assert.equal(JSON.stringify(pressed), before);
    }
  }, { realToolbar: true });
});

test('enabled density chrome press changes its real toolbar Select binding without hiding retained controls', async () => {
  await withScreens(({ screens, paint, events, cursorCalls }) => {
    const state = settleHomeNavigation(setHomeDensity(home(), 1));
    assert.deepEqual(getHomeDensityControls(state), { decreaseEnabled: true, increaseEnabled: true });
    const toolbarDraw = () => events.find(event => event.name === 'toolbar-layout' && event.context === screens.bottom.getContext('2d')).args;
    paint(state);
    const baselineToolbar = structuredClone(toolbarDraw()), baselineCursors = cursorCalls().map(({ name, args }) => [name, ...args]);
    for (const [x, group] of [[282, 'G_Dw_00'], [307, 'G_Up_00']]) {
      const pressed = freeze(touchHomeGesture(state, { type: 'touch', phase: 'down', x, y: 16, pointerId: 4 }, 0).state);
      paint(pressed);
      assert.deepEqual(toolbarDraw()[2].bindings, [...baselineToolbar[2].bindings,
        { name: 'LncBase_D_01_Select', frame: 1, groups: [group] }]);
      assert.notDeepEqual(toolbarDraw()[3], baselineToolbar[3]);
      assert.deepEqual(cursorCalls().map(({ name, args }) => [name, ...args]), baselineCursors);
    }
  }, { realToolbar: true });
});

test('native assets without retained controls and legacy menu callers keep their existing tile path', async () => {
  await withScreens(({ paint, cursorCalls }) => {
    const retained = home();
    for (const state of [{ ...retained, system: { ...retained.system, homeControls: null } }, { ...retained, system: undefined }]) {
      paint(freeze(state)); const calls = cursorCalls();
      assert.equal(calls.length, 1); assert.equal(calls[0].name, 'cursor');
      assert.equal(calls[0].args[4], state.system ? 17.25 : 0);
      assert.ok(calls[0].clips.length > 0, 'legacy cursor stays in its existing tile clip');
    }
  });
});

test('missing native assets retain the elapsed-time fallback even when controls are present', async () => {
  await withScreens(({ screens, paint, cursorCalls }) => {
    const state = freeze(home()), ctx = screens.bottom.getContext('2d');
    paint(state, 0); const first = structuredClone(ctx.curves);
    paint(state, 220); const later = structuredClone(ctx.curves);
    assert.equal(first.length, 4); assert.equal(later.length, 4); assert.notDeepEqual(first, later);
    assert.deepEqual(cursorCalls(), []);
    screens.setReducedMotion(true); paint(state, 0); const reduced = structuredClone(ctx.curves);
    paint(state, 220); assert.deepEqual(ctx.curves, reduced);
  }, { native: false });
});

test('legacy native draw failure retains the existing procedural cursor fallback', async () => {
  await withScreens(({ screens, paint, cursorCalls }) => {
    const state = home(); state.system.homeControls = null;
    paint(freeze(state));
    assert.deepEqual(cursorCalls().map(call => call.name), ['cursor']);
    assert.equal(screens.bottom.getContext('2d').curves.length, 4);
  }, { legacyCursorDrawn: false });
});
