# Native Health Usage scrolled upper phase

Reference: `/Users/paramveer/.codex/3ds-artifact-overflow/reference/screenshots/_26.09.26_04.55.28.03.png`
SHA-256: `4fc41442320d3513a0d29b8f57b90cf825f20660d912c7d9a21755bf5e58bed0`.
This is the coordinator's genuine HOME-launched Usage screenshot after scrolling.

At Experience revision `7ec65e1`, exhaustively rendered integer source frames
0–719 of delivered Health title `0004001000022300`, `health-bg` pack,
`Bg_U_00` layout and `Bg_U_00_TopLoop` animation with the delivered title message
and font. Compared the complete upper 400×240 crop at (0,0), no mask, scaling,
colour correction or phase interpolation. Ranked by count of pixels with maximum
RGB-channel difference >2, then mean absolute RGB-channel difference.

| Source frame | Pixels >2 / 96,000 | Mean RGB difference |
| --- | ---: | ---: |
| 8 / 368 | 0 | 0.0704444444 |
| 7 / 367 | 289 | 0.1315902778 |
| 9 / 369 | 298 | 0.1298229167 |
| 10 / 370 | 887 | 0.1705243056 |

Use explicit browser target `lcdHealthFrame=8` for the comparison. Frame368
produces the same upper motif; the screenshot cannot distinguish those two
branches of the 720-frame clip. This is a pixel fit, not an entry-time or ±1-frame
live-clock acceptance result. The lower screen and scroll geometry were not
scored in this task. The firmware asset loader emitted no diagnostics.

Method reused the private `presentation/health-toploop-fit/native-fresh-fit.mjs`
offline runner with this reference, Experience sources, and `@napi-rs/canvas`.
No runtime code, browser, or Azahar state changed.
