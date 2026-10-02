# HOME root page boundary — 2 October 2026

## Scope and conclusion

This bounded slice separates the captured root exposure from the browser's
300-slot storage capacity. The isolated native profile exposes slots `0..59`:
six rows fit one page with no arrows. At five rows, the full origin-to-end
traversal is three columns / 15 slots, ending at left slot `15`; the final
settled step into that endpoint is one column. Both arrows appear before the
endpoint and only the left arrow appears at it. Keyboard navigation also stops
at slot `59`.

The browser therefore keeps all 300 stored slots but uses an exposed extent of
60 for painting, hit testing, drag scrolling, keyboard input, page-arrow input,
arrow visibility and `LncPlt_00` pane geometry. To avoid hiding existing browser
data, the exposure expands only far enough to include an already occupied or
folder slot, a restored selection, or a restored viewport. That expansion is a
portfolio data-preservation adaptation, not a claim about native allocation or
growth. It is derived at runtime and does not change the saved-data schema.

## Captured evidence

All native captures are Azahar's own 400×480 PNGs from the isolated profile:

| State | Capture SHA-256 | Observation |
| --- | --- | --- |
| six-row folder selection | `498decca8e484be750bb6b212cf94f5556b6cf4cceab668a5cbd0d51119e1989` | no arrows; right tray corner closes at x310 |
| six-row vacant selection | `4cc1f8febd8f6985e06cab7250c0903703cac73b751573728dc5d3372c979c97` | same boundary, independent of occupancy at the selected slot |
| six-row raw right-edge tap | `9e6359e3a4bfca8e61570238482ac4ec494056c97304bfd6b58723b1a60a03b5` | viewport and selection remain unchanged |
| five-row right endpoint | `ee317ea2af4ff3b7ae21a3ec8347fc4a78de0e5c760c163886fd40c3b80c1677` | left arrow only; tray closes on the right and extends past the left LCD edge |
| five-row origin | `62535b29e97a05040a0f4e90afed5bc0c36cc393e38889c8af48bcf1bd430533` | right arrow only; tray closes on the left and extends past the right LCD edge |
| six-row restored | `d10e0890847774006f5a33776d7f8925e717d257139fd0e043ccec5670983ab5` | returns to one page with no arrows |
| keyboard slot 53 → 59 | `8f67a5bc341e9c07eceb668ad6309f0afa907ed0035aa014b0fb8c2fe2068787` | last captured root slot is reachable |
| keyboard right at slot 59 | `93378f5dc438bf47f7d9e596969f8c811867161664aa66d95b26f9880feb336a` | selection remains at 59 |

The immutable pre-change browser baseline is the ten-pair `browser-before-v3`
set under
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-page-boundary-20261002/browser-before-v3/`.
It contains `dense-root`, `dense-right-attempt`, `dense-restored`,
`five-row-root`, `five-row-right`, `five-row-left`, `edge-left`, `edge-last`,
`edge-beyond` and `edge-return`; its `result.json` SHA-256 is
`32e665dc5c55290dc6d815b04c56274196cde3ac106b3d117f5836a96aea53f1`.
The earlier six-pair `browser-before` directory is exploratory evidence, not
the immutable comparison baseline.

## Native resource mapping

The pinned source is EUR HOME Menu title `0004003000009802`, version `24576`,
content index `0` / content ID `00000082`, RomFS `launcher_LZ.bin` SHA-256
`826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`.
The checked manifest was produced by `ctr-native-web` 1.2.0 with CTRTool 1.3.0.

| Visible element | Manifest key / internal path | SHA-256 |
| --- | --- | --- |
| root tray | `home.launcher` → `layouts.LncPlt_00` → `launcher_LZ.bin/blyt/LncPlt_00.bclyt` | `e4875783c38f0fde3656ed9c1964110fb9210765400ba2cfca49480998e9874b` |
| tray settled palette | `animations.LncPlt_00_PaletteOut` → `launcher_LZ.bin/anim/LncPlt_00_PaletteOut.bclan` | `8b0a99c062aeac2cf891c519cd66019e6f5f1e3348bc95e05d5d7d3d9c430a44` |
| page arrows | `layouts.LncArw_00` → `launcher_LZ.bin/blyt/LncArw_00.bclyt` | `b10fb39ab2c122041512b2b504107c792c40193344c907441acb603895816ed8` |
| settled arrow pose | `animations.LncArw_00_Appear` → `launcher_LZ.bin/anim/LncArw_00_Appear.bclan` | `cd26320af0d48b4af048fb58bbe755115fa0cde3e959285519b724bbd65dd11f` |

`LncPlt_00` supplies the pane art. The existing source-derived pane setter is
retained; this slice corrects its root extent input from storage capacity 300 to
the captured exposure. `LncArw_00` has independent `N_arwL_00` and
`N_arwR_00` groups, so both visibility decisions are now explicit.

## Verification status and remaining gap

Focused HOME presentation, scroll-consumer, paint and navigation tests pass
91/91. A second focused controls/gesture/history/density/cursor/folder-close
sweep passes 104/104 (the added persistence case was rerun separately). The
typecheck (`npm run typecheck`) and `git diff --check` pass. Per lane rules, this worker did not
run the full suite/build or operate Azahar/the shared production browser.

Source `fc92e897` is integrated as `ddea6d53`; evidence clarification `97ce942d`
is integrated as `18752e25`. Final full suite passes 1,827 tests with zero
failures, 23 skips and one TODO. Production build and post-build typecheck pass.
Independent review checked 216 density transitions across updates0..15 and
lossless high-slot app/folder save restoration; no remaining input or data-loss
finding. These checks are not native acceptance.

Coordinator captured eight fresh isolated Azahar own-PNGs at normal100% frame
limit, original/EUR/Static2/Null1/volume0. The process exited0. Production has
ten before-v3 and ten after raw LCD pairs, plus ten mobile and ten reduced-motion
pairs. Actual pointer/keyboard input now produces33 ->33 for hidden right-edge
touch and59 ->53 ->59 ->59 for the last-column sequence. All runs are muted and
report no page errors. Exact emulated input cadence remains unpaired.

Private artifact root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-page-boundary-20261002/`.
`comparison/after-ddea6d53/report.json` SHA-256
`f987972988775e641b7bf6da0786d3be5bdb4c19d9cfa11882dcd8b8b18127ee`
tracks every named native/browser pair, raw LCD SHA, empty mask and fixed ROI.
Native lower is cropped x40/y240/320x240 from the own400x480 PNG, not rescaled.
The inspected native/after sheet SHA is
`2114a37064ad6b6a12b0ac3983b7a54e6bc05316bb24e810873927dcfc9e8fa4`;
before-v3/after sheet is
`5121b44d51e99a038c4132b2ce4af2f8f639d701a6e627aefbabc9567a087c93`.

