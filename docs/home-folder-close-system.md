# Counted folder close in System

Normal HOME Back now keeps the folder context until the source close predicate
completes. Keyboard/physical B, legacy command input, the native Back tab and
occupied-footer Back use the same System path. The lower-level standalone menu
helpers retain their immediate behavior; live inputs must route through System.

The implementation follows the
[agreed integration contract](native-folder-close-system-contract.md) and builds
on the [pure controller](home-folder-close-runtime.md). Scene, banner-host,
painter and audio consumption remain owned by the integration task.

## Consumer interface

`home-folder-close-system.ts` exports `SystemHomeFolderCloseRecord`,
`sampleSystemHomeFolderClose(state)` and `isSystemHomeFolderClosing(state)`;
`system.ts` re-exports them. The frozen record contains:

- `controller`: immutable pure controller, including identity and applied frames;
- `folderSlot`: original folder slot;
- `startedAtUpdate`: close setup's shared HOME count;
- `restoredAtUpdate`: exact root-restoration count, or null;
- `selectionReadyAtUpdate`: exact readiness count, or null.

System retains one session with that current record, a local generation revision,
a monotonic transition allocator and an owned navigation/counter checkpoint.
A completed record remains available through subsequent root ticks and ordinary
root navigation. Sampling is readonly; it returns null for a replaced context.
There is no growing event list. The pair is scoped to its owning System, not a
global identifier across independently created System objects.

Successful settings restore advances the local generation and preserves the
transition allocator. Layout reset also advances the revision. Neither the
record nor its counters, identities or geometry checkpoints are serialized by
`saveSettings`; restore ignores injected transient fields. Failed restore leaves
the existing transition alone.

## Shared update ordering

Back first consumes any prior active clock work. Begin at countC emits the
conceptual close-start boundary and consumes the setup update's single later
layout pass without incrementing that clock. Initial sampled folder/capture
applied frames are therefore16/8, and their next frames15/7. Duplicate Back
cannot restart or allocate another transition.

Later active updates run the pure lower-task predicate before the layout phase.
Folder idle is reached atC+17; restoration is observed atC+18. At that exact
update the adapter calls `restoreHomeFolderRoot` once and records the timestamp.
Visible root selection is ready atC+18 as well. A large batch runs the same
ordered steps, records the earlier boundary, then advances remaining navigation
work against root. It never stamps a mid-batch completion with the final count.

No resource-ready or banner-clear acknowledgement is consulted. The host/scene
must split banner work at `selectionReadyAtUpdate` and emit close SFX on the
begin identity; the opened→closed change18 updates later must not replay SFX.
Native lower/upper task-list ordering is still unresolved; this adapter does not
claim which native upper-manager invocation consumes either request.

## Defensive offscreen root

Entering a folder normally settles root selection into view. If a retained root
record nevertheless puts selection offscreen, restoration begins a mode3 linear
viewport motion from actual root density/current-left geometry. The target is
the nearest valid aligned viewport containing the selected slot, including
far-off valid history. It does not reuse child-grid geometry.

`SYSTEM_HOME_FOLDER_CLOSE_VIEWPORT_UPDATES = 10` is a named adapter policy.
Native source permits5 or10 depending on its shared acceleration counter; that
counter is not modeled here. The chosen10 and far-off target correction must
not be presented as exact native behavior for unusual history. The linear
mode3 interpolation and separate restoration/readiness boundaries are retained.
No viewport progress is spent on the restoration step. Readiness occurs atC+28,
after10 subsequent eligible updates and after the endpoint is committed.

## Input, pauses and cancellation

Ordinary navigation, opening, folder controls, gestures and legacy root item
movement are blocked while close or viewport work is incomplete. Begin clears
held inputs; blocked contacts/buttons do not queue gestures or delayed repeats.
Global power, HOME, preferences and audio paths remain available. Preferences,
power and other existing overlays inhibit the shared clock; sleep and hidden
input release rebase it without replaying inactive time.

Release no longer settles pending close viewport geometry. Reduced motion also
preserves the counted close/viewport transition; presentation may choose a
separate accessible pose. Ordinary navigation's existing settle policy remains.

Launch, applet/context ownership replacement, confirmed power-off and layout
replacement discard the close without fabricating readiness. During an
incomplete transition, an unexpected navigation reference or counter checkpoint
invalidates it before further observations can affect a different context.
Successful settings restore installs a fresh session generation. No asynchronous
completion callback is accepted by the adapter.

## Additional source evidence for painting

The close setup does not establish a blanket hide-all-child-icons rule.
`0x1de558` calls `0x2a6cf4`, which iterates ordinary slot layouts at scene+0x830.
At `0x2a6d38–0x2a6d4c`, category5 chooses `N_BlankAnime_00`; other categories
choose `N_Dlg_00`. The exact strings are at `0x2a6f14` and `0x2a6f24`.
Parent layout is scene+0xac0 (`LncFolder_00`).

Binding helper `0x2232d8` records the child layout's parent at child+0x50, finds
the named pane and passes the child's root pane to `0x223344`. That helper
appends the child's pane node to the named parent's child list and writes its
parent pointer. Other live icon layouts are similarly attached by this close
setup. Therefore normal child icons inherit the source parent transform/alpha;
shrinking only the folder chrome while drawing independent stationary children
would omit that relationship. This is static bounded source evidence against
the same executable hash as the [close trace](native-folder-close-boundary.md),
not a GPU or browser comparison.

The exact close-time cursor/footer visibility predicates remain unresolved.
The entry-capture visibility exclusions documented in the panel investigation
are a different path and do not prove close behavior. This System change does
not alter painting or claim that every child vanishes at close-start.

## Verification and remaining boundary

The15 new System-close tests cover setup counts, retained mid-batch timestamps,
large-versus-stepped ticks, all shared Back routes, blocked inputs/repeats,
independent histories, both offscreen directions, linear viewport midpoint and
endpoint, reduced motion, sleep/overlay/hidden rebasing, global audio, restore,
cancellation, context replacement and immutable sampling. Older Back tests now
assert deferred completion instead of immediate root restoration.

All179 focused new/existing navigation, gestures, folder input/history/motion,
portfolio, app runtime, banner host/default, identity/naming, effects and menu
tests pass with no skips. Typecheck and the production build pass. The broad
model/LFS suite and shaders are unrelated to this reducer change. Root owns
combined browser/source-frame verification and the separate host/scene/painter
integration; this work does not claim visual completion.
