// Injected before any page script (Page.addScriptToEvaluateOnNewDocument).
// Records browser frame cadence, application rAF CPU time, WebGL GPU time,
// texture uploads, draw calls, long animation frames and input event timing.
// It observes the unmodified page; it does not change what the page draws.
(() => {
  const perf = window.__perf = {
    frames: [], callbacks: [], gpu: [], uploads: [], loaf: [], events: [], marks: {},
    ready: null, introEnd: null, firstDraw: null,
    mark(name) { this.marks[name] = performance.now(); return this.marks[name]; },
  };
  const overrides = window.__perfOverrides || {};
  if (overrides.hardwareConcurrency) Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', { get: () => overrides.hardwareConcurrency });
  if (overrides.deviceMemory) Object.defineProperty(Navigator.prototype, 'deviceMemory', { get: () => overrides.deviceMemory });

  // Browser frame cadence, independent of the application's own loop.
  const nativeRaf = window.requestAnimationFrame.bind(window);
  const observe = ts => { perf.frames.push(ts); nativeRaf(observe); };
  nativeRaf(observe);

  // WebGL: capture contexts, count draws, time uploads.
  let gl = null, timer = null, draws = 0, uploadMs = 0, uploads = 0, uploadBytes = 0;
  const pendingQueries = [];
  let activeQuery = null, callbackStarted = 0, drawsBeforeReadback = 0;
  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    const context = getContext.call(this, type, ...rest);
    if (context && type === 'webgl2' && !gl) { gl = context; timer = gl.getExtension('EXT_disjoint_timer_query_webgl2'); }
    return context;
  };
  const proto = WebGL2RenderingContext.prototype;
  for (const name of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced', 'drawRangeElements']) {
    const original = proto[name];
    proto[name] = function (...args) { draws++; return original.apply(this, args); };
  }
  const sourceBytes = source => source && typeof source === 'object' && 'width' in source ? (source.width * source.height * 4) : 0;
  for (const name of ['texImage2D', 'texSubImage2D', 'texImage3D', 'texSubImage3D', 'compressedTexImage2D', 'compressedTexSubImage2D']) {
    const original = proto[name];
    proto[name] = function (...args) {
      const started = performance.now();
      try { return original.apply(this, args); } finally {
        const elapsed = performance.now() - started;
        let bytes = 0;
        const last = args[args.length - 1];
        if (name === 'texImage2D' && args.length === 6) bytes = sourceBytes(last);
        else if (name === 'texSubImage2D' && args.length === 7) bytes = sourceBytes(last);
        else if (name === 'texImage2D') bytes = args[3] * args[4] * 4;
        else if (name === 'texSubImage2D') bytes = args[4] * args[5] * 4;
        else if (ArrayBuffer.isView(last)) bytes = last.byteLength;
        uploadMs += elapsed; uploads++; uploadBytes += bytes;
        perf.uploads.push({ at: started, ms: elapsed, bytes, name, w: last?.width ?? args[3], h: last?.height ?? args[4] });
      }
    };
  }

  function pollQueries() {
    while (pendingQueries.length) {
      const { query, at, kind } = pendingQueries[0];
      if (!gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE)) break;
      const disjoint = gl.getParameter(timer.GPU_DISJOINT_EXT);
      const ns = gl.getQueryParameter(query, gl.QUERY_RESULT);
      gl.deleteQuery(query); pendingQueries.shift();
      if (!disjoint) perf.gpu.push({ at, ms: ns / 1e6, kind });
    }
  }
  // A synchronous readback ends the LCD offscreen span. The work after the last
  // readback in a callback is the console render (shadow pass, main pass and
  // LCD texture uploads), timed separately so readback stalls do not inflate it.
  const readPixels = proto.readPixels;
  proto.readPixels = function (...args) {
    const result = readPixels.apply(this, args);
    if (activeQuery && this === gl) {
      gl.endQuery(timer.TIME_ELAPSED_EXT); pendingQueries.push({ query: activeQuery, at: callbackStarted, kind: 'lcd' });
      activeQuery = gl.createQuery(); gl.beginQuery(timer.TIME_ELAPSED_EXT, activeQuery);
      drawsBeforeReadback += draws; draws = 0;
    }
    return result;
  };

  // Application rAF callbacks: CPU time, draws and uploads per callback, GPU time
  // for the WebGL commands the callback issued.
  window.requestAnimationFrame = callback => nativeRaf(ts => {
    const started = performance.now();
    draws = 0; uploadMs = 0; uploads = 0; uploadBytes = 0;
    let totalDraws = 0;
    callbackStarted = started;
    if (gl && timer && !gl.isContextLost()) { pollQueries(); activeQuery = gl.createQuery(); gl.beginQuery(timer.TIME_ELAPSED_EXT, activeQuery); }
    try { callback(ts); } finally {
      if (activeQuery) { gl.endQuery(timer.TIME_ELAPSED_EXT); if (draws > 0) pendingQueries.push({ query: activeQuery, at: started, kind: 'console' }); else gl.deleteQuery(activeQuery); activeQuery = null; }
      totalDraws = draws + drawsBeforeReadback; drawsBeforeReadback = 0;
      const ms = performance.now() - started;
      perf.callbacks.push({ at: started, ts, ms, draws, totalDraws, uploads, uploadMs, uploadBytes });
      if (draws > 0 && perf.firstDraw === null) perf.firstDraw = started;
    }
  });

  try {
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) perf.loaf.push({
        at: entry.startTime, duration: entry.duration, blocking: entry.blockingDuration,
        scripts: entry.scripts.map(script => ({ fn: script.sourceFunctionName, url: script.sourceURL, invoker: script.invoker, duration: script.duration })),
      });
    }).observe({ type: 'long-animation-frame', buffered: true });
  } catch {}
  try {
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) perf.events.push({
        at: entry.startTime, name: entry.name, duration: entry.duration,
        delay: entry.processingStart - entry.startTime, processing: entry.processingEnd - entry.processingStart,
      });
    }).observe({ type: 'event', durationThreshold: 16, buffered: true });
  } catch {}

  // The benchmark drives only keyboard and viewport changes. Any pointer or
  // wheel input came from outside the script and invalidates the run.
  perf.foreignInput = 0;
  for (const type of ['pointerdown', 'wheel', 'touchstart']) window.addEventListener(type, event => { if (event.isTrusted) perf.foreignInput++; }, { capture: true, passive: true });

  // Scene lifecycle markers from the host's existing data attributes.
  new MutationObserver(() => {
    const host = document.querySelector('.console-stage');
    if (!host) return;
    if (perf.ready === null && host.dataset.ready === 'true') perf.ready = performance.now();
    if (perf.ready !== null && perf.introEnd === null && host.dataset.intro === 'false') perf.introEnd = performance.now();
  }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-ready', 'data-intro'] });
})();
