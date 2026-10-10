import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import { createPortfolioState, tickSystem, touchSystem, reduceSystem, dispatchSystemEvent, setSystemSleeping, launchHomeShortcut, invokeSystemApplet } from '../src/os/system.ts';
import { enableHomeControls, selectHomeToolbarControlTouch } from '../src/os/home-controls.ts';
import { createNativeScreenInputGate } from '../src/os/native-screen-input.ts';
import { escapeUnreadyNativeScreen } from '../src/os/native-screen-system.ts';
import { sampleHomeGrid, selectHomeSlot, settleHomeNavigation, setHomeDensity } from '../src/os/home-navigation.ts';
import { homeTitles } from '../src/os/app-registry.ts';
import { nativePaneParentPath, poseNativeLayout } from '../src/os/native-layout.ts';
import { suspendedBackgroundAsset, suspendedBackgroundPlayback } from '../src/scene/home-suspended-background.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const data = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const overrides = new Map(Object.entries({
  'native-system-presentation': 'export const drawNativeSystemOverlay=()=>true;',
  'native-chrome': 'export const createNativeChrome=()=>({ready:Promise.resolve(),draw:()=>true,tile:()=>true});',
  'home-native-layouts': 'export const createHomeLayoutManager=()=>({});',
  'native-title-assets': 'export const loadNativeTitleAssets=(...args)=>globalThis.__resumeLoad(...args);',
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
  const url = data(code + '\n//# sourceURL=' + path); modules.set(path, url); return url;
}
const { createScreens } = await import(moduleUrl(resolve(root, 'src/os/screens.ts')));
const { createFirmwareModel } = await import(moduleUrl(resolve(root, 'src/scene/firmware-model.ts')));
const readPack = path => JSON.parse(readFileSync(resolve(root, 'public/os/firmware/10.7.0-32E/' + path)));
const packs = Object.fromEntries([['launcher', 'launcher.json'], ['messages', 'messages-and-loose.json'], ['hud', 'hud.json']]
  .map(([alias, path]) => [alias, readPack('packs/home/' + path)]));
const modelData = readPack('models/home-background/model.json');
const flush = () => new Promise(resolve => setImmediate(resolve));

