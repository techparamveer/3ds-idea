# Power cap and opening refinement

The `silver-power-fit.blend` checkpoint follows `silver-upper-cover`. The previous power cap and deck opening had visibly sixteen-sided boundaries. The supplied original-XL front photograph (image 3) shows a round control; its resolution does not establish a factory radius or a new button height. This pass rounds the existing source fit and retains the raised symbol texture, position and height.

`preview_power_outline.py` first tried the cap alone. Its close-up exposed the still-angular deck opening, so that isolated trial was not promoted. `preview_power_fit.py` rounds both matching boundaries in common power-local coordinates. It regularizes the source's slightly uneven angular vertices (under .01 mm), refines their triangles, and converts each sixteen-sided boundary into a circle. The central 2 mm radius is protected. The chassis displacement fades out by 4.5 mm radius and below the upper surface. Original UVs, interpolated normal/tangent frames, materials and maps are retained.

The maximum refinement displacements are .05866 mm for the cap and .06006 mm for the opening. Cap triangles increase from 78 to 4,992; chassis triangles from 209,604 to 211,732. The complete chassis bounds and button height remain unchanged. These radii follow the sourced mesh, not manufacturer CAD.

`power-fit-final.json` records a minimum unsigned upper-cap-to-chassis distance of .069329 mm. `power-fit-clearance.json` records 2,146 upper-vertex probes against the closed lid with minimum clearance 1.700661 mm. These are surface probes, not a complete swept-solid collision proof.

The close-up and six full-console final renders were inspected. The circular gap is visibly smoother; the native power-button reflection remains uneven because the retained source normal map carries broad surface distortion. That finish and exact hardware glyph fidelity remain unfinished. Exterior silver curvature, maps and underside artwork are retained.

The independent export test compares every node transform, hierarchy and non-root metadata; all other mesh attributes/index buffers and materials remain identical. It checks the changed meshes for preserved bounds, finite UVs, nondegenerate triangles, unit orthogonal shading frames and tangent handedness. This also protects the ABXY and upper-cover second UV layers. Passing these checks does not establish exact visual identity.

Reproduce by opening `silver-upper-cover.blend`, then invoking `preview_power_fit.main(persist=True)` through Blender MCP. The default invocation is reversible. Export uses carried frames, followed by lossless WebP delivery packing.

## Delivery checks

All 131 JavaScript tests, the dedicated geometry export test, and both lossless packing tests passed. The PNG export is 148,268,008 bytes, SHA-256 `b75ace21b31050a4b60eeb174d5ed7add5ecd9707876a915b4eea5f50f76b896`. The WebP delivery pack is 107,332,268 bytes, SHA-256 `bc3ab21233370d47274fcf502554fb9faf892688886838fbdb2e77ea37c30a71`. The delivery grows by 402,768 bytes; no performance improvement is claimed.

At 1280 × 720 the VGPU path displayed the updated model. The physical power control switched screens off and on, and A opened a folder. Browser warning/error retrieval returned no entries. No application code changed, so an application rebuild was not repeated.

The forced development texture fallback also displayed the model and responded to the physical power button with `powered=false` / `lastInput=power`. Its warning/error retrieval was empty. The normal URL and viewport were restored after verification.
