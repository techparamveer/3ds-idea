# Camera guide button glyph sampling

Camera guide buttons now retain their source pane dimensions when placing the
original shared-font glyphs on the LCD. This addresses the page-1 Next and
page-2 Back glyph residuals identified in the
[lower-screen audit](camera-guide-lower-residual-audit.md). It does not repair
the separate shoot backdrop, top controls or page counter.

## Source geometry and renderer change

The EUR Camera `0004001000022400`, content `0000001a`, `lyt/C.LZ/Dlg` delivery
has source SHA-256
`101e184056296119b5b17021ff148211b49090a5729c727d1113fc27b3f47957`.
The unchanged source `C_DlgGuid1BtnW/Guid1TxtW` pane is
120 × 25.200000762939453; `C_DlgGuid2Btn/Guid2TxtB` is
80 × 25.200000762939453. Both use middle-center alignment 4 and explicit
center line alignment 2. Page-2 `Guid2TxtW` is 80 × 24. The shared
`cbf_std.bcfnt`, RI.mstl styles, message colors, pane transforms and animations
remain the source inputs.

Previously the renderer used the allocation height `ceil(25.2) = 26` for
text placement, then scaled that raster back into 25.2 logical pixels. This
changes both the center and glyph coverage. The Camera guide now opts into
`textSampling: 'lcd-source-size'`: logical source dimensions reach the writer,
the raster is sampled at final LCD centers, and its backing pixels are composed
without a second rescale. Cache identity includes the logical dimensions.

For a single centered line, explicit centered line alignment has the same
origin as automatic centering. The option uses the existing
[NintendoWare writer arithmetic and original alpha sampler](native-font-raster.md),
including float32 advances and FINF/TGLP metrics. No sampled-color correction,
fitted translation, replacement font or coverage adaptation is introduced.
This is a reuse of the established writer contract, not a new Camera executable
replay. The option remains limited to upright unit transforms, single-line
alpha text and zero added character spacing. Existing stock callers keep their
previous rendering path; multiline Camera guide body and page counters do too.

## Bounded visual verification

Private evidence is at
`/Users/paramveer/.codex/artifacts/camera-guide-glyph-20260926/`, including the
reproducible CPU Canvas probe, before/after PNGs, native/before/after contact
sheets and `report.json`. Both contact sheets were inspected. The probe renders
original delivered resources with the production painter and compares existing
native lower crops; it does not operate the browser or emulator.

| Native comparison region | Before pixels over 2/255 | After | After RGB MAE | After maximum error |
| --- | ---: | ---: | ---: | ---: |
| Page-1 Next, `(104,184)..(232,224)` | 241 | 0 | 0.02480 | 1 |
| Page-2 buttons, `(76,184)..(260,224)` | 327 | 5 | 0.04230 | 13 |

The native page-1 capture and page-2 replay screenshot are the same hash-pinned
files documented in the lower-screen audit. The CPU Canvas baseline differs
from the production browser's 195 page-1 glyph residuals, so these numbers are
supporting source-render evidence. Fresh integrated browser LCD comparison is
still required, including later guide pages. Five page-2 pixels and the
separate lower-screen defects remain unresolved; no whole scenario is accepted.

The 58 focused bitmap-font, native-renderer and Camera tests pass, as do
`npm run typecheck`, `npm run build` and `git diff --check`. Regressions cover
both source button layouts, explicit/automatic centered writer equivalence,
exact fractional dimensions reaching the writer, whole-pixel composition and
preservation of existing callers' fallback behavior. Shared browser, Azahar,
server and other worktrees were not modified.
