# Native folder lighting correction

**Direction-convention follow-up:** [Native draw-time execution](native-directional-light-installation.md)
subsequently proved that HOME negates the view-transformed cached direction.
That source evidence supersedes the SPICA preview sign assumption recorded below.
Integrating the shared correction requires a matched folder capture because it
changes the authored half-vector LUT input.

The supplied native folder captures are `reference/screenshots/_22.09.26_21.31.33.514.png` and `_22.09.26_21.43.16.442.png`, under `/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/`. Browser before was `browser-folder-created-top.png`. The integration task owns browser/native operation and camera changes.

## Color-transfer finding

The old browser face median was RGB `(180,236,249)`, versus native `(104,204,233)`. Its offscreen target used `SRGBColorSpace`; the installed Three.js selects `SRGB8_ALPHA8` for this target, which encodes shader values before readback. These shaders already produce native display-channel values. Integration changed the readback target to `NoColorSpace`/RGBA8 and corrected measured framing independently of this commit.

The actual browser `browser-folder-native-color-top.png` then measured `(117,215,242)` on the broad face. Its dark side measured `(73,175,206)`, versus native `(71,173,204)`. Bounds improved from approximately 60×50 to 121×100, versus native 121×107. These are unmatched-face observations: the initial browser shows the front panel/tab on the left, while the native capture shows the tabbed face on the right. The source skeletal clip only bobs the folder; it has no rotation tracks, so that orientation difference is not explained by its animation phase.

## Authored material and lighting

`mt_folder_00` does not consume fragment primary lighting in its RGB combiner. It blends native constants 0 and 1 using the texture and then adds fragment secondary RGB multiplied by constant 2 alpha (`102/255`, or 0.4). Altering diffuse or ambient values would not correct that face.

The old shader generated secondary color with an arbitrary fixed direction and a power of 16. The material instead enables distribution LUT 0, using `LUT_Folder_00/Folder_00`, `CosNormalHalf`, scale 1. Its specular-0 and source light specular-0 are white; specular-1 is black. `Light_Folder_00` is directional with direction `(0,-0.70710677,-0.70710677)` and zero transform rotation.

The new path uses that direction, transformed into view coordinates, and the authored half-vector lookup. It follows [SPICA's direct directional-vector convention](https://github.com/gdkchan/SPICA/blob/bd29a7828595d7839cda2ac61c76bb63f9071250/SPICA.Rendering/Light.cs), without silently negating it. Native runtime light setup/sign is not separately verified. The ordinary internal icon also consumes its authored Fresnel alpha lookup.

## Conversion and lookup fidelity

SPICA's CGFX conversion loses two relevant pieces of data. Its native light subtype starts at directional=0, whereas H3D directional starts at 1; the exporter now retains `NativeType` directly. Its LUT float table drops the stored interpolation slope; the exporter now retains every raw PICA LUT word.

Each word carries a 12-bit value divided by 4095, an 11-bit difference magnitude divided by 2047, and a separate sign bit. The renderer stores value/difference in a nearest-filtered float texture and interpolates explicitly. Unsigned addressing uses 256 entries over [0,1]; signed addressing wraps the negative half into entries 128–255. Negative inputs to the one-sided unsigned path clamp to zero, rather than reflecting. At the upper endpoint, the last authored slope is retained. These formulas follow [Azahar's LUT representation](https://github.com/azahar-emu/azahar/blob/master/src/video_core/pica/pica_core.h) and [lookup implementation](https://github.com/azahar-emu/azahar/blob/master/src/video_core/shader/generator/glsl_fs_shader_gen.cpp), inspected on 2026-09-22.

SPICA's exported material field names are misleading for this CGFX reference: `LUTDist0SamplerName` identifies the LUT object `LUT_Folder_00`, while `LUTDist0TableName` identifies sampler `Folder_00`. Binding follows the actual source names and rejects a missing table. The folder JSON changes only `luts` and `lights`; mesh, animation, material, provenance and texture records retain their previous values. PNGs are byte-identical.

## Validation and limits

- **35/35 focused tests pass**, including signed/unsigned slopes, upper endpoints, real exported table values, actual light subtype, LUT binding and quarter-scale generation.
- Direct nonincremental TypeScript and diff whitespace checks pass.
- All **7/7 generated material programs compile and link** in an offline Apple M2 OpenGL context. This is a GPU syntax/link check, not WebGL or visual acceptance.
- The directional, unbumped path covers the visible folder and internal icon. Hidden prize bump materials and other unsupported reflection/geometry-factor paths retain the documented approximation.

The LUT change needs an integrated browser recapture. Remaining limitations include native camera/runtime yaw, light convention, normal interpolation parity, final matched-face comparison, visibility timing and empty-folder content/text behavior. This pass does not recolor source textures or material constants to match one screenshot.
