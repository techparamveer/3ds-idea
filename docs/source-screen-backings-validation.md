# Screen backing atlas correction

The editable checkpoint is `silver-screen-backings.blend`, following `silver-abxy-print.blend`. The two screen backing materials are corrected; geometry, source UVs, secondary print UVs, shading frames, display anchors and all other materials are retained.

The live upper screen border showed patchy triangular reflections. The source `screen` material used alpha blending at 0.85 and sampled `Image_6` for both ambient occlusion and roughness. Inspection of the packed image and `source-textures/glass-occlusion-roughness.png` showed that it contains a complete shell atlas—buttons, ports, covers and other unrelated parts. The packed and disk images have identical SHA-256 `815c955f94a407acb7e1cf168e28ec793d89d4fa576d6fe6e22de87756610d24`. The glass UVs instead span large rectangular regions, so those shell patterns were projected over the screen backing.

Three temporary browser material diagnostics isolated the fault:

1. Making the backing opaque alone retained the triangular patches.
2. Removing roughness and occlusion textures produced a continuous border reflection.
3. Removing occlusion alone removed the strongest dark triangles but retained unrelated roughness variation.

These trials changed only the temporary public asset's material JSON, with the original copied to `.local/screen-transparency-before.glb`. The final public file is replaced by the independently exported and verified Blender delivery pack.

`install_screen_backings.py` installs two opaque black dielectric backing materials. Upper roughness is 0.18 and lower roughness 0.26, matching the corresponding live display material values; the original specular factor is retained. These are authored appearance parameters, not measured Nintendo optics. The erroneous shell-map bindings are removed rather than blurred. The remaining shell, controls, paint and camera texture maps are unchanged.

Nintendo's [original hardware page](https://www.nintendo.co.jp/hardware/3dsseries/3dsll/index.html) was rechecked for the original Silver × Black model and active LCD sizes; it does not specify material roughness. The [original XL front photograph](https://cdn.mos.cms.futurecdn.net/0584727e6f39c0e334d6e9537772f9fa.jpg) supports a continuous dark screen surround rather than atlas-shaped patches.

`screen-backings-final-front.png` and `screen-backings-final-open.png` show the new native materials. They show unlit panels: the old source boot artwork is behind the opaque backing, while the website's live display planes are in front and remain separate. The source artwork geometry is preserved and remains hidden by the website as before.

Export tests compare every oriented triangle with positions, original UVs, normals and tangents; secondary UVs are also compared explicitly. They verify opaque screen materials with no mismatched image bindings, and content-resolve all other materials to establish that nothing else changed. This correction does not prove exact optical behaviour or complete hardware fidelity.

All 131 JavaScript tests and both independent delivery-packing tests pass. The install script compiles. The two final Blender views and the live website's powered/unpowered views were inspected at 1280 × 720. The screen surround now has continuous reflections without shell-atlas patches. The website loaded with VGPU ready; POWER turned both displays off/on, and lower-screen touch selected tile 2. Browser warning/error logs were empty. No application or shader source changed in this pass.

The removed screen images were unused by the remaining exported materials. The delivery pack is now 96,707,412 bytes, approximately 8.5 MB smaller than its predecessor. Its SHA-256 is `54da0d69bddaa5448b656eacec9f3a5bb11c572502c348d2a00d77c9b2153efc`; authoring GLB SHA-256 is `7f345b422aeb4eea3e66f7f48b4e0358d603a2d7f043983708f977e7d966d6d5`.

The development fallback also loaded with `vgpu=webgl-fallback`; the clean screen surrounds and live panels remained visible. The browser was returned to the normal URL and viewport afterward.
