# Complete source texture audit — 9 September 2026

Current update: the source audit below is historical. The active derivative now replaces the USA underside artwork with [photographic EUR markings](source-eur-validation.md); the original source images remain preserved.

The completed `/Users/paramveer/Downloads/nintendo_3ds_xl.glb` contains
28,850,812 bytes, matching its GLB header. This read-only audit decoded its seven
embedded PNGs into a temporary analysis folder. No production texture, Blender
scene or website file was edited.

## Source layers and lettering

| Image index | Size | Source use / observed content |
| --- | --- | --- |
| 0 | 4096² RGB | Main hardware base colour: black interior, red exterior, ABXY ink, underside branding and US regulatory print. |
| 1 | 4096² RGB | Main metallic/roughness map: roughness in G, metallic in B. Dominant red paint has median G=78/255 and B=0. |
| 2 | 4096² palette | Main emissive map, predominantly black with a small cyan indicator. |
| 3 | 4096² RGB | Main normal map, including surface wear, relief detail, SELECT/START/HOME lettering and the home icon. |
| 4 | 2048² RGB | Separate Nintendo/3DS boot-logo artwork, used by the source `image` material as both base colour and emission. This is not a HOME Menu asset. |
| 5 | 2048² one-bit | Entirely white. Source `screen` material supplies black and transparency through its base-colour factor `[0,0,0,0.85]`. |
| 6 | 4096² RGB | Screen packed occlusion/roughness/metallic map, including smudges and wear. |

ABXY letters are baked into image 0. SELECT, START, HOME and the home symbol
are readable in **image 3's normal layer**, although their base-colour islands
are almost uniformly dark. They must not be diagnosed as missing from the source
by looking only at image 0. Their final legibility depends on the restored normal
map and lighting. This audit does not verify an exact Nintendo hardware typeface.

The source underside is explicitly **SPR-001(USA)**. Its print includes the
consumer-service phone line, FCC/Industry Canada text and a Nintendo oval. It
does not reproduce the user's European four-line block, certification row and
serial sticker. Recolouring preserves the source artwork but does not resolve
that regional difference. The user unit's verified reference remains in
`underside-regulatory-reference.md`; do not call the US markings a match.

## Required texture-coordinate correction

The existing geometry-only rig's exported UV V values are inverted relative to
the original GLB. Raw glTF UV values were assigned to Blender loops by the rig
script, then the glTF exporter performed its normal coordinate conversion.

| Mesh | Original GLB V range | Existing rig GLB V range |
| --- | --- | --- |
| Outer lid | 0.67281675–0.99803686 | 0.00196314–0.32718325 |
| A button | 0.17527843–0.31180727 | 0.6881927–0.8247216 |

Before applying unmodified source images to that rig, convert native Blender
loop V to `1−V` exactly once. Mark the repair so reruns cannot invert it again,
then compare exported UV values against the original. This is a coordinate
conversion repair; it does not change the intended UV layout or source geometry.
Keep the original images as source assets rather than silently flipping them.

## Silver recolour method

The dominant paint colour is exactly sRGB **(186,38,38)**, occurring in 3,976,691
pixels. A common worn colour is **(148,79,79)**. The atlas mixes exterior and
interior surfaces, so an object-wide silver material is inappropriate.

Sampling original triangle UV centroids against a conservative red seed
(`R−max(G,B)>12` and `R>1.25×max(G,B)`) finds red only in main primitive components
**0, 3 and 32**: the underside portion of the main body, the outer lid, and the
small side-cover island. Counts are 849/2674, 428/518 and 34/34 triangles
respectively. These are sample counts, not a complete raster coverage mask.

Build the paint-region mask from the eligible exterior UV islands and their red
seeds, retaining black print inside those islands and adding a few pixels of
padding for filtered edges. Do not extend a colour change across the black deck
merely because it belongs to component 0. Work on a derived texture and retain
the original atlas.

A useful continuous recolour separates the red contribution from neutral ink
and wear. In **linear RGB**, let `p=linear_sRGB(186,38,38)`, choose a target silver
`s`, and calculate `a=max(0,(r−max(g,b))/(p.r−p.g))`. Within the paint mask use
`c_new=c+a*(s−p)`, clamping output to the valid range. Neutral black print has
`a=0` and remains unchanged; antialiased mixtures retain their neutral portion
without a hard colour-threshold fringe. Restrict the operation to the exterior
mask so small incidental red-channel noise in the black interior is unaffected.
Choose the target silver by matched rendering, not by treating its RGB value
as a known manufacturer colour.

