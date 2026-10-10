import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/scene/live-lcd-recorder.ts', import.meta.url), 'utf8');
const compile = text => ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const captureUrl = `data:text/javascript,${encodeURIComponent(compile(readFileSync(new URL('../src/scene/lcd-capture.ts', import.meta.url), 'utf8')))}`;
const js = compile(source).replace("'./lcd-capture'", JSON.stringify(captureUrl));
const { createLiveLcdRecorder, mountLiveLcdRecorder } = await import(`data:text/javascript,${encodeURIComponent(js)}`);

function fixture(overrides = {}) {
  let now = 0, id = 0, encodes = 0, version = 'current';
  const bodies = [], order = [];
  const recorder = createLiveLcdRecorder({
    now: () => now,
    uuid: () => `00000000-0000-4000-8000-${String(++id).padStart(12, '0')}`,
    readPair: () => { encodes++; order.push('top', 'bottom'); now += 2; return { top: `data:image/png;base64,${version}-top`, bottom: `data:image/png;base64,${version}-bottom`, dimensions: { top: { width: 400, height: 240 }, bottom: { width: 320, height: 240 } } }; },
    post: async body => { bodies.push(JSON.parse(body)); return { directory: `/private/${JSON.parse(body).scenario}` }; },
    ...overrides,
  });
  const observe = (frame, paint = { at: frame, phase: 'home' }, validPublication = true) => recorder.observe(JSON.stringify({ at: now, frame, validPublication, paint }), JSON.stringify(paint));
  return { recorder, observe, bodies, order, setNow: value => { now = value; }, setVersion: value => { version = value; }, encodes: () => encodes };
}

test('record current paired paint synchronously before footer state changes, with immutable receipt and no repaint', async () => {
  const f = fixture();
  f.recorder.start();
  const paint = { at: 10, phase: 'applet', notesClose: { frame: 20, owner: 'notes' } };
  f.observe(10, paint); f.order.push('footer-completion');
  paint.phase = 'home'; paint.notesClose.frame = 0; f.setVersion('repainted');
  f.recorder.stop(); await f.recorder.save();
  assert.deepEqual(f.order, ['top', 'bottom', 'footer-completion']);
  assert.equal(f.encodes(), 1);
  assert.equal(f.bodies[0].top, 'data:image/png;base64,current-top');
  assert.equal(f.bodies[0].bottom, 'data:image/png;base64,current-bottom');
  assert.equal(f.bodies[0].receipt.paint.phase, 'applet');
  assert.deepEqual(f.bodies[0].paint, f.bodies[0].receipt.paint);
  assert.equal(f.bodies[0].recording.maximumOverheadMs, 2);
  assert.match(f.bodies[0].recording.evidence, /no compositor acceptance/);
});

test('idle, stopped and disposed observations never read surfaces', () => {
  const f = fixture(); f.observe(1); f.recorder.start(); f.recorder.stop(); f.observe(2); f.recorder.dispose(); f.observe(3);
  assert.equal(f.encodes(), 0); assert.equal(f.recorder.summary().state, 'disposed');
});

test('first/repeat paints are ordered and repeated rendered paint is explicitly counted', async () => {
  const f = fixture(); f.recorder.start();
  f.observe(1, { at: 1 }); f.observe(2, { at: 1 }); f.observe(3, { at: 2 });
  assert.equal(f.encodes(), 2); assert.equal(f.recorder.summary().repeats, 1);
  f.recorder.stop(); await f.recorder.save();
  assert.deepEqual(f.bodies.map(body => body.receipt.frame), [1, 3]);
  assert.deepEqual(f.bodies.map(body => body.sequence), [1, 2]);
  f.recorder.start(); f.observe(4); f.recorder.stop(); await f.recorder.save();
  assert.notEqual(f.bodies[0].recording.session, f.bodies[2].recording.session);
  assert.equal(new Set(f.bodies.map(body => body.scenario)).size, 3);
});

test('stale receipts and reappearing paints stop without reading mismatched surfaces', () => {
  for (const stale of ['receipt', 'paint', 'time']) {
    const f = fixture(); f.recorder.start(); f.observe(1, { at: 1 }); f.observe(2, { at: 2 });
    if (stale === 'receipt') f.observe(2, { at: 3 });
    else if (stale === 'time') { f.setNow(-1); f.observe(3, { at: 3 }); }
    else f.observe(3, { at: 1 });
    assert.equal(f.encodes(), 2); assert.equal(f.recorder.summary().reason, 'error');
    assert.match(f.recorder.summary().error, /Stale/); f.recorder.dispose();
  }
});

