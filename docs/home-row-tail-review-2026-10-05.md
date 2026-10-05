# Independent review — HOME 1-row tail 291 — 5 October 2026

Grok 4.6 `home-row-tail-review-20261005` on
`/Users/paramveer/.codex/worktrees/home-row-tail-review-20261005`
(`codex/home-row-tail-review-20261005` at `2b6e408d`). Review of leftover
`cb324a43` / worker `codex/home-row-tail-20261005` at `7422a3e6`. Worker
note [home-row-tail](home-row-tail-2026-10-05.md). Different model from
that leftover worker. Docs and tests only. No Azahar, production `:3000`,
preview 3021, or CDP. Sparse checkout without `model/`. This lane did not
recapture, did not edit the painter, and did not byte-grep `code.bin`.

**Verdict: APPROVE** of `cb324a43`.

Keep the labelled source-gap. Independent dump decode of
`LncIconSetSrc_00` `P_BtnShdw_00`, `LncCsr_00`, and `N_NewsRcv_00` plus
the frozen neighbour-masked pair confirm tail **291**, unlabelled **0**.
Predicted masked lower **5426**. This is not 1:1. Tests and this note do
not close pixels, input, motion, or audio.

## Assigned leftover

Queue §1 ([leftover-queue](feature-map/leftover-queue-2026-10-05.md)):
HOME 1-row Right walk, yaw 304. Worker note:
[home-row-tail](home-row-tail-2026-10-05.md). Neighbour-face interiors,
the **1,656** Settings+cursor halo, the **162** lamp body, peeks, footer
Manual / Open, and upper **190** stay labelled and are not reopened.

## Pair (reused, not recaptured)

Neighbour mask rectangles `[32,118,80,82]` and `[112,118,88,82]`.
Threshold any RGB channel >2/255. Official lower crop of the native
400×480 PNG is `(40,240,320,240)`. Frozen after-walk yaw 304 / COMMON
303 / Loop 338 / cursor 37.

| Item | SHA-256 |
| --- | --- |
| Native `_26.09.26_04.14.35.203.png` | `4adc0ef0cbba7175b641fbe4107f697f15ff7a4aadd482c746e389ea7abf5bdb` |
| After-walk upper | `2a2d920edce45c295d01a7479c0d1632b3c73e2bf04d38da1ca84e54abd26a6c` |
| After-walk lower | `cd0c87d30ab440b06a70d27787d58a6959e4e631c591a0cc319c02297903921a` |
| Masked lower report | `0069238f120e100fdd74ea9d4c484bfa46144818c0e2800a29be2207b3749d96` |
| Neighbour mask | `6b64f906f07315f9252e25f2df23c4b6e92c8535ab659b9e56523f71de587f6d` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |

Recomputed with `scripts/native-compare/compare.mjs` crop, mask, 4-neighbour
regions, and threshold: lower **5,426**, upper **190**, **58** components.
Top six **2,220 + 1,656 + 561 + 391 + 162 + 145 = 5,135**. Tail **291** in
the other **52**. The hashed report's region list matches.

## Dump identity

EUR HOME `0004003000009802`, content 0 / `00000082`. Archive
`romfs/launcher_LZ.bin` SHA-256
`826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`
(unpacked from the pinned dump copy; equals published
`packs/home/launcher.json` `sourceSha256`). Delivered pack SHA-256
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.
LZ11/DARC unpacked with `scripts/unpack_home_resources.py`. Layouts with
`scripts/firmware/native.py` `decode_layout` / `decode_animation`. Texture
with `scripts/firmware/texture.py` `decode_bclim`. Converter
**ctr-native-web 1.2.0**, extractor CTRTool **1.3.0**. Dump BCLYT/BCLIM
bytes equal the published `resourceSources` hashes.

| Element | Manifest / pack | Dump source | SHA-256 |
| --- | --- | --- | --- |
| Launcher archive | `packs/home/launcher.json` | `romfs/launcher_LZ.bin` | `826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834` |
| Ordinary source | `resourceSources.layouts.LncIconSetSrc_00` | `blyt/LncIconSetSrc_00.bclyt` | `1296496b88f41abc6c9382f59bb51927a6b8f049f9cc02454653f27d2730dcaa` |
| Density pose | `resourceSources.animations.LncIconSetSrc_00_Scale` | `anim/LncIconSetSrc_00_Scale.bclan` | `ffbd67a63b4ea0a9396edb95a1f5d44c309131930f8a7de4efd92b092b68a4a6` |
| Shadow map | pack texture `LncIconBtnShdwLT_00.bclim` | `timg/LncIconBtnShdwLT_00.bclim` | BCLIM `7f92d1ecff38914a8b6d1c37e7e6ffeb3d05463b383d9f201a8d3f33d670f261`; decoded A8 16×16 PNG `413a04a002a02564382932cbe31bdde7e38aec2c79f132f64bb62f6164480b34` |
| Cursor | `resourceSources.layouts.LncCsr_00` | `blyt/LncCsr_00.bclyt` | `72f59f9f3d0a327c6c1e3e012a1aa9f1a1a84ab3d0c829772ae4a2a43ecd0738` |
| Lower base | `resourceSources.layouts.LncBase_D_01` | `blyt/LncBase_D_01.bclyt` | `787e6b58e0455130ae1f7f4f35a5edf4472c8a21151a53bbce782e813fab5adf` |
| Receive lamp | `resourceSources.layouts.LncRcvLampSrc_01` | `blyt/LncRcvLampSrc_01.bclyt` | `799596bcb744ea79ed9a59ab3fc716b7a6fa2760a2ba2174410d928003a56a6d` |

