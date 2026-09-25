# Settings single-line native text raster

25 September 2026. This pass follows the [cold MAIN lower-LCD audit](settings-main-lower-native-comparison.md). The original `mset` English messages `top_nnid` (style 307) and `top_settings` (style 302) are single lines with `lineSpacing` −2 and −3. Their source panes are centered `TextBox_00` in `I_TopTs` (236 × 30) and `I_TopRBs` (the Other Settings button). The shared font is the delivered `cbf_std.bcfnt` sheet and metrics. The pane positions, messages, font scales and material bytes are unchanged.

`BitmapFont.drawNative` previously required `lineSpacing === 0` to enter its source-traced centered glyph path. A line-spacing value has no effect on a single line, so these two Settings messages instead took the generic Canvas path. That path uses fractional centering and Canvas edge coverage. The centered path uses the [traced NintendoWare half-extent rounding and pixel-center alpha sampling](native-font-raster.md). The correction now selects it for any centered single line with automatic line alignment and zero character spacing, regardless of unused line spacing. No Settings pane translation or screenshot-fitted offset was added.

The original native image is `reference/screenshots/System Settings_25.09.26_13.03.55.629.png` (lower crop `(40,240,360,480)`). The baseline is `presentation/settings-main-cold-2026-09-25/main-cold-bottom.png`. The corrected source render and audit are under `presentation/settings-text-raster-trial-2026-09-25/` in the firmware SSD artifact root. Corrected PNG SHA-256: `92fe392b5f001127d8bc51a3cfa9346fe2d539f164d2fdf6c1a589a30423aaea`. The same audit script compares exact 320 × 240 RGB pixels without registration or color correction.

| Region | Baseline MAE / 255 | Corrected MAE / 255 |
| --- | ---: | ---: |
| Whole lower LCD | 2.554 | 1.177 |
| NNID heading | 13.340 | 0.314 |
| Other Settings label | 4.737 | 0.275 |
| Internet label | 4.620 | 4.620 |
| Parental label | 4.111 | 4.111 |
| Data label | 6.970 | 6.970 |
| Close footer | 0.064 | 0.064 |

The heading's best ±2-pixel diagnostic registration is now `(0,0)`; it was `(1,0)`. A regression uses the original delivered messages and font metadata to assert that their nonzero line spacing renders byte-identically to zero spacing through the centered alpha path. The Settings verifier renders five main selections and 44 subpage pairs after the change.

The three two-line labels still use the generic path. A trial applying pixel-center alpha sampling while retaining its existing line placement only reduced whole-LCD MAE from 1.177 to 1.149, with each multiline box still above 3.9. The native writer's multiline measurement, per-line centering and vertical rounding have not been traced for these panes. That source trace, plus a matched second native capture, gates a shared multiline layout correction. This pass is a source render and native image comparison, not a live browser capture or evidence of transition timing.

Focused font, renderer and Settings tests passed (58 passes, one existing todo); TypeScript typecheck and the production build passed. The full `npm test` run reached 1,273 passes but 39 model/source fixture suites failed because this sparse UI worktree omits their GLB and texture files (for example `model/candidates/joshua-xl/silver-abxy-ink.glb`). The font and Settings suites passed in that run. The coordinator owns the browser and Azahar sessions, so no live browser inspection or second native capture was performed here.
