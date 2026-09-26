# HOME wallpaper phase evidence — 26 September 2026

The settled wallpaper's native material, geometry and scrolling are reproduced
closely when its phase is sampled independently from the selected Settings
banner. This establishes a diagnostic pixel alignment, **not** a recovered live
loop origin. No runtime offset or rendering change was made.

## Source and current application state

Manifest `models.homeBackground` points to the converted HOME title
`0004003000009802` resource `3D/BannerBG_LZ.bin`. Its compressed SHA-256 is
`27d58c2113d2c2d46e3bcc36bb2ae56c35e19d9823488287b6759df998108711`;
decoded CGFX SHA-256 is
`092c8682d0cfabf0a1823a8e3a2c12556515c437afba2aa6f6ac7fc4d5e34595`.
`BannerBG_Loop` is a 600-frame looping material clip. `mt_BG` animates
`MaterialTexCoord1Trans` linearly from X −0.357778 to −0.6911 and Y 0 to 0.1666.
The scrolling image is the source `BG_64_00` texture. No tint, scale or texture
replacement was used in this comparison.

The [existing lifecycle evidence](native-banner-lifecycle.md#background-lifecycle-and-frame-19)
identifies distinct native operations:

- `0x1ed1c4`: entering mode 0 restarts Loop; requesting the same mode preserves it.
- `0x24dc14`: explicit Loop restart, also used by AppQuit completion.
- `0x24da2c`: resume preserves frame and epoch.
- SceneIn start/seek is separate from Loop. Selected-title activation does not
  establish the background phase.

These operations exist as pure functions in `src/os/home-banner-lifecycle.ts`,
but source search finds no application caller for its background attachment,
mode, show, restart or resume functions. The live scene instead constructs a
background with settled skeletal `BannerBG_SceneIn` frame 20 and material
`BannerBG_Loop`, then `drawBackground` samples the supplied elapsed milliseconds
at 60 source frames/second. Live elapsed time starts after console compilation;
`captureScreensAt` can substitute diagnostic elapsed time without advancing HOME
state. Neither path supplies the native background attachment/restart epoch.

## Native burst and phase comparison

The genuine native burst under the private artifact root
`reference/screenshots/`, from `_26.09.26_04.14.30.13.png` through
`_26.09.26_04.14.41.277.png`, best matches wallpaper frames approximately
`33,93,156,216,276,337,396,456,519,579,39,99`. A temporary CPU renderer used
exported mesh projection, perspective-correct attributes, native texture
sampling and the material's TEV stages. Its frame-120 result reproduced the
production browser's wallpaper margins at mean RGB error 0.0013. The sample ROI
was x `[0,60)` plus `[340,400)`, y `[25,200)`: 21,000 pixels.

Against native `_26.09.26_04.14.35.203.png`, the same ROI had mean RGB error
3.5949 and 12,510 pixels over threshold 2 at frame 120. A quarter-frame search
selected frame 337, with mean 0.0489 and zero pixels over threshold 2.
This wallpaper phase is separate from the approximately 309 Settings pose.

The coordinator then used production CUA with `lcdElapsedMs=5616.666666666667`,
`lcdBannerFrame=309`, and the unchanged native date. Artifacts are under
`/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260926/reference/scenario-matrix/v1/captures/home-settings-wrench309-bg337-20ec43e-20260926/`.
The capture records `homeUpdates=3761`, independently of diagnostic elapsed time.
The diff report retains `commit: 03b2d31`; its scenario name is not a replacement
for that recorded metadata.

The full upper LCD fell from 53,454 pixels over threshold 2 / mean RGB error
5.6194 to 6,194 / 2.6784375. Lower LCD differences remain 36,419 / 16.9315929.
The coordinator inspected the upper contact sheet: wallpaper is near-identical;
status/profile differences and title/icon/wrench edges remain. The pair still
fails whole-screen acceptance.

## Unresolved origin and next evidence

A screenshot phase constrains the current controller frame modulo 600. It does
not identify the last restart, resume, attachment or paused interval. The native
burst starts after HOME is already settled and has no matching controller-start
trace. Its wall-clock time and the Settings phase therefore cannot justify a
fixed offset or an automatic live origin correction.

The next evidence must tie native mode-0 entry or explicit Loop restart to a
monotonic update/capture timeline, distinguish resume from restart, and record
any paused or detached interval. AppQuit/AppRestart scheduling must be included
for return-to-HOME scenarios. Only then can the scene consume an owner-bound
background frame instead of console elapsed time. Until that event mapping is
established, retain the independent diagnostic phase and make no timing-parity
claim. This documentation-only result requires no application rebuild.
