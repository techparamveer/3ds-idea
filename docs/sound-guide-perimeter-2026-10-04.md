# Sound first-run guide perimeter 6072 source gap — 4 October 2026

Stock/Sound worker on `codex/sound-guide-perimeter-20261004` from HOME fidelity
`73e1488f`. Sparse worktree; `node_modules` linked from HOME fidelity. No
`model/`. No runtime change. No Azahar. No preview 3021. No CDP 9320. No
recapture. No snap, CSS, colour, font, lcd or `azahar-12p4-fit` guess. Title
1774, empty-entry slider 4271, footer 4707, row 1916, Span, birds, volume
130, battery, clock 0, HudTime 12/10 and empty-entry leftovers stay labelled
and are not reopened
([title 1774](sound-title-1774-2026-10-04.md),
[slider 4271](sound-empty-slider-2026-10-04.md),
[footer 4707](sound-empty-footer-2026-10-04.md),
[row 1916](sound-empty-row-2026-10-04.md),
[remaining residual](sound-remaining-residual-2026-10-04.md)).
Empty-entry lower is not this guide.

This is not a 1:1 claim. Tests and this note do not close pixels, input,
motion or audio. Coordinator recapture remains the acceptance gate. The
earlier [border decision](sound-guide-border-residual-decision-2026-09-26.md)
already left the presenter unchanged; this slice re-audits unused dump
members against the reused HudTime-phase first-run lower.

