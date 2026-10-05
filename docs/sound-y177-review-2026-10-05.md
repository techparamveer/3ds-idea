# Independent review — Sound empty-entry y=177 UserWdwEdge — 5 October 2026

Grok 4.6 `sound-y177-review-20261005` on
`/Users/paramveer/.codex/worktrees/sound-y177-review-20261005`
(`codex/sound-y177-review-20261005` at `daa93bca`). Review of leftover
`22e8b0a4` / worker `codex/sound-empty-y177-20261005`. Worker note
[y=177](sound-empty-y177-2026-10-05.md) (`39674eaa…`) and
`tests/sound-empty-y177.test.mjs` (`529a1e85…`). Different model from the
Grok 4.7 leftover worker. Docs and tests only. No Azahar, production
`:3000`, preview 3021, or CDP. Sparse checkout without `model/`. This lane
did not recapture and did not byte-grep `code.bin`.

**Verdict: APPROVE** of `22e8b0a4`.

Keep the source-gap. Independent dump decode of `V2C_UserWdwEdge.bclim`
plus the frozen empty-entry pair at `603c5388` confirm lower
`[0,177,320,178)` **320**, max 3. Predicted **320**. This is not 1:1.
Tests and this note do not close pixels, input, motion, or audio.

## Assigned leftover

Queue rank 3 ([leftover-queue](feature-map/leftover-queue-2026-10-05.md)):
Sound empty-entry lower y=177 line, **320** px. Worker note:
[y=177](sound-empty-y177-2026-10-05.md). Slider `[0,144,320,175]` and
footer `[0,178,320,240]` stay labelled and are not reopened.

## Pair (reused, not recaptured)

Empty mask `dc4b320b…`. Threshold any RGB channel >2/255. Official lower
crop of the native 400×480 PNG is `(40,240,320,240)`. Recapture identities
held at `603c5388`: lower **7216**, browser `860b3222…`.

| Item | SHA-256 |
| --- | --- |
| Native `Nintendo 3DS Sound_25.09.26_22.31.31.595.png` | `65fc5f8819d31c49622d9e2a8ee7ba79c0675fd7dd3a73f783255eb7efe3b4cd` |
| Browser empty-entry lower `860b3222…` (`sound-grid-recapture-20261005/`) | `860b3222fd21e1976ee5e5af6caf6072a90abf54b5831cc84aa8a592742aacd5` |
| Pre-grid browser lower `ee103d93…` | `ee103d93d744f5037fd36f24ad93403bf57298b2e1d74752da09d542023ea38d` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |

Recounted the hashed `603c5388` pair: whole lower **7216**. Row y=177 is
native `(62,127,240)` and browser `(63,127,237)` on all **320** x,
delta `(−1,0,+3)`, max **3**, over **320**. The pre-grid lower is
**16021** and differs from `860b3222…` on **17885** pixels elsewhere;
its y=177 row is the same 320 pixels. y=175 and y=176 are the same two
colours at max 2 (under threshold). y=174 is α11 of this edge, also
**320** (max 3), and already sits in the labelled slider rectangle.
Footer `[0,178,320,240]` stays **4707**.

## Dump identity

EUR Sound `0004001000022500` v3088 (`CTR-N-HESP`), content index 0 /
`0000000b`. `exefs/code.bin` SHA-256
`3c57f2c4091c1bec6b3834609f1e2a6488712e21775d7548b441c69c60b3e5a9`.
Archive `lyt/S_BG.arc.LZ` SHA-256
`944b1cf9a81eac5b162001ac6b9a5dfae63513e1dc45981c87496c159fd0d434`.
LZ11/DARC unpacked with `scripts/unpack_home_resources.py`. Layout and
clips decoded with `scripts/firmware/native.py` `decode_layout` /
`decode_animation`. Texture decoded with `scripts/firmware/texture.py`
`decode_bclim`. Converter **ctr-native-web 1.2.0**, extractor CTRTool
**1.3.0**.

| Element | Manifest / pack | Dump source | SHA-256 |
| --- | --- | --- | --- |
| BG archive | `packs/sound/contents/0000-0000000b/lyt-S_BG-arc-LZ.json` | `lyt/S_BG.arc.LZ` | `944b1cf9a81eac5b162001ac6b9a5dfae63513e1dc45981c87496c159fd0d434` |
| `S_BG_D-Ctr` | `resourceSources.layouts.S_BG_D-Ctr` | `blyt/S_BG_D-Ctr.bclyt` | `bf589d12f462d71c2edfd1c6df47eaac095fd346065c7f73ddc73ebd982b3e88` |
| Edge | pack texture `V2C_UserWdwEdge.bclim` | `timg/V2C_UserWdwEdge.bclim` | BCLIM `86425541097854567d5960fe46c8ed0fa2d191b6e14d086bc2623f286f2c5913`; decoded LA8 8×8 PNG `5cc59c9dd527dccbb83d0d31eb550eb2d629b1c6ad341afb554892361f6faf19` |
| Window | pack texture `V2C_UserWdw.bclim` | `timg/V2C_UserWdw.bclim` | BCLIM `b9e2229310ed1e097a7188cd2a1fc1776b927db537eed4719407078f1353a5a8`; decoded L8 8×8 PNG `f0e1c8ef3bdc28093427b22e79dbc84a53ff22d74eb0756bfccfb50d12282cda` |
| Colour conf | unpublished here | `lyt/S_ColConf.arc.LZ` `blyt/S_ColConf_D.bclyt` | archive `7ef09370…`; layout `5abfec3d34a895308e64e07838964f15dfc46d4d61e4585df305fa615d3a3c59` |

