# Independent review — Sound first-run 5212 subsets — 5 October 2026

Grok 4.6 on `codex/sound-perimeter-5212-subsets-review-20261005` at
`6e2cff7e`. Review of leftover worker
`codex/sound-perimeter-5212-subsets-20261005` / note
[subsets](sound-perimeter-5212-subsets-2026-10-05.md), after veil
**REJECT** `be862ce6` ([review](sound-perimeter-5212-review-2026-10-05.md)).
Different model from the leftover worker (Grok 4.7). Docs and tests
only. No Azahar, production `:3000`, preview 3021, or CDP. Sparse
checkout without `model/`. This lane did not recapture and did not
change the painter.

**Verdict: APPROVE-WITH-NITS** of `6e2cff7e`.

The frozen complement stays **6072** = **860** dimmed dump grid
(kept) + **4416** unlabelled half + **728** (**144** labelled
empty-entry row + **53** labelled footer + **531** already within 2)
+ **68** unlabelled guide fringe. No unique pane owns the **4416**
or the **68**. The veil is not restored. Predicted complement
**6072**. This is not 1:1. Tests and this note do not close pixels,
input, motion, or audio.

## Assigned leftover

Queue §2 ([leftover-queue](feature-map/leftover-queue-2026-10-05.md)):
source-only labels for perimeter **5212** subsets after veil **REJECT**
`be862ce6`. Worker claim: complement of `[20,20,300,220]` is **6072** =
**860** + **4416** + **728** + **68**, with **728** = **144** + **53**
+ **531**. Painter unchanged.

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

Recounted the hashed post-grid pair independently. Whole lower **6072**,
max **166** at `(296,234)`. Interior `[20,20,300,220]` **0**. Complement
**6072**. Bands **1487 / 1200 / 1170 / 2215**. Mixed same-XOR-near after
grid/half: **0**. Empty-entry pair on this browser is lower **7216**,
row `[0,32,320,64]` **1812**, footer `[0,178,320,240]` **4707**, slider
`[0,144,320,175]` **377**.

## Dump identity

EUR Sound `0004001000022500` v3088, content index 0 / `0000000b`.
Extracted dump `exefs/code.bin` SHA-256
`3c57f2c4091c1bec6b3834609f1e2a6488712e21775d7548b441c69c60b3e5a9`.
Romfs `lyt/S_BG.arc.LZ` SHA-256
`944b1cf9a81eac5b162001ac6b9a5dfae63513e1dc45981c87496c159fd0d434`,
unpacked with `scripts/unpack_home_resources.py`. Romfs `lyt/C.LZ` is
LZ11 over a named-file container, not a DARC (`7b76a89a…`); CLYT/CLIM
members below are hashed out of that decompressed payload. Pack
`sourceSha256` `96771724…` is the converted Dlg archive, not this romfs
file. Public pack JSON `0332bab6…`. Converter **ctr-native-web 1.2.0**.

| Element | Dump path | SHA-256 |
| --- | --- | --- |
| `S_BG_Grid.bclim` | `timg/S_BG_Grid.bclim` | `138b6fc990989d157e970a65d92999e9a81370e9ce02281581da8c6f516c46f3` |
| Decoded public PNG | pack `textures/7407446c….png` | `7407446ca0120cd4b13a02eb1af7215602e82f5aec9f270005715e1732a9b237` |
| `S_BG_D-Grid` | `blyt/S_BG_D-Grid.bclyt` | `925f961ae0eed19b4ab5318d61e0fa609aa465cdd0202f73c6772661647669d6` |
| `S_BG_D-Grid_Default` | `anim/S_BG_D-Grid_Default.bclan` | `4dc57eec9552dd8513f3786a727856d7b8e08c7b27f33083a4619d8c8d2009c9` |
| `C_DlgChA` | `Dlg/blyt/C_DlgChA.bclyt` | `4d35e4b38ae75fa7ad8c8f2d2484bd200856b562ee4c493b13adbc765c5eb8d7` |
| `C_DlgChBase.bclim` | `Dlg/timg/C_DlgChBase.bclim` | `a9fa4c68c3ad4222c9e5da2df047b2bc8cf38d227ab296e2e4e04d0bf4a18b03` |
| `C_DlgChBirdA.bclim` | `Dlg/timg/C_DlgChBirdA.bclim` | `2292ed3ea2f3c3db3623b8790f836c5f77d03dd733ea1b6da9a0e8c72dda4adf` |
| `C_DlgChLay6.bclim` | `Dlg/timg/C_DlgChLay6.bclim` | `9117e20bacdc6288f636802066875c786a7b09032518a032cad0d38113387423` |

