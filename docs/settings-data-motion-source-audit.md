# Data Management entry and wait motion: source audit

This follow-up traces the Software/Extra Data lower-scene loading sequence in the
original Settings executable. It does **not** add a live animation: the source
has asynchronous loading gates and a separate entry controller that are not yet
mapped completely. The existing settled accessible-empty-SD presentation stays
unchanged. See the [list source audit](settings-data-lists-source-audit.md).

## Evidence identity

Settings title `0004001000022000`, content 0 / `0000003d`, mapped at `0x100000`;
code SHA-256 `1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5`.
`scripts/audit_settings_data_motion.py` reads the original image and RomFS as data,
pins the image hash, four code ranges, five PC-relative resource bindings, the
17-entry state dispatch, and original layout/clip member hashes. It does not
execute firmware or access device services.

Report and source-render scratch are under SSD firmware root
`reference/settings-data-motion/`. Original sources remain unchanged.

## Separate entry, load and wait controllers

The generic lower-entry builder `0x235940–0x2359b4` formats a lower-layout name
with one of 14 suffixes from table `0x299d8c`. Entries 0–5 alternate
`SceneIn_00.bclan` and `SceneIn_01.bclan`; 12/13 repeat those names. The table
establishes available handles, not which caller selects one for this route.
The route-level selector and its update ordering remain untraced.

The Data list controller has its own fields:

| Offset | Constructor binding | Group |
| --- | --- | --- |
| `+0x3c` | `SMngCTRData_D_00_BtnIn` at `0x20d184–0x20d190` | Group_05 |
| `+0x40` | `SMngCTRData_D_00_TextIn` at `0x20d198–0x20d1a4` | Group_03 |
| `+0x44` | `WaitIcon_WIconIn` at `0x20d220–0x20d234` | Group_01 |
| `+0x48` | `WaitIcon_WIconLoop` at `0x20d238–0x20d24c` | Group_00 |

`0x20d250–0x20d26c` invokes the play slot (`vtable+0x10`) for both wait clips.
`0x20d288–0x20d29c` uses the previously traced endpoint helper `0x1c70d0` with
flag 1 to hold BtnIn and TextIn at their starting poses. They are not simply
co-started with SceneIn.

The controller dispatches its copied scene state at `+0x58` through the table
at `0x20d618`. Its important branches are:

| State | Branch | Source gate/result |
| --- | --- | --- |
| 1 | `0x20d65c` | Reads parent `+0x64`, loader status `0x299c6a`, result `0x299c6b` and list count `0x299c80`. Loading completion determines the next branch. |
| 2 | `0x20d980` | Waits while WIconIn status `+0x14` equals 1 or 2. Once it differs, starts BtnIn/TextIn through play slots and requests state 3. |
| 3 | `0x20da50` | Waits while BtnIn status equals 1 or 2, then requests state 4. |
| 4 | `0x20dc3c` | Settled state; transition bookkeeping enables controls. |

For parent `+0x64 == 0`, state 1 increments a counter and branches only when the
**previous** value is greater than 10 (`0x20d7c8–0x20d7d8`). Starting at zero,
that branch is taken on its twelfth visit, not after ten visits. This is one
branch of the source controller, not a general browser loading duration.

The completion path calls the empty-list setter `0x19793c`, requests parent
state 2, writes direction flag 1 to WIconIn `+0x18`, calls its play slot, and
calls WIconLoop's `vtable+0x14` slot (`0x20d7e4–0x20d824`). Another loader-result
branch joins the same sequence at `0x20d938`. This is consistent with reversing
the fade-in and stopping the loop. Exact virtual-slot reset/current-frame
semantics and caller update order still need tracing before a live port.

At the end of every update, `0x20dc3c–0x20dc7c` compares the copied state with
parent `+0x4c`. Non-4 transitions disable interaction through `0x19782c(0)`
and `0x224b84(0,0,0)`. Entering state 4 calls the corresponding enable path
at `0x20dc94–0x20dcd8`, then copies the parent state back to `+0x58`. Playing
TextIn immediately while leaving Back/input enabled would skip source gates.

The callback `0x20dd0c` acts only when its argument is 1. It hides
`N_WaitIcon_00` at `0x20dd34–0x20dd48`, runs `0x20ce8c` to change other clips,
and releases the controller-owned handle at `+0x50`. The owner meaning of this
callback (including HOME/sleep and cancellation ordering) is not established;
it must not be treated as a proven browser lifecycle hook.

## Source clips and diagnostic renders

- `WaitIcon_WIconIn` has a 21-frame container with alpha keys 0→255 at local
  frames 0→20. WIconOut has the reverse alpha keys, but this Data controller
  binds **WIconIn** and reverses its direction; it never binds WIconOut here.
- `WaitIcon_WIconLoop` is a 32-frame loop. It animates material alpha and two
  texture rotations with duplicate-time keys at quarter turns. Rotating the
  whole pane continuously would produce different pixels.
- SceneIn_00, SceneIn_01, BtnIn and TextIn have 21-frame containers and keys
  through frame 20. The two SceneIn clips have different track records even
  though their final displayed poses agree.

`entry-source-poses.png` samples both raw SceneIn clips at 0/5/10/15/20.
`wait-source-poses.png` samples WIconIn at those phases and WIconLoop at
0/4/8/16/24. The source renders were inspected and have no renderer diagnostics;
source packs remain immutable. The entry sheet retains authoring placeholders
(Japanese SD text and sample page counters), so it is deliberately **not** a
portfolio empty-state screenshot or a reconstruction of native frame order.

Ten Python audit tests pass with the supplied Settings source, including four
new motion checks. Both existing Data delivery tests pass. No public resources,
runtime code, browser, emulator or device state changed. A production build is
not required for this audit-only change.

## Remaining blocker and next bounded work

A complete timeline still needs the normal entry-handle selector, controller
play/stop/current-frame semantics, the scene construction/update order, and
lifecycle cancellation. The asynchronous loader-result gate also needs an
explicit portfolio adaptation or captured native observation; there is no SD
scan in this website to supply its completion event.

Until those are established, retain the existing settled scene and leave the
wait mount unattached. Do not introduce a fabricated fixed spinner delay or
start BtnIn/TextIn simultaneously with SceneIn. A matched native capture is
still required to establish actual visible ordering and timing.
