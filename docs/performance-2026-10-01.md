# Console lag investigation — 1 October 2026

Branch `cursor/lag-fidelity-20261001` (fast-forward of `claude/lag-fidelity`),
baseline `2d7b98d` (main, PRs #1–#3). Scope: remaining input, app-launch and
idle stalls after render-on-demand. Visual fidelity, native LCD resolution,
input behaviour and animation timing are unchanged. Cadence `readPixels` still
runs for native LCD bytes.

## Method

`scripts/perf/benchmark.mjs` drove both production builds (`next build` +
`next start`) in headed Chrome for Testing 153 (ANGLE Metal, Apple silicon,
macOS) on the same machine. Baseline (`127.0.0.1:3010`, size-lossless
`e17e222` ≈ main) and candidate (`127.0.0.1:3011`, `ec12bd7`) alternated run
by run; three valid runs per profile; medians are reported.

- **Desktop:** 1440×900 at DPR 2 (quality tier `high`).
- **iPad:** 1180×820 at DPR 2 (`ipad` profile, no CPU throttle).
- Window placed on the Sidecar iPad display via `CHROMIUM_WINDOW`.

Every run follows the same timeline: load, opening, 3 s idle HOME, 11 cursor
moves, open About → HOME → resume → HOME, then 8 viewport resizes. Full
tables: [comparison](perf/2026-10-01/comparison.md), per-run summaries:
[before](perf/2026-10-01/baseline-summary.md) and
[after](perf/2026-10-01/after-summary.md). Raw traces and screenshots are
under `~/.codex/3ds-artifact-overflow/perf-2026-10-01/`.

## Bottlenecks found (baseline after PR #2)

| Where | Finding | Evidence |
| --- | --- | --- |
| HOME navigation | State-driven LCD paints still did a synchronous GPU `readPixels` in the key/pointer handler to composite the HOME background | Desktop HOME-nav max interval 117 ms; slowest input 160 ms |
| App launch | Full-screen native logo panes re-ran the generic TEV loop in JS | Desktop app long-frame blocking 507 ms; 20 long frames; 12.69 % dropped |
| First key after opening | `AudioContext` construction ran inside the first gesture `unlock()` | First-input hitch on an otherwise idle console |
| Idle HOME | Occasional long animation frames while the background was still being sampled | Desktop idle long-frame blocking 96 ms |

## Changes (`ec12bd7`)

1. **HOME background replay:** state-driven paints (keys, pointer, saves,
   minute) replay the background sampled by the latest cadence paint through
   the same `putImageData`/`drawImage` path. They no longer reset the cadence
   clock, so the background is still sampled on the LCD cadence.
2. **Compiled TEV raster:** panes ≥ 65536 px (launch logos) run a
   structure-specialised loop. `tests/native-raster-compiled.test.mjs` checks
   every such pane against the generic loop.
3. **Audio prepare:** `AudioContext` is constructed while idle after the
   opening and adopted by the first gesture `unlock()`.

Tried and rejected: lowering LCD resolution, skipping cadence `readPixels`,
or reducing model/texture detail. Those would trade the fidelity the page is
required to keep.

## Results (median of 3)

| Metric | Desktop before | after | change | iPad before | after | change |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Scene ready (ms) | 2538 | 2569 | +1 % | 1932 | 1868 | −3 % |
| HOME-nav dropped frames (%) | 1.89 | 0.00 | −100 % | 1.14 | 0.00 | −100 % |
| HOME-nav max interval (ms) | 117 | 17.8 | −85 % | 66.7 | 17.6 | −74 % |
| HOME-nav slowest input (ms) | 160 | 56 | −65 % | 112 | 56 | −50 % |
| HOME-nav LCD GPU span (ms / s) | 47.5 | 22.6 | −52 % | 55.3 | 52.4 | −5 % |
| App dropped frames (%) | 12.69 | 4.47 | −65 % | 8.01 | 1.70 | −79 % |
| App long frames | 20 | 10 | −50 % | 17 | 4 | −76 % |
| App long-frame blocking (ms) | 507 | 64 | −87 % | 218 | 0 | −100 % |
| Idle long-frame blocking (ms) | 96 | 0 | −100 % | 31.8 | 0 | −100 % |
| Idle loop CPU (ms / s) | 168 | 135 | −20 % | 124 | 125 | +1 % |
| Opening loop CPU (ms / s) | 249 | 213 | −14 % | 186 | 192 | +3 % |
| JS heap at end (MB) | 57.5 | 62.0 | +8 % | 67.2 | 68.9 | +3 % |
| GPU process footprint (MB) | 1865 | 1948 | +4 % | 1800 | 1867 | +4 % |

Same visual end state on both builds: About selected, Close/Resume. Headed
screenshots match. Event Timing input p50 of events already over 16 ms stayed
48 ms: HOME chrome and the icon grid still paint on each cursor move.

### Regressions and unmeasured items

- **Startup dropped-frame median** (desktop 20 → 66 %, iPad 19 → 67 %) is not
  a new user-visible stall. Both builds still spend ~1.1–1.4 s inside
  `compileAsync` / GLB upload (`TimerHandler` `setTimeout` in the Next chunk).
  After desktop run 1 was a cold outlier (ready 8190 ms, 2.0 s frame); runs 2
  and 3 were 2569 / 1835 ms. Do not treat the startup dropped% median as a
  regression versus that compile spike.
- **After iPad run 3** recorded a 98 % opening drop and ~1 fps idle. HOME-nav
  and app on that run stayed healthy. The Sidecar Chrome window later showed
  Energy saver on and a “High memory usage — 1.1 GB” tab title; treat that
  idle sample as a measurement artifact.
- **Memory** is slightly higher (JS heap +3–8 %, GPU process +4 %). Renderer
  footprint is unchanged (~1.24 GB). The tab still trips Chrome’s high-memory
  warning.
- **Unchanged on purpose:** cadence `readPixels` for native LCD bytes; 400×240
  / 320×240 LCD targets; lossless packed model; input path.

## Browser inspection (not native-compared)

- Sidecar Chrome 153 at `127.0.0.1:3011`: startup, opening, idle HOME (Work
  selected, quality `high`), and a 1000×700 resize. Model, cream backdrop and
  both LCDs stayed correct. AX announced `HOME Menu. Work.` Keyboard D-pad
  events sent to the window without canvas focus did not move the cursor.
- t3 preview (1280×800): ArrowRight Work → Hobbies (`selected=2`); Enter
  started launch (`Opening software`); HOME returned `Software suspended`.
  Open About then selected tile 6 and offered `Close software?` over the
  suspended Hobbies session.   Enter confirmed `menu=launch` `app=about` `Opening software`. HOME then
  returned `HOME Menu. About. Software suspended.`
- iPad Simulator Safari (UsageDisplay Air, iOS 27, portrait): the production
  page loaded the 3DS XL with Work selected and live HUD (19:58).

## Native comparison

**No new pair this session.** `/Volumes/Codex3DSIsolated` was remounted
read-only from `Codex3DS-Isolated.sparsebundle` at 20:04. The idle-HOME copy
SHA-256 is `3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`.
The volume has 19 GiB free; Sandisk1 now has 118 GiB free. A read-write remount
is required before that copy can write a 400×480 PNG. `/Applications/Azahar.app`
was not launched. Tests and browser inspection do not close any scenario.

## Remaining lag (do not trade fidelity)

1. Startup `compileAsync` / 4096² texture upload (~1.4 s).
2. HOME input Event Timing p50 still ~48 ms (chrome + grid paint).
3. Renderer / tab memory ~1.2 GB.
4. Cadence `readPixels` still required for exact native LCD bytes.
