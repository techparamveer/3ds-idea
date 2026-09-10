# ABXY lettering proportions

`silver-abxy-ink.blend` and `.glb` follow `silver-abxy-finish`. This pass replaces the narrow source ABXY ink with authored glyphs fitted to original XL photographs. It does not identify or reproduce a verified Nintendo font.

Rechecked [Nintendo's original LL hardware page](https://www.nintendo.co.jp/hardware/3dsseries/3dsll/index.html): it confirms the Silver × Black model, ABXY layout and the published dimensions, but does not name the shell lettering typeface. The direct front JPEG request returned a cache miss and was not used as fresh image evidence.

Compared the [full front photograph](https://cdn.mos.cms.futurecdn.net/0584727e6f39c0e334d6e9537772f9fa.jpg), cached at `.local/references/front/techradar-original.jpg`, with the model macro. A crop of pixels (1160,555)–(1310,663) makes the wider, heavier reference letters apparent. The additional cached SlashGear right-controls photograph supports the glyph style but has insufficient resolution for exact outlines. The photographs are perspective views; dimensions below are appearance estimates, not calibrated factory measurements.

The authored dimensions are A 2.85 mm wide, B 2.2 mm, and X/Y 2.7 mm; nominal height 2.9 mm and stroke 0.36 mm. Straight paths form A/X/Y and cubic curves form B. `build_abxy_ink.py` samples these paths at 8×8 subpixels per atlas pixel. It uses the Blender-derived affine cap UV fits saved in `abxy-glyph-uv-fit.json`; the largest fitting residual is approximately 0.00015 UV units (0.61 atlas pixels). That approximation is an additional accuracy limit.

Old source ink is cleared only around its thresholded mask plus a two-pixel edge margin. The underlying plastic in those previously printed pixels is estimated from the adjacent cap median; fine texture outside the edited ink regions remains intact. The original ink intensity is retained. The first trial left antialiased remnants, which were removed before accepting the macro in `abxy-ink-trial-abxy.png`. The final atlas changes 3,015 pixels. Its SHA-256 is `2006f6e7197a8cfbb3d42b83575e83fc317aa20797d46c22ee703e734da4b9eb`.

`inspect_abxy_ink.py` provides a reversible preview. `install_abxy_ink.py` installs the atlas on the existing independent four-cap material, starting from `silver-abxy-finish.blend`. Geometry, UVs, normals, roughness, rig transforms and all other materials are unchanged; two export tests verify that scope. All 92 repository tests pass.

The live homepage was inspected after reloading at 1280 × 720: ready, VGPU ready, hinge 155°, no browser warnings/errors. The glyphs are wider and heavier in the live model. This texture-only pass does not repeat the earlier interaction checks, application build or fallback test.

Candidate and public GLB SHA-256:
`14da48e2edd1e9c24325384c2b624adca8302688f39d25baebfa4d037e582a7f`.

Exact outline fidelity remains unproven. Surrounding cap openings, other hardware lettering, and the authentic HOME Menu assets still require work.
