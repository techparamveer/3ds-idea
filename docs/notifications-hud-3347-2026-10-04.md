# Notifications remaining upper HUD 3,347 — title-local HudMenu_00 bind — 4 October 2026

Stock/social worker on `codex/notifications-hud-bind-20261004` from HOME fidelity
`20190861`. Sparse worktree; `node_modules` linked from HOME fidelity.
No `model/`. No Azahar. No preview 3021. No CDP 9320. No recapture.

Independent review of worker `bbd46448` (integrated as `038802a1`) **rejected**
the source-gap label. The 3,347 is a missing title-local `HudMenu_00`, not an
unconvertible gap. This slice publishes the already-converted archive and binds
it. It does not claim 1:1. Tests and this note do not close pixels, input,
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
| Browser upper (pre-bind capture) | `78ff0a5ac9db09ebcb85799d23292a5c26f698c414851d46738e79dc51a16d02` |
| Browser lower | `bf5909e54fd845b38d25fe8168134077327e269e1e3e8f8b93333fdaaad403ce` |
| `report.json` | `f952d5acd2b355479689c4b3ab4eea37e20049f20bc58da9fb2402eb96e78cc6` |
| `upper-contact-sheet.png` | `4ba3d2da61e9bbf508bdc7de12513ed451e072bb007485a353aa274ee38c935c` |
| `lower-contact-sheet.png` | `b1913774dfa9578cf9865acdafff7391534948a83eecbf62120cb4c01281edda` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |

Inspected the upper contact sheet and the native still. Native `[0,0,400,28]`
is Wi-Fi/`P_NetAtn`, the cyan **Internet** pill, `27/09 (Sun) 13:16`, and an
orange charging battery. Center is empty white — **no WalkCoin** and no
`Notifications` title. Browser capture is only the labelled `Notifications`
bitmap title on already-bound `P_HudBase_00`. Max 255 at `(375,2)` is native
battery black vs browser white. Colon is visible at captured second 53, so
this applet follows the eShop frozen colon, not HOME `0x27c6a8` seconds
parity. The unread balloon, count `8` and body cards align; remaining body
red is SpotPass / StreetPass glyph and fill AA, not a missing balloon.

Recorded empty-mask counts over 2/255 against the **pre-bind** hashed browser
upper (any RGB >2/255):

| Region | Rectangle | Over 2 | Max | At |
| --- | ---: | ---: | ---: | --- |
| Whole upper | `[0,0,400,240]` | **6239** | 255 | `(375,2)` native `(0,0,0)` / browser `(255,255,255)` |
| HUD strip | `[0,0,400,28]` | **3347** | 255 | same battery pixel |
| Body complement | `[0,28,400,240]` | **2892** | 211 | `(106,187)` |
| Unread balloon | `[100,40,300,160]` | **0** | 2 | already-bound `NewsUnread_U_00` |
| Official Internet box | `report.screens.upper.regions[0]` `{x:26,y:2,width:108,height:16}` | **1719** | — | `T_NetMode` / `P_NetMode*` |
| Whole lower | `[0,0,320,240]` | **3876** | 140 | scrollbar / Close; not this slice |

`meanRgbError` 5.454756944444444. HUD `[0,0,400,24]` is also **3347**,
so the leftover sits inside the 28-row `P_HudBase_00` band. Those counts
describe the last coordinator capture, not this painter. This lane has no
`@napi-rs/canvas` module, so it did not raster a post-bind upper LCD.
Post-bind HUD `[0,0,400,28]` awaits coordinator recapture.

## Title-local owner (not a source gap)

EUR Notifications applet `000400300000a002`, version 4097, content
index 0 / ID `00000012`. Pinned `exefs/code.bin` SHA-256
`b3993f1e4fe5ed7e5760f0f4c3926c95b42ea8de53c25bb95864499342e5b228`,
image base `0x100000`. Title RomFS SHA-256
`edbe3dec63e8ac70a033df4216baafe27d94e4ee11ea9407d88567a1ed5190ae`.
`exefs/code.bin` lists `hud_LZ.bin` and `HudMenu_00` plus `NetMode` /
`WhiteBlack` / `SceneIn` / `WalkCoin` / `NetAtn`. Friends happens to share
the same `hud_LZ.bin` bytes; this slice still binds this title’s copy.
HOME `packs/home/hud.json` is title `0004003000009802` (layout SHA
`c27b927db06ec234601e3fc1bfa3f55f1c9570353ac8016c5ad9812ebaab28de`) and
is not reused.

Converter **1.3.1** / CTRTool **1.3.0** (same as published `news.json`)
already emitted private `packs/notifications/hud.json` SHA-256
`e10685be0a302cf36db3bf05fe83ff221ec1c90f33f1e5a0ab331b905ddd9d1a`
from `RomFS/hud_LZ.bin`. Omission from `stock-ui-notifications.json` was
unpublished delivery, not an unconvertible gap. This slice published the
selected subset through `stock_ui.py --additive` from
`notifications-converted-english`. Net/Bat/clock are
`REFERENCE_DEVICE_STATUS` plus the injected date bind used by eShop
`HudMenu_00`, not a screenshot fit.

