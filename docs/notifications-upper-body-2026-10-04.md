# Notifications unread-dot upper body 2,892 — already-bound card glyphs 1 px low — 4 October 2026

Stock/social worker on `codex/notifications-upper-body-20261004` from HOME
fidelity `a05ff90c`. Sparse worktree; `node_modules` linked from HOME fidelity.
No `model/`. No runtime change. No Azahar. No preview 3021. No CDP 9320.
No recapture. No CSS, font, mip, sampler, snap, colour, lcd or
`azahar-12p4-fit`. The just-bound title-local HUD `[0,0,400,28]`
(`ba78c156` / worker `b0a80fca`) is not reopened. Sibling
`codex/notifications-lower-20261004` owns the lower `SlideBar` block in
`stock-native-personal-tools.ts`; this slice does not edit that draw.
Labelled Close **577** / list **820**, scrollbar **2479**, Sound clusters,
Settings Other pages, Camera Welcome leftovers and HOME 1-row leftovers
stay labelled.

This is not a 1:1 claim. Tests and this note do not close pixels, input,
motion or audio. Coordinator recapture remains the acceptance gate.

Two earlier Notifications source-gap claims on this pair were **REJECTED**
because unique owners existed (`HudMenu_00`; `0x13a160` thumb controller).
This leftover was inspected against those misses: the unique card owner is
already drawn.

## Pair (reused, not recaptured)

