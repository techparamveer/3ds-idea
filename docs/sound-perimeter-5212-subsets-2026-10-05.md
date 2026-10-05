# Sound first-run perimeter 5212 subsets — 5 October 2026

Worker on `codex/sound-perimeter-5212-subsets-20261005` from `aa038083`.
After Grok 4.7 **REJECT** `be862ce6` of the compositor/veil as owner of
the non-checker **5212** ([review](sound-perimeter-5212-review-2026-10-05.md),
[grid recount](sound-grid-recount-2026-10-05.md),
[perimeter 6072](sound-guide-perimeter-2026-10-05.md)). Docs and tests
only. No Azahar, production `:3000`, preview 3021, or CDP. No recapture.
The painter is unchanged. This is not 1:1. Tests and this note do not
close pixels, input, motion, or audio.

Next, volume, Span, birds, battery, Line01, the slider, y=177, the
empty-entry row, and the mid-grid bind stay closed and are not retuned.

## Pair (reused, not recaptured)

Empty mask `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`
(`maskedPixels` 0). Threshold: any RGB channel greater than 2. Native
lower crop of the 400×480 PNG is `(40,240,320,240)`. Files under
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/sound-grid-recapture-20261005/`.

| File | SHA-256 | Role |
| --- | --- | --- |
| `Nintendo 3DS Sound_25.09.26_22.27.14.541.png` | `9dea0cc2fa7022ccd032c5a94ae59c2dbe37e6b7e800fbf8668b356fc9e5ce69` | first-run native |
| `browser-sound-first-run/lower.png` | `cd0ce7172dfe63d90c869777291ec7082c501423e0e63732879795f5175c0a1f` | post-grid lower |
| `Nintendo 3DS Sound_25.09.26_22.31.31.595.png` | `65fc5f8819d31c49622d9e2a8ee7ba79c0675fd7dd3a73f783255eb7efe3b4cd` | empty-entry native |
| `browser-sound-empty-entry/lower.png` | `860b3222fd21e1976ee5e5af6caf6072a90abf54b5831cc84aa8a592742aacd5` | empty-entry browser |

Whole lower **6072**. Interior `[20,20,300,220]` **0**. Complement
**6072** = **860** + **4416** + **728** + **68**. Bands of the
complement stay **1487 / 1200 / 1170 / 2215**.

## Dump identity

EUR Sound `0004001000022500` v3088, content index 0 / `0000000b`.
This pass re-hashed `exefs/code.bin` and the `S_BG.arc.LZ` members
from the extracted dump. Dialog member hashes are the pack
`resourceSources` records for `lyt/C.LZ`.

| Element | Dump path | SHA-256 |
| --- | --- | --- |
| `code.bin` | `exefs/code.bin` | `3c57f2c4091c1bec6b3834609f1e2a6488712e21775d7548b441c69c60b3e5a9` |
| `S_BG.arc.LZ` | `lyt/S_BG.arc.LZ` | `944b1cf9a81eac5b162001ac6b9a5dfae63513e1dc45981c87496c159fd0d434` |
| `S_BG_Grid.bclim` | `timg/S_BG_Grid.bclim` | `138b6fc990989d157e970a65d92999e9a81370e9ce02281581da8c6f516c46f3` |
| `S_BG_D-Grid` | `blyt/S_BG_D-Grid.bclyt` | `925f961ae0eed19b4ab5318d61e0fa609aa465cdd0202f73c6772661647669d6` |
| `S_BG_D-Grid_Default` | `anim/S_BG_D-Grid_Default.bclan` | `4dc57eec9552dd8513f3786a727856d7b8e08c7b27f33083a4619d8c8d2009c9` |
| Dialog pack | `lyt/C.LZ` | `96771724c5f571dc6045ba3dd4ffa8a769428f9c4cf9784f3ea49e7cf52e0e26` |
| `C_DlgChA` | `Dlg/blyt/C_DlgChA.bclyt` | `4d35e4b38ae75fa7ad8c8f2d2484bd200856b562ee4c493b13adbc765c5eb8d7` |
| `C_DlgChBase.bclim` | `Dlg/timg/C_DlgChBase.bclim` | `a9fa4c68c3ad4222c9e5da2df047b2bc8cf38d227ab296e2e4e04d0bf4a18b03` |
| `C_DlgChBirdA.bclim` | `Dlg/timg/C_DlgChBirdA.bclim` | `2292ed3ea2f3c3db3623b8790f836c5f77d03dd733ea1b6da9a0e8c72dda4adf` |
| `C_DlgChLay6.bclim` | `Dlg/timg/C_DlgChLay6.bclim` | `9117e20bacdc6288f636802066875c786a7b09032518a032cad0d38113387423` |

Decoded public grid PNG `7407446ca0120cd4b13a02eb1af7215602e82f5aec9f270005715e1732a9b237`.
The posed `S_BG_D-Grid` Default frame 0 raster is the same two ETC1
texels, `(223,215,206)` and `(231,223,215)`. `⌊grid/2⌋` is
`(111,107,103)` and `(115,111,107)`.

## 860 dimmed grid (kept)

On the complement, **860** pixels have the browser equal to the posed
grid texel and the native equal to exact `⌊grid/2⌋`. Dark **464**,
light **396**. Bands **56 / 656 / 148 / 0**. These stay the dimmed
`S_BG_Grid` label. They are not part of the **5212**.

## 4416 half observation (unlabelled)

**4416** complement pixels are within 2 of `round(browser/2)` and are
not the **860**. Bands **1404 / 349 / 977 / 1686**. **3723** have a
browser channel above 30; the median native/browser ratio on those
**11109** channels is **0.497**. **693** are darker. Half intensity
stays an observation.

No unique dump pane owns them. `C_DlgChA` `RootPane` is the whole
320×240. `ChAWdwL` `[6,5,294,235]` contains **406**, `ChAWdwR`
`[294,5,314,235]` contains **114**, and `Bird` `[8,183,52,235]`
contains **66**. `C_DlgGuid1BtnW` content panes do not cover the
complement. The veil is not restored.

## 728 empty-entry pixels

All **728** have the first-run browser byte-identical to empty-entry
`860b3222…`, and the first-run native within 2 of
`⌊empty-entry native/2⌋`. They are the complement pixels that are not
within 2 of `round(browser/2)` and are not the **68**. Bands
**2 / 195 / 45 / 486**. Peak `(296,234)` is in this set: native
`(33,32,29)`, browser `(199,191,177)`, empty-entry native `(70,64,57)`,
empty-entry delta **129**.

They do not all match an already-labelled residual.

| Subset | Pixels | Empty-entry pair | Bind |
| --- | ---: | --- | --- |
| Row residual | **144** | Over 2, inside `[0,32,320,64]` | Already-labelled empty-entry row ([row 1916](sound-empty-row-2026-10-04.md); post-grid row residual **1812**). Not reopened. |
| Footer residual | **53** | Over 2, inside `[0,178,320,240]` | Already-labelled footer **4707** ([footer](sound-empty-footer-2026-10-04.md)), including the peak. Not reopened. |
| Tolerance miss | **531** | Already within 2 | Unlabelled. **13** sit in the row rectangle, **480** in the footer rectangle, **16** in the slider rectangle `[0,144,320,175]`, and **22** outside those rectangles. None of those **531** are the over-threshold residual. |

**144 + 53 = 197.** Slider **377**, y=177 **320**, volume, Span, birds,
battery, and Line01 do not gain pixels from this set. The **531** are
a floor-versus-round miss around an empty-entry pair that already
matches. They are not a second checker class and not a veil.

## 68 guide-only fringe (unlabelled)

**68** pixels have a first-run browser that differs from the
empty-entry browser, and a native that is not within 2 of
`⌊empty-entry native/2⌋`. Top **25**, bottom **43**, no left or right.
**48** are green-dominant with green above 160. Six are only delta
3–5. Max delta **120** at `(305,232)`, native `(96,99,84)` / browser
`(216,216,194)`.

No unique dump pane owns them. The boxes split **22** on `ChAWdwL` and
**46** on `ChAWdwR`, with `Bird` overlapping **14** of the left-window
pixels. A source-alpha replay of those three `C_DlgChA` pictures over
the empty-entry browser matched **23** of the **68**. `C_DlgGuid1BtnW`
adds no content pane on this fringe. The **68** stay guide-only.
`C_BkMask` and the transition fades stay rejected for this complement.

## Predicted residual

Painter unchanged (`C_DlgChA`, then `C_DlgGuid1BtnW` Default frame 0,
`textSampling:'lcd-source-size'` only on `Guid1TxtW`). The next
unchanged capture of this still should hold:

| ROI | Predicted over 2 |
| --- | ---: |
| First-run complement of `[20,20,300,220]` | **6072** |
| Dimmed `S_BG_Grid` | **860** |
| Half observation, no unique pane | **4416** |
| Empty-entry browser match | **728** (**144** row residual, **53** footer residual, **531** unlabelled) |
| Guide-only fringe, no unique pane | **68** |

Whole first-run LCDs stay **6094 / 6072**. Not 1:1.

## Checks

Focused `tests/sound-guide-perimeter-20261005.test.mjs` and
`tests/sound-guide-perimeter.test.mjs`: 8 pass, 0 fail. No application
files changed, so typecheck was not rerun. `git diff --check`: clean.
This lane did not drive Azahar or preview 3021.
