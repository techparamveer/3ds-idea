# Sound empty-entry mid fill source gap — 5 October 2026

HOME-fidelity Sound worker on `codex/sound-empty-mid-20261005` from fidelity
`02a60c52`. Sparse worktree; `node_modules` linked from HOME fidelity. No
`model/`. No painter change. No Azahar. No preview 3021. No CDP. No recapture.
Row **1916**, slider **4271**, footer **4707**, title **1774**, Span, birds,
volume **130**, battery, Line01, clock **0** and the first-run guide perimeter
**6072** stay labelled and are not reopened
([row 1916](sound-empty-row-2026-10-04.md),
[slider 4271](sound-empty-slider-2026-10-04.md),
[footer 4707](sound-empty-footer-2026-10-04.md)).

This is a labelled source gap. It is not a 1:1 claim. Tests and this note do
not close pixels, input, motion or audio. Coordinator recapture remains the
acceptance gate.

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
| `R/browser-first-run/lower.png` | `b9d1093ab9641460de6e9e0490707ae12d41008085ee8f7c9995d12fd504fbb9` |
| `R/diff-sound-empty-entry-hudtime-phase/report.json` | `d28688a4a28c3c5cabc303cc6fb824045ee4a074f4f25fffcacc07944e5425f2` |
| `R/diff-sound-empty-entry-hudtime-phase/lower-contact-sheet.png` | `4cd485a1adcb1a0d66afb2b7b911b92037262896e6d085df92fed320de31b9f4` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |

Inspected the empty-entry lower contact sheet. Between the selected row and
the slider, native and browser both show the resting vinyl and the lower
parakeet. The two official leftovers are flat beige, not a missing sprite.
The bird box `[0,96,40,48]` is **2** pixels over threshold. The vinyl interior
`[80,70,80,30]` is **31**, and those 31 are the same beige pair. Clock ROI
`[95,216,194,240]` stays **0**. Whole empty-entry lower stays **16021**.
First-run lower stays the guide (whole **6267**); both mid rectangles are
**0** there.

## Residual (empty-entry lower only)

Half-open rectangles. Counts are pixels with any RGB channel delta greater
than 2.

| Cluster | Rectangle | Over 2 | Max | At |
| --- | --- | ---: | ---: | --- |
| Whole lower | 320×240 | **16021** | 241 | row residual |
| Mid, left of the disc | `[41,96,47,48]` | **2255** | 10 | `(41,96)` native `(223,215,206)` / browser `(229,224,216)` |
| Mid, under the disc lip | `[136,116,48,28]` | **1024** | 10 | `(136,117)` same pair |
| Same fill, disc lip | `[232,137,47,7]` | 223 | 10 | `(232,138)` same pair; `regions[7]`, not a second owner |
| Official left | `{x:41,y:96,width:47,height:48}` | **2255** | — | `report.screens.lower.regions[2]` |
| Official under-lip | `{x:136,y:116,width:48,height:28}` | **1024** | — | `report.screens.lower.regions[3]` |
| Row / slider / footer | `[0,32,320,64]` / `[0,144,320,175]` / `[0,178,320,240]` | 1916 / 4271 / 4707 | — | already labelled; not reopened |

Of the 2,255, **2,252** pixels are exactly that one pair. Of the 1,024,
**983** are the same pair. The remaining pixels sit on the vinyl lip, where
the record texel is no longer fully transparent. The labelled slider rect
already contains **2,767** pixels of this same pair, inside its **4,271**.

## Already-bound source

EUR Sound `0004001000022500` v3088 (`CTR-N-HESP`), content 0 / `0000000b`,
`exefs/code.bin` SHA-256
`3c57f2c4091c1bec6b3834609f1e2a6488712e21775d7548b441c69c60b3e5a9`,
image base `0x100000`. Converter `ctr-native-web` **1.2.0**. Archive
`lyt/S_BG.arc.LZ` SHA-256
`944b1cf9a81eac5b162001ac6b9a5dfae63513e1dc45981c87496c159fd0d434`.

