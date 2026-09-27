# Health HOME banner residual — 27 September 2026

The lowest-residual paired source sample uses Health `COMMON` skeletal frame
120 and HOME wallpaper material frame 0. With the precise live clock and
battery mask, its native/browser diff still reports **11,892 upper / 47,678
lower** pixels above 2/255. The native upper LCD is in
`captures-20260927-clean-origin/reference/scenario-matrix/v1/captures/home-health-source-frames-20260927/native/combined.png`;
the browser upper LCD and contact sheet are in the adjacent
`home-health-banner120-wallpaper000-20260927` capture directory under that
same private root.

The inspected upper crops put the warning icon and two-line title at
substantially the same size and location. The delivered EUR textures are the
firmware-derived warning and title artwork. Their remaining threshold pixels
are consistent with small raster/material edge differences, but the native
Health clip frame was not observed, so frame 120 is only the best tested
candidate and cannot establish a pose or scale defect. The upper report also
contains wallpaper and HUD residuals; the lower count is dominated by the
unmatched HOME layout. No source-supported runtime transform, scale or color
correction is justified by this pair. Keep this as an open comparison until a
matched native Health banner phase and HOME state are captured.
