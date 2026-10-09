import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { createProjectedTouchInput, projectTouchInput } from '../scripts/reference/projected-touch-input.mjs';
import { parseFolderFixture, populatedFolderObservation, preparePopulatedFolderFixture, returnFromPopulatedFolder } from '../scripts/reference/populated-folder-fixture.mjs';
import { createPortfolioState, dispatchSystemEvent, tickSystem } from '../src/os/system.ts';
import { enableHomeControls } from '../src/os/home-controls.ts';
import { rowCount } from '../src/os/state.ts';

function projection(offset = 0) {
  const camera = new THREE.PerspectiveCamera(33, 1.44, 1, 1000);
  camera.position.set(20, 40, 170); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
  const plane = new THREE.Object3D(); plane.rotation.set(-0.4, 0.2, 0.1); plane.updateMatrixWorld();
  const project = (x, y) => {
    const point = plane.localToWorld(new THREE.Vector3((x / 320 - 0.5) * 70, (0.5 - y / 240) * 52.5, 0)).project(camera);
    return [(point.x + 1) * 720 + offset, (1 - point.y) * 500];
  };
  const targets = Object.fromEntries([[52,76],[136,76],[136,160],[52,160],[59,54],[76,137],[160,137],[307,16],[160,226]]
    .map(([x,y]) => [`Touch_${x}_${y}`, project(x,y)]));
  return { targets, project };
}

test('planar projection reaches arbitrary drag positions and rejects inconsistent published targets', () => {
  const f = projection();
  for (const [x,y] of [[62,110],[146,166],[244,137],[0,0],[319,239]]) {
    const point = projectTouchInput(f.targets,x,y).point, expected = f.project(x,y);
    assert.ok(Math.hypot(point[0]-expected[0],point[1]-expected[1]) < 1e-9);
  }
  for (const point of [[NaN,10],[-1,10],[320,10],[10,240]]) assert.throws(() => projectTouchInput(f.targets,...point), /inside the lower LCD/);
  const broken = structuredClone(f.targets); broken.Touch_160_137[0] += 1;
  assert.throws(() => projectTouchInput(broken,62,110), /Independent projected target/);
  assert.throws(() => projectTouchInput({},62,110), /Projected target/);
  const degenerate = Object.fromEntries(Object.keys(f.targets).map(key => [key,[0,0]]));
  assert.throws(() => projectTouchInput(degenerate,62,110), /nondegenerate/);
});

test('real pointer adapter reads fresh projection for each location and timestamps every input', async () => {
  let reads = 0;
  const calls = [], inputs = [], page = {
    locator: () => ({ evaluate: async () => projection(reads++ * 10).targets }),
    viewportSize: () => ({ width: 1440, height: 1000 }),
    mouse: Object.fromEntries(['move','down','up','click'].map(name => [name,async (...args) => calls.push([name,...args])])),
  };
  const pointer = createProjectedTouchInput(page,inputs);
  await pointer.down(62,110); await pointer.move(146,166); await pointer.move(244,137); await pointer.up(); await pointer.click(59,54);
  assert.equal(reads,4);
  assert.deepEqual(calls.map(call => call[0]),['move','down','move','move','up','click']);
  assert.deepEqual(inputs.map(input => input.phase),['move','down','move','move','up','click']);
  assert.ok(inputs.every(input => Number.isFinite(input.at) && input.projection.validation.length === 5));
  const expected = projection(20).project(244,137);
  assert.ok(Math.hypot(calls[3][1]-expected[0],calls[3][2]-expected[1]) < 1e-9);
});

