# Retained HOME controls in the screen painter

2026-09-23. `screens.ts` now consumes `System.homeControls` when native
presentation assets are available, following the
[live-controls contract](native-home-live-controls-contract.md). This change is
limited to painting; the root-owned `home-controls.ts`, System and scene retain
all input routing, visibility requests, lifecycle and counted updates.

## Retained group and draw boundary

The grid painter restores its tile clip, then draws these retained layouts in
order before the existing arrows:

1. Primary through `cursorAt`, when `primary.layoutVisible` is true.
2. Effect0 through `cursorEffectAt`, when its own `visible` flag is true.
3. Effect1 through `cursorEffectAt`, when its own `visible` flag is true.

Primary position comes from `primary.center`, Scale from
`presentation.primaryScale.appliedFrame`, and Loop from the retained
`System.homeCursorLoop.appliedFrame`. Each effect uses its own center and applied
Scale/DisAppear frames. Current frames, target slots, density and paint elapsed
time are not substituted for these submitted poses. Effect terminal status does
not independently hide an otherwise visible layout; the host owns that update.

This placement permits toolbar centers above the grid clip and departing effects
whose tiles have been culled. The primary is drawn once, independently of the
selected tile's visibility. The existing toolbar, plate, folder chrome, grid,
arrows, balloon, footer and overlay ordering is preserved around this bounded
group. The wider native layout order remains unverified.

## Gates and compatibility

The whole retained group is suppressed during background capture, with power
off, outside active HOME, during sleep, with a panel/dialog/preferences overlay,
or during an authored grid **scroll/drag** gesture. Ordinary grid press preserves
the group; see [retained tile touch painting](native-tile-touch-paint.md).
Scroll/drag suppression is an explicit browser adapter policy, not a native
gesture-parity claim. It reads the raw retained
`System.homeNavigation.gesture.area`; the derived presentation gesture does not
include that area. These drawing gates do not mutate the retained controllers.

Chrome gestures preserve the retained primary and effects. This includes
disabled density presses, whose toolbar pose remains unchanged, and enabled
presses, which can change the toolbar's own Select pose. The originating area
remains authoritative if a chrome gesture moves into grid coordinates. This
corrects the initial contract's blanket gesture suppression and preserves the
existing [disabled-density appearance](native-density-controls.md).

Normal folder close does **not** add another suppression condition to native
controls. The painter reads actual `primary.layoutVisible`, not `request`,
`shown`, the selected tile's cursor predicate or `isSystemHomeFolderClosing`.
The host can therefore show the retained child position during root viewport
restoration and update it when its source boundary is reached. Effects retain
their independent visible flags.

Reduced motion draws the primary with Loop0 and omits both effects as an explicit
accessibility policy. It does not change applied Scale, visibility or controller
state, so ordinary drawing can resume from the retained poses.

Without native assets, or for native-asset callers lacking `homeControls`, the
existing tile cursor path remains in place. Its native draw failure still uses
the procedural fallback. With native assets and retained controls, that old path
is disabled even when the retained primary is hidden, preventing duplicate or
replacement tile cursors.

## Validation and limits

`node --test tests/native-home-controls-paint.test.mjs
tests/native-cursor-presentation.test.mjs tests/home-cursor-presentation.test.mjs
tests/home-primary-cursor.test.mjs`: **40 passed, 0 failed, 0 skipped** at the
initial integration checkpoint.
`npm run typecheck` passed after merging the root-owned `7148e2a` dependency.

The 14 new painter tests execute the real screen painter with a Canvas recording
fixture and injected native draw endpoints. They check applied fractional poses,
primary/effect ordering, restored clip state, culled selections, toolbar and
offscreen centers, actual visibility independently of request/shown flags,
terminal effect poses, repeated read-only paints, reduced-motion toggling, root
capture exclusion, active close, lifecycle/overlay/gesture gates, and legacy and
missing-asset fallback. Existing focused tests cover the native resource bindings
and retained controller contracts.

Logs are on the SSD at
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/presentation/live-home-controls/`.
No System, scene, input, clock, controller or resource edits belong to this
painter commit. No browser or Azahar session was controlled and no new source
research was performed. These tests establish caller ordering and state use;
actual browser rendering and visual parity remain root-owned verification.

The earlier grid-only correction added four painter cases: chrome press/scroll, disabled
root0/folder1 decrease and root5 increase presses, and enabled decrease/increase
presses. The density cases run the actual toolbar presenter and pose the actual
firmware layout beside the screen painter's retained control calls. Disabled
presses preserve both outputs; enabled presses add only the expected toolbar
Select binding while retaining primary/effects. The focused density suite also
checks that this Select pose is isolated to its control's native group.

The five-suite follow-up (the four above plus
`tests/home-density-controls.test.mjs`) passed **49 tests, 0 failed, 0 skipped**,
and `npm run typecheck` passed. Logs are `chrome-gesture-focused.tap` and
`chrome-gesture-typecheck.log` in the same SSD directory. This tests retained
paint snapshots; root owns the corresponding host request gate and actual LCD
verification. No System or controls implementation was changed here.
