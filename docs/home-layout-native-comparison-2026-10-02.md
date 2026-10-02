# HOME Layout Native Comparison

Runtime `72fa186556347d28d66900c262ca523b02940cab`, preceded by
`dd36b65966c524ebec63e4f90ca8b84ca68276f3`. Both commits correct captured
Save/Load defects; the whole scenario remains **fail**.

## Native Route

Private root `R` is
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001`.
The closed `R/native-home-design-20261002` profile was reused, not reseeded.
Executable SHA-256 was verified as
`3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`;
no user-directory symlinks; custom storage disabled, original hardware, EUR,
English, native resolution, adjacent isolated NAND/SD and volume zero.
`lsof` verified the running executable and working directory under this clone.
The default profile and original firmware were not edited.

`R/home-layout-native/open.ctm` SHA-256
`4ab19567c7d46e9d07380957e31b0ba89e61496e9c59d522c486326c7e98f799`
touches `(24,16)` at samples7020..7028 and `(152,160)` at14040..14048.
These are nominal eight-sample holds at234Hz, not measured wall-clock events.
Launch config hash is
`7dc994b778dac91aca733685a27b71f6a2e842a056e399c0559401d65590d798`.
Live observations establish Settings then Save/Load entry. A first-use
preparation dialog appeared in the window screenshot; no own-PNG capture of
that transient dialog is claimed. It is currently absent from the browser.

Azahar's own settled400x480 PNG is
`R/native-home-design-20261002/screenshots/_02.10.26_03.58.19.492.png`, SHA-256
`d262653d618024448e64cc5d4d8450b7e56f70792dcb46c8f1de0a640c372691`.
It shows grey paired LCD plates in all eight empty slots, no Delete tab and
an actual current-layout preview. Normal Quit exited0 before movie EOF.

Fresh Sidecar bounds were1800,367,1357,935; native1810,397,1153,781 and
Chrome1810,397,1150,780, with startup/Quit dialogs on Sidecar. Both stayed
muted. Native used Vulkan; browser errors were empty. All owned GUI processes
closed. The production preview remains at `http://127.0.0.1:3020/`.

## Corrections

The old painter hid the entire `Thumb_00` group, incorrectly treating native
empty-slot artwork as sample screenshots. `dd36b659` restores the original
`Thumb_U_00`/`Thumb_D_00` grey plates for empty slots. Occupied slots still hide
unavailable saved previews; no fake screenshot is substituted.

`72fa1865` uses the source `BtnOut2` settled frame10 for an empty selection,
instead of always showing Delete with `BtnIn2`. Saved selection retains Delete.
The captured static pose supports this binding, not the native transition epoch.
Tests assert native plate texture identity, eight mounts, saved/empty visibility,
source failure behavior and unchanged source packs. No converter/assets changed.

All resources map through manifest `home.MyMenu`, HOME `0004003000009802`
v24576, content0/`00000082`, converter `ctr-native-web`1.2.0. CIA-internal paths
below are relative to `romfs/MyMenu_LZ.bin/` after decompression:

| Element | Member | SHA-256 |
| --- | --- | --- |
| Empty LCD plates/mounts | `blyt/MyMenuBtn_D_00.bclyt` | `dddbb754ef0491af58a0622fb0c3e57feaaeb3a6363d07e13d6f81d628e5e549` |
| Plate texture | `timg/PlateGray.bclim` | `9de94e6c5cedcad32c66ed8ae315bb9d95ca5482b67d77b688cc791a6d5c00b5` |
| Empty slot pose | `anim/MyMenuBtn_D_00_Invalid.bclan` | `b14970c17b424e0bd584154ba94f9eb70d5d4ec1e1d7d85976c6942097643036` |
| Hidden Delete | `anim/MyMenuBtmBtn_D_00_BtnOut2.bclan` | `568ec7c660f5bcb79787ed42dae99829c0452883c7eb1ffc84edb51893f71d2a` |

## Comparison

`R/home-layout-native/summary.json` SHA-256
`a7101adb7607c71147cd948f93d43cbe280193a1cf586cad3a051457c981eda9`
records captures, inputs, configs, reports, sheets and full inherited source
provenance. Browser scenarios are under
`R/home-design-lower/reference/scenario-matrix/v1/captures/`.
Both requested logical touches use a homography from four renderer-published
targets, rounded to viewport pixels. Actual cadence, initial selection and
population differ from native; this is not exact input acceptance.

The first comparison accidentally retained an occupied browser slot from prior
testing (report `compare-layouts`,21259/41049). It is preserved separately.
The controlled empty-slot comparisons use the fresh localhost origin:

| Browser scenario suffix | Report in `R/home-layout-native/` | Upper/lower pixels >2 |
| --- | --- | --- |
| `layouts-native-replay-20261002-empty-before` | `compare-empty-before` | 21259 / 36454 |
| `layouts-native-replay-20261002-empty-after` | `compare-empty-after` | 21259 / 5631 |
| `layouts-native-replay-20261002-empty-final` | `compare-empty-final` | 21259 / 4115 |

All use the empty mask SHA-256
`dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`;
both final sheets and before/after lower sheets were inspected. Final lower
mean RGB error2.21331163, maximum102. Upper remains unchanged. No historical
matrix entry was modified or promoted.