Preserve the source normal and roughness layers initially. The source's paint
has metallic=0; converting the entire exterior to a metallic shader would change
its painted-plastic treatment. Review the grain, wear and reflectivity in the
browser before adjusting those layers.

## Display placement remains provisional

The solid-white screen base-colour image has no border or alpha mask from which
to recover a smaller active LCD rectangle. The boot-logo atlas also does not
establish calibrated Nintendo active-area dimensions. Keep the published
106.2×63.72 / 84.96×63.72 mm live-display rectangles and the current placement
status explicit until they are compared against the restored physical surrounds.
Hiding the two baked boot-artwork components remains appropriate for live OS
rendering; retain their source geometry and provenance.

Source: [Nintendo 3DS XL by Joshua P. / Pansdaz](https://sketchfab.com/3d-models/nintendo-3ds-xl-6cf20040dc0e44559c3e69723945afcc),
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

## Completed silver-atlas pixel verification

The low-memory Blender render succeeded. A separate read-only NumPy/PIL audit
compared the saved PNGs with the original source pixels and independently
recomputed the linear-RGB transformation. No PNG was edited by this audit.

| Check | Result |
| --- | --- |
| Silver atlas | 4096×4096, 8-bit RGB; SHA-256 `de02a6d179068ed5a40269da3f0a3cb4937ebf8d06c165daa4cfde27e4e8f06e` |
| Paint mask | 4096×4096, 8-bit grayscale; SHA-256 `5b368a30e13b4047db8f782b57786e79749e776177f6cf5142753f92b848f3ba` |
| Binary mask values | Only 0 and 255; exactly 5,044,041 white pixels. |
| Classifier agreement | Zero mask differences from `r−max(g,b)>0.005` and `abs(g−b)<0.000001`, evaluated in linear RGB. |
| Unmasked pixels | All 11,733,175 are byte-for-byte unchanged in the silver atlas. |
| Recolour accuracy | Zero RGB-channel differences across the entire atlas versus the independently computed paint replacement, clamp and rounded sRGB encoding. |
| Dominant paint | All 3,976,691 original `(186,38,38)` pixels became `(149,152,155)`, corresponding to the selected linear target `(0.30,0.315,0.33)`. |
| Orientation | Exact correspondence in the original orientation; horizontal, vertical and 180-degree alternatives do not match. |

The single-quad classifier includes paint padding outside the mesh UV edges.
An independent raster-coverage check found **zero qualifying covered pixels**
on main-material components other than 0, 3 and 32. This protects the known
non-paint parts, including connector gold. These are transfer and transformation
checks, not proof that the chosen silver colour or finish matches Nintendo's
hardware. **The preserved USA underside label remains pending EUR adaptation.**

## Recommended minimal EUR-label change — not implemented

Work on a new derived atlas revision, retaining the original red source and
the verified silver outputs. Keep the source geometry, UVs and other PBR layers.
The US regulatory text lies within approximately pixel rectangle
`x=2522..3580, y=2024..2235` in the 4096² atlas, using top-left image coordinates.
The separate Nintendo oval occupies approximately `x=2928..3175, y=1919..1976`;
the main 3DS XL wordmark is outside both rectangles at approximately
`x=2718..3384, y=2313..2379`. Allow a small antialias margin when preparing masks.

Remove only the US regulatory ink using the local uniform paint colour under
that text, then composite the verified EUR four-line block and address from
`underside-regulatory-reference.md`. The source normal-map crop here shows no
regulatory-letter relief; its median under ink and background is the same
`(127,128,255)`. The packed roughness/metallic medians also agree, `(255,80,0)`.
Consequently a colour-atlas replacement is a substantially smaller change than
new surface geometry. Preserve the main wordmark; the existing Nintendo oval
can supply its actual outline if moved into the EUR symbol row.

Place new artwork through the underside mesh's UV mapping from the documented
physical trial positions, then compare a matching underside view. Do not reuse
the procedural model's coordinates without that mapping. The four-line wording
is verified, but the exact font and several certification outlines remain
unverified. Use an explicitly identified font fallback if necessary; do not
invent certification microtext or substitute unrelated Unicode marks. The
observed serial/sticker can be adapted from the earlier source-backed reference,
with its unverified barcode encoding and font still stated explicitly.

Revise the paint mask alongside the colour atlas: restored paint under removed
US ink must become mask-white, and new dark EUR ink/sticker areas should be
excluded as appropriate. Otherwise VGPU's paint-only roughness treatment could
retain the old US lettering footprint after its colour is gone. Preserve and
compare pixels outside the small authorised label regions in that future pass.
