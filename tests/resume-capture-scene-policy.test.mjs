import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
import { createNativeScreenInputGate } from '../src/os/native-screen-input.ts';

const sceneSource = readFileSync(new URL('../src/scene/console-scene.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('console-scene.ts', sceneSource, ts.ScriptTarget.Latest, true);
const functions = new Map();
const restorations = [];
function visit(node) {
  if (ts.isFunctionDeclaration(node) && ['recordScreenPaint', 'paintScreens', 'renderFrame'].includes(node.name?.text)) functions.set(node.name.text, node.getText(ast));
  if (ts.isTryStatement(node) && node.finallyBlock?.getText(ast).includes('recordScreenPaint(restoredAt')) restorations.push(node.finallyBlock.getText(ast));
  ts.forEachChild(node, visit);
}
visit(ast);
assert.equal(functions.size, 3);
assert.equal(restorations.length, 2);
const compile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const captureUrl = `data:text/javascript,${encodeURIComponent(compile(readFileSync(new URL('../src/scene/lcd-capture.ts', import.meta.url), 'utf8')))}`;
const recorderSource = compile(readFileSync(new URL('../src/scene/live-lcd-recorder.ts', import.meta.url), 'utf8')).replace("'./lcd-capture'", JSON.stringify(captureUrl));
const { createLiveLcdRecorder } = await import(`data:text/javascript,${encodeURIComponent(recorderSource)}`);
const load = new Function('runtime', `
  const {screens,state,host,performance,document,renderer,liveLcdRecorder,diagnostics,cameraTextProbe,nativeScreenInput,dispatch}=runtime;
  const start=1000,reduced=false,contextGeneration=0,quality={screenFps:20};
  const topTexture={},bottomTexture={},topScreen={visible:true},touchScreen={visible:true};
  const schedule={invalidate(){},plan(){return {};},presented(){}},scene={updateMatrixWorld(){}},camera={updateProjectionMatrix(){}};
  const poseSample=()=>({}),fitConsole=()=>{},publishProjectedTargets=()=>{},cursorDiagnostic=()=>({});
  const bootRevealFrame=()=>null,bootTerminalIdentity=()=>null,launchTerminalIdentity=()=>null,shutdownTerminalIdentity=()=>null;
  const sampleSystemHomeFolderClose=()=>null,revokeTerminalPublications=()=>nativeScreenInput.cancelHomeResume();
  let lastScreenPaint=0,lastBootPaintFrame=null,lastBootPresentedFrame=null,frame=0,angle=90,entryPublicationRepaintPending=false;
  let verificationBannerFrame,verificationBannerSkeletalFrame,verificationHealthBannerFrame;
  const canvas={width:400,height:240};
  let lastBootPaintIdentity=null,lastBootPresentedIdentity=null,lastLaunchPaintIdentity=null,lastLaunchPresentedIdentity=null,lastShutdownPaintIdentity=null,lastShutdownPresentedIdentity=null;
  ${[...functions.values()].map(compile).join('\n')}
  const restorations=[${restorations.map(block => `()=>${compile(block)}`).join(',')}];
  return {paintScreens,renderFrame,restore:index=>restorations[index](),textures:()=>[topTexture.needsUpdate,bottomTexture.needsUpdate]};
`);

function fixture(result, { hidden = false, contextLost = false, diagnostics = true, cameraTextProbe = false,
  resumeSource = () => null, presentHome = () => {}, dispatch = () => { throw Error('Unexpected scene dispatch'); }, renderError = false } = {}) {
  let now = 1100, paintCalls = 0, pairReads = 0;
  const bodies = [], host = { dataset: {} }, document = { hidden };
  const state = { powered: true, system: { phase: 'home', since: 50, sleeping: false, homeClock: { updateCount: 10 }, homeApplicationTransition: null } };
  const recorder = createLiveLcdRecorder({
    now: () => now,
    uuid: () => '00000000-0000-4000-8000-000000000001',
    readPair: () => { pairReads++; return { top: 'data:image/png;base64,same-paint-top', bottom: 'data:image/png;base64,same-paint-bottom', dimensions: { top: { width: 400, height: 240 }, bottom: { width: 320, height: 240 } } }; },
    post: async body => { bodies.push(JSON.parse(body)); return { directory: '/private/resume-capture' }; },
  });
  const screens = new Proxy({
    paint() { paintCalls++; return result; }, paintTiming: () => ({ elapsedMs: 2 }),
    presentNotesFooterClose: () => null, presentNotificationsFooterClose: () => null,
    stockStatus: () => 'ready', homeResumeInputSource: resumeSource, presentHomeEntryMotion: presentHome,
  }, { get: (target, key) => target[key] ?? (() => {}) });
  const nativeScreenInput = createNativeScreenInputGate();
  const scene = load({ screens, state, host, performance: { now: () => now }, document, diagnostics, cameraTextProbe, liveLcdRecorder: recorder,
    nativeScreenInput, dispatch, renderer: { getContext: () => ({ isContextLost: () => contextLost }), shadowMap: {}, render() { if (renderError) throw Error('Renderer failed'); } } });
  return { scene, state, host, recorder, bodies, nativeScreenInput, setNow: value => { now = value; }, setResult: value => { result = value; }, paintCalls: () => paintCalls, pairReads: () => pairReads };
}

test('the actual renderer dispatches deferred HOME after recording the accepted source pair', () => {
  let ready = false, calls = 0;
  const source = () => ({ key: 'health-owner/origin/capture/resource/epoch', ready });
  const f = fixture(undefined, { resumeSource: source, presentHome: () => { ready = true; }, dispatch(event) {
    assert.equal(JSON.parse(f.host.dataset.screenPresented).validPublication, true);
    assert.equal(JSON.parse(f.host.dataset.screenPresented).paint.phase, 'home');
    assert.deepEqual(event, { type: 'command', command: 'home' });
    calls++;
  } });
  try {
    assert.equal(f.nativeScreenInput({ type: 'button', command: 'home', phase: 'down', source: 'key:KeyH' }, 'loading', source()), 'block');
    f.scene.paintScreens(1090);
    assert.equal(calls, 0);
    f.scene.renderFrame();
    assert.equal(calls, 1);
    f.scene.renderFrame();
    assert.equal(calls, 1, 'duplicate renders cannot consume the input twice');
  } finally { f.recorder.dispose(); }
});

test('hidden, context-lost and failed renderer paths cancel a deferred HOME request', () => {
  for (const reason of ['hidden', 'contextLost', 'renderError']) {
    const source = { key: 'health-owner/origin/capture/resource/epoch', ready: false };
    const f = fixture(undefined, { [reason]: true, resumeSource: () => source });
    try {
      f.nativeScreenInput({ type: 'command', command: 'home' }, 'loading', source);
      f.scene.paintScreens(1090);
      if (reason === 'renderError') assert.throws(() => f.scene.renderFrame(), /Renderer failed/);
      else f.scene.renderFrame();
      assert.equal(f.nativeScreenInput.takeHomeResume('ready', { ...source, ready: true }), false, reason);
    } finally { f.recorder.dispose(); }
  }
});

test('opt-in Camera trace is immutable in the actual same-paint scene receipt and clears on unrelated paint',async()=>{
 for(const route of ['cadence','state-driven','restore0','restore1']){
  const trace={stock:{pair:{owner:'camera:1',pairId:1}},coveredByResume:route!=='cadence'},f=fixture({cameraText:trace},{cameraTextProbe:true});
  try{
   f.recorder.start();if(route.startsWith('restore'))f.scene.restore(Number(route.at(-1)));else f.scene.paintScreens(1090,route==='state-driven');
   const original=structuredClone(trace);assert.deepEqual(JSON.parse(f.host.dataset.screenPaint).cameraText,original);trace.stock.pair.owner='later';
   f.scene.renderFrame();f.recorder.stop();await f.recorder.save();assert.deepEqual(f.bodies[0].paint.cameraText,original);assert.deepEqual(f.bodies[0].receipt.paint.cameraText,original);
   f.setResult(undefined);f.scene.paintScreens(1120);assert.equal(JSON.parse(f.host.dataset.screenPaint).cameraText,null);
  }finally{f.recorder.dispose();}
 }
 const screensSource=readFileSync(new URL('../src/os/screens.ts',import.meta.url),'utf8');
 assert.match(screensSource,/cameraText:Object\.freeze\(\{stock,coveredByResume:!!result\?\.resume\}\)/);
 const off=fixture({cameraText:{fixture:true}});try{off.scene.paintScreens(1090);assert.equal('cameraText' in JSON.parse(off.host.dataset.screenPaint),false);}finally{off.recorder.dispose();}
});

test('Friends Close stages survive actual cadence, state-driven and restoration paint receipts without another pixel read', async () => {
  for (const route of ['cadence', 'state-driven', 'restore0', 'restore1']) for (const kind of ['feedback', 'out', 'in', 'handoff']) {
    const friendsClose = { kind, frame: kind === 'out' ? 20 : 0, owner: 'friends:1', adaptation: true };
    const expected = { ...friendsClose }, f = fixture({ friendsClose });
    try {
      f.recorder.start();
      if (route.startsWith('restore')) f.scene.restore(Number(route.at(-1)));
      else f.scene.paintScreens(1090, route === 'state-driven');
      assert.deepEqual(JSON.parse(f.host.dataset.screenPaint).friendsClose, expected);
      friendsClose.owner = 'later'; friendsClose.frame = 99;
      f.scene.renderFrame(); f.recorder.stop(); await f.recorder.save();
      assert.equal(f.bodies.length, 1);
      assert.deepEqual(f.bodies[0].paint.friendsClose, expected);
      assert.deepEqual(f.bodies[0].receipt.paint.friendsClose, expected);
      assert.equal(f.paintCalls(), 1); assert.equal(f.pairReads(), 1);
      f.setResult(undefined); f.scene.paintScreens(1120);
      assert.equal(JSON.parse(f.host.dataset.screenPaint).friendsClose, null);
    } finally { f.recorder.dispose(); }
  }
  for (const options of [{ hidden: true }, { contextLost: true }, { diagnostics: false }]) {
    const f = fixture({ friendsClose: { kind: 'out', frame: 20, owner: 'friends:1', adaptation: true } }, options);
    try {
      f.recorder.start(); f.scene.paintScreens(1090); f.scene.renderFrame(); f.recorder.stop(); await f.recorder.save();
      assert.equal(f.pairReads(), 0); assert.equal(f.bodies.length, 0);
      if (options.diagnostics === false) assert.equal(f.host.dataset.screenPaint, undefined);
    } finally { f.recorder.dispose(); }
  }
});

test('Browser/Miiverse Close stages survive actual cadence, state-driven and restoration paint receipts without another pixel read', async () => {
  for (const route of ['cadence', 'state-driven', 'restore0', 'restore1']) for (const kind of ['feedback', 'out', 'in', 'handoff']) {
    const webClose = { kind, frame: kind === 'out' ? 20 : 0, owner: 'browser:1', adaptation: true };
    const expected = { ...webClose }, f = fixture({ webClose });
    try {
      f.recorder.start();
      if (route.startsWith('restore')) f.scene.restore(Number(route.at(-1)));
      else f.scene.paintScreens(1090, route === 'state-driven');
      assert.deepEqual(JSON.parse(f.host.dataset.screenPaint).webClose, expected);
      webClose.owner = 'later'; webClose.frame = 99;
      f.scene.renderFrame(); f.recorder.stop(); await f.recorder.save();
      assert.equal(f.bodies.length, 1);
      assert.deepEqual(f.bodies[0].paint.webClose, expected);
      assert.deepEqual(f.bodies[0].receipt.paint.webClose, expected);
      assert.equal(f.paintCalls(), 1); assert.equal(f.pairReads(), 1);
      f.setResult(undefined); f.scene.paintScreens(1120);
      assert.equal(JSON.parse(f.host.dataset.screenPaint).webClose, null);
    } finally { f.recorder.dispose(); }
  }
  for (const options of [{ hidden: true }, { contextLost: true }, { diagnostics: false }]) {
    const f = fixture({ webClose: { kind: 'out', frame: 20, owner: 'browser:1', adaptation: true } }, options);
    try {
      f.recorder.start(); f.scene.paintScreens(1090); f.scene.renderFrame(); f.recorder.stop(); await f.recorder.save();
      assert.equal(f.pairReads(), 0); assert.equal(f.bodies.length, 0);
      if (options.diagnostics === false) assert.equal(f.host.dataset.screenPaint, undefined);
    } finally { f.recorder.dispose(); }
  }
});

test('same-paint Resume footer and departure survive scene receipt and real recorder serialization', async () => {
  for (const [kind, frame, owner, stateDriven] of [['footer', 14, 'health:1', false], ['departure', 40, 'health:2', true]]) {
    const resume = { kind, frame, owner, adaptation: true }, expected = { ...resume };
    const result = { resume }, f = fixture(result);
    try {
      f.recorder.start();
      assert.equal(f.scene.paintScreens(1090, stateDriven), result);
      assert.deepEqual(JSON.parse(f.host.dataset.screenPaint).resume, expected);
      resume.frame = 0; resume.owner = 'later-owner';
      f.state.system.homeClock.updateCount = 99;
      f.setNow(1110); f.scene.renderFrame();
      f.recorder.stop(); await f.recorder.save();
      assert.equal(f.bodies.length, 1);
      const body = f.bodies[0];
      assert.deepEqual(body.paint.resume, expected);
      assert.deepEqual(body.receipt.paint, body.paint);
      assert.equal(body.paint.homeUpdates, 10, 'render does not resample the paint state');
      assert.equal(body.receipt.validPublication, true);
      assert.equal(body.top, 'data:image/png;base64,same-paint-top');
      assert.equal(body.bottom, 'data:image/png;base64,same-paint-bottom');
      assert.equal(f.paintCalls(), 1); assert.equal(f.pairReads(), 1);
      assert.deepEqual(f.scene.textures(), [true, true]);
    } finally { f.recorder.dispose(); }
  }
});

test('both fixed-capture restoration paints record their own Resume pose before the next render', async () => {
  for (const index of [0, 1]) {
    const resume = { kind: 'departure', frame: 3 + index, owner: `health:restore:${index}`, adaptation: true }, expected = { ...resume };
    const f = fixture({ resume });
    try {
      f.recorder.start(); f.scene.restore(index);
      resume.frame = 40;
      f.scene.renderFrame(); f.recorder.stop(); await f.recorder.save();
      assert.equal(f.bodies.length, 1);
      assert.deepEqual(f.bodies[0].paint.resume, expected);
      assert.deepEqual(f.bodies[0].receipt.paint.resume, expected);
      assert.equal(f.paintCalls(), 1); assert.equal(f.pairReads(), 1);
    } finally { f.recorder.dispose(); }
  }
});

test('absent and null Resume poses clear the diagnostic without creating an owner or epoch', () => {
  for (const result of [undefined, {}, { resume: null }]) {
    const f = fixture({ resume: { kind: 'footer', frame: 14, owner: 'health:previous', adaptation: true } });
    try {
      f.scene.paintScreens(1090);
      assert.equal(JSON.parse(f.host.dataset.screenPaint).resume.owner, 'health:previous');
      f.setResult(result); f.scene.paintScreens(1100, true);
      const paint = JSON.parse(f.host.dataset.screenPaint);
      assert.equal(paint.resume, null);
      assert.equal(paint.entryMotion, null); assert.equal(paint.manualEntry, null);
      assert.deepEqual(paint.timing, { elapsedMs: 2 });
      assert.equal('owner' in paint, false); assert.equal('epoch' in paint, false);
    } finally { f.recorder.dispose(); }
  }
});

test('Resume diagnostics do not bypass hidden/context-loss publication or opt-in guards', async () => {
  for (const options of [{ hidden: true }, { contextLost: true }, { diagnostics: false }]) {
    const f = fixture({ resume: { kind: 'footer', frame: 14, owner: 'health:1', adaptation: true } }, options);
    try {
      f.recorder.start(); f.scene.paintScreens(1090); f.scene.renderFrame();
      f.recorder.stop(); await f.recorder.save();
      assert.equal(f.pairReads(), 0); assert.equal(f.bodies.length, 0);
      if (options.hidden) assert.equal(JSON.parse(f.host.dataset.screenPresented).validPublication, false);
      if (options.diagnostics === false) assert.equal(f.host.dataset.screenPaint, undefined);
    } finally { f.recorder.dispose(); }
  }
});
