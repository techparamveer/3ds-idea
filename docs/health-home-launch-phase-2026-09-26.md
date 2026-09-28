# Health launched from HOME: source phase fit — 26 September 2026

The coordinator navigated isolated Azahar HOME left from Settings to Health,
held the mapped A input (`typeText('a'.repeat(32))`), and captured the settled
main screen at `reference/screenshots/_26.09.26_04.40.09.036.png` beneath the
private artifact root `/Users/paramveer/.codex/3ds-artifact-overflow/`.
The combined native PNG SHA-256 is
`4d2fcb0b36b69a6aa1a15d5cdf13899b8dfd2aad0fda30f8f6edb026fb5884df`.
This entry history is genuinely HOME-launched, unlike an unspecified direct
launch; the screenshot still does not identify the exact launch update count.

The existing private `presentation/health-toploop-fit/native-fresh-fit.mjs`
machinery was adapted temporarily to compile the current Experience-lane OS
sources, exhaustively sample all integer frames 0–719 and read this screenshot.
The lower comparison used the current unfocused Health main presenter.
No runtime code or asset was changed. Both comparisons use every raw RGB pixel:
upper 400×240 at combined origin (0,0), lower 320×240 at (40,240), without masks,
rescaling, offsets or color adjustments.

| Screen / source frame | Pixels with maximum RGB difference >2 | RGB mean absolute error |
| --- | ---: | ---: |
| Upper 156 / 516 | **0 / 96,000** | 0.0701770833 |
| Upper 155 / 515 | 314 / 96,000 | 0.1408923611 |
| Upper 157 / 517 | 313 / 96,000 | 0.1290763889 |
| Lower main, unfocused | **0 / 76,800** | 0.0248524306 |

Use **`lcdHealthFrame=156`** for the coordinator's production browser capture;
516 is an equivalent repeated pose, not evidence of which half of the native
720-frame loop was captured. Production browser comparison remains necessary:
these scores are offline current-renderer results, not a browser pass or proof
of native launch-clock alignment. Small RGB differences below the threshold
remain; this is not byte identity.

Source provenance remains the delivered Health title `0004001000022300`,
`bg_LZ.bin/anim/Bg_U_00_TopLoop.bclan`, SHA-256
`c0fa9a144892bf146eedf53edd34ba13edc9622294a8ad2fbe38c5024f402ff6`.
See [the original phase analysis](health-toploop-phase-fit-2026-09-26.md) and
[the rotated-picture raster correction](health-rotated-picture-raster-2026-09-26.md).
