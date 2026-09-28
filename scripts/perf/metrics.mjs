// Pure summaries for scripts/perf/benchmark.mjs output.
export const FRAME_MS = 1000 / 60;
export const SEGMENTS = ['startup', 'opening', 'idle', 'home-nav', 'app', 'resize'];

export function quantile(values, q) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * q, lower = Math.floor(position), upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}
export const median = values => quantile(values, .5);
const sum = values => values.reduce((total, value) => total + value, 0);

export function segmentWindows(raw) {
  const m = raw.marks;
  return {
    startup: [0, raw.ready],
    opening: [raw.ready, raw.introEnd],
    idle: [m['idle:start'], m['idle:end']],
    'home-nav': [m['home-nav:start'], m['home-nav:end']],
    app: [m['app:start'], m['app:end']],
    resize: [m['resize:start'], m['resize:end']],
  };
}

export function summarizeSegment(raw, [from, to], frameMs = FRAME_MS) {
  const inside = at => at >= from && at < to;
  const seconds = (to - from) / 1000;
  const frames = raw.frames.filter(inside);
  const intervals = frames.slice(1).map((ts, index) => ts - frames[index]);
  const dropped = sum(intervals.map(interval => Math.max(0, Math.round(interval / frameMs) - 1)));
  const callbacks = raw.callbacks.filter(entry => inside(entry.at));
  const rendered = callbacks.filter(entry => entry.draws > 0);
  // Console render GPU time: work after the frame's last LCD readback.
  const gpu = raw.gpu.filter(entry => inside(entry.at) && entry.kind !== 'lcd').map(entry => entry.ms);
  const lcdGpu = raw.gpu.filter(entry => inside(entry.at) && entry.kind === 'lcd').map(entry => entry.ms);
  const uploads = raw.uploads.filter(entry => inside(entry.at));
  const loaf = raw.loaf.filter(entry => inside(entry.at));
  const device = (raw.gpuDevice ?? []).filter(entry => inside(entry.at)).map(entry => entry.device);
  const events = raw.events.filter(entry => inside(entry.at) && ['keydown', 'keyup', 'pointerdown', 'pointerup', 'click'].includes(entry.name));
  return {
    durationMs: to - from,
    frameIntervalP50: median(intervals), frameIntervalP95: quantile(intervals, .95), frameIntervalMax: intervals.length ? Math.max(...intervals) : null,
    droppedFramePct: intervals.length ? 100 * dropped / (dropped + intervals.length) : null,
    renderedFps: rendered.length / seconds,
    loopCpuP50: median(callbacks.map(entry => entry.ms)), loopCpuP95: quantile(callbacks.map(entry => entry.ms), .95),
    loopCpuPerSecond: sum(callbacks.map(entry => entry.ms)) / seconds,
    gpuP50: median(gpu), gpuP95: quantile(gpu, .95), gpuPerSecond: sum(gpu) / seconds, lcdGpuPerSecond: sum(lcdGpu) / seconds,
    gpuDevicePct: device.length ? sum(device) / device.length : null,
    drawsPerFrame: median(rendered.map(entry => entry.draws)),
    uploadsPerSecond: uploads.length / seconds, uploadMsPerSecond: sum(uploads.map(entry => entry.ms)) / seconds,
    uploadMBPerSecond: sum(uploads.map(entry => entry.bytes)) / 1048576 / seconds,
    longFrames: loaf.length, longFrameBlockingMs: sum(loaf.map(entry => entry.blocking)),
    inputEventsOver16ms: events.length, inputEventP50Ms: median(events.map(entry => entry.duration)) ?? 0, inputEventMaxMs: events.length ? Math.max(...events.map(entry => entry.duration)) : 0,
  };
}

