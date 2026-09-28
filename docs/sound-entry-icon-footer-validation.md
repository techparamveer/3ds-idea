# Sound settled icon phase and footer residual

This comparison uses the pinned EUR 10.7.0-32E English, SD-absent native
capture `Nintendo 3DS Sound_24.09.26_10.52.20.238.png` (SHA-256
`9071f0d1a3fa47bbc8e407245906a2efa9a90cac9f1c91ecb92c3b15eb809485`)
and the same 10:52 source-screen render as the [row glyph pass](sound-entry-row-glyph-validation.md).
The lower native crop is `(40,240,320,240)`.

The remaining row icon error came from the selected source animation pose.
`S_Common-BrwCursor_Default` changes `IconCurBarO_R`'s texture every two
frames. Frame 0 selects `V3_BarCursorIcon00.bclim`; frame 18 selects the
original `V3_BarCursorIcon09.bclim`. In native crop `(6,38,24,20)`, the red
arrow has 92 pixels with the latter texture's footprint and colour. The
settled-entry renderer now samples frame 18. This is a phase fit for this one
capture; it does not establish the native cursor clock or animation timing.

| Lower measure | Frame 0 | Frame 18 |
| --- | ---: | ---: |
| Arrow red-mask intersection/union | 84/148 (0.568 IoU) | 92/92 (1.000 IoU) |
| Exact RGB among red-mask pixels | 0% | 100% |
| Icon `(0,32,56,32)` RGB MAE / 255 | 17.426 | 10.921 |
| Entry row `(0,32,320,32)` RGB MAE | 3.724 | 2.586 |
| Whole lower LCD RGB MAE | 3.175 | 3.024 |

The icon's remaining error is outside the arrow artwork. The left blue fill
`(0,38,7,19)` remains **53.772 RGB MAE**, unchanged by the animation phase.
At `(1,47)`, native RGB is `(72,131,234)` and the source render is
`(164,186,222)`. Isolating `S_Common-BrwCursor` shows that the underlying
record backdrop at this pixel is `(229,224,216)`; the cursor changes it, but
its current material composition is still too pale. The blue strip outside
this local area and the heart icon are already close. Changing a global blue
theme register or the whole cursor alpha would disturb those matched pixels.
The correct source compositor/overlap for the local fill is still untraced.

The footer remains **6.058 RGB MAE**. Its bounded button crops show the
largest residual in StreetPass `(0,178,92,31)` at **14.087** and Settings
`(228,209,92,31)` at **14.198**; Back is **3.059**, Add is **3.210**, and Open
`(98,178,124,60)` is **2.737**. The source layouts give StreetPass and
Settings black text with full pane alpha; their English messages carry the
existing font styles and explicit 80% tags. Their native glyphs look lighter
than the current render, but these records do not determine whether the
remaining difference is glyph coverage, material composition or emulator
sampling. A hand-picked text fade would have no source basis. The next gate
is a traced native text/material blend or a real-resource renderer experiment
that improves all affected button crops without damaging the aligned row label.

`scripts/compare-sound-entry.mjs` reports the bounded icon masks, left fill
and footer buttons. Before/after comparisons, source renders and the
diagnostic no-cursor render are under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/presentation/sound-icon-footer-2026-09-25/`.
The 57-pair source-screen verifier reports no renderer diagnostics. This
worktree does not drive the browser or native reference session; live
inspection remains the integration coordinator's gate under `AGENTS.md`.
