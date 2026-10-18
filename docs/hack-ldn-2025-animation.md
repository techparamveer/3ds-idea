# Hack LDN 2025 portfolio application

User-requested ninth portfolio app, on `codex/hack-ldn-2025` in
`/Users/paramveer/.codex/worktrees/hack-ldn-2025/3ds-idea`, based on NVIDIA
checkpoint `c9a5da54fd2dc3cf330e889fbcfcde96ab1a8c00`.

The pixel chevron from the supplied screenshot leads the animation. It reveals
HACK from left to right, turns down at the corner, reveals LDN from right to
left, and rotates into its final position. There is no cube. Eight traced curves
form the Blender geometry. Deep extrusion with rounded bevels and graphite enamel
keep the logo legible and solid on the light LCD; the reference's black patterned background is removed.
The transparent 180x148 render uses RGB555-style quantization and crisp alpha.
The intro plays once over 112 frames at 30000/1001fps. After LDN, the chevron drops
to a third row and dashes left to right through 25, which pops in digit by digit
exactly like the letters, in the logo's own lettering at the same cap height. It
leaves the right edge, slides back in from the left and lands, then the full
logo settles. Frames 113-272 then loop as an idle sway (yaw, pitch and a small
bob), matching the other portfolio banners and showing the letters' depth. The
banner is drawn at LCD y 43 so the logo centres between the status bar and the
HOME toolbar. 25 is part of the render, not a text caption.
Reduced motion paints the settled pose (frame 112) immediately, without sway.

The new app reuses the existing CogniLink project content and portfolio AppModule.
Its HOME slot is appended without moving established titles. Old saved layouts
retain positions, folders and preferences while the new app enters a free slot.
NVIDIA's animation, text and assets remain unchanged. All differences here are
portfolio adaptations, not native firmware replacements or fidelity claims.

## Authoring

Run `scripts/blender/trace-hack-ldn-logo.py` with absolute screenshot, contour JSON
and SVG output paths. It requires OpenCV, NumPy and Pillow. Run
`scripts/blender/build-hack-ldn-transform.py` through Blender MCP with absolute
ROOT and OUTPUT values; it reads `scripts/blender/hack-ldn-2025-digits.json`,
which `scripts/blender/build-hack-ldn-2025-digits.py` writes (standard library
only). Render the saved scene over frames 1-272, then run
`scripts/blender/pack-nvidia-transform.mjs` with absolute frame and output
directories and a frame count of 272. Its packing format is shared with NVIDIA. Asset and reference
hashes are in `public/portfolio/hack-ldn-2025/provenance.json`.

## Verification

Private evidence is in
`/Users/paramveer/.codex/3ds-artifact-overflow/hack-ldn-2025-20261008/`.
Blender `scene-check.json` confirms eight curves and no mesh/cube. The rendered
`chevron-motion-sheet.png` and `hack-ldn-chevron-once.gif` show the final motion.
`browser-checks.txt` verifies the actual atlas renderer, one-shot hold through
60 seconds, reduced motion, reset and disposal. The muted production preview
on port3049 was inspected through launch, both CogniLink pages and HOME return.
`hack-ldn-app.png` records the completed banner in the application.

Typecheck, production build and shader validation pass. The full suite has
2,168 passes, one known missing Camera HNI fixture failure, 96 skips and one TODO.
The 34 focused app, content and migration checks pass. The existing private
Camera lower.png fixture is absent; no native acceptance or comparison is claimed.
