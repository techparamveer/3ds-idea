@AGENTS.md

# Silver 3DS XL portfolio

The authoritative project brief is `GOAL.md`. Read it and `docs/3ds-xl-research.md` before changing the model or site.

The latest direction is to obtain a faithful original-XL model from the web and rig it in Blender. Prioritize the candidates and import steps in `docs/model-source-evaluation.md`, preserving the current reconstruction until the replacement is verified. Do not resume procedural shell rebuilding by default.

Build a faithful, fully textured original silver Nintendo 3DS XL in Blender with Blender MCP, then make it the sole visible interface of a Next.js + Three.js portfolio using VGPU. It spins left, opens and is controlled through its buttons and lower touchscreen. Recreate the 3DS HOME Menu in the separate OS worktree, with portfolio content left plain.

The immediate defects are the flat-looking clamshell, inadequate front/back surface detail, inaccurate appearance and unverified fonts. Correct those from Nintendo documentation and matching photographs. Do not declare success from bounding-box tests or from the mere presence of a texture file. Inspect the actual browser result. Track remaining visual differences and asset dependencies honestly.

Read `docs/comparison-pass-2026-09-09.md` for the latest applied geometry, material,
control and motion repairs before proposing another pass. The active OS task uses
branch `codex/home-menu-assets`; its decrypted asset dependency remains unresolved.
