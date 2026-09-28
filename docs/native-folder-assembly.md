# Native lower folder assembly

The browser now draws the source HOME/root plate, opened folder panel and Back
tab, then the empty-child grid without the formerly reconstructed header or
Close footer. The layout resources are LncPlt_00, LncFolder_00 and
LncFolderCapture_00. The source-based Back hit bounds and empty-selection
behavior are documented in [folder input](home-folder-input.md).

## Geometry and capture

The plate uses unscrolled native slot endpoints, interpolated density metrics
and original float32 extent/anchor arithmetic. Root retains the current 300-slot
application limit; folder capacity is 60. Native root capacity360 is an explicit
remaining difference. The panel uses its own source origin, Y offsets,144-pixel
plate height and164-pixel shadow height. Four-frame windows retain the original
texture/material behavior described in [window rendering](native-folder-window.md).
Large offscreen window patches rasterize only the visible source-pixel range,
plus one filtering neighbor. Their UV/color interpolation retains the full
unclipped pane domain; the raster budget is not increased. Rotated panes keep
the prior bounded full-surface path.

The opening capture freshly redraws the root base, plate and ordinary icons.
Footer, cursor, arrows, balloon and effects are excluded. Only the selected
ordinary folder is replaced by its T-then-B source pair, with direct PicToggle0
and Scale at the actual fractional density; see
[selected capture evidence](native-folder-capture.md). Native glyph pixels and
mask are bound to B's authored icon pane. The canonical320x206 pixel snapshot
covers root rows34..239 and is fed to the source capture material at settled
Fade8/PicUp0. It replaces the rotated native framebuffer plus crop, preserving
the source second UV channel, gradient and TEV operations.

The snapshot is retained for the opened folder identity, cleared on close or
asset replacement, and released on disposal. Source font glyphs and native
material resources remain immutable. The opened panel uses settled FadeIn16;
opening/closing transition epochs are not yet wired. The empty selected-folder
instance is proven; nonempty HadToggle, custom pictures and badge paths still
need their source state.

Density is passed directly to native Scale clips; it is no longer reconstructed
from row count (folder density0 and1 both have one row). Folder glyph width/Y
interpolate through the original float32 tables. Numeric source fixtures live
in tests/fixtures/native-folder-panel.json; private original-ARM execution is
under the SSD presentation/folder-panel-geometry directory.

## Verification

All374 tests, nonincremental type checking and production build passed after
the combined changes. The real-resource animation test verifies direct binding
preserves the empty contents tab and independent Scale channels. Raster tests
compare cropped sampling bytes with the full pane and cover reflected/offscreen
coordinates. No shader changed in this assembly.

The actual browser was reloaded and operated through keyboard and projected
touchscreen controls. Back press uses the native depressed tab, release returns
to the remembered root density, and touching the empty footer does not close
the folder. No browser errors or Next overlay were reported. Native and browser
parent density were matched at0; the opened folder uses density1. Earlier
two-row-parent versus one-row-parent comparisons are not evidence for hiding
exposed selected-folder pixels.

Final native-resolution comparison with reference/home-folder-open-a-bottom.png:

| Region x,y,w,h | RGB mean absolute error | Maximum channel error |
| --- | ---: | ---: |
| Panel interior120,74,150,30 | 0 | 0 |
| Back tab23,44,72,21 | 0.226190 | 2 |
| Left shadow above parent icons0,80,20,40 | 0.287083 | 2 |
| Captured bottom100,218,180,22 | 0.969697 | 3 |
| Top underlay100,39,180,20 | 0.834074 | 4 |

These are bounded static measurements, not whole-screen parity. The broader
left strip includes a differing neighboring application icon in the parent
HOME view; that stock layout/icon conversion remains unresolved. Cursor loop
phase is unmatched, and upper animation epoch, full transitions, rounding and
nonempty capture state remain open. First-eight portfolio content and clock
values are intentional differences; unrelated stock differences are not.

Screenshots, parent views, JSON state and metrics are in the SSD firmware
artifact directory, reference/browser-folder-pair-final*,
reference/browser-folder-parent-current* and reference/folder-pair-final-metrics.json.
Checks are integration-folder-assembly-{tests,typecheck,build}.log.
