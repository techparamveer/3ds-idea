# Primary HOME cursor clock integration

Replace the live primary cursor's `elapsedMilliseconds * .06` Loop binding
with retained update-count state. The source contract is
`scripts/firmware/CURSOR_LOOP_CLOCK_EVIDENCE.md`, refined for event7 by
`scripts/firmware/HOME_INPUT_EVENT_EVIDENCE.md`. This change covers the ordinary
step1 Loop. Native mode3 acceleration remains separate until its counter's
ownership and transition ordering are established.

Runtime owns `src/os/home-cursor-loop.ts`, System integration, narrowly needed
pure visibility helpers and their tests. Presentation owns the cursor call in
`screens.ts`, the binding in `firmware-presentation.ts` and focused rendering
tests. Root owns integration, architecture notes and browser verification.
No worker controls Azahar or the browser, changes another worktree, or changes
the shared HOME clock's provisional cadence in this pass.

## Interface and order

The new pure module exports `HomeCursorLoop`, `createHomeCursorLoop`,
`advanceHomeCursorLoop(state, updates, eligible)` and
`getHomeCursorLoopFrame(menuState, reducedMotion = false)`. System retains
`homeCursorLoop`. The state has `currentFrame` and `appliedFrame`, initially0.
An eligible update submits currentFrame, then adds float32 1 and wraps before60.
Thus the first update applies0/current1; the61st applies0/current1. Zero updates
and ineligible updates preserve both values. Retain phase across ordinary
selection, density, root/folder changes, app suspension/return and overlays.
Fresh System construction and a true new power session reset the controller;
settings restoration is not scene reconstruction. Do not persist this state.

`getHomeCursorLoopFrame` is read-only: return appliedFrame, or0 for reduced
motion and legacy System-less callers. The renderer's cursor argument is now
an explicit Loop frame, and is bound directly without multiplying or rounding.
Fallback graphics keep their existing time policy. Density and generic CLAN
samplers keep fractional inputs unchanged.

System advances the cursor from the same eligible HOME update batches as
navigation. Freeze when the primary cursor is hidden by existing presentation
policy (inactive/sleeping/overlay HOME, close in progress, scrolling gestures,
and dragging without a painted drop cursor). Keep visibility calculation pure
and avoid a System/presentation import cycle or two diverging predicates.
Retain the current policy explicitly where native visibility is not yet proved.
Read-only capture and extra paint calls do not advance the controller. For a
batch crossing counted close completion, consume only updates with a visible
cursor, using the precise retained completion boundary, not final visibility
for the whole batch. State the ordering adopted for the completion update.

## Acceptance

Test0/1/59/60/61/121 updates, hidden/show phase retention, repeated same-clock
ticks, partitioned versus batched advancement, selection/density and folder
history retention, close completion boundaries, sleep/overlays, power reset,
settings restoration and reduced-motion read-only sampling. Exercise the live
System path, not only the arithmetic helper. Presentation checks must prove
the supplied frame reaches the Loop unchanged while fractional Scale survives.
Run relevant focused tests and typecheck. Root will compare actual browser
frames and native images; this is not a claim of native wall-clock parity,
mode3 acceleration, offscreen-helper updates or complete APT lifecycle parity.
