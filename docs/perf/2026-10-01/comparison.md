# Before/after — median of 3 runs each

Before: http://127.0.0.1:3010/ (`e17e222` ≈ main) · After: http://127.0.0.1:3011/ (`ec12bd7`)

2026-10-01T18:16:35Z; headed Chrome for Testing 153; Sidecar iPad display.

## desktop (tier high → high)

| Startup and memory | Before | After | Change |
|---|---:|---:|---:|
| Scene ready (ms) | 2538 | 2569 | +1% |
| Opening finished (ms) | 5345 | 5377 | +1% |
| JS heap at end (MB) | 57.54 | 62.01 | +8% |
| Renderer footprint (MB) | 1244 | 1237 | −1% |
| GPU process footprint (MB) | 1865 | 1948 | +4% |
| System GPU memory in use (MB) | 3594 | 3816 | +6% |
| System GPU utilization, blank page (%) | 27.79 | 27.71 | −0% |

### home-nav

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Frame interval max (ms) | 117 | 17.8 | −85% |
| Dropped frames (%) | 1.89 | 0.00 | −100% |
| Loop CPU (ms / s) | 223 | 207 | −7% |
| LCD offscreen GPU span (ms / s) | 47.54 | 22.61 | −52% |
| Long-frame blocking (ms) | 12.5 | 0 | −100% |
| Input event p50 (ms, of those > 16 ms) | 48 | 48 | 0% |
| Slowest input event (ms) | 160 | 56 | −65% |

### app

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Dropped frames (%) | 12.69 | 4.47 | −65% |
| Long animation frames | 20 | 10 | −50% |
| Long-frame blocking (ms) | 507 | 64.4 | −87% |
| Loop CPU (ms / s) | 276 | 257 | −7% |
| LCD offscreen GPU span (ms / s) | 20.98 | 17.63 | −16% |
| Slowest input event (ms) | 96 | 80 | −17% |

### idle

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Scene renders / s | 19.98 | 19.97 | −0% |
| Loop CPU (ms / s) | 168 | 135 | −20% |
| Long-frame blocking (ms) | 96 | 0 | −100% |
| LCD offscreen GPU span (ms / s) | 8.58 | 7.71 | −10% |

### opening

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Dropped frames (%) | 2.98 | 2.38 | −20% |
| Loop CPU (ms / s) | 249 | 213 | −14% |
| Long-frame blocking (ms) | 61.2 | 37.0 | −40% |

### startup (do not treat dropped% as a regression)

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Frame interval max (ms) | 167 | 1417 | +748% |
| Dropped frames (%) | 20.00 | 65.58 | +228% |
| Long-frame blocking (ms) | 1390 | 1411 | +2% |

After desktop run 1 ready was 8190 ms; runs 2/3 were 2569 / 1835 ms. The
1417 ms max is the same `compileAsync` owner as baseline’s ~1.4–1.6 s spike.

### resize

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Dropped frames (%) | 1.31 | 1.15 | −12% |
| Frame interval max (ms) | 33.4 | 34.3 | +3% |
| Loop CPU (ms / s) | 155 | 147 | −5% |

## ipad (tier high → high)

| Startup and memory | Before | After | Change |
|---|---:|---:|---:|
| Scene ready (ms) | 1932 | 1868 | −3% |
| Opening finished (ms) | 4745 | 4722 | −0% |
| JS heap at end (MB) | 67.17 | 68.88 | +3% |
| Renderer footprint (MB) | 1248 | 1269 | +2% |
| GPU process footprint (MB) | 1800 | 1867 | +4% |

### home-nav

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Frame interval max (ms) | 66.7 | 17.6 | −74% |
| Dropped frames (%) | 1.14 | 0.00 | −100% |
| Slowest input event (ms) | 112 | 56 | −50% |
| Input event p50 (ms, of those > 16 ms) | 48 | 48 | 0% |
| LCD offscreen GPU span (ms / s) | 55.28 | 52.40 | −5% |

### app

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Dropped frames (%) | 8.01 | 1.70 | −79% |
| Long animation frames | 17 | 4 | −76% |
| Long-frame blocking (ms) | 218 | 0 | −100% |
| Loop CPU (ms / s) | 244 | 197 | −19% |

### idle

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Long-frame blocking (ms) | 31.8 | 0 | −100% |
| Loop CPU (ms / s) | 124 | 125 | +1% |

After iPad run 3 opening/idle (98 % drop, ~1 fps) is a Sidecar/Energy-saver
artifact; HOME-nav and app on that run stayed healthy.

Full per-run medians: [baseline](baseline-summary.md), [after](after-summary.md).
Raw traces stay in `~/.codex/3ds-artifact-overflow/perf-2026-10-01/`.
