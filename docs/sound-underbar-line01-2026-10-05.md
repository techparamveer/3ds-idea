# Sound UnderBar Line01 pixel is a partition source-gap — 5 October 2026

HOME-fidelity Sound worker on `codex/sound-underbar-line01-20261005` from fidelity
`89efb7a3`. Sparse worktree; `node_modules` linked from HOME fidelity. No
`model/`. No painter change. No Azahar. No preview 3021. No CDP. No
recapture. Title **1774**, Span **2314/2442**, birds **1558**, volume **130**,
clock **0**, first-run Next, guide perimeter **6072**, empty-entry
row/slider/footer, battery `Line00` `(45,220)` (`76a3635a`) and Camera
leftovers stay as already labelled
([remaining residual](sound-remaining-residual-2026-10-04.md),
[battery Line00](sound-battery-1-2026-10-05.md)).

This is a labelled source gap. It is not a 1:1 claim. Tests and this note do
not close pixels, input, motion or audio. Coordinator recapture remains the
acceptance gate.

## Pairs (reused, not recaptured)

Hashed natives under
`/Users/paramveer/.codex/3ds-artifact-overflow/reference/screenshots/`.
Empty mask `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`
(no regions). Threshold any RGB channel >2/255. Official upper crop of each
native 400×480 PNG is `(0,0,400,240)`. Clock `[95,216,194,240]` stays **0**.
Battery ROI `[45,216,85,240)` stays the single `Line00` pixel.

| Still | SHA-256 | Role | Local clock |
| --- | --- | --- | --- |
| `Nintendo 3DS Sound_25.09.26_22.27.14.541.png` | `9dea0cc2fa7022ccd032c5a94ae59c2dbe37e6b7e800fbf8668b356fc9e5ce69` | `sound-first-run` combined | `22 27` (seconds 14, even) |
| `Nintendo 3DS Sound_25.09.26_22.31.31.595.png` | `65fc5f8819d31c49622d9e2a8ee7ba79c0675fd7dd3a73f783255eb7efe3b4cd` | `sound-empty-entry` combined | `22:31` (seconds 31, odd) |
| `sound-guide-next-recapture-20261005/browser/upper.png` | `16565d8e586edce659beadb9e7f7d72bcd8e2b81479a85bca424480d4294ceab` | browser first-run upper | |
| `sound-empty-entry-recapture-20261005/browser/upper.png` | `ebe8959e5a4d2bcb69ce63ebe34c3756d2b73a808bca42984708168f6918b97c` | browser empty-entry upper | |

