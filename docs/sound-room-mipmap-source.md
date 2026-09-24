# Sound room authored mip sampling

The upper `S_Back_U` room now uses the original mip images and sampler rather
than sampling the base image at every distance. This is a bounded source-backed
correction; the supplied native upper LCD is still not a strict pixel match.

## Original resource evidence

The compressed/decompressed identities and camera remain those recorded in
[sound-room-source.md](sound-room-source.md). Both material texture-0 samplers
specify `LinearMipmapNearest`, `Linear` magnification, `Repeat` for both axes,
`LODBias=0` and `MinLOD=0`.

| Native image | Format | Total levels | Dimensions | Contiguous encoded bytes |
| --- | --- | --- | --- | --- |
| S_BG_U_Tx_A | ETC1A4 | 5 | 128×128 through 8×8 | 21824 |
| S_BG_U_Tx_BC | ETC1 | 4 | 256×128 through 32×16 | 21760 |

SPICA revision `bd29a7828595d7839cda2ac61c76bb63f9071250` reads CGFX
`GfxTexture.MipmapSize` and `GfxTextureImageData.RawBuffer`; `Gfx.ToH3D` preserves
both. The full encoded buffer exactly equals the dimensions/format sum above.
CGFX levels are contiguous here: the separate BCH serializer's 0x80-byte image
padding must not be inserted. The exporter rejects missing or unexplained bytes.
It decodes each original level independently with `TextureConverter.DecodeBuffer`,
then the PNG wrapper flips its bottom-up RGBA rows. No mip images are synthesized.
[evidence/sound-room-mips.json](evidence/sound-room-mips.json) records the level
byte offsets, encoded hashes, published PNG hashes and independent reconstruction.

## Bounded renderer contract

Converter `--mipmaps` is explicit and currently accepts only ETC1/ETC1A4 chains
whose dimensions stay at least 8×8. The ordinary conversion schema remains
unchanged without this flag. The Sound pack publishes seven additional PNGs.
`loadFirmwareModel` includes these files in readiness and rejects a missing PNG.
Only `sound-room.ts` enables `nativeMipmaps`; HOME and other CGFX consumers keep
their existing sampling path.

The opted-in factory validates count, dimensions, ordering and the supported
sampler before allocating GPU resources. It uploads base plus authored levels,
uses `THREE.LinearMipmapNearestFilter`, and disables generated mipmaps. The
installed Three.js WebGL2 uploader allocates exactly the supplied level count
with immutable `texStorage2D`; no invented tail down to 1×1 is necessary. This
matches the [immutable texture storage level contract](https://wikis.khronos.org/opengl/Texture_Storage).
Nonzero bias/minimum LOD and other filters are rejected by this bounded path.

## Verification and remaining differences

The CPU verifier now has `--sampling base` and default authored-mip modes. It
computes perspective UV derivatives, selects the nearest mip from log2 of the
maximum texture-space derivative length, and bilinearly samples that image.
The source camera, transforms and original images are unchanged between runs.
This is a reproducible source specimen, not a claim that WebGL/PICA derivative
and raster rounding are identical.

Against the same settled native capture and unoccluded rectangles
`[0,34,400,70]` and `[0,113,400,58]`, mean absolute RGB error changes from
**5.499140625 to 5.331022135416666 /255** (about 3.06% reduction); maximum error
remains 138. The specimen uses levels 0/1/2 for 176758/13548/404 raster passes.
The window still differs visibly. Do not blur, move the camera, change alpha or
call the overall room 1:1 based on this modest improvement.

The ten exported files (model, two base PNGs, seven mip PNGs) reproduce
byte-for-byte from a second independent scratch/output directory. Focused tests
cover published resource closure, original encoded-byte coverage, actual Three
texture chains/filter/wrap state, unchanged ordinary sampling, missing mip
failure, unsupported sampler rejection, readiness and ownership. Typecheck and
production build pass. Final integrated browser/GPU verification belongs to the
coordinator; this isolated clone did not drive the shared browser or emulator.

Artifacts on the home disk:
`/Users/paramveer/.codex/artifacts/sound-room-mips/{base,native}/` contains
`room-source-native.png`, `room-cpu-source.png` and `report.json` for each mode.
The native capture is
`/Users/paramveer/.codex/artifacts/native-settings-2026-09-24/screenshots/Nintendo 3DS Sound_24.09.26_10.52.20.238.png`.

Reconstruction uses the existing converter command for `S_Back_U.bcmdl.LZ` with
`--mipmaps`; the exporter must first be rebuilt from `scripts/firmware-cgfx`.
Repeat the command with a distinct `--scratch` and output directory to verify
all files against the published pack. Run the source verifier twice with the
same `--model`, `--native`, separate `--output` directories and
`--sampling base` / `--sampling native`.
