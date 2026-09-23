# Ordinary tile widget runtime

2026-09-23. Implements the bounded pure widget in
[`home-tile-touch-contract.md`](home-tile-touch-contract.md), against integration
`3995f71`. Only the new widget, numeric fixture, focused tests and this note
change. System/scene integration and painting remain separate owners.

## API and state

`src/os/home-tile-widget.ts` exports:

| Function | Result |
| --- | --- |
| `createHomeTileWidget()` | Enabled state0, no capture, count0, idle controllers, no applied pose |
| `setHomeTileWidgetEnabled(widget, enabled)` | Widget; always clears capture, even when the enable value is unchanged |
| `resetHomeTileWidget(widget)` | Widget; immediately writes Select0 and disables bindings, without callbacks |
| `updateHomeTileWidgetInput(widget, input)` | `{ state, events, unsupportedLongPress }` |
| `advanceHomeTileWidget2D(widget)` | Widget after one eligible later2D update and binding application |

Input is `{ current, previous, inside, globalCapture }`, all booleans. The host
supplies sampled edges, hit acceptance and its initial capture scan. It skips
the input function when widget traversal is skipped. Widget enable gates input;
it does not gate the separate2D function.

`HomeTileWidget` retains `state: 0|1|2|3`, `enabled`, `capture`, `heldCount`,
`select`, `decide`, and `pose: HomeTilePose|null`. Each controller keeps
`currentFrame`, `appliedFrame`, `status: 0|1|2`,
`direction: 'forward'|'reverse'`, and `bindingEnabled`. These resources have
two integer frames with fixed unit step. An unsent applied frame is `null`;
the source fixture's artificial−999 sentinel is not exported as a usable pose.
New snapshots, controllers, poses and event records are frozen.

Ordered events contain only `{ kind: 'cue', cue: 'touch' }` and
`{ kind: 'callback', value: 0|1|2 }`. Initial touch precedes callback0.
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
enable and held count. The next eligible state0 input clears capture/count.
Enable/disable instead clears capture immediately and preserves pending state
and controllers. Neither operation synthesizes callback2.

Acceptance preserves capture through callback1. State0 clears it on the next
input pass, after the host's capture scan has already happened. The host must
retain that global scan result for the pass; this widget does not store or
recalculate the producer's global capture state.

## Explicit long-press boundary

The existing `0x2531f8..25324c` excerpt increments held count, compares it with
the word at `0x33c634`, reverses Select at equality, then branches to additional
long-press behavior above the threshold. A bounded read of that word in the
SHA-verified executable yields20. The43 recorded short cases do not execute
those branches; the contract excludes their callbacks3/4 and lifecycle.

The API retains the uint32 increment and returns `unsupportedLongPress: true`
when its signed value is at least20. It stops before the unhosted reverse or
callback branch, without changing controllers or emitting events. A press
starts at count0, so the boundary is the twentieth subsequent state1
inside/no-release input update. This uses the audited executable's static
configuration; it does not establish all possible runtime threshold changes.
The host must take over/reset at that result before continuing this ordinary
slice. Existing authored long-press/drag behavior remains an explicit host
policy. The result is not a native long-press implementation.

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

`node --test tests/home-tile-widget.test.mjs`: **50 passed**, no failures or
skips. `npm run typecheck`: passed. Tests compare both phases, exact last
writer and local pane Y, skipped traversal, stopped opening, reset/enable
distinctions, capture, immutable snapshots and the explicit unsupported bound.
The local Y comparison does not establish density-scaled LCD movement, pane
ancestry, child propagation, hit geometry or pixel fidelity. No model hydration,
full suite, browser or Azahar run was performed in this worker slice.
