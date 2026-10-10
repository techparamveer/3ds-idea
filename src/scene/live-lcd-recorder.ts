import { encodeNativeLcdPair, lcdCaptureEnabled, lcdDownloadPayload } from './lcd-capture';

type Pair = ReturnType<typeof encodeNativeLcdPair>;
type Limits = { durationMs: number; frames: number; bytes: number; inputs: number };
type Input = { type: string; code?: string; x?: number; y?: number; button?: number };
type Saved = { sequence: number; scenario: string; directory: string };
type Failure = { sequence: number; scenario: string; error: string };
type State = 'idle' | 'recording' | 'stopped' | 'saving' | 'cancelled' | 'disposed';
const DEFAULT_LIMITS: Limits = { durationMs: 30_000, frames: 600, bytes: 96 * 1024 * 1024, inputs: 2048 };
const MAX_PAIR_BYTES = 8 * 1024 * 1024;
const bytes = (value: string) => new TextEncoder().encode(value).byteLength;
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const message = (error: unknown) => error instanceof Error ? error.message : String(error);

/** Observes completed renders, not browser compositor acceptance or native cadence. */
export function createLiveLcdRecorder(options: {
  readPair: () => Pair;
  now: () => number;
  uuid: () => string;
  post: (body: string, signal: AbortSignal) => Promise<unknown>;
  changed?: () => void;
  limits?: Partial<Limits>;
}) {
  const limits = { ...DEFAULT_LIMITS, ...options.limits };
  for (const value of Object.values(limits)) if (!Number.isSafeInteger(value) || value <= 0) throw new Error('Invalid recorder limit');
  let state: State = 'idle', reason = '', error = '', session = '', startedAt = 0, stoppedAt = 0;
  let timer: ReturnType<typeof setTimeout> | undefined, abort: AbortController | undefined;
  let totalBytes = 0, repeats = 0, invalid = 0, overheadMs = 0, maximumOverheadMs = 0, lastFrame = -1;
  let previousReceiptAt: number | undefined, maximumReceiptGapMs = 0;
  let frames: { paint: string; receipt: string; pair: string; capturedAt: number; overheadMs: number; inputCount: number }[] = [];
  let inputs: string[] = [], saved: Saved[] = [], failures: Failure[] = [];
  let inFlight: { sequence: number; scenario: string } | undefined;
  const seen = new Set<string>();
  const changed = () => options.changed?.();
  const clearTimer = () => { if (timer !== undefined) clearTimeout(timer); timer = undefined; };
  const summary = () => ({
    state, reason, error, session, startedAt, stoppedAt, frames: frames.length, inputCount: inputs.length,
    totalBytes, repeats, invalid, overheadMs, maximumOverheadMs, maximumReceiptGapMs,
    limits: { ...limits }, saved: saved.map(value => ({ ...value })), failures: failures.map(value => ({ ...value })),
    inFlight: inFlight ? { ...inFlight } : null,
    evidence: 'render-return receipt; no compositor acceptance; measured pair-encode overhead excludes receipt validation, deduplication and export; synchronous capture can change scheduling; dropped renders and native cadence are unknown',
  });
  function stop(why = 'user') {
    if (state !== 'recording') return;
    state = 'stopped'; reason = why; stoppedAt = options.now(); clearTimer(); changed();
  }
  function fail(why: string) { error = why; stop('error'); }
  function start() {
    if (state === 'disposed' || state === 'saving' || state === 'recording') return;
    // Unsaved data needs an explicit cancellation, never an implicit replacement.
    if (frames.some((_, index) => !saved.some(value => value.sequence === index + 1))) {
      error = 'Save or cancel the existing recording before starting again'; changed(); return;
    }
    const id = options.uuid();
    if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error('Recorder UUID unavailable');
    session = id; state = 'recording'; reason = ''; error = ''; startedAt = options.now(); stoppedAt = 0;
    frames = []; inputs = []; saved = []; failures = []; inFlight = undefined; seen.clear();
    totalBytes = repeats = invalid = overheadMs = maximumOverheadMs = maximumReceiptGapMs = 0;
    previousReceiptAt = undefined; lastFrame = -1;
    timer = setTimeout(() => stop('duration-limit'), limits.durationMs); changed();
  }
  function unavailable(why: string) {
    if (state !== 'recording') return;
    invalid++; stop(why);
  }
  function observe(receiptText: string | undefined, paintText: string | undefined) {
    if (state !== 'recording') return;
    if (options.now() - startedAt >= limits.durationMs) { stop('duration-limit'); return; }
    try {
      const receipt: unknown = JSON.parse(receiptText ?? 'null');
      const paint: unknown = JSON.parse(paintText ?? 'null');
      if (!object(receipt) || !object(paint) || !Number.isSafeInteger(receipt.frame) || typeof receipt.frame !== 'number'
        || typeof receipt.at !== 'number' || !Number.isFinite(receipt.at) || typeof receipt.validPublication !== 'boolean'
        || JSON.stringify(receipt.paint) !== JSON.stringify(paint)) throw new Error('Missing or mismatched render receipt/paint');
      if (!receipt.validPublication) { unavailable('invalid-publication'); return; }
      if (receipt.frame <= lastFrame || previousReceiptAt !== undefined && receipt.at < previousReceiptAt) throw new Error('Stale render receipt');
      lastFrame = receipt.frame;
      if (previousReceiptAt !== undefined) maximumReceiptGapMs = Math.max(maximumReceiptGapMs, receipt.at - previousReceiptAt);
      previousReceiptAt = receipt.at;
      const identity = JSON.stringify(paint);
      if (frames.at(-1)?.paint === identity) { repeats++; return; }
      if (seen.has(identity)) throw new Error('Stale paint reappeared');
      const before = options.now();
      // Both toDataURL calls run in this stack before the caller can repaint.
      const pair = JSON.stringify(options.readPair());
      const after = options.now(), duration = Math.max(0, after - before);
      overheadMs += duration; maximumOverheadMs = Math.max(maximumOverheadMs, duration);
      const item = { paint: identity, receipt: JSON.stringify(receipt), pair, capturedAt: before, overheadMs: duration, inputCount: inputs.length };
      const size = bytes(JSON.stringify(item));
      if (size > MAX_PAIR_BYTES - 65536) { stop('pair-byte-limit'); return; }
      if (totalBytes + size > limits.bytes) { stop('byte-limit'); return; }
      frames.push(item); seen.add(identity); totalBytes += size;
      if (frames.length >= limits.frames) stop('frame-limit');
      else if (after - startedAt >= limits.durationMs) stop('duration-limit');
      // No DOM/status update on each captured frame.
    } catch (caught) { fail(message(caught)); }
  }
  function input(value: Input, trusted: boolean) {
    if (state !== 'recording' || !trusted) return;
    if (options.now() - startedAt >= limits.durationMs) { stop('duration-limit'); return; }
    const encoded = JSON.stringify({ ...value, at: options.now(), sequence: inputs.length + 1 });
    if (inputs.length >= limits.inputs || totalBytes + bytes(encoded) > limits.bytes) { stop('input-limit'); return; }
    inputs.push(encoded); totalBytes += bytes(encoded);
  }
  function cancel() {
    if (state === 'disposed') return;
    if (inFlight) failures.push({ ...inFlight, error: 'Cancelled in-flight export; write status unknown' });
    inFlight = undefined;
    abort?.abort(); abort = undefined; clearTimer();
    reason = `cancelled; discarded ${frames.length} buffered pairs; in-flight writes may have completed`;
    state = 'cancelled'; frames = []; inputs = []; seen.clear(); totalBytes = 0; changed();
  }
  async function save() {
    if (state !== 'stopped' || frames.length === 0) return;
    state = 'saving'; error = ''; failures = [];
    const controller = new AbortController(); abort = controller;
    const recording = { ...summary(), state: 'stopped', inputs: inputs.map(value => JSON.parse(value)),
      sequence: frames.map((value, index) => ({ sequence: index + 1, receipt: JSON.parse(value.receipt), capturedAt: value.capturedAt, overheadMs: value.overheadMs, inputCount: value.inputCount })) };
    changed();
    try {
      for (const [index, item] of frames.entries()) {
        if (controller.signal.aborted) break;
        if (saved.some(value => value.sequence === index + 1)) continue;
        const id = options.uuid();
        if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error('Recorder UUID unavailable');
        const scenario = `live-lcd-${id}-${String(index + 1).padStart(4, '0')}`;
        try {
          const body = lcdDownloadPayload(scenario, { ...JSON.parse(item.pair), receipt: JSON.parse(item.receipt),
            paint: JSON.parse(item.paint), recording, sequence: index + 1 });
          if (bytes(body) > MAX_PAIR_BYTES) throw new Error('Export exceeds per-pair API limit');
          inFlight = { sequence: index + 1, scenario };
          const result = await options.post(body, controller.signal);
          if (controller.signal.aborted) break;
          inFlight = undefined;
          if (!object(result) || typeof result.directory !== 'string' || !result.directory) throw new Error('Export response has no directory; write status unknown');
          saved.push({ sequence: index + 1, scenario, directory: result.directory }); changed();
        } catch (caught) {
          if (controller.signal.aborted) break;
          inFlight = undefined;
          failures.push({ sequence: index + 1, scenario, error: message(caught) });
          error = `Save incomplete: ${message(caught)}; failed write may have completed. Retry uses new paths.`;
          break;
        }
      }
    } catch (caught) { error = message(caught); }
    finally { if (abort === controller) { abort = undefined; state = 'stopped'; changed(); } }
  }
  function dispose() {
    cancel(); state = 'disposed'; clearTimer();
  }
  return { start, stop, observe, unavailable, input, cancel, save, dispose, summary };
}

