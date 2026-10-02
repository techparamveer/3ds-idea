# HOME selected-cursor phase comparison

Comparison branch: `codex/home-cursor-compare-20261002`

Comparison base: `7404afd20b60e9669f1c437a6696b0d7895a51cd`

Production runtime: `a751b2dd`

## Finding

The six-density native/browser cursor difference is separable into placement,
phase and raster questions. This comparison finds no stable cursor-placement or
Scale-geometry correction. Exact source-center normalization puts the native
mint corner bounds inside the browser's complete 60-frame family at every
repeatable boundary. The only exception is one fresh six-row bottom-left mint
threshold pixel at relative x -16 where the browser family begins at -15; the
preserved six-row native capture begins at -15 and does not repeat it.

Exhaustive phase ranking substantially improves every previously sampled
production phase, but no density reaches the static delta-2 tier. The best
fresh-primary residuals range from 291 / 324 to 1,008 / 1,144 analysis-support
pixels above 2. Multiple independent one-row native captures rank different
browser frames. A best-fit frame is therefore a similarity result only, **not**
the native frame, native epoch or a timing claim.

The next bounded source action is to audit the decoded cursor window/material
path: `W_CsrLgt_00LT` alpha/texture translation and `W_CsrF_00LT` window
sampling/TEV composition at the existing centers and Scale frames. Do not
change cursor centers, density Scale geometry or the retained Loop clock from
this evidence. Any source-proven renderer change requires another production
60-frame family and the same native comparison.

A follow-up direct-LCD sampling candidate at runtime `68c69bcf` is rejected.
Its best-of-60 frozen-support score is lower at every density, but the result is
not uniform at the same named browser frames, the full authored ROI regresses
at row 4, and full-LCD controls do not establish an outside-ROI-safe change.
Do not integrate it from this evidence.

No whole scenario or matrix entry passes from this diagnostic.

## Comparison boundary

The native installed-title order puts Health in slot 0. The portfolio product
puts Health in slot 8. At three, five and six rows this deliberately changes
the selected tile's vertical position. Comparing the images at their raw LCD
coordinates would therefore measure title order, not cursor geometry.

The comparator normalizes only the exact selected centers:

| Rows / Scale frame | Native Health center | Browser Health center |
| ---: | --- | --- |
| 1 / 0 | `(76,161)` | `(76,161)` |
| 2 / 1 | `(76,82)` | `(76,82)` |
| 3 / 2 | `(52,70)` | `(52,178)` |
| 4 / 3 | `(40,64)` | `(40,64)` |
| 5 / 4 | `(32,60)` | `(32,156)` |
| 6 / 5 | `(34,54)` | `(34,110)` |

These are the source navigation/current-primary centers, not translations
chosen by a pixel search. No `dx`/`dy` fitting is performed.

For each density the four largest mint components around native Health define
four corner apertures. Inside those apertures, the comparison support is the
fixed union of pixels satisfying `r < 130 && g > 190 && b > 150` in either the
fresh native image or any aligned browser frame 0 through 59. This excludes the
yellow Health artwork, ordinary plate interior and one-row title balloon. It
also prevents a rectangular corner crop from leaking title pixels at the small
densities.

This union is a **cursor-only analysis support, not an acceptance mask**. It is
never applied to the whole LCD, does not conceal another native residual and
cannot promote a scenario. The JSON report records every scanline run and its
SHA-256:

| Rows | Support pixels | Support SHA-256 |
| ---: | ---: | --- |
| 6 | 324 | `2689307870cde13708881845a8594b5b09415e9768d1da3dee7855270b40b974` |
| 5 | 389 | `f549b186b9c61f068611fa61dce10650ba5badf8a8a67de5ead6a71c8ae61d81` |
| 4 | 566 | `baafbd40591eef2252d7ccf1453c68ed961cde01c96c4ed974b95a33a523d877` |
| 3 | 758 | `9eac7b967bda387eec0d57e91eb3ac550dbfd84959106daf376017a6b6dfd677` |
| 2 | 1,144 | `942aac974b0867ea1a1317b32dab22b1485db214988f34cd2fdf63787cb2223e` |
| 1 | 1,144 | `5de58e0cd076bdbc569d081f7fa452c7f83aa24faf51c738f8359c8671d395c1` |

## Native inputs

The primary inputs are a fresh ascending sequence. A hidden direct-executable
startup warning blocked the initial taps while the main-window capture omitted
the warning. The coordinator cancelled Quit, dismissed the warning through its
visible accessibility OK action, verified that only the main window remained,
and then observed five separate 50 ms increases settle at rows 2 through 6.
No native setting changed. This resolves the failed attempt as a hidden-modal
setup issue, not a HOME reducer or native density-input defect.

