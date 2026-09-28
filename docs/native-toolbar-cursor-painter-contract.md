# Native cursor painter boundary

The source/resource audit in `scripts/firmware/TOOLBAR_CURSOR_EVIDENCE.md`
establishes toolbar anchors, Scale10–12, independent controller timing and the
two departed-selection effects. This contract authorizes only reusable painting
primitives. Live state, scheduling, visibility and screen placement remain with
the integration task until the native navigation consumer is integrated.

Presentation owns `src/os/firmware-presentation.ts`, focused cursor presentation
tests and its validation note. It may load the existing `LncCsrEfct_00` layout
and required animations from the already converted launcher pack. No resource
conversion, System, scene, navigation, cursor clock or `screens.ts` edits.

Expose center-based helpers on the firmware presenter:

- `cursorAt(ctx, centerX, centerY, scaleFrame, loopFrame, pressed = false)` draws
  `LncCsr_00` using the supplied applied Scale and Loop frames. Scale10,11,12
  must reach the sampler unchanged; retain fractional Scale for density motion.
- `cursorEffectAt(ctx, centerX, centerY, scaleFrame, disappearFrame)` draws
  `LncCsrEfct_00` with the supplied applied Scale and DisAppear frames.
- Keep `cursor(ctx,x,y,size,density,loopFrame,pressed)` as the compatibility
  grid wrapper, using its current center conversion and density clamp.

Both helpers are read-only draws, return the renderer result and neither impose
the grid clip nor change controller state. Use native animation bindings and
their groups. A Scale seek or DisAppear restart is not a new applied pose until
the next eligible native layout update. The caller, not the painter, owns that
distinction, effect lifetime, slot following and modulo2 reuse.

The primary cursor uses the current focus. Effects use the departed focus/slot.
Toolbar centers are `(26,16)`, `(76,16.5)`, `(118,16.5)`, `(160,16.5)`,
`(202,16.5)`, `(244,16.5)`, `(281,16)`, `(307,16)`. Runtime will resolve these
anchors and the applied frames before painting; do not add a second navigation
state or derive them from evenly spaced hit regions.

Verify exact binding frames and centers, original-resource duplicate-key poses
at Scale10/11/12, effect alpha at DisAppear0/10/20, fractional grid compatibility,
read-only repeated draws and return-value propagation. Reuse the existing
presentation fixture and original converted resources. Run focused tests and
typecheck. Browser/native pixels and the final layer order are later integration
checks, not established by these primitives.
