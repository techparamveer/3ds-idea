# Before/after — median of 3 runs each

Before: http://127.0.0.1:3101/ · After: http://127.0.0.1:3103/

## desktop (tier high → high)

| Startup and memory | Before | After | Change |
|---|---:|---:|---:|
| Scene ready (ms) | 1754 | 1693 | -3% |
| Opening finished (ms) | 4565 | 4500 | -1% |
| Startup long-frame blocking (ms) | 928 | 932 | +0% |
| JS heap at end (MB) | 62.76 | 61.40 | -2% |
| Renderer footprint (MB) | 1245 | 1238 | -1% |
| GPU process footprint (MB) | 2007 | 1994 | -1% |
| System GPU memory in use (MB) | 3000 | 2948 | -2% |
| System GPU utilization, blank page (%) | 26.36 | 24.00 | -9% |

### startup

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Frame interval p50 (ms) | 16.70 | 16.70 | -0% |
| Frame interval p95 (ms) | 26.60 | 28.72 | +8% |
| Frame interval max (ms) | 133 | 133 | -0% |
| Dropped frames (%) | 22.92 | 22.22 | -3% |
| Scene renders / s | 0.00 | 0.00 | 0% |
| Loop CPU p50 (ms) | n/a | n/a | n/a |
| Loop CPU p95 (ms) | n/a | n/a | n/a |
| Loop CPU (ms / s) | 0.00 | 0.00 | 0% |
| Console render GPU p50 (ms) | n/a | n/a | n/a |
| Console render GPU p95 (ms) | n/a | n/a | n/a |
| Console render GPU (ms / s) | 0.00 | 0.00 | 0% |
| LCD offscreen GPU span (ms / s) | 0.00 | 0.00 | 0% |
| GPU device utilization (%, system) | 28.56 | 20.06 | -30% |
| Draw calls / render | n/a | n/a | n/a |
| Texture uploads / s | 34.20 | 35.44 | +4% |
| Upload CPU (ms / s) | 539 | 552 | +2% |
| Upload MB / s | 466 | 482 | +4% |
| Long animation frames | 3.00 | 3.00 | 0% |
| Long-frame blocking (ms) | 928 | 932 | +0% |
| Input events > 16 ms | 0.00 | 0.00 | 0% |
| Input event p50 (ms, of those > 16 ms) | 0.00 | 0.00 | 0% |
| Slowest input event (ms) | 0.00 | 0.00 | 0% |

### opening

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Frame interval p50 (ms) | 16.70 | 16.70 | 0% |
| Frame interval p95 (ms) | 17.99 | 17.52 | -3% |
| Frame interval max (ms) | 58.40 | 49.90 | -15% |
| Dropped frames (%) | 3.53 | 1.19 | -66% |
| Scene renders / s | 59.06 | 59.49 | +1% |
| Loop CPU p50 (ms) | 0.50 | 0.50 | 0% |
| Loop CPU p95 (ms) | 6.40 | 6.76 | +6% |
| Loop CPU (ms / s) | 117 | 118 | +0% |
| Console render GPU p50 (ms) | 5.32 | 5.26 | -1% |
| Console render GPU p95 (ms) | 13.01 | 13.16 | +1% |
| Console render GPU (ms / s) | 373 | 366 | -2% |
| LCD offscreen GPU span (ms / s) | 5.77 | 6.30 | +9% |
| GPU device utilization (%, system) | 52.44 | 52.82 | +1% |
| Draw calls / render | 155 | 155 | 0% |
| Texture uploads / s | 24.19 | 24.22 | +0% |
| Upload CPU (ms / s) | 10.65 | 10.69 | +0% |
| Upload MB / s | 35.16 | 35.21 | +0% |
| Long animation frames | 1.00 | 1.00 | 0% |
| Long-frame blocking (ms) | 11.40 | 0.50 | -96% |
| Input events > 16 ms | 0.00 | 0.00 | 0% |
| Input event p50 (ms, of those > 16 ms) | 0.00 | 0.00 | 0% |
| Slowest input event (ms) | 0.00 | 0.00 | 0% |

