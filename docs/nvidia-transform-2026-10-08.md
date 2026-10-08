# Nvidia box-to-logo animation

User-requested portfolio adaptation on `codex/nvidia-transform`, based on
`5ee6fd7a42b0239c5f55f375f85593289a0ff532`. The old fidelity checkout in STATUS
was absent; this branch uses a separate managed worktree from current `main`.
Initial implementation: `efe4e8d`, superseded by this correction from
`7f06ecf`. The user rejected the reverse loop and requested a closer reference
match, an opening spin, one-shot playback and visibly 3D lettering.

Selecting NVIDIA previously showed the generic logo plaque on HOME, and opening
it showed the Renu photograph immediately. HOME and the app landing screen now
show a green 3D cube making a full opening spin, turning face-on, then sliding
left as the wordmark emerges to its right and the eye opens upward from the
square. The animation takes 2.4 seconds and holds the final logo indefinitely.
There is no reverse section or automatic repeat.
Opening the Renu entry still shows its photograph and original text.

## Source and delivery

- Motion reference: user-supplied `/Users/paramveer/Downloads/video.mp4`, 46 frames
  at approximately 29.97 fps. Cropped reference frames were visually inspected.
- Logo geometry: the existing original [Nvidia SVG](../public/portfolio/nvidia.svg),
  sampled with svgpathtools 1.8.0 into [contours](../scripts/blender/nvidia-logo-contours.json).
- Editable source: [Blender scene](../assets/blender/nvidia-transform.blend),
  authored through Blender MCP in Blender 5.2.1 LTS. It contains extruded curves,
  an animated cube with fine bright edges, animated material reveals, lights and
  a camera. The wordmark has 0.28 units of total extrusion, bright front caps,
  dark sides and bevels, and a slight two-axis tilt to make the depth visible.
- Delivery: [transparent atlas](../public/portfolio/nvidia-transform/atlas.png),
  72 frames, 180×148, 30 fps, eight columns. RGB555-style color quantization,
  binary alpha and nearest-neighbour drawing give crisp edges. The atlas is
  59,425 bytes compressed and 7.7 MB as decoded RGBA.
- [Provenance](../public/portfolio/nvidia-transform/provenance.json) records
  SHA-256 hashes of the video, original logo, conversion inputs and outputs.

The added opening spin, enamel materials, white text faces with dark extruded
sides, slight text tilt and pixel sampling are intentional portfolio adaptations.
Box size, its leftward slide, and the wordmark reveal positions were fitted to
the supplied video at source frames 15 through 36. This has no firmware
manifest key, native sound or native comparison pair. Other native residuals
listed in STATUS remain unresolved. No native scenario is marked passed.

## Runtime

[Banner renderer](../src/os/nvidia-banner.ts) loads the atlas with the portfolio
icons before screen readiness. It uses the existing canvas compositor, needs no
additional WebGL context and does not alter reducers or native asset handling.
A new selection starts at the box. Playback clamps on frame 72. Gaps in
painting, including background tabs, cannot restart the animation. Reduced
motion uses the same final logo. Loading failure retains the original source icon.
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
  decode, a changing cube pose, completion, a held final frame at 4.8, 10 and 60
  seconds, no restart after a painting gap, reduced-motion stability, selection
  restart, disposal, and disposal before decode completion.
- Inspected Blender renders and contact sheets against the supplied clip. This
  is visual reference matching, not an exact frame-by-frame reproduction claim.

Revision 2 evidence is in
`/Users/paramveer/.codex/3ds-artifact-overflow/nvidia-transform-20261008/revision-2/`:
`animation-sheet.png`, the non-looping `nvidia-once.gif`, `text-3d.png`,
`browser-nvidia-home.jpg`, `browser-nvidia-app.jpg`, `browser-checks.jpg`,
`browser-checks.txt`, render/build/test/shader logs and standalone browser checks.
The parent folder preserves the original reference captures and rejected first
iteration. Internal storage avoids new artifacts on DeveloperStorage.
