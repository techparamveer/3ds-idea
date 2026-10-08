# Nvidia box-to-logo animation

User-requested portfolio adaptation on `codex/nvidia-transform`, based on
`5ee6fd7a42b0239c5f55f375f85593289a0ff532`. The historical fidelity checkout was
absent, so this work uses a separate managed worktree from current `main`.
Revision 3 implementation is `26148697835b5c6920caf21f03d18b9682fb61f9`, starts from `4409fb4` and supersedes the rejected eye wipe in
`a524cee`. The user clarified that the cube/eye animation needed correction;
the 3D wordmark was to stay unchanged at that point. Revision 4, from
`605858d`, follows the subsequent request to remove the 3D wordmark.

HOME and the NVIDIA app landing show an opening cube spin, followed by the
video's cube/eye motion: face-on square, leftward slide, a cut starting near the
lower right, an outer stroke sweeping around the eye, then an inward curl.
Playback runs once and holds the source endpoint. Renu detail still shows its
photograph and original text.

## Source and authoring

- Reference: user-supplied `/Users/paramveer/Downloads/video.mp4`, 46 frames at
  30000/1001 fps. Every source frame was decoded and compared. The clip ends
  before the inner curl fully closes; that endpoint is preserved rather than
  replaced with the complete modern SVG eye.
- Cube/eye: [trace script](../scripts/blender/trace-nvidia-video.py) extracts the
  green pixels including pale highlights. [Pose data](../scripts/blender/nvidia-reference-poses.json)
  and [color atlas](../scripts/blender/nvidia-reference-colors.png) preserve the
  source frames without the black background. PyAV, NumPy and Pillow are used.
- [Blender build script](../scripts/blender/build-nvidia-transform.py) constructs
  46 welded pixel relief meshes with front/back caps and boundary side walls,
  0.07 units deep. This is frame-sampled extruded geometry, not a continuous
  morph rig. UVs use the source colors. Pixel centers align with the render grid.
- Wordmark: the existing [original NVIDIA SVG](../public/portfolio/nvidia.svg),
  sampled with svgpathtools 1.8.0 into [contours](../scripts/blender/nvidia-logo-contours.json).
  Revision 4 uses a flat graphite face with zero extrusion, bevel and tilt.
  Wordmark width, position and reveal keys remain unchanged.
- [Editable Blender source](../assets/blender/nvidia-transform.blend) was authored
  through Blender MCP in Blender 5.2.1 LTS. Earlier scenes remain in the file;
  the active scene is the corrected version. The hardware source is untouched.
- Delivery: [RGBA atlas](../public/portfolio/nvidia-transform/atlas.png), 72 frames
  at 180×148, 30000/1001 fps, eight columns. Binary alpha, RGB555-style color
  quantization and nearest-neighbour display retain the low-resolution style.
  Frames 1–24 are the requested extra spin; 25–70 correspond to video frames
  0–45; 71–72 hold the endpoint. Decoded RGBA uses 7,672,320 bytes.
- [Provenance](../public/portfolio/nvidia-transform/provenance.json) records the
  source video and authoring/output SHA-256 hashes.

The rejected premise was that a directional wipe of a completed modern SVG
could reproduce a stroke being drawn around and into the square. The source
shows different intermediate shapes. Direct source sampling replaces that
premise. A diagnostic also caught pale highlights being excluded from the green
mask and curve tessellation cutting across holes; the delivered pixel meshes
avoid both problems.

The Life and Sound banners were inspected in the browser. The result retains
crisp low-resolution rendering while following the supplied motion. Opening
spin, pixel relief geometry, flat graphite lettering and pixel sampling are
intentional portfolio adaptations. Source compression is retained; the output
is not pixel-identical to the video. There is no firmware manifest key, native
sound or Azahar comparison for this portfolio asset. Existing native residuals
remain unresolved, and no native scenario is marked passed.

## Runtime

[Banner renderer](../src/os/nvidia-banner.ts) loads the atlas alongside portfolio
icons before screen readiness. It uses the existing canvas compositor and
requires no additional WebGL context. New selection starts once at the cube;
playback clamps on frame 72, including after long painting gaps. Reduced motion
shows the final pose. Decode failure retains the source icon. Disposal prevents
late decoding from reviving the renderer.

