# Console performance benchmark

Zero-dependency Chrome DevTools Protocol harness for the production build.

```sh
npm run build && npm run start:verify            # or any two servers
node scripts/perf/benchmark.mjs \
  --targets baseline=http://127.0.0.1:3101/,after=http://127.0.0.1:3103/ \
  --out /tmp/3ds-perf/run --runs 3 --profiles desktop,mobile
node scripts/perf/compare.mjs /tmp/3ds-perf/run/baseline/summary.json \
  /tmp/3ds-perf/run/after/summary.json > comparison.md
```

`--chromium PATH` (or `CHROMIUM`) selects the browser; the default is the local
Playwright Chrome for Testing build. `--cpu-profile [segment]` saves a V8 CPU
profile (use a `next build --no-mangling` build for readable names).

## Method

- **Headed Chromium, one fresh profile per run.** Headless Chromium
  intermittently schedules this page at one frame per second until the first
  input, which a real display never does, so headless numbers are invalid.
  Each run starts with cold HTTP and shader caches.
- **Interleaved targets.** Baseline and candidate alternate run by run, so drift
  in background GPU/CPU load affects both equally.
- **Profiles.** `desktop`: 1440×900 CSS px at DPR 2. `mobile`: 390×844 at DPR 3,
  touch emulation, 4× CPU throttling, and a 4-core / 4 GB navigator so the
  scene's own policy selects the constrained tier. GPU is not throttled.
- **Scripted timeline** (identical for every run): load → opening intro →
  3 s idle HOME → 11 HOME cursor moves (230 ms apart) ending on About → open
  About, HOME, resume, HOME → 8 viewport resizes (250 ms apart).
- **Validation.** A run is discarded and repeated if the opening was
  interrupted, any unscripted pointer/wheel input arrived, the navigation did
  not reach About, or an input acknowledgement timed out.

## Metrics (`instrument.js`, injected before page scripts)

| Metric | Source |
| --- | --- |
| Frame interval, dropped frames | Separate rAF observer; drops counted against the run's display interval (10th-percentile frame interval) |
| Scene renders / s, draw calls | rAF callbacks that issued WebGL draws |
| Loop CPU | Duration of the application's rAF callbacks |
| Console render GPU | `EXT_disjoint_timer_query_webgl2` from the frame's last LCD readback to the end of the callback. This is a GPU-timeline span; it includes waits on the 2D canvases uploaded as LCD textures, so treat it as an upper bound |
| GPU device utilization | macOS `ioreg` IOAccelerator `Device Utilization %`, sampled every 100 ms. System-wide; the blank-page value is reported for context |
| Texture uploads | Wrapped `texImage2D`/`texSubImage2D` calls: count, CPU time, bytes |
| Long animation frames | `long-animation-frame` entries: count, blocking duration |
| Input events | Event Timing entries ≥ 16 ms for key/pointer events (Chrome's minimum threshold), in 8 ms buckets |
| Memory | `performance.memory` JS heap; `footprint` of the renderer and GPU processes; system GPU memory in use |

Medians of each metric across runs are reported per segment: `startup`
(navigation → scene ready), `opening`, `idle`, `home-nav`, `app`, `resize`.

## Download size

`network.mjs` records every response of one scripted visit (load, opening,
About and Settings) by phase and type. Options: `--profile desktop|mobile`,
`--warm` (a returning visitor with a filled HTTP cache), and
`--throttle DOWN_MBPS:LATENCY_MS` (also reports time to a ready scene).
