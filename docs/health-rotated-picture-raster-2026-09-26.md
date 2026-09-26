# Health moving edges: sample the source texture once

This slice starts at `81845d9`. The genuine native Health screenshot at
`/Users/paramveer/.codex/3ds-artifact-overflow/reference/screenshots/Health and Safety Information_26.09.26_03.38.27.536.png`
has SHA-256 `a32e2a00cd8a60e9fbf8f355dffdc2d33ed7b3e704e5c5b33b120d3ce441a809`.
Its source TopLoop pose is frame 351/711. The preserved production browser
pair uses frame 350/710 and differs at 459 upper pixels above 2/255; matching
the source frame alone leaves 216 upper pixels, with maximum channel error 6.
All lower pixels remain within 2/255.

## Correction

The existing renderer first samples a picture into a pane-sized RGBA canvas,
then asks Canvas to rotate/scale that already sampled image. That introduces a
second filtering and coverage stage. Health's residual lies on the transformed
edges of its moving pictures. A bounded diagnostic instead inverted each pane
transform at LCD pixel centres and evaluated the original texture, primary
color, material and blend once. At source frame 351, this removed every
above-threshold pixel without moving a vertex, changing a resource key, or
replacing any artwork.

`native-layout.ts` now supports an affine destination-to-pane mapping for
picture rasterization. Pixels outside the source pane receive no fragment.
`native-renderer.ts` uses it for rotated pictures only when the target rectangle
is opaque, global alpha is one and the color blend is ordinary source-over.
Unrotated pictures, text, other blend modes and nonopaque targets retain their
existing paths. The compositor preserves the current Canvas clip when publishing
the result. A reusable scratch surface is bounded by LCD dimensions and is
released on renderer disposal. No per-pixel arrays or temporary per-picture
Canvas allocation remains in this path.

The source materials and sampler flags are unchanged. The pipeline correction
is general; it has no Health frame, pane-name, color, coordinate patch or
reference-image dependency. It does not claim full PICA precision emulation or
validate arbitrary untested transforms.

## Native resource provenance

The visible moving shapes map to manifest key
`packs/health-and-safety/bg.json`, title `0004001000022300`, version 3077,
content index 0, pinned EUR 10.7.0-32E, converter `ctr-native-web` 1.2.0:

| CIA-internal RomFS resource | SHA-256 |
| --- | --- |
| `bg_LZ.bin/blyt/Bg_U_00.bclyt` | `5826095e575969d981da5b6d48e2fa970759b906e2103d130bf2a2a00b32839c` |
| `bg_LZ.bin/anim/Bg_U_00_TopLoop.bclan` | `c0fa9a144892bf146eedf53edd34ba13edc9622294a8ad2fbe38c5024f402ff6` |
| `bg_LZ.bin/timg/safe_00.bclim` | `3b39b6bcd0e176deb13ed1d2770ddfaa841ee52c725f192b5bda8880f9255dbb` |
| `bg_LZ.bin/timg/safe_10.bclim` | `4d6483b055cc4836a641ea0ab25a636b66d8a4013a7684cbd31e820bee8c42c9` |

No native resource or converter output changed. The fitted TopLoop origin and
reduced-motion behavior remain the explicit adaptations described in the
[clock/phase note](health-toploop-phase-fit-2026-09-26.md); this raster correction
does not supply native launch timing.

## Evidence and regression

Private scripts, source hashes, PNGs and reports are retained under
[health-raster-edge-audit](/Users/paramveer/.codex/3ds-artifact-overflow/presentation/health-raster-edge-audit/final/browser-health-fit.json).
These are current-code **offline source renders versus genuine native PNGs**,
not new production browser captures. The final upper/native images were visually
inspected.

| Genuine native target / aligned source pose | Before >2 | After >2 |
| --- | ---: | ---: |
| 03:38:27.536 / frame 351 | 216 | **0** |
| Earlier `health-entry` / frame 15 | 203 | **0** |
| 03:48:14.668 / frame 198 | 258 (coordinator production) | **0** |

The frame-198 before count is the coordinator's matched-frame production
capture at `b998db7`; its after count here is still an offline source render.
Frame 351's RGB MAE is 0.070167; frame 15's is 0.071153 with maximum error 2.
Zero over-threshold pixels does not mean byte identity. All eight Health lower
source renders remain byte-identical, including entry and article/scroll views.
All 100 Settings verifier PNGs remain byte-identical. Both Settings source
assertions and the Health lower scroll/coverage assertions pass.

The focused raster, material/presentation, renderer, Health and paired-cache
suite reports 113 passed, zero failed, two optional skips. TypeScript and
`git diff --check` pass. The new affine test compares destination samples with
independent scalar texture/material evaluation, checks uncovered quad corners,
and verifies that a clipped output rectangle preserves pixel-centre coordinates.
GPU shader checks are not implicated: this change is CPU LCD rasterization.

## Bounded performance check

Using the same local Node 22 / `@napi-rs/canvas` runner, each version warms 20
upper frames then times 120 consecutive changing poses (source frames 180–299).
Timing includes layout posing, rasterization and composition, and excludes
asset loading, PNG encoding and diffing. Runs are sequential against the same
assets. The baseline is `81845d9`; the final path includes scalar blending and
scratch-surface reuse. Raw samples are retained in `perf-before/performance.json`
and `perf-reused/performance.json`.

| Offline upper paint | Mean ms | Median ms | p95 ms | Max ms |
| --- | ---: | ---: | ---: | ---: |
| Baseline | 4.137 | 3.619 | 8.400 | 12.805 |
| Corrected | 4.872 | 4.651 | 6.140 | 11.712 |

Mean cost rises about 0.74 ms; both bounded runs fit the 16.715 ms period at the
existing 59.826 Hz Health clock. These are CPU source-render measurements, not
a browser frame-rate guarantee. The initially allocating prototype exceeded the
budget and was replaced before handoff.

The coordinator must recapture production at the aligned Health-local pose.
The existing production 459/0 pair is unchanged until then. Matched input,
native animation timing and audio acceptance remain open; the frame-origin
adaptation remains. No browser or Azahar session was operated by this lane.
