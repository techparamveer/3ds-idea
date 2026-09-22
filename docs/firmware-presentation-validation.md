# Native HOME presentation checkpoint

The presentation branch now consumes the owner's converted European 10.7.0-32E HOME data. This is a renderer/integration checkpoint, **not a 1:1 fidelity sign-off**. Browser and Azahar operation remain centralized in the integration task.

## Public contract and ownership

`loadFirmwarePresentationAssets(manifestUrl?, signal?)`, exported from `screens.ts`, loads shared/HUD bitmap fonts and the selected HOME packs. Manifest-relative URLs remain relative to the entry manifest. It accepts cancellation and exposes `diagnostics`; no silent native-asset fallback occurs in that loader.

`createScreens({firmwareAssets?, drawFolderBanner?, drawHomeBackground?, runtimeNotice?})` accepts an injected asset set; `setFirmwareAssets(assets)` supports asynchronous arrival. The folder/background callbacks receive `(CanvasRenderingContext2D, elapsedMilliseconds, reducedMotion)` and return whether they painted the native resource. The white-theme background callback runs over the fallback before the HUD/banner. The optional notice callback supplies the scene's runtime status after screen overlays. The scene owns Three.js and the CGFX renderer. Screen disposal owns the attached layout/font caches. Calling the setter after disposal disposes the arriving assets.

The upper canvas remains 800×240 storage adapted from 400×240 logical pixels. Lower remains 320×240. Existing portfolio state/input modules are unchanged by this checkpoint. Native artwork uses existing menu geometry, so mismatches between native density frames and input layout are still subject to reference comparison.

## Renderer coverage

The upper camera hints, bounded lower folder balloon and straight PNG/blend
corrections are documented in [the label follow-up](native-home-labels-2026-09-22.md).

- Group-filtered CLAN bindings, child binding, step/Hermite curves including duplicate-frame discontinuities; immutable posed copies.
- CLYT hierarchy, origins, 2D transformations, visibility, alpha propagation, explicit clip rectangles and text-pane clipping.
- Picture UV sets and centred texture matrices, clamp/repeat/mirror wrapping, nearest/bilinear sampling, interpolated corner colors, eight TEV operations, constant/buffer registers, alpha comparison and native framebuffer blending.
- Native bitmap text with bearings/advances, two-axis font size, multiline/line alignment, top/bottom color, spacing, shared-font glyph pixels and HUD LA4 luminance.
- One-frame around-windows use four mirrored strips. Four-frame around-windows preserve native corner order, UV ranges and TextureOnly material inheritance; see [the source proof](native-folder-window.md). Nonzero inflation/frame size, other frame arrangements and flips remain explicit unsupported diagnostics.
- HUD, lower toolbar, footer, ordinary software/folder tile, empty slots, arrows and cursor consume native layouts. English status/footer labels come from MSBT. Calendar/clock values are injected; wireless is disabled and coins/steps are zero. The animated upper background, scrollbar, dialogs and app interiors are still reconstructed; plain lower-tray color follows the supplied native capture.

Material surfaces use an 8 MiB LRU cache, 16 posed layouts and a reusable blend target. Bitmap-font tinting caches up to 1 MiB of small text runs rather than entire duplicated atlases. The source pack is retained for reproducible scene pose choices. Out-of-range texture matrix animation tracks retain their indices. Those with differing key values are reported as native CLTS skips, following the confirmed native bounds check.

## Evidence and limits

The tests cover material operations/register selection, alpha tests, blend factors, wrapping, UV transforms, duplicate keys, group binding, immutability and real HOME cursor textures/windows. Software Canvas captures and logs are under `/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/presentation/`. These are unit-renderer inspection artifacts, not browser/Azahar comparisons.