function data(stage = 'child') {
  const child = stage === 'child' || stage === 'hover', selected = child ? stage === 'child' ? 2 : 0 : stage === 'pickup' ? 8 : 28;
  const cursor = { selectedSlot: selected, focus: { toolbarActive: false }, mode: stage === 'hover' || stage === 'pickup' ? 14 : 0,
    primary: { center: child ? { x: selected === 2 ? 244 : 76, y: 137 } : { x: 146, y: 166 } },
    tilePickup: stage === 'hover' || stage === 'pickup' ? { source: { folder: null, slot: 8 } } : null,
    tileCandidate: null, tileTouch: { globalCapture: false, pending: [], widgets: {} } };
  const paint = { phase: 'home', cursor, entryMotion: { folder: { folderFrame: 16, captureFrame: 8 } } };
  return { app: '', dialog: '', sleeping: 'false', menu: child ? 'folder' : 'home', rows: child ? '1' : '6',
    selected: String(child ? 28 : selected), nativeScreen: 'ready', nativeScreenFailure: '',
    homeCursor: JSON.stringify(cursor), folderBanner: JSON.stringify({ selection: stage === 'root'
      ? { kind: 'folder', key: 'folder:1' } : { kind: 'app', id: 'health-safety' } }),
    screenPaint: JSON.stringify(paint), screenPresented: JSON.stringify({ validPublication: true, paint }) };
}

function documentFor(t, dataset) {
  const old = Object.getOwnPropertyDescriptor(globalThis,'document');
  Object.defineProperty(globalThis,'document',{ configurable: true, value: { querySelector: () => ({ dataset,
    querySelector: () => ({ textContent: 'HOME Menu. Health and Safety Information.' }) }) } });
  t.after(() => old ? Object.defineProperty(globalThis,'document',old) : Reflect.deleteProperty(globalThis,'document'));
}

test('populated fixture gates require lower terminal, upper readiness and the exact paired child receipt', t => {
  const dataset = data(); documentFor(t,dataset);
  assert.equal(populatedFolderObservation({ stage: 'child' }).selectedSlot,2);
  for (const mutate of [d => d.nativeScreen = 'loading', d => d.selected = '29', d => d.rows = '2',
    d => { const paint = JSON.parse(d.screenPaint); paint.entryMotion.folder.folderFrame = 15; d.screenPaint = JSON.stringify(paint); },
    d => { const paint = JSON.parse(d.screenPaint); paint.entryMotion.folder.captureFrame = 7; d.screenPaint = JSON.stringify(paint); },
    d => d.screenPresented = JSON.stringify({ validPublication: false, paint: JSON.parse(d.screenPaint) }),
    d => d.screenPresented = JSON.stringify({ validPublication: true, paint: { ...JSON.parse(d.screenPaint), phase: 'app' } }),
    d => { const cursor = JSON.parse(d.homeCursor); cursor.primary.center.x = 160; d.homeCursor = JSON.stringify(cursor); }]) {
    Object.assign(dataset,data()); mutate(dataset);
    assert.equal(populatedFolderObservation({ stage: 'child' }),null);
  }
  Object.assign(dataset,data()); dataset.nativeScreenFailure = 'Folder entry has no matching presented root banner';
  assert.throws(() => populatedFolderObservation({ stage: 'child' }), /matching presented root banner/);
});

test('hover retains actual pickup source after tileCandidate clears and waits for both terminal gates', t => {
  const dataset = data('hover'); documentFor(t,dataset);
  assert.deepEqual(populatedFolderObservation({ stage: 'hover' }).source,{ folder: null, slot: 8 });
  dataset.nativeScreen = 'loading'; assert.equal(populatedFolderObservation({ stage: 'hover' }),null);
  Object.assign(dataset,data('pickup')); assert.equal(populatedFolderObservation({ stage: 'pickup' }).rootSelected,8);
  dataset.selected = '28'; assert.equal(populatedFolderObservation({ stage: 'pickup' }),null);
});

test('populated fixture opts into one touch route while preserving existing fixture options', () => {
  for (const value of ['baseline','native-six-rows']) assert.equal(parseFolderFixture(value,{scenario:'folder',activation:'key'}),value);
  assert.equal(parseFolderFixture('populated-health',{scenario:'folder',activation:'tile'}),'populated-health');
  for (const activation of ['key','touch','physical']) assert.throws(() => parseFolderFixture('populated-health',{scenario:'folder',activation}), /same root-tile touch route/);
  assert.throws(() => parseFolderFixture('populated-health',{scenario:'manual',activation:'tile'}), /folder-only/);
});

