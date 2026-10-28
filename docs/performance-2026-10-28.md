# Load, idle and interface pass — 28 October 2026

Branch `perf/site-architecture`, baseline `51d29ed` (main after PR #17).
Scope: time to a ready console on a constrained link, main-thread cost at idle
HOME, and the interfaces between the scene, the LCD painter and the banner
renderer. LCD pixels, native timing and input behaviour are unchanged; no
model, texture or LCD resolution is reduced.

## Method

Both production builds (`next build` + `next start`) ran side by side from
separate worktrees and alternated run by run, three pairs per measurement,
in headless Chrome for Testing 153 (ANGLE Metal, Apple M5) at 1440×900, DPR 2,
muted, HTTP cache disabled. Headless rAF held ~60 Hz throughout; the
`scripts/perf` caveat about 1 fps headless scheduling did not occur. The link
throttle is the `9:60` "fast 4G" convention from `scripts/perf/network.mjs`.
Time to ready is the app's own `dataset.ready`. The probes (load timeline, CPU
profile with source maps, WebGL call counts, LCD hashes) live outside the repo
in `~/worktrees/perf-tools/`.

Equivalence checks, run on every slice against the baseline build:

- **Static LCDs:** reduced motion, `?lcdCapture=1`, `captureScreensAt(1000,
  2026-10-28T12:00Z)`, both LCDs hashed for HOME, each of the five toolbar
  banners with its label, and four grid selections. The upper HUD clock and
  battery corner (x ≥ 300, y ≤ 20) follows wall-clock time and is masked.
  All ten pairs identical.
- **Flows:** `scripts/verify-animation-flow.mjs` for Notes and Friends (two
  cycles), Browser, Miiverse, Manual (Settings and Browser), folder, and pause
  (Health, Camera, portfolio): all pass on both builds. The Notifications
  scenario fails identically on both: it still expects the label
  "Notifications".
- **Footer close:** Notes, Notifications, Web, Friends and Manual each take
  the same close presentation and return to HOME in the same time (±100 ms).

## Findings

| Where | Finding |
| --- | --- |
| Load | The GLB (7.2 MB of 14.5 MB) was requested only after the main JS, hydration and the 1.3 MB scene chunk |
| Load | Entry photos (1.1 MB) started with the banner atlases HOME's first frame waits on |
| Load | The first render uploaded all model textures in one ~1 s task, after every LCD asset had arrived |
| Idle HOME | 20 synchronous background `readPixels` a second at ~6.5 ms: ~13 % of the main thread |
| Idle HOME | One synchronous `getParameter(STENCIL_CLEAR_VALUE)` per banner render |
| Interfaces | Toolbar slot order re-encoded in four ternary ladders; five copies of one banner loader; 26 per-transition publication calls in the scene |

The model's textures are 211 megapixels (eleven 4096² images, ~1.1 GB of GPU
memory with mipmaps). None is uniform or duplicated, so no lossless reduction
exists; see proposed improvement 8.

## Changes

1. **GLB preload** (`75810a6`): the console model is preloaded from the HTML
   head with the same mode and credentials as `GLTFLoader`; one request, no
   unused-preload warning.
2. **Entry photos after first-frame assets** (`7cb9ea5`).
3. **Overlapped texture upload** (`1258864`): model textures upload one per
   task as soon as the model loads and are awaited before the first frame.
   Preloading the banner atlases as well was measured and dropped: it took
   bandwidth from the GLB and finished later.
4. **HOME background render-ahead** (`949b40a`): see
   [performance and resilience](architecture/performance-and-resilience.md).
   A WebGL read waits for everything queued before it, so three.js's
   `readRenderTargetPixelsAsync` only moved the stall into `getBufferSubData`
   (~7 ms); copying at the start of the next background paint costs ~0.6 ms.
   Across 86 loop frames every buffered frame is byte-identical to the
   synchronous render of that frame.
5. **Interfaces** (`0601104`, `9e9a0a1`): one toolbar table and one banner
   draw path; `screens` owns the publication protocol
   (`presentPublications`, `revokePublications`, `revokeEntryPublications`,
   `publicationActive`, `cancelFooterClose`). `revokeNotesFooterCloseCandidate`
   always revoked every footer close; it is now `revokeFooterCloseCandidates`.

## Results (three interleaved pairs)

| Metric | Before | After |
| --- | ---: | ---: |
| Time to ready, 9 Mbps / 60 ms | 13.37 s | 11.56 s |
| Time to ready, localhost | 1.75 s | 1.82 s (within noise) |
| GLB request start after navigation, 9 Mbps | ~830 ms | ~65 ms |
| Longest boot task | ~1.0 s | ~0.17 s |
| Idle HOME main thread busy | 18.3 % | ~11.9 % |
| Idle HOME synchronous readbacks | 20 / s | 0 / s |
| `createScreens` options / distinct `screens` members the scene uses | 26 / 57 | 18 / 32 |

## Remaining

A selected native banner (Settings, default, toolbar applets, stock titles)
still reads back synchronously on each paint; the same render-ahead applies
once its frame inputs are made a key. Firmware and portfolio assets revalidate
on every visit (`max-age=0`); the GPU texture budget is unchanged. Both are
listed in [proposed improvements](architecture/proposed-improvements.md).
