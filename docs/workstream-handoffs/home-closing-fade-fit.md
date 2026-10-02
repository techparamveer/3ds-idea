# HOME lower closing-dialog fade-out fit handoff

Base: `a79ce5503d8686a789124b9ae6f67f9b4f937f4c`

Branch: `codex/home-closing-fade-fit-20261002`

## Outcome

The fresh 100%-speed sequence contains exactly one captured lower-screen exit
intermediate. At that sample the full-screen lower mask is already absent: the
strict 320×4 top probe is byte-identical to the following ordinary-HOME
underlay. The settled probe has 0.490914 of the underlay's mean luminance,
consistent with the source layout's black pane at alpha 130/255; the
intermediate and underlay both measure 229.809054 while the settled dialog
measures 112.816448.

The dialog footprint does not behave as one linearly faded parent in that
same sample. A selected dark-text probe retains a 0.088299 endpoint
projection, the expected left/right/top window boundaries retain only
0.003218/0.001116/0.009317 of their settled underlay-subtracted contrast, but
selected bright gray surface pixels retain 0.867655. These are composited-pixel
projections, **not pane alpha**: the mask and HOME underlay also change between
the endpoints. Their large disagreement nevertheless rejects assigning one
of those fractions literally to all of `Dlg_A_D_00`.

The sole intermediate also cannot resolve dialog geometry. The expected
settled boundaries are no longer the strongest local gradients, so a moved
edge cannot be localized. There is no captured evidence for scale, but there
is also insufficient evidence to prove fixed geometry during exit.

No native timing curve is established. Capture-list order is the only valid
ordering here; filenames, mtimes and emulator-speed percentages are not native
frames or durations. The sequence is neither input-matched nor phase-matched.
A second attempted slow capture recovered only after native had already
closed, so it contributed no PNG intermediate and is not treated as evidence.

## Reproducible evidence

The deterministic analyzer is
[`scripts/fit-home-closing-fade.mjs`](../../scripts/fit-home-closing-fade.mjs),
with pure geometry, projection, edge and Hermite coverage in
[`tests/fit-home-closing-fade.test.mjs`](../../tests/fit-home-closing-fade.test.mjs).
It requires absolute paths, verifies each of the seven fresh, 37 historical
and 81 gap-sequence PNG hashes, and writes only to the internal
artifact-overflow tree.

- report: `/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-closing-fade/fit/home-closing-fade-fit.json`
- report SHA-256: `bf7df77e9e07392e3ab4e367b229c407e5b5e2e967a88ced542ff75d9542fce5`
- fresh manifest SHA-256: `642efca5ec0b7c9dd448a3622695a182d556f2dca0ea387128248031fbb7863e`
- historical manifest SHA-256: `7580d050f639ca238c5897be767d0632ad3e6fc9278fa820f1c3511e67a6a391`
- 81-capture gap manifest SHA-256: `7b3fa203ddd3f3a2ed798afe5e94c1e7193c983bb5250c7a60e03338303a4e73`
- dialog pack SHA-256: `8a7b72cd0e69601da7938503f648c18286fb4bcb2bf27fc0c33839dd4e0dca17`
- dialog-mask pack SHA-256: `675959c0268ed340a8d926836370a535c4a09b3acf2724b85ef9243a43348e4f`

Selected fresh captures:

| Role | List index | Capture SHA-256 |
| --- | ---: | --- |
| Settled closing dialog | 2 | `a33cdb74b96f8456ba430be27e840977d8c6de71707bd5d3cdc47506eeb74afa` |
| Sole exit intermediate | 3 | `4dda7f4eb031869bbe771415c7c2636805aeb32fff4052315a268b5aa1438e3c` |
| Ordinary-HOME underlay | 4 | `6eff1af8a765730b9942c5c4ba98ebd96890efce272d489cd1d89eb68441591c` |

