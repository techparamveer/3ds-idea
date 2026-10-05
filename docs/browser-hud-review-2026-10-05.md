# Independent review — Browser title-local sysinfo HUD — 5 October 2026

Grok 4.6 `browser-hud-review-20261005-r2` on
`/Users/paramveer/.codex/worktrees/browser-hud-review-20261005`
(`codex/browser-hud-review-20261005`). Cherry-pick of worker `01d9f79a`
(`codex/browser-hud-20261004`) onto leftover-queue `cccf162e`. r1 on this
worktree ended provider-failed with no commit. Different model from the
4 October HUD worker. Docs and tests only. No Azahar, production `:3000`,
preview 3021, or CDP. Not integrated into fidelity.

**Verdict: APPROVE-WITH-NITS** of `01d9f79a`.

The HUD owner is title-local `layout/sysinfo`, not HOME/Notifications
`HudMenu_00` and not a source-gap. Frozen HUD `[0,0,400,28]` **10787**
stays the pre-bind count until coordinator recapture. This is not 1:1.
Tests and this note do not close pixels, input, motion, or audio.

## Assigned leftover

Queue rank 5 ([leftover-queue](feature-map/leftover-queue-2026-10-05.md)):
review and integrate HUD `01d9f79a`. Pair HUD scores **10787**. Worker
note: [Browser HUD](browser-hud-2026-10-04.md).

## Pair (reused, not recaptured)

Empty mask `dc4b320b…`. Threshold any RGB channel >2/255. Native 400×480
`_04.10.26_19.20.59.347.png`. Official upper crop `(0,0,400,240)`.

| Item | SHA-256 |
| --- | --- |
| Native `_04.10.26_19.20.59.347.png` | `4bfffefeee3ee291e478e7c8db39d5d31ce1293478acfcbc138caf2561c6e80a` |
| Browser upper (pre-bind) | `8fef95ac4a7f2f7330cdbc108d2c7101670d1e6b58268f6894be03d2e54effb2` |
| Browser lower | `a2b12cde2e886b2de7ad09b208ad88a9417d205d320f0f7f3c80e22d80352a91` |
| `report.json` | `b211bf30b2030635f07c0a129d95bb4da04731f88ae5060122f585c0f641ed64` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |

Recounted the hashed pair: whole upper **95571**, HUD `[0,0,400,28]`
**10787** max 245 at `(375,2)` native `(0,0,0)` / browser `(245,245,245)`,
official band 20 **7998**, body **84784**, lower **76728**. Native body is
first-run grey; browser capture is start-menu. HUD strip is still
comparable.

## Dump identity

EUR Internet Browser `0004003000009d02` v9232, content 0 / `0000001f`.
Private `exefs/code.bin` SHA-256
`a246a71a86c5b8b41b687a97afb5f8198b9189263abe0f1496d90c6edcfc3993`.
Title `sourceSha256`
`6e299b9acb2afdea864a60d9d9b3a48d60efc66146a87bfc9ed12cee3fc80c95`.
Converter **1.3.1** / CTRTool **1.3.0**. LZ10+DARC members decoded with
`scripts/unpack_home_resources.py` + `scripts/firmware/texture.py`.

`code.bin` has `layout/sysinfo/SystemInfo`, `NetAntenna`, `NetMode`,
`Calendar`, `Battery`. It does **not** contain `hud_LZ.bin` or
`HudMenu_00`. Extracted RomFS has no those files. HOME `packs/home/hud.json`
is title `0004003000009802` and is not reused.

