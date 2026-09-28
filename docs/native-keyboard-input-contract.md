# Ordinary nickname keyboard input

`src/os/native-keyboard-input.ts` is an isolated deterministic input boundary for
the English page0 keyboard opened from an existing Settings profile nickname.
It emits widget callbacks, animation requests and plain-model operations. It is
not connected to System, scene input or screen rendering. Text insertion,
deletion, clamping and selection arithmetic remain owned by the text model.

The source is the keyboard applet code image with SHA-256
`a0b78005b0a99116ca703bc9b7625ce1b0f2d4cc45f66fc6fb9ab8a34244d4f0`.
Native addresses below are virtual ARM addresses. The new private evidence is
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/runtime/keyboard-native/settings-nickname/ordinary-input`.
The invocation/normalization/initial-pose evidence and both `lower-first-paint`
and `global-first-paint` siblings are preserved. This continues the
[invocation and first-paint contract](native-keyboard-invocation-contract.md).

## Phase and operation ownership

The original `102a88` manager first scans the registered widgets for their
capture bytes. It then checks task flags `0x107`, the inhibit word and readiness
calls `109618(-1)` / `108410(2)`. Eligible widgets run in registry order before
digital event production. A widget can raise the global capture latch during
that same pass. Clearing its local capture byte does not clear the already
scanned latch until the next manager pass.

The full native replay uses manager `102a88`, task manager `1054e0`, then root
update `102e84` after ordinary-state entry. It executes callback registration
`183a50` and the original widget-to-model chain:

`159cb8 → 1911bc / 1911d4 → 193a80 → 17f774 → 1401f8 or 140050`.

`17f774` handles kind1 only and resolves widget identity among 54 registered
QWERTY widgets. The 45 default character widgets read their resource UTF-16 unit
and call `1401f8(model, unit, 0, 0)`. Space is widget45 and inserts U+0020;
Backspace is widget46 and calls `140050`. All 47 routes execute in the oracle.
These callbacks request an edit; the model can reject it, so an input callback
must not be equated with a successful text change.

The host calls `updateNativeNicknameKey` for each eligible supported widget,
dispatches its ordered effects, resolves a kind1 callback with
`routeNativeNicknameKey`, invokes the existing edit model and immediately feeds
its acceptance result to `applyNativeNicknameEditResult`. This last step is
necessary for the repeat rejection latch. It does not run text arithmetic.
The caller supplies the default page0 resource unit; modifier pages,
composition and other language modes are outside this contract.

## Touch rules

Character state0 (`17de3c`) accepts a rising held edge inside the resolved bound,
starts animation0, acquires capture, enters state1 and emits kind1/payload0.
Insertion therefore occurs on down. State1 (`17deb0`) stays pressed while held
inside. Release or leaving starts animation2 and enters state2 without another
edit. Re-entering while still held cannot insert again. State2 (`17e44c`)
returns to state0 only when the caller reports the release controllers finished;
pending disable instead requests animation4, enters state5 and clears capture.
State0 clears its previous capture when it next runs.

The complete character replay observes widget states `1,1,2,0,0,0` and global
busy values `1,1,1,1,1,0` over down, hold, release and three idle passes. The
reducer exposes completion as a separate input rather than baking in that
fixture's controller timing. Disabled state5 emits no input. A global capture
blocks widgets which do not already own capture.

Space and Backspace use `182eec` / `182f74`: down emits payload0 before pressed
animation0, then clears repeat counters and captures. The first repeat occurs
at **40 held widget updates after down**. Space repeats every8 subsequent
updates. Backspace repeats every5, emits its 31st repeat at190, then repeats at
192,194,… every2. Payload1 denotes the first repeat stage and payload2 the
accelerated stage. These are widget-update counts, not verified milliseconds.

Leaving a repeat key resets its three counters, requests animation1 and enters
state3. Re-entering requests animation0 and returns to state1 without an
immediate callback; another40 held updates are required. Release returns to
state0 with animation1 and no extra callback. A failed repeat-key edit calls
`1401a0`, setting the persistent `+258` stop flag. Leaving/re-entering preserves
that flag. Only a new rising press clears it. In the full `Ada` trace, Backspace
edits on down,40,45; the attempt at50 finds an empty buffer, fails and stops all
further repeats while the widget stays captured in state1. This is not a
disabled-widget transition.

Native input has current/previous held bits and no distinct pointer-cancel
packet. A browser adapter may map cancellation to `held=false, inside=false`;
tests cover that explicit adaptation. It emits no extra edit and does not undo
the already accepted down edit. This is an adapter policy, not a claimed native
browser-cancellation instruction.

## Caret and selection

The text widget uses `184774` on down, `1848e8` while captured and `17e44c` for
release completion. With the bound and point-to-caret query explicitly resolved,
down calls `13f190(model,index,1,1)`, reveals the returned line via `188840`, then
emits kind1/payload0. Held drag calls `13f190(model,index,1,0)` and reveals its
line before kind1/payload1, including when the drag leaves the original bound.
The text widget identity is not a QWERTY key, so these callbacks insert nothing.

Release enters state2. If cursor equals anchor, `18b2f0` collapses selection;
otherwise the selection remains. `updateNativeNicknameTextTouch` emits these
operations without reproducing the model arithmetic. The full native runs
select `da` in `Ada`, then character0 changes it to `A1`; reverse drag followed
by Backspace changes it to `A`. Collapsed tap/drag release is tested separately.

## Digital input

The ordinary manager repeat mask is **0x00f0**. Normalized pressed bits produce
kind4 and reset the repeat counter. Matching repeat-eligible held bits increment
the counter, producing kind6 at20 and every5 thereafter; held produces kind5,
and independent released bits produce kind7. A changed repeat candidate retains
the counter. Inhibit/readiness failures clear the candidate; task flags `0x107`
skip that reset. These cases execute in the original manager.

Touch or capture suppresses normal digital events. Touch alone preserves the
candidate and emits no synthetic release. A transition into capture emits
kind7/mask0x0fff. This differs from the HOME producer, so this module does not
reuse HOME's cancellation or repeat-mask logic.

All12 physical bits were exercised through press,26 held passes and release.
Generic kinds4–7 reach the owner and QWERTY handler, which ignores them in this
ordinary path. No key focus, A-button activation or digital caret navigation is
implemented here. The source evidence does not justify adding those behaviors.

## Verification and open boundaries

`tests/fixtures/native-keyboard-input.json` contains 944 native replay rows:
464 isolated key-widget rows,92 complete routing rows,336 individual digital-bit
rows,13 text-widget rows and39 additional manager-boundary rows, plus47 direct
key identity routes. Its provenance pins the private generators and results.
The narrow test replays widget states, callbacks, requested animations, digital
events, caret routing and the rejected-edit latch against the TypeScript API.

The isolated repeat test deliberately ends at the callback boundary so native
text capacity cannot mask acceleration. Full routing cases execute original
text-model operations with paragraph-cache invalidation as an endpoint. The
text test uses a known single-line caret and the original downstream model.
No source instructions are patched. Hit queries, caret resolution, resource,
font, binding, world and GPU endpoints remain explicit inherited harness limits.

Still open: hardware HID/touch polling and coordinate filtering; native world
hit geometry and glyph-to-caret mapping; text autoscroll; enable-transition
state4/controller timing; modifier/dictionary/language/compose behavior;
footer acceptance/cancellation; physical browser event integration; verified
wall-clock cadence; audio and browser rendering. The source shows centered touch
coordinates and a small-movement filter, but this reducer does not claim their
replay. Browser and full application checks are intentionally outside this
isolated change. The architecture remains OS-owned pure input; no shared
System, scene, renderer or presentation module is changed.
