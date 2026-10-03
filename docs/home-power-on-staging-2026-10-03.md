# HOME Power-On Staging

3 October 2026, integration base `d305cb9b`.
This follows [power reveal](home-power-reveal-2026-10-02.md) and
[shutdown publication](home-shutdown-publication-2026-10-03.md).
The prior goal turn delivered the Camera confirmation correction; this slice
targets L-01 startup composition and paired reveal publication.

## Captured Defects

Fresh isolated Azahar HOME initialization at 5% speed produces 38 own
400x480 PNGs. Black precedes a paired fade of upper wallpaper/camera hints
and lower toolbar/grid/icons. The top HUD, title banner and lower footer are
absent during that fade, including the bright sample, and appear afterward.
Browser baseline `f0143f1f` correctly lacks the banner but wrongly includes
the settled HUD and Manual/Open footer beneath the fade.

Normal and reduced browser controls present source pose 20. A bounded 700 ms
main-thread stall beginning at pose 2 makes both modes jump from pose 2 to
HOME without presenting pose 20. This is a browser robustness experiment,
not native cadence or a measurement of physical boot latency.

## Implementation

`ce493657` integrates worker `06ddbb89`: the existing HOME painter withholds
HUD and footer while the system phase is boot. Wallpaper, camera hints,
toolbar, grid, icons, paired source fade and banner ownership are unchanged.
Ordinary HOME and all non-boot routes keep their prior behavior. The independent
native HUD/footer SceneIn caller and exact onset remain untraced: this
phase-based selection is a capture-supported adaptation, not full animation
acceptance or a new native timing claim.

`ee38f862` integrates worker `54f6dd35`: the scene holds an overdue boot
until its terminal native LCD pair has been successfully painted and rendered
while visible, awake and context-live. The receipt is scoped by boot start
and graphics-context generation, revoked on hide/sleep/context changes, and
cannot come from diagnostic or failed paints. Retirement occurs on a later
animation callback, not a second render that overwrites the first in one
callback. Pure reducer durations and authored source poses are unchanged.

Review caught an unavailable-overlay path that otherwise waited indefinitely.
`1b0655be` (worker `6ecc051c`) makes awake boot a required native screen,
publishing paired authored host recovery on failure and no success receipt.
Boot recovery offers Retry only; successful retry restores the native receipt.
Sleeping remains inactive. `cbfaa053` (worker `3037ccc6`) aligns the spoken
announcement with that Retry-only policy. Normal boot input remains blocked;
no recovery escape is misrepresented as successful native publication.

## Fixed Staging Comparison

Runtime `ce493657`, `after-staging-desktop/frame-004` (source pose10) and
`frame-008` (pose20), against the fixed native samples below. Before is
`before-desktop/frame-004` / `frame-008`, runtime `f0143f1f`.
Delta2, empty masks, no registration, color fitting or nearest-phase search:

| Diagnostic | Before pixels over2 | After pixels over2 |
| --- | ---: | ---: |
| Pose10 upper HUD region | 3747 | 6 |
| Pose10 lower footer region | 8598 | 0 |
| Pose10 whole pair | 22153 | 9814 |
| Pose20 upper HUD region | 4842 | 832 |
| Pose20 lower footer region | 8598 | 0 |
| Pose20 whole pair | 27831 | 15223 |

Both lower footer regions have maximum delta1 after the change. Upper
wallpaper epochs and title population remain different. At each source pose,
all browser pixels outside HUD/footer are byte-identical before versus after.
The coordinator opened the side-by-side sheet and independently verified all
77 final bundle records. Whole pairs remain fail, including the six midfade HUD
edge pixels and all other unexplained residuals.

Frozen staging report `R/power-on-staging-comparison-report.json` SHA-256:
`c856495426fbf7a2cc2aa0ff6a08f00bade90d7bf0cc85244f3245934a3a9815`.
Its adjacent manifest, sheet and `verify_power_on_comparison.py` retain
individual input/output hashes and the fixed capture identities. This is
staging evidence, distinct from final-runtime publication tests.

## Production Checks

Final runtime `cbfaa0534718ff0294f17ebe99349bf2466e1779`; test-only
`a7f3d87a` updates the older source-policy assertion for required boot overlays.
The initial final-suite run had that single stale assertion failure, retained
in `R/npm-test-final.log`; it is not relabeled. The rerun passes1911 tests,
zero failures,23 skipped,one TODO (1935 total). Production build and serialized
typecheck pass; no shader/material change. Independent scene/LCD checks40,
OS paint/input checks72 and announcement checks4 pass after review fixes.

`capture-boot.mjs` uses Camera selection, HOME, Power/Enter, then Power from
off. Five final routes return ready HOME, remain muted and have empty page
errors. Source pose20 is actually presented before HOME in all five:

| Private run | Raw sampled pairs | Boot source poses |
| --- | ---: | --- |
| `final-desktop` | 9 | 0,3,6,9,11,14,17,20 |
| `final-mobile` | 10 | 0,2,4,7,10,13,16,18,20 |
| `final-reduced` | 13 | 0,2,3,6,9,11,12,14,15,17,18,20 |
| `final-stall` | 4 | 0,2,20 |
| `final-reduced-stall` | 4 | 0,2,20 |