| Element | Manifest / pack | Dump source | SHA-256 |
| --- | --- | --- | --- |
| `SystemInfo` | `packs/browser/contents/0000-0000001f/layout-sysinfo-SystemInfo.json` | `RomFS/layout/sysinfo/SystemInfo.arc` / `blyt/SystemInfo.bclyt` | archive `2c6742768f6829d3b2f857e165872baf5a923ed152edf0dea74bed1f20278bc5`; layout `a07dfc3efb374634ba31c0424bf3f6771611056827c0ff2aca3095aa997d3e79`; published pack `31e8be409065363b3fa9164d535fb9037f476e3419193614277754d247599ac2` |
| `HudBase_00.bclim` | same pack | `timg/HudBase_00.bclim` | BCLIM `aaaef78fa5e1a428da66c319202f123c8c52eaf798490423f3f9daf3413f843f`; decoded LA4 8×8 PNG `82e0c5fdb42d3c9d37f1d16614983b1d7559cc228f7deb0cf41228d5d0f06013` |
| `CountBarBase_00.bclim` | same pack | `timg/CountBarBase_00.bclim` | BCLIM `3eef02a1a564137157cb81816811826037189e30165e9b69f68b91e0f4a33663`; decoded LA8 6×6 PNG `bd32c2086543e59ab3adad207b5e91ff5b71da223d38bfea58b458da89ef9970` |
| `NetMode` | `…/layout-sysinfo-NetMode.json` | `NetMode.arc` / `blyt/NetMode.bclyt` | archive `6c665eceeade7a3a235a6cbb2676309b4fbd81c378d02a8bec4bca64d0a25536`; layout `4ef7e632c442d8dcc73b5df235fc31c4061914779f1be33122b2ccacca914a25`; clip `620d4db6f137892d74ff313514d3956994796a8c591ce2b506aceeae6943fa1d` |
| `NetAntenna` | `…/layout-sysinfo-NetAntenna.json` | `NetAntenna.arc` / `blyt/NetAntenna.bclyt` | archive `8f7fc60cde9ed70d901a8e16713fb65d283805faec27047e400bdca53f1c633f`; layout `067675d54c185ea7b63404f9306a1176b9e294c4cc5b7121bae1703ae0b634fe`; `NetAtn` clip `b0b1047621f7501ad9502f6243d36aacbf8d78ab8bb36ca38a532403defd7da6` |
| `Battery` | `…/layout-sysinfo-Battery.json` | `Battery.arc` / `blyt/Battery.bclyt` | archive `97f3c0b0cc9dcc1aa352bc9ca6b10be876427ebc567ed066bf50f0f4fa354a56`; layout `8b060fe5a037dcf83ba892888020b9f12829124ada08a99ec482a79bcbc073ab`; `Battery_Bat` `f1a4f627b27e73ed3a002831d5a3d618a98f2a4a5a1aca834e451bbc9dadec47` |
| `HudBatPlg.bclim` | same pack | `timg/HudBatPlg.bclim` | BCLIM `f8f77ecd9959e7830d30eaeee9abf5caea951e895f92f38bcc41d7afb2c8764c`; decoded A4 19×10 PNG `d029fb25fe241bbb35b72d389d40f4c68fd96767a0414339e9ca5c2e4f6342d4` |
| `HudBatLgt_00.bclim` | same pack | `timg/HudBatLgt_00.bclim` | BCLIM `7b3108b54e1b0dfc119b28cc278606c4c7dd07ba5cb0e2050bdd6b97be980657`; decoded A8 8×10 PNG `f8ba69abadda6be72e6e0af58f2348714e7712ce89eab43409763d1b007c175b` |
| `Calendar` | `…/layout-sysinfo-Calendar.json` | `Calendar.arc` / `blyt/Calendar.bclyt` | archive `f253137dfe5363fa845b0120fd1e637a5e73cd82b1122876b6eab0ebb3317f63`; layout `7ecf140a802c6485b069bee0d10a53d0af05257b7bad875767951c8368a8243d` |
| `hud.msbt` | `…/messages-and-loose.json` bank `hud` | `RomFS/message/EU_English/hud.msbt` | dump `a8860fb731e1a2065d28809c1184617db7f24f907531333c2bf1b0a4fa3a9c6d`; published `ea2a15ee805fc80070e3e68f81a9c6a11e3453ce0534041e87ce060c1b52c7e2` |
| `Hud.bcfnt` | title `fonts['Hud.bcfnt']` and `fonts['contents/0000-0000001f/Hud.bcfnt']` → `fonts/hud/font.json` | `RomFS/font/Hud.bcfnt` | dump `172b12ad40f2feb04d4422ec67dead3b579a4706ca2a6413f652e1f7de026bb8` |

Decoded published PNGs match dump BCLIM bytes. `loadNativeTitleAssets`
resolves `contents/{index}-{id}/Hud.bcfnt`; additive `stock_ui.py` now
binds both the leaf and that namespaced key.

## Bind that is correct

`SystemInfo` canvas is **400×480**. Default center `[200,240]` matches
upper `BG`. Attachment cancel uses that parent size, so children pass
`[200,240]` rather than their own `[200,120]`. `NetAtnPos` / `DatePos` /
`ButPos` then land at LCD `(0,0)` / `(218,0)` / `(368,0)`.

Hashed native HUD matches those panes: Wi-Fi bbox `(0,2)–(23,19)`;
Internet pill cyan, dump `NetMode_NetMode` frame 0 `materialColor.1`
`(90,195,245)` equals native `(90,195,245)` at `(50,8)`; date bbox
`(218,3)–(309,19)`; TimeL `(317,3)–(336,19)`; TimeR `(343,3)–(362,19)`;
battery outline `(368,0)–(400,20)` with black at `(375,2)`.

