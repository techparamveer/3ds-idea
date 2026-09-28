# Game Notes startup record, tutorial callback and return ordering

This follow-up resolves two ambiguous branches in the
[title lifecycle audit](native-notes-title-lifecycle-audit.md): the startup
context is a persisted record, and the literal-1 reinitialization callback is
from tutorial completion. Neither is evidence of HOME resume. It also narrows
the selected-note return sequence. The live title panel remains disabled.

## Startup context is persisted data

Context `0x1f3024`, returned by `0x1610f8`, has a 0x44-byte persisted payload
and a separate status at +0x44. `0x105c24` clears the payload and sets status
zero. `0x105c88–0x105d84` loads a record through the storage interface:

| Check | Result |
| --- | --- |
| Reported record size <= 0 | Status 4; no payload accepted. |
| Reported size differs from 0x54 | Status 5. |
| Read returns a length other than 0x54 | Status 2. |
| Word +4 differs from `0x43433031` | Status 5. |
| Computed value for the 0x50 bytes at +4 differs from word +0 | Status 5. |
| Word +8 plus `0xcfcfcfcf` is nonzero | Status 5; accepted version word is `0x30303031`. |
| All checks pass | Copy 0x44 bytes from record +0x10 into the context. |

The corresponding writer `0x160dc4–0x160eb0` constructs the same 0x54-byte
record, writes the two header words and computed check value, saves the
payload and commits the `data:` archive. Successful storage clears status;
write/commit failures set status 3. These operations were inspected statically
and were **not executed**.

The byte used by scene initialization is context +4, i.e. record +0x14. It is
persisted history, not an applet-resume flag. Accessors are explicit:
`0x105c40` tests nonzero, `0x105c54` writes a normalized boolean,
`0x196700` reads the raw byte, `0x19670c` writes a byte, and `0x1966d8`
increments it with saturation at 255.

The traced writers are:

- Startup recovery `0x101bec–0x101c2c`: clear the context, set byte index 0
  to 1, save it. The preceding status switch routes status 5 here; status 4
  has an additional prerequisite check before this branch.
- Error-recovery scene `0x13b564–0x13b594`: for status 5, set byte index 0
  to 1, then attempt to save the context.
- Tutorial path `0x13e49c–0x13e4c0`: increment byte index 0, then save it.
  The subsequent status determines whether normal continuation is possible.

Therefore the scene initialization parameter calculation at
`0x162cfc–0x162d1c` means "1 for status 5, otherwise this persisted byte".
A nonzero value is tested as nonzero by scene 3. This trace establishes the
storage behavior and tutorial writer; it does not give permission to add
persistence or first-use questions to the portfolio.

## Literal-1 callback is tutorial completion

The previously unnamed callback `(6, 3, 0)` is emitted at
`0x13e5ac–0x13e5bc`. Scene 6 is constructed by `0x13e770` with vtable
`0x1b6978`; its registration at `0x13e05c` onward uses the
`MemoTutorialDown_*` resources. The completion branch:

1. Waits for controller +0x2c4 slot 2 to become not busy
   (`0x13e544–0x13e558`).
2. Requests scene 1 update enablement, directly disables this tutorial
   scene's update/draw flags, and clears its control state.
3. Calls manager `0x151928` with scene 6, event 3 and parameter 0.

`0x151928` immediately invokes the active manager-state object's vtable
+0x34. For the state constructed at `0x1630d8`, vtable `0x1b6a24` +0x34
is `0x1626f8`. That callback's `(6,3)` branch sends scene-1 and scene-3
event 0 with literal parameter 1 (`0x162860–0x162890`). This is a complete
static call chain for the previously ambiguous reinitialization path.

The title therefore starts after this tutorial completion when suspended
software is available, as it does on nonzero normal initialization. Calling
this branch "resume" would produce a false lifecycle port. The actual HOME,
sleep and applet reentry paths remain separate work; this callback provides
no evidence that they reset the title controller.

## Selected-note return has two stages

The action-index-0 path at `0x1636a4–0x163750` clears input state and checks
context +0x134. If that value is negative, it selects scene-2 state 2 directly.
Nonnegative values enter additional note-storage checks; those operations are
outside the portfolio's UI-only scope.

