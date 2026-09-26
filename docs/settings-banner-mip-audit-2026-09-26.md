# Settings banner mip audit — 26 September 2026

**No authored mip levels were lost.** All five original textures declare
`MipmapSize=1`; every image buffer contains exactly the base level's byte count.
Independent PICA decoding reproduces every delivered PNG's RGBA pixels exactly.
The missing `nativeMipCount` field in delivery is omitted metadata, not evidence
of missing image levels. Do not generate mipmaps to fill this supposed gap.

The coordinator's frame-304 diagnostic was 1,883 upper pixels: wrench 4, title
0, HUD 32 and icons 1,847. This audit does not establish the cause of those
residuals or change their acceptance status. No browser or Azahar was operated.

## Source identity and original records

Settings title `0004001000022000`, content index 0 / ID `0000003d`,
`exefs/banner.bin` SHA-256:
`5804ba5a7768d2ae9b7487e4d277923502646d89768668b19d666e3e4d30fbac`.
EUR English selects the common CGFX at CBMD offset `0x88`, decoded SHA-256:
`96ea28f70671cf2b62aded3e3ef203cdf365929ae9422798255c628499c0910d`.

Offsets below are in that decompressed CGFX. The texture dictionary is `0xc0`.
Its five TXOB image objects have type `0x20000011`. Field offsets come from the
pinned SPICA `GfxObject`, `GfxTexture`, `GfxTextureImage` and
`GfxTextureImageData` declarations: dimensions `TXOB+0x18/+0x1c`, mip count
`+0x28`, format `+0x34`, image self-relative pointer `+0x38`; image byte length
`image+8` and self-relative buffer pointer `image+12`. `Gfx.ToH3D` copies both
`MipmapSize` and `RawBuffer` directly.

| Texture | TXOB | Buffer offset | Size | Format | Mip count | Buffer bytes = base bytes |
| --- | --- | --- | --- | --- | --- | --- |
| COMMON1 | `0x5a7c` | `0x16200` | 512×64 | LA4 | 1 | 32768 |
| COMMON2 | `0x5ad8` | `0x1e200` | 128×128 | A4 | 1 | 8192 |
| COMMON3 | `0x5b34` | `0x20200` | 16×64 | LA8 | 1 | 2048 |
| COMMON4 | `0x5b90` | `0x20a00` | 64×64 | L8 | 1 | 4096 |
| COMMON5 | `0x5bec` | `0x21a00` | 8×8 | LA4 | 1 | 64 |

COMMON2 original buffer SHA-256:
`71c7eb4904c59f96b71d0fb0f07855b331e41125fbfa8843eedc0639ba993bc0`.
COMMON3 original buffer SHA-256:
`4f0ba92f79f5a3add04a3fa86077dbac718cdf1cbab846bd11bfec5f2cdf9eab`.

`mt_pict` binds COMMON2 and `mt_btn` binds COMMON3. All five material samplers
request `LinearMipmapNearest`, with linear magnification, zero LOD bias and
minimum LOD zero. A mip-selecting filter alone does not create stored levels.
The current `createFirmwareModel` default uses base-level linear filtering with
`generateMipmaps=false`. This audit does not prove native/browser sampler
arithmetic equivalence, but it rules out missing authored mip images.

## Converter and safe reproduction

`scripts/firmware-cgfx/Program.cs` exports base pixels by `texture.ToRGBA()`.
Its opt-in `--mipmaps` branch preserves contiguous authored levels only for
ETC1/ETC1A4 and rejects these Settings formats. Do not pass that option for
this source or enable runtime `nativeMipmaps` against incomplete metadata.
No converter, delivered asset, manifest or runtime change is justified by
this audit. If explicit count metadata is desired later, export count 1 and
an empty mip list; preserve base pixels and existing sampler behavior.

To reproduce without publishing raw firmware or running executables:

1. Read the private verified source at
   `/Users/paramveer/.codex/3ds-artifact-overflow/assets/multicontent/verified/extracted/settings/contents/0000-0000003d/exefs/banner.bin`.
   Check its SHA-256 above and call `extract_cbmd(data, 'eur-en')` from
   `scripts/firmware-cgfx/cbmd.py`; assert the decoded hash above.
2. Read little-endian fields at the table's TXOB offsets, resolving each pointer
   as its own byte offset plus its signed 32-bit value. Assert mip count 1,
   image dimensions equal texture dimensions, and buffer size equals
   `width * height * BITS[format] // 8` using `scripts/firmware/texture.py`.
3. Pass the exact bounded buffer to that module's `decode_texture`. Decode the
   corresponding `public/os/firmware/10.7.0-32E/models/settings-banner/texture-N.png`
   to RGBA and compare bytes without resampling. All five comparisons passed.
   The delivered PNGs use filter-zero rows; direct IDAT inflation was sufficient
   for this audit, preserving RGB even under zero alpha.
4. Inspect `model.json` material `TextureMappers` and the manifest's existing
   `models.settingsBanner` resource hashes. The delivery has five base PNGs,
   no mip images and no `nativeMipCount` fields, matching all stored image data.

This documentation-only audit passes `git diff --check`. No application rebuild
is needed. Continue residual investigation in the source material/vertex and
sampling path; do not infer a spatial correction or visual acceptance here.
