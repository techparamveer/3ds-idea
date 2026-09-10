# Rounded ABXY rim cross-section

`silver-abxy-rollover.blend` follows `silver-power-indicator.blend`. It retains the sourced cap layout, textures and top lettering, while replacing the straight cap bevel with a rounded transition and continuous radial shading normals.

The original-XL front photograph shows relatively smooth cap rims. It supports rounded molded-plastic appearance, but does not establish a precise bevel radius. [Original-XL front reference](https://cdn.mos.cms.futurecdn.net/0584727e6f39c0e334d6e9537772f9fa.jpg). The previous outline and material passes documented unresolved source shading irregularities; see `source-abxy-round-validation.md` and `source-abxy-finish-validation.md`.

Fresh normal-map diagnostics on the current checkpoint confirmed that some waviness remained even with normal strength zero. The sourced mesh has a straight bevel approximately 0.4505 mm high and 0.46 mm wide, with interpolated source normals and a discontinuity at the side transition. `preview_abxy_rollover.py` maps the existing bevel vertices to a quarter-ellipse transition inside this envelope. It replaces the cap normals with radial ellipse normals and orthogonalizes the existing tangents against them. Tangent handedness and UVs remain unchanged. This is a source-envelope appearance fit, not measured Nintendo CAD.

The first trial exceeded the original diameter by about 0.0013 mm because of small radial variations in the inherited mesh. The final version constrains the transformed rim to the existing diameter. Export tests now pass with less than 0.00001 mm difference in bounding extents. The transition moves 2,241 vertices per cap by no more than 0.134 mm; top ink-surface vertices and cap height are unchanged. No topology, material or image content changes.

`abxy-finish-n0.15-rNone-abxy.png` is the current-checkpoint before view; `abxy-finish-n0-rNone-abxy.png` is the normal-disabled diagnostic. `abxy-rollover-trial-abxy.png` shows the final rounded rim. The earlier `abxy-rollover-whole-*` images record the unconstrained trial; use `abxy-rollover-final-*` for the final six-view record.

`install_abxy_rollover.py` saves a separate checkpoint. The export uses the carried frame attributes. The geometry tests compare all unrelated vertex attributes, all UVs and topology, transforms and hierarchy, and resolve every material image by content. Cap-specific checks verify original extents, unchanged planar ink geometry, bounded displacement and finite unit/orthogonal shading frames.

The closed-lid BVH audit probes 9,858 upper vertices per cap; minimum measured clearance remains about 0.465497 mm. This is a vertex-ray test, not an exhaustive swept-solid collision proof.

This improves cap reflection continuity; it does not establish exact glyphs or complete console fidelity. In particular, the rendered B outline remains uneven; its texture and UV mapping need further inspection, and broader hardware/OS fidelity remains unfinished.

All 126 JavaScript tests pass, including the new rim geometry checks; both independent web-packing tests pass. Python scripts compile. All six final Blender views and the updated cap macro were inspected. The website at 1280 × 720 loaded the new asset with VGPU ready; physical A opened a folder, B returned HOME, and Space closed the hinge to 0° then reopened it. No warning/error logs were returned. No application or shader source changed, and the fallback was not repeated for this geometry-only pass.

Authoring GLB SHA-256: `1643ef395d3d7974f3a0438286d4b22ca7f3447a9c45754367a794e307916abe`. Delivery pack: 104,638,084 bytes, SHA-256 `f739ed1fe6e2e039e1f63e36fcdfb1b82a5f8bc559d7cc48d512a81ac4943d00`. The public GLB mirrors the delivery pack.
