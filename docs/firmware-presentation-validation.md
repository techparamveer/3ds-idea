# Native HOME presentation checkpoint

The presentation branch now consumes the owner's converted European 10.7.0-32E HOME data. This is a renderer/integration checkpoint, **not a 1:1 fidelity sign-off**. Browser and Azahar operation remain centralized in the integration task.

## Public contract and ownership

`loadFirmwarePresentationAssets(manifestUrl?, signal?)`, exported from `screens.ts`, loads shared/HUD bitmap fonts and the selected HOME packs. Manifest-relative URLs remain relative to the entry manifest. It accepts cancellation and exposes `diagnostics`; no silent native-asset fallback occurs in that loader.

`createScreens({firmwareAssets?, drawFolderBanner?})` accepts an injected asset set; `setFirmwareAssets(assets)` supports asynchronous arrival. The callback receives `(CanvasRenderingContext2D, elapsedMilliseconds, reducedMotion)` and returns whether it painted the native folder. The scene owns Three.js and the CGFX renderer. Screen disposal owns the attached layout/font caches. Calling the setter after disposal disposes the arriving assets.

The upper canvas remains 800×240 storage adapted from 400×240 logical pixels. Lower remains 320×240. Existing portfolio state/input modules are unchanged by this checkpoint. Native artwork uses existing menu geometry, so mismatches between native density frames and input layout are still subject to reference comparison.

## Renderer coverage

- Group-filtered CLAN bindings, child binding, step/Hermite curves including duplicate-frame discontinuities; immutable posed copies.
- CLYT hierarchy, origins, 2D transformations, visibility, alpha propagation, explicit clip rectangles and text-pane clipping.
- Picture UV sets and centred texture matrices, clamp/repeat/mirror wrapping, nearest/bilinear sampling, interpolated corner colors, eight TEV operations, constant/buffer registers, alpha comparison and native framebuffer blending.
- Native bitmap text with bearings/advances, two-axis font size, multiline/line alignment, top/bottom color, spacing, shared-font glyph pixels and HUD LA4 luminance.
- One-frame around-windows use four mirrored strips. Nonzero inflation/frame size, other frame arrangements and flips remain explicit unsupported diagnostics.
- HUD, lower toolbar, footer, folder/card tile, arrows and cursor consume native layouts. English status/footer labels come from MSBT. Calendar/clock values are injected; wireless is disabled and coins/steps are zero. The background, scrollbar, empty slots, dialogs and app interiors are still reconstructed.

Material surfaces use an 8 MiB LRU cache, 16 posed layouts and a reusable blend target. Bitmap-font tinting caches up to 1 MiB of small text runs rather than entire duplicated atlases. The source pack is retained for reproducible scene pose choices. Dynamic unsupported texture channels are reported without guessing an allocation.

## Evidence and limits

The tests cover material operations/register selection, alpha tests, blend factors, wrapping, UV transforms, duplicate keys, group binding, immutability and real HOME cursor textures/windows. Software Canvas captures and logs are under `/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/presentation/`. These are unit-renderer inspection artifacts, not browser/Azahar comparisons.

The source font/texture/layout provenance resides in the asset manifest. CGFX folder provenance/conversion is documented separately by `scripts/firmware-cgfx/README.md` and the model sidecar. Native material parsing references include [EveryFileExplorer CLYTShader](https://github.com/Gericom/EveryFileExplorer/blob/master/3DS/NintendoWare/LYT1/CLYTShader.cs), [pane transformations](https://github.com/Gericom/EveryFileExplorer/blob/master/3DS/NintendoWare/LYT1/pan1.cs) and [window geometry](https://github.com/Gericom/EveryFileExplorer/blob/master/3DS/NintendoWare/LYT1/wnd1.cs). These format implementations inform the renderer; they do not replace emulator evidence.

Unverified areas: the white theme background; exact scene clip frame selection and timing; density/selection movement alignment; alpha propagation semantics; native text formatting beyond the representative plain strings; 3D pane projection; unused animated texture-channel allocation; color-register mapping beyond the audited subset; CGFX PICA LUT lighting, model visibility channels and browser GPU shader/material parity. No additional title groups are included here.

## Checkpoint checks (2026-09-22)

- Focused bitmap-font/font-metrics/native-layout/CGFX tests: **15/15 passed**, with real resources from the asset task's reproducible `assets/repro-a/public` output.
- `npm run typecheck`: passed.
- `npm test` with the same resource override: **70 passed, 39 failed**. Remaining failures read unhydrated Git LFS model/texture pointer files in this isolated checkout; presentation/font tests pass.
- `npm run build`: blocked by Turbopack rejecting the pre-existing `node_modules` symlink outside its filesystem root. `npm run build -- --webpack` reaches compilation but the existing configuration has no webpack loader for `silver.wgsl`. Neither build is reported as passing.
- Software Canvas sample: initial HOME raster approximately 710 ms; repeated static HUD/toolbar/footer paint approximately 1.0–1.4 ms with a 0.53 MiB material cache in this runtime. This excludes the Three.js banner, does not measure browser GPU performance, and does not establish acceptable first-paint cost.
