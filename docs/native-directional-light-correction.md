# Shared CGFX light direction correction

`cgfx-lighting.ts` now emits
`normalize(-mat3(viewMatrix)*sourceDirection)` for supported directional lights.
This implements the [executed native conversion](native-directional-light-installation.md):
HOME transforms the cached direction with the camera's view matrix, excludes
translation with `w=0`, then negates it before writing PICA light position.

The shared change covers default, folder and other supported authored materials.
It preserves TEV stages, masks, material constants, specular contributions and LUT
sampling. Native float16 truncation between view transformation and normalization
remains a separate precision gap; this change does not claim bit-exact lighting.

## Validation

- **19/19 focused model tests pass**, with the real extracted `BannerDef` selected
  through `FIRMWARE_BANNER_DEFAULT_MODEL`. Tests interpret the emitted direction
  expression in Node and compare it with the committed native ARM mono,
  translated-camera, rotated-camera and nonunit-vector fixtures. They also check
  all five default materials retain the unit disabled-LUT specular term and
  produce positive front-facing diffuse lighting. The real folder's corrected
  half-vector samples its unchanged authored LUT at approximately `0.214974`.
- `npm run typecheck -- --incremental false` and `git diff --check` pass.
- **12/12 generated programs compile and link** in an offline Apple M2 OpenGL
  context: seven folder materials and five default materials. This checks shader
  syntax/linkage; it is not a WebGL draw or visual comparison.

Integration owns the full application checks and matched live default/folder
GPU/native captures. In particular, the folder's authored half-vector LUT changes
with the corrected light direction and needs that visual comparison. No browser,
Azahar, public asset or model was changed in this worker pass.
