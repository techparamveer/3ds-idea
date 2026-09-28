# HOME Internet Browser toolbar banner source and first visual

The pinned EUR 10.7.0-32E HOME Menu title `0004003000009802`, content index 0
(`00000082`), contains `romfs/3D/BannerAppletWeb_LZ.bin`. Its compressed
SHA-256 is `ac0c64bcb701cfec67a85c5055d0538b20ab6594f90cd024a2f09e61bb2cdd17`;
the decoded CGFX SHA-256 is
`0c69aaf1cdb35a8e54519e45af9008ad1b10c8ce28e64460be2d1e3c85a299be`.
The pinned `ctr-cgfx-web` 1.4.2 exporter produces one `BannerAppletWeb`
model with three meshes, six PNG textures, a 600-frame looping skeletal clip
and a 300-frame looping material clip. `DmyText_00` is its authored text
surface. The manifest registers every public JSON/PNG output against that HOME
resource. No compressed binary, decoded CGFX or RGBA intermediate is published.

The first runtime selection maps HOME toolbar focus 4/category 7 to this model,
using the shared native frame stencil and camera. The model remains at its
authored front yaw and its source clips advance from the browser clock. The
native toolbar activation clock and yaw phase have not been traced; this is a
capture-scoped source rendering, not a lifecycle match.

## Raw LCD comparison

- Genuine native Azahar upper LCD: first 400×240 rows of
  `/Volumes/Codex3DSIsolated/native-home-toolbar-four-20260928/screenshots/_28.09.26_02.10.25.229.png`,
  full-image SHA-256 `55c0e74dd4d76f145b000c90533d9a94e38d5c9297577898cd3a76d227a53a03`.
- Production browser upper LCD:
  `/Users/paramveer/.codex/3ds-artifact-overflow/presentation/banner-applet-web-20260928/browser-upper.png`,
  SHA-256 `315f0d20f4b186ddbcde267660a5d46b3958acb0aa1fce71c164c2658186ee72`.
  Browser selection is toolbar focus 4/category 7, with diagnostic
  `lcdElapsedMs=8483.333333333334` and
  `lcdDate=2026-09-28T01:10:25.229Z` for the displayed 02:10 clock.
- Empty-mask upper residual: **53,380** pixels over 2/255, maximum channel
  delta 229. Banner crop `(130,35,140,120)`: **13,131** over 2/255.
  Native Browser globe is nearly edge-on while the browser source pose is broad.
  The native selection interval is not frame precise, so that visual difference
  does not justify a static yaw adjustment. Wallpaper, HUD and title styling
  also differ; whole-scenario parity remains open.

The public delivery audit passed with zero errors, 90 focused tests passed,
and the production build, including TypeScript checking, passed. Private
conversion scratch and the browser capture remain under the artifact overflow
directory.
