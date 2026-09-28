# Primary cursor Loop: native clock and lifecycle

2026-09-23. The checked **LncCsr_00_Loop** controller starts at frame0,
submits its current frame, then advances by **1 per eligible native update**.
Its forward loop excludes endpoint60, producing submitted frames0–59.
The global layout updater skips a hidden cursor, preserving its phase.
Ordinary slot movement and density changes do not restart this Loop.
Navigation mode3 can change its step to3, also without resetting phase.

This establishes an update-count clock for the traced paths. It does **not**
establish a wall-clock epoch, measured 60 Hz cadence, sleep/APT scheduling, or
permission to round arbitrary animation inputs. No runtime timing, raster,
public asset, browser or Azahar changes accompany this note. See the integration
[performance contract](../../docs/native-raster-performance-contract.md).

## Source and reproduction

Source is the owner-supplied EUR HOME `0004003000009802`, version24576.
All executable addresses below are ARM virtual addresses, with `code.bin`
mapped at `0x100000`. Executable SHA-256:
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.

The original resources are under the SSD firmware tree's
`assets/extracted/home/unpacked/launcher_LZ/anim/`:

| Resource | `pai1` frame count | Loop byte | SHA-256 |
| --- | --- | --- | --- |
| `LncCsr_00_Scale.bclan` | 16 | 0 | `74277ac0ec8debf4f035b6e4c629fb9605c897fcb50e6b5ed2447250c671c2dd` |
| `LncCsr_00_Select.bclan` | 6 | 0 | `ecdf8761f6e0c07c9405dc12f9d4d65f1b97b4c70bb110da4a0afc52fdc46e02` |
| `LncCsr_00_Decide.bclan` | 6 | 0 | `f4e9629915edb668c9e93d3e734ee5e2247c372d8a0dcdedb0abc72ca936f89d` |
| `LncCsr_00_Loop.bclan` | 60 | 1 | `0bf11061be32b1af39749b8ae8342b8010b65ed9dfd257dbce76e38618b76744` |

Each `pai1` section begins at file offset `0x4c`. Frame count is its uint16
at `+8`; the loop flag is byte `+0xa`. Native readers `0x13e1dc` and
`0x13e1c8` read those exact fields through `AnimTransform+0xc`.

