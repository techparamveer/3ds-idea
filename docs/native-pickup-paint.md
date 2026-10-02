# Ordinary pickup painter

2026-09-23. Implements only the presentation methods agreed in
[the stationary pickup entry contract](home-pickup-entry-contract.md).
The caller owns retained pickup state, source hiding, visibility and draw order.

`createFirmwareHome` exposes:

```ts
pickupAt(ctx, centerX, centerY, appliedScaleFrame, titleId?)
  // -> { drawn, icon: { x, y, width, height, alpha } }
pickupBlankAt(ctx, centerX, centerY, appliedScaleFrame)
  // -> boolean
```

Both centers are already in320×240 LCD coordinates. Both frame arguments are
required numbers. A caller with a null applied frame must omit that draw;
these methods do not choose a fallback frame or own submission eligibility.
They forward the supplied frame directly to the native Scale binding, without
density clamping, rounding, timing, tile-size heuristics or anchor/lift offsets.
The shared resource sampler still applies its normal nonlooping clip bounds.
Painting neither advances nor changes a retained controller.

Ordinary pickup renders `LncIconPickUp_00` with its Scale binding. Omitting
`titleId` hides `P_Icon_00` for the caller's intentional portfolio artwork;
supplying a stock `titleId` binds its 48×48 SMDH pixels to sampler 0 of the
verified pickup material while retaining the authored mask, UVs, sampling,
TEV, blend and alpha. The source-backed extension and evidence are recorded in
[the held title artwork note](home-held-title-artwork-2026-10-02.md). Its return
value preserves the resource's artwork rectangle and alpha235/255. The verified
artwork pane is an unrotated, unit-scale, centered direct child of an identity
RootPane; it does not inherit the shell's two nested scales. The native renderer
retains the full shell/shadow hierarchy and materials. The artwork rectangle
cache remains bounded to16 entries and stores local resource coordinates.
Stock-title pickup draws also opt into the renderer's guarded LCD-centre picture
sampling. That option is layout-call-wide: eligible fractional shell pictures
can share the direct path, while portfolio and folder-icon pickups retain their
previous raster path. This transport selection remains a capture-directed
adaptation rather than a recovered native controller.

`pickupBlankAt` renders the separate `LncIconPickUpBlank_00` layout, preserving
its plain blank and effect panes. It does not apply ordinary vacancy opacity.
The existing `pickup` and `liftedSource` wrappers retain their density clamp,
folder glyph/material setup and placement conventions for authored callers.

## Resources and provenance

No conversion, loader or public-asset changes were required. The preceding
read-only audit matched extracted originals, fresh bounded decodes and current
public resources in `public/os/firmware/10.7.0-32E/packs/home/launcher.json`.
The layouts and animation dependencies cover14 distinct textures.

| Original resource | SHA-256 |
| --- | --- |
| LncIconPickUp_00.bclyt | 6ec30917cd9ed047ce5e9937a4e776456696a265490fc5267cda5960f6341ca2 |
| LncIconPickUp_00_Scale.bclan | c4138973ce034f02f6e5049f945f3a69446f40a9b95d60ef3d0c4481d0343cce |
| LncIconPickUpBlank_00.bclyt | 87ed044fca821a0f9adc98e9ab7c4367ccea1ac02d22d04b2ee4c89fee2de1ca |
| LncIconPickUpBlank_00_Scale.bclan | d4f4523ac19b8c780b899ff4eafc248ea23ca87940d7ec2221643a10acd57cc0 |

Audit artifacts remain under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/presentation/pickup-entry/`:
`findings.md`, `resource-check.json`, `blank-check.json`, `poses.json` and
`current-painter-calls.json`. The earlier long-press evidence stops before
occupied mode14 continuation and is not proof of that completed transition.

## Verification and limits

`native-pickup-presentation.test.mjs` exercises Scale0–5 and fractional2.375,
direct frame/center forwarding, the identity artwork ancestry, nested shell
scales, independent shadow dimensions/offsets, blank/effect dimensions and
alpha, material pattern changes, hidden picture-branch matrix changes and
blend/TEV preservation. It checks repeated read-only draws, false draw results,
authored density clamping and cached folder glyph installation. The optional
Canvas check uses actual decoded textures and the real native renderer to
paint every integer frame, repeat identical pixels and preserve caller state.

The focused run included the pickup, cursor, tile-pose, empty-slot-opacity and
renderer files:28 passed,0 failed,0 skipped. The Canvas check was enabled with
the existing SSD `@napi-rs/canvas` installation via `NATIVE_CANVAS_MODULE`.
`npm run typecheck` passed. Logs are `painter-focused.tap` and
`painter-typecheck.log` in the artifact directory above. No full suite, build,
browser, Azahar or hardware/model work was performed in this checkpoint.

These checks establish the bounded painter behavior, not strict1:1 pickup
fidelity. Screens/derived-view integration is owned by the integration task.
Native anchor initialization, installed PicToggle/material/content state and
the subsequent movement/drop/release lifecycle remain separate dependencies.
The existing portfolio `menuArtwork` overlay is intentional and is not native
IconMask/TEV parity. No matched native/browser pickup pixels were obtained.
