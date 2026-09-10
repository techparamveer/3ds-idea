# Fine paint grain — 10 September 2026

Current update: [the EUR underside pass](source-eur-validation.md) builds on this preserved grain checkpoint and is now served by the homepage. Statements below describe the pre-EUR grain pass.

The active `silver-grain.blend` / `.glb` adds fine normal and roughness variation
to the silver painted regions of the curved sourced model. The homepage and
inspection route serve this export. Earlier source, silver and curved checkpoints
remain preserved.

The user's silver-unit photographs and this
[original EUR underside photograph](https://konsolen-chips.de/media/image/product/7758/lg/nintendo-3ds-xl-konsole-silber-schwarz-gebraucht~4.jpg)
show fine surface texture. They support a restrained grain treatment; they do not
establish numerical paint roughness, flake size or a calibrated silver colour.
No photograph has been used as a production texture.

## Material change

`scripts/grain_sourced_paint.py` uses Blender MCP to render two isolated 4K
emission atlas quads. The existing paint mask limits the changes to the same
5,044,041 painted pixels used by the silver-colour pass. Fine noise perturbs
the existing tangent normal and roughness. Its authored scale is 1,600 cells
per UV unit, approximately 2.56 atlas pixels per cell; the exact physical scale
varies with the source UV layout. Existing wear and scratches remain underneath.

The base-colour atlas, printed artwork, metallic channel, emission, glass and
boot-artwork textures are unchanged. Every position, index, UV, normal/tangent
frame, control and transform in the preceding curved GLB remains byte-identical.
The new normal/roughness maps are ordinary embedded PBR images, so their presence
does not depend on runtime VGPU availability. VGPU still adds its separate masked
roughness variation when available.

## Independent pixel audit

`scripts/audit_paint_grain.py` reads the decoded source and output PNGs using
NumPy/Pillow. It verifies all 11,733,175 unpainted pixels are unchanged in both
maps. The normal map changes 4,926,822 paint pixels; the roughness map changes
4,468,133. Quantization leaves some painted pixels unchanged.

The largest 8-bit normal-channel changes are 11, 12 and 6. The middle 98% of
roughness-channel differences lie between −8 and +8, with a maximum magnitude
of 15. The red and blue channels of the metallic/roughness atlas are exact.
The decoded changed normals stay within 0.009 of unit length after 8-bit
quantization. Hashes and complete audit metrics are in
`model/candidates/joshua-xl/paint-grain-pixel-audit.json`.

## Visible result and limits

Matched native open, closed and underside renders use the previous camera and
lighting setup: `grain-open.png`, `grain-closed.png`, `grain-underside.png`.
The `paint-before-macro.png` and `paint-grain-macro.png` views compare a 60 mm
camera framing at 64 samples with denoising disabled. Some sampling noise remains
in those renders; do not mistake every speckle for material grain.

The real browser export was inspected at normal and closer wheel zoom, including
the closed lid and underside. The added texture is restrained and clearer near
highlights than on broad evenly lit areas. The browser reports VGPU ready.
This adds exported material detail; it does not prove a calibrated photographic
match or resolve the regional markings, dimensions, provisional display centring
or HOME Menu assets. The source USA print still needs the user's EUR treatment.

After promotion, all 40 tests, typecheck and the production build passed. The
preview logged transient texture-blob errors during an earlier reload while
switching assets; a subsequent settled fresh load reported no new warnings or
errors. VGPU was ready and the model opened to 155 degrees. No new shader code
was introduced by this material-only pass.

At 390 × 844 the final homepage model remained fully framed, with VGPU ready.
The physical A button opened a folder and HOME returned to the menu at their
projected hit positions. Temporary browser viewport overrides were reset.
