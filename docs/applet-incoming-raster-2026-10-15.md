# Title incoming raster reuse

## Change and checks

Runtime `7cadf117733f4c0ad74505011e6345a6ae0af8e6` opts only the validated
Friends and Notifications incoming background panes `P_Bg_U_00` and
`P_Bg_D_00` into the existing opaque-alpha raster cache. Animation clocks,
source poses, draw order, assets, guards, cache bounds and disposal are unchanged.
The [source handoff](workstream-handoffs/applet-incoming-raster-20261015.md)
contains the exact source identities and validation limits.

Independent source review has no actionable findings and reproduces the three
intended failures on the base. All 34 focused checks pass, including a root
rerun after capture. All 42 title poses compare 200 Canvas sources and
34,109,440 RGBA bytes exactly against the opt-out route. Those tests do not
implement destination rasterization, filtering or native text ink.

Full checks have 2,987 passes, the unchanged missing historical Camera PNG
failure, 102 skips and one TODO. Nonincremental typecheck and build pass.
Capture HEAD is `91f15d0`, production build `0gMCf5YkNIK5fheLAfL7o`.

## Browser observations

Root completed the declared first Friends and first Notifications openings on
muted MacBook Chromium Guest. Both saved all 309 pairs and stopped after the
ready endpoint, without a cap or retry. The Guest and loopback 3045 server are
closed; the original New tab remains. The 2,417 source/build files and
149,101,683 bytes rehash unchanged. The separate human edit is preserved.

| Incoming receipt interval | Friends before / after median ms | Notifications before / after median ms |
| --- | ---: | ---: |
| Whole paint | 20.5 / 9.95 | 25.3 / 8.9 |
| Pre-overlay | 1.4 / 2.35 | 2.5 / 1.7 |
| Stock overlay | 0.4 / 0.5 | 0.6 / 0.5 |
| Title incoming | 17.8 / 6.35 | 21.8 / 6 |
| Pair encoding, outside paint | 9.3 / 8.7 | 9.8 / 10.5 |

These are separate recorded runs, with 11/9 incoming baseline receipts and
14/11 candidate receipts. The medians include their transparent terminal and
are not additive. First Friends title drawing still takes 43.4 ms; first
Notifications takes 27.6 ms. Notifications incoming15 has a separate 75.6 ms
stock-overlay interval. Recorded source coverage still misses 7/10 values,
versus 10/12 before; the all-pose assertion remains red. This supports a lower
observed sustained title draw cost, not causal unrecorded cadence or native parity.

## Pixel audit

The sealed audit validates all 618 pairs and 1,854 originals, 469,486,715 bytes.
All 1,236 PNGs pass chunk CRC, full decode, native-dimension and opaque-alpha
checks. Receipt sequences have no gaps, repeats or invalid publications. Root
rehashes every original and all 12 sealed derivatives unchanged. Measured
stationary Open holds are 527.6 ms for Friends and 499.0 ms for Notifications.

The first chronological outgoing20 and first occurrences of all shared
incoming source values give 16 logical comparisons, 32 whole LCDs. Empty masks
and exact source values are fixed in the pre-input policy, without phase or
spatial alignment. Twenty LCDs match exactly in both PNG bytes and RGBA.
All lower LCDs, both opaque pairs and both incoming0 pairs match exactly.

Seven Friends upper comparisons differ only in `x171 y8 width58 height12`,
the small Friend List header. The terminal differs at 348 pixels, maximum
channel delta 61. This residual is unexplained; the browser pixel regression
is not clean. Five Notifications upper residuals lie within the clock/battery
area, reaching 430 pixels and maximum delta 205. Root sees 20:56 versus 21:12
and different battery-blink phases. Those residuals remain unmasked.

Root opens both boundary sheets and both exact-source comparison sheets.
The two boundary sheets display slightly reduced from 832x2064 to 826x2048;
both comparison sheets display at original size. The audit separately verifies
all 96 native-size placements in the encoded sheets.

## Evidence and remaining work

Do not call the background change pixel-neutral until the Friends header
residual is explained or corrected. Preserve this candidate and baseline
build for a bounded same-browser control. The separate read-only diagnosis
examines first-raster cost and the Notifications overlay spike; no new
implementation is assigned from timing observations alone.

Private root:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261015/applet-incoming-raster/`.
Policy `capture-policy.md` predates all candidate input. `candidate-identity.md`,
`candidate-before.json`, `candidate-after-check.json`, `session-closure.md` and
`measured-timings.json` identify the source/build, GUI actions and recordings.
Source review SHA-256 is
`16515c64c9993b6e3222528b8051dfc5d17f08bb96bd725c612e99fb6da33223`.
Capture audit `capture-audit/run-1/report.json` has SHA-256
`8ff746816e5eef6292578e1f742bfddebbf83a463bb86aa322365cbdb579f7c6`.
Its derivative seal is
`33ecb3dd94915d74875f92bc569a14555b3ea678d1b2d28c8f00fa20c4e2388b`;
the complete PNG check is
`46c1a0049acc0167d9906ad1b803cd6681d89251f9e75390f18178fa0cac3e46`.

No new Azahar comparison occurred in this slice. Existing host composition,
font, Friends cover-order and selected-only return adaptations remain. No
native asset or cue was added. All four whole flows remain fail/unproven;
audio is muted and unaccepted.
