# Game Notes interruption, return resource and owner clock audit

This follow-up resolves the selected-note return resource and traces the native
sleep fence. It also distinguishes the concrete Notes HOME callback from the
generic handoff implementation. The live title panel remains disconnected:
neither a permitted HOME notification nor the tutorial callback proves a
same-instance resume. No application code or firmware state is changed.

This continues the [startup/return audit](native-notes-startup-return-followup.md)
and [scene manager audit](native-notes-title-lifecycle-audit.md). Their unnamed
scene-2 return slot is resolved below; their owner-safe metadata requirement
still applies.

The later [accepted-HOME/entry audit](native-notes-accepted-home-entry-audit.md)
resolves the accepted route through **scene 9 hooks**, which run before the
manager callback. Its new evidence supersedes this note's remaining accepted-HOME
blocker; the sleep fence and slot binding below remain valid.

## Scene-2 slot 2 is now identified

At `0x164ba4–0x164c68`, the constructor copies three resource pointers from
`0x1aa8d4`, finds `G_Scene_00` using the string at `0x164e6c`, and registers
three slots for controller **scene 2 +0x98c**. The loop loads and registers
these resources in table order:

| Slot | Pointer table entry | Resource string address | Authored resource |
| --- | --- | --- | --- |
| 0 | `0x1aa8d4` | `0x1b88b8` | `MemoWriteDown_Base.bclan` |
| 1 | `0x1aa8d8` | `0x1b8914` | `MemoWriteDown_SceneIn.bclan` |
| 2 | `0x1aa8dc` | `0x1b89e4` | `MemoWriteDown_SceneOut.bclan` |

The return start at `0x165268` therefore starts **SceneOut**, bound only to
`G_Scene_00`. Nearby Shutter/PanelIn/PanelOut pointers belong to another
controller. This is a validated filename binding, not a name inferred from
the return action. The previously established ordering remains: the scene-3
HUD reverse event is immediate; scene-2 disablement waits for SceneOut and is
applied through the manager's pending request stage.

## Sleep fences scene updates without resetting the title

