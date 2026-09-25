# Sound settled entry label placement

The pinned EUR 10.7.0-32E English, SD-absent capture is
`Nintendo 3DS Sound_24.09.26_10.52.20.238.png`, SHA-256
`9071f0d1a3fa47bbc8e407245906a2efa9a90cac9f1c91ecb92c3b15eb809485`.
The native lower LCD is crop `(40,240,320,240)`. The comparison uses the
settled Wait bird pose and the same 10:52 source render on both sides.

`S_Common-Text` supplies the row's `Null` text pane, the published shared CFNT
and message `S/P_BR_00` (`Record & Edit Sounds`, source style 77 at 84% font
scale). The white glyph silhouette had almost the same size as native before
this pass: 778 rendered versus 775 native pixels in crop `(56,37,224,20)`.
Cross-correlation placed the rendered silhouette exactly one LCD pixel right
and down. The row cursor and blue strip already aligned, so the label's
independent composition mount moved from `(56,47)` to `(55,46)`. This is a fixed
settled-entry mount, not a font transformation or advancing animation offset.
The source packs, font and playback views are unchanged.

| Lower region / measure | Before | After |
| --- | ---: | ---: |
| Whole LCD RGB MAE / 255 | 5.344 | 3.175 |
| Entry row `(0,32,320,32)` RGB MAE | 19.988 | 3.724 |
| Label `(56,37,224,20)` RGB MAE | 38.229 | 1.055 |
| White label glyph intersection/union | 339/1214 (0.279 IoU) | 775/775 (1.000 IoU) |
| Entry icon `(0,32,56,32)` RGB MAE | 17.426 | 17.426 |

The white-mask threshold is all RGB channels above 180 with channel spread
under 35. It measures this label's position and shape, not every faint edge or
its material colour. The icon raster/colour and footer remain distinct residuals;
the footer is 6.058 RGB MAE. The top title stays 4.011 RGB MAE. These are
bounded metrics for one settled frame, without an acceptance threshold or
proof of native timing. The source-screen verifier omits the scene-owned upper
room, so no whole-upper comparison is claimed.

`scripts/compare-sound-entry.mjs` now reports icon, label and white glyph-mask
regions. Before/after comparison JSON and the 57-pair source renders are under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/presentation/sound-row-residual-2026-09-25/`.
The source-screen verifier reported no diagnostics; 12 focused Sound tests,
typecheck and production build pass. Browser inspection remains the integration
coordinator's gate under `AGENTS.md`.

The later [cursor-phase and footer comparison](sound-entry-icon-footer-validation.md)
aligns the original arrow texture to this same settled native frame and
measures the remaining blue-fill and footer errors separately.
