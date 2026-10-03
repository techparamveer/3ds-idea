import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { createPortfolioState, dispatchSystemEvent, launchHomeShortcut, tickSystem, reduceSystem } from '../src/os/system.ts';
import { createHomeInputAdapter } from '../src/os/home-input-adapter.ts';
import { createHomeInputProducer } from '../src/os/home-input-producer.ts';
import { createHomeCursorPresentation, getHomeToolbarCursorAnchor } from '../src/os/home-cursor-presentation.ts';
import { resolveHomeBannerHostObservation } from '../src/os/home-banner-host.ts';
import { commitHomeScroll, enterHomeFolder, getHomeNavigation, writeHomeNavigation, selectHomeSlot, setHomeDensity, settleHomeNavigation } from '../src/os/home-navigation.ts';
import { advanceSystemHomeFolderCloseNative, beginSystemHomeFolderClose, isSystemHomeFolderClosing } from '../src/os/home-folder-close-system.ts';
import { getHomeFooter, getHomePresentation } from '../src/os/home-presentation.ts';
import { advanceHomeTilePickup2D, createHomeTilePickup, markHomeTilePickupRootVisit } from '../src/os/home-tile-pickup.ts';
import { getTitle } from '../src/os/app-registry.ts';
import { touchHomeGesture } from '../src/os/home-gestures.ts';
import { getHomeDensityControls } from '../src/os/home-density-controls.ts';
import { blendNativePixel, evaluateNativeMaterial, poseNativeLayout, nativePaneParentPath } from '../src/os/native-layout.ts';
import {escapeUnreadyNativeScreen} from '../src/os/native-screen-system.ts';
import {homeCloseWindowOpacity} from '../src/os/home-close-window-fit.ts';

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
  './home-suspended-window':moduleUrl(`export {homeSuspendedApplication,homeSuspendedIconDisappeared,retainedSuspendedApplication,selectedSuspendedApplication} from '${new URL('../src/os/home-suspended-window.ts',import.meta.url).href}';export const drawHomeSuspendedWindow=(_r,ctx,_meta,_mode,_sleep,opacity)=>ctx.record('suspended-window',[opacity]);`),
  './home-software-closing-dialog':moduleUrl('export const drawHomeSoftwareClosingDialog=(_r,_top,bottom,frame,exitFrame,intent)=>{if(bottom.failClosing===true)throw Error("Closing resource unavailable");bottom.record("closing-lower",[frame,exitFrame,intent]);};'),
  './home-native-layouts':moduleUrl('export const createHomeLayoutManager=()=>({draw(top,bottom,_state,hud,preview){top.record("layout-manager-upper",[preview]);bottom.record("layout-manager-lower");hud?.();return true;}});'),
 './native-system-presentation':moduleUrl('export const drawNativeSystemOverlay=()=>globalThis.__testNativeSystemOverlayDrawn??false;'),
  './native-chrome': moduleUrl('export const createNativeChrome=()=>({ready:Promise.resolve(),draw:()=>true,tile:()=>true});'),
  './portfolio-screens': moduleUrl('export const setPortfolioFont=()=>{};export const createPortfolioGraphics=()=>({ready:Promise.resolve(),selectedApp:()=>globalThis.__testSelectedApp,syncStockView(){},readSuspendedCapture(runtime){return {status:"ready",owner:runtime.application,generation:1};},stockStatus:()=>"inactive",retryStockScreen:()=>false,stockFailure:()=>null,banner(ctx){ctx.record("fallback-banner");},menuIcon(ctx,...args){ctx.record("menuIcon",args);},menuArtwork(){},overlay(_top,bottom){bottom.record("overlay");},dispose(){}});'),
  './firmware-presentation': moduleUrl('export const createFirmwareHome=assets=>assets.presenter;export const loadFirmwarePresentationAssets=()=>{throw Error("Unexpected asset load");};'),
};
const { createScreens } = await loadPresentation('screens', overrides);
const { createFirmwareHome } = await loadPresentation('firmware-presentation', {
  './native-renderer': moduleUrl('export class NativeLayoutRenderer {}'),
});
const pack = JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/home/launcher.json', import.meta.url)));
const messagesPack = JSON.parse(readFileSync(new URL('../public/os/firmware/10.7.0-32E/packs/home/messages-and-loose.json', import.meta.url)));
const nativeCursorNames = new Set(['cursor', 'cursorAt', 'cursorEffectAt']);

function closeFooterReturn(){
 const suspended=reduceSystem(tickSystem(launchHomeShortcut(tickSystem(createPortfolioState(),3001),'work',4000),6200),'home',6300);
 let state=reduceSystem(reduceSystem(suspended,'back',6400),'open',6500);
 for(let i=0;i<12&&state.system.homeApplicationTransition?.phase!=='footer-returning';i++)state=tickSystem(state,7000+i*500);
 assert.equal(state.system.homeApplicationTransition?.phase,'footer-returning');
 assert.equal(state.system.runtime.application,null);
 return state;
}

test('retired-owner footer return paints HOME without suspended capture or closing dialog',async()=>{
 await withScreens(({paint,events,screens})=>{
  const returning=closeFooterReturn();
  for(const [phase,frame] of [['footer-returning',0],['footer-returning',4],['return-terminal',8]]){
   const state=structuredClone(returning);Object.assign(state.system.homeApplicationTransition,{phase,footerReturnFrame:frame});
   paint(state);
   assert.equal(screens.stockStatus(state),'ready');
   assert.ok(events.some(e=>e.name==='footer'));
   assert.ok(!events.some(e=>e.name==='suspendedIcon'||e.name==='suspended-window'||e.name==='closing-lower'));
   assert.equal(state.system.runtime.application,null);
  }
 },{screenOptions:{drawSuspendedBackground:(_ctx,capture,presentation)=>{assert.equal(capture.status,'none');assert.equal(presentation,null);return true;}}});
});

test('system screen publication reports only a successful native power or shutdown pair',async()=>{
 await withScreens(async({screens})=>{
  const initial=createPortfolioState();
  const shutdown={...initial,powered:true,system:{...initial.system,phase:'shutdown',since:100,returnPhase:'home'}};
  try{
   globalThis.__testNativeSystemOverlayDrawn=false;
   assert.equal(screens.paint(shutdown,new Date(0),1300),undefined);
   assert.equal(screens.stockStatus(shutdown),'error');
   assert.match(String(screens.stockFailure()),/Native shutdown screen unavailable/);
   assert.equal(screens.retryStockScreen(),true);

   const sleeping={...shutdown,system:{...shutdown.system,sleeping:true}};
   assert.equal(screens.paint(sleeping,new Date(0),1300),undefined);
   assert.equal(screens.stockStatus(sleeping),'inactive');

   globalThis.__testNativeSystemOverlayDrawn=true;
   assert.deepEqual(screens.paint(shutdown,new Date(0),1300),{nativeSystem:true});
   assert.equal(screens.stockStatus(shutdown),'ready');
  }finally{delete globalThis.__testNativeSystemOverlayDrawn;}
 });
});

test('footer-return source failure retains paired recovery after application retirement',async()=>{
 await withScreens(({paint,events,screens})=>{
  const state=closeFooterReturn();paint(state);
  assert.equal(screens.stockStatus(state),'error');
  assert.match(String(screens.stockFailure()),/ChangeUp unavailable/);
  for(const ctx of [screens.nativeTop.getContext('2d'),screens.bottom.getContext('2d')])assert.ok(events.some(e=>e.context===ctx&&e.name==='fillRect'&&e.args[0]===0&&e.args[1]===0&&e.args[3]===240));
  const recovered=escapeUnreadyNativeScreen(state,12000);paint(recovered);
  assert.equal(recovered.system.homeApplicationTransition,null);
  assert.equal(recovered.system.runtime.application,null);
  assert.equal(screens.stockStatus(recovered),'inactive');
 },{presenterPatch:{footer(ctx,state){if(state.system.homeApplicationTransition?.phase==='footer-returning')throw Error('ChangeUp unavailable');ctx.record('footer');return true;}}});
});

