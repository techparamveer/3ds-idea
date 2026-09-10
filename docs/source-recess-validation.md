# Circle-pad recess geometry and material revision

The active sourced model is now `silver-recess.blend` / `.glb`. The earlier
`silver-pad` checkpoint remains preserved. This pass combines the rounded socket
geometry with a bounded material correction; the geometry-only trial recorded
in `source-pad-validation.md` was still visibly irregular and was not promoted.

## Reference and visible change

The [original silver XL front photograph](https://cdn.mos.cms.futurecdn.net/0584727e6f39c0e334d6e9537772f9fa.jpg)
shows a dark matte recess with a rounded perimeter and a soft lip. The earlier
source normal map produced a conspicuous irregular highlight when the socket
geometry was rounded. Attenuating that relief and adjusting the local finish
makes the round geometry read more clearly. The material-only trial on the old
geometry retained its polygonal outline; changing both gave the better result.

Comparison images in `model/candidates/joshua-xl/`:

- `pad-after-pad.png`: accepted prior pad with original recess.
- `socket-material-pad.png`: material-only trial, polygonal recess remains.
- `socket-combined-pad.png`: rounded recess with reversible node treatment.
- `recess-after-pad.png`: final baked result, visually consistent with that trial.
- `recess-after-{front,open,top,side,rear,underside}.png`: all six inspected.

The circle-pad dish still carries uneven source shading. Other source-surface
irregularities, faint/manual hardware lettering and approximate HOME Menu
remain unresolved. These images establish a local improvement, not exactness.

## Scope and maps

Only the graphite chassis geometry/material changes from `silver-pad`.
The socket geometry pass moves at most 0.2254 mm and retains heights. Its report
is `socket-smoothing-report.json`. A separate material, `Sourced graphite socket
finish`, prevents these image edits from affecting other objects sharing the
original atlas. The copied material retains the existing paint-mask metadata,
specular binding and other settings.

The treatment fades in over radii 6.5–8 mm, out over 12.5–14 mm, and in over
native heights 10–12 mm. At full strength it targets linear base colour
(0.014, 0.015, 0.017), roughness 0.68, metallic 0, and attenuates encoded normal
relief by 85%. These are authored visual estimates, not measured Nintendo
material properties. Normal-map mixing is a baked approximation of the node
trial, checked visually after export.

The actual UV triangles determine the mask. Its 96,985 nonzero pixels have zero
conflicting overlapping UV treatments. Every pixel outside the float mask is
copied byte-for-byte. `socket-surface-report.json` records the three output PNG
hashes and changes: 81,747 base-colour pixels, 80,057 normal pixels and 85,509
metallic/roughness pixels. The new material adds three 4096² maps; the GLB is
78,078,864 bytes and still needs delivery-size optimization before publication.

## Reproduction

Run Blender scripts through Blender MCP, with the project `scripts` directory
on `sys.path`. Preserve the named inputs; do not rerun a geometry pass against
its own output.

1. Open `silver-pad.blend`; run `round_sourced_pad_recess.main()` to create
   `silver-socket.blend` / `.glb`. The earlier trial copies are also preserved
   under `.local/circle-pad-socket-trial/`.
2. On that socket checkpoint, run `export_socket_uv_data.main()`. This writes
   `.local/socket-uv-data.npz` from the actual chassis geometry and UV triangles.
   It may also run read-only on `silver-recess.blend` (same geometry).
3. Run `scripts/build_socket_surface_maps.py` with NumPy and Pillow available.
4. On `silver-socket.blend`, run `install_socket_surface.main()`. This packs the
   new images, saves `silver-recess.blend` and exports its GLB using carried
   source frame attributes. Never use the original geometry-matching restorer.
5. Inspect matched renders and tests before mirroring the GLB into `public`.

The UV capture helper was exercised on the saved final file: 38,911 vertices,
74,676 triangles. The procedural inspection helper `inspect_socket_surface.py`
is reversible and does not save/export the trial material.

## Verification on 2026-09-10

- All 64 `npm test` tests pass. The two new source-recess tests compare complete
  materials of every other mesh (resolving embedded image bytes), preserve
  transforms and geometry, verify the three new PNG hashes, check remote
  chassis vertices, finite orthogonal shading frames and the closed envelope.
- Closed size remains 156 × 93 × 22 mm. The previous circle-pad clearance proof
  remains applicable because both pad and inner lid are byte-identical meshes.
- Browser at 1280 × 720: model loaded, VGPU ready, no warning/error logs.
  Circle-pad right changed selected cell 0→2; physical A opened it; H returned
  HOME; Space reached hinge 0°. Closed lid and rotated underside inspected.
- Browser at 390 × 844: full device framed, VGPU ready, no warning/error logs.
  Tapping the second top-row folder changed selection 0→2 with lastInput=touch.
  Viewport override was reset and the preview reloaded afterward.
- No application code changed; a production rebuild was not repeated for this
  asset-only revision. The firmware asset dependency is unchanged.

Public GLB SHA-256:
`a2b7c789a690915c6d192674c9fe59a7d4cb93cc8e12a3b2093c995ee1ddf25b`.
