# Nvidia box-to-logo animation

Portfolio adaptation on `codex/nvidia-transform`, a separate managed worktree
based on `5ee6fd7`. The user confirmed that the first version looked better and
asked to fix the cube spin and the eye eating into the box. Revision 5 starts
from `92d5424`, is implemented in `be53cd3071ce589d96f3e41fc2fe08f324ec677d`, and restores the artwork/materials from `efe4e8d`. The later
white extruded text, flat emission text and pixel-traced eye are superseded.

## Delivered behavior

The original green cube turns upright with eased speed, settles face-on and slides left
while the original dark wordmark emerges. A small cut begins near the lower
right of the square, sweeps around the outside of the eye, then curls inward.
The first version's complete logo holds at the end. Playback does not reverse
or loop. Reduced motion shows that held logo. Renu detail retains its photograph.

The first eye mesh, wordmark mesh, dimensions, frontal orientation, materials,
lights and camera are reused. The wordmark has the first version's shallow
0.045-unit curve extrusion and 0.006 bevel, rather than the later pronounced
white-capped 3D lettering or completely flat emission face. The final image has
the same bounds as the first render. A raw comparison finds 183 differing pixels,
with maximum channel delta 7: the completed reveal shader and hiding the old
collapsed cube leave small shading differences. This is appearance restoration,
not a claim that the final PNG is byte-identical.

## Source and authoring

- Reference: user-supplied `/Users/paramveer/Downloads/video.mp4`, 46 frames at
  approximately 29.97 fps, SHA-256 in [provenance](../public/portfolio/nvidia-transform/provenance.json).
  The cube turn, slide and lower-right → outer sweep → inward curl were reviewed
  again against frame sheets. The source is reference data, not instructions.
- Artwork: existing [original NVIDIA SVG](../public/portfolio/nvidia.svg), sampled
  with svgpathtools 1.8.0 into [contours](../scripts/blender/nvidia-logo-contours.json).
  Original geometry/material settings are recovered from commit `efe4e8d`.
- [Carve-field generator](../scripts/blender/build-nvidia-carve-field.py) finds
  the difference between the original solid square and the original eye. That
  difference is the continuous spiral stroke. It computes distance along the
  stroke from its lower-right tip, using NumPy, SciPy and Pillow, and writes
  [the reveal field](../scripts/blender/nvidia-carve-field.png). A floor-aligned
  square boundary prevents a spurious one-pixel shortcut through the stroke.
- [Blender build script](../scripts/blender/build-nvidia-transform.py) uses the
  same moving coordinate system for both meshes. The field removes the square
  along the stroke and reveals the eye outside it. The original square supplies
  the remaining solid face until completion, avoiding premature eye bevels
  appearing on the still-solid box. At completion the square hides and the
  original eye is fully visible. The final eye geometry is unchanged.
- [Editable source](../assets/blender/nvidia-transform.blend) was authored and
  rendered through Blender MCP in Blender 5.2.1 LTS. Earlier scenes remain;
  the active scene is the restored version. Original hardware files are untouched.
- [Atlas](../public/portfolio/nvidia-transform/atlas.png): 80 transparent RGBA
  frames, 180×148 each, 8 columns, 30000/1001 fps. Frames 1–36 turn, 40 is face-on,
  43–61 slide/reveal, 53–72 carve, and 72–80 hold. Binary alpha, RGB555-style
  quantization and nearest-neighbour display retain the original pixel style.

The rejected premise was that copying the video's compressed pixels could
replace the user's preferred artwork and materials. Revision 5 uses the video
for motion while retaining the first artwork. Carve timing is fitted to source
landmarks; it is not an exact reproduction of every source frame. The first
complete SVG logo also differs from the clip's partially finished inner curl.

Opening spin, source-inspired carve, original green/graphite materials and pixel
sampling are portfolio adaptations. There is no firmware manifest key or native
sound for this asset. No Azahar comparison or native scenario status changes.
Previously recorded native mismatches remain unresolved.

## Runtime and rebuild