test('software-closing layers follow HOME/footer on both LCDs through terminal and clear on retirement',async()=>{
 await withScreens(({paint,events,screens})=>{
  const suspended=reduceSystem(tickSystem(launchHomeShortcut(tickSystem(createPortfolioState(),3001),'work',4000),6200),'home',6300);
  const closing=reduceSystem(reduceSystem(suspended,'back',6400),'open',6500);
  for(const frame of [0,10,20]){
   const state=structuredClone(closing);state.system.homeApplicationTransition.appQuitFrame=frame;
   state.system.homeApplicationTransition.phase=frame===20?'terminal':'closing';
   paint(state);
   assert.equal(screens.stockStatus(state),'ready');
   assert.deepEqual(events.find(e=>e.name==='closing-lower').args,[frame,undefined,'close']);
   assert.deepEqual(events.find(e=>e.name==='suspended-window').args,[homeCloseWindowOpacity(frame)]);
   assert.equal(events.find(e=>e.name==='suspendedIcon').args.at(-1),false);
   assert.ok(events.findIndex(e=>e.name==='closing-lower')>events.findIndex(e=>e.name==='footer'));
   assert.ok(events.findIndex(e=>e.name==='closing-lower')>events.findIndex(e=>e.name==='hud'));
  }
  screens.setReducedMotion(true);paint(closing);
  assert.deepEqual(events.find(e=>e.name==='closing-lower').args,[20,undefined,'close']);
  assert.deepEqual(events.find(e=>e.name==='suspended-window').args,[0]);
  screens.setReducedMotion(false);
  for(const frame of [0,10,20]){
   const exiting=structuredClone(closing);
   Object.assign(exiting.system.homeApplicationTransition,{phase:frame===20?'exit-terminal':'exiting',appQuitFrame:20,dialogExitFrame:frame});
   paint(exiting);
   assert.equal(screens.stockStatus(exiting),'ready');
   assert.deepEqual(events.find(e=>e.name==='closing-lower').args,[20,frame,'close']);
   assert.deepEqual(events.find(e=>e.name==='suspended-window').args,[0]);
   assert.equal(events.find(e=>e.name==='suspendedIcon').args.at(-1),true);
   assert.ok(events.findIndex(e=>e.name==='menuIcon')<events.findIndex(e=>e.name==='suspendedIcon'));
   screens.setReducedMotion(true);paint(exiting);
   assert.deepEqual(events.find(e=>e.name==='closing-lower').args,[20,20,'close']);
   assert.equal(events.find(e=>e.name==='suspendedIcon').args.at(-1),true);
   screens.setReducedMotion(false);
  }
  for(const [phase,footerExitFrame] of [['footer-exiting',0],['footer-exiting',3],['footer-terminal',6]]){
   const departing=structuredClone(closing);
   Object.assign(departing.system.homeApplicationTransition,{phase,appQuitFrame:20,dialogExitFrame:20,footerExitFrame});
   paint(departing);
   assert.equal(screens.stockStatus(departing),'ready');
   assert.deepEqual(events.find(e=>e.name==='closing-lower').args,[20,20,'close']);
   assert.equal(events.find(e=>e.name==='suspendedIcon').args.at(-1),true);
   assert.equal(departing.system.runtime.application,closing.system.runtime.application);
  }
  const switching=structuredClone(closing);switching.system.homeApplicationTransition.intent={kind:'switch',appId:'about'};
  for(const frame of [0,10,20]){
   switching.system.homeApplicationTransition.appQuitFrame=frame;
   switching.system.homeApplicationTransition.phase=frame===20?'terminal':'closing';
   paint(switching);
   assert.deepEqual(events.find(e=>e.name==='closing-lower').args,[frame,undefined,'switch']);
   assert.equal(events.filter(e=>e.name==='footer').length,1,'source footer is drawn once in its hidden switch pose');
   assert.deepEqual(events.find(e=>e.name==='suspended-window').args,[undefined]);
   assert.equal(events.find(e=>e.name==='suspendedIcon').args.at(-1),false);
  }
  paint(home());assert.ok(!events.some(e=>e.name.startsWith('closing-')));
 },{screenOptions:{drawSuspendedBackground:()=>true}});
});

test('missing close-exit icon source fails the paired paint without retiring the owner',async()=>{
 await withScreens(({paint,events,screens})=>{
  const suspended=reduceSystem(tickSystem(launchHomeShortcut(tickSystem(createPortfolioState(),3001),'work',4000),6200),'home',6300);
  const state=structuredClone(reduceSystem(reduceSystem(suspended,'back',6400),'open',6500));
  const owner=state.system.runtime.application;
  paint(state);assert.equal(screens.stockStatus(state),'ready');
  Object.assign(state.system.homeApplicationTransition,{phase:'exiting',appQuitFrame:20,dialogExitFrame:0});
  paint(state);assert.equal(screens.stockStatus(state),'error');
  assert.match(String(screens.stockFailure()),/DisAppear unavailable/);
  assert.equal(state.system.runtime.application,owner);
  for(const ctx of [screens.nativeTop.getContext('2d'),screens.bottom.getContext('2d')]){
   assert.ok(events.some(e=>e.context===ctx&&e.name==='fillRect'&&e.args[0]===0&&e.args[1]===0&&e.args[3]===240));
  }
  const recovered=escapeUnreadyNativeScreen(state,6600);paint(recovered);
  assert.equal(recovered.system.runtime.application,owner);
  assert.equal(recovered.system.homeApplicationTransition,null);
  assert.equal(screens.stockStatus(recovered),'ready');
 },{screenOptions:{drawSuspendedBackground:()=>true},presenterPatch:{
  suspendedIcon(ctx,...args){if(args.at(-1))throw Error('DisAppear unavailable');ctx.record('suspendedIcon',args);},
 }});
});

test('closing paint failures recover both LCDs, cancel safely and survive sleep/wake readiness changes',async()=>{
 await withScreens(({paint,events,screens})=>{
  const suspended=reduceSystem(tickSystem(launchHomeShortcut(tickSystem(createPortfolioState(),3001),'work',4000),6200),'home',6300);
  const closing=structuredClone(reduceSystem(reduceSystem(suspended,'back',6400),'open',6500));
  closing.system.homeApplicationTransition.appQuitFrame=10;
  screens.bottom.getContext('2d').failClosing=true;paint(closing);
  assert.equal(screens.stockStatus(closing),'error');
  assert.match(String(screens.stockFailure()),/Closing resource unavailable/);
  for(const ctx of [screens.nativeTop.getContext('2d'),screens.bottom.getContext('2d')]){
   assert.ok(events.some(e=>e.context===ctx&&e.name==='fillRect'&&e.args[0]===0&&e.args[1]===0&&e.args[3]===240));
  }
  const recovered=escapeUnreadyNativeScreen(closing,6600);paint(recovered);
  assert.equal(recovered.system.homeApplicationTransition,null);
  assert.equal(recovered.system.runtime.application,closing.system.runtime.application);
  assert.equal(screens.stockStatus(recovered),'ready');
  paint(closing);assert.equal(screens.stockStatus(closing),'error');
  const asleep=structuredClone(closing);asleep.system.sleeping=true;paint(asleep);
  assert.equal(screens.stockFailure(),null);
  screens.bottom.getContext('2d').failClosing=false;paint(closing);
  assert.equal(screens.stockStatus(closing),'ready');
  assert.deepEqual(events.find(e=>e.name==='closing-lower').args,[10,undefined,'close']);
 },{screenOptions:{drawSuspendedBackground:()=>true}});
});

test('current-layout capture precedes upper chrome, stays bounded and refreshes after layout changes or reentry',async()=>{
 await withScreens(({screens,paint,events})=>{
  const state={...home(),panel:'home-layouts'};
  paint(state);
  const first=events.find(e=>e.name==='layout-manager-upper').args[0];
  assert.equal(first.upper.width,400);assert.equal(first.lower.width,320);
  assert.equal(events.filter(e=>e.name==='capture-read').length,2);
  assert.ok(events.findIndex(e=>e.name==='capture-read')<events.findIndex(e=>e.name==='upperBase'));
  const capture=events.find(e=>e.name==='capture-read'&&e.context!==screens.nativeTop.getContext('2d')).context;
  const captured=events.filter(e=>e.context===capture);
  assert.equal(captured.find(e=>e.name==='toolbar').args.length,1);
  assert.ok(!captured.some(e=>nativeCursorNames.has(e.name)||['footer','settingsLower'].includes(e.name)));
  paint({...state,homeLayoutSlot:3},2000);
  assert.equal(events.filter(e=>e.name==='capture-read').length,0);
  assert.equal(events.find(e=>e.name==='layout-manager-upper').args[0],first);
  paint({...state,theme:'blue'});
  assert.equal(events.filter(e=>e.name==='capture-read').length,2);
  assert.notEqual(events.find(e=>e.name==='layout-manager-upper').args[0],first);
  paint(home());paint(state);
  assert.equal(events.filter(e=>e.name==='capture-read').length,2);
 });
});

test('unavailable native wallpaper cannot become a current-layout preview',async()=>{
 await withScreens(({screens,paint,events})=>{
  const state={...home(),panel:'home-layouts'};paint(state);
  assert.equal(screens.stockStatus(state),'error');
  assert.match(String(screens.stockFailure()),/preview wallpaper unavailable/);
  assert.equal(events.filter(e=>e.name==='layout-manager-upper'||e.name==='capture-read').length,0);
 },{screenOptions:{drawHomeBackground:()=>false}});
});

