# Tile widget runtime

2026-09-23. Implements the bounded pure widget in
[`home-tile-touch-contract.md`](home-tile-touch-contract.md), extended against
integration `0659846` by
[`home-long-press-entry-contract.md`](home-long-press-entry-contract.md).
This extension changes only the widget, focused tests, a new numeric fixture
and this note. System/scene integration and painting remain separate owners.

## API and state

`src/os/home-tile-widget.ts` exports:

| Function | Result |
| --- | --- |
| `createHomeTileWidget()` | Enabled state0, no capture, count0, flag false, idle controllers, no applied pose |
| `setHomeTileWidgetEnabled(widget, enabled)` | Widget; always clears capture, even when the enable value is unchanged |
| `resetHomeTileWidget(widget)` | Widget; immediately writes Select0 and disables bindings, without callbacks |
| `updateHomeTileWidgetInput(widget, input)` | `{ state, events, unsupportedLongPress }` |
| `advanceHomeTileWidget2D(widget)` | Widget after one eligible later2D update and binding application |

Input is `{ current, previous, inside, globalCapture }`, all booleans. The host
supplies sampled edges, hit acceptance and its initial capture scan. It skips
the input function when widget traversal is skipped. Widget enable gates input;
it does not gate the separate2D function.

`HomeTileWidget` retains `state: 0|1|2|3`, `enabled`, `capture`, `heldCount`, `longPressFlag`,
`select`, `decide`, and `pose: HomeTilePose|null`. Each controller keeps
`currentFrame`, `appliedFrame`, `status: 0|1|2`,
`direction: 'forward'|'reverse'`, and `bindingEnabled`. These resources have
two integer frames with fixed unit step. An unsent applied frame is `null`;
the source fixture's artificial−999 sentinel is not exported as a usable pose.
New snapshots, controllers, poses and event records are frozen.

Ordered events contain only `{ kind: 'cue', cue: 'touch' }` and
`{ kind: 'callback', value: 0|1|2|3|4 }`. Initial touch precedes callback0.
State1 leaving the hit group reverses Select and emits callback2. Inside
release starts Decide without accepting selection. State2 emits callback1
only on an input pass that sees Decide idle; status2 remains busy. State3
held reentry restarts Select without another touch cue or callback0.
No selection, opening, candidate, context or elapsed-time state is owned here.

## Two phases and retained pose

Input starts/seeks controllers without submitting their frames. Later2D
updates both controllers, then applies enabled bindings in Select→Decide order.
`pose` retains only the last binding that actually wrote the pane. Disabled
old applied frames write nothing. A quick release can enable both bindings:
Select1 writes first, then Decide0 becomes the retained writer. On the next
pass only Decide1 writes. Subsequent presses do not reapply old Decide frames.

At status2, controller update disables binding, submits current once more,
then becomes idle. That submission changes `appliedFrame` without changing
the pane. Reset uses this distinction: active controllers stop at status2,
Select immediately seeks/applies0 and disables its binding, while Decide
retains current/applied until its next update. Reset preserves widget capture,
enable, held count and long-press flag. The next eligible state0 input clears
capture/count/flag.
Enable/disable instead clears capture immediately and preserves pending state
and controllers, held count and flag. Neither operation synthesizes callback2.

Acceptance preserves capture through callback1. State0 clears it on the next
input pass, after the host's capture scan has already happened. The host must
retain that global scan result for the pass; this widget does not store or
recalculate the producer's global capture state.

## Long-press threshold and host boundary

The source word at `0x33c634` is20. The initial press P leaves heldCount0;
Hn is the nth subsequent uninterrupted held input update, not elapsed time.
With flag false, the widget checks hit first, then release, then increments
the uint32 count and compares its signed value. H20 equality reverses Select
without emitting a callback or setting the flag. H21 greater-than sets the
flag, resets count0 and emits callback3. Both retain state1 and capture.
Neither starts Decide or emits another widget cue. Release after H19 or H20
wins before increment, starts Decide and follows ordinary acceptance at R+3.

With flag true, state1 ignores the hit result and does not increment count.
Only the physical release edge (`previous && !current`) clears state/flag and
emits callback4. It preserves capture and controllers and never starts Decide.
In the executed vacant cases, the next idle input clears own capture; the
producer's global capture scan clears one pass later. The compatibility result
field `unsupportedLongPress` now remains false for this supported widget slice.

Input and2D remain distinct. H20 input starts reverse Select at current1;
completed2D submits1 and advances current0. Occupied H21 stops during input at
pickup-resource installation `0x1e801c`, retaining that old submitted1/status1
and pose Y−2. Vacant H21 completes2D, submits0/status2 and writes Y0. Vacant
release then disables the Select binding on2D completion. Release after H20
instead writes reverse Select0 then Decide0, leaving Decide0 at Y−2.

