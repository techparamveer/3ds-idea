# D-pad satin finish

`silver-dpad-finish.blend` follows the rounded `silver-dpad-fit` checkpoint. Only the D-pad material changes. Shape, UVs, direction marks, hinge and all other objects remain unchanged.

The supplied image 3 and the original-XL front reference in `source-dpad-study.md` show restrained molded-plastic reflections on the D-pad. Matching `dpad-finish-{normal,roughness,both}-dpad.png` renders isolated normal strength and roughness. Reducing either alone left part of the irregular rim highlight; the combined trial produced a more even satin appearance. The final uses normal strength .15 and roughness `.46 + .08 * source`. These are authored photographic estimates, not measured Nintendo material constants.

`build_dpad_finish.py` creates `dpad-metallic-roughness.png` with the source red occlusion and blue metallic channels unchanged. Its bytes match the previously generated ABXY roughness atlas (SHA-256 `3592bdbcacac19e5b219b0630a151e22b9efae937af131b35e5cfd18de183626`). `install_dpad_finish.py` verifies that equality and shares the existing ABXY image in Blender, avoiding a duplicate embedded atlas. The D-pad retains its own material, colour image and original normal texture at reduced strength. This is not a switch to the ABXY lettering material.

The seven final renders (`dpad-finish-final` close-up and six full views) were inspected. Direction marks and the dished top remain visible, rim highlights are more even, and exterior views retain the silver finish and detail. The later atlas deduplication changes only image identity, not pixels or shader values; the final export invariant test was rerun after that change.

`tests/test_dpad_finish.py` checks every mesh attribute and index buffer, node hierarchy/transforms and non-root metadata. It resolves material image contents and samplers and allows only the D-pad roughness binding, normal strength and material name. It independently verifies unchanged occlusion/metallic channels and retained roughness variation. Both tests passed. Since the geometry is byte-identical, the preceding closure-clearance result still applies; this pass does not add a new geometric tolerance claim.

Reproduce by running the builder, then opening `silver-dpad-fit.blend` and running `install_dpad_finish.main()` through Blender MCP. Preserve PNG GLB authoring and use the lossless WebP pack for browser delivery. Hardware/frame geometry, precise typography, performance optimization and authentic HOME Menu assets remain separate unfinished work.

## Delivery verification

All 131 JavaScript tests, both dedicated material/export checks and both independent packing checks passed. At 1280 × 720 the VGPU path loaded successfully; clicking the D-pad's right arm selected index 2. The forced development fallback also displayed the satin finish with `vgpu=webgl-fallback`. Warning/error retrieval returned no entries during this check. The normal URL and viewport were restored. No application code changed, so no application rebuild was repeated.

The deduplicated PNG GLB is 147,785,652 bytes, SHA-256 `4c95158d68abbc59c3f12fa19ddd3426a5c43d9479f67987d0d5a843807e4afb`. The delivery GLB is 106,927,000 bytes, SHA-256 `55378d6ca476644738008b88b2b100092283771143fa8282071f374608669594`. Sharing the existing atlas keeps this within 1,076 bytes of the preceding delivery file. The first duplicate-atlas export was replaced before public promotion.