export function summarizeRun(result) {
  const { raw } = result;
  const windows = segmentWindows(raw);
  // The display's refresh interval (60 or 120 Hz panels): the 10th percentile
  // of all browser frame intervals in the run.
  const all = raw.frames.slice(1).map((ts, index) => ts - raw.frames[index]);
  const vsyncMs = quantile(all, .1) ?? FRAME_MS;
  const segments = Object.fromEntries(SEGMENTS.map(name => [name, summarizeSegment(raw, windows[name], vsyncMs)]));
  return {
    quality: result.quality, vsyncMs,
    startup: { readyMs: raw.ready, firstDrawMs: raw.firstDraw, introEndMs: raw.introEnd, domContentLoadedMs: raw.nav?.domContentLoadedEventEnd ?? null, totalLongFrameBlockingMs: segments.startup.longFrameBlockingMs },
    memory: result.memory,
    idleSystemGpuPct: raw.gpuDeviceIdle?.length ? sum(raw.gpuDeviceIdle.map(entry => entry.device)) / raw.gpuDeviceIdle.length : null,
    segments,
  };
}

function medianTree(values) {
  const first = values.find(value => value !== undefined && value !== null);
  if (typeof first === 'number') { const numbers = values.filter(value => typeof value === 'number'); return numbers.length ? median(numbers) : null; }
  if (first && typeof first === 'object') return Object.fromEntries(Object.keys(first).map(key => [key, medianTree(values.map(value => value?.[key]))]));
  return first ?? null;
}
export const aggregateRuns = summaries => medianTree(summaries);

const METRICS = [
  ['frameIntervalP50', 'Frame interval p50 (ms)'], ['frameIntervalP95', 'Frame interval p95 (ms)'], ['frameIntervalMax', 'Frame interval max (ms)'],
  ['droppedFramePct', 'Dropped frames (%)'], ['renderedFps', 'Scene renders / s'],
  ['loopCpuP50', 'Loop CPU p50 (ms)'], ['loopCpuP95', 'Loop CPU p95 (ms)'], ['loopCpuPerSecond', 'Loop CPU (ms / s)'],
  ['gpuP50', 'Console render GPU p50 (ms)'], ['gpuP95', 'Console render GPU p95 (ms)'], ['gpuPerSecond', 'Console render GPU (ms / s)'], ['lcdGpuPerSecond', 'LCD offscreen GPU span (ms / s)'], ['gpuDevicePct', 'GPU device utilization (%, system)'], ['drawsPerFrame', 'Draw calls / render'],
  ['uploadsPerSecond', 'Texture uploads / s'], ['uploadMsPerSecond', 'Upload CPU (ms / s)'], ['uploadMBPerSecond', 'Upload MB / s'],
  ['longFrames', 'Long animation frames'], ['longFrameBlockingMs', 'Long-frame blocking (ms)'],
  ['inputEventsOver16ms', 'Input events > 16 ms'], ['inputEventP50Ms', 'Input event p50 (ms, of those > 16 ms)'], ['inputEventMaxMs', 'Slowest input event (ms)'],
];
export const metricLabels = METRICS;
const fmt = value => value === null || value === undefined ? 'n/a' : Math.abs(value) >= 100 ? value.toFixed(0) : value.toFixed(2);

export function formatTable(report) {
  let text = `# ${report.label} — ${report.url}\n\n${report.date}; ${report.runs} runs per profile; medians shown.\n`;
  for (const [name, { median: summary }] of Object.entries(report.profiles)) {
    text += `\n## ${name} (quality tier: ${summary.quality}; display interval ${fmt(summary.vsyncMs)} ms)\n\n`;
    text += `Startup: ready ${fmt(summary.startup.readyMs)} ms, first scene draw ${fmt(summary.startup.firstDrawMs)} ms, opening finished ${fmt(summary.startup.introEndMs)} ms. `;
    text += `Memory at end: JS heap ${fmt(summary.memory.jsHeapMB)} MB, renderer footprint ${fmt(summary.memory.renderer)} MB, GPU process footprint ${fmt(summary.memory.gpu)} MB, system GPU memory in use ${fmt(summary.memory.gpuInUseMB)} MB. System GPU utilization with a blank page: ${fmt(summary.idleSystemGpuPct)}%.\n\n`;
    text += `| Metric | ${SEGMENTS.join(' | ')} |\n|---|${SEGMENTS.map(() => '---:').join('|')}|\n`;
    for (const [key, label] of METRICS) text += `| ${label} | ${SEGMENTS.map(segment => fmt(summary.segments[segment][key])).join(' | ')} |\n`;
  }
  return text;
}