The pure widget does not determine occupied/vacant status or stop its host.
The host must handle callback3 at the occupied resource boundary; this fixture
does not authorize continuing that stopped pass as if it were vacant. It
proves no occupied post-handoff release, mode14, pickup content, movement/drop,
folder hover or completed pickup sound sequence. No host candidate, selection,
pickup or authored gesture logic is added here.

Reset `0x250194` and set-enabled `0x2501f8` preserve the flag by their static
field writes. The16 new sequences do not execute either leaf with flag1.
Additional unit checks compose these static semantics with flag1, input gates
and outside-hit release; they are not additional native execution evidence.

## Source and validation

Authority: [GRID_STYLUS_EVIDENCE.md](../scripts/firmware/GRID_STYLUS_EVIDENCE.md),
integrated at `87cf9ca`. Firmware SHA-256:
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
The frozen final report SHA is
`66b6f7fc4ae96bd03b531449e9f65a51ef1ca28d035ff1c9693bcd74cffe2174`.
All40 existing excerpt text hashes were verified. No firmware execution was
added or repeated.

[`home-tile-widget.json`](../tests/fixtures/home-tile-widget.json) projects all43
cases and305 passes into input/2D snapshots, ordered events, capture, binding
state and actual native pose writes. It includes producer-paused input and
opening passes stopped before2D. Artificial selection/mapping/record/context
mutations remain labels and never become widget lifecycle rules. The native
opening cue is recorded separately from widget events and is not emitted here.

The projection script is kept on SSD at
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/audio/native-tile-widget-runtime/export-fixture.py`.
Exporter SHA:
`065f778edc33374b183d6759bbfceadecc35d7a5b34f88c69a6f189d29c01635`.
Numeric fixture SHA:
`e231f4260600ce347d8776058c26ecf3c85e4b5ea535b1b2a18439aca564f3a1`.
It reads the frozen report and source excerpts, without running firmware or
deriving expected state from the TypeScript implementation.

The original43-case fixture remains byte-for-byte unchanged and is replayed
with the new flag required to stay false in both phases.

The extension authority is
[GRID_LONG_PRESS_EVIDENCE.md](../scripts/firmware/GRID_LONG_PRESS_EVIDENCE.md),
integrated at `0d49f75` from source `99f3604`. New private report SHA:
`6e3c97e8524829e2173df5b4cca2f2fabe78eef1f6b3ff8a230ec48c52ff863a`.
Source fixture SHA:
`47c32cb2d07a1bd368a7f1d16565707838d389dad390a27b842359ca089d4be4`.
All18 excerpt text hashes were verified without executing firmware.

[`home-tile-widget-long-press.json`](../tests/fixtures/home-tile-widget-long-press.json)
projects all16 sequences and384 pass boundaries: eight holds across root/child,
same/different target and occupied/vacant records, plus eight occupied ordinary
releases after H19/H20. Four occupied holds stop at input H21; four vacant
holds continue through callback4 and capture cleanup. Same-slot ordinary
acceptance stops at `0x1d3e80`, before2D. The snapshots include the flag and
ordered tile binding writes, with explicit stop labels.

These cases supply touch edges, continuously true hits, settled density2,
mature ordinary metadata and unrelated service endpoints. The preloaded pickup
layout identity and raw Scale controller use an inert binding group. Native
registration, priority reorder, visibility and controller start/seek execute;
resource installation and pickup pane/raster application do not. These host
facts explain the stop; none becomes widget runtime state. The fixture records
resource hashes and these limits in its provenance.

Projection script (SSD):
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/audio/native-tile-widget-runtime/export-long-press-fixture.py`.
Exporter SHA:
`c8bd5fe7f6de24876afb8119778b32354c485ea08c4668639f14a80425c69028`.
New numeric fixture SHA:
`78f52018022b8f31c0034d3a1a29307a268b3e41bd0eb4b805de88ff8667bcff`.
Expected values come from the frozen report and actual recorded pane writes,
not from the TypeScript implementation.

`node --test tests/home-tile-widget.test.mjs tests/home-tile-widget-long-press.test.mjs`:
**70 passed**, no failures or skips. `npm run typecheck`: passed. Tests compare
both phases, last writer/local pane Y, H19/H20/H21, release-before-increment,
stopped occupied versus completed vacant H21, callback4/capture cleanup,
skipped traversal, opening stops, immutable snapshots and lifecycle leaves.
The local Y comparison does not establish density-scaled LCD movement, pane
ancestry, child propagation, hit geometry or pixel fidelity. No model hydration,
full suite, browser or Azahar run was performed in this worker slice.
