# Camera browse thumbnail cells — 5 October 2026

HOME-fidelity Camera worker on `codex/camera-browse-thumbs-20261005` from
fidelity `9e335f3a`. One leftover: the two large lower-LCD browse
thumbnail cells. No Azahar. No production browser. No preview 3021. No
CDP. No recapture. Capture stays inert. Date pane **1006**, slider
**1992**, Settings third **630**, photo crop **33522**, gallery
selection, Welcome, and Sound were not retuned.

This is not a 1:1 claim. The painter now binds the dump clip that owns
the white frame. Tests and this note do not close pixels, input, motion,
or audio. The cursor on the wrong cell remains the gallery-selection gap.

## Assigned still

Frozen native combined PNG
`reference/scenario-matrix/v1/captures/camera-populated-browse-global/native/combined.png`
SHA-256 `cae793c31bdf9f13d44f0834582bf99fead5bb8d652321913993bedde7ae1652`.
Native lower is crop `(40,240,320,240)`. Browser lower after the Settings
X-scale recapture:

| Item | SHA-256 |
| --- | --- |
| Browser lower | `3f5ead625db013831b6a47af7648202865811d5ec6982b2f10b2e98ad59fc169` |
| Report | `468e6340389f8e0d74b577c9df0a0f004698dc4733d759aea29f8dc5ef43b34e` |

Empty mask `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.
Threshold any RGB channel >2/255. Whole lower **10158**.

| Component | Rectangle | Count | Grid centre |
| --- | --- | ---: | --- |
| Right thumb | `[201,46,70,56]` | **2763** | `(236,74)` |
| Middle thumb | `[125,46,70,56]` | **2720** | `(160,74)` |

Both centres are the large 2×3 `BB-Thmb` cells (`62×48`) from
[camera-grid-source-audit.md](camera-grid-source-audit.md). The date cell
at `(84,74)` is the **1006** pane and is out of scope. The bottom row of
the same grid already matches inside the threshold.

## Dump owner

The opaque frame is `P_Thmb_Pho2x3.bclim`, not the grey
`P_Thmb_Pho2x3_SD.bclim` the painter was binding.

`ThmbMask` is `66×52` at layout translation `(1,−1)`. Placed on a cell
centre that is lower canvas `(128,49)` for the middle thumb and
`(204,49)` for the right thumb. The white texture's 816 fully opaque
texels match the middle native cell **816/816**, exact, and every ±1 px
shift is worse. The grey texture matches that cell **0/816**. The right
native cell matches the same white texels **600/816**; the other 216 are
the red cursor `(101,0,0)`, which is the gallery-selection gap. The
browser's unselected right cell matches the grey texture **816/816**.

No other published `66×52` thumbnail matches those 816 white texels.
`P_Thmb_Date2x3` matches 518. `P_Thmb_Mov2x3` matches 48. The grey SD
frame matches 0.

`P_BrwsPic_PicL_SD` is the only large photo clip whose frame 0 selects
that texture. Its `ThmbMask` pattern track is step, frame 0 value **1**,
and texture index 1 is `P_Thmb_Pho2x3.bclim`. `P_BrwsPic_PicL` frame 0
stays on pattern 0, `P_Thmb_Pho2x3_SD.bclim`. `PicM_SD` / `PicS_SD` frame
0 select the smaller white textures, not this `66×52` image.

EUR Camera `0004001000022400` v4097, content index 0 / `0000001a`, image
base `0x100000`. Private executable
`contents/0000-0000001a/exefs/code.bin`, SHA-256
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`.

`0x2556e4` loads the image word at `+4` and keeps bits 0–1. The cell
writer `0x2da338` compares that value with 1 (`0x2da57c`). When it is 1
and attribute bits 2–4 are not the movie value 3, `0x2da614` sets the
kind register to **5** (`moveq r6, #5`, word `0x03a06005`). A movie on
that same path sets kind 7. Kind byte table `0x347f9d`, large column of
kind 5, is name index **8**. Name table `0x44036c` index 8 is
`PicL_SD` (`0x421c3b`). Kinds 2, 3, and 4 stay on `PicL`.

The HNI stills in this browse are SD photos. The frozen frame is the
white `PicL_SD` border, not the grey `PicL` border and not the movie
texture.

## Provenance

| Element | Manifest key | Dump path | SHA-256 |
| --- | --- | --- | --- |
| `code.bin` | title `0004001000022400` v4097 | `contents/0000-0000001a/exefs/code.bin` | `3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c` |
| Browse archive | `packs/camera/contents/0000-0000001a/lyt-P_Brws_D-arc-LZ.json` | `lyt/P_Brws_D.arc.LZ` | `ed22962fa35a3019457302e059ddc19709fa07e36ae1d67b506a58e9d317181a` |
| `P_BrwsPic_PicL_SD` | `resourceSources.animations.P_BrwsPic_PicL_SD` | `lyt/P_Brws_D.arc.LZ/anim/P_BrwsPic_PicL_SD.bclan` | `e8fba7ad387d2367958e0afb3e40b0f1447a5ee36dcf6b3d7be9e9d747b3b32c` |
| `P_Thmb_Pho2x3.bclim` | `resourceSources.textures.P_Thmb_Pho2x3.bclim` | `lyt/P_Brws_D.arc.LZ/timg/P_Thmb_Pho2x3.bclim` | `b5abba45ee76eefc1f75dd1d93b04f38fdbff3065a7c48791650ec137dfaf5ab` |
| Published PNG | `textures/bc28916bb9143be082eb7e4df900dd1a2d1b6dcfe30cf7ce06941576593c23d7.png` | converted BCLIM | `bc28916bb9143be082eb7e4df900dd1a2d1b6dcfe30cf7ce06941576593c23d7` |

Converter **ctr-native-web 1.2.0**. The white texture is ETC1+A4
(`picaFormat` as published). No screenshot fit, no CSS, and no invented
border.

## Change

`cameraScreenPacks` requests `P_BrwsPic_PicL_SD` instead of
`P_BrwsPic_PicL`. Gallery photo cells bind
`P_BrwsPic_Default` and `P_BrwsPic_PicL_SD` at frame 0. `ThmbPic` alpha 0
and the `56×42` photo slot are unchanged. Date rows stay on
`P_BrwsFld_PicL_Op`. Folder rows stay on `P_BrwsFld_Default` plus
`P_BrwsFld_PicL`. The cursor binding is unchanged.

## Tests

`tests/camera-browse-thumbs.test.mjs` locks the pattern key, the white
texture hash, both photo binds, the date-cell bind, and the `code.bin`
kind-5 words. `tests/stock-native-camera.test.mjs` now expects
`PicL_SD` on gallery photos. Focused run of those two files passes.
No production build and no Azahar session.

## What this does not close

The two component counts include the gallery cursor. Native selection
sits on the right thumb; the browser still draws `P_BrwsCursor_D` on the
middle thumb. That placement was left as a source gap in
[camera-selection-2026-10-05.md](camera-selection-2026-10-05.md) and was
not moved here. Photo texels inside the mask hole, the date pane, the
slider, the Settings third, and the upper crop are the same still.
Recapture belongs to the coordinator.