For every measured region, the analyzer projects the intermediate from the
ordinary-HOME endpoint (0) toward the settled closing-dialog endpoint (1) by
least squares over 8-bit RGB values. The projection is useful for comparing
visible residuals but is not a compositor model.

## Rectangles and measurements

All coordinates are half-open in the combined 400×480 PNG. The lower LCD is
x 40..359, y 240..479. The source dialog window is logical x 20..299,
y 20..219, hence combined x 60..339, y 260..459. The analysis stops its main
window probe at y 453 to avoid the independently changing Close/Resume-to-Open
footer. The source shadow is 312×232 and extends outside the window, so only
the very top and far corner strips are used as strict mask probes.

| Probe | Combined coordinates / selection | Pixels | Retained projection | Fit RMSE |
| --- | --- | ---: | ---: | ---: |
| Mask top | x 40..359, y 240..243 | 1,280 | 0.000000 | 0.000000 |
| Mask corners | x 40..43 and 356..359, y 244..453 | 1,680 | 0.005559 | 0.478056 |
| Dialog main, footer excluded | x 60..339, y 260..453 | 54,320 | 0.073074 | 12.175607 |
| Dark text | endpoint-selected inside x 105..294, y 345..379 | 509 | 0.088299 | 10.998697 |
| Bright surface | endpoint-selected inside x 80..319, y 280..344 | 8,917 | 0.867655 | 2.529521 |

The top mask probe's intermediate-to-underlay difference is exactly zero in
all RGB channels. The corner strips differ by 0.800050 RGB levels RMS with a
maximum absolute difference of 1, while their endpoint projection is only
0.005559. That sub-level edge/shadow rounding does not support a retained
full-screen mask.

For the text selection, per-pixel luminance endpoint ratios have p10/median/p90
of 0.045068/0.087147/0.132169. For the bright-surface selection they are
0.835467/0.850359/0.905511. The large separation is why a single dialog-parent
fraction is rejected as a literal fit.

Underlay-subtracted edge evidence uses the authored settled boundaries and
avoids claiming a threshold-derived opacity-dependent bounding box:

| Boundary | Settled strength | Intermediate strength | Normalized retained |
| --- | ---: | ---: | ---: |
| left x 59.5, y 280..339 | 187.031383 | 0.601797 | 0.003218 |
| right x 339.5, y 280..339 | 185.539653 | 0.207147 | 0.001116 |
| top y 259.5, x 80..319 | 175.037677 | 1.630806 | 0.009317 |

These values show the original boundaries are effectively gone; they do not
locate replacement boundaries and therefore do not decide fixed versus scaled
geometry.

## Historical-sequence audit

The 37-capture 5%-speed sequence does not add an exit sample. Its lower LCD
changes through index 16 as the closing presentation appears, then indices
16..36 are byte-identical lower crops with SHA-256
`fca2f9433a19f700c6c6566984fffd811eb4cbf891b412ed3120f20b6b7244f1`.
The last nonzero lower change is index 15→16 (RMSE 1.295074, maximum absolute
channel delta 88). Therefore the sequence ends by holding the settled closing
dialog for 21 captures; it never observes fade-out.

The later 81-capture 5%-speed run also misses the exit inside its explicit
observation gap. Its list index 64, SHA-256
`d48ed843b0759ae103b7c8eb371e83f64ef14ad5ce44cccea8de6f6dee7131d8`,
is byte-identical to the fresh settled dialog across the complete lower LCD.
The next observed file, index 65, SHA-256
`c91e04a5c1a090d40f2f0cb26942e49d982c47d4c5a0c94886d192070e501718`,
has a mask-top probe byte-identical to the fresh ordinary-HOME underlay. Its
whole lower LCD differs by 6.759098 RGB levels RMS because ordinary HOME has
independently changing icon/footer content. The before/after pair bounds the
state change but supplies no intermediate and no duration: the manifest itself
records that the actual exit occurred between observations.

## Source-backed candidate comparison

