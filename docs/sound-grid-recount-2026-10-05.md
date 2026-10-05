# Sound slider and guide perimeter after the grid bind — 5 October 2026

Worker on `codex/sound-grid-recount-20261005` from `000814dc`. Sparse
worktree; `node_modules` linked from HOME fidelity. No `model/`. No painter
change. No Azahar. No production browser. No preview 3021. No CDP. No
recapture. Row, footer, title, Span, birds, volume, battery and Line01 are
not reopened.

This recount labels the frozen post-grid pixels. It is not a 1:1 claim.
Tests and this note do not close pixels, input, motion or audio.

## Pairs (reused, not recaptured)

The `sound-grid-recapture-20261005/` directory is not on the firmware
artifact volume. The pair is the coordinator capture at `603c5388` under
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/sound-grid-recapture-20261005/`.
Empty mask `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`
(`maskedPixels` 0). Threshold: any RGB channel greater than 2. Native lower
crop of each 400×480 PNG is `(40,240,320,240)`.

| File | SHA-256 | Role |
| --- | --- | --- |
| `Nintendo 3DS Sound_25.09.26_22.31.31.595.png` | `65fc5f8819d31c49622d9e2a8ee7ba79c0675fd7dd3a73f783255eb7efe3b4cd` | empty-entry native |
| `browser-sound-empty-entry/lower.png` | `860b3222fd21e1976ee5e5af6caf6072a90abf54b5831cc84aa8a592742aacd5` | post-grid empty-entry |
| `diff-sound-empty-entry/report.json` | `4a5bc73c9c3c2c4c3ce2a7aeee6e7e5a10a361c8198a97f6129b2348e05f91d0` | lower **7216** |
| `Nintendo 3DS Sound_25.09.26_22.27.14.541.png` | `9dea0cc2fa7022ccd032c5a94ae59c2dbe37e6b7e800fbf8668b356fc9e5ce69` | first-run native |
| `browser-sound-first-run/lower.png` | `cd0ce7172dfe63d90c869777291ec7082c501423e0e63732879795f5175c0a1f` | post-grid first-run |
| `browser-sound-first-run/upper.png` | `16565d8e586edce659beadb9e7f7d72bcd8e2b81479a85bca424480d4294ceab` | same upper as `a5b8aa9e` |
| `diff-sound-first-run/report.json` | `8f6a13943eb36a0682792f14fd6d3349dc9824f231d1230ee6a494dcae84c5a4` | lower **6072** |

The first-run recount uses this post-grid lower. It is not blocked on the
pre-grid `a5b8aa9e` still. That still's lower was `d78f43b6…`. The upper
hash did not change. No later Sound first-run pair is in the overflow root.

Pre-grid empty-entry lower `ee103d93…` is the comparison for what the grid
bind closed. `decode_bclim` on dump `S_BG_Grid.bclim` (`138b6fc9…`, ETC1
64×64) is 2048 `(223,215,206)` and 2048 `(231,223,215)`, and those texels
match the public PNG. The posed `S_BG_D-Grid` Default 0 raster is only those
two colours (37536 / 39264).

## Slider ROI

Half-open `[0,144,320,175]` on empty-entry. Pre-grid **4271** (max 195 at
`(39,152)`). Post-grid **377** (same peak: native `(60,47,47)`, browser
`(255,51,68)`). Whole lower on this report is **7216**. Mid
`[41,96,88,144]` and `[136,116,184,144]` are **0 / 0**.

| What closed inside the ROI | Pixels |
| --- | ---: |
| Were over 2, now at most 2 | **3894** |
| Of those, pre-grid browser was fill `(229,224,216)` and native was the grid texel | **2767** |
| Other ROI pixels the live composite matched | **1127** |

The offline FILL substitute predicted **1504**. Live **377** is that
prediction minus the **1127** blends the substitute did not re-blend.
`320 + 57 + 1127 = 1504` and `1504 + 2767 = 4271`. Checker share of the
remaining ROI is **0**.

| Remaining owner | Pixels | Dump |
| --- | ---: | --- |
| `UserWdwEdge` y=174 | **320** | `V2C_UserWdwEdge.bclim` LA8. `decode_bclim`: row 0 is `(255,255,255,11)` on all 8 texels. Every pixel is native `(50,119,239)` / browser `(51,119,236)`, max 3. Same edge as [y=177](sound-empty-y177-2026-10-05.md), alpha 11 instead of 25. |
| `IconS` component `{38,152,4×14}` | **56** | `C.LZ` `timg/C_SldHL_IconS.bclim` `dba15535…`, L8 8×16. **52** native pixels equal the posed `C_SldH_L` raster (peak `(60,47,47)`); browser is `(255,51,68)`. **4** corners match neither. |
| `BtnP` at `(18,151)` | **1** | Browser equals the `C_SldHL_BtnPN` raster `(241,239,236)`. Native is `(232,230,228)`, max 9. `IconP` alpha at that texel is 0. |

The **57** `C_SldH_L` pixels are the slider gap the [4271 note](sound-empty-slider-2026-10-04.md) still owns. The **320** are the edge, not the checker and not the tick. The painter stays on Default 20 and Rate 0. No unused clip found in that review is selected here.

On this same lower, footer `[0,178,320,240]` stays **4707**. Row
`[0,32,320,64]` is **1812** (was **1916**). The **104** that closed are not
bare grid texels. The row label is not reopened.

## First-run perimeter

Complement of `[20,20,300,220]`. Interior **0** (max 2). Complement **6072**.
Bands **1487 / 1200 / 1170 / 2215**. Peak `(296,234)` is still native
`(33,32,29)` / browser `(199,191,177)`. The over-threshold set is the same
6072 pixels as post-Next `d78f43b6…` (none gained, none lost). Whole upper
stays **6094**.

| Complement pixels over 2 | Count |
| --- | ---: |
| Browser equals the dump grid and native equals `⌊grid/2⌋` | **860** |
| Those 860 on the pre-grid browser were fill `(229,224,216)` | **860** |
| Browser is still the flat fill | **0** |
| Within 2 of `round(browser/2)` | **5276** |
| Not within 2 of `round(browser/2)` | **796** |
| Not the bare checker | **5212** |

The **860** sit in the top / left / right bands (**56 / 656 / 148**); the
bottom band has none. Native still has **488** `(111,107,103)` and **396**
`(115,111,107)` on the complement (**884**). **864** of those equal
`⌊grid/2⌋` in phase. The queue's 464 + 396 and the old **4760 / 1312**
split were measured while the browser was the flat fill. On this pair the
half observation is **5276 / 796**, and the **860** checker pixels are inside
the 5276. Half of the browser remains an observation, not a verified blend.

The **5212** are not dump checker texels. The peak is in that set: the grid
texel there is `(231,223,215)`, and the browser is not that colour. The
missing veil evidence in the [perimeter note](sound-guide-perimeter-2026-10-05.md)
is unchanged. The painter is unchanged.

## Predicted residuals

Painter unchanged, so the next unchanged capture of these stills should
hold:

| ROI | Predicted over 2 |
| --- | ---: |
| Empty-entry slider `[0,144,320,175]` | **377** (checker **0**; edge **320**; `C_SldH_L` **57**) |
| First-run complement of `[20,20,300,220]` | **6072** (**860** dimmed grid, **5212** other) |

Whole scenarios stay fail. Not 1:1.

## Checks

Focused `tests/sound-empty-slider.test.mjs`, `tests/sound-empty-mid.test.mjs`,
`tests/sound-empty-y177.test.mjs`, `tests/sound-guide-perimeter-20261005.test.mjs`
and `tests/sound-guide-perimeter.test.mjs`: 18 pass, 0 fail.

- `npm run typecheck`: pass.
- `npm test`: 2135 pass, 36 fail, 23 skip, 1 todo (2195 tests). All 36
  failures are `ENOENT` on `model/candidates/…` files this sparse checkout
  does not include.
- `git diff --check`: clean.

This lane did not drive Azahar or preview 3021.
