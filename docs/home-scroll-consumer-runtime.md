# Native HOME selection and scroll consumer

2026-09-23. The pure consumer models source-proved direction masks, grid/toolbar
focus navigation, mode3 acceleration, deferred horizontal replay and distinct
touch/page/folder-return routes. It returns ordered observations for a later
host; it does not replace live generic input routing or deliver sound.

## Host interface

`home-scroll-consumer.ts` consumes `{ navigation, cursorLoop }` and returns
frozen `{ state, observations, disposition }`. `disposition` is `handled` for
the supported route, including source-proved no-ops, or `unsupported` when a
different owner/evidence is needed. Unsupported does not imply an exception.

| API | Scope |
| --- | --- |
| `consumeHomeGridKeyEvent(state, event, gates?)` | Exact4/5/6/7 ordinary direction/release events |
| `advanceHomeScroll(state, updates, options?)` | Counted lower scene updates, completion and pending replay |
| `enterHomeMode3(state, targetLeftSlot, cause?)` | Actual entry, including explicit same-mode re-entry |
| `selectHomeTouchSlot(state, slot)` | Absolute tile selection from ordinary idle grid |
| `pageHomeViewport(state, direction, selectionStatus)` | Idle page-arrow mode2 route with explicit native status1 |
| `restoreHomeRootViewport(state, options?)` | Correction after root context restoration |

The ordinary gate object has four booleans: `overlayActive`, `managerPresent`,
`managerInhibited`, `sceneInhibited`. The default represents the bounded
ordinary path, not inferred live platform readiness. Event7's horizontal reset
is independent of those directional gates.

Observations are `cue` (`selection`, `invalid`, `toolbar`), `cursor-select`,
`scale-seek`, `mode3-entry`, or `banner-resolve`. Cue observations retain input class/mask and
selected slot. Their native IDs are respectively `0x0100002c`, `0x0100002e`,
`0x0100003f`; host/audio owns delivery. Scale observations contain native frame
requests. They do not directly seek a painter-owned controller.

`cursor-select` separates the new selected slot from `effectTarget`, the
departed grid slot or toolbar focus. Its target retains the native Scale frame
and context. A grid target also captures its effect-call unscrolled x/y and
scroll offset, sampled after the direction helpers but before touch viewport
correction. The host must keep a grid effect bound to that slot/context during
later motion; a toolbar effect stays at its fixed toolbar anchor. Alternating
effect instances and DisAppear controllers remain presentation-owned.

`banner-resolve` means an attempt to resolve a banner, not an accepted request.
It snapshots context, selected slot and focus at the actual lower boundary.
An ordinary idle update attempts resolution even when selection is unchanged.
Ordinary mode2/3/5 completion attempts it on idle entry. Mode3 does so before
a pending event6 can change selection.
The host owns service readiness, classification and accepted-key/type/options
deduplication; navigation does not infer these from a slot. Consecutive
unchanged idle attempts use one positive safe-integer `updateCount` span over
`[updateOffset, updateOffset + updateCount)`. Entry observations have count1.
The optional `idleOverlayActive` gate applies S+3fd0 to ordinary idle-update
attempts; it defaults to the bounded no-overlay path. Idle-entry attempts still
occur with that overlay present. These lower calls are independent of whether
the input dispatcher consumed a direction earlier in the pass.
The overlay value describes that lower boundary, not a guarantee that earlier
services retained an overlay for the entire host pass. Mode2/5 with an active
overlay remains unsupported; their source proof covers ordinary completion.

Input-route observation `updateOffset` is null: the caller owns that boundary.
Counted advances use zero-based offsets within the supplied update batch.
Observation array order is significant. A replay at the completion of a
10-update scroll appears at offset9. Split batches produce the same observations
after adding their starting offsets and expanding resolver spans. Zero updates and sampling emit nothing.
Counts must be safe nonnegative integers.

