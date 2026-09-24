# Hardware editing and validation index

The active original Silver + Black 3DS XL rig is
`model/candidates/joshua-xl/silver-audio-finish.blend`. Read its adjacent
[README](../model/candidates/joshua-xl/README.md), the
[source evaluation](model-source-evaluation.md) and [silver adaptation](source-silver-validation.md)
before changing it. Preserve the earlier procedural `.blend` and `.glb`.

The recorded closed envelope is **156 × 93 × 22 mm**. The upper opening's
**115 mm** fit is image-derived; Y has **0.9138 mm** closed clearance.
Those checks do not establish silhouette or lettering accuracy. Hardware
lettering retains documented capture-resolution limits and is not a verified
factory font. The headphone-socket internal contacts remain unresolved.
`silver-audio-contacts.blend` is a preserved, unpromoted candidate
([study](audio-contact-study.md)). It still needs export validation and web
verification before it replaces the live model.

[Compact delivery](compact-model-delivery.md) records the live mirror:
`silver-audio-finish-compact.glb`, served through `DEFAULT_MODEL_URL` in
`src/scene/model-layout.ts`. It supersedes two older statements in the model
directory README: that the public GLB mirrors `silver-speakers.glb`, and that
`silver-hinge-finish` is "current". Hardware refinement has no active worker on
24 September 2026; see the [feature map](feature-map.md).

Refinement passes form a sequential pipeline. Do not run an earlier script
against the latest checkpoint indiscriminately. Curved exports use carried
frame attributes, not the original geometry-matching tangent restorer.

After Blender MCP changes, regenerate the compact delivery with
`scripts/compress-delivery.mjs`; mirror `silver-audio-finish-compact.glb` to
`public/models/candidates/joshua-xl.glb` and update
`joshua-xl-eur-paint-mask.png` with it. Preserve the adjacent source licence.
Read [compact delivery](compact-model-delivery.md) for the exact pipeline.

Read the matching validation note before editing an area:

| Area | Validation |
| --- | --- |
| Dimensions, front, EUR artwork | `docs/source-dimensions-validation.md`, `docs/source-front-validation.md`, `docs/source-eur-validation.md` |
| Corners, chassis, cover, cover profile/seam | `docs/source-corners-validation.md`, `docs/source-chassis-validation.md`, `docs/source-cover-validation.md`, `docs/source-cover-profile-validation.md`, `docs/source-cover-seam-validation.md` |
| Paint grain, restrained paint, dock contacts | `docs/source-restrained-paint-validation.md`, `docs/source-dock-contact-validation.md` |
| Lower keys and labels | `docs/source-lower-key-validation.md`, `docs/source-legends-validation.md`, `docs/source-lower-label-validation.md` |
| ABXY openings, ink, finish, round, rollover, print | `docs/source-abxy-openings-validation.md`, `docs/source-abxy-ink-validation.md`, `docs/source-abxy-finish-validation.md`, `docs/source-abxy-round-validation.md`, `docs/source-abxy-rollover-validation.md`, `docs/source-abxy-print-validation.md` |
| D-pad fit/finish, power fit/finish/indicator | `docs/source-dpad-fit-validation.md`, `docs/source-dpad-finish-validation.md`, `docs/source-power-fit-validation.md`, `docs/source-power-finish-validation.md`, `docs/source-power-indicator-validation.md` |
| Upper cover, width, lid face, screen backings | `docs/source-upper-cover-validation.md`, `docs/source-upper-width-validation.md`, `docs/source-lid-face-validation.md`, `docs/source-screen-backings-validation.md` |
| SD flap, audio socket/finish | `docs/source-sd-outline-validation.md`, `docs/source-audio-socket-validation.md`, `docs/source-audio-finish-validation.md` |
| Hinge, cameras, speakers, slider, pad, plastic | `docs/source-hinge-finish-validation.md`, `docs/source-outer-round-validation.md`, `docs/source-outer-optics-validation.md`, `docs/source-camera-round-validation.md`, `docs/source-camera-validation.md`, `docs/source-speakers-validation.md`, `docs/source-slider-validation.md`, `docs/source-rubber-validation.md`, `docs/source-pad-validation.md`, `docs/source-recess-validation.md`, `docs/source-plastic-validation.md`, `docs/source-plastic-normal-validation.md` |
| Etched MIC/POWER | `docs/source-etched-validation.md` |


Use matching reference/render views before and after substantial geometry work:
front, back, underside, side and grazing angles. Check export scale, hinge,
material maps and relevant controls in the browser. A texture cannot replace
curved geometry; a bounding box does not prove visual fidelity. See
[research](3ds-xl-research.md) and [references](references.md) for evidence and
measurement limits; prefer official millimetre values to rounded diagonals.
