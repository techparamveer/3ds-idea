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

## Integrated production verification

Source `43cbf493` integrated as `a751b2dd`. Independent read-only review found
no confirmed regression; the four new tests are structural source assertions,
not behavioral resize tests. Coordinator full checks pass: 1793 tests,
0 failures, 23 skipped, 1 TODO; typecheck, build and shader checks pass.

Actual production replay now republishes `[268.58369,366.70629]` after the
1150x690 -> 390x700 resize, and the same real 200 ms pointer tap changes rows
1 -> 2. A subsequent reload correctly preserves two rows and its tap reaches
three; it is not an independent one-row initialization. The former mobile
failure was an out-of-viewport QA replay, not a broken touchscreen button.

Five consecutive viewport checks (1150x690, 920x552, 390x700, 312x560 and back
to 1150x690) each use real 50 ms pointer holds to change rows 1 -> 2 -> 1.
All targets stay inside their hosts, all screenshots are nonblank, audio stays
muted and no page errors occur. This includes both same-aspect resizes. The
desktop density sequence also reaches every row count 1 -> 6 -> 1 and keeps
both boundary taps at the valid limit, before and after the change.

Eight new Azahar own-PNGs cover initial one row, a longer-press repeat to five,
six rows, then five 50 ms decreases back to one. Immediate and settled states
after the first 200 ms native hold differ (two versus five rows). This is an
unresolved native input/repeat timing observation, not proof of exact HID
matching or a browser reducer defect. The profile remains isolated and muted;
Quit/Yes exits 139 this run and PID absence is verified. That differs from the
previous turn's clean exit. No default-profile or system/Spotify audio change.

Private artifacts, scripts and check logs are under the same root as the
baseline: `browser-after/`, `resize-controls-after/`, `density-before/`,
`density-after/`, and `coordinator/`. `coordinator/native-run.json` records all
native paths, input holds, isolation, and shutdown. No firmware asset, native
material, OS state or touch geometry changed. Original title-setter, Notes UV,
previous close fits/host clocks, plate/footer, population, banner/cursor epoch,
input/motion/audio and portfolio/local adaptations remain open as previously
recorded. No whole-scenario or private-matrix acceptance changes.

The [six-density comparison](workstream-handoffs/home-density-compare.md)
records all named pairs, source identities, empty masks, regional controls and
report/sheet hashes. Toolbar/density controls stay within delta 2 across every
row; Notes maximum is 1. Direct lower changes are confined to the selected
cursor neighborhood, whose source frame differs. That cursor needs a named
frame replay next, not a guessed geometry fit.
