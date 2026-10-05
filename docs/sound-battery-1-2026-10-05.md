# Sound battery-ROI pixel is an underbar partition gap — 5 October 2026

HOME-fidelity Sound worker on `codex/sound-battery-1-20261005` from fidelity
`57b04572`. Sparse worktree; `node_modules` linked from HOME fidelity. No
`model/`. No painter change. No Azahar. No preview 3021. No CDP. No
recapture. Title **1774**, Span **2314/2442**, birds, volume **130**, clock
**0**, first-run Next, guide perimeter **6072**, empty-entry row/slider/footer
and Camera leftovers stay as already labelled
([remaining residual](sound-remaining-residual-2026-10-04.md)).

This is a labelled source gap. It is not a 1:1 claim. Tests and this note do
not close pixels, input, motion or audio. Coordinator recapture remains the
acceptance gate.

## Pairs (reused, not recaptured)

Hashed natives under
`/Users/paramveer/.codex/3ds-artifact-overflow/reference/screenshots/`.
Empty mask `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.
Threshold any RGB channel >2/255. Official upper crop of each native 400×480
PNG is `(0,0,400,240)`. Clock `[95,216,194,240]` stays **0**.

| Still | SHA-256 | Role | Local clock |
| --- | --- | --- | --- |
| `Nintendo 3DS Sound_25.09.26_22.27.14.541.png` | `9dea0cc2fa7022ccd032c5a94ae59c2dbe37e6b7e800fbf8668b356fc9e5ce69` | `sound-first-run` combined | `22 27` (seconds 14, even) |
| `Nintendo 3DS Sound_25.09.26_22.31.31.595.png` | `65fc5f8819d31c49622d9e2a8ee7ba79c0675fd7dd3a73f783255eb7efe3b4cd` | `sound-empty-entry` combined | `22:31` (seconds 31, odd) |
| `sound-guide-next-recapture-20261005/browser/upper.png` | `16565d8e586edce659beadb9e7f7d72bcd8e2b81479a85bca424480d4294ceab` | browser first-run upper | |
| `sound-empty-entry-recapture-20261005/browser/upper.png` | `ebe8959e5a4d2bcb69ce63ebe34c3756d2b73a808bca42984708168f6918b97c` | browser empty-entry upper | |

Browser files live under
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/`.
The empty-entry upper is the seconds-parity plug recapture
([remaining residual](sound-remaining-residual-2026-10-04.md)): battery ROI
**183→1**. Both frozen uppers now share that **1**.

## Where the pixel is

Battery ROI `[45,216,85,240)` is one pixel on both uppers: LCD `(45,220)`.
Native `(76,62,53)`, browser `(74,58,49)`, delta `(2,4,4)`, max channel 4.

`C_HudBut_B` drawn at center `[51,228]` places the frame pane `-H-But_B`
(32×20, origin top-left, translation `[0,10]`) on `[51,218,83,238)` and the
fill `ButF_B` on `[59,223,78,233)`. Both rectangles are **0** on both uppers.
Pattern frames 4 (`HudBatLgt_00`, even) and 5 (`HudBatPlg`, odd) only retarget
`ButF_B`. They do not move the frame, and neither frame covers `(45,220)`.

The pixel is `S_Inf_U-UnderBar` pane `Line00`. That partition is 8×24 at
`[40,216,48,240)`. Local `(5,4)` is LCD `(45,220)`. Sibling `Line01` has the
same class of single-pixel excess at `(92,220)` (native `(82,67,59)`, browser
`(80,64,55)`, delta `(2,3,4)`), outside the battery ROI and outside the clock
ROI. `Line02` at `[192,216,200,240)` matches native on all 192 pixels,
including the clock columns it overlaps.

## What the dump does own

