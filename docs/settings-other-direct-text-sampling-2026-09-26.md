# Other Settings text sampled at LCD pixel centers

Base `f445301`, following the executable-derived centering in
[the source centering note](settings-other-source-centering-2026-09-26.md).
Evidence: source-rendered and tested; live native/browser recapture is pending.

## Source rule and rendering correction

The original cached font path retains glyph geometry and source-atlas UVs, then
uses linear font-sheet sampling at fragments. It does not rasterize each text
pane into a bitmap and subsequently filter that bitmap at a fractional screen
position. The pinned source evidence is the shared HOME font library executable
SHA-256 `243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`:

- `runtime/reference/font-sampling/07-glyph-quad-and-uv.asm`,
  `0x1abff4..0x1ac01c`, stores cached glyph dimensions/positions and source UVs.
- `05-cached-texture-setup.asm`, `0x1ac830..0x1ac860`, emits the font's linear
  min/mag filter flags to PICA texture parameter register0x83.
- The bounded source trace and atlas-padding proof are summarized in
  `runtime/reference/font-sampling/report.md` and repository
  [native font raster notes](native-font-raster.md).

The source-derived Settings group position95.19999694824219 exposed the second
filter: glyphs were first sampled at pane-local integer pixels, then Canvas
sampled that cached image again when placing the pane at its fractional origin.

The renderer now offers `textSampling:'lcd'`. For single-line, left-aligned,
alpha-only text with unit upright transforms and integer pane dimensions, it
adds the actual LCD fractional origin to glyph quads **before** sampling the
unchanged source atlas. The backing grows to contain that phase, and composition
subtracts the phase so it lands on whole LCD pixels without another filter.
The cache includes fractional X/Y phase; integer translations reuse the same
raster. Source pane dimensions, layout alignment, glyph advances, endpoint
arithmetic, atlas texels, material colors and clip rectangles are preserved.
Material interpolation uses the original pane-relative Y coordinate.

The opt-in was first enabled only for Other Settings' validated `CommonBG_U_00` draw.
A trial enabling every eligible text pane also changed a DS Profile lower pane;
that unverified expansion was not retained. Worker U23 on 6 October applies the
same `CommonBG_U_00` bind to every modern Settings title that uses that layout
(same single `TextBoxTitle_00` pane). DS Profile, Settings main and Manual stay
off it. See [settings-title-sampling-2026-10-06](settings-title-sampling-2026-10-06.md).
Worker U24 binds Software / Extra Data `SMng_U_01` `TextBox_03` through the
existing writer-0x101 allowlist (`alignment` 3 / `lineAlignment` 2, LCD left
35.5). See [settings-sdcard-label-2026-10-06](settings-sdcard-label-2026-10-06.md). Other alignments, transformed panes,
multiline text and all unopted draws retain their existing behavior. This is a
reusable sampler option, not a glyph-specific adjustment or replacement graphic.
No shader or asset bytes change. Resource provenance is identical to the
preceding centering note (CommonBG, English `settings_title`, shared A4 font).

## Native source replay and regressions

Same genuine Azahar target:
`reference/screenshots/_26.09.26_04.31.13.302.png`, SHA-256
`424ffb45d0fe4e82fd002d564a6ffe7f8af08dac5c984e444d5af09b56382c40`.
Private capture/artifact root: `/Users/paramveer/.codex/3ds-artifact-overflow/`.
Unmasked max RGB-channel threshold2/255, region(95,20)..(305,58):

| Source replay | Left region(95..149) | Text region(150..304) | Combined |
| --- | ---: | ---: | ---: |
| Source centering, pane-local cached text |50 |971 |1021 |
| Original atlas sampled at LCD centers |0 |8 |8 |

The old50 left-region differences included the beginning of the title; the
icon and text were not independent nonoverlapping objects within that split.
This pass changes only text sampling. The eight residual pixels are
x272..279,y50: the lower edge of the `g`, with max channel errors
24,50,63,69,71,62,42,13. Their endpoint/coverage behavior remains open; no epsilon
or extra glyph row was introduced. Together with the two existing HUD pixels,
the expected production upper result is approximately10, pending matched capture.

Across the Settings verifier's outputs only `other-top.png` changes. All main
renders and all50 lower renders are decoded-pixel identical, preserving Other
lower0. The source verifier passes five main selections and44 subpages.

114 focused font/renderer/Settings/Health tests pass, with one existing TODO;
typecheck and diff-check pass. Tests check two-axis source alpha interpolation,
phase-aware cache reuse, whole-pixel final composition and the unchanged scaled
pane path. Existing non-Settings picture/material tests also pass.
Diagnostic images, comparison JSON and logs are in lane
`.local/settings-title-phase/`. No browser or Azahar operation was performed.
