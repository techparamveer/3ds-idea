# Joshua P. original XL candidate

Source: [Nintendo 3DS XL by Joshua P. / Pansdaz](https://sketchfab.com/3d-models/nintendo-3ds-xl-6cf20040dc0e44559c3e69723945afcc)
Licence: [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/)

Changes so far: separated the source's68 connected parts while preserving all
9,353 triangles, UVs and vertex normals; removed the creator's global presentation
transform; established a mechanical X-axis hinge; created independent controls;
uniformly scaled the model to156mm width; added a0–155degree rigid opening rig.

**The source download is incomplete.** The official authenticated4K GLB transfer
saved4,636,960 of28,850,812bytes. Its first513,596binary bytes contain all geometric
accessors, including original normals and UVs. Those complete buffers were retained
in `geometry-inspection.glb`; the incomplete images were omitted and inspection
materials substituted. None of these previews represents the creator's finished
PBR textures. No fullFBX archive has arrived either.

`rigged-geometry.blend` is the separate editable rig candidate, with an opening
preview on frames1–85 at30fps. `rigged-geometry.glb` is its static closed export
in metres for runtime integration tests. The main website still uses its existing
asset; this textureless candidate has not replaced it.

The candidate can now be inspected at `http://localhost:3000/source-preview`.
Its public mirror is `public/models/candidates/joshua-xl.glb`, with source credit
and modification details in the adjacent `.LICENSE.txt`. This route uses the same
opening motion and menu input as the main website. It remains an inspection
preview with substitute materials, not the finished silver replacement.

`scripts/anchor_sourced_displays.py` adds the live-display anchors after the rigging
pass. Run its `main()` through Blender MCP with `rigged-geometry.blend` open.
It preserves geometry and writes the normal native workspace, static closed GLB,
preview mirror, attribution and layout report. The upper and lower active display
rectangles use Nintendo's published dimensions, provisionally centred within the
source glass. Complete source textures are still required to confirm their exact
alignment. Only the two source baked screen-artwork pieces are hidden at runtime;
their geometry remains in the file.

Run `scripts/analyze_sourced_rig.py` to reproduce the read-only component/axis audit.
Run `scripts/rig_sourced_model.py` through Blender MCP after opening
`geometry-inspection.blend` to reproduce the separate candidate. Do not run the
historical main model exporter against this file.

Validation: every source triangle belongs to exactly one component; all68 parts
retain UV/normal attributes; the static root and hinge export unrotated; all12
controls stay on Base through the hinge sweep. Open/closed renders have been
inspected. The uniformly scaled source envelope is156×92.397×22.233mm, so it is
not yet an exact156×93×22mm reconstruction. Its screen meshes are larger than the
published active LCD areas; inspect the actual texture boundaries before aligning
live displays. Hidden collision clearance and remaining component fidelity still
need detailed review.

Runtime validation: actual GLB anchors maintain outward-facing normals and image
orientation through the hinge sweep; both display sizes and the 0.02 mm glass
offsets are checked. Control hits use the imported mesh centres rather than the
previous model's coordinates. Browser checks at 1280 × 720 confirmed A/B, HOME,
D-pad right, touch selection, power off/on and lid close/reopen. The original
homepage also passed a control regression check with VGPU ready. All 23 tests,
typecheck and production build passed. These results establish working rig
integration, not the missing texture quality or photographic fidelity.

Additional geometry inspection views are `source-closed-top.png`,
`source-right-side.png` and `source-underside.png`. These use the preserved
inspection materials with the rig closed. The underside view has the hinge at
the bottom; rotate it 180 degrees when comparing with the supplied underside
photo, which places the hinge at the top. Measurements and remaining uncertainty
are recorded in `docs/source-geometry-audit.md`.