Private comparison
`/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260927-postfix/reference/scenario-matrix/v1/comparisons/notifications-unread-dot-f073581/`.
Production browser LCDs under the sibling `captures/notifications-unread-dot-f073581/browser/`.
Native 400×480 PNG
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/native-reference/screenshots/_27.09.26_13.16.53.105.png`
(same bytes as isolated Vulkan `_27.09.26_13.16.53.105.png`).
Empty mask. Threshold any RGB channel >2/255. Official native upper crop
is `(0,0,400,240)`.

| Item | SHA-256 |
| --- | --- |
| Native `_27.09.26_13.16.53.105.png` | `58fff71424e1301e6ead6d7ef9281689faa368bf0e6403dc6dccaef1f9afa389` |
| Browser upper (pre-HUD-bind capture) | `78ff0a5ac9db09ebcb85799d23292a5c26f698c414851d46738e79dc51a16d02` |
| Browser lower | `bf5909e54fd845b38d25fe8168134077327e269e1e3e8f8b93333fdaaad403ce` |
| `report.json` | `f952d5acd2b355479689c4b3ab4eea37e20049f20bc58da9fb2402eb96e78cc6` |
| `upper-contact-sheet.png` | `4ba3d2da61e9bbf508bdc7de12513ed451e072bb007485a353aa274ee38c935c` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |

Inspected the upper contact sheet and both LCDs. Native and browser both
paint the same unread balloon (`8`), the same two SpotPass / StreetPass
cards, and the same `SpotPass\nNotifications` / `StreetPass\nNotifications`
/ `Unread: 8` / `Unread: 0` strings. The balloon crop is already **0**.
Card chrome, corner triangles and mid-gap are aligned. Remaining red is
the card text, not a missing pane or a second row.

Recorded empty-mask counts over 2/255 against the hashed pre-HUD-bind
browser upper:

| Region | Rectangle | Over 2 | Max | At |
| --- | ---: | ---: | ---: | --- |
| Whole upper | `[0,0,400,240]` | **6239** | 255 | `(375,2)` labelled HUD battery |
| HUD strip | `[0,0,400,28]` | **3347** | 255 | same; not this slice |
| Body complement | `[0,28,400,240]` | **2892** | 211 | `(106,187)` native `(211,233,232)` / browser `(0,151,221)` |
| Unread balloon | `[100,40,300,160]` | **0** | 2 | already-bound `NewsUnread_U_00` |
| Above-card band | `[0,28,400,155]` | **0** | 2 | no missing upper row |
| Mid-card gap | `[196,155,204,232]` | **0** | 1 | cards are not shifted sideways |
| Left SpotPass card | `[8,155,196,232]` | **1421** | 211 | same max pixel |
| Right StreetPass card | `[204,155,392,232]` | **1471** | 210 | `(341,187)` native `(210,247,193)` / browser `(0,166,5)` |
| Official body boxes | 97 `report.screens.upper.regions` with `y≥28` | **2892** | — | first `{x:87,y:183,width:15,height:11}` **136** |

`1421 + 1471 = 2892`. Browser solid ink at the max pixels is the already-bound
`T_News_00` / `T_Cnt_00` constant `(0,151,221)` / `(0,166,5)` sitting on
native card fill `(218,241,239)` / `(217,255,199)`. Shifting the browser
upper **one pixel up** (`dy = −1`) zeros **all 97** official body boxes
(no pixel over 2/255). A whole-body `dy = −1` comparison is **29197** because
that also misaligns the already-correct card chrome. The leftover is
therefore a **1 px vertical text pose** inside already-bound card panes,
not a missing frame, missing card, or different material.

This lane has no `@napi-rs/canvas` module, so it did not raster a new
browser LCD. Painter unchanged: before = after = **2892** on this hashed
pair. Post-HUD-bind HUD pixels await coordinator recapture; the body
count is independent of that bind.

## Already-bound unique card owner

EUR Notifications applet `000400300000a002`, version 4097, content
index 0 / ID `00000012`. Pinned `exefs/code.bin` SHA-256
`b3993f1e4fe5ed7e5760f0f4c3926c95b42ea8de53c25bb95864499342e5b228`,
image base `0x100000`. Title RomFS SHA-256
`edbe3dec63e8ac70a033df4216baafe27d94e4ee11ea9407d88567a1ed5190ae`.
Dump `RomFS/news_LZ.bin` SHA-256
`4b4e5bd8b63d0c8859ba10e3daa4ac819b53e0f16ca3e9d4a401c0cdeb819366`
(title `uiSelection.sourceConverter` **1.3.1**). Published `news.json`
SHA-256
`9f6e27e61012dfa0cb31a78eaa4646d0f7abf019811e67d76aadafb9159aa375`.

`NewsUnread_U_00` already owns both cards: `P_BllnN_L_00` / `T_News_00` /
`T_NewsUnread_00` (SpotPass) and `P_BllnC_R_00` / `T_Cnt_00` /
`T_CntUnread_00` (StreetPass). SceneIn 20 and NumAnim `min(112, unread)`
are already requested. `code.bin` at `0x17c5d0` ADR-binds the same
literals the painter uses (`T_News_00` `0x17c658` / `new_news_u1`
`0x17c664`; `T_Cnt_00` `0x17c670` / `new_ce_u1` `0x17c67c`) and passes
`r3 = 0`. English styles 104–107 are `fontScale [0.6, 0.6]`, which on
shared `cbf_std` (`width` 25 / `height` 30 / `lineFeed` 30) is the pane
`text.size` `[15, 18]`. Material constants already match native core ink.

`NewsTopUI_U_00` is only `P_Bg_U_00` plus empty `N_ElemPos_00`
`[-160, −140]` / `[264, 54]`. The dump and published pack have **no**
`NewsTopUI_U_00_*` BCLAN. That empty parent is not a card and is not a
wrong pose of the already-aligned background.

## Element → manifest key → dump source

| Element | Manifest / pack | Dump source | Title / version / content | SHA-256 | Converter |
| --- | --- | --- | --- | --- | --- |
| `NewsUnread_U_00` | `packs/notifications/news.json` | `news_LZ.bin/blyt/NewsUnread_U_00.bclyt` | `000400300000a002` v4097 content 0 / `00000012` | layout `0362c72dc421800a3e91647bc04800810ae35a589be4f92cbc4e8a478cb0751d`; news pack `9f6e27e61012dfa0cb31a78eaa4646d0f7abf019811e67d76aadafb9159aa375`; archive `4b4e5bd8b63d0c8859ba10e3daa4ac819b53e0f16ca3e9d4a401c0cdeb819366` | ctr-native-web **1.3.1** |
| `NewsUnread_U_00_SceneIn` | same pack | `news_LZ.bin/anim/NewsUnread_U_00_SceneIn.bclan` | same | `e46adce67ac0b229bcc45ad6232693f526b4cb28f540176a785b52f401ff4d15` | 1.3.1 |
| `NewsUnread_U_00_NumAnim` | same pack | `news_LZ.bin/anim/NewsUnread_U_00_NumAnim.bclan` | same | `f92a10375d493ec4a6c4dbcfe62a86b78a1f19fa4e2f0470083faf0aad15ca6b` | 1.3.1 |
| `T_News_00` / `T_Cnt_00` materials | same layout | constants `(0,151,221)` / `(0,166,5)` | same | layout above | 1.3.1 |
| `NewsBlln_U.bclim` | same pack | `news_LZ.bin/timg/NewsBlln_U.bclim` | same | `64847a44545e2f0220b49d01fa43a561be289c248707d9b042fb535ce4b97fe3` | 1.3.1 |
| `PictNews_00.bclim` | same pack | `news_LZ.bin/timg/PictNews_00.bclim` | same | `08d249d0924a095df63f1b515218b451779b464d4d9821c020f266a807a37162` | 1.3.1 |
| `new_news_u1` / `new_ce_u1` / unread counts | `packs/notifications/messages-and-loose.json` bank `newslist_msbt_LZ` | `RomFS/message/EU_English/newslist_msbt_LZ.bin` | same | dump LZ `cd9261dd122c66ff8feaddc68f2bd5f8e199ebb90feb7067976fa34fa0966652`; converter `72d4794bb526ae90bb7d06e99a039ea1701044dad3b850983217a8a63b2cbb62` | 1.3.1 |
| styles 104–107 | same pack `message/EU_English/RI_mstl_LZ.bin` | `RomFS/message/EU_English/RI_mstl_LZ.bin` | same | dump LZ `bd8b581be5f49d28cbf81321595c1451e6634e701563696d1e41aa4fc20bcf03`; converter `23833acc620efbf4f5119ce7c0dace5ac68e9055f79eb54cc3489c60b6d65834` | 1.3.1 |
| `NewsTopUI_U_00` background only | `packs/notifications/news.json` | `news_LZ.bin/blyt/NewsTopUI_U_00.bclyt` | same | `dfe4583dab0a9c212380921957b673d6d435b42d84f9125919322f79bc09c547` | 1.3.1 |
| `cbf_std.bcfnt` | shared `fonts/shared/font.json` | existing verified shared face | n/a | existing HOME/shared delivery; `height` 30 / `lineFeed` 30 | existing |

`drawNativePersonalToolFrame` already draws `NewsTopUI_U_00` then
`NewsUnread_U_00` with those MSBT overrides. The matching header
`T_Unread_00` (`new_news_u`, origin 1 / lineAlignment 1) sits in the
**0**-residual balloon crop. The four card panes are origin 7 /
alignment 4 / lineAlignment 2 / `text.flags` 0.

## Unused members that do not uniquely own 2892

- Published unused `NewsWndwNews_U_00` (SHA-256
  `ccbbe37375c89762995ce7720702b1446e20a6f94c15716e9a8de388a9625ab8`)
  is a **320×240** list row (`T_NewsTitleB_00` / `T_NewsTitleF_00` /
  `P_Icon_00` / `P_BrokenLine_00`). SceneIn/Out/Select/Decide only move
  `N_News_00`. It has no SpotPass / StreetPass card panes. Binding it
  onto `NewsTopUI_U_00/N_ElemPos_00` would invent an upper list row the
  native still does not show (above-card band **0**).
- Unused `NewsUnread_U_00_SceneOut` fades `P_BG_00` alpha 255→0. Idle
  capture is SceneIn 20.
- Unused `NewsDetailUI_00` / `NewsElemCnt_00` are detail / contact-exit
  (320×240). Dump-only `NewsWndwNews_01` / `NewsPhoto_U_00` /
  `NewsWaitMask_U_00` / `NewsWndwCnt_*` are other scenes.
- Title-local `romfs/font/Hud_JP.bcfnt` is the Japanese HUD face, not
  these English `cbf_std` cards.
- `common_LZ.bin` / `dialog_LZ.bin` / `debug_text_LZ.bin` /
  `waiticon_LZ.bin` are fades, dialogs and debug. `nwfont_TextWriterShader.shbin`
  is the native writer binary; it is not a unique unused pane or clip.
- `writer-0x110` requires lineAlignment 1; `writer-0x111` requires
  lineAlignment 0. These card panes are lineAlignment 2. Opting into
  `lcd` / `lcd-source-size` / `azahar-12p4-fit` or adding `translation.y ± 1`
  would be a screenshot snap, not a traced owner. `code.bin` passes
  `r3 = 0` at the already-bound setter.

## Labelled gap

C-NTF-01 remaining upper body `[0,28,400,240]` **2892** is a **source
gap**: already-bound `NewsUnread_U_00` card glyphs are one pixel lower
than native, with no unique unused idle clip, font, material or writer
flag. Until a traced writer for origin-7 / lineAlignment-2 `cbf_std`
exists, the upper-card painter stays unchanged. Whole upper **6239**
remains fail on this pair (HUD **3347** now bound in source; body
**2892** unchanged). Input, motion and audio remain open. Not 1:1.

## Checks

Focused `tests/notifications-upper-body.test.mjs`. Application
typecheck/build were not rerun because no application files changed.
`git diff --check` clean. This lane did not drive Azahar or preview
3021 and did not recapture.

Coordinator recapture after integrating the HUD bind, using the same
hashed native and empty mask:

```sh
node scripts/native-compare/compare.mjs \
  --native /Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/native-reference/screenshots/_27.09.26_13.16.53.105.png \
  --browser /absolute/path/to/new-browser-lcds \
  --mask scripts/native-compare/empty-mask.json \
  --out /absolute/artifact/output/directory \
  --scenario notifications-list-unread-dot \
  --commit FULL_GIT_SHA
```

Optional source-render (not acceptance):
`scripts/verify-native-personal-tools.mjs --title notifications-list`
with `--artifact-dir`, `--asset-root`, `--canvas-module` and
`--interface-root`.
