# HOME Settings body residual ownership

This read-only diagnostic localizes the coordinator's production `b5543c4`
source-pose capture. It changes no runtime state, material, projection or timing.
The genuine native `_26.09.26_04.14.35.203.png` is the same unscaled 400×240
upper target as the [HUD fit](home-hud-source-pose-fit-2026-09-26.md).

The browser input is private
`/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260926/reference/scenario-matrix/v1/captures/home-settings-hud-coin97-b5543c4-20260926/browser/upper.png`.
Its capture JSON records synthetic Settings source frame 309, skeletal frame309,
yaw −3.2358405590057373 and presentation time 5616.666666666667 ms. The live
host was at frame481; the capture is explicitly a source-pose sample, not a
native timing match. HUD uses the recorded coin97 profile.

## Exact disjoint localization

No alignment, resizing or mask is applied. A pixel differs when any RGB channel
exceeds 2/255. Rectangles are `[x,y,width,height]`; the wallpaper remainder is
all pixels outside the five other rectangles.

| Region | Rectangle | Pixels over 2 | Mean absolute RGB delta | Maximum |
| --- | --- | ---: | ---: | ---: |
| HUD | `[0,0,400,28]` | 34 | 0.223631 | 188 |
| Wrench | `[140,32,110,101]` | 709 | 0.787819 | 123 |
| Five-icon row | `[60,133,280,43]` | 1,925 | 2.699889 | 219 |
| System Settings title | `[80,176,245,36]` | 895 | 1.049546 | 20 |
| Bottom upper-screen chrome | `[0,212,400,28]` | **0** | 0.104583 | 2 |
| Wallpaper remainder (41,630 pixels) | Complement | **0** | 0.047666 | 1 |

The three Settings content rectangles sum to **3,529**, exactly all body
residuals below y28. Including the separate HUD colon gives **3,563**.
The difference image was inspected: wrench errors follow contours and the hole;
icon errors occupy the faces and edges of the five source tiles; title errors
follow the glyphs. Large flat regions do not show a global brightness offset.
The rectangles include some background and are localization aids, not isolated
mesh acceptance masks. Footer and wallpaper are within threshold for this
single sample, not proven across other frames.

## Source ownership and next bounded gap

All three body components belong to `models.settingsBanner` →
`models/settings-banner/model.json` → Settings title `0004001000022000`
`exefs/banner.bin`. Decoded CGFX SHA-256:
`96ea28f70671cf2b62aded3e3ef203cdf365929ae9422798255c628499c0910d`;
CBMD SHA-256:
`5804ba5a7768d2ae9b7487e4d277923502646d89768668b19d666e3e4d30fbac`.
The delivered `COMMON` model has 12 meshes:

| Component | Zero-based mesh indices | Material / native texture |
| --- | --- | --- |
| Wrench | 11 | `mt_spanner` / `COMMON4` (64×64) |
| Icon plates | 3, 5, 6, 8, 9 | `mt_btn` / `COMMON3` (16×64) |
| Icon artwork | 2, 4, 7, 10 | `mt_pict` / `COMMON2` (128×128) |
| Title | 0; auxiliary quad1 | `mt_title` / `COMMON1` (512×64); `mt_title256` / `COMMON5` (8×8) |

The title is source texture artwork, not HOME's bitmap-font text. All five
materials declare linear magnification and linear/mipmap-nearest minification.
The source 600-frame `COMMON` skeletal clip animates `p_title.TranslationY`
(bob) and `l_btn.RotationY` (turn); `p_title` additionally uses native billboard
mode1. Thus choosing a close wrench silhouette does not establish the native
subpixel title position or icon transforms. No native frame counter identifies
those values in this capture.

The **next precise gap** is Settings COMMON source-pose versus raster agreement,
especially the 1,925 icon pixels and 895 title pixels. A controlled source-frame
bracket around309, retaining this exact wallpaper/HUD/camera, should score
these separate regions and record the submitted `p_title`/`l_btn` transforms.
If no source pose resolves them, inspect those same mesh projections and native
texture sampling before changing shaders. The title's maximum20 and edge-local
residuals do not establish a lighting defect; the icon maximum219 does not by
itself distinguish pose edges from texture filtering. There is no justified
runtime fix from this pair alone. Wallpaper, whole-screen palette, footer and
bitmap-font edits are unsupported by these observed body residuals.

## Private report

