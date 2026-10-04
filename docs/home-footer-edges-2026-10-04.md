# HOME 1-row after-walk footer 30 is cursor chrome, not Manual / Open — 4 October 2026

Worker `3ds-home-footer-edges-20261004` / `codex/home-footer-edges-20261004`
from HOME fidelity `8ad65635`. Sparse worktree; `node_modules` linked from
HOME fidelity. No `model/`. No runtime change. No Azahar. No preview 3021.
No CDP 9320. No recapture. No theme register, CSS, font, wallpaper or
guessed cool-edge colour. The 3 October Open-footer palette/filter sweep
stays rejected.

The [1-row Right walk](home-row-viewport-2026-10-04.md) leaves footer ROI
`[0,204,320,36]` at **30** over 2/255 (MAE 0.156). That table's **164** is
the before-walk footer and is not this leftover. All 30 after-walk samples
sit on one row at **y = 205**, inside the already-labelled
[`LncCsr_00` cursor ring](home-settings-cursor-2026-10-04.md). The live
`LncBtmBtn_02` clip `[0,210,320,30]`, the Manual / Open glyphs and the
classic theme-edge rows 212–213 are **0**. There is no unique unused
footer owner to bind.

Evidence: source-identified and tested. Not browser-inspected here. Not
native-compared here. Not 1:1.

