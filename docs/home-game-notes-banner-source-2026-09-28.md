# HOME Game Notes toolbar banner source and first visual

The pinned EUR 10.7.0-32E HOME resource `3D/BannerAppletMemo_LZ.bin`
(compressed SHA-256 `ac476f4901148b4ca1dbd85db9d8c6780945539f40cddab47e11d3dfe96097e0`)
decodes to CGFX SHA-256
`1edaff090f935049048e6cd7d97256b355affe4d4688efb9257831cf7d7a9830`.
The existing `ctr-cgfx-web` 1.4.2 exporter produced one
`BannerAppletMemo` model, three meshes, six textures, a looping 600-frame
skeletal clip and a looping 300-frame material clip. Only converted JSON and
PNG textures were published under `models/banner-applet-memo/`, with resource
hashes in the public manifest. The compressed source and decoded CGFX remain
private.

The HOME resolver identifies Game Notes as toolbar **focus 2 / category 4**.
The production renderer now selects the converted Memo model and native
`Game Notes` label for that focus, suppressing the stale selected-grid banner.
It uses the shared native camera/frame mask and the source-owned animation
clips. The toolbar manager's native request type, host yaw, clip origin and
label activation timing remain untraced. The renderer therefore uses the
authored front yaw as a visible approximation, not a fitted native pose.

Azahar's own 400×480 screenshot is
`/Volumes/Codex3DSIsolated/native-home-toolbar-four-20260928/screenshots/_28.09.26_02.12.37.99.png`
(SHA-256 `bf95a6980ccba2ec1ffe36b9020ac9bfe7ceb4c7bfe042051dd5c31704877d20`).
The browser's raw LCD capture and [comparison report](/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260928-notes/reference/scenario-matrix/v1/captures/home-notes-banner-source-20260928/diff/report.json)
are under the private `captures-20260928-notes` root. Both upper LCDs show
the yellow Notes resource and `Game Notes` label at 02:12. The native model
is edge-on at an unknown animation phase; the browser sample is face-on.
With an empty mask and >2/255 RGB threshold, **55,429 upper** and **36,141
lower** pixels differ. The banner box `(130,30,270,150)` differs by
**12,850** pixels. These counts include wallpaper and HUD differences, and
do not identify a correct native phase or pose. Input histories, motion and
audio remain unmatched; the whole scenario fails.

The focused banner/resolver suite passed 63 tests, typecheck and production
build passed, and the public-only delivery audit returned `ok: true` with
zero errors. Private-source audit could not run against the available
`assets/` root because several source.json files were absent; public output
hash and reference checks still ran. No native-screen acceptance is claimed.
