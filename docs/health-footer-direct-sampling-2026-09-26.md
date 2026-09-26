# Health Back footer: direct LCD sampling — 26 September 2026

The genuine HOME → Health → Usage screenshot
`reference/screenshots/_26.09.26_04.46.01.113.png` had 147 lower pixels over RGB
threshold 2 in the offline renderer, all within the Back footer. The coordinator
confirmed the defect in production at `0ad8efd`: upper 0 / lower 146 pixels over
threshold, mean RGB error 0.0705 / 0.118889. See the
[initial view fit](health-usage-entry-phase-2026-09-26.md).

The decoded Health title `0004001000022300` layout
`btmbtn_LZ.bin/blyt/BtmBtn_White.bclyt` has SHA-256
`a6e45258ad317687584980f0831177204475deecec8de73d8ee664f7d7b89d99`.
Its centered text panes use source size 17.5×21 and a 312×21 pane. The white
`T_BtnB_00` shadow has source Y translation 23.5; foreground `T_BtnF_00` uses 25.
The native message supplies the Back icon and label. Their fractional placement
must be retained; rounding either pane would change source geometry.

Previously the centered shadow was rasterized on local integer pixels, then
Canvas resampled that raster at its half-pixel LCD translation. The existing
[direct text sampling path](settings-other-direct-text-sampling-2026-09-26.md)
avoids this second filter, but only accepted middle-left alignment 3. This
change also permits middle-center alignment 4 under the same bounded conditions:
single-line alpha font, zero extra spacing, integer pane dimensions, unit upright
transform and explicit `textSampling: 'lcd'`. Health's `BtmBtn_White` is the only
new caller opting in. Source layout, message, glyph quads, scroll and default
sampling remain unchanged.

A fresh offline full 320×240 comparison against the same native screenshot
reduces the lower residual from **147 to 22 pixels over threshold 2**; RGB MAE
falls from 0.1188758681 to 0.1093619792. The remaining 22 pixels occupy glyph-edge
columns x151 and x172, within y218–233, with maximum channel difference 78.
They are unresolved; no endpoint nudge or color correction was added. Article,
header and scrollbar remain outside the residual. Production recapture is still
required for this new change.

Regression checks cover centered and left-aligned glyph coverage from the source
mask, fractional phase cache identity, whole-pixel composition, scaled-pane
fallback and unchanged default sampling. The bitmap-font, native-renderer,
Health article and Health scroll suites pass **67/67**; typecheck passes.