### idle

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Frame interval p50 (ms) | 16.70 | 16.70 | 0% |
| Frame interval p95 (ms) | 17.70 | 17.60 | -1% |
| Frame interval max (ms) | 18.50 | 18.60 | +1% |
| Dropped frames (%) | 0.00 | 0.00 | 0% |
| Scene renders / s | 59.98 | 19.98 | -67% |
| Loop CPU p50 (ms) | 0.60 | 0.20 | -67% |
| Loop CPU p95 (ms) | 6.61 | 6.81 | +3% |
| Loop CPU (ms / s) | 133 | 128 | -4% |
| Console render GPU p50 (ms) | 5.00 | 20.61 | +312% |
| Console render GPU p95 (ms) | 14.81 | 35.52 | +140% |
| Console render GPU (ms / s) | 429 | 445 | +4% |
| LCD offscreen GPU span (ms / s) | 8.66 | 9.08 | +5% |
| GPU device utilization (%, system) | 59.60 | 40.93 | -31% |
| Draw calls / render | 155 | 81.00 | -48% |
| Texture uploads / s | 39.97 | 39.97 | -0% |
| Upload CPU (ms / s) | 2.40 | 2.60 | +8% |
| Upload MB / s | 20.49 | 20.49 | -0% |
| Long animation frames | 1.00 | 1.00 | 0% |
| Long-frame blocking (ms) | 32.10 | 33.20 | +3% |
| Input events > 16 ms | 0.00 | 0.00 | 0% |
| Input event p50 (ms, of those > 16 ms) | 0.00 | 0.00 | 0% |
| Slowest input event (ms) | 0.00 | 0.00 | 0% |

### home-nav

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Frame interval p50 (ms) | 16.70 | 16.70 | 0% |
| Frame interval p95 (ms) | 18.16 | 17.87 | -2% |
| Frame interval max (ms) | 25.20 | 25.00 | -1% |
| Dropped frames (%) | 1.20 | 0.80 | -34% |
| Scene renders / s | 58.91 | 55.17 | -6% |
| Loop CPU p50 (ms) | 0.60 | 0.60 | 0% |
| Loop CPU p95 (ms) | 7.10 | 7.15 | +1% |
| Loop CPU (ms / s) | 128 | 123 | -3% |
| Console render GPU p50 (ms) | 5.46 | 5.97 | +9% |
| Console render GPU p95 (ms) | 13.79 | 15.51 | +13% |
| Console render GPU (ms / s) | 429 | 440 | +3% |
| LCD offscreen GPU span (ms / s) | 6.55 | 6.78 | +4% |
| GPU device utilization (%, system) | 53.83 | 53.52 | -1% |
| Draw calls / render | 155 | 155 | 0% |
| Texture uploads / s | 45.99 | 45.72 | -1% |
| Upload CPU (ms / s) | 2.45 | 2.51 | +2% |
| Upload MB / s | 22.07 | 21.94 | -1% |
| Long animation frames | 0.00 | 1.00 | new |
| Long-frame blocking (ms) | 0.00 | 0.00 | 0% |
| Input events > 16 ms | 22.00 | 22.00 | 0% |
| Input event p50 (ms, of those > 16 ms) | 24.00 | 24.00 | 0% |
| Slowest input event (ms) | 104 | 96.00 | -8% |

### app

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Frame interval p50 (ms) | 16.70 | 16.70 | 0% |
| Frame interval p95 (ms) | 24.83 | 24.74 | -0% |
| Frame interval max (ms) | 91.70 | 83.80 | -9% |
| Dropped frames (%) | 10.20 | 10.32 | +1% |
| Scene renders / s | 54.68 | 25.73 | -53% |
| Loop CPU p50 (ms) | 0.50 | 0.20 | -60% |
| Loop CPU p95 (ms) | 26.92 | 26.62 | -1% |
| Loop CPU (ms / s) | 250 | 238 | -5% |
| Console render GPU p50 (ms) | 5.19 | 15.78 | +204% |
| Console render GPU p95 (ms) | 13.82 | 33.66 | +144% |
| Console render GPU (ms / s) | 419 | 418 | -0% |
| LCD offscreen GPU span (ms / s) | 19.14 | 16.53 | -14% |
| GPU device utilization (%, system) | 54.29 | 44.05 | -19% |
| Draw calls / render | 155 | 81.00 | -48% |
| Texture uploads / s | 39.43 | 39.41 | -0% |
| Upload CPU (ms / s) | 1.84 | 1.75 | -5% |
| Upload MB / s | 20.22 | 20.21 | -0% |
| Long animation frames | 15.00 | 15.00 | 0% |
| Long-frame blocking (ms) | 223 | 233 | +4% |
| Input events > 16 ms | 8.00 | 8.00 | 0% |
| Input event p50 (ms, of those > 16 ms) | 28.00 | 28.00 | 0% |
| Slowest input event (ms) | 56.00 | 56.00 | 0% |

