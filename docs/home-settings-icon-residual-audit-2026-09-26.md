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
