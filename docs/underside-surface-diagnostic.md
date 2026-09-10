# Underside corner surface diagnostic

This study uses the saved `silver-lower-labels.blend` checkpoint. It does not replace the public model or modify the saved rig.

## Reference

Nintendo's [original LL product page](https://www.nintendo.co.jp/hardware/3dsseries/3dsll/index.html), rechecked for this study, specifies the 156 × 93 × 22 mm closed envelope and the original Silver × Black variant. It does not give a corner cross-section or paint roughness. The silver underside photograph in `source-eur-validation.md` shows a continuous rolled cover edge. The physical scan's broad-curvature measurements remain documented in `source-curvature-validation.md`.

The current model's underside has uneven highlights near its front corners, particularly alongside the headphone opening. This is distinct from its already-corrected plan-view outline. A smooth outline alone does not establish a smooth rolled cross-section.

## Controlled renders

`scripts/preview_underside_normals.py` renders four 1200 × 900 views with the same camera and lights:

1. `underside-normal-current-underside.png`: existing materials and carried normals.
2. `underside-normal-disabled-underside.png`: chassis normal-map strength temporarily zero.
3. `underside-normal-geometric-underside.png`: additionally clears custom split normals on a temporary mesh copy.
4. `underside-untextured-geometry-underside.png`: additionally replaces that copy's material with plain gray, roughness 0.4, without any texture maps.

All four were visually inspected. The corner irregularity remains in the untextured version. Disabling the normal map alone does not fix it, and removes useful small surface details. The trial therefore does not support a global normal-map reduction as the correction. Existing topology, smoothing boundaries and the rolled cross-section need examination together; the untextured render does not distinguish all three by itself. In particular, clearing custom normals does not weld vertices split at source seams.

The broad underside curvature remains visible without maps. The model is not a planar slab, but that fact does not resolve its local cross-section mismatch. The next geometry study should measure corner radial profiles at several heights, protect the headphone opening and cover seam, and compare a local corrected trial under these same lights before exporting.

The script restores the original mesh binding, material and normal-map strengths in `finally`, then removes its temporary data. It does not save or export. The verified public delivery hash remains `7da99dbac89e1e32959e29fd9d8f65e326748185f70a2473cad2c7f3febb43a9`. No application code changed and application tests were not repeated for diagnostic renders.
