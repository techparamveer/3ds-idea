# Sound empty-entry lower row 1916 source gap — 4 October 2026

Stock/Sound worker on `codex/sound-empty-row-20261004` from HOME fidelity
`50c53746`. Sparse worktree; `node_modules` linked from HOME fidelity. No
`model/`. No runtime change. No Azahar. No preview 3021. No CDP 9320. No
recapture. No snap, CSS, colour, font, lcd or `azahar-12p4-fit` guess. Title
1774, slider 4271, footer 4707, Span, birds, volume 130, battery plug,
clock 0, HudTime 12/10 and the first-run guide perimeter stay labelled and
are not reopened
([title 1774](sound-title-1774-2026-10-04.md),
[slider 4271](sound-empty-slider-2026-10-04.md),
[footer 4707](sound-empty-footer-2026-10-04.md),
[remaining residual](sound-remaining-residual-2026-10-04.md)).
First-run lower is the guide, not this row.

This is not a 1:1 claim. Tests and this note do not close pixels, input,
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

Inspected the empty-entry lower contact sheet. Native and browser both show
the selected Record & Edit Sounds row, balloon icon and cursor bar. Remaining
red is the cursor/icon fill; the label silhouette is black. First-run lower
stays the guide (whole **6,267**; this row rect is **384** of guide veil, not
`BrwCursor` / `IconList`). Clock ROI `[95,216,194,240]` stays **0**. Whole
empty-entry LCDs stay **6,404 / 16,021**.

## Residual (empty-entry lower only)

Half-open rectangles. Counts are pixels with any RGB channel delta greater
than 2.

| Cluster | Rectangle | Over 2 | Max | At |
| --- | ---: | ---: | ---: | --- |
| Whole lower | 320×240 | **16021** | 241 | row residual |
| Empty row | `[0,32,320,64]` | **1916** | 241 | `(18,43)` native `(14,39,82)` / browser `(255,255,255)` |
| Empty icon fill | `[0,38,7,57]` | **133** | 101 | `(0,56)` native `(73,131,232)` / browser `(174,191,222)` |
| Label crop | `[56,37,280,57]` | **0** | 2 | already matched |
| Official strip | `{x:0,y:33,width:320,height:63}` | 3215 | — | `report.screens.lower.regions[1]`; taller than the 32-row target |
| Empty slider / footer | `[0,144,320,175]` / `[0,178,320,240]` | 4271 / 4707 | — | already labelled; not reopened |

Of the 1,916, the label crop is **0**. x 56–320 is 1,056 pixels at max **3**
(`(41,113,238)` vs already-bound entry theme `(42,113,235)`). The peak and
the 133-pixel left fill sit on already-bound cursor/icon artwork, not a
missing row layout.

## Already-bound source

EUR Sound `0004001000022500` v3088 (`CTR-N-HESP`), content 0 / `0000000b`,
`exefs/code.bin` SHA-256
`3c57f2c4091c1bec6b3834609f1e2a6488712e21775d7548b441c69c60b3e5a9`,
image base `0x100000`. Converter `ctr-native-web` **1.2.0**.

