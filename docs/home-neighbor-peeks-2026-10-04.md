# HOME 1-row neighbour-peek residuals — 4 October 2026

Worker `3ds-home-neighbor-peeks-20261004` / `codex/home-neighbor-peeks-20261004`
from HOME fidelity `0536c4ac`. Sparse worktree; `node_modules` linked from
HOME fidelity. No `model/`. No runtime change. No Azahar. No preview 3021.
No CDP 9320. No recapture. No invented excluded-title art. No Sound / Health
replacement.

The [1-row Right walk](home-row-viewport-2026-10-04.md) leaves neighbour-face
masked lower at **5,426** over 2/255. After the [News receive lamp](home-toolbar-icon-2026-10-04.md)
and the [Settings+cursor halo](home-settings-cursor-2026-10-04.md) are named,
the leftover 4-neighbour components are **2,220** at `[287,124,33,80]` and
**561+391+145** at `[0,139,16,46]` / `[0,126,30,76]` / `[0,137,14,14]`.
Those are ordinary off-window tile faces under already-bound `LncArw_00`,
not a missing arrow layout.

Native visible neighbours remain excluded Activity Log | Download Play.
Browser peeks are portfolio About | in-scope Camera. Neighbour faces stay
labelled portfolio adaptations. No unique unused peek/arrow compositor bind
was found.

Evidence: source-identified and tested. Independent review **APPROVE** of
fidelity `36c66188` / `f983d480`. Not browser-inspected here. Not
native-compared here. Not 1:1.

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
`R/after-origin-right/lower.png`. Native shows Activity Log | Download Play |
Settings with partial tiles in both page arrows. Browser shows Sound |
Health | Settings, About in the left arrow strip and Camera in the right.
The mask already excludes the two visible neighbour faces
(`[32,118,80,82]` and `[112,118,88,82]`). Settings, cursor, arrows, balloon,
toolbar and footer stay compared.

After-walk empty-mask ROIs from the viewport note still hold: left peek /
arrow `[0,118,32,82]` / `[0,126,24,76]` = **1,090 / 843**; right peek /
arrow `[288,118,32,82]` / `[296,140,24,44]` = **2,081 / 1,020**. Cluster
max channel error stays 245 left / 215 right. That is title-face identity,
not missing arrow chrome.

## Layout

EUR HOME `0004003000009802`, version 24576, content 0 / `00000082`,
`exefs/code.bin` SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Virtual base `0x100000`. Delivered `home.launcher` /
`packs/home/launcher.json` SHA-256
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.
Converter `ctr-native-web` 1.2.0 / CTRTool 1.3.0.

`arrows()` already draws the only delivered page-arrow layout:

| Member | CIA path | SHA-256 |
| --- | --- | --- |
| `LncArw_00` | `launcher_LZ.bin/blyt/LncArw_00.bclyt` | `b10fb39ab2c122041512b2b504107c792c40193344c907441acb603895816ed8` |
| `LncArw_00_Appear` | `anim/LncArw_00_Appear.bclan` | `cd26320af0d48b4af048fb58bbe755115fa0cde3e959285519b724bbd65dd11f` |

Settled Appear keys at frame 14 hold `N_arwL_00` / `N_arwR_00` at x = −162 /
162 and alpha 255. The live bind is frame 15, which keeps that last key.
`P_arwL_00` / `P_arwR_00` are 24×76 on `LncArwBtnAlp_10.bclim` /
`LncArwBtnCol_10.bclim`. Shadow pictures are 32×96 at alpha 50. LCD centres
for the arrow roots are `(160-162, 120-(-3))` = **(−2, 123)** and
**(322, 123)**. `homeLayouts.launcher` already requests `LncArw_00`. The
draw clip is `[0,33,320,179]`. Visibility already follows
`getHomePageBoundary()` (`N_arwL_00` / `N_arwR_00`). That mapping is the
same [page-boundary](home-page-boundary-2026-10-02.md) bind.

The other authored clips are not an unused idle peek compositor:

| Clip | Frames | What it writes |
| --- | ---: | --- |
| `Decide` | 6 | press nudge + icon material |
| `DisAppear` | 15 | hide (±192, alpha 0) |
| `PaletteIn` / `PaletteOut` | 21 | `N_Wrp_00` y for the toolbar palette |
| `Repeat` | 16 | icon material pulse |
| `Select` | 2 | pressed icon material |

`PageArrowIcon.bclim` belongs to footer `LncBtmBtn_02`, not `LncArw_00`.
There is no second peek layout and no `attachments` mount for neighbour
titles on the arrows.

## Grid peeks

Density 0 already places the 1-row window at centres 76 / 160 / 244,
`pitchX` 84, box 72. The matching walk is selected 9 / left 7 /
`scrollPixels` 588. `menuTiles` keeps any tile with `x < 320 && x + size > 0`,
so the off-window neighbours are already painted:

| Slot | `initialAppLayout()` | Centre | Visible strip |
| --- | --- | --- | --- |
| 6 | portfolio About | (−8, 161) | x 0–28 |
| 7 | Sound | (76, 161) | masked face |
| 8 | Health | (160, 161) | masked face |
| 9 | Settings | (244, 161) | matching face |
| 10 | Camera | (328, 161) | x 292–320 |

Native reconstructs slots 7 | 8 | 9 as Activity Log | Download Play |
Settings. Those two titles are excluded (`0004001000022100` /
`0004001000022200` in `excludedTitles`; also
`retiredHomeTitleIds`). The native left peek is the still-unidentified
pre-Activity-Log face; the native right peek is the still-unidentified
post-Settings face. Do not name them from the still.

## Why the painter stays unchanged

The leftover pixels are those peek title faces. `LncArw_00` Appear 15 is
already the unique settled arrow bind. Rebinding Repeat, Select, Decide,
DisAppear or Palette would change arrow chrome, not which title occupies
slot 6 or 10. There is no unused compositor that draws a different neighbour
into the arrow strip. Replacing About / Camera with excluded Activity Log /
Download Play / an invented post-Settings icon would invent out-of-scope
art. Moving Sound / Health off 7 / 8 would drop the labelled Settings-right
adaptation.

Cursor 37, the News lamp, Settings Other page-2, HudMset `+e5` and Sound
HUD 5/4 were not touched.

## Tests

Focused `tests/home-neighbor-peeks.test.mjs`: pins `LncArw_00` windows and
textures, Appear-only live bind at frame 15, omitted press/palette/repeat
clips, `PageArrowIcon` staying on the footer, `initialAppLayout()` peek
slots, density-0 left-7 tile geometry, and `arrows()` having no
attachments. When `R` is present, pins masked lower 5,426, components
2,220 / 561 / 391 / 145, the named peek ROIs, and the SHA-256 identities.

## Remaining / next coordinator action

Masked lower stays **5,426**. Right peek 2,220 and left 561+391+145 remain
labelled portfolio adaptations. Settings+cursor 1,656 and News lamp 162
stay their own source gaps. Do not recapture for this documentation slice.
Reuse the matching 1-row Right walk. Do not invent excluded-title icons and
do not replace Sound / Health. Whole-scenario 1:1 still fails. Matrix
unchanged.
