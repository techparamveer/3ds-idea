# Agreed pure folder-close controller contract

Implement the source-proven normal close controller before changing System or
scene scheduling. Runtime owns a new src/os/home-folder-close.ts, focused tests
and its documentation. Root owns later System/scene/painter integration, with a
separate review of the per-update observation boundary. Do not add timers,
application mutations or banner-service calls to the pure controller.

Expose immutable begin, single-step, batch and read-only sample operations.
State carries a caller-supplied System generation and transition ID, reverse
folder and capture controller states (frame, appliedFrame, status, endReached),
phase closing/viewport/complete and any counted viewport progress. Begin starts
at folder16/capture8, status1, with no completed layout advance. It reports the
single closeStarted observation; repeated sampling does not re-emit it. Define
observation results per operation, not an unbounded retained event log.

Each step first processes the eligible lower task predicate, then the eligible
layout-controller pass. Folder status1 and2 block root restoration. The layout
pass applies current frame before advancing; folder reaches idle after18 such
advances, capture after10. When the next eligible task observes idle, emit
rootRestored once and disable further folder/capture layout advancement. If the
caller supplies restoredSelectionVisible=true, complete and emit
rootSelectionReady in that same task pass. Otherwise enter viewport mode with
an explicit caller-supplied duration5 or10; do not infer the unmodeled source
acceleration counter. Subsequent eligible task passes count to that threshold,
then emit rootSelectionReady exactly once. No viewport count occurs during the
root-restoration step itself. Invalid missing viewport duration is explicit.

Task and layout eligibility are separate inputs. Batch processing must preserve
single-step ordering and event offsets, and may stop iterating once complete.
Generation/transition ID matching prevents stale work from changing a newer
transition. Sampling has no side effects. Repeated begin/cancel semantics must
be explicit and tested; cancellation must not manufacture a root-ready event.
Banner clear completion is never an input or barrier.

The integration will account for the first eligible layout pass in the same
application update as close setup. With all phases eligible, that yields setupN,
18th layout advanceN+17, root restoreN+18. Native upper/lower task-list ordering
is still unproved; this controller does not assert which upper manager pass
consumes the clear/root observations. Special immediate callers and modes14/16
remain outside this normal close contract.

Acceptance includes every source endpoint/status/applied-frame sample, split
eligibility, setup-inclusive counts, root visible/offscreen cases, both viewport
thresholds, batch-vs-stepped equality and event offsets, stale generation/ID,
cancellation and read-only sampling. Use the committed ARM fixture outputs as
numeric oracle. Do not modify system.ts, state.ts, home-navigation.ts, scene,
screens, audio, public assets or another worktree in this bounded implementation.
