# Rounded ABXY cap outlines

`silver-abxy-round.blend` and `.glb` follow `silver-hinge-finish`. The source cap outlines had 16 visible segments. The close-up comparison against `.local/references/front/techradar-original.jpg` supports a smooth circular outline, while the exact glyph design remains unverified.

`scripts/round_abxy_caps.py` refines only Button_A/B/X/Y. It preserves their original transforms, vertical extents, materials and texture images. The local mesh centres differ from the object origins; accounting for those offsets shows a consistent diamond, so button placement was retained. The radial change moves vertices by at most about 0.0754 mm. Each cap now has 27,136 triangles; this is a dense candidate and future optimization must preserve its silhouette.

The first trial transported shading frames through the deformation and produced radial seams (`abxy-round-after-abxy.png`). The accepted version retains interpolated source normals and tangents (`abxy-round-preserved-frame-abxy.png`). This is a limited shading approximation. It smooths the outlines but does not remove the source's uneven bevel shading or establish accurate Nintendo lettering.

Inspected all six final `abxy-round-final-{front,open,top,side,rear,underside}.png` views, plus the before/after cap macros. Unchanged shell geometry retains its prior curved profile and surface maps.

`scripts/audit_abxy_clearance.py` probes 9,858 upper vertices per cap against the closed lid. The minimum measured gap is 0.465497 mm; see `abxy-clearance-report.json`. This is a vertex-ray clearance check, not an exhaustive solid collision proof.

Three export tests check unchanged other meshes, rig transforms, materials and texture hashes; the 156 × 93 × 22 mm envelope; refined cap edges, retained depths and UVs, and finite, normalized, orthogonal shading frames. All 88 repository tests pass.

At 1280 × 720 the live homepage loaded with model ready and VGPU ready. Physical A opened a folder, B returned HOME, lower-screen touch selected tile 2, and Space closed the hinge to 0° and reopened it. The open and closed screenshots were inspected; no browser warning/error logs were returned. No application code changed, so the app build was not repeated. This pass does not verify the WebGPU fallback or exact visual fidelity.

The candidate and public asset have identical SHA-256:
`5f6f24c81c6e55f65fbd3036672e322b3be23e6f33223426700552c6749408f0`.