### resize

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Frame interval p50 (ms) | 16.70 | 16.70 | 0% |
| Frame interval p95 (ms) | 17.70 | 17.90 | +1% |
| Frame interval max (ms) | 25.30 | 24.90 | -2% |
| Dropped frames (%) | 1.28 | 0.64 | -50% |
| Scene renders / s | 61.11 | 19.73 | -68% |
| Loop CPU p50 (ms) | 0.60 | 0.20 | -67% |
| Loop CPU p95 (ms) | 6.89 | 6.72 | -2% |
| Loop CPU (ms / s) | 138 | 132 | -5% |
| Console render GPU p50 (ms) | 4.33 | 17.67 | +308% |
| Console render GPU p95 (ms) | 13.96 | 36.08 | +159% |
| Console render GPU (ms / s) | 408 | 401 | -2% |
| LCD offscreen GPU span (ms / s) | 9.15 | 18.43 | +101% |
| GPU device utilization (%, system) | 55.16 | 43.80 | -21% |
| Draw calls / render | 155 | 81.00 | -48% |
| Texture uploads / s | 39.33 | 39.47 | +0% |
| Upload CPU (ms / s) | 2.60 | 2.72 | +5% |
| Upload MB / s | 20.16 | 20.24 | +0% |
| Long animation frames | 0.00 | 0.00 | 0% |
| Long-frame blocking (ms) | 0.00 | 0.00 | 0% |
| Input events > 16 ms | 0.00 | 0.00 | 0% |
| Input event p50 (ms, of those > 16 ms) | 0.00 | 0.00 | 0% |
| Slowest input event (ms) | 0.00 | 0.00 | 0% |

## mobile (tier constrained → constrained)

| Startup and memory | Before | After | Change |
|---|---:|---:|---:|
| Scene ready (ms) | 2997 | 2769 | -8% |
| Opening finished (ms) | 5816 | 5580 | -4% |
| Startup long-frame blocking (ms) | 1474 | 1469 | -0% |
| JS heap at end (MB) | 72.55 | 70.52 | -3% |
| Renderer footprint (MB) | 1181 | 1173 | -1% |
| GPU process footprint (MB) | 1461 | 1469 | +1% |
| System GPU memory in use (MB) | 2278 | 2339 | +3% |
| System GPU utilization, blank page (%) | 24.00 | 20.57 | -14% |

### startup

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Frame interval p50 (ms) | 17.30 | 16.90 | -2% |
| Frame interval p95 (ms) | 99.96 | 128 | +28% |
| Frame interval max (ms) | 376 | 383 | +2% |
| Dropped frames (%) | 55.66 | 62.37 | +12% |
| Scene renders / s | 0.00 | 0.00 | 0% |
| Loop CPU p50 (ms) | n/a | n/a | n/a |
| Loop CPU p95 (ms) | n/a | n/a | n/a |
| Loop CPU (ms / s) | 0.00 | 0.00 | 0% |
| Console render GPU p50 (ms) | n/a | n/a | n/a |
| Console render GPU p95 (ms) | n/a | n/a | n/a |
| Console render GPU (ms / s) | 0.00 | 0.00 | 0% |
| LCD offscreen GPU span (ms / s) | 0.00 | 0.00 | 0% |
| GPU device utilization (%, system) | 23.69 | 18.11 | -24% |
| Draw calls / render | n/a | n/a | n/a |
| Texture uploads / s | 20.02 | 21.67 | +8% |
| Upload CPU (ms / s) | 432 | 463 | +7% |
| Upload MB / s | 271 | 294 | +8% |
| Long animation frames | 7.00 | 9.00 | +29% |
| Long-frame blocking (ms) | 1474 | 1469 | -0% |
| Input events > 16 ms | 0.00 | 0.00 | 0% |
| Input event p50 (ms, of those > 16 ms) | 0.00 | 0.00 | 0% |
| Slowest input event (ms) | 0.00 | 0.00 | 0% |

