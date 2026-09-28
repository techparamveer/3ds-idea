# Cursor acceleration: viewport entry, deferred input and resets

2026-09-23. **The acceleration counter counts mode3 viewport-scroll entries,
not selected tiles, button presses, held notifications or repeat polls.**
The first five entries use duration10. The sixth and later entries use
duration5 and change an exact Loop step1 to3. The counter saturates at5.
Horizontal release/cancellation clears the counter and pending horizontal
input, restores step1, and preserves Loop phase and the in-flight duration.

This extends [the cursor clock](CURSOR_LOOP_CLOCK_EVIDENCE.md),
[input producer](HOME_INPUT_EVENT_EVIDENCE.md), and
[selection-cue trace](home_audio_CHILD_SELECTION_EVIDENCE.md). It supplies
native evidence for a future runtime decision; it changes no runtime, public
asset, browser or Azahar state.

## Source and reproduction

Source: owner-supplied EUR HOME `0004003000009802`, version24576.
`code.bin` SHA-256:
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Addresses below are ARM virtual addresses, executable mapped at `0x100000`.

Private fixture, results and **26 hashed executable excerpts**:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/audio/native-cursor-acceleration/`.
Run `check.py` with that firmware tree's `assets/research-venv/bin/python -B`.

| Artifact | SHA-256 |
| --- | --- |
| `check.py` | `e6e0ad7920392e8f825dcd19a46390746dbfe2642815bf871ed6ec2b7f3eea15` |
| `checked.json` | `f47f2402079578919cf409c92ae2b8a90f031f13658599c3bec1dcf566401797` |

The fixture executes original ARM bytes using Unicorn. It covers8 consecutive
entries,5 initial step values,1 constructor-write fragment,186 directional
cases,16 busy-state cases,8 sequences of25 held callbacks,12 deferred-input
cases,6 release masks,36 touch-tile cases,8 arrow cases,2 drag sequences,
3 folder-close corrections, and two78-poll input experiments. All pass.
Controlled rendering, manager, widget, audio and platform endpoints are
listed in the fixture/results; their limits are stated below.

## Ownership and entry ordering

Let `S` be the HOME scene and `L=*(S+0x820)` its primary cursor layout.
The Loop controller is `*(L+0x8c)`.

| Field | Observed role |
| --- | --- |
| `S+0x3c98`, int32 | Mode3 entry count, distinct from producer repeat counter `0x32e798` |
| `S+0x11a4`, int32 | Current mode3 elapsed update count |
| `S+0x11a8`, int32 | Mode3 duration,10 or5 |
| `S+0x1172`, int16 | Current viewport's left slot |
| `S+0x1174`, int16 | Target viewport's left slot |
| `S+0x1178`, int16 | Selected slot |
| `S+0x117c`, int16 | Selection relative to target left slot |
| `S+0x3cab/+0x3cac`, bytes | Left/right scroll-direction markers |
| `S+0x3cad/+0x3cae`, bytes | Pending left/right input markers |

The constructor fragment `0x2ba3b0..418` computes offset`0x3c98` and writes
zero at `0x2ba414`, using constructor register`r6=0` established at
`0x2b9bc8`. The fixture executes this write with a sentinel counter99.
It does not run the complete scene constructor or its services.

State setter `0x1e8f38` copies current mode to`S+0x3a81`, writes the new mode
to`S+0x3a80`, and dispatches through`0x1e3a70`. There is no same-mode guard.
Mode3's table entry is`0x1e3ecc`, tail-branching at`0x1e3ed8` to`0x2a3600`.
The latter is the only direct ARM branch reference to`0x2a3600` found in the
inspected executable range; this is not an exhaustive indirect-call proof.

At `0x2a3600`, the original code performs:

```text
elapsed = 0
if counter < 5:
    duration = 10
    counter += 1
else:
    duration = 5
    if Loop.step has the exact float32 bits for 1:
        Loop.setStep(3)
