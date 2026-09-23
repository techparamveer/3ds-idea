# Retained primary HOME cursor Loop

The primary `LncCsr_00_Loop` now has a controller retained by System. It advances
from eligible shared HOME update counts, rather than deriving phase from elapsed
milliseconds. The ordinary source step is 1. Native mode3 acceleration and its
counter remain outside this change.

## Source and interface

The implementation follows the agreed
[integration contract](native-cursor-clock-contract.md) and
[cursor clock evidence](../scripts/firmware/CURSOR_LOOP_CLOCK_EVIDENCE.md).
The subsequent [input event evidence](../scripts/firmware/HOME_INPUT_EVENT_EVIDENCE.md)
identifies event7 as release or cancellation, not a new Loop epoch.
Source executable SHA256:
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.

`home-cursor-loop.ts` exports `HomeCursorLoop`, `createHomeCursorLoop`,
`advanceHomeCursorLoop(state, updates, eligible)` and
`getHomeCursorLoopFrame(menuState, reducedMotion = false)`.
System owns an immutable `homeCursorLoop` with `currentFrame` and
`appliedFrame`, both initially 0. An eligible update submits current, then adds
float32 1 and wraps before 60, preserving the native controller's
`0x269430` submission before `0x1bbd94` advancement. Thus update1 gives
applied0/current1, update60 gives applied59/current0, and update61 gives
applied0/current1. Large ordinary integer batches use the exact 60-update period;
fractional source fixtures retain individual float32 steps.

Zero or ineligible updates preserve the same state object. Sampling returns
`appliedFrame`, or 0 for reduced motion and legacy System-less callers, and
never advances anything. Neither field is saved in preferences. Settings
restoration, layout reset, selection, density, folder navigation, software
suspension and return retain the controller. Fresh System construction and
off→boot create a new controller; opening/canceling the power panel does not.

## Visibility and update ordering

`home-cursor-visibility.ts` owns `getHomeCursorSlot`. Both System clock eligibility
and `getHomePresentation`'s per-tile cursor flag consume this same helper. It
uses the existing gesture preview and exact horizontal tile culling boundary,
without importing System or presentation at runtime or allocating another tile
array.

The controller freezes when HOME is inactive, sleeping or covered by an overlay,
while normal folder close or its viewport restoration is incomplete, during a
scroll gesture, and when dragging without a visible valid drop cursor. It also
freezes while the selected/pressed/drop tile is outside the painted tile set.
Reduced-motion presentation samples 0 while the visible logical controller
continues to advance. Hidden-page suspension remains scene-owned: the scene
omits shared ticks, and input release rebases the clock on resume.

The ordering adopted here is lower navigation work followed by cursor layout
submission. For a close completing inside a batch, only the retained exact
`selectionReadyAtUpdate` boundary and its visible tail count. **The completion
update itself is eligible.** A visible-root close beginning at C therefore
first resumes the cursor at C+18; an offscreen close using the current explicit
10-update viewport policy resumes at C+28. Updates before that boundary cannot
be charged merely because the final batch state is visible.

For ordinary navigation, the adapter examines each bounded motion update
(currently at most16), so a target appearing mid-scroll counts only visible
updates. It then consumes the remaining stable interval in one operation.
Reduced-motion navigation retains the existing immediate-settle policy.
Repeated calls with the same clock timestamp submit no additional cursor frame.

This does not rewrite wall-time gesture recognition. Press-to-drag, hover and
edge transitions still occur at their existing `tickHomeGesture` mutation
boundary after shared-clock advancement. A large batch spanning an unobserved
wall-time gesture threshold is not claimed equivalent to many gesture ticks.
The counted close boundary and ordinary counted navigation motion are tested
for partition equivalence.

The visibility policy is the application's shared presentation policy. Native
evidence establishes hidden-layout phase retention, but does not prove every
overlay/gesture gate or scene lifetime above. The shared clock remains the
provisional nominal 60 Hz adapter; no native wall-clock, full APT lifecycle,
offscreen-helper update schedule, cursor acceleration or generic CLAN rounding
claim is introduced. Read-only captures and extra paints cannot tick System.

## Verification

The focused suite passed **83 tests, zero skips**, including 11 new cursor tests
and the existing close, banner boundary, navigation history/motion, gesture,
presentation and folder-input tests. Type checking passed. The new tests cover
0/1/59/60/61/121 updates, large integer and fractional source phases, hidden/show
retention, repeated timestamps, batching, selection/density/folder histories,
mid-batch geometry visibility, both close completion boundaries, reduced motion,
sleep/overlays, app suspension, persistence/reset, power-session reset and actual
scroll/drag/drop System input routes.

```sh
node --test tests/home-cursor-loop.test.mjs tests/home-folder-close-system.test.mjs tests/home-banner-close-boundary.test.mjs tests/home-navigation-history.test.mjs tests/home-navigation-motion.test.mjs tests/home-gestures.test.mjs tests/home-presentation.test.mjs tests/home-folder-input.test.mjs
npm run typecheck
```

The test log is on the supplied SSD at
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/runtime/reference/cursor-loop/system-tests.log`.
Presentation owns the explicit frame binding and its tests. Root owns combined
browser/native comparison; this worker did not access browser or Azahar sessions,
change public assets or author changes to screen painters or architecture notes.
