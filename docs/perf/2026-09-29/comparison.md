# Before/after — median of 3 runs each

Before: http://127.0.0.1:3101/ · After: http://127.0.0.1:3103/

## desktop (tier high → high)

| Startup and memory | Before | After | Change |
|---|---:|---:|---:|
| Scene ready (ms) | 1718 | 1639 | -5% |
| Opening finished (ms) | 4531 | 4441 | -2% |
| Startup long-frame blocking (ms) | 967 | 969 | +0% |
| JS heap at end (MB) | 66.38 | 62.59 | -6% |
| Renderer footprint (MB) | 1244 | 1241 | -0% |
| GPU process footprint (MB) | 1991 | 1961 | -2% |
| System GPU memory in use (MB) | 2885 | 2822 | -2% |
| System GPU utilization, blank page (%) | 19.36 | 15.07 | -22% |

### startup

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Frame interval p50 (ms) | 16.70 | 16.70 | 0% |
| Frame interval p95 (ms) | 26.27 | 33.90 | +29% |
| Frame interval max (ms) | 133 | 125 | -6% |
| Dropped frames (%) | 20.93 | 23.08 | +10% |
| Scene renders / s | 0.00 | 0.00 | 0% |
| Loop CPU p50 (ms) | n/a | n/a | n/a |
| Loop CPU p95 (ms) | n/a | n/a | n/a |
| Loop CPU (ms / s) | 0.00 | 0.00 | 0% |
| Console render GPU p50 (ms) | n/a | n/a | n/a |
| Console render GPU p95 (ms) | n/a | n/a | n/a |
| Console render GPU (ms / s) | 0.00 | 0.00 | 0% |
| LCD offscreen GPU span (ms / s) | 0.00 | 0.00 | 0% |
| GPU device utilization (%, system) | 17.69 | 15.07 | -15% |
| Draw calls / render | n/a | n/a | n/a |
| Texture uploads / s | 34.92 | 36.61 | +5% |
| Upload CPU (ms / s) | 568 | 596 | +5% |
| Upload MB / s | 475 | 498 | +5% |
| Long animation frames | 3.00 | 3.00 | 0% |
| Long-frame blocking (ms) | 967 | 969 | +0% |
| Input events > 16 ms | 0.00 | 0.00 | 0% |
| Input event p50 (ms, of those > 16 ms) | 0.00 | 0.00 | 0% |
| Slowest input event (ms) | 0.00 | 0.00 | 0% |

### opening

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Frame interval p50 (ms) | 16.70 | 16.70 | 0% |
| Frame interval p95 (ms) | 17.50 | 17.30 | -1% |
| Frame interval max (ms) | 41.70 | 49.80 | +19% |
| Dropped frames (%) | 1.19 | 1.19 | 0% |
| Scene renders / s | 59.74 | 59.45 | -0% |
| Loop CPU p50 (ms) | 0.60 | 0.60 | 0% |
| Loop CPU p95 (ms) | 7.33 | 7.30 | -0% |
| Loop CPU (ms / s) | 127 | 131 | +3% |
| Console render GPU p50 (ms) | 5.24 | 5.52 | +5% |
| Console render GPU p95 (ms) | 16.08 | 16.29 | +1% |
| Console render GPU (ms / s) | 400 | 406 | +2% |
| LCD offscreen GPU span (ms / s) | 7.11 | 6.61 | -7% |
| GPU device utilization (%, system) | 55.39 | 50.46 | -9% |
| Draw calls / render | 155 | 155 | 0% |
| Texture uploads / s | 24.21 | 24.21 | +0% |
| Upload CPU (ms / s) | 10.21 | 10.82 | +6% |
| Upload MB / s | 35.18 | 35.19 | +0% |
| Long animation frames | 1.00 | 1.00 | 0% |
| Long-frame blocking (ms) | 0.10 | 1.30 | +1200% |
| Input events > 16 ms | 0.00 | 0.00 | 0% |
| Input event p50 (ms, of those > 16 ms) | 0.00 | 0.00 | 0% |
| Slowest input event (ms) | 0.00 | 0.00 | 0% |