| Rows | Native own-PNG | SHA-256 |
| ---: | --- | --- |
| 1 | `_02.10.26_16.01.52.87.png` | `e4cb420f656eb73781b02bf9862d865b23247834969cc8af7d504141e0b01191` |
| 2 | `_02.10.26_16.03.22.776.png` | `91aaf2a642b141a65a5b2c3bc385fb154e97795b7db1c9894741d2a35a5e7d3b` |
| 3 | `_02.10.26_16.03.38.832.png` | `a1f37e0496c580c04cbae7b3c8673c1b7cdb79cf7b2e573a7a2b4fd2d5111c1c` |
| 4 | `_02.10.26_16.03.50.733.png` | `3ec7688b13c5de2f421c1a4f2f81867942aa86d775cc6441e0fc5993259a7af6` |
| 5 | `_02.10.26_16.04.00.348.png` | `85bd6bb0392046af30a4649f69c52fe89ae9d3e0391f8ed922a4cc6125438366` |
| 6 | `_02.10.26_16.04.10.306.png` | `4b0c9735d6e3874fa24a13ecc60b19359ec88068f4be7d99c614c4545cd08359` |

The fresh primary sequence is recorded by
`home-cursor-phase-20261002/coordinator/native-run.json`, SHA-256
`465efc6089027d52550c36a9bd7d9ff20d83b6ec97482fe4680bedb0c7df1f7c`.
The preserved descending sequence remains in the report as six independent
replications. It retains its original hashes and the separately labelled
`home-touch-projection-20261002/coordinator/native-run.json` identity
`6b626a8c135fc254412d433fa2280d0d783260c10cfc2b9364ef1a954600e095`.
The report also scores native initial rows 1, first-increase rows 5, three fresh
live one-row captures and an uncontrolled pause/frame-attempt holdout.

Pause/Advance Frame does not label any native phase: after a paused screenshot,
Advance Frame was disabled/refused and the scene was moving again. The earlier
failed density attempts while the warning remained open are retained as setup
diagnostics only. Native cursor frame, update count, HID cadence and motion epoch
are not observed.

## Browser phase family

The coordinator captured all 60 actual live `sampledFrame` values for each of
six densities: 360 raw lower/upper PNG pairs and capture metadata files. No
cursor state was forced. The capture loop waited for a real live phase and
`captureScreensAt` recorded that same phase. The comparator rejects a directory
unless `sampledFrame == appliedFrame == frame-{00..59}` and the requested row is
present. All 360 pass those identity checks; browser errors are empty and audio
is muted.

`browser/result.json` SHA-256 is
`896627e802b5e770aa95f73f5cd0e3d17b4cb06bac202f99f32f67c5c3618364`.
For each row, the phase-family image at the numeric frame used by the earlier
descending production capture is byte-identical on the cursor support to that
earlier capture. This independently establishes that the enumerated family is
repeatable at named browser frames; it does not identify a native frame.

## Fresh-primary phase results

Ranking uses pixels above 2 first, then RGB RMSE, without translation search.
The “original” column is the named phase from the prior production density
sequence. IoU is the mint-pixel intersection over union inside the same fixed
analysis support.

| Rows | Original frame: pixels >2 / RMSE / max | Best browser frame: pixels >2 / RMSE / max | Best mint IoU |
| ---: | --- | --- | ---: |
| 6 | 6: 324 / 55.900733 / 176 | 32: **291 / 20.024214 / 175** | 0.932203 |
| 5 | 58: 389 / 54.261514 / 169 | 40: **338 / 12.514054 / 161** | 0.958491 |
| 4 | 48: 566 / 47.263359 / 176 | 0: **467 / 8.757800 / 34** | 0.944134 |
| 3 | 41: 758 / 58.205845 / 165 | 2: **646 / 11.105495 / 40** | 0.815686 |
| 2 | 31: 1,144 / 52.717985 / 165 | 3: **860 / 9.913525 / 30** | 0.840399 |
| 1 | 22: 1,144 / 17.779896 / 65 | 32: **1,008 / 6.483213 / 19** | 0.979499 |

The best-frame residual distributions remain substantive:

| Rows | Pixels >10 / >20 / >50 / >100 |
| ---: | --- |
| 6 | 94 / 16 / 15 / 14 |
| 5 | 155 / 15 / 7 / 4 |
| 4 | 360 / 18 / 0 / 0 |
| 3 | 530 / 158 / 0 / 0 |
| 2 | 812 / 168 / 0 / 0 |
| 1 | 714 / 0 / 0 / 0 |

