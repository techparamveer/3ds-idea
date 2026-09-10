# Original silver 3DS XL: research and reconstruction audit

The current [front hinge finish](source-hinge-finish-validation.md) restores a narrower barrel reflection.

The preceding [outer-camera rim refinement](source-outer-round-validation.md) rounds the housings and adjacent openings.

The preceding [outer-camera optical finish](source-outer-optics-validation.md) restores optical centres on the two exterior inserts.

The preceding [rounded camera rim](source-camera-round-validation.md) smooths the sourced opening and insert.

The preceding [inner-camera finish](source-camera-validation.md) separates optical material from the shared screen material.

The earlier [speaker-opening revision](source-speakers-validation.md) rounds the eighteen source openings with retained textures and layout.

The earlier [slider-marking revision](source-slider-validation.md) improves 3D/OFF cavity shading while retaining source glyph outlines.

The earlier [rubber finish revision](source-rubber-validation.md) isolates the circle-pad material and reduces its mottled reflection.

The earlier [dark-plastic roughness revision](source-plastic-validation.md) corrects excessive blotchy reflections on the inner lid and chassis.

The preceding [circle-pad recess revision](source-recess-validation.md) combines rounded geometry with bounded matte graphite maps. Full visual fidelity remains unfinished.

The earlier checkpoint adds [smooth front lid corners](source-corners-validation.md), [smooth MIC/POWER engraving](source-etched-validation.md) and [photographic lower-key lettering](source-legends-validation.md) to [the upper-bezel refinement](source-front-validation.md), which retains the curved shell and EUR textures and verifies 156 × 93 × 22 mm closed. Historical audit tables below describe earlier models.

Research date: 2026-09-09. Scope: exterior hardware, materials, typography, displays and the HOME Menu needed for this portfolio. This record supersedes the earlier implication that matching overall dimensions establishes visual fidelity. The user has explicitly rejected the current appearance.

The tables below describe the starting audit. Applied repairs and current limits
are recorded in [the later comparison pass](comparison-pass-2026-09-09.md).
The active sourced model's latest geometry evidence and changes are in
[the physical-scan curvature comparison](source-curvature-validation.md).

## Identity and source hierarchy