/** Local opt-in UI. No listeners, surfaces, timers or DOM are created otherwise. */
export function mountLiveLcdRecorder(host: HTMLElement, location: Pick<Location, 'hostname' | 'search'>,
  surfaces: { nativeTop: HTMLCanvasElement; bottom: HTMLCanvasElement }) {
  if (!lcdCaptureEnabled(location, false)) return undefined;
  const panel = document.createElement('section');
  panel.setAttribute('aria-label', 'Live LCD recorder');
  panel.style.cssText = 'position:absolute;top:8px;left:8px;z-index:20;background:#fff;color:#111;padding:8px;max-width:calc(100% - 16px);font:12px sans-serif;overflow-wrap:anywhere';
  const title = document.createElement('strong'); title.textContent = 'Live LCD recorder'; title.style.display = 'block'; panel.appendChild(title);
  const output = document.createElement('output'); output.setAttribute('aria-live', 'polite'); output.style.display = 'block';
  const buttons: HTMLButtonElement[] = [];
  const recorder = createLiveLcdRecorder({
    readPair: () => encodeNativeLcdPair(surfaces.nativeTop, surfaces.bottom), now: () => performance.now(), uuid: () => crypto.randomUUID(),
    post: async (body, signal) => {
      const response = await fetch('/api/verification/lcd-capture?lcdCapture=1', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, signal, cache: 'no-store', credentials: 'same-origin' });
      const result: unknown = await response.json();
      if (!response.ok) throw new Error(object(result) && typeof result.error === 'string' ? result.error : `Export HTTP ${response.status}`);
      return result;
    },
    changed: () => {
      const status = recorder.summary();
      host.dataset.liveLcdRecorder = JSON.stringify(status);
      output.textContent = `${status.state}: ${status.frames} pairs, ${status.saved.length} saved. ${status.reason} ${status.error} ${status.saved.at(-1)?.directory ?? ''}`;
      buttons[0].disabled = status.state === 'recording' || status.state === 'saving';
      buttons[1].disabled = status.state !== 'recording';
      buttons[2].disabled = status.state !== 'stopped' || status.frames === 0 || status.saved.length === status.frames;
    },
  });
  const run = (action: () => void) => { try { action(); } catch (caught) { output.textContent = message(caught); } };
  for (const [label, action, shortcut] of [
    ['Start', () => run(recorder.start), 'Control+Shift+7'],
    ['Stop', () => recorder.stop(), 'Control+Shift+8'],
    ['Save', () => { void recorder.save(); }, 'Control+Shift+9'],
    ['Cancel', () => recorder.cancel(), ''],
  ] as const) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
    if (shortcut) { button.title = `${label} (${shortcut})`; button.setAttribute('aria-keyshortcuts', shortcut); }
    button.addEventListener('click', action); buttons.push(button); panel.appendChild(button);
  }
  panel.appendChild(output); host.appendChild(panel);
  const block = (event: Event) => event.stopPropagation();
  for (const type of ['pointerdown', 'pointerup', 'pointermove', 'wheel', 'keydown', 'keyup']) panel.addEventListener(type, block);
  const shortcut = (event: KeyboardEvent) => {
    if (!event.ctrlKey || !event.shiftKey || event.altKey || event.metaKey || !['Digit7', 'Digit8', 'Digit9'].includes(event.code)) return;
    if (event.target instanceof Element && event.target.closest('input,textarea,[contenteditable=true]')) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (event.repeat) return;
    if (event.code === 'Digit7') run(recorder.start);
    else if (event.code === 'Digit8') recorder.stop();
    else void recorder.save();
  };
  const observeInput = (event: Event) => {
    if (event.composedPath().includes(panel) || !host.contains(event.target instanceof Node ? event.target : null)) return;
    if (event.target instanceof Element && event.target.closest('input,textarea,[contenteditable=true]')) return;
    if (event instanceof KeyboardEvent && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', 'Space', 'KeyA', 'KeyB', 'KeyH', 'KeyP'].includes(event.code)) recorder.input({ type: event.type, code: event.code }, event.isTrusted);
    else if (event instanceof PointerEvent) recorder.input({ type: event.type, x: event.clientX, y: event.clientY, button: event.button }, event.isTrusted);
  };
  const hidden = () => { if (document.hidden) recorder.unavailable('hidden'); };
  window.addEventListener('keydown', shortcut, true);
  const inputTypes = ['keydown', 'keyup', 'pointerdown', 'pointerup', 'pointercancel'];
  for (const type of inputTypes) window.addEventListener(type, observeInput, true);
  document.addEventListener('visibilitychange', hidden);
  output.textContent = 'idle';
  return { observe: recorder.observe, unavailable: recorder.unavailable, dispose: () => {
    recorder.dispose(); window.removeEventListener('keydown', shortcut, true);
    for (const type of inputTypes) window.removeEventListener(type, observeInput, true);
    document.removeEventListener('visibilitychange', hidden); panel.remove(); Reflect.deleteProperty(host.dataset, 'liveLcdRecorder');
  } };
}