**`advanceHomeScroll` never advances cursor phase.** A mode3 entry or event7
may change the retained step; the later2D/layout pass submits and advances the
resulting controller. Actual native order is input → upper task → lower task →
3D controllers →2D layouts → audio. Root owns the shared host/journal bridge,
including reading cursor state after lower work rather than overwriting its
new step from an earlier snapshot. No milliseconds or physical cadence follows
from these counts.

## State and native rules

`HomeNavigation.mode3` holds scene-local `entryCount`, `directionMask` and
`pendingMask`. `HomeNavigation.focus` holds `toolbarActive`, `currentFocus`,
`rememberedFocus` and `savedColumn`. They sit outside root/folder view records
and are not persisted. Fresh navigation initializes them. Existing selection,
density and context helpers retain them through immutable spreads.

Each mode3 entry resets elapsed0. Below count5 it chooses duration10 and
increments the count; at count5 it chooses5 and changes step1 to3. It never
seeks/submits Loop or clears markers merely by entering idle. The cursor has
retained `step: 1 | 3`; `setHomeCursorLoopStep` preserves current/applied phase.
Submit-before-step, float32 addition and wrap-before60 remain intact. Integer
batches use exact60/20-update cycles; fractional phases step until an exact
cycle is observed before skipping complete cycles. Other native step values
are outside this deliberately supported1/3 interface.

Horizontal4/6 moves by one row-count column. Viewport crossing writes the new
selection/target/initiating marker before entering3, then requests the final
cue and cursor effect. Interior changes and absolute rejection do not enter3.
Rejected press4 requests invalid; rejected repeat6 is silent. Held5 does not
select. Busy single-axis horizontal4/6 sets its pending bit; diagonal/vertical
inputs do not acquire a horizontal pending bit.

Completion commits the target, enters idle, attempts banner resolution, then examines initiating markers
with left priority. A matching pending bit replays one event6. The serviced
pending bit and initiating marker are cleared **after** the replay, including
a same-direction marker just created by it. Opposite pending can remain. This
is neither a FIFO nor an automatic repeating chain.

Event7 mask `&0x30` clears the entry count and both pending bits and restores
step1. It retains initiating markers, elapsed, duration and both cursor phases.
Vertical release leaves those acceleration fields unchanged.

Exact cardinal/diagonal/opposing masks follow the source dispatcher. Grid
diagonals run vertical then horizontal unless vertical newly enters toolbar
focus. Toolbar diagonals run horizontal then vertical. Opposing `0x30`, `0xc0`,
`0xf0` are inert. A partial diagonal can request invalid then selection; the
repeat suppresses only invalid. One common cursor effect follows the final
cue. Numeric focus/column mappings follow the verified native tables; root
and folder table values are identical, while row counts differ. No toolbar
feature labels, activation behavior or painted anchors are inferred.

Absolute touch correction chooses the nearest aligned visible target and
enters3 without setting a direction marker; its cursor effect precedes entry.
Page arrows preserve mode2/16 and the existing curve. Density mode5/15 remains
unchanged. Ordinary root return moves one column; `repairFarHistory: true`
explicitly enables the previous farther-history repair policy.

## Folder-close boundary and compatibility

`resolveHomeFolderCloseRestoration(controller, identity, plan)` accepts a late
plan only for the matching still-closing operation with idle folder layout.
It consumes no task/layout/update and emits no restoration or readiness event.
The close adapter resolves visibility and current10/5 choice at restoration,
then enters mode3 with no viewport update spent on that boundary.

`advanceSystemHomeFolderCloseNative(state, updates, reduced?)` returns
`{ state, observations }`, preserving replay/correction offsets. The existing
`advanceSystemHomeFolderClose` state-only wrapper remains for compatibility.
Native host integration must use the observation-returning API. The existing
fixed10 constant is only a compatibility preview, superseded by late resolution.

`consumeSystemHomeFolderCloseInput(state, identity, event)` permits event7
through a pending close and refreshes its owned navigation reference. The
identity, generation and previous navigation reference must all match before
any change. Other events, stale identities and out-of-band replacements cannot
use this bridge. It does not weaken the existing invalidation rules.

