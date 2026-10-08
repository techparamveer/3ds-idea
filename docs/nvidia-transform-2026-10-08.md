# Nvidia box-to-logo animation

User-requested portfolio adaptation on `codex/nvidia-transform`, based on
`5ee6fd7a42b0239c5f55f375f85593289a0ff532`. The old fidelity checkout in STATUS
was absent; this branch uses a separate managed worktree from current `main`.

Selecting NVIDIA previously showed the generic logo plaque on HOME, and opening
it showed the Renu photograph immediately. HOME and the app landing screen now
show a green 3D box turning face-on, flattening and sliding left as the wordmark
and eye appear. The logo holds, then returns to the box over a four-second loop.
Opening the Renu entry still shows its photograph and original text.

## Source and delivery

- Motion reference: user-supplied `/Users/paramveer/Downloads/video.mp4`, 46 frames
  at approximately 29.97 fps. Cropped reference frames were visually inspected.
- Logo geometry: the existing original [Nvidia SVG](../public/portfolio/nvidia.svg),
  sampled with svgpathtools 1.8.0 into [contours](../scripts/blender/nvidia-logo-contours.json).
- Editable source: [Blender scene](../assets/blender/nvidia-transform.blend),
  authored through Blender MCP in Blender 5.2.1 LTS. It contains extruded curves,
  a beveled animated cube, animated material reveals, lights and a camera.
- Delivery: [transparent atlas](../public/portfolio/nvidia-transform/atlas.png),
  96 frames, 180×148, 24 fps, eight columns. RGB555-style color quantization,
  binary alpha and nearest-neighbour drawing give crisp edges. The atlas is
  approximately 51 KB compressed and 10.2 MB as decoded RGBA.
- [Provenance](../public/portfolio/nvidia-transform/provenance.json) records
  SHA-256 hashes of the video, original logo, conversion inputs and outputs.

Dark wordmark color, enamel materials, extrusion, pixel sampling and the held,
repeating motion are intentional portfolio adaptations. This has no firmware
manifest key, native sound or native comparison pair. Other native residuals
listed in STATUS remain unresolved. No native scenario is marked passed.

## Runtime

[Banner renderer](../src/os/nvidia-banner.ts) loads the atlas with the portfolio
icons before screen readiness. It uses the existing canvas compositor, needs no
additional WebGL context and does not alter reducers or native asset handling.
Selection changes and gaps in painting restart at the box. Reduced motion uses
frame 52, the completed logo. Loading failure retains the original source icon.
Disposal prevents delayed decoding from reviving the renderer.

## Rebuild

Use absolute ROOT and OUTPUT paths. In Blender MCP's Python execution:

```python
ROOT = '/absolute/path/to/checkout'
OUTPUT = '/absolute/path/to/private/render-frames'
exec(compile(open(ROOT + '/scripts/blender/build-nvidia-transform.py').read(),
             'build-nvidia-transform.py', 'exec'))
bpy.ops.render.render(animation=True)
```

Then run Node from the checkout:

```sh
node scripts/blender/pack-nvidia-transform.mjs /absolute/path/to/private/render-frames /absolute/path/to/checkout/public/portfolio/nvidia-transform
```

The build script creates a new scene and saves the task's Blender file; it does
not open or overwrite the hardware model. Preserve the supplied reference video.
Update the provenance hashes after authoring or repacking.

## Verification

- TypeScript, production build, shader validation and `git diff --check` pass.
- Full test suite after LFS hydration: 2,167 pass, one fail, 96 skip, one TODO.
  The failure is the existing Camera HNI fixture test. Its private
  `camera-3d-badge-sdmc-recapture-20261005/browser/lower.png` is absent.
- A muted production preview at port 3048 was inspected in the browser. NVIDIA
  HOME selection and app landing animate over their existing backgrounds. Enter
  opens the Renu detail photograph; Escape returns; HOME suspend/close works.
- A separate browser check using the actual renderer and actual PNG passed image
  decode, changing frames, exact frame wrap, reduced-motion stability, selection
  restart, transparent corners, disposal, and disposal before decode completion.
- Inspected Blender renders and contact sheets against the supplied clip. This
  is visual reference matching, not an exact frame-by-frame reproduction claim.

Private evidence is in
`/Users/paramveer/.codex/3ds-artifact-overflow/nvidia-transform-20261008/`:
`reference-detail.jpg`, `animation-sheet.png`, `nvidia-preview.gif`,
`browser-nvidia-home.jpg`, `browser-nvidia-home-later.jpg`, `browser-nvidia.jpg`,
`browser-renu-detail.jpg`, `browser-lifecycle-checks.jpg`,
`browser-lifecycle-checks.txt`, build/test/shader logs and the standalone browser
check files. Internal storage avoids writing new artifacts to DeveloperStorage.
