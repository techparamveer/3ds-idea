# Retained tile touch painting

2026-09-23. `firmware-presentation.ts` and `screens.ts` now consume the retained
`HomeTilePose` writer under the [tile-touch contract](home-tile-touch-contract.md).
The authority for widget/controller behavior is
[GRID_STYLUS_EVIDENCE.md](../scripts/firmware/GRID_STYLUS_EVIDENCE.md), whose frozen
43-case report has SHA-256
`66b6f7fc4ae96bd03b531449e9f65a51ef1ca28d035ff1c9693bcd74cffe2174`.
This painter does not implement or advance that controller.

## Resource offset

`NativeHome.tilePressOffset(pose, density)` accepts the last actual writer
`{ clip: 'select' | 'decide', frame: number }`; null/undefined returns0. It samples
the actual bound `LncIconDist_01_Select` or `LncIconDist_01_Decide` track targeting
`P_IconBtnDmy_00.translation.y`. It does not bind both retained controller frames
and does not reuse primary-cursor Select. Nonfinite inputs are rejected; finite
frames use the presenter's ordinary non-looping resource clamp.

The source resources retain duplicate-frame keys, so incoming fractional frames
and the exact terminal frame differ:

| Writer | Native local Y | Resource/current assembly Y offset |
| --- | --- | --- |
| Select0, including fractions below1 | 0 | 0 |
| Select1 | −2 | +2 |
| Decide0, including fractions below1 | −2 | +2 |
| Decide1 | 0 | 0 |

This LCD sign/scale was checked through the layout ancestry. `P_IconBtnDmy_00`
is a direct child of identity `RootPane`. `LncIconDist_01` has no Scale clip.
Its icon picture is a descendant, while `B_Icon_00` is an unaffected sibling.
Density-dependent child sizing and the separately assembled SetSrc/Folder plate
scales do not multiply the animated parent's own translation. Therefore the
current resource path yields the same +2 offset at integer and fractional
densities0–5. The sampler applies actual ancestor scale/rotation using the
renderer convention instead of hardcoding that result. Target/descendant scales
and ancestor translations do not scale a translation delta.

This is a displacement in the present LCD assembly before any external Canvas
parent transform. The existing folder-close parent is still applied normally
around the assembled tile, so its final device-pixel displacement can differ.
The frozen native audit did not execute matrix/child propagation or GPU raster,
and the resources do not establish extra transforms applied by the native
runtime. This change does not claim two physical/browser pixels at every native
density or during arbitrary lifecycle transformations.

## Assembly and cursor behavior

With native assets and `System.homeControls`, each visible tile reads only
`homeControls.tilePoses[tile.index]` for the active container. The sampled offset
moves its plate, first-character glyph, portfolio artwork and vacancy assembly
consistently. The original hit geometry, slot position and retained primary
cursor remain fixed. An immediate browser `pressed` flag cannot advance Select
or override the retained writer; a released tile can still display Decide0.
Repeated paints and elapsed milliseconds never change the pose.

Fresh root capture explicitly ignores the active child's tile-pose map, avoiding
cross-container reuse. The existing folder-close parent/alpha path remains
around the assembled draw. Reduced motion still samples the retained tile pose;
its separate primary Loop0/effects-omitted policy is unchanged.

Ordinary grid `press` preserves retained primary/effect drawing, with primary
Select left at0. The separate authored grid `scroll`/`drag` routes retain their
suppression policy. Chrome presses, including disabled density controls, retain
their previous behavior. Missing native assets and legacy callers without
controls keep the existing immediate contact offset and fallback cursor path.

## Validation and limits

Focused tests cover actual resource ancestry/groups and duplicate endpoints,
11 integer/fractional densities, synthetic ancestor-vs-descendant transform
controls, missing bindings, validation and read-only sampling. The actual folder
presenter places its plate and generated first-character layer at the same
translated center, without animating the glyph again. Real screen-painter tests
cover app plate/artwork alignment, vacancies and unaffected neighbors, contact
versus retained frames, fixed hit/cursor geometry, root capture, close/reduced
drawing, ordinary press visibility and both legacy/missing-asset fallbacks.

The six focused suites are `native-tile-pose`, `native-home-controls-paint`,
`native-cursor-presentation`, `home-density-controls`, `home-cursor-presentation`
and `home-primary-cursor`. All **61 tests passed with no skips**, and
`npm run typecheck` passed. Logs are under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/presentation/tile-touch-paint/`.

Only the two painter files, focused tests and notes are changed. Root owns pose
population, input ordering, lifecycle reset, System/scene wiring and browser
verification; runtime owns the widget/controller. No browser/Azahar session,
public conversion or asset edit occurred. Resource and recorded draw checks do
not establish browser pixel parity or the unexecuted native matrix boundary.