`code.bin` lists `DatePos` plus `DateTxb` / `TimeLTxb` / `TimeCTxb` /
`TimeRTxb`. It does **not** list `TimePos`. One Calendar instance at
`DatePos` is the dump attachment; Time* panes already sit at the authored
offset (~+99). `TimePos` empty is correct.

`BasePct` is 400×28, flags 1, alpha 255. `FadeAnim` default alpha 255.
`SystemInfo_ApltFade` (dump `anim/SystemInfo_ApltFade.bclan`) fades that
pane 255→0 over frames 0–10 and is not started. There is no SceneIn.
Walk/Coin layouts do not exist on this title.

`lau_title_web` stays in the spider bank. Native first-run, tutorial, and
search-engine stills in the same folder are HUD-over-backdrop with no
centred **Internet Browser** title. Dropping the painter `text()` adapter
is dump-and-still backed. Miiverse still draws `lau_title_olive`.

`NetAntenna_NetAtnCnt` is a 240-frame connecting loop on
`HudNetAtnCnt_00`. Idle uses `NetAntenna_NetAtn` at
`REFERENCE_DEVICE_STATUS.netAtnFrame` 3, same as eShop welcome (Cnt not
played).

Decoded `CountBarBase_00` LA8 rows `(232,232,232)` / `(250,250,250,α253)`
are `BarBasePict` (400×6, flags 1). Native HUD y=19 is `(236,236,236)`
and y=22 is `(248,248,248)`. The pane is dump-visible, not Walk/Coin.

## Nits (not a wrong HUD owner)

1. **Bat seconds map is untraced on this title.** Worker copies HOME
   `0x27c6a8` / Notifications `0x181018` (`odd→4` lightning, `even→5`
   plug). Dump `Battery_Bat` CLTP puts `HudBatLgt_00` (A8 8×10) on frame 4
   and `HudBatPlg` (A4 19×10) on frame 5; posed maps match the tests.
   Browser `code.bin` was not shown to write those floats (one `5.0`
   literal in the whole binary). Hashed odd still `19:20:59` shows the
   19×10 plug and left prongs; sibling odd still `19:28:53` shows a
   lightning overlay on the same orange fill. Recapture with injected
   even/odd seconds is required before judging Bat leftover. Do not invert
   to Sound.
2. Dump `NetAntenna_NetAtnCnt` and `SystemInfo_ApltFade` exist and
   `code.bin` names `NetAtnCnt` / `ApltFade`. They are unpublished. Idle
   correctly does not start them (ApltFade frame 0 is 255).
3. Worker note omits `BarBasePict` / `CountBarBase_00`. The texture is
   published because `SystemInfo` selects it. Native y=19/22 match the
   decode.
4. Pair states still differ (first-run vs start-menu). HUD strip is the
   slice. No post-bind LCD raster here (`@napi-rs/canvas` absent).

## HUD count prediction

Frozen pair stays upper **95571** / HUD **10787** / lower **76728** until
coordinator recapture (`capture-browser.mjs`). After integrate, the HUD
strip should fall well below **10787** (Wi-Fi, Internet, date, HudBase,
CountBar, battery outline now have dump owners). Remaining HUD is not
predicted as 0: Bat 4/5 phase is untraced, and the body/lower scene
mismatch is outside this slice. Prefer a native start-menu still. Not 1:1.

## Evidence

| Tier | Result |
| --- | --- |
| Source-identified | `code.bin` sysinfo paths; no `hud_LZ.bin` / `HudMenu_00` / `TimePos`; decoded BCLIM PNGs match published |
| Delivered | Converter 1.3.1 packs + namespaced `Hud.bcfnt` |
| Implemented | `drawNativeWebFrame` SystemInfo attachments; no painter `lau_title_web` on Browser |
| Tested | `tests/browser-hud.test.mjs` 3/3; `tests.test_stock_ui` 15/15; typecheck 0; `npm test` 2125 pass / 36 fail (`model/` ENOENT) / 23 skip / 1 todo |
| Browser-inspected | Not run |
| Native-compared | Frozen pair reused. Not recaptured. Not 1:1 |

## Checks

`node --test tests/browser-hud.test.mjs` **3/3**. `python3 -B -m unittest
tests.test_stock_ui` **15/15**. `npm run typecheck` passes. `npm test`
2125 pass / 36 fail / 23 skip / 1 todo (2185); the 36 fails are sparse
`model/` / GLB ENOENT. `git diff --check` clean. This lane did not drive
Azahar or preview 3021 and did not recapture.
