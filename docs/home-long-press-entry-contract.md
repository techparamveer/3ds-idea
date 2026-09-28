# Stationary long-press widget extension

The integrated authority is [GRID_LONG_PRESS_EVIDENCE.md](../scripts/firmware/GRID_LONG_PRESS_EVIDENCE.md),
commit `0d49f75`, following the unchanged43-case ordinary audit. New private
report SHA-256: `6e3c97e8524829e2173df5b4cca2f2fabe78eef1f6b3ff8a230ec48c52ff863a`.
Its16 sequences stop occupied H21 at the pickup-resource handoff. They do not
prove a completed pickup pass or mode14 behavior.

Runtime owns only the pure `home-tile-widget.ts` extension, focused tests/new
compact fixture and its validation note. Root owns all host/System/gesture/
scene changes; presentation owns the painter. Keep the previous43-case fixture
unchanged and replay it in addition to the new16-case source data.

Add `longPressFlag: boolean`, preserving the source's distinct widget state,
count, capture and controller fields. Extend callback values to0/1/2/3/4.
H20 equality reverses Select without setting the flag; H21 greater-than sets
the flag, resets heldCount and emits3. Release is checked before increment:
release after H19/H20 still starts Decide and accepts at R+3. In the flag1
branch, held input does not hit-test or increment; release clears state/flag
and emits4, without Decide. Preserve idle/reset/setEnabled distinctions from
the source leaves, explicitly separating static leaf evidence from executed
case coverage. Do not infer that an occupied handoff may resume like vacancy.

For API compatibility keep `unsupportedLongPress` in the result but return
false for this now-supported threshold slice. No host pickup, candidate,
navigation, sound guess, mode14 or authored450ms gesture logic belongs here.
Root has widened its callback journal type; callback3/4 hosting remains a
separate integration change. Commit this independently so the coordinator can
review and integrate with its matching host boundary.

Tests must retain input-before-2D ordering, Select→Decide binding order, exact
H19/H20/H21 and release-after-threshold behavior, stopped occupied H21 versus
completed vacant H21, callback4 and subsequent capture cleanup. The new fixture
must carry provenance and explain supplied metadata/resource endpoints. Report
any uncovered lifecycle branch instead of extending the audit or guessing.

The assets task separately traces the occupied continuation and first mode14
pass, with resource installation clearly marked as a supplied endpoint if it
cannot execute. Full drag/drop and broader application conversion remain out
of this bounded contract. The existing user goal already authorizes this work;
the evidence note's need for a separately traced lifecycle does not introduce
an additional approval requirement.