### idle

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Frame interval p50 (ms) | 16.70 | 16.70 | 0% |
| Frame interval p95 (ms) | 17.10 | 17.10 | 0% |
| Frame interval max (ms) | 17.60 | 17.60 | 0% |
| Dropped frames (%) | 0.00 | 0.00 | 0% |
| Scene renders / s | 19.99 | 19.99 | -0% |
| Loop CPU p50 (ms) | 0.20 | 0.20 | 0% |
| Loop CPU p95 (ms) | 8.00 | 7.60 | -5% |
| Loop CPU (ms / s) | 142 | 137 | -3% |
| Console render GPU p50 (ms) | 18.13 | 20.08 | +11% |
| Console render GPU p95 (ms) | 30.46 | 28.71 | -6% |
| Console render GPU (ms / s) | 371 | 397 | +7% |
| LCD offscreen GPU span (ms / s) | 10.98 | 11.50 | +5% |
| GPU device utilization (%, system) | 36.86 | 39.50 | +7% |
| Draw calls / render | 81.00 | 81.00 | 0% |
| Texture uploads / s | 39.99 | 39.98 | -0% |
| Upload CPU (ms / s) | 3.03 | 2.77 | -9% |
| Upload MB / s | 20.50 | 20.50 | -0% |
| Long animation frames | 1.00 | 1.00 | 0% |
| Long-frame blocking (ms) | 31.00 | 26.90 | -13% |
| Input events > 16 ms | 0.00 | 0.00 | 0% |
| Input event p50 (ms, of those > 16 ms) | 0.00 | 0.00 | 0% |
| Slowest input event (ms) | 0.00 | 0.00 | 0% |

### home-nav

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Frame interval p50 (ms) | 16.70 | 16.70 | 0% |
| Frame interval p95 (ms) | 17.06 | 17.40 | +2% |
| Frame interval max (ms) | 17.70 | 75.00 | +324% |
| Dropped frames (%) | 0.00 | 1.56 | new |
| Scene renders / s | 55.59 | 55.58 | -0% |
| Loop CPU p50 (ms) | 0.60 | 0.60 | 0% |
| Loop CPU p95 (ms) | 7.50 | 7.84 | +5% |
| Loop CPU (ms / s) | 136 | 138 | +1% |
| Console render GPU p50 (ms) | 5.79 | 5.67 | -2% |
| Console render GPU p95 (ms) | 16.98 | 17.64 | +4% |
| Console render GPU (ms / s) | 416 | 428 | +3% |
| LCD offscreen GPU span (ms / s) | 6.60 | 7.26 | +10% |
| GPU device utilization (%, system) | 50.79 | 46.84 | -8% |
| Draw calls / render | 155 | 155 | 0% |
| Texture uploads / s | 45.87 | 45.60 | -1% |
| Upload CPU (ms / s) | 2.44 | 2.82 | +16% |
| Upload MB / s | 22.00 | 21.89 | -1% |
| Long animation frames | 0.00 | 1.00 | new |
| Long-frame blocking (ms) | 0.00 | 0.00 | 0% |
| Input events > 16 ms | 22.00 | 22.00 | 0% |
| Input event p50 (ms, of those > 16 ms) | 32.00 | 32.00 | 0% |
| Slowest input event (ms) | 104 | 96.00 | -8% |

### app

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Frame interval p50 (ms) | 16.70 | 16.70 | -0% |
| Frame interval p95 (ms) | 24.92 | 24.82 | -0% |
| Frame interval max (ms) | 83.40 | 83.40 | -0% |
| Dropped frames (%) | 10.48 | 10.32 | -2% |
| Scene renders / s | 25.66 | 25.77 | +0% |
| Loop CPU p50 (ms) | 0.30 | 0.30 | 0% |
| Loop CPU p95 (ms) | 27.04 | 26.70 | -1% |
| Loop CPU (ms / s) | 253 | 252 | -0% |
| Console render GPU p50 (ms) | 16.16 | 14.85 | -8% |
| Console render GPU p95 (ms) | 33.37 | 29.92 | -10% |
| Console render GPU (ms / s) | 420 | 384 | -9% |
| LCD offscreen GPU span (ms / s) | 14.05 | 13.02 | -7% |
| GPU device utilization (%, system) | 39.71 | 46.52 | +17% |
| Draw calls / render | 81.00 | 81.00 | 0% |
| Texture uploads / s | 39.31 | 39.48 | +0% |
| Upload CPU (ms / s) | 1.84 | 1.86 | +1% |
| Upload MB / s | 20.15 | 20.24 | +0% |
| Long animation frames | 15.00 | 15.00 | 0% |
| Long-frame blocking (ms) | 236 | 217 | -8% |
| Input events > 16 ms | 8.00 | 8.00 | 0% |
| Input event p50 (ms, of those > 16 ms) | 32.00 | 32.00 | 0% |
| Slowest input event (ms) | 64.00 | 56.00 | -13% |

