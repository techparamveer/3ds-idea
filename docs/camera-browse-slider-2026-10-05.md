# Camera browse-bar slider — 5 October 2026

HOME-fidelity Camera worker on `codex/camera-browse-slider-20261005` from
fidelity `78206164`. One leftover: the orange browse-bar strip. No Azahar.
No preview 3021. No CDP 9320. No recapture. Date-group `ThmbBase` /
`P_BrwsFld` / `cameraDateGroupOrange` is untouched. Photo crop, Parakeet,
Welcome, and `cameraBrowseUserColor` are untouched.

This is not a 1:1 claim. The painter is unchanged. Tests, this note, and the
reused still do not close pixels, input, motion, or audio.

## Assigned defect

Frozen native
`reference/scenario-matrix/v1/captures/camera-populated-browse-global/native/combined.png`
SHA-256 `cae793c31bdf9f13d44f0834582bf99fead5bb8d652321913993bedde7ae1652`.
Browser lower SHA-256
`0d0ffe41fed0cebe34d78ae196cf1694ffeeb3fde59379a027b8969b35845dea`
under `home-fidelity-20261001/camera-3d-badge-sdmc-recapture-20261005/`.
Empty mask `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.
Threshold any RGB channel >2/255. Whole lower **12872**. Strip
`[0,170) × [0,320)` through y=210 scores **1992**, max 127 at `(17,181)`:
native `(255,208,128)`, browser `(255,255,255)`.

## Source identity

EUR Camera `0004001000022400`, version 4097, content index 0 / ID
`0000001a`. Image base `0x100000`. Converter **ctr-native-web 1.2.0**,
extractor CTRTool 1.3.0
(`e4bae2eb1b254af5f4849d5807c92b3caff768fab5d5ead5f50ca0fe4ac7ff81`).
Private executable:
`reader-extracted/camera/contents/0000-0000001a/exefs/code.bin`.

| Element | Manifest / pack | Dump source | SHA-256 |
| --- | --- | --- | --- |
| `exefs/code.bin` | title `0004001000022400` v4097 | `contents/0000-0000001a/exefs/code.bin` | `3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c` |
| Slider archive | `packs/camera/.../lyt-C-Sld.json` | `lyt/C.LZ/Sld` | `8ddab54d40ce8d1c9daee71147f83dc94d9aec42c8169f7f6737ec70429f512f` |
| `C_SldH_S` | pack `resourceSources.layouts.C_SldH_S` | `lyt/C.LZ/Sld/blyt/C_SldH_S.bclyt` | `989be172d5ecdac3867e1f6924fbb03a6b75c7e0251c8b10b1c03f68a4a64a7a` |
| Browse base | pack `resourceSources.layouts.P_BrwsBase_D` | `lyt/P_Brws_D.arc.LZ/blyt/P_BrwsBase_D.bclyt` | `9a4899a6d5188952f6a9a6cb2715afe756f2a6a476c3f77143caddce9a93890c` |
| Plus icon | `P_BtnO_BrwsZoom0.bclim` | `lyt/P_Brws_D.arc.LZ/timg/P_BtnO_BrwsZoom0.bclim` | `5dd880375fd9519421bf2668c9d3b7af9d14f92b250af447cba35d8152e32342` |
| Minus icon | `P_BtnO_BrwsZoom1.bclim` | `lyt/P_Brws_D.arc.LZ/timg/P_BtnO_BrwsZoom1.bclim` | `942371957a8967f962ce9b919dc9ed0b98c52c68054c4e6a5d0b20e01cafada7` |

## What the strip actually is

Aligned to the frozen still, `ZoomUp` occupies lower `[2,176,32,32]` and
`ZoomBack` occupies `[286,176,32,32]`. Both panes are already drawn by
`P_BrwsBase_D` with `P_BrwsBase_D_Brws` frame 0. Their picture vertex colours
and material constant 0 are authored white. The plus and minus shapes match
`P_BtnO_BrwsZoom0` / `P_BtnO_BrwsZoom1` on both sides of the pair.

`ZoomBack`'s 177 opaque-white texels are `(255,255,255)` on native and in
the browser. `ZoomUp`'s 156 opaque-white texels are native `(255,208,128)`
and browser `(255,255,255)`. That is the max pixel at `(17,181)`. Grey and
light texels of the plus are warm on native and neutral in the browser; the
minus greys match. `(255,208,128)` is opaque white blended at alpha 128 over
`cameraBrowseUserColor` `(255,161,0)`. `code.bin` contains no `255,208,128`
byte sequence and no float for 208/255, 128/255, or 161/255.

The same constructor resolves both pane names. Literals at `0x2d1ff4` and
`0x2d2064` load `-B-ZoomUp` (`0x421a95`) and `-B-ZoomBack` (`0x421a9f`). The
resolved plus pane is stored at object `+0x40` and the minus pane at
`+0x44`. That is a shared lookup, not a plus-only colour constant.

## Owners that are not unique

`-L-Sld` metadata is `C--Sld/C_SldH_S`. `code.bin` has no `C_SldH_S` string;
the part link is the slider owner, and the painter already mounts it at
`[160,196]` with `C_SldH_S_Default` frame 20 and `C_SldH_S_Rate`. The full
`lyt/C.LZ/Sld` archive also contains `C_SldT`, `C_SldV_L`, and
`C_SldH_S_{Disable,MRate,Push}`. Disable and Push recolour `BtnP` and
`BtnN` together; MRate moves both panes. None names `ZoomUp`. Binding one would replace the part link or
guess a Rate frame.

`P_BrwsBase_D_Default`, `Disable`, and `Push` set **both** zoom materials'
constant 0 to `(70,55,55)` (Disable/Push also move alpha). That is the
authored buffer colour, already on both materials, and it is not the
one-sided peach. `Brws` frame 0 does not write that colour. Binding Default
would tint the minus button, which currently matches.

`-L-Tape` links shared layout `P_Tape/P_Tape` (archive SHA-256
`34fb91c550a7b00a537055c7535cab3805f532f79f0a36cba6e1e08e1533ea31`). The same
part is referenced from browse, image edit, movie graffito, settings, shoot,
and slideshow. It has seven clips (`Flat`, `Pop`, `Wide`, `F_P`, `P_F`,
`P_W`, `W_P`). Its edge alphas are 17, 34, 51, 68, and 85, which can explain
the lighter bar rows at y=182..184 (`(255,192,85)`, `(255,180,51)`,
`(255,167,17)` over `(255,161,0)`), but not alpha 128 on the plus. It is not
a unique browse-bar icon owner, so it is not bound.

## Change

No painter change. No icon swap, no `azahar-12p4-fit`, no CSS, font, or mip,
and no Rate-frame guess. `tests/camera-browse-slider.test.mjs` locks the
Default 20 / Rate mapping, the zoom texture provenance, and the frozen strip
count of 1992.

## Evidence

| Tier | Result |
| --- | --- |
| Source-identified | Part link `C--Sld/C_SldH_S`; zoom textures above; no unique unused plus-only owner |
| Delivered | Existing published packs only. `P_Tape` stays unpublished |
| Implemented | Painter unchanged |
| Tested | `node --test tests/camera-browse-slider.test.mjs` |
| Browser-inspected | Not run. Preview 3021 and CDP 9320 were out of scope |
| Native-compared | Reused frozen pair only. Not recaptured. Not 1:1 |

## Independent review

Grok 4.6 `camera-browse-slider-review-20261005-r2`: **APPROVE**. Cherry-pick
`e6bcca9f` matches worker `6adf0845`. Painter unchanged. Full native14 packs
have **0** animations that target `ZoomUp` without `ZoomBack`. `P_Tape` edge
alphas are 17/34/51/68/85 (bar rows y=182–184), not alpha 128 on the plus.

## Remaining

Whole lower **12872** on the pre-date-group still this test locks
(`0d0ffe41…`). Post-PicL_Op recapture lower is **10482** (`0265b510…`) with
the same strip **1992**. Plus tint (156 white texels) and the y=181..184 bar
highlight stay. Date-text, photo crop, Parakeet, and paging stay with their
owners. Static still only. Input, motion, and audio were not compared. Not
1:1.
