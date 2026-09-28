# Other Settings title glyph residual audit

This audit compares the preserved native upper LCD against the production
browser captures before and after `c55a27f`. The pair lives under the private
`reference/scenario-matrix/v1/captures/` root as
`settings-other-1-touch-browser-20260926` and
`settings-other-1-text-raster-browser-20260926`. Both use the same native
`combined.png` (SHA-256 `09c625dd1a8a2080865ff24f672a0fd0975827cbf81dcd7f8310dd993d4a9d51`).
The browser upper hashes are respectively
`9cf4f24aff59e8999e113ef8c07745385c2d153a7935318a254be63bb14f666f`
and `efda9969da2e710a850a3062b51213889209a437b6a7bfbc8c913a0cdad07463`.

In the half-open glyph rectangle `(150,20)..(305,58)`, the count with any RGB
channel more than 2/255 from native changes from **958 to 961**. Only 176
glyph-rectangle pixels changed between browser captures. Of these, three
entered tolerance, six left tolerance, and 167 retained their threshold status.
The entire upper browser image changed at 177 pixels; the extra pixel belongs
to the adjacent icon rectangle. The later pair remains a failed comparison,
with 1,520 upper pixels over threshold and no mask.

The native and browser glyphs occupy the same integer position, and their
opaque orange `(233,137,14)` agrees. Their largest differences follow partial
coverage on the letter edges. The delivered layout's `TextBoxTitle_00` is
middle-left (alignment 3), 340 × 26, with source style 102 at scale 0.85 and
zero character spacing. `c55a27f` takes the source-traced pixel-centre A4 path
for that single line. The original font's glyph metrics and sheet pixels are
unchanged. The previous source-render improvement of 993 to 961 pixels did
not predict an improvement in the actual production capture.

As a diagnostic only, bilinear resampling of the captured browser image about
0.2 pixel left reduces mean RGB error in both the icon and glyph rectangles.
This is consistent with a shared subpixel placement or projection difference,
but it does not identify a native transform: the current 95-pixel `Null_Title`
translation is already a capture fit, while the CLYT group translation is zero
and its children have Z=5. An arbitrary fractional translation would fit one
still without proving the source projection or other Settings states. The
source trace establishes the font quad/UV and linear sampler, but explicitly
does not establish pixel-identical upper-LCD projection or PICA interpolation
precision. No font-size, color, offset, or raster code change follows from
this evidence. Native projection and edge sampling remain open.

## Subsequent production evidence: matrix v31

[Matrix v31](/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260926/reference/scenario-matrix/v31/matrix.json) supersedes the earlier residual counts above. Source sibling row widths reduced Other page 1 lower from 702 to 45, with upper 1,520. The `94463cd` horizontal glyph half-pixel coverage correction then yielded **1,477 upper / 3 lower**; the remaining lower region is `(129,168,1,3)`. Settings main changed from 102/37 to **59/20**; its earlier row-only regression was pixel-identical to the prior main capture. Native font atlases/layouts remain source-derived. Empty masks, unexplained pixels, different HOME entry histories, and open motion/audio keep every pair **fail**. See the [production record](progress-2026-09-24.md#settings-row-width-and-font-boundary-production-checks--26-september-2026).

## Float32 endpoint follow-up

[Matrix v32](/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260926/reference/scenario-matrix/v32/matrix.json) records `600bf6f` at **1,477 upper / 0 lower** pixels above 2/255. Preserved native float32 glyph endpoints remove the prior three lower pixels. Maximum lower RGB delta remains 2 (mean 0.15514323), so this is an unmasked static-frame threshold match, not byte equality. Main regression remains **59/20**. Upper residuals, unmatched HOME history, motion and audio keep the whole scenarios fail. No atlas, pane placement or native assets changed.
