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
import { nativePaneParentPath, poseNativeLayout, sampleNativeTrack } from '../src/os/native-layout.ts';
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
  const events = [], loads = [],copies=[]; let failHealth=false,readback=127;
  const homePacks=structuredClone(packs);
  function canvas() {
    const surface = { width: 0, height: 0, marks: [] };
    const ctx = new Proxy({ canvas: surface, globalAlpha: 1, globalCompositeOperation: 'source-over',
      clearRect() { surface.marks = []; }, fillRect() { surface.marks.push(['fill', ctx.fillStyle]); },
      fillText(value) { surface.marks.push(['text', value]); },
      drawImage(source) { if (source.marks) surface.marks.push(...source.marks.map(mark => mark.slice())); },
      createLinearGradient: () => ({ addColorStop() {} }),
      getImageData(_x, _y, width, height) {
        const bytes=new Uint8ClampedArray(width*height*4);bytes.fill(readback);
        for(const [index,name] of ['LncBtmBtn_02','HudMenu_00','LncBase_U_00','LncBase_D_01','LncIconSleep_00','LncPlt_00'].entries())bytes[index+1]=Number(surface.marks.some(mark=>mark[0]==='native'&&mark[1]===name));
        return {width,height,data:bytes};
      },
      createImageData(width,height){return {width,height,data:new Uint8ClampedArray(width*height*4)};},
      putImageData(image){copies.push({width:image.width,height:image.height,data:new Uint8ClampedArray(image.data)});surface.marks=[['pixels',image.width,image.height,Array.from(image.data.slice(0,7))]];},
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
    events.length = 0;copies.length=0;const result = screens.paint(state, new Date(0), now++,verification);
    if(!allowFailure)assert.equal(screens.stockFailure(), null, String(screens.stockFailure()));
    const presented=receipt&&screens.presentHomeEntryMotion(state);
    return { result, presented, events: events.slice(),copies:copies.slice(),upper: screens.nativeTop.marks.slice(), lower: screens.bottom.marks.slice() };
  };
  const resolveLoad = async (index = loads.length - 1) => {
    const selected = loads[index], source = Object.fromEntries(selected.args[2].map(request => [request.alias, readPack(request.url)]));
    selected.resolve({ renderer: renderer(source), diagnostics: [], dispose() {} }); await flush();
  };
  try { await screens.ready; await run({ screens, paint, loads, resolveLoad,assets,homePacks,failHealth:value=>failHealth=value,readback:value=>readback=value }); }
  finally { screens.dispose(); model.dispose(); for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } }
}

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

const pointer=(state,phase,x,y,now)=>dispatchSystemEvent(state,{type:'touch',phase,x,y,pointerId:81},now);

test('actual Health Resume withdraws the native footer before retained HOME departure',async()=>{
  await fixture(async f=>{
    let state=home(f,await ordinaryHealth(f,true));
    const owner=state.system.runtime.application;
    state=pointer(state,'down',160,226,7200);
    assert.equal(state.system.homeNavigation.gesture.area,'footer');f.paint(state);
    state=pointer(state,'up',160,226,7210);
    assert.equal(state.system.phase,'app');assert.equal(state.system.runtime.application,owner);
    const first=f.paint(state,false);
    assert.ok(first.events.some(event=>event.name==='LncBtmBtn_02'),
      'actual Resume must compose its native footer withdrawal separately before starting retained HOME departure');
    assert.ok(!first.events.some(event=>event.name==='LncPauseFade_D_00'&&event.options.bindings.some(binding=>binding.name.endsWith('SceneOut'))),
      'lower HOME must remain intact through the separate footer stage');
    assert.equal(f.screens.stockStatus(state),'loading','native application input remains gated behind departure');
    const savedUpper=first.upper.find(mark=>mark[0]==='pixels'),savedLower=first.lower.find(mark=>mark[0]==='pixels');
    assert.deepEqual(savedUpper[3].slice(1,4),[0,1,1],'accepted upper retains native HUD and expanded dialog');
    assert.equal(savedLower[3][1],0,'accepted lower underlay excludes the footer');
    assert.equal(savedLower[3][4],1,'accepted lower retains the native tray');
    assert.equal(savedLower[3][5],1,'accepted lower retains the suspended tile');
    assert.equal(savedLower[3][6],1,'accepted lower retains the native tile plate');
    f.readback(211);
    assert.equal(f.screens.presentHomeEntryMotion(state),true);
    for(let frame=1;frame<=14;frame++){
      const pair=f.paint(state,false),footer=pair.events.findLast(event=>event.name==='LncBtmBtn_02');
      assert.deepEqual(pair.result.resume,{kind:'footer',frame,owner,adaptation:true});
      assert.deepEqual(pair.upper.find(mark=>mark[0]==='pixels'),savedUpper);
      assert.deepEqual(pair.lower.find(mark=>mark[0]==='pixels'),savedLower);
      assert.deepEqual(pair.copies,first.copies,'both complete accepted LCD byte arrays remain unchanged beneath withdrawal');
      const scene=nativePaneParentPath(footer.pose,'N_Scene_00').at(-1);
      const channels=packs.launcher.animations.LncBtmBtn_02_SceneOut.tracks.filter(track=>track.target==='N_Scene_00');
      assert.equal(scene.translation[1],sampleNativeTrack(channels.find(track=>track.property==='translation.y'),frame));
      assert.equal(scene.alpha,Math.round(sampleNativeTrack(channels.find(track=>track.property==='alpha'),frame)));
      if(frame<14){assert.ok(scene.translation[1]<0&&scene.translation[1]>-32);assert.ok(scene.alpha>0&&scene.alpha<255);}
      else{assert.equal(scene.translation[1],-32);assert.equal(scene.alpha,0);}
      assert.ok(!pair.events.some(event=>event.name==='LncPauseFade_D_00'));
      if(frame<14)assert.equal(f.screens.presentHomeEntryMotion(state),true);
    }
    assert.equal(f.paint(state,false).result.resume.frame,14,'no receipt means footer terminal remains pending');
    globalThis.document.hidden=true;assert.equal(f.screens.presentHomeEntryMotion(state),false);globalThis.document.hidden=false;
    assert.equal(f.paint(state,false).result.resume.kind,'footer');
    f.screens.revokeHomeEntryMotionCandidate();assert.equal(f.screens.presentHomeEntryMotion(state),false);
    assert.equal(f.paint(state).result.resume.kind,'footer');
    const departure=f.paint(state,false);
    assert.deepEqual(departure.result.resume,{kind:'departure',frame:0,owner,adaptation:true});
    const lower=departure.events.find(event=>event.name==='LncPauseFade_D_00'&&event.options.bindings[0].name.endsWith('SceneOut'));
    assert.equal(lower.options.textures['runtime:pause-lower-home'].data[1],0,'departure cannot restore the old baked footer');
  });
});

