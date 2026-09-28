# Accepted toolbar-to-grid touch selection

The existing `TOOLBAR_CURSOR_EVIDENCE.md` and five accepted-touch records in
`presentation/native-toolbar-cursor/verified/checked.json` already prove the
accepted selection fragment `0x2a4bb8..0x2a4d28`, including old toolbar focus.
Earlier hit/manager eligibility remains outside that fixture. Do not describe
the accepted fragment itself as wholly unverified.

Runtime owns a bounded extension to `selectHomeTouchSlot` in
`home-scroll-consumer.ts`, its focused fixture/tests and a validation note.
Retain the current signature and explicit ordinary-idle acceptance boundary;
do not host raw touch recognition. Root owns `home-controls.ts` and System.
The previous toolbar rejection may now be removed for an accepted tile.

Follow the executed fragment: save departed focus/Scale, clear toolbar-active
and current-focus fields, seek primary Scale to current density, emit the
departed toolbar effect, then perform existing viewport correction. Preserve
fields the source does not write. Inspect the existing excerpt for remembered
focus/saved-column writes instead of assuming the directional-return branch.
Do not add cues or controller updates unless the accepted fragment proves them.
Keep busy/gesture and invalid-input behavior explicit.

Compare all five original accepted cases, including anchors/Scale and relative
observation order. Add root/folder and viewport-boundary composition coverage
without claiming those additions are newly executed native cases. Preserve
all existing direction/mode3 tests and immutable state. No System, scene,
painter, raw sampler, browser, Azahar or new broad source research. Report exact
field writes and any missing evidence before guessing a required behavior.
