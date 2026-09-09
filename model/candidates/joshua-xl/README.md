# Joshua P. original XL — active silver model

The homepage now uses the fully textured silver derivative of this sourced
original Nintendo 3DS XL. `DEFAULT_MODEL_URL` points to
`/models/candidates/joshua-xl.glb`, the public mirror of `silver-source.glb`.
The `/source-preview` route uses the same sourced model. The directory name
“candidates” is retained for continuity; this is no longer a textureless preview.
The earlier procedural model files remain preserved.

Source: [Nintendo 3DS XL by Joshua P. / Pansdaz](https://sketchfab.com/3d-models/nintendo-3ds-xl-6cf20040dc0e44559c3e69723945afcc).
Licence: [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/).
Public attribution: `public/models/candidates/joshua-xl.LICENSE.txt`.

## Assets and provenance

| File or folder | Role |
| --- | --- |
| `silver-source.blend` | Current editable silver rig, with its normal native millimetre workspace and opening animation. |
| `silver-source.glb` | Static closed export in metres, with original source normal/tangent frames restored after Blender export. |
| `textured-source.blend` / `.glb` | Preserved fully textured red/black source comparison and reproducible starting checkpoint for the silver pass. |
| `source-textures/` | All seven unmodified embedded PNGs from the complete source download. |
| `derived-textures/body-silver-basecolor.png` | Derived 4K colour atlas; only classified red paint pixels change. |
| `derived-textures/paint-mask.png` | Exact 4K paint-region mask, including atlas padding; mirrored publicly as `joshua-xl-paint-mask.png`. |
| `source-download.json` | Source hash, material definitions and all image hashes/dimensions. |
| `geometry-inspection.*` / `rigged-geometry.*` | Historical geometry-only inspection and initial rig checkpoints. Their substitute materials do not describe the current appearance. |

The complete source GLB contains 28,850,812 bytes, SHA-256
`cc369289729c1b6cc24dd5aa17802d6984aa75da60ff81e187aeb9ac0fde2f6e`,
and is preserved at `.local/sources/joshua-xl/original.glb`. The earlier transfer
stall is resolved. No original FBX archive is needed for this GLB-based workflow.

## Changes and verification

The source's 9,353 triangles were separated into 68 rigid components, with 12
independent controls. Its presentation transform was removed, its approximately
150-degree source pose converted to closed rest, and an X-axis 0–155-degree hinge
rig established. Width was uniformly normalized to 156 mm. The source UV layout
is preserved after correcting Blender's V convention once and naming the native
layer `UVMap`. Post-export restoration preserves the original normal and tangent
frames, including tangent handedness, in the closed rig's coordinate frame.

The silver derivative changes only the body base-colour image. The other six PNG
payloads, material factors, geometry, UVs and restored frame attributes are
preserved from the textured comparison GLB. The audited silver atlas leaves all
11,733,175 unmasked pixels byte-for-byte unchanged. VGPU adds restrained roughness
variation only where the paint mask permits it, preserving the source roughness
on the black deck and other unpainted regions. These data checks do not establish
an exact physical or photographic match. See `docs/source-texture-transfer-audit.md`
and `docs/source-lettering-audit.md`.

The two baked boot-artwork meshes remain in the source geometry but are hidden
at runtime in favour of live displays. Browser checks confirmed A/B, D-pad,
touch selection, HOME and lid close/reopen, with VGPU ready. Tests also cover
source attributes, display axes/sizes, control alignment and masked material
behaviour. The final full-project verification belongs to the current delivery
checkpoint; no changing test total is embedded in this handoff note.

## Reproduce the silver pass

Open `textured-source.blend` in Blender, then run
`scripts/silver_sourced_material_lowmem.py` through Blender MCP. It verifies the
source image, renders a single emission quad in an isolated CPU scene to generate
the colour atlas and paint mask, then removes its temporary render data. Only
after both PNGs are saved does it clone the original PBR material, save
`silver-source.blend`, and export `silver-source.glb` using
`texture_sourced_model.export_static`, including original-frame restoration.
The multi-object `silver_sourced_material.py` bake is superseded and must not be
used; it caused severe memory and startup-disk pressure.

For earlier pipeline stages, `analyze_sourced_rig.py` performs the read-only
component audit; `rig_sourced_model.py` constructs the rig from
`geometry-inspection.blend`; `anchor_sourced_displays.py` adds the initial display
metadata; and `texture_sourced_model.py` restores the full source materials and
UV convention. Those are sequential checkpoint passes, not scripts to run
indiscriminately against the silver file. In particular, the older anchor pass
also writes a geometry-preview public mirror. After any reconstruction, verify
the new export before refreshing the homepage GLB and its paint-mask mirror.

## Remaining fidelity work

The closed envelope measures **156 × 92.397 × 22.233 mm**, compared with Nintendo's
156 × 93 × 22 mm. No nonuniform deformation has been applied simply to force that
box. The source has real rolled shell edges and broadly planar central faces;
photographs have not established a precise crown height to justify local changes.
See `docs/source-geometry-audit.md` and the historical orthographic inspection
renders `source-closed-top.png`, `source-right-side.png`, `source-underside.png`.

The source retains **USA underside markings**. Replacing them with the user's
SPR-001(EUR) block, certification row and serial sticker is still pending.
Hardware lettering is source artwork, not a newly verified Nintendo font.
The live LCDs use Nintendo's 106.2 × 63.72 mm and 84.96 × 63.72 mm dimensions,
provisionally centred within the source glass and offset 0.02 mm outward.
The complete glass bitmap is solid white and does not resolve an exact active-area
border, so placement remains provisional. The plain HOME Menu and firmware-asset
work remain separate from this model's source textures.
