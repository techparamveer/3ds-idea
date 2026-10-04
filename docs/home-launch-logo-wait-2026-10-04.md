# HOME Launch Logo Wait And C Fade

Runtime `9376f3c9` (integrated in `3ds-home-fidelity-20261001`). This pass
fits the end of the app-launch logo to the frozen native Health launch-exit
capture from the [launch exit pass](home-launch-exit-2026-10-03.md), using
the frame-grid method from the [Open Decide and dwells pass](home-launch-decide-dwell-2026-10-04.md).

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-launch-logo-wait-20261004/`.
Native PNGs: sibling
`native-home-launch-exit-20261003/screenshots/home-launch-exit-20261003/`
(continuous part at 5% playback).

## Visible Defects

The probe (`R/logo-pose-probe-exit.mjs`, which renders every logo pose with
the shipped presenter) fits native N021..N101 to source poses:

- Native plays the looping `NintendoLogo_*_SceneOutB` twice (N052..N071 and
  N072..N092, MAE at most 0.008) before `SceneOutC`. The browser played it once.
- C14's black holds 15.3-17.7 frames on the playback grid (N102..N111)
  before Health's first pair at N112. The browser switched to the app one
  frame after C14.
- During C, native keeps the red swoosh visible while everything fades
  (N095, N098). The browser drew C alone, which zeroed the red at C0 (C
  frames fit only at MAE 1.0-1.7).

## Source

`packs/launch/logo.json` (unchanged): `SceneOutA` (60 frames, group
`G_A_00`), `SceneOutB` (30, looping, `G_B_00`: every child pane but not
`N_W_00`) and `SceneOutC` (15, `G_C_00`: only `N_W_00`, alpha 255 -> 0;
child binding with constant keys, including red alpha 0). Binding C, then B
at its continuing loop pose, lets B win the children while C alone fades
the container.

## Change

Worker `3ds-home-launch-logo-wait-20261004` /
`codex/home-launch-logo-wait-20261004`:

- `84b71867` -> `7eeb7565`: the logo stage plays A, two B passes and C,
  and holds C14 for sixteen frames, so launch is 10 + 31 + 150 = 191 frames
  (3183.3ms). The B pass count stands in for Azahar's title-load wait and the
  C14 hold for the application's first publication. Both are **fitted
  adaptations** (one title, emulator timing). Reduced motion is unchanged.
  Tests that settled a launch within 3190ms now start it earlier or move
  their later timestamps uniformly. A temporary audit of every system call
  found no newly out-of-order timestamp (fewer than at baseline).
- `16ddf4bc` -> `9376f3c9`: during C the logo binds `SceneOutC` then
  `SceneOutB` (continuing loop pose). Native N093..N101 now fit consecutive
  C2..C13 at MAE 0.37..0.007 (`R/exit-logo-fit-cb/logo-pose-fit.json`, SHA
  `0524bb0fbf4cf823e11c50441ba72ab348192f76a5cf4a812127db05b0df4bd5`). Review
  follow-up: `scripts/perf/benchmark.mjs` waits 3600ms after Open.

## Verification

The independent review of `84b71867` found no correctness defect; its
benchmark-wait finding is fixed. Integrated `9376f3c9`: full suite 1994
pass, 0 fail; typecheck and production build pass (`R/tests-cb.log`,
`R/build-cb.log`). `verify-native-system-ui.mjs` passes with C and terminal
launch samples (34 renders).

Recaptures through the muted CDP 9320 browser and preview 3021, each complete
with terminal C14 before the app, errors `[]` and cleanup complete. The
collector (`R/browser-launch-logo-wait.mjs`, SHA `14e25e77...`) takes C14
from (10+31+120+14)/60s and its mode from `LAUNCH_MODE`.

| Run | Pairs | `result.json` SHA-256 |
| --- | --- | --- |
| `R/cb-desktop-physical-a` | 94 | `4680d99589730f76059dbf5c97707e029c48b42026b6f8c3b2f18c1ad659d8bc` |
| `R/cb-mobile` | 91 | `6b60df256fa8d85a1de5daa30f81159105d1d0d20ecd560560be198c6fcf3e1a` |
| `R/cb-reduced` | 20 | `acf4306c4cbf0383106166a4341acebfd012389a05bcacc01a1bac482fd55786` |

The coordinator inspected the pose-aligned exit sheet `R/exit-aligned-sheet-cb.png`
(SHA `b318019f115b31f0252e4b6c252060f7d67a0e6cacb9f65ede0a5a194c5b5f44`):
the B passes, C with the red swoosh fading with the logo, the C14 black hold,
then Health's lower LCD first with the upper fade follow native
N071..N125. Whole-LCD MAE (`R/cb-desktop-physical-a-pair-mae.json`, SHA
`a1eb2581d4dd8fddb3777ac9c617a86599e8bfb4b5e7525ab42e968a479c417d`): logo
pairs lower 0-0.03 and upper body 0.002-0.44, black pairs 0, stable Health
upper 1.30. The first Health pair (N112/B071, upper 5.97) is reveal-pose
sampling. Direct coordinates, zero shift, empty masks; epochs unsynchronized.

## Remaining

The B pass count and C14 hold come from one Health capture on Azahar, and
other titles or hardware load times may differ. The B phase beneath early C
leaves MAE up to 0.44. Audio, exact native epoch, the Health upper-reveal
origin, HUD pixels and whole-scenario acceptance remain open. Whole-scenario
status remains fail.
