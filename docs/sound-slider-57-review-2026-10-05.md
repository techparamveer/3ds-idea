# Independent review — Sound empty-entry slider 57 — 5 October 2026

Grok 4.7 on `codex/sound-slider-57-review-20261005` at recount
`fc896395`. Review of [sound-grid-recount](sound-grid-recount-2026-10-05.md).
Docs only. No Azahar, production `:3000`, preview 3021, or CDP. Sparse
checkout without `model/`. This lane did not recapture and did not
byte-grep `code.bin`.

**Verdict: APPROVE-WITH-NITS** of `fc896395`.

The empty-entry slider ROI stays **377**. Checker share is **0**. The
**320** y=174 pixels stay with the y=177 edge and are not reopened. The
other **57** are dump `C_SldH_L` at Default 20 and Rate 0. Predicted
slider residual **57** inside **377**. This is not 1:1. Tests and this
note do not close pixels, input, motion, or audio.

## Assigned leftover

Queue row for the post-grid slider
([leftover-queue](feature-map/leftover-queue-2026-10-05.md)): ROI
`[0,144,320,175]` **377** = **320** `UserWdwEdge` α11 + **56** `IconS` +
**1** `BtnP`. Prior slider label
[4271](sound-empty-slider-2026-10-04.md). Painter already binds
`C_SldH_L` at `(160,159)` with `C_SldH_L_Default` frame 20 and
`C_SldH_L_Rate` frame 0.

## Pair (reused, not recaptured)

Empty mask `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.
Threshold: any RGB channel greater than 2. Native lower crop of the
400×480 PNG is `(40,240,320,240)`.

| File | SHA-256 | Role |
| --- | --- | --- |
| `Nintendo 3DS Sound_25.09.26_22.31.31.595.png` | `65fc5f8819d31c49622d9e2a8ee7ba79c0675fd7dd3a73f783255eb7efe3b4cd` | empty-entry native |
| `browser-sound-empty-entry/lower.png` | `860b3222fd21e1976ee5e5af6caf6072a90abf54b5831cc84aa8a592742aacd5` | post-grid browser |
| `browser-empty-entry/lower.png` | `ee103d93d744f5037fd36f24ad93403bf57298b2e1d74752da09d542023ea38d` | pre-grid browser, closure check only |

Post-grid files live under
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/sound-grid-recapture-20261005/`.
The pre-grid lower is
`sound-clock-recapture-20261004/browser-empty-entry/lower.png`.

Half-open `[0,144,320,175]`: **377**, max **195** at `(39,152)` (native
`(60,47,47)`, browser `(255,51,68)`). y=174 is **320**, every pixel
`(50,119,239)` / `(51,119,236)`. The other **57** are the 4×14 at
`{38,152}` (**56**) and `(18,151)` (**1**). No other ROI pixel is over
2. Checker colours `(223,215,206)` and `(231,223,215)` on the browser
are **0** of those 377. Against the pre-grid lower, **3894** ROI pixels
fell to at most 2, of which **2767** were fill `(229,224,216)` against a
grid texel. `320 + 57 = 377` and `4271 − 3894 = 377`.

Slider pictures end at y=174. That row is outside `C_SldH_L`. Its owner
stays the y=177 note.

## Dump

EUR Sound `0004001000022500` content `0000000b`. `romfs/lyt/C.LZ`
SHA-256 `7b76a89a10a1b01a11f0e09345dc02b9d05003725c25ef344d2084af86ba7ce5`.
`decompress` + `unpack_stock_table` yields `Sld`
`99dfae740200625cdd6d0bbd9f354ea71dd27d0319affffaf9c6076ebe2ab28d`
(the pack `sourceSha256`). `unpack_darc` then `decode_bclim`. Each
decoded PNG matches the published texture hash.

