# Upper cover border and LCD edge

`silver-upper-cover.blend` follows `silver-dpad-finish`. It distinguishes a narrow black edge beside the active image from the wider matte cover border, inside the existing upper aperture. It does not add a raised ring to the inner shell.

## Reference evidence

Nintendo's original [3DS LL specifications](https://www.nintendo.co.jp/hardware/3dsseries/3dsll/index.html) were rechecked: the active upper panel is 106.2 × 63.72 mm. The original-XL [front image](https://cdn.mos.cms.futurecdn.net/0584727e6f39c0e334d6e9537772f9fa.jpg) visibly separates a thin black line beside the bright panel from a wider matte surround. `measure_upper_reference.py` records seven-row median luminance profiles at four heights. In selected edge windows, the bright panel spans approximately x645.5–1186.5 and the outer surround x627.5–1204.5 (x628.5 at one row). See `upper-reference-edges.json` for the image hash and method.

Scaling the pictured panel to 106.2 mm conditionally yields outer widths around 113.1–113.3 mm. This is not calibrated hardware metrology: displayed artwork, shadows, anti-aliasing and projection matter. It does not supersede the earlier roughly millimetre-uncertain 112 mm fit from Nintendo's smaller image and aftermarket lens evidence. The current 112 mm visible opening is retained. The 107 × 64.6 mm inner black rectangle leaves an approximately .4/.44 mm margin around the active display; it is an authored image-based fit, not a factory tolerance.

The separate thin cover construction is supported by the iFixit repair photographs linked in `upper-frame-profile-audit.md`. Those photos do not establish its height. The earlier outside-shell material ring remains rejected. This revision addresses the distinction **within** the existing opening and makes no lens thickness or raised-frame claim.

## Material and UV implementation

`preview_upper_cover_border.py` tested the split with a reversible shader and temporary lit display planes. `build_upper_cover_border.py` produces two 2048-pixel maps over the backing's measured 121.3064 × 72.7903 mm extent. The central region is black with roughness .18; the border is linear .007 gray with roughness .35. A .06 mm filter softens the texture transition. These optical values are appearance estimates. The backing remains an opaque dielectric.

`install_upper_cover_border.py` adds a `CoverBorder` UV layer to Screen_Top, preserving the original UV layer. It maps standard glTF color/roughness textures through TEXCOORD_1. Geometry, original shading frames, lower screen, active anchors, controls and every other material remain unchanged. The Blender exporter repacks the roughness image; the independent test compares its decoded green channel rather than assuming identical file bytes.

All six `upper-cover-final` full-console views and both `upper-cover-final-lit` diagnostic views were inspected. The lit views show the narrow dark edge and matte surround without the added outside ring. The aperture audit retains the upper 112 mm visible width and both published active display dimensions. This improves the visible material separation; exact outer-frame profile/width and cover thickness remain unresolved.

## Verification and reproduction

Both `tests/test_upper_cover.py` checks passed: every original mesh attribute/index, node transform/hierarchy and non-root metadata is retained; other materials are unchanged; new UVs match the backing coordinates; the new upper material is opaque/nonmetallic and uses TEXCOORD_1; exported roughness pixels match the authored map. Lossless packing is checked independently. These invariants are not proof of exact reference identity.

Run the builder, open the preceding checkpoint, then call `install_upper_cover_border.main()` through Blender MCP. Export preserves carried frames. The PNG GLB is the authoring asset; the WebP pack is the browser delivery.

## Delivery verification

All 131 JavaScript tests, both dedicated cover checks and both independent lossless-packing checks passed. At 1280 × 720 the VGPU path rendered the new border aligned around the HOME Menu. Physical A opened a folder; P switched the screens off and the border remained visible. The forced development texture fallback also displayed the border correctly. Warning/error retrieval returned no entries during this check. Normal URL and viewport were restored. No application code changed, so no application rebuild was repeated.

PNG GLB: 147,865,240 bytes, SHA-256 `56508f29fdff5d6d03e0e34eb17ab5a801c8115f1f646fb93a34fefb1c8346d4`. Web GLB: 106,929,500 bytes, SHA-256 `db2a744b3a3e9d5efcb0decf06b93fa6b05fbaad4dbd96a286c0c62a500e1828`. Delivery grows by 2,500 bytes, but the two decoded 2048-pixel maps still consume GPU texture memory; no performance improvement is claimed.
