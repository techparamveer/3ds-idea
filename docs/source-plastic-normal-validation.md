# Dark-plastic normal-map correction

`silver-plastic-normals.blend` follows `silver-screen-backings.blend`. The change reduces broad normal-map undulations on the black inner lid and chassis while retaining fine detail. Geometry, active displays, rig and controls are unchanged.

## Evidence and decisions

The user's image 3 and the original-XL front photograph linked in `source-plastic-validation.md` show relatively even molded black plastic. The current checkpoint still showed patchy broad reflections, particularly around the deck edges. Three matching channel-isolation renders (`current-body-normal-{1p0,0p25,0p0}-front.png`) changed only normal strength on temporary material copies. Reducing strength smoothed the deck, but also weakened molded details and would affect the shared silver underside. A blanket normal-strength reduction was not installed.

`build_plastic_normal_study.py` instead separates broad normal-map variation using a 12-pixel Gaussian blur of the encoded tangent-space map. It subtracts 75% of the blurred XY component, then renormalizes. The correction is gated to dark, matte, low-metallic pixels and inverse silver-paint coverage. The radius, retained fraction and gates are authored appearance estimates, not measured surface properties. This is a texture-space filter, not a physical millimetre-scale roughness model.

The two generated `plastic-normal-study-{deck,lid}.png` files are the installed maps despite their study filenames. `plastic-normal-study.json` records inputs and changed-pixel counts. Fully painted silver texels remain byte-identical. Partially covered paint-boundary texels can receive proportional changes. All other texture channels remain unchanged. This is not a claim that every small molded feature is numerically unchanged: visual inspection is needed to assess retained relief.

## Visual checks and reproduction

The intermediate `plastic-normal-frequency-trial-{front,open,underside}.png` and all six `plastic-normal-final` views were inspected. The black plastic reflects more evenly and the small markings remain visible. The silver lid, underside lettering, ports and exterior curves remain present. This pass does not resolve the lens/housing construction issue in `upper-frame-profile-audit.md`, nor establish exact hardware font or OS fidelity.

Run the builder with the NumPy/Pillow runtime, then open the preceding checkpoint and run `install_plastic_normal_finish.main()` through Blender MCP. The installer packs the maps, saves the new editable checkpoint, exports the PNG GLB and restores carried shading frames. `pack_web_model.py` produces the lossless WebP delivery file. Never use that delivery pack as the authoring source.

`tests/test_plastic_normals.py` independently compares every exported mesh attribute and index buffer, node transforms and hierarchy, all UV sets, all material bindings and sampler state. It permits only the two intended normal-image replacements and material names. It also checks that fully painted texels are unchanged. Both checks passed. Runtime verification and packing checks are recorded below when complete.

## Delivery verification

All 131 JavaScript tests passed, alongside the two dedicated normal-map export checks and two independent lossless-packing checks. No application code changed; no redundant application build was run.

At 1280 × 720 the public model loaded with VGPU ready. The black finish and markings were inspected. Physical A opened a folder, HOME returned, and touch selected tile 2. The forced development fallback loaded with `vgpu=webgl-fallback`, displayed the same finish, closed to 0 degrees and allowed underside inspection. Browser warning/error retrieval returned no entries during this check. The normal URL and default viewport were restored. These checks support this asset revision, not a claim of exact hardware or authentic firmware UI.

PNG authoring GLB: 140,183,320 bytes, SHA-256 `956d22a27b6c693126c364c77a0f8a0310e532247510ca3e18ccb85e583ec305`. Delivery GLB: 99,324,416 bytes, SHA-256 `9e60c5fda8248970807e6ff5eca9a31da3a35e2e353a2858252aecd8c7b557f8`. The delivery file is about 2.6 MB larger than the preceding pack; this filter improves surface appearance, not download size.