The pinned HOME Menu pack is title `0004003000009802`.

`DlgMask_D_00` maps to
`dialogmask_LZ.bin/blyt/DlgMask_D_00.bclyt`, SHA-256
`45ffaa6a0379423844784ffd3e450b5f3e2bf46e1724484a234b40ca73afbc86`.
It is a fixed 320×240 black pane with base alpha 130. Two delivered lower-mask
fade-out tracks are plausible route candidates:

| Candidate | CIA-internal source | Source SHA-256 | Source range | Alpha 0 / 3 / 6 / 9 / 12 / 15 |
| --- | --- | --- | --- | --- |
| `DlgMask_D_00_FadeOut00` | `dialogmask_LZ.bin/anim/DlgMask_D_00_FadeOut00.bclan` | `ba904f4847d045d8389e33fdf440af2fa5ddd6886d3d0ef4df2cc799dbbaf50a` | 80..100 | 130 / 99.839999 / 65.519999 / 33.28 / 9.36 / 0 |
| `DlgMask_D_00_FadeOut01` | `dialogmask_LZ.bin/anim/DlgMask_D_00_FadeOut01.bclan` | `8a2e65be773e91b29c92580910d87bb6a3accb0d215e77006c41775bb25e3742` | 120..140 | 110 / 84.48 / 55.44 / 28.16 / 7.92 / 0 |

Both are fixed-geometry Hermite alpha tracks with the same normalized sampled
shape: 1, 0.768, 0.504, 0.256, 0.072 and 0 at samples 0, 3, 6, 9, 12 and 15.
Both remain at zero through their last addressable sample 20, so both match the
observed terminal mask at the sole intermediate. That observation cannot
select `FadeOut00` versus `FadeOut01`, establish which owner starts it, or map
capture order to an authored sample.

`Dlg_A_D_00` maps to `dialog_LZ.bin/blyt/Dlg_A_D_00.bclyt`, SHA-256
`ccee73ad198e6dba3df6498108ceec64dfd38ab8994cea5422db60fdee72534b`.
Its main window panes are 140×200 each (280×200 combined), and its shadow is
312×232 at alpha 180. The pack contains no animation named for
`Dlg_A_D_00`. Fade-out animations for `Dlg_A_D_02` and `Dlg_B_D_01` are not
source proof for this buttonless layout and were not reused as candidates.

## Integration guidance and remaining gap

1. Keep mask work source-gated: either lower-mask fade-out track is compatible
   with the terminal observation, but runtime ownership must identify the
   actual route before selecting one. The separate source-ownership result may
   select a clip, but this fit does not independently identify that route or
   its host epoch. Do not infer timing from this capture.
2. Do not drive the entire closing dialog with the 0.073074 broad endpoint
   projection, the 0.088299 text projection, or the 0.867655 surface
   projection. Each is a different residual of a changing composite.
3. Do not claim a scale exit. If a visible correction must ship before dialog
   ownership is recovered, a staged multi-component retirement is closer to
   the captured intermediate than one parent crossfade, but it is an explicit
   **adaptation** and still needs matched native/browser recapture.
4. The evidence needed to close the gap is a controlled sequence with multiple
   exit intermediates plus an ownership trace for `Dlg_A_D_00`. This worker did
   not change runtime, operate Azahar/browser, or modify the private scenario
   matrix.

## Verification

- `node --test tests/fit-home-closing-fade.test.mjs`: 5/5 pass.
- Deterministic analyzer run: all 125 capture hashes and both pack files
  verified; report written with the SHA above.
- Visual inspection at native PNG resolution: fresh list indices 2, 3 and 4
  confirm the dialog/window, strict mask-only strips and footer exclusion used
  by the measured rectangles.
- `git diff --check`: required before commit.
- Production build and native/browser comparison: intentionally not run; this
  slice changes only evidence tooling, tests and this handoff.

No scenario status changes. Strict 1:1 fidelity remains unproven.
