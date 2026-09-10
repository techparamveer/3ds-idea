# Upper screen bezel refinement — 10 September 2026

The latest homepage checkpoint adds [photographic lower-key lettering](source-legends-validation.md) with this geometry unchanged.

This preserved geometry checkpoint uses `model/candidates/joshua-xl/silver-front.glb`, mirrored at
`public/models/candidates/joshua-xl.glb`. The editable file is `silver-front.blend`.
The visible upper opening is approximately **112 mm wide**, reduced from about
115 mm. The LCD remains **106.2 × 63.72 mm**. This is a photographic fit, not a
claim that the opening is a published Nintendo dimension or that the model is exact.

## Reference comparison

[Nintendo's original product specifications](https://www.nintendo.co.jp/hardware/3dsseries/3dsll/index.html)
were rechecked for the two active display sizes and 156 × 93 × 22 mm closed body.
The [official front image](https://www.nintendo.co.jp/hardware/3dsseries/3dsll/img/3dsll-front.jpg)
was inspected in the browser. At its native 576-pixel width, approximate horizontal
landmarks are x=153–423 for the upper dark display and x=146–430 for the surrounding
light recess. Calibrating against the active display gives a recess width near
112 mm. These are manually read, anti-aliased image boundaries, with roughly
millimetre uncertainty; the illustrated dark panel is not a factory lens drawing.

The user's image 3 shows the same narrower surround on the black inner lid.
Image 7 supports its relationship to the speakers, bumpers and hinge, although
perspective and an unlit display limit measurement. The other supplied photographs
were inspected for the preserved exterior. A
[replacement-lens supplier](https://www.zedlabz.com/products/replacement-top-screen-lens-plastic-cover-for-nintendo-3ds-xl-new-3ds-xl-with-adhesive-strips-black-zedlabz)
describes a bordered protective lens compatible with both original and New XL
units. A [separate seller's lens listing](https://www.ebay.com/itm/125882922240)
labels its replacement 112 × 71 mm. These aftermarket sources are corroboration
only: they do not establish an original Nintendo recess tolerance.

The old 121.306 mm backing-glass width was misleading: part lies behind the shell.
`scripts/audit_sourced_front.py` now intersects actual triangles along both glass
centre lines, excluding replaced boot artwork. At 0.05 mm sampling:

| Opening | Previous visible span | New visible span |
| --- | --- | --- |
| Upper horizontal | −57.50 to +57.50 mm | −56.00 to +56.00 mm |
| Upper vertical | −35.65 to +35.75 mm | unchanged |
| Lower horizontal | −43.55 to +43.55 mm | unchanged |
| Lower vertical | −33.15 to +32.60 mm | unchanged |

Coordinates are relative to each live anchor in the closed native XY plane.
Each transition lies between the last sample and the next 0.05 mm sample.
The dimensions of hidden glass are recorded separately in `front-aperture-audit.json`
and `front-candidate-aperture.json`.

## Geometry and preserved data

`scripts/refine_sourced_front.py` starts only from `silver-dimensions.blend`.
It moves the two aperture sides inward by up to 1.5 mm, blending into the source
inner lid. The field goes to zero before the hinge barrel, outer edge and rear
of the plate. No procedural replacement shell is introduced. Only 2,769 vertices
in `Sourced inner lid` move. Topology, UV artwork and all other meshes remain
unchanged. Source normal/tangent frames follow the deformation Jacobian and are
carried through export; its minimum sampled determinant is 0.67857, with no fold.

The complete closed envelope remains 156 × 93 × 22 mm. The 12 controls, glass,
display anchors, exterior cameras and outer shell geometry are retained. The
circular hinge sections retain their original vertices. The model remains
122,402 triangles / 68 meshes with all seven embedded images unchanged.

The narrower bezel now sits above part of Y that was previously below glass.
Its measured minimum closed clearance changes from 0.913785 to 0.465506 mm;
there is no collision. Other sampled control clearances remain unchanged within
3e-5 mm, including the circle pad's 0.016764 mm minimum. Preserving the old Y gap
was a dimension-pass invariant, not a requirement to keep an oversized opening.

## Visual inspection

The inspection script temporarily supplies white planes at the real active LCD
positions. It renders both the normal 155° pose and a flattened orthographic
comparison. For the latter only, it mutes the hinge's limit constraint; otherwise
Blender clamps a requested 180° inspection to 155° and distorts comparisons.
It restores the constraint, actions, pose, camera, lights and visibility afterward
and does not save temporary display geometry into the model.

| View | Previous | Refined |
| --- | --- | --- |
| Flattened, lit areas | [Image](../model/candidates/joshua-xl/front-audit-planar.png) | [Image](../model/candidates/joshua-xl/front-candidate-planar.png) |
| 155° front, lit areas | [Image](../model/candidates/joshua-xl/front-audit-live-front.png) | [Image](../model/candidates/joshua-xl/front-candidate-live-front.png) |
| Open three-quarter | [Image](../model/candidates/joshua-xl/dimensions-after-open.png) | [Image](../model/candidates/joshua-xl/front-candidate-open.png) |
| Closed top | [Image](../model/candidates/joshua-xl/dimensions-after-top.png) | [Image](../model/candidates/joshua-xl/front-candidate-top.png) |
| Side | [Image](../model/candidates/joshua-xl/dimensions-after-side.png) | [Image](../model/candidates/joshua-xl/front-candidate-side.png) |
| Rear | [Image](../model/candidates/joshua-xl/dimensions-after-rear.png) | [Image](../model/candidates/joshua-xl/front-candidate-rear.png) |
| Underside | [Image](../model/candidates/joshua-xl/dimensions-after-underside.png) | [Image](../model/candidates/joshua-xl/front-candidate-underside.png) |

The front views show the narrower side borders and unchanged active areas.
The lower aperture's slight vertical asymmetry remains. The other views retain
the preceding exterior and artwork; they do not resolve its remaining local
profile, seam, corner smoothness or material-fidelity limitations.

## Export and browser checks

`tests/source-dimensions.test.mjs` now runs against both successive geometry
passes. For the front pass it verifies every other mesh's positions and attributes,
all images/materials, envelope, control clearance, retained circular barrels,
geometric crown and screen sizes through 0°, 30°, 90° and 155°. Actual triangle
intersections bracket the upper opening between 112 and 112.2 mm, and a 5 × 5
grid including the active LCD corners stays clear of the new bezel.

All **48 tests passed**. No application or shader code changed in this pass.
The promoted homepage was reloaded at 1280 × 720: VGPU ready, clean screens,
155° settled hinge, physical A opens, HOME returns, and touch selects on first
tap / opens on second. Space closes to 0°. At 390 × 844 the complete console
and both screens remain framed. Browser warning/error logs were empty.

Both the verified export and public mirror have SHA-256
`ea304674abe0032f74e85d43fe66fa1644b6fe0bcc3a96e3b4ae154ad367dcd2`.
Open a checkpoint through Blender MCP in one call, then run the script in the
next call so the window context is refreshed before glTF export.

## Remaining work

This pass improves the upper surround width. It does not verify exact bevel
depths, all corner radii, material constants or hardware glyphs. SELECT/HOME/START,
POWER and side legends still need close reference matching; the source's wear
and inner-plastic shading remain estimates. The authentic HOME Menu still needs
decrypted assets in its separate task. The full goal remains active.