Artifacts live under
`/Users/paramveer/.codex/3ds-artifact-overflow/presentation/home-body-localization-20260926/`:
`analyze.mjs`, `report.json` (input hashes, exact ROIs, signed/absolute statistics,
8-connected component bounds), `diff.png` and `contact.png` (native/browser/diff).
Run `node <directory>/analyze.mjs` to reproduce. Numeric totals and contact sheet
were checked; `git diff --check` passes. Documentation only, so no application
rebuild is needed. Production validation remains with the coordinator.

Report SHA-256: `08e6e984daa1169ee322156e478c18ff112937690683eaec7e34679b96586b3d`.
Browser PNG SHA-256: `06015f7c7e4b59e52c8edebcea319479466cc250f7fc55173bd81491b156b5bf`.
Delivered model JSON SHA-256: `908b4dbe6ef22bbf3c47d37e9ed512ea6a37654afd0f1db611f3d4f68c5e93e1`.

## Source geometry bracket around frame309

A subsequent offline check samples the delivered COMMON geometry with the actual
`createFirmwareModel`, `createFirmwareCamera`, skeletal curve and billboard
code. It uses scale1, zero offsets/displacement, and the source float32 yaw
formula, then projects indexed mesh vertices into 400×240 coordinates. It
samples 307, 308, 308.5, 309, 309.5, 310, 311 and 312. No browser or Azahar was
operated. The coordinator explicitly retained GPU pixel scoring in its CUA
capture lane; this analysis does **not** rasterize the shader or predict a
replacement 3,529-pixel score.

| Coupled yaw/skeletal frame | Title mean Δy from309, pixels | Icon mean Δy, pixels | Wrench maximum vertex displacement, pixels |
| --- | ---: | ---: | ---: |
| 307 | +0.03575 | +0.03564 | 0.34651 |
| 308 | +0.01955 | +0.01949 | 0.17507 |
| 308.5 | +0.01020 | +0.01017 | 0.08799 |
| 309 | 0 | 0 | 0 |
| 309.5 | −0.01106 | −0.01103 | 0.08891 |
| 310 | −0.02299 | −0.02293 | 0.17875 |
| 311 | −0.04952 | −0.04937 | 0.36120 |
| 312 | −0.07966 | −0.07942 | 0.54741 |

The source `p_title.TranslationY` sample is −7.2468363275 at309 and
−7.2418843142 at311. The parent billboard preserves its screen-facing title
quad while this curve changes vertical placement. For icons, the source
`l_btn.RotationY` almost cancels the external yaw: at309 the angles are
+3.2358813653 and −3.2358405590. Across307–312 the full icon envelope changes
horizontally by less than0.00004px. Thus this small phase bracket can test
vertical sampling and wrench orientation, but it does not provide a meaningful
icon-width adjustment. The title quad includes transparent texture space;
projected vertex bounds are not the visible glyph bounds.

**Recommended production probes: 307, 308, 309, 310, 311**, with the same
`elapsedMs=5616.666666666667`, date and HUD97 sample as the preserved baseline.
Score the wrench/icon/title rectangles separately and retain wallpaper/footer
checks. Frame309 is the existing control. No candidate is declared better
without these actual pixels. The fractional values are geometry probes only:
the current capture query accepts integers, and this analysis does not change
that API or assert a fractional native update. If the best tested integer is
an endpoint, use its neighboring source frame in a follow-up rather than
introducing a guessed geometry/material adjustment.

This bracket preserves the source relationships between pose channels. A
fractional source-pose fit, even if later enabled for diagnostics, would still
not establish native host clocks or matching animation entry inputs. GPU
triangle coverage, depth, texture filtering/mip selection and composition are
not evaluated by projected vertex movement, so these numbers cannot establish
that any of the current 709/1,925/895 residuals are resolved.

Private artifacts:
`/Users/paramveer/.codex/3ds-artifact-overflow/presentation/home-source-frame-bracket-20260926/`
contains `project.mjs`, compiled source snapshots, `report.json` and
`stdout.json`. The report retains source file hashes, delivered model hash,
curve samples, projected bounds and vertex-displacement statistics by component
(title and auxiliary quad are separate). Run `node <directory>/project.mjs`.
Report SHA-256:
`6d16e2eb6dffc3f0816b67a47f208fe0d0a978bb05f63c033f20f684b173b2c6`.
The script completes for every sample and frame309 has zero displacement against
itself; `git diff --check` passes. No runtime change is justified by this check.
