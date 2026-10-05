# Sound first-run guide perimeter 6072 source gap — 5 October 2026

Stock/Sound worker on `codex/sound-guide-perimeter-20261005` from `9580641b`.
Sparse worktree; `node_modules` linked from HOME fidelity. No `model/`. No
painter change. No Azahar. No preview 3021. No CDP. No recapture. Next
(`Guid1TxtW` source-size, interior **0**), clock **0**, Span **2314**, birds
**1558**, volume **130**, battery **1**, Line01, empty-entry
row/slider/footer/title and Camera stay labelled and are not retuned
([Next 195](sound-guide-next-195-2026-10-05.md),
[perimeter, pre-Next pair](sound-guide-perimeter-2026-10-04.md)).

This is a labelled source gap. It is not a 1:1 claim. Tests and this note do
not close pixels, input, motion or audio. Coordinator recapture remains the
acceptance gate.

The 4 October perimeter audit used the pre-Next lower (`b9d1093a…`, whole
**6267**, interior **195**). This leftover is the post-Next pair: interior
**195 → 0**, whole lower **6267 → 6072**, complement still **6072**.

## Pairs (reused, not recaptured)

Frozen native combined
`9dea0cc2fa7022ccd032c5a94ae59c2dbe37e6b7e800fbf8668b356fc9e5ce69`
(`Nintendo 3DS Sound_25.09.26_22.27.14.541.png`). Browser stills under
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/sound-guide-next-recapture-20261005/`.
Empty mask `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.
Threshold any RGB channel >2/255. Official lower crop of the native 400×480
PNG is `(40,240,320,240)`.

| File | SHA-256 |
| --- | --- |
| Browser lower | `d78f43b62aebae3069e5308f46b59a9071587dca28ee07b38d7f77cd5ca34169` |
| Browser upper | `16565d8e586edce659beadb9e7f7d72bcd8e2b81479a85bca424480d4294ceab` |
| Report | `3aeaf44296bc98eb0f52be75e8a4b33dd53125e52f3bf4dc28e0f2023287b4ea` |

| Cluster | Rectangle | Over 2 | Max | At |
| --- | ---: | ---: | ---: | --- |
| Whole lower | 320×240 | **6072** | 166 | `(296,234)` native `(33,32,29)` / browser `(199,191,177)` |
| Guide interior | `[20,20,300,220]` | **0** | 2 | Next box `[138,196,182,213]` is **0**; `(139,211)` is `(69,64,57)` on both |
| Perimeter complement | outside that interior | **6072** | 166 | same peak |
| Top / left / right / bottom | the four non-overlapping bands | 1487 / 1200 / 1170 / 2215 | | sum **6072** |
| Clock | `[95,216,194,240]` on the upper | **0** | | |
| Whole upper | 400×240 | **6094** | | unchanged |

Card chrome at `(160,10)`, inside the top band and on the window, is exact
`(211,231,174)`. Exposed room at `(315,40)` is native `(45,56,78)` versus
browser `(89,114,156)`.

On the 6072 complement pixels, 4760 are within 2 of `round(browser/2)` and
1312 are not. Among channels whose browser value is greater than 30, the
median native/browser ratio is about 0.496. The peak `(296,234)` is not that
ratio: half of browser `(199,191,177)` is about `(100,96,89)`, and native is
`(33,32,29)`. Half intensity remains an observation. It is not a verified
blend, alpha, or coverage.

## Dump candidates that do not uniquely own the complement

EUR Sound `0004001000022500` v3088, content 0 / `0000000b`,
`exefs/code.bin` SHA-256
`3c57f2c4091c1bec6b3834609f1e2a6488712e21775d7548b441c69c60b3e5a9`,
image base `0x100000`. Dialog pack source SHA-256
`96771724c5f571dc6045ba3dd4ffa8a769428f9c4cf9784f3ea49e7cf52e0e26`.
Transition pack `lyt/C.LZ` source SHA-256
`de6ee71f535ee74df0f055ef6c9aa58ecb66c7f65cdfc82b0e16d9324b904fda`
(`sound-native14` `lyt-C-Tran_U.json`).