## Rebuild

Use absolute paths. First run the trace script with the unchanged source video:

```sh
python scripts/blender/trace-nvidia-video.py /absolute/video.mp4 /absolute/checkout/scripts/blender/nvidia-reference-poses.json /absolute/checkout/scripts/blender/nvidia-reference-colors.png
```

In Blender MCP's Python execution:

```python
ROOT = '/absolute/path/to/checkout'
OUTPUT = '/absolute/path/to/private/render-frames'
exec(compile(open(ROOT + '/scripts/blender/build-nvidia-transform.py').read(),
             'build-nvidia-transform.py', 'exec'))
bpy.ops.render.render(animation=True)
```

Then pack from the checkout and refresh provenance hashes:

```sh
node scripts/blender/pack-nvidia-transform.mjs /absolute/path/to/private/render-frames /absolute/path/to/checkout/public/portfolio/nvidia-transform
```

## Verification

Evidence root:
`/Users/paramveer/.codex/3ds-artifact-overflow/nvidia-transform-20261008/revision-3/`.

- Source-identified: video SHA and all 46 frames; `eye-motion-frame-by-frame.png`
  and `eye-end.png`. `style-life.jpg` and `style-sound.jpg` record other banners.
- Delivered: transparent atlas, poster, authoring inputs and editable Blender file.
- Implemented: source-frame timing, sampled cube/eye geometry, one-shot hold.
- Tested: typecheck, production build, shader check and `git diff --check` pass.
  Full suite: 2,167 pass, one fail, 96 skip, one TODO. The known Camera HNI test
  lacks private `camera-3d-badge-sdmc-recapture-20261005/browser/lower.png`.
- Browser-inspected: muted production preview at port 3048; HOME and app landing.
  Actual PNG/renderer check passes spin, completion, held frames at 4.8, 10 and
  60 seconds, painting gaps, reduced motion, selection reset and disposal guards.
  `browser-checks.txt`, `browser-checks.jpg`, `browser-nvidia-home.jpg` and
  `browser-nvidia-app.jpg` record the results.
- Video-compared: `verify-reference.py`, `reference-comparison.json` and
  `eye-comparison.png` compare every delivered source pose against a fixed
  projection of the source's green silhouette. The highlight-inclusive mask
  is G>65, G>1.06R, G>1.4B; no wordmark pixels, RGB shading or depth measurement.
  Earlier `before-comparison.json` used an overly narrow green mask and is only
  a superseded diagnostic. Mean intersection-over-union before → after:
  cube 0.8340 → 0.9903, outer stroke 0.6876 → 0.9763, inward curl 0.7941 → 0.9685.
  Mean differing pixels: 197.1 → 11.1, 371.1 → 26.4, 202.9 → 29.7 respectively.
  Residuals are raster edges/thresholding, so these are not exact pixel matches.
- Native-compared: not applicable to this portfolio adaptation; no native claim.

`animation-sheet.png` and non-looping `nvidia-once.gif` preview the delivered
frames. Render/build/test/shader logs are alongside them. Revision 2 and the
parent folder preserve earlier captures and rejected iterations.


## Revision 4 — flat wordmark

The user preferred the earlier flat lettering. Removed the extrusion, bright
front caps, dark side faces, bevel and tilt; rendered the original SVG wordmark
as a uniform graphite face. The cube/eye mesh poses, opening spin, reveal keys,
29.97 fps timing, transparency and one-shot runtime are preserved.

Evidence: `revision-4/` under the private evidence root's parent, including
`flat-wordmark.png`, `nvidia-once.gif`, `green-preservation.json`, Blender frames,
production browser screenshot and build/test/shader logs. Comparing the green
silhouettes of all 72 frames against revision 3 finds 154 differing pixels total;
removing text depth changes small overlap/shadow edges, not the motion geometry.
No native scenario or fidelity status changed.

Revision 4 verification: Blender confirms zero extrusion, bevel and rotation;
muted production HOME banner inspected. Typecheck, build and shader pass;
full suite: 2,167 pass, one known missing Camera fixture failure, 96 skip, one TODO.
