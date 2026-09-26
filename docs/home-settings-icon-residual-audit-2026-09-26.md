# HOME Settings frame bracket and icon residual audit

This analysis uses coordinator production captures only. No UI session, runtime
transform, material or default was changed. Native target, source ownership and
fixed ROIs are in the [body localization](home-settings-body-localization-2026-09-26.md).

## Production frame trend

The inspected `capture.json` records retain date `2026-09-26T03:14:35.203Z`,
`elapsedMs=5616.666666666667` and the complete HUD97 source-pose sample. Each
banner sample explicitly couples yaw and skeletal frame to the requested
integer. Frames300/304/305/306/307/311 are `a6cc346` captures; frame309 is the
preserved `b5543c4` control. Settings renderer/model/animation/billboard code and
model JSON have no diff between those commits. HUD34 versus32 remains separate
from the banner results. Live HOME update counts differ, so the lower LCD is not
part of this pose comparison and no input/timing match is established.

| Frame | Upper pixels over 2 | Wrench | Icons | Title | HUD |
| --- | ---: | ---: | ---: | ---: | ---: |
| 300 | 2,576 | 691 | 1,850 | 3 | 32 |
| **304** | **1,883** | **4** | **1,847** | **0** | **32** |
| 305 | 1,990 | 61 | 1,844 | 53 | 32 |
| 306 | 2,424 | 172 | 1,870 | 350 | 32 |
| 307 | 2,831 | 364 | 1,868 | 567 | 32 |
| 309 | 3,563 | 709 | 1,925 | 895 | 34 |
| 311 | 4,323 | 793 | 2,151 | 1,347 | 32 |

Wallpaper remainder and upper footer stay at **zero pixels above2** in every
analyzed capture. Frame304's title maximum delta is2; wrench maximum is62 at
only four residual pixels. Icons account for **1,847 of1,851 body residuals**.
Their near-constant 1,844–1,870 count over frames300–307 is not resolved by the
same phase change that removes almost all wrench/title error. Frame304 is the
best measured control; no additional phase sweep is justified for the icon
problem without new evidence. This remains a diagnostic, not native timing.

## No common horizontal offset

The frame304 native/browser icon strips were inspected at4× nearest-neighbor
zoom. A fixed classification `max(R,G,B)-min(R,G,B)>40` measures colored artwork
inside five40×43 rectangles at x60/120/180/240/300, y133. This classification is
an analytic shape aid, not an acceptance mask or an exact mesh silhouette.

| Icon, left to right | Native colored centroid | Browser colored centroid | Unshifted ROI pixels over2 |
| --- | --- | --- | ---: |
| Green cards | (81.256,150.972) | (80.478,151.080) | 604 |
| Blue globe | (138.847,152.603) | (138.755,152.643) | 298 |
| Orange NNID | (199.501,152.727) | (199.853,152.840) | 216 |
| Pink figure | (261.471,152.417) | (261.471,152.435) | 219 |
| Yellow notes | (320.024,152.076) | (319.000,151.113) | 510 |

For **every icon**, exhaustive integer translation probes x−10…+10 and
y−1…+1 rank **(0,0)** best by full-rectangle pixels above2, then RGB mean error.
A common8px horizontal shift is contradicted by these measurements. The outer
two icons contribute1,114 of1,847 residuals and have the largest colored-shape
centroid differences. That does not authorize per-icon offsets: alpha shape,
projection and filtering all affect such centroids. The source projection
bracket also found essentially unchanged horizontal icon extent, and the exact
frame304 title pixels leave no evidence for a whole-banner transform change.

## Narrow source texture/alpha gap

Source `mt_pict` is **unlit** (`Flags=0`). Its active TEV stage replaces RGB with
`PrimaryColor` (the authored per-vertex color gradient) and alpha with
`Texture0` (`COMMON2`). Lighting adjustment therefore cannot directly repair
this artwork. The plate `mt_btn` uses `COMMON3` in its constant/texture color
combination and primary-color/texture alpha. Later active color does not depend
on a fragment-lighting color. Both use source-alpha blending.

Both samplers request linear magnification and `LinearMipmapNearest`
minification. Delivered Settings textures contain no `nativeMipCount` or
`mipmaps`. `createFirmwareBanner` does not enable `nativeMipmaps` for Settings;
`firmware-model.ts` consequently uses a base-level linear minification filter
with generated mipmaps disabled. The outer artwork UV spans approximately
47 texels of the128×128 atlas across roughly24 displayed pixels, making the
native mip state a relevant audit target. This does **not** prove an existing
native mip chain or that mip selection caused the residuals.

