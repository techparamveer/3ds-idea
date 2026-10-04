# Notifications remaining upper HUD 3,347 source gap — 4 October 2026

Stock/social worker on `codex/next-residual-2-20261004` from HOME fidelity
`0b45a041`. Sparse worktree; `node_modules` linked from HOME fidelity.
No `model/`. No runtime change. No Azahar. No preview 3021. No CDP 9320.
No recapture. No CSS, font, mip, sampler, snap, colour or
`azahar-12p4-fit`. The labelled Sound clusters, Settings Other pages,
Camera Welcome 1401 / pages 3–4 TxtDlg body, HOME 1-row leftovers, HUD
battery and Sound HUD 5/4 stay labelled and are not reopened.

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
native PNG is `(40,240,320,240)`; upper crop is `(0,0,400,240)`.

| Item | SHA-256 |
| --- | --- |
| Native `_27.09.26_13.16.53.105.png` | `58fff71424e1301e6ead6d7ef9281689faa368bf0e6403dc6dccaef1f9afa389` |
| Browser upper | `78ff0a5ac9db09ebcb85799d23292a5c26f698c414851d46738e79dc51a16d02` |
| Browser lower | `bf5909e54fd845b38d25fe8168134077327e269e1e3e8f8b93333fdaaad403ce` |
| `report.json` | `f952d5acd2b355479689c4b3ab4eea37e20049f20bc58da9fb2402eb96e78cc6` |
| `upper-contact-sheet.png` | `4ba3d2da61e9bbf508bdc7de12513ed451e072bb007485a353aa274ee38c935c` |
| `lower-contact-sheet.png` | `b1913774dfa9578cf9865acdafff7391534948a83eecbf62120cb4c01281edda` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |

Inspected the upper contact sheet. Native paints Internet, `27/09 (Sun)
13:16` and a battery on the 28-row bar. Browser paints the labelled
bitmap-font `Notifications` adapter on already-bound `P_HudBase_00`.
The unread balloon, count `8` and body cards align; remaining body red
is SpotPass / StreetPass glyph and fill AA, not a missing balloon.

Recorded empty-mask counts over 2/255:

| Region | Rectangle | Over 2 | Max | At |
| --- | --- | ---: | ---: | --- |
| Whole upper | `[0,0,400,240]` | **6239** | 255 | `(375,2)` native `(0,0,0)` / browser `(255,255,255)` |
| HUD strip | `[0,0,400,28]` | **3347** | 255 | same battery pixel |
| Body complement | `[0,28,400,240]` | **2892** | 211 | `(106,187)` |
| Unread balloon | `[100,40,300,160]` | **0** | 2 | already-bound `NewsUnread_U_00` |
| Official Internet box | `report.screens.upper.regions[0]` `{x:26,y:2,width:108,height:16}` | **1719** | — | `T_NetMode` / `P_NetMode*` |
| Whole lower | `[0,0,320,240]` | **3876** | 140 | scrollbar / Close; not this slice |

`meanRgbError` 5.454756944444444. HUD `[0,0,400,24]` is also **3347**,
so the leftover sits inside the 28-row `P_HudBase_00` band. Lower
scrollbar `[291,0,320,210]` **2479** and Close footer `[0,210,320,240]`
**577** stay the previously named remaining list residuals and are not
reopened here.

## Already-bound source (no unique delivered owner)

EUR Notifications applet `000400300000a002`, version 4097, content
index 0 / ID `00000012`. Pinned `exefs/code.bin` SHA-256
`b3993f1e4fe5ed7e5760f0f4c3926c95b42ea8de53c25bb95864499342e5b228`,
image base `0x100000`. Title RomFS SHA-256
`edbe3dec63e8ac70a033df4216baafe27d94e4ee11ea9407d88567a1ed5190ae`.
Published `news.json` SHA-256
`9f6e27e61012dfa0cb31a78eaa4646d0f7abf019811e67d76aadafb9159aa375`
from `news_LZ.bin` SHA-256
`4b4e5bd8b63d0c8859ba10e3daa4ac819b53e0f16ca3e9d4a401c0cdeb819366`
(title `uiSelection.sourceConverter` **1.3.1**). English
`newslist_msbt_LZ` source SHA-256
`72d4794bb526ae90bb7d06e99a039ea1701044dad3b850983217a8a63b2cbb62`.

