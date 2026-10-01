# Console lag investigation — 28 September 2026

Branch `dev-lag-fix`, baseline `ec5ac4f` (main). Scope: startup, opening,
HOME navigation, app transitions and resizing. Visual fidelity, native LCD
resolution, input behaviour and animation timing are unchanged.

## Method

`scripts/perf/benchmark.mjs` ([README](../scripts/perf/README.md)) drives both
production builds (`next build` + `next start`) in headed Chrome for Testing
153 (ANGLE Metal, Apple M5, macOS) on the same machine. Baseline and candidate
alternate run by run; three valid runs per profile; medians are reported.

- **Desktop:** 1440×900 at DPR 2 (quality tier `high`).
- **Mobile:** 390×844 at DPR 3, touch emulation, 4× CPU throttle, 4-core /
  4 GB navigator (tier `constrained`).

Every run follows the same timeline: load, opening, 3 s idle HOME, 11 cursor
moves, open About → HOME → resume → HOME, then 8 viewport resizes. Full
tables: [comparison](perf/2026-09-28/comparison.md), per-run summaries:
[before](perf/2026-09-28/baseline-summary.json) and
[after](perf/2026-09-28/after-summary.json). Raw traces and screenshots are
under `CodexArtifacts/3ds-portfolio/perf-2026-09-28/`.

Headless Chromium was rejected: it intermittently scheduled this page at one
frame per second until the first input (5 of 6 baseline runs). The same build
ran at 60 fps in a headed window in every run, so it is a headless artifact,
not a user-visible defect.

## Bottlenecks found (baseline)

| Where | Finding | Evidence |
| --- | --- | --- |
| Idle HOME, resize, transitions | The console was fully re-rendered at scene cadence (60 fps desktop, 30 constrained) although only the LCD textures change, at 24/12 fps. Each render included a 640k-triangle shadow pass. | 60 renders/s, 155 draws/render; system GPU 57–61 % at idle vs 24 % for a blank page |
| LCD paint | The HOME background and banners render in WebGL and are read back with synchronous `readPixels` for exact native bytes; each readback waits on queued GPU work. | ~46 % of idle loop CPU in `readPixels` (unmangled CPU profile) |
| Opening | LCD display materials were hidden during `compileAsync`, so their programs compiled mid-opening. | 58 ms desktop / 383 ms mobile worst frame |
| App launch | The native logo layout re-rasterizes up to six full-screen textured panes in JS each frame (animated alpha misses the raster cache). | 50–85 ms frames desktop, 110–300 ms mobile; `rasterNativePicture` ≈ 45 % of segment CPU |
| Startup | 25 GLB textures (eleven 4096², RGBA8 ≈ 1 GB GPU memory) upload synchronously inside `compileAsync`. | one ~1 s task; 979 ms of uploads |

## Changes

1. **Render on demand** (`render-schedule.ts`): a frame is rendered only when
   the sampled pose changed (> 1e-6) or an LCD texture, material or drawing
   buffer invalidated it. Scene cadence stays an upper bound.
2. **Shadow map caching:** `shadowMap.autoUpdate=false`; recomputed only on
   geometry motion.
3. **Resize:** one drawing-buffer allocation (`setDrawingBufferSize`) instead of
   two, and an immediate render so a cleared buffer is never composited.
4. **Opening:** LCD display materials are compiled before the clock starts.
5. **Startup:** firmware presentation assets and HOME banner models load in
   parallel with the GLB.
6. The power-LED meshes are cached instead of traversing the model on every paint.

Tried and rejected, with measurements:

- **Deferring input-driven LCD paints to the next frame:** handler time fell
  from 7 to 0.2 ms, but total work was unchanged and median time-to-paint rose
  from 24 to 32 ms. Reverted, so input timing is identical to baseline.
- **Micro-optimizing the raster kernel:** 190 vs 150 ns/px, slower. Reverted.