### opening

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Frame interval p50 (ms) | 16.70 | 16.80 | +1% |
| Frame interval p95 (ms) | 22.88 | 18.50 | -19% |
| Frame interval max (ms) | 383 | 25.10 | -93% |
| Dropped frames (%) | 17.92 | 4.68 | -74% |
| Scene renders / s | 25.23 | 28.16 | +12% |
| Loop CPU p50 (ms) | 0.75 | 0.50 | -33% |
| Loop CPU p95 (ms) | 10.85 | 11.08 | +2% |
| Loop CPU (ms / s) | 114 | 122 | +7% |
| Console render GPU p50 (ms) | 3.52 | 3.54 | +0% |
| Console render GPU p95 (ms) | 8.81 | 8.38 | -5% |
| Console render GPU (ms / s) | 92.42 | 99.59 | +8% |
| LCD offscreen GPU span (ms / s) | 1.33 | 2.04 | +54% |
| GPU device utilization (%, system) | 30.44 | 32.50 | +7% |
| Draw calls / render | 155 | 153 | -1% |
| Texture uploads / s | 12.79 | 12.83 | +0% |
| Upload CPU (ms / s) | 1.32 | 1.78 | +35% |
| Upload MB / s | 6.56 | 6.58 | +0% |
| Long animation frames | 1.00 | 0.00 | -100% |
| Long-frame blocking (ms) | 0.00 | 0.00 | 0% |
| Input events > 16 ms | 0.00 | 0.00 | 0% |
| Input event p50 (ms, of those > 16 ms) | 0.00 | 0.00 | 0% |
| Slowest input event (ms) | 0.00 | 0.00 | 0% |

### idle

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Frame interval p50 (ms) | 16.70 | 16.70 | 0% |
| Frame interval p95 (ms) | 18.42 | 18.60 | +1% |
| Frame interval max (ms) | 25.00 | 25.00 | 0% |
| Dropped frames (%) | 3.80 | 4.35 | +14% |
| Scene renders / s | 30.32 | 10.66 | -65% |
| Loop CPU p50 (ms) | 1.00 | 0.20 | -80% |
| Loop CPU p95 (ms) | 16.26 | 18.00 | +11% |
| Loop CPU (ms / s) | 189 | 179 | -5% |
| Console render GPU p50 (ms) | 3.43 | 4.19 | +22% |
| Console render GPU p95 (ms) | 10.47 | 9.58 | -8% |
| Console render GPU (ms / s) | 112 | 58.22 | -48% |
| LCD offscreen GPU span (ms / s) | 3.70 | 3.74 | +1% |
| GPU device utilization (%, system) | 32.21 | 24.14 | -25% |
| Draw calls / render | 155 | 81.00 | -48% |
| Texture uploads / s | 21.32 | 21.33 | +0% |
| Upload CPU (ms / s) | 3.43 | 6.23 | +82% |
| Upload MB / s | 10.93 | 10.93 | +0% |
| Long animation frames | 1.00 | 1.00 | 0% |
| Long-frame blocking (ms) | 47.30 | 50.40 | +7% |
| Input events > 16 ms | 0.00 | 0.00 | 0% |
| Input event p50 (ms, of those > 16 ms) | 0.00 | 0.00 | 0% |
| Slowest input event (ms) | 0.00 | 0.00 | 0% |