Dump ETC1 64×64 is **2048** `(223,215,206)` and **2048** `(231,223,215)`.
Posed `S_BG_D-Grid` Default frame 0 is only those colours: **37536** /
**39264**. `⌊grid/2⌋` is `(111,107,103)` and `(115,111,107)`.

`C_DlgChA` origin-4 LCD boxes from dump size/translation: `ChAWdwL`
`[6,5,294,235]`, `ChAWdwR` `[294,5,314,235]`, `Bird` `[8,183,52,235]`.
`C_DlgGuid1BtnW` has no fullscreen `pic1`. World `Guid1BtnW` (parent
`-B-Guid1BtnW` ty −84) is `[95,183,225,227]`; `TxtDlg` is
`[20,19,300,171]`. Over-threshold complement pixels in those two boxes:
**0**.

## Bind-by-bind

| Bind | Independent count | Verdict |
| --- | ---: | --- |
| Complement of `[20,20,300,220]` | **6072** | Confirm |
| Dimmed `S_BG_Grid` (browser = posed texel, native = exact `⌊grid/2⌋`) | **860** (dark **464**, light **396**; bands **56 / 656 / 148 / 0**) | Confirm, keep |
| Half observation, within 2 of `round(browser/2)`, not the **860** | **4416** (bands **1404 / 349 / 977 / 1686**; **3723** with a channel >30, median ratio **0.497** on **11109** channels; **693** darker). `ChAWdwL` **406**, `ChAWdwR` **114**, `Bird` **66**. RootPane is 320×240. | Confirm unlabelled; no unique pane |
| Empty-entry browser match, native within 2 of `⌊empty native/2⌋` | **728** | Confirm |
| Of **728**, empty-entry over 2 inside `[0,32,320,64]` | **144** | Confirm as already-labelled row ([row 1916](sound-empty-row-2026-10-04.md); post-grid row **1812**). Not reopened. |
| Of **728**, empty-entry over 2 inside `[0,178,320,240]` | **53**, including peak `(296,234)` native `(33,32,29)` / browser `(199,191,177)` / empty-entry native `(70,64,57)` / empty-entry delta **129** | Confirm as already-labelled footer ([footer](sound-empty-footer-2026-10-04.md) **4707**). Not reopened. |
| Of **728**, empty-entry already within 2 | **531** (**13** row rect, **480** footer, **16** slider, **22** outside). Slider over **0**, y=177 over **0**. | Confirm unlabelled |
| Guide-only fringe | **68** (top **25**, bottom **43**; `ChAWdwL` **22**, `ChAWdwR` **46**, `Bird` **14**; six delta 3–5; max **120** at `(305,232)`). | Confirm unlabelled; no unique pane |

`6072 = 860 + 4416 + 728 + 68`. Slider **377**, y=177 **320**, volume,
Span, birds, battery, and Line01 stay closed. Painter stays `C_DlgChA`
then `C_DlgGuid1BtnW` Default frame 0, `textSampling:'lcd-source-size'`
only on `Guid1TxtW`. No `C_BkMask` / transition fade / `azahar-12p4-fit`.

## Nits

The **144** / **53** counts are the dim class only. The **4416** still
contains **48** empty-entry row-over pixels and **338** footer-over
pixels. Those stay in the half observation; they are not a second row
or footer bind on this first-run pair. A later leftover must not treat
first-run ∩ empty-entry row residual as **144**.

A pane-sized source-over of dump `ChAWdwL` / `ChAWdwR` / `Bird` onto
empty-entry `860b3222…` matched **0** of the **68** (six within 5). The
worker **23** replay is not reproduced here. That number is not needed
to leave the **68** unlabelled.

Green-dominant with G≥R, G≥B and G>160 is **53** of the **68**, not
the worker **48**. Colour description only.

## Predicted residual

Painter unchanged, so the next unchanged capture of this still should
hold:

| ROI | Predicted over 2 |
| --- | ---: |
| First-run complement of `[20,20,300,220]` | **6072** |
| Dimmed `S_BG_Grid` | **860** |
| Half observation, no unique pane | **4416** |
| Empty-entry browser match | **728** (**144** row residual, **53** footer residual, **531** unlabelled) |
| Guide-only fringe, no unique pane | **68** |

Whole first-run LCDs stay **6094 / 6072**. Not 1:1.

## Checks

Focused `tests/sound-guide-perimeter-20261005.test.mjs`: 4 pass, 0 fail.
No application files changed, so typecheck was not rerun.
`git diff --check`: clean. This lane did not drive Azahar or preview 3021.