test('reduced footer terminal remains separate from departure and rejects stale destination, diagnostic and sleeping receipts',async()=>{
 await fixture(async f=>{
  let state=touchSystem(home(f,await ordinaryHealth(f,true)),160,226,7200);f.screens.setReducedMotion(true);
  const pending=f.paint(state,false);assert.equal(pending.result.resume.kind,'footer');assert.equal(pending.result.resume.frame,14);
  await flush();await f.resolveLoad();
  f.paint(state,false,{verification:{sampleCalendar:true}});
  assert.equal(f.screens.presentHomeEntryMotion(state),false,'a diagnostic native-pair preparation cannot acknowledge the old footer receipt');
  assert.equal(f.paint(state,false).result.resume.kind,'footer');
  assert.equal(f.screens.presentHomeEntryMotion(setSystemSleeping(state,true,7300)),false);
  f.paint(state,false);f.paint(state,false,{verification:{sampleCalendar:true}});assert.equal(f.screens.presentHomeEntryMotion(state),false);
  assert.equal(f.paint(state).result.resume.kind,'footer');assert.equal(f.screens.stockStatus(state),'loading');
  const terminal=f.paint(state,false);assert.equal(terminal.result.resume.kind,'departure');assert.equal(terminal.result.resume.frame,40);
  assert.equal(f.screens.stockStatus(state),'loading');assert.equal(f.screens.presentHomeEntryMotion(state),true);assert.equal(f.screens.stockStatus(state),'ready');
 });
});

test('cancelled and up-out footer contact preserve the stable same-owner source for physical HOME recovery',async()=>{
 for(const phase of ['cancel','up'])await fixture(async f=>{
  let state=home(f,await ordinaryHealth(f,true)),owner=state.system.runtime.application;
  state=pointer(state,'down',160,226,7200);f.paint(state);
  state=pointer(state,phase,160,180,7210);assert.equal(state.system.phase,'home');
  state=reduceSystem(state,'home',7220);
  const first=f.paint(state,false);assert.equal(first.result.resume.kind,'footer');assert.equal(first.result.resume.frame,0);assert.equal(first.result.resume.owner,owner);
  assert.equal(first.copies[1].data[1],0,'physical recovery uses the prior stable footer-free source');
 });
});

test('unsupported authored footer channels fail paired publication without consuming a footer frame',async()=>{
 for(const property of ['translation.y','alpha'])await fixture(async f=>{
  let state=home(f,await ordinaryHealth(f,true));
  const track=f.homePacks.launcher.animations.LncBtmBtn_02_SceneOut.tracks.find(track=>track.target==='N_Scene_00'&&track.property===property);
  track.keys.at(-1).value+=1;
  state=touchSystem(state,160,226,7200);
  const failed=f.paint(state,false,{allowFailure:true});assert.equal(f.screens.stockStatus(state),'error');assert.match(String(f.screens.stockFailure()),/Resume footer source/);
  assert.equal(failed.result,undefined);assert.equal(f.screens.presentHomeEntryMotion(state),false);
  assert.ok(failed.upper.some(mark=>mark[0]==='text'&&mark[1]==='Website display unavailable'));
  const escaped=escapeUnreadyNativeScreen(state,7300);assert.equal(escaped.system.phase,'home');
  assert.equal(f.screens.presentHomeEntryMotion(escaped),false);
 });
});
