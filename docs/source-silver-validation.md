# Silver source integration — 9 September 2026

Historical texture-integration checkpoint. The active model now also includes
the measured shell-curvature pass in [source-curvature-validation.md](source-curvature-validation.md).

The homepage and `/source-preview` now load the downloaded Joshua P. original XL
rig with its complete PBR maps and a silver exterior adaptation. The earlier
procedural `.blend` and public `.glb` remain preserved. This is a completed source
integration checkpoint, not acceptance of exact hardware or HOME Menu fidelity.

## Saved output

- Editable rig: `model/candidates/joshua-xl/silver-source.blend`.
- Browser export: `model/candidates/joshua-xl/silver-source.glb`, byte-identical to
  `public/models/candidates/joshua-xl.glb`.
- Original red comparison, seven source PNGs, derived silver atlas and paint mask
  are preserved beside it. The original download hash is in `source-download.json`.
- Native inspection renders: `silver-open.png`, `silver-closed.png`, and
  `silver-underside.png`. The underside render places the hinge at the bottom;
  rotate the view 180 degrees when comparing to the user's photograph 5.
- The native open render includes the creator's boot artwork. The website hides
  those two meshes and displays the interactive menu canvases instead.

The failed multi-object bake was stopped after the user approved restarting
Blender. The successful replacement renders one atlas quad in an isolated CPU
scene. Both derived PNGs were saved before the production material was changed.
The verified original textures, rig and red comparison remain intact.

## Verified behavior

Browser inspection at 1280 × 720 confirmed the textured inner deck and lid,
silver outer lid, and silver underside with source print, screws and rolled
edges. Vertical drag now reaches the underside. The intro settles at 155 degrees;
Space closes to 0 degrees and reopens. A opens a folder, B returns, HOME returns,
right D-pad moves selection, lower-screen touch selects and a second tap opens,
and physical POWER switches the screen state. Source indicator emission now
follows that power state. The browser reports `vgpu=ready` for the sourced body.

At 390 × 844 the entire console remains framed, and physical A and HOME hits
work at their projected positions. The page contains no additional visible site
navigation or portfolio copy outside the console. The earlier narrow 319-pixel
viewport also rendered the complete console.

The source-preview browser reported no shader errors. The long-lived homepage
tab retained one development Fast Refresh dependency-array warning from before
the final reload; it did not recur after reloading. No error overlay appeared.

All 35 tests, typecheck, production build and required VGPU shader validation
passed. The shader validator needed ordinary GPU access outside the filesystem
sandbox; it passed after acquiring the Mac GPU. Source texture tests compare
every original UV corner and the restored normal/tangent frames. Silver tests
verify unchanged geometry, six original image payloads, factors and rig metadata.
An independent pixel audit found exactly 5,044,041 painted pixels and zero changes
to the other 11,733,175 RGB pixels. Legacy prototype tests are labelled separately.

## Remaining differences

The source envelope is 156 × 92.397 × 22.233 mm, not the target 156 × 93 × 22 mm.
Its USA underside print still needs the user's EUR treatment. Published active
LCD dimensions are applied, but their centring within the source glass remains
provisional. The source wear and lettering are preserved, not claimed to be a
calibrated scan of the user's unit. Native Blender reconstructs tangent frames;
the final GLB restores the creator's explicit frames after export.

The current HOME Menu uses authored placeholder graphics and typography. The
separate firmware task still needs decrypted HOME Menu/font assets; the completed
model download does not resolve that dependency. Further photographic comparison
and hardware corrections remain necessary before claiming an exact replica.
