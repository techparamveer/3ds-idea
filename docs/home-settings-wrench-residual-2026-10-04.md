# HOME Settings wrench residual — 4 October 2026

> **Superseded (4 October 2026, `dde43424`).** These residuals were measured at banner yaw 310 / COMMON 309, a worse local optimum. With wallpaper and cursor frozen, yaw 304 / COMMON 303 gives 190 upper pixels (title 0, wrench 3, icons 187). See [yaw re-search](home-settings-yaw-research-2026-10-04.md). The source-gap and ownership claims below do not hold for this still.

No runtime change. Follows the [skeletal search](home-settings-banner-skeletal-2026-10-04.md)
at frozen yaw 310 / COMMON 309 / Loop 338. Native still
`_26.09.26_04.14.35.203.png` (SHA-256
`4adc0ef0cbba7175b641fbe4107f697f15ff7a4aadd482c746e389ea7abf5bdb`).

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-hud-profile-20261004/`.
Inspected `R/diff-yaw310-common309/upper-contact-sheet.png` (SHA-256
`babc06e04b94e93cccc97220412aec404b734c5f1d70d3da9d45c657144d9bf4`)
and the skeletal-refine report (`R/skeletal-refine/`, upper SHA-256
`f87ccd3476f5312e938bf87d6b1bb1675181a645d01902ca8d217d6182906a65`).
Empty mask, threshold 2/255. Whole LCDs **2,900 / 13,522**.

COMMON 309 at yaw 310 is the same yaw−1 class as the older yaw304 / COMMON303
diagnostic. Source
[controller clock](evidence/settings-banner-controller-clock.json) still
records that **submitted visible poses are unobserved**. Do not adopt a live
yaw−1 or COMMON−1 default. The independent capture override stays available.

## Residual ownership

HUD `[0,0,400,20]` is 0 over 2 (max 2). The 2,900 upper pixels sit in three
disjoint body rectangles and sum exactly:

| Region | Rectangle | Over 2 | Max | Owner |
| --- | --- | ---: | ---: | --- |
| Wrench | `[140,32,110,101]` | 792 | 131 at `(150,57)` | mesh 11 `mt_spanner` / `COMMON4` on `polySurface1` |
| Icon strip | `[60,133,280,43]` | 1,298 | 38 | `mt_pict` / `COMMON2` plus plates `mt_btn` / `COMMON3` |
| Title | `[80,176,245,36]` | 810 | 15 | meshes 0–1 `mt_title` / `COMMON1`, `mt_title256` / `COMMON5` |

Per-tile icon strip: green cards 335, yellow notes 314, blue globe 277, orange
NNID 202, pink figure 170. The outer pair is the largest per-tile count; the
inner three still contribute. The search wrench ROI `[140,21,116,142]` (1,106)
overlaps the icon row and is not wrench-only.

The contact sheet and heatmap show a wrench silhouette halo, not a wrong
wrench angle. The max-131 pixel is native wrench metal `[135,132,112]` versus
browser wallpaper `[238,238,243]`: coverage / contour, the same class as the
older `(164,63)` gap. Icon residuals stay on the artwork faces and plate
edges. Title residuals follow glyph edges.

Lower residuals stay the labelled Sound / Health portfolio neighbors.

## Source bind / pane / texture / blend

Published `models/settings-banner/model.json` (SHA-256
`908b4dbe6ef22bbf3c47d37e9ed512ea6a37654afd0f1db611f3d4f68c5e93e1`) still
matches the [body localization](home-settings-body-localization-2026-09-26.md)
and [edge source gap](home-settings-banner-edge-source-gap-2026-09-26.md):

| Element | Mesh | Bone | Material | Texture key | Blend |
| --- | ---: | --- | --- | --- | --- |
| Wrench | 11 | `polySurface1` (child of `p_title`, not `l_btn`) | `mt_spanner` | `COMMON4` → `texture-3.png` | One / Zero |
| Icon artwork | 2, 4, 7, 10 | `p_inner_b`, `p_inner_f`, `p_nn_f`, `p_outer` | `mt_pict` | `COMMON2` → `texture-1.png` | SourceAlpha / OneMinusSourceAlpha |
| Icon plates | 3, 5, 6, 8, 9 | matching `l_btn` children | `mt_btn` | `COMMON3` → `texture-2.png` | SourceAlpha / OneMinusSourceAlpha |

`loadFirmwareModel` keys images by TXOB name; Settings construction already
rejects an unbound `TextureNName`. Wrench already uses
`nativeSphereMapping` for `CameraSphereEnvMap` / source 4. There is no
visibility clip. Layer 0 wrench under layer 1 icons is the authored order.
Contact-sheet icon hues match the atlas (cards / globe / NNID / figure /
notes), so this is not a swapped texture key.

`mt_pict` remains unlit (`Flags=0`): RGB from vertex primary, alpha from
`COMMON2`. Sampler / mip / `Mirror` were already closed for this artwork
([mip audit](settings-banner-mip-audit-2026-09-26.md); plate U stays in
`[0,1]`). Do not invent those fixes. The rejected compositing A/B of 3
October does not apply a new candidate here.

No source-justified non-clock bind, pane, texture-key or blend change is
available from this pair. Geometry / raster coverage, interpolation and the
unobserved submitted COMMON pose remain the open gap.

## Remaining

Wrench-edge coverage, `mt_pict` icon faces (outer pair largest), title glyph
edges, portfolio tiles, WalkCoin fade, motion and audio remain open.
Whole-scenario 1:1 still fails. Matrix unchanged. No Azahar launch. No
production preview. Coordinator recapture is not required for this
documentation-only slice; a later runtime change should reuse this named
pose (yaw 310 / COMMON 309 / Loop 338, empty mask, same native still) rather
than a new clock sweep.
