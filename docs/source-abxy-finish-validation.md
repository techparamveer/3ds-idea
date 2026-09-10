# ABXY plastic finish

`silver-abxy-finish.blend` and `.glb` follow `silver-abxy-round`. This pass addresses the irregular highlights on the four cap rims while retaining their geometry and source lettering.

The real console reference at `.local/references/front/techradar-original.jpg` shows relatively even molded-plastic caps. `inspect_abxy_finish.py` reversibly disconnects or attenuates the cap normal contribution without changing the shared material on other objects. The zero-normal trial (`abxy-finish-n0.0-rNone-abxy.png`) removed most of the patchy highlights, identifying the baked normal map as their main cause. A second trial used normal strength 0.15 and roughness 0.5.

The final material retains the existing normal texture at strength 0.15 and retains roughness variation using `0.46 + 0.08 * original`. These are photographic appearance fits, not measured Nintendo material values. `build_abxy_roughness.py` modifies only the green channel of a copy of the source metallic/roughness atlas; red and blue are unchanged. `install_abxy_finish.py` assigns an independent `Sourced ABXY plastic` material to the four caps, removes their silver-paint mask metadata, and preserves all other texture inputs. The cap lettering is still sourced and not a verified exact font.

Inspected the final cap macro, front and open views (`abxy-finish-final-*.png`). The rims have more even reflections. Some irregularity remains at the surrounding deck openings and in the original shading frames; this pass does not claim to resolve those geometry details.

Two export tests compare every mesh attribute, index, rig transform, material and resolved texture content against the preceding checkpoint. They verify that only the four caps change material identity, roughness map and normal scale. All 90 repository tests pass. The texture hash is `3592bdbcacac19e5b219b0630a151e22b9efae937af131b35e5cfd18de183626`.

Inspected the live homepage at 1280 × 720 after reloading the new asset: model ready, VGPU ready, hinge 155°, and no browser warning/error logs. The material-only pass does not require a new application build or repeat the preceding geometry/interaction checks. The WebGPU fallback was not exercised in this pass.

Candidate/public GLB SHA-256:
`da5e2f6d63719f8b143ea2019378b12fd21caedfb25382ebc6aaf7355f4028f0`.