test('hidden, context loss and invalid publications retain partial pairs and stop explicitly', () => {
  for (const reason of ['hidden', 'context-lost', 'render-error', 'invalid-publication']) {
    const f = fixture(); f.recorder.start(); f.observe(1);
    if (reason === 'invalid-publication') f.observe(2, { at: 2 }, false);
    else f.recorder.unavailable(reason);
    assert.equal(f.encodes(), 1); assert.equal(f.recorder.summary().frames, 1);
    assert.equal(f.recorder.summary().reason, reason); assert.equal(f.recorder.summary().invalid, 1);
    f.recorder.dispose();
  }
});

test('missing/mismatched receipt and encoder failure do not publish a partial pair', () => {
  for (const kind of ['missing', 'mismatch', 'encode']) {
    const f = fixture(kind === 'encode' ? { readPair: () => { throw new Error('bottom PNG failed'); } } : {});
    f.recorder.start();
    if (kind === 'missing') f.recorder.observe(undefined, undefined);
    else if (kind === 'mismatch') f.recorder.observe(JSON.stringify({ at: 1, frame: 1, validPublication: true, paint: { at: 1 } }), JSON.stringify({ at: 2 }));
    else f.observe(1);
    assert.equal(f.recorder.summary().frames, 0); assert.equal(f.recorder.summary().reason, 'error'); f.recorder.dispose();
  }
});

test('frame, duration, byte and input limits are explicit, including an otherwise idle timeout', async () => {
  for (const [limits, expected] of [[{ frames: 1 }, 'frame-limit'], [{ bytes: 1 }, 'byte-limit'], [{ durationMs: 1 }, 'duration-limit']]) {
    const f = fixture({ limits }); f.recorder.start(); f.observe(1);
    assert.equal(f.recorder.summary().reason, expected); f.recorder.dispose();
  }
  const f = fixture({ limits: { inputs: 1 } }); f.recorder.start();
  f.recorder.input({ type: 'keydown', code: 'KeyA' }, false);
  assert.equal(f.recorder.summary().inputCount, 0);
  f.recorder.input({ type: 'keydown', code: 'KeyA' }, true);
  f.recorder.input({ type: 'keyup', code: 'KeyA' }, true);
  assert.equal(f.recorder.summary().reason, 'input-limit'); f.recorder.dispose();
  const timeout = fixture({ limits: { durationMs: 5 } }); timeout.recorder.start();
  await new Promise(resolve => setTimeout(resolve, 15));
  assert.equal(timeout.recorder.summary().reason, 'duration-limit'); timeout.recorder.dispose();
});

test('oversized pair is refused with an explicit reason', () => {
  const f = fixture({ readPair: () => ({ top: 'x'.repeat(8 * 1024 * 1024), bottom: 'y', dimensions: {} }) });
  f.recorder.start(); f.observe(1); assert.equal(f.recorder.summary().reason, 'pair-byte-limit'); assert.equal(f.recorder.summary().frames, 0); f.recorder.dispose();
});

test('save cannot run during animation and names each pair uniquely through unchanged API payload', async () => {
  const f = fixture(); f.recorder.start(); f.observe(1); await f.recorder.save();
  assert.equal(f.bodies.length, 0);
  f.recorder.input({ type: 'pointerdown', x: 10, y: 20, button: 0 }, true); f.observe(2);
  f.recorder.stop(); await f.recorder.save(); await f.recorder.save();
  assert.equal(f.bodies.length, 2);
  for (const body of f.bodies) { assert.match(body.scenario, /^[a-z0-9-]{1,64}$/); assert.equal(body.schema, 'browser-native-lcd-capture-v1'); }
  assert.equal(f.bodies[1].recording.sequence[1].inputCount, 1);
  assert.equal(f.bodies[1].recording.inputs[0].type, 'pointerdown');
  assert.equal(f.recorder.summary().saved.length, 2);
});

