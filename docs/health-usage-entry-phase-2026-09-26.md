# Health Usage entry: source frame and scroll fit — 26 September 2026

The coordinator opened isolated Azahar HOME → Health with A, then touched Usage
Precautions using the U mapping at lower-LCD (240,170). The genuine combined
400×480 screenshot is
`/Users/paramveer/.codex/3ds-artifact-overflow/reference/screenshots/_26.09.26_04.46.01.113.png`,
SHA-256 `1a98026014a3a162c56ec12e02bdb9d84ad74a06e0806e569a510430e9440702`.

The existing private `health-toploop-fit/native-fresh-fit.mjs` machinery was
adapted temporarily to compile current Experience-lane sources and sample all
integer `Bg_U_00_TopLoop` frames 0–719. The lower screen was rendered through the
current stock presenter as `health-safety/document`, topic `usage`, with
`healthScrollView(healthScrollCreate(healthDocumentRows.usage))`:
`paneY=0`, `thumbY=77`, `selectFrame=0`.

Every raw RGB pixel was compared: upper 400×240 at (0,0), lower 320×240 at
combined offset (40,240). No mask, rescaling, color correction or runtime edit
was used.

| Sample | Pixels with maximum RGB difference >2 | RGB MAE |
| --- | ---: | ---: |
| Upper source 327 / 687 | **0 / 96,000** | 0.0705 |
| Upper source 326 / 686 | 390 / 96,000 | 0.1611493056 |
| Upper source 328 / 688 | 388 / 96,000 | 0.1232083333 |
| Lower Usage initial scroll | **147 / 76,800** | 0.1188758681 |

All 147 lower residual pixels lie in the footer Back icon/label bounding box
x127–190, y218–235; maximum channel difference is 79. Header y0–27 and
article/scrollbar y28–210 each have zero pixels over threshold 2. Visual
inspection confirms the same title, article rows and initial scrollbar pose.
The lower difference therefore does not support a scroll-position correction;
the footer raster remains unresolved.

Use **`lcdHealthFrame=327`** for the coordinator's browser capture of Usage at
initial scroll. Frame 687 is the same repeated pose, not a recovered loop
half-cycle or launch origin. Production comparison remains necessary; these
are offline source-render scores. Firmware provenance is unchanged Health title
`0004001000022300`, `bg_LZ.bin/anim/Bg_U_00_TopLoop.bclan`, SHA-256
`c0fa9a144892bf146eedf53edd34ba13edc9622294a8ad2fbe38c5024f402ff6`.
