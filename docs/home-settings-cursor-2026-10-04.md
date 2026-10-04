# HOME 1-row Settings+cursor 1,656-pixel source gap — 4 October 2026

Worker `3ds-home-settings-cursor-20261004` / `codex/home-settings-cursor-20261004`
from HOME fidelity `0f7e9c26`. Sparse worktree; `node_modules` linked from
HOME fidelity. No `model/`. No runtime change. No Azahar. No preview 3021.
No CDP 9320. No recapture. No guessed cursor frame, mip or sampler.

The [1-row Right walk](home-row-viewport-2026-10-04.md) leaves neighbour-face
masked lower at **5,426** over 2/255. After the [News receive lamp](home-toolbar-icon-2026-10-04.md)
is named, the next masked 4-neighbour component is **1,656** at
`[203,121,82,82]`. Right tile `[208,118,80,82]` is **1,481**. Cursor ring
`[200,110,96,96]` is **2,485**. That cluster is `LncCsr_00` chrome around an
already-matching Settings face, not a missing icon or unused clip.

Evidence: source-identified and tested. Independent review **APPROVE** of
fidelity `0536c4ac`. Not browser-inspected here. Not native-compared here.
Not 1:1.

## Pair

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-row-viewport-20261004/`.
Frozen after-walk yaw 304 / COMMON 303 / Loop 338 / cursor 37. Neighbour
mask `R/adaptation-neighbor-mask.json`. Threshold any RGB channel >2/255.

| Item | SHA-256 |
| --- | --- |
| Native `_26.09.26_04.14.35.203.png` | `4adc0ef0cbba7175b641fbe4107f697f15ff7a4aadd482c746e389ea7abf5bdb` |
| After-walk upper | `2a2d920edce45c295d01a7479c0d1632b3c73e2bf04d38da1ca84e54abd26a6c` |
| After-walk lower | `cd0c87d30ab440b06a70d27787d58a6959e4e631c591a0cc319c02297903921a` |
| Masked lower report | `0069238f120e100fdd74ea9d4c484bfa46144818c0e2800a29be2207b3749d96` |
| Neighbour mask | `6b64f906f07315f9252e25f2df23c4b6e92c8535ab659b9e56523f71de587f6d` |

Official lower crop of the native 400×480 PNG is `(40,240,320,240)`.
Inspected `R/diff-after-masked/lower-contact-sheet.png` and
`R/after-origin-right/lower.png`. 1-row metrics already place Settings at
LCD **(244, 161)** (`baseX` 76 + 2×`pitchX` 84, `baseY` 161, box 72). The
1,656-pixel bbox is centred on that point. Tile-core `[232,142,32,32]` is
**0** over 2: the Settings wrench face matches. Cluster max channel error
is **23** (MAE 6.7). Neighbour peeks stay 215/245; the News lamp stays 248.
The leftover is a faint halo, not a wrong title.

## Layout

EUR HOME `0004003000009802`, version 24576, content 0 / `00000082`,
`exefs/code.bin` SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Virtual base `0x100000`. Delivered `home.launcher` /
`packs/home/launcher.json` SHA-256
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.
Converter `ctr-native-web` 1.2.0 / CTRTool 1.3.0.

`cursorAt` already draws `LncCsr_00` with the three authored clips:

| Member | CIA path | SHA-256 |
| --- | --- | --- |
| `LncCsr_00` | `launcher_LZ.bin/blyt/LncCsr_00.bclyt` | `72f59f9f3d0a327c6c1e3e012a1aa9f1a1a84ab3d0c829772ae4a2a43ecd0738` |
| `LncCsr_00_Loop` | `anim/LncCsr_00_Loop.bclan` | `0bf11061be32b1af39749b8ae8342b8010b65ed9dfd257dbce76e38618b76744` |
| `LncCsr_00_Scale` | `anim/LncCsr_00_Scale.bclan` | `74277ac0ec8debf4f035b6e4c629fb9605c897fcb50e6b5ed2447250c671c2dd` |
| `LncCsr_00_Select` | `anim/LncCsr_00_Select.bclan` | `ecdf8761f6e0c07c9405dc12f9d4d65f1b97b4c70bb110da4a0afc52fdc46e02` |

`LncCsr_00` has two windows: `W_CsrF_00` 95×95 on `LncCsr_41.bclim` and
`W_CsrLgt_00` 78×78 on `LncCsrShdw_44.bclim`. Density 0 (this still) keeps
those sizes at Scale frame 0, highlight scale 1.5, Select 0 (released).
`LncCsr_00_Loop` is 60 frames; it writes only `W_CsrLgt_00` alpha and the
`W_CsrLgt_00LT` / `W_CsrF_00LT` texture translations. It does not move the
pane roots. `homeLayouts.launcher` already requests `LncCsr_00`.
`LncCsrEfct_00` / `LncCsrEfct_01` are move/launch effects and are not drawn
on this settled idle still.

The [direct-LCD sampling candidate](workstream-handoffs/home-cursor-compare.md#direct-lcd-sampling-candidate-rejected)
for those two windows was already rejected. Re-binding a mip, sampler or
`pictureSampling: 'lcd'` would be a guess.

## Executable

Loop submit `0x269430` then advance `0x1bbd94` are already the retained
controller in `home-cursor-loop.ts`. Fresh System starts at applied 0 /
current 0; an eligible update submits current, then adds float32 1 and
wraps before 60. `getHomeCursorLoopFrame` returns `appliedFrame`. There is
no Settings-idle store that writes 37. Independent one-row captures already
ranked different best frames (32, 3, 44, 31, 17, 10) and ruled out promoting
one search winner to a native epoch.

The after-walk freeze passes `homeCursorLoopFrame: 37` as
`verification-forced`. Live paint after Playwright settle was around 25.
1617 ms × 60 Hz is 97.02 updates and 97 % 60 = 37, the same number as
WalkCoin's elapsed frame 97. That is a capture-clock coincidence, not a
unique Loop owner. Do not adopt 37 as a live clock. Native epoch unmatched.

## Why the painter stays unchanged

`cursorAt` already binds Select 0 / Scale `primaryScale.appliedFrame` /
Loop `appliedFrame` (or the forced diagnostic frame). Density 0's unique
Scale frame is 0 and is already the 1-row bind. The Settings face is
already the ordinary title icon; its 32×32 core is inside threshold.
Seeding Loop 37 into live `homeCursorLoop`, snapping Scale, or inventing a
window sampler would not be a unique unused source bind, and the 1,656
pixels remain after the already-best freeze.

News lamp, Settings Other page-2 painter, HudMset `+e5` and Sound HUD 5/4
were not touched.

## Tests

Focused `tests/home-settings-cursor.test.mjs`: pins `LncCsr_00` windows and
textures, Loop-only alpha/tex tracks, Scale-0 1-row geometry, `cursorAt`
Select/Scale/Loop bindings without `pictureSampling`, 1-row centre
(244, 161), and the omitted effect layouts staying off the idle draw.
When `R` is present, pins cluster 1,656 / tile 1,481 / ring 2,485,
tile-core 0, max 23, and the named SHA-256 identities.

## Remaining / next coordinator action

Masked lower stays **5,426**. Settings+cursor 1,656 / ring 2,485 remain.
Settings face matches. Next visible lower work is the neighbour peeks
(2,220 right, 561+391+145 left), not another Loop-frame search, until a
source-backed window/material raster owner exists. Do not recapture for
this documentation slice. Reuse the matching 1-row Right walk. Do not
adopt cursor 37 as a live clock. Whole-scenario 1:1 still fails. Matrix
unchanged.
