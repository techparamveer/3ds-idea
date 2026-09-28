# Ordinary settled-grid stylus presses

2026-09-23. An ordinary tile press keeps the primary cursor visible at its
existing selection. The tile widget starts **LncIconDist_01_Select**. Release
inside starts **LncIconDist_01_Decide**; selection is accepted only after that
controller becomes idle. The primary moves in the later lower-task footer.
A different slot is selected; an already selected eligible slot reaches an
opening handoff. Leaving the hit group before release cancels this path.

This source audit extends [primary cursor boundaries](PRIMARY_CURSOR_BOUNDARY_EVIDENCE.md),
[host ordering](HOME_HOST_ORDER_EVIDENCE.md) and the separate accepted-touch
fragment in `TOOLBAR_CURSOR_EVIDENCE.md`. It changes no runtime, presentation,
public asset or earlier evidence file. It does not cover drag, long press,
toolbar gestures, viewport correction or application execution.

## Reproduction and evidence boundaries

Owner-supplied EUR HOME `0004003000009802`, version24576, mapped at
`0x100000`. Executable SHA-256:
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.

Run [home_grid_stylus.py](home_grid_stylus.py) using Unicorn2.1.4 and Capstone5:

```sh
python scripts/firmware/home_grid_stylus.py \
  --code /private/path/exefs/code.bin \
  --resources /private/path/launcher_LZ \
  --output /private/path/native-grid-stylus/verified
```

