# Game Notes suspended-screen resource contract

This source audit supports the **Game Notes** row of `docs/feature-map.md`.
The current editor always draws `ImageScreenUp_PanelNoGameIn` and explicitly
hides every screenshot pane. That explains the reported no-suspended-software
message even while another app is suspended. This checkpoint changes neither
runtime nor painting.

## Already delivered resources

`packs/game-notes/memo-ImageScreenUp-arc-l.json` contains the complete source
layout, all 14 animations and all 17 texture references from the inspected
English conversion. No additional resource publication is needed. Layout source:
`memo/ImageScreenUp.arc.l/blyt/ImageScreenUp.bclyt`, SHA-256
`b042e28a08e66c3fc545688ac79e835503819e82ac08261c20cf082efb9b74f3`.

| Pane | Sampler 0 texture name | Actual application input |
| --- | --- | --- |
| `P_ScreenUpL` | `imgUp400x240L_8x8.bclim` | Suspended upper screen, 400 × 240 logical pixels |
| `P_ScreenUpR` | `imgUp400x240R_8x8.bclim` | Right-eye surface; source pane defaults hidden |
| `P_ScreenDown` | `imgDown320x240_8x8.bclim` | Suspended lower screen, 320 × 240 logical pixels |

The delivered textures are **8 × 8 placeholders**, not captures. Neither those
textures nor the existence of a suspended app proves that valid snapshot pixels
have been supplied. The normal 2D web presentation can use the left-eye pane;
do not expose both eye panes merely because both source names exist.

The existing renderer already accepts `NativeDrawOptions.textures` and per-pane
`textureBindings: {0: replacementName}`. Those bindings clone the material for
that pane and preserve source UVs. No new rendering primitive is necessary.

All three panes use UVs `[1,0, 1,1, 0,0, 0,1]`. With the current sampler, a
conventional upright row-major capture must be stored rotated clockwise 90°:
for source pixel `(x,y)` of width W, height H, write its RGBA bytes to
`(x * H + (H - 1 - y)) * 4` in a buffer of width H, height W. Thus the upper
input buffer is 240 × 400 and the lower is 240 × 320. A unique-pixel 4 × 2
capture passed through this conversion and the actual source picture raster
reproduced its original 32 RGBA bytes exactly. This validates the UV adapter,
not a complete browser screenshot.

## Source view modes

All three switching clips have 26 frames and settle at frame 25. Their named
binding groups are `G_Panel_00` and `G_Panel_01`; retain those groups instead of
applying every unrelated channel stored in the archive.

| Clip | Upper-left pane at frame 25 | Lower pane at frame 25 |
| --- | --- | --- |
| `ImageScreenUp_SwitchDouble` | 190 × 114, translation (0,115) | 152 × 114, translation (0,-1) |
| `ImageScreenUp_SwitchUp` | 400 × 240, translation (0,120) | Hidden |
| `ImageScreenUp_SwitchDown` | Hidden | 320 × 240, translation (0,120) |

These panes use origin 1 (top centre); positions are native centre-origin
coordinates. Shadow panes follow the same source clips. The modes and endpoints
are source-backed; their initial choice and cycling order have not been traced
in this audit.

`ImageScreenUp_PanelGameIn` and `PanelNoGameIn` are 21-frame clips bound only to
`G_Scene_01`. Under the actual group filter they animate `N_BtnMemoUp` and
`P_MemoFrameALL`; their names do not make them a complete capture/empty-state
visibility controller. `T_TextList`, `T_TextWrite` and the modal `P_Mask` require
context-appropriate visibility. Do not simply replace the clip name while
leaving the painter's explicit capture-hiding overrides in place.

The source empty-state label `9900NoBreakGameMesList` reads “There is no
suspended software.” The other source label `9900NoBreakGameMes` is a fragment
with a leading space and must not be treated as a standalone replacement
instruction. The lower `MemoWriteDown` includes `P_BtnSwitch` and
`B_BtnSwitch` at (92,-120), sizes 46 × 28 and 44 × 28 respectively. It provides
source switch-control artwork, not evidence of a specific cycle order.

## Integration boundary

The coordinator owns snapshot lifetime, suspended-app identity, view selection,
input geometry and browser verification. The painter currently loads only
`ImageScreenUp_PanelNoGameIn`; request the selected source switching clips before
using them. Use actual frozen application output for a snapshot and keep missing
pixels distinct from no suspended app. No camera capture, recording, keyboard,
new stock functionality or native framebuffer backend is needed for this UI.

The private endpoint report is
`assets/stock-ui/game-notes-capture-poses.json` under the firmware artifact root.
No source, renderer, runtime or shared feature-map file changed in this audit.