Browser files live under
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/`.
Both frozen uppers share one excess in the `Line01` rectangle: LCD `(92,220)`.

## Where the pixel is

`S_Inf_U-UnderBar` is a 400×240 layout. `DefUndBar` sits at translation
`[0,−104]` (centre LCD `(200,224)`, 400×32). The three partitions are 8×24,
origin centre, translation Y `−4`:

| Pane | Translation X | LCD rectangle | Local `(4,4)` |
| --- | --- | --- | --- |
| `Line00` | `−156` | `[40,216,48,240)` | `(44,220)` |
| `Line01` | `−108` | `[88,216,96,240)` | `(92,220)` |
| `Line02` | `−4` | `[192,216,200,240)` | `(196,220)` |

`(92,220)` is outside battery ROI `[45,216,85,240)` and outside clock
`[95,216,194,240]`. `C_HudSndB` drawn at centre `[7,228]` places `-H-SndB`
on `[7,218,37,238)`. `C_HudBut_B` frame `-H-But_B` stays on `[51,218,83,238)`.
`S_Inf_U-Hour` icon `HrsClckIcon` is `[102,220,118,236)` and `TextBox_00` is
`[140,217,188,247)`. `S_Inf_U-PlayTime` is `[200,216,392,240)`. None of those
rectangles contain `(92,220)`.

`ParakeetA_U` drawn at centre `[94,192]` is a 64×64 `ChaA` whose rectangle
includes `(92,220)`, but `ParakeetA_U_Wait` frame 0 leaves that texel alpha 0
(`[53,138,53,0]`). The birds are painted before the underbar. An opaque
partition covers them.

Both frozen uppers: native `(82,67,59)`, browser `(80,64,55)`, delta
`(2,3,4)`. The rest of `Line01` `[88,216,96,240)` matches. `Line02` matches
on all 192 pixels.

## What the dump does own

EUR Sound `0004001000022500` v3088, content 0 / `0000000b`. `exefs/code.bin`
SHA-256 `3c57f2c4091c1bec6b3834609f1e2a6488712e21775d7548b441c69c60b3e5a9`.
Published info pack `lyt-S_Inf_U-arc-LZ.json` SHA-256
`ff48060bf81844c2992394038aa386a064a55a0a7fe5b6e7e6e533a77e4919c9`.
Converter `ctr-native-web` **1.2.0**.

| Element | Dump source | SHA-256 |
| --- | --- | --- |
| `S_Inf_U-UnderBar` | `lyt/S_Inf_U.arc.LZ/blyt/S_Inf_U-UnderBar.bclyt` | `7bb9a648e82d1d81e4e6ee0c7f7643a87db0ca3a8e38f72be293af97502a96e8` |
| `UnderBar_Partition.bclim` | `lyt/S_Inf_U.arc.LZ/timg/UnderBar_Partition.bclim` | `feb032cf8511d038d240a78dfb2a819f4eae462ab68fc9a8b3cb0835b03826df` |
| delivered PNG | `textures/1fd119b2de7e5a4ee9e59996607d40fd086ca9d156cb78125e6cfa63df32cfa3.png` | `1fd119b2de7e5a4ee9e59996607d40fd086ca9d156cb78125e6cfa63df32cfa3` |
| `UnderBar.bclim` | `lyt/S_Inf_U.arc.LZ/timg/UnderBar.bclim` | `1c80567ccbd7d067ba48f8ed1597ac65099a96f2c3494d0477dfa8fc1da9ca00` |

`Line00`, `Line01` and `Line02` share `UnderBar_Partition.bclim` (ETC1A4,
8×32, mag filter linear, wrap clamp, white vertex colours, empty TEV, alpha
255). Picture UV is `[0,0,1,0,0,0.75,1,0.75]`, so the 8×24 pane maps onto
texture rows 0..24. LCD `(92,220)` is pane pixel `(4,4)`. Its centre
`(4.5, 4.5)` maps to texture coordinates `(0.5625, 0.140625)`, which is texel
centre `(4,4)`: `(80,64,55,255)`. That is the browser pixel, and it is the
`rasterNativePicture` sample.

The same local sample is LCD `(44,220)` on `Line00` and `(196,220)` on
`Line02`. Both frozen natives and both browsers are `(80,64,55)` there. The
partition decode is confirmed at those two screen positions.

Native `(82,67,59)` occurs in none of the 256 partition texels, none of the
256 `UnderBar.bclim` texels, and none of `CharaA_Wait_00.bclim`. `code.bin`
contains the layout name `S_Inf_U-UnderBar` in the info-layout string table
(`0xb9274`, beside `TrackNameD` and `Fav`) and contains no `Line00`, `Line01`
or `Line02` string and no `82,67,59` byte triple. No clip in the underbar
layout excludes pane pixel `(4,4)`.

## Runtime

`drawNativeSoundFrame` is unchanged. `S_Inf_U-UnderBar` stays the plain layout
draw. No capture-fit color is written at `(92,220)`.

The `Line01` count stays **1** until a later slice owns the screen-position
excess. Editing the shared partition texel would move `Line00` `(44,220)` and
`Line02` `(196,220)` off the native match they already have. The battery
`Line00` excess at `(45,220)` stays the labelled gap from `76a3635a`.

## Tests

`tests/sound-underbar-line01.test.mjs` checks the three partition rectangles,
texel `(4,4)`, the absent native triple, the unchanged painter bind, and, when
the private stills are present, `Line01` excess **1** at `(92,220)`, sibling
local `(4,4)` matches, battery ROI **1** and clock **0** on both frozen uppers.

## Independent review

Grok 4.6 `sound-underbar-line01-review-20261005-r1`: **APPROVE** of
`6db7e7ef`. Docs and tests only. Painter unchanged. `Line01` `[88,216,96,240)`
LCD `(92,220)` is pane `(4,4)` → shared `UnderBar_Partition` texel `(4,4)`
`(80,64,55,255)`. Browser matches. `Line00` `(44,220)` and `Line02`
`(196,220)` already match that texel natively. Native `(82,67,59)` is not a
partition, UnderBar, or ChaA texel. No clip excludes pane `(4,4)`. Editing
the shared texel would move the sibling matches off native. Frozen Line01
excess **1**. Clock **0**. Battery `Line00` `(45,220)` stays the separate
labelled gap. Not 1:1.