test('setup and repeat use guarded actual touch operations and release the held pointer on failure', async () => {
  const calls = [], touch = async (...point) => calls.push(['touch',...point]);
  const pointer = Object.fromEntries(['down','move','up'].map(name => [name,async (...point) => calls.push([name,...point])]));
  const waitFor = async request => {
    calls.push(['guard',request.stage,request.rows]);
    return { selectedSlot: request.stage === 'health' ? 8 : 28, selection: { key: 'folder:1' } };
  };
  const fixture = await preparePopulatedFolderFixture({ state: async () => ({ menu: 'home', rows: '2', selected: '0' }),
    touch, pointer, waitFor, prepareRoot: async () => { calls.push(['root-receipt']); return {}; } });
  assert.deepEqual(calls.filter(call => call[0] === 'touch'),[[307,16],[307,16],[307,16],[307,16],[62,110],[136,160],[210,226],[59,54]].map(point => ['touch',...point]));
  assert.deepEqual(calls.filter(call => ['down','move','up'].includes(call[0])),[['down',62,110],['move',146,166],['move',244,137],['up']]);
  assert.ok(calls.findIndex(call => call[1] === 'hover') < calls.findIndex(call => call[0] === 'move' && call[1] === 244));
  assert.equal(fixture.healthOrigin.nativeRootSlot,null); assert.equal(fixture.nativeCompared,false);
  calls.length = 0;
  await returnFromPopulatedFolder('folder:1',{touch,waitFor});
  assert.deepEqual(calls.map(call => call.slice(0,3)),[['guard','child',undefined],['touch',59,54],['guard','root',undefined]]);
  calls.length = 0;
  await assert.rejects(preparePopulatedFolderFixture({ state: async () => ({ menu: 'home', rows: '2', selected: '0' }),
    touch, pointer, prepareRoot: async () => ({}), waitFor: async request => {
      if (request.stage === 'hover') throw new Error('native readiness blocker');
      return waitFor(request);
    } }), /native readiness blocker/);
  assert.deepEqual(calls.at(-1),['up']);
  assert.ok(!calls.some(call => call[0] === 'move' && call[1] === 244));
});

test('ordinary input reducers create root 28 and carry Health root 8 into child 2 without layout injection', () => {
  let current = enableHomeControls(tickSystem(createPortfolioState(),3001)), now = 4000;
  const touch = (phase,x,y) => { current = dispatchSystemEvent(current,{ type: 'touch', phase, x, y, pointerId: 1 },now++); };
  const settle = () => { now += 700; current = tickSystem(current,now); };
  const tap = (x,y) => { touch('down',x,y); touch('up',x,y); settle(); };
  for (let n = 0; n < 4; n++) tap(307,16);
  assert.equal(rowCount(current),6);
  tap(62,110); assert.equal(current.selected,8);
  tap(136,160); assert.equal(current.selected,28);
  tap(210,226); assert.ok(Object.hasOwn(current.folders,28));
  touch('down',62,110); settle();
  assert.equal(current.selected,8,'Callback3 selects the actual pickup source');
  assert.deepEqual(current.system.homeControls.tilePickup.source,{ folder: null, slot: 8 });
  touch('move',146,166); settle();
  assert.equal(current.opened,true); assert.equal(current.selected,28); assert.equal(rowCount(current),1);
  assert.equal(current.system.homeControls.tileCandidate,null);
  assert.deepEqual(current.system.homeControls.tilePickup.source,{ folder: null, slot: 8 });
  touch('move',244,137); touch('up',244,137); settle();
  assert.equal(current.folderSelected,2); assert.equal(current.system.folderLayouts[28][2],'health-safety');
  assert.equal(current.system.layout[8],undefined);
  tap(59,54); assert.equal(current.opened,false); assert.equal(current.selected,28);
  tap(136,160); assert.equal(current.opened,true); assert.equal(current.folderSelected,2);
});