Dump BCLIM bytes equal the published `resourceSources` hashes. Dump
`decode_bclim` PNG bytes equal the published PNGs.

## Edge ownership

Dump `-S_BG_D-Ctr` canvas is 320×240 origin 1. `Back` sits at the layout
origin. Child order is `UserWdw`, `UserWdwSdw`, `UserWdwEdge`. On the
320×240 centre, LCD y = `120 − ty − h/2`:

| Pane | Size | Translation y | LCD y | Texture |
| --- | --- | ---: | --- | --- |
| `UserWdw` | 320×66 | −87 | 174–240 | `V2C_UserWdw.bclim` L8 |
| `UserWdwSdw` | 320×8 | −50 | 166–174 | `V2C_UserWdwSdw.bclim` LA8 |
| `UserWdwEdge` | 320×8 | −58 | 174–182 | `V2C_UserWdwEdge.bclim` LA8 |

y=177 is texture row 3 of the edge, over the opaque window. The shadow
ends at y=174. UV set is `0..1`. Pane alpha 255, flags 1, white vertices.
`UserWdwEdge` material flags 21, empty TEV, mag/min filter 1 (linear).
Pixel-centre v for LCD row 3 is 3.5/8; `tv*8 − 0.5 = 3.0`, so linear
sampling stays on that flat row.

Decoded LA8 alphas, constant across each of the first four rows:

| Texture row | LCD y | Alpha | Browser over `(42,113,235)` | Native over `(41,113,238)` |
| ---: | ---: | ---: | --- | --- |
| 0 | 174 | 11 | `(51,119,236)` | `(50,119,239)` |
| 1 | 175 | 78 | `(107,156,241)` | `(106,156,243)` |
| 2 | 176 | 51 | `(85,141,239)` | `(84,141,241)` |
| 3 | 177 | **25** | `(63,127,237)` | `(62,127,240)` |

Those four composites are the frozen stills. Each channel of y=177 has
one integer under-colour. Source register `(57,170,213)` composites to
`(76,178,217)`, which is neither still.

`UserWdw` constant 5 is dump `(57,170,213,255)`. Its three TEV stages
and white L8 field pose an opaque theme. `soundEntryBlue` replaces that
register with `S_ColConf_D` `BtnRst` constant 0 `(42,113,235,255)` on
entry chrome, and with the title capture-fit `(41,113,238,255)` only on
`TitBar` / `TitBarBvlL` / `TitBarBvlC`. The painter names neither
`UserWdw` nor `S_BG_D-Ctr_Down` / `_Up`. Those two clips are pane
`Back` `translation.y` only. No `S_BG` CLAN writes `UserWdw` /
`UserWdwEdge` material colour. `C_SldH_L` is drawn first; the opaque
window covers it at y=177. Footer chrome starts at y=178.

The missing evidence is a traced writer that would put the title-fit
register on already-bound `UserWdw`. Publishing that colour on the
window is not a dump bind. Source-gap kept.

## Evidence

| Tier | Result |
| --- | --- |
| Source-identified | Dump LA8 `V2C_UserWdwEdge.bclim` `86425541…`; row 3 α25; PNG `5cc59c9d…` matches decode; dump BCLYT LCD y 174–182; no `S_BG` colour clip on `UserWdw` |
| Delivered | Existing published BG pack `944b1cf9…`. `S_ColConf_D` stays the BtnRst adaptation source |
| Implemented | Painter unchanged. Entry theme kept. Title fit stays title-only |
| Tested | `node --test tests/sound-empty-y177.test.mjs` |
| Browser-inspected | Not run |
| Native-compared | Reused frozen `603c5388` pair only. Not recaptured. Not 1:1 |

## Checks

`node --test tests/sound-empty-y177.test.mjs tests/sound-entry-native.test.mjs
tests/sound-empty-slider.test.mjs tests/sound-empty-footer.test.mjs`
**21/21**. `npm run typecheck` passes. `npm test` 2135 pass / 36 fail /
23 skip / 1 todo (2195); the 36 fails are sparse `model/` / GLB ENOENT.
`git diff --check` clean. This lane did not drive Azahar or preview 3021
and did not recapture.

## Remaining

Predicted empty-entry lower y=177 **320**. Whole `sound-empty-entry`
stays fail (lower **7216** on this still). Static still only. Not 1:1.