```

It then rebuilds grid coordinates, updates selection/overlay state, optionally
exits the footer when either pending marker is set, and configures widget
input. It does not start, seek, reset or advance Loop. Memory-write hooks
observe counter increments at`0x2a3664` and the actual controller step setter
`0x1bbd84`. A supplied phase17.25 remains17.25. Initial steps0,0.5,2,3 are
preserved even on the accelerated branch; only exact1 becomes3.

Directly re-entering mode3 also increments the count below5. Ordinary input
does not necessarily re-enter it, as the gates below show. Once counter5 is
reached, it stays5 until a reset in the traced paths. Neither the tested idle
entry nor an interior selection performs that reset.

## Ordinary selection and held input

Use current density`S+0x118c` and folder id`S+0x1170` (`-1` means root).
Native row tables are root`[1,2,3,4,5,6]` and folder`[1,1,2,3,4,5]`;
visible-column tables are both`[3,3,5,7,9,10]`. Let their values be`R` and`C`,
current left be`V`, selected be`P`, and supplied extent be`N`.

Events4/new press and6/repeat enter`0x2968fc`. The tested ordinary route
requires no overlay at`S+0x3fd0`, manager`S+0x3aa0` present with byte`+0x469`
clear, and the input inhibition byte`S+0x3fb7` clear.

| Action while mode0 | Result and mode3 condition |
| --- | --- |
| Right, mask`0x10`, helper`0x1d8468` | Candidate`P+R`; reject if`>=N`. If candidate`>=V+R*C`, target left becomes`V+R`, right marker is set, then enter3 at`0x1d857c` |
| Left, mask`0x20`, helper`0x1d85f8` | Candidate`P-R`; reject if negative. If candidate`<V`, target left becomes`V-R`, left marker is set, then enter3 at`0x1d86d8` |
| Up/down, masks`0x40/0x80` | Move within the column or transfer focus between grid and toolbar; no mode3 entry |
| Horizontal move within viewport | Selection changes; counter and Loop step do not |
| Horizontal absolute-range rejection | No selection or counter change; event4 can emit invalid cue, event6 suppresses it |
| Toolbar horizontal movement | Changes toolbar focus/Scale; no mode3 entry |

The directional selection write and viewport target/marker writes occur
before the state setter. Mode3 entry, including counter or step changes,
finishes before the normal selection sound and cursor-selection effect.
This ordering is captured in native execution traces.

**Event5 is not another selection or acceleration increment.** Its complete
consumer`0x29e064` was executed25 times per ordinary direction in mode0 and
mode3; selection, counter, pending markers and Loop step were unchanged.
At an absolute horizontal boundary it has separate visual feedback logic.
Additional masks can invoke page-arrow/manager actions; these are not
ordinary D-pad movement.

While mode is nonzero, single-axis horizontal events4/6 set the corresponding
pending marker and return without moving selection or entering3. In mode3,
vertical and the four tested diagonal masks neither move selection nor set
these pending markers. This note does not equate diagonal input in mode0
with a single-axis action.

## Completion can replay one pending event6

Mode3 scene-update dispatch goes to`0x2b709c`, which calls`0x2a1bbc`.
That increments elapsed by1, passes float`elapsed/duration` to the grid
interpolation endpoint, and reports completion when elapsed`>=duration`.
Duration is therefore a count of these scene updates, not a measured time.

On completion, `0x2b70b0..7144`:

1. Enters mode0. Native idle entry`0x29a184` copies target left to current
   left at`0x29a1ac` and recalculates relative selection.
2. If the left direction marker is set, checks the pending-left marker and,
   if set, calls`0x2968fc(S,6,0x20)`. Otherwise it examines the right direction
   marker/pending-right pair and can call`0x2968fc(S,6,0x10)`.
3. Clears the serviced pending marker after that call, then clears that
   direction marker. These clears occur **after** any mode3 re-entry caused
   by the replayed move.

Three incoming same-direction notifications during one scroll coalesce into
one replay. In the controlled opposite-direction cases the opposite pending
marker remains set, but that completion does not replay it. This is not a
general FIFO or a direction-change queue. The left branch has priority if
its direction marker is set.

The after-call clear also clears a same-direction marker just set by the
replayed scroll. A runtime translation must preserve this ordering rather
than invent an unconditional chain of buffered repeats. The twelve fixtures
cover both initiating directions, no/same/opposite pending direction, and
release before completion.

At `0x2a5b7c..ba8`, event7 mask`&0x30` clears counter, writes Loop step1,
then clears **both** pending markers. It leaves direction markers, elapsed,
duration and Loop phase intact. Vertical-only release does not clear the
counter or restore the step. Mask`0xcfff` also takes the horizontal reset
branch. The prior input note establishes that physical release, touch
cancellation and input capture can all produce this event; explicit native
calls with`0xcfff` are also recorded in the cursor-clock note.

## Touch selection, arrows and dragging are distinct paths

Global callback event1 routes through`0x29506c` to`0x2a3db8(S,widget,value)`.
The numeric widget callback values below are distinct from global key-event
numbers. Hit testing and actual touch-service scheduling are outside this
fixture; it supplies an eligible widget and callback value.

**Tile selection:** Unmatched common widgets reach`0x2a4994`, which looks up
one of80 widget pointers starting at`S+0xf44`. Value1 selects its mapped slot
from`S+0x14a0+2*index`, through`0x2a4b4c`. On the ordinary no-overlay path:

- If selected`<V`, target left is`floor(selected/R)*R`; enter3 at`0x2a4d74`.
- If selected`>=V+R*C`, target left is`floor(selected/R)*R-(C-1)*R`;
  enter3 at`0x2a4e30`.
- Otherwise selection changes without entering3.

Thus touch selection can invoke the same acceleration entry, potentially
moving the viewport more than one column. Unlike the directional helpers,
this correction does not set the left/right direction markers. Its cursor
selection effect runs before this viewport correction. Thirty-six root and
folder cases execute the common widget handler, tile dispatch, target
arithmetic and actual mode3 entry. Supplied off-viewport mappings demonstrate
the branch, not that every such tile is physically tappable in every layout.

**Page arrows:** Widgets`S+0xf3c/+0xf40` follow`0x2a3fe4..4290`. Accepted in
mode0 or14, they target one viewport page left/right, call`0x1da3e0`, and
enter **mode2**, not3. The fixture executes native target/selection clamping
and state dispatch for both sides, root/folder, values0/1. The selection-status
endpoint`0x297b20` returns1 in these cases so mode2 remains active; with0 and
previous mode0, the dispatcher can immediately return to0. Neither outcome
uses the mode3 counter. Repeated-arrow polling at`0x2a0c70` feeds the same
global event1 widget route. Actual arrow repeat cadence is not established.

**Dragging:** Widget`S+0x1088` follows`0x2a458c`. Value0 from idle enters
mode4; values1/3 update the supplied drag position, with boundary correction
able to return to0; value2 chooses an aligned target and adjusts selection
and pane position; value4 returns to0. The two executed sequences use
values0,1,2,4, supplied linear slot coordinates and a zero gesture delta.
They retain counter5/step1 while modes run`4,4,4,0`; value2 changes target
and selection. This establishes no mode3 acceleration in those drag paths,
not a complete physical gesture or inertia model.

## Folder-close correction and input-producer experiments

Once the reverse folder animation is complete, close update`0x29f0a4` calls
root/history restoration`0x2b021c`. With no overlay, pickup or pending action,
the subsequent viewport correction at`0x29f270` compares restored selection
with the current viewport. Before-left moves target by`-R` and enters3 at
`0x29f2b4`; beyond-right moves it by`+R` and enters3 at`0x29f314`; an interior
selection enters0. It does not set a direction marker in this correction.

Three tests execute the complete close-update body with a completed supplied
animation, real pane-position setter and a **root/history-restoration
endpoint**. Counter5 causes either off-viewport correction to set step3;
the interior case preserves step1. This proves what the correction does to
a supplied restored state. It does not prove ordinary history always needs
correction or determine how often this happens on hardware.

The producer experiments connect original`0x1039d0`, callback registration,
HOME thunk/dispatch, actual direction/held/release consumers and mode3
completion. They supply sample held/pressed/released fields directly; the
prior input fixture separately proves their native derivation.

Both experiments start with neutral poll0, hold right on polls1–76, then
release on77. Both emit new press on1 and repeats on21,26,…,76. One runs
**zero** scene updates between polls: it stays in the first scroll, counter1,
step1 until release. The other explicitly runs **one** scene update after
each input poll: scroll entries occur at polls1,21,30,41,50,61,65,71,75;
the sixth entry at61 changes step to3. Entries30,50,65,75 come from completion
replays. Release77 clears counter/step while the current scroll remains active.

These are controlled scheduling experiments, not hardware timelines. No
333 ms/83 ms, display-frame correspondence or browser animation cadence is
inferred. An implementation needs separate producer repeat state, scene
scroll state, deferred markers and retained Loop phase; a browser selection
count cannot substitute for the native counter.

## Boundaries

The fixtures execute native mode setter/dispatcher, mode3 entry, selected
scene-update branch, ordinary idle-entry body and the listed consumers.
Rendering/grid interpolation, widget setup, audio dispatch, manager queries
and refresh functions are explicit endpoints. Loop step setters execute;
Loop animation updates do not run in these tests, so retained phase is
measured independently of ordinary animation advancement. The constructor
and main scene-dispatch entry are bounded fragments, not a full application.

Other app/group, pickup, overlay, lifecycle and transition paths were not
exhaustively audited. This note does not claim these are the only indirect
state3 entries or every possible reset in the executable. Raw touch input,
actual frame scheduling, full root-history restoration, manager behavior and
widget availability remain outside this bounded source proof. No application
build or browser verification is appropriate for this documentation-only
change; visual acceptance remains a separate requirement.