All six native right-edge ROIs x280/y33/40x207 have zero pixels above delta2,
maximum2; closed-right baseline poses had3,155 above2. The independent settled
footer-edge strip x299/y212/21x2 has zero above2, maximum1. No fitting or mask.
Whole lower residuals range2,646-12,781 and upper22,762-60,715: every complete
scenario remains fail. Population, cursor/banner/HUD epochs, existing shade
and footer text, precise motion/input and muted audio remain unresolved.
The native rule for growing beyond60 remains unknown; high-slot compatibility
must remain labelled as an adaptation. No private matrix change.

The first completed HOME motion pose `motion-after-v2/motion-009` improves
the earlier footer ROI x0/y212/320x28 from41 above2/max13 to0 above2/max1
against native18.48.58.698. Full lower11,260 remains fail. Report
`comparison/motion-after-v2-supplement/report.json` SHA-256
`3295288bdbfc124edeb0a1f2d5e155fceebcfe16b65e18a8de9450bbbf78d51a`,
inspected sheet `0a62f555d4b6d837d0a446a256b8cb022bb847e6ea26b57ab76fb6e0f6abfb62`.
That native capture used10% emulation and establishes pixels, not timing.
Production hold/cancel/release completes23 motion pairs. Seven static stock
LCD targets are byte-identical; Health upper epochs are not matched.

Correction: the supplement initially repeated a coordinator visual misread of
a missing folder arrow. Exact x300/y100/20x60 crops are unchanged across before,
after and candidate builds, and explicit-visible/omitted source poses are
identical. Immutable correction record
`comparison/motion-after-v2-supplement/correction-folder-right-arrow.json`
SHA-256 `ee8d1e8841d885834c28e3382ed364021ce586df1a7f53cf40e2d9d4a09b3eca`
retracts that claim. Candidate904d5567 ->47915d8b is reverted by
9ed4461d ->e83d55de. Final src/public are identical to ddea6d53; the added
painter test checks root-no-arrows, folder-origin right and endpoint left.
No speculative storage-width backdrop exception was retained. Full folder
frames have cursor-epoch and finite-root-backdrop changes, not missing arrows.
The initial motion harness assumed a left-edge tap moved selection; once it
correctly became inert, the harness required an explicit vacant selection
before opening the folder. Preserve that failed run as a setup diagnostic.

Final `controls-final` production replay at e83d55de completes five pairs,
with no page errors and muted audio. `controls-report-final.json` tracks the
raw images and exact folder-arrow crops. Native and owned Chrome exit0;
preview3021/session18144 remains available. Workers are idle. Final relative
link and whitespace checks pass; no private matrix or original-checkout edit.