The opened five-column sheet shows the same result visually. Exact center
normalization aligns the four source corners. Phase enumeration removes the
large original-phase color/texture displacement, but edge shade and sampling
differences remain. The smallest-density high maxima are confined to a few edge
pixels; they do not establish a translation.

## Replication and phase ambiguity

The preserved six-density sequence independently ranks frames 48, 5, 41, 53,
39 and 17 for rows 6 through 1, not the fresh sequence's 32, 40, 0, 2, 3 and
32. Its best residuals remain nonzero: respectively 310, 361, 466, 675, 956 and
978 support pixels above 2, with maxima 157, 50, 17, 48, 20 and 18.

Independent one-row native captures rank frames 32, 3, 44 and 31; the preserved
descending and initial captures rank 17 and 10. Their differing best frames are
expected for unlabeled live native samples and directly rule out promoting one
best frame to a native epoch. The uncontrolled holdout ranks frame 31 but is not
frame-advance evidence.

## Source identity and geometry/phase separation

All cursor content remains mapped to pinned EUR HOME `0004003000009802`
v24576, content index 0 / ID `00000082`. Executable SHA-256 is
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`;
`launcher_LZ.bin` SHA-256 is
`826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`;
delivered launcher pack SHA-256 is
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.

| Owner | Source | SHA-256 | Role |
| --- | --- | --- | --- |
| `LncCsr_00` | `launcher_LZ.bin/blyt/LncCsr_00.bclyt` | `72f59f9f3d0a327c6c1e3e012a1aa9f1a1a84ab3d0c829772ae4a2a43ecd0738` | Two source windows and materials |
| `LncCsr_00_Scale` | `launcher_LZ.bin/anim/LncCsr_00_Scale.bclan` | `74277ac0ec8debf4f035b6e4c629fb9605c897fcb50e6b5ed2447250c671c2dd` | Nonlooping density frames; comparison uses 0..5 |
| `LncCsr_00_Loop` | `launcher_LZ.bin/anim/LncCsr_00_Loop.bclan` | `0bf11061be32b1af39749b8ae8342b8010b65ed9dfd257dbce76e38618b76744` | 60-frame loop: highlight alpha/texture translation and frame texture translation |

`Scale` owns window dimensions at each density. `Loop` does not move the pane
roots: it changes `W_CsrLgt_00` alpha and texture translation and
`W_CsrF_00LT` texture translation. This is why relative corner envelopes test
geometry separately from RGB phase ranking. The geometry evidence supports the
existing centers/Scale route; the residual floor points to the window/material
raster path, subject to source audit.

## Direct-LCD sampling candidate: rejected

The coordinator replayed the source worker's bounded
`pictureSampling: 'lcd'` candidate for the two `LncCsr_00` cursor windows only.
The first 360-frame replay selected Settings in slot 9 and is excluded: the
baseline selects Health in slot 8, so its different composited background does
not isolate the candidate. A second attempted Health replay retained a
different scroll anchor and was also excluded before comparison.

The definitive `browser-candidate-health-aligned` replay contains all 60 actual
sampled/applied frames at all six densities. Every frame identifies Health as
selected and visible slot 8 and matches the baseline center, Scale, mode,
render-active effect state and white theme. The comparator also rehashes each
baseline lower PNG and capture JSON against the frozen baseline report before
using it. Invisible effects retain different stale target/disappear histories;
those states do not draw and are not treated as render-active differences.

The table uses the exact existing native inputs and exact frozen mint supports;
it does not recompute support from candidate output. Ranking is pixels above
delta 2, then RMSE. Rows are reported six through one.

| Rows | Baseline best frame | Baseline `>2` / RMSE / max | Candidate best frame | Candidate `>2` / RMSE / max | Same-frame improved / worsened |
| ---: | ---: | --- | ---: | --- | --- |
| 6 | 32 | 291 / 20.024214 / 175 | 31 | 277 / 19.953238 / 175 | 9 / 51 |
| 5 | 40 | 338 / 12.514054 / 161 | 35 | 326 / 11.996679 / 160 | 26 / 34 |
| 4 | 0 | 467 / 8.757800 / 34 | 1 | 463 / 8.462834 / 35 | 9 / 51 |
| 3 | 2 | 646 / 11.105495 / 40 | 8 | 632 / 8.069809 / 21 | 20 / 40 |
| 2 | 3 | 860 / 9.913525 / 30 | 8 | 856 / 7.992001 / 23 | 20 / 40 |
| 1 | 32 | 1,008 / 6.483213 / 19 | 30 | 944 / 4.819649 / 19 | 14 / 46 |

These minima are a modest best-fit improvement, not a native phase match. Most
same-numbered browser frames worsen at every density. In the separate full
authored cursor ROI, which includes the halo, title interior and background,
row 4 worsens from 3,251 to 3,289 pixels above delta 2; the other rows are
mixed in metric magnitude and all remain far from the static tier.

The raw same-frame controls are not clean acceptance evidence. Every density
has lower-LCD differences outside the two full source cursor ROIs and upper-LCD
differences even though the candidate source edit is lower-cursor-only. The
maximum outside-ROI lower counts above delta 2 are 66, 98, 248, 127, 197 and 63
for rows 6 through 1. This proves the two capture families do not provide an
isolated full-LCD before/after control; it does not identify the cause of those
unexplained residuals. The candidate therefore fails the required
improvement-without-new-edge/background-regression gate and is rejected. The
coordinator restored the prior transport at `b8773a90`.

## Next verification action

1. Trace the existing renderer's `W_CsrLgt_00LT` and `W_CsrF_00LT` window
   border sampling, texture transforms, alpha/TEV and blend output against the
   delivered layout/materials. Start at one and two rows, where the best-family
   maximum is 19/30 and no >50 outlier complicates the result.
2. Do not change layout centers, density Scale frames, the retained
   submission-before-advance controller or its provisional scheduler from this
   comparison. A source proof may still conclude that no runtime edit is
   justified.
3. If a bounded source-backed raster change is integrated, recapture all 60
   real browser frames at rows 1 and 2 first. Compare the complete family to at
   least three independent native captures with the same fixed support rule.
4. Whole-LCD empty-mask comparison, exact input, motion, cue timing, shutdown
   and muted audio remain separate required gates. Never use these cursor-only
   supports as reasoned masks in the scenario matrix.
5. Do not carry the rejected direct-LCD sampling candidate forward. A future
   transport experiment needs deterministic non-cursor visual epochs or an
   otherwise isolated same-background replay before it can clear the
   outside-ROI safety gate.

## Artifacts and verification boundary

Private root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-cursor-phase-20261002/`.