Visible root restoration is ready at C+18. Offscreen correction is ready at
C+23 or C+28. A horizontal release before restoration selects10; release during
an already active5-update correction retains that duration. The close adapter
opts into far-history repair explicitly. Existing legacy commands, standalone
menu selection and generic420/150ms app repeats retain their old routing.

## Evidence and validation

Source: EUR HOME `0004003000009802`, version24576; SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Source notes are `CURSOR_ACCELERATION_EVIDENCE.md`,
`HOME_DIRECTION_MASK_EVIDENCE.md`, `HOME_INPUT_EVENT_EVIDENCE.md`,
`CURSOR_LOOP_CLOCK_EVIDENCE.md`, `TOOLBAR_CURSOR_EVIDENCE.md` and
`HOME_HOST_ORDER_EVIDENCE.md` under
`scripts/firmware/`.

[The committed numeric oracle](../tests/fixtures/home-scroll-consumer.json)
pins private original-ARM checks/results and the exporter. Expected values are
copied observations, not TypeScript-generated predictions. It covers all
2,206 direction/focus scenarios (1,980 direct,144 round trips,12 remembered
overrides,70 gates), both78-poll schedules, entry/release/busy/replay cases,
36 touch corrections,94 page boundaries,3 touch-effect order cases and native
Loop step3/fractional observations.

[The observation oracle](../tests/fixtures/home-scroll-observations.json) also
copies34 original dispatcher effect departures and the supported accepted
grid-touch case from the presentation audit. It pins final cursor fixture
`00af50c4d548f39e5878f208298dcc48f98110f72652fe559852525316b46e0e`
and results
`05b378c0534019c8ea8d22a966d23ea3bdfd1ac265d8b70d07fc21308f6eaa86`.
All16 excerpt hashes were verified. These assertions check departed targets,
Scale frames, grid coordinates and cue/effect order; renderer animation and
visibility remain presentation-owned.

That oracle also copies32 resolver scenarios from banner request fixture
`7b1be990ca14d0a5b650f8260647d64c4682e02a793f0fb8bbcfa597fb5d6b23`
and frozen results
`d686fa7d223fbb9ec505d831d5dbc148d7cb17bbedadfbad248b88afda94cdb4`.
Its25 excerpt hashes and fixture hash were verified. Cases include input versus
lower timing, pre-replay selection, unchanged idle attempts, mode2/5 mature
completion, toolbar snapshots, root readiness and the distinct idle-update
and idle-entry overlay boundaries. The mode2/5 test supplies elapsed9/duration10
to the actual completion body; initiation durations remain covered by the
separate page/density evidence. Direct overlay fixtures prove call boundaries,
not an entire overlay lifecycle. Service/category acceptance remains outside
this reducer's scope.

Private additions live at
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/audio/native-home-scroll-runtime/`.
The additional check uses pinned acceleration-harness declarations and executes
original page/tile handlers; old evidence files remain untouched.
Check SHA-256: `f5adf485a91d3b930c32b3f595398d37d9a542d9711462b4784d2c22e5bfcf7e`.
Result SHA-256: `020c62ddcb7766edac70ac4d54a9c9470f1c3f7a9328fbef34df8eb8d8705ea2`.
Run with the private tree's `assets/research-venv/bin/python -B`, then its
`export-fixture.py`. Tests need only the committed numeric data, not firmware
or Unicorn. No executable bytes or private source excerpts are committed.

The focused consumer/cursor/close and producer/sampler/navigation/gesture/app
compatibility run passed200 tests,0 failures,0 skips. Type checking passed.
Close identity, ready-boundary and existing lifecycle tests remain intact.
The expanded checks caught and fixed an unnecessary navigation write on a
no-change tick that otherwise overwrote a legacy selected-slot override.

Still unsupported: unrelated key/button routes; gestures and nonordinary
service states; touch/page activation from toolbar focus; arrow mode14 or the
selection-status0 early-exit route; full toolbar activation/presentation and
raw touch scheduling. Additional normalized input channels and physical
frequency remain outside the pure boundary. This is not live HOME acceptance:
root owns System/scene wiring, audio delivery and browser/native verification.
