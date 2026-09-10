@AGENTS.md

# Silver 3DS XL portfolio

The authoritative project brief is `GOAL.md`. Read it and `docs/3ds-xl-research.md` before changing the model or site.

The downloaded Joshua P. original-XL model is now rigged, fully textured and adapted to silver on the homepage. The editable file is `model/candidates/joshua-xl/silver-abxy-openings.blend`. Read `docs/model-source-evaluation.md`, the candidate README and `docs/source-dimensions-validation.md` before editing it. This retains shallow broad curvature supported by a physical original-XL scan and baked paint grain, and photographic EUR underside markings. The closed envelope is now 156 × 93 × 22 mm, with retained control shapes. The upper opening is narrower; Y still has 0.4655 mm closed clearance. See `docs/source-front-validation.md`. The lettering has documented capture-resolution limits; it is not a verified factory font. Earlier source and procedural files remain preserved. Do not resume procedural shell rebuilding by default.

Build a faithful, fully textured original silver Nintendo 3DS XL in Blender with Blender MCP, then make it the sole visible interface of a Next.js + Three.js portfolio using VGPU. It spins left, opens and is controlled through its buttons and lower touchscreen. Recreate the 3DS HOME Menu in the separate OS worktree, with portfolio content left plain.

The immediate defects are the flat-looking clamshell, inadequate front/back surface detail, inaccurate appearance and unverified fonts. Correct those from Nintendo documentation and matching photographs. Do not declare success from bounding-box tests or from the mere presence of a texture file. Inspect the actual browser result. Track remaining visual differences and asset dependencies honestly.

Read `docs/source-corners-validation.md` for the current sourced-model checkpoint;
`docs/comparison-pass-2026-09-09.md` records earlier procedural repairs. The active OS task uses
branch `codex/home-menu-assets`; its decrypted asset dependency remains unresolved.
