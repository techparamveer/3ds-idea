# Original 3DS XL hardware lettering and control audit

Date: 2026-09-09. Scope: original 2012 Silver + Black SPR-001 exterior. This audit concerns physical legends, not the HOME Menu font. The source photographs and Nintendo documents are reference data, not instructions.

## Evidence inspected

- [Nintendo original 3DS LL specifications and component list](https://www.nintendo.co.jp/hardware/3dsseries/3dsll/index.html). The lower active LCD is 84.96 × 63.72 mm. This is the physical scale anchor used below; Nintendo does not publish the button diameters or label cap heights on this page.
- [Nintendo UK operations manual](https://www.nintendo.com/eu/media/downloads/support_1/nintendo_3ds_14/Nintendo3DSXL_OperationsManual_UK.pdf), printed pages 20–22: control identities and original SPR-001(EUR) layout. Its diagrams do not establish a hardware typeface or exact silkscreen dimensions.
- [High-resolution TechRadar front photograph](https://cdn.mos.cms.futurecdn.net/0584727e6f39c0e334d6e9537772f9fa-1794-80.jpg), inspected in the browser at native image scale. This is the strongest front-label comparison of the inspected sources.
- [SlashGear right-control close-up](https://www.slashgear.com/img/gallery/nintendo-3ds-xl-review/DSC00846-580x385.jpg), inspected in the browser. It distinguishes the bright A/B/X/Y legends from the much darker POWER text and control-deck markings.
- User images 3, 5 and 7 inspected locally. Image 3 independently supports the front arrangement; image 5 is the detailed European underside, including the logo, small print, regulatory symbols and serial sticker; image 7 supports the dished pad, raised caps and low-contrast deck legends.

No exact hardware font name or manufacturer outlines were established. Claiming Helvetica, Arial or a newly authored outline is Nintendo's font would be unsupported.

## Authoritative current asset measurements

Measured from `public/models/silver-3ds-xl.glb` POSITION accessor bounds and the corresponding node transforms, before the new reconstruction pass. Values are native model millimetres; the glTF root converts them to metres. The plane axes in glTF are X and Z. The numbers below describe actual exported mesh extents, not the text object's nominal `size`.

| Existing node | Width × cap height, mm | Defect supported by reference |
| --- | --- | --- |
| A print | 0.959 × 1.074 | Much smaller than the clearly legible broad letter on the cap. |
| B print | 0.829 × 1.074 | Same undersizing. |
| X print | 0.943 × 1.074 | Same undersizing. |
| Y print | 0.957 × 1.074 | Same undersizing. |
| SELECT print | 4.062 × 0.804 | Reference word is roughly 11 mm wide. |
| HOME print | 3.045 × 0.804 | Reference word is roughly 9 mm wide, plus a separate house symbol. |
| START print | 3.412 × 0.802 | Reference word is roughly 9 mm wide. |
| Power print | 2.850 × 0.591 | Word occupies a substantially greater part of the space between power cap and case edge in the reference. |
| MIC print | 1.286 × 0.566 | Too small at comparable frame scale. |
| 3D print / OFF print | 1.204 × 0.735 / 1.206 × 0.473 | Undersized compared with the native-scale front photograph. |
| Bottom branding | 27.614 × 2.364 | Wrong wordmark construction and roughly half the photographed width. |
| Bottom model marking | 18.901 × 0.881 | A single short line substitutes for a much wider multi-line label. |
| Bottom compliance | 21.468 × 1.038 | Plain text substitutes for an actual row of distinct symbols and Nintendo lozenge. |
| Serial number | 7.476 × 0.944 | `SPR 3DS XL` is model-identifying filler, not the serial/barcode layout visible in image 5. |

The mesh measurements contradict any inference that setting Blender text `size=2.4` produced 2.4 mm tall A/B/X/Y letters. `final_details.py` loads `/System/Library/Fonts/Helvetica.ttc`; this file's glyph outlines and metrics were never verified against Nintendo hardware.

All front legends currently share `Warm grey pad printing`, whose base color was set to linear (0.20, 0.24, 0.25). The reference requires at least two distinct treatments: brighter A/B/X/Y and D-pad bars; darker SELECT/HOME/START, POWER, MIC, 3D and OFF. Enlarging every legend while retaining the same bright material would create a different error.

## Photographic calibration and estimated targets

The TechRadar source was displayed at native image scale in a 1280 × 720 browser viewport. Its visible lower LCD quadrilateral was picked at approximately `(441,396), (877,396), (902,632), (418,632)` pixels, clockwise from the rear-left corner. A planar homography mapped these to the official 84.96 × 63.72 mm active rectangle, using the existing local display centre `(0,-1)` only to express positions in the model's coordinate convention. Positive Y points toward the hinge. This compensates for the photograph's perspective within the deck plane.

These are estimates from hand-picked pixels. The LCD border, raised controls, camera perspective and uncertain pixel edges limit accuracy; the estimates are not manufacturing dimensions. Centre positions are plausibly uncertain by roughly 0.5–1 mm, with greater uncertainty in projected cap height or peripheral geometry. Verify with a matched render before changing geometry.

| Component | Picked centre (px) | Estimated centre (mm) | Existing scripted centre (mm) | Practical action |
| --- | --- | --- | --- | --- |
| Circle pad | 337,448 | −61.3,15.6 | −61,15 | Position is already close; do not enlarge/move merely because other details are wrong. |
| D-pad | 323,544 | −61.4,−10.6 | −61,−13 | Investigate moving approximately 2 mm toward the hinge. |
| X | 978,440 | 60.9,17.9 | 61,16 | Whole ABXY cluster appears about 2–3 mm too far toward the front. |
| Y | 941,466 | 53.2,10.5 | 53,8 | Preserve horizontal arrangement; assess shared Y shift. |
| A | 1023,466 | 68.6,10.5 | 69,8 | As above. |
| B | 984,492 | 60.5,3.3 | 61,0 | As above. |
| SELECT | 503,659 | −27.3,−39.4 | −29,−39.7 | Check strip widths and separators; centre is around 2 mm too far left. |
| HOME | 660,659 | 0,−39.4 | 0,−39.7 | Position is close; glyph group needs much greater width. |
| START | 815,659 | 26.9,−39.4 | 29,−39.7 | Check strip widths and separators; centre is around 2 mm too far right. |

The A cap's approximate horizontal edges `(1003,466)` and `(1043,466)` map to about 7.55 mm width, compared with the modeled diameter of 6.1 mm. The raised cap is above the calibration plane, so use a 7–7.5 mm trial and compare silhouettes rather than treating 7.55 as exact. The letter itself is approximately 2.6 mm wide. Letter height is less certain because of foreshortening; a 2.7 mm cap-height trial is justified, versus the exported 1.074 mm. The SELECT word edges `(471,659)` and `(535,659)` map to about 11.1 mm width. Its height is approximately 2 mm, with at least several tenths of a millimetre uncertainty.

## Glyph construction corrections

1. A/B/X/Y should use explicit cap-height outlines, centred visually on each current cap. A has a broad apex and low crossbar; B has two rounded bowls; X has straight, gently rounded strokes; Y has a fork and upright stem. Avoid serif details, condensed text and heavy bevels. The font family remains unverified.
2. The bottom strip uses widely spaced, broad uppercase text. Treat SELECT, HOME and START as separately measured groups. Add the small house outline beside HOME rather than using a Unicode character that depends on a system font. The black label treatment is essential to match the reference.
3. POWER is a small dark word to the right of the power symbol. D-pad direction bars and A/B/X/Y are brighter than that word. Do not use one global print material to adjust all of them.
4. 3D and OFF sit beside the slider, with a thin diagonal/depth-scale mark visible between them. Enlarging the words alone does not reproduce that molded mark; it remains a separate detail.
5. The underside is a designed wordmark: thin, wide NINTENDO, an outlined dual-screen symbol, bold 3DS, and narrower XL. One Helvetica line is structurally wrong. User image 5 suggests a total logo width around 50 mm and height around 5–6 mm, compared with the current 27.6 × 2.36 mm. This estimate uses the body width for scale and is not corrected for perspective. The stencil is monochrome black on silver; the red 3 from the screen/marketing logo must not be copied onto the battery cover.
6. Image 5 shows several lines of small technical text, a separate row of certification/recycling symbols and a Nintendo oval, and a white barcode label. The stylus obscures some text. Do not invent obscured language or draw fake certification glyphs from guessed Unicode. Keep this explicitly incomplete until supported outlines/text are available.

## Reviewable implementation prepared

`scripts/hardware_lettering.py` is a standalone Blender pass prepared for the main modeling agent. **It was authored and syntax-checked, not executed in Blender.** It changes only named front legend meshes and the D-pad-bar material. It does not rebuild the model, change control dimensions, save, export, or replace underside branding.

The pass uses manually authored flat vector strokes and explicit millimetre extents, with separate brighter control and darker deck materials. It derives A/B/X/Y and strip label locations from the current button objects so a geometry pass can move them first. Its outlines remain a photographic reconstruction; they must be compared in Blender and the exported browser view. They are not a verified Nintendo font asset. The source comments and object metadata preserve this limitation.

Before running it, preserve a `.blend` checkpoint and confirm the scene uses native millimetres with the `3DS_XL` root at scale 1. After it runs, inspect a close front render with the same camera as the TechRadar source. Confirm that cap letters are legible, the bottom strip is still subtly dark, words fit within separators, and labels remain on their surfaces. Only then save/export and inspect at the website's normal viewing scale. Current script targets for MIC, POWER, 3D and OFF are visual estimates and should be adjusted if a matched view exposes overlap or disproportion.

## Follow-up: unequal control-strip widths and material contrast

The subsequent review of `renders/textured-open-v1.png` found that the three equal-width strip caps do not match the photograph. In user image 3, the lower LCD is approximately bounded by top corners `(120,265),(362,265)` and lower corners `(108,394),(372,394)`. The lower edge is therefore about 264 pixels wide; using the narrower top edge to scale the strip would overestimate its width. Extrapolating the LCD-plane homography to the strip at approximately `y=410` gives about 267 pixels for an 84.96 mm-wide rectangle.

At that row the keys run from approximately image X115 to X366, with separators near X194 and X286. The strip is therefore about 80 mm wide. Its middle HOME cap is approximately 29.3 mm wide, while the outside caps are approximately 25.2–25.5 mm wide. This agrees with the visibly wider HOME cap in the higher-resolution TechRadar photograph. The practical reconstruction targets are **HOME29.2 mm, SELECT/START25.2 mm, side centres at X±27.3 mm**, leaving approximately 0.1–0.2 mm seams. Those are perspective-corrected photographic estimates, not official factory measurements. Preserve the approximate Y−39.7 mm row position and assess the common depth around 6.2 mm in a matching view.

The real separators are close, straight vertical divisions. Giving all four corners of each cap the same large radius creates dark notches at the internal joints. Use very small corner radii at HOME and at the inner ends of SELECT/START, retaining broader rounding only at the outside ends of the complete row.

Pixel sampling of user image 3 provides a useful relative material check: blank SELECT-key areas are around 58–60 on the 0–255 sRGB scale, nearby deck around 54–57, and dark letter cores around 19–33. The letters are therefore darker than the keys; switching them to bright gray would contradict this source. These image values include exposure and lighting and must not be treated as measured surface albedo.

The generated graphite map averaged RGB31/34/36 sRGB in the follow-up, corresponding approximately to linear0.014/0.016/0.018. Existing ink at linear0.009/0.011/0.012 was too similar relative to that substrate. A useful material trial is a separate key-strip base color **linear(0.022,0.025,0.027)** with roughness around0.48–0.52, and ink **linear(0.004,0.005,0.006)** with roughness around0.58. This makes the row slightly lighter than the deck and restores dark-text contrast. The main modeling agent reported applying these trial colors and the unequal widths; they still require inspection in the newly exported browser model.

The reviewed GLB's labels were at Z13.432 mm above the cap's Z13.42 mm top, and the deck top was lower. That export did not support the theory that its faint labels were buried in the deck. The likely issues were relative material contrast and strip geometry. The old render/export also preceded the live width corrections; it must not be treated as evidence that subsequent edits failed.