Native formats are COMMON2 **A4** and COMMON3 **LA8** (COMMON1/5 LA4, COMMON4 L8).
The current exporter `--mipmaps` path only supports ETC1/ETC1A4 and rejects these
formats. The next defensible step is to inspect original texture `MipmapSize`
and `RawBuffer` lengths, then preserve any authored levels if present. Do not
generate replacement mipmaps or change sampler behavior based on this still.
The assets lane owns that source audit. Atlas identity, sampling precision,
vertex interpolation, per-mesh alpha/depth and native mip state remain possible
causes; no broad scale, projection, lighting or transform fix is established.

## Reproduction and evidence

Production captures are under the private `captures-20260926/reference/scenario-matrix/v1/captures/`
root, named `home-settings-frame<frame>-hud97-a6cc346-20260926`; frame309 uses
`home-settings-hud-coin97-b5543c4-20260926`.
Analysis artifacts are private at
`/Users/paramveer/.codex/3ds-artifact-overflow/presentation/home-frame-bracket-production-20260926/`.
`analyze.mjs` accepts `FIT_BROWSER` and `FIT_OUT`; each numbered directory holds
`report.json`, `diff.png`, `contact.png` and numeric stdout. `icons304.mjs`
produces `304/icons-report.json` and `304/icons-4x.png` with exact classification
and all63 integer-shift scores per icon. Reference pixels are used only for
comparison; none replace source/browser pixels.

Frame304 report SHA-256:
`efa536de3e89723b77c67113860a3c606c502d179e9a4cace61963cef1c37a39`.
Frame304 icon report SHA-256:
`a8ddfb84e97224bca35de37a3de2dabb9974a2361f143c9d2bcd2f6efb8234aa`.
All totals reproduce coordinator upper scores; contact/difference images were
inspected, metadata checked, and `git diff --check` passes. No application
rebuild is needed for this evidence-only change.

## Source audit correction and visible relative-clock candidate

Assets audit `8257294` disproves lost mip levels and conversion corruption:
all five original TXOB records have `MipmapSize=1`, buffer lengths contain
exactly their base level, and original buffers decode byte-for-byte to delivered
RGBA. The earlier mip hypothesis is closed; changing mip filtering is not a
supported fix. `mt_pict`'s unlit vertex-RGB/texture-alpha path remains the next
isolated owner. The renderer's `Mirror` enum alias omission is real but Settings
plate U remains within0–1, where mirror and clamp sample equivalently; it is
not introduced as an explanation or fix here.

The coupled-frame sweep almost cancels external yaw with source `l_btn` rotation.
It therefore cannot test a **relative** clock difference. Holding yaw304 while
sampling COMMON302 moves the source outer quad centers right by0.906px and
0.878px. Those directions and magnitudes are consistent with, but do not prove
the cause of, the measured colored-centroid differences0.779px/1.024px. COMMON's
title bob also changes, so all three banner ROIs must be checked. Native clock
origins are unknown; an arbitrary runtime offset is not justified.

A minimal visible **verification candidate** is now wired through the existing
local LCD capture gate: `lcdBannerFrame=304&lcdBannerSkeletalFrame=302`.
Keep `lcdElapsedMs=5616.666666666667`, the captured date and HUD97 sample.
It selects the original source clip without editing geometry, atlas, material,
filtering, blending or live clock state. Metadata explicitly records independent
diagnostic clocks. The capture requires an active Settings primary and loopback;
values are integer0–599, and the separate skeletal frame requires an explicit
yaw frame. Both overrides restore after success or failure.

The coordinator's next action is to capture this one candidate against the
coupled304 control and score wrench/icons/title with wallpaper/footer regression
checks. No pixel improvement is predicted from geometry alone; if the candidate
does not improve the icon residual, preserve it as a failed diagnostic and retain
the remaining alpha/texture/interpolation or relative-clock behavior as a source
gap. Do not promote the independently sampled clocks to live behavior.

Private source projection evidence is
`presentation/home-source-frame-bracket-20260926/uncoupled-outer-projection.json`
under the overflow root, reproduced by the adjacent `.mjs`. It contains projected
quad centers at fixed yaw304 and COMMON298/300/302/304/306/308/310, with no GPU
raster or native pixel substitution. The visible candidate replaces further
source-only tracing for this named question. Focused tests verify query bounds,
local gating, recorded independent frames, live-state immutability and capture
restoration after successful/failed encoding. Browser evidence is pending.

