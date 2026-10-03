# Power Re-entry - 3 October 2026

Integration base `fa8f6aa188971c8b923098f987877fc1ea87fddf`; production runtime
`ea6265de73ef5526f6c1ffb4b372762de138cf18`. This is new native/browser evidence,
not a runtime or asset change. Whole scenarios remain fail/unproven.

## Native Gesture

Private root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/power-reentry-20261003/`.
`prepare.mjs`, the plan, inspection and manifest bind the verified neutral CTM
template to the isolated launch config. `native-input-record.md` retains the
launch, observed counters, screenshot mapping and exclusions. Movie SHA-256:
`b217869c3a45908b433ab7e1b1cdc042003b7daf42594ef4c3282463b4a52dbf`;
launch config SHA-256:
`6cc2c8f27f7942bdd6ce13ea104087602de76a9cf74af952f3dc296071e81b88`.

The existing isolated `native-folder-switch-20261002` bundle uses pinned
executable SHA `3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`.
Original hardware/EUR settings and explicit Static input2, Null output1 and
volume0 are checked before launch. Host Shift enters Power during the neutral
prefix; it is not a movie-encoded Power event.

The CTM keeps one valid contact inside `(160,182)` for samples14040..17550,
outside `(160,107)` for17550..21060, then inside again for21060..24570.
Release starts at24570. These are adjacent half-open ranges with no release
between them, nominal15 seconds each at234Hz. No record order/header/length
was changed. Counters are not exact video-frame or browser-time identities.

Native own400x480 PNGs, in the instance's `screenshots/power-reentry-20261003/`:

| Capture | Observed state | Post-request counter |
| --- | --- | --- |
| `_03.10.26_01.33.55.422.png` | Settled Power | 1286 |
| `_03.10.26_01.34.30.42.png` | Second settled control | 3380 |
| `_03.10.26_01.34.46.249.png` | Initial held button | 4337 |
| `_03.10.26_01.34.58.818.png` | Still held outside, unpressed visual | 5113 |
| `_03.10.26_01.35.09.041.png` | Re-entered, pressed visual restored | 5711 |

After release, `native-playback-log.txt` records `ShutdownAsync` at117.438857
and normal process cleanup; the application list is observed at counter6309.
No new native black endpoint was captured. That late screenshot attempt and
the application list are not raw-LCD shutdown evidence. The native result
confirms the existing touch ownership semantics rather than indicating a fix.

## Browser And Checks

Primary `browser-matched` uses real projected pointer input, the same discrete
coordinates, and nominal15s holds. Actual recorded intervals are15037,14990
and14987ms; these are browser wall times, not aligned native ticks. The browser
stays in Power through both moves, enters shutdown on inside release, reaches
off, and restarts to ready HOME, muted, with no page errors. Supporting
`browser-fixed` passes the existing shorter60-step input regression and retains
26 shutdown/off pairs. `browser-control` is excluded: it stopped at the mute
precondition before gesture execution. Chrome was already launch-muted; the
app mute preference was then set with M and verified for both accepted runs.

The coordinator inspected the native states, raw re-entered LCD and restarted
production viewport. Input/presentation/CTM tests pass24/24; the independent
read-only ownership review passes13 tests and recommends no behavior change.
The prior full1882-test/typecheck/build result belongs to unchanged runtime
`ea6265de`; it was not rerun for this documentation-only slice.

## Pixel Comparison

All four primary and all four supplementary raw upper400x240/lower320x240
pairs have zero pixels above delta2, maximum channel difference2. No mask,
registration, shift or color fit is applied. Held and re-entered button ROIs
`[65,166,255,203)` have maximum1; whole-pair MAE is0.029333. Settled and
outside whole-pair MAE is0.030359. The ROI is diagnostic, not an exclusion.

Native baseline/outside pixels are byte-identical, SHA
`a585889277da13c28f9b184c279c9775997859a7dbbdd64a946016dc0dfd4a3e`;
native initial-held/re-entered are byte-identical, SHA
`c87de9954bd8d55815f04838099bad9b96384338d4103ecc94ba423de406a7f7`.
The coordinator opened the side-by-side sheet and independently verified48
manifest records. Artifacts under the private root's `comparison/`:

| Artifact | SHA-256 |
| --- | --- |
| `power-reentry-comparison-report.json` | `7a7d850e3dcb862a94a67b73120eebd9dea8472956d1b3f487b05305126af1b0` |
| `power-reentry-comparison-manifest.json` | `4b334d8b1826e5d73194a922a958455c4387f44d02c5fb3b0d79eb1adcc46cac` |
| `power-reentry-comparison-sheet.png` | `0e5eaacfdec9068ebbe1cb8552cb378c3b6fe4c90da3b6c1f512b543345d797e` |
| `generate_power_reentry_comparison.py` | `58b99d3a4bc167eebfd6a323d9d1069f27096ba1f09f994e629db1df2c30037a` |

## Source And Limits

Element -> `manifest.home.sleep` -> `packs/home/sleep.json` -> pinned HOME
title `0004003000009802` v24576, content index0/ID00000082,
`RomFS/sleep_LZ.bin` -> `anim/Slp_D_00_Select.bclan`, poses0/1 and `G_Btn_01`.
The [Power input source chain](home-power-input-2026-10-03.md#source-identity)
retains every SHA and converter version, including the existing transitive
public provenance and stale converter-script-hash limitations. No new asset,
native graphic reconstruction or cue was introduced.

Exact epochs/cadence, transient motion, native audio under mute, physical
backlight order and cold boot remain open. Host1200/120ms shutdown timing,
reduced-motion policy, charcoal physical-off fill and portfolio content remain
adaptations. The private matrix is unchanged; these endpoint and ownership
checks do not establish a whole-scenario pass.

Native PID22599 exited0. A postquit AX observation relaunched the same isolated
bundle without a title as PID24972; it was closed and checked absent before
byte-exact config restoration, SHA
`d2118bc611142e0febb95415bb45487fe83b36c407b6cdad869a01697e92e698`.
`native-playback-log.txt` preserves the actual run; empty `native-log.txt`
belongs to that extra launch and is excluded. Dedicated Chrome23887 closed
through CDP and exited0; owned browser/native processes are absent. Browser
service-registration warnings are separate from empty application page errors.
Default profiles, original ROM, microphone, system audio and Spotify were
untouched. Production `http://127.0.0.1:3021/` remains HTTP200.
