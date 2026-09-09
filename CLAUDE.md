@AGENTS.md

# Silver 3DS XL portfolio

The authoritative project brief is `GOAL.md`. Read it and `docs/3ds-xl-research.md` before changing the model or site.

The downloaded Joshua P. original-XL model is now rigged, fully textured and adapted to silver on the homepage. The editable file is `model/candidates/joshua-xl/silver-grain.blend`. Read `docs/model-source-evaluation.md`, the candidate README, `docs/source-curvature-validation.md` and `docs/source-paint-grain-validation.md` before editing it. This adds shallow broad curvature supported by a physical original-XL scan and fine grain in the painted regions of its normal/roughness atlases. Earlier source and procedural files remain preserved. Do not resume procedural shell rebuilding by default.

Build a faithful, fully textured original silver Nintendo 3DS XL in Blender with Blender MCP, then make it the sole visible interface of a Next.js + Three.js portfolio using VGPU. It spins left, opens and is controlled through its buttons and lower touchscreen. Recreate the 3DS HOME Menu in the separate OS worktree, with portfolio content left plain.

The immediate defects are the flat-looking clamshell, inadequate front/back surface detail, inaccurate appearance and unverified fonts. Correct those from Nintendo documentation and matching photographs. Do not declare success from bounding-box tests or from the mere presence of a texture file. Inspect the actual browser result. Track remaining visual differences and asset dependencies honestly.

Read `docs/source-curvature-validation.md` for the current sourced-model checkpoint;
`docs/comparison-pass-2026-09-09.md` records earlier procedural repairs. The active OS task uses
branch `codex/home-menu-assets`; its decrypted asset dependency remains unresolved.
