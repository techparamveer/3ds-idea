# Exportable surface maps

`scripts/make_material_maps.py` creates nine deterministic PNGs in
`public/textures/materials/`. They are authored material approximations for the
original silver/black 3DS XL reconstruction, guided by the surface distinctions
recorded in `3ds-xl-research.md`. They do not contain photographs, firmware assets,
logos, lettering, or measured Nintendo material data. Material parameters below
are starting estimates that need reference/render comparison.

## Maps and scale

Each 512 × 512 texture represents a **16 × 16 mm** surface tile. A texel spans
0.03125 mm. All noise and scratches wrap across the tile boundaries. Fine surface
variation is intentionally much smaller than the case's curved profile. These
maps cannot correct a flat shell silhouette.

| Set | Intended surfaces | Mean roughness | Starting metalness | Height RMS represented by normal map |
| --- | --- | --- | --- | --- |
| `silver-*` | Silver outer lid and lower battery cover | 0.345 | 0.4 | 0.00246 mm |
| `graphite-*` | Black interior, deck, shell sides and plastic caps | 0.565 | 0 | 0.00465 mm |
| `silicone-*` | Circle-pad contact surface | 0.715 | 0 | 0.00149 mm |

The silver set uses nearly neutral grey pigment variation and sparse hairlines,
without a brushed-metal direction or bright white gouges. The graphite normal map
has stronger fine grain, while its base-color variation remains under a few RGB
levels; the intended appearance is molded plastic, not mottled stone. Silicone
uses less normal relief and a broader reflection. Its dish remains geometry.
These estimates are not a claim about the actual molding process or paint recipe.

For each set:

- `*-basecolor.png`: RGB **sRGB color**. Use a white base-color multiplier.
- `*-roughness.png`: grayscale **linear non-color data**. Values are absolute
  roughness; use a material roughness multiplier of **1.0**. Do not multiply these
  values by the old scalar roughness again.
- `*-normal.png`: RGB **linear non-color data**, OpenGL tangent-space **+Y**.
  Use a tangent Normal Map node with strength **1.0** initially. This is a normal
  map, not a scalar bump/height map. The tiny geometric slopes are already encoded.

Lenses, active display glass, markings and emissive lights should keep separate
materials. Do not apply the ABS grain to glass or printed glyph meshes. The button
caps may use the same graphite maps at the same physical density with a modestly
lower roughness multiplier (for example 0.9) only if the reference comparison
supports their slightly smoother finish.

## Blender and glTF setup

Author material UVs with **one UV unit per 16 mm of surface distance**. For a
roughly planar top surface this means `u = x_mm / 16`, `v = y_mm / 16`; a 156 mm
wide panel spans 9.75 repeats. Side strips need surface-distance UVs, not projection
onto a collapsed axis. On curved shells, unwrap the rolled edges and retain
comparable texel density. Scaling each object independently to a single 0–1 tile
would make its grain change size between the shell and its buttons.

Use an explicit UV map in the image textures, set image interpolation to Linear,
and extension to Repeat. Set base-color images to sRGB and the other images to
Non-Color. Connect image Color directly to Principled Base Color or Roughness;
connect the normal image through a tangent Normal Map node to Principled Normal.
No procedural shader node is required for this fallback material.

The glTF exporter can pack the grayscale roughness into the G channel of a
metallic/roughness image. Inspect the exported material entries and embedded
images after export, rather than assuming Blender nodes survived. UVs must be
present on every relevant mesh. Existing UVs for screens and non-grained detail
materials must retain their intended orientation and scale.

## Three.js and VGPU

Preserve the GLB's base-color and normal maps when applying the VGPU-generated
silver roughness. A runtime texture loaded outside GLTFLoader must have its
color space assigned correctly (`SRGBColorSpace` for base color and
`NoColorSpace` for roughness/normals), use RepeatWrapping, and match the imported
UV convention (`flipY = false` when replacing an imported glTF texture).

Enable mipmaps and a mipmapped minification filter for grain sampled at steep
angles or from a distance. Moderate anisotropy can preserve the grain near the
case edge. The existing VGPU shader's roughly 0.285 mean roughness differs from
this silver fallback's 0.345; align its range and physical tile scale before
judging the two paths equivalent. Keep normal and base-color textures active in
both paths. Fine grain may average out at full-device scale; compare close-ups
and grazing reflections as well as a normal page view, without enlarging the
grain to make it conspicuous.

## Regeneration and validation

Run with a Python environment containing NumPy and Pillow:

```sh
python3 scripts/make_material_maps.py
```

`manifest.json` records the seed, physical scale, byte count, SHA-256, color means,
roughness range and normal-map convention. The nine PNGs total **1,194,608 bytes**.
They have been inspected as base-color, roughness and normal samples. Opposing
edge gradients are comparable to interior neighboring-pixel gradients, with no
texture boundary introduced by the generator. Regeneration was checked for
byte-identical output.

This is validation of the generated map assets only. Blender placement, GLB
packing, browser visibility, lighting and resemblance to the real console need
separate verification after the maps are applied.