test('failed output retains partial success; retry uses new path and never resends successful pair', async () => {
  let calls = 0; const scenarios = [], bodies = [];
  const f = fixture({ post: async body => { const value = JSON.parse(body); bodies.push(value); scenarios.push(value.scenario); if (++calls === 2) throw new Error('network failure'); return { directory: `/private/${value.scenario}` }; } });
  f.recorder.start(); f.observe(1); f.observe(2); f.recorder.stop(); await f.recorder.save();
  assert.equal(f.recorder.summary().saved.length, 1); assert.equal(f.recorder.summary().failures.length, 1);
  assert.match(f.recorder.summary().error, /may have completed/);
  const failed = f.recorder.summary().failures[0];
  assert.equal(failed.scenario, scenarios[1]); assert.equal(failed.writeStatus, 'unknown');
  await f.recorder.save(); assert.equal(f.recorder.summary().saved.length, 2);
  assert.equal(new Set(scenarios).size, 3);
  assert.deepEqual(f.recorder.summary().failures, [failed]);
  assert.deepEqual(bodies[2].recording.failures, [failed]);
  assert.deepEqual(new Set([...f.recorder.summary().saved, ...f.recorder.summary().failures].map(value => value.scenario)), new Set(scenarios));
  await f.recorder.save();
  assert.deepEqual(f.recorder.summary().failures, [failed]); assert.equal(calls, 3);
});

test('invalid save response is explicit and retains pair for a fresh-path retry', async () => {
  const f = fixture({ post: async () => ({}) }); f.recorder.start(); f.observe(1); f.recorder.stop(); await f.recorder.save();
  assert.match(f.recorder.summary().error, /no directory/); assert.equal(f.recorder.summary().saved.length, 0); f.recorder.dispose();
  assert.equal(f.recorder.summary().failures[0].writeStatus, 'unknown');
});

test('cancel/dispose abort pending save and late replies cannot restore state or paths', async () => {
  for (const action of ['cancel', 'dispose']) {
    let complete, signal;
    const f = fixture({ post: (_, currentSignal) => { signal = currentSignal; return new Promise(resolve => { complete = resolve; }); } });
    f.recorder.start(); f.observe(1); f.recorder.stop(); const saving = f.recorder.save();
    f.recorder[action](); assert.equal(signal.aborted, true); complete({ directory: '/late' }); await saving;
    assert.equal(f.recorder.summary().state, action === 'cancel' ? 'cancelled' : 'disposed');
    assert.equal(f.recorder.summary().frames, 0); assert.equal(f.recorder.summary().saved.length, 0);
    assert.equal(f.recorder.summary().failures.length, 1);
    assert.match(f.recorder.summary().failures[0].scenario, /^live-lcd-/);
    assert.match(f.recorder.summary().failures[0].error, /unknown/);
  }
});

test('start never silently discards unsaved pairs; cancellation permits a new session', () => {
  const f = fixture(); f.recorder.start(); f.observe(1); f.recorder.stop(); f.recorder.start();
  assert.equal(f.recorder.summary().state, 'stopped'); assert.equal(f.recorder.summary().frames, 1);
  assert.match(f.recorder.summary().error, /Save or cancel/);
  f.recorder.cancel(); f.recorder.start(); assert.equal(f.recorder.summary().state, 'recording'); f.recorder.dispose();
});

test('remote and non-opt-in mounts perform zero DOM/surface work even in development', () => {
  const surfaces = new Proxy({}, { get() { throw new Error('surface read'); } });
  for (const location of [{ hostname: 'example.com', search: '?lcdCapture=1' }, { hostname: 'localhost', search: '' }]) assert.equal(mountLiveLcdRecorder({}, location, surfaces), undefined);
});

