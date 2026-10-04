# Sound empty-entry lower footer 4707 source gap — 4 October 2026

Stock/Sound worker on `codex/sound-empty-footer-20261004` from HOME fidelity
`86924cbc`. Sparse worktree; `node_modules` linked from HOME fidelity. No
`model/`. No runtime change. No Azahar. No preview 3021. No CDP 9320. No
recapture. No snap, CSS, colour, font, lcd or `azahar-12p4-fit` guess. Title
1774, slider 4271, empty row 1916, Span, birds, volume 130, battery plug,
clock 0, HudTime 12/10 and the first-run guide perimeter stay labelled and
are not reopened
([title 1774](sound-title-1774-2026-10-04.md),
[slider 4271](sound-empty-slider-2026-10-04.md),
[remaining residual](sound-remaining-residual-2026-10-04.md)).
First-run lower is the guide, not this footer.

This is not a 1:1 claim. Independent review **APPROVE-WITH-NITS** of
fidelity `4a5f24da` / worker `8178bab` (tests 4/4; official clusters are
`report.screens.lower.regions[5]/[4]/[8]`; SetBtn `TxtMiniT_W_P0` is not
in `OptIO`; Open In/Out also write `Grp_Open` chrome). Tests and this
note do not close pixels, input, motion or audio. Coordinator recapture
remains the acceptance gate.

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
the StreetPass / Open / Add / Back / Settings chrome. Remaining red is the
StreetPass, Settings and Open glyph blend; Back and Add are lighter. First-run
lower stays the guide (whole **6,267**; this footer rect is **2,914** of
guide veil, not the empty-entry buttons). Clock ROI `[95,216,194,240]` stays
**0**. Whole empty-entry LCDs stay **6,404 / 16,021**.

## Residual (empty-entry lower only)

Half-open rectangles. Counts are pixels with any RGB channel delta greater
than 2.

| Cluster | Rectangle | Over 2 | Max | At |
| --- | --- | ---: | ---: | --- |
| Whole lower | 320×240 | **16021** | 241 | row residual |
| Footer | `[0,178,320,240]` | **4707** | 174 | `(244,229)` native `(206,201,190)` / browser `(32,31,29)` |
| StreetPass crop | `[0,178,92,209]` | 957 | 168 | `(42,195)` native `(213,208,197)` / browser `(45,44,42)` |
| Settings crop | `[228,209,320,240]` | 889 | 174 | same Settings peak |
| Open crop | `[98,178,222,238]` | 646 | 69 | `(135,205)` native `(69,64,57)` / browser `(0,0,0)` |
| Official left | `{x:0,y:179,width:112,height:61}` | **897** | — | `report.screens.lower.regions[5]` |
| Official right | `{x:208,y:179,width:112,height:61}` | **979** | — | `report.screens.lower.regions[4]` |
| Official Open core | `{x:134,y:199,width:14,height:19}` | **169** | — | `report.screens.lower.regions[8]` |
| Empty row / slider | `[0,32,320,64]` / `[0,144,320,175]` | 1916 / 4271 | — | already labelled; not reopened |

The 4,707 leftover is extra browser ink on already-bound StreetPass /
Settings / Open labels (native glyphs are lighter). It is not a missing
button layout.

## Already-bound source

EUR Sound `0004001000022500` v3088 (`CTR-N-HESP`), content 0 / `0000000b`,
`exefs/code.bin` SHA-256
`3c57f2c4091c1bec6b3834609f1e2a6488712e21775d7548b441c69c60b3e5a9`,
image base `0x100000`. Converter `ctr-native-web` **1.2.0**.

