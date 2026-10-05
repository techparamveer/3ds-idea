# Independent review — Sound first-run perimeter 5212 — 5 October 2026

Grok 4.7 on `codex/sound-perimeter-5212-review-20261005` at `2b6e408d`.
Review of the compositor/veil claim on the non-checker complement, after
[grid recount](sound-grid-recount-2026-10-05.md). Original label
[perimeter 6072](sound-guide-perimeter-2026-10-05.md), Grok 4.6
**APPROVE** `6cc31903`. Different model from the recount worker. Docs
only. No Azahar, production `:3000`, preview 3021, or CDP. Sparse
checkout without `model/`. This lane did not recapture and did not
change the painter.

**Verdict: REJECT** of the compositor/veil source-gap as the owner of
the **5212**.

The frozen complement stays **6072** = **860** dimmed dump grid +
**5212** other. The **5212** are three different sets: **4416** within
2 of `round(browser/2)`, **728** dimmed empty-entry mismatches, and
**68** guide-only fringe. No unique pane, clip, frame, or blend owns
that union. Predicted complement **6072**. This is not 1:1. Tests and
this note do not close pixels, input, motion, or audio.

## Assigned leftover

Queue §2 ([leftover-queue](feature-map/leftover-queue-2026-10-05.md)):
Sound first-run perimeter **6072**, compositor gap **APPROVE**
`6cc31903`. Recount on post-grid lower `cd0ce717…`: complement of
`[20,20,300,220]` is **6072**; **860** are dump grid on the browser and
`⌊grid/2⌋` on native; **5212** are not the checker. The veil evidence
in the perimeter note is the absence of a unique owner. That absence
does not become an owner for the **5212**.

## Pair (reused, not recaptured)