Private fixture, results and **34 hashed source excerpts** remain at
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/audio/native-cursor-loop/`.
Run `check.py` with that firmware tree's `assets/research-venv/bin/python -B`.
Fixture SHA-256:
`f20c2a9ce82bb890be6ef57e7eabd5cbb200e5976cc17b26a6cd4fca112f865c`.
`checked.json` SHA-256:
`e458291b34ca127137ec0622bc8bb2abcc834b2acb0fee8645a7f5ed7bfd0c38`.

## Construction and start epoch

Let `S` be the HOME scene, `C=S+0x820`'s pointed-to primary cursor layout,
and `A=C+0x8c`'s pointed-to Loop controller. Construction at
`0x2b1cd4..1ce8` calls `0x258e70`, stores the cursor, then loads
`LncCsr_00.bclyt` through `0x258d14`.

The cursor constructor uses layout vtable `0x321650`. Its update entry `+8`
is the ordinary layout updater `0x1f58e4`; there is no special cursor update
override in this vtable. Loader `0x258d14` creates four independent controllers:

| Cursor field | Clip | Loader action |
| --- | --- | --- |
| `+0x80` | Scale | Set playback mode5, then start |
| `+0x84` | Select | Load; no start in this loader |
| `+0x88` | Decide | Load; no start in this loader |
| `+0x8c` | Loop | Start through virtual `+0x10` at `0x258e0c` |

Animation factory `0x22a658` creates the **2D controller**, constructor
`0x11eb44`, vtable **`0x321828`**. This matters: the separate 3D controller
vtable is not the authority for this layout's start/update wrappers.
Base constructor `0x131db8` initially sets current/start0, step1 and state0.
Resource binding `0x132fe8` calls the native readers, then `0x13c68c` sets:

- Looping resource: mode2, end=`frameCount`, start0, step1, state0, reset.
- Non-looping resource: mode0, end=`frameCount-1`, start0, step1, state0, reset.

Thus Loop gets end60; its setting is derived from the resource, not a guessed
duration. Start `0x2693fc` enables bindings, calls reset `0x1bbf48`, then
resume `0x269484`. Reset selects start0 for mode2; resume writes state1.
The loader's start establishes the **controller epoch**. It does not obtain
an elapsed-time timestamp. Its first update submits frame0. The fixture uses
a synthetic `-999` submitted-frame sentinel to check this ordering; that is
not a claim about the native transform's initial value before any update.

## Update order, endpoint and visibility

Controller `0x269430`, virtual `+0x0c`, performs these operations:

1. If state2, disable bindings.
2. If state1 or2, copy `A+0x0c` into `AnimTransform+0x10`; return-dirty is1.
3. Call base advance `0x1bbd94`.

Base advance in state1/mode2 adds float32 step to float32 current. If the
result is at least end, it repeatedly subtracts `end-start`. With this
resource and default step1, successive submitted/current pairs are
`(0,1), (1,2), …, (58,59), (59,0), (0,1)`. Endpoint60 is not submitted by
that normal sequence. **121 consecutive updates** execute this exact path.

Global updater `0x103df8` walks the two layout lists at `0x344bfc` and
`0x344c08`. Its list node is `C+4`: the byte read at node `+0x5c` is
**layout `C+0x60` visibility**, not layout status `C+0x5c`. At
`0x103e28..50`, visibility0 skips virtual `+8` entirely. Otherwise it calls
`0x1f58e4`, which advances every controller unless layout status `+0x5c==2`.
Statuses0/1 allow controller updates. Its apply/matrix flag is separate from
the controller loop; passing flag0 does not by itself stop advancement.

Consequently, the visibility setter `0x232234` does not directly change the
Loop, but the **outer update gate** pauses it. Seven hidden global updates
leave current17 unchanged. Showing the cursor next submits17 and advances
to18. Calling the inner layout updater directly on a hidden layout does
advance it; checking that inner function alone would give the wrong lifecycle
conclusion. These statements concern the layout visibility byte, not every
possible pane alpha, clipping or occlusion condition.

## Selection, density, folder transitions and speed

Density helper `0x1da050` seeks only `C+0x80` Scale, through virtual `+0x2c`.
Mode5 causes its current frame to remain at the supplied density value.
Values0–5 and fractional2.5 leave the Loop bytes unchanged. Primary cursor
positioning `0x1d914c` edits the root pane's position, also preserving Loop.

The original directional handler `0x2968fc`, movement helpers and cursor
effect helper execute in **24 ordinary root/folder movement cases**, across
all six densities. Successful left/right slot changes preserve a supplied
Loop phase17.25. `0x1de858→0x2660a0` starts a distinct cursor effect using
`S+0x824/+0x828`; it does not restart the primary Loop. The effect controllers
in this fixture are separate controlled objects, not a decoded effect render.
The [selection evidence](home_audio_CHILD_SELECTION_EVIDENCE.md) covers cue
and active-slot identity in more detail.

Navigation/scroll mode3 dispatches through `0x1e3ecc→0x2a3600`:

- With counter `S+0x3c98<5`, increment it and set `S+0x11a8=10`.
- With counter at least5, set that duration field to5. If the Loop step's
  exact bit pattern is float1, set it to float3 through virtual `+0x24`.
- Neither branch resets/seeks Loop or changes its playback state.

Twelve threshold/step combinations execute the real dispatcher and setter.
A step3 sequence starting at58 submits `58,1,4,…`; **23 updates** verify
wrapping without snapping to a multiple of3 or resetting phase. The mode3
counter is not established here as a count of every selection or HID repeat.

`0x2a5afc` resets the counter and Loop step to1 when mask `&0x30` is nonzero,
again preserving phase. Dispatch table `0x29504c` sends **numeric event7**
to it; the HID producer has not been traced, so this note does not rename
event7 as a physical release. There are also explicit calls with mask
`0xcfff` at `0x29fc64` and `0x2aefd8`. Six mask cases verify the step reset;
vertical masks `0x40/0x80` alone do not perform it.

Folder capture hides the primary cursor at `0x2a2e28..30`, then restores
its saved visibility at `0x2a307c..3090`. Both executed fragments preserve
Loop. Common hide/show helper `0x295b60` likewise preserves it. Normal
close's existing request2 ultimately hides through `0x2b8550..8568`, as
established by the [close evidence](FOLDER_CLOSE_OVERLAY_EVIDENCE.md).
Selection/history restore `0x1d9ea0` changes selection and density fields
without touching Loop. These facts support preserving phase through the
checked hide/restore operations; they are not a replay of the entire folder
transition or proof of every frame's visibility along it.

## Explicit stop/restart and remaining boundaries

The generic controller methods have different semantics:

| Method | Effect on this mode2 Loop |
| --- | --- |
| Reset, `0x1bbf48` | Current becomes0; playback state and step are retained |
| Start, `0x2693fc` | Enable, reset to0, state1; step retained |
| Stop, `0x2693e0` | Disable, state2; current retained |
| Next update in state2 | Submit retained current, then state0; no advance |
| Resume, `0x269484` | Enable, state1; current and step retained |

The fixture verifies a stop/update/idle/resume/update/start/update sequence.
This demonstrates callable controller behavior, not that sleep, folder entry
or every HOME return calls those methods on the primary cursor. The loader is
the established primary Loop start site. Scene cleanup at `0x2b8d90..8da8`
destroys and clears the primary cursor; a newly constructed object starts
from the loader epoch. Which app/sleep transitions retain or destroy that
scene remains outside this bounded trace.

Seek `0x1bbd8c` and step setter `0x1bbd84` store floats without rounding.
Four fractional fixtures verify, for example, submitted59.5 followed by
current0.5 at step1. The normal integer phase set is an **inference from
initial0 and the traced integer steps1/3**, not an integer restriction in
the animation API. Scale can independently have a fractional density frame.
Do not round either the generic sampler or density based on this finding.

Host routine `0x102288` calls the global updater at `0x1022dc`; the
offscreen rendering helper `0x1b56f4` also calls it at `0x1b573c`. The latter
is additional reason not to equate one global update with one displayed
browser frame. This pass does not execute the outer scheduler, sleep/APT
services, or hardware display cadence. A future live clock must establish
eligible update timing, visibility, epoch retention and transition ordering;
`floor(elapsed*0.06)` alone does not reproduce the evidenced lifecycle.

## Fixture coverage and limits

Passed: 121 default and23 accelerated updates; four visibility/status cases;
seven lifecycle actions; four fractional cases; seven density cases; three
position cases; 12 speed-threshold cases; 24 directional movement cases; six
speed-reset cases; two folder fragments; two common visibility cases; three
history restores; hidden/show and direct-inner-update ordering checks.
All34 source-excerpt hashes were independently checked against the result.

Actual ARM cursor/base/controller constructors, resource metadata readers,
binding-control wrappers, global registration, global/layout updates and
clock arithmetic execute. Factories return prepared objects with original
`pai1` bytes. String formatting, pane bind/enable virtual endpoints, animation
application, matrix calculation, sound output and unrelated mode3 grid/effect
work are controlled sinks. No GPU pixels, native wall-clock cadence or live
reference session are verified. Application tests/builds are not needed for
this evidence-only change; raster parity and actual browser validation remain
the integration workers' responsibility.
