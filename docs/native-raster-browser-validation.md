# Native raster browser checks

The first prepared CPU raster kernel (8e25301), guarded upper-base darken path
(29c1977/b94a3bb), and counted-close paint cadence (a8906a2) were checked in the
actual desktop browser on ANGLE Metal / Apple M2. Viewport1000×860, DPR1, high
quality, white theme, one-row HOME with folder19 selected. These are development
browser measurements with diagnostics; host load, JIT and cache state vary.

## Image preservation

Fixed captures use elapsed12345ms, date2026-09-23T12:00:00Z and reduced motion
to hold banner/cursor poses. Both upper and lower LCDs were captured on root HOME
and in the open folder. All four first-kernel captures and all four combined
captures are byte-identical to their pre-optimization baselines. Each set covers
2,150,400 decoded RGBA bytes (800×240 upper and320×240 lower for two states).
The upper image retains the existing monoscopic800-wide delivery contract.

This checks preservation of the current browser output. It does not establish
new native hardware parity, dynamic animation phase equivalence or universal
Canvas behavior. The darken optimization is explicitly restricted to the opaque
upper-base call and guarded exact pixel placement/clip. Other geometry, text and
partially transparent Canvas cases keep the former compositor. See
[the blend validation](native-darken-blend-validation.md) and
[the pure kernel differential checks](native-raster-kernel-validation.md).

## Actual Back interaction

`scripts/verify-folder-close-performance.mjs` focuses the accessible Back control
and sends a real Enter keypress through the browser tool. It observes RAF,
long-task entries, shared update counts and last-painted close frames for six
seconds. It does not capture screenshots or inject reducer state while timing.
The caller must prepare an open folder with normal motion. All output paths are
explicitly supplied with `--artifact-dir`.

| Run | RAF gap median /95th percentile | Largest RAF gap | Longest task | Painted close frames observed |
| --- | --- | --- | --- | --- |
| Original renderer, with paint diagnostics |100 /116.8ms|816.6ms|820ms|14|
| First prepared kernel |16.7 /33.4ms|116.6ms|109ms|14,4,0|
| Kernel + guarded blend + close cadence |16.7 /16.8ms|66.6ms|62ms|15,12,8,5,3,1,0|

Each run restored root at start+18 shared updates. The combined run had two
50ms-or-longer tasks. A second, warmer run with Chrome profiling enabled observed
no50ms long task and a50ms largest RAF gap, painting16,15,12,9,7,4,1,0; profiler
overhead and changed cache/JIT state make that a separate diagnostic observation.
The close still skips source frames. Its cold material work remains an open
performance issue; neither the state tests nor these gains establish fully
smooth native-speed animation.

Idle LCDs retain the high/balanced/constrained24/18/12FPS policy. Advancing close
updates, including final root restoration, can paint at the scene60/45/30FPS
budget. Frozen clocks and reduced motion do not trigger this boost. The shared
state clock continues independently of paints.

## SSD evidence

All browser files below are under the firmware artifact root's `reference/`:

- `raster-before-fixed-{root,folder}.json` and PNGs: unchanged baseline poses.
- `raster-kernel-fixed-{root,folder}.json` and PNGs: first kernel only.
- `raster-combined-fixed-{root,folder}.json` and PNGs, plus
  `raster-combined-fixed-comparison.json`: combined zero-byte-difference checks.
- `raster-before-close-painted.json`, `raster-kernel-close.json`,
  `raster-combined-close.json`: non-profiled measurements in the table.
- `raster-combined-profile-close.json` and `raster-combined.cpuprofile`: the
  second combined close and Chrome trace for remaining-cost investigation.

No browser errors were reported after the combined run. The earlier full test
run's single stale immediate-close assertion was corrected to verify start+18
restoration while retaining suspended software; the focused test passes.
The combined suite passes588 of590 tests, with two skips and no failures;
type checking and the production build also pass. The optional CPU Canvas tests
were enabled from the SSD-only module installation. Logs are
`integration-raster-all-tests.log` and `integration-raster-build.log` at the
firmware artifact root. No new dependency was added to the application.

The actual projected model A button opened the folder; a projected touchscreen
Back tap restored HOME at start+18 with the folder-close cue. The record is
`reference/raster-combined-physical-touch.json`. At390×844, the console is fully
framed with no document overflow (`raster-combined-mobile.png`). Fixed-date,
fixed-time reduced-motion captures remained identical across48 logical updates,
with no error overlay (`raster-combined-reduced-stability.json`).
