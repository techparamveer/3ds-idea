# HOME 1-row tail 291 — 5 October 2026

Worker `home-row-tail-20261005` / `codex/home-row-tail-20261005` from
`ed55865e`. Sparse worktree; `node_modules` linked from HOME fidelity. No
`model/`. Docs-only recount. No painter change. No Azahar. No preview 3021.
No CDP. No recapture. No mask edit.

Leftover queue §1 asked for the unlabelled tail on the
[1-row Right walk](home-row-viewport-2026-10-04.md). Neighbour-masked lower
is **5,426** over 2/255. The six labelled 4-neighbour components total
**5,135**. The tail is **291**, in **52** of **58** components. That tail is
the queue's **108** plus **183**. This note attributes both. It does not
close the scenario. Not 1:1.

## Pair

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-row-viewport-20261004/`.
Frozen after-walk yaw 304 / COMMON 303 / Loop 338 / cursor 37. Threshold
any RGB channel >2/255. Official lower crop of the native 400×480 PNG is
`(40,240,320,240)`. Neighbour mask rectangles stay
`[32,118,80,82]` and `[112,118,88,82]`.

| Item | SHA-256 |
| --- | --- |
| Native `_26.09.26_04.14.35.203.png` | `4adc0ef0cbba7175b641fbe4107f697f15ff7a4aadd482c746e389ea7abf5bdb` |
| After-walk upper | `2a2d920edce45c295d01a7479c0d1632b3c73e2bf04d38da1ca84e54abd26a6c` |
| After-walk lower | `cd0c87d30ab440b06a70d27787d58a6959e4e631c591a0cc319c02297903921a` |
| Masked lower report | `0069238f120e100fdd74ea9d4c484bfa46144818c0e2800a29be2207b3749d96` |
| Neighbour mask | `6b64f906f07315f9252e25f2df23c4b6e92c8535ab659b9e56523f71de587f6d` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |

Recomputed with the same crop, mask and threshold as
`scripts/native-compare/compare.mjs`. Result: **5,426** lower pixels,
**58** 4-neighbour components, top six **2,220 + 1,656 + 561 + 391 + 162 +
145 = 5,135**, tail **291**. The masked report's region list matches.

## What the 108 and the 183 are

The **108** is five components, not a filled rectangle:

| Component | Pixels | Where |
| --- | ---: | --- |
| `[200,128,1,68]` | **68** | every pixel of x=200, y `[128,196)` |
| `[50,200,9,2]` | **10** | Sound shadow, lower-left corner |
| `[93,200,9,2]` | **10** | Sound shadow, lower-right corner |
| `[134,200,9,2]` | **10** | Health shadow, lower-left corner |
| `[177,200,9,2]` | **10** | Health shadow, lower-right corner |

Each box is 9 pixels on y=200 plus one pixel on y=201 (40 pixels, 36 on
y=200 and 4 on y=201). Their x ranges sit in 50–185, which is the queue's
"y=200 `x50–186`" phrase. The 1-pixel corners at `(47,200)`, `(104,200)`,
`(131,200)` and `(188,200)` are the same edge and fall in the **183**,
because they are separate components. `104` and `131` lie inside x 50–186;
they are still outside the four 10-pixel components.

The **183** is the other 47 tail components (`291 − 108`).

## Owners

EUR HOME `0004003000009802`, version 24576, content 0 / `00000082`.
Delivered `packs/home/launcher.json` SHA-256
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.
Converter `ctr-native-web` 1.2.0 / CTRTool 1.3.0.

`tile()` already draws `LncIconSetSrc_00` at Scale frame 0. Density 0
holds `P_BtnShdw_00` at size **82×81**, origin centre, translation
`(32, −2.5)`, alpha **80**. The picture is A8
`LncIconBtnShdwLT_00.bclim` (16×16, decoded SHA-256
`413a04a002a02564382932cbe31bdde7e38aec2c79f132f64bb62f6164480b34`,
source `7f92d1ecff38914a8b6d1c37e7e6ffeb3d05463b383d9f201a8d3f33d670f261`).
Layout `launcher_LZ.bin/blyt/LncIconSetSrc_00.bclyt` SHA-256
`1296496b88f41abc6c9382f59bb51927a6b8f049f9cc02454653f27d2730dcaa`.

The tile top-left is the grid centre minus 36. The draw centre is
`(centreX − 32, centreY)`, so the shadow centre is `(centreX, centreY + 2.5)`.
Half-open LCD rects for this still:

| Tile | Centre | `P_BtnShdw_00` |
| --- | --- | --- |
| Sound | (76, 161) | x `[35,117)`, y `[123,204)` |
| Health | (160, 161) | x `[119,201)`, y `[123,204)` |
| Settings | (244, 161) | x `[203,285)`, y `[123,204)` |
| About peek | (−8, 161) | x `[−49,33)`, y `[123,204)` |
| Camera peek | (328, 161) | x `[287,369)`, y `[123,204)` |

The neighbour mask ends at y=200 and, on the Health side, at x=200. The
shadow continues through y=203 and through Health x=200. Masked rows
y=198–199 already differ by 3–5 across the shadow bottom; the corners
below the rectangle are that same edge.

`cursorAt` already draws `LncCsr_00` at LCD **(244, 161)**
([cursor note](home-settings-cursor-2026-10-04.md)). `W_CsrF_00` is 95×95
on `LncCsr_41.bclim`. Its frame constants are `(144,255,234)` and
`(42,237,184)`. On this pair a tail pixel is the cursor fringe when native
green exceeds native red: the ring samples are `(218–219,220,215)` against
browser `(212–216,218–221,213–215)`. The plate and shadow samples keep red
ahead of green, `(211,207,203)` through `(223,219,215)`.

## Attribution

**108**

| Cluster | Pixels | Max | Owner |
| --- | ---: | ---: | --- |
| x=200, y 143–180 | **38** | 5 | Health `P_BtnShdw_00` right column, outside the mask. Native `(223,219,215)`; x=201 matches; masked x=199 is the same ramp one step darker. |
| x=200, y 128–142 and 181–195 | **30** | 6 | Cursor fringe on that same column. Native green leads red, the same pair as the y=118 ticks. |
| Four 10-pixel corners | **40** | 4 | Sound and Health `P_BtnShdw_00` bottoms, outside the mask. |

So the 108 is **78** mask-miss shadow pixels and **30** cursor-fringe pixels.

**183**

| Cluster | Pixels | Max | Owner |
| --- | ---: | ---: | --- |
| y=118 and y=205 ticks, x 210–224 and 263–277 | **60** | 3 | Cursor fringe. One row outside the green stroke that already matches. Same native `(219,220,215)` / browser `(216,221,215)` pair the [footer note](home-footer-edges-2026-10-04.md) measured at y=205. |
| Other green tail pixels (ring crumbs, including the green samples on x=203 and x=284) | **40** | 5 | Cursor fringe, 4-disconnected from the labelled **1,656**. |
| x=203 and x=284, y 147–176 | **60** | 4 | Settings `P_BtnShdw_00` left and right columns (the rect is x `[203,285)`). Beige; the cursor texture is not the visible surface here. |
| About / Camera shadow crumbs | **17** | 4 | Same peek faces as the labelled **2,220 / 561 / 391 / 145** ([peeks](home-neighbor-peeks-2026-10-04.md)). |
| `(47,200)`, `(104,200)`, `(131,200)`, `(188,200)` | **4** | 3 | The same Sound / Health shadow corners, one pixel off the 10-pixel components. Mask miss. |
| `[165,14,2,1]` | **2** | 4 | News lamp, the extra component already named beside the **162** ([lamp](home-toolbar-icon-2026-10-04.md)). |

So the 183 is **100** cursor fringe, **4** mask miss, **60** Settings shadow
edge, **17** peek crumbs and **2** lamp pixels.

## Sum

| Owner | Pixels | Already named as |
| --- | ---: | --- |
| `LncCsr_00` fringe | **130** | the **1,656** Settings+cursor halo |
| Neighbour `P_BtnShdw_00` outside the mask | **82** | Sound / Health faces the mask was drawn to hide |
| Settings `P_BtnShdw_00` edge | **60** | the Settings plate under that halo |
| Peek shadow crumbs | **17** | About / Camera peeks |
| `N_NewsRcv_00` lamp | **2** | the **162** lamp |
| Unlabelled | **0** | |

`130 + 82 + 60 + 17 + 2 = 291`. With the six labelled components,
`5,135 + 291 = 5,426`.

## Why the painter stays

`LncIconSetSrc_00` Scale 0 already includes `P_BtnShdw_00`. `LncCsr_00` is
already the cursor bind. The lamp layout and the arrow/peek bind are
unchanged from their notes. These 291 pixels are 4-neighbour gaps and a
mask rectangle that stops on y=200 / Health x=200, short of the 82×81
shadow. Channel error on the tail is 3–6. No unused pane, texture or
sampler accounts for them. The painter is unchanged, so a recapture of
this frozen route still scores masked lower **5,426** and upper **190**.

Upper **190**, the **1,656** halo, the neighbour-face interiors, the peek
bodies, the lamp body and footer Manual / Open stay as labelled. Whole
scenario 1:1 still fails. Matrix unchanged.
