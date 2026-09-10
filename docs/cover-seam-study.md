# Lower-cover seam study

This study starts from `silver-sd-outline.blend`. Its accepted follow-up is recorded in `source-cover-seam-validation.md`.

The prior macro shows a segmented silver-to-black boundary at both front corners. Sampling the source atlas and geometry locates it on a pair of narrow mesh rings near native height 5.6 mm. The silver ring has six main corner points, approximately on a 12.49 mm quarter ellipse. These are source-model coordinates, not measured Nintendo CAD. The underside photographic reference remains the one recorded in `source-eur-validation.md`.

## Shading-frame prerequisite

Six edges on the left corner originally cross inconsistent tangent handedness. Four vertices in the current source GLB—602, 603, 604 and 607—store −1 despite every incident UV triangle requiring +1 when evaluated against its stored normal and tangent direction. `repair_handedness` derives the sign from each triangle's UV bitangent, verifies agreement across all incident triangles, and changes only those four signs. It does not average opposite frames. This prerequisite allows shared-edge refinement across the seam without inventing zero-handedness tangents.

This is an export-frame correction. Native Blender normal-map shading derives its own tangent basis, so its before/after renders alone do not verify the source glTF handedness defect.

## Trials

`preview_cover_seam.py` reconstructs the source mesh temporarily, transports its UVs and shading frames, and applies a localized radial correction to the seam rings. By default it restores the original mesh in `finally`. The later `persist=True` path saves a separate checkpoint and exports with carried frames.

The narrow-ring trial adds 8,351 triangles, moves 4,385 vertices by at most 0.151556 mm, and has a minimum sampled Jacobian determinant of 0.989769. Its preserved `cover-seam-narrow-{left,right}.png` views show a smoother boundary, but reveal triangular shading patches in the adjacent black wall. It is not accepted for delivery.

The accepted wider trial extends subdivision to edges entering or leaving the deformation band. This keeps the surrounding wall sampled through the same deformation rather than connecting a dense curved boundary directly to distant coarse vertices. Both sides were inspected: the obvious triangular wall patches are reduced while the outline remains rounded. It adds 12,414 triangles and moves 5,371 vertices by at most 0.151556 mm. The minimum sampled Jacobian determinant is 0.989769.

The four matched macro filenames are `cover-seam-before-{left,right}.png` and `cover-seam-trial-{left,right}.png`. The narrow report is `cover-seam-narrow.json`; the latest trial writes `cover-seam-trial.json`. No application rebuild is needed for this unsaved geometry study.
