# Upper opening width correction

`silver-upper-width.blend` follows `silver-power-finish`. It promotes the 115 mm trial documented in `front-layout-calibration.md`. The earlier 112 mm opening treated the pictured dark area as the active LCD; whole-upper-shell scaling of the Nintendo and larger original-XL images instead supports approximately 115 mm. The calibration remains conditional and image-based, with its uncertainty recorded separately.

Only the inner-lid opening changes: 1.5 mm outward on either side, with a smooth transition before the speaker region and rear cover. No vertices or triangles are added. All texture maps, original UVs, other geometry, node transforms, display anchors and the 0–155° rig remain unchanged. The 106.2 × 63.72 mm active upper LCD is retained. Material border widths and the vertical profile remain separate appearance estimates, not consequences of the opening-width fit.

`preview_upper_width.main(persist=True)` validates and saves the checkpoint. Default invocation remains reversible. The deformation transforms normals and tangents using its Jacobian, whose minimum determinant is .55003. The closed envelope is 155.99992 × 92.99996 × 22 mm (float32 precision). The source geometry and deformation details are in `layout-wide-final-report.json`.

Closed-lid surface probes give Y .913783 mm, A/B/X approximately .4655 mm, D-pad .415060 mm, SELECT/HOME/START .385235 mm and power 1.700661 mm. The circle-pad probe remains positive at .016763 mm, its existing very tight fit. The clearance helper accepts an explicit threshold for that check while retaining its normal .1 mm default for other controls. These vertex/ray probes are not a swept-solid collision proof or a factory-tolerance claim.

The dedicated export test verifies node transforms/hierarchy, all material bindings, every unaffected mesh attribute/index, and the changed inner lid's preserved UV/index data and bounds. It checks finite UVs, nondegenerate triangles and orthonormal shading frames. Six final full-console views were inspected; their exterior geometry and textures are retained. The lit planar and 155° front views show the corrected surround-to-shell ratio while preserving both active display footprints.

Reproduce from `silver-power-finish.blend`, invoke the persistent width pass through Blender MCP, then export with carried frames and pack the PNG authoring GLB losslessly for the website. Earlier checkpoints remain preserved. This resolves the earlier width calibration choice; it does not establish exact local shell geometry, lettering or authentic HOME Menu assets.

## Delivery verification

The PNG authoring GLB is 148,418,772 bytes, SHA-256 `2c8238e87bd7577422b21c5425219db4566ce043209c1e1664d34d0d720612e6`. The WebP delivery GLB is 107,447,176 bytes, SHA-256 `322741548672dc2ceeaa2e9fc5365d7d91c09193195838900064bd501084b3b9`. It grows by 852 bytes of metadata; no added textures or triangles are required.

All 131 JavaScript tests, the dedicated width export test and both independent lossless-packing checks passed. On the 1280 × 720 browser preview the active display remained aligned inside the surround, physical A opened a folder, and Space closed/reopened the lid with reported angles 0° and 155°. Warning/error retrieval returned no entries. No application code changed, so an application rebuild was not repeated.

The forced development fallback also displayed the wider surround aligned with the live screen, and physical A opened a folder. Its warning/error retrieval was empty. The normal URL and viewport were restored.
