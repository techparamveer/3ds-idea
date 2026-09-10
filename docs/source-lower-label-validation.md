# Clean lower-button lettering

The active checkpoint is `silver-lower-labels.blend`, following `silver-lid-face.blend`. The homepage mirrors `silver-lower-labels-web.glb`. Earlier files remain preserved.

## Reference and implementation

The outline and relief evidence is recorded in `lower-label-outline-comparison.md` and `lower-label-relief-comparison.md`. SELECT, HOME and START use authored paths constrained by original-XL photographs, including a corrected filled house silhouette. The reference glyphs are only about 8–12 pixels high: these are photographic approximations, not a verified Nintendo font. The 0.02 mm normal-map relief is an appearance estimate, not a measured manufacturing depth.

`build_lower_label_maps.py` produces four 1024-square maps by rasterizing the existing cap triangles into a separate UV1 atlas. It samples the pre-lettering base colour, removes the old lettering's local roughness imprint, and applies the new dark outlines and restrained relief. Normal values retain the carried UV0 tangent frame even though their image is sampled through UV1. `install_clean_lower_labels.py` assigns the maps only to the planar cap tops. The original rim materials remain in place.

An initial four-pixel atlas border produced bright edge speckling in the browser. The accepted maps use 24-pixel dilation. The browser paint shader also now samples its silver mask through original UV0 coordinates; using base-colour coordinates incorrectly moved that mask when a material used UV1 lettering. A regression test covers a UV1 base-colour texture with an offset.

## Verification

Four export checks pass: rig and geometry preservation, exact embedded map pixels, material assignment confined to the three cap tops, and nonzero surface values around vertex UVs. The triangle comparison includes position, normal, tangent and original UV values despite the caps becoming two primitives. These checks establish preservation, not physical accuracy. Two lossless web-packing checks also pass.

The native detail and full front/open renders are `lower-clean-mapped-keys.png`, `lower-labels-final-front.png` and `lower-labels-final-open.png`. Browser inspection at a requested 1280 × 720 viewport shows continuous lower labels without the earlier bright edge speckling. The forced `?surface=baked` view retains the finish and reports WebGL fallback; normal rendering reports VGPU ready. Physical A opens a folder and physical HOME returns home. Space closes the hinge to 0°; the closed silver exterior was inspected. The open pose reports 155°. At a requested 390 × 844 viewport the console remains framed and physical A/HOME also work. Browser warning/error logs were empty in fallback and mobile checks. This pass did not repeat every control or a full swept collision analysis.

All 132 application tests pass against the final public asset. Type checking and the production build passed for the UV0 shader change. The previous shell dimensions, curvature and local clearances are retained by the geometry checks; this lettering pass does not independently re-establish those measurements.

The PNG GLB is 149,276,016 bytes, SHA-256 `c1319b48a97de7d6c01e8eb7afe0da53c8f07fbc3b2d0b1cdfef9822b494a733`. The lossless WebP delivery is 107,798,224 bytes, SHA-256 `7da99dbac89e1e32959e29fd9d8f65e326748185f70a2473cad2c7f3febb43a9`. Four added 1024-square decoded RGBA textures require about 16 MiB before mipmaps. The delivery remains large and is not yet a lightweight production asset.

Exact hardware fidelity and authentic decrypted HOME Menu graphics/font remain unresolved. This is a local lettering and shader correction, not completion of the full product goal.