Scene 2's update jump table maps state 2 to `0x16548c`, which calls
`0x165150`. With context +0x134 negative, and the preceding pane visibility
branch not intercepting the operation, this helper takes the bounded return
path without the note-write checks. At `0x165268–0x1652c4` it:

1. Starts **scene-2 controller +0x98c, slot 2**, with sibling-disable=1,
   frame-reset=1 and direction-selector=2 (preserve direction).
2. Sets scene-2 state +0x858 to 7.
3. Immediately sends scene-1 event 1 with the selected-note slot.
4. Immediately sends scene-3 event 8 with parameter 0.

The authored filename for that controller slot has **not** been validated in
this pass. It is identified only by controller/slot; it must not be called
`SceneOut` based on its apparent purpose.

Scene-2 state 7 maps to `0x1654a0`. It waits until controller +0x98c slot 2
is not busy, requests scene-2 draw and update disablement, and sets selected
slot +0x860 to -1 (`0x1654a0–0x1654e8`). Pending disablement takes effect
at the next manager request-processing stage, not at the immediate dispatch.
The controller advances after state processing at `0x165a88–0x165a94`.

Combining this with the established priorities gives one exact cross-scene
ordering: scene 2 updates at priority 3 and scene 3 at priority 4. Its event-8
HUD reverse dispatch therefore precedes scene 3's update in that same manager
pass. Scene 3 can advance the newly started HUD while the lower return
controller is still active. Its HUD completion branch independently waits for
the selected slot, restores state +0x3c0 to 0 and sets +0x3c3 to 1
(`0x168670–0x168694`). It does not reset the independent title timer there.

The current UI-only Back action changes directly from drawing to the list.
It does not implement these staged source controllers. A title port layered
onto that immediate change still cannot claim exact combined lifecycle frames.
The action's pane binding, the intercepted visibility branch, the named slot
resource, and full return/resume routes need validation before this trace is a
complete replacement controller.

## Owner-safe metadata: available mechanism and missing binding

The existing native resource session already uses request snapshots, aborts,
generation tickets and disposal to reject stale asynchronous loads. Tests
cover a replacement owner, close/sleep invalidation, reentrant close and changed
resource selection. This mechanism is suitable for a future separate metadata
acquisition, but the Notes panel requires **two** identities:

- The Notes applet instance which owns the panel/controller lifetime.
- The suspended application instance and frozen capture generation whose
  SMDH long description and icon are being displayed.

The current presentation's `nextOwner` identifies the Notes applet; reusing
that alone would not protect the suspended application metadata. The copied
capture's owner/generation are already included in the paired-frame cache key,
but no metadata acquisition is bound to them. An integration must snapshot both
identities, original title ID and manifest source identity; reject completion
if either lifetime changes; and publish a consistent metadata/icon/LCD pair.
A title ID alone is insufficient because reopening the same application creates
a new instance. Disposal must release owned bitmaps without disposing borrowed
fonts. Unsupported or missing SMDH remains an explicit unavailable case.

No new metadata code is introduced before the live controller's lifetime is
proven. Existing capture tests establish their current ownership behavior, not
this absent metadata contract.

## Verification and next boundary

All analysis uses original Notes executable SHA-256
`8a2feea02c2a6ef62c8a8d3e4cc20faa5639fe5af47d3876f8a5d3ea43064cc6`.
Fourteen bounded byte ranges with hashes/listings and six source table/literal
assertions are retained privately in `reference/notes-title-startup-return/`.
All assertions pass. All 19 native-session and Notes capture/switch tests pass.

The next source task is the actual HOME/sleep/applet reentry lifetime and
return controller resource binding, followed by a combined ordered-controller
trace. The startup record and tutorial completion no longer block that
investigation or need to be rediscovered. General overflow text and unsupported
portfolio metadata remain separate limitations.

This commit changes documentation only. No firmware storage operation, live
panel, audio, note editing, browser or integration checkout was changed. No
application rebuild or new render was needed; the previous 31 component frames
do not substitute for an unimplemented lifecycle verification.
