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

## Remaining cost diagnosis

The read-only probe exercises the real renderer and stock-presentation paths
through a Node transport stub. Root reran it successfully. The first frame-0
title draw populates five cache entries, 852,736 bytes, including one raster
for each background. An immediate repeat adds no picture rasters. This places
cold work inside the measured Friends first draw; it does not apportion all
43.4 ms among validation, rasterization, Canvas setup and other work.

Holding other inputs fixed, Notifications seconds-parity changes cause all
five native draws across both LCDs to run again. Same-parity samples reuse the
cached pair. Receipt 1784 does not retain the Date, cache key or repaint reason,
so the 75.6 ms spike cannot be assigned conclusively to that mechanism. The
Friends header is outside title drawing and does not explain its cold cost.

The private report is `remaining-cost-diagnosis/report.md`, SHA-256
`6d68cb911be49924a05418eacc64617c0a0cc744de4c2e188059514da83a75a5`.
This is source/call-path evidence, not browser or native timing evidence. No
new optimization, clock change or rendering workaround follows from it alone.

## Evidence and remaining work

The declared fresh ready Friends control saved all 123 baseline and 65 candidate
pairs. Both recordings stopped manually without a cap or retry. The first
valid ready pair from each is an exact PNG and RGBA match on both LCDs; both
also match the old candidate incoming20 pair. Each differs from the old
baseline incoming20 only by the same 348 upper-header pixels, maximum delta 61.
Thus eight of ten fixed whole-LCD comparisons are exact, with empty masks.
All pairs within each fresh window are exact repeats on both LCDs.

The unchanged baseline can produce the newer header pixels, so candidate
source is unnecessary for the historical residual. This does not identify
the cause or establish native-correct text. Do not rewrite the original
32-comparison result or claim universal pixel neutrality from this control.

Audit `applet-header-control/audit/run-1/report.json` has SHA-256
`4b2653cc9723036655d863556ec08d9c084cc7e46b4d3a010ce6f4b65d53cc94`.
It validates all 188 pairs and all 380 PNGs, including the two historical
anchors. Root rehashes all 570 originals, 74,925,655 bytes, unchanged and opens
the five-panel native-size sheet. Its 20 embedded source placements are exact;
sheet SHA-256 is
`694c558d8714704543f9a9e4641f9c06ebad73bbcfed2c137198caccc45948d9`.
The parent `session-closure.md` records both final capture identities. Both
Guest windows and servers are closed, and both frozen build manifests and the
separate human edit remain unchanged.

The derivative seal is
`0bf88e660bc9cf3a0c5c3d10d525374f2f7c08c8095888c1ce2f1721c603f89c`.
Independent final wording review `ad08a62efe92fc9d8774790239b4df5439ce0fced8ad6e038ed2dd4417d26454`
found a stale completed-task reservation and ambiguous five-draw wording;
root corrected both. The review found no other evidence-claim issue. This
documentation-only checkpoint passes 913 relative file-target checks and
`git diff --check`; anchors were not checked and no rebuild was needed.

Preserve both builds and all original residuals. The header repeat control is
closed; no header rendering workaround is justified. Next distinguish the
first title draw's upper/lower and cache-population costs, and the reason for
Notifications pair recomposition, before changing scheduling or cache policy.
Keep those measurements inside the existing opt-in timing path. Recorded pose
coverage, unrecorded cadence and exact native motion remain open. No new
runtime change is assigned at this checkpoint.

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
