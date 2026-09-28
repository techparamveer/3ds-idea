# Other Settings title placement against native capture

The isolated Azahar 2126.1.2 OpenGL capture of EUR 10.7.0-32E **Other
Settings, page 1** is
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/native-settings-2026-09-24/other-page1-opengl.jpg`
(SHA-256 `38fc0d4cc78144064b6378969cbcb19cb702cb59d4e2588ca631a777e9f91192`).
Its settled upper LCD centers the orange icon/title assembly above the dotted
rule. The delivered `CommonBG_U_00` layout starts `Null_Title` at (0, 0),
placing the assembly near the left edge in our settled source render. The
`CommonBG_U_00_SceneIn_01` clip changes alpha and title material color, but
has no `Null_Title` translation track. A 96-pixel x translation of that
source group aligns its icon and title with the captured pose. This correction
is scoped to the four Other Settings pages, which share that title. It does
not alter the original resource pack or assume the placement of other titles.

The paired 400×240 and 320×240 source renders were produced with
`scripts/verify-stock-settings.mjs` before and after the change, using the
same fixed date, native font and public pack. The verifier now renders the
native white touch-entry pose on page 1. For comparison, the native capture's
upper rectangle `(304,0,925,373)` was bilinearly reduced to 400×240 and the
lower rectangle `(366,373,863,745)` to 320×240. Against the JPEG, upper
mean absolute RGB channel error changed from **5.810 to 4.915** overall and
from **12.415 to 6.611** in title rows 18–54. The lower screen was unchanged
and has error **4.377**. The corrected pair and native crops were visually
inspected at logical LCD resolution.

This is a settled-pose comparison. JPEG compression, emulator-window scaling,
background color bias, text raster differences and the fixed status-telemetry
adaptation remain. The capture cannot establish title motion, page changes or
strict 1:1 fidelity. Browser and new Azahar operation belong to integration.
