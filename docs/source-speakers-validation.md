# Rounded speaker openings

`silver-speakers.blend` / `.glb` follows the preserved `silver-slider` checkpoint.
Only the inner-lid mesh changes. The previous model's eighteen speaker holes
were visibly eight-sided in close-up. The [original silver XL front reference](https://cdn.mos.cms.futurecdn.net/0584727e6f39c0e334d6e9537772f9fa.jpg)
shows circular openings in the same nine-per-side layout. This pass refines the
source openings; it does not claim measured factory hole diameter or CAD.

## Geometry and shading

`round_sourced_speaker_holes.py` finds the eighteen source back-rim loops and
fits their centres using opposite vertex pairs. The common median radius is
0.6663103 mm. Two aperture-adjacent openings had small distortions from the
previous bezel pass. The initial wall correction moves vertices by up to
0.04157 mm to regularize those loops. Subsequent local subdivision and radial
rounding moves refined vertices by up to 0.05072 mm. These are separate stages,
not a claim that their sum is the measured maximum total displacement.

The source depths and hole layout remain. Refinement is confined to edges
within 1.15 mm of a fitted centre, targeting 0.18 mm edges. The inner-lid mesh
grows from 43,457 to 52,817 triangles; 4,910 refined vertices move. All texture
images and complete material definitions are byte-identical to the prior
export. UVs are interpolated, not re-unwrapped. The transformed normal/tangent
frames are carried into the GLB.

Six local source edges at one speaker opening cross opposite tangent
handedness values. The initial general-purpose refiner refused these edges.
The final local refiner preserves existing endpoint signs and chooses the first
endpoint's sign when a midpoint would otherwise have zero handedness. This is
a discrete interpolation compromise for the imported data, not a claim that
the original UV-direction field is repaired analytically. Both speaker banks
were inspected at macro scale after the change; no new visible seam was found.
The shared general-purpose refiner is unchanged.

## Reproduction and evidence

Open `silver-slider.blend`; run `round_sourced_speaker_holes.main()` through
Blender MCP with the project scripts on `sys.path`. It writes the next native
checkpoint, GLB and `speaker-smoothing-report.json`. Do not rerun it against
its output. The report records fitted centres, radius, bounds and source hash.

Compare `speaker-before-speaker.png` with `speaker-after-speaker.png`.
The opposite bank is `speaker-after-speaker-left.png`. Macro cameras use
X ±67, Y −175, Z 265; target X ±67, Y 80, Z 36; orthographic scale 20 mm;
hinge 155°. The black hole silhouettes are now smoothly segmented circles.
Minor source normal-map irregularity at the rim remains visible at high
magnification; this pass does not replace that texture.

All six matched whole-console views were rendered and inspected:
`speaker-after-{front,open,top,side,rear,underside}.png`. They retain the
clamshell contour, artwork, layout and screen openings.

## Verification

All 73 tests pass. Three new export checks verify:

- Every other mesh, rig transform, texture image and material remains unchanged.
- The closed envelope remains 156 × 93 × 22 mm, remote inner-lid vertices are
  retained, and shading frames are finite, orthogonal and have valid signs.
- Both depth rings of all eighteen openings have at least 32 circular rim
  samples, with no angular sector larger than 0.21 radians, at the source
  heights −1.2092 and −0.51638 mm in inner-lid local coordinates.

Browser at 1280 × 720: the updated openings were inspected, VGPU was ready and
no warning/error logs were captured. The viewport override was reset after
verification. No application code changed; a production rebuild was not
repeated for this local mesh revision.

Other source-profile details, hardware typography, authentic HOME Menu assets
and delivery-size optimization remain unfinished. Passing these checks does
not establish exact resemblance to the physical device.

GLB SHA-256: `5f4ff98757ea010da85b447968038e5603a76dd9efb92c0cd82777934cdabe4a`.
