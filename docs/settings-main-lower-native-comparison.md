# Settings cold MAIN lower LCD residual

25 September 2026. This audit compares the settled source-rendered Settings
MAIN lower LCD with one isolated Azahar EUR 10.7.0-32E cold-entry capture.
The existing lower render is `presentation/settings-main-cold-2026-09-25/main-cold-bottom.png`
under the SSD artifact root, SHA-256
`720931155b7e8133d2f16b844f3d66d8fa0aa3fbc640e09ff215e605ceb4d174`.
The native image is
`reference/screenshots/System Settings_25.09.26_13.03.55.629.png`, SHA-256
`a02c39244e7175da7d0eaa8e0678b6518b3f4b058f9f0c53b014e92c66b53558`.
Its lower LCD is the exact crop `(40,240,360,480)` in the 400 × 480 PNG.
Neither image is a live browser capture.

[`scripts/audit_settings_main_lower.py`](../scripts/audit_settings_main_lower.py)
reproduces the comparison with Pillow and NumPy. It takes absolute `--native`,
`--render` and `--output` paths and writes `comparison.json` and a fivefold
difference map. The output for this comparison is
`presentation/settings-main-lower-residual-2026-09-25/` under the SSD root.
Scores are mean absolute RGB channel errors out of 255, without registration,
color correction or resampling.

| Region, exclusive rectangle | MAE | Absolute RGB error | Share of whole error |
| --- | ---: | ---: | ---: |
| Whole `(0,0,320,240)` | 2.554 | 588,479 | 100% |
| Main area `(0,0,320,208)` | 2.937 | 586,527 | 99.7% |
| Close footer `(0,208,320,240)` | 0.064 | 1,952 | 0.3% |
| NNID heading `(50,6,302,30)` | 13.340 | 242,048 | 41.1% |
| Four large-button label boxes combined | — | 324,414 | 55.1% |

The heading is the largest single localized residual. Sampling the source
render one pixel to the right within its box lowers that box's MAE from
13.340 to 4.799; every large-button label box scores best at zero offset in
the same ±2 pixel search. This is a *diagnostic registration trial*, not a
proposed layout move. The remaining glyph-edge differences are visible even
where the labels align. The original button artwork, colored icons, background
and Close bar have much smaller differences; the footer's source layout and
message binding are already supported by the [footer audit](settings-main-footer-source-audit.md).

The heading flows through original `top_nnid` in the English `mset` bank
(style 307, font scale 0.64, zero character spacing) into
`I_TopTs/TextBox_00` (236 × 30, centered alignment). The large buttons use
their own original `I_Top*` text panes and English labels (font scale 0.7).
`drawNativeSettingsMain` does not override their size or translation;
`BitmapFont.drawNative` and `NativeLayoutRenderer.text` center and rasterize
the glyphs. The comparison therefore localizes the remaining mismatch to
the **text presentation path**, especially the heading's centering and glyph
edge coverage. It does not establish whether the exact one-pixel cause is
NintendoWare rounding, the source font raster, the Canvas material path or
Azahar output. The shared centered-text implementation is documented from a
HOME writer trace, which is insufficient to assert Settings uses identical
rounding for this pane.

No live code or asset was changed. A heading-only translation would fit one
capture while contradicting the delivered source pane unless its native writer
behavior is traced. A general font change would affect many unrelated screens.
The next bounded source step is a Settings text-writer trace for centered
single-line and multiline panes, followed by a matched second capture. This
one-frame audit does not establish transition timing, return focus or browser
pixel fidelity.