| Element | Manifest / pack | Dump source | SHA-256 |
| --- | --- | --- | --- |
| `NewsTopUI_U_00` | `packs/notifications/news.json` | `news_LZ.bin/blyt/NewsTopUI_U_00.bclyt` | `dfe4583dab0a9c212380921957b673d6d435b42d84f9125919322f79bc09c547` |
| `NewsUnread_U_00` | same pack | `news_LZ.bin/blyt/NewsUnread_U_00.bclyt` | `0362c72dc421800a3e91647bc04800810ae35a589be4f92cbc4e8a478cb0751d` |
| `NewsUnread_U_00_SceneIn` | already requested frame 20 | `news_LZ.bin/anim/NewsUnread_U_00_SceneIn.bclan` | `e46adce67ac0b229bcc45ad6232693f526b4cb28f540176a785b52f401ff4d15` |
| `NewsUnread_U_00_NumAnim` | already requested | `news_LZ.bin/anim/NewsUnread_U_00_NumAnim.bclan` | `f92a10375d493ec4a6c4dbcfe62a86b78a1f19fa4e2f0470083faf0aad15ca6b` |
| `P_HudBase_00` | unread `pic1` 400×28 at `[-200,120]`, origin 0 | `news_LZ.bin/timg/HudBase_00.bclim` | source `aaaef78fa5e1a428da66c319202f123c8c52eaf798490423f3f9daf3413f843f` |
| Title string | `new_title_new` | same MSBT | `Notifications` (bitmap-font adapter) |

`drawNativePersonalToolFrame` already draws `NewsTopUI_U_00`, then
`NewsUnread_U_00` with SceneIn 20 and NumAnim, and overlays
`options.font?.draw` of `new_title_new` at `(200,14)`. That overlay is
the labelled portfolio HUD-title adapter in
[native personal tools](native-personal-tools.md). `P_HudBase_00` is
the grey 28-row bar only. SceneIn's eight tracks target `P_BG_00` and
the three `P_NumPos*` panes (`visible` only hides `P_NumPos010_00` /
`P_NumPos100_00` at frame 20). It has no `P_HudBase_00` or
Internet/date/Bat track. The unread balloon crop stays **0**.

## Unused members that do not uniquely own the 3,347

Published `news.json` still contains unused `NewsWndwNews_U_00` (320×240
row layout with `T_NewsTitle*` / `P_Icon_00`, SHA-256
`ccbbe37375c89762995ce7720702b1446e20a6f94c15716e9a8de388a9625ab8`),
`NewsDetailUI_00` and `NewsElemCnt_00`, plus unread `SceneOut`. Those
are list/detail/exit clips. They have no NetMode, Date or Bat pane and
do not uniquely own the HUD strip. The live pack request also omits
them.

Dump RomFS `hud_LZ.bin` SHA-256
`8463b1e9a67a6a78760699aba751a225b03b54be6911e97e50d256fdf4dcf144`
(`RomFS/hud_LZ.bin`, title `000400300000a002`, content `00000012`)
decodes to `HudMenu_00` (`hud_LZ.bin/blyt/HudMenu_00.bclyt` SHA-256
`5a95579d59c8a92ddce79b95900e061835c84626543b403667be7239c77d30f7`)
with `T_NetMode_00`, `T_Date_00`, `T_TimeL_00` / `T_TimeC_00` /
`T_TimeR_00` and `P_Bat_00`. English `message_hud/EU_English/hud_msbt_LZ.bin`
SHA-256 `563f5d0c630bf0b51807596558df31500b9526e3f467e026a8a77d52cd0225d5`.
`scripts/firmware/stock-ui-notifications.json` and the published
`titles.000400300000a002.packs` list omit that archive. No
`packs/notifications/hud.json` is delivered. HOME `packs/home/hud.json`
is title `0004003000009802` and is not this applet.

Publishing the omitted archive and guessing `HudMenu_00_Bat` /
`NetMode` / `WhiteBlack` / `WalkCoin` (360 frames) / SceneIn 41 to the
captured `13:16` Internet / charging battery would be a screenshot fit,
not a unique delivered clip. The labelled `new_title_new` font adapter
stays; it does not uniquely own native Internet / date / Bat pixels.

## Labelled gap

C-NTF-01 remaining upper HUD `[0,0,400,28]` **3,347** is a **source
gap**. Already-bound `P_HudBase_00` plus the title adapter do not paint
the title-local `HudMenu_00` widgets. Until that archive is delivered
with a source-traced clock/net/Bat owner, the painter stays unchanged.
Whole upper **6,239** and lower **3,876** remain fail. Body **2,892**
SpotPass / StreetPass AA is a separate leftover.

## Checks

Focused `tests/notifications-hud-3347.test.mjs` plus `git diff --check`.
Application typecheck/build were not rerun because no application files
changed. This lane did not drive Azahar or preview 3021.
