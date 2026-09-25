# Sound empty-entry row alignment

The settled EUR 10.7.0-32E, English, SD-absent reference is the native 400×480
capture `Nintendo 3DS Sound_24.09.26_10.52.20.238.png` (SHA-256
`9071f0d1a3fa47bbc8e407245906a2efa9a90cac9f1c91ecb92c3b15eb809485`).
The upper crop is `(0,0,400,240)` and the lower crop `(40,240,320,240)`.
This is one settled pose, not an animation or first-run comparison.

The source-painter baseline used the exact published Sound layouts, images and
English messages with an empty track manifest and clock fixed to 10:52. In the
native lower LCD, the blue selected-row top edge begins at y33; the baseline
starts at y35. The source `S_Common-BrwCursor`, `S_Common-IconList` and
`S_Common-Text` agree horizontally. The largest contiguous lower-LCD mismatch
was this two-pixel vertical offset, especially across the 320-pixel row.
Their settled entry centres now move up together by two pixels. Other Sound
views and the source packs are unchanged.

| Lower region | Baseline mean absolute RGB error | Corrected error |
| --- | ---: | ---: |
| Whole 320×240 LCD | 10.800 | 5.835 |
| Entry row `(0,32,320,32)` | 55.678 | 19.988 |
| Open `(98,178,124,60)` | 2.737 | 2.737 |

The errors have no pass threshold. The upper title comparison stays at
4.011/255; its rendered pixels were unchanged. The source-screen verifier does
not inject the scene-owned `S_Back_U` CGFX room, so its whole upper image cannot
be compared to this capture. Existing room model/mipmap evidence is in
[Sound room source](sound-room-source.md) and
[Sound room mipmaps](sound-room-mipmap-source.md). The remaining lower error
includes row glyph/raster colour, record texture sampling, footer edges and
the then-offset bird pose. A later [settled bird placement comparison](sound-entry-bird-source.md#settled-entry-pose-comparison) aligns the three visible Wait sprites in this one capture. The native bird schedule remains unresolved. No new songs or device controls were introduced.

The later [row glyph comparison](sound-entry-row-glyph-validation.md) measures
the label separately after the bird correction and aligns its independent
mount to the pinned native glyph silhouette. Its remaining row error is 3.724.

The paired source images and comparison JSONs are in
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/presentation/sound-empty-row-2026-09-25/`.
`scripts/compare-sound-entry.mjs` records the whole lower LCD and entry row in
addition to its earlier bounded regions. The artifact uses the published native
capture only for metrics; it does not copy raw firmware into `public/`.

Focused Sound tests pass (16/16), the 57-pair source-screen verifier passes
with no renderer diagnostics, TypeScript typecheck passes, and the production
build passes. The broad `npm test` run has 39 failures because this isolated
sparse worktree excludes the large `model/` and other `public/` fixtures; the
first failure is the missing `silver-audio-finish-web.glb`. A live browser
comparison remains the integration coordinator's gate under `AGENTS.md`.
