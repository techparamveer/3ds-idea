# HOME Launch Open Decide And Fitted Dwells

Runtime `7a44bff9` (integrated in `3ds-home-fidelity-20261001`; recaptured at `d910fbfe`). This pass
adds the Open button's source press/release feedback before an app launch,
then fits the two launch holds that the browser lacked against Azahar's frame
grid. It reuses the frozen 150-PNG native capture from the
[launch onset pass](home-launch-onset-2026-10-03.md).

Private roots:
`R1=/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-launch-open-decide-20261004/`,
`R2=/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-launch-dwell-20261004/`.

## Visible Defects

- The native Open footer turns pressed-dark at N065 and white at N070 on
  intact HOME, before exiting with the fade from N074. The browser started
  the footer SceneOut immediately with the idle tone (footer MAE 45.8364 in
  the [ring pass](home-launch-ring-2026-10-03.md)).
- Native holds exact black for seven captures (N086..N092) before the first
  logo pixel. The browser drew logo pose 0 one frame after fade pose 20.

## Source

HOME `0004003000009802` v24576, manifest `home.launcher` ->
`packs/home/launcher.json`, layout `LncBtmBtn_02` and clip
`LncBtmBtn_02_Decide` (6 frames). Offline probe `R1/footer-pose-probe.mjs`
draws each candidate footer pose over native lower LCDs (report SHA
`d7a7d4bb42544c4b032af6002eb9e68bd2a81e79b95a863ae1200e4afda7080b`):
N065..N069 match Decide frames 0..4 (strip MAE 0.354) and N070/N072 match
Decide5 (0.023). `Decide2` and `Select` poses do not fit. The fade is common
`CmnFadeNinLogo_*_SceneOut` (21 poses, alpha hermite 0 -> 255) and the logo is
`NintendoLogo_*_SceneOutA/B/C` from `packs/launch/logo.json`; neither pack
changed.

## Native Time Base

The capture spacing (about 500ms) is not frame timing, but its poses are:

- Upper mean luminance of N074..N086 equals the source fade poses
  1, 3, 4, 6, 7, 9, 11, 12, 14, 16, 17, 19, 20 (error at most 0.1).
- `R1/logo-pose-probe.mjs` renders every source logo pose with the shipped
  presenter and fits N084..N149: N093..N149 match poses 1..87 at MAE at most
  0.007 (report SHA
  `d4f4e72f3a8e6af4c0252b365b9ac2fbcf34f7a7bfd1ca5bca9cfd6883d246c2`).

Both segments advance at a steady 1.5-1.6 poses per capture (about 323 and
338ms per emulator frame). On that grid, fade pose 0 starts five or six frames
after Decide5 first shows, and logo pose 0 starts about 10.7 frames after fade
pose 20. The capture replayed its CTM at a fixed 5% playback speed (one
emulator frame per about 333ms; observed movie counters 1101..1328 span
338.4ms per frame), which supports a constant rate between segments. Native
dispatch remains untraced.

The CTM plan (`home-launch-onset-20261003/native/home-health-launch-onset.plan.json`
beside `R1`)
holds A for HID samples 4680..4688 (8 samples of 4.27ms, about two video
frames from frame 1200). Mapping capture times through the observed
counters, which lag screenshots, places pressed onset no earlier than frame
1200 and Decide5 at frame 1206 or later, so native pressed lasts about six
to nine frames against the browser's five. A Decide starting at A-down sits
at the edge of that bound, so whether native plays Decide from press or
release is unresolved; the browser keeps its press-triggered launch.

## Change

- Worker `1b85c1b4` -> `f4aa0af8`: an eligible retained launch binds
  `LncBtmBtn_02_Decide` 0..5 on the launching button group (pressed through
  Decide4, Decide5 held), and SceneOut follows it. Missing Decide fails the
  paired draw.
- Worker `2be8c536` -> `e0e41dea`: the fade and decide ring also wait for
  the Decide, so HOME stays intact during it (launch 2200ms). Review
  follow-up `ac135984` -> `8732f3a2` puts the logo-less fallback fade on the
  same schedule.
