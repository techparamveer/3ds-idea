# Scene and rendering architecture

## Scene graph

`console-scene.ts` creates the presentation scene and loads the source model.
The GLB contains the authoritative hierarchy. `resolveModelLayout` converts its
metadata and named nodes into a semantic layout: base, hinge, screens and
physical controls. Code should consume that layout rather than adding new
hard-coded offsets.

The root presentation group controls yaw, pitch and reading zoom. The model's
hinge node controls the lid. Button caps and directional controls retain their
own rest transforms so input feedback cannot accumulate drift.

## Displays

The upper OS canvas is 800 × 240 storage with a 400 × 240 logical drawing area;
the lower canvas is 320 × 240. Their meshes use the GLB's screen anchors and the
published physical active areas. `CanvasTexture` objects use no mipmaps and
nearest magnification so authored native pixels remain crisp.

The display material combines an emissive canvas map with restrained physical
glass reflection. Screen meshes sit just ahead of the source backing and use a
small polygon offset to prevent oblique z-fighting.

## Animation and interaction

- `motion.ts` defines the opening presentation and 0–155° lid range.
- `framing.ts` projects cached mesh bounds to keep animated poses visible.
- `button-motion.ts` gives digital controls bounded press travel.
- `directional-motion.ts` rocks the D-pad and translates the circle pad.
- Raycasting maps visible model surfaces back to semantic controls.
- Keyboard, physical pointer hits and lower-screen touches all dispatch the
  same OS inputs.

Hardware animation is elapsed-time based. Native HOME folder motion samples
the shared integer OS update counter through an immutable host view; see
[folder integration](../home-banner-integration.md). Render throttling must
never change reducer or motion semantics; it may only change how often the
latest state reaches the GPU.

The native folder banner additionally accepts explicit immutable lifecycle
samples through `firmware-banner.ts`'s `drawFrame`. OS/runtime code owns its yaw,
visibility and separate clip clocks; the scene samples those values without
advancing them during painting. The authored model bind matrix stays inside the
outer motion group. See [the banner contract](../native-banner-lifecycle.md).

## Lighting and materials

The room environment, hemisphere light, key, rim and shadow-catching floor are
chosen to reveal the shell profile and material differences. Lighting changes
must be checked against front, back, underside, side and grazing views. Global
darkening is not a substitute for correcting local material or geometry defects.

The sourced glTF PBR maps remain the base appearance. VGPU adds bounded silver
roughness variation only to materials carrying explicit paint roles and masks.
It must not recolor unclassified materials, screen parts or printed details.

Native CGFX material depth tests use each exported comparison function, including
`Less`; they no longer inherit Three.js’s `LessEqual` default. Focused real-model
tests and a live folder capture (`reference/browser-depth-source-top.png` in the
firmware SSD artifacts) cover the change. `firmware-model.ts` also maps authored
stencil comparisons/operations and per-instance runtime overrides, independently
of depth and blend state. Native draw groups are carried through every internal
Three Group, with source mesh layer/priority retained inside each group.

The folder banner target has a stencil attachment. It clears stencil to zero,
then draws the authored BannerFrame producer (group 1) and the folder consumer
(group 2) as siblings in one transaction before the transparent Canvas transfer.
The existing background Canvas transaction remains separate. Frame load failure
makes the masked folder unavailable; background readiness is independent.
Teardown owns Frame resources and the target, and transaction cleanup restores
the caller's stencil clear value alongside its target, viewport and other render
settings. The scene adapter supplies explicit zero idle translation samples;
reactive native displacement is still unimplemented. See the
[agreed stencil contract](../native-banner-stencil-renderer-contract.md).
Frame public-pack promotion and GPU/native comparison remain integration work;
CPU tests can consume the extracted candidate through
`FIRMWARE_BANNER_FRAME_MODEL`. Native mip levels remain a fidelity gap.

## Cleanup contract

Every allocated geometry, material, texture, environment target, renderer,
listener, observer, animation request and audio context must be disposed by the
returned teardown. New scene resources must be added to this ownership model.
