# Original 3DS XL underside wordmark source

Acquired 2026-09-09. This record covers only the main Nintendo 3DS XL wordmark, not the regulatory line, certification symbols or serial sticker.

## Source and provenance

- Downloaded vector: [Nintendo 3DS XL logo.svg](https://upload.wikimedia.org/wikipedia/commons/9/9e/Nintendo_3DS_XL_logo.svg).
- Source record: [Wikimedia Commons file page](https://commons.wikimedia.org/wiki/File:Nintendo_3DS_XL_logo.svg). It credits Nintendo, identifies the original 3DS XL logo, and cites Nintendo's `SPR_EN_NA.pdf`. The file page labels the asset `PD-textlogo` and separately notes its trademark status. This reports the source metadata rather than asserting a new licensing determination.
- The linked historical [Nintendo North American manual](https://www.nintendo.com/consumer/downloads/SPR_EN_NA.pdf) returned HTTP404 when fetched. We therefore have a Commons-hosted vector attributed to Nintendo's manual, **not independently verified bytes extracted directly from that old official PDF**.
- Nintendo's accessible [UK operations manual](https://www.nintendo.com/eu/media/downloads/support_1/nintendo_3ds_14/Nintendo3DSXL_OperationsManual_UK.pdf) confirms original model SPR-001(EUR). Its contents were readable through the web tool; a cover screenshot timed out in this acquisition pass. It was not used to claim byte-for-byte verification of the SVG.
- The user's underside photograph, `image-5.png`, confirms the wordmark arrangement: wide NINTENDO text, two screen outlines, bold 3DS and narrower XL. The battery cover print is monochrome black. The marketing SVG's red 3 and grey lower-screen outline are consequently rendered black in the model material; their actual vector shapes are preserved.

Local original asset: `public/textures/branding/nintendo-3ds-xl-original.svg`.

- Original bytes: 3,526.
- SHA-256: `2d93fc6993eac6a69c7f49fca0d6c27b84838db7968012b4e36deb7b47888780`.
- Viewbox: `0 0 203 21.1`.
- Paths/polygons contain all glyph outlines; there are no external font, image or script dependencies. The downloaded SVG is preserved unchanged, including its colors.
- The Commons page's historical date field is not used as evidence of the hardware launch date.

## Blender pass and orientation

`scripts/underside_branding.py` imports that exact hashed asset, converts its filled paths to mesh geometry and assigns a single black ink material. It sets total width to 50 mm, maintaining the approximately 9.62:1 source aspect ratio (about 5.2 mm high). Width and placement `(x=0, y=12 mm)` are estimates from the user's photograph, not Nintendo manufacturing measurements.

The script uses the bundled Blender `io_curve_svg` module. Presence was verified at `/Applications/Blender.app/Contents/Resources/5.2/scripts/addons_core/io_curve_svg/`; its operator is `bpy.ops.import_curve.svg`. It enables the module for the current session only when necessary and does not write user preferences. No external add-on installation or font package is needed.

An observer looking at the underside with the hinge at the top sees model −X as screen-right and model +Y as screen-up. The wordmark therefore maps SVG reading-right to model −X and SVG reading-up to model +Y. This is equivalent to rotating a readable front-facing XY wordmark around local Y by 180 degrees. The previous X-axis flip made it upside-down when the whole model was rotated around Y for inspection. The new mapping remains readable under that inspection transform.

The filled mesh is triangulated and adaptively subdivided by longest-edge bisection with a shared midpoint cache until its edges are at most approximately 0.50 mm. Each vertex is then projected onto the actual evaluated Battery cover with a BVH ray and offset 0.015 mm outward. This avoids long flat triangles bridging into the curved surface. BVH transforms are expressed relative to `Base`; inspection rotations on the root do not alter placement. Polygon normals face outward toward the underside.

The old `Bottom branding` is removed only after the new geometry has been imported, validated, subdivided and projected. Other underside labels and hardware remain untouched. Temporary SVG objects, collections and unused import materials are removed. The pass does not save or export the model.

## Verification status

The SVG source was downloaded and inspected as XML, including its glyph paths and fills. It was also rasterized with the project's existing Sharp dependency into a temporary white-background preview and visually inspected: the complete logo, letter counters, dual-screen symbol and small TM are present. This was a diagnostic view only; the original SVG remains unchanged. The main modeling agent subsequently reported successful Blender MCP execution: width50 mm, height5.1985 mm, 15,547 vertices and28,420 triangles. The authoring subagent did not call Blender. Required visual checks remain upright orientation with the hinge above the logo, intact counters in NINTENDO/D/dual screens, black rather than red print, and absence of buried faces or floating edges on the curved cover; execution metrics alone do not prove those visual properties.

The lower regulatory text, certification marks and serial sticker remain separate unresolved fidelity work. This sourced wordmark does not establish that those elements, the complete model, or the whole website are exact reproductions.

## Prepared serial-label fit

`scripts/underside_label_fit.py` prepares a separate single-surface black rim, off-white39×6 mm paper label, barcode silhouette and observed serial `SUH100767841`, centred around `(0,−29 mm)`. It samples the bar widths from the supplied photograph rather than inventing a barcode, but the pattern has not been decoded or verified as machine-readable. Courier New supplies temporary serial glyph outlines and is explicitly tagged as an unverified fallback. No external font is downloaded.

Existing generic model/compliance caption content is preserved, turned upright, and enlarged to50 mm and48 mm widths. Its layout and typography remain unverified; the script does not invent the wording hidden by the stylus or certification logos. The first caption sits at Y−11 mm so its fitted ink does not cross below the console's zero-height crown. Every replacement layer is triangulated, subdivided, independently conformed to the cover and assigned its own outward offset. This avoids the previous duplicate coplanar sticker faces. The pass was authored and syntax-checked but has not been executed by its authoring subagent; the main agent must apply it and inspect the result.