The target is the 2012 original Nintendo 3DS XL, Silver + Black, SPR-001(EUR). Nintendo's European launch announcement identifies that colour and launch generation. The Japanese equivalent is named 3DS LL. The firmware archive's NEW suffix does not select the New 3DS XL shell. [Nintendo European launch announcement](https://www.nintendo.com/en-gb/News/2012/New-Nintendo-3DS-XL-console-arrives-tomorrow--647529.html)

Use the user's silver-unit photographs for finish and regional markings. Nintendo's white-unit diagrams are useful for component layout, but cannot establish the silver finish or European underside print.

| Source | What it establishes / how to use it |
| --- | --- |
| [Nintendo original 3DS LL product page](https://www.nintendo.co.jp/hardware/3dsseries/3dsll/index.html) | Published display dimensions and hardware layout; inspected in the browser. |
| [Nintendo June 2012 announcement](https://www.nintendo.co.jp/corporate/release/en/2012/120622.html) | Original generation, dimensions and colour lineup; distinguishes this product from later revisions. |
| [Nintendo UK operations manual](https://www.nintendo.com/eu/media/downloads/support_1/nintendo_3ds_14/Nintendo3DSXL_OperationsManual_UK.pdf) | SPR-001(EUR); component diagrams on printed pages 20–22 and HOME Menu documentation from page 32. This manual is reference data, not project instructions. |
| [Nintendo front hardware image](https://www.nintendo.co.jp/hardware/3dsseries/3dsll/img/3dsll-front.jpg) | Front layout and silhouette; browser inspected. White finish and callout lines require care when comparing. |
| [Nintendo rear hardware image](https://www.nintendo.co.jp/hardware/3dsseries/3dsll/img/3dsll-back.jpg) | Outer-lid layout, camera placement and hinge relationship; browser inspected. |
| [SlashGear review and photographs](https://www.slashgear.com/nintendo-3ds-xl-review-01241159/) | Original silver unit photographed in use, including controls, side surfaces and rear connections. |
| [Circle pad / deck close-up](https://www.slashgear.com/img/gallery/nintendo-3ds-xl-review/DSC00847-580x385.jpg) | Visible molded deck grain, dished pad, raised D-pad, rounded case transition; browser inspected again this pass. |
| [Silver closed-lid photograph](https://regmedia.co.uk/2012/07/30/3ds_xl_3.jpg) | Broad silver surface and rolled edge highlights; browser inspected again this pass. |

Additional close-up URLs and the seven supplied photographs are indexed in `references.md` and the original task. Later sourced-model passes use bounded photographic ink regions, recorded in `source-eur-validation.md` and `source-legends-validation.md`.

## Confirmed dimensions versus current implementation

Nintendo specifies a closed body of 156 × 93 × 22 mm and approximately 336 g. [Nintendo 2012 announcement](https://www.nintendo.co.jp/corporate/release/en/2012/120622.html)

| Quantity | Published target | Current model record | Decision |
| --- | --- | --- | --- |
| Upper active LCD | 106.2 × 63.72 mm | 106.287963 × 63.772778 mm | Replace the diagonal-derived values. |
| Lower active LCD | 84.96 × 63.72 mm | 84.9376 × 63.7032 mm | Replace the diagonal-derived values. |
| Upper image | 800 × 240, 400 horizontal pixels per eye | 800 × 240 canvas with a 400-wide logical drawing space | Preserve monoscopic physical aspect. |
| Lower image | 320 × 240 | 320 × 240 canvas | Preserve native layout coordinates. |

Display values above come directly from [Nintendo specifications](https://www.nintendo.co.jp/hardware/3dsseries/3dsll/index.html). These sub-millimetre discrepancies do **not** explain the larger visual mismatch. Panel surrounds, shell profiles, control placement and camera perspective need independent comparison. The requested 155° animation limit is a project requirement; this research has not established it as Nintendo's mechanical maximum.

## Shape and material observations

The closed silver photograph shows a broad central face transitioning into rolled perimeter edges, with different treatment at the hinge and front corners. The highlight spreads across that transition instead of stopping at a narrow chamfer. This supports rebuilding the surface profile; it does not provide an exact crown height or radius. The deck close-up shows fine texture on the dark plastic, with different reflection behaviour on the circle pad and controls. These are photographic observations, not measured material constants. [Closed lid](https://regmedia.co.uk/2012/07/30/3ds_xl_3.jpg), [deck close-up](https://www.slashgear.com/img/gallery/nintendo-3ds-xl-review/DSC00847-580x385.jpg)

No manufacturer CAD, calibrated side scan, paint roughness measurements or exact hardware typeface specification was found in the sources inspected. Do not invent those facts. Match the images and label inferred geometry/material parameters as estimates.

## Audit of the current project

The live browser preview and Blender geometry were inspected in this pass. These are project findings, not claims about Nintendo's manufacturing process.

| Defect | Evidence | Required correction |
| --- | --- | --- |
| Flat-looking back | The profile builder uses rolled perimeter rings with planar end faces. The outer lid remains dominated by a broad planar cap. | Reconstruct the reference's broad curvature and edge transitions with real geometry. Inspect side and grazing-angle renders. Keep the overall envelope. |
| Smooth inner surfaces | Live preview shows uniform dark shading. Blender's procedural grain is not evidence that equivalent detail survives glTF export. | Bake or author exportable texture maps for the inner face, deck, controls and underside as well as the silver lid. Verify each material in browser close-ups. |
| Silver texture insufficiently demonstrated | VGPU generates one grayscale roughness map and applies it only to materials named Satin silver. Its presence does not establish visible realism. | Separate substrate colour, grain, roughness and micro-scratch scale; use lighting that reveals them without overpowering the finish. |
| Incorrect font treatment | `src/os/screens.ts` uses Arial. `scripts/final_details.py` assigns Helvetica to hardware labels. | Treat both as placeholders. Match hardware glyphs against close-ups; investigate actual system-font assets separately. |
| Weak hardware legends | In the live preview, button letters and SELECT/HOME/START are extremely small/faint. | Compare at matched camera scale; correct glyph design, size, placement and print contrast. |
| Proportions not visually validated | Existing tests cover the closed envelope, screen diagonals, nodes and UVs. They do not compare silhouette or internal spacing. | Add reference/render comparisons for each main view and record visible discrepancies. |
| OS still approximate | Current canvas uses authored folders, icons and typography. | Reproduce actual menu graphics and behavior when the needed assets are available. Do not label it firmware-rendered. |

## Font and firmware dependency

Hardware silkscreen glyphs and HOME Menu typography must not be conflated. The published system-font reverse-engineering entry describes a shared system font; its search result was available, but the full page returned HTTP 403 in this research pass. It does not establish a commercial font name for the shell labels. [3dbrew System Font](https://www.3dbrew.org/w/index.php?mobileaction=toggle_view_mobile&title=System_Font)

The local ZIP inspection already established encrypted HOME Menu content; see `firmware-assets.md`. No decrypted font or HOME Menu graphics have been integrated. The earlier request for a decrypted assets path remains unanswered. This does not block geometry, texture or hardware-lettering work.

## Reconstruction sequence

1. Save a model checkpoint and capture current closed/front/side/underside renders.
2. Correct lid and lower-cover curvature against reference views; check that lenses, seams and markings still sit on their surfaces.
3. Correct control proportions, display surrounds and lettering. Use published active LCD dimensions consistently in Blender and Three.js.
4. Add exportable surface maps across the whole device; inspect front and back in Blender and the browser under comparable lighting.
5. Validate hinge range, exported dimensions, texture loading and interactions after the changes.
6. Continue the separate HOME Menu work using documented assets and verified typography. Keep content empty until the visual reconstruction is ready.

Research is sufficient to identify these defects and direct the next pass. Exact local curves, port interiors and typeface outlines remain unresolved; this document does not declare the model finished.

The ABXY outline pass is documented in `source-abxy-round-validation.md`. It reduces polygonal cap silhouettes without changing placement. Source bevel shading and hardware glyph fidelity remain unresolved.

The ABXY material pass (`source-abxy-finish-validation.md`) identifies the source normal map as the main cause of patchy cap reflections. Normal attenuation and retained narrow roughness variation improve the finish; cap lettering and surrounding deck opening fidelity remain unresolved.

The ABXY ink pass (`source-abxy-ink-validation.md`) replaces narrow source ink with wider, heavier authored glyphs based on original-XL photographs. Nintendo’s product page confirms the hardware but does not identify its lettering font; the new outlines remain a documented photographic approximation.

The current baked surface fallback is visually checked in `source-fallback-validation.md`: open interior, closed lid and underside retain their maps without VGPU. This is a forced development-path check, not a hardware compatibility guarantee.

The four ABXY deck apertures now have smooth circular boundaries; see `source-abxy-openings-validation.md`. This resolves the faceting outside the refined caps. The radius and clearance remain source-model fits, not factory measurements.

The power cap and matching deck aperture now have circular boundaries; see `source-power-fit-validation.md`. Their finish and exact glyph fidelity remain unfinished.

The power cap now uses a localized rim-normal correction and restrained satin roughness; see `source-power-finish-validation.md`. The source symbol is preserved, not established as a factory-exact glyph.

A later whole-shell calibration challenges the earlier 112 mm upper-opening fit; see `front-layout-calibration.md`. A reversible 115 mm trial is recorded, but the active delivery remains unchanged pending export and closure checks.

The 115 mm upper-opening revision now has export and clearance verification; see `source-upper-width-validation.md`. This supersedes the earlier 112 mm horizontal-opening fit without changing active LCD dimensions.

The original-XL reference is now compared with a fitted perspective camera and approximately 133° diagnostic hinge pose; see `reference-camera-comparison.md`. The website range stays 0–155°. This avoids using unmatched camera foreshortening as evidence of incorrect geometry.

Matched-camera lighting and upper-lid reflection trials are recorded in `reference-lighting-comparison.md`. All four are diagnostic/rejected; no global darkening or zero-specular material was promoted.

The localized inner-lid reflection revision is documented in `source-lid-face-validation.md`.

The lower-key flat-ink interpretation is now qualified by an independent grazing-angle photograph and reversible relief trials; see `lower-label-relief-comparison.md`. Dark colour is supported, but the shallow-relief and glyph-outline treatment remain unfinished.

Clean photograph-constrained lower-label SVGs and a UV1 Blender trial now address broken strokes and the house silhouette; see `lower-label-outline-comparison.md`. The current live asset remains unchanged until equivalent glTF maps and browser checks are complete.