| Candidate | Identity | Why it does not own the 6072 |
| --- | --- | --- |
| `C_BkMask` | `lyt/C.LZ/Tran_U/blyt/C_BkMask.bclyt` `81e6534f3f5f54b9ed529d9ce946381bd48824831102872fe99f78a624dd5743`. `Pict` 400×240, pane alpha **0**, constant `(0,0,0,255)`, no `colorBlend` | Upper transition archive `C--Tran_U`. Not a lower 320×240 guide veil |
| `C_BkMask_Out` | `0d47b487bf8a7645edfd59c1d02b31ae36a55108ba151994fb20290ea591cd51`. `Pict` alpha frame 0 = **0**, frame 60 = **255**, slope 4.25 | No key at 128 or 0.5. A mid-frame hold would be a guess |
| Mask driver | `0x18ab1c` builds `C_BkMask` from `C--Tran_U` and binds `Out`. Reached only by `beq` at `0x18a630` inside `0x18a5ec`. `0x18c138` calls that and tails into the sibling `0x18a7a8`. Sole caller of `0x18c138` is transition updater `0x266a0c` | Guide constructor `0x181b8c` does not call it. Its name table at `0x33d0c4` / `0x33d0cc` / `0x33d0d4` is only `C_DlgGuid1BtnW`, `C_DlgGuid2Btn`, `C_DlgGuid_U`. The stored float at pool `0x182010` is **0** |
| `C_TranDouble` | layout `9ad14deb…`, `PictDouble` 400×240 alpha **50**, white constant. `C_TranDouble_In` `9b4ff372…` ramps alpha 0→50 over 10 frames | White, upper, and 50/255, not a settled black 0.5 over the lower complement |
| `C_TranAlFade` / `C_TranBkFade` / `C_TranWhFade` | same 400×240 `C--Tran_U` family | Screen fades. AlFade alpha 0↔255. BkFade writes material RGB, not a held veil |
| `C_DlgChA` window blend | `colorBlend` operation 1, source factor 4, destination factor 5 on `ChAWdwL` / `ChAWdwR` | Standard source-alpha blend, already bound. Interior **0** means the opaque card already matches. It does not paint the outside complement |
| Darken blend | renderer recognises operation 1, source factor 0, destination factor 5 | No Sound layout in the 29 `sound-native14` packs uses that blend |
| `S_BG_D-Grid` alpha | Default holds `BG_Grid` alpha 255; In is 0→255 over 5 frames; Out is 255→0 over 3 frames | No held partial alpha |
| October 4 unused dialog members | `C_Dlg`, `C_NullDlg`, `C_DlgGuid_U`, button Push/Disable clips, `C_DlgChB`, `C_DlgU`, `C_DlgHed` | Still no fullscreen lower `pic1` veil, and no clip writes `visible` or `alpha` on the idle guide card |

`C_BkMask` drawn behind the card at a guessed alpha would be an invented
graphic. It would also leave the 1312 complement pixels that are not half of
the browser, including `(296,234)`. Drawing it above the card would cover
the interior that recapture already closed.

## Labelled gap

First-run lower complement of `[20,20,300,220]` stays a **source-gap** for
**6072** pixels. The missing evidence is still a unique unused pane, clip,
frame, or blend that the guide's settled path applies to that complement.
The painter stays unchanged: page-1 `C_DlgChA`, then `C_DlgGuid1BtnW` Default
frame 0 with `textSampling:'lcd-source-size'` only on `Guid1TxtW`.

Whole first-run LCDs stay **6094 / 6072**. Not 1:1.

## Checks

Focused `tests/sound-guide-perimeter-20261005.test.mjs` plus
`git diff --check`. Application typecheck/build were not rerun because no
application files changed. This lane did not drive Azahar or preview 3021.

## Independent review

Grok 4.6 `sound-guide-perimeter-review-20261005-r1`: **APPROVE** of
`02a60c52` (cherry-pick of `5312de33`). Painter unchanged. Post-Next
interior **0**. Complement **6072**. Peak `(296,234)` native `(33,32,29)`
/ browser `(199,191,177)`. **4760 / 1312** split on `round(browser/2)`
holds; median channel ratio **0.496**. `C_BkMask` is `C--Tran_U` 400×240
pane alpha **0**. Sole `BL` to `0x18c138` is transition updater
`0x266a0c`. Guide ctor `0x181b8c` never selects it. Darken blend count
**0** across 29 Sound packs. Frozen complement stays **6072**. Not
recaptured. Not 1:1.
