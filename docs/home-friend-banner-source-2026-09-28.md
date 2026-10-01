# HOME Friend List toolbar banner source and first visual

Correction, 1 October 2026: the focus identification below was wrong. Friend
List is focus 2/category 4, verified against the native cursor pane and live
Azahar. See the [mapping correction](home-toolbar-banner-mapping-2026-10-01.md).
The following measurements remain the historical 28 September record.

The pinned EUR 10.7.0-32E HOME Menu title `0004003000009802`, content index 0
(`00000082`), contains `romfs/3D/BannerAppletFriend_LZ.bin`. Its compressed
SHA-256 is `4b99060b220166bdf158a5949ab00d509d29a34fc1701249fa1865c5d141af10`;
the decoded CGFX SHA-256 is
`3a611b0356075dad06294f99e0ad45163d273707ecf42c46b0cc5f12942ca7bd`.
The pinned `ctr-cgfx-web` 1.4.2 exporter produces one `BannerAppletFriend`
model with three meshes, six PNG textures, a 600-frame looping skeletal clip
and a 300-frame looping material clip. `DmyText_00` is the authored text
surface. The manifest registers every public JSON/PNG output against that HOME
resource. No compressed binary, decoded CGFX or RGBA intermediate is published.

The first runtime selection maps HOME toolbar focus 1/category 5 to this model,
using the shared native frame stencil and camera. The model remains at its
authored front yaw and its source clips advance from the browser clock. The
native toolbar activation clock and yaw phase have not been traced; this is a
capture-scoped source rendering, not a lifecycle match.

## Raw LCD comparison

- Genuine native Azahar upper LCD: first 400×240 rows of
  `/Volumes/Codex3DSIsolated/native-home-toolbar-four-20260928/screenshots/_28.09.26_02.12.17.704.png`,
  full-image SHA-256 `c842a5e2f5fb8c3674b8fd0d62a9484d8b930e17b58e71a4d2751480f19a77a4`.
- Production browser upper LCD:
  `/Users/paramveer/.codex/3ds-artifact-overflow/presentation/banner-applet-friend-20260928/browser-upper.png`,
  SHA-256 `120001e184d2b094eaa0e77186119568163444ad2e80961b7cf505d01ff90269`.
  Browser selection is toolbar focus 1/category 5, with diagnostic
  `lcdElapsedMs=8483.333333333334` and
  `lcdDate=2026-09-28T01:12:17.704Z` for the displayed 02:12 clock.
- Empty-mask upper residual: **39,517** pixels over 2/255, maximum channel
  delta 254. Banner crop `(130,35,140,120)`: **11,411** over 2/255.
  Native Friend is nearly edge-on while the browser source pose is broad.
  The native selection interval is not frame precise, so that visual difference
  does not justify a static yaw adjustment. Wallpaper, HUD and title styling
  also differ; whole-scenario parity remains open.

The public delivery audit passed with zero errors, 89 focused tests passed,
TypeScript typecheck and production build passed. The audit with repository
converter-hash checking reports three pre-existing manifest/script hash drifts
(`convert_bcfnt.py`, `firmware/build.py`, `firmware/native.py`); the public-only
audit validates the delivered assets. Private conversion scratch and browser
capture remain under the artifact overflow directory.
