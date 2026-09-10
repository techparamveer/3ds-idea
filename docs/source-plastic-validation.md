# Dark plastic roughness correction

`silver-plastic.blend` / `.glb` follows the preserved `silver-recess` checkpoint.
Only the inner-lid and graphite-chassis materials change. All meshes, UVs,
shading frames, rig transforms, screen anchors and other objects' materials
remain unchanged, as checked directly between exported GLBs.

## Evidence and scope

The [silver XL front photograph](https://cdn.mos.cms.futurecdn.net/0584727e6f39c0e334d6e9537772f9fa.jpg)
shows a relatively even molded-plastic finish on the deck and inner lid. The
previous render had broad blotchy shine that exaggerated the impression of an
uneven surface. Reversible, matched front renders isolated normal, base-colour,
metallic and roughness channels independently. Fixing roughness removed most of
this effect; removing normal mapping also removed useful molded markings.

`inspect_body_shading.py` generated the `body-*-front.png` diagnostic images.
These are channel-isolation tests, not replacement materials. The roughness
map on fully targeted dark pixels had a median of approximately 0.357.
The new maps compress it toward `0.60 + 0.10 * original_roughness`, retaining
variation. This is a photographic visual estimate, not a factory measurement.
Normal, colour, metallic, specular and emission textures remain intact.

A broad first trial applied these maps across both shared body materials; its
rear render showed an overly matte infrared window. That scope was rejected.
The final installer creates `Sourced matte inner lid` for that object only and
changes the already separate chassis material. Every other object's complete
material is preserved. Components contained within the chassis mesh naturally
share its correction; further object-level inspection may refine those areas.

## Maps and reproduction

Run `build_graphite_roughness.py` with NumPy and Pillow. It creates two MR maps
from the prior body and socket maps, using inverse silver-paint coverage and
soft gates for dark base colour and low metallic. A low-roughness protection
gate is zero through 0.20 and reaches full correction at 0.30, retaining the
small glossy lens details within the shared inner-lid mesh. The roughness channel alone
changes; red/blue channels are byte-identical. Fully painted pixels are
unchanged. `graphite-roughness-report.json` records inputs, hashes, quantiles and
changed-pixel counts. White ink and metallic areas are protected by the gates.
The masks are heuristic surface classification, not a semantic material scan.

Open `silver-recess.blend` in Blender and run `install_graphite_roughness.main()`
through Blender MCP, with the project scripts on `sys.path`. It packs the maps,
saves `silver-plastic.blend`, exports and restores carried shading frames. Do
not run it against the output checkpoint. `inspect_graphite_roughness.py`
reproduces the rejected broad trial reversibly; it is not the final installer.

Final matched renders: `plastic-after-{front,open,top,side,rear,underside}.png`.
All six were inspected against the corresponding `recess-after` images.
The normal-map details and silver artwork survive; the deck and bezel have a
more even matte reflection. Circle-pad shading, some source edge artifacts,
hardware lettering and HOME Menu fidelity remain unfinished.

## Verification

The two new `source-plastic.test.mjs` checks prove every mesh attribute and rig
transform unchanged, resolve full material textures/samplers per object, and
allow only the two intended roughness bindings and the new inner-lid material
name. The final 66-test suite passes. No application code changed and no
production rebuild was repeated. Browser verification is recorded below.

Browser at 1280 × 720: final finish visually inspected, VGPU ready, hinge 155°,
physical A changed HOME to folder. An initial load logged one GLTFLoader blob
texture failure at 03:46:10 UTC. A fresh reload showed the details again and did
not add another error; all twelve embedded PNGs were also fully decoded with
Pillow. The cause of the single transient failure was not established. This is
recorded rather than claiming an error-free first load.

Final GLB SHA-256:
`f0e657a32428730023fd5988c60ba309b7570021fb48951b2f4bd99c9c777637`.

After adding low-roughness protection, the final front render and desktop
preview retain the dark inner-camera detail. The six final renders were
regenerated and inspected. Mobile 390 × 844 stayed fully framed and touch
changed selection 0→2. VGPU remained ready and no further log entries appeared.
Viewport overrides were reset. The prior broad-trial PNGs remain diagnostic
history; only the final `plastic-after` set represents the installed maps.