Private numeric report and40 hashed source excerpts:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/audio/native-grid-stylus/verified-final/`.

| Artifact | SHA-256 |
| --- | --- |
| Fixture | `12ba8151881fdff12f0edf8bc14bfe14dd031bb4cc7642ee3bad6e9cc6b76c78` |
| `checked.json` | `66b6f7fc4ae96bd03b531449e9f65a51ef1ca28d035ff1c9693bcd74cffe2174` |
| Frozen setup fixture | `c1d11e146e3fd3413acce21114474d7e6b18f5e8592171c8cd8c7f5d7b6ac62c` |

All43 cases pass:24 gesture sequences,5 raw gates,4 first/second-tap
sequences and10 waiting-state probes. Root context−1 and child2 use settled
density2, initially selected slot3, tested target3 or4. Both targets remain
inside the viewport. Occupied cases supply eligible ordinary-record bits;
they are not a reconstruction of an installed-title database.

The original widget constructor, registration, host input traversal, HOME
callback, tile handler, lower footer and global2D run. Native tile animation
binding, enable/disable, pane traversal, transform application and Hermite
sampling run against the original resources. A single parsed pane/group and
AnimLink storage are supplied; the platform/profiler wrapper around tile
application is bypassed. Matrices, child-pane propagation and GPU raster are
not executed. Thus the measured output is a native local pane translation,
not a screenshot or a claim that every density moves by two screen pixels.

Touch current/previous bytes and `0x224814` hit booleans are supplied. The
fixture does not derive coordinate edges, clipping or hit geometry. Mature
task objects, readiness, absent overlays and unrelated services retain the
frozen setup's explicit endpoints. Banner resolution, sound and departed
effect execution remain endpoints. Special-title classification returns0.
`0x1d3e80` is a stopping boundary: an opening case does **not** execute the
rest of that host pass or make claims about opening visibility.

## Widget and gates

Let `S` be HOME and `W` the tile widget at `S+0xf44+4*i`. The current mapped
slot is the signed halfword at `S+0x14a0+2*i`; the icon layout is at
`S+0x830+4*i`.

HOME construction `0x2b46d0..0x2b4748` obtains Select then Decide, places
them in config offsets8 and0x10, and calls constructor`0x2532c0`. Its
base copies the config into `W+0x30`; `W+0x38` and `W+0x40` are the
respective controllers. Vtable`0x321440` routes updates to`0x2558ac`.
The constructor's native registration inserts `W+4` into the producer's
widget list at`0x344b94`.

| Native gate | Result |
| --- | --- |
| Producer paused, flags/readiness reject | Widget traversal is skipped; this fixture directly tests producer pause |
| `W+0x14` is0 | Update returns without dispatching its state |
| This widget has no capture and global capture is already set | Update returns; fixture supplies another capturing widget |
| State0 without `current & ~previous` | No new press; current/previous are `0x32e9e1/2` |
| State0 with a new press but hit false | No callback or selection |
| Hit true | Starts Select, acquires capture, enters state1, emits callback0 |

Both initial and subsequent hit requests name **G_Scale_00** in these
resources. This hit group is separate from the animation groupG_Icon_00.
The generic HOME callback also traverses its earlier platform/overlay
branches; the ordinary case supplies them inactive. The initial
`0x2686ac` query in`0x2a3db8` is supplied0. This is not an exhaustive audit
of every overlay or global input veto.

Callback0 at`0x2a4a5c` does not change selected slot, mode, primary request
or primary Scale. It records candidate folder/slot at`S+0x117e/0x1180`
only when `0x2eb710` accepts the record and icon status is not5. The
ordinary record predicates execute: bit0 and bit1 of record halfword0x36
are read by`0x1e89f8/0x1e6b44`. Candidate recording is distinct from the
widget's press pose: a vacant slot still runs Select and can be selected.

## Controllers and native pressed pose

| Resource | Frames / source range | Group / track |
| --- | --- | --- |
| `LncIconDist_01_Select.bclan` | 2 /20–21 | G_Icon_00, P_IconBtnDmy_00 translation.y |
| `LncIconDist_01_Decide.bclan` | 2 /60–61 | Same group and track |

Both resources are non-looping with childBinding false. Select's Hermite
keys are `(0,0), (1,0), (1,−2)`; Decide's are `(−39,−2), (1,−2), (1,0)`.
All slopes are0. Duplicate-frame keys are retained. Native sampler
`0x209cd0`, reached through raw transform application`0x1a137c`, produces
Select0→Y0, Select1→Y−2, Decide0→Y−2 and Decide1→Y0.

`LncIconDist_01.bclyt` binds G_Icon_00 only to P_IconBtnDmy_00, whose
authored translation is0. P_Icon_00 is its child; B_Icon_00 is outside this
animated group. The fixture measures the parent's actual Y writes at
`0x1a1438`. It does not substitute an animation of the primary cursor.

| Resource | SHA-256 |
| --- | --- |
| Tile layout | `125fd2772c35f967f596b0fbd8692a7d13d78a425eaccc72e85d46528507f76d` |
| Tile Select | `910b1250e61df47525826a0e5fbcc0901d2dabfb96582a9cdcd2251e95c65eb6` |
| Tile Decide | `9d151d49dbc67c68c9ea0c029551c2601c3bcf7906c7fc5bd50eeca223072129` |

Start helper`0x1f723c` sets controller mode0 and starts it; reverse
helper`0x1f7078` uses mode1. Starting enables its AnimLink and resets
current to the appropriate end. It does not immediately submit a frame.
Controller`0x269430` submits current before advancing. At the terminal
submission it reaches status2; on the next update it disables the binding
and changes status to0. Status2 is still busy to the tile widget.

For a press atP and release inside atR=P+2, these are **after the same
pass's2D update**; the input phase precedes that update:

| Pass | Widget state | Select current/applied/status | Decide current/applied/status | Enabled bindings | Pane Y |
| --- | --- | --- | --- | --- | --- |
| P | 1 | 1 /0 /1 | 0 /unsent /0 | Select | 0 |
| P+1 | 1 | 1 /1 /2 | 0 /unsent /0 | Select | −2 |
| R | 2 | 1 /1 /0 | 1 /0 /1 | Decide | −2 |
| R+1 | 2 | 1 /1 /0 | 1 /1 /2 | Decide | 0 |
| R+2 | 2 | 1 /1 /0 | 1 /1 /0 | Neither | Retains0 |
| R+3 | 0, callback1 | Unchanged | Unchanged | Neither | Retains0 |

A quicker release atP+1 has both Select and Decide enabled in that pass.
Original AnimLink insertion and pane traversal apply **Select first, then
Decide**, both writing−2. On the next pass Select disables and Decide
writes0. A subsequent press restarts Select while the old Decide binding
stays disabled. Reapplying both retained `applied` frames unconditionally
would be incorrect: disabled bindings write nothing and the pane retains
its last value. The report records binding events, each transform apply,
and each native pane write, including the second tap and leave/reenter path.

Primary LncCsr_00 Select/Decide are separate real controllers in the
fixture. Their current/applied/status remain unchanged. Primary Scale
retains density frame2; no `0x1da050` seek occurs. Primary Loop remains
eligible and advances once on each completed ordinary host pass.

## Selection boundary and opening eligibility

State1's inside-release path starts Decide and enters state2 without
emitting callback1. State2`0x253114` waits while Decide status is1 or2.
When idle, it changes the widget to state0 and emits callback1 through
`0x233a4c → 0x2947f8 → 0x29506c → 0x2a3db8 → 0x2a4994`.

This occurs during widget traversal inside producer`0x1039d0`, before
producer key processing, task traversal, upper/banner manager, lower HOME
and global2D. The tile still owns capture on the acceptance pass. A supplied
direction edge on that pass is not emitted as event4/5/6. On the next
widget-idle pass its own capture flag clears, but the producer's initial
capture scan has already observed it; global capture clears the following
pass. These are source update counts, not browser event or wall-clock units.

At callback1,`0x2a4bb8` reads the **current** selected slot, clears the
candidate fields, then reads the widget's **current** slot mapping. It
selects that slot and emits the departed-effect endpoint for the prior
valid selection, including the same-slot case. No ordinary mode entry,
primary hide request or Scale seek occurs. For non-opening in-view cases,
the input boundary still has the old primary position; the common lower
footer positions it on the new slot before global2D. All ordinary rows
retain request0, shown1 and layout visibility1.

At`0x2a4e34`, a different old/new slot returns after selection. Equal
slots continue through current cartridge/record/title predicates. The
vacant case fails its record predicate. The eligible ordinary case reaches
`0x1d3e80`; folder and special-title branches are outside this execution
scope. The tested first tap3→4 selects; the second tap4→4 reaches that
handoff when eligible. The ordinary tile branch uses selection equality,
not a supplied double-click time window. It does not guarantee every title
can open, and the fixture never runs APT or the opening lifecycle.

## Cancellation, interference and reset

| Situation | Native result in these checks |
| --- | --- |
| Leave hit group while held, or release outside | State1 starts reverse Select, enters state3, emits callback2; candidate fields clear; no selection/effect |
| Reverse Select | First submitted frame1 writes−2, next frame0 writes0, following update disables binding |
| State3 sees touch released | Returns to state0 without accepting |
| State3 reenters while still touching | Restarts forward Select, returns to state1; no second callback0; later inside release can accept |
| New stroke or outside position while Decide waits | State2 does not query hit or touch edge; existing delayed acceptance continues |
| Current selection changed to target while waiting | Acceptance sees equality and reaches eligible open handoff |
| Current selection changed elsewhere | Acceptance replaces that live selection; departed effect uses it |
| Widget mapping changed while waiting | Acceptance selects the newly mapped slot |
| Same-slot record becomes vacant while waiting | Acceptance occurs, current record check prevents opening |
| Input enable0 while waiting | Widget callback pauses; independent2D controller can finish; enable1 later allows acceptance |
| Native reset`0x250194` | Stops controllers, immediately restores Select's start pose, disables bindings and sets state0; no callback1 or2 |
| Native grid reset`0x1eb2b4` | Invokes widget virtual+0x20, reaching that reset for this tile; other widget leaves are endpoints |

The waiting-state mutations are deliberately artificial and do not model
full native user actions. A field-only root→child context change does not
invalidate state2 by itself: the leaf has no press-time context/session
identity check. Actual mode/context entry has additional work. Static
dispatch evidence shows ordinary mode0 setup calls the grid reset at
`0x1dedcc`, and mode3 setup does so at`0x1df460`; modes43/44 take the
different branch`0x1df708`. This audit does not establish a universal rule
for every context transition. The app needs explicit ownership/lifecycle
handling, but must not describe its session guard as a discovered native
press-time snapshot. Browser `pointercancel` is likewise not equated with
any native event by this evidence.

Reset alone does not emit candidate-cleanup callback2. The report retains
candidate fields separately so a consumer does not conflate widget reset,
leaving the hit group, input disabling and HOME context cleanup.

## Input/controller boundary and cue observations

The native boundary has two phases. In the **input phase**, widget
`0x2558ac` reads enable/capture, its state, touch/hit when applicable, and
Decide status. It starts/reverses controllers or emits the generic event1
with tile callback value0,1 or2. Callback1 must reach current HOME selection
logic in this phase. In the **later2D phase**, controller`0x269430` updates
submitted/current/status and binding flags, then pane application writes
the enabled transforms. Controller completion does not itself invoke
selection: the following input phase observes status0. This is the API
boundary a pure widget/controller consumer needs to preserve. A browser
release event must not synchronously substitute for callback1.

The frozen report's `events[kind=sound]` contains these direct observations:

| Boundary | Native sound call observed |
| --- | --- |
| Initial accepted press, before callback0 | `0x0100002b` through `0x1f7198`, caller`0x1f71b4` |
| Release starts Decide | No direct sound call in this path |
| Callback1 selects a different slot, or accepts a vacant same slot | No direct sound call in the executed handler path |
| Eligible ordinary same-slot opening | `0x0100001e` at`0x2a5148`, immediately before the stopped`0x1d3e80` handoff |

The existing [cue delivery evidence](home_audio_CUE_DELIVERY_EVIDENCE.md)
maps those IDs to `SE_CTR_HOME_ICON_TOUCH` and `SE_CTR_HOME_START`.
The widget config also contains`0x0100002c` at config+0x2c, but none of
these ordinary paths invokes it. Its presence is not evidence for a
delayed-acceptance sound. The fixture does not reconstruct initialization
of default sound table`0x344b80`; default-slot reentry/cancel sounds and
omitted helper internals are not established by absence of a call here.
Sound playback itself is an endpoint. This audit supplies no justification
for adding a new cue at ordinary delayed selection acceptance.