## Pair

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-row-viewport-20261004/`.
Frozen after-walk yaw 304 / COMMON 303 / Loop 338 / cursor 37. Neighbour
mask `R/adaptation-neighbor-mask.json`. Threshold any RGB channel >2/255.
Official lower crop of the native 400×480 PNG is `(40,240,320,240)`.

| Item | SHA-256 |
| --- | --- |
| Native `_26.09.26_04.14.35.203.png` | `4adc0ef0cbba7175b641fbe4107f697f15ff7a4aadd482c746e389ea7abf5bdb` |
| After-walk upper | `2a2d920edce45c295d01a7479c0d1632b3c73e2bf04d38da1ca84e54abd26a6c` |
| After-walk lower | `cd0c87d30ab440b06a70d27787d58a6959e4e631c591a0cc319c02297903921a` |
| Masked lower report | `0069238f120e100fdd74ea9d4c484bfa46144818c0e2800a29be2207b3749d96` |
| Neighbour mask | `6b64f906f07315f9252e25f2df23c4b6e92c8535ab659b9e56523f71de587f6d` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |

Inspected `R/diff-after-masked/lower-contact-sheet.png` and
`R/after-origin-right/lower.png`. Native and browser both show Manual |
Open on the already-bound two-button footer. The heatmap is black across
the footer body and glyphs. The only footer-ROI heat is two faint
horizontal ticks under the Settings cursor.

Already labelled on this pair and not re-opened: upper 190
[`mt_pict` / wrench](home-upper-190-2026-10-04.md), neighbour peeks
2220 / 561+391+145 [About / Camera](home-neighbor-peeks-2026-10-04.md),
Settings+cursor 1656 [`LncCsr_00`](home-settings-cursor-2026-10-04.md)
(Loop 37 stays a freeze), News lamp 162 on empty `N_NewsRcv_00`, Settings
Other page-2 overlap, HudMset `+e5`, Sound HUD 5/4.

## Residual ownership

| Region | Rectangle | Over 2 | Max | Owner |
| --- | --- | ---: | ---: | --- |
| Viewport footer ROI | `[0,204,320,36]` | **30** | 3 | cursor-ring bottom, not Manual / Open |
| Footer clip | `[0,210,320,30]` | **0** | 2 | already-bound `LncBtmBtn_02` |
| Theme-edge rows | `[0,212,320,2]` | **0** | 2 | historical cool-edge gap is absent here |
| Manual glyph | `[8,218,120,20]` | **0** | 2 | `lau_2b_manual` / `textSampling:'lcd'` |
| Open glyph | `[160,218,120,20]` | **0** | 2 | `lau_2b_folder_open` / `textSampling:'lcd'` |
| Cursor ring | `[200,110,96,96]` | 2,485 | 37 | already-labelled `LncCsr_00` |
| y205 left tick | `[210,205,15,1]` | 15 | 3 | cursor-ring bottom ⊂ the 2,485 |
| y205 right tick | `[263,205,15,1]` | 15 | 3 | cursor-ring bottom ⊂ the 2,485 |
| 1 px Settings strip | `[200,128,1,68]` | 68 | 6 | already-labelled cursor / tile chrome |
| 1 px Settings strip | `[203,145,1,34]` | 34 | 5 | already-labelled cursor / tile chrome |
| 1 px Settings strip | `[284,145,1,34]` | 34 | 5 | already-labelled cursor / tile chrome |
| Neighbour-mask bottom | `[50,200,9,2]` and three siblings | 10 each | 4 | Sound / Health plate bottoms, not footer |

The 30 leftover pixels are exactly
`(210..224, 205)` and `(263..277, 205)`. Native is `(218–219, 220, 215)`;
browser is `(215–216, 221, 215)`; every sample is Δ3. The same pair of
15-pixel ticks sits on the **top** of the Settings tile at y = 118. y = 204
is empty, so the official 4-neighbour walk lists the ticks as two size-15
components instead of folding them into the 1,656-pixel
`[203,121,82,82]` blob. They remain inside the cursor-ring rectangle
already counted as 2,485.

`footer()` clips `LncBtmBtn_02` to `[0,210,320,30]`. y = 205 is one row
above that clip. The viewport table's footer ROI starts at y = 204 and
therefore includes six rows the painter does not treat as footer.

## Named leftover strips

After the labelled 2,220 / 1,656 / 561 / 391 / 162 / 145 components, the
next official 4-neighbour boxes are the 1-pixel Settings-tile strips and
the y = 200 neighbour-mask bottoms. None of them are Manual / Open.

- `[200,128,1,68]`, `[203,145,1,34]` and `[284,145,1,34]` sit on the
  Settings column (centres 244 / box 72, cursor ring x 200–296). y ranges
  128–195 and 145–178 never enter the footer ROI. They are the same
  already-labelled `LncCsr_00` halo / Settings-plate edge, just
  4-neighbour-disconnected from the 1,656 bbox.
- `[50,200,9,2]`, `[93,200,9,2]`, `[134,200,9,2]` and `[177,200,9,2]`
  sit on the first two rows **under** the neighbour-mask bottoms
  (`[32,118,80,82]` and `[112,118,88,82]` both end at y = 200). Those x
  ranges are the lower corners of the Sound (76) and Health (160) plates.
  Native `(211,207,203)` versus browser `(211,209,206)` is neighbour-tile
  identity, not footer material. They belong with the already-labelled
  [About / Camera / neighbour-face adaptations](home-neighbor-peeks-2026-10-04.md),
  not with Manual / Open.

## Already-bound footer source (no unused owner)

Firmware EUR 10.7.0-32E, HOME `0004003000009802`, version 24576, content
index 0 / ID `00000082`. Delivered `home.launcher` /
`packs/home/launcher.json` SHA-256
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.
Archive `romfs/launcher_LZ.bin` SHA-256
`826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`.
`exefs/code.bin` SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Converter `ctr-native-web` 1.2.0 / CTRTool 1.3.0.

`footer()` already draws the only delivered footer layout:

| Member | CIA path | SHA-256 |
| --- | --- | --- |
| `LncBtmBtn_02` | `launcher_LZ.bin/blyt/LncBtmBtn_02.bclyt` | `1be988eda6f3d2374d8445d0773688fa1c6dd118590cb986d526c0dc4f326a44` |
| `LncBtmBtn_10.bclim` | `launcher_LZ.bin/timg/LncBtmBtn_10.bclim` | `40a5977b8f9da6f5b779bc337de4c6dc19c008b9aebf25f6b38613280b13a15c` |
| `LncBtmBtn_11.bclim` | `launcher_LZ.bin/timg/LncBtmBtn_11.bclim` | `473ea371837ccdbb4a47bf219cb14f17e7b5178a22fca5a8be1136134b70f191` |

`P_BtnW_C_01` (material 0) and `P_EdgeW_C_01` (material 3) remain
byte-identical except name, including flags 1962 and constants
`[255,254,250]`, `[223,219,215]`, `[255,255,255]`. Idle Settings already
selects two-button Manual / Open (`getHomeFooter` left `manual`, right
`open`; messages `lau_2b_manual` / `lau_2b_folder_open`). The draw uses
`textSampling:'lcd'` and clip `[0,210,320,30]`. `homeLayouts.launcher`
already requests `LncBtmBtn_02`. It is the only `*Btm*` / `*Footer*`
layout in the pack.

`LncBtmBtn_12.bclim` /
`38ff7babda66f52491be59c40c6670d91dac2060b25f6bbac892f322b77bb573` and
`LncBtmBtnLine_12.bclim` exist in the pack and are not referenced from
`src/`. They are not unique owners of y = 205 cursor ticks or of a
zero-residual footer clip. The
[theme-audit register-writer gap](home-footer-theme-source-audit-2026-10-01.md)
(`0x2ac8c4` / active-theme `+0x10` and nine RGB bytes) remains a
documented source gap for other footer stills. It does not own this
pair's 30: rows 212–213 are inside threshold here. The 3 October
[palette/filter sweep](home-open-footer-residual-2026-10-03.md) stays
rejected.

## Why the painter stays unchanged

Rebinding `LncBtmBtn_12`, inventing a theme register, repeating the
rejected RGB565 / nearest-filter fit, or painting a cool edge would
guess a colour the live clip does not miss. The 30 leftover pixels are
already-bound `LncCsr_00` chrome. Manual / Open need no new pane, texture
or sampler.

Cursor 37, the News lamp, neighbour peeks, Settings Other page-2,
HudMset `+e5` and Sound HUD 5/4 were not touched.

## Tests

Focused `tests/home-footer-edges.test.mjs`: pins `LncBtmBtn_02` as the
only footer layout, the already-live `footer()` clip and `lcd` sampler,
identical `P_BtnW_C_01` / `P_EdgeW_C_01` materials, idle Settings
Manual / Open, unused `_12` textures staying unbound, and the refusal to
invent a theme/color fit. When `R` is present, pins footer ROI 30 at
y = 205 only, clip / Manual / Open / rows 212–213 at 0, the named
68 / 34 / 34 and four y = 200 boxes, cursor-ring inclusion of the 30,
and the named SHA-256 identities.

## Remaining / next coordinator action

Masked lower stays **5,426**. After-walk footer ROI **30** is
re-attributed to the already-labelled Settings+cursor halo; do not chase
it as Manual / Open. Do not recapture for this documentation slice.
Reuse the matching 1-row Right walk at yaw 304 / COMMON 303 / Loop 338 /
cursor 37. Next useful footer evidence remains the isolated active-theme
memory read from the [theme audit](home-footer-theme-source-audit-2026-10-01.md),
on a still that actually shows the cool edge. Do not invent a theme
register or repeat the 3 October palette sweep. Whole-scenario 1:1 still
fails. Matrix unchanged.
