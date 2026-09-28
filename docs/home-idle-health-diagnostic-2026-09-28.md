# HOME idle Health diagnostic — 28 September 2026

At integration `f61d2e4`, a separate production build on `127.0.0.1:3013`
was driven with agent-browser. ArrowRight selected Health and X cycled the
HOME grid to one-row density. The loopback LCD export saved raw 400×240 upper
and 320×240 lower PNGs with a fixed displayed 27/09 (Sun) 06:48 clock. The
browser capture identifies `health-safety` as the active HOME selection and
uses live banner pose; it is not a source-frame override.

The native input is Azahar's own 400×480 PNG
`/Volumes/Codex3DSIsolated/native-home-replay-20260927/screenshots/_27.09.26_06.49.33.51.png`
(SHA-256 `085360a40a8c3c03292a1dbd22b4c2b4d17def7a2338e9f3669c6ce3e42cfccc`).
It visibly selects Health in one-row density at 06:48. The isolated volume
was mounted read-only during this check, so this genuine earlier screenshot
was copied without changing the native profile.

The private [unmasked report](/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260928-home-idle/reference/scenario-matrix/v1/captures/home-idle-health-density0-20260928/diff/report.json)
is SHA-256 `45668f1f6756fa9da9642d91221b03ae3ea8ed670f640d5bc70f26527dafb065`.
The native upper crop is `(0,0,400,240)` and the lower crop is
`(40,240,360,480)`. With an empty mask and a >2/255 RGB threshold, the
pair differs by **40,704 upper** and **17,421 lower** pixels. The native and
browser views plus heatmaps are in the sibling `upper-contact-sheet.png` and
`lower-contact-sheet.png` files.

The upper HUD network, coin and battery indicators differ; the Health banner
and wallpaper also have visible size, placement and phase differences. The
lower native grid has an empty slot next to Health, while the browser puts the
Settings wrench there. The remaining icons and grid geometry differ too.
The browser began from its default portfolio HOME, whereas the native
screenshot's input history is unavailable. Motion and audio were not sampled.

This is a **fail** diagnostic for pixels, not completion of
`home-idle-matched`. A matched native/browser input replay and frame or phase
checkpoints are still required. No runtime code or matrix entry changed in
this bounded verification.

## Fresh writable replay: Notifications HOME idle

The isolated `native-home-replay-20260927` was cloned with APFS copy-on-write to
`/Volumes/Codex3DSIsolated/native-home-idle-matched-20260928`. The copied
Azahar executable retained pinned SHA-256
`3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`;
the cloned `user/` profile has no symlinks. Its screenshot path alone was
changed to the cloned sibling directory. The original replay remained intact.
The cloned executable booted EUR HOME, and Azahar's own Capture Screenshot
command saved a fresh 400×480 PNG at
`/Volumes/Codex3DSIsolated/native-home-idle-matched-20260928/screenshots/_28.09.26_01.44.53.539.png`
(SHA-256 `a161d6e1bbcbd6ecc81a3cf27d23a499627a802b84ce32dd622bc93f4c09cbf3`).

In a separate production browser on `127.0.0.1:3013`, Up, Right, Right
selected Notifications toolbar focus 3; five X presses cycled to one-row
density. Both captured LCDs show the Notifications toolbar highlight and
28/09 (Mon) 01:44. The raw browser files and copied native PNG are under
`/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260928-home-idle/reference/scenario-matrix/v1/captures/home-idle-notifications-native-20260928/`.
The [unmasked report](/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260928-home-idle/reference/scenario-matrix/v1/captures/home-idle-notifications-native-20260928/diff/report.json)
has SHA-256 `79a78dd4937530ee40a1bd1641441bfea546c19a2836dee1d5e58f591a5b5072`.
At >2/255 RGB, the pair differs by **57,822 upper** and **20,230 lower**
pixels; maximum RGB delta is 255 on each LCD. The sibling contact sheets
were visually inspected.

Azahar's upper LCD displays the green Notifications banner, while the browser
still displays the orange Work banner even though `capture.json` records
`folderBanner.selection` as toolbar focus 3. The native lower LCD contains
installed titles beside a blank tile; the browser lower LCD contains portfolio
tiles. Network, coin and battery HUDs differ. The native profile resumed
persisted Notifications focus after HOME boot, whereas the browser navigated
from its default Work selection. Thus the input histories are not matched,
and motion/audio were not sampled. This is a fresh **fail** diagnostic, not
`home-idle-matched` acceptance. No runtime code or matrix entry changed.