### resize

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Frame interval p50 (ms) | 16.70 | 16.70 | 0% |
| Frame interval p95 (ms) | 17.27 | 17.33 | +0% |
| Frame interval max (ms) | 17.70 | 17.50 | -1% |
| Dropped frames (%) | 0.00 | 0.00 | 0% |
| Scene renders / s | 20.22 | 20.09 | -1% |
| Loop CPU p50 (ms) | 0.20 | 0.20 | -0% |
| Loop CPU p95 (ms) | 7.25 | 7.42 | +2% |
| Loop CPU (ms / s) | 146 | 137 | -7% |
| Console render GPU p50 (ms) | 17.39 | 14.33 | -18% |
| Console render GPU p95 (ms) | 28.52 | 25.63 | -10% |
| Console render GPU (ms / s) | 364 | 320 | -12% |
| LCD offscreen GPU span (ms / s) | 14.97 | 12.63 | -16% |
| GPU device utilization (%, system) | 44.60 | 40.96 | -8% |
| Draw calls / render | 81.00 | 81.00 | 0% |
| Texture uploads / s | 40.45 | 40.19 | -1% |
| Upload CPU (ms / s) | 2.93 | 3.07 | +5% |
| Upload MB / s | 20.74 | 20.60 | -1% |
| Long animation frames | 0.00 | 0.00 | 0% |
| Long-frame blocking (ms) | 0.00 | 0.00 | 0% |
| Input events > 16 ms | 0.00 | 0.00 | 0% |
| Input event p50 (ms, of those > 16 ms) | 0.00 | 0.00 | 0% |
| Slowest input event (ms) | 0.00 | 0.00 | 0% |

## mobile (tier constrained → constrained)

| Startup and memory | Before | After | Change |
|---|---:|---:|---:|
| Scene ready (ms) | 2789 | 1776 | -36% |
| Opening finished (ms) | 5604 | 4581 | -18% |
| Startup long-frame blocking (ms) | 1500 | 668 | -55% |
| JS heap at end (MB) | 70.78 | 67.11 | -5% |
| Renderer footprint (MB) | 1169 | 749 | -36% |
| GPU process footprint (MB) | 1453 | 863 | -41% |
| System GPU memory in use (MB) | 2224 | 1541 | -31% |
| System GPU utilization, blank page (%) | 13.79 | 11.36 | -18% |

### startup

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Frame interval p50 (ms) | 16.80 | 17.15 | +2% |
| Frame interval p95 (ms) | 131 | 146 | +12% |
| Frame interval max (ms) | 376 | 359 | -4% |
| Dropped frames (%) | 63.16 | 64.10 | +1% |
| Scene renders / s | 0.00 | 0.00 | 0% |
| Loop CPU p50 (ms) | n/a | n/a | n/a |
| Loop CPU p95 (ms) | n/a | n/a | n/a |
| Loop CPU (ms / s) | 0.00 | 0.00 | 0% |
| Console render GPU p50 (ms) | n/a | n/a | n/a |
| Console render GPU p95 (ms) | n/a | n/a | n/a |
| Console render GPU (ms / s) | 0.00 | 0.00 | 0% |
| LCD offscreen GPU span (ms / s) | 0.00 | 0.00 | 0% |
| GPU device utilization (%, system) | 7.96 | 10.76 | +35% |
| Draw calls / render | n/a | n/a | n/a |
| Texture uploads / s | 21.51 | 33.79 | +57% |
| Upload CPU (ms / s) | 467 | 275 | -41% |
| Upload MB / s | 292 | 215 | -26% |
| Long animation frames | 8.00 | 7.00 | -13% |
| Long-frame blocking (ms) | 1500 | 668 | -55% |
| Input events > 16 ms | 0.00 | 0.00 | 0% |
| Input event p50 (ms, of those > 16 ms) | 0.00 | 0.00 | 0% |
| Slowest input event (ms) | 0.00 | 0.00 | 0% |

