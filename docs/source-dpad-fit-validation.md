# Coordinated D-pad corner fit

`silver-dpad-fit.blend` follows `silver-plastic-normals.blend`. It rounds the eight convex outer D-pad corners and corresponding chassis opening, retaining the cap's source dish, height, placement, dimensions and UV artwork. The 0.7 mm cap radius remains a photographic appearance estimate. References and the rejected cap-only study are in `source-dpad-study.md`.

## Geometry and comparison

The cap-only trial left square gaps. `preview_dpad_fit.py` extends the same corner deformation through the matching opening, with a smooth spatial falloff into the surrounding chassis and a vertical gate protecting the underside. It interpolates source UVs through conforming subdivision and transforms normals and tangents through the deformation Jacobian. Carried shading attributes survive the export. No material or texture image changes in this pass.

The source opening is slightly asymmetric: measured outer limits around the cap include X ±9.535 mm, Y −9.5553/+9.5146 mm, with arm half-widths around 3.21–3.25 mm. The source cap half-length is approximately 9.2913 mm and half-width 2.9142 mm. These are model measurements, not published hardware tolerances. The deformation retains source placement rather than claiming a calibrated fit.

The matched `dpad-fit-final-dpad.png` removes the rectangular corner voids seen in `dpad-corner-trial-dpad.png`. All six final full-console views were inspected. White direction marks and source dish remain visible; the rim's uneven reflections and concave inner corners remain candidates for refinement. This does not declare the whole D-pad identical to the reference.

The cap changes from 98 to 34,198 triangles; the chassis from 123,696 to 209,604. Maximum movement is approximately 0.290 mm and 0.518 mm respectively. XYZ extents are unchanged. This adds 120,008 triangles. The study's 58,304-triangle cap was reduced, but this is not an optimized low-poly result and no performance improvement is claimed. A tighter segment/region subdivision predicate failed to converge and was not installed. The successful conservative region predicate uses 20 allowed refinement iterations; `curve_sourced_shell.refine` retains 12 as its default for older callers.

## Clearance and verification

The nearest chassis surface to sampled upper cap vertices remains approximately 0.22106 mm away. A separate closed-lid ray audit of 7,688 upper D-pad vertices gives minimum clearance 0.415060 mm. These are static vertex probes, not an exhaustive solid-motion collision test. Reports are `dpad-fit-final.json` and `dpad-fit-closed-clearance.json`.

`tests/test_dpad_fit.py` passed. It checks all unchanged objects' geometry attributes/index data, all material/image bindings, node hierarchy/transforms and non-root metadata. For the changed meshes it checks finite vertices/UVs, unchanged bounds, unit orthogonal shading frames and nondegenerate triangles. It does not treat these invariants as proof of visual fidelity.

For reproduction, open the preceding checkpoint and run `preview_dpad_fit.main(persist=True)` through Blender MCP. The default `persist=False` renders and restores temporary meshes. The persistent path saves and exports `silver-dpad-fit`, retaining carried frames. Use the PNG GLB for authoring and the lossless WebP delivery pack for the website.

## Delivery

All 131 JavaScript tests passed. The dedicated export invariant test and two independent WebP packing tests passed. Desktop 1280 × 720 rendered with VGPU ready; clicking D-pad right selected index 2 and physical A opened that folder. The forced development fallback rendered successfully, and at 390 × 844 the whole console remained framed and touch selected index 2. Warning/error retrieval returned no entries during this check. Normal URL and viewport were restored. No application code changed, so no application rebuild was repeated.

PNG GLB: 147,784,756 bytes, SHA-256 `647f6d5df89a097787217b05ad603678ea64150ff64050641253d0a4dd340f02`. Delivery GLB: 106,925,924 bytes, SHA-256 `91b1c9f368195784dbd7064b508828c8e12b6491942549687e5cb7c0c8369a5c`. This increases the delivery file by about 7.6 MB; geometry optimization remains worthwhile. The preserved lower-resolution checkpoint provides a comparison, not a silent fallback.
