# Internet Browser upper HUD — title-local sysinfo bind — 4 October 2026

Stock/services worker on `codex/browser-hud-20261004` from HEAD `d46f845e`.
Sparse worktree; `node_modules` linked from HOME fidelity. No `model/`.
No Azahar. No preview 3021. No CDP 9320. No recapture.

The coordinator prompt assumed a Notifications-style `hud_LZ.bin` /
`HudMenu_00`. Browser NAND title `0004003000009d02` has neither. Unique
firmware owner is the title-local `layout/sysinfo` compositor. This slice
publishes those already-converted archives and binds them. It does not
claim 1:1. Tests and this note do not close pixels, input, motion or audio.
Coordinator recapture remains the acceptance gate.

## Pair (reused, not recaptured)

Private comparison
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/native-new-apps-captures-20261004/browser-start-menu-local/`.
Native 400×480 PNG
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/native-new-apps-20261004/screenshots/new-apps-20261004/_04.10.26_19.20.59.347.png`.
Empty mask. Threshold any RGB channel >2/255. Official lower crop of the
native PNG is `(40,240,320,240)`; upper crop is `(0,0,400,240)`.

The native still is first-run welcome (grey backdrop + HUD + lower welcome
dialog). Our capture is the local start menu (lined BG, centred
**Internet Browser** title, lower StartDialog). Whole-LCD residuals mix that
scene mismatch with the missing HUD. This slice owns the HUD strip.

Capture `date` `2026-10-04T18:20:59.347Z` (BST 19:20:59). Seconds 59 are
odd: HOME/Notifications colon hide and Bat frame 4.

| Item | SHA-256 |
| --- | --- |
| Native `_04.10.26_19.20.59.347.png` | `4bfffefeee3ee291e478e7c8db39d5d31ce1293478acfcbc138caf2561c6e80a` |
| Browser upper (pre-bind capture) | `8fef95ac4a7f2f7330cdbc108d2c7101670d1e6b58268f6894be03d2e54effb2` |
| Browser lower | `a2b12cde2e886b2de7ad09b208ad88a9417d205d320f0f7f3c80e22d80352a91` |
| `report.json` | `b211bf30b2030635f07c0a129d95bb4da04731f88ae5060122f585c0f641ed64` |
| `upper-contact-sheet.png` | `2481c4b145f16f67b385977a8d016e2dc495d8816025576aac75adf387818de5` |
| `lower-contact-sheet.png` | `0d32c8be3c2c9253db5326ba44c188f4c565ad191bb3a5d213fd38c00e651cbe` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |

Inspected the upper contact sheet and the native still. Native `[0,0,400,28]`
is Wi-Fi bars, the cyan **Internet** pill, `04/10 (Sun) 19 20` (colon hidden)
and an orange charging battery with plug. The body is grey — **no**
“Internet Browser” title. Browser capture is only the painter-drawn title
on the start-menu backdrop. Max 245 at `(375,2)` is native battery black vs
browser grey. Later first-run tutorial and search-engine stills in the same
native folder also show HUD-only uppers.

Recorded empty-mask counts over 2/255 against the **pre-bind** hashed browser
upper (any RGB >2/255):

| Region | Rectangle | Over 2 | Max | At |
| --- | ---: | ---: | ---: | --- |
| Whole upper | `[0,0,400,240]` | **95571** | 245 | `(375,2)` native `(0,0,0)` / browser `(245,245,245)` |
| HUD strip | `[0,0,400,28]` | **10787** | 245 | same battery pixel |
| Official HUD band | `report.screens.upper.regions[1]` `{x:0,y:0,width:400,height:20}` | **7998** | — | rows 0–19 of the strip |
| Body complement | `[0,28,400,240]` | **84784** | 123 | first-run grey vs start-menu wallpaper; not this slice |
| Whole lower | `[0,0,320,240]` | **76728** | — | welcome vs StartDialog; not this slice |

`meanRgbError` 107.91602083333333. Those counts describe the last
coordinator capture, not this painter. This lane has no `@napi-rs/canvas`
module, so it did not raster a post-bind upper LCD. Post-bind HUD
`[0,0,400,28]` awaits coordinator recapture.

## Title-local owner (not `HudMenu_00`, not a source gap)