### opening

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Frame interval p50 (ms) | 16.70 | 16.70 | 0% |
| Frame interval p95 (ms) | 17.50 | 17.50 | 0% |
| Frame interval max (ms) | 17.60 | 17.60 | -0% |
| Dropped frames (%) | 0.00 | 0.00 | 0% |
| Scene renders / s | 27.12 | 27.01 | -0% |
| Loop CPU p50 (ms) | 0.30 | 0.30 | 0% |
| Loop CPU p95 (ms) | 11.06 | 11.08 | +0% |
| Loop CPU (ms / s) | 122 | 119 | -3% |
| Console render GPU p50 (ms) | 3.80 | 3.70 | -3% |
| Console render GPU p95 (ms) | 8.59 | 8.73 | +2% |
| Console render GPU (ms / s) | 109 | 104 | -4% |
| LCD offscreen GPU span (ms / s) | 1.05 | 1.12 | +6% |
| GPU device utilization (%, system) | 20.82 | 19.54 | -6% |
| Draw calls / render | 154 | 155 | +1% |
| Texture uploads / s | 12.85 | 12.82 | -0% |
| Upload CPU (ms / s) | 2.04 | 1.43 | -30% |
| Upload MB / s | 6.59 | 6.57 | -0% |
| Long animation frames | 0.00 | 0.00 | 0% |
| Long-frame blocking (ms) | 0.00 | 0.00 | 0% |
| Input events > 16 ms | 0.00 | 0.00 | 0% |
| Input event p50 (ms, of those > 16 ms) | 0.00 | 0.00 | 0% |
| Slowest input event (ms) | 0.00 | 0.00 | 0% |

### idle

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Frame interval p50 (ms) | 16.70 | 16.70 | 0% |
| Frame interval p95 (ms) | 17.51 | 17.50 | -0% |
| Frame interval max (ms) | 17.60 | 17.60 | 0% |
| Dropped frames (%) | 0.00 | 0.00 | 0% |
| Scene renders / s | 10.66 | 10.99 | +3% |
| Loop CPU p50 (ms) | 0.20 | 0.20 | 0% |
| Loop CPU p95 (ms) | 16.81 | 16.20 | -4% |
| Loop CPU (ms / s) | 173 | 170 | -2% |
| Console render GPU p50 (ms) | 5.95 | 5.20 | -13% |
| Console render GPU p95 (ms) | 6.94 | 7.33 | +6% |
| Console render GPU (ms / s) | 65.94 | 59.17 | -10% |
| LCD offscreen GPU span (ms / s) | 1.87 | 2.03 | +9% |
| GPU device utilization (%, system) | 15.30 | 12.07 | -21% |
| Draw calls / render | 81.00 | 81.00 | 0% |
| Texture uploads / s | 21.32 | 21.98 | +3% |
| Upload CPU (ms / s) | 5.63 | 5.66 | +1% |
| Upload MB / s | 10.93 | 11.27 | +3% |
| Long animation frames | 1.00 | 1.00 | 0% |
| Long-frame blocking (ms) | 39.70 | 42.00 | +6% |
| Input events > 16 ms | 0.00 | 0.00 | 0% |
| Input event p50 (ms, of those > 16 ms) | 0.00 | 0.00 | 0% |
| Slowest input event (ms) | 0.00 | 0.00 | 0% |