The applet notification dispatcher `0x114414–0x114754` polls through
`0x122660`. Notifications 3, 4, 5 and 6 become internal sleep-state values
1, 4, 2 and 3. These notification names and the reply command identity are
cross-checked against the public [libctru APT definitions](https://raw.githubusercontent.com/devkitPro/libctru/master/libctru/include/3ds/services/apt.h)
and [APT IPC implementation](https://raw.githubusercontent.com/devkitPro/libctru/master/libctru/source/services/apt.c).
Those sources identify constants only; the behavior below comes from the
original Notes executable.

The complete traced fence is:

1. Manager registration `0x10459c–0x1045b8` installs query callback
   `0x10619c` and wake callback `0x106148`, both with the manager as userdata.
   The query can return immediately or defer. In the deferred active path,
   the notification pump sets sleep-status byte +0xb to 1.
2. Before scene update, `0x1045f0–0x104658` checks each enabled scene's +0x6c
   permission. When all permit sleep, it sets manager pending bit 8.
3. Dispatcher `0x107444–0x1074c4` consumes bit 8, calls manager +0x38 and
   every scene +0x40, clears event `0x1c3d54`, and calls `0x15eb98(1)`.
   That path sets sleep status 2 and sends sleep-query reply command
   `0x3e0080` with acceptance 1 through `0x114b7c`.
4. The same manager pass blocks in `0x1603d8` on that event. The wait loop
   uses the address arbiter and contains no scene updates.
5. Wake notification 6 reaches the installed `0x106148` callback. It signals
   that event through `0x1608a8` and sets manager pending bit 0x10.
6. The bit-8 branch resumes at `0x1074bc` and jumps to the dispatcher tail;
   it does not fall through the bit-0x10 branch. The interrupted manager pass
   can continue into scene updates before a subsequent dispatcher pass
   consumes the wake bit. That later branch calls manager +0x40 and every
   scene +0x44.

For the concrete Notes manager, +0x38 resolves to `0x13af00`, which calls the
storage flush helper and returns 1; +0x40 resolves to `0x13aef8`, which just
returns 1. For scene 3, vtable `0x1b6d88` +0x40/+0x44 resolve to
`0x197980`/`0x197978`. Both consist of a return of 1 and write no state.
**Neither scene-3 hook resets the title timer, HUD slot or title controller.**

Its title therefore receives no source update while this wait blocks. After
wake it continues from the same instance and values, subject to ordinary
scene enablement. This does not justify adding elapsed wall time to the
animation, settling the title to a terminal pose, or sending scene-3 event 0
on wake. It also does not claim that browser visibility changes are native
sleep notifications.

## A HOME permission flag is not an accepted handoff

Notifications 1/2 pass through the HOME pending path. The manager tests
`0x161c24` before scene updates and consumes pending bit 1 in
`0x1072f0–0x107364`. It conditionally calls scene hooks +0x34, passes its
byte +0x2dc to manager hook +0x2c, then clears the pending notification via
`0x15c1d0`. Bit 2 has the corresponding +0x38/+0x30 path.

The concrete Notes vtable binds these manager hooks as follows:

| Hook | Concrete function | Behavior |
| --- | --- | --- |
| +0x2c | `0x13ac7c` | If the argument is zero, immediately dispatch scene 11 event 0; otherwise just return 1. |
| +0x30 | `0x13ac44` | If the argument is zero, dispatch scene 11 event 0; otherwise call the storage flush helper. Return 1. |

Scene 11 loads `HomeNixSign.bclyt` at `0x166e7c–0x166eb4`. Event 0 starts
its own slot 0 and enables it; its update waits for that slot, then disables
it. Event 1 sets an inhibition byte. This establishes the unavailable-HOME
indicator path, not title reinitialization. Scene-3 hooks +0x34/+0x38 are
also return-only functions.

The generic manager table separately binds `0x168bb0` and `0x168b18`.
Those functions call `0x178148`, then the blocking applet routine `0x1617ec`,
restore request state and inspect its result. **The concrete Notes callbacks
above do not call these generic functions.** A nonzero +0x2dc is consequently
insufficient evidence that an accepted HOME handoff happened. Its zero path
explains the indicator; its nonzero path must not be relabelled a proven
same-instance suspend/resume sequence.

The remaining boundary is the native applet command/exit path which makes an
actual accepted HOME return, including whether it reaches main-loop exit or
another blocking route. The generic code is evidence of a separate facility,
not proof that Notes uses it on these notifications. A future trace must join
the concrete caller to that route before changing the browser lifecycle.

## Owner clock routing and teardown are distinct

Normal scene updates are still driven by the manager's priority lists,
`0x104a40–0x104ad4`, and +0x68 enablement. Scene 3 checks its title phase
before advancing its independent controller by 1.0. Drawing, note selection,
HOME indicator drawing and a blocked sleep wait are not substitute clocks.
Scene 2 and scene 3 must retain separate return/HUD/title controllers.

There is also a proven destructive owner boundary. The main work loop at
`0x101ca0–0x101cc8` repeats while manager update returns true. Manager update
returns true only while +0x2ec equals 2 (`0x104e10–0x104e20`). After loop exit,
main invokes `0x104ec0` at `0x101e28–0x101e34`. That routine unregisters
callbacks, finalizes the scenes, invokes their destructors and frees their
allocations. Later main calls `0x1607bc`, which frees the context's three
capture buffers at +0x20/+0x24/+0x28 and icon at +0x12c.

Reentry after this teardown cannot reuse an old scene-3 controller or capture
allocation. It requires a new applet owner and newly accepted suspended-title
metadata. This teardown trace does not prove that every HOME notification
reaches it. Sleep, unavailable HOME and completed teardown must remain three
different lifecycle cases.

## Verification and remaining implementation boundary

Original Notes executable SHA-256:
`8a2feea02c2a6ef62c8a8d3e4cc20faa5639fe5af47d3876f8a5d3ea43064cc6`.
No executable firmware was run. Twenty-two bounded annotated source ranges
with byte hashes and fifteen resource/table assertions are retained privately
in `reference/notes-title-sleep-reentry/`; all assertions pass. The existing
19 session/capture/switch tests pass. These tests validate current ownership
and capture behavior; they do not validate an absent live title lifecycle.
No changed pixels need a new source render, and no browser was driven by this
isolated audit.

Remaining work before connecting the title panel:

- Resolve the concrete accepted HOME command/exit and subsequent startup
  route, without substituting the generic callback implementation.
- Port the ordered list/open/return/HUD/title controller with the verified
  sleep fence and deferred scene disablement; verify combined source frames.
- Bind title metadata/icon and frozen LCDs to both the Notes instance and the
  suspended-application instance/generation, rejecting stale asynchronous
  completion as specified in the previous audit.

The slot-resource and sleep-hook uncertainties are resolved. The live title
panel is not yet an end-to-end validated implementation.
