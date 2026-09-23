# Nintendo Zone bundled offline and Info pages

Title `0004001000022b00` now includes texture-only pack
`packs/nintendo-zone/local-html-images.json`. Its texture keys are `offline`,
`no-content`, `info-top-frame-0` and `info-top-frame-1`. Use the URLs in the pack;
all are content-addressed PNGs. No inferred native layout is introduced.

Source `www/included_html/offline_mode/OFFLINE_EU/en/offline_mode.html` sets a
non-repeating `offline_mode.gif` background with zero body margin. The original
lower bitmap is **320 × 212** and already contains the two button images and
HOME-return footer text. Its HTML defines these rectangles:

| Action | Source rectangle (x, y, width, height) | Source element |
| --- | --- | --- |
| Search for Nintendo Zone | 29, 30, 262, 86 | `zone_beaconscan` |
| What is Nintendo Zone? | 29, 136, 262, 36 | Link to `nzv:info_top,nzv:info` |

The companion `offline_mode_top.html` sets a black zero-margin background and
embeds `nw4c src="nzv:3dbanner"`; the previously delivered EU `U_top` banner is
the source native upper component. Native shell placement of the 212-pixel HTML
viewport within the 240-pixel screen remains a browser/reference check; do not
stretch the bitmap to fill 240 pixels and claim exact source dimensions.

The bundled Info counterparts are
`www/included_html/boss_page/BOSS_EU/en/info.html` and `info_top.html`.
`news.html` and `news_top.html` use the same images. The lower page contains
`images/no_content.gif` (**320 × 212**); the top contains
`../shared_images/top_screen.mpo` (**400 × 220**, two frames). Both decoded MPO
frames are retained with explicit source-frame numbers; frame 0 is available for
the flat web display. The lower source artwork states that content is unavailable
and mentions SpotPass. It is historical bundled text, not evidence of a working
remote service. Native `nzv:` routing is not executed by this conversion.

The root `www/index.html` is a development/test navigation page, with remote
test endpoints and private-value form fields. It is not the consumer offline
screen and is not published or executed.

`scripts/firmware/zone_local.py` is the narrow reproducer. Run it with the private
Nintendo Zone extraction and the public delivery directory, after the normal
Zone selection publisher. It verifies title/package identity, exact source
dimensions/frame counts and PNG pixel round trips. Each image retains source
file SHA-256, decoded frame index, dimensions and PNG hash; the pack records the
conversion script hash. Re-running the ordinary Zone selection replaces its
pack list, so re-run this additive step afterwards.

The exported offline, no-content and upper frame-0 bitmaps were inspected.
The combined delivery audit passes at 1,375 resources, 472 layouts and 1,591
animations (private `stock-ui/zone-eshop-audit.json`). Final screen placement and
navigation are coordinator-owned browser checks.

## eShop controls in the same delivery

The eShop subset now contains `cad-CommonBtn-arc-lz.json` with `OKBtn_D_00`,
`backBtn_D_00`, `selectBtn_D_00/01`, `infoBtn_D_01`, `listBtn_D_00` and their
matching source clips. `OKBtn_D_00` has both `T_OK_00` and `T_OK_01` text layers;
override both consistently if using a source English message.

`welcome_D_00` contains `T_message_00` and the `OKBtn_D_00` parent mount beneath `N_root_00`, at translation `[0,-89,0]`. The renderer attaches the source button at that mount; both text layers receive the English OK label.

Also delivered are Common `message_D_00/U_00`, `position_D_00`,
`sysMenu_D_01/02`; CommonWin `ErrorDialog_D_00`, `dialog_D_00/U_00`; Entrance
`searchBtn_D_00`, `searchTop_D_00`, `newsText_D_00`, `position_U_00`. The full
selection is in `stock-ui-eshop.json`: 85 resources / 1,257,600 bytes including
shared dependencies. Remote catalog content remains absent.