### home-nav

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Frame interval p50 (ms) | 16.70 | 16.70 | 0% |
| Frame interval p95 (ms) | 17.50 | 17.50 | 0% |
| Frame interval max (ms) | 83.00 | 82.60 | -0% |
| Dropped frames (%) | 2.69 | 2.68 | -0% |
| Scene renders / s | 24.64 | 24.57 | -0% |
| Loop CPU p50 (ms) | 0.70 | 0.70 | +0% |
| Loop CPU p95 (ms) | 11.30 | 11.93 | +6% |
| Loop CPU (ms / s) | 141 | 141 | -1% |
| Console render GPU p50 (ms) | 4.03 | 3.54 | -12% |
| Console render GPU p95 (ms) | 8.72 | 7.98 | -9% |
| Console render GPU (ms / s) | 129 | 116 | -10% |
| LCD offscreen GPU span (ms / s) | 1.10 | 1.12 | +2% |
| GPU device utilization (%, system) | 20.21 | 20.26 | +0% |
| Draw calls / render | 155 | 155 | 0% |
| Texture uploads / s | 26.67 | 26.50 | -1% |
| Upload CPU (ms / s) | 3.10 | 3.24 | +4% |
| Upload MB / s | 12.22 | 12.12 | -1% |
| Long animation frames | 3.00 | 2.00 | -33% |
| Long-frame blocking (ms) | 91.90 | 88.80 | -3% |
| Input events > 16 ms | 17.00 | 19.00 | +12% |
| Input event p50 (ms, of those > 16 ms) | 24.00 | 32.00 | +33% |
| Slowest input event (ms) | 88.00 | 96.00 | +9% |

### app

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Frame interval p50 (ms) | 16.70 | 16.70 | -0% |
| Frame interval p95 (ms) | 17.50 | 17.60 | +1% |
| Frame interval max (ms) | 275 | 268 | -3% |
| Dropped frames (%) | 16.25 | 15.47 | -5% |
| Scene renders / s | 12.05 | 12.41 | +3% |
| Loop CPU p50 (ms) | 0.20 | 0.20 | 0% |
| Loop CPU p95 (ms) | 15.77 | 15.60 | -1% |
| Loop CPU (ms / s) | 276 | 273 | -1% |
| Console render GPU p50 (ms) | 6.80 | 6.03 | -11% |
| Console render GPU p95 (ms) | 9.16 | 8.28 | -10% |
| Console render GPU (ms / s) | 79.64 | 72.73 | -9% |
| LCD offscreen GPU span (ms / s) | 2.55 | 2.25 | -12% |
| GPU device utilization (%, system) | 16.99 | 15.16 | -11% |
| Draw calls / render | 81.00 | 81.00 | 0% |
| Texture uploads / s | 19.62 | 20.13 | +3% |
| Upload CPU (ms / s) | 3.42 | 3.56 | +4% |
| Upload MB / s | 10.06 | 10.32 | +3% |
| Long animation frames | 9.00 | 10.00 | +11% |
| Long-frame blocking (ms) | 1102 | 1076 | -2% |
| Input events > 16 ms | 8.00 | 7.00 | -13% |
| Input event p50 (ms, of those > 16 ms) | 32.00 | 32.00 | 0% |
| Slowest input event (ms) | 144 | 152 | +6% |

### resize

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Frame interval p50 (ms) | 16.60 | 16.70 | +1% |
| Frame interval p95 (ms) | 17.50 | 17.50 | 0% |
| Frame interval max (ms) | 24.90 | 17.70 | -29% |
| Dropped frames (%) | 0.64 | 0.00 | -100% |
| Scene renders / s | 10.97 | 10.72 | -2% |
| Loop CPU p50 (ms) | 0.20 | 0.20 | -0% |
| Loop CPU p95 (ms) | 14.18 | 13.67 | -4% |
| Loop CPU (ms / s) | 157 | 151 | -4% |
| Console render GPU p50 (ms) | 5.93 | 5.25 | -11% |
| Console render GPU p95 (ms) | 8.36 | 7.98 | -5% |
| Console render GPU (ms / s) | 65.73 | 60.38 | -8% |
| LCD offscreen GPU span (ms / s) | 1.89 | 1.82 | -4% |
| GPU device utilization (%, system) | 19.56 | 15.04 | -23% |
| Draw calls / render | 81.00 | 81.00 | 0% |
| Texture uploads / s | 21.94 | 21.45 | -2% |
| Upload CPU (ms / s) | 6.21 | 6.16 | -1% |
| Upload MB / s | 11.25 | 11.00 | -2% |
| Long animation frames | 0.00 | 0.00 | 0% |
| Long-frame blocking (ms) | 0.00 | 0.00 | 0% |
| Input events > 16 ms | 0.00 | 0.00 | 0% |
| Input event p50 (ms, of those > 16 ms) | 0.00 | 0.00 | 0% |
| Slowest input event (ms) | 0.00 | 0.00 | 0% |
