# Pure normal folder-close controller

`src/os/home-folder-close.ts` implements the counted transition from the
[source trace](native-folder-close-boundary.md). It owns reverse folder/capture
clocks, completion predicates and operation-local observations. It has no menu,
banner, renderer, audio, timer or persistence dependency. The later [System adapter](home-folder-close-system.md) integrates the counted
Back transition. Scene/host/painter scheduling remains separately owned.

## API and ownership

| Operation | Result |
| --- | --- |
| `beginHomeFolderClose(current, identity, restoration)` | Fresh closing state and one `closeStarted` observation; no step consumed |
| `stepHomeFolderClose(state, identity, eligibility)` | One eligible lower-task predicate, then the eligible layout pass |
| `advanceHomeFolderClose(state, identity, updates, eligibility)` | Equivalent ordered steps with observations at their zero-based offsets |
| `cancelHomeFolderClose(state, identity)` | Drops a matching transition to null; emits nothing |
| `sampleHomeFolderClose(state)` | The frozen readonly state, or null; no clock or event work |

An identity is `{generation:string, transitionId:number}`. The generation is a
nonempty System session key; the transition ID is a caller-owned nonnegative
safe integer. Step/batch/cancel require an exact pair. Stale work returns the
retained state, no observations and `processedSteps:0`.

Begin is an explicit authoritative replacement, not an asynchronous callback:
a different pair supersedes the old transition. Repeating the retained pair is
idempotent during closing, viewport adjustment and completion; the first valid
restoration plan wins. Begin does not order or authenticate generation strings.
The caller must issue begin only for its current System and mint a fresh pair
after cancellation. A null slot retains no cancellation tombstones or history.
Repeated cancellation of null is a no-op. Cancellation does not undo observations
already consumed by integration or manufacture root restoration/readiness.

`restoration` requires `restoredSelectionVisible`. An offscreen root also
requires `viewportDuration:5|10`; absent/invalid values throw. Visible roots do
not use a viewport duration. The caller owns the source acceleration counter
and resolves this plan; the module never guesses it from elapsed time.

All owned nested state, identities, observations, arrays and results are frozen.
Caller objects are copied; sampling returns a stable immutable reference. There
is no retained observation log. Each operation returns only its own observations.

## Native phases

Begin starts folder frame16 and capture frame8, status1, endReached=false.
`appliedFrame:null` means this transition has not applied a frame yet. Native
start does not write the animation transform; the ARM fixture's initial zero
was its zero-initialized transform memory, not a guaranteed close-start sample.
The first eligible layout pass applies16/8 before advancing to15/7.

Folder reaches frame0 at advance16 while status remains1; advance17 applies0
and sets status2; advance18 applies0 and sets idle0. Capture reaches idle after10.
A lower-task predicate before a layout advance still sees the earlier status.
The first eligible task observing folder idle emits `rootRestored` and disables
both layout clocks. A visible root also emits `rootSelectionReady` immediately,
in that order and at the same step offset.

An offscreen root enters `viewport` with zero progress on its restoration step.
Only subsequent eligible task passes count to5/10; the threshold pass emits
`rootSelectionReady` and completes. Layout eligibility cannot advance viewport
progress. Task inhibition permits layout completion but defers root restoration.
There is no banner-clear ACK or resource-readiness barrier.

## Batch observation boundary

`closeStarted.stepOffset` is null because begin is not a step. Other observations
have a zero-based offset within their step/batch operation and carry the matching
identity. They occur in that step's lower-task phase. No event payload invents
a root slot or banner target: integration must restore/resolve its own state at
the corresponding observation boundary.

For all-eligible normal updates with begin before the setup update's layout pass:

| Operation | Observation / result |
| --- | --- |
| Begin | `closeStarted`, offset null |
| Batch100, visible root | `rootRestored` then `rootSelectionReady`, both offset18; `processedSteps:19` |
| Batch100, viewport5 | `rootRestored` offset18; `rootSelectionReady` offset23; `processedSteps:24` |
| Batch100, viewport10 | `rootRestored` offset18; `rootSelectionReady` offset28; `processedSteps:29` |

Thus the first layout pass occurs at setupN, the eighteenth atN+17, and the next
task restores root atN+18. Begin itself does not advance the layout; the caller
must account for the setup update's later layout phase exactly once.

Eligibility must be constant within a batch; split at every gate change.
`processedSteps` counts represented input steps including inhibited steps and
stops at completion. The caller retains remaining shared updates for other
systems. A batch may skip iteration over a stable inhibited/idle state while
representing all those identical steps. Zero updates preserve state; null,
stale and already-complete operations represent no steps and emit nothing.

Integration must consume observations at their offsets, not apply the batch's
final restored selection to every preceding update or postpone all observations
to the batch end. Native lower/upper task-list ordering is still unproved. This
module does not establish which banner-manager pass sees a request, or wire any
System, HOME clock, scene or painter changes. Those boundaries require the
integration owner's separate review.

## Verification

`tests/home-folder-close.test.mjs` reads the committed
[ARM numeric oracle](evidence/native-folder-close-boundary.json). It checks every
folder/capture clock row, native completion predicate, both layout gates, both
viewport thresholds and setup-inclusive counts. Other cases cover split
eligibility, same-step event ordering, batch/single-step equality and offsets,
stale identities, duplicate begin, cancellation, frozen samples and invalid
caller inputs.

All18 focused tests and67 existing banner lifecycle/service/host/default tests
pass (85 total, no skips). `npm run typecheck` and `npm run build` pass in the
runtime worktree. No broad model/LFS suite, shader check or browser run is needed
for this unused pure module. This does not validate later System/scene scheduling,
visual transitions, special immediate callers, modes14/16 or physical cadence.