test('HOME Settings uses its source caption and does not publish unrelated upper controls', async () => {
  await withScreens(({ screens, paint, events }) => {
    paint({ ...home(), panel: 'settings', panelChoice: 0 });
    assert.equal(events.filter(event => event.name === 'settingsUpper').length, 1);
    assert.equal(events.filter(event => event.name === 'settingsLower').length, 1);
    assert.equal(events.filter(event => event.name === 'upperBase').length, 0);
    assert.equal(screens.nativeTop.getContext('2d').curves.length, 0, 'no authored helper icon plates');
    assert.ok(events.findIndex(event => event.name === 'settingsUpper') < events.findIndex(event => event.name === 'hud'));
    paint(home());
    assert.equal(events.filter(event => event.name === 'settingsUpper').length, 0);
    assert.equal(events.filter(event => event.name === 'upperBase').length, 1, 'closing restores ordinary HOME chrome');
  });
});

test('Folder Settings owns the lower modal and retains the selected-folder upper banner', async () => {
  await withScreens(({ screens, paint, events }) => {
    const base = home(), layout = { ...base.system.layout }; delete layout[0];
    const state = { ...base, folders: { 0: 'Work' }, panel: 'folder-settings', panelChoice: 0, system: { ...base.system, layout } };
    assert.equal(screens.stockStatus(state), 'loading');
    paint(state);
    assert.equal(screens.stockStatus(state), 'ready');
    assert.equal(events.filter(event => event.name === 'folderSettingsLower').length, 1);
    assert.equal(events.filter(event => event.name === 'footer').length, 0, 'modal hides the underlying Settings/Open footer');
    assert.equal(events.filter(event => event.name === 'folder-banner').length, 1, 'selected folder remains on the upper LCD');
    assert.equal(screens.nativeTop.getContext('2d').curves.length, 0, 'no generic toolbar-symbol plates replace the folder banner');
  }, { screenOptions: { drawFolderBanner(ctx) { ctx.record('folder-banner'); return true; } } });
});

test('populated-folder notice publishes a native lower pair and retains the selected-folder upper banner', async () => {
  await withScreens(({ screens, paint, events }) => {
    const base = home(), layout = { ...base.system.layout }; delete layout[0];
    const state = { ...base, folders: { 0: 'Work' }, panel: 'folder-not-empty', panelChoice: 0,
      system: { ...base.system, layout, folderLayouts: { 0: { 2: 'work' } } } };
    assert.equal(screens.stockStatus(state), 'loading');
    paint(state);
    assert.equal(screens.stockStatus(state), 'ready');
    assert.equal(events.filter(event => event.name === 'folderNotEmptyLower').length, 1);
    assert.equal(events.filter(event => event.name === 'footer').length, 0, 'notice hides the underlying Settings/Open footer');
    assert.equal(events.filter(event => event.name === 'folder-banner').length, 1);
    assert.equal(screens.nativeTop.getContext('2d').curves.length, 0, 'no generic toolbar-symbol plates replace the folder banner');
  }, { screenOptions: { drawFolderBanner(ctx) { ctx.record('folder-banner'); return true; } } });
});

test('native HOME panels publish paired host recovery and gate input when resources are absent', async () => {
  await withScreens(({ screens, paint, events }) => {
    const state = { ...home(), panel: 'settings', panelChoice: 0 };
    assert.equal(screens.stockStatus(state), 'loading');
    assert.doesNotThrow(() => paint(state));
    assert.equal(screens.stockStatus(state), 'error');
    assert.match(String(screens.stockFailure()), /Settings lower panel unavailable/);
    for (const ctx of [screens.nativeTop.getContext('2d'), screens.bottom.getContext('2d')]) {
      assert.ok(events.some(e => e.name === 'fillRect' && e.context === ctx && e.args[0] === 0 && e.args[1] === 0 && e.args[2] === ctx.canvas.width && e.args[3] === 240));
    }
    assert.equal(screens.retryStockScreen(), true);
    assert.equal(screens.stockStatus(state), 'loading');
    paint(state);
    assert.equal(screens.stockStatus(state), 'error');
    paint(home());
    assert.equal(screens.stockFailure(), null);
    assert.equal(screens.stockStatus(home()), 'inactive');
  }, { native: false });
});

test('Save/Load replaces both LCDs and places HUD after its native upper background', async () => {
  await withScreens(({ screens, paint, events }) => {
    const state = { ...home(), panel: 'home-layouts', homeLayoutSlot: 0 };
    paint(state);
    assert.equal(screens.stockStatus(state), 'ready');
    assert.equal(events.filter(e => e.name === 'layout-manager-upper').length, 1);
    assert.equal(events.filter(e => e.name === 'layout-manager-lower').length, 1);
    assert.ok(events.findLastIndex(e => e.name === 'hud') > events.findIndex(e => e.name === 'layout-manager-upper'));
  });
});

test('HOME Settings upper binds the native English message and fails explicitly without it', () => {
  const messages = structuredClone(messagesPack), draws = [];
  const before = JSON.stringify(messages);
  let available = true;
  const presenter = createFirmwareHome({ renderer: {
    packs: { launcher: pack, messages },
    draw(_ctx, bank, name, options) { draws.push({ bank, name, options }); return available; },
  } });
  presenter.settingsUpper({});
  assert.equal(draws[0].bank, 'petit');
  assert.equal(draws[0].name, 'PtDlgBg_U_00');
  assert.deepEqual(draws[0].options.bindings, [{ name: 'PtDlgBg_U_00_FadeIn', frame: 20 }]);
  const override = draws[0].options.overrides.T_Text_00;
  assert.equal(override.text, 'HOME Menu Settings');
  assert.ok(override.messageStyle, 'retain the source MSBT style');
  assert.equal(override.fontSize, undefined, 'no authored title sizing');
  assert.equal(JSON.stringify(messages), before);
  available = false;
  assert.throws(() => presenter.settingsUpper({}), /upper layout unavailable/);
  delete messages.messages.menu_msbt_LZ.labels.ptt_title_u;
  assert.throws(() => presenter.settingsUpper({}), /title unavailable/);
});