- comparator: `comparison/compare-cursor-phases.mjs`, SHA-256
  `753cfaffa42cdcb4480379719776539fc6c91e86c099acf69d49af115d2e2964`;
- fresh native manifest: `comparison/fresh-native-primary.json`, SHA-256
  `f8aec44203625b8e48162ff572dd14586bcffa76dbb45be032dce59e5d0bae88`;
- repeat/holdout manifest: `comparison/extra-native.json`, SHA-256
  `b7c6962e52ada351d29bedeee98672ff6078ad69dfec25cd95625c7a08731187`;
- report: `comparison/fresh-phase/report.json`, SHA-256
  `98f3b3ac44dc25b5cbe4bdf7ca1fbb0205f2fcd096061b45d265150cb0f6c88b`;
- opened five-column sheet:
  `comparison/fresh-phase/cursor-phase-primary-sheet.png`, SHA-256
  `092a74bbbdfdea9fae469b76096b8d7712b804263b4149413b1a20f6fd572ec4`.
- candidate comparator: `comparison/compare-candidate.mjs`, SHA-256
  `f266fad9fe5dc57b70ce41a1ddd7369b2f309af2520497b4ebac5c6f66322be1`;
- aligned candidate result: `browser-candidate-health-aligned/result.json`,
  SHA-256
  `329925d7702108872923cc0de63f8a391783b437c06683f05b9ce87f9414bd0b`;
- aligned candidate report:
  `comparison/candidate-health-aligned/report.json`, SHA-256
  `e1acfc9309d9d5cb38f80ca0ad7222d79fe659a8bcecaba2ab18c5fa66021d0b`;
- inspected candidate sheet:
  `comparison/candidate-health-aligned/cursor-candidate-primary-sheet.png`,
  SHA-256
  `47cc79c8c804c0ec9e0e41e6d29c2b8994cb125e2825af017f38a6b9f72a9192`;
- excluded slot-9 diagnostic:
  `comparison/candidate-invalid-selection/report.json`, SHA-256
  `83c5bbba5e81d9e17baf3131896adef8e52f182664a0f7297a56eb8b6bdfc198`.

The report hashes every native input, all 360 browser lower PNGs and capture
metadata files, the support runs, phase metrics and output sheet. The comparator
and JSON parse successfully; the sheet was inspected at original resolution.
This worker changed no runtime, asset, shared project document, matrix,
GUI/browser/native/audio or build state. Documentation-only verification is
`git diff --check`. No whole-scenario, exact native phase, exact HID cadence,
motion/audio parity or strict 1:1 claim is made.