`N_Scene_00` default alpha is 0, so SceneIn last frame **40** is required
from the layout (`HudMenu_00_SceneIn` source range `[-20,20]`, 41 frames,
last alpha key frame 40 / value 255). HOME idle is also 40. The earlier
note’s “41 / WalkCoin 360” was the wrong HOME copy (frame *count* 41, plus
HOME WalkCoin). Native has no WalkCoin; WalkCoin is not requested or
started. Unstarted layout-default `P_Walk_00` / `P_Coin_00` panes are
hidden rather than bound to an invented clip frame. The labelled
`new_title_new` font adapter is dropped as covering this strip.

## Element → manifest key → dump source

| Element | Manifest / pack | Dump source | Title / version / content | SHA-256 | Converter |
| --- | --- | --- | --- | --- | --- |
| `HudMenu_00` | `packs/notifications/hud.json` | `RomFS/hud_LZ.bin` / `hud_LZ.bin/blyt/HudMenu_00.bclyt` | `000400300000a002` v4097 content 0 / `00000012` | archive `8463b1e9a67a6a78760699aba751a225b03b54be6911e97e50d256fdf4dcf144`; layout `5a95579d59c8a92ddce79b95900e061835c84626543b403667be7239c77d30f7`; full converted pack `e10685be0a302cf36db3bf05fe83ff221ec1c90f33f1e5a0ab331b905ddd9d1a`; published selection `84d76eb05eae7f0d471b671bbf4aef8d4805bcdb57ea23f0d9f2489f5181cf6f` | ctr-native-web **1.3.1** |
| `HudMenu_00_SceneIn` | same pack | `hud_LZ.bin/anim/HudMenu_00_SceneIn.bclan` | same | `c26039c400bec5ece6ec86e21db4528b69ceaaf5c6ae54963e5041b56181d027` | 1.3.1 |
| `HudMenu_00_WhiteBlack` | same pack | `hud_LZ.bin/anim/HudMenu_00_WhiteBlack.bclan` | same | `0d1035f4b86462d5ab0fc15f17977825628109d0330325e96bbcd643433e30c9` | 1.3.1 |
| `HudMenu_00_NetMode` | same pack | `hud_LZ.bin/anim/HudMenu_00_NetMode.bclan` | same | `7098c074bf7e2b1b1d546c6ecfe3673f58c2efdb7aae29194e812c6f448e1801` | 1.3.1 |
| `HudMenu_00_NetAtn` | same pack | `hud_LZ.bin/anim/HudMenu_00_NetAtn.bclan` | same | `d6add3b6299da589c48e4beb61acb91d477525f1e4893a488b1c26e843984386` | 1.3.1 |
| `HudMenu_00_Bat` | same pack | `hud_LZ.bin/anim/HudMenu_00_Bat.bclan` | same | `1c58e6ea560703e92fdf40ff8e34a1a78fabcef776284a6f2eb1b7e6c6d2006e` | 1.3.1 |
| `lau_connect0` / `lau_date` / day / month / week | `packs/notifications/messages-and-loose.json` bank `hud_msbt_LZ` | `RomFS/message_hud/EU_English/hud_msbt_LZ.bin` | same | dump LZ `563f5d0c630bf0b51807596558df31500b9526e3f467e026a8a77d52cd0225d5`; converter `resourceSources` `a8860fb731e1a2065d28809c1184617db7f24f907531333c2bf1b0a4fa3a9c6d` | 1.3.1 |
| `Hud.bcfnt` | title `presentationFontBindings` → shared `fonts/hud/font.json` | existing verified HUD font (eShop bind) | n/a | existing HOME/shared delivery; not a reconstructed face | existing |
| `NewsTopUI_U_00` / `NewsUnread_U_00` / `P_HudBase_00` | `packs/notifications/news.json` | `news_LZ.bin` as previously published | same | news pack `9f6e27e61012dfa0cb31a78eaa4646d0f7abf019811e67d76aadafb9159aa375` | 1.3.1 |

`drawNativePersonalToolFrame` still draws `NewsTopUI_U_00` and
`NewsUnread_U_00` with SceneIn 20 and NumAnim, then draws title-local
`HudMenu_00` with SceneIn 40, WhiteBlack 0, NetMode 0, NetAtn 3 and Bat 4,
injecting `27/09 (Sun) HH:MM` from `options.date` like eShop. The unread
balloon crop stays **0** in the reused pair.

Published `news.json` unused `NewsWndwNews_U_00` / `NewsDetailUI_00` /
`NewsElemCnt_00` remain list/detail/exit clips. They have no NetMode, Date
or Bat pane and are not requested.

## Remaining residual

C-NTF-01 remaining upper HUD `[0,0,400,28]` **3,347** on the reused
capture is the unbound title-local HUD in that still, now bound in source.
Whole upper **6,239** and lower **3,876** remain fail on that pair. Body
**2,892** SpotPass / StreetPass AA is a separate leftover. Post-bind pixel
count is not established here. Input, motion and audio remain open. Not 1:1.

## Checks

Focused `tests/notifications-hud-3347.test.mjs` **3/3**. `npm test` 1995 pass /
36 fail / 23 skip (2055); the 36 fails are sparse-checkout `model/` / GLB
ENOENT, unchanged from this worktree. `npm run typecheck` passes.
`python3 -B -m unittest tests.test_stock_ui` 15/15. `npm run build` fails
here because Turbopack rejects the external `node_modules` symlink (same
sparse restriction as prior stock workers). `git diff --check` clean. This
lane did not drive Azahar or preview 3021 and did not recapture.