| Element | Manifest / pack | Dump source | SHA-256 |
| --- | --- | --- | --- |
| Common pack | `lyt-S_Common-arc-LZ.json` | `lyt/S_Common.arc.LZ` | source `9857e44bf20955e342442d9f190f42264b177db2fc04c8bf3d63eac990d593a4`; public `e8be90c0cdff577141c7e80fb0f28874c6db621eceb8f5b1eb702d3d3b28428e` |
| `S_BG_D-Ctr` | `lyt-S_BG-arc-LZ.json` | `lyt/S_BG.arc.LZ` (`S_BG_D-Ctr`) | `bf589d12f462d71c2edfd1c6df47eaac095fd346065c7f73ddc73ebd982b3e88` |
| `S_Common-OpLBtn` | pack layout | `blyt/S_Common-OpLBtn.bclyt` | `d0c75cbe6df9a34d18c22bd8f1f56da6020ffc472bba6950b1f97168c4614f71` |
| `S_Common-OpLBtn_Default` | pack clip | `anim/S_Common-OpLBtn_Default.bclan` | `e4037e2775e1ddb89abc8802570c7e5f3cce3068b08dccee9dcefe665905e49b` |
| `S_Common-OpRBtn` | pack layout | `blyt/S_Common-OpRBtn.bclyt` | `0f9e4e19a3df277603103670d23212473ab8b29ea45312b21ca807abf6418904` |
| `S_Common-OpRBtn_Disable` | pack clip | `anim/S_Common-OpRBtn_Disable.bclan` | `8327c118d62d1a47ae6f698af3e049cf8a050a52cf0bc81b7078bc7c019a4e10` |
| `S_Common-OpenBtn` | pack layout | `blyt/S_Common-OpenBtn.bclyt` | `d9663a18016abbb2d9bef5e0b6e30b42d40e136ed435114f1ff76673d086505f` |
| `S_Common-OpenBtn_Default` | pack clip | `anim/S_Common-OpenBtn_Default.bclan` | `c831653313ed795fdb4e544eefdfb0fd9a335b1032eae297bf0031cbe893a529` |
| `S_Common-SetBtn` | pack layout | `blyt/S_Common-SetBtn.bclyt` | `9e6bfad876fab25636b44b520dec6920ca2bef9b1ea7830cb522bfd9fdc4a6d7` |
| `S_Common-SetBtn_Default` | pack clip | `anim/S_Common-SetBtn_Default.bclan` | `2ec0ad227db100745affbb743ec9e059ec4e027322a5355eb809d16b4a69ca95` |
| `S_Common-BackBtn` | pack layout | `blyt/S_Common-BackBtn.bclyt` | `09330cbde8a990f04e2899a3dd081689aa3bbf93c2172a0f837a02840b10d4b9` |
| `S_Common-BackBtn_Disable` | pack clip | `anim/S_Common-BackBtn_Disable.bclan` | `6664a7f78a9cbfa39591861b2d7b9c2d3ace2ce0e2a68e9b66d5ba863926ee07` |
| `C_B_04` / `C_B_03` / `P_B_03` / `P_B_00` / `C_B_02` | `msg-EU_English.json` bank `S` | English MSBT | pack `2ddf6caf199712af19fbb90a7cd4dcfbd50bb4d5e197bf39bd1d7405332d9e33` |
| Shared font | `fonts/shared/font.json` | `cbf_std.bcfnt` | `95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581` |

Empty-entry already mounts, in this order:

- `S_BG_D-Ctr` (footer backing; no Down/Up clip)
- `S_Common-OpLBtn` Default frame **0** + `C_B_04` StreetPass at 80% scale
- `S_Common-OpRBtn` Disable frame **1** + `P_B_03` Add
- `S_Common-OpenBtn` Default frame **0** + `P_B_00` Open
- `S_Common-SetBtn` Default frame **0** + `C_B_03` Settings at 80% scale
- `S_Common-BackBtn` Disable frame **1** + `C_B_02` Back

StreetPass and Settings keep the already-bound full-label 80% / restore-100%
tags (`group 1` / `type 0` `5000` then `6400`). Each footer `txt1` is origin
4, alignment 4, line alignment 2, font 0 (`cbf_std.bcfnt`). StreetPass /
Settings / Open top colour is black `(0,0,0,255)`; Back is white. Default
frame 0 and Disable frame 1 sample the same parent rest (`-O-C-OPL` /
`-O-C-Open` scale.y 1, `-B-MiniT_W_P0` / `-O-C-Back` y −105). `magFilter` /
`minFilter` are **1** (linear) on every footer button map. Empty `tevStages`
on `TxtC` / `TxtMiniT_W_P0`. `TxtC` on OpL/Open/OpR/Back sits in `OptIO`.
SetBtn `TxtMiniT_W_P0` sits in IO (`-B-MiniT_W_P0`) and Btn (`Grp_MiniT_W_P0`);
SetBtn has no `OptIO`. No bound clip writes those text panes.