| Element | Manifest / pack | Dump source | SHA-256 |
| --- | --- | --- | --- |
| Common pack | `lyt-S_Common-arc-LZ.json` | `lyt/S_Common.arc.LZ` | source `9857e44bf20955e342442d9f190f42264b177db2fc04c8bf3d63eac990d593a4`; public `e8be90c0cdff577141c7e80fb0f28874c6db621eceb8f5b1eb702d3d3b28428e` |
| `S_Common-BrwCursor` | pack layout | `blyt/S_Common-BrwCursor.bclyt` | `38e4ef9ff832f17d0e2d5ec2b253acfd43704792383f9b385490d7a195ae1de0` |
| `S_Common-BrwCursor_Default` | pack clip | `anim/S_Common-BrwCursor_Default.bclan` | `faa0f0dc43669d65f769ec87ce7053511fab277844e667fe4ab020ae97ac759b` |
| `V3_BarCursorIcon09` | pack texture | `timg/V3_BarCursorIcon09.bclim` | `aa4abb48d990d459ea11feba06377be474d3807e7cfc6e4a6ce76368ef635353` |
| `S_Common-IconList` | pack layout | `blyt/S_Common-IconList.bclyt` | `55762accaf9776aca29bd2eb030b80a186298cef1f9ce8c66461443342e020bd` |
| `S_Common-IconList_IconCHG` | pack clip | `anim/S_Common-IconList_IconCHG.bclan` | `93adc3ffe9a00246ea63fe90e2ef8d73d209f21c53a9297df64d4f2f39c7e08d` |
| `ListIcon_Bln` / `_Toon` | pack textures | `timg/ListIcon_Bln.bclim` / `ListIcon_Bln_Toon.bclim` | `87ebe84a…` / `ee6c30ff…` |
| `S_Common-Text` | pack layout | `blyt/S_Common-Text.bclyt` | `427d59279517d4ba322401ef96ce69f85491a426699cd82d81a61d0729067202` |
| `P_BR_00` | `msg-EU_English.json` bank `S` | English MSBT | pack `2ddf6caf199712af19fbb90a7cd4dcfbd50bb4d5e197bf39bd1d7405332d9e33` |
| Shared font | `fonts/shared/font.json` | `cbf_std.bcfnt` | `95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581` |

Empty-entry already mounts, and this slice does not retune:

- `S_Common-BrwCursor` centre `[160,118]` + `Default` frame **18**
  (`V3_BarCursorIcon09`)
- `S_Common-IconList` centre `[43,47]` + `IconCHG` frame **0**
  (`ListIcon_Bln` / `ListIcon_Bln_Toon`)
- `S_Common-Text` centre `[55,46]` + `Null` `P_BR_00`
  (`Record & Edit Sounds`) size `[264,30]` translation `[132,0,0]`

`CurBarB0_P0` is `pic1` 420×64 at `[32,0]` with pane alpha **88** and theme
register 5. `IconCurBarO_R` is `pic1` 32×32. `ListIcon` is `pic1` 32×32.
`Null` is `txt1` origin 4, alignment 3, line alignment 2, font 0
(`cbf_std.bcfnt`), white top/bottom. `magFilter` / `minFilter` are **1**
(linear) on every cursor/icon map. Default writes only
`IconCurBarO_R` `texture.pattern` (frame 0→00 … 18→09 … 24→00). IconCHG
frame 0 writes `ListIcon` pattern 4/5 and `materialColor.4` `(255,0,0,0)`.
No bound clip writes `CurBarB0_P0` alpha, `visible`, or the left-fill TEV.

## Unused members that do not uniquely own the 1,916

The published pack still has unused row clips. The converted dump
(`sound-native14`, same `S_Common.arc.LZ` source) adds unpublished
layouts. None uniquely owns the leftover fill.

| Unused member | SHA-256 | What it writes | Why it does not own 1916 |
| --- | --- | --- | --- |
| `S_Common-BrwCursor_In` / `_Out` | `91df801b…` / `f6200e62…` | `PacIconCurBar_R` / `GrpCurBar_P0` scale.y 0↔1 | IO hide/show. Idle still is visible. No `visible` / `CurBarB0_P0` / `ListIcon` track. |
| `S_Common-BrwCursor_CurBarIconPushP` | `4419f603…` | icon x −143↔−139 | Press nudge. Idle still is not pressed. |
| Other Default frames | same clip | `IconCurBarO_R` texture only | Frame 18 already matches the settled arrow. Earlier icon-phase check left the left fill MAE unchanged. |
| Other IconCHG frames | same clip | other `ListIcon_*` pairs | Frame 0 is the Record balloon. Album/folder/NAND would be an icon guess. Dump has **no** second IconList clip. |
| `S_Common-ListScroll` + Default/In/Out | layout `ff949ff5…` | scrollbar | Not the selected-row bar. Unpublished on the empty-entry painter. |
| `S_Common-BrwCursorB` + `Defult`/`In`/`Out` | layout `9b269026…` | `CurBarB_BackP0` 420×32 alpha **192**, `V3_BarCursorBase3` | Same theme const5. `Defult` writes only `CurBarBackP0` scale.y 1. String `S_Common-BrwCursorB` sits at `0x1c67dc` next to `S_BG` and has **zero** `code.bin` pointer xrefs. Clip names and `CurBarB_Back` are absent. Binding it because the fill looks darker would be a colour/layout guess. |
| `S_Common-IconUGC` / `IconUGC48` | `680cd0e8…` / `26bc7ddd…` | 24×24 / 48×48 UGC icons | Not `ListIcon_Bln`. `IconUGC48` is absent from `code.bin`; `IconUGC` has no pointer xref. |
| `S_Common-PlayCursor` / `RecCursor` | `c3f0459b…` / `988dab1c…` | 32×32 / 64×64 playback and record cursors | Different chrome. RecCursor has no pointer xref. PlayCursor's one table word sits beside IconList, not a unique empty-browse owner. |
| `S_Common-TextTouch` / `S_Common-Null` | `4613843e…` / `61b5a2d6…` | huge `Null` txt1 / empty `pan1` | Label crop is already **0**. |
| `S_Common-CecBtn` | `24acf65f…` | StreetPass-neighbour button | Footer chrome; already labelled. |