## Visible yaw304 / COMMON303 result: 222 upper pixels

The coordinator's production `88719fb` capture
`home-settings-frame304-common303-hud97-88719fb-20260926` was inspected against
the same genuine native target. The lane was clean and reset to that integration
commit before this follow-up. Capture metadata confirms yaw frame304
(−3.183480739593506), COMMON303, `clockRelationship:independent-diagnostic`,
HUD97, date `2026-09-26T03:14:35.203Z` and elapsed5616.666666666667 ms. The
browser upper PNG SHA-256 is
`5cdf4105bd997c5593e56850d68a576674beacf2ec2d24b25121c202ed478704`.

The empty-mask whole-upper comparison has **222 pixels above2/255**, mean RGB
error0.0983819444 and maximum188. This improves the coupled304 capture's1,883
and the coordinator's COMMON302 diagnostic1,972. Exact residual ownership is:

| Component | Pixels above2 | Location / maximum error |
| --- | ---: | --- |
| HUD colon | 32 | Two4×4 blocks at `(339,6)` and `(339,12)`; maximum188 |
| Wrench | 3 | `(163,46)`, `(164,63)`, `(171,70)`; maximum54 |
| Green cards | 105 | Leftmost artwork/plate edges |
| Blue globe | 1 | `(135,150)`, red channel+3 |
| Orange NNID | 0 | Within threshold |
| Pink figure | 0 | Within threshold |
| Yellow notes | 81 | Rightmost artwork/plate edges |
| Title, wallpaper remainder, upper footer | 0 | Title/footer maximum2; wallpaper maximum1 |

The banner accounts for **190** residuals:187 icon pixels with maximum8 and
three wrench pixels. Icon ROI mean RGB error is0.1828903654. The isolated wrench
pixel `(164,63)` is native `[231,231,237]` versus browser `[214,212,183]`, a
background/contour disagreement. The other two wrench maxima are3. The
contact/difference image was inspected; no whole-banner position or palette
error remains in this diagnostic. None of the remaining pixels is masked.
Lower LCD differences remain separately reported by the coordinator and do not
supply evidence for this upper-banner clock decision.

### Why there is no live minus-one fix yet

The visible result supports testing a relative yaw/COMMON phase. It does not
establish a universal one-update offset. The source
[controller fixture](evidence/settings-banner-controller-clock.json) records a
start submission at frame0, advancing current frames1/2 before render dispatch,
and explicitly states that **submitted visible poses are unobserved**. Native
title-driven attachment/retarget, scheduling and CGFX pose submission were not
executed together. The browser's manager yaw and visible-scene clip updates have
independent owners; one still cannot distinguish activation origin, submission
order, current-versus-applied frame, or a sampled phase coincidence.

No live-clock offset, shader fit or pixel patch was added. The precise remaining
clock gap is the visible source COMMON submitted frame relative to manager yaw
through activation, settled updates, hide/re-show and wrap. A second visible
native/browser checkpoint with a recorded shared boundary and source submission
sequence is required before promoting this diagnostic relationship to runtime.
The existing independent capture override remains available for that comparison.
This finding does not declare an upper-LCD or motion/input/audio pass.

### Reproduction

The coordinator's original capture and diff are under private
`captures-20260926/reference/scenario-matrix/v1/captures/home-settings-frame304-common303-hud97-88719fb-20260926/`.
The analysis lives at
`/Users/paramveer/.codex/3ds-artifact-overflow/presentation/home-frame-bracket-production-20260926/yaw304-common303/`:
`report.json`, `diff.png`, `contact.png`, `pixels.mjs` and `pixels.json`.
The latter lists all222 coordinates and native/browser RGB values.

Report SHA-256: `eed56951e91b10239ada97cf1623f4d39b66c827765d8e13c0f15afa6896f9f7`.
Pixel list SHA-256: `9c81ecf21f51c23fc4e9cb1ad884a6d6c76920603271685772ac15092ca51fc7`.
Focused HOME lifecycle, Settings activation and source-contract tests:
**23 pass, 0 fail, 1 existing TODO** (real-candidate matched-frame comparison).
`git diff --check` passes. This follow-up is evidence only; no application
rebuild or runtime modification is needed.
