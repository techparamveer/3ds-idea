# Shared text-layout 1-pixel vertical origin — float32 half-block ceil — 4 October 2026

Fidelity worker on `codex/text-y-offset-20261004` from HOME fidelity `06ccce8e`.
Sparse worktree; `node_modules` linked from HOME fidelity. No `model/`.
No Azahar. No preview 3021. No CDP 9320. No recapture. No CSS, font, mip,
sampler, snap, colour, lcd or `azahar-12p4-fit`. Pane translations stay
untouched. This is a shared `drawNative` origin rule, not a per-pane fudge.

This is not a 1:1 claim. Tests and this note do not close pixels, input,
motion or audio. Coordinator recapture remains the acceptance gate.

[Notifications upper body 2892](notifications-upper-body-2026-10-04.md)
(`a74c6fa5`) recorded that already-bound `NewsUnread_U_00` card glyphs sit
one pixel off native and that every official body box goes to 0 if
`native[y]` is compared with `browser[y−1]`. That leftover is this
renderer case, not a missing clip.

## Pair (reused, not recaptured)

Native 400×480 PNG
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/native-reference/screenshots/_27.09.26_13.16.53.105.png`
(same bytes as isolated Vulkan `_27.09.26_13.16.53.105.png`).
Matched-clock browser upper
`.../notifications-hud-recapture-matched-clock-20261004/browser/upper.png`.
Lower of the unread-dot pair (HUD bind did not change it).
Empty mask. Threshold any RGB channel >2/255.

| Item | SHA-256 |
| --- | --- |
| Native `_27.09.26_13.16.53.105.png` | `58fff71424e1301e6ead6d7ef9281689faa368bf0e6403dc6dccaef1f9afa389` |
| Matched-clock browser upper | `e08ad93a64d49d2acf783dd8a89c816452c4abc996206a85398a691e357812bc` |
| Pre-HUD-bind browser upper | `78ff0a5ac9db09ebcb85799d23292a5c26f698c414851d46738e79dc51a16d02` |
| Browser lower | `bf5909e54fd845b38d25fe8168134077327e269e1e3e8f8b93333fdaaad403ce` |
| `report.json` (unread-dot `f073581`) | `f952d5acd2b355479689c4b3ab4eea37e20049f20bc58da9fb2402eb96e78cc6` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |

Body complement `[0,28,400,240]` is **2892** on both browser uppers (HUD bind
did not move the cards). Official 97 `report.screens.upper.regions` with
`y≥28` still sum to **2892** and all go to **0** at sampling `dy = −1`.
A whole-body `dy = −1` is **29197** because card chrome must stay put.

## Rule

NintendoWare writer setup `0x1a3e24` maps `floor(alignment/3) === 1` to
vertical-centre flag `0x100`. `0x2ffc90` then places that origin at

```text
y0 = paneHeight / 2 − ceil(float32(blockHeight × 0.5f))
```

The generic `drawNative` path (lineAlignment 2, or any middle alignment that
is not the single-line 0x100/0x111 writer) used float64 `ceil(blockHeight/2)`.
The `glyphScaleSpans` early-return used the same float64 ceil. When an MSBT
`fontScale` leaves `size[1]` one ulp above an integer, that ceil jumps a whole
pixel. Writer `0x111` and the direct 0x100/0x111 single-line quads already
used float32 ceil.

Notifications English styles 104–107 are `fontScale [0.6000000238418579,
0.6000000238418579]` on shared `cbf_std` (`height` 30 / `lineFeed` 30 /
`ascent` 25 / `baseline` 25, they cancel). `nativeTextMetrics` therefore
supplies `size[1] = 18.000000715255737`. Two-line `SpotPass\nNotifications`
has `blockHeight = 36.000001430511475`; float64 `ceil(half) = 19`, native
float32 `ceil(half) = 18`. On the 36-pixel card pane that is `y0 = −1`
versus `y0 = 0`. Single-line `Unread: %d` on the 18-pixel pane is the same
one-pixel jump (`ceil(9.000000357) = 10` versus `9`).

Pane origin 7 (bottom-centre) is coincident, not causal: it only places the
pane. `T_Unread_00` in the already-zero balloon crop is origin 1 /
lineAlignment 1 / style `0.75` (`size[1] = 22.5` exact) and does not jump.
Top alignment (`alignment % 9 < 3`) and bottom alignment
(`floor(alignment/3) === 2`) do not take this ceil.

`nativeCenteredBlockY` now matches `0x2ffc90` on both generic middle placement
and the `glyphScaleSpans` early-return. Horizontal line centering is unchanged
(`width/2 − ceil(runWidth/2)`). Direct lcd / `lcd-source-size` /
`azahar-12p4-fit` stay off for these panes. No existing pixel-pinning
expectation moved: Settings 0.7, Camera 0.84, Close 0.7, list exact-18 and
Power spacer sizes are not the ulp-above-integer case.

## dy −1 survey (before the src change)

Sampling is `native[x, y]` versus `browser[x + dx, y + dy]`. Counts are
pixels with any RGB channel delta >2/255.

| Cluster | Pane | origin / align / lineA | Clears at dy −1? |
| --- | --- | --- | --- |
| Notifications official body 97 boxes **2892** | `T_News_00` / `T_Cnt_00` / unread counts | 7 / 4 / 2, style 0.6 | **yes** (0). Whole-body dy −1 is 29197 (chrome). |
| Notifications Close glyphs `[125,216,195,234]` **521** | `T_EndF_00` origin 1 / align 4 / lineA 1; `T_EndB_00` lineA 0 | style 0.7, pane 21×21, ceil already 11 | **no** (1014). dy +1 is 929. |
| Notifications list `[0,0,291,210]` **820** | `T_NewsTitleF_00` origin 0 / align 3 / lineA 2 | painter sets `text` only, `size[1] = 18` exact | **no** (23972) |
| Camera Welcome p3/p4 interior **1079 / 692** | `TxtDlg` origin 4 / align 4 / lineA 2 | style 83 `fontScale` 0.84, ceil already matches | **no** (12460 / 9905) |
| Sound title `[0,3,400,30]` **1774** | `TitlTxt` origin 3 / align 3 / lineA 2 | painter drops style; pane height 23 / size 24 | **no** (3188) |

Only the Notifications card panes share the faulty ceil. Close, list AA,
Camera TxtDlg and Sound title stay labelled leftovers.

## Element → manifest key → dump source

EUR Notifications applet `000400300000a002`, version 4097, content
index 0 / ID `00000012`. Pinned `exefs/code.bin` SHA-256
`b3993f1e4fe5ed7e5760f0f4c3926c95b42ea8de53c25bb95864499342e5b228`,
image base `0x100000`. Title RomFS SHA-256
`edbe3dec63e8ac70a033df4216baafe27d94e4ee11ea9407d88567a1ed5190ae`.

| Element | Manifest / pack | Dump source | Title / version / content | SHA-256 | Converter |
| --- | --- | --- | --- | --- | --- |
| `NewsUnread_U_00` | `packs/notifications/news.json` | `news_LZ.bin/blyt/NewsUnread_U_00.bclyt` | `000400300000a002` v4097 content 0 / `00000012` | layout `0362c72dc421800a3e91647bc04800810ae35a589be4f92cbc4e8a478cb0751d`; news pack `9f6e27e61012dfa0cb31a78eaa4646d0f7abf019811e67d76aadafb9159aa375`; archive `4b4e5bd8b63d0c8859ba10e3daa4ac819b53e0f16ca3e9d4a401c0cdeb819366` | ctr-native-web **1.3.1** |
| `T_News_00` / `T_Cnt_00` / unread counts | same layout, styles 104–107 | `RomFS/message/EU_English/RI_mstl_LZ.bin` | same | dump LZ `bd8b581be5f49d28cbf81321595c1451e6634e701563696d1e41aa4fc20bcf03`; converter `23833acc620efbf4f5119ce7c0dace5ac68e9055f79eb54cc3489c60b6d65834` | 1.3.1 |
| `new_news_u1` / `new_ce_u1` | `packs/notifications/messages-and-loose.json` | `RomFS/message/EU_English/newslist_msbt_LZ.bin` | same | dump LZ `cd9261dd122c66ff8feaddc68f2bd5f8e199ebb90feb7067976fa34fa0966652`; converter `72d4794bb526ae90bb7d06e99a039ea1701044dad3b850983217a8a63b2cbb62` | 1.3.1 |
| `cbf_std.bcfnt` | `fonts/shared/font.json` | existing verified shared face | n/a | `95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581`; height/lineFeed 30; ascent/baseline 25 | existing |

This lane has no `@napi-rs/canvas`, so it did not raster a new browser LCD.
Before = **2892** on the hashed body; after awaits coordinator recapture. Unit
tests pin `y0 = 0` for the 0.6 card panes (was −1).

## Remaining

C-NTF-01 upper body **2892** is a renderer origin that now matches `0x2ffc90`
in source. Whole-LCD acceptance still fails on this pair (HUD battery 182,
lower scrollbar 2479, Close 577, list 820). Input, motion and audio remain
open. Not 1:1.

## Coordinator recapture

After integrating this src change, reuse the hashed native and empty mask.
Drive notifications-list-unread-dot through

```sh
node /Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/notifications-hud-recapture-matched-clock-20261004/capture-notifications-hud.mjs
```

then

```sh
node scripts/native-compare/compare.mjs \
  --native /Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/native-reference/screenshots/_27.09.26_13.16.53.105.png \
  --browser /absolute/path/to/new-browser-lcds \
  --mask scripts/native-compare/empty-mask.json \
  --out /absolute/artifact/output/directory \
  --scenario notifications-list-unread-dot \
  --commit FULL_GIT_SHA