Empty mask `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`
(`maskedPixels` 0). Threshold: any RGB channel greater than 2. Native
lower crop of the 400×480 PNG is `(40,240,320,240)`. Files under
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/sound-grid-recapture-20261005/`.

| File | SHA-256 | Role |
| --- | --- | --- |
| `Nintendo 3DS Sound_25.09.26_22.27.14.541.png` | `9dea0cc2fa7022ccd032c5a94ae59c2dbe37e6b7e800fbf8668b356fc9e5ce69` | first-run native |
| `browser-sound-first-run/lower.png` | `cd0ce7172dfe63d90c869777291ec7082c501423e0e63732879795f5175c0a1f` | post-grid lower |
| `browser-sound-first-run/upper.png` | `16565d8e586edce659beadb9e7f7d72bcd8e2b81479a85bca424480d4294ceab` | same upper as `a5b8aa9e` |
| `diff-sound-first-run/report.json` | `8f6a13943eb36a0682792f14fd6d3349dc9824f231d1230ee6a494dcae84c5a4` | lower **6072**, commit `603c5388` |
| Pre-grid lower `d78f43b6…` | `d78f43b62aebae3069e5308f46b59a9071587dca28ee07b38d7f77cd5ca34169` | same 6072 pixel set |
| Empty-entry browser `860b3222…` | `860b3222fd21e1976ee5e5af6caf6072a90abf54b5831cc84aa8a592742aacd5` | underlay check |
| Empty-entry native `65fc5f88…` | `65fc5f8819d31c49622d9e2a8ee7ba79c0675fd7dd3a73f783255eb7efe3b4cd` | underlay check |

Recounted the hashed post-grid pair. Whole lower **6072**. Interior
`[20,20,300,220]` **0** (max 2). Complement **6072**. Bands
**1487 / 1200 / 1170 / 2215**. Peak `(296,234)` is native `(33,32,29)`
/ browser `(199,191,177)`. Against `d78f43b6…` the over-threshold set
gained **0** and lost **0**. Flat fill `(229,224,216)` on this browser
is **0**. Half-split on `round(browser/2)` within 2 is **5276 / 796**.

## Dump identity

EUR Sound `0004001000022500` v3088, content index 0 / `0000000b`.
`exefs/code.bin` SHA-256
`3c57f2c4091c1bec6b3834609f1e2a6488712e21775d7548b441c69c60b3e5a9`.
Archive `lyt/S_BG.arc.LZ` SHA-256
`944b1cf9a81eac5b162001ac6b9a5dfae63513e1dc45981c87496c159fd0d434`.
This pass unpacked that archive with `scripts/unpack_home_resources.py`
and decoded the grid with `scripts/firmware/texture.py` `decode_bclim`.
The guide call-graph in the [perimeter note](sound-guide-perimeter-2026-10-05.md)
was not repeated.

| Element | Dump path | SHA-256 |
| --- | --- | --- |
| `S_BG_Grid.bclim` | `timg/S_BG_Grid.bclim` | `138b6fc990989d157e970a65d92999e9a81370e9ce02281581da8c6f516c46f3` |
| Decoded public PNG | pack `textures/7407446c….png` | `7407446ca0120cd4b13a02eb1af7215602e82f5aec9f270005715e1732a9b237` |
| `S_BG_D-Grid` | `blyt/S_BG_D-Grid.bclyt` | `925f961ae0eed19b4ab5318d61e0fa609aa465cdd0202f73c6772661647669d6` |
| `S_BG_D-Grid_Default` | `anim/S_BG_D-Grid_Default.bclan` | `4dc57eec9552dd8513f3786a727856d7b8e08c7b27f33083a4619d8c8d2009c9` |

Dump ETC1 is 64×64: **2048** `(223,215,206,255)` and **2048**
`(231,223,215,255)`. The posed `S_BG_D-Grid` Default frame 0 raster,
`BG_Grid` alpha **255**, nearest wrap, scale `(3.35, 2.5)`, is only
those two colours: **37536** / **39264**. `⌊grid/2⌋` is
`(111,107,103)` and `(115,111,107)`. Default holds alpha 255. In is
0→255 over 5 frames. Out is 255→0 over 3 frames. No held partial alpha.

## 860 dimmed grid

On the complement, **860** pixels have the browser equal to the posed
grid texel and the native equal to exact `⌊grid/2⌋`.

| | Count |
| --- | ---: |
| Dark `(223,215,206)` → `(111,107,103)` | **464** |
| Light `(231,223,215)` → `(115,111,107)` | **396** |
| Top / left / right / bottom | **56 / 656 / 148 / 0** |
| Pre-grid browser was fill `(229,224,216)` | **860** |
| Empty-entry browser equals this browser | **860** |
| Empty-entry pair already within 2 | **860** |

Native also has **488** `(111,107,103)` and **396** `(115,111,107)`
on the complement (**884**). **864** equal `⌊grid/2⌋` in phase with
the posed texel. The **24** beyond the **860** sit in the **5212**.
They are not a second checker class.

## Why the 5212 are not the veil

`6072 = 860 + 4416 + 728 + 68`. The half-split is the same cut:
`5276 = 860 + 4416` and `796 = 728 + 68`.

| Set | Pixels | What the pair shows |
| --- | ---: | --- |
| Half observation | **4416** | Within 2 of `round(browser/2)`. Bands **1404 / 349 / 977 / 1686**. **3723** have a browser channel above 30; median native/browser ratio on those channels is **0.497** (10989 channels). **693** are darker, so “within 2 of half” is a wide relative band. |
| Dimmed empty-entry mismatch | **728** | Browser byte-identical to empty-entry `860b3222…`. Native within 2 of `⌊empty-entry native/2⌋`. Empty-entry itself is already over 2. Includes the peak `(296,234)`: empty-entry delta **129**, first-run delta **166**. Bands **2 / 195 / 45 / 486**. |
| Guide-only fringe | **68** | First-run browser differs from the empty-entry browser, and native is not within 2 of `⌊empty-entry native/2⌋`. Top **25**, bottom **43**. **48** are green-dominant with green above 160. Max delta **120** at `(305,232)`. Six pixels are only delta 3–5. |

The [perimeter note](sound-guide-perimeter-2026-10-05.md) already
records that half intensity is an observation, and that `C_BkMask`,
the transition fades, and a darken blend do not own the complement.
This pass does not find a replacement pane for the **5212**. The
**728** already fail on the empty-entry pair, so a guide veil is the
wrong owner. The **68** are guide pixels outside `[20,20,300,220]`
that the empty-entry browser does not share. The **4416** stay an
unlabelled half observation. Empty-entry row, slider, and footer
labels are not reopened.

The painter stays `C_DlgChA` then `C_DlgGuid1BtnW` Default frame 0,
with `textSampling:'lcd-source-size'` only on `Guid1TxtW`. No
perimeter veil is added.

## Predicted residual

Painter unchanged, so the next unchanged capture of this still should
hold:

| ROI | Predicted over 2 |
| --- | ---: |
| First-run complement of `[20,20,300,220]` | **6072** (**860** dimmed grid + **5212** unlabelled) |
| Of the **5212** | **4416** half observation, **728** dimmed empty-entry mismatch, **68** guide-only fringe |

Whole first-run LCDs stay **6094 / 6072**. Not 1:1.

## Checks

Focused `tests/sound-guide-perimeter-20261005.test.mjs` and
`tests/sound-guide-perimeter.test.mjs`: 7 pass, 0 fail. No application
files changed, so typecheck was not rerun. `git diff --check`: clean.
This lane did not drive Azahar or preview 3021.
