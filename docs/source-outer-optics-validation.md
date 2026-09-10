# Outer camera optical finish

The current checkpoint is `silver-outer-optics.blend` / `silver-outer-optics.glb`,
following `silver-camera-round`. The public GLB matches SHA-256
`41846d4af7181d57c01e5ed58d9c3297658ca74a7654fe12d36a7b8ae6e3b8a0`.

Rechecked [Nintendo's original XL specifications](https://www.nintendo.co.jp/hardware/3dsseries/3dsll/index.html),
which distinguish one inner camera and two outer cameras. The separate rear-image
URL returned a cache miss on this pass, so it was not treated as freshly inspected
image evidence. The user's image 2 shows both outer optical centres against the
closed silver lid, and image 4 shows their dark surrounds and smaller inner lens
regions at closer range. These photos support optical detail but do not supply
calibrated colour or roughness measurements.

The two sourced inserts, `Source_2_part_00` and `Source_2_part_01`, shared the
screen material whose exported RGB factor is zero. `finish_outer_cameras.py`
gives only these inserts a shared independent opaque dielectric material. It
reuses the colour and roughness maps from the inner-camera pass with a 0.6 linear
colour multiplier to retain a darker appearance. Each insert receives a second
planar UV set. Original UVs, topology, positions, normals and tangents remain
unchanged. No additional image files or painted highlights are introduced.

Inspected `outer-camera-trial-camera-left.png`, `outer-camera-trial-camera-right.png`,
`outer-camera-trial-top.png` and `outer-camera-trial-rear.png`. The latter two use
the same poses as the preceding `camera-round-after-top.png` and
`camera-round-after-rear.png`. Both lenses now show their optical centres at whole
console scale. The macro views also expose polygonal housings and uneven surround
shading, which this material revision does not fix.

The installer uses the inspected trial configuration without rerendering identical
views. Two export tests verify every existing mesh attribute, rig transform and
other material, plus the second-UV bindings, opaque optical material, source
colour image hash and exported 0.6 multiplier. All 80 tests pass. This verifies
the bounded export change, not exact lens appearance or overall hardware fidelity.

The homepage was inspected at 1280×720 with the lid closed to 0°. Both exterior optical centres are visible; model and VGPU report ready and browser warning/error logs are empty. The open preview was restored afterward.
