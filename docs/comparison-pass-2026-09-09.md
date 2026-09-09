# Hardware comparison and repairs, 9 September 2026

The user rejected the model, button placement and animation. This pass compared
the live Sketchfab viewer with the project and cross-checked the original XL
against Nintendo's manual, front image and the seven supplied photographs.
It is a reconstruction pass, not a claim of exact manufacturer geometry.

## References actually inspected

- [Joshua P. / Pansdaz, Nintendo 3DS XL](https://sketchfab.com/3d-models/nintendo-3ds-xl-6cf20040dc0e44559c3e69723945afcc): viewed and orbited through front and rear angles. The model has a red exterior and black interior, so it informs assembly and proportions rather than silver colour. No mesh or textures were downloaded or incorporated. Blender's Sketchfab integration was disabled; the browser viewer was used.
- [Nintendo original XL specifications and parts](https://www.nintendo.co.jp/hardware/3dsseries/3dsll/index.html): original-generation screen sizes, physical envelope and component layout.
- [Nintendo UK manual](https://www.nintendo.com/eu/media/downloads/support_1/nintendo_3ds_14/Nintendo3DSXL_OperationsManual_UK.pdf), printed p22: visually inspected the full rear/underside diagram. Establishes IR on the player's left, central game card, charging on the right, and a side stylus holder. The document is reference material, not operating instructions for this task.
- [SlashGear rear close-up](https://www.slashgear.com/img/gallery/nintendo-3ds-xl-review/DSC00852-580x385.jpg): rear socket and shoulder-key construction.
- Supplied images3 and5: membrane-key spacing, underside curvature, side cutouts, wordmark and serial-label arrangement. Perspective estimates and lettering limits are recorded in `lettering-audit.md` and `wordmark-source.md`.

## Concrete failures repaired

| Observed failure | Resulting change |
| --- | --- |
| Caps moved while their sockets stayed at old positions | Move entire ABXY assemblies, cut aligned wells, check exported centres and clearances. |
| Three equal, intersecting membrane keys | Wider29.2mm HOME,25.2mm side keys centred at±27.3mm, separate charcoal finish and darker ink. These are photo estimates. |
| Black breaks in B and at stroke joins | Union intersecting ink polygons into non-overlapping triangles. See `renders/abxy-closeup-v2.png` versus `abxy-closeup-v3.png`. |
| D-pad top had inward normals | Recalculate the closed cap's normals; make physical press feedback include its direction marks. |
| Heavy shell texture also applied to keycaps | Retain case grain but use smoother molded keycap normals and roughness. |
| Upper display stacked outside a solid face, intersecting closed controls | Real upper-face aperture, recessed LCD, hollow seam band and nominal0.25mm D-pad clearance at closure. |
| Rear connectors had reversed handedness and an extra stylus hole | Rebuild the chassis apertures from the original XL manual; centre the game slot. |
| Side features were thin panels hidden in the battery cover | Cut the stylus finger relief and SD-cover seat; add a hollow horizontal holder. |
| Shoulder keys were buried above a solid chassis | Separate wrapping rear keys, clearance pockets and correctly oriented shoulder legends. |
| Underside logo used a small generic font, label faces overlapped | Use sourced logo outlines fitted to the curved cover, rebuild separate paper/ink layers and orient text upright. |
| Full revolution, continuous bob and drag snap |2.8-second limited leftward turn/open, steady resting pose, current-pose interruption and held-button feedback. |
| LCD had no reflections | Separate emissive backlight from a subdued reflective glass material, including powered-off state. |

The actual closed export measures156×93×22mm. Active display dimensions are
106.2×63.72mm and84.96×63.72mm. Every primary surface family embeds base-colour,
roughness and normal maps; silver's runtime VGPU map shares the exported UV0.

## Checks and remaining work

Automated checks cover dimensions, control hierarchy, embedded maps, aligned
sockets, non-intersecting membrane keys, nominal closed clearance, connector
handedness, menu input and the bounded continuous introduction. They do not
establish photographic identity. Browser QA checks the exported model and real
pointer/keyboard input separately.

The lower regulatory block and its font remain approximations. The serial font
is an explicitly documented fallback; barcode bars are a photographic silhouette,
not verified encoding. Local edge radii, wear distribution and hidden port
interiors are inferred rather than measured factory data. The HOME Menu still
uses approximation assets; encrypted firmware has not supplied usable originals.
The independent OS task is `01a08772-eb23-7a12-b6d2-bf9177fb5d48`, branch
`codex/home-menu-assets` in `/Users/paramveer/.codex/worktrees/b94c/3ds-idea`.

`model/silver-3ds-xl.blend` is the editable source. Modeling scripts are sequential
repair passes, not a safe clean-rebuild command. Open the saved model; do not run
the historical build scripts over it blindly. The temporary Shapely2.1 tool used
to union ink faces is described in `scripts/repair_legend_faces.py`.