| Element | Manifest / pack | Dump source | SHA-256 |
| --- | --- | --- | --- |
| Background pack | `lyt-S_BG-arc-LZ.json` | `lyt/S_BG.arc.LZ` | public `c5af6df22c33b8fbdd8cdcccf1b5b77bb484f2c2a2a71cc82100bf50ed9dd6a0` |
| `S_BG` | pack layout | `blyt/S_BG.bclyt` | `0f2eca6dbb4813df68ee4e10fe844307a4d9442dfc6d72f8143fcfa725e5e1d0` |
| `S_BG-Record` | pack layout | `blyt/S_BG-Record.bclyt` | `5e12e2522526c7670c2f5dc9458df0c725d8050ce60a45350865741ab2202136` |
| `S_BG-Record_Default` | pack clip | `anim/S_BG-Record_Default.bclan` | `5209252d8eecf9607e8703f042bd3aa7630ad54313b2bf23c2e46644d1594426` |
| `BG_Record_01` | pack texture | `timg/BG_Record_01.bclim` | source `fc59c5aa749fb3c074b7e76e89f7a92443101e3693ea3620a40f9ab77844f5ed`; public `dddc006390df2a4a84fa89a2484e3fae716bbd1b3aa23ca0740c9cda3f919a22` |

Empty-entry already paints `S_BG` full-screen, then
`drawNativeSoundRecordBackground` at lower centre `(160,120)` with
`S_BG-Record_Default` frame **0**. `BG` is `pic1` 400×240, pane alpha **255**,
white vertex colours, empty `tevStages`, no texture. Material constant 0 in
`S_BG.bclyt` at file offset **80** is `e5 e0 d8 ff` — **`(229,224,216,255)`**,
the browser colour. Constant 5 is white, so `soundEntryBlue` does not rewrite
it (that helper only replaces constant 5 when it is `(57,170,213)`). With no
texture, the implicit material returns constant 0.

`BG_Record_01` is `pic1` 368×288 at translation `(26,120)`, UV
`(0.28125,0.21875)–(1,0.78125)`, `magFilter` / `minFilter` **1**. Lower
placement puts the picture at LCD left **2**, top **−144**. Nearest texels
under `[41,96,47,48]` are alpha **0** for **2,252** pixels, the same count as
the exact beige pair. Under `[136,116,48,28]` alpha **0** is **983**, again
the exact pair. The decoded texture has **zero** texels of either
`(223,215,206)` or `(229,224,216)` inside that UV window. The visible beige
is `S_BG` showing through the record, not a record texel.

## Unused members that do not uniquely own the pair

The archive has 26 members. There is no `S_BG` clip. No `S_BG` animation
track targets `BG`. `code.bin` contains neither RGB triple. The layout name
`S_BG` at VA `0x2fcc98` (between `S_BG_D-Ctr` and `S_BG-Record`) has no
little-endian pointer xref. `S_BG-Record` at `0x2fcca0` has the known
constructor xref `0x1c3c48`; that path loads the layout and does not store a
replacement beige.

| Unused member | What it writes | Why it does not own 2255 / 1024 |
| --- | --- | --- |
| `S_BG-Record_Default` other frames | one-key identity: `BG_Recd` translation **0** and scale **1** (keys sit past the clip range) | Frame 0 is already bound. Another frame does not move or recolour the fill. |
| `S_BG-Record_In` / `_Out` | `BG_Recd` translation.x **320↔0** | Slide in/out. The settled still already shows the resting vinyl. |
| `S_BG-Record_In_from_U` / `_Out_to_U` | translation.y **144↔0** | Upper/lower handoff, not the idle lower pose. |
| `S_BG-Record_U_*` | upper instance, including `U_Default` translation.y **−332** | Upper LCD. These rectangles are lower. |
| `S_BG_D-Grid` + Default/In/Out | full-screen grid alpha | Library backdrop. Empty-entry does not bind it. Native mid fill is flat, not a grid. |
| `S_BG_D-Ctr_Down` / `_Up` | `Back` translation.y | Footer backing, already labelled. |
| Record `magFilter` 1→0 | sampler | The 2,252-pixel interior is alpha 0. Nearest sampling cannot invent `(223,215,206)`. |

Binding another record frame, or writing the capture RGB into constant 0,
would be a colour guess. The dump's only beige is the constant the browser
already paints. The same pair also fills **2,767** pixels inside the labelled
slider rect, so a constant edit would move **4271** as well.

## Labelled gap

Empty-entry lower `[41,96,47,48]` **2255** and `[136,116,48,28]` **1024** are
a **source-gap**. Both are the already-bound `S_BG` constant
`(229,224,216)` showing through transparent `BG_Record_01`, against native
`(223,215,206)`. The missing evidence is a unique unused pane, clip, frame
or sampler that emits that native RGB. None is in `S_BG.arc.LZ` or
`code.bin`. The painter stays unchanged.

## Checks

Focused `tests/sound-empty-mid.test.mjs` plus `git diff --check`.
Application typecheck/build were not rerun because no application files
changed. This lane did not drive Azahar or preview 3021.
