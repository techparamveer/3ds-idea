# Unpromoted silver scratch trials

Historical trial record: a restrained-grain revision of these scratch maps is now installed in `silver-restrained-paint`; see `source-restrained-paint-validation.md`. The original trial maps below remain preserved and were not installed directly.

Starting checkpoint: `silver-abxy-openings.blend`. The live model remains unchanged. These are material diagnostics, not a completed or accepted scratch treatment.

The supplied `image-4.png` shows a worn silver original XL with restrained hairlines and edge wear. The standard 40 mm-wide lid and underside macros (`surface-scale-before-*.png`) show existing fine grain but little distinct hairline wear. The reference photo is not a calibrated macro or a matched lighting setup, so it cannot establish exact microstructure dimensions.

`export_paint_uv_data.py` records the closed lid/chassis world coordinates in millimetres and their atlas UVs into `.local/paint-{lid,cover}-uv.npz`. It restores the scene actions and transforms. `build_paint_scratches.py` authors sparse deterministic segments, tapers their ends, and rasterizes them into each existing roughness map through the EUR silver-paint mask. There are 23 lid and 15 underside strokes; random segment lengths are 2.5–9 mm, half-widths 0.045–0.08 mm, and peak roughness increments 0.07–0.12. These are appearance estimates, not Nintendo material measurements. Red/blue channels and unpainted pixels stay unchanged. Roughness changes 2,035 lid pixels and 1,850 underside pixels.

The initial roughness-only trial is recorded in `surface-scratches-trial-*.png`. Compared with the standard-light macros, the maximum channel difference was only 2/255 on either panel. This was too weak to justify promotion as a visible improvement.

`render_sourced_dimensions.main()` now accepts optional camera-relative light offsets; defaults are unchanged. `inspect_paint_reflection.py` uses that option with narrower area lights and lower ambient illumination, restoring all settings afterward. The before/after renders are `paint-reflection-{before,after}-{lid,cover}.png`.

The current trial generator also perturbs the normal map with a shallow groove derived from the scratch field. Its nominal two-micrometre depth assumes approximately 13 atlas pixels per millimetre; that scale is approximate and does not account exactly for local UV distortion or anisotropic scaling. The source normals and unedited areas remain otherwise intact. This is a trial normal perturbation, not newly cut mesh geometry.

Under the narrower reflection, the current groove-plus-roughness trial produced a lid maximum channel difference of 22/255, with 2,849 pixels changing by more than 3/255. The underside maximum remained 2/255. Numeric differences establish that the material affects rendering; they do not establish realistic appearance. The lid macro still has a strong grain pattern that makes the individual hairlines difficult to judge, and the underside reflection remains too weak for acceptance.

No trial maps were installed in the saved Blender checkpoint or public GLB. Both preview scripts use temporary material copies and restore the original assignments. No application code changed. Next work should validate the groove coordinate scale and obtain a useful matched reflection on the underside before deciding whether to retain or replace the trial. Do not describe these maps as live or the scratch requirement as completed.

## Corrected underside reflection inspection

After the authorized Blender restart, pixel inspection ruled out the graphite roughness pass as the cause of the dark underside: zero fully painted pixels differ between `body-socket-metallic-roughness.png` and `socket-graphite-metallic-roughness.png`. At the explicit lid/cover scratch centres, both base colours are RGB (149,152,155), specular masks are 255, and roughness values are 78/255 and 84/255 respectively. Both materials use IOR 1.5 and the same specular multiplier. Temporary normal-map removal (`paint-reflection-normal-off-*.png`) left the underside dark.

The actual cause was the diagnostic camera orientation. Blender's tracked camera flips its local Y when viewing from below. The old key offset transformed to world (0,-191.14,-74.61) mm relative to the underside target, putting it on the viewer's side and missing the near-normal reflection. The underside camera now rolls by pi, keeping the key opposite the viewer and the lettering upright. This changes only the inspection script, not website lighting or the model.

`paint-reflection-aligned-{before,after}-{lid,cover}.png` records the corrected comparison. The underside now visibly shows the existing grain. Scratch changes reach 18/255, with 1,249 pixels changing by more than 3/255; lid values are 22/255 and 2,850 pixels. Individual hairlines remain difficult to distinguish against the strong grain. These images establish a usable reflection setup, not an accepted finish. Next work must calibrate the grain and groove scale against reference close-ups before promotion.

The script accepts an optional output prefix so diagnostic variants preserve earlier evidence. Python compilation passes. The public GLB remains SHA-256 `1c9506312c659603e0e6b2e1fcaf545f8a73193788f1f43d839a4d455de2d2cb`; original Blender materials were restored after every trial.
