# Settings cold MAIN upper LCD comparison

25 September 2026. This compares one settled EUR 10.7.0-32E native System
Settings upper LCD with the source-rendered cold MAIN upper LCD. The native
PNG is 400 × 480; only its first 240 rows are used. Neither image is a live
browser capture. The lower LCD is outside this audit.

The native capture is
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/screenshots/System Settings_25.09.26_13.03.55.629.png`
(SHA-256 `a02c39244e7175da7d0eaa8e0678b6518b3f4b058f9f0c53b014e92c66b53558`).
The pre-existing source render is
`presentation/settings-main-cold-2026-09-25/main-cold-top.png` beneath the
same artifact root (SHA-256
`7048b09e65946f47a74cc164b6b8e27e75ad0d0ff8954c9d65d51b8402939592`).
It used 24/09 (Thu) 06:31; the native frame shows 25/09 (Fri) 13:03. The
verifier explicitly supplies that date, so its clock difference is an input
difference, not evidence of a layout defect.

I reran `scripts/verify-stock-settings.mjs` with only its temporary reference
date changed to 25 September 2026, 13:03, and restored the script afterward.
The rerun passed five main and 44 subpage paired renders, English style,
resource immutability and renderer diagnostic checks. Its upper PNG is
`presentation/settings-top-cold-audit-2026-09-25/main-cold-top.png` (SHA-256
`f20127c39970151787ec97da2dd9bbb11bca5e876c26ef78aedc2291a92e5824`).
The numeric comparison is stored with that render as `comparison.json`, alongside
`aligned-difference-map.png`. All scores below are mean absolute RGB channel
error on the 0–255 scale, with no resampling, registration or color correction.

| Region, exclusive rectangle | Original time | Aligned time |
| --- | ---: | ---: |
| Whole upper LCD, `(0,0,400,240)` | 1.343 | 0.404 |
| Status strip, `(0,0,400,20)` | 11.631 | 0.368 |
| Date/time, `(218,0,370,20)` | 30.211 | 0.572 |
| Title text, `(95,148,308,175)` | 0.083 | 0.083 |
| Wrench, `(160,60,240,140)` | 0.965 | 0.965 |
| Version, `(244,217,390,234)` | 8.812 | 8.812 |
| Whole LCD excluding wrench and version rectangles | — | 0.123 |

The panel outline, icon silhouette, title placement and version placement
visually align. The residual difference map shows faint one-channel differences
across the panel, a small shading difference within the wrench and a stronger
glyph-edge difference in `Ver. 10.7.0-32E`. `TopText_U_00` supplies the
original wrench panes and version pane. `drawNativeSettingsMain` substitutes
the actual version string in `T_ver_00`, and the renderer evaluates the wrench
material's multi-stage TEV program. The screenshots establish where the
residual is; they do not by themselves identify whether the last few color
levels arise in font rasterization, material evaluation or emulator output.

I rendered version-height overrides of 20, 20.5, 21 and 21.5 pixels at pane
Y positions −107, −106 and −105. The current 21/−106 pose scores 8.812 in
the version rectangle; the best of these trials scores 7.826 at 20.5/−105.
That small gain in one capture does not justify a hardcoded adjustment to the
source font size and position. No live painter, lower-LCD or input code was
changed. Native motion, another clock phase, and live browser pixels remain
outside this one-frame comparison.
