# D-pad outline study

This is a reversible study against `silver-plastic-normals.blend`, not a new shipping checkpoint.

The supplied image 3 and the [original-XL front photograph](https://cdn.mos.cms.futurecdn.net/0584727e6f39c0e334d6e9537772f9fa.jpg) show softened outer corners on the cross-shaped cap. The current close-up (`dpad-current-dpad.png`) reveals a square perimeter and uneven rim reflections. The source D-pad contains 104 vertices and 98 triangles. Its overall local XY extent is approximately 18.58253 mm; its source top surface is dished, not planar. This study retains that Z profile and the four existing white direction marks.

`preview_dpad_corners.py` loads the current PNG GLB geometry and source UVs, refines the mesh, and rounds the eight convex outer corners through a local square-to-arc mapping. The 0.7 mm radius is a photographic appearance estimate, not a Nintendo specification. It transforms source normals using the deformation Jacobian. It renders a temporary mesh and restores the original object data; it does not save a blend or export a GLB. A future export must also transform and carry tangent attributes; this native preview is not an export-ready installer.

The trial (`dpad-corner-trial-dpad.png`) was inspected against the current macro and the reference. It softens the outer outline but leaves conspicuous square gaps against the unchanged chassis opening. Do not promote the cap alone. The next fit must round the matching aperture while retaining cap travel and closed-lid clearance. Inner concave corners and rim shading also still need attention.

`dpad-corner-trial.json` records 0.289955 mm maximum vertex displacement, unchanged XYZ extents, and minimum sampled deformation Jacobian determinant approximately 0.50004. These establish a non-collapsing local deformation, not collision clearance or reference fidelity. The prototype's indiscriminate subdivision produces 58,304 triangles; restrict subdivision to affected corners before promotion rather than carrying this unnecessary cost into the website.

Blender restored the source mesh after rendering. The public model remains the verified `silver-plastic-normals-web.glb`; no application code or browser asset changed during this study.
