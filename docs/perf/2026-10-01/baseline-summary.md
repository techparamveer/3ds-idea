# baseline — http://127.0.0.1:3010/

2026-10-01T18:16:35.557Z; 3 runs per profile; medians shown.

## desktop (quality tier: high; display interval 16.20 ms)

Startup: ready 2538 ms, first scene draw 2539 ms, opening finished 5345 ms. Memory at end: JS heap 57.54 MB, renderer footprint 1244 MB, GPU process footprint 1865 MB, system GPU memory in use 3594 MB. System GPU utilization with a blank page: 27.79%.

| Metric | startup | opening | idle | home-nav | app | resize |
|---|---:|---:|---:|---:|---:|---:|
| Frame interval p50 (ms) | 16.70 | 16.70 | 16.70 | 16.70 | 16.70 | 16.70 |
| Frame interval p95 (ms) | 17.60 | 17.49 | 17.40 | 17.30 | 17.60 | 17.40 |
| Frame interval max (ms) | 167 | 100 | 17.70 | 117 | 100 | 33.40 |
| Dropped frames (%) | 20.00 | 2.98 | 0.00 | 1.89 | 12.69 | 1.31 |
| Scene renders / s | 0.00 | 58.79 | 19.98 | 54.72 | 23.79 | 19.94 |
| Loop CPU p50 (ms) | n/a | 0.90 | 0.30 | 1.00 | 0.30 | 0.30 |
| Loop CPU p95 (ms) | n/a | 15.00 | 8.61 | 14.10 | 14.30 | 7.98 |
| Loop CPU (ms / s) | 0.00 | 249 | 168 | 223 | 276 | 155 |
| Console render GPU p50 (ms) | n/a | 4.49 | 17.51 | 4.96 | 13.10 | 14.70 |
| Console render GPU p95 (ms) | n/a | 13.86 | 21.58 | 14.92 | 23.56 | 22.31 |
| Console render GPU (ms / s) | 0.00 | 349 | 352 | 410 | 324 | 292 |
| LCD offscreen GPU span (ms / s) | 0.00 | 44.51 | 8.58 | 47.54 | 20.98 | 17.48 |
| GPU device utilization (%, system) | 23.07 | 58.78 | 39.60 | 56.08 | 41.19 | 38.00 |
| Draw calls / render | n/a | 155 | 81.00 | 155 | 81.00 | 81.00 |
| Texture uploads / s | 23.64 | 24.23 | 39.97 | 44.39 | 38.14 | 39.89 |
| Upload CPU (ms / s) | 540 | 27.31 | 3.46 | 3.88 | 2.57 | 3.87 |
| Upload MB / s | 322 | 35.21 | 20.49 | 21.55 | 19.55 | 20.45 |
| Long animation frames | 3.00 | 1.00 | 1.00 | 1.00 | 20.00 | 1.00 |
| Long-frame blocking (ms) | 1390 | 61.20 | 96.00 | 12.50 | 507 | 0.00 |
| Input events > 16 ms | 0.00 | 0.00 | 0.00 | 22.00 | 8.00 | 0.00 |
| Input event p50 (ms, of those > 16 ms) | 0.00 | 0.00 | 0.00 | 48.00 | 44.00 | 0.00 |
| Slowest input event (ms) | 0.00 | 0.00 | 0.00 | 160 | 96.00 | 0.00 |

## ipad (quality tier: high; display interval 16.20 ms)

Startup: ready 1932 ms, first scene draw 1932 ms, opening finished 4745 ms. Memory at end: JS heap 67.17 MB, renderer footprint 1248 MB, GPU process footprint 1800 MB, system GPU memory in use 3109 MB. System GPU utilization with a blank page: 20.43%.

| Metric | startup | opening | idle | home-nav | app | resize |
|---|---:|---:|---:|---:|---:|---:|
| Frame interval p50 (ms) | 16.70 | 16.70 | 16.70 | 16.70 | 16.70 | 16.70 |
| Frame interval p95 (ms) | 22.46 | 17.48 | 17.20 | 17.40 | 17.60 | 17.45 |
| Frame interval max (ms) | 133 | 66.60 | 17.70 | 66.70 | 84.00 | 17.70 |
| Dropped frames (%) | 19.15 | 1.79 | 0.00 | 1.14 | 8.01 | 0.00 |
| Scene renders / s | 0.00 | 59.01 | 19.99 | 55.54 | 25.72 | 20.19 |
| Loop CPU p50 (ms) | n/a | 0.60 | 0.20 | 0.70 | 0.20 | 0.20 |
| Loop CPU p95 (ms) | n/a | 11.83 | 6.70 | 11.50 | 27.50 | 6.20 |
| Loop CPU (ms / s) | 0.00 | 186 | 124 | 193 | 244 | 116 |
| Console render GPU p50 (ms) | n/a | 4.80 | 16.95 | 5.04 | 14.79 | 17.20 |
| Console render GPU p95 (ms) | n/a | 14.12 | 20.67 | 15.06 | 21.05 | 22.82 |
| Console render GPU (ms / s) | 0.00 | 371 | 332 | 424 | 342 | 348 |
| LCD offscreen GPU span (ms / s) | 0.00 | 51.55 | 6.58 | 55.28 | 17.11 | 9.16 |
| GPU device utilization (%, system) | 18.50 | 58.54 | 35.76 | 57.16 | 39.53 | 37.92 |
| Draw calls / render | n/a | 155 | 81.00 | 155 | 81.00 | 81.00 |
| Texture uploads / s | 31.06 | 24.17 | 39.98 | 44.84 | 39.39 | 40.37 |
| Upload CPU (ms / s) | 573 | 18.52 | 2.53 | 3.03 | 1.95 | 2.97 |
| Upload MB / s | 423 | 35.13 | 20.50 | 21.54 | 20.19 | 20.70 |
| Long animation frames | 3.00 | 1.00 | 1.00 | 0.00 | 17.00 | 0.00 |
| Long-frame blocking (ms) | 1116 | 25.30 | 31.80 | 0.00 | 218 | 0.00 |
| Input events > 16 ms | 0.00 | 0.00 | 0.00 | 22.00 | 8.00 | 0.00 |
| Input event p50 (ms, of those > 16 ms) | 0.00 | 0.00 | 0.00 | 48.00 | 40.00 | 0.00 |
| Slowest input event (ms) | 0.00 | 0.00 | 0.00 | 112 | 72.00 | 0.00 |