Browser-only regression: X saved empty slot0, Delete appeared, and other empty
slots retained grey plates (`layouts-saved-regression-final`). Escape returned
to Settings then HOME; mute stayed true. Full **1644 pass,0 fail,23 skip,1 TODO**;
typecheck/build pass. No shader/material changes.

Remaining: current/saved LCD previews, first-use preparation presentation,
footer half-width shading/separators, cursor/transition phase, exact input and
audio. The earlier local persistence, disabled Zoom, source-dialog assembly,
bounded Settings scrolling/mask fit, authored Theme/close-switch, portfolio
population and offline adaptations remain as documented in the
[integration record](home-settings-integration-2026-10-02.md). No1:1 claim.

## Current Preview Follow Up

Runtime `18bc33c0` removes the incorrect local footer mirror. `6c24da03`
adds current-layout paired LCD preview; `5232b9c5` fixes its dynamic sampler
bindings and adds native wallpaper readiness checks. The first preview commit
alone displayed grey panes and is not the final delivery. The manager reuses
native `MyMenu_U_00` / `MyMenuBtn_D_00` mounts, shadow and MyMenuIn pose with
validated 400x240/320x240 input. Screen composition caches one current pair,
invalidates it on layout/context changes and clears it on leave/dispose.
Saved-slot images remain missing; Zoom stays disabled.

Source mapping remains `home.MyMenu`, HOME `0004003000009802` v24576,
content0/`00000082`, `romfs/MyMenu_LZ.bin`, converter `ctr-native-web`1.2.0.
No source asset changed. Existing source records above and private `summary.json`
remain authoritative. Preview sampling/freeze epoch is an adaptation, not a
proved native screenshot writer. Key resource hashes:

| Resource inside archive | SHA-256 |
| --- | --- |
| `blyt/MyMenu_U_00.bclyt` | `8f70b2b8d654c27ec1f49bd3f1bca22c01f6c909b9effcf18314151d3176f0c8` |
| `blyt/MyMenuBtn_D_00.bclyt` | `dddbb754ef0491af58a0622fb0c3e57feaaeb3a6363d07e13d6f81d628e5e549` |
| `anim/MyMenuBtn_D_00_MyMenuIn.bclan` | `971a9e11eaba62a99c6e7a460ae5e4f33b4639a3f9075ae074ed8c5d1ea02aba` |

Final browser pair:
`R/home-design-lower/reference/scenario-matrix/v1/captures/layouts-native-replay-20261002-current-preview-final/browser/`.
Upper SHA `6b9f721a5d85d6b07481a870a8040e06ccce56bb16d54817cc475c9aa303b7fa`;
lower SHA `e137e183abb9bf16ff1fe679a3ad5c732f9c198cb8ecec50ee9f628126b68911`.
Fresh own 400x480 native capture is
`R/native-home-design-20261002/screenshots/_02.10.26_04.15.48.166.png`,
SHA `5427e5501f212306cc6a9a94f7d7bc6559c176639b8269fdc7e9d0cb7db117a6`.

| Report under `R/home-layout-native/` | Upper/lower >2 | Report SHA-256 |
| --- | --- | --- |
| `compare-footer-source/report.json` | 21259 / 1122 | Per-file hashes retained by report |
| `compare-current-preview-final/report.json` (retained native) | 7899 / 1122 | `2cd902bad2a30dcedddf1fc11c1da04cb553a4e7459362ecf1863585ff4f568b` |
| `compare-current-preview-fresh/report.json` (fresh native) | 8383 / 1217 | `7463b4f1dd2aea47d33e3ac3d38254d1573ab481d3bfde1055c4048ebad75a33` |

All use the same empty mask above. Both fresh contact sheets and retained
final upper sheet were inspected; lower final pixels match the inspected
footer correction. HUD, population/density, text and cursor/footer residuals
remain. CTM logical touches match the requested browser coordinates but holds,
epoch and initial population do not: these remain diagnostics, not acceptance.
The intermediate `compare-current-preview` report preserves the grey-pane bug.

Browser save-slot0/Delete visibility and Escape to Settings/HOME were inspected
with mute true; raw saved state is `layouts-save-current-preview-final/browser/`.
Full **1648 pass / 0 fail / 23 skip / 1 TODO**, focused45/45, typecheck/build pass.
No shader change. Historical matrix unchanged.

The user reported interference with Spotify despite volume0. With isolated
Azahar closed, its input/output were both changed from Auto to Null (`1`);
volume remains0. Fresh native log confirms both values1 and no Cubeb stream
start. This changes only the isolated clone, not system or Spotify audio.
Launch snapshot `preview-null-audio.launch.ini` SHA
`be004271552b398fa23fbf4b8dd5d04a74459728af64b5532b8d62a69688f35d`;
log preserved as `preview-native-final.log`. Native exited normally; browser
closed through CDP. The preview server remains on3021. All visible work used
verified Sidecar bounds; audio acceptance remains open.

Further Settings/layout polish is deferred per the user. Next work is the
[ordered close/switch, power-on and HOME interaction queue](feature-map/design-to-ship.md).
Remaining adaptations: local layout persistence, preview sampling, generic
source-dialog assembly, Settings mask/scroll fit, authored Theme/close-switch,
portfolio population and offline content. Saved previews/Zoom, first-use
preparation, later Settings rows and strict native input/motion/audio remain open.
