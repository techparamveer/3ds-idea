# Hinge barrel reflection

`silver-hinge-finish.blend` and its GLB follow `silver-outer-round`. This material
pass restores a narrower reflection on the front hinge barrel while retaining
the matte screen surround.

The full front photograph at `.local/references/front/techradar-original.jpg`
shows a dark barrel with a relatively narrow highlight. The current barrel ray
sample at native inner-lid coordinates (0,0,-5.36856) had roughness 0.63529. It had
inherited the roughness compression used to suppress blotchy reflections on the
large inner screen surround. The initial assumption of excessive gloss was
therefore revised: its broad reflection was making it read grey.

`inspect_hinge_finish.py` temporarily restored the earlier source roughness on
barrel faces. The inspected `hinge-source-roughness-trial-{front,top,rear}.png`
views showed a narrower front highlight. A separate material assignment was only
a diagnostic; the final model retains its original single-material mesh.

For the final pass, call `inspect_hinge_finish.export_uv()` in Blender on the
source checkpoint, then run `build_hinge_roughness.py` with NumPy/Pillow available.
It rasterizes a smooth native-Y mask from -7.4 to -6.4 mm and restores the source
roughness there. It changes only the green channel of the current roughness map:
579,398 pixels change, zero pixels change outside the mask, red/blue channels are
identical, and the UV-overlap check finds no conflicting treatment. This is a
photographic material fit, not a measured Nintendo roughness value.

`install_hinge_roughness.py` replaces only that map on the inner-lid material.
Every original mesh attribute, index, transform, other material and map is retained.
The new texture SHA-256 is
`6d23511f00ac3c4f3b702f19553203a131015232007e174c8f35a47ff24722c2`.

Inspected the final `hinge-finish-after-{front,open,rear}.png` renders. The front
and open views show the narrower reflection; the exterior rear barrel remains
unchanged. The two new export tests check the complete geometry and material
scope of the change. This improves the front barrel only; remaining exterior
finish differences and overall visual fidelity are still unfinished.

All 85 tests pass. At 1280×720 the browser showed the revised hinge, reported 155° open, model ready and VGPU ready, and no warning/error logs. The GLB and public mirror share SHA-256 `6cd6299721de18534f9bcd6deff8b38bbcfe302f0a783e004b8221d065bec42b`.
