# Folder-close System and scene integration contract

Integrate the pure normal-close controller while keeping System reducers free of
scene effects. Runtime owns system.ts, home-navigation.ts, a new deterministic
System-close adapter if useful, focused tests and OS documentation. Root owns
home-banner-host.ts, console-scene.ts, screens.ts and firmware-presentation.ts.
Do not edit another worktree or public assets.

## Retained state and timing

System retains one current close record, its monotonic transition allocation,
and a generation replaced on successful settings restore. A record includes the
pure controller, original folder slot, startedAtUpdate, restoredAtUpdate and
selectionReadyAtUpdate (nullable until observed). Retain the completed record
until the next transition/lifecycle reset; these two timestamps are bounded
observations, not an event queue. Expose an immutable sample/helper to consumers.

For ordinary Back while HOME has an open folder and no panel, begin once and
keep folder context active. Immediately consume the setup update's one layout
pass (taskEligible=false, layoutEligible=true). Do not increment the shared HOME
clock. Thus at starting count C folder appliedFrame=16, capture appliedFrame=8;
C+17 sees folder idle, and the task at C+18 restores root. Duplicate Back must
not restart. Touch Back, footer Back and keyboard/physical Back use this path.
Block ordinary navigation, folder editing, opening and gestures while closing
or waiting for restored selection. Keep global power/audio controls available;
existing inactive/sleep/overlay clock inhibition freezes transition work.

On each active shared clock batch, preserve pure controller observation offsets.
At rootRestored, leave the folder exactly once and record the precise shared
update count. At rootSelectionReady, record its precise count. Process remaining
batch updates against the restored navigation, never against the old folder.
No clear-banner acknowledgement is needed. Read-only sampling never advances.
Reduced motion keeps deterministic transition timing; painters can choose an
accessibility pose separately. Never persist controller/identity/timestamps.

Visible root restoration is the normal supported path: entering a folder
already settles root selection into view. For an offscreen root, restore actual
root geometry and use native mode3 linear viewport motion for an explicitly
selected duration5 or10. Use a named, documented adapter policy of10 until the
native shared acceleration-counter ownership is proved; do not call this policy
source-exact or infer it from wall time. Do not allow the view to remain offscreen
at completion. Request readiness only after the viewport endpoint. Preserve
source frame counts and source input observations separately from this policy.
Lifecycle/context replacement must discard stale close records safely. Inspect
existing restore/reset routes and keep late observations from affecting a new
folder/layout. Do not manufacture a completion event on cancellation.

## Root-owned banner consumption

Resolver returns explicit clear while close is incomplete. Scene advances the
old request to selectionReadyAtUpdate, installs the restored selection at that
boundary, then consumes the remainder of the batch. Do not postpone a mid-batch
request to the final update. Existing crossHomeBannerBoundary consumes elapsed
old work before installing a boundary; keep that consistent convention and
state that native lower/upper task-list ordering remains unresolved.

Close SFX is emitted when the close identity begins, not when opened becomes
false18 updates later. The later root restoration must not replay it. Root will
bind folder/capture appliedFrame values to the decoded source clips; no timer.

## Acceptance

Test setup-inclusive18-update completion; one large tick vs stepped ticks,
precise retained boundary counts and remaining navigation updates; duplicate
Back and all shared input routes; inhibited sleep/overlay/hidden time rebasing;
root/folder history retention; offscreen mode3 endpoint with explicit policy;
context replacement/restore, power and resource-independent completion. Run
focused existing navigation/gesture/System tests and typecheck. Root performs
combined browser and source-frame verification after sequential integration.
