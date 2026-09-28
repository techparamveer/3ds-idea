# HOME Notifications toolbar banner source and first visual

The green Notifications banner in the pinned native HOME capture is supplied by
the **HOME Menu title**, not the Notifications applet ExeFS. The earlier
[resource audit](remaining-home-banner-resource-audit.md) accurately found no
`exefs/banner.bin` in the applet extraction, but did not inventory HOME's
`romfs/3D/BannerAppletNews_LZ.bin`.

| Source field | Verified value |
| --- | --- |
| Firmware/title | EUR 10.7.0-32E HOME `0004003000009802`, version 24576 |
| Content | index 0, ID `00000082` |
| CIA-internal path | `romfs/3D/BannerAppletNews_LZ.bin` |
| Compressed SHA-256 | `5170a1c67eed6dd6536a85c0a83689552fe335ad9fa51d88085d0c5084c1a931` |
| Decoded CGFX SHA-256 | `c91a037f6462c2aef79fb5944225e8a4c36e7116de804e86cc780a233805a1bc` |
| Converter | `ctr-cgfx-web` 1.4.2; pinned SPICA revision `bd29a7828595d7839cda2ac61c76bb63f9071250` |

The decoded resource has one `BannerAppletNews` model with three meshes, six
textures, a 600-frame looping skeletal clip and a 300-frame looping material
clip. `DmyText_00` is its source text surface. The existing converter published
only model JSON and PNG textures under `models/banner-applet-news/`; the
manifest records the source hash for every output. No private binary is in the
repository.

The first production visual draws this model when the observed HOME selection
is toolbar focus 3/category 6, suppressing the stale Work fallback. It uses the
shared native Frame stencil/camera, the existing source font label surface and
the authored front yaw. The source clips advance from the browser clock. The
toolbar manager's original request type, activation timing, yaw clock and text
binding have not been traced, so this is a **capture-scoped adaptation** rather
than a native lifecycle claim.

The paired raw upper LCD diagnostic uses native Azahar image
`_28.09.26_01.44.53.539.png` (SHA-256
`a161d6e1bbcbd6ecc81a3cf27d23a499627a802b84ce32dd622bc93f4c09cbf3`)
and the production 400×240 browser capture (SHA-256
`df90572cb3498cc1b969a80639a3abae04eb1459e8df7f992bdcad40e831bd45`)
at the same 01:44 clock. Browser
toolbar focus is 3/category 6. The original comparison had **57,822** upper
pixels over 2/255. The source model/front-pose trial has **46,756**, with an
empty mask; within `(130,35,140,120)` around the model, 8,710 pixels still
differ. HOME input histories differ, and lower tiles/HUD, motion and audio
remain unpaired. This improves the named banner identity without passing the
whole scenario.

Private conversion scratch and browser upper PNG are under
`/Users/paramveer/.codex/3ds-artifact-overflow/presentation/banner-applet-news-20260928/`.
The public-only delivery audit passed with zero errors, 98 focused tests passed,
typecheck and production build passed. The browser showed the green native
resource and Notifications label with no console errors.
