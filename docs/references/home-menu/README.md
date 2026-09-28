# HOME Menu visual sources — uifix, 2026-09-16

Target: the original XL running the theme-enabled, default white HOME Menu. The physical console's original 2012 generation does not mean it must run launch firmware. The original four empty folders have now been superseded by the user’s requested real portfolio apps on `uifix`; see `docs/portfolio-os-validation.md`.

## Primary references inspected

- [Nintendo: How to Download & Change Themes](https://www.nintendo.com/en-gb/Hardware/Nintendo-3DS-Family/Download-Content/HOME-Menu-Themes/How-to-Download-Change-Themes-923154.html). Native resources below provide the toolbar, status strip, grey palette, mint selection corners, settings drawer, and theme picker.
- [Native HOME Menu, 400×480 BMP](https://www.nintendo.com/eu/media/images/06_screenshots/systems_4/nintendo_3ds_10/nintendo_3ds_themes/eng_2/3DS_S_HOMEMENU_Settings_Icon_EN.bmp). Losslessly converted to `official-home-native.png`. The bottom 320×240 screen starts at (40,240). This screenshot selects HOME Menu Settings, so it is not evidence for a folder banner. The top is 400×240 per eye, not 800×240 in physical aspect.
- [Native settings drawer](https://www.nintendo.com/eu/media/images/06_screenshots/systems_4/nintendo_3ds_10/nintendo_3ds_themes/eng_2/3DS_8thNUP_UK_euros_1007_1122_02.png), saved as `official-settings-full.png` (320×241).
- [Native theme picker](https://www.nintendo.com/eu/media/images/06_screenshots/systems_4/nintendo_3ds_10/nintendo_3ds_themes/eng_2/3DS_8thNUP_UK_euros_1007_1123_02.png), saved with that basename (319×242).
- [Original 3DS XL UK operations manual](https://www.nintendo.com/eu/media/downloads/support_1/nintendo_3ds_14/Nintendo3DSXL_OperationsManual_UK.pdf), HOME Menu / folder pages. Native and downsampled embedded screenshots were extracted with `pdfimages -f 17 -l 20 -png`. These show column-major navigation, small recessed empty slots, cyan folders, side arrows, footer actions, and the separate folder contents view. This older menu's green cursor and toolbar positions differ from theme-enabled firmware; those differences were not copied into the new toolbar.
- [Nintendo of America: Nintendo 3DS New Owner's Guide — Home Menu](https://www.youtube.com/watch?v=oJwr-L4V-FE), and [Nintendo3DS: A (Very) Rough Guide to the HOME Menu](https://www.youtube.com/watch?v=6FKl3eJsRcc). Located, but video-file retrieval returned HTTP 403. No claim is made to have reviewed inaccessible frames or measured animation from these videos.

No attached user video was available in this conversation. The screenshots above, rather than an unseen video, are the basis of this pass.

## Additional asset investigation

[The Spriters Resource HOME Menu catalogue](https://www.spriters-resource.com/3ds/systembios/) was inspected. The catalogue contains individual built-in application artwork; none was mistaken for a complete HOME Menu resource set or bundled in this pass.

The [rcyggdra Shared-Font repository](https://github.com/rcyggdra/Shared-Font) is a modified Chinese font pack and was rejected as an authenticity reference. The NTLG conversion used here is from the separately pinned ctrfonts source documented in `public/os/README.md`. Its metadata does not establish identity with the owner's encrypted BCFNT or the HUD-specific font.

All downloaded reference documents/images were treated as data.
