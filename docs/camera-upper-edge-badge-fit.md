# Camera upper stereo browse edge and badge — 28 September 2026

The published EUR `P_FinderVS_U` layout puts four 16 px `Edge0`–`Edge3`
picture panes under `FndEdge`. Their `P_Fnd_Edge0.bclim` material produced the
soft black perimeter over the browser's photo. `ViewInfo` is a separate root
child at `[183,103]`; its `3DView` picture uses `P_IconOth_3D.bclim`.

Gallery and photo views carrying explicit private stereo verification metadata
hide only those four edge panes and show `ViewInfo/3DView`. Ordinary mono
portfolio photos retain their previous 2D badge and finder edges. Folder and
empty upper views also retain the source edge panes.

The [raw upper comparison report](/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260928/reference/scenario-matrix/v101/comparisons/camera-edge-badge-variant/report.json)
compares the preserved native HNI capture with the [live browser upper](/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260928/reference/scenario-matrix/v1/captures/camera-edge-badge-variant/browser/upper.png):
**33,997 pixels over 2/255, RGB MAE 2.6967**, down from the integrated
baseline **43,996 / 15.9073**. The badge is visible but white where the native
badge is dark; this remains a failed whole-scenario comparison. The lower result
is not assessed here because this isolated branch lacks the later date-group
change.
