# Camera browse plus tint — re-review — 5 October 2026

Worker on `codex/camera-plus-tint-20261005` from `1863c4e4`. One source-only
re-review of leftover rank 4. No Azahar. No preview 3021. No CDP. No
recapture. Date-group `ThmbBase` / `P_BrwsFld` / `cameraDateGroupOrange`,
photo crop, Parakeet, Welcome, and `cameraBrowseUserColor` stay untouched.

This keeps the source-gap from
[camera-browse-slider-2026-10-05](camera-browse-slider-2026-10-05.md). It is
not a 1:1 claim. The painter is unchanged. Tests and this note do not close
pixels, input, motion, or audio.

## Verdict

**Keep** the source-gap. The earlier **APPROVE** `90be3135` rejected
`(255,208,128)` because `code.bin` had no byte sequence or float for it.
That byte search is not the evidence. A real LA4 decode of `ZoomUp` still
does not contain the peach, and no dump pane, material, TEV stage, vertex
colour, or animation sets the plus alone to the alpha that produces it.

## Decode

EUR Camera `0004001000022400` v4097, content `0000001a`. Archive
`lyt/P_Brws_D.arc.LZ` SHA-256
`ed22962fa35a3019457302e059ddc19709fa07e36ae1d67b506a58e9d317181a`,
decompressed with the repo LZ11/DARC reader. Member
`timg/P_BtnO_BrwsZoom0.bclim` SHA-256
`5dd880375fd9519421bf2668c9d3b7af9d14f92b250af447cba35d8152e32342`.
`scripts/firmware/texture.py` `decode_bclim`: **LA4**, 32×32, CLIM format 2,
PICA format 9. The published preview PNG
`abfc6d9ee9523ff5b04f407bf6aa7aa6e35b319524ecf56ba513743019287782` matches
that decode.

| Decoded texel | Count |
| --- | ---: |
| `(255,255,255,255)` | **156** |
| alpha exactly 128 | **0** |
| alpha 255, any RGB | 436 |

LA4 alpha steps by 17 (0, 17, …, 255). 128 is not a legal texel alpha.
The raw member also does not contain the bytes `255,208,128`; those bytes
are not how LA4 stores a colour. The 156 whites are the texels the frozen
still maps at lower `[2,176,32,32]`.

`ZoomUp` material has **no TEV stages** and no `colorBlend`. Buffer colour
is `(70,55,55,0)`. Constant 0 and constant 5 are white. Vertex colours are
white. The implicit combiner sends a white texel to opaque white. The host
raster of those 156 texels is `(255,255,255,255)`. `ZoomBack` uses the same
buffer, constants, and empty TEV list, with `P_BtnO_BrwsZoom1.bclim`.

`-B-ZoomUp` has two children: picture `ZoomUp` and bounds `BB-ZoomUp`
(`bnd1`, no picture). There is no UserBG-tinted backing pane under the plus.
Full-screen `UserBG` sits behind both buttons. Its texture `P_Back.bclim`
is an 8×8 L4 white field. Its user slot, constant 5, is still authored
`(0,128,255)` until `cameraBrowseOrange` rewrites that one material.
`ZoomUp` constant 5 stays white, so the plus material does not read the
user colour.

Pane flags: `ZoomUp` is **1** (visible). `ZoomBack` is **3** (visible and
InfluenceAlpha). Both authored alphas are **255**. InfluenceAlpha only
changes the alpha passed to children. `ZoomBack` has no children, and both
pictures are drawn at their own alpha. `P_BrwsBase_D_Brws` frame 0, the
bound clip, leaves both alphas at 255.

Every `P_BrwsBase_D_*` alpha track keys `ZoomUp` and `ZoomBack` to the same
frames. `Default` and `Push` reach 128 only at a later key, and they reach
it for both buttons. `Disable` frame 0 is 128 for both, then 255 for both.
Binding any of those clips would tint the minus button, whose 177 opaque
whites are `(255,255,255)` on the frozen native still and in the browser.

## Why the still is peach

On native `cae793c3…`, all **156** opaque-white plus texels are
`(255,208,128)`. On browser lower `0d0ffe41…` they are `(255,255,255)`.
`(255,208,128)` is opaque white at alpha **128** over UserBG `(255,161,0)`.
One grey check: implicit TEV of `(51,51,51)` is `(107,95,95)`; that colour
at alpha 128 over `(255,161,0)` is the native pixel `(181,128,48)` at
`(17,200)`. The same browser pixel stays `(107,95,95)`. The minus grey at
`(301,200)` is `(107,95,95)` on both sides, so the minus glyph is not at
alpha 128.

An unapplied composite of the decoded raster at pane alpha 128 over
`(255,161,0)` matches **516** of the frozen strip's **1992** pixels (threshold
any channel >2/255). The other **1476** stay, including the bar rows. That
composite is not a dump bind: the resource alpha is 255 and every clip that
writes 128 writes it to both buttons. The painter is unchanged, so the
predicted strip on this still stays **1992**.

`code.bin` `3a3c4152…` copies the CLYT alpha byte to runtime pane `+0xb4`
and `+0xb5` at `0x24e634`. Both zoom pictures contribute 255 there. The
constructor loads `-B-ZoomUp` through `0x440284` and `-B-ZoomBack` through
`0x440288`, then stores the panes at object `+0x40` and `+0x44`. Later
`0x2d46dc` and `0x2d4730` call the same virtual slot `+0x68` with different
0/1 arguments. This slice found no store of the immediate 128 to pane
`+0xb4`. There is still no plus-only colour constant.

## Evidence

| Tier | Result |
| --- | --- |
| Source-identified | LA4 `P_BtnO_BrwsZoom0.bclim` `5dd88037…`; 156 opaque whites; no alpha 128; no plus-only backing pane or animation |
| Delivered | Existing published packs only |
| Implemented | Painter unchanged |
| Tested | `node --test tests/camera-plus-tint.test.mjs` |
| Browser-inspected | Not run |
| Native-compared | Reused frozen pair only. Not recaptured. Not 1:1 |

## Remaining

Strip **1992** on `0d0ffe41…`. Plus tint and the y=181..184 bar highlight
stay with their previous owners. Not 1:1.
