# HOME touch projection resize correction — 2 October 2026

## Scope and captured defect

This bounded scene slice changes only diagnostic coordinates published through
`data-targets`. It does not change pointer raycasting, touchscreen UV mapping,
HOME reducers, density controls, layout, or rendering.

The coordinator reproduced the defect from integration checkpoint `6e1a2252`
in production runtime `3bb6c6f3`. At 1150×690, `Touch_307_16` was
`[710.3939888418985, 375.7395774287338]`. After resizing to 390×700, the
published point was byte-identical and outside the viewport; replaying it left
HOME density at one row. A fresh 390×700 reload published
`[268.58369, 366.70629]`, and replaying that point advanced density from one
row to two. The run was muted and reported no page errors.

Private coordinator evidence is under
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-touch-projection-20261002/browser-before/`.
Its `result.json` SHA-256 is
`dcfe3ea837fe527ff62e7138ec4df981fb4ba9fe8b2a3670465b99ff70b1d211`.
It is browser interaction evidence only and is not a native comparison or a
whole-scenario acceptance result.

## Cause and correction

`resize()` updated the drawing buffer, camera aspect, field of view, and
projection matrix, invalidated the render schedule, then immediately rendered.
That direct render recorded the new pose as presented without republishing QA
targets. The animation-loop publication was separately gated on shadow motion
or absence of an existing dataset, so its desktop coordinates survived the
resize. Same-aspect dimension changes were vulnerable too because width and
height are not geometry samples.

Projected controls and touchscreen points are now considered inside every
actual render, after `scene.updateMatrixWorld(true)`, `fitConsole()`, and
`camera.updateProjectionMatrix()`, and before the draw. They are republished
only when geometry/projection moved, the host CSS width or height changed, or
no target dataset exists. This covers immediate and same-aspect resize renders
without repeating the Box3/control traversal for LCD-only texture paints. The
existing intro and diagnostics gates remain. Pointer input still uses `hit(e)`,
current DOM geometry and raycasting, then maps the hit UV to the 320×240
touchscreen; no application input path was changed.

## Verification boundary

Focused source tests assert publication order, the resize-to-render path,
dimension-aware refresh, suppression on LCD-only renders at an unchanged CSS
size, and preservation of the real raycast/UV touch route. The coordinator owns
production replay at both viewport sizes and all native/browser acceptance
work. This slice does not establish exact input, motion, audio, or strict 1:1
fidelity.
