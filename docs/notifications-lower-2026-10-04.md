# Notifications remaining lower Close 577 / list 820 source gap — 4 October 2026

Stock/social worker on `codex/notifications-lower-20261004` from HOME fidelity
`038802a1`. Sparse worktree; `node_modules` linked from HOME fidelity.
No `model/`. No runtime change. No Azahar. No preview 3021. No CDP 9320.
No recapture. No CSS, font, mip, sampler, snap, colour, lcd or
`azahar-12p4-fit`. The labelled Notifications upper HUD `[0,0,400,28]`
**3347** stays under review and is not reopened. Sibling
`codex/next-residual-3-20261004` (`a70d80b6`) already labelled scrollbar
`[291,0,320,210]` **2479**; that strip is not reopened. Sound clusters,
Settings Other pages, Camera Welcome 1401 / pages 3–4 TxtDlg body,
HOME 1-row leftovers, HUD battery and Sound HUD 5/4 stay labelled.

This is not a 1:1 claim. Tests and this note do not close pixels, input,
motion or audio. Coordinator recapture remains the acceptance gate.

## Pair (reused, not recaptured)

Private comparison
`/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260927-postfix/reference/scenario-matrix/v1/comparisons/notifications-unread-dot-f073581/`.
Production browser LCDs under the sibling `captures/notifications-unread-dot-f073581/browser/`.
Native 400×480 PNG
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/native-reference/screenshots/_27.09.26_13.16.53.105.png`
(same bytes as the isolated Vulkan still named in
[unread-marker](notifications-unread-marker-source-trace-2026-09-27.md)).
Empty mask. Threshold any RGB channel >2/255. Official lower crop of the
native PNG is `(40,240,320,240)`.

| Item | SHA-256 |
| --- | --- |
| Native `_27.09.26_13.16.53.105.png` | `58fff71424e1301e6ead6d7ef9281689faa368bf0e6403dc6dccaef1f9afa389` |
| Browser upper | `78ff0a5ac9db09ebcb85799d23292a5c26f698c414851d46738e79dc51a16d02` |
| Browser lower | `bf5909e54fd845b38d25fe8168134077327e269e1e3e8f8b93333fdaaad403ce` |
| `report.json` | `f952d5acd2b355479689c4b3ab4eea37e20049f20bc58da9fb2402eb96e78cc6` |
| `upper-contact-sheet.png` | `4ba3d2da61e9bbf508bdc7de12513ed451e072bb007485a353aa274ee38c935c` |
| `lower-contact-sheet.png` | `b1913774dfa9578cf9865acdafff7391534948a83eecbf62120cb4c01281edda` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |

Inspected the lower contact sheet. Native and browser both paint the
same five compact balloons, information badges, unread lamps and
`× Close`. Remaining red on Close is a mixed glyph-coverage fringe on the same
already-bound `new_back` string (351 shared / 29 native-only / 25
browser-only ink pixels), not a different string. Remaining list red is title-glyph
AA on rows 2–5, not a missing balloon, icon or lamp. The right-hand
groove is the labelled scrollbar leftover.

Recorded empty-mask counts over 2/255:

| Region | Rectangle | Over 2 | Max | At |
| --- | --- | ---: | ---: | --- |
| Whole lower | `[0,0,320,240]` | **3876** | 140 | `(165,227)` native `(214,214,215)` / browser `(74,74,79)` |
| Scrollbar strip | `[291,0,320,210]` | **2479** | 117 | labelled sibling leftover, not this slice |
| List body | `[0,0,291,210]` | **820** | 18 | `(124,111)` native `(251,254,254)` / browser `(233,249,251)` |
| Balloon/title band | `[50,0,280,210]` | **820** | 18 | same pixel; icons `[0,0,50,210]` are **0** |
| First row | `[0,0,291,48]` | **0** | 2 | already-bound `NewsWndwNews_D_00` |
| Close footer | `[0,210,320,240]` | **577** | 140 | same Close pixel as whole lower |
| Close glyphs | `[125,216,195,234]` | **521** | 140 | `× Close` coverage |
| Close/list seam | `[0,210,320,214]` | **56** | 14 | balloon clip at y = 210 |
| Whole upper | `[0,0,400,240]` | **6239** | 255 | labelled HUD 3347 + body 2892 |

`meanRgbError` 0.9509765625. Footer **577** = glyph **521** + seam **56**.
Body **820** + scrollbar **2479** + footer **577** = whole **3876**.
Official Close clusters are `report.screens.lower.regions[3]` **91**
`{x:148,y:216,width:11,height:17}` (the **C**), `[8]/[11]/[12]` (the ×)
and `[7]/[6]/[4]/[5]` (`l/o/s/e`). Official list body is many
title-AA clusters, the first being `regions[13]` **19**
`{x:75,y:57,width:9,height:4}`.

## Already-bound source (no unique delivered owner)

EUR Notifications applet `000400300000a002`, version 4097, content
index 0 / ID `00000012`, product `CTR-N-HCRP`. Pinned `exefs/code.bin`
SHA-256
`b3993f1e4fe5ed7e5760f0f4c3926c95b42ea8de53c25bb95864499342e5b228`,
image base `0x100000`. Title RomFS SHA-256
`edbe3dec63e8ac70a033df4216baafe27d94e4ee11ea9407d88567a1ed5190ae`.
Published `news.json` SHA-256
`9f6e27e61012dfa0cb31a78eaa4646d0f7abf019811e67d76aadafb9159aa375`
from dump `RomFS/news_LZ.bin` SHA-256
`4b4e5bd8b63d0c8859ba10e3daa4ac819b53e0f16ca3e9d4a401c0cdeb819366`
(title `uiSelection.sourceConverter` **1.3.1**). English
`newslist_msbt_LZ` source SHA-256
`72d4794bb526ae90bb7d06e99a039ea1701044dad3b850983217a8a63b2cbb62`.

| Element | Manifest / pack | Dump source | SHA-256 |
| --- | --- | --- | --- |
| `NewsTopBtn_D_00` | `packs/notifications/news.json` | `news_LZ.bin/blyt/NewsTopBtn_D_00.bclyt` | `3d2c34fc60e178c92903f5306412a718fc2b7d8358e269101db4e0e8e10a4836` |
| `NewsTopBtn_D_00_SceneIn` | already requested frame 20 | `news_LZ.bin/anim/NewsTopBtn_D_00_SceneIn.bclan` | `753d11b86290446d9343fb516dec083dc48647e32c7700281ab3c06ea29a1ee5` |
| `T_EndB_00` / `T_EndF_00` | `new_back` ` Close` | same MSBT | list Close, not `new_close` |
| `NewsWndwNews_D_00` | same pack | `news_LZ.bin/blyt/NewsWndwNews_D_00.bclyt` | `dfa42ef3e245a0abd77afba4653352aaf685fbdda65a91550b163421cf91ce80` |
| `NewsWndwNews_D_00_SceneIn` | already requested frame 10 | `news_LZ.bin/anim/NewsWndwNews_D_00_SceneIn.bclan` | `fb3f2bbbf31ea8cb590ef67f56b1017f967984d798292a702eb8cb169a3fa785` |
| `NewsWndwNews_D_00_Select` | already requested frame 0 | `news_LZ.bin/anim/NewsWndwNews_D_00_Select.bclan` | `7202e8c8807c5954b676c2af3efde9c8c12cfcd8de14cf2af2cc552ae0e9c78d` |

`drawNativePersonalToolFrame` already draws `NewsTopBtn_D_00` at SceneIn
20 with `new_back` on both text panes, and five `NewsWndwNews_D_00` rows
at SceneIn 10 / Select 0 (Select 1 only when `selectionActive`). `code.bin`
places `new_back` next to `T_EndF_00` / `T_EndB_00` at `0x17d370` /
`0x17d37c` / `0x17d388`. SceneIn 20 samples identically to unused Select
0 (no track diffs). First-row crop **0** and icon column **0** show the
bound row chrome, `special.cic` and `RcvLamp_00` already paint.

## Unused members that do not uniquely own 577 / 820

Dump `news_LZ.bin` has **no** `NewsTopBtn_D_00_Default` or `_Disable`
BCLAN. Published unused Close clips:

- `NewsTopBtn_D_00_Select` (SHA-256
  `3dbc752c9d36d0acefd1a817df60dabdddced7e3512da36aae3ab6bbf086a850`).
  Frame 0 equals SceneIn 20. Frame 1 is the pressed 1 px / brighter
  chrome (`P_Btn_00` y −121, Grad 220/80). Idle capture is not pressed.
- `NewsTopBtn_D_00_Decide` (SHA-256
  `b67cfe899a6d312277e0335d42577dbf73979bc0d4f328fe64ab82d11f72bd80`)
  is the six-frame press flash.
- `NewsTopBtn_D_00_SceneOut` (SHA-256
  `ed3796e890627ee50895fe7dc69c0e54c3a9850fa99f8f0b3f478bb9a44af420`)
  fades `P_Btn_00` alpha 255→0 and slides y −120→−148.
- `new_close` / `new_close_big` are plain `Close` without the U+E071 ×-in-square glyph.
  `new_close` literals sit at `0x177b0c` / `0x177b30`, away from the
  list `T_End*` path. Binding them would drop ``.

Unused published row clips `NewsWndwNews_D_00_Decide` /
`NewsWndwNews_D_00_SceneOut` write only `N_News_00` / `P_Blln*` pose
and materialColor; they have no `T_NewsTitle*` track. Select 1 tints
balloons `(169,204,208)` for focus; this still is neutral entry.
Unused `NewsWndwNews_U_00` is a 320×240 broken-line row with no
`P_Blln_00`. `NewsDetailUI_00` owns detail `T_Close*` / dual footers.
`NewsElemCnt_00` is the contact-detail card.

Dump-only `NewsWndwNews_01` (`news_LZ.bin/blyt/NewsWndwNews_01.bclyt`
SHA-256
`e4f2dedf35dda9addc007f4252b9b11449845148cc9de6b47ba39d5858026b5a`)
adds `T_Contents_00` / `P_ContentArea_00` and Appear clips. It is
omitted from published `news.json`. Native still shows compact 53 px
rows with no body paragraph. Publishing it and guessing Appear would
be a screenshot fit, not a unique delivered idle clip. `dialog_LZ.bin`
/ `waiticon_LZ.bin` / `common_LZ.bin` are other scenes.

No lcd / `azahar-12p4-fit` / colour / font guess is applied. The live
pack request already omits Close Select/Decide/SceneOut and row
Decide/SceneOut.

## Labelled gap

C-NTF-01 remaining lower Close footer `[0,210,320,240]` **577** and
list body `[0,0,291,210]` **820** are a **source gap**. Already-bound
SceneIn 20 + `new_back` and SceneIn 10 / Select 0 do not uniquely own
the `cbf_std` glyph coverage. Until a unique unused idle clip exists,
the painter stays unchanged. Whole lower **3,876** remains fail.
Labelled scrollbar **2479** and upper HUD **3347** are not reopened.

## Checks

Focused `tests/notifications-lower.test.mjs` plus `git diff --check`.
Application typecheck/build were not rerun because no application files
changed. This lane did not drive Azahar or preview 3021.