## Unused members that do not uniquely own the 4,707

The converted dump (`sound-native14`, same `S_Common.arc.LZ` source) still
has unused footer clips. None writes `visible`, `TxtC`, `TxtMiniT_W_P0` or
any text materialColor.

| Unused clip | SHA-256 | What it writes | Why it does not own 4707 |
| --- | --- | --- | --- |
| `S_Common-OpLBtn_Disable` | `54788749…` | `GrpOPL` alpha **128** | Fades StreetPass chrome. Native StreetPass is enabled. No text track. |
| `S_Common-OpLBtn_In` / `_Out` | `65d6503f…` / `7164a275…` | `-O-C-OPL` scale.y 0→1 / 1→0 | IO hide/show, not glyph blend. |
| `S_Common-OpLBtn_Push` | `997f03d9…` | press scale / `(125,105,63)` | Press pose. Idle still is not pressed. |
| `S_Common-OpRBtn_Default` | `b093540b…` | `GrpOP` alpha 255 | Add is already Disable 1 (native-disabled). Switching to Default would enable it. |
| `S_Common-OpRBtn_In` / `_Out` / `_Push` | `06cbd35f…` / `87da76f8…` / `2c3efe1f…` | IO / press on Add | Same as OpL; Add is not the 4707 peak. |
| `S_Common-OpenBtn_Disable` | `404103f1…` (published, unbound) | `Grp_Open` alpha **128** | Would fade enabled Open. No text track. |
| `S_Common-OpenBtn_In` / `_Out` / `_Push` | `62186733…` / `16d8cb1f…` / `c52046c8…` | IO / press; In/Out also write `Grp_Open` alpha and `materialColor` (chrome, not `TxtC`) | Not the idle glyph compositor. |
| `S_Common-SetBtn_In` / `_Out` / `_Push` | `6bd98fcb…` / `1cdf8f00…` / `bb8bb48c…` | IO y −137↔−105 / press | Dump has **no** SetBtn Disable. In frame 0 parks Settings off-screen. |
| `S_Common-BackBtn_Default` / `_In` / `_Out` / `_Push` | published | enable / IO / press | Empty-entry already uses Disable 1; Back is not the peak. |
| `S_Common-CecBtn` + Default/In/Out/Push | layout `24acf65f…` | `TxtCec` at `[-115,-105]` | That translation is Back's parent, not StreetPass `[-115,-73]`. Unpublished. |
| `S_BG_D-Ctr_Down` / `_Up` | `7c2dba2f…` / `54b11371…` | `Back` pane y 0↔−30 | Footer-backing IO only. Empty-entry already mounts Ctr at rest. |
| `S_Common-Null` / `S_Common-TextTouch` | dump-only | empty / huge `Null` txt1 | Not footer button chrome. |

`cbf_std.bcfnt` is the only footer font. Switching `HudNOTES`, snapping,
sampling, or opting into `azahar-12p4-fit` would be a font/lcd guess:
alignment 4 / lineAlignment 2 cannot take the renderer direct-LCD path
(that path needs `lineAlignment===0`, or `lcd-source-size` with alignment 4,
or top-left alignment 0). Binding Disable because the still looks lighter
would be a colour/clip guess.

## Labelled gap

Empty-entry lower footer `[0,178,320,240]` is a **source-gap** for the
remaining **4,707** pixels (max 174 at `(244,229)`). The missing evidence
is still the native StreetPass / Settings / Open text writer / atlas filter
on already-bound `OpLBtn` Default 0 + `C_B_04` (80%), `OpenBtn` Default 0 +
`P_B_00`, and `SetBtn` Default 0 + `C_B_03` (80%). Until that has a unique
unused pane/clip/frame/sampler bind, the painter stays unchanged.

## Checks

Focused `tests/sound-empty-footer.test.mjs` plus `git diff --check`.
Application typecheck/build were not rerun because no application files
changed. This lane did not drive Azahar or preview 3021.
