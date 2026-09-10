# Current hinge finish

`silver-hinge-finish.blend` / `silver-hinge-finish.glb` follow `silver-outer-round`. See `docs/source-hinge-finish-validation.md` and `scripts/install_hinge_roughness.py`.

# Current rounded outer cameras

`silver-outer-round.blend` / `silver-outer-round.glb` follow `silver-outer-optics`. See `docs/source-outer-round-validation.md` and `scripts/round_outer_cameras.py`.

# Current outer-camera finish

`silver-outer-optics.blend` / `silver-outer-optics.glb` follow `silver-camera-round`. See `docs/source-outer-optics-validation.md` and `scripts/finish_outer_cameras.py`.

# Current rounded camera

`silver-camera-round.blend` / `silver-camera-round.glb` follow `silver-camera`. See `docs/source-camera-round-validation.md` and `scripts/round_inner_camera.py`.

# Current camera finish

`silver-camera.blend` / `silver-camera.glb` follow `silver-speakers` and add independent inner-camera optics. See `docs/source-camera-validation.md` and `scripts/install_inner_camera.py`. The earlier pipeline below is preserved.

# Joshua P. original XL — active silver model

The homepage now uses the fully textured silver derivative of this sourced
original Nintendo 3DS XL. `DEFAULT_MODEL_URL` points to
`/models/candidates/joshua-xl.glb`, the public mirror of `silver-speakers.glb`.
The `/source-preview` route uses the same sourced model. The directory name
“candidates” is retained for continuity; this is no longer a textureless preview.
The earlier procedural model files remain preserved.