async function fixture(run) {
  const saved = new Map(['document', 'Image', 'FontFace', '__resumeLoad'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const events = [], loads = []; let failHealth=false,readback=127;
  const homePacks=structuredClone(packs);
  function canvas() {
    const surface = { width: 0, height: 0, marks: [] };
    const ctx = new Proxy({ canvas: surface, globalAlpha: 1, globalCompositeOperation: 'source-over',
      clearRect() { surface.marks = []; }, fillRect() { surface.marks.push(['fill', ctx.fillStyle]); },
      fillText(value) { surface.marks.push(['text', value]); },
      drawImage(source) { if (source.marks) surface.marks = source.marks.map(mark => mark.slice()); },
      createLinearGradient: () => ({ addColorStop() {} }),
      getImageData(_x, _y, width, height) { const bytes = new Uint8ClampedArray(width * height * 4); bytes.fill(readback); return { width, height, data: bytes }; },
    }, { get: (target, key) => key in target ? target[key] : () => {} });
    surface.getContext = () => ctx; return surface;
  }
  Object.assign(globalThis, {
    document: { createElement: canvas, fonts: { add() {} }, addEventListener() {}, removeEventListener() {}, hidden: false },
    Image: class { decode() { return Promise.resolve(); } }, FontFace: class { load() { return Promise.resolve(this); } },
    __resumeLoad(...args) { let resolve, reject; const pending = new Promise((r, j) => { resolve = r; reject = j; }); loads.push({ args, resolve, reject }); return pending; },
  });
  function renderer(source) {
    return { packs: source, measureSingleLineText: () => 222,
      draw(ctx, alias, name, options = {}) {
        if(failHealth&&alias.startsWith('health-'))return false;
        const pack = source[alias], pose = poseNativeLayout(pack.layouts[name], pack.animations, options.bindings, options.overrides);
        events.push({ name, alias, options, pose }); ctx.canvas.marks.push(['native', name]); return true;
      }, drawLayout() { return true; }, dispose() {} };
  }
  const asset = suspendedBackgroundAsset({ data: modelData, images: new Map(modelData.textures.map(texture => [texture.name,
    { width: texture.width, height: texture.height, data: new Uint8ClampedArray(texture.width * texture.height * 4) }])) });
  const model = createFirmwareModel(asset, suspendedBackgroundPlayback());
  const assets = { renderer: renderer(homePacks), sharedFont: { draw(ctx,value) { ctx.canvas.marks.push(['text',value]); } }, dispose() {}, diagnostics: [],
    titleIconPixels: new Map(homeTitles.filter(title => title.titleId).map(title => [title.titleId.toLowerCase(), { width: 48, height: 48, data: new Uint8ClampedArray(48 * 48 * 4) }])),
    titleIcons: new Map(homeTitles.filter(title=>title.titleId).map(title=>[title.titleId.toLowerCase(),{}])), titleDescriptions: new Map([['0004001000022300', 'Health and Safety Information']]) };
  const screens = createScreens({ firmwareAssets: assets, drawHomeBackground: () => true,
    drawSuspendedBackground(ctx, capture, presentation) {
      events.push({ name: 'retained-upper', capture, presentation });
      if (capture.status === 'ready') { model.setPlayback(suspendedBackgroundPlayback(presentation)); model.update(0); ctx.canvas.marks.push(['retained', capture.owner, capture.generation]); }
      if(capture.status==='ready')events.at(-1).tint=model.group.children[0].children[0].material.uniforms.constant0.value.toArray().slice(0,3);
      return capture.status === 'none' || capture.status === 'ready';
    } });
  let now=10000;
  const paint = (state, receipt = true, {allowFailure=false,verification}={}) => {
    events.length = 0; const result = screens.paint(state, new Date(0), now++,verification);
    if(!allowFailure)assert.equal(screens.stockFailure(), null, String(screens.stockFailure()));
    const presented=receipt&&screens.presentHomeEntryMotion(state);
    return { result, presented, events: events.slice(), upper: screens.nativeTop.marks.slice(), lower: screens.bottom.marks.slice() };
  };
  const resolveLoad = async (index = loads.length - 1) => {
    const selected = loads[index], source = Object.fromEntries(selected.args[2].map(request => [request.alias, readPack(request.url)]));
    selected.resolve({ renderer: renderer(source), diagnostics: [], dispose() {} }); await flush();
  };
  try { await screens.ready; await run({ screens, paint, loads, resolveLoad,assets,homePacks,failHealth:value=>failHealth=value,readback:value=>readback=value }); }
  finally { screens.dispose(); model.dispose(); for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } }
}

test('ordinary Health footer Resume retains both LCDs while the same native owner reacquires readiness', async t => {
  await fixture(async ({ screens, paint, loads, resolveLoad }) => {
    let state = tickSystem(createPortfolioState(), 3001);
    const slot = Number(Object.entries(state.system.layout).find(([, id]) => id === 'health-safety')[0]);
    state = settleHomeNavigation(selectHomeSlot(state, slot));
    const grid = sampleHomeGrid(state.system.homeNavigation), point = grid.slots[slot];
    state = touchSystem(state, point.x - grid.scrollPixels, point.y, 3010);
    assert.equal(state.system.phase, 'launch'); paint(state); await flush(); await resolveLoad();
    state = tickSystem(state, 6500); paint(state);
    state = tickSystem(state, 7000); const ready = paint(state);
    assert.ok(ready.events.some(event => event.name === 'SafeTop_D_00'), 'actual native Health presenter paints its source pack');
    assert.equal(screens.stockStatus(state), 'ready');
    const owner = state.system.runtime.application;
    state = reduceSystem(state, 'home', 7100);
    for (let update = 0; update <= 22; update++) {
      state = { ...state, system: { ...state.system, homeClock: { ...state.system.homeClock, updateCount: 100 + update } } };
      paint(state);
    }
    const resumed = touchSystem(state, 160, 226, 7200);
    assert.equal(resumed.system.phase, 'app'); assert.equal(resumed.system.runtime.application, owner);
    const departure = paint(resumed); await flush();
    t.diagnostic(JSON.stringify({ owner, loads: loads.length, status: screens.stockStatus(resumed), upper: departure.upper, lower: departure.lower }));
    assert.equal(loads.length, 2, 'the actual native session reacquires after HOME inactivity');
    assert.ok(departure.events.some(event => event.name === 'retained-upper' && event.capture.status === 'ready' && event.capture.owner === owner),
      'Resume must keep the exact retained upper Health capture during outgoing HOME');
    assert.ok(departure.events.some(event => event.name === 'LncPauseFade_D_00'),
      'Resume must compose retained lower Health through the native HOME departure');
    assert.notDeepEqual(departure.upper, [['fill', '#000']], 'a pending native view cannot replace retained upper with black');
    assert.notDeepEqual(departure.lower, [['fill', '#000']], 'a pending native view cannot replace retained lower with black');
  });
});

async function ordinaryHealth(f,controls=false){
  let state=tickSystem(createPortfolioState(),3001);
  if(controls)state=enableHomeControls(state);
  const slot=Number(Object.entries(state.system.layout).find(([,id])=>id==='health-safety')[0]);
  state=settleHomeNavigation(selectHomeSlot(state,slot));
  const grid=sampleHomeGrid(state.system.homeNavigation),point=grid.slots[slot];
  state=touchSystem(state,point.x-grid.scrollPixels,point.y,3010);
  if(controls)for(let now=3027;now<=3210&&state.system.phase==='home';now+=17)state=tickSystem(state,now);
  assert.equal(state.system.phase,'launch');f.paint(state);await flush();await f.resolveLoad();
  state=tickSystem(state,6500);f.paint(state);state=tickSystem(state,7000);f.paint(state);
  return state;
}
function home(f,state,now=7100){
  state=reduceSystem(state,'home',now);
  for(let update=0;update<=22;update++){
    state={...state,system:{...state.system,homeClock:{...state.system.homeClock,updateCount:state.system.homeClock.updateCount+1}}};f.paint(state);
  }
  return state;
}
const exitLower=pair=>pair.events.find(event=>event.name==='LncPauseFade_D_00'&&event.options.bindings[0].name.endsWith('SceneOut'));
const pane=(event,name)=>nativePaneParentPath(event.pose,name).at(-1);

test('actual Resume source phases retain their capture until terminal and current prepared pair receive one visible receipt',async()=>{
  await fixture(async f=>{
    let state=home(f,await ordinaryHealth(f)),owner=state.system.runtime.application;
    state=touchSystem(state,160,226,7200);
    let first=f.paint(state,false),capture=first.events.find(event=>event.name==='retained-upper'&&event.capture.status==='ready').capture;
    assert.equal(first.result.resume.frame,0);
    assert.equal(f.paint(state,false).result.resume.frame,0,'unpresented paints do not spend a source frame');
    assert.equal(f.screens.presentHomeEntryMotion(state),true);assert.equal(f.screens.presentHomeEntryMotion(state),false);
    for(let frame=1;frame<=40;frame++){
      const pair=f.paint(state);assert.equal(pair.result.resume.frame,frame);
      const upper=pair.events.find(event=>event.name==='retained-upper'&&event.presentation?.skeletal[0].clip==='BannerBG_SceneOut');
      assert.equal(upper.capture.owner,owner);assert.equal(upper.capture.generation,capture.generation);assert.equal(upper.capture.upper,capture.upper);
      assert.equal(upper.presentation.material[1].frame,Math.max(0,frame-20));
      assert.equal(exitLower(pair).options.bindings[0].frame,frame);
      if(frame<20){assert.ok(pane(exitLower(pair),'P_Lnc_00').alpha>0);assert.deepEqual(upper.tint,[.4,.45,.5]);}
      if(frame===20){assert.equal(pane(exitLower(pair),'P_Lnc_00').alpha,0);assert.deepEqual(upper.tint,[.4,.45,.5]);}
      if(frame===40){assert.deepEqual(upper.tint,[1,1,1]);assert.equal(pane(exitLower(pair),'P_App_00').scale[0],1);}
    }
    assert.equal(f.screens.stockStatus(state),'loading');assert.equal(f.paint(state).result.resume.frame,40,'terminal waits on real native-session loading');
    await flush();await f.resolveLoad();
    const terminal=f.paint(state,false);assert.equal(terminal.result.resume.frame,40);assert.equal(f.screens.stockStatus(state),'loading');
    assert.equal(terminal.events.find(event=>event.name==='retained-upper'&&event.capture.status==='ready').capture.generation,capture.generation,'preparing native pair beneath cover cannot record over the retained capture');
    assert.equal(f.screens.presentHomeEntryMotion(state),true);assert.equal(f.screens.stockStatus(state),'ready');
    const ready=f.paint(state);assert.equal(ready.result?.resume,undefined);assert.ok(ready.lower.some(mark=>mark[0]==='native'&&mark[1]==='SafeTop_D_00'),'the published native pair can be reused without another renderer call');
    state=home(f,state,8000);state=touchSystem(state,160,226,8100);
    const repeat=f.paint(state);assert.equal(repeat.result.resume.frame,0);assert.equal(state.system.runtime.application,owner);
    assert.ok(repeat.events.find(event=>event.name==='retained-upper'&&event.capture.status==='ready').capture.generation>capture.generation);
  });
});

test('Resume app-phase input uses the actual readiness gate for physical, keyboard and touch without mutating Health beneath departure',async()=>{
  await fixture(async f=>{
    let state=touchSystem(home(f,await ordinaryHealth(f)),160,226,7200);f.paint(state);
    const gate=createNativeScreenInputGate(),before=state.system.runtime.instances[state.system.runtime.application].state;
    const dispatch=event=>{const decision=gate(event,f.screens.stockStatus(state));if(decision==='pass')state=dispatchSystemEvent(state,event,7300);else if(decision==='home')state=escapeUnreadyNativeScreen(state,7300);return decision;};
    for(const source of ['physical:A','keyboard:Enter'])assert.equal(dispatch({type:'button',command:'open',phase:'down',source}),'block');
    assert.equal(dispatch({type:'touch',phase:'down',x:160,y:74,pointerId:1}),'block');
    assert.equal(dispatch({type:'touch',phase:'up',x:160,y:74,pointerId:1}),'block');
    assert.equal(state.system.runtime.instances[state.system.runtime.application].state,before);
    assert.equal(dispatch({type:'command',command:'home'}),'home');assert.equal(state.system.phase,'home');
    assert.equal(f.screens.presentHomeEntryMotion(state),false,'HOME escape cannot acknowledge an outgoing Resume candidate');
    f.paint(state);assert.equal(f.screens.stockFailure(),null);
  });
});

test('reduced Resume still requires its exact terminal native pair; stale, hidden, sleep and diagnostic receipts cannot release it',async()=>{
  await fixture(async f=>{
    let state=touchSystem(home(f,await ordinaryHealth(f)),160,226,7200);f.screens.setReducedMotion(true);
    assert.equal(f.paint(state,false).result.resume.frame,40);assert.equal(f.screens.stockStatus(state),'loading');
    globalThis.document.hidden=true;assert.equal(f.screens.presentHomeEntryMotion(state),false);globalThis.document.hidden=false;
    f.paint(state,false);assert.equal(f.screens.presentHomeEntryMotion(setSystemSleeping(state,true,7300)),false);
    f.paint(state,false);f.screens.revokeHomeEntryMotionCandidate();assert.equal(f.screens.presentHomeEntryMotion(state),false);
    f.paint(state,false);f.paint(state,false,{verification:{sampleCalendar:true}});assert.equal(f.screens.presentHomeEntryMotion(state),false);
    await flush();await f.resolveLoad();const terminal=f.paint(state,false);assert.equal(terminal.result.resume.frame,40);
    const replaced=launchHomeShortcut(reduceSystem(state,'power',7400),'health-safety',7500);
    assert.equal(f.screens.presentHomeEntryMotion(replaced),false);assert.equal(f.screens.stockStatus(state),'loading');
    f.paint(state);assert.equal(f.screens.stockStatus(state),'ready');
    f.screens.dispose();assert.equal(f.screens.presentHomeEntryMotion(state),false);
  });
});

test('actual native load/draw failures expose paired recovery and explicit retry keeps the retained source owner',async()=>{
  await fixture(async f=>{
    const state=touchSystem(home(f,await ordinaryHealth(f)),160,226,7200);const first=f.paint(state);
    const capture=first.events.find(event=>event.name==='retained-upper'&&event.capture.status==='ready').capture;
    await flush();f.loads.at(-1).reject(Error('native Health load failed'));await flush();
    const failed=f.paint(state,true,{allowFailure:true});assert.equal(f.screens.stockStatus(state),'error');
    assert.ok(failed.upper.some(mark=>mark[0]==='text'&&mark[1]==='Website display unavailable'));
    assert.equal(failed.result?.resume,undefined);assert.equal(f.screens.retryStockScreen(),true);
    const retry=f.paint(state);assert.equal(retry.result.resume.frame,1);await flush();await f.resolveLoad();
    f.failHealth(true);f.paint(state,true,{allowFailure:true});assert.equal(f.screens.stockStatus(state),'error');
    f.failHealth(false);assert.equal(f.screens.retryStockScreen(),true);f.paint(state);await flush();await f.resolveLoad();
    const restored=f.paint(state);assert.equal(restored.events.find(event=>event.name==='retained-upper'&&event.capture.status==='ready').capture.upper,capture.upper);
  });
});

test('unsupported selected Resume source fails paired publication and resource replacement retires the old receipt',async()=>{
  await fixture(async f=>{
    const state=touchSystem(home(f,await ordinaryHealth(f)),160,226,7200);f.paint(state,false);
    const source=f.homePacks.launcher.animations.LncPauseFade_D_00_SceneOut;
    source.tracks[0].keys[1].value=.5;
    const failed=f.paint(state,true,{allowFailure:true});assert.equal(f.screens.stockStatus(state),'error');assert.match(String(f.screens.stockFailure()),/lower resume source/);
    assert.ok(failed.upper.some(mark=>mark[1]==='Website display unavailable'));
    source.tracks[0].keys[1].value=1;assert.equal(f.screens.retryStockScreen(),true);f.paint(state,false);
    f.screens.setFirmwareAssets({...f.assets});assert.equal(f.screens.presentHomeEntryMotion(state),false);
  });
});

test('a real native pair revoked between terminal sample and receipt cannot release or deadlock Resume',async()=>{
  await fixture(async f=>{
    const state=touchSystem(home(f,await ordinaryHealth(f)),160,226,7200);f.screens.setReducedMotion(true);
    f.paint(state);await flush();await f.resolveLoad();
    assert.equal(f.paint(state,false).result.resume.frame,40);
    f.screens.stockStatus(setSystemSleeping(state,true,7300));
    assert.equal(f.screens.presentHomeEntryMotion(state),false,'the exact prepared native pair was revoked by the actual session callback');
    assert.equal(f.screens.stockStatus(state),'loading');
    assert.equal(f.paint(state).result.resume.frame,40,'no unpresented frame was spent');
    await flush();await f.resolveLoad();assert.equal(f.paint(state).result.resume.frame,40);
    assert.equal(f.screens.stockStatus(state),'ready','the replacement complete pair receives a fresh terminal receipt');
  });
});

test('HUD departure validates every original channel before paired publication',async()=>{
  await fixture(async f=>{
    const state=touchSystem(home(f,await ordinaryHealth(f)),160,226,7200);
    const clip=f.homePacks.hud.animations.HudMenu_00_SceneOut;
    for(const track of clip.tracks){
      const key=track.keys[0],original=key.value;key.value=original+.1;
      const failed=f.paint(state,true,{allowFailure:true});assert.equal(f.screens.stockStatus(state),'error');
      assert.match(String(f.screens.stockFailure()),/HUD SceneOut/);
      assert.ok(failed.upper.some(mark=>mark[1]==='Website display unavailable'));
      key.value=original;assert.equal(f.screens.retryStockScreen(),true);
    }
    assert.equal(f.paint(state).result.resume.frame,0,'failed source validation never spends the first departure frame');
  });
});

test('stale expanded Health source cannot replay after actual touch selects another HOME tile before physical HOME',async()=>{
  for(const publish of [false,true])await fixture(async f=>{
    let state=home(f,await ordinaryHealth(f)),owner=state.system.runtime.application;
    const grid=sampleHomeGrid(state.system.homeNavigation),selected=state.selected;
    const slot=Number(Object.keys(state.system.layout).find(slot=>Number(slot)!==selected&&grid.slots[slot].x-grid.scrollPixels>30&&grid.slots[slot].x-grid.scrollPixels<290));
    const point=grid.slots[slot];state=touchSystem(state,point.x-grid.scrollPixels,point.y,7200);
    assert.equal(state.selected,slot);if(publish)f.paint(state);
    state=dispatchSystemEvent(state,{type:'button',command:'home',phase:'down',source:'physical:HOME'},7300);
    assert.equal(state.system.phase,'app');assert.equal(state.system.runtime.application,owner);
    const pair=f.paint(state,false);
    assert.equal(pair.result?.resume,undefined,'changed HOME origin must fall through to its unchanged route, not replay expanded Health');
    assert.ok(!pair.events.some(event=>event.name==='retained-upper'&&event.presentation?.skeletal[0].clip==='BannerBG_SceneOut'));
    assert.equal(f.screens.presentHomeEntryMotion(state),false);
  });
});

test('selection away and back needs a fresh expanded Health pair receipt before Resume can use that origin',async()=>{
  for(const receipt of [false,true])await fixture(async f=>{
    let state=home(f,await ordinaryHealth(f)),owner=state.system.runtime.application;
    const selected=state.selected,grid=sampleHomeGrid(state.system.homeNavigation);
    const away=grid.slots[selected+1],back=grid.slots[selected];
    state=touchSystem(state,away.x-grid.scrollPixels,away.y,7200);
    state=touchSystem(state,back.x-grid.scrollPixels,back.y,7210);
    assert.equal(state.selected,selected);
    f.paint(state,receipt);
    state=dispatchSystemEvent(state,{type:'button',command:'home',phase:'down',source:'physical:HOME'},7300);
    assert.equal(state.system.runtime.application,owner);
    const pair=f.paint(state,false);
    assert.equal(pair.result?.resume?.frame,receipt?0:undefined,'old selection cannot revive the old snapshot, but a newly accepted matching source can depart');
  });
});

test('toolbar focus and an actual applet open/back cycle cannot reuse the old expanded Health origin',async()=>{
  for(const route of ['toolbar','applet'])await fixture(async f=>{
    let state=home(f,await ordinaryHealth(f)),owner=state.system.runtime.application;
    if(route==='toolbar'){
      state=selectHomeToolbarControlTouch(enableHomeControls(state),2);
      assert.equal(state.system.homeNavigation.focus.toolbarActive,true);
    }else{
      state=invokeSystemApplet(state,'friends',7200);assert.equal(state.system.runtime.instances[state.system.runtime.active].appId,'friends');
      state=dispatchSystemEvent(state,{type:'command',command:'back'},7210);
      assert.equal(state.system.phase,'home');assert.equal(state.system.runtime.homeReturn,owner);
    }
    state=dispatchSystemEvent(state,{type:'button',command:'home',phase:'down',source:'physical:HOME'},7300);
    assert.equal(state.system.phase,'app');assert.equal(state.system.runtime.application,owner);
    const pair=f.paint(state,false);assert.equal(pair.result?.resume,undefined);
    assert.ok(!pair.events.some(event=>event.name==='retained-upper'&&event.presentation?.skeletal[0].clip==='BannerBG_SceneOut'));
    assert.equal(f.screens.presentHomeEntryMotion(state),false);
  });
});

test('HOME lid sleep keeps an unchanged accepted expanded origin for Resume after wake',async()=>{
  await fixture(async f=>{
    let state=home(f,await ordinaryHealth(f));state=setSystemSleeping(state,true,7200);f.paint(state);
    state=setSystemSleeping(state,false,7300);
    state=dispatchSystemEvent(state,{type:'button',command:'home',phase:'down',source:'physical:HOME'},7400);
    assert.equal(state.system.phase,'app');assert.equal(f.paint(state).result.resume.frame,0);
  });
});

const sourceByte=pair=>exitLower(pair)?.options.textures['runtime:pause-lower-home'].data[0];
const pointer=(state,phase,x,y,now)=>dispatchSystemEvent(state,{type:'touch',phase,x,y,pointerId:81},now);

test('actual HOME press then cancel or up-out cannot replace the accepted Resume source',async()=>{
  for(const end of ['cancel','up'])for(const receipt of [false,true])await fixture(async f=>{
    let state=home(f,await ordinaryHealth(f));
    const grid=sampleHomeGrid(state.system.homeNavigation),point=grid.slots[state.selected];
    state=pointer(state,'down',end==='cancel'?point.x-grid.scrollPixels:160,end==='cancel'?point.y:226,7200);
    assert.equal(state.system.homeNavigation.gesture.mode,'press');
    f.readback(201);f.paint(state,receipt);
    state=pointer(state,end,0,0,7210);
    assert.equal(state.system.homeNavigation.gesture,null);
    if(!receipt)f.screens.presentHomeEntryMotion(state);
    state=dispatchSystemEvent(state,{type:'button',command:'home',phase:'down',source:'physical:HOME'},7300);
    const pair=f.paint(state,false);
    assert.equal(pair.result.resume.frame,0);
    assert.equal(sourceByte(pair),127,'pressed paint must not replace the prior stable lower texture, even after cancel restores the origin');
  });
});

test('a stable pending source receipt cannot promote after actual HOME pointer down',async()=>{
  await fixture(async f=>{
    let state=home(f,await ordinaryHealth(f));f.readback(202);f.paint(state,false);
    state=pointer(state,'down',160,226,7200);
    assert.equal(state.system.homeNavigation.gesture.area,'footer');
    f.screens.presentHomeEntryMotion(state);
    state=pointer(state,'cancel',160,226,7210);
    state=dispatchSystemEvent(state,{type:'button',command:'home',phase:'down',source:'physical:HOME'},7300);
    const pair=f.paint(state,false);assert.equal(pair.result.resume.frame,0);
    assert.equal(sourceByte(pair),127,'a receipt in a different transient state cannot promote the unpresented stable paint');
  });
});

test('actual Resume footer down paint and up retain the preceding stable HOME source',async()=>{
  for(const controls of [false,true])await fixture(async f=>{
    let state=home(f,await ordinaryHealth(f,controls));
    state=pointer(state,'down',160,226,7200);assert.equal(state.system.phase,'home');
    assert.equal(state.system.homeNavigation.gesture.area,'footer');
    f.readback(203);f.paint(state);
    state=pointer(state,'up',160,226,7210);assert.equal(state.system.phase,'app');
    const pair=f.paint(state,false);assert.equal(pair.result.resume.frame,0);
    assert.equal(sourceByte(pair),127,'the normal footer down paint must preserve the accepted source until release');
  });
});

test('existing density motion cannot sample or promote a source before the stable origin returns',async()=>{
  for(const pending of [false,true])await fixture(async f=>{
    let state=home(f,await ordinaryHealth(f));
    state=settleHomeNavigation(setHomeDensity(state,3));f.paint(state);
    const original=state.system.homeNavigation.rootView;
    f.readback(204);if(pending)f.paint(state,false);
    state=setHomeDensity(state,4);
    assert.ok(state.system.homeNavigation.motion);
    if(pending)f.screens.presentHomeEntryMotion(state);else f.paint(state);
    state=settleHomeNavigation(setHomeDensity(state,original.density));
    assert.deepEqual(state.system.homeNavigation.rootView,original);
    state=dispatchSystemEvent(state,{type:'button',command:'home',phase:'down',source:'physical:HOME'},7300);
    const pair=f.paint(state,false);assert.equal(pair.result.resume.frame,0);
    assert.equal(sourceByte(pair),127,'in-flight geometry and a receipt under motion cannot replace the prior stable source');
  });
});
