# Power indicator colour

The editable checkpoint is `silver-power-indicator.blend`, following `silver-dock-contacts.blend`. Its authoring GLB retains PNG textures; `silver-power-indicator-web.glb` is the lossless web delivery pack.

Nintendo's original 3DS XL manual, printed page 27, specifies a solid blue power LED while powered with sufficient charge, red when low and a slow blue pulse during sleep. This pass corrects the normal powered colour; it does not implement low-battery or sleep simulation. [Nintendo operations manual](https://www.nintendo.com/eu/media/downloads/support_1/nintendo_3ds_14/Nintendo3DSXL_OperationsManual_UK.pdf)

The original-XL front photograph also shows a small blue light beside the unlit charge lens. It is not a calibrated spectral or exposure reference. [Original XL front photograph](https://cdn.mos.cms.futurecdn.net/0584727e6f39c0e334d6e9537772f9fa.jpg)

The shared source mesh `Source_0_part_51` contains both indicator surfaces. Its packed emission atlas contained cyan sRGB (62,235,255) at the power lens, unlike the grayscale disk file named `body-emissive.png`. The packed image was therefore preserved directly as `indicator-emissive-source.png`; rebuilding from the grayscale disk file would have lost the current source colour information.

`build_indicator_colour.py` modifies only the existing UV rectangle (1353,2813)–(1500,2886), preserving its emission mask and all pixels outside. It changes 5,716 pixels. The charge-lens region remains black. A first saturated-blue trial looked violet under the renderer; the accepted trial uses sRGB (10,120,255) and emission strength 0.8, down from 2.365437. These numbers are authored appearance estimates, not manufacturer measurements.

`preview_indicator_colour.py` uses temporary material copies and restores the scene. `install_indicator_colour.py` copies the front indicator material and changes its emission image and strength only. Base colour, roughness, normal, specular maps, UVs and geometry are retained. The material retains the sourced-body metadata used by the website's existing power toggle.

The close-ups `indicator-before-indicators.png` and `indicator-blue-trial-indicators.png` show the cyan-to-blue correction with the adjacent charge lens preserved. `indicator-final-front.png` and `indicator-final-open.png` record whole-device renders. Export comparisons cover every mesh attribute, topology, hierarchy and transform, and resolve image bindings to verify that only this material's emission changed.

This pass does not establish exact hardware fidelity. Remaining shape, lettering, shading and authentic HOME Menu assets still require work.

Verification: all 123 JavaScript tests and both independent delivery-packing tests pass. The delivery tests compare every decoded RGBA pixel and all non-image payloads against the authoring GLB. The web pack is 104,636,804 bytes, SHA-256 `04245fa5c1047a68f9ddafee5e1f5aae62532ab360f20410c464f86a8f05fe56`; authoring SHA-256 `59a4f307076b94011e81e9dd1656f6fff1be6727d9ad05030a1cc83b1c158d85`.

At 1280 × 720, the actual website loaded with VGPU ready. The physical POWER button switched both displays and the blue indicator off; clicking again restored power. The adjacent charge lens stayed unlit. No warning/error logs were returned.

The development-only `?surface=baked` fallback also loaded with `vgpu=webgl-fallback`, and the indicator retained its blue colour. The browser was returned to the normal URL and viewport afterward. No app or shader source changed in this pass.
