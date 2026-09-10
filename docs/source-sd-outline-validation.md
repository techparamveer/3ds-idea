# SD flap and opening outline

Active checkpoint: `silver-sd-outline.blend`, following `silver-cover-profile.blend`. Earlier checkpoints remain preserved. The SD cover is `Source_0_part_32`; the surrounding opening belongs to `Sourced graphite chassis`.

## Reference and method

The original-XL underside photograph recorded in `source-eur-validation.md` shows rounded SD-cover ends. The previous macro revealed an angular outline made from only 34 flap triangles. This correction follows those existing end positions and the photographic shape; no factory corner radius or measured gap width is available.

`preview_sd_flap_outline.py` refines the two end regions with shared-edge bisection to 0.45 mm and applies the same radial elliptical correction to the flap and surrounding opening. Source tangent handedness is compatible throughout the refined region. UVs and shading frames are interpolated and transported with the deformation Jacobian; the existing SD emblem and material maps remain in use.

The first trial pulled only along the flap's length and produced kinks at the straight-edge junctions (`sd-outline-rejected-sd.png`); it was rejected. A radial trial removed the kinks but extended one end by 0.0719 mm. The final deformation tapers over 0.9 mm at both end limits. An initially sharper taper failed the local compression guard and was discarded before export.

The final flap has 444 triangles, with 230 moved vertices and maximum displacement 0.193606 mm. The chassis has 212,776 triangles, with 280 moved vertices and maximum displacement 0.132664 mm. Minimum sampled Jacobian determinants are 0.746154 and 0.823203. These positive local checks are not a proof of every possible collision or a factory tolerance.

By default the script renders a reversible trial and restores the original meshes. `main(persist=True)` additionally carries frame attributes, saves the new checkpoint, exports, and restores those frames in the GLB. Run it only from `silver-cover-profile.blend`.

## Visual and export verification

The matched `sd-outline-before-sd.png` and `sd-outline-trial-sd.png` macro views show smoother flap ends without the rejected junction kinks. All six `sd-outline-final-*.png` views were inspected after the final end constraint. The flap remains within its preceding bounds. The nearby silver/black shell boundary still contains faceting, and the SD emblem remains source artwork rather than verified factory lettering.

Two export tests pass. They check unchanged rig transforms/hierarchy, material and embedded image payloads, exact other meshes, preserved position/UV triangles outside a conservative local region, unchanged bounds of both modified meshes, and finite unit orthogonal shading frames with valid handedness. The preceding complete-console envelope is thereby retained. These checks do not independently prove exact hardware likeness.

The public model mirrors `silver-sd-outline-web.glb`. Two lossless packing tests and all 132 application tests pass. No application code changed, so the prior successful production build was not repeated.

Browser verification at 1280 × 720: a fresh page reports VGPU ready; the open interior and rotated closed underside were inspected. Physical A opens a folder and HOME returns to the menu. The forced `?surface=baked` path reports WebGL fallback and renders normally. Both fresh-page and fallback warning/error logs are empty. An earlier long-lived tab reported one blob texture-load error during reload; it did not recur in the fresh page. Its cause was not established, so this pass does not claim to have fixed a general loader issue.

The PNG GLB is 149,367,712 bytes, SHA-256 `8b2a4c03b10cb90cabdbe06c9d99244c06e0773668da1bd31728210a8d98c2f3`. The web pack is 107,889,920 bytes, SHA-256 `0966514a9d50a60ec8d4bcab69101644440af81c39c6065d857cc18653c1b2da`. Texture pixels and decoded memory cost are unchanged.

The shell's adjacent paint boundary, source SD lettering and authentic HOME Menu assets remain unresolved. This local refinement does not complete the full fidelity goal.
