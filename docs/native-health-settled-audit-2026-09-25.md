# Health settled LCD audit — 25 September 2026

The available real EUR 10.7.0-32E Health capture is the settled **entry menu**,
not an article. Azahar 2126.1.2 saved the 400 × 480 frame at
`/Users/paramveer/.codex/artifacts/native-settings-2026-09-24/screenshots/Health and Safety Information_24.09.26_10.30.45.498.png`
(SHA-256 `8cf066af527b2d9f2a3cc6e1187a15fe718dd4dabecea894f0659326b1fa70ac`).
The earlier comparison cropped its lower LCD to `(40,240,360,480)` as
`/Users/paramveer/.codex/artifacts/native-health-entry-2026-09-24/native-bottom.png`.
The many `health-3d-*`, `health-general-*` and `health-usage-*` PNGs in
`presentation/`, `runtime/` and `render/` are **source-rendered specimens**.
They cannot serve as native article references.

I regenerated the stock-screen verifier from this worktree at commit
`70b60f6`, using the published 10.7.0-32E packs and shared font. Its report
and PNGs are under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/health-native-compare-2026-09-25/render/`;
the command output is in the adjacent `verify.log`. The verifier passed.
Comparing RGB at native 320 × 240 resolution with the real settled lower crop:

| Measure | Current source render | Previous 24 September source render |
| --- | ---: | ---: |
| Mean absolute channel error (0–255) | **0.0249** | 1.4598 |
| Largest channel difference | **2** | 152 |
| Pixels with every channel within 10 | **100%** | 96.73% |
| Exactly equal RGB pixels | **95.56%** | 91.63% |

The fresh entry render is nearly pixel-identical to the real crop. No entry
artwork or renderer correction is justified by this frame. The previous render
does not represent this worktree's `stock-screen-presentation.ts`; the Health
renderer, article, scroll and native layout source hashes do match the previous
report. These measurements cover the settled lower LCD only. The upper Health
background moves, so an unaligned upper frame cannot establish a pixel error.

An isolated Azahar trial launched the installed EUR title from a copy beside
the versioned `reference/user/` profile with OpenGL. The copied executable
matched the required SHA-256; no symlinks were present under `user/` and
`use_custom_storage=false`. The menu visibly settled with all three white
buttons. Keyboard A/Down and a temporary button-to-touch mapping did not open
an article through the available computer-use input. No article screenshot was
saved and no article pixels or input response are inferred. Azahar was stopped,
the temporary touch binding was removed, and the profile was released to the
eShop comparison task. The profile's renderer remains OpenGL for that task.

The article's text bounds, warning placement and clipping remain a native
visual comparison gap. Capture a real settled article through reliably mapped
input before changing those pixels. The current source replays and layout
metrics alone do not close that gap.
