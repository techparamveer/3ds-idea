# Planar high-resolution ABXY printing

The new editable checkpoint is `silver-abxy-print.blend`, following `silver-abxy-rollover.blend`. Its PNG authoring GLB and WebP delivery pack are separate.

The preceding macro showed an uneven B outline. A fresh UV audit found a maximum planar-fit residual of approximately 0.0455 mm across cap-top vertices (95th percentile about 0.0287 mm). The old atlas provides about 13 pixels/mm at the cap, so the nominal 2.9 mm glyph is only about 38 pixels high. The new atlas provides 71.11 pixels/mm, about 206 pixels per nominal glyph height, and a planar mapping removes the inherited UV-fit deviation from the print.

This retains the photograph-fitted paths and dimensions from `build_abxy_ink.py`. It is not a new identification of Nintendo's typeface. Reference and original outline limits are documented in `source-abxy-ink-validation.md`, including the [original-XL front photograph](https://cdn.mos.cms.futurecdn.net/0584727e6f39c0e334d6e9537772f9fa.jpg).

`build_abxy_print_atlas.py` produces a 1024 × 1024 atlas of four 512-pixel cap tiles. Each tile covers 7.2 mm. It resamples the original dark cap colour after removing the old print; the previously printed plastic is estimated from adjacent pixels. Existing authored paths are rasterized at the new resolution with antialiased edges. The normal, roughness, metallic, specular and emission maps remain unchanged.

`preview_abxy_planar_print.py` creates a second UV layer, `CapPrint`, and a copied material used only on planar top triangles. That material's base colour uses the new layer. All other maps continue using the original UV layer; the sides and rounded rim retain their original material. Geometry, source UVs, normals and tangents do not change. `install_abxy_planar_print.py` saves and exports a separate checkpoint with carried shading frames.

The before close-up is `abxy-rollover-trial-abxy.png`; after is `abxy-planar-print-trial-abxy.png`. The latter removes the visible wavy letter edges while retaining the rounded rims. `abxy-print-final-front.png` and `abxy-print-final-open.png` record whole-device views. These improvements do not prove an exact factory-font match.

The material split becomes child meshes under each physical cap in Three.js. `controlFromObject` now resolves a hit through its ancestors to the existing layout control, so both print and plastic operate and depress as one button. Legacy printed siblings still use the existing name handling.

Export tests compare every oriented triangle with its positions, source UVs, normals and tangents across primitive splits. They verify that only planar top faces receive the new material, that its only material difference is the new base-colour image/mapping, and that the added UV layer matches the planar projection. A control test covers both material primitives and rejects unrelated deck hits. The first UV test was corrected to account for glTF's vertical texture-coordinate flip; the exported mapping itself did not change.

The atlas is 156,092 bytes as PNG, SHA-256 `8989816c6856deb73106eaaf7fd30ff4a565283877f972b46bf1f25956499422`. The web pack grows by approximately 606 KB, including the added UV data and primitive split, and adds four material draw calls. No frame-rate claim is made.

All 129 JavaScript tests, both independent delivery-packing tests, type checking and the production build pass. Python scripts compile. Browser verification at 1280 × 720 loaded the updated print with VGPU ready; physical A opened a folder, B returned HOME, X changed the menu zoom and Y changed brightness. No warning/error logs were returned. The print and rim remained visually aligned at normal viewing scale.

Authoring GLB SHA-256: `ca5ef8aa73e1466c806e2bfcd47dddb55a8611816bf50101e4248e4c94022fa4`. Delivery pack: 105,244,372 bytes, SHA-256 `af257a906a4f9b212cb217c9dcbd002a1943b8e88e3e7582d63bb4e85f3a42ad`. The public model mirrors the delivery pack.

The `?surface=baked` development fallback loaded with `vgpu=webgl-fallback`; the new print stayed aligned and physical A still opened the folder. The browser was returned to the normal URL and viewport.