test('applet label surfaces retain native upper message styles without changing folder labels', () => {
  const root = new URL('../public/os/firmware/10.7.0-32E/', import.meta.url);
  const messages = JSON.parse(readFileSync(new URL('packs/home/messages-and-loose.json', root)));
  const banner = JSON.parse(readFileSync(new URL('packs/home/banner.json', root)));
  const manifest = JSON.parse(readFileSync(new URL('fonts/shared/font.json', root)));
  const before = JSON.stringify({ messages, banner }), calls = [], surfaces = [];
  const saved = Object.getOwnPropertyDescriptor(globalThis, 'document');
  globalThis.document = { createElement() { const surface = canvas([]); surfaces.push(surface); return surface; } };
  try {
    const home = createFirmwareHome({ sharedFont: { manifest }, renderer: {
      packs: { launcher: pack, messages, banner },
      draw(_ctx, bank, name, options) { calls.push({ bank, name, options }); return true; },
    } });
    for (const [key, title] of [['memo','Game Notes'],['fri','Friend List'],['news','Notifications'],['web','Internet Browser'],['mvs','Miiverse']]) {
      const pixels = home.appletBannerLabel(key), value = calls.at(-1).options.overrides.T_Title_00;
      assert.equal(value.text, title);
      assert.deepEqual(value.messageStyle.fontScale, [Math.fround(.82), Math.fround(.82)]);
      assert.equal(value.fontSize, undefined, 'no folder-only fit or guessed font size');
      assert.equal(home.appletBannerLabel(key), pixels, 'cached surface is stable');
    }
    const applet = home.appletBannerLabel('memo');
    const folder = home.folderBannerLabel('Game Notes');
    assert.notEqual(folder, applet, 'same text does not alias differently styled surfaces');
    assert.deepEqual(calls.at(-1).options.overrides.T_Title_00.fontSize, [15.5,18.600000381469727]);
    home.appletBannerLabel('fri');
    assert.notEqual(home.appletBannerLabel('memo'), applet, 'shared cache remains bounded to two entries');
    assert.equal(JSON.stringify({ messages, banner }), before);
    assert.ok(surfaces.every(surface => surface.width === 0 && surface.height === 0));
    delete messages.messages.menu_msbt_LZ.labels.lau_title_memo_u;
    assert.throws(() => home.appletBannerLabel('memo'), /Native applet title unavailable/);
  } finally {
    if (saved) Object.defineProperty(globalThis, 'document', saved); else delete globalThis.document;
  }
});

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
      tilePoses: {},
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
    fillRect(...args) { context.record('fillRect', args); },
    quadraticCurveTo(...args) { context.curves.push(args); },
    getImageData(_x, _y, width, height) {
      context.record('capture-read');
      return { width, height, data: new Uint8ClampedArray(width * height * 4) };
    },
  }, { get: (target, key) => key in target ? target[key] : (() => {}) });
  surface.getContext = () => context;
  return surface;
}
async function withScreens(run, { native = true, legacyCursorDrawn = true, realToolbar = false, realTilePose = false, legacyPressOffset = 0, presenterPatch = {}, screenOptions = {} } = {}) {
  const saved = new Map(['document', 'Image', 'FontFace'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const events = [];
  Object.assign(globalThis, {
    document: { createElement: () => canvas(events), fonts: { add() {} } },
    Image: class { complete = false; naturalWidth = 0; decode() { return Promise.resolve(); } },
    FontFace: class { load() { return Promise.resolve(this); } },
  });
  const actual = realToolbar || realTilePose ? createFirmwareHome({ renderer: { packs: { launcher: pack },
    draw(ctx, bank, name, options) {
      ctx.record('toolbar-layout', [bank, name, options, poseNativeLayout(pack.layouts[name], pack.animations, options.bindings, options.overrides)]);
      return true;
    },
  } }) : null;
  const presenter = new Proxy({ pressOffset: legacyPressOffset,
    tilePressOffset: (pose, density) => realTilePose ? actual.tilePressOffset(pose, density) : 0,
    toolbar(ctx, ...args) { ctx.record('toolbar', args); return realToolbar ? actual.toolbar(ctx, ...args) : true; },
    folderBannerLabel(text) { events.push({ name: 'banner-label', args: [text] }); },
    appletBannerLabel(key) { events.push({ name: 'applet-label', args: [key] }); },
    folderChild(ctx, _state, _empty, draw) { ctx.record('folderChild'); draw(1); },
    cursor(ctx, ...args) { ctx.record('cursor', args); return legacyCursorDrawn; },
    ...presenterPatch,
  }, { get: (target, key) => key in target ? target[key] : ((ctx, ...args) => { ctx.record(key, args); return true; }) });
  const diagnostics = [];
  const screens = createScreens({ drawHomeBackground:()=>true, ...(native ? { firmwareAssets: { presenter, sharedFont: { draw() {} }, diagnostics, dispose() {} } } : {}), ...screenOptions });
  const paint = (state, elapsed = 1000) => {
    events.length = 0; screens.bottom.getContext('2d').curves.length = 0;
    screens.paint(state, new Date(0), elapsed);
    return events;
  };
  const cursorCalls = () => events.filter(event => nativeCursorNames.has(event.name));
  try { await screens.ready; await run({ screens, paint, events, cursorCalls, diagnostics }); }
  finally {
    screens.dispose();
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  }
}

test('toolbar banner artwork and label match the selected native cursor pane', async () => {
  const state = home();
  let selection;
  const banner = name => ctx => { ctx.record('toolbar-banner', [name]); return true; };
  const hostedMotion = { visible: true, scale: .9, yawRadians: -1.25,
    skeletal: { frame: 123 }, material: { frame: 77 } };
  await withScreens(({ paint, events }) => {
    for (const [focus, pane, title] of [
      [1, 'N_CPos_Memo_00', 'Game Notes'],
      [2, 'N_CPos_Frd_00', 'Friend List'],
      [3, 'N_CPos_News_00', 'Notifications'],
      [4, 'N_CPos_Web_00', 'Internet Browser'],
      [5, 'N_CPos_Mvs_00', 'Miiverse'],
    ]) {
      selection = resolveHomeBannerHostObservation(state, {
        kind: 'banner-resolve', phase: 'lower', reason: 'idle-update', context: null,
        slot: 0, focus, toolbarActive: true, updateOffset: 0, updateCount: 1,
      });
      assert.equal(getHomeToolbarCursorAnchor(focus).pane, pane);
      paint(state);
      assert.deepEqual(events.filter(event => event.name === 'toolbar-banner').map(event => event.args), [[title]]);
      assert.deepEqual(events.filter(event => event.name === 'applet-label').map(event => event.args), [[['memo','fri','news','web','mvs'][focus-1]]]);
      assert.equal(events.filter(event => event.name === 'banner-label').length, 0);
    }
  }, { screenOptions: {
    getHomeBanner: () => selection?.focus === 2 || selection?.focus === 3 ? { status: 'active', selection,
      generation: 'toolbar-test', requestEpoch: 1, resourceTicket: { generation: 'toolbar-test', requestEpoch: 1 }, stage: 'active', waitUpdates: 0,
      primary: { generation: 'toolbar-test', requestEpoch: 1, activationEpoch: 1, selection, motion: hostedMotion } }
      : ({ status: 'unsupported', selection, resourceTicket: null }),
    drawMemoBanner: banner('Game Notes'), drawFriendBannerFrame: banner('Friend List'),
    drawNewsBannerFrame: banner('Notifications'), drawWebBanner: banner('Internet Browser'),
    drawMiiverseBanner: banner('Miiverse'),
  } });
});

test('held pickup hides both footers while root visibility history suppresses its upper banner after re-entry',async()=>{
 const selection={kind:'app',id:'health-safety'},motion={visible:true,scale:1,yawRadians:0,
  skeletal:{frame:123},material:{frame:0}};
 const hosted={status:'active',selection,generation:'held-test',requestEpoch:1,
  resourceTicket:{generation:'held-test',requestEpoch:1},stage:'active',waitUpdates:0,
  primary:{generation:'held-test',requestEpoch:1,activationEpoch:1,selection,motion}};
 const pickup=(source,density,center)=>createHomeTilePickup(source,density,center,{x:244,y:137},{x:0,y:0});
 await withScreens(({paint,events})=>{
  const initial=home(),rootHeld=freeze(controls(initial,{tilePickup:pickup({folder:20,slot:1},5,{x:59,y:54})}));
  paint(rootHeld);assert.equal(events.filter(e=>e.name==='stock-title-banner').length,0);assert.equal(events.filter(e=>e.name==='footer').length,0);
  paint(freeze(controls(rootHeld,{tilePickup:null})));assert.equal(events.filter(e=>e.name==='stock-title-banner').length,1);assert.equal(events.filter(e=>e.name==='footer').length,1);
  const childId=initial.system.layout[1];
  let folder=selectHomeSlot(enterHomeFolder({...initial,folders:{20:'A'},system:{...initial.system,folderLayouts:{20:{1:childId}}}},20),1);
  folder=freeze(controls(folder,{tilePickup:pickup({folder:20,slot:1},1,{x:244,y:137})}));
  paint(folder);assert.equal(events.filter(e=>e.name==='stock-title-banner').length,1);assert.equal(events.filter(e=>e.name==='footer').length,0);
  const reentered=freeze(controls(folder,{tilePickup:markHomeTilePickupRootVisit(folder.system.homeControls.tilePickup)}));
  paint(reentered);assert.equal(events.filter(e=>e.name==='stock-title-banner').length,0);assert.equal(events.filter(e=>e.name==='footer').length,0);
  paint(freeze(controls(folder,{tilePickup:null})));assert.equal(events.filter(e=>e.name==='stock-title-banner').length,1);assert.equal(events.filter(e=>e.name==='footer').length,1);
 },{presenterPatch:{footer(ctx,state){if(getHomeFooter(state))ctx.record('footer');return true;}},screenOptions:{
  getHomeBanner:()=>hosted,drawStockTitleBannerFrame:ctx=>{ctx.record('stock-title-banner');return true;},
 }});
});

test('held root banner suppression does not conceal an unrelated native lower readiness failure',async()=>{
 await withScreens(({paint})=>{
  const initial=home(),held=controls(initial,{tilePickup:createHomeTilePickup({folder:null,slot:0},5,
   {x:59,y:54},{x:76,y:137},{x:0,y:-4.25})});
  assert.throws(()=>paint(held),/Native ordinary title icon unavailable/);
 },{presenterPatch:{ordinaryTitleIcon(){throw new Error('Native ordinary title icon unavailable: held fixture');}}});
});

test('pending Friend resources stay blank without reporting normal loading as failure', async () => {
  globalThis.__testSelectedApp = { id: 'work' };
  try {
    await withScreens(({ paint, events, diagnostics }) => {
      paint(home());
      assert.equal(events.some(event => event.name === 'fallback-banner'), false);
      assert.equal(events.some(event => event.name === 'toolbar-banner'), false);
      assert.deepEqual(diagnostics, []);
    }, { screenOptions: {
      getHomeBanner: () => ({ status: 'pending', generation: 'friend-test', requestEpoch: 1,
        selection: { kind: 'toolbar', focus: 2, category: 4 },
        resourceTicket: { generation: 'friend-test', requestEpoch: 1 }, stage: 'loading', waitUpdates: 0 }),
      drawFriendBannerFrame: ctx => { ctx.record('toolbar-banner', ['Friend List']); return true; },
    } });
  } finally { delete globalThis.__testSelectedApp; }
});

test('rejected Friend resource reports unavailable while remaining pending and blank', async () => {
  globalThis.__testSelectedApp = { id: 'work' };
  try {
    await withScreens(({ paint, events, diagnostics }) => {
      paint(home()); paint(home());
      assert.equal(events.some(event => event.name === 'fallback-banner'), false);
      assert.equal(events.some(event => event.name === 'toolbar-banner'), false);
      assert.deepEqual(diagnostics, ['Native Friend List toolbar banner unavailable.']);
    }, { screenOptions: {
      getHomeBanner: () => ({ status: 'pending', generation: 'friend-test', requestEpoch: 1,
        selection: { kind: 'toolbar', focus: 2, category: 4 },
        resourceTicket: { generation: 'friend-test', requestEpoch: 1 }, stage: 'loading', waitUpdates: 0 }),
      getFriendBannerFailure: () => 'Friend model rejected',
      drawFriendBannerFrame: ctx => { ctx.record('toolbar-banner', ['Friend List']); return true; },
    } });
  } finally { delete globalThis.__testSelectedApp; }
});

test('pending Notifications resources stay blank and report only a known failure', async () => {
  globalThis.__testSelectedApp = { id: 'work' };
  let failed = false;
  try {
    await withScreens(({ paint, events, diagnostics }) => {
      paint(home());
      assert.equal(events.some(event => event.name === 'fallback-banner'), false);
      assert.equal(events.some(event => event.name === 'toolbar-banner'), false);
      assert.deepEqual(diagnostics, []);
      failed = true; paint(home()); paint(home());
      assert.equal(events.some(event => event.name === 'fallback-banner'), false);
      assert.equal(events.some(event => event.name === 'toolbar-banner'), false);
      assert.deepEqual(diagnostics, ['Native Notifications toolbar banner unavailable.']);
    }, { screenOptions: {
      getHomeBanner: () => ({ status: 'pending', generation: 'news-test', requestEpoch: 1,
        selection: { kind: 'toolbar', focus: 3, category: 6 },
        resourceTicket: { generation: 'news-test', requestEpoch: 1 }, stage: 'loading', waitUpdates: 0 }),
      getNewsBannerFailure: () => failed ? 'Notifications model rejected' : null,
      drawNewsBannerFrame: ctx => { ctx.record('toolbar-banner', ['Notifications']); return true; },
    } });
  } finally { delete globalThis.__testSelectedApp; }
});

test('HOME footer samples source alpha glyphs directly at LCD centres', () => {
  const calls = [], renderer = { packs: { launcher: pack, messages: messagesPack },
    draw(ctx, bank, name, options) { calls.push({ ctx, bank, name, options }); return true; },
  };
  const presenter = createFirmwareHome({ renderer }), state = home(), navigation = getHomeNavigation(state);
  const focused = writeHomeNavigation(state, { ...navigation,
    focus: { toolbarActive: true, currentFocus: 1, rememberedFocus: -1, savedColumn: 0 },
  });
  const ctx = {};
  assert.equal(presenter.footer(ctx, focused), true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].ctx, ctx);
  assert.equal(calls[0].bank, 'launcher');
  assert.equal(calls[0].name, 'LncBtmBtn_02');
  assert.equal(calls[0].options.textSampling, 'lcd');
  assert.equal(calls[0].options.textCoverageAdaptation, undefined);
  assert.deepEqual(calls[0].options.clip, [0, 210, 320, 30]);
  assert.equal(calls[0].options.overrides.T_BtnFW_C_01.text, 'Open');
  const legacy={...state,system:undefined};
  assert.equal(presenter.footer(ctx,legacy),true);
  assert.deepEqual(calls.at(-1).options.bindings,[{name:'LncBtmBtn_02_SceneIn',frame:15}]);
});
test('root tray uses captured extent geometry and both source arrow panes have explicit visibility',()=>{
 const calls=[],renderer={packs:{launcher:pack,messages:messagesPack},draw(_ctx,bank,name,options){calls.push({bank,name,options});return true;}};
 const presenter=createFirmwareHome({renderer});let state=settleHomeNavigation(setHomeDensity(selectHomeSlot(home(),33),5));
 presenter.homePlate({},state);
 assert.equal(calls.at(-1).name,'LncPlt_00');
 assert.deepEqual(calls.at(-1).options.overrides,{W_Plt_00:{translation:[0,-92,0],size:[300,175]},W_Shdw_00:{translation:[0,-102,0],size:[320,193]}});
 presenter.arrows({},false,false);
 assert.deepEqual(calls.at(-1).options.overrides,{N_arwL_00:{visible:false},N_arwR_00:{visible:false}});
 presenter.arrows({},true,false);
 assert.deepEqual(calls.at(-1).options.overrides,{N_arwL_00:{visible:true},N_arwR_00:{visible:false}});
});

test('folder-held pickup selects the decoded full-LCD PicUp multiply endpoint and clearing ownership restores frame zero',()=>{
 const calls=[],renderer={packs:{launcher:pack,messages:messagesPack},draw(_ctx,bank,name,options){calls.push({bank,name,options});return true;}};
 const presenter=createFirmwareHome({renderer}),initial=home(),child=initial.system.layout[0];
 const opened=enterHomeFolder({...initial,folders:{20:'A'},system:{...initial.system,folderLayouts:{20:{0:child}}}},20);
 const capture={width:320,height:206,data:new Uint8ClampedArray(320*206*4)};
 const frame=()=>calls.at(-1).options.bindings.find(binding=>binding.name==='LncFolderCapture_00_PicUp').frame;
 presenter.folderBackdrop({},capture,opened);assert.equal(frame(),0);
 const held=controls(opened,{tilePickup:createHomeTilePickup({folder:20,slot:0},1,{x:244,y:137},{x:244,y:137},{x:0,y:-14})});
 presenter.folderBackdrop({},capture,held);assert.equal(frame(),10);
 presenter.folderBackdrop({},capture,held,true);assert.equal(frame(),10,'reduced motion retains the held material endpoint');
 presenter.folderBackdrop({},capture,controls(held,{tilePickup:null}));assert.equal(frame(),0);
 presenter.folderBackdrop({},capture,{...held,opened:false});assert.equal(frame(),0,'root-held HOME does not acquire the folder-only shade');

 const shade=picUpFrame=>{
  const layout=poseNativeLayout(pack.layouts.LncFolderCapture_00,pack.animations,[
   {name:'LncFolderCapture_00_Fade',frame:8},{name:'LncFolderCapture_00_PicUp',frame:picUpFrame},
  ]),pane=nativePaneParentPath(layout,'P_Capture_01').at(-1),material=layout.materials[pane.picture.material];
  const source=evaluateNativeMaterial(material,[],[1,1,1,1]);
  return blendNativePixel(source,[200/255,210/255,220/255,1],material.colorBlend).map(value=>Math.round(value*255));
 };
 assert.deepEqual(shade(0),[200,210,220,255]);
 assert.deepEqual(shade(10),[167,177,193,255]);
 const missing=structuredClone(pack);delete missing.animations.LncFolderCapture_00_PicUp;
 const unavailable=createFirmwareHome({renderer:{packs:{launcher:missing},draw(_ctx,_bank,name,options){
  poseNativeLayout(missing.layouts[name],missing.animations,options.bindings,options.overrides);return true;
 }}});
 assert.throws(()=>unavailable.folderBackdrop({},capture,held),/Missing native animation LncFolderCapture_00_PicUp/);
});

test('actual folder paint retains the authored right arrow after a no-arrow six-row root paint',async()=>{
 await withScreens(({paint,events})=>{
  let root=settleHomeNavigation(setHomeDensity(selectHomeSlot(home(),33),5));
  paint(freeze(root));
  assert.deepEqual(events.find(event=>event.name==='arrows').args,[false,false]);
  root={...root,folders:{19:'A'}};
  let opened=enterHomeFolder(root,19);
  paint(freeze(opened));
  assert.deepEqual(events.find(event=>event.name==='arrows').args,[false,true]);
  opened=commitHomeScroll(opened,57);
  paint(freeze(opened));
  assert.deepEqual(events.find(event=>event.name==='arrows').args,[true,false],'folder endpoint still hides the right pane explicitly');
 });
});

test('vacant-root footer retains the decoded Create Folder message with its bounded fitted coverage',()=>{
 const calls=[],renderer={packs:{launcher:pack,messages:messagesPack},draw(_ctx,bank,name,options){calls.push({bank,name,options});return true;}};
 const presenter=createFirmwareHome({renderer}),state=selectHomeSlot(home(),20);
 presenter.footer({},state);
 assert.equal(calls.length,1);assert.equal(calls[0].bank,'launcher');assert.equal(calls[0].name,'LncBtmBtn_02');
 const options=calls[0].options,bank=messagesPack.messages.menu_msbt_LZ;
 const source=bank.messages[bank.labels.lau_1b_make_folder],style=messagesPack.styles[bank.styleTable].styles[source.styleIndex];
 assert.equal(source.text,'Create Folder');assert.equal(source.styleIndex,182);
 assert.deepEqual(style.fontScale,[Math.fround(.7),Math.fround(.7)]);assert.equal(style.characterSpacing,0);assert.equal(style.lineSpacing,0);
 for(const prefix of ['T_BtnBW','T_BtnFW','T_BtnPW'])assert.deepEqual(options.overrides[`${prefix}_C_01`],{text:source.text,messageStyle:style});
 assert.equal(options.overrides.N_BtnW_C_01.visible,true);
 assert.equal(options.bindings.some(binding=>binding.name==='LncBtmBtn_02_SceneIn'&&binding.frame===15),true);
 assert.equal(options.textSampling,'lcd');assert.equal(options.textCoverageAdaptation,'azahar-12p4-fit');
});

test('captured occupied folder uses the decoded centre Open control with no Close segment',()=>{
 const calls=[],renderer={packs:{launcher:pack,messages:messagesPack},draw(_ctx,bank,name,options){calls.push({bank,name,options});return true;}};
 const presenter=createFirmwareHome({renderer}),initial=home(),child=initial.system.layout[0];
 const state=selectHomeSlot(enterHomeFolder({...initial,folders:{20:'A'},system:{...initial.system,folderLayouts:{20:{2:child}}}},20),2);
 presenter.footer({},state);
 assert.equal(calls.length,1);assert.equal(calls[0].name,'LncBtmBtn_02');
 const options=calls[0].options,bank=messagesPack.messages.menu_msbt_LZ,source=bank.messages[bank.labels.lau_2b_folder_open];
 assert.equal(source.text,'Open');assert.equal(source.styleIndex,193);
 assert.equal(options.overrides.N_BtnW_C_01.visible,true);
 assert.equal(options.overrides.N_BtnW_L_03.visible,false);assert.equal(options.overrides.N_BtnW_R_02.visible,false);
 for(const prefix of ['T_BtnBW','T_BtnFW','T_BtnPW'])assert.equal(options.overrides[`${prefix}_C_01`].text,'Open');
 assert.equal(options.textCoverageAdaptation,undefined,'non-Create Folder centre labels retain source coverage');
});

test('folder-close footer reenters from the counted root-selection boundary',()=>{
 const calls=[],renderer={packs:{launcher:pack,messages:messagesPack},draw(_ctx,_bank,_name,options){calls.push(options);return true;}};
 const presenter=createFirmwareHome({renderer}),initial=home();
 let state=beginSystemHomeFolderClose(enterHomeFolder({...initial,folders:{20:'A'},system:{...initial.system,
  folderLayouts:{20:{0:initial.system.layout[0]}}}},20));
 const advance=updates=>{
  state={...state,system:{...state.system,homeClock:{...state.system.homeClock,updateCount:state.system.homeClock.updateCount+updates}}};
  state=advanceSystemHomeFolderCloseNative(state,updates).state;
 };
 const scene=()=>calls.at(-1).bindings.find(binding=>binding.name.startsWith('LncBtmBtn_02_Scene'));
 presenter.footer({},state);assert.deepEqual(scene(),{name:'LncBtmBtn_02_SceneOut',frame:0});
 advance(17);presenter.footer({},state);assert.deepEqual(scene(),{name:'LncBtmBtn_02_SceneOut',frame:14});
 advance(1);presenter.footer({},state);assert.deepEqual(scene(),{name:'LncBtmBtn_02_SceneIn',frame:0});
 advance(7);presenter.footer({},state);assert.deepEqual(scene(),{name:'LncBtmBtn_02_SceneIn',frame:7});
 advance(8);presenter.footer({},state);assert.deepEqual(scene(),{name:'LncBtmBtn_02_SceneIn',frame:15});
 presenter.footer({},state,true);assert.deepEqual(scene(),{name:'LncBtmBtn_02_SceneIn',frame:15});
 state=writeHomeNavigation(state,{...getHomeNavigation(state)});
 presenter.footer({},state);assert.deepEqual(scene(),{name:'LncBtmBtn_02_SceneIn',frame:15});
});

test('suspended software footer uses the source X Close glyph while folder Close stays separate',()=>{
 const calls=[],renderer={packs:{launcher:pack,messages:messagesPack},draw(ctx,bank,name,options){calls.push(options);return true;}};
 const presenter=createFirmwareHome({renderer});
 const state=reduceSystem(tickSystem(launchHomeShortcut(tickSystem(createPortfolioState(),3001),'health-safety',4000),6500),'home',6600);
 presenter.footer({},state);
 const native=messagesPack.messages.menu_msbt_LZ;
 const label=native.messages[native.labels.lau_3b_quit].text;
 assert.equal(label,'\ue071 Close');
 for(const prefix of ['T_BtnBW','T_BtnFW','T_BtnPW'])assert.equal(calls[0].overrides[`${prefix}_L_03`].text,label);
 for(const prefix of ['T_BtnBB','T_BtnFB','T_BtnPB'])assert.equal(calls[0].overrides[`${prefix}_L_03`].text,label);
 assert.equal(calls[0].overrides.N_BtnB_L_03.visible,true);
 assert.equal(calls[0].overrides.N_BtnW_L_03.visible,false);
 assert.equal(calls[0].overrides.N_BtnW_R_02.visible,true);
 assert.notEqual(label,native.messages[native.labels.lau_2b_close].text);
});

test('software close retains footer labels through dialog exit then samples the counted source departure',()=>{
 const calls=[],renderer={packs:{launcher:pack,messages:messagesPack},draw(_ctx,_bank,_name,options){calls.push(options);return true;}};
 const presenter=createFirmwareHome({renderer});
 const suspended=reduceSystem(tickSystem(launchHomeShortcut(tickSystem(createPortfolioState(),3001),'work',4000),6200),'home',6300);
 const closing=reduceSystem(reduceSystem(suspended,'back',6400),'open',6500);
 const source=JSON.stringify(pack),owner=closing.system.runtime.application;
 for(const [phase,frame] of [['exiting',null],['exit-terminal',null],['footer-exiting',0],['footer-exiting',3],['footer-terminal',6]]){
  const state=structuredClone(closing);
  Object.assign(state.system.homeApplicationTransition,{phase,appQuitFrame:20,dialogExitFrame:20,footerExitFrame:frame});
  presenter.footer({},state);
  const options=calls.at(-1);
  assert.deepEqual(options.bindings[0],{name:'LncBtmBtn_02_SceneIn',frame:15});
  if(frame!==null){
   assert.deepEqual(options.bindings[1],{name:'LncBtmBtn_02_Decide',frame:5,groups:['G_BtnB_L_03']});
   assert.deepEqual(options.bindings[2],{name:'LncBtmBtn_02_ChangeDw',frame,childBinding:false});
  }
  const pose=poseNativeLayout(pack.layouts.LncBtmBtn_02,pack.animations,options.bindings);
  assert.equal(nativePaneParentPath(pose,'N_BtnW_R_02').at(-1).alpha,255,'departure retains Resume child state');
  assert.equal(options.overrides.N_BtnB_L_03.visible,true);
  assert.equal(options.overrides.N_BtnW_R_02.visible,true);
  assert.equal(options.overrides.T_BtnBB_L_03.text,'\ue071 Close');
  assert.equal(options.overrides.T_BtnBW_R_02.text,'\ue073 Resume');
  assert.equal(state.system.runtime.application,owner);
  presenter.footer({},state,true);
  assert.equal(calls.at(-1).bindings.at(-1).frame,frame===null?15:6);
 }
 const stale=structuredClone(closing);
 Object.assign(stale.system.homeApplicationTransition,{phase:'footer-exiting',footerExitFrame:3});
 stale.system.homeApplicationTransition.identity.owner='stale';
 presenter.footer({},stale);assert.deepEqual(calls.at(-1).bindings[0],{name:'LncBtmBtn_02_SceneIn',frame:15});
 const unavailable=structuredClone(pack);delete unavailable.animations.LncBtmBtn_02_ChangeDw;
 const missing=createFirmwareHome({renderer:{...renderer,packs:{...renderer.packs,launcher:unavailable}}});
 const departing=structuredClone(closing);Object.assign(departing.system.homeApplicationTransition,{phase:'footer-exiting',footerExitFrame:0});
 assert.throws(()=>missing.footer({},departing),/footer exit unavailable/);
 assert.equal(JSON.stringify(pack),source);
});

test('software close returns the new Open footer through direct-member ChangeUp without old Decide tone',()=>{
 const calls=[],renderer={packs:{launcher:pack,messages:messagesPack},draw(_ctx,_bank,_name,options){calls.push(options);return true;}};
 const presenter=createFirmwareHome({renderer}),returning=closeFooterReturn(),source=JSON.stringify(pack);
 for(const [phase,frame] of [['footer-returning',0],['footer-returning',4],['return-terminal',8]]){
  const state=structuredClone(returning);Object.assign(state.system.homeApplicationTransition,{phase,footerReturnFrame:frame});
  presenter.footer({},state);
  const options=calls.at(-1);
  assert.deepEqual(options.bindings,[{name:'LncBtmBtn_02_SceneIn',frame:15},{name:'LncBtmBtn_02_ChangeUp',frame,childBinding:false}]);
  const pose=poseNativeLayout(pack.layouts.LncBtmBtn_02,pack.animations,options.bindings);
  assert.equal(nativePaneParentPath(pose,'N_BtnW_C_01').at(-1).alpha,255);
  assert.equal(options.overrides.N_BtnW_C_01.visible,true);
  assert.equal(options.overrides.N_BtnB_L_03.visible,false);
  assert.equal(options.overrides.N_BtnW_R_02.visible,false);
  assert.equal(options.overrides.T_BtnBW_C_01.text,'Open');
  const scene=nativePaneParentPath(pose,'N_Scene_00').at(-1);
  if(frame===0){assert.equal(scene.alpha,0);assert.equal(scene.translation[1],-4);}
  if(frame===8){assert.equal(scene.alpha,255);assert.equal(scene.translation[1],0);}
  presenter.footer({},state,true);assert.equal(calls.at(-1).bindings.at(-1).frame,8);
 }
 const unavailable=structuredClone(pack);delete unavailable.animations.LncBtmBtn_02_ChangeUp;
 assert.throws(()=>createFirmwareHome({renderer:{...renderer,packs:{...renderer.packs,launcher:unavailable}}}).footer({},returning),/footer return unavailable/);
 assert.equal(JSON.stringify(pack),source);
});

test('footer Select artwork follows the same down-owner rule as release activation',()=>{
 const calls=[],presenter=createFirmwareHome({renderer:{packs:{launcher:pack,messages:messagesPack},draw(_ctx,_bank,_name,options){calls.push(options);return true;}}});
 const suspended=reduceSystem(tickSystem(launchHomeShortcut(tickSystem(createPortfolioState(),3001),'work',4000),6500),'home',6600);
 for(const [start,end,pressed]of [[[98,226],[102,226],false],[[102,226],[98,226],false],[[160,210],[160,214],false],[[160,226],[164,226],true]]){
  let state=dispatchSystemEvent(suspended,{type:'touch',phase:'down',pointerId:7,x:start[0],y:start[1]},6700);
  state=dispatchSystemEvent(state,{type:'touch',phase:'move',pointerId:7,x:end[0],y:end[1]},6750);
  presenter.footer({},state);
  assert.equal(calls.at(-1).bindings.some(b=>b.name==='LncBtmBtn_02_Select'),pressed);
 }
});

test('valid switch hides source footer and cancel restores it without mutating footer actions',()=>{
 const calls=[],renderer={packs:{launcher:pack,messages:messagesPack},draw(_ctx,_bank,_name,options){calls.push(options);return true;}};
 const presenter=createFirmwareHome({renderer});
 const suspended=reduceSystem(tickSystem(launchHomeShortcut(tickSystem(createPortfolioState(),3001),'health-safety',4000),6500),'home',6600);
 const switching=launchHomeShortcut(suspended,'camera',6700),before=JSON.stringify(switching);
 assert.equal(switching.system.dialog,'switch');
 const scene=options=>nativePaneParentPath(poseNativeLayout(pack.layouts.LncBtmBtn_02,pack.animations,options.bindings,options.overrides),'N_Scene_00').at(-1);
 for(const reduced of [false,true]){
  presenter.footer({},switching,reduced);const pose=scene(calls.at(-1));
  assert.equal(pose.alpha,0);assert.equal(pose.translation[1],-32);
 }
 const closing=reduceSystem(switching,'open',6750);
 assert.equal(closing.system.dialog,null);assert.equal(closing.system.homeApplicationTransition.intent.kind,'switch');
 for(const frame of [0,10,20]){
  const state=structuredClone(closing);state.system.homeApplicationTransition.appQuitFrame=frame;
  state.system.homeApplicationTransition.phase=frame===20?'terminal':'closing';
  presenter.footer({},state);const pose=scene(calls.at(-1));
  assert.equal(pose.alpha,0);assert.equal(pose.translation[1],-32);
 }
 assert.equal(JSON.stringify(switching),before);
 presenter.footer({},reduceSystem(switching,'back',6800));
 assert.equal(scene(calls.at(-1)).alpha,255);assert.equal(scene(calls.at(-1)).translation[1],0);
 assert.equal(calls.at(-1).overrides.T_BtnFW_L_03.text,'Manual');
 assert.equal(calls.at(-1).overrides.T_BtnFW_R_02.text,'Open');
 const stale=structuredClone(switching);stale.system.runtime.homeReturn=null;
 assert.throws(()=>presenter.footer({},stale),/owner unavailable/);
});

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

test('live HOME paints the complete decoded base before the separate footer layout', async () => {
  await withScreens(({ screens, paint, events }) => {
    paint(freeze(home()));
    const lower = screens.bottom.getContext('2d');
    const base = events.find(event => event.name === 'toolbar-layout' && event.context === lower);
    assert.ok(base);assert.equal(base.args[1], 'LncBase_D_01');assert.deepEqual(base.args[2].clip, [0,0,320,240]);
    assert.ok(events.indexOf(base) < events.findIndex(event => event.name === 'footer' && event.context === lower));
  }, { realToolbar: true });
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

for (const mode of ['scroll', 'drag']) {
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

test('ordinary grid press preserves primary and effects without setting primary Select', async () => {
  await withScreens(({ paint, cursorCalls }) => {
    const state = home(), tile = getHomePresentation(state).tiles.find(tile => tile.appId);
    paint(state); const before = cursorCalls().map(({ name, args }) => [name, ...args]);
    const pressed = freeze(touchHomeGesture(state, { type: 'touch', phase: 'down', x: tile.x + tile.size / 2,
      y: tile.y + tile.size / 2, pointerId: 4 }, 0).state);
    assert.equal(pressed.system.homeNavigation.gesture.area, 'grid');
    assert.equal(pressed.system.homeNavigation.gesture.mode, 'press');
    paint(pressed);
    assert.deepEqual(cursorCalls().map(({ name, args }) => [name, ...args]), before);
    assert.equal(cursorCalls()[0].args.length, 4, 'primary Select remains the cursorAt default0');
  });
});

test('retained tile writer moves assembled app artwork and plate together, independent of immediate contact', async () => {
  await withScreens(({ paint, events, cursorCalls }) => {
    const state = home(), tile = getHomePresentation(state).tiles.find(tile => tile.appId);
    const draw = () => {
      const plate = events.find(event => event.name === 'tile' && event.args[0] === tile.x && event.args[2] === tile.size);
      const artwork = events.find(event => event.name === 'menuIcon' && event.args[1] === tile.x && event.args[3] === tile.size);
      assert.ok(plate && artwork);
      return { plateY: plate.args[1], artworkY: artwork.args[2], cursors: cursorCalls().map(({ name, args }) => [name, ...args]) };
    };
    paint(state); const baseline = draw();
    for (const [pose, offset] of [[undefined, 0], [{ clip: 'select', frame: 0 }, 0],
      [{ clip: 'select', frame: 1 }, 2], [{ clip: 'decide', frame: 0 }, 2], [{ clip: 'decide', frame: 1 }, 0]]) {
      for (const touching of [false, true]) {
        let supplied = controls(state, { tilePoses: pose ? { [tile.index]: pose } : {} });
        if (touching) supplied = touchHomeGesture(supplied, { type: 'touch', phase: 'down', x: tile.x + tile.size / 2,
          y: tile.y + tile.size / 2, pointerId: 4 }, 0).state;
        freeze(supplied); const before = JSON.stringify(supplied), geometry = getHomePresentation(supplied).tiles.map(({ index, x, y, size }) => [index, x, y, size]);
        paint(supplied, touching ? 999999 : 0); const painted = draw();
        assert.equal(painted.plateY, baseline.plateY + offset);
        assert.equal(painted.artworkY, baseline.artworkY + offset);
        assert.deepEqual(painted.cursors, baseline.cursors);
        assert.deepEqual(getHomePresentation(supplied).tiles.map(({ index, x, y, size }) => [index, x, y, size]), geometry);
        assert.equal(JSON.stringify(supplied), before);
      }
    }
  }, { realTilePose: true, legacyPressOffset: 99 });
});

test('stock artwork uses its grid and pickup materials once, while clearing pickup ownership removes the ghost', async () => {
  await withScreens(({ paint, events }) => {
    const root=home(),portfolio = new Set(['work','projects','hobbies','life','hackuk','nvidia','about','contact']);
    const rootStock=getHomePresentation(root).tiles.find(tile=>tile.appId&&!portfolio.has(tile.appId)),layout={...root.system.layout};delete layout[rootStock.index];
    const initial=selectHomeSlot(enterHomeFolder({...root,folders:{20:'A'},system:{...root.system,layout,folderLayouts:{20:{2:rootStock.appId}}}},20),2);
    const state={...initial,system:{...initial.system,homeControls:null}},view = getHomePresentation(state);
    const stock = view.tiles.filter(tile => tile.appId && !portfolio.has(tile.appId));
    assert.equal(stock.length,1);
    paint(root);assert.equal(events.filter(event => event.name === 'menuIcon').length,7,'portfolio artwork remains on its separate path');
    paint(state);
    const baseline = events.filter(event => event.name === 'ordinaryTitleIcon');
    assert.equal(baseline.length, stock.length);
    assert.deepEqual(baseline.map(event => event.args.slice(1)), stock.map(tile => [tile.x,tile.y,tile.size]));

    const source = stock[0], point = { x: source.x+1, y: source.y + source.size / 2 };
    let gestureDragged=dispatchSystemEvent(state,{type:'touch',phase:'down',...point,pointerId:9},100);
    gestureDragged=tickSystem(gestureDragged,550);const gestureView=getHomePresentation(gestureDragged);
    const pickup=advanceHomeTilePickup2D(createHomeTilePickup(gestureView.gesture.dragged.source,view.density,
      {x:source.x+source.size/2,y:source.y+source.size/2},point,{x:0,y:0}));
    const dragged={...gestureDragged,system:{...gestureDragged.system,homeControls:{...initial.system.homeControls,tilePickup:pickup}}};
    const held = getHomePresentation(dragged); assert.equal(held.ghost.item.id,source.appId);
    paint(dragged);
    assert.equal(events.filter(event => event.name === 'ordinaryTitleIcon').length,stock.length-1,
      'lifted grid source is omitted and its pickup artwork does not re-enter the grid material path');
    const pickupEvent = events.find(event => event.name === 'pickupAt'); assert.ok(pickupEvent);
    assert.deepEqual(pickupEvent.args, [held.ghost.x,held.ghost.y,held.pickup.scale.appliedFrame,getTitle(source.appId).titleId]);

    for(const phase of ['cancel','up']){
      const cleared=dispatchSystemEvent(gestureDragged,{type:'touch',phase,x:point.x,y:point.y,pointerId:9},551);
      assert.equal(getHomePresentation(cleared).ghost,null);paint(cleared);
      assert.equal(events.some(event=>event.name==='pickupAt'),false);
    }
  },{presenterPatch:{pickupAt(ctx,...args){ctx.record('pickupAt',args);return {drawn:true,icon:{x:0,y:0,width:52,height:52,alpha:235/255}};}}});
});

test('missing selected grid title pixels fail explicitly without a raw-image substitution', async () => {
  await withScreens(({paint,events})=>{
    assert.throws(()=>paint(home()),/Native ordinary title icon unavailable/);
    assert.equal(events.some(event=>event.name==='ordinaryTitleIcon'),false);
  },{presenterPatch:{ordinaryTitleIcon(){throw new Error('Native ordinary title icon unavailable: fixture');}}});
});

test('missing held title pixels fail explicitly without a raw-image pickup substitution', async () => {
  await withScreens(({paint})=>{
    const initial=home(),state={...initial,system:{...initial.system,homeControls:null}},portfolio=new Set(['work','projects','hobbies','life','hackuk','nvidia','about','contact']);
    const view=getHomePresentation(state),source=view.tiles.find(tile=>tile.appId&&!portfolio.has(tile.appId)),point={x:source.x+1,y:source.y+source.size/2};
    let gestureDragged=dispatchSystemEvent(state,{type:'touch',phase:'down',...point,pointerId:12},100);
    gestureDragged=tickSystem(gestureDragged,550);const gestureView=getHomePresentation(gestureDragged);
    const pickup=advanceHomeTilePickup2D(createHomeTilePickup(gestureView.gesture.dragged.source,view.density,
      {x:source.x+source.size/2,y:source.y+source.size/2},point,{x:0,y:0}));
    const dragged={...gestureDragged,system:{...gestureDragged.system,homeControls:{...initial.system.homeControls,tilePickup:pickup}}};
    assert.throws(()=>paint(dragged),/Native pickup title icon unavailable/);
  },{presenterPatch:{pickupAt(){throw new Error('Native pickup title icon unavailable: fixture');}}});
});

test('retained slot poses move folder and vacant assemblies without moving neighboring tiles', async () => {
  await withScreens(({ paint, events }) => {
    const initial = home(), state = { ...initial, folders: { 1: 'A' }, system: { ...initial.system,
      layout: { 0: initial.system.layout[0] },
    } };
    const view = getHomePresentation(state), folder = view.tiles.find(tile => tile.folderLabel === 'A'), vacant = view.tiles.find(tile => !tile.appId && tile.folderLabel === null);
    assert.ok(folder && vacant);
    const assemblies = () => events.filter(event => event.name === 'tile' || event.name === 'empty')
      .map(({ name, args }) => ({ name, x: args[0], y: args[1], size: args[2] }));
    paint(state); const baseline = assemblies();
    const supplied = freeze(controls(state, { tilePoses: { [folder.index]: { clip: 'select', frame: 1 }, [vacant.index]: { clip: 'decide', frame: 0 } } }));
    paint(supplied);
    assert.deepEqual(assemblies(), baseline.map(draw => ({ ...draw, y: draw.y +
      ([folder, vacant].some(tile => tile.x === draw.x && tile.y === draw.y) ? 2 : 0) })));
  }, { realTilePose: true });
});

test('child tile poses never leak into a fresh root capture and remain sampled during close/reduced drawing', async () => {
  await withScreens(({ screens, paint, events }) => {
    const folder = enterHomeFolder({ ...home(), folders: { 20: 'A' } }, 20);
    const tile = getHomePresentation(folder).tiles[0];
    const child = freeze(controls(folder, { tilePoses: { [tile.index]: { clip: 'select', frame: 1 } } }));
    paint(child);
    const capture = events.find(event => event.name === 'capture-read');
    assert.ok(capture);
    const captured = events.filter(event => event.context === capture.context && ['tile', 'empty', 'captureFolder'].includes(event.name));
    const root = getHomePresentation({ ...child, opened: false, system: { ...child.system, homeNavigation: {
      ...child.system.homeNavigation, activeFolderSlot: null,
    } } });
    for (const draw of captured) assert.ok(root.tiles.some(tile => tile.x === draw.args[0] && tile.y === draw.args[1]));
    const childDraw = () => events.find(event => event.context === screens.bottom.getContext('2d') && event.name === 'empty' && event.args[0] === tile.x);
    assert.equal(childDraw().args[1], tile.y + 2);
    const closing = freeze(beginSystemHomeFolderClose(child));
    assert.equal(isSystemHomeFolderClosing(closing), true);
    paint(closing); assert.equal(childDraw().args[1], tile.y + 2);
    screens.setReducedMotion(true); paint(closing); assert.equal(childDraw().args[1], tile.y + 2);
  }, { realTilePose: true });
});

test('legacy callers retain their immediate pressed-tile offset', async () => {
  await withScreens(({ paint, events }) => {
    const state = home(); state.system.homeControls = null;
    const tile = getHomePresentation(state).tiles.find(tile => tile.appId);
    const pressed = freeze(touchHomeGesture(state, { type: 'touch', phase: 'down', x: tile.x + tile.size / 2,
      y: tile.y + tile.size / 2, pointerId: 4 }, 0).state);
    paint(pressed);
    const plate = events.find(event => event.name === 'tile' && event.args[0] === tile.x);
    assert.equal(plate.args[1], tile.y + 2);
  }, { realTilePose: true, legacyPressOffset: 2 });
});

test('missing native assets keep the fallback contact offset even with a retained unpressed writer', async () => {
  await withScreens(({ paint, events }) => {
    const initial = home(), tile = getHomePresentation(initial).tiles.find(tile => tile.appId);
    const state = controls(initial, { tilePoses: { [tile.index]: { clip: 'select', frame: 0 } } });
    const pressed = freeze(touchHomeGesture(state, { type: 'touch', phase: 'down', x: tile.x + tile.size / 2,
      y: tile.y + tile.size / 2, pointerId: 4 }, 0).state);
    paint(pressed);
    const artwork = events.find(event => event.name === 'menuIcon' && event.args[1] === tile.x);
    assert.equal(artwork.args[2], tile.y + 2);
  }, { native: false });
});

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
