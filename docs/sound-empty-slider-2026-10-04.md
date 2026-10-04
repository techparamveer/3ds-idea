# Sound empty-entry lower slider 4271 source gap — 4 October 2026

Stock/Sound worker on `codex/sound-empty-slider-20261004` from HOME fidelity
`6501c47e`. Sparse worktree; `node_modules` linked from HOME fidelity. No
`model/`. No runtime change. No Azahar. No preview 3021. No CDP 9320. No
recapture. No snap, CSS, colour, Rate frame, mip or sampler guess. Title,
Span, birds, volume, battery, clock and footer stay labelled and are not
reopened
([title 1774](sound-title-1774-2026-10-04.md),
[remaining residual](sound-remaining-residual-2026-10-04.md),
[HudTime recapture](sound-clock-recapture-2026-10-04.md)).
First-run lower is the guide, not this slider.

This is not a 1:1 claim. Independent review **APPROVE-WITH-NITS** of
fidelity `583fa9e` / worker `540cc5f5` (identical patch-id `ff5b2ac2…`;
tests 4/4; official strip is `report.screens.lower.regions[0]`, not
unqualified `regions[0]`). Tests and this note do not close pixels, input,
motion or audio. Coordinator recapture remains the acceptance gate.

## Pairs (reused, not recaptured)

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/sound-clock-recapture-20261004/`.
Hashed natives under
`/Users/paramveer/.codex/3ds-artifact-overflow/reference/screenshots/`.
Empty mask. Threshold any RGB channel >2/255. Official lower crop of each
native 400×480 PNG is `(40,240,320,240)`.

| Still | SHA-256 | Role | Local clock |
| --- | --- | --- | --- |
| `Nintendo 3DS Sound_25.09.26_22.27.14.541.png` | `9dea0cc2fa7022ccd032c5a94ae59c2dbe37e6b7e800fbf8668b356fc9e5ce69` | `sound-first-run` combined | `22 27` (seconds 14, even) |
| `Nintendo 3DS Sound_25.09.26_22.31.31.595.png` | `65fc5f8819d31c49622d9e2a8ee7ba79c0675fd7dd3a73f783255eb7efe3b4cd` | `sound-empty-entry` combined | `22:31` (seconds 31, odd) |

| File | SHA-256 |
| --- | --- |
| `R/browser-empty-entry/upper.png` | `8d76f568cf79522a1febc689c44ac6b6f8328971e86e4dc4e535c1fe0a7216d0` |
| `R/browser-empty-entry/lower.png` | `ee103d93d744f5037fd36f24ad93403bf57298b2e1d74752da09d542023ea38d` |
| `R/diff-sound-empty-entry-hudtime-phase/report.json` | `d28688a4a28c3c5cabc303cc6fb824045ee4a074f4f25fffcacc07944e5425f2` |
| `R/diff-sound-empty-entry-hudtime-phase/lower-contact-sheet.png` | `4cd485a1adcb1a0d66afb2b7b911b92037262896e6d085df92fed320de31b9f4` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |

Inspected the empty-entry lower contact sheet. Native shows a grey capsule
on the track at the left Rate rest. Browser shows a red `IconS` tick at
the same x. First-run lower stays the guide (whole **6,267**; this slider
rect is **372** of guide veil, not `C_SldH_L`). Clock ROI
`[95,216,194,240]` stays **0**. Whole empty-entry LCDs stay
**6,404 / 16,021**.

## Residual (empty-entry lower only)

Half-open rectangles. Counts are pixels with any RGB channel delta greater
than 2.

| Cluster | Rectangle | Over 2 | Max | At |
| --- | --- | ---: | ---: | --- |
| Whole lower | 320×240 | **16021** | 241 | row residual |
| Slider | `[0,144,320,175]` | **4271** | 195 | `(39,152)` native `(60,47,47)` / browser `(255,51,68)` |
| Handle band | `[0,148,320,172]` | 2962 | 195 | same |
| Official strip | `{x:0,y:144,width:320,height:31}` | 4168 | — | `report.screens.lower.regions[0]` |
| Official tick | `{x:38,y:152,width:4,height:14}` | **56** | 195 | `IconS` core |
| Empty row / footer | `[0,32,320,64]` / `[0,178,320,240]` | 1916 / 4707 | — | already labelled; not reopened |

The 56-pixel tick sits inside already-bound `IconS` (layout centre
`(160,159)` + translation `x = -120` → LCD x 36–44, y 151–167). The other
4,215 pixels in the 31-row strip are the same `C_SldH_L` track / capsule /
arrow band, not a second layout.

## Already-bound source

EUR Sound `0004001000022500` v3088 (`CTR-N-HESP`), content 0 / `0000000b`,
`exefs/code.bin` SHA-256
`3c57f2c4091c1bec6b3834609f1e2a6488712e21775d7548b441c69c60b3e5a9`,
image base `0x100000`. Converter `ctr-native-web` **1.2.0**.

| Element | Manifest / pack | Dump source | SHA-256 |
| --- | --- | --- | --- |
| Slider pack | `lyt-C-Sld.json` | `lyt/C.LZ` (`Sld`) | source `99dfae740200625cdd6d0bbd9f354ea71dd27d0319affffaf9c6076ebe2ab28d`; public `76bad1dc64b5c36f3ddeb1acd27ee465033dca2ac126d3808e59cb5f079e4ed0` |
| `C_SldH_L` | pack layout | `lyt/C.LZ/Sld/blyt/C_SldH_L.bclyt` | `8d85e394cf184602ab0c45eeec499a8741ddf4194894ac01af5d1fee13399303` |
| `C_SldH_L_Default` | pack clip | `anim/C_SldH_L_Default.bclan` | `6c4ef2cbb3e025a57fe51260604c785e0b7af1c75fa6bfb2ad939be991f8f429` |
| `C_SldH_L_Rate` | pack clip | `anim/C_SldH_L_Rate.bclan` | `d3bad77835a0ddc24402804571819d377b10a9011685c1b37db9cfd450a4218d` |
| `IconS` | `C_SldHL_IconS.bclim` L8 | `timg/C_SldHL_IconS.bclim` | source `dba155359fd5eb19f41f50fbeb7c78be214cced4058c27e51d84ad137cc65d2c`; public `c4efcdbc6d3d35f5791f7b690d3cc51233e991ddef0d5a4c7be8a7f703bc500f` |
| `Box` | `C_SldHL_BtnS.bclim` ETC1A4 | `timg/C_SldHL_BtnS.bclim` | source `e7213c21bf6ab2cda4c0ca857b255937ac7bda65e1d62169c9b71d18f5dbdade`; public `c941b7bc8fe74fb92c4cfcefd513ccc4c7e9cf7514a04f823ee8ae3994867673` |

Empty-entry already mounts `C_SldH_L` at `(160,159)` with
`C_SldH_L_Default` frame **20** (group `Btn` = `BtnP` / `BtnN` / `Box`)
and `C_SldH_L_Rate` frame **0** (group `Rate` = `S_Rate` / `IconS`).
Layout rest and Rate frame 0 both put `S_Rate` / `IconS` at `x = -120`.
Default keys sit at frames 30 / 100 / 210, so frames 0 and 20 sample the
same Btn pose. `IconS` is `pic1` flags 1, 8×16, L8, `bufferColor`
`(22,6,6,0)`. `Box` is `pic1` flags 1, 18×28, ETC1A4, `bufferColor`
`(95,75,33,0)`. Empty `tevStages` interpolate buffer→constant0 with the
texture; that already-bound implicit TEV is why the L8 tick paints red
in the browser. `magFilter` / `minFilter` are **1** (linear) on every
`C_SldH_L` map. Playback still attaches `-L-C_SldH_L` from `S_Play_D`
CtrPanel1 (`0x23c88c`, object `+0x254`) and CtrPanel2 (`0x23c9bc`,
`+0x258`); that is not the empty browse painter.

## Unused members that do not uniquely own the 4,271

The converted dump (`sound-native14`, same `C.LZ` source) still has
`C_SldH_L_Disable` (`ec7e2ae6…`), `C_SldH_L_Push` (`7cfe8931…`) and
`C_SldH_L_MRate` (`4ea3257b…`). The published pack and
`soundScreenPacks` request only Default and Rate. None of those three
unused clips writes `visible` or `IconS` materialColor.

`Disable` is group `Btn`, two frames, source range `[60,61]`. Btn
materialColor keys sit at frame **−26** with slope −255 but **value**
`(95,75,33)` — the same Default buffer. Single-key sampling at frames
0/1 returns that value. IconS is not a Btn member, so Disable cannot
hide the red tick. `code.bin` has no `C_SldH_L_Disable` string. Binding
Disable because the still looks grey would be a colour/clip guess.

`Push` is group `Btn`, three frames: Btn/Box scale up and materialColor
rises toward `(125,105,63)`. That is a press pose, not the idle capsule.

`MRate` is group `MRate` (`M_Rate` only) and translates the `C_SldHL_Mark`
pane. Empty-entry does not bind it. Selecting it would move the mark, not
replace `IconS` with `Box`.

`C_SldT` / `C_SldT_Push` and `C_SldV_L` / `C_SldV_S` are other layouts
(playback seek and vertical sliders). Using them on empty browse would
not be a unique unused `C_SldH_L` owner.

`SS-` / `SE-` are empty `pan1` 16×16 at `x = ±120`. No picture. `LustS`
is already a visible child of `Box`. `code.bin` has no `IconS` string
(no pane-flag writer by that name). Rate frames other than 0 only
translate `S_Rate` / `IconS` from −120 to 120; they do not recolour the
tick. Switching `magFilter` 1→0 is a sampler guess and would not uniquely
own the 4,215 non-tick pixels in the strip.

Four `C_SldH_L` / `C--Sld` / `-S-` name pools sit at `0x2aec68`,
`0x2af89c`, `0x2b0768` and `0x2b139c`. Adjacent generic clip-name pools
are `Disable`/`Default` at `0x1ec8e0` and `Rate`/`DisableAll`/`MRate`/
`ARate`/`BRate` at `0x297df4` (the latter matches **C_SldT** groups, not
`C_SldH_L`). None of those addresses uniquely bind an unused empty-browse
clip.

## Labelled gap

Empty-entry lower slider `[0,144,320,175]` is a **source-gap** for the
remaining **4,271** pixels (max 195 at `(39,152)`). The missing evidence
is still the native empty-list `IconS` / `Box` compositor (visibility,
implicit TEV / `bufferColor`, or an untraced writer) on already-bound
`C_SldH_L` Default 20 + Rate 0. Until that has a unique unused
pane/clip/Rate frame/sampler bind, the painter stays unchanged.

## Checks

Focused `tests/sound-empty-slider.test.mjs` plus `git diff --check`.
Application typecheck/build were not rerun because no application files
changed. This lane did not drive Azahar or preview 3021.