| Element | Dump path | SHA-256 |
| --- | --- | --- |
| `C_SldH_L` | `Sld/blyt/C_SldH_L.bclyt` | `8d85e394cf184602ab0c45eeec499a8741ddf4194894ac01af5d1fee13399303` |
| `C_SldH_L_Default` | `Sld/anim/C_SldH_L_Default.bclan` | `6c4ef2cbb3e025a57fe51260604c785e0b7af1c75fa6bfb2ad939be991f8f429` |
| `C_SldH_L_Rate` | `Sld/anim/C_SldH_L_Rate.bclan` | `d3bad77835a0ddc24402804571819d377b10a9011685c1b37db9cfd450a4218d` |
| `IconS` | `timg/C_SldHL_IconS.bclim` L8 8×16 | BCLIM `dba15535…`; PNG `c4efcdbc6d3d35f5791f7b690d3cc51233e991ddef0d5a4c7be8a7f703bc500f` |
| `M-` | `timg/C_SldHL_Mark.bclim` RGBA4 10×20 | BCLIM `ece695e5…`; PNG `348e4d8d7ed37ab7bd911801208436e496669b671d5fd632b8b1eb8513ba758a` |
| `Box` | `timg/C_SldHL_BtnS.bclim` ETC1A4 18×28 | BCLIM `e7213c21…`; PNG `c941b7bc8fe74fb92c4cfcefd513ccc4c7e9cf7514a04f823ee8ae3994867673` |
| `BtnP` | `timg/C_SldHL_BtnPN.bclim` ETC1A4 30×28 | BCLIM `c94e807a…`; PNG `da6865034024699d330597528612a38c87b2235f051b9e19b57b42963494dde8` |
| `IconP` | `timg/C_SldHL_IconPN.bclim` ETC1A4 20×20 | BCLIM `0a390710…`; PNG `f776b4bfc1e29c4ab251c0fd63e9bcd8a820d6f07212ae95816d3509300670f1` |

Posed with the repo raster at centre `(160,159)`, Default frame 20, Rate
frame 0. `IconS` is LCD `[36,151,44,167)`. `M-` is `[35,149,45,169)`.
`Box` is `[31,146,49,174)`. `BtnP` is `[3,146,33,174)`. `IconP` is
`[8,149,28,169)`.

## The 56

`{38,152,4×14}` is the inner footprint of `IconS`. Draw order is `IconS`,
then `M-`, then `Box`. `LustS` alpha is 0 on all 56.

| Pixels | Native | Browser |
| ---: | --- | --- |
| **52** | exact posed `IconS` raster, peak `(60,47,47)` | exact `C_SldHL_Mark` texel `(255,51,68,255)`; `Box` alpha 0 |
| **4** corners | `Box` α153 source-over `IconS` | `Box` α153 source-over `M-` |

The four corners are `(38,152)`, `(41,152)`, `(38,165)`, `(41,165)`.

| Pixel | Native | `Box` over `IconS` | Browser | `Box` over `M-` |
| --- | --- | --- | --- | --- |
| `(38,152)` `(41,152)` | `(170,164,162)` | `(170,164,162)` from `IconS` `(64,51,51)` and `Box` `(241,239,236,153)` | `(247,211,210)` | `(247,211,210)` from mark `(255,170,170)` |
| `(38,165)` | `(145,136,126)` | `(145,136,126)` from `IconS` `(70,57,57)` and `Box` `(195,188,172,153)` | `(219,181,171)` | `(219,181,171)` |
| `(41,165)` | `(146,137,128)` | `(146,137,128)` from `Box` `(197,190,175,153)` | `(220,182,173)` | `(220,182,173)` |

**Nit:** the recount says those four match neither side. Each side matches
this dump blend. The **52** browser pixels are pane `M-`
(`C_SldHL_Mark`), the picture drawn after `IconS`, so the row is
`C_SldH_L` and not `IconS` alone. The count and the component rectangle
hold.

## The one `BtnP` pixel

`(18,151)` is `BtnP` raster texel `(15,5)`. Dump texel
`(233,233,233,255)` through the implicit material (buffer `(95,75,33)`,
constant white) is `(241,239,236,255)`. The browser is
`(241,239,236)`. Native is `(232,230,228)`, max **9**. `IconP` at local
`(10,2)` is `(255,255,255,0)`, so it does not cover the button. This
matches the recount.

## Painter

`M-` stays visible (flags 1, alpha 255) after Default 20 and Rate 0.
Published Default and Rate, and dump `Disable` / `Push` / `MRate`, do not
write `visible` on `M-`. `MRate` only slides `M_Rate`. Hiding the mark
to match native would be a clip guess. The painter stays
`{name:'C_SldH_L_Default',frame:20}` and `{name:'C_SldH_L_Rate',frame:0}`.

## Predicted residual

Painter unchanged, so the next unchanged capture of this still should hold:

| ROI | Predicted over 2 |
| --- | ---: |
| Empty-entry slider `[0,144,320,175]` | **377** (edge **320**; `C_SldH_L` **57**) |

Whole scenarios stay fail.

## Checks

Focused `tests/sound-empty-slider.test.mjs`: 4 pass, 0 fail.

- `npm run typecheck`: pass.
- `npm test`: 2135 pass, 36 fail, 23 skip, 1 todo (2195 tests). All 36
  failures are `ENOENT` on `model/candidates/…` files this sparse checkout
  does not include.
- `git diff --check`: clean.

This lane did not drive Azahar or preview 3021.
