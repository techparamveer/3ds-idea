# Live HOME controls: System integration review

2026-09-23. Reviewed integration `7148e2a` against the `b28f3cf` contract,
then merged and tested the coordinator's fixes through `57cb65f`.
This change adds only `tests/home-controls.test.mjs` and this note.
No additional actionable implementation defect remained in this bounded review.

The 16 tests exercise the public System routes with native controls enabled.
The existing `home-scroll-consumer.json` oracle checks all 78 source polls,
including 20/5 repeat timing, acceleration, pending replay and release.
Scalar and batched execution compare every pass's navigation, retained
controllers and ordered journal. At source poll30, the banner resolves slot4
before replay selects slot5. Other checks cover quick clicks, browser repeat,
toolbar A/Start and grid touch handoff, departed effects, primary retention,
overlay/sleep/blur cancellation, reduced motion, persistence and fallback.

Close tests apply the existing
[combined restoration evidence](../scripts/firmware/CLOSE_PRIMARY_RESTORATION_EVIDENCE.md):
the primary shows and resumes Loop at C+18, retaining its child position during
offscreen restoration until C+23 or C+28. Real event7 reaches the owned close
session. Viewport press/repeat events preserve pending markers and valid
navigation ownership; true closing and stale identities reject them.
A pending marker without an initiating direction survives completion without
replay, then clears on event7, consistent with the serviced-marker-only clear
in the [acceleration evidence](../scripts/firmware/CURSOR_ACCELERATION_EVIDENCE.md).

Regression coverage includes the coordinator's fixes for zero-update reduced
motion, gesture-origin cancellation order, chrome cursor visibility, toolbar
touch focus and viewport input ownership. Toolbar-to-grid touch remains an
explicit browser policy; these tests do not establish its native full lifecycle.

Validation on the runtime worktree:

- `node --test tests/home-controls.test.mjs`: 16 passed.
- `npm run typecheck`: passed.
- `npm test`: 716 passed, 39 failed, 5 skipped. All failures are model/GLB
  tests reading unhydrated Git LFS pointers (JSON, magic or length failures).
  HOME, System, controller and painter tests passed. Model assets were untouched.

Existing fixtures were reused; no new firmware execution, browser session or
Azahar session was run here. Browser verification belongs to the coordinating
task. These checks establish counted System behavior, not visual parity,
audio delivery, complete scene scheduling or a measured hardware refresh rate.
