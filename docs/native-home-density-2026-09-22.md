# HOME one-row versus two-row placement

This corrects the earlier interpretation of the first native HOME comparison as
two-row mode. New native input/capture evidence establishes that the reference
with the large lower selection balloon was **one row**. Both one and two rows
use the same 72 px ordinary plate; tile size alone did not identify the mode.

## Captures and measurement

Integration operated Azahar and captured these 400×480 images. Coordinates below
refer to the lower 320×240 display, extracted at image offset (40,240).

| Native capture | SHA-256 | Observation |
| --- | --- | --- |
| `reference/home-folder-first.png` | `456fb9f622042a28e6be3adbfba649eec2288b4c39a5e0d3658909c2518fb8d5` | One row, selected folder, balloon above the row |
| `reference/home-folder-two-rows-lower.png` | `05813c3a1e93f57655d1dbcd131daa8701650ba8b7202c63d69d63fd94ec094b` | After increasing density at (307,16), two rows, selected lower-row folder, no lower balloon |

The settled earlier `_22.09.26_21.43.16.442.png` capture independently confirms
the first capture's single-row geometry. Its empty-slot patch x58–93, y140–180
matches the corresponding two-row lower slot after translation (+168,+5): all
1,476 pixels are identical. This rules out cursor animation or the first
capture's in-progress upper-text reveal as the explanation for the 5 px offset.

The older Activity Log capture also has ordinary plate top/bottom edge pixels at
y126/196, versus y131/201 in the new two-row lower plate. Folder cyan bounds are
y133–194 in both one-row captures and y138–199 in the two-row capture. These
independent shapes agree on the same vertical difference.

| Mode | Nominal tile top | Tile center Y | Ordinary plate size | Lower balloon |
| --- | --- | --- | --- | --- |
| One row | 125 | 161 | 72×72 | Selected folder label shown |
| Two rows | 46, 130 | 82, 166 | 72×72 | Hidden |

Observed column centers are x76,160,244, with 84 px pitch. Source `Scale` frame
0 and 1 produce identical Folder, SetSrc and Cursor poses because their main
geometry keys begin at 1. Ordinary plate sizes for frames 1–5 are 72,50,36,30,26.
The source `LncBase_D_01` does not author density-dependent row placement; that
part of the change follows the captures, not an invented animation track.

## Implementation and verification

`menuTiles` changes only the single-row top from 82 to 125. It remains the shared
source for painting, direct touch and gesture hit testing, so the visible row and
drop targets move together. Two-row and denser geometry, column ordering, default
density, saved values, selection, drag/drop state and navigation rules remain
unchanged. `getNativeFolderBalloon` now enables the source lower label only in
one-row mode. Source scale frame 1 remains shared by one and two rows.

- **53/53 tests pass** across menu behavior and the focused presentation/font/
  native-layout/PNG/CGFX suite. Coverage includes density changes preserving
  selection, all-density touch reachability, one-row label-space exclusion and
  a complete lower-row lift/move/drop swap through the actual reducer.
- Nonincremental TypeScript and diff whitespace checks pass.
- Software inspection artifact `presentation/native-density-one-row-bottom.png`
  shows the corrected row with the native balloon; no browser is driven by the
  presentation task. Actual browser recapture remains with integration.

The source balloon horizontal clamp is still inferred from center/right samples.
Toolbar focus transitions, higher-density exact placement and default native
startup density have not been established by this bounded correction.
