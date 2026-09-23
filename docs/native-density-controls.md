# Native density toolbar availability

2026-09-23. The native toolbar now uses the source-proven availability rule
for both appearance and touch activation: decrease is enabled above target
density0 at root or target density1 in a folder; increase is enabled below5.
The source is the separately committed
[original-ARM/resource evidence](../scripts/firmware/DENSITY_TOOLBAR_EVIDENCE.md),
implemented under the [density-control contract](native-density-control-contract.md).

`home-density-controls.ts` derives both booleans from the active navigation
context and pending target. It is read-only and owns no clock or state.
`firmware-presentation.ts` binds genuine `LncBase_D_01_Invalid` at local
frame0 to disabled `G_Dw_00`/`G_Up_00` groups. That resource sets the corresponding
icon alpha to120. Disabled groups receive no pressed Select binding. No fade
duration, color or texture adjustment is introduced.

The narrow density-button branch of `state.ts::touchMenu` uses the same helper
and returns the original state for a disabled activation. Enabled taps retain
the existing density transition. Palette/Miiverse bindings, other toolbar
groups and clipping remain unchanged. The generic density setter, compatibility
zoom commands, history records, System lifecycle and public resources are unchanged.

Folder density0 is a valid saved/native geometry state even though the ordinary
folder decrease button stops at1. Restoring it keeps its one-row geometry at
Y161 with72px icons. This patch does not globally clamp or rewrite it, and
compatibility zoom commands remain outside the native toolbar behavior claim.

## Verification

[home-density-controls.test.mjs](../tests/home-density-controls.test.mjs)
covers the helper, actual presenter, actual posed firmware resources and
System touch down/up:

- Root0/1/5 and folder0/1/2/5 select the expected availability, including
  restoration of folder0. Calls preserve source state.
- Pending transitions in both directions use the target while current and
  fractional density differ. Pressed poses also follow the target immediately.
- Genuine Invalid group bindings produce120 only on the disabled icon;
  other leaf panes retain their baseline pose. Disabled press backings stay
  hidden, enabled Select remains group-isolated, and an unrelated Memo press
  still works beside the disabled folder decrease control.
- Disabled direct taps return the identical state. Real System down/up leaves
  selection, history, layout, revision and navigation motion unchanged,
  including pending motions. Enabled taps keep mode5 and the existing15-update
  duration. Source decoded resources remain unchanged.
- Saved folder0 restores its exact tile geometry. Generic `setHomeDensity`
  and compatibility `zoom-in` still accept folder1→0.

The focused suite passed **104/104, no skips**, followed by
`npm run typecheck` and `git diff --check`. Suites included density controls,
menu, gestures, navigation history/motion, presentation, renderer, retained
cursor and empty-slot opacity. The optional SSD CPU Canvas runtime was enabled.

This checkout's shared dependencies lacked `fake-indexeddb`, needed by an
existing gesture suite. For verification only, version6.2.5 was installed in
the private SSD test directory, with a Node resolution hook for that package.
No repository dependency manifest, lockfile or shared dependency directory was
changed. Logs and the loader remain at:

```text
/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/presentation/native-density-toolbar/
  implementation-focused.tap
  implementation-typecheck.log
  test-runtime/register.mjs
```

Native disabled widgets have a separate invalid-hit route; this implementation
suppresses ordinary selection/activation without inventing its unresolved sound
behavior. Native physical hit-box edges, complete controller/APT lifecycle and
browser pixel parity are outside these tests. Existing toolbar hit-region
boundaries are preserved. Root owns actual native/browser recapture and combined
integration/build verification; this worker used no browser or Azahar session.