EUR Sound `0004001000022500` v3088, content 0 / `0000000b`. `exefs/code.bin`
SHA-256 `3c57f2c4091c1bec6b3834609f1e2a6488712e21775d7548b441c69c60b3e5a9`.
Published info pack `lyt-S_Inf_U-arc-LZ.json` SHA-256
`ff48060bf81844c2992394038aa386a064a55a0a7fe5b6e7e6e533a77e4919c9`.
Published HUD pack `lyt-C-Hud.json` SHA-256
`bb4bfdd539b1ae9cb11b34718c33eda010192d9af0cdce72c2e9e4d9902500d3`.
Converter `ctr-native-web` **1.2.0**.

| Element | Dump source | SHA-256 |
| --- | --- | --- |
| `S_Inf_U-UnderBar` | `lyt/S_Inf_U.arc.LZ/blyt/S_Inf_U-UnderBar.bclyt` | `7bb9a648e82d1d81e4e6ee0c7f7643a87db0ca3a8e38f72be293af97502a96e8` |
| `UnderBar_Partition.bclim` | `lyt/S_Inf_U.arc.LZ/timg/UnderBar_Partition.bclim` | `feb032cf8511d038d240a78dfb2a819f4eae462ab68fc9a8b3cb0835b03826df` |
| delivered PNG | `textures/1fd119b2de7e5a4ee9e59996607d40fd086ca9d156cb78125e6cfa63df32cfa3.png` | `1fd119b2de7e5a4ee9e59996607d40fd086ca9d156cb78125e6cfa63df32cfa3` |
| `C_HudBut_B` | `lyt/C.LZ/Hud/blyt/C_HudBut_B.bclyt` | `ab8e833f29680e9f9f2e2b0838a7ec930c361dc64d50a70664764ac12e2b7eda` |
| `C_HudBut_B_Pattern` | `lyt/C.LZ/Hud/anim/C_HudBut_B_Pattern.bclan` | `266282e44cfa694ab41df019683f07faab4a7da621b4c493cdefbc26152050e7` |

`Line00` uses material texture `UnderBar_Partition.bclim` (ETC1A4, 8×32,
delivered alpha 255 on every texel). Its picture UV is
`[0,0,1,0,0,0.75,1,0.75]`, so the 8×24 pane maps onto texture rows 0..24.
LCD `(45,220)` samples texel `(5,4)` at its centre: `(74,58,49,255)`. That is
the browser pixel. The native color `(76,62,53)` does not occur in the
delivered partition. `Line02` draws the same texel at LCD `(197,220)` and the
native capture matches `(74,58,49)` there.

`C_HudBut_B_Pattern` remains the state-0 seconds bind already in the painter:
odd → frame 5, even → frame 4. The plug fill that this bind removed is the
previous 182 pixels. It does not select the partition texel.

## Runtime

`drawNativeSoundFrame` is unchanged. `S_Inf_U-UnderBar` stays the plain layout
draw. `C_HudBut_B_Pattern` stays `soundHudBatteryPatternFrame`. No capture-fit
color is written at `(45,220)`.

The battery ROI count stays **1** until a later slice owns the screen-position
excess on `Line00`. Editing the partition texel, or the battery Pattern frame,
has no dump source for native `(76,62,53)` and would move `Line02` off the
native match it already has.

## Tests

`tests/sound-battery-1.test.mjs` checks the partition UV and texel, the
`C_HudBut_B` frame rectangle, the unchanged painter binds, and, when the
private stills are present, battery ROI **1** at `(45,220)`, frame and fill
**0**, and clock **0** on both frozen uppers.

## Independent review

Grok 4.6 `sound-battery-1-review-20261005-r1`: **APPROVE** of `76a3635a`
(identical patch-id `adf4278c…` to worker `6ddfe357`). Docs and tests
only. Painter unchanged. `Line00` local `(5,4)` is LCD `(45,220)`.
Delivered `UnderBar_Partition` texel and `rasterNativePicture` are
`(74,58,49,255)`. Native `(76,62,53)` is not a partition texel. `Line02`
already matches that texel at `(197,220)`. Pattern tracks are `ButF_B`
only; frame and fill **0**. Editing the texel would move `Line02` off a
native match. Frozen battery ROI **1**. Clock **0**. Not 1:1.
