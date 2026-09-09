# HOME Menu reference record

Target hardware: original SPR-001 Silver + Black 3DS XL. Target supplied software: European 11.17.0-50 firmware. Hardware launch year and firmware UI revision are distinct: avoid copying a 2012 toolbar into an 11.17 recreation without checking later changes.

## Nintendo references inspected

- [Original XL operations manual](https://www.nintendo.com/eu/media/downloads/support_1/nintendo_3ds_14/Nintendo3DSXL_OperationsManual_UK.pdf), printed pages 32–35 (PDF spreads 16–17): screen/status overview, icon selection/opening, scrolling and icon-layout adjustment. Nintendo documents tapping side arrows or sliding to scroll, and holding then dragging to relocate icons. It also describes microphone-sensitive rotation on the upper screen. This manual revision includes Miiverse, so it is not an exact 2012 launch capture or a verified 11.17 capture.
- [Nintendo HOME Menu theme instructions](https://www.nintendo.com/en-gb/Hardware/Nintendo-3DS-Family/Download-Content/HOME-Menu-Themes/How-to-Download-Change-Themes/How-to-Download-Change-Themes-923154.html): establishes that later firmware uses a HOME Menu Settings control at upper left. The current authored brightness sun is therefore not a verified 11.17 toolbar.
- [Nintendo layout save/load instructions](https://en-americas-support.nintendo.com/app/answers/detail/a_id/14454/~/how-to-save-and-load-home-menu-layouts): later HOME Menu settings include stored layouts. This functionality is not implemented in the portfolio shell.

These references support behavior and identify differences; they are not production icon assets. No reference image has been installed into the application. Exact per-pixel toolbar coordinates, icon grid densities, glyph sizes, and animation timing still need a native-resolution capture of the intended firmware with its default theme. No screenshot comparison was completed in this pass.

## Keep separate during integration

1. Hardware legend typography is independent of the shared system font.
2. Generic program icons are not HOME Menu toolbar graphics. Firmware title contents and their layout resources must be inspected before selecting replacements.
3. Passing menu-state tests establishes input behavior only. It cannot establish that authored folder graphics resemble Nintendo's assets.
4. The upper display uses a 400×240 monoscopic logical layout. An 800×240 backing image does not imply an 800:240 physical screen.

See `firmware-assets.md` for the verified encryption blocker, converter limits and integration API.
