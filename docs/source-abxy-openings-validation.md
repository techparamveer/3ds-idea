# Rounded deck openings around ABXY

`silver-abxy-openings.blend` and `.glb` follow `silver-abxy-ink`. The preceding cap macro showed faceted dark boundaries outside the newly rounded caps. Inspection of `Sourced graphite chassis` found 16-sided opening rings at native Z 12.1075 and 13.6928 mm. Several rings were also distorted relative to the cap centres.

`round_abxy_openings.py` regularizes those ring vertices around the existing cap centres with a fitted radius of 4.0155 mm, then subdivides and rounds their edges. This is a source-model correction guided by the circular openings in the reference photographs, not a measured factory clearance. The initial correction moves vertices by at most 0.145884 mm; subsequent rounding moves subdivided vertices by at most 0.077157 mm. These are separate stages, not a claimed total displacement bound. Chassis triangle count changes from 74,676 to 108,276.

Only the upper regions within 5.1 mm of each centre participate. Deck heights, remote chassis vertices, other meshes, all control transforms, materials and image content remain unchanged. Interpolated source shading frames are retained to avoid introducing seams into the baked normal-map shading. The local rounding field has a positive sampled Jacobian; this is not a proof of arbitrary whole-mesh topology properties.

Inspected `abxy-openings-final-abxy.png` against the preceding ink macro: the dark opening boundaries are now smooth. Also inspected all six final front/open/top/side/rear/underside views. The exterior shell and markings retain their prior appearance.

Three export tests verify unchanged other geometry/materials/rig, the closed 156 × 93 × 22 mm envelope, remote chassis vertex retention, normalized shading frames, and circular opening vertices. The clearance check measures the closest point on each ring triangle edge against the cap's maximum radius; each leaves more than 0.08 mm of radial clearance. This checks the modeled rings and cap extents, not real manufacturing tolerances or every possible solid collision.

All 95 repository tests pass. At 1280 × 720 the homepage showed model ready, VGPU ready and hinge 155°. Clicking A opened a folder and B returned HOME, demonstrating that the revised deck does not intercept those controls. No browser warnings/errors were returned. The previous turn's typecheck/build/shader validation remains applicable to unchanged application code; no application rebuild was performed for this asset-only change.

Candidate/public GLB SHA-256:
`1c9506312c659603e0e6b2e1fcaf545f8a73193788f1f43d839a4d455de2d2cb`.

Other hardware details and lettering, material calibration, and authentic HOME Menu assets remain incomplete. This local correction does not establish exact overall fidelity.
