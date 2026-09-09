# Source texture and tangent transfer audit

Audited 9 September 2026. This records data preservation and known transfer defects; it does not establish that the creator model is an exact physical replica of Nintendo hardware.

## Source and scope

The completed `nintendo_3ds_xl.glb` is 28,850,812 bytes, SHA-256 `cc369289729c1b6cc24dd5aa17802d6984aa75da60ff81e187aeb9ac0fde2f6e`. Its embedded attribution identifies [Joshua P. (@Pansdaz), Nintendo 3DS XL](https://sketchfab.com/3d-models/nintendo-3ds-xl-6cf20040dc0e44559c3e69723945afcc), licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Keep the creator credit, source link, license, and an account of our rigging/recoloring changes with derived assets.

`model/candidates/joshua-xl/source-download.json` records all original image hashes, dimensions and material definitions. `geometry-inspection.glb` contains the same source geometry attributes without its texture payload, making it a reproducible reference for repository tests without access to the private original-download path.

The source is a **red and black** original XL with USA underside markings. A silver finish is a derivative appearance change. Native source textures are useful evidence for atlas orientation, original lettering and surface treatment; they are not newly extracted Nintendo firmware assets.

## Images and material bindings

All seven images decode successfully with Pillow. The source uses one linear/trilinear sampler, with repeat wrapping on both axes. Every texture uses `TEXCOORD_0`, with no texture-transform extension.

| Original image index | Extracted file under `source-textures/` | Dimensions | Meaning / color space |
| --- | --- | --- | --- |
| 0 | `body-basecolor.png` | 4096 × 4096 | Red/black painted body, printed hardware labels, underside markings; sRGB |
| 1 | `body-metallic-roughness.png` | 4096 × 4096 | G roughness, B metallic; non-color data. R is constant 255 and is not bound as body AO |
| 2 | `body-emissive.png` | 4096 × 4096 | Mostly black, sparse cyan indicator detail; sRGB, palette PNG |
| 3 | `body-normal.png` | 4096 × 4096 | Tangent-space RGB normal map; non-color data |
| 4 | `artwork-basecolor.png` | 2048 × 2048 | Boot logos on black; used for both base color and emission, sRGB |
| 5 | `glass-basecolor.png` | 2048 × 2048 | Constant white, monochrome PNG; sRGB base-color input |
| 6 | `glass-occlusion-roughness.png` | 4096 × 4096 | R AO, G roughness, B constant 255; non-color data |

Source material assignments are determined by the original primitive index, recorded on every rigged component as `source_mesh_index`. **Do not copy candidate material indices directly:** export reordered them.

| Source mesh index | Source material | Texture bindings and factors |
| --- | --- | --- |
| 0 | `standardSurface1` | Base color 0, metallic/roughness 1, emission 2, normal 3. Metallic and roughness factors default to 1. Emissive factor white, strength 2.3654371017. Double-sided |
| 1 | `image` | Base color and emission both image 4. Metallic 0, roughness 0.6, emissive strength 10. Double-sided |
| 2 | `screen` | Base color 5 multiplied by `[0,0,0,0.85]`, metallic/roughness and AO both image 6. Metallic 0, roughness factor 0.4733910894; alpha blend. Specular factor 0.6677274005. Double-sided |

The body normal map must remain non-color. Original factors belong to the source comparison asset. Different studio lighting or runtime display emission can be chosen for the portfolio, but should be assessed as intentional changes rather than a lossless transfer.

## Confirmed UV defect and repair

`scripts/rig_sourced_model.py` originally assigned raw glTF UVs directly to a Blender UV layer called `SourceUV`. Blender stores UV V in the opposite convention. Its installed glTF importer applies `(u,v) → (u,1−v)` when importing, and its exporter applies the same conversion in reverse.

The original geometry-only candidate therefore exported `(source_u, 1−source_v)`. This was measured over **all 68 components and 28,059 triangle corners**: maximum difference from that flipped expectation was `5.960464477539063e−8`; comparison with unflipped source UVs differed by as much as `2.9963321685791016`.

Repair the manually created Blender UVs once with `(u,1−v)` before assigning the imported materials. The exporter then emits the original glTF coordinates. Do not flip the PNG rows as well. Do not repeat the correction on an already corrected mesh.

Coordinates outside the unit square are deliberate:

| Source primitive | U range | V range |
| --- | --- | --- |
| Body | 0.0068613 … 0.9913583 | 0.0062854 … 0.9984678 |
| Artwork | 0.5197801 … 1.9980081 | −0.9981661 … 0.9646169 |
| Glass | 0.0019920 … 1.8878517 | −0.3315617 … 0.9188058 |

Keep repeat wrapping; clamping or normalizing islands destroys the intended logo lookup.

Imported `ShaderNodeNormalMap` nodes explicitly refer to UV layer `UVMap`. The reconstructed meshes originally named their layer `SourceUV`. Rename it to `UVMap` or update every imported UV/normal-map node consistently. Merely correcting the UV numbers is insufficient if the normal-map node names a missing layer.

Implementation evidence from the installed Blender 5.2 glTF add-on:

- `blender/imp/mesh.py`, `uvs_gltf_to_blender`: flips V.
- `blender/exp/primitive_extract.py`, `__get_uvs_attribute`: flips V on export.
- `blender/imp/material_utils.py`, `normal_map`: sets `uv_map='UVMap'`, wires the normal image directly, and marks it as data.
- `__init__.py`: `export_tangents` defaults to false.

## Artwork orientation checked against the native bitmap

Sampling image 4 with its original UVs and projecting the corresponding planar components gives an upright Nintendo 3DS wordmark on upper artwork component 4, and an upright Nintendo oval on lower artwork component 3. Their atlas coordinates include a 90-degree orientation change and repetition; the unwrapped atlas alone is misleading.

Artwork components 0, 1 and 2 sample entirely black regions in this image. Their positions are near the front edge and speakers, but the actual native bitmap contains no headphone or speaker lettering there. Hardware lettering is principally in the body atlas.

For the interactive portfolio, replace only `Source_1_part_03` and `Source_1_part_04` with live displays. Those objects carry `console_replace_with_display=true`. Preserve the other source parts. The bitmap contains boot logos, **not a HOME Menu screenshot**. It does not resolve the provisional relationship between the creator's glass geometry and Nintendo's active-display dimensions.

## Tangent-frame defect discovered after the UV repair

The original body primitive supplies 8,175 explicit `TANGENT` vectors. Its W components include both signs: 1,323 negative and 6,852 positive. The initial rig omitted them. The installed Blender importer does not read `TANGENT` in its mesh import path, and the exporter recalculates them with `calc_tangents()` when enabled.

Exporting tangents is necessary but **does not reproduce this source's explicit tangent frames**. After repairing UVs and enabling tangent export, the textured candidate had 8,190 body vertices. Exact original triangle-corner correspondence, checked against position, UV and normal, showed 8,175 exported tangent W signs differed from the source. Most tangent XYZ directions were close, but there were seam differences. Source normals also changed by up to a vector distance of 0.002651 through Blender's custom-normal conversion.

The lid-closing operation and glTF/Blender axis conversions are proper rotations, and the model uses positive uniform scale. These do not require a tangent handedness reversal. In root glTF coordinates, base vectors retain their original direction; lid vectors receive the same positive X rotation of approximately 150.000009 degrees used to close the geometry. Translation and scale do not affect normalized frame directions. In another mesh-local frame, apply the inverse component rotation afterwards. Preserve source W exactly.

The [glTF 2.0 mesh specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#meshes) defines the bitangent from the normal, tangent direction and tangent W. Consequently, matching UVs and normal-map pixels alone does not establish matching normal-map shading. Do not compensate for a lost frame by blindly inverting the green channel of the original image.

`scripts/restore_sourced_tangents.py` restores the original **NORMAL and TANGENT** attributes after Blender export. It uses every original triangle corner, verifies positions within 0.002 mm, UVs within `2e−6`, and normals within 0.005 before writing. It rejects reordered/changed geometry, missing components, merged source frame seams, reflection, shear, nonuniform component scale and an open exported hinge. Restoring normals together with tangents retains their original orthogonality.

The helper leaves positions, UVs, indices, hierarchy, materials, images and the native `.blend` unchanged. It appends the restored attributes and atomically replaces the supplied GLB only when called with `write=True` or `--write`. Call it after each fresh static export, including derivative silver exports. The default CLI invocation is a dry run.

Dry run against the first textured export checked 58 body components / 8,190 vertices. Maximum original corner-position difference was `0.0000177329420` mm and UV difference `7.4505806e−9`. These checks establish correspondence for the restoration; they do not establish hardware accuracy.

Because the native Blender importer discards source tangents, its automatically reconstructed tangent basis is not itself a reference for exact source GLB shading. Compare the final postprocessed GLB with the original in the same Three.js renderer, under matched camera and lighting, before making visual-equivalence claims.

## Regression checks

`tests/source-textures.test.mjs` checks the source PNG file hashes and IHDR dimensions, all seven unchanged embedded PNG payloads, semantic material/texture bindings and factors, repeat sampling, all 28,059 restored UV corners, and finite normalized tangent frames with explicit handedness. Blender rounds ordinary exported normal/tangent components to four decimals, so the generic frame-sanity tolerance accounts for that.

A separate, stricter test compares source normals and tangent directions after the rigid closing rotation, plus exact W equality, at all 27,297 body triangle corners. This final check requires running the restoration helper; it is expected to fail on the unprocessed Blender export. It prevents a superficially valid tangent frame from being mistaken for the creator's original frame.

The tests read the repository's geometry-only source reference and extracted texture manifest. They do not depend on the user's Downloads folder, image decoding in a DOM, Blender, or a network connection. PNG headers and byte hashes are checked in Node; successful pixel decoding was independently inspected with Pillow during this audit.

The stable `textured-source.glb` has now been postprocessed. All five source-texture tests pass, including original normal/tangent direction and exact W comparisons. `texture_sourced_model.py::export_static` invokes restoration automatically after each successful export. The native `.blend` was not modified by the postprocess, and a matched browser comparison remains separate visual work.

## Silver derivative audit

`silver-source.glb` was independently compared with the restored `textured-source.glb` after the low-memory single-quad color pass. Every attribute value, triangle index, node transform, parent/child relationship and non-root rig metadata value matches across all 68 meshes. This includes positions, UVs, restored source normals and all four tangent components. All material scalar factors and sampler settings are unchanged. The six non-body-color PNG payloads are byte-identical to the source.

The only replaced PBR texture is body base color. Its embedded PNG exactly matches `derived-textures/body-silver-basecolor.png`, SHA-256 `de02a6d179068ed5a40269da3f0a3cb4937ebf8d06c165daa4cfde27e4e8f06e`. The authored silver target is linear RGB `[0.30,0.315,0.33]`; it is an artistic color choice, not a measurement of a real console.

A read-only, full-resolution Pillow/NumPy comparison found:

- The 4096 × 4096 mask contains only values 0 and 255, with **5,044,041 painted pixels** and **11,733,175 unpainted pixels**.
- Every unpainted pixel is byte-identical in all three RGB channels between the original and silver atlases. Maximum unpainted channel difference is zero.
- Every painted pixel changed. All painted RGB triplets have a largest-to-smallest channel difference below 12 levels, consistent with the intended slightly cool neutral finish.

The audited mask is `derived-textures/paint-mask.png`, SHA-256 `5b368a30e13b4047db8f782b57786e79749e776177f6cf5142753f92b848f3ba`. These pixel checks establish that the atlas change retained all non-paint pixels, including neutral ink and wear. They do not establish the photographic accuracy of the selected silver color or the model's physical silhouette.

The shared body material identifies itself as `console_material_role='sourced-body'` and supplies `console_paint_mask='/models/candidates/joshua-xl-paint-mask.png'`. It spans both painted and graphite regions, so runtime VGPU detail must use the mask and preserve the existing roughness texture. Read the mask as non-color data with `flipY=false` and repeat wrapping. `source-paint-surface.ts` applies the small additive variation after Three.js reads the source roughness atlas; black mask pixels retain that result unchanged.

A sixth source-texture regression test now compares both GLBs and checks the derived color file, audited mask hash/header, material bindings/factors, texture payload preservation, exact geometry/frame attributes, rig hierarchy, attribution, provisional screen anchors and mask extras. All six focused tests pass. The original USA markings remain in the silver derivative; the source metadata identifies that regional difference explicitly. Browser visual QA remains separate from these data-preservation checks.
