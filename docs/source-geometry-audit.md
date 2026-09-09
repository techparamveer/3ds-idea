# Sourced XL geometry audit — 9 September 2026

**Historical audit:** the complete textures and a physical original-XL shell scan
became available after this geometry-only inspection. The scan supports a shallow
broad crown; the curved silver derivative is now used on the homepage. See
`source-curvature-validation.md` for that evidence, the deformation and current
measurements. The decisions below describe the earlier evidence available at
this checkpoint, not instructions to preserve planar faces indefinitely.

The Joshua P. candidate has real rolled shell edges and broadly planar central
faces. The current evidence does **not** establish a missing crown as a hardware
defect or justify changing its local proportions. Preserve the geometry while
the complete source textures remain unavailable.

This read-only audit inspected `model/candidates/joshua-xl/rigged-geometry.glb`,
the component/rig reports, the new `source-closed-top.png`, `source-right-side.png`
and `source-underside.png` renders, and supplied photographs 1, 2, 4, 5, 6 and 7.
The underside render has the hinge at the bottom; rotate that view 180 degrees
when comparing handedness with photograph 5. No Blender or website changes were
made for this audit.

## Measured mesh facts

Measurements below are from the exported **closed** candidate, with its 0.001
root scale factored back into millimetres. Native coordinates are X across the
body, Y toward the hinge, and Z upward. They describe this asset, not measured
Nintendo hardware. Values are rounded for readability.

| Item | Measured result | Implication |
| --- | --- | --- |
| Closed envelope | 156 × 92.3967 × 22.2329 mm | Depth is 0.6033 mm below and thickness 0.2329 mm above Nintendo's published 156 × 93 × 22 mm. This is a confirmed specification discrepancy. |
| Main body | Source primitive 0, component 0, `Sourced graphite chassis`: 2,674 triangles | Contains both the broad underside and upper deck. It is not a separate silver battery-cover object. An object-wide silver material would incorrectly recolour black surfaces; retain/use the appropriate source UV regions. |
| Rear base strip | Primitive 0, component 2, `Source_0_part_02`: 1,066 triangles; native Y 26.784–45.143 mm | This is the rear strip, not the broad underside. |
| Outer lid | Primitive 0, component 3, `Sourced outer lid`: 518 triangles | Its rolled perimeter is actual geometry; it is not just a normal-map effect. |
| Lid centre profile | At Y=0, top Z≈22.20557 mm from X=−65 to +65 mm. At X=0, the same plateau extends approximately Y=−35 to +30 mm. | Broad centre planarity is established for the mesh. A corresponding physical crown height is **not** established by the photographs. |
| Lid edge profile | At Y=0, top Z≈22.115 at X=−70, 21.809 at −72, and 20.874 at −75 mm | The side transitions through several polygonal slopes into the curved perimeter. |
| Underside centre profile | At X=0, lower Z≈0.640 mm from Y=−30 to +30; toward the front it rises to 1.437 at Y=−40 and 4.123 at −45 mm | The broad underside is nearly planar centrally with a real rolled front edge. Not a wholly flat slab. |
| Side surface clearance | At X=±75 and Y=−30, −20, 0, +20: deck top≈13.69281; inner-lid underside≈15.42226 mm | Approximately 1.72945 mm between these particular surfaces. This is not minimum whole-device clearance: bumpers, controls and other components occupy different positions. The correct hardware target remains unmeasured. |
| Outer camera lens spacing | Components 36/37 centres: 35.5663 mm | Consistent with the photograph estimate below; no relocation is justified. |
| HOME strip | HOME width 29.5745 mm; SELECT and START 24.9660 mm each | Correctly has a wider central HOME segment. |

Nintendo's envelope is published in its [2012 announcement](https://www.nintendo.co.jp/corporate/release/en/2012/120622.html).
The active display rectangles remain the separately specified 106.2 × 63.72 mm
and 84.96 × 63.72 mm; the source glass meshes are larger. Their provisional
centred anchors are documented in `rig-report.json` and must not be treated as
verified source texture boundaries. [Nintendo display specifications](https://www.nintendo.co.jp/hardware/3dsseries/3dsll/index.html)

## Reference comparisons and remaining uncertainty

Supplied photograph 2 gives roughly 107–108 pixels between camera centres over
approximately 470 pixels of shell width. Scaling that image by the published
156 mm width gives an **estimate** of 35.5–35.9 mm, not a manufacturer measurement.
The candidate's 35.5663 mm is within that picking uncertainty. The previously
rectified photograph-3 strip estimates of HOME 29.2 mm and outer keys 25.2 mm
also agree closely with the source; see `lettering-audit.md`.

The new closed-top and underside renders show polygonal highlight changes near
corners and camera surrounds. The lid has long triangles (maximum edge about
59.55 mm), and its custom vertex normals differ from the geometric face normal
by up to about 11.3 degrees even on the horizontal cap. Smooth shading therefore
contributes to its curved-looking highlights. It cannot change the silhouette.
These observations identify areas to inspect after the intended normal maps
arrive; they do not establish how objectionable the finished sourced material
will look. Clearing or rebuilding the preserved custom normals prematurely
would change the source's shading and its relationship to those maps.

The photographs show broad, relatively uniform central silver faces and rounded
perimeters. Their light gradients alone do not yield a calibrated crown height,
edge radius or closed side gap. The side render's clearance is now recorded,
but the supplied oblique closed photograph is insufficient to declare it too
large. Blank underside branding and absent hardware print in these renders are
texture dependencies, not evidence that the corresponding source mesh details
must be rebuilt.

## Decision for this checkpoint

Preserve the source geometry and normals. No specific local deformation is
supported by the current reference measurements. A later explicit envelope fit
could scale closed-rest depth by 1.0065298 and thickness by 0.9895265, but that
would also change every control profile and make the hinge cross-section about
1.72% elliptical. Matching the outer box would not prove improved visual fidelity.

The complete source PBR download is still missing. Keep the dimensions mismatch,
provisional screen placement and visible low-poly shading limits explicit; do
not claim exact fidelity from this inspection or from passing application tests.
Source provenance and incomplete-download status remain in
`model/candidates/joshua-xl/README.md` and `docs/model-source-evaluation.md`.
