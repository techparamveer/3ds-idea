# HOME Miiverse toolbar banner source and first visual

The pinned EUR 10.7.0-32E HOME Menu title `0004003000009802`, content index 0
(`00000082`), contains `romfs/3D/BannerAppletMvs_LZ.bin`. Its compressed
SHA-256 is `940fef25ab00fac61ffb8d1d8132da8adb7a2d26da094a7ddb1c71d4b6306180`;
the decoded CGFX SHA-256 is
`6ce7a4525fbada9b48f5a3dc846bb7a064f08b40af56f53e46b16e63866f46ea`.
The pinned `ctr-cgfx-web` 1.4.2 exporter produces one `BannerAppletMvs`
model with three meshes, six PNG textures, a 600-frame looping skeletal clip
and a 300-frame looping material clip. `DmyText_00` is its authored text
surface. The manifest registers every public JSON/PNG output against that HOME
resource. No compressed binary, decoded CGFX or RGBA intermediate is published.

The runtime maps HOME toolbar focus 5/category 8 to this model, using the
shared native frame stencil and camera. The model stays at its authored front
yaw and its source clips advance from the browser clock. The native toolbar
activation clock and yaw phase have not been traced; this is a capture-scoped
source rendering, not a lifecycle match.

## Raw LCD comparison

- Genuine native Azahar 400×480 image:
  `/Volumes/Codex3DSIsolated/native-home-toolbar-four-20260928/screenshots/_28.09.26_02.10.50.672.png`,
  SHA-256 `cf46417e19d99c51baf203e551d5f71a8151b916a453182d3bf0bfb002190cfc`.
  The upper LCD is rows 0–239; the lower comparison crops x=40–359,
  y=240–479.
- Production browser raw pair and standard `browser-native-lcd-capture-v1`
  metadata are in
  `/Users/paramveer/.codex/3ds-artifact-overflow/presentation/banner-applet-miiverse-20260928/`:
  `upper.png` SHA-256 `8c4d091ac43155a570063a28215cabff558cde3b392d4d536592d0c312e0c485`,
  `lower.png` SHA-256 `e5c215c15d8d1d17c09e2fee506ed37b27f51435bf21528cb2379007281d84e9`,
  and `capture.json`. Browser selection is toolbar focus 5/category 8;
  metadata records `homeUpdates=2291`, diagnostic
  `lcdElapsedMs=8483.333333333334`, and
  `lcdDate=2026-09-28T01:10:50.672Z` for the displayed 02:10 clock.
- Empty-mask upper residual: **36,836** pixels over 2/255, maximum channel
  delta 253. Banner crop `(130,35,140,120)`: **8,818** over 2/255. Lower
  residual: **44,962** pixels over 2/255, maximum channel delta 255.
  Both model silhouettes are broad, but their angle, edge and shading differ.
  The native selection interval is not frame precise, so a static yaw or phase
  adjustment would be a screenshot fit. Wallpaper, HUD, title styling and lower
  HOME tiles also differ; whole-scenario parity remains open.

The public delivery audit passed with zero errors, 92 focused tests passed,
and the production build, including TypeScript checking, passed. Private
conversion scratch and the browser capture remain under the artifact overflow
directory.