## Results (median of 3)

| Metric | Desktop before | after | change | Mobile before | after | change |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Scene ready (ms) | 1754 | 1693 | −3 % | 2997 | 2769 | −8 % |
| Opening worst frame (ms) | 58.4 | 49.9 | −15 % | 383 | 25.1 | −93 % |
| Opening dropped frames (%) | 3.53 | 1.19 | −66 % | 17.9 | 4.68 | −74 % |
| Opening long-frame blocking (ms) | 11.4 | 0.5 | −96 % | 0 | 0 | 0 |
| Idle console renders / s | 60.0 | 20.0 | −67 % | 30.3 | 10.7 | −65 % |
| Idle system GPU utilization (%) | 59.6 | 40.9 | −31 % | 32.2 | 24.1 | −25 % |
| Draw calls / render (idle) | 155 | 81 | −48 % | 155 | 81 | −48 % |
| App-segment system GPU (%) | 54.3 | 44.1 | −19 % | 30.8 | 26.7 | −13 % |
| Resize system GPU (%) | 55.2 | 43.8 | −21 % | 33.7 | 27.4 | −18 % |
| Resize dropped frames (%) | 1.28 | 0.64 | −50 % | 2.53 | 1.94 | −24 % |
| HOME-nav worst frame (ms) | 25.2 | 25.0 | −1 % | 90.1 | 34.3 | −62 % |
| HOME-nav long-frame blocking (ms) | 0 | 0 | 0 | 90.4 | 0 | −100 % |
| Idle loop CPU (ms/s) | 133 | 128 | −4 % | 189 | 179 | −5 % |

System GPU utilization is machine-wide. A blank page read 20–26 % during
these runs.

### Regressions and unmeasured items

- **Mobile startup (before the scene is ready):** dropped frames rose from 56 to
  62 % and p95 frame interval from 100 to 128 ms. Firmware decoding now
  overlaps the GLB load on the throttled main thread. Nothing is drawn yet in
  that window, and ready time improved 8 %.
- **Mobile HOME-nav input p50:** 24 → 32 ms in 2 of 3 runs, one 8 ms Event
  Timing bucket. The input path is unchanged. Desktop is unchanged (24 ms).
- **Unchanged:** app-launch blocking (desktop 223 → 233 ms, mobile
  1109 → 1134 ms, within noise) and startup blocking (~930 ms desktop,
  ~1470 ms mobile).
- **Not independently measured:** GPU busy time. WebGL timer queries measure
  GPU-timeline spans that include waits on the LCD canvases; system GPU
  utilization is used instead.
- **Not measured:** process memory before and after teardown. Memory at the
  end of the run is unchanged (±3 %).

## Fidelity checks

With reduced motion and an identical clock, full-resolution screenshots of both
builds are byte-identical: 0 differing pixels at 2880×1800 for HOME and About
selected, and at 1170×2532 for mobile HOME. On the candidate build:

- A held X cap moves and returns to rest (the remaining lower-LCD change is
  the grid density X selects).
- Dragging rotates the console, and Space closes the lid then reopens it to a
  pixel-identical frame.
- A resized viewport renders immediately.

`npm test` (1542 tests, 0 failures after installing the locked
`fake-indexeddb` devDependency that was missing locally), `npm run typecheck`,
`npm run build` and `npm run check:shader` pass. No native Azahar comparison
was run: these changes don't alter LCD content (shown byte-identical above),
and the native loop is coordinator-operated.

## Remaining limitations

- The launch logo raster (JS, per-frame alpha) remains the worst app-transition
  cost, especially on slow CPUs. Exact alternatives (worker raster with
  latency, alpha-factored caching) change timing or need exactness proofs.
- The HOME background readback remains synchronous (~2.5 ms/paint) to keep
  native bytes exact.
- Startup texture upload (~1 s) is unchanged; reducing it would need
  compressed or smaller textures, which changes fidelity.