Source: [Nintendo 3DS XL by Joshua P. / Pansdaz](https://sketchfab.com/3d-models/nintendo-3ds-xl-6cf20040dc0e44559c3e69723945afcc).
Licence: [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/).
Public attribution: `public/models/candidates/joshua-xl.LICENSE.txt`.

## Assets and provenance

| File or folder | Role |
| --- | --- |
| `silver-pad.blend` / `.glb` | Preserved rounded circle pad checkpoint; see `docs/source-pad-validation.md`. |
| `silver-speakers.blend` / `.glb` | Current rig with rounded speaker openings; see `docs/source-speakers-validation.md`. |
| `silver-slider.blend` / `.glb` | Preserved rig with corrected 3D/OFF cavity shading; see `docs/source-slider-validation.md`. |
| `silver-rubber.blend` / `.glb` | Preserved rig with independent circle-pad rubber finish; see `docs/source-rubber-validation.md`. |
| `silver-plastic.blend` / `.glb` | Preserved rig with corrected inner-lid/chassis roughness; see `docs/source-plastic-validation.md`. |
| `silver-recess.blend` / `.glb` | Preserved rig with rounded recess and localized matte graphite maps; see `docs/source-recess-validation.md`. |
| `silver-chassis.blend` / `.glb` | Preserved smoother black chassis corners checkpoint. |
| `silver-cover.blend` / `.glb` | Preserved smoother lower-cover corners checkpoint. |
| `silver-corners.blend` / `.glb` | Preserved smoothed front lid corners checkpoint. |
| `silver-etched.blend` / `.glb` | Preserved smooth fitted MIC/POWER engraving checkpoint. |
| `silver-legends.blend` / `.glb` | Preserved photographic lower-key ink and reflectance checkpoint. |
| `silver-front.blend` / `.glb` | Preserved upper-bezel geometry checkpoint. |
| `silver-dimensions.blend` / `.glb` | Preserved envelope checkpoint, matching the published closed envelope while retaining controls and contact clearances. |
| `silver-eur.blend` / `.glb` | Preserved photographic EUR underside artwork checkpoint before size correction. |
| `silver-grain.blend` / `.glb` | Preserved curved-shell checkpoint with baked fine paint grain, before EUR artwork. |
| `silver-curved.blend` / `.glb` | Preserved geometry checkpoint adding shallow broad shell curvature measured from an original-XL reference scan. |
| `silver-source.blend` / `.glb` | Preserved silver baseline before curvature, with original source normal/tangent frames restored after export. |
| `textured-source.blend` / `.glb` | Preserved fully textured red/black source comparison and reproducible starting checkpoint for the silver pass. |
| `source-textures/` | All seven unmodified embedded PNGs from the complete source download. |
| `derived-textures/body-silver-basecolor.png` | Derived 4K colour atlas; only classified red paint pixels change. |
| `derived-textures/paint-mask.png` | Exact 4K paint-region mask, including atlas padding; mirrored publicly as `joshua-xl-paint-mask.png`. |
| `derived-textures/body-paint-grain-*.png` | Preserved pre-EUR body normal and metallic/roughness maps. |
| `derived-textures/body-eur-*.png` / `eur-ink-plate.png` | Current body maps, matching paint mask, bounded edit mask and photographic ink plate. |
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

The initial silver derivative changes only the body base-colour image. The other six PNG
payloads, material factors, geometry, UVs and restored frame attributes are
preserved from the textured comparison GLB. The audited silver atlas leaves all
11,733,175 unmasked pixels byte-for-byte unchanged. VGPU adds restrained roughness
variation only where the paint mask permits it, preserving the source roughness
on the black deck and other unpainted regions. These data checks do not establish
an exact physical or photographic match. See `docs/source-texture-transfer-audit.md`
and `docs/source-lettering-audit.md`.

The curved derivative refines the two broad shell meshes to support
shallow geometry changes, increasing the complete model to 59,986 triangles.
All seven silver-baseline image payloads and material factors are retained.
UV interpolation stays aligned at the same physical surface positions. Shading
frames are interpolated, transformed by the deformation's Jacobian and carried
through export. See `docs/source-curvature-validation.md` for the scan evidence,
independent surface probes and the limits of that comparison.

The subsequent paint-grain pass changes only the normal and roughness atlases'
painted pixels. Every unpainted pixel, the metallic channel, five other embedded
images, and every geometric attribute remain exact. See
`docs/source-paint-grain-validation.md` for the pixel audit and close-view limits.

The EUR pass then replaces only bounded underside regions with photographic
regional artwork. The complete geometry, rig and maps outside the edit mask are
unchanged. See `docs/source-eur-validation.md` for provenance, matched views,
pixel audits and lettering-resolution limits.

The current dimension pass then matches the published 156 × 93 × 22 mm closed
envelope. It adds local mesh support on the inner lid and rear connector,
bringing the whole model to 122,402 triangles. Control arrays, all seven images,
inner contact clearances and active LCD dimensions remain intact. See
`docs/source-dimensions-validation.md` for the independent tests and matched views.

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

For the next curvature pass, open the preserved `silver-source.blend`, then run
`scripts/curve_sourced_shell.py` through Blender MCP. It rebuilds mesh attributes
from the verified baseline GLB, refines and curves the broad faces, and saves
`silver-curved.blend` / `.glb`. Custom `_FRAME_N`, `_FRAME_T`, `_FRAME_W` attributes
carry the final GLB-axis shading frames. Export using `export_static` with
`restore_frames=False, export_attributes=True`, then the curvature script's
`restore_export_frames`. Do not run the earlier geometry-correspondence tangent
restorer on this refined mesh: its topology has deliberately changed.

From `silver-curved.blend`, `scripts/grain_sourced_paint.py` renders two isolated
4K emission quads and produces `silver-grain.blend` / `.glb`. The copied material
retains the atlas layout and every other map and factor. It uses the same carried
frame export path as the curved checkpoint. Run `scripts/audit_paint_grain.py`
with NumPy/Pillow to audit decoded pixels independently before promoting it.

From `silver-grain.blend`, run `scripts/create_eur_ink_plate.py`, then
`scripts/apply_eur_underside.py` through Blender MCP. These isolated emission
passes save `silver-eur.blend` / `.glb`. Run `scripts/audit_eur_atlas.py` for the
decoded-pixel audit and mirror the export plus its new EUR paint mask only after
verification. The plate report records the required ignored photographic inputs.

From `silver-eur.blend`, `scripts/fit_sourced_dimensions.py` produces the current
`silver-dimensions.blend` / `.glb`. It uses local margin and outer-cover
corrections, preserves the inner contact face, and moves both hinge sections
together. `scripts/render_sourced_dimensions.py` captures six matched views.
The existing EUR paint mask stays current because no material images change.

For earlier pipeline stages, `analyze_sourced_rig.py` performs the read-only
component audit; `rig_sourced_model.py` constructs the rig from
`geometry-inspection.blend`; `anchor_sourced_displays.py` adds the initial display
metadata; and `texture_sourced_model.py` restores the full source materials and
UV convention. Those are sequential checkpoint passes, not scripts to run
indiscriminately against the silver file. In particular, the older anchor pass
also writes a geometry-preview public mirror. After any reconstruction, verify
the new export before refreshing the homepage GLB and its paint-mask mirror.

## Remaining fidelity work

The closed envelope now measures **156 × 93 × 22 mm**. This resolves the
previous 0.603 mm depth and 0.206 mm thickness differences, but does not prove
all local proportions. The outer lid and underside retain their shallow broad
curvature, informed by Wesk's physical original-XL scan. Matched current views
are `dimensions-before-*.png` and `dimensions-after-*.png`; earlier renders and
checkpoints remain preserved.

The original USA underside artwork has been replaced with the user's
SPR-001(EUR) layout, photographic symbols and serial-label ink. Capture resolution
limits the smallest text and seals; barcode encoding is unverified. SELECT/HOME/START now use photographed dark ink. Other front
hardware lettering remains source artwork, not a verified Nintendo font.
The live LCDs use Nintendo's 106.2 × 63.72 mm and 84.96 × 63.72 mm dimensions,
provisionally centred within the source glass and offset 0.02 mm outward.
The complete glass bitmap is solid white and does not resolve an exact active-area
border, so placement remains provisional. The plain HOME Menu and firmware-asset
work remain separate from this model's source textures.

## Upper bezel refinement

`silver-front.blend` / `.glb` preserves the upper-bezel checkpoint.
`scripts/refine_sourced_front.py` starts from the preserved dimension checkpoint
and narrows only the inner-lid aperture. Its center-line opening is about 112 mm,
an image-derived fit; the active LCD stays 106.2 × 63.72 mm. All other meshes and
all seven images are unchanged. Y now has 0.4655 mm closed clearance beneath the
bezel; the other measured cap clearances and circular hinge sections are retained.
See `docs/source-front-validation.md` for references, comparisons, and limits.
`scripts/audit_sourced_front.py` renders white active LCD footprints and measures
visible openings rather than hidden glass extents. It restores all inspection state.

## Lower-key lettering

From `silver-front.blend`, run `scripts/texture_sourced_legends.py` through Blender MCP to generate six UV-space maps. Run `scripts/audit_legends_atlas.py` independently, then call the module’s `install()` in Blender. This produces `silver-legends.blend` / `.glb`; verify with `scripts/audit_legends_export.py` before mirroring publicly. The explicit Separate Color red output is necessary to pack the ink reflectance into glTF specular alpha. Geometry and unrelated atlas pixels stay unchanged. See `docs/source-legends-validation.md` for comparison evidence and the reference-resolution limit.

## Smooth MIC/POWER engraving

From `silver-legends.blend`, run `build_etched_stencils.main()` then `inspect_etched_legends.main(smooth=True, bake=True)` through Blender MCP. Run `scripts/audit_etched_atlas.py` independently before `install_etched_legends.main()`. This creates `silver-etched.blend` / `.glb`; the public mirror is updated only after export tests and browser verification. The fitted glyphs, estimated recess and small-atlas limitations are recorded in `docs/source-etched-validation.md`. Earlier rejected trials remain clearly labelled.

## Front lid contour

From `silver-etched.blend`, run `scripts/smooth_sourced_lid_corners.py` through Blender MCP. It refines only the outer lid’s front corner region and smooths its polygonal contour, retaining the lower mating vertices. This produces `silver-corners.blend` / `.glb` with the same texture payloads. See `docs/source-corners-validation.md` for matched views, reference-scan comparison, export checks and limits.

Latest checkpoint: `silver-abxy-round.blend` / `.glb`, following `silver-hinge-finish`. Run `scripts/round_abxy_caps.py` from its specified starting file. This smooths the four cap outlines, retains source textures and interpolated shading frames, and preserves their rig transforms and depths. See `docs/source-abxy-round-validation.md`.

Latest material checkpoint: `silver-abxy-finish.blend` / `.glb`, following `silver-abxy-round`. Run `build_abxy_roughness.py` then `install_abxy_finish.py` against its declared starting file. See `docs/source-abxy-finish-validation.md` for the isolated cap material and remaining limits.

Latest ink checkpoint: `silver-abxy-ink.blend` / `.glb`, following `silver-abxy-finish`. Run `build_abxy_ink.py`, optionally preview with `inspect_abxy_ink.py`, then `install_abxy_ink.py` against its declared starting file. The UV calibration is saved in `abxy-glyph-uv-fit.json`. Read `docs/source-abxy-ink-validation.md`; these glyphs are photographic approximations, not a verified factory font.

Latest geometry checkpoint: `silver-abxy-openings.blend` / `.glb`, following `silver-abxy-ink`. `round_abxy_openings.py` rounds the four deck apertures at their existing centres and preserves the remainder of the source. See `docs/source-abxy-openings-validation.md`.

Current material checkpoint: `silver-restrained-paint.blend` / `.glb`. It retains the complete openings geometry and installs restrained silver grain plus sparse hairlines on the outer lid and underside. `build_restrained_paint.py` produces the maps and `install_restrained_paint.py` installs them from the openings checkpoint. See `docs/source-restrained-paint-validation.md` for comparisons, exact preservation checks and remaining limitations.

Current editable checkpoint: `silver-lower-keys.blend` / `.glb`, following the material checkpoint above. `round_lower_key_strip.py` rounds SELECT/START outer rear corners and the matching chassis recess, with all material maps retained. Its default is a reversible preview; `main(install=True)` saves and exports after inspection. See `docs/source-lower-key-validation.md`.

The homepage uses `silver-lower-keys-web.glb`, a lossless WebP delivery pack made from that authoring export. Geometry and decoded texture pixels are identical. Continue Blender edits from `silver-lower-keys.blend`; repack only after exporting. See `docs/web-model-packing.md`.

Latest checkpoint: `silver-dock-contacts.blend` / `.glb`, with `silver-dock-contacts-web.glb` on the homepage. Only the two rear docking contacts receive the corrected gold reflectance map; all geometry and other materials are retained. See `docs/source-dock-contact-validation.md`. Use this Blender file for subsequent edits and preserve the earlier checkpoints above.

## Power indicator colour

`silver-power-indicator.blend` and its PNG GLB follow the docking-contact checkpoint. The independent front indicator material replaces cyan emission with blue and retains the unlit charging lens. See `../../../docs/source-power-indicator-validation.md`. The browser uses the lossless `silver-power-indicator-web.glb` delivery pack.

## Rounded cap rims

`silver-abxy-rollover.blend` and its PNG GLB follow the power-indicator checkpoint. The four ABXY rims have a rounded cross-section and continuous radial shading frames, with original extents, top ink and materials retained. See `../../../docs/source-abxy-rollover-validation.md`. The delivery asset is `silver-abxy-rollover-web.glb`.

## Planar cap printing

`silver-abxy-print.blend` and its PNG GLB follow the rounded-cap checkpoint. A 1024-pixel atlas supplies higher-resolution ABXY print on planar top faces, retaining source UVs for plastic maps. See `../../../docs/source-abxy-print-validation.md`. The website uses `silver-abxy-print-web.glb`.

## Screen backing correction

`silver-screen-backings.blend` and its PNG GLB follow the cap-print checkpoint. Both backing materials remove the incorrectly mapped shell AO/roughness atlas; native renders show unlit panels and the website provides the live displays. See `../../../docs/source-screen-backings-validation.md`. The delivery asset is `silver-screen-backings-web.glb`.

Current authoring checkpoint: `silver-plastic-normals.blend` / PNG GLB. The public model mirrors `silver-plastic-normals-web.glb`; see `docs/source-plastic-normal-validation.md`. Earlier checkpoints remain preserved.

Current authoring checkpoint: `silver-dpad-fit.blend` / PNG GLB. The public model mirrors `silver-dpad-fit-web.glb`; see `docs/source-dpad-fit-validation.md`. Earlier checkpoints remain preserved.

Current authoring checkpoint: `silver-dpad-finish.blend` / PNG GLB. The public model mirrors `silver-dpad-finish-web.glb`; see `docs/source-dpad-finish-validation.md`. Earlier checkpoints remain preserved.

Current authoring checkpoint: `silver-upper-cover.blend` / PNG GLB. The public model mirrors `silver-upper-cover-web.glb`; see `docs/source-upper-cover-validation.md`. Earlier checkpoints remain preserved.

Current authoring checkpoint: `silver-power-fit.blend` / PNG GLB. The public model mirrors `silver-power-fit-web.glb`; see `docs/source-power-fit-validation.md`. Earlier checkpoints remain preserved.

Current authoring checkpoint: `silver-power-finish.blend` / PNG GLB. The public model mirrors `silver-power-finish-web.glb`; see `docs/source-power-finish-validation.md`. Earlier checkpoints remain preserved.

Current authoring checkpoint: `silver-lid-face.blend` / PNG GLB. The public model mirrors `silver-lid-face-web.glb`; see `docs/source-upper-width-validation.md`. Earlier checkpoints remain preserved.

The localized inner-lid reflection revision is documented in `docs/source-lid-face-validation.md`.

Current authoring checkpoint: `silver-lower-labels.blend` / PNG GLB. The public model mirrors `silver-lower-labels-web.glb`; see `../../../docs/source-lower-label-validation.md`. This follows silver-lid-face and preserves its geometry and materials outside the three lower cap tops. Run the lower-label map builder against silver-lid-face, then the installer from that native checkpoint; do not apply older passes indiscriminately.

Current authoring checkpoint: `silver-cover-profile.blend` / PNG GLB. Public delivery mirrors `silver-cover-profile-web.glb`. See `../../../docs/source-cover-profile-validation.md`. The source is silver-lower-labels; earlier checkpoints remain preserved.

Current authoring checkpoint: `silver-sd-outline.blend` / PNG GLB. Public delivery mirrors `silver-sd-outline-web.glb`. See `../../../docs/source-sd-outline-validation.md`. Run the SD outline script only from silver-cover-profile; earlier checkpoints remain preserved.
