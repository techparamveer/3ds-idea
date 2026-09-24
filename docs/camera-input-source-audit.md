# Camera input, scheduling and blank-selection continuation

This extends the [paging audit](camera-paging-source-audit.md). Original ARM
replay now establishes raw direction mapping, repeat arithmetic, touch thresholds,
and blank-selection metadata/coordinates. It does **not** establish the complete
browser adaptation or the final native blank preview/cursor visibility. No live
UI change is included.

Source is EUR Camera `0004001000022400`, content `0000-0000001a`, ARM base
`0x100000`, executable SHA-256
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`.

## Direction producer and repeats

`0x10e318` reads a PadReader snapshot through `0x112b14`, then maps the raw
direction bits at `0x10e37c–0x10e3a0`. The browser's existing raw direction
convention is in `src/os/home-input-adapter.ts`; Camera translates those masks
again before its selection handler sees them.

| Direction | Raw mask | Camera mask | Large-grid candidate |
| --- | --- | --- | --- |
| Right | `0x10` | `0x80` | index + 1, crossing row/page boundaries |
| Left | `0x20` | `0x100` | index − 1, rejecting unsigned underflow |
| Up | `0x40` | `0x200` | previous row in the page/column, with wrap |
| Down | `0x80` | `0x400` | next row in the page/column, with wrap |

The producer's `+0x50` mask suppresses controls already held when it resets;
releasing a control makes it eligible again (`0x10e3cc–0x10e3dc`). Replay checks
held-at-reset, release, and a fresh press. This matters when entering Camera.

The input manager points to root `+0x40` (`0x1054e4–0x1054e8`). Its key object
starts at manager `+4`; `0x128508` initializes delay **20** and interval **4**.
`0x275230` populates manager fields:

| Manager field | Meaning |
| --- | --- |
| `+4` | current held mask |
| `+8` | new press edges |
| `+0xc` | release edges |
| `+0x10` | press/repeat emission consumed by Camera |
| `+0x14`, `+0x18`, `+0x1c` | initial delay, repeat interval, countdown |

Thirty replayed updates holding Right emit on **1,21,25,29**. Adding a second
direction emits only its new edge and restarts the shared 20-update delay;
releasing one direction emits a release edge without a repeat. Releasing all
clears the countdown. These are constructor defaults and source arithmetic;
this audit has not exhaustively excluded every possible runtime override.

## Scheduling and the browser boundary

The root constructor `0x117008` sets root `+0x3c` to **1**. The application loop
converts that byte to float and writes root `+0x2a0`, which is manager `+0x260`
(`0x105600–0x105614`). This resolves the scroll model's previously unidentified
time input: it comes from the root update divider. It is not a duration read
from a browser timestamp.

Root vtable `0x420af4`, update `+0x34`, resolves to `0x271ff0`. That method
updates manager keys/touch through `0x2752c8` before generic child traversal
`0x270cc4`. Generic traversal runs `+0x38`, enabled children, then `+0x3c`.
SceneBrowse vtable `0x42044c` uses that traversal; `+0x38` is a no-op and
`+0x3c` is input handler **`0x2d5740`**. Thus its input phase occurs after its
child update phase, not before it. Browse presentation reads scroll output in
the later update path at `0x2d4788`.

The current website normalizes stock button presses immediately and produces
app repeats with `app-input.ts`'s 420/150ms policy. `stock-apps.ts` consumes
those command events and does not retain native Camera held masks or a staged
post-child input phase. Wiring the output smoother directly into that reducer
would preserve neither repeat counts nor phase ordering. A Camera-specific
staged input adapter is needed; globally changing repeats would affect HOME and
other apps. The root divider and ordering do not prove hardware milliseconds.

## Touch ownership and drag dispatch

`0x274f0c` consumes contact-tagged native coordinates, retains sample history,
and exposes press/release edges. It accumulates step lengths only when a step
is at least float32 **1.1px**. Accumulated **4/12/64px** set flags at touch
`+0x7a/+0x7b/+0x7c`; Camera uses the **12px** flag for dragging. This is
cumulative path length, not straight-line distance from the press. Replay
covers ignored 1px motion, thresholds, and release.

The browse handler has its own drag path, in addition to generic slider-track
events. `0x2d5740` first checks scene readiness/state/modal gates. On a fresh
touch, `0x2d58f0–0x2d595c` converts to centered lower-screen coordinates
`(x−160,120−y)` and checks the configured browse rectangle. It then checks
manager `+0x25c`'s active owner ancestry against scene `+0x168`
(`0x2d5960–0x2d5980`). A touch inside the rectangle is not enough to grant
capture when a different control owns it.

Accepted capture sets wrapper `+0x18`. At the drag threshold, or when touching
an already-moving slider, `+0x19` activates and `0x1fbba4` seeds pending motion
from the truncated current displayed offset. `0x2d5a0c–0x2d5a48` adds
`previousTouchX−currentTouchX` to the model target, calls `0x21fd40` with
**flag 0**, clears timed interpolation, and sets browse state **1**. Release
clears both capture flags and sets state **2** (`0x2d5a64–0x2d5aa8`), allowing
the pending model/history to continue. Using the D-pad's immediate flag 1 for
dragging would erase that history.

Generic `LytSlider` event handler `0x270350` also distinguishes track/child
events and uses projected touch position (`0x21ed10`). It is not a substitute
for Camera's viewport drag handler. Remaining touch work is to reproduce the
scene gates, active-owner arbitration, thumbnail press/release routing and
capture cancellation as a single ordered browser flow. None of those may be
inferred merely from the standalone touch sampler passing.

## Blank cursor and preview findings

The whole selection-commit routine **`0x1fccf4`** is replayed for seven items,
moving selection from 6 to padded blank index **9**. It retains index 9, marks
selection changed at owner `+0x2234`, sets selection type **1** at `+0x2236`,
and clears the source-written selected-item metadata at the metadata owner's
`+0x3ae8`. The packed record contains an unwritten padding byte; tests exclude
that byte. A blank cell does not preserve the previous photo as the selected
item.

The blank branch of `0x1fcb70` routes to **`0x2d1808`**, which retains viewport
visibility handling and emits its own `0x22/0x23` notifications. Real photos
instead route to `0x2d134c`; folders route to `0x2d1ae4`.

`0x2d11fc` supplies the selected index to **`0x2db78c`** without filtering it
by actual item count. Replaying that coordinate routine for blank index 9 at
scroll offset −86 yields lower-screen centre **(246,140)**. Thus blank
selection retains a geometrical cursor location. This is not proof that the
cursor is finally visible: final cursor visibility and the upper preview's
response to type 1 / `0x22/0x23` still require their downstream writer trace.
The website currently clamps to real items and derives preview/footer from a
real row, so blank support needs both state and presentation changes.

## Reproduction and acceptance limit

Run `scripts/replay_camera_input.py --code <absolute code.bin> --output
<absolute report>` using a private Python environment with `unicorn==2.1.4`.
It verifies the executable hash and executes original instructions without
patches. Source vtable identities, four raw mappings, reset suppression,
30-update repeat sequence, multi-key edges, six touch samples, blank metadata
commit, and blank coordinates pass. Private output is firmware artifact root
`reference/camera-paging-source/input-replay.json`.

No browser, application/public asset edits or new screen render are included.
Application rebuilds would not validate this audit-only change. The remaining
blocker to a live source-faithful port is **ordered browser scene ownership and
blank cursor/preview presentation**, with lifecycle cancellation and repeat
isolation tested against existing HOME behavior. Native wall-clock and matched
screen-sequence acceptance also remain open.