- Worker `3ab0e79a` -> `d910fbfe`: the launch is 10 + 31 + 105 nominal 60Hz
  frames (2433.3ms): six Decide frames plus a four-frame Decide5 hold, the
  21-pose fade plus ten frames of held black, then the unchanged logo clips.
  Footer SceneOut and the ring start with the fade (`LAUNCH_FADE_START_MS`).
  Both holds are **fitted adaptations**. Reduced motion (120ms) is unchanged.
  Tests that settled a launch 2100-2200ms after starting it now start the
  launch earlier, so their later timestamps keep their order.

## Verification

Independent reviews found no correctness defect in `1b85c1b4`, `2be8c536` or
`3ab0e79a`. They flagged the fallback fade, the stale `verification.md`
contract, three tests whose shifted launch preceded an earlier event, and
exact 60Hz grid samples flooring one frame late under the fractional origins.
All are corrected; `299f91bb` -> `7a44bff9` adds the HOME clock's epsilon and
a whole-grid assertion. It changes only exact-boundary samples, so the
`d910fbfe` capture remains valid. Integrated `d910fbfe` and `7a44bff9`: full
suite 1994 pass, 0 fail, 23 skip, 1 TODO; typecheck and production build
pass (`R2/tests.log`, `R2/build.log`). `verify-native-system-ui.mjs` passes
with the new launch samples (32 renders).

Desktop A-input recaptures through the muted CDP 9320 browser and preview
3021, each complete with terminal C14 before the app, mute, errors `[]` and
cleanup complete:

| Runtime | Run | Pairs | `result.json` SHA-256 |
| --- | --- | --- | --- |
| `e0e41dea` | `R1/after-stage` | 71 | `bc4d39783fc4eac6ece124cb6ad3eea419f4ebf395fe5bf82fb201295e5db47c` |
| `d910fbfe` | `R2/after-desktop` | 80 | `5346cf3f8983ec76ab79ca44549d065ba95664d69f1e8ac20c6d8239b8c177ab` |
| `7a44bff9` | `R2/after-mobile` (390x844) | 83 | `627e9f6232c48d387988bef07ae8c802f0fec648edf5b290bf24282ca5f55b81` |
| `7a44bff9` | `R2/after-reduced` | 20 | `448e03d51edead070eb7f1735e6174b45ca50240b17a2c5bbdd2dbff1dc77cf3` |

The dwell collector (`R2/browser-launch-dwell.mjs`, SHA `393b0558d52be014...`)
only moves the C14 threshold to (10+31+104)/60s. Its mode comes from `LAUNCH_MODE`;
reduced motion accepts any launch presentation as terminal. Mobile upper
luminance follows the desktop stages (intact through 146ms, fade from 188ms,
black 513-704ms, logo after); reduced paints one black + B15 pair, then the app.

The coordinator inspected `R1/stage-sheet.png` (SHA
`f06818f984581b18133a8947d86dfe715e1bb6d69fa92ca3636fb9fbe5f75374`) and the
pose-aligned `R2/aligned-sheet.png` (SHA
`d78ef42913620deb36fa7623f78014aac3cc08b78d823cc6043ce92da63b19b1`): browser
Open pressed B002 (70ms), white on intact HOME B003..B004 (120-170ms), fade
with footer exit and ring from B005, exact black B011..B015 (503-686ms), first
logo B016, matching native N069..N096 in order. Whole-LCD MAE for
pose-matched pairs (`R2/after-desktop-pair-mae.json`, SHA
`6c717bec29563ceabe03b9704c4fed8ab2951d0bbc626e08bb6f8d96457ea883`): lower
0.58-2.63 and upper body 1.45-3.37 on HOME poses, 0 on black, 0.03-0.38 on
early logo poses. Pairs one or two fade poses apart (N074/B005, N079/B007)
reach 12.6-18.1, which is sampling. Direct coordinates, zero shift, empty
masks; epochs unsynchronized.

## Remaining

Open pressed duration and A-down vs A-release vs touch-release are
source-identified in [open press](home-open-press-2026-10-04.md): five 2D
submits of Decide 0..4 on A-down / touch-release, matching the browser. The
CTM six-to-nine bound was screenshot lag, not a `lastFrame`. The fit
places fade pose 0 five frames after Decide5 (native five or six) and logo
pose 0 eleven frames after fade pose 20 (native about 10.7); either may be
one frame off. Open tone/audio timing, exact native epoch, native mobile/reduced
comparison, HUD pixels and whole-scenario acceptance remain open.
Whole-scenario status remains fail.