[Banner renderer](../src/os/nvidia-banner.ts) loads the atlas with portfolio icons
before readiness, paints through the existing canvas compositor and clamps on
frame 80. Painting gaps cannot restart it. New selection resets it; decode failure
retains the original icon; disposal prevents delayed decode from reviving it.

Use absolute paths to generate the field:

```sh
python scripts/blender/build-nvidia-carve-field.py /absolute/checkout/scripts/blender/nvidia-logo-contours.json /absolute/checkout/scripts/blender/nvidia-carve-field.png
```

Then through Blender MCP:

```python
ROOT = '/absolute/path/to/checkout'
OUTPUT = '/absolute/path/to/private/render-frames'
exec(compile(open(ROOT + '/scripts/blender/build-nvidia-transform.py').read(),
             'build-nvidia-transform.py', 'exec'))
bpy.ops.render.render(animation=True)
```

Pack the frames and update provenance hashes:

```sh
node scripts/blender/pack-nvidia-transform.mjs /absolute/path/to/private/render-frames /absolute/path/to/checkout/public/portfolio/nvidia-transform
```

## Verification and remaining limits

Evidence root:
`/Users/paramveer/.codex/3ds-artifact-overflow/nvidia-transform-20261008/revision-5/`.
Earlier revisions and the original reference sheets remain in sibling folders.

- Source-identified: original Git artwork settings and supplied video; rerunnable
  `premise-census.py` records which revisions replaced the eye and wordmark.
- Delivered: editable Blender source, carve generator/field, atlas and poster.
- Implemented: one full cube turn, spiral carve, first-version artwork, one-shot
  final hold and reduced-motion frame. No separate app state or native changes.
- Tested: typecheck, production build, shader validation and `git diff --check`
  pass. Full suite: 2,167 pass, one known failure, 96 skip, one TODO. Camera HNI
  still lacks private `camera-3d-badge-sdmc-recapture-20261005/browser/lower.png`.
- Browser-inspected: muted production preview at port 3048. Actual atlas/renderer
  check passes spin, completion, no repeat at 4.8/10/60 seconds, painting gaps,
  reduced motion, selection reset and disposal. `browser-checks.txt` and screenshots
  record this, with a production HOME banner screenshot.
- Compared: `verify-restoration.py`, `original-look-comparison.json`,
  `first-look.png`, `new-look.png` and `restored-logo.png` compare the original
  and restored appearance. `motion-sheet.png` and `nvidia-restored-once.gif`
  show the carving sequence. `scene-check.json` records geometry and spin keys.
- Native-compared: not applicable; this is a portfolio adaptation. The older
  video silhouette scores from revision 3 do not describe this restored artwork.

The video is a motion reference, not a pixel-equivalence acceptance test for this
version. Remaining differences include the first artwork's proportions, material
shading, added full spin, fitted carve timing and completed inner curl.


## Revision 6 — opening spin polish

From `04c05b1`, changed only the opening cube motion. The old XYZ rotation moved
the pitch with the yaw, tipping the underside toward the camera halfway around.
YXZ keeps the turn upright. Sampled smoothstep easing controls the yaw, followed
by a gradual reduction in size, pitch and depth through frame 40. The yaw stays
monotonic, completing a full turn plus the angle needed to face the camera; no
backwards correction or mid-turn pause. The cube remains proportionate until
the final flattening. The original materials and geometry stay unchanged.

Private `revision-6/` evidence contains before/after sampled transforms,
`check-spin.py`, `spin-check.json`, `spin-sheet.png`, `nvidia-smooth-spin.gif`,
render/check logs and a production browser capture. The top face's camera-facing
normal changes from a minimum of -0.2377 to 0, confirming the underside no longer
faces the camera. Frames 41–80 have only two differing packed edge pixels across
all 40 frames; the poster and the carving geometry/timing remain unchanged.
Typecheck/build/shader pass. Full suite remains 2,167 pass, one known missing Camera
HNI fixture failure, 96 skipped and one TODO. No native acceptance changes.
