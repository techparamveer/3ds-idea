# Outer-camera housing refinement

The active model is `silver-outer-round.blend` and its GLB, following
`silver-outer-optics`. `round_outer_cameras.py` refines the existing two housings,
two optical inserts and the adjacent shell openings. It preserves material maps,
depth coordinates, source shape variation and rig transforms.

The preceding macro views showed obvious polygon corners. A reversible diagnostic
(`inspect_outer_housing.py`) disconnected normal maps, first on the lid alone and
then on both housings too. The latter flattened the apparent bevel but retained
the polygon outline. This established that removing the normal map would discard
useful detail without fixing the geometry.

The accepted pass retains the maps and subdivides the source geometry. A bounded
radial deformation rounds the 16-sided housing contours and 20-sided inserts.
Maximum movement is 0.08838 mm on the shell, 0.07926 mm on each housing and
0.02774 mm on each insert. The shell field fades to zero 5.3 mm from each camera
centre. The source's modest asymmetry is retained; this is not a factory CAD fit.

The first candidate transported every normal/tangent frame through the deformation
and introduced radial shading patches on the silver. Those rejected macros are
`outer-round-after-camera-{left,right}.png`. The accepted candidate retains the
shell's interpolated source shading frames while transporting the housings and
inserts. This is an explicit shading approximation for a small in-plane movement,
not an assertion that the source normal map is physically exact.

Inspected the accepted left macro `outer-round-preserved-frame-camera-left.png`,
right macro `outer-round-final-camera-right.png`, and all six
`outer-round-final-{front,open,top,side,rear,underside}.png` views. The polygon
corners are smoother and the newly introduced shell patches are absent. Existing
uneven normal-map detail on the housings remains; the broad shell profile and
other unresolved fidelity requirements are not established by this pass.

Three new tests verify every untouched mesh, material, image and rig transform;
the 156 × 93 × 22 mm closed envelope; unchanged remote shell vertices; valid
shading frames; retained UV layers; source depth extents; and fine tessellation
on the four camera parts. Tests do not prove visual exactness. The numeric report
is `model/candidates/joshua-xl/outer-rounding-report.json`.

All 83 tests pass. At 1280×720 the closed homepage model was visually inspected, reported hinge 0°, model ready and VGPU ready, with no browser warnings/errors. The export and public mirror share SHA-256 `71683d0d2e3d6f33a72aa0f402860ce1482a78555e4c4d144240ae16f260b5e4`.
