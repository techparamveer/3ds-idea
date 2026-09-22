# Native folder first-character glyph

This pass adds the lower HOME folder glyph to stationary, receiving and lifted
folders. It uses the first UTF-16 code unit of the folder name, the shared system
font, the source 32 × 32 layout and HOME's CPU outline calculation. Empty names
leave the icon blank. Custom badges are outside this path.

## Source trace

Evidence is HOME 10.7.0-32E `exefs/code.bin`, SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Addresses below are virtual addresses with image base `0x100000`.

| Native location | Established behavior |
| --- | --- |
| `0x202778`, `0x2027d0`, `0x1b382c` | Read the first name code unit and select `T_Icon_00`, with text length one; hide the badge picture. |
| `0x1b39e8`–`0x1b3bd8` | Construct the 32 × 32 RGB565 target for `LncIconFolderText_00`. Authored text pane is 30 × 30, font size 25 × 30, centered. |
| `0x202940`–`0x202ea4` | Read the target's low five RGB565 bits and generate an RGBA4444 atlas cell. This port operates on decoded rows rather than Morton storage. |
| `0x3137b4`–`0x313b44` | Ordered distance records and four boundary-row variants. Neighbor X coordinates clamp to the edge. |
| `0x313bec`, `0x313c6c` | Letter fill and outline tables. The badge branch has separate tables and thresholds. |
| `0x2079fc`, `0x206484` | Folder kind 3 occupies a 32 × 32 cell in a 256 × 256 atlas. Its UV rectangle uses the complete 1/8 cell without the other kinds' half-texel inset. The browser binds the decoded cell at unit UVs. |
| `0x2b1ef8`, `0x1d9738` | Stationary glyphs bind to `LncIconDist_01/P_Icon_00`. `LncIconFolder_00` supplies the separate folder plate; its hidden picture branch is for badges. |
| `0x1d7f3c`, `0x256df4`, `0x257254` | Plain folder glyph width/height table at `0x308808`: `[32,32,24,20,18,16]`; Y table at `0x308838`: `[-6,-6,-3,-3,-2,-1]`, indexed by native density frame. Canvas reverses Y. |
| `0x1e801c`, `0x1e855c` | Pickup binds the glyph to its authored `P_Icon_00`; the source Scale animation supplies dimensions and offset. |
| `0x2b25a0`–`0x2b25c4`, `0x24d0a0` | Default sampler 1 is `IconMask.bclim`. Native flat UV memory is `[.25,.25,.25,1.75,1.75,.25,1.75,1.75]`; the converted layout's row-ordered corners are `[.25,.25,1.75,.25,.25,1.75,1.75,1.75]`. The authored mirrored wrapping and converted UVs are preserved. |

The center of the native “１” is dark RGB 85 with alpha 221; the white outline
has alpha 204. It requires no RGB inversion. The default A4 mask samples zero
RGB and preserves alpha; see the alpha-texture correction in
[`native-home-labels-2026-09-22.md`](native-home-labels-2026-09-22.md). Both source consumer materials
preserve the glyph RGBA in the fully covered interior of that mask.

## Implementation and lifetime

`native-layout.ts` owns the pure outline calculation and per-pane sampler
rebinding. Rebinding clones the picture's material, leaving other panes and the
source pack intact. `native-renderer.ts` accepts immutable pixel snapshots per
draw and includes texture identity in its bounded raster cache. Returning to an
earlier glyph reuses its raster; another folder or rename cannot reuse stale
pixels. The glyph cache keeps at most 64 cells (256 KiB); temporary font targets
are released immediately. The existing renderer disposal releases its canvases.

`firmware-presentation.ts` loads the two additional source layouts and assembles
the glyph after the ordinary folder plate. Pickup binds sampler 0 to the glyph
and sampler 1 independently to the original mask, although both authored slots
initially name the same dummy texture. `screens.ts` forwards folder names at its
existing tile and pickup call sites.

## Verification and limits

Private evidence is under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/presentation/`:

- `native-folder-glyph-bottom.png`: software rendering of the actual assembly.
- `native-folder-glyph-densities.png`: stationary and pickup consumers at all five
  source Scale frames.
- `folder-glyph-mask.png`, `folder-glyph-rgba.png`: intermediate source targets.
- `folder-glyph-tests.log`: 69 focused OS, font, material, banner and cache tests.
- `folder-glyph-comparison.json`: numerical native/software crop comparison.

The 32 × 32 two-row glyph crop matches the existing native capture's source
position and scale. Compared with `reference/home-folder-two-rows-lower.png`,
the actual software consumer has RGB MAE **0.022135**, maximum channel error
**1**, with 68 of 3072 channel samples differing. Both backgrounds are exactly
`[140,220,241]`. This result covers the fullwidth digit “１” in that capture;
it does not establish every glyph or density as pixel-identical. Canvas blend
rounding and native GPU sampling remain separate numerical concerns.

Focused tests cover the packed outline output, low-coverage threshold, boundary
neighbors, transparent hidden RGB, independent sampler bindings, native text
metrics, both real material paths, rename cache isolation and disposal.
Nonincremental TypeScript and `git diff --check` pass. Browser and native UI
control remain with the integration task; browser confirmation of this commit
is pending there. No new browser or Azahar session was operated by this worker.
