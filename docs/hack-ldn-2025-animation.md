# Hack LDN 2025 portfolio application

User-requested ninth portfolio app, on `codex/hack-ldn-2025` in
`/Users/paramveer/.codex/worktrees/hack-ldn-2025/3ds-idea`, based on NVIDIA
checkpoint `c9a5da54fd2dc3cf330e889fbcfcde96ab1a8c00`.

The pixel chevron from the supplied screenshot leads the animation. It reveals
HACK from left to right, turns down at the corner, reveals LDN from right to
left, and rotates into its final position. There is no cube. Eight screenshot-traced shapes
form solid bevelled Blender meshes. Graphite faces, dark sidewalls and brighter
bevels make their depth visible through an oblique orthographic camera; the reference's black patterned background is removed.
The transparent 180x148 render uses RGB555-style quantization and crisp alpha.
It plays once over 80 frames at 30000/1001fps, holds the logo, then shows 2025.
Reduced motion paints the final pose immediately.

The new app reuses the existing CogniLink project content and portfolio AppModule.
Its HOME slot is appended without moving established titles. Old saved layouts
retain positions, folders and preferences while the new app enters a free slot.
NVIDIA's animation, text and assets remain unchanged. All differences here are
portfolio adaptations, not native firmware replacements or fidelity claims.

## Authoring

Run `scripts/blender/trace-hack-ldn-logo.py` with absolute screenshot, contour JSON
and SVG output paths. It requires OpenCV, NumPy and Pillow. Run
`scripts/blender/build-hack-ldn-transform.py` through Blender MCP with absolute
ROOT and OUTPUT values. Render its saved scene over frames 1-80, then use the
existing `scripts/blender/pack-nvidia-transform.mjs` with absolute frame and
output directories. Its packing format is shared with NVIDIA. Asset and reference
hashes are in `public/portfolio/hack-ldn-2025/provenance.json`.

## Verification

Private evidence is in
`/Users/paramveer/.codex/3ds-artifact-overflow/hack-ldn-2025-20261008/`.
The original Blender `scene-check.json` records eight shallow curves. The rendered
`chevron-motion-sheet.png` and `hack-ldn-chevron-once.gif` show the final motion.
`browser-checks.txt` verifies the actual atlas renderer, one-shot hold through
60 seconds, reduced motion, reset and disposal. The muted production preview
on port3049 was inspected through launch, both CogniLink pages and HOME return.
`hack-ldn-app.png` records the completed banner in the application.

Typecheck, production build and shader validation pass. The full suite has
2,168 passes, one known missing Camera HNI fixture failure, 96 skips and one TODO.
The 34 focused app, content and migration checks pass. The existing private
Camera lower.png fixture is absent; no native acceptance or comparison is claimed.


## 9 October depth revision

Branch `codex/hack-ldn-depth` starts from merged `main` at
`c76775731fe539473934365d35210d79c3cbb551`. The chevron route, letter timings,
80-frame delivery and one-shot behavior are unchanged. The source now converts
each traced extrusion to a mesh before animation, assigns face/side/bevel
materials, increases extrusion from 0.045 to 0.22, and uses an angled camera
with three area lights. The measured final mesh thickness is 0.488 Blender
units including bevels. The source scene contains eight letter/chevron meshes.

Evidence: `/Users/paramveer/.codex/3ds-artifact-overflow/hack-ldn-depth-20261009/`.
`before-after.png` records the flatter original and new final pose;
`motion-sheet.png` and `hack-ldn-depth-once.gif` show the rendered sequence.
`render-check.json` verifies all 80 frames fit within 180x148 with binary alpha.
`scene-check.json` records mesh dimensions, materials and camera position.
`hack-ldn-app.png` records the muted production preview on port3050.
`browser-checks.txt` records one-shot completion, no replay through 60 seconds,
reduced motion, reset and disposal using the actual atlas renderer.

Typecheck, production build and shader validation pass. Full suite: 2,168 pass,
one pre-existing missing Camera HNI fixture failure, 96 skipped, one TODO.
Portfolio adaptation only; no native comparison or firmware acceptance claim.
