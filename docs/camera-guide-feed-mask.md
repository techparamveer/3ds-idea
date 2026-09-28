# Camera Welcome pages 3–5: unobscured live-feed mask

The reference Camera uses the configured Renu photo feed. The portfolio keeps
Camera read-only and paints the welcome finder black. That intentional feed
replacement is the only difference covered by this mask. Capture remains
inert, as recorded in `portfolio-feature-map.md` and
`src/os/stock-native-camera.ts::drawNativeCameraGuide`.

`scripts/native-compare/camera-guide-feed-mask.json` masks **5,777 upper-LCD
pixels**, represented by 14 rectangles. It masks no lower pixels. It is valid
only for the settled Welcome pages 3–5, whose illustrations are `P_Guid05_U`,
`P_Guid01_U`, and `P_Guid02_U`. Pages 1–2 have no upper guide frame and must not
use this mask.

## Source derivation

`node scripts/native-compare/camera-guide-feed-mask.mjs` regenerates the mask
without reading captures or diff images. Its inputs are the delivered Camera
`lyt-C-Dlg.json`, `lyt-P_Finder_U-arc-LZ.json`,
`lyt-P_Guid_U-arc-LZ.json`, and the dialog's referenced source texture PNGs.
The JSON records each input's SHA-256. The original resource identities are
retained in those packs' `resourceSources` tables.

`C_DlgGuid_U` mounts `GuidWdwU_L` at centre (-10,0), size 368×230,
and `GuidWdwU_R` at (184,0), size 20×230 with mirrored X. At the
400×240 LCD centre this gives the frame envelope (6,5)–(394,235).
The generator uses the delivered picture UVs, material TEV stages, texture
matrices, filtering and decoded texture alpha through `rasterNativePicture`.
Only output pixels with **zero frame alpha** can be masked. Nonzero alpha,
including every partially transparent rounded border pixel, stays compared.
The frame's original BCLYT SHA-256 is
`63b7f51b16405dd7dd40e1cfc090cf9094dba9864e824aa4a4f287735aa426e1`.
Its alpha-bearing `C_DlgChBase.bclim` source SHA-256 is
`a9fa4c68c3ad4222c9e5da2df047b2bc8cf38d227ab296e2e4e04d0bf4a18b03`.

Every page illustration's complete source pane footprint is protected. The
finder's PhoRem, Storage and ViewInfo owner/child bounding unions are also
protected, including transparent padding. This deliberately leaves some
live-feed pixels around the HUD unmasked to avoid hiding text or icons.
This is a conservative mask of strictly unobscured feed, not a claim to exclude
all pixels influenced by the feed. No comparison tool extension was needed.

## Reused capture comparison, 26 September 2026

Inputs were the coordinator's `camera-guide-page{3,4,5}-modal-0d7bfea` pairs.
No fresh browser or Azahar capture was made. New reports and contact sheets
are alongside each preserved pair in `diff-unobscured-feed-mask/` under:

`/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260926/reference/scenario-matrix/v1/captures/`

| Welcome page | Raw upper pixels >2 | Masked upper pixels >2 | Lower pixels >2 (unchanged) |
| --- | ---: | ---: | ---: |
| 3 | 7,615 | 1,849 | 2,480 |
| 4 | 7,615 | 1,849 | 2,093 |
| 5 | 7,615 | 1,849 | 1,401 |

All three masked upper contact sheets were visually inspected. The guide
illustrations align; visible residuals remain around the reserved HUD areas
and the rounded frame corners. A mask that simply removed every feed-influenced
pixel would also remove partially transparent guide-border evidence, so it
would violate the requirement to retain guide pixels. The residual is
**not a whole-scenario pass**. Lower text/chrome differences are untouched.

Validation: `node --test scripts/native-compare/*.test.mjs` passes all four
checks, including reproducibility against source assets, zero coverage of
nonzero guide alpha and protected illustration/HUD areas, and no lower mask.
The app was not changed; no application rebuild was needed.
