# HOME applet footer correction - 1 October 2026

Runtime commit `e1de13e13765f8d2c7082b1c73b9cf52a34d7e59`, branch
`codex/home-fidelity-20261001`, worktree
`/Users/paramveer/.codex/worktrees/3ds-home-fidelity-20261001`.
Continues the [toolbar mapping comparison](home-toolbar-banner-mapping-2026-10-01.md).

## Change and source

The native Notes and Friend captures have a full-width Open button. Browser
`getHomeFooter` still read the retained grid tile when the toolbar was focused,
so it painted a blank left segment and right-aligned Open. Focuses 1 through 5
now select the existing single-button native layout. The footer touch route
likewise opens the focused applet before considering the retained grid tile's
Manual, folder-close or software-close actions. Grid/folder behavior is unchanged.

This is a capture-backed selection correction using existing decoded resources,
not a new geometry or font fit. Native executable footer activation/timing is
not established by this change. A test covers all five applets, occupied,
Settings and empty retained slots, a suspended-software flag, three footer X
positions, and both one-shot and down/up touch entrypoints.

Element mapping: HOME title `0004003000009802`, version 24576, content index 0
(`00000082`), EUR 10.7.0-32E English; manifest `home.launcher` maps to
`packs/home/launcher.json`, layout `LncBtmBtn_02`, single pane `N_BtnW_C_01`,
and existing `SceneIn`/`Select` bindings. CIA-internal source is
`romfs/launcher_LZ.bin`, containing `blyt/LncBtmBtn_02.bclyt` and its animation
resources. Source SHA-256
`826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`;
delivered pack SHA-256
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.
Converter is existing `ctr-native-web` 1.2.0 / CTRTool 1.3.0. Open continues
using the existing `menu_msbt_LZ/lau_2b_folder_open` message and source font.
No source resource or converter changed.

## Captures and measurements

Private root `R` remains
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001`.
All comparisons use Azahar's own 400x480 PNG, raw browser 400x240/320x240
targets, the same empty mask as the preceding record, and >2/255 threshold.
Native lower crop is `(40,240,320,240)`. All listed upper/lower contact sheets
were opened and inspected. Every whole scenario remains **fail**.

| Pair/report directory under `R/comparisons/` | Native screenshot under `R/native-reference/screenshots/` | Browser scenario | Upper / lower residual |
| --- | --- | --- | --- |
| `notes-footer-after` | `_01.10.26_20.48.59.746.png` | `notes-footer-after` | 54,425 / 19,245 |
| `friends-footer-after` | `_01.10.26_20.47.52.66.png` | `friends-footer-settled-after` | 51,683 / 19,272 |
| `notes-footer-fresh` | `_01.10.26_21.01.37.717.png` | `notes-footer-after` | 42,023 / 19,536 |
| `friends-footer-fresh` | `_01.10.26_21.03.58.739.png` | `friends-footer-settled-after` | 47,671 / 19,527 |

Each directory contains `report.json`, both heatmaps and both contact sheets;
reports track full native/browser PNG SHA-256s and runtime commit. Browser
captures and metadata live at
`R/captures/reference/scenario-matrix/v1/captures/<scenario>/browser/`.
Against the same retained references, lower residuals improved from
19,926 to 19,245 (Notes) and 20,064 to 19,272 (Friend); upper PNGs are
byte-identical to the preceding checkpoint. Within footer `(0,212,320,28)`,
both pairs improve from 1,573 to 781 differing pixels, maximum delta 152 to
49, mean RGB error 6.9281994 to 0.6808036. The footer is improved, not exact.

Fresh native Notes SHA-256:
`6e9cc40667cb2bc7b27c60abbf8340bf388152719a4ff0bb74492044f5e10c9e`;
Friend SHA-256:
`037061f160faf34ee93d241ecb7b7beba2edf030bfae28180e7410a121ab641b`.
Corrected browser lower SHA-256, Notes:
`1862b038c81a6b3ffe9ab2d0e9aa5cf9587e81a3b12430f64a6eb835906a9e04`;
Friend: `35b304c5a604ebb1291865ba4f229e1ecb9af77cc61ce05648ed8ef8156769ba`.

## Input and verification limits

The isolated clone's executable hash, no-symlink profile and original-hardware,
EUR, Vulkan, 1x and normal LCD layout settings were checked before launch.
Boot EUR restored Notifications. A foreground `f` produced repeated movement;
subsequent `h` foreground/background events did not yield consistent counts.
Notes was observed and captured, then a click on the upper render surface
followed by foreground `type_text h` reached Friend for its fresh capture.
Input is not frame-controlled. A later left-footer window click `(598,815)`,
approximately lower LCD `(50,226)`, did not visibly launch Friend. Do not report
that native touch route as verified.

Browser used focused canvas ArrowUp from Work, five `x` density cycles to one
row, then applet navigation. One attempted `friends-footer-after` capture had
`toolbarActive:false/currentFocus:-1`; it is preserved but excluded from every
comparison. Restoring focus and observing ArrowUp/ArrowRight produced the
correct `friends-footer-settled-after` capture. Browser and native control
passes were subsequently separated. Native/browser focus interference is a
risk, not a proven cause of the failed input. Browser sampled 12,000 ms with
20:43/20:42 displayed dates to retain the prior controlled comparisons;
fresh native dates are 21:01/21:04, so fresh whole-screen counts also include
unmatched clock, wallpaper and banner phases. Audio was muted and untested.

During cleanup, native window accessibility was intermittently unavailable.
The process was confirmed live and sampled rather than restarted; it later
closed, verified by absent PID/window. Log and sample are
`R/azahar-footer-run.log` and `R/azahar-footer-shutdown.sample.txt`.
The user then requested all visible testing/computer use on the iPad Sidecar
display. Connected geometry was verified; the native process closed before
the attempted move could be confirmed. Future runs must place and verify their
windows on Sidecar before any interaction, as recorded in `AGENTS.md`.

Supporting checks: 54 focused tests; full suite 1,527 passed, 0 failed,
23 skipped, 1 TODO; typecheck and production build pass. Logs are
`R/footer-focused.log` and `R/footer-tests.log`. No shader/material change.
No push, merge, deployment or global historic matrix overwrite.

Remaining non-native/adapted elements include portfolio content/grid population,
offline HUD policy, untraced banner yaw/clip origins, smaller applet title text,
wallpaper/HUD/cursor phases, 781 footer pixels, and unmatched input/motion/audio.
The title currently reuses the folder-only `BnrDsTitle_00` label path; this turn
did not establish the applet-native metrics and did not guess a font resize.
Next source trace should establish the applet label setup and the remaining
footer raster differences, while input calibration must precede a matched replay.
