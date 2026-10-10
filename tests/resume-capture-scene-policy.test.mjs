import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

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
  const {screens,state,host,performance,document,renderer,liveLcdRecorder,diagnostics}=runtime;
  const start=1000,reduced=false,contextGeneration=0,quality={screenFps:20};
  const topTexture={},bottomTexture={},topScreen={visible:true},touchScreen={visible:true};
  const schedule={invalidate(){},plan(){return {};},presented(){}},scene={updateMatrixWorld(){}},camera={updateProjectionMatrix(){}};
  const poseSample=()=>({}),fitConsole=()=>{},publishProjectedTargets=()=>{},cursorDiagnostic=()=>({});
  const bootRevealFrame=()=>null,bootTerminalIdentity=()=>null,launchTerminalIdentity=()=>null,shutdownTerminalIdentity=()=>null;
  const sampleSystemHomeFolderClose=()=>null,revokeTerminalPublications=()=>{};
  let lastScreenPaint=0,lastBootPaintFrame=null,lastBootPresentedFrame=null,frame=0,angle=90,entryPublicationRepaintPending=false;
  let verificationBannerFrame,verificationBannerSkeletalFrame,verificationHealthBannerFrame;
  const canvas={width:400,height:240};
  let lastBootPaintIdentity=null,lastBootPresentedIdentity=null,lastLaunchPaintIdentity=null,lastLaunchPresentedIdentity=null,lastShutdownPaintIdentity=null,lastShutdownPresentedIdentity=null;
  ${[...functions.values()].map(compile).join('\n')}
  const restorations=[${restorations.map(block => `()=>${compile(block)}`).join(',')}];
  return {paintScreens,renderFrame,restore:index=>restorations[index](),textures:()=>[topTexture.needsUpdate,bottomTexture.needsUpdate]};
`);

function fixture(result, { hidden = false, contextLost = false, diagnostics = true } = {}) {
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
  }, { get: (target, key) => target[key] ?? (() => {}) });
  const scene = load({ screens, state, host, performance: { now: () => now }, document, diagnostics, liveLcdRecorder: recorder,
    renderer: { getContext: () => ({ isContextLost: () => contextLost }), shadowMap: {}, render() {} } });
  return { scene, state, host, recorder, bodies, setNow: value => { now = value; }, setResult: value => { result = value; }, paintCalls: () => paintCalls, pairReads: () => pairReads };
}

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
