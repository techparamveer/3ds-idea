import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import * as banner from '../src/os/home-banner-host.ts';
import { createPortfolioState, reduceSystem, tickSystem, tickHomeNavigationClockObserved, dispatchSystemEvent } from '../src/os/system.ts';
import { enableHomeControls, reconcileHomeControls, isHomeSwitchPresentationActive } from '../src/os/home-controls.ts';
import { enterHomeFolder, selectHomeSlot, leaveHomeFolder, getHomeNavigation, writeHomeNavigation } from '../src/os/home-navigation.ts';
import { sampleSystemHomeFolderClose, isSystemHomeFolderClosing, cancelSystemHomeFolderClose } from '../src/os/home-folder-close-system.ts';
import { releaseUnreadyNativeInput } from '../src/os/native-screen-system.ts';
import { applicationCloseAllowsInput, applicationCloseNeedsReadyScreen } from '../src/scene/application-close-input.ts';
import { getMenuActionSound } from '../src/os/menu-action-sound.ts';
import { createNativeScreenInputGate } from '../src/os/native-screen-input.ts';

function functionsAt(path) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true), functions = new Map();
  function visit(node) {
    if (ts.isFunctionDeclaration(node) && node.name) functions.set(node.name.text, node);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return names => names.map(name => {
    assert.ok(functions.has(name), `missing live function ${name}`);
    return ts.transpileModule(functions.get(name).getText(ast), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText.replace(/^export /gm, '');
  }).join('\n');
}

const applicationCloseNeedsPaint = new Function(`${functionsAt('../src/scene/render-quality.ts')(['applicationCloseNeedsPaint'])};return applicationCloseNeedsPaint;`)();
const screenFunctions = functionsAt('../src/os/screens.ts');
const bindReadiness = new Function('isSystemHomeFolderClosing', 'entryReady', `
  let disposed=false,panelFailure=false;
  const nativeHome={},options={getHomeBanner(){}},folderEntryBannerOwner=()=>null;
  const folderEntryBanner={requestReady:()=>entryReady.current,activationReady:()=>entryReady.current};
  ${screenFunctions(['folderEntryEligible', 'homeFolderBannerRequestReady', 'homeFolderBannerActivationReady'])}
  return {homeFolderBannerRequestReady,homeFolderBannerActivationReady};
`);
const sceneFunctions = functionsAt('../src/scene/console-scene.ts');
const bindScene = new Function('runtime', 'api', `
  const {crossHomeBannerBoundary,stepHomeBannerHost,skipHomeBannerHostPass,getHomeBannerHostView,
    resetHomeBannerPrimary,resolveHomeBannerHostSelection,resolveHomeBannerHostObservation,
    getHomeBannerCloseReadyUpdate,homeApplicationBannerBoundary}=api.banner;
  const {tickHomeNavigationClockObserved,reconcileHomeControls,isHomeSwitchPresentationActive,
    sampleSystemHomeFolderClose,releaseUnreadyNativeInput,applicationCloseAllowsInput,
    applicationCloseNeedsReadyScreen,applicationCloseNeedsPaint,getMenuActionSound,
    dispatchSystemEvent,createNativeScreenInputGate}=api;
  let state=runtime.state,bannerHost=runtime.bannerHost,reduced=runtime.reduced;
  let homeClockSuspended=false,bannerObservedPhase=state.system.phase,lastBannerRestartBootSince=null,
    bannerEntryFooterBootSince=null,bannerLabelFailure=false,closePublicationEffectNow=null,lastInput;
  const screens={...runtime.readiness,stockStatus:()=> 'ready',homeEntryFooterReadiness:()=>({}),
    homeEntryActivationReady:()=>true,homeAppletFooterBannerReady:()=>true,prepareFolderBannerLabel:()=>({})};
  const bannerClock=()=>({generation:runtime.generation,updateCount:state.system.homeClock.updateCount});
  const folderBanner={syncStockTitles(){},status:()=>({ready:true,defaultReady:true})},homeTitleBannerKind=()=>null;
  const nativeScreenInput=createNativeScreenInputGate(),document={hidden:false},started=false,start=0;
  const performance={now:()=>runtime.now};
  const audio={play(){}},effects={drain(){}},updateAudio=()=>{},observeLaunchEffect=()=>{},
    paint=()=>{},writeState=()=>{},renderFrame=()=>{},revokeTerminalPublications=()=>{};
  ${sceneFunctions(['observeFolderBanner', 'advanceBeforeMutation', 'reducedBannerKey', 'commit', 'dispatch'])}
  return {
    state:()=>state,host:()=>bannerHost,
    observe(selection){observeFolderBanner(bannerClock(),selection);},
    advance(now){advanceBeforeMutation(now);},
    back(now){commit((current,time)=>api.reduceSystem(current,'back',time),'back',false,now);},
    event(event,now){runtime.now=now;dispatch(event);},
    replace(next){state=next;observeFolderBanner();},
    suspend(value){homeClockSuspended=value;observeFolderBanner();},
  };
`);
const FRAME = 1000 / 60, START = 4000;
function fixture({ reduced = false, offscreen = false, generation = 'folder-back:1' } = {}) {
  let state = enterHomeFolder(selectHomeSlot({ ...tickSystem(createPortfolioState(), 3001), folders: { 22: '1 (New Folder)' } }, 22), 22);
  state = enableHomeControls(state);
  if (offscreen) {
    const navigation = getHomeNavigation(state);
    state = writeHomeNavigation(state, { ...navigation, rootView: { ...navigation.rootView, currentLeftSlot: 0, targetLeftSlot: 0 } });
  }
  state = tickHomeNavigationClockObserved(state, START).state;
  const inputs = { managerInhibited: false, sceneInhibited: false, loadInhibited: false, nativeWorkerReady: true, resourceReady: null };
  let host = banner.createHomeBannerHost({ generation, updateCount: 0 }, inputs);
  host = banner.crossHomeBannerBoundary(host, host.clock, { selection: { kind: 'default' } });
  host = banner.crossHomeBannerBoundary(host, host.clock, { inputs: { ...inputs, resourceReady: banner.getHomeBannerHostView(host).resourceTicket } });
  host = banner.crossHomeBannerBoundary(host, { ...host.clock, updateCount: 20 });
  state = { ...state, system: { ...state.system, homeClock: { ...state.system.homeClock, updateCount: 20 } } };
  const entryReady = { current: true }, readiness = bindReadiness(isSystemHomeFolderClosing, entryReady);
  const scene = bindScene({ state, bannerHost: host, reduced, generation, readiness }, {
    banner, reduceSystem, tickHomeNavigationClockObserved, reconcileHomeControls, isHomeSwitchPresentationActive,
    sampleSystemHomeFolderClose, releaseUnreadyNativeInput, applicationCloseAllowsInput,
    applicationCloseNeedsReadyScreen, applicationCloseNeedsPaint, getMenuActionSound,
    dispatchSystemEvent, createNativeScreenInputGate,
  });
  return { scene, readiness, host, state, entryReady };
}
const view = scene => banner.getHomeBannerHostView(scene.host());
const visibleOrbit = scene => view(scene).status === 'active' && view(scene).primary.selection.kind === 'default' && view(scene).primary.motion.visible;

test('actual Back-tab touch dispatch forwards clear on its owned release', () => {
  const { scene } = fixture();
  const contact = { type: 'touch', pointerId: 4, x: 59, y: 54 };
  scene.event({ ...contact, phase: 'down' }, START);
  assert.equal(sampleSystemHomeFolderClose(scene.state()), null);
  assert.equal(visibleOrbit(scene), true);
  const releasedAt = START + 4 * FRAME + .001;
  scene.event({ ...contact, phase: 'up' }, releasedAt);
  assert.equal(isSystemHomeFolderClosing(scene.state()), true);
  assert.deepEqual(scene.host().selection, { kind: 'clear' });
  for (let update = 1; update <= 5; update++) scene.advance(releasedAt + update * FRAME + .001);
  assert.equal(scene.state().opened, true);
  assert.equal(visibleOrbit(scene), false);
});

for (const reduced of [false, true]) for (const offscreen of [false, true]) test(`actual Back clears the orbit before root restoration, reduced=${reduced}, offscreen=${offscreen}`, () => {
  const { scene, readiness, host } = fixture({ reduced, offscreen });
  const oldEpoch = view(scene).primary.activationEpoch, scope = host.scope;
  scene.back(START);
  assert.equal(isSystemHomeFolderClosing(scene.state()), true);
  assert.equal(readiness.homeFolderBannerRequestReady(scene.state()), false, 'entry readiness stays closed during Back');
  assert.equal(readiness.homeFolderBannerActivationReady(scene.state()), false);
  assert.deepEqual(scene.host().selection, { kind: 'clear' }, 'the actual commit clear must cross the entry gate');
  const requestEpoch = scene.host().pending.requestEpoch;
  assert.equal(requestEpoch, host.pending.requestEpoch + 1);
  assert.equal(scene.host().scope, scope);
  assert.equal(view(scene).primary.activationEpoch, oldEpoch);
  assert.equal(visibleOrbit(scene), true, 'request does not hide through a renderer shortcut');
  for (let update = 1; update <= 17; update++) {
    scene.advance(START + update * FRAME + .001);
    assert.equal(scene.state().opened, true);
    assert.equal(scene.host().pending.requestEpoch, requestEpoch, 'repeated observations do not reissue clear');
    if (update <= 4) assert.equal(visibleOrbit(scene), true, 'existing hide track remains visible through update4');
    else assert.equal(visibleOrbit(scene), false, 'existing hide track retires before the lower root');
  }
  scene.advance(START + 18 * FRAME + .001);
  assert.equal(scene.state().opened, false);
  assert.equal(visibleOrbit(scene), false);
  for (let update = 19; update <= 50; update++) scene.advance(START + update * FRAME + .001);
  assert.equal(view(scene).status, 'active');
  assert.equal(view(scene).primary.selection.kind, 'folder');
  assert.equal(view(scene).primary.activationEpoch, oldEpoch + 1);
  assert.equal(scene.host().scope, scope);
  assert.equal(scene.host().clock.generation, host.clock.generation);
  const background = banner.getHomeBannerHostBackgroundFrame(scene.host()), before = banner.getHomeBannerHostBackgroundFrame(host);
  assert.equal(background.loopEpoch, before.loopEpoch);
  assert.equal(background.loopFrame, (before.loopFrame + 50) % 600);
});

test('live entry gate still rejects child content, while an explicit clear is idempotent', () => {
  const { scene, host, entryReady } = fixture();
  entryReady.current = false;
  scene.observe({ kind: 'app', id: 'camera' });
  assert.equal(scene.host().pending.requestEpoch, host.pending.requestEpoch);
  assert.deepEqual(scene.host().selection, { kind: 'default' });
  scene.observe({ kind: 'clear' });
  assert.deepEqual(scene.host().selection, { kind: 'clear' });
  const requested = scene.host().pending.requestEpoch;
  for (let i = 0; i < 3; i++) scene.observe({ kind: 'clear' });
  assert.equal(scene.host().pending.requestEpoch, requested);
  assert.equal(scene.host().scope, host.scope);
});

test('a batched live close preserves the clear and restored selection boundaries', () => {
  const stepped = fixture().scene, batched = fixture().scene;
  stepped.back(START);batched.back(START);
  for (let update = 1; update <= 40; update++) stepped.advance(START + update * FRAME + .001);
  batched.advance(START + 40 * FRAME + .001);
  assert.deepEqual(batched.host(), stepped.host());
  assert.deepEqual(sampleSystemHomeFolderClose(batched.state()), sampleSystemHomeFolderClose(stepped.state()));
  assert.equal(view(batched).primary.selection.kind, 'folder');
});

test('repeat Back retires a fresh child orbit in the same primary scope', () => {
  const { scene, host } = fixture();
  let now = START;
  for (let cycle = 0; cycle < 2; cycle++) {
    const childEpoch = view(scene).primary.activationEpoch;
    assert.equal(visibleOrbit(scene), true);
    scene.back(now);
    assert.equal(sampleSystemHomeFolderClose(scene.state()).controller.identity.transitionId, cycle + 1);
    assert.deepEqual(scene.host().selection, { kind: 'clear' });
    for (let update = 1; update <= 50; update++) {
      scene.advance(now + update * FRAME + .001);
      if (update === 5) {
        assert.equal(scene.state().opened, true);
        assert.equal(visibleOrbit(scene), false);
      }
    }
    now += 50 * FRAME + .001;
    assert.equal(view(scene).primary.selection.kind, 'folder');
    assert.equal(view(scene).primary.activationEpoch, childEpoch + 1);
    if (cycle === 0) {
      // Entry receipt behavior is exercised by home-folder-entry-banner-live.
      // This fixture admits the completed entry to exercise its subsequent Back.
      scene.replace(enterHomeFolder(scene.state(), 22));
      for (let update = 1; update <= 40; update++) scene.advance(now + update * FRAME + .001);
      now += 40 * FRAME + .001;
    }
  }
  assert.equal(scene.host().scope, host.scope);
});

test('live suspension freezes clear motion and context cancellation cannot replay a stale close', () => {
  const { scene } = fixture();
  scene.back(START);scene.advance(START + 2 * FRAME + .001);
  scene.suspend(true);
  const frozen = scene.host();
  scene.advance(START + 1000);
  assert.deepEqual(scene.host(), frozen);
  scene.suspend(false);
  const cancelled = cancelSystemHomeFolderClose(leaveHomeFolder(scene.state()));
  scene.replace(cancelled);
  assert.equal(sampleSystemHomeFolderClose(scene.state()), null);
  scene.advance(START + 1000 + FRAME);
  for (let update = 1; update <= 40; update++) scene.advance(START + 1000 + (update + 1) * FRAME + .001);
  assert.equal(sampleSystemHomeFolderClose(scene.state()), null);
  assert.equal(view(scene).primary.selection.kind, 'folder');
});
