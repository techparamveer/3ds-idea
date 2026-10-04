# HOME Settings outer-icon `mt_pict` source gap — 4 October 2026

HOME-lane source-only slice after the [skeletal search](home-settings-banner-skeletal-2026-10-04.md).
No runtime, sampler, mip, Mirror or lighting change. No guessed unlit path.
The yaw310 / COMMON309 diagnostic remains fail; this finding does not
establish pixel, timing, input or audio acceptance. Whole-scenario 1:1 still
fails.

## Target

Coordinator pair `R/diff-yaw310-common309/` under private
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-hud-profile-20261004/`.
Frozen yaw 310 / Loop 338 / COMMON 309, empty mask, threshold 2/255, runtime
`eee00031`. Native still `_26.09.26_04.14.35.203.png`. Inspected
`R/diff-yaw310-common309/upper-contact-sheet.png`.

| Identity | SHA-256 |
| --- | --- |
| Native PNG | `4adc0ef0cbba7175b641fbe4107f697f15ff7a4aadd482c746e389ea7abf5bdb` |
| Browser upper | `f87ccd3476f5312e938bf87d6b1bb1675181a645d01902ca8d217d6182906a65` |
| Upper contact sheet | `babc06e04b94e93cccc97220412aec404b734c5f1d70d3da9d45c657144d9bf4` |

Whole LCDs **2,900 / 13,522**. HUD and upper footer are 0 over 2 (max 2).

## Provenance (already recorded)

Element → manifest key → dump path → SHA, from `public/os/firmware/10.7.0-32E/manifest.json`
and `models/settings-banner/model.json`. Firmware EUR 10.7.0-32E, Settings
`0004001000022000`, version 9220, content index 0 / ID `0000003d`.

| Element | Source binding | Manifest key | Dump source | SHA-256 |
| --- | --- | --- | --- | --- |
| Card / globe / NNID / figure / notes artwork | `mt_pict` / COMMON2 (128×128 A4) | `models.settingsBanner` → `resources["models/settings-banner/texture-1.png"]` | title `0004001000022000` `exefs/banner.bin` | `30210ac601a78d152ceb438cb3b9c1681cd75c156fb5bfd2d4a3ac19015e69a3` |
| Settings COMMON model | meshes 2, 4, 7, 10 | `models.settingsBanner` → `resources["models/settings-banner/model.json"]` | same `exefs/banner.bin` | `908b4dbe6ef22bbf3c47d37e9ed512ea6a37654afd0f1db611f3d4f68c5e93e1` |
| Banner.bin / CBMD | EUR-English common slot 0x88 | model `compressedSourceSha256` / `cbmd.cbmdSha256` | `exefs/banner.bin` | `5804ba5a7768d2ae9b7487e4d277923502646d89768668b19d666e3e4d30fbac` |
| Decoded CGFX | `sourceSha256` / `cbmd.cgfxSha256` | same model | decompressed COMMON CGFX | `96ea28f70671cf2b62aded3e3ef203cdf365929ae9422798255c628499c0910d` |
| COMMON2 original TXOB buffer | A4, `MipmapSize=1` | [mip audit](settings-banner-mip-audit-2026-09-26.md) | CGFX buffer at `0x1e200` | `71c7eb4904c59f96b71d0fb0f07855b331e41125fbfa8843eedc0639ba993bc0` |

Converter ctr-cgfx-web 1.4.1, SPICA `bd29a7828595d7839cda2ac61c76bb63f9071250`;
wrapper SHA-256 `bd70d8e8aa34191011d38e726c9105c625a8fc72cdfda866df940c5726138a90`,
exporter SHA-256 `0a450efe7fbdba7a3bda05635c7abe9448080b719f9703e728efd46cc189a7d4`.
Neighbor plates (`mt_btn` / COMMON3 / `texture-2.png`) and the wrench
(`mt_spanner` / COMMON4 / `texture-3.png`) keep the hashes in the
[26 September edge gap](home-settings-banner-edge-source-gap-2026-09-26.md).
They are not unused `mt_pict` binds.

## Already-bound unlit path (no unused key)

Delivered `mt_pict` already binds Texture0 = COMMON2. `Texture1Name` and
`Texture2Name` are empty dummy mappers (scale 0), not alternate artwork.
Active TEV stage 0 replaces RGB with `PrimaryColor` (authored per-vertex
gradient) and alpha with `Texture0`. Stages 1–5 are pass-through Replace of
`Previous`. `MaterialParams.Flags` and `FragmentFlags` are `"0"`; `BumpMode`
is `NotUsed`. Icon artwork meshes store vertex colours and zero normals.

The live Settings banner already constructs that model through
`createFirmwareModel` with overlay coverage and sphere mapping. Sphere mapping
does not apply: `mt_pict` coords are identity `UvCoordinateMap`. TEV never
samples `FragmentPrimaryColor`, so the generated lighting code is unused by
this material. `Flags="0"` is not a lighting gate in `cgfx-lighting.ts`;
honouring it, or skipping unused LUT lighting, would not change these
combiners. Sampler mip state and `Mirror` on `mt_btn` remain closed by the
[mip audit](settings-banner-mip-audit-2026-09-26.md) and
[edge gap](home-settings-banner-edge-source-gap-2026-09-26.md). There is no
source-identified unused bind to wire for this residual.

## Still-non-native pixels (yaw310 / COMMON309)

Exact empty-mask RGB>2/255 counts on the published pair, using the
[body-localization](home-settings-body-localization-2026-09-26.md) rectangles.
The five-icon row includes `mt_pict` artwork and `mt_btn` plates together.

| Region | Rectangle | Pixels over 2 | Max |
| --- | --- | ---: | ---: |
| Whole upper | `[0,0,400,240]` | 2,900 | 131 |
| HUD | `[0,0,400,28]` | 0 | 2 |
| Wrench (`mt_spanner`) | `[140,32,110,101]` | 792 | 131 |
| Five-icon row | `[60,133,280,43]` | **1,298** | 38 |
| Green cards (outer left) | `[60,133,40,43]` | 335 | 38 |
| Blue globe | `[120,133,40,43]` | 277 | 17 |
| Orange NNID | `[180,133,40,43]` | 202 | 32 |
| Pink figure | `[240,133,40,43]` | 170 | 17 |
| Yellow notes (outer right) | `[300,133,40,43]` | 314 | 35 |
| Title (`mt_title`) | `[80,176,245,36]` | 810 | 15 |
| Upper footer | `[0,212,400,28]` | 0 | 2 |
| Wallpaper remainder | complement | 0 | — |
| Lower LCD | 320×240 | 13,522 | 255 |

The skeletal search's named Icons metric is 1,471 (a larger scoring ROI on the
same pair). The contact sheet shows the outer two tiles as the strongest
`mt_pict` edges; all five strips stay over threshold at this diagnostic pose.
The independent yaw304 / COMMON303 pair previously left 187 icon pixels
(green 105, yellow 81, globe 1) after orange/pink/title went to zero; that
narrower leftover is the same unlit artwork path, not a new missing texture.

## Remaining unexplained

- `mt_pict` raster: vertex-colour / A4-alpha coverage, native interpolation
  and overlay compositing versus this still. No matched native fragment trace.
- Wrench contour (`mt_spanner`, 792 px, max 131) — separate material.
- Title bob (`mt_title`, 810 px) at COMMON 309 versus the native still.
- Lower 13,522 labelled portfolio neighbors.
- Native COMMON/yaw epoch, motion and audio. Do not adopt yaw−1 as a live clock.

Status: **source-gap**. Matrix unchanged. No Azahar or production preview
(`127.0.0.1:3021`) was operated.