EUR Internet Browser applet `0004003000009d02`, version 9232, content
index 0 / ID `0000001f` (`0000001f.app`) plus content 1 / `0000001d.app`.
Pinned `exefs/code.bin` SHA-256
`a246a71a86c5b8b41b687a97afb5f8198b9189263abe0f1496d90c6edcfc3993`.
Title `sourceSha256`
`6e299b9acb2afdea864a60d9d9b3a48d60efc66146a87bfc9ed12cee3fc80c95`.
`exefs/code.bin` lists `layout/sysinfo/SystemInfo`, `NetMode`, `NetAntenna`,
`Battery`, `Calendar`, `font/Hud.bcfnt`, `message/.../hud.msbt`,
`lau_connect0` and `lau_title_web`. It does **not** list `hud_LZ.bin` or
`HudMenu_00`. Extracted RomFS has no those files.

Converter **1.3.1** / CTRTool **1.3.0** already emitted private
`layout-sysinfo-*.json` from those arcs. Omission from
`stock-ui-browser.json` was unpublished delivery, not an unconvertible gap.
This slice published the selected subset through `stock_ui.py --additive`
from `browser-converted-english`. Net/Bat/clock are
`REFERENCE_DEVICE_STATUS` plus `deviceStatusBatteryFrame` /
`hudColonVisible` seconds parity, not a screenshot fit.

`SystemInfo` HUD panes default visible (BasePct flags 1, alpha 255).
`SystemInfo_ApltFade` fades `FadeAnim` 255→0 over frames 0–10 and is **not**
started. There is no SceneIn clip. `NetAntenna_NetAtnCnt` is not bound.
Walk/Coin do not exist on this HUD. HOME `packs/home/hud.json` is title
`0004003000009802` and Notifications `packs/notifications/hud.json` is
`000400300000a002`; neither is reused.

Calendar is attached once at `DatePos` (its `Time*Txb` panes already sit at
the authored offset toward `TimePos`). `TimePos` is left empty.

## Centred “Internet Browser” title

`spider/lau_title_web` (“Internet Browser”) remains in the published
message pack. Native first-run, tutorial and search-engine uppers show
only HUD over the backdrop. The start-menu capture’s centred title was a
painter `text()` adapter at `(200,28)`, not a sysinfo or StartDialog pane.
This slice stops drawing it on Browser. Miiverse still draws
`lau_title_olive`. Not a guess: the hashed native still and contact sheet
are the evidence.

## Element → manifest key → dump source