```

Expected body movement: official 97 boxes **2892 → 0** if the live painter
matches the unit-tested `y0`. HUD `[0,0,400,28]`, lower scrollbar, Close and
list must be recounted but are not this rule. Camera Welcome p3/p4, Sound
title, and Settings Other pages should not move; rerun only if a later
generic middle-align 0.6-scale pane is in that still.

Optional source-render (not acceptance):
`scripts/verify-native-personal-tools.mjs --title notifications-list`
with `--artifact-dir`, `--asset-root`, `--canvas-module` and
`--interface-root`. This lane could not run it (`@napi-rs/canvas` absent).

## Checks

Focused `tests/text-y-offset.test.mjs` 4/4. Related `bitmap-font`,
`home-software-dialog`, `native-renderer` and `notifications-upper-body`
tests 74/74. Full `npm test`: 2008 pass / 36 fail / 23 skip / 1 TODO; every
failure is sparse `ENOENT` on `model/` GLBs (`source-*.test.mjs`,
`sourced-rig`, compact-contact, model-layout anchors). No pixel-pinning
expectation changed. `npm run typecheck` passed. `npm run build` failed:
Turbopack `node_modules` symlink points out of the filesystem root. `git
diff --check` is recorded in the handoff. This lane did not drive Azahar
or preview 3021 and did not recapture.
