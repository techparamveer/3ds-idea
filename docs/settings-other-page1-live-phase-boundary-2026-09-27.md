# Other Settings page 1 live HUD phase boundary

The 27 September paired native/browser capture
`settings-other-page1-live-current-20260927` isolates the remaining visible
static-frame mismatch to the upper HUD. The unmasked `diff-final/report.json`
compares raw LCD pixels at a maximum RGB-channel threshold of 2/255:

| LCD | Pixels above threshold | Residual regions |
| --- | ---: | --- |
| Upper, 400×240 | 169 | Battery `(377,6,18,8)` 137; colon `(339,5,4,4)` and `(339,11,4,4)` 16 each |
| Lower, 320×240 | 0 | None; mean RGB error 0.155143, maximum 2 |

The native file is
`/Volumes/Codex3DSIsolated/camera-guide-replay-20260926/screenshots/System Settings_27.09.26_06.09.57.995.png`,
SHA-256 `d7de08ec36dd77d63e0999f499a0072a523fe2e4fb863fdf738471767ee13092`.
Browser upper/lower SHA-256 values are respectively
`65bb9a01b6b99bd291d8b8148221de380de82ff90664e7f1011a831d49b5a886`
and `809e0f981a60fd63fb6bd2b6dfaccca01538179e6684d76ecc8cc63e36c0d249`.
The private comparison and raw contact sheets are under
`/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260926/reference/scenario-matrix/v1/captures/settings-other-page1-live-current-20260927/`.
The report labels commit `a76af77`; this note audits that pair, not a new
browser recapture.

The browser capture records Settings-local elapsed time of 12,000 ms and an
injected calendar date `2026-09-27T05:10:00.000Z` with
`verification-settings-local-replay`. It does not record the native Settings
HUD's sampled seconds, previous displayed date or counter at the comparison
frame. The screenshot filename is a host capture timestamp, not those native
values. Consequently the 169 pixels identify a *pose mismatch*, but do not
identify a wrong phase rule or a safe replacement frame.

Source ownership is already implemented in `src/os/stock-settings-hud.ts`:
the Settings-local counter drives the sampled date, colon visibility and
battery frame; `src/os/stock-native-settings.ts` mounts those values on source
`T_TimeC_00` and `HudMset_00_Bat`. The executable addresses, source asset hash,
counter ordering, and native odd/even/odd observations are in
[Settings HUD runtime](settings-hud-runtime-2026-09-26.md) and the
[upper HUD source audit](settings-upper-seconds-source-audit-2026-09-26.md).
Those observations show the same 32+137 native transition, while this pair
does not establish the native transition's alignment with the injected browser
date. Page-specific frame selection or a screenshot-fitted offset would
contradict that source ownership.

The static lower image meets this threshold comparison; it is not byte equal.
Whole-scenario fidelity remains open for phase-aligned motion, input and audio.
The next decisive evidence is a native frame sequence with recovered sampled
seconds, prior displayed date and counter, paired with the browser's Settings
HUD sample at the same update. No runtime or asset change follows from this
single pair.