test('mounted local controls and trusted console keys record without seeking; disposal removes controls/listeners', async () => {
  class Element extends EventTarget {
    constructor(tag) { super(); this.tag = tag; this.children = []; this.style = {}; this.dataset = {}; }
    setAttribute(key, value) { this[key] = value; }
    appendChild(child) { this.children.push(child); child.parent = this; return child; }
    remove() { this.parent.children.splice(this.parent.children.indexOf(this), 1); }
    contains(value) { return value === this || this.children.some(child => child.contains(value)); }
    closest() { return null; }
  }
  class KeyboardEvent {
    constructor(code, options = {}) { this.type = options.type ?? 'keydown'; this.code = code; this.ctrlKey = options.shortcut ?? true; this.shiftKey = options.shortcut ?? true; this.isTrusted = options.trusted ?? false; this.target = options.target; }
    preventDefault() {}
    stopImmediatePropagation() { this.stopped = true; }
    composedPath() { return [this.target]; }
  }
  const originals = new Map(['document', 'window', 'Element', 'Node', 'KeyboardEvent', 'PointerEvent', 'fetch'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const listeners = new Map();
  const window = {
    addEventListener(type, callback) { const entries = listeners.get(type) ?? []; entries.push(callback); listeners.set(type, entries); },
    removeEventListener(type, callback) { listeners.set(type, (listeners.get(type) ?? []).filter(value => value !== callback)); },
    dispatchEvent(event) { for (const callback of listeners.get(event.type) ?? []) { callback(event); if (event.stopped) break; } },
  }, document = new EventTarget(); document.createElement = tag => new Element(tag);
  const sent = [];
  Object.assign(globalThis, { window, document, Element, Node: Element, KeyboardEvent, PointerEvent: class extends Event {}, fetch: async (url, options) => { sent.push({ url, options }); return { ok: true, json: async () => ({ directory: '/local/output' }) }; } });
  let mounted;
  try {
    const host = new Element('host'); let version = 'before';
    const canvas = width => ({ width, height: 240, toDataURL: () => `data:image/png;base64,${version}` });
    mounted = mountLiveLcdRecorder(host, { hostname: 'localhost', search: '?lcdCapture=1' }, { nativeTop: canvas(400), bottom: canvas(320) });
    const panel = host.children[0]; assert.equal(panel['aria-label'], 'Live LCD recorder');
    assert.deepEqual(panel.children.filter(child => child.tag === 'button').map(child => child.textContent), ['Start', 'Stop', 'Save', 'Cancel']);
    window.dispatchEvent(new KeyboardEvent('Digit7'));
    const supported = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'NumpadEnter', 'Escape', 'Space', 'KeyA', 'KeyB', 'KeyH', 'KeyP', 'KeyX', 'KeyY', 'KeyQ', 'KeyE', 'KeyM', 'Equal', 'Minus', 'NumpadAdd', 'NumpadSubtract'];
    for (const code of supported) for (const type of ['keydown', 'keyup']) window.dispatchEvent(new KeyboardEvent(code, { type, shortcut: false, trusted: true, target: host }));
    window.dispatchEvent(new KeyboardEvent('KeyA', { shortcut: false, target: host }));
    const paint = JSON.stringify({ at: 1 });
    mounted.observe(JSON.stringify({ at: 1, frame: 1, validPublication: true, paint: { at: 1 } }), paint);
    version = 'after'; window.dispatchEvent(new KeyboardEvent('Digit8'));
    window.dispatchEvent(new KeyboardEvent('Digit9')); await new Promise(resolve => setImmediate(resolve));
    assert.equal(sent.length, 1); assert.equal(sent[0].url, '/api/verification/lcd-capture?lcdCapture=1');
    assert.equal(JSON.parse(sent[0].options.body).top, 'data:image/png;base64,before');
    assert.deepEqual(JSON.parse(sent[0].options.body).recording.inputs.map(value => [value.code, value.type]), supported.flatMap(code => [[code, 'keydown'], [code, 'keyup']]));
    assert.equal(sent[0].options.credentials, 'same-origin');
    assert.match(panel.children.at(-1).textContent, /\/local\/output/);
    mounted.dispose(); mounted = undefined;
    assert.equal(host.children.length, 0); assert.equal(host.dataset.liveLcdRecorder, undefined);
    window.dispatchEvent(new KeyboardEvent('Digit7')); assert.equal(host.dataset.liveLcdRecorder, undefined);
  } finally {
    mounted?.dispose();
    for (const [key, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
  }
});

test('scene snapshot boundary precedes both footer completions and does not call fixed-pose capture', () => {
  const scene = readFileSync(new URL('../src/scene/console-scene.ts', import.meta.url), 'utf8');
  const render = scene.slice(scene.indexOf('function renderFrame()'), scene.indexOf('function animate('));
  assert.ok(render.indexOf('renderer.render(scene,camera)') < render.indexOf('liveLcdRecorder?.observe('));
  assert.ok(render.indexOf('host.dataset.screenPresented=JSON.stringify') < render.indexOf('liveLcdRecorder?.observe('));
  for (const footer of ['completeNotesFooterClose(', 'completeNotificationsFooterClose(']) assert.ok(render.indexOf('liveLcdRecorder?.observe(') < render.indexOf(footer));
  assert.doesNotMatch(source, /captureScreensAt|requestAnimationFrame|tickSystem|paintScreens/);
});
