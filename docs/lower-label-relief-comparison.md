# Lower-key lettering: revised evidence and relief trial

The dark SELECT/HOME/START labels on the live original-XL model should not be changed to white. The [existing original-XL promotional reference](https://cdn.mos.cms.futurecdn.net/0584727e6f39c0e334d6e9537772f9fa.jpg) shows dark lower labels. However, the earlier description of these as flat printed ink was stronger than the photographic evidence supported.

## Independent physical photograph

[Dejiki's July 2013 original-XL review](https://dejiki.com/2013/07/nintendo-3ds-xl-review/) supplies a [grazing-angle lower-deck photograph](https://farm4.staticflickr.com/3665/9248853256_d8506f1f7a_z.jpg). The 640 × 425 image was inspected in the browser on 10 September 2026. It shows dark lower words with narrow light/dark edges and a sharply bounded house symbol. This supports investigating shallow relief. It does not establish a manufacturing process, depth, exact glyph outline or factory font. Its blue exterior is not evidence of silver paint colour; the black interior and three-key layout identify the relevant original XL design.

The reviewed SlashGear photographs `DSC00850-580x385.jpg` and `DSC00847-580x385.jpg` show the closed exterior and left deck respectively; neither supplies usable lower-word outlines. Many search results were for the 2015 New XL and were excluded. A TIME search snippet mentioned carved labels, but opening that URL returned unrelated text; it is not used as verified evidence.

## Native experiment

`preview_lower_label_relief.py` runs through Blender MCP from `silver-lid-face.blend`. It clones only the shared lower-key material, feeds the existing photographic ink mask to an inverted Bump node, and layers it over the existing normal. The study uses depths 0, 0.02 and 0.05 in native millimetre units. These are shader appearance trials, not physical measurements or displaced geometry.

All three renders use the same overhead camera, lighting and 1400 × 650 output:

- `lower-label-depth-0-keys.png`: current flat appearance, visibly soft edges and a noisy house.
- `lower-label-depth-0p02-keys.png`: subtle shading difference; does not resolve the outline defects.
- `lower-label-depth-0p05-keys.png`: visible narrow edge shading, but amplifies uneven strokes and the house's noisy silhouette.

All three were visually inspected. The strongest trial is rejected for delivery. Increasing depth is not a substitute for repairing the low-resolution lettering stencil. The current mask originates in only about 8–12 pixels of photographed glyph height; it lacks reliable subpixel outline evidence at macro scale.

## Decision and next work

Keep the current live asset while developing clean, photograph-constrained outlines at adequate texture density. Retain dark label colour; compare shallow relief under both front and grazing lighting after the outlines are corrected. Treat the old `ink` names as implementation labels, not established physical construction. Do not substitute a generic font and describe it as Nintendo's.

The experiment restores original material bindings and removes its temporary material/image in `finally`. It does not save the Blender file or export a GLB. Public SHA-256 remains `6c6e5a82b61799cc27a8efae3798ff30444bc9ac9b4d75facc373d5ba88e0f15`. No application source changes, rebuild, or application tests are needed for this diagnostic-only pass. Exact hardware lettering remains incomplete.
