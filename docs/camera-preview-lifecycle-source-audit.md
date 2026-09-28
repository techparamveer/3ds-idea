# Camera preview events, fade component and touch cancellation

The [owner lifecycle continuation](camera-owner-lifecycle-source-audit.md)
corrects `helper+0xe0`: it is a synchronous initialization latch, not image
completion. It traces the separate worker/readiness callbacks and replays mode
configuration plus three-page routing. Read it before implementing this checkpoint.

This continues the [blank presentation audit](camera-blank-presentation-source-audit.md)
against the same hash-pinned EUR Camera executable. The extended original-ARM
replay closes the normal browse `0x23` handler and identifies the upper fade
component. It does not yet establish the full image-completion and owner-touch
sequence required for a live staged adapter. No application or public asset
changes are included.

## Blank events through the actual owner

The static table initializer block `0x31bfbc–0x31c328` populates the owner event
table at `0x483570`. State indices 1,2,6 resolve to `0x287f50`, `0x289120`,
and `0x28791c`. The first checks event 4/0x1e, the second checks event 4,
and the third returns immediately. These indices also appear in the browse
preview gate at `0x28a058–0x28a068`; they are indices, not inferred UI names.

The replay now executes the **entire owner event handler `0x28bcf4`**, including
the common handler, native table-selected callback and remaining helper
handlers. With event **`0x23`**, state indices **1,2,6** and a null source-control
payload, the owner's entire 0x1800-byte synthetic record remains unchanged.
This is stronger than checking that the common handler lacks a `0x23` branch.
It does not generalize to every modal state or every source-control payload.

The complete handler also passes for **`0x22`**, state index 1, null source
payload and initially shown Finder entries. It changes entries
**0,2,6,7,8,9,10,11** to native fade-out state 3, writes preview state
`owner+0xce0=2` and blank/folder distinction `owner+0x8fa=1`. Animation-list
state is synthetic and no image decoder is invoked. This confirms the actual
fade requests, not their full-screen visual outcome.

## The upper transition control is FadeAll

Owner `+0xce4` is **`notes::lyt::FadeAll`**, identified by its creation at
`0x28b22c–0x28b264`, assigned vtable `0x41e638` and RTTI. Earlier notes called
it a preview control without this concrete type. Its `+0x80` is transition
state, and `+0x9e` holds the target RGBA; it is not an image decoding flag.

`0x289d8c` waits for this fade state to equal 1 before progressing preview
state 2. It also requires the image helper at owner `+0x80c` to report a
nonzero signed byte at helper `+0xe0`. It then clears preview state, sets
`+0x8f9=1`, and branches on owner `+0x530`:

- When already in that mode, it calls inverse-fade helper `0x20f450`, skips
  folder pane 8 when `+0x8fa` is set, and calls `0x210ce4(1)` before resetting
  preview item records.
- Otherwise, it requests FadeAll mode 2 if the target alpha is below 128,
  then installs `0x28ad68` through table `0x34ae98`. That callback waits for
  FadeAll completion, skips folder pane 8 for a padded blank, calls
  `0x210ce4(1)`, resets item records, requests the inverse fade, and restores
  the default preview callback via `0x20f3bc`.

`0x210ce4` writes owner `+0x530`, control flags, and rendering configuration;
its complete visible layer composition remains unverified. These branches
explain why the native blank transition cannot be reduced to immediately
clearing an image or showing `BrwsNoData`.

The replay executes the real color initializer `0x3199cc`, FadeAll constructor
`0x22026c`, mode setter `0x2591a4`, and complete update `0x26de78` without
intercepted calls or instruction patches. Mode **2** produces transparent
black to opaque black. The source argument **12.0** appears at the preview
transition call and at inverse helper `0x20f450`. With update input **1.0**,
the output alpha sequence is:

`21,43,64,85,106,128,149,170,191,213,234,255`

At update 12 state becomes 1. The actual owner helper `0x20f450` schedules
mode **5**, whose replay yields:

`234,213,191,170,149,128,106,85,64,43,21,0`

These are component updates, **not measured milliseconds or a captured
complete image transition**. Native render ordering can add a phase before
the owner observes completion; decoder readiness can delay it further.

## Cancellation before new touch or direction dispatch

The complete BrowseThumbnail input entry **`0x2d5740`** is replayed with the
manager's `+0x254` flag zero and both capture/drag flags set. The early gate
at `0x2d5764–0x2d5794` also incorporates child `+0x2df`, `+0x3a4` and
`+0x3a6`. Its cancel branch clears wrapper `+0x18/+0x19` before returning or
transitioning the browse state. It does not dispatch a new touch or D-pad
candidate in this branch.

Replay verifies browse states **0,1,2 → 2**, with the former state retained at
`+5`, while state **3 remains 3**. Both capture and drag flags clear in all
four cases. The source state guard is `0x1fb4ac`; the replay does not equate
an arbitrary browser focus event with the native manager flag.

This only closes the early cancellation path. Current captures, active-owner
ancestry, modal changes, thumbnail release events and slider history still
need a combined ordered trace. The enclosing owner executes its after-child
input phase after BrowseThumbnail, while presentation is parent-first, as
recorded in the preceding audit. A browser adapter must map suspension, power,
app close and interrupted touches to those boundaries without modifying HOME.

## Verification and remaining deliverable

The extended `scripts/replay_camera_blank_presentation.py` passes the original
cursor/no-data cases plus full-owner blank events, cancellation and both native
FadeAll sequences. Reproduce with the absolute `--code` and `--output` arguments
from the preceding audit. Private report:
`reference/camera-paging-source/blank-presentation-replay.json` under the firmware
artifact root. Python compilation, relative links and `git diff --check` pass.
No application rebuild, browser inspection or new source render is claimed.

The remaining implementation blocker is narrower: **trace image-helper
completion (`owner+0x80c`, helper `+0xe0`) and the visible mode/layer change in
`0x210ce4`, then replay those together with owner/child touch arbitration and
lifecycle cancellation**. The steady-state cursor, normal `0x23` callback,
blank pane fade requests and native FadeAll arithmetic are now established.
Strict 1:1 screen-sequence and wall-clock acceptance remain open.
