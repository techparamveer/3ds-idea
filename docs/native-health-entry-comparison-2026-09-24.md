# Health entry: matched native lower LCD

The original EUR 10.7.0-32E Health and Safety Information title was launched
in Azahar 2126.1.2 with OpenGL, using a copy of the isolated reference
profile and application under
`/Users/paramveer/.codex/artifacts/native-settings-2026-09-24/`.
The normal Azahar profile was not used. Azahar's own **Capture Screenshot**
action saved a 400 × 480 PNG at
`/Users/paramveer/.codex/artifacts/native-settings-2026-09-24/screenshots/Health and Safety Information_24.09.26_10.30.45.498.png`.
The image contains the 400 × 240 upper LCD and the 320 × 240 lower LCD
centred at x = 40 in the lower half. The settled native entry has **no
precaution button selected**.

The previous source render selected the first button on entry, making it dark.
The live Health adapter now carries a separate inactive-entry visual state.
`SafeTop_D_00_Select` remains at frame 0 for all three buttons until
directional input, while the logical first row remains available to the
existing portfolio input path. No source pack or user data changed.

The source renderer was rerun after the change. Cropping the native screenshot
to `(40, 240, 360, 480)` and comparing RGB channels at the same 320 × 240
resolution gives mean absolute error **1.46/255**, down from **15.30/255**
before the correction. **96.73%** of pixels differ by at most 10 in every
channel. The native crop and new render are at
`/Users/paramveer/.codex/artifacts/native-health-entry-2026-09-24/native-bottom.png`
and `render/health-safety-main-bottom.png` beneath that directory. The
57-pair stock source-render verifier passed with no renderer diagnostics;
the focused module test, typecheck and production build passed. In the live
browser, Health entered with three white buttons, physical Down highlighted
General Precautions, A opened its article, and warnings/errors were empty.

This verifies one settled lower LCD pose, not strict 1:1 acceptance. The
upper screen contains a moving background, so this capture is not a matched
upper frame. Native first-press focus behavior, article LCD pixels, timing,
audio and browser perspective sampling remain open. Native input mapping in
this isolated trial did not reliably navigate past the initial Settings or
Health page; no behavior was inferred from those failed attempts.