Switching `magFilter` 1→0, snapping the already-fitted centres, sampling
`Null` (alignment 3 / lineAlignment 2 cannot take the direct-LCD path), or
opting into `azahar-12p4-fit` would be a sampler/font/lcd guess and would
not uniquely own the 133-pixel left fill or the `(18,43)` peak.

## Labelled gap

Empty-entry lower row `[0,32,320,64]` is a **source-gap** for the remaining
**1,916** pixels (max 241 at `(18,43)`; icon fill `[0,38,7,57]` **133**;
label **0**). The missing evidence is still the native cursor/icon fill
compositor (bar TEV / alpha 88 / theme overlap on already-bound
`BrwCursor` Default 18 + `IconList` IconCHG 0). Until that has a unique
unused pane/clip/frame/sampler bind, the painter stays unchanged.

## Checks

Focused `tests/sound-empty-row.test.mjs` plus `git diff --check`.
Application typecheck/build were not rerun because no application files
changed. This lane did not drive Azahar or preview 3021.

## Independent review

Grok 4.6 independent review of `ee4af066`: **APPROVE** of the labelled
empty-entry lower-row source-gap. Docs and tests only. Painter row binds
unchanged (`BrwCursor` `[160,118]` Default **18**, `IconList` `[43,47]`
IconCHG **0**, `Text` `P_BR_00`). Dump EUR Sound `0004001000022500` v3088
`CTR-N-HESP` `code.bin`
`3c57f2c4091c1bec6b3834609f1e2a6488712e21775d7548b441c69c60b3e5a9`.
`CurBarB0_P0` is `pic1` 420×64 pane alpha **88**. Bound Default writes only
`IconCurBarO_R` `texture.pattern` (frame 18 → `V3_BarCursorIcon09`); IconCHG
frame 0 writes `ListIcon_Bln` / `_Toon` and `materialColor.4` `(255,0,0,0)`.
No bound clip writes that alpha, `visible`, or the left-fill TEV.
`S_Common-BrwCursorB` string is at VA `0x1c67dc` next to `S_BG` with **zero**
aligned or unaligned `code.bin` pointer xrefs; clip names and `CurBarB_Back`
are absent. Unpublished `CurBarB_BackP0` is 420×32 alpha **192** on
`V3_BarCursorBase3` with the same theme const5 / TEV as the already-bound
bar; binding it because the fill looks darker would be a colour/layout guess.
`magFilter` 1→0 or `azahar-12p4-fit` would not uniquely own the 133-pixel
left fill. Frozen native `65fc5f88…`, reused HudTime-phase lower `ee103d93…`:
row `[0,32,320,64]` **1916** (max 241 at `(18,43)`); icon fill `[0,38,7,57]`
**133**; label `[56,37,280,57]` **0**; first-run same rect **384** (guide);
clock **0**. Not 1:1.