Sample counts include one HOME pair, not native frame cadence. Both baseline
stall runs lacked pose20 entirely. Desktop's final run lacks pose10; no nearby
pose substitutes for the frozen staging comparison. Coordinator inspected
desktop/mobile viewport screenshots: sourced console and both LCDs remain
visible, framed and unobscured. These are browser checks, not native acceptance.

`final-context` records real WebGL loss/restoration. Restoration at9330.2ms
precedes a context-live terminal boot render at10366.4ms, then HOME at10378.4ms.
Its raw terminal pair is retained; subsequent HOME is presentation metadata,
not a saved raw HOME pair. `final-close-controls` completes eight Work/About/
Health controls. `final-shutdown-context` retains103 paint/presentation samples,
restores the graphics context, displays terminal shutdown at1598.5ms, then
enters off and restarts. Its `frame-099` raw upper/lower RGB extrema are all0,
preserving the prior native-black endpoint. These timestamps are browser time.
All controls remain muted with empty page errors.

The final terminal supplement compares the six named raw terminal pairs to
the same fixed native bright frame. Footer maximum remains1 in all six;
whole residuals over2 are desktop14702, mobile14928, reduced16818, stall15454,
reduced-stall16818 and context16936. Lower LCDs are byte-identical to the
staging terminal; upper wallpaper epochs differ. All remain fail without masks.
The coordinator opened the final sheet and independently verified150 records.

| Final artifact under R | SHA-256 |
| --- | --- |
| `power-on-staging-comparison-manifest.json` | `a027c670b51b197130882de0ca125809428396cc83dfe3138a4827215114cad4` |
| `power-on-final-terminal20-report.json` | `4b572cdbb8f2bd7096014db8530c96ed597ff30e369ed8e814f37c232302dc92` |
| `power-on-final-terminal20-manifest.json` | `5ea45fc07ec191bc07294700e29b76d7464140beb8d9deba834af1405ecc1b2d` |

## Evidence Identity

Private R:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/power-on-20261003`.
The native own PNG directory is sibling
`native-folder-switch-20261002/screenshots/power-on-20261003`.
Fixed native samples are `_03.10.26_04.02.28.513.png` for midfade and
`_03.10.26_04.02.33.242.png` for the bright base before HUD/footer.
Do not search for a best-matching native epoch or infer duration from filenames.
Whole raw LCD pairs use empty masks. HUD `[0,0,400,24)` and footer
`[0,212,320,240)` are diagnostic regions, not acceptance exclusions.

`R/native-input-record.md` records executable/config identity, request batches
and limits. The exact private executable is SHA-256
`3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`.
EUR original hardware mode, Static input 2, Null output 1 and volume 0 were
verified before launch. Native PID9233 exited 0; config was restored byte-exact
to `d2118bc611142e0febb95415bb45487fe83b36c407b6cdad869a01697e92e698`.
Default profiles, hardware media, system audio and unrelated apps were untouched.

Native is a direct HOME-title initialization; browser is a warm Off/On restart
after selecting Camera. These are not identical input histories. Population,
clock and animation epochs differ. The slowed native capture proves observed
ordering, not physical backlight or power-button behavior. All audio is muted.

## Sources And Limits

Paired fade -> `home.common` -> `CmnFadeNinLogo_U/D_00_SceneIn`; withheld HUD ->
`home.hud` -> `HudMenu_00`; withheld footer -> `home.launcher` -> `LncBtmBtn_02`.
All retain pinned HOME title `0004003000009802` v24576, content 0 / `00000082`.
The [reveal source chain](workstream-handoffs/home-power-reveal.md#native-element-and-provenance-mapping)
records common pack/archive/member hashes and converter `ctr-native-web` 1.2.0 /
CTRTool 1.3.0, distinguishing encrypted CIA from manifest title-level identity.
No firmware asset, native graphic, font or cue is replaced or reconstructed.
The staging report's inherited `cia_sha256` field `2863c6c4...` is the manifest
title-level identity, not a newly verified encrypted CIA hash. The source
handoff separately records encrypted CIA
`011d0276fb947315ef06f385cdb444f5e194d23573caf0e3efbeb2c82673654e`.
Its common/HUD/launcher pack and member mappings remain unchanged.

Strict scenarios remain fail. Normal 3000/350 ms boot/reveal and reduced
300/120 ms remain host adaptations. Native HUD/footer entry clips, exact
input/epochs/motion/audio, physical indicators/backlight and whole HOME
pixel fidelity remain open. Preserve the other existing app designs.

## Cleanup

Dedicated muted Chrome PID13012 closed, launcher exited0, exact PID absence
verified and CUA session ended. Native PID9233 remains absent; its original
configuration hash was rechecked unchanged. The frozen input record includes
cleanup and each run's route limits. Bound agent-browser checks find expected
console controls, no framework overlay and ready/muted true. Preview3021
remains HTTP200 intentionally; system audio and unrelated applications remain
untouched. No private matrix or DeveloperStorage artifact writes.