### home-nav

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Frame interval p50 (ms) | 16.70 | 16.80 | +1% |
| Frame interval p95 (ms) | 18.55 | 18.54 | -0% |
| Frame interval max (ms) | 90.10 | 34.30 | -62% |
| Dropped frames (%) | 4.56 | 4.92 | +8% |
| Scene renders / s | 25.65 | 26.10 | +2% |
| Loop CPU p50 (ms) | 0.90 | 0.90 | 0% |
| Loop CPU p95 (ms) | 11.25 | 13.05 | +16% |
| Loop CPU (ms / s) | 142 | 147 | +4% |
| Console render GPU p50 (ms) | 3.87 | 3.82 | -1% |
| Console render GPU p95 (ms) | 9.44 | 10.08 | +7% |
| Console render GPU (ms / s) | 114 | 113 | -1% |
| LCD offscreen GPU span (ms / s) | 1.80 | 2.56 | +42% |
| GPU device utilization (%, system) | 32.33 | 31.61 | -2% |
| Draw calls / render | 155 | 155 | 0% |
| Texture uploads / s | 26.20 | 26.39 | +1% |
| Upload CPU (ms / s) | 3.05 | 2.88 | -6% |
| Upload MB / s | 11.98 | 12.09 | +1% |
| Long animation frames | 2.00 | 3.00 | +50% |
| Long-frame blocking (ms) | 90.40 | 0.00 | -100% |
| Input events > 16 ms | 20.00 | 18.00 | -10% |
| Input event p50 (ms, of those > 16 ms) | 24.00 | 32.00 | +33% |
| Slowest input event (ms) | 96.00 | 112 | +17% |

### app

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Frame interval p50 (ms) | 16.70 | 16.70 | 0% |
| Frame interval p95 (ms) | 23.40 | 23.40 | 0% |
| Frame interval max (ms) | 283 | 277 | -2% |
| Dropped frames (%) | 19.19 | 19.35 | +1% |
| Scene renders / s | 25.00 | 12.23 | -51% |
| Loop CPU p50 (ms) | 1.00 | 0.25 | -75% |
| Loop CPU p95 (ms) | 16.20 | 16.50 | +2% |
| Loop CPU (ms / s) | 297 | 282 | -5% |
| Console render GPU p50 (ms) | 3.72 | 4.95 | +33% |
| Console render GPU p95 (ms) | 9.49 | 13.17 | +39% |
| Console render GPU (ms / s) | 98.79 | 72.45 | -27% |
| LCD offscreen GPU span (ms / s) | 3.33 | 3.57 | +7% |
| GPU device utilization (%, system) | 30.80 | 26.67 | -13% |
| Draw calls / render | 155 | 81.00 | -48% |
| Texture uploads / s | 19.91 | 20.05 | +1% |
| Upload CPU (ms / s) | 2.12 | 3.42 | +62% |
| Upload MB / s | 10.21 | 10.28 | +1% |
| Long animation frames | 9.00 | 9.00 | 0% |
| Long-frame blocking (ms) | 1109 | 1134 | +2% |
| Input events > 16 ms | 7.00 | 7.00 | 0% |
| Input event p50 (ms, of those > 16 ms) | 32.00 | 32.00 | 0% |
| Slowest input event (ms) | 152 | 160 | +5% |

### resize

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Frame interval p50 (ms) | 16.60 | 16.70 | +1% |
| Frame interval p95 (ms) | 18.44 | 18.40 | -0% |
| Frame interval max (ms) | 24.80 | 24.90 | +0% |
| Dropped frames (%) | 2.53 | 1.94 | -24% |
| Scene renders / s | 29.29 | 10.71 | -63% |
| Loop CPU p50 (ms) | 0.80 | 0.30 | -62% |
| Loop CPU p95 (ms) | 13.02 | 14.10 | +8% |
| Loop CPU (ms / s) | 170 | 152 | -11% |
| Console render GPU p50 (ms) | 3.72 | 4.26 | +15% |
| Console render GPU p95 (ms) | 8.92 | 10.72 | +20% |
| Console render GPU (ms / s) | 120 | 55.74 | -53% |
| LCD offscreen GPU span (ms / s) | 3.64 | 5.08 | +40% |
| GPU device utilization (%, system) | 33.65 | 27.44 | -18% |
| Draw calls / render | 155 | 81.00 | -48% |
| Texture uploads / s | 22.11 | 21.42 | -3% |
| Upload CPU (ms / s) | 3.04 | 6.35 | +109% |
| Upload MB / s | 11.34 | 10.98 | -3% |
| Long animation frames | 0.00 | 0.00 | 0% |
| Long-frame blocking (ms) | 0.00 | 0.00 | 0% |
| Input events > 16 ms | 0.00 | 0.00 | 0% |
| Input event p50 (ms, of those > 16 ms) | 0.00 | 0.00 | 0% |
| Slowest input event (ms) | 0.00 | 0.00 | 0% |
