# Goal: a faithful silver Nintendo 3DS XL portfolio

Build a personal portfolio website whose entire visible interface is a realistic, interactive **original 2012 Silver + Black Nintendo 3DS XL, model SPR-001**. Reconstruct the console in Blender using Blender MCP, then present it in Next.js and Three.js with VGPU. The console spins left, opens, and lets visitors navigate through its physical buttons and bottom touchscreen. Keep portfolio content plain until the hardware and HOME Menu are faithful.

The user's standard is exact visual resemblance to their reference photographs. The current prototype has been rejected for its smooth surfaces, wrong font, flat-looking back and inaccurate appearance. Treat it as an unfinished starting point. Passing dimensions or interaction tests does not satisfy the visual goal.

## Research before reconstruction

Use Nintendo's original product pages, operations manual and official front/rear imagery, supplemented by close-up photographs of the same silver model and all seven supplied images. Record source URLs, the view each supports, confirmed measurements, and remaining uncertainty in `docs/3ds-xl-research.md`. Distinguish published dimensions from estimates made from perspective photographs. Research the original XL hardware even though the firmware ZIP has NEW in its filename.

## Hardware requirements

- Preserve the closed envelope of **156 × 93 × 22 mm** and the requested animated hinge range of **0–155°**. Match the silhouette and proportions of each component as well as the overall envelope.
- Use Nintendo's published active display sizes: upper **106.2 × 63.72 mm**, lower **84.96 × 63.72 mm**. The advertised diagonals are 4.88 and 4.18 inches. Upper storage is 800 × 240 with 400 × 240 per eye; lower storage is 320 × 240. Do not stretch the upper display into an 800:240 physical rectangle. [Nintendo specifications](https://www.nintendo.co.jp/hardware/3dsseries/3dsll/index.html)
- Reconstruct the curved clamshell: broad shell curvature, rolled edges, corner transitions, lid thickness, lower cover and seams. The outer lid and underside must hold up from side and grazing angles. Do not use a flat slab with a superficial bevel or fake the silhouette with a normal map.
- Match the screen surrounds, hinge segments, circle pad dish and recess, D-pad, ABXY caps, SELECT/HOME/START strip, power button, cameras, speakers, sliders, indicators, ports and underside details to the references. Check their positions, sizes, depths and spacing.
- Texture the complete console: silver outer lid and underside, black inner lid and control deck, plastic buttons, silicone circle pad, lenses and screen surfaces. Use appropriate fine grain, roughness variation, restrained micro scratches and contact wear. Preserve the difference between painted plastic, molded plastic, rubber and glass. Avoid uniform smooth shading, chrome-like silver and exaggerated dirt.
- Match hardware legends, symbols and branding by their actual glyph shapes, stroke widths, spacing, size and placement. Helvetica is an unverified placeholder. Hardware lettering and the operating system font are separate tasks.
- Use lighting that reveals curvature and surface finish. Verify that the textures survive GLB export and appear in the browser, including the fallback when WebGPU is unavailable.

## Website and HOME Menu requirements

- Show only the console against a simple background. No headings, explanatory copy, floating navigation, decorative cards or unrelated UI outside the device.
- Animate the leftward spin and opening cleanly. Support rotation and inspection of the back. Keep the console usable and fully framed on desktop and mobile, with reduced-motion support.
- Make physical button clicks, keyboard equivalents and bottom-screen touch input operate the same menu state. Keep screen graphics correctly aligned with the display openings throughout hinge movement.
- Recreate the 3DS HOME Menu's layout, typography, icons, selection states and transitions. Leave portfolio entries empty for now. Arial and approximate folder graphics must not be described as the original OS.
- Continue OS work in the separate `codex/home-menu-assets` task/worktree. Inspect the supplied firmware archive as data and use available extracted assets with recorded provenance. The current archive inspection found encrypted HOME Menu content; do not claim extraction has succeeded. Record missing decrypted assets/fonts as dependencies while continuing independent hardware work. The older `codex/3ds-os` worktree remains preserved.
- Keep VGPU integrated and verify `npx vgpu`, the material shader and its visible output. Preserve a working texture fallback.

## Iteration and acceptance

For each substantial modeling pass, compare matching views of the reference and render: closed top, open front, front three-quarter, side profile, rear and underside. Align camera angle and framing before judging proportions. Inspect close-ups of curvature, texture and lettering. Record the differences found and the changes made; then inspect the exported model in the actual website.

Deliver the editable `.blend`, textured `.glb`, texture sources, working Next.js project, OS worktree, reference record and verification evidence. Run checks appropriate to changed geometry, rendering and interactions. Completion requires both functional verification and visual evidence that the reported differences have been resolved. Keep unresolved mismatches explicit; never substitute “tests pass” for “looks like the reference,” or claim exact identity without evidence.
