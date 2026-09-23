# Native HOME selection and mode3 consumer

This follows the pure input producer and source sampler. Runtime owns the
navigation/cursor/close reducer implementation and its tests. Root owns scene
transport, sound delivery, shared scheduling integration and browser acceptance.
Presentation's independent density-button patch owns only its helper, toolbar
bindings and the narrow `touchMenu` toolbar branch; do not edit those files.

Use `CURSOR_ACCELERATION_EVIDENCE.md`, `HOME_INPUT_EVENT_EVIDENCE.md`, the pending
ordinary host-order note and their original-ARM numeric fixtures. First commit
the source sampler separately. Implement an explicit native key-event consumer
and update API before replacing live generic input routing. The existing
generic application latch and compatibility commands must continue working.

## Retained state and native entry

Keep mode3 entry count, initiating left/right markers and pending left/right
markers outside persisted root/folder view records. Initialize them for a fresh
HOME scene, retain them across ordinary selection and root/folder context
changes, and implement event7's source-proven reset. Do not reset them merely
because a paint, density change, selection change or idle entry occurs.

Extend the retained cursor Loop with its step, initially1, and a phase-preserving
setter for the supported1/3 values. Existing submit-before-step and wrap-before60
semantics remain. A mode3 entry resets elapsed0, chooses10/count+1 below count5,
otherwise5 and step1→3, without seeking or submitting the cursor. Preserve
integer and fractional phases and exact partitioned update behavior.

The native key consumer receives ordered `{type:4|5|6|7,mask}` records. For the
proved ordinary single-axis grid route,4/6 select;5 does not select. Horizontal
edge crossing sets selection/target/direction then enters mode3. Interior moves
and rejected moves do not increment the mode3 count. Rejected horizontal press4
produces its invalid-cue observation; repeat6 is silent. Successful4/6 produce
selection-cue observations. Keep effects explicit so the host can deliver every
event in a batch, including completion-replayed selection, without inferring a
single cue from the final selected slot.

Busy horizontal4/6 coalesce into pending flags without moving selection.
Mode3 completion settles the endpoint, then performs at most the native
left-priority direction/pending replay of event6. Clear the serviced pending and
direction flags AFTER that replay, including a same-direction marker it creates.
Do not invent a FIFO, retarget ongoing geometry or chain arbitrary queued input.
Event7 with mask&0x30 clears count/both pending and sets Loop step1; retain phase,
current duration/elapsed and initiating markers. Vertical-only7 does not reset.

Keep producer polls and navigation updates separately callable. Pending source
evidence is resolving diagonal mode0/grid-toolbar behavior. Do not replace it
with a dominant-axis guess or claim a complete native focus model.

## Distinct routes and staged integration

Expose the source routes distinctly: ordinary direction event; absolute tile
selection with mode3 nearest aligned target and no direction marker; page-arrow
selection with mode2/16; and folder-return viewport correction. Reuse geometry
sampling rather than implementing a second grid. Preserve density mode5/15.
Do not silently translate every absolute selection into a directional press.

For folder return, choose mode3 duration at the actual root-restoration task
boundary from the then-current count, so a release during closing can affect
the choice. Source ordinary correction targets one column left/right; retain
the existing farther-history repair only as a documented defensive policy.
Visible restoration is ready atC+18. Offscreen readiness isC+23 orC+28, with no
viewport step spent on restoration. Keep generation/identity invalidation and
the exact ready boundary intact. If the pure close controller's preselected
restoration plan needs an explicit late-resolution API, add and document it
without weakening stale-identity checks.

Do not wire the existing wall-time repeat loop to this consumer. Report the
new API before live System routing, which will use the actual ordinary order:
input → upper task → lower task →3D clips →2D layouts/cursor →audio. The shared
nominal60Hz/catch-up adapter remains an explicit browser policy; source counts
are not proof of native milliseconds. Lower-generated requests are after the
upper manager in that pass; input-generated requests are before it.

## Verification

Use numeric original-ARM observations for entry thresholds, release/cancel,
busy same/opposite direction, completion after-call clearing, touch/page route
distinction and both78-poll schedules. Test phase preservation and step3 wrap,
partitioned versus batched scene updates with cues in order, and no duplicate
effects when sampled or advanced by zero. Add source-backed close duration and
release-before-restoration cases, retaining existing close identity/lifecycle
tests. Run focused tests and typecheck. Report remaining gates explicitly.
The new reducer API is not live HOME acceptance until root connects it and
verifies actual browser controls against the native reference.
