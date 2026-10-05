# Sound first-run Next glyphs — source-size writer — 5 October 2026

Stock/Sound worker on `codex/sound-guide-next-195-20261005` from HOME fidelity
`99a4362e`. Sparse worktree; `node_modules` linked from HOME fidelity. No
`model/`. No Azahar. No preview 3021. No CDP 9320. No recapture. The guide
perimeter **6072**, HudTime clock **0**, Span, birds, volume, battery,
empty-entry row/slider/footer and Camera leftovers are not retuned
([perimeter 6072](sound-guide-perimeter-2026-10-04.md),
[remaining residual](sound-remaining-residual-2026-10-04.md)).

This is not a 1:1 claim. The frozen browser lower is unchanged. Tests and
this note do not close pixels, input, motion or audio. Coordinator
recapture remains the acceptance gate.

## Pairs (reused, not recaptured)

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/sound-clock-recapture-20261004/`.
Hashed natives under
`/Users/paramveer/.codex/3ds-artifact-overflow/reference/screenshots/`.
Empty mask. Threshold any RGB channel >2/255. Official lower crop of the
native 400×480 PNG is `(40,240,320,240)`.

| Still | SHA-256 | Role |
| --- | --- | --- |
| `Nintendo 3DS Sound_25.09.26_22.27.14.541.png` | `9dea0cc2fa7022ccd032c5a94ae59c2dbe37e6b7e800fbf8668b356fc9e5ce69` | `sound-first-run` combined |

| File | SHA-256 |
| --- | --- |
| `R/browser-first-run/upper.png` | `16565d8e586edce659beadb9e7f7d72bcd8e2b81479a85bca424480d4294ceab` |
| `R/browser-first-run/lower.png` | `b9d1093ab9641460de6e9e0490707ae12d41008085ee8f7c9995d12fd504fbb9` |
| `R/diff-sound-first-run-hudtime-phase/report.json` | `cb06bed5902eb0bf42f409ad3f3445799e7273fbc53dd1081101490184c3ba45` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |

Whole first-run lower stays **6,267**. Guide interior `[20,20,300,220]`
stays **195**, and those 195 pixels are the Next box `[138,196,182,213]`.
The complement stays **6,072**. Clock ROI stays **0**.

The bottom edge of that box is coverage, not a one-pixel slide. At
`(139,211)` native is the message colour `(69,64,57)` and the frozen
browser is `(103,98,90)`. An integer shift of the browser does not reduce
the 195.

## Dump owner

EUR Sound `0004001000022500` v3088, content 0 / `0000000b`,
`exefs/code.bin` SHA-256
`3c57f2c4091c1bec6b3834609f1e2a6488712e21775d7548b441c69c60b3e5a9`,
image base `0x100000`.

| Element | Where | Identity |
| --- | --- | --- |
| `Guid1TxtW` | `C_DlgGuid1BtnW` | `txt1`, size `[120, 25.200000762939453]`, alignment **4**, line alignment **2**, glyph size `[21, 25.200002670288086]`, spacing 0 |
| `Guide_D_N_Btn0` | `S_tips` style 34 | text `Next`; `fontScale` `0.84`; RI.mstl word 8 colour `(69,64,57,255)` |
| Flag setter | `code.bin` `0x15dce8` | line-alignment byte `+0xff` value 2 stores low bit 1 (`0x15de90`); alignment byte `+0xfe` value 4 ors `0x10` and `0x100`. Flags **0x111** at `[r5,#0x5c]` |
| Centering writer | `code.bin` `0x2a5558` | single `bl` from `0x2a5854`. `flags & 0x30 == 0x10` and `flags & 0x300 == 0x100` subtract `ceil` of half the measured extent (`0x2a55e0`, `0x2a561c`). Low bit 1 adds `ceil(block/2) − ceil(line/2)`, which is 0 for one line |

`C_DlgGuid1BtnW_Default` does not target `Guid1TxtW`. Its constant frame-30
keys stay on `Guid1BtnW` / `Guid1BtnW_Grp`. Frame 0 is unchanged. No other
published clip writes this text pane. The perimeter veil is still the
labelled compositor gap; this writer does not paint it.

The host path ceiled the 25.2 pane to 26 and scaled the raster back,
because alignment 4 with line alignment 2 takes the direct sampler only
when the caller asks for source size. That is the same writer the flag
word selects. `TxtDlg`, the counters and `C_DlgGuid2Btn` stay off it.

## Painter

`drawNativeSoundFrame` now passes `textSampling: 'lcd-source-size'` with
`textSamplingPanes: ['Guid1TxtW']` on the page-1 `C_DlgGuid1BtnW` draw
only. Message colour `(69,64,57)`, Default frame 0, the 24px counter
adapter and `C_DlgChA` are unchanged.

## Checks

Focused `tests/sound-guide-next-195.test.mjs`,
`tests/sound-entry-native.test.mjs`, and the Sound tests that previously
rejected every `textSampling` string
(`sound-guide-perimeter`, `sound-title-1774`, `sound-empty-slider`,
`sound-empty-row`, `sound-empty-footer`). `git diff --check`.
Application typecheck/build were not rerun. This lane did not drive
Azahar or preview 3021.

## Independent review

Grok 4.6 `sound-guide-next-195-review-20261005-r1`: **APPROVE** of
`269e8757` (cherry-pick of `4a0cfcc5`). Page-1-only
`textSampling:'lcd-source-size'` with `textSamplingPanes:['Guid1TxtW']`
on `C_DlgGuid1BtnW` matches dump. Frozen interior **195** until recapture.
Nit: `Guid1TxtW` lives at `0x3237c9`; `0x181018` is `ldr r0,[sl,#0x10]`.
Not 1:1.

## Independent review

Grok 4.6 `sound-guide-next-195-review-20261005-r1`: **APPROVE**.
Fidelity `269e8757` matches worker `4a0cfcc5`. Page-1 only source-size
sampler on `Guid1TxtW`. Flags `0x111` at `0x15dce8`; only `bl` to
`0x2a5558` is `0x2a5854`. Frozen interior stays **195** until recapture.
Nit: `Guid1TxtW` lives at `0x3237c9`; `0x181018` is not that name load.
Painter unchanged by the nit. Not 1:1.

## Coordinator recapture (not done here)

Muted production pair against the same native
`9dea0cc2…`. Report whole lower, interior `[20,20,300,220]`, Next
`[138,196,182,213]` and the perimeter complement. The complement should
stay **6,072**. The interior should move only if this sampler is the
live coverage of those Next glyphs. Motion and audio remain open. No 1:1
claim.
