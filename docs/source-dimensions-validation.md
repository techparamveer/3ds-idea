# Published envelope correction — 10 September 2026

The active sourced model is `model/candidates/joshua-xl/silver-dimensions.blend`
and its verified closed export is mirrored at `public/models/candidates/joshua-xl.glb`.
It now measures **156 × 93 × 22 mm closed**. This resolves the recorded overall
size discrepancy; it does not establish exact local proportions or photographic
identity. The previous `silver-eur` checkpoint is preserved.

## Evidence and geometry decisions

[Nintendo's original 3DS LL specification](https://www.nintendo.co.jp/hardware/3dsseries/3dsll/index.html)
and [June 2012 announcement](https://www.nintendo.co.jp/corporate/release/en/2012/120622.html)
were rechecked. Both specify 156 × 93 × 22 mm closed. The specification gives
106.2 × 63.72 mm and 84.96 × 63.72 mm active LCDs. Nintendo's
[front image](https://www.nintendo.co.jp/hardware/3dsseries/3dsll/img/3dsll-front.jpg)
was also inspected in the browser. It supports component layout, but its white
finish and illustrated view do not establish the silver material or exact
screen-border measurements.

The actual preceding export measured 156 × 92.396667 × 22.205564 mm. Its front
headphone surround and rear shoulder caps set the depth extrema; the outer lid
sets the upper height. A direct clearance audit found only 0.01676 mm between
the circle pad and the closed inner lid. Lowering the complete lid would have
made that pad intersect it, so the inner contact face stays in place.

`scripts/fit_sourced_dimensions.py` starts from `silver-eur.blend` and applies:

- A 0.301666 mm extension at each front/rear margin, blended over native
  absolute Y = 24.5–32.5 mm. ABXY, circle pad and D-pad positions remain fixed.
  The other controls move rigidly with their adjoining margin.
- A 0.205564 mm reduction at the outer cover, blended through its wall thickness.
  The existing broad crown remains. The inner contact face and glass planes
  retain their closed height.
- The same translation for both hinge sections and their pivot. The native pivot
  moves from `[-0.210388, 39.805470, 16.837027]` to
  `[-0.210388, 40.107136, 16.631462]` mm. The circular barrel sections retain
  their geometry; a small connector band in the fixed body absorbs the change.

These local transition choices are authored corrections to an imported model,
not manufacturer CAD measurements. The smooth connector has a minimum sampled
Jacobian determinant of about 0.794; the lid field stays above 0.931. Neither
field folds. Source shading frames are transformed with the deformation and
carried through the glTF export.

The inner lid and rear upper connector receive shared-edge refinement. This
prevents long original triangles from carrying the hinge adjustment across the
contact face. Unrelated tangent seams remain untouched. The complete model has
122,402 triangles and 68 meshes, including 12 independent controls. All seven
embedded texture images and material factors are unchanged from `silver-eur`.

## Matched native views

`scripts/render_sourced_dimensions.py` produces these pairs with identical
cameras and lights. The two open views use a 155° hinge; the other views are
closed. Native source boot artwork remains visible in these inspection renders;
the website replaces it with live displays.

| View | Before | After |
| --- | --- | --- |
| Front | [Image](../model/candidates/joshua-xl/dimensions-before-front.png) | [Image](../model/candidates/joshua-xl/dimensions-after-front.png) |
| Open three-quarter | [Image](../model/candidates/joshua-xl/dimensions-before-open.png) | [Image](../model/candidates/joshua-xl/dimensions-after-open.png) |
| Closed top | [Image](../model/candidates/joshua-xl/dimensions-before-top.png) | [Image](../model/candidates/joshua-xl/dimensions-after-top.png) |
| Side | [Image](../model/candidates/joshua-xl/dimensions-before-side.png) | [Image](../model/candidates/joshua-xl/dimensions-after-side.png) |
| Rear | [Image](../model/candidates/joshua-xl/dimensions-before-rear.png) | [Image](../model/candidates/joshua-xl/dimensions-after-rear.png) |
| Underside | [Image](../model/candidates/joshua-xl/dimensions-before-underside.png) | [Image](../model/candidates/joshua-xl/dimensions-after-underside.png) |

The visible change is small because the corrections are fractions of a
millimetre. The views show retained seams, rounded exterior, cameras and EUR
artwork. They are not evidence that every local detail matches the references.

## Export and browser verification

`tests/source-dimensions.test.mjs` independently reads the exported geometry.
It checks the complete closed envelope, exact control arrays, all image payloads,
retained source UV samples, closed cap/inner-lid clearance, original barrel
vertices relative to the moved hinge, and geometric crown. It also checks the
actual current screen anchors at 0°, 30°, 90° and 155°: active sizes stay fixed,
and the live planes remain coplanar with, and 0.02 mm ahead of, the source glass.
The smallest closed circle-pad clearance remains approximately 0.01676 mm.

The first browser inspection exposed depth interference between the source
glass and the live upper panel. A 27 × 17 native ray grid found no shell geometry
in front of the active LCD. Its closest surface was the glass, 0.019997–0.020004
mm behind the live plane. The live display material now uses a small polygon
depth offset in `src/scene/console-scene.ts`, preserving its physical position.
This cleared the artifact at the same 1164 × 655 framing and at 1280 × 720.

The preview showed VGPU ready, clean displays, A opening a folder, HOME returning,
and lower-screen first-tap selection/second-tap opening. The hinge closed to 0°
and the underside could be rotated into view. A 390 × 844 check kept the complete
open console framed with clean displays; physical A opened a folder. The WGSL
texture generator is unchanged. All 45 tests, TypeScript checking and the
production build passed after promotion.

After a temporary startup-disk/inspection interruption recovered, the promoted
homepage was reloaded at 1280 × 720. It showed clean screens, a 155° settled
hinge, VGPU ready and no browser warnings or errors. The public GLB and verified
native export both have SHA-256
`f2ee0a4366396d57857a04a9552c148628f5d213a642be4610235e65e09d25ed`.
The existing local server also returned HTTP 200.

Reproduction: open `silver-eur.blend`, run the fit script through Blender MCP,
then inspect the separate output and run the dimension tests. Export with the
carried-frame path, as used by the earlier curved pass. Do not rerun an earlier
pipeline stage on this final file. Parameters, input hash and measured output
are stored in `model/candidates/joshua-xl/dimensions-report.json`.

## Remaining fidelity work

The overall envelope is now verified. Front screen surrounds and active-area
placement still need a closer comparison with real hardware; the source glass
extends well beyond the published active areas. Hardware legends remain source
artwork with unverified fine glyph details, and the photographic EUR artwork
retains its resolution limits. Local shell profiles and material appearance
remain approximations. The HOME Menu is still an authored placeholder awaiting
decrypted assets in its separate task. The full project goal remains open.