The source font/texture/layout provenance resides in the asset manifest. CGFX folder provenance/conversion is documented separately by `scripts/firmware-cgfx/README.md` and the model sidecar. Native material parsing references include [EveryFileExplorer CLYTShader](https://github.com/Gericom/EveryFileExplorer/blob/master/3DS/NintendoWare/LYT1/CLYTShader.cs), [pane transformations](https://github.com/Gericom/EveryFileExplorer/blob/master/3DS/NintendoWare/LYT1/pan1.cs) and [window geometry](https://github.com/Gericom/EveryFileExplorer/blob/master/3DS/NintendoWare/LYT1/wnd1.cs). These format implementations inform the renderer; they do not replace emulator evidence.

Unverified areas: the white theme background; exact scene clip frame selection and timing; density/selection movement alignment; alpha propagation semantics; native text formatting beyond the representative plain strings and four confirmed style fields; 3D pane projection; full float32 curve interpolation and shader parity; CGFX light/view conventions, unsupported lighting, model visibility channels and browser GPU shader/material parity. The source directional Dist0/Fresnel path is described in `docs/native-folder-lighting-2026-09-22.md`. No additional title groups are included here.

## Checkpoint checks (2026-09-22)

- Focused bitmap-font/font-metrics/native-layout/CGFX tests: **15/15 passed**, with real resources from the asset task's reproducible `assets/repro-a/public` output.
- `npm run typecheck`: passed.
- `npm test` with the same resource override: **70 passed, 39 failed**. Remaining failures read unhydrated Git LFS model/texture pointer files in this isolated checkout; presentation/font tests pass.
- `npm run build`: blocked by Turbopack rejecting the pre-existing `node_modules` symlink outside its filesystem root. `npm run build -- --webpack` reaches compilation but the existing configuration has no webpack loader for `silver.wgsl`. Neither build is reported as passing.
- Software Canvas sample: initial HOME raster approximately 710 ms; repeated static HUD/toolbar/footer paint approximately 1.0–1.4 ms with a 0.53 MiB material cache in this runtime. This excludes the Three.js banner, does not measure browser GPU performance, and does not establish acceptable first-paint cost.

## Gesture presentation follow-up (2026-09-22)

This follows the runtime helper contract in `docs/home-gesture-runtime.md` and depends on runtime checkpoint `7870730119b15792d06fb3ab5eff723a8de348d8` after its foundation commits. `home-presentation.ts` derives visible child IDs, pressed/source/target tiles and the pickup ghost from `homeSlotAppId`, `getHomeGestureView` and `menuTiles`. It never interprets touch events or changes persistent icon maps. Fractional viewport positions come directly from the runtime. The source icon is suppressed during pickup, valid targets get the cursor, and cancellation restores the runtime's original view.

Native pickup, vacant-source and receiving-folder layouts are loaded alongside HOME chrome. Portfolio artwork replaces the pickup dummy icon within the native sampled bounds. Cursor press displacement and toolbar/footer press clips use the existing native animation data; per-control group subsets prevent a press from animating every toolbar control. Opened folders show child artwork and Open/Resume, with Close on the left to match the runtime's folder-back action. The root folder banner is suppressed while its child view is open.

- Focused presentation, native-layout, bitmap-font, font-metrics and CGFX tests: **23/23 passed**, including actual reducer press/lift/hover/scroll/cancel paths and the folder footer contract with suspended software.
- `npm run typecheck` and a direct nonincremental TypeScript check passed. `git diff --check` passed.
- An additional runtime test file could not load `fake-indexeddb` from this checkout's pre-existing dependency symlink; no dependency files or other worktrees were changed to work around that environment issue. The runtime task owns its complete runtime suite.
- Software Canvas inspection artifacts: `software-gestures.png` and `software-gestures-extra.png` in the presentation artifact directory above. They cover app/folder pickup, receiving-folder preview, child view, cancellation, toolbar/footer press and fractional scrolling. These are not browser or Azahar captures.

Remaining acceptance work includes native frame/timing comparison, the density/input alignment, folder initials, and renderer/material parity. The observed base tile shading and source placeholders still require matched native inspection. This follow-up does not claim completed HOME visual fidelity or add stock application interiors.

## Message style linkage (2026-09-22)

This bounded correction depends on asset checkpoint `5232f3c6a8d406600dfdb19956dae6a61482b246`, converter 1.2.0. Source evidence is recorded in `scripts/firmware/FORMAT_EVIDENCE.md`; the matching reproducible assets are under `assets/styles-repro-a/public` within the firmware artifact root. The presentation loader checks linked message styles before handing assets to screen painting.

Each MSBT message resolves `styleIndex` through its bank's full `styleTable` path. HUD and HOME therefore keep separate tables despite identical basenames. A non-null style multiplies the actual pane font's FINF width and height by `fontScale` and replaces character/line spacing. A null style preserves CLYT metrics. The layout still supplies font choice, colors, alignment, material, clipping and transforms; the seven unresolved style words do not change rendering. Substituted date fragments retain the enclosing date message style.

Current relevant sizes match the existing CLYT defaults: Disabled is 12.5×15, HUD date is 16×16 and footer labels are approximately 17.5×21. All have zero spacing. Resume now uses the source message's U+E073 HOME glyph, and the software-close action uses the native Close message. Static native analysis also confirms the existing CLMC buffer-plus-six-constants ordering and the CLTS bounds check; no texture channel is remapped.

- Focused presentation/font/native-layout/CGFX suite: **27/27 passed** against the updated reproducible assets. It covers unequal font scales, separate style banks, null/missing styles, immutable overrides, actual HOME sizes/glyphs and no-remap texture skips.
- Nonincremental TypeScript and diff whitespace checks passed.
- Software Canvas captures: `software-styles.png`, `software-styles-extra.png`, `style-resume.png` and `style-upper.png`. Native format linkage is verified independently of visual acceptance; matched browser/Azahar comparisons remain with integration.

## CLMC byte quantization (2026-09-22)

The native material animator at `0x1a16dc..1714` evaluates a CLMC channel, adds 0.5 in float32, clamps to 0..255, converts to an unsigned integer and sends the byte to the material setter. The setter at `0x209c90` routes it to the buffer or one of six constant colors. See the same asset format evidence note and its private static instruction extracts; no firmware is executed by the renderer.

`poseNativeLayout` now applies that byte conversion after sampling each material-color track. Both conversion of the sample to float32 and the float32 addition are retained, including the case where 0.4999999701976776 becomes 1 after addition and truncation. This changes only CLMC register writes and preserves the source asset data. It does not assert that every intermediate operation of Hermite sampling matches the native evaluator, or define parity for malformed nonfinite samples.

- Focused suite: **29/29 passed**, covering the buffer and all six constants, lower/upper clamps, half steps, a float32 rounding boundary, interpolation-before-quantization and source immutability.
- Nonincremental TypeScript and diff whitespace checks passed. Browser/Azahar material acceptance remains with integration.

## First matched lower-screen correction

See `docs/native-home-comparison-2026-09-22.md` for the actual native/browser reference, measured regions, evidence and remaining differences. Native code confirms one composed RGBA TEV constant per stage, correcting cross-channel operands that previously caused square gray borders and white arrows. Ordinary apps now use the SetSrc software plate rather than the cartridge layout; the captured two-row density selects native key 1. Shared toolbar geometry already matched, while its shadow and arrow tint improve to exact/one-level sampled agreement in software. The focused suite now passes **33/33**; browser recapture and theme/scrollbar/cursor acceptance remain pending with integration.
