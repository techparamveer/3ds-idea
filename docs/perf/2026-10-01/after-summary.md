# after — http://127.0.0.1:3011/

2026-10-01T18:16:35.568Z; 3 runs per profile; medians shown.

## desktop (quality tier: high; display interval 16.20 ms)

Startup: ready 2569 ms, first scene draw 2569 ms, opening finished 5377 ms. Memory at end: JS heap 62.01 MB, renderer footprint 1237 MB, GPU process footprint 1948 MB, system GPU memory in use 3816 MB. System GPU utilization with a blank page: 27.71%.

| Metric | startup | opening | idle | home-nav | app | resize |
|---|---:|---:|---:|---:|---:|---:|
| Frame interval p50 (ms) | 16.70 | 16.70 | 16.70 | 16.70 | 16.70 | 16.70 |
| Frame interval p95 (ms) | 50.10 | 17.50 | 17.40 | 17.40 | 17.60 | 17.30 |
| Frame interval max (ms) | 1417 | 83.30 | 17.70 | 17.80 | 83.40 | 34.30 |
| Dropped frames (%) | 65.58 | 2.38 | 0.00 | 0.00 | 4.47 | 1.15 |
| Scene renders / s | 0.00 | 58.76 | 19.97 | 55.50 | 25.69 | 20.20 |
| Loop CPU p50 (ms) | n/a | 0.70 | 0.20 | 1.10 | 0.35 | 0.30 |
| Loop CPU p95 (ms) | n/a | 13.01 | 7.30 | 12.52 | 18.36 | 7.99 |
| Loop CPU (ms / s) | 0.00 | 213 | 135 | 207 | 257 | 147 |
| Console render GPU p50 (ms) | n/a | 4.56 | 16.62 | 5.23 | 13.39 | 13.84 |
| Console render GPU p95 (ms) | n/a | 13.71 | 20.13 | 15.24 | 23.64 | 21.44 |
| Console render GPU (ms / s) | 0.00 | 338 | 329 | 403 | 339 | 284 |
| LCD offscreen GPU span (ms / s) | 0.00 | 47.31 | 7.71 | 22.61 | 17.63 | 12.38 |
| GPU device utilization (%, system) | 18.82 | 57.25 | 34.55 | 57.27 | 43.45 | 39.64 |
| Draw calls / render | n/a | 155 | 81.00 | 155 | 81.00 | 81.00 |
| Texture uploads / s | 23.36 | 24.22 | 39.94 | 49.62 | 40.87 | 40.41 |
| Upload CPU (ms / s) | 546 | 22.54 | 2.94 | 4.92 | 3.55 | 4.47 |
| Upload MB / s | 318 | 35.20 | 20.48 | 23.89 | 20.95 | 20.72 |
| Long animation frames | 4.00 | 1.00 | 0.00 | 1.00 | 10.00 | 2.00 |
| Long-frame blocking (ms) | 1411 | 37.00 | 0.00 | 0.00 | 64.40 | 0.00 |
| Input events > 16 ms | 0.00 | 0.00 | 0.00 | 22.00 | 8.00 | 0.00 |
| Input event p50 (ms, of those > 16 ms) | 0.00 | 0.00 | 0.00 | 48.00 | 40.00 | 0.00 |
| Slowest input event (ms) | 0.00 | 0.00 | 0.00 | 56.00 | 80.00 | 0.00 |

## ipad (quality tier: high; display interval 16.30 ms)

Startup: ready 1868 ms, first scene draw 1868 ms, opening finished 4722 ms. Memory at end: JS heap 68.88 MB, renderer footprint 1269 MB, GPU process footprint 1867 MB, system GPU memory in use 3213 MB. System GPU utilization with a blank page: 14.07%.

| Metric | startup | opening | idle | home-nav | app | resize |
|---|---:|---:|---:|---:|---:|---:|
| Frame interval p50 (ms) | 16.70 | 16.70 | 16.70 | 16.70 | 16.70 | 16.70 |
| Frame interval p95 (ms) | 62.51 | 17.30 | 17.60 | 17.18 | 17.40 | 17.30 |
| Frame interval max (ms) | 1101 | 99.90 | 17.70 | 17.60 | 34.20 | 17.70 |
| Dropped frames (%) | 66.67 | 2.98 | 0.00 | 0.00 | 1.70 | 0.00 |
| Scene renders / s | 0.00 | 58.25 | 19.98 | 56.19 | 26.27 | 19.90 |
| Loop CPU p50 (ms) | n/a | 0.70 | 0.20 | 0.80 | 0.20 | 0.20 |
| Loop CPU p95 (ms) | n/a | 11.70 | 7.30 | 11.80 | 18.11 | 5.55 |
| Loop CPU (ms / s) | 0.00 | 192 | 125 | 212 | 197 | 111 |
| Console render GPU p50 (ms) | n/a | 4.78 | 18.00 | 5.31 | 14.27 | 16.91 |
| Console render GPU p95 (ms) | n/a | 14.14 | 24.28 | 16.53 | 21.69 | 23.99 |
| Console render GPU (ms / s) | 0.00 | 352 | 350 | 446 | 355 | 326 |
| LCD offscreen GPU span (ms / s) | 0.00 | 42.28 | 6.49 | 52.40 | 9.64 | 7.18 |
| GPU device utilization (%, system) | 18.17 | 57.54 | 34.87 | 57.29 | 40.04 | 38.12 |
| Draw calls / render | n/a | 155 | 81.00 | 155 | 81.00 | 81.00 |
| Texture uploads / s | 32.12 | 24.15 | 39.97 | 49.84 | 41.14 | 39.80 |
| Upload CPU (ms / s) | 591 | 23.05 | 2.53 | 3.60 | 2.04 | 2.94 |
| Upload MB / s | 437 | 35.11 | 20.49 | 24.02 | 21.09 | 20.40 |
| Long animation frames | 3.00 | 1.00 | 0.00 | 1.00 | 4.00 | 0.00 |
| Long-frame blocking (ms) | 1069 | 36.10 | 0.00 | 0.00 | 0.00 | 0.00 |
| Input events > 16 ms | 0.00 | 0.00 | 0.00 | 22.00 | 8.00 | 0.00 |
| Input event p50 (ms, of those > 16 ms) | 0.00 | 0.00 | 0.00 | 48.00 | 40.00 | 0.00 |
| Slowest input event (ms) | 0.00 | 0.00 | 0.00 | 56.00 | 80.00 | 0.00 |
