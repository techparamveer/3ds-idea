# Rounded inner-camera rim

`silver-camera-round.blend` and its GLB follow the optical-material checkpoint
`silver-camera`. The homepage uses this rounded export.

The preceding macro showed visible polygon corners around the optical insert.
`round_inner_camera.py` refines the existing 16-sided inner-lid opening and
20-sided insert with shared-edge subdivision and a radial deformation. The
opening's slightly distorted source ring is first fitted to a 2.08 mm radius;
this is an appearance fit, not a Nintendo dimension. The insert retains its
approximately 2.05439 mm source radius. Both source centres and depth coordinates
remain unchanged. The local opening deformation fades out at 3.1 mm from its
centre, before the surrounding hardware.

The opening's initial adjustment is at most 0.04411 mm and its subsequent rounding
at most 0.04403 mm. The insert's rounding moves vertices at most 0.02530 mm. These
are separate stages, not a combined maximum. Both deformation Jacobians remain
positive. Normals and tangent frames follow the deformation; both insert UV sets
are interpolated and retained. Texture images and material definitions are unchanged.
The shared subdivision helper now retains all supplied UV coordinates, allowing
the camera's second UV set; its existing two-coordinate callers retain their behavior.

Inspected the matched `inner-camera-after-camera.png` and
`camera-round-after-camera.png` macros. The rounded rim no longer shows the
previous polygon corners. Also inspected all six `camera-round-after-*.png`
whole-console views (front, open, top, side, rear, underside). No new visible gaps
or shading artifacts were found. These inspections do not prove exact factory
geometry or calibrated optical material values.

The new tests compare every other mesh and all transforms, materials and embedded
images; verify 156 × 93 × 22 mm closed; check unchanged remote inner-lid vertices;
and check finely segmented circular rims, valid shading frames and retained UV sets.
The geometry report is `model/candidates/joshua-xl/camera-rounding-report.json`.
The full suite passes 78 tests. Broader hardware fidelity and authentic HOME Menu
assets remain incomplete.

The homepage was inspected at 1280×720: model ready, VGPU ready, no browser warnings/errors, hinge settled at 155° and Space closed it to 0°. The exported GLB and public mirror share SHA-256 `8fa6009b8a1651cc777a51cb43cade9aac56a43dfae62353a49fd88779bb8d9a`.