## Pairs (reused, not recaptured)

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/sound-clock-recapture-20261004/`.
Hashed natives under
`/Users/paramveer/.codex/3ds-artifact-overflow/reference/screenshots/`.
Empty mask. Threshold any RGB channel >2/255. Official lower crop of the
native 400×480 PNG is `(40,240,320,240)`.

| Still | SHA-256 | Role | Local clock |
| --- | --- | --- | --- |
| `Nintendo 3DS Sound_25.09.26_22.27.14.541.png` | `9dea0cc2fa7022ccd032c5a94ae59c2dbe37e6b7e800fbf8668b356fc9e5ce69` | `sound-first-run` combined | `22 27` (seconds 14, even) |

| File | SHA-256 |
| --- | --- |
| `R/browser-first-run/upper.png` | `16565d8e586edce659beadb9e7f7d72bcd8e2b81479a85bca424480d4294ceab` |
| `R/browser-first-run/lower.png` | `b9d1093ab9641460de6e9e0490707ae12d41008085ee8f7c9995d12fd504fbb9` |
| `R/diff-sound-first-run-hudtime-phase/report.json` | `cb06bed5902eb0bf42f409ad3f3445799e7273fbc53dd1081101490184c3ba45` |
| `R/diff-sound-first-run-hudtime-phase/lower-contact-sheet.png` | `64148ff1b2f83946e0a0f97105ee6e88eb2033a68192f4f8fb5bc97804600b29` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |

Inspected the first-run lower contact sheet. Native and browser both show
the white Welcome card, Next, `1 / 3` and the `C_DlgChA` bird. Remaining
red is the rounded outer veil and the Next glyphs. Welcome body text is
black. Empty-entry lower stays the Record room (whole **16,021**), not this
guide. Clock ROI `[95,216,194,240]` stays **0**. Whole first-run LCDs stay
**6,094 / 6,267**.

## Residual (first-run lower only)

Half-open rectangles. Counts are pixels with any RGB channel delta greater
than 2.

| Cluster | Rectangle | Over 2 | Max | At |
| --- | ---: | ---: | ---: | --- |
| Whole lower | 320×240 | **6267** | 166 | `(296,234)` native `(33,32,29)` / browser `(199,191,177)` |
| Guide interior | `[20,20,300,220]` | **195** | 34 | `(139,211)`; all 195 sit in Next glyphs `[138,196,182,213]` |
| Guide perimeter | complement of interior | **6072** | 166 | same peak as whole lower |
| Top band | `[0,0,320,20]` | 1487 | 114 | `(0,0)` |
| Left band | `[0,20,20,220]` | 1200 | 145 | `(0,35)` |
| Right band | `[300,20,320,220]` | 1170 | 120 | `(314,176)` |
| Bottom band | `[0,220,320,240]` | 2215 | 166 | same perimeter peak |
| Official largest component | `{x:0,y:0,width:320,height:240}` | **3955** | — | `report.screens.lower.regions[0]`; not the 6072 complement |
| Empty-entry whole lower | 320×240 | 16021 | — | not this guide |

The four non-overlapping bands sum to **6,072**. Card chrome at `(160,10)`
(top band, outside the guide interior) is exact `(211,231,174)` on both LCDs. Exposed background at `(315,40)` is
native `(45,56,78)` versus browser `(89,114,156)`; at `(160,239)` it is
`(24,54,107)` versus `(49,109,209)`. Those remain observations, not a
verified blend or 0.5 alpha.

## Already-bound source

EUR Sound `0004001000022500` v3088 (`CTR-N-HESP`), content 0 / `0000000b`,
`exefs/code.bin` SHA-256
`3c57f2c4091c1bec6b3834609f1e2a6488712e21775d7548b441c69c60b3e5a9`,
image base `0x100000`. Converter `ctr-native-web` **1.2.0**.

| Element | Manifest / pack | Dump source | SHA-256 |
| --- | --- | --- | --- |
| Dialog pack | `lyt-C-Dlg.json` | `lyt/C.LZ` | source `96771724c5f571dc6045ba3dd4ffa8a769428f9c4cf9784f3ea49e7cf52e0e26`; public `0332bab6ba969d0c6787f82dfde92441bef29eb4a4e618597850eb9b7d41b4d5` |
| `C_DlgChA` | pack layout | `lyt/C.LZ/Dlg/blyt/C_DlgChA.bclyt` | `4d35e4b38ae75fa7ad8c8f2d2484bd200856b562ee4c493b13adbc765c5eb8d7` |
| `C_DlgGuid1BtnW` | pack layout | `lyt/C.LZ/Dlg/blyt/C_DlgGuid1BtnW.bclyt` | `aaa3aeceda6930838285e3c03f032170d9d8e23690cabca843f26405c8116773` |
| `C_DlgGuid1BtnW_Default` | pack clip | `lyt/C.LZ/Dlg/anim/C_DlgGuid1BtnW_Default.bclan` | `272caa8628864ac6c904bf9c27e56ec470dc8c674e30383d7cb64112a1ec2d7f` |
| `D_001_0` / `Guide_D_N_Btn0` / `Guide_D_00_00` / `Guide_D_00_01` | `msg-EU_English.json` bank `S_tips` | English MSBT | pack `2ddf6caf199712af19fbb90a7cd4dcfbd50bb4d5e197bf39bd1d7405332d9e33` |
| Shared font | `fonts/shared/font.json` | `cbf_std.bcfnt` | `95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581` |

First-run page 1 already mounts, and this slice does not retune:

- `C_DlgChA` (character window; `ChAWdwL` 288×230 at `[-10,0]`, `ChAWdwR`
  20×230 at `[144,0]`, `Bird` 44×52 at `[-130,-89]`)
- `C_DlgGuid1BtnW` Default frame **0** + `S_tips` `D_001_0` / `Guide_D_N_Btn0`
  / `Guide_D_00_00` / `Guide_D_00_01`
- capture-fitted 24px raster height on the 1×1 counter panes (RI.mstl width
  word **48**), already labelled

`C_DlgGuid1BtnW` has body / count / Next panes and **no** backdrop `pic1`.
Default writes only `Guid1BtnW_Grp` translation.y / scale.x and `Guid1BtnW`
material RGB, each as one constant key at frame **30** (y 0, scale 1,
`(95,75,33)`). Frame 0 therefore cannot change the settled button or invent
a veil. `magFilter` / `minFilter` are **1** (linear) on every `C_DlgChA` and
`Guid1BtnW` map. No bound clip writes `visible`, RootPane alpha, or a
full-screen veil.

## Unused members that do not uniquely own the 6,072

The published pack still has unused first-run members. The converted dump
(`sound-native14`, same `lyt/C.LZ` source) adds unpublished layouts. None
uniquely owns a guide compositor/veil.

| Unused member | SHA-256 | What it writes | Why it does not own 6072 |
| --- | --- | --- | --- |
| `C_Dlg` | `4bc2aa1f…` | `DlgWdwL` / `DlgWdwR` on beige `C_DlgBase` | Error-dialog card. A second window, not a veil. First-run already uses `C_DlgChA`. |
| `C_DlgTxt` / `C_Dlg1BtnB` + Default/Disable/Push | published | error body / black button | `mediaError` path only. No veil pane. |
| `C_DlgGuid2Btn` + Default/Disable/Push | layout `1a93160f…` | page-2/3 Back+Next | This still is page 1 (`C_DlgGuid1BtnW`). Button chrome, not a veil. |
| `C_DlgGuid1BtnW_Push` | `13487107…` | Next y −2 / scale 1.03 / `(125,105,63)` | Press pose. Idle still is not pressed. No `visible` / alpha / backdrop. |
| `C_DlgGuid_U` | `63b7f51b…` | 400×240 `GuidWdwU_L/R` + `Pict` | Upper volume-page window. Not the lower perimeter. Unpublished on the painter request. |
| `C_NullDlg` + `Dlg_In` / `Dlg_InU` / `Dlg_Out` / `Dlg_OutU` | layout `33e40cd3…` | empty `Dlg` `pan1` 30×40; translation.y −240↔0 | IO wrapper only. No `pic1`. [Lifecycle gate](sound-welcome-lifecycle-gate.md) already maps these 15-frame clips. Applying them would not paint a veil. |
| `C_DlgChB` / `C_DlgChB1BtnW` | `09bd2de3…` / `f5829c02…` | same 288+20 window + `C_DlgChBirdB` | Different bird, not a veil. First-run already uses `C_DlgChA` Bird. |
| `C_DlgU` | `8649e756…` | 400×240 `C_DlgBase` | Upper error window. |
| `C_DlgHed` | `c1467edf…` | 384×32 header bar | Not the outer room veil. |
| `C_Dlg0Btn` / `C_Dlg1BtnW` / `C_Dlg2Btn0` / `C_Dlg2Btn1` / `C_Dlg3Btn` / `C_BtnDel` | dump-only | other dialog buttons | Not first-run Next, and no fullscreen `pic1`. |
| Other `C_NullDlg` Ap/Bln/Open/Close clips | dump-only | `Dlg` translation/scale only | Same empty `pan1`. |

Switching `magFilter` 1→0, snapping the already-bound window, sampling
`TxtDlg` / `Guid1TxtW` (alignment 4 / lineAlignment 2 cannot take the
direct-LCD path), opting into `azahar-12p4-fit`, or inventing a 50% Canvas
overlay would be a sampler/font/lcd/colour guess and would not uniquely own
the 6,072. The labelled 24px counter-height adapter is not retuned.

## Labelled gap

First-run lower complement of `[20,20,300,220]` is a **source-gap** for the
remaining **6,072** pixels (max 166 at `(296,234)`). The missing evidence is
still the native guide compositor/veil (background attenuation around
already-bound `C_DlgChA` + `C_DlgGuid1BtnW` Default 0). Until that has a
unique unused pane/clip/frame/sampler bind, the painter stays unchanged.
Interior **195** stays the labelled Next-glyph leftover and is not reopened.

Whole first-run LCDs stay **6,094 / 6,267** until a unique unused owner is
proven.

## Checks

Focused `tests/sound-guide-perimeter.test.mjs` plus `git diff --check`.
Application typecheck/build were not rerun because no application files
changed. This lane did not drive Azahar or preview 3021.