| Element | Manifest / pack | Dump source | Title / version / content | SHA-256 | Converter |
| --- | --- | --- | --- | --- | --- |
| `SystemInfo` | `packs/browser/contents/0000-0000001f/layout-sysinfo-SystemInfo.json` | `RomFS/layout/sysinfo/SystemInfo.arc` / `blyt/SystemInfo.bclyt` | `0004003000009d02` v9232 content 0 / `0000001f` | archive `2c6742768f6829d3b2f857e165872baf5a923ed152edf0dea74bed1f20278bc5`; layout `a07dfc3efb374634ba31c0424bf3f6771611056827c0ff2aca3095aa997d3e79`; `HudBase_00.bclim` `aaaef78fa5e1a428da66c319202f123c8c52eaf798490423f3f9daf3413f843f`; published pack `31e8be409065363b3fa9164d535fb9037f476e3419193614277754d247599ac2` | ctr-native-web **1.3.1** |
| `NetMode` / `NetMode_NetMode` | `…/layout-sysinfo-NetMode.json` | `RomFS/layout/sysinfo/NetMode.arc` | same | archive `6c665eceeade7a3a235a6cbb2676309b4fbd81c378d02a8bec4bca64d0a25536`; layout `4ef7e632c442d8dcc73b5df235fc31c4061914779f1be33122b2ccacca914a25`; clip `620d4db6f137892d74ff313514d3956994796a8c591ce2b506aceeae6943fa1d`; published `b4a4b78af96c9587e9a92aca66733585ec3592d39f3bf72fe96d9b93107c527b` | 1.3.1 |
| `NetAntenna` / `NetAntenna_NetAtn` | `…/layout-sysinfo-NetAntenna.json` | `RomFS/layout/sysinfo/NetAntenna.arc` | same | archive `8f7fc60cde9ed70d901a8e16713fb65d283805faec27047e400bdca53f1c633f`; layout `067675d54c185ea7b63404f9306a1176b9e294c4cc5b7121bae1703ae0b634fe`; clip `b0b1047621f7501ad9502f6243d36aacbf8d78ab8bb36ca38a532403defd7da6`; published `98127575ad68441cb0d03fab17bea971af8b3f9e6c40069e51570821382b6f40` | 1.3.1 |
| `Battery` / `Battery_Bat` | `…/layout-sysinfo-Battery.json` | `RomFS/layout/sysinfo/Battery.arc` | same | archive `97f3c0b0cc9dcc1aa352bc9ca6b10be876427ebc567ed066bf50f0f4fa354a56`; layout `8b060fe5a037dcf83ba892888020b9f12829124ada08a99ec482a79bcbc073ab`; clip `f1a4f627b27e73ed3a002831d5a3d618a98f2a4a5a1aca834e451bbc9dadec47`; `HudBatPlg.bclim` `f8f77ecd9959e7830d30eaeee9abf5caea951e895f92f38bcc41d7afb2c8764c`; published `22d8e358f7e349b1f8a60d190e4297d50e9578287c76229dfa51e4046f4ee219` | 1.3.1 |
| `Calendar` | `…/layout-sysinfo-Calendar.json` | `RomFS/layout/sysinfo/Calendar.arc` | same | archive `f253137dfe5363fa845b0120fd1e637a5e73cd82b1122876b6eab0ebb3317f63`; layout `7ecf140a802c6485b069bee0d10a53d0af05257b7bad875767951c8368a8243d`; published `b136aead3630bd7a3c4d2a601a870b504b805300f8af89a5a9cad34f511311d9` | 1.3.1 |
| `lau_connect0` / `lau_date` / day / month / week | `…/messages-and-loose.json` bank `hud` | `RomFS/message/EU_English/hud.msbt` | same | dump/converter `a8860fb731e1a2065d28809c1184617db7f24f907531333c2bf1b0a4fa3a9c6d`; published merged pack `ea2a15ee805fc80070e3e68f81a9c6a11e3453ce0534041e87ce060c1b52c7e2` | 1.3.1 |
| `Hud.bcfnt` | title `presentationFontBindings` → shared `fonts/hud/font.json` (namespaced `contents/0000-0000001f/Hud.bcfnt`) | `RomFS/font/Hud.bcfnt` | same | dump/shared sourceSha256 `172b12ad40f2feb04d4422ec67dead3b579a4706ca2a6413f652e1f7de026bb8` | existing HUD font delivery; bytes match this title |

`drawNativeWebFrame` still draws `BG` then StartDialog on the lower LCD,
then draws `SystemInfo` last on the upper with attachments: NetAtn 3,
NetMode 0, Calendar date/time from `options.date`, Bat via
`browserHudBatteryFrame`. Additive publish also writes the namespaced
`Hud.bcfnt` key so `loadNativeTitleAssets` can resolve Calendar’s font.

## Remaining residual

O-04 remaining upper HUD `[0,0,400,28]` **10,787** on the reused capture
is the unbound title-local HUD in that still, now bound in source.
Whole upper **95,571** and lower **76,728** remain fail on that pair
because native is first-run welcome and the browser capture is start-menu.
Post-bind pixel count is not established here. The hashed odd-second still
shows a charging plug (even Bat 5 on this atlas) with a hidden colon
(odd); recapture at an even second is needed before judging Bat leftover,
as with Notifications. Input, motion and audio remain open. Not 1:1.

Coordinator recapture: scenario **`browser-start-menu-local`** with
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/native-new-apps-captures-20261004/browser-start-menu-local/capture-browser.mjs`.
Prefer a native start-menu still if first-run can be dismissed; the HUD
strip is still comparable on the current first-run native.

## Checks

Focused `tests/browser-hud.test.mjs` **3/3**. `npm test` 2042 pass /
36 fail / 23 skip / 1 todo (2102); the 36 fails are sparse-checkout
`model/` / GLB ENOENT, unchanged from this worktree. `npm run typecheck`
passes. `python3 -B -m unittest tests.test_stock_ui` 15/15. `npm run build`
fails here because Turbopack rejects the external `node_modules` symlink
(same sparse restriction as prior stock workers). `git diff --check`
clean. This lane did not drive Azahar or preview 3021 and did not recapture.