Dump `decode_bclim` PNG bytes equal the published shadow PNG.

## Geometry from the dump, not the worker note

`tile()` already draws `LncIconSetSrc_00` at Scale frame 0. Dump
`P_BtnShdw_00` is a direct child of `RootPane`, origin 4, alpha **80**,
size **82×81**, translation `(32, −2.5)`, texture
`LncIconBtnShdwLT_00.bclim` A8. Scale keys begin at frame 1 with those
same size and Y values, so density-0 / frame-0 is the authored pane.
Draw centre is grid centre minus 32 on X. Shadow centre is therefore
`(centreX, centreY + 2.5)`. Half-open LCD rects on this still:

| Tile | Centre | `P_BtnShdw_00` |
| --- | --- | --- |
| Sound | (76, 161) | x `[35,117)`, y `[123,204)` |
| Health | (160, 161) | x `[119,201)`, y `[123,204)` |
| Settings | (244, 161) | x `[203,285)`, y `[123,204)` |
| About peek | (−8, 161) | x `[−49,33)`, y `[123,204)` |
| Camera peek | (328, 161) | x `[287,369)`, y `[123,204)` |

The neighbour mask ends at y=200 and, on Health, at x=200. The 82×81
shadow continues through y=203 and Health x=200.

`cursorAt` already draws `LncCsr_00` at LCD **(244, 161)**. Dump
`W_CsrF_00` is 95×95 origin 4 on `LncCsr_41.bclim`. Material
`W_CsrF_00LT` constants are `(144,255,234)` and `(42,237,184)`. A tail
pixel is cursor fringe when native green exceeds native red; plate and
shadow samples keep red ≥ green, `(211,207,203)` through `(223,219,215)`.

`N_NewsRcv_00` is an empty `pan1` 4×4 at `(11, 113)`; LCD centre
**(171, 7)**. Delivered `LncRcvLampSrc_01` `P_Rcv_00` is 22×22 around
that point.

## Attribution (independent pixel walk)

Queue **108** (five components) recounts as **68** on x=200, y `[128,196)`
plus four **10**-pixel boxes at `[50,200,9,2]`, `[93,200,9,2]`,
`[134,200,9,2]`, `[177,200,9,2]`. On that column, native green leads red
for **30** pixels (y 128–142 and 181–195) and does not for **38** (y
143–180, Health shadow, native `(223,219,215)` except the y=143 equal
`(220,220,215)`). The four boxes sit on Sound / Health shadow bottoms
outside the mask. So the 108 is **78** mask-miss `P_BtnShdw_00` + **30**
cursor fringe.

The other **183** (47 components):

| Cluster | Pixels | Max | Owner |
| --- | ---: | ---: | --- |
| Native green > red, inside `W_CsrF_00` | **100** | 6 | `LncCsr_00` fringe (y=118 / y=205 ticks and 4-disconnected ring crumbs) |
| x=203 and x=284, y 147–176 | **60** | 4 | Settings `P_BtnShdw_00` left and right columns; beige, not the cursor texture |
| About / Camera `P_BtnShdw_00` | **17** | 4 | peek faces already named beside **2,220 / 561 / 391 / 145** |
| `(47,200)`, `(104,200)`, `(131,200)`, `(188,200)` | **4** | 3 | Sound / Health shadow corners, one pixel off the 10-pixel boxes |
| `[165,14,2,1]` | **2** | 4 | News lamp, extra component beside the **162** |

`100 + 4 + 60 + 17 + 2 = 183`. Whole-tail owners: cursor fringe **130**,
neighbour shadow outside the mask **82**, Settings shadow edge **60**,
peek crumbs **17**, lamp **2**. Sum **291**. Unlabelled **0**.
`5,135 + 291 = 5,426`.

## Why the painter stays

`LncIconSetSrc_00` Scale 0 already includes `P_BtnShdw_00`. `LncCsr_00`
is already the cursor bind. Lamp layout and peek/arrow binds are
unchanged from their notes. These 291 pixels are 4-neighbour gaps and a
mask that stops on y=200 / Health x=200, short of the 82×81 shadow.
Channel error on the tail is 3–6. No unused pane, texture, or sampler
accounts for them. Predicted recapture of this frozen route remains
masked lower **5,426** and upper **190**.

## Evidence

| Tier | Result |
| --- | --- |
| Source-identified | Dump `P_BtnShdw_00` 82×81 α80 `(32, −2.5)` on `LncIconBtnShdwLT_00.bclim` A8 `7f92d1ec…`; dump `W_CsrF_00` 95×95 constants `(144,255,234)` / `(42,237,184)`; dump `N_NewsRcv_00` LCD (171, 7) |
| Delivered | Existing published launcher pack `f251db1a…`. Dump BCLYT/BCLIM hashes match `resourceSources` |
| Implemented | Painter unchanged. Mask unchanged |
| Tested | No leftover-specific test. Related frozen-pair files `tests/home-settings-cursor.test.mjs` `tests/home-neighbor-peeks.test.mjs` `tests/home-toolbar-icon.test.mjs` `tests/home-footer-edges.test.mjs` `tests/home-upper-190.test.mjs` **20/20** |
| Browser-inspected | Not run |
| Native-compared | Reused frozen `home-row-viewport-20261004` pair only. Not recaptured. Not 1:1 |

## Checks

Related pair tests **20/20**. No test file was added or edited, so
`npm run typecheck` was not required. `git diff --check` clean. This
lane did not drive Azahar or preview 3021 and did not recapture.

## Remaining

Predicted masked lower **5426**. Whole HOME 1-row still fails (upper
**190**, labelled interiors, input, motion, audio). Static still only.
Not 1:1.
