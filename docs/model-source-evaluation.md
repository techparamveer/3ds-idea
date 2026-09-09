# Existing-model evaluation — current state, 9 September 2026

The user's direction to source an existing model and rig it has produced the
homepage's active model: a silver derivative of Joshua P.'s original Nintendo
3DS XL. The complete source download, PBR restoration, mechanical rig, live
screens, controls and masked VGPU surface are integrated. The earlier procedural
`.blend` and `.glb` files remain preserved. Further procedural shell rebuilding
is paused; sourcing a model does not remove the remaining fidelity requirements.

## Selected source and alternatives

These listing observations were recorded during the 9 September evaluation.

| Source | Recorded information | Result |
| --- | --- | --- |
| [Joshua P. / Pansdaz](https://sketchfab.com/3d-models/nintendo-3ds-xl-6cf20040dc0e44559c3e69723945afcc) | Original XL, about 9.4k triangles, downloadable red/black PBR model, CC BY 4.0 | Selected. Complete 4K GLB downloaded, inspected, rigged and adapted to silver. |
| [Keita-sama](https://sketchfab.com/3d-models/nintendo-3ds-xl-7ae615e8687a4030b4a24b30ad1425d7) | Original XL, about 7.3k triangles, Maya/Substance Painter, downloadable, CC BY 4.0 | Unused alternative. No complete local geometry or texture evaluation. |
| [3DModels.org: Nintendo 3DS XL (2012)](https://3dmodels.org/3d-models/nintendo-3ds-xl-2012/) | Listing offered separate parts and BLEND/GLB/FBX/OBJ, with a displayed starting price of £45 | Unused paid alternative; no purchase or licence selection made. |

[Wesk's original XL/LL scans](https://bitbuilt.net/forums/threads/3ds-xl-ll-scan.7046/)
were also noted as reference-only shell scans, not a verified redistributable
portfolio asset. No New 3DS XL or standard-size 3DS was substituted.

## Complete source and preservation

The authenticated GLB download is **complete**: 28,850,812 bytes, SHA-256
`cc369289729c1b6cc24dd5aa17802d6984aa75da60ff81e187aeb9ac0fde2f6e`.
All seven embedded PNGs decode successfully and are preserved unchanged under
`model/candidates/joshua-xl/source-textures/`. The original file is retained in
`.local/sources/joshua-xl/original.glb`; `source-download.json` records provenance,
material definitions and image hashes. The source licence is
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

The source's 9,353 triangles are retained across 68 rigid components. Rigging
removed the original presentation transform, converted the roughly 150-degree
source pose to closed rest, fitted an X-axis hinge with 0–155-degree motion,
provided 12 independent controls, and uniformly normalized width to 156 mm.
The static GLB exports closed with identity root rotation and metre scaling.

Material restoration corrected the initial UV V inversion and named the native
UV layer `UVMap`. Blender does not preserve the creator's explicit tangent frames
on import, so each static export restores original NORMAL/TANGENT attributes,
including handedness, after verifying triangle-corner correspondence. The
silver GLB preserves the restored red comparison's geometry, UVs, frame attributes,
hierarchy, material factors and six non-body-colour PNGs exactly. See
`source-texture-transfer-audit.md` for the scope and tolerances of these checks.

## Silver derivative and current runtime

`model/candidates/joshua-xl/silver-source.blend` is the editable silver model;
`silver-source.glb` is its browser export. The fully textured original red finish
remains in `textured-source.blend` and `.glb` for comparison.

`scripts/silver_sourced_material_lowmem.py` reproducibly derives the silver
base-colour atlas and its matching paint mask using one emission quad in an
isolated CPU render scene. The red-paint classifier covers atlas padding and
retains neutral ink and wear. All 11,733,175 unmasked colour pixels are unchanged;
the independent audit found zero differences from the intended pixel conversion.
Normal, metallic, roughness, emission and glass source maps remain intact.
The chosen silver colour is an authored approximation, not a measured paint value.
See `source-lettering-audit.md`.

`DEFAULT_MODEL_URL` now points to `/models/candidates/joshua-xl.glb`, the public
mirror of the silver export. Both the homepage and `/source-preview` use the
sourced model. The adjacent licence file carries creator credit and the change
notice. VGPU applies paint-only roughness variation through
`joshua-xl-paint-mask.png`, retaining the existing source roughness elsewhere.

The two baked boot-artwork pieces are hidden during live rendering and excluded
from pointer hits; their source triangles remain preserved. Dedicated
`console_layout` anchors attach the live screens to the rigid assemblies, and
actual control-mesh bounds determine input centres. Browser QA confirmed A/B,
D-pad, touch selection, HOME and lid close/reopen with VGPU ready. Focused source
transfer, geometry, mask and interaction checks pass. Final full-project checks
are recorded with the delivery checkpoint; earlier test totals are historical.

## Remaining fidelity requirements

- The measured envelope is **156 × 92.397 × 22.233 mm**, compared with Nintendo's
  156 × 93 × 22 mm. It has not been globally deformed to force the target box.
- The source retains **SPR-001(USA)** underside text. The user's EUR regulatory
  block, certification row and serial sticker still need a source-backed atlas
  adaptation. Source lettering must not be presented as a verified Nintendo font.
- Live active rectangles use Nintendo's **106.2 × 63.72 mm** and **84.96 × 63.72 mm**,
  provisionally centred within the source glass and offset 0.02 mm outward. The
  complete glass texture is solid white; it does not reveal an exact active-area
  border. Reference alignment remains unfinished.
- The source has rolled perimeter geometry and broad central planes. Photographs
  do not establish a calibrated crown height or edge radius for a local repair.
  Continue matched front, rear, underside and side comparisons; passing data tests
  does not establish exact resemblance. See `source-geometry-audit.md`.
- Source boot logos and hardware atlases are not firmware HOME Menu assets.
  The plain OS approximation and separate firmware-asset work remain outstanding.

## Historical diagnostics — resolved or superseded

The first 4K download stalled at 4,636,960 bytes. Its complete geometry buffers
allowed the early clay inspection and rigging work, but its missing textures
blocked material evaluation. That transfer blocker is resolved by the complete
source file recorded above. Old `geometry-inspection.*`, `rigged-geometry.*` and
clay inspection renders remain useful historical evidence, not the current
homepage's material state.

The first multi-object EMIT bake (`silver_sourced_material.py`) caused severe RAM
and startup-disk pressure and was superseded by the isolated single-quad pass.
It is excluded from the supported workflow; failed-script records belong under
`.local/failed-scripts/`. Do not rerun it against the current model.

Before sourcing this model, procedural crown experiments produced unresolved
triangular shading patches. Those trials were discarded from the live export;
the earlier model and checkpoints remain preserved. They are not modifications
to the sourced silver rig. Current handoff and reproduction steps are in
`model/candidates/joshua-xl/README.md`.
