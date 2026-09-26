# Sound first-run title strip diagnostic

Inspected at integration `eb9b70d` in the Assets lane. This is a bounded
source/capture diagnostic for the upper LCD's y=3..29 strip. It changes no
runtime or public resources and makes no native-match claim.

## Captured evidence

The private capture root is
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/scenario-matrix/v1/captures/`.

| Image | Relative path | SHA-256 |
| --- | --- | --- |
| Azahar combined LCD | `sound-first-run/native/combined.png` | `9dea0cc2fa7022ccd032c5a94ae59c2dbe37e6b7e800fbf8668b356fc9e5ce69` |
| Production browser upper LCD | `sound-first-run-span-opaque/browser/upper.png` | `3faf141b0d715f8afa2adfee416fba2b9f7756af7d8706c5fcbc42871b4b3523` |

Inspected `sound-first-run-span-opaque/diff/upper-contact-sheet.png`.
For the 400×27 rectangle x=0..399, y=3..29, **10,284 pixels** have an RGB
channel difference greater than 2. **8,449 pixels have exactly
native minus browser = (−1, 0, +3)**. At (20,10), (350,15), (20,20) and
(20,28), native is `(41,113,238)` and browser is `(42,113,235)`.
Another 402 pixels have delta `(−1,0,+2)` and are within threshold.
Text-edge differences remain in this strip as well.

These values are reproducible by reading both PNGs as RGB, taking the native
upper at `(0,0,400,240)`, and counting channel deltas in the rectangle above.
The report's whole-upper residual remains 15,537 pixels. The browser entry
prefix differs from the preserved native path; motion/audio remain open.

## Resources are already delivered

Title `0004001000022500`, content 0 / `0000000b` provides
`lyt/S_Inf_U.arc.LZ`. Its public pack is
`packs/sound/contents/0000-0000000b/lyt-S_Inf_U-arc-LZ.json`, with source SHA-256
`2ce1ae0f041e40bfde2467c3323de8a327f0b53d6a96b3a979b228507da4ce7e` and public
pack SHA-256 `ff48060bf81844c2992394038aa386a064a55a0a7fe5b6e7e6e533a77e4919c9`.
It already contains `S_Inf_U-TitleBar`, all six TitleLeft/Center/Bevel In/Out
clips, and `TitleBar_Base.bclim`, `TitleBar_Bevel.bclim`,
`TitleBar_Reflect.bclim`. Their source hashes and texture delivery URLs are in
that pack's `resourceSources` and `textures` records. No missing asset needs
publication for this defect.

Runtime `soundEntryBlue` replaces the source theme register
`(57,170,213,255)` with `(42,113,235,255)`. The latter is genuinely present
as `S_ColConf_D` material `BtnRst` constant 0 in private converted
`lyt-S_ColConf-arc-LZ.json`. Its source layout is
`lyt/S_ColConf.arc.LZ/blyt/S_ColConf_D.bclyt`, SHA-256
`5abfec3d34a895308e64e07838964f15dfc46d4d61e4585df305fa615d3a3c59`.
That reset-button color does not prove the native runtime title register.

## Concrete next visible slice

L2 can test a **title-material-only capture fit** to `(41,113,238,255)`,
keeping the original pack and textures unchanged. Scope the fit to the title
bar so it does not alter other Sound UI or the independently fitted Span.
Rebuild, recapture the production browser under a new scenario ID, and compare
against the identified native PNG. Until the native runtime color binding is
traced, label this as a capture-derived adaptation; do not call it source color.

An explanatory hypothesis is RGB565 conversion: taking the high 5/6/5 bits
of source `(42,113,235)` gives `(5,28,29)`; bit replication yields
`(41,113,238)`. **This is an inference, not verified firmware behavior.** The
native upper capture has 252/243/250 distinct R/G/B values, so it is not globally
RGB565. Applying quantization to the entire LCD is unsupported by this evidence.
Title text alignment/raster and the remaining room, birds, footer and guide
residuals need independent fixes and matched input/motion/audio evidence.
