@AGENTS.md

# Silver 3DS XL portfolio

The authoritative project brief is `GOAL.md`. Read it and `docs/3ds-xl-research.md` before changing the model or site.

The downloaded Joshua P. original-XL model is now rigged, fully textured and adapted to silver on the homepage. The editable file is `model/candidates/joshua-xl/silver-cover-seam.blend`. Read `docs/source-dock-contact-validation.md`, `docs/source-lower-key-validation.md`, `docs/source-restrained-paint-validation.md`, `docs/model-source-evaluation.md`, the candidate README and `docs/source-dimensions-validation.md` before editing it. This retains shallow broad curvature supported by a physical original-XL scan and baked paint grain, and photographic EUR underside markings. The closed envelope is now 156 × 93 × 22 mm, with retained control shapes. The upper opening uses an image-derived 115 mm fit; Y has 0.9138 mm closed clearance. See `docs/source-front-validation.md`. The lettering has documented capture-resolution limits; it is not a verified factory font. Earlier source and procedural files remain preserved. Do not resume procedural shell rebuilding by default.

Build a faithful, fully textured original silver Nintendo 3DS XL in Blender with Blender MCP, then make it the sole visible interface of a Next.js + Three.js portfolio using VGPU. It spins left, opens and is controlled through its buttons and lower touchscreen. Recreate the 3DS HOME Menu in the separate OS worktree, with portfolio content left plain.

The immediate defects are the flat-looking clamshell, inadequate front/back surface detail, inaccurate appearance and unverified fonts. Correct those from Nintendo documentation and matching photographs. Do not declare success from bounding-box tests or from the mere presence of a texture file. Inspect the actual browser result. Track remaining visual differences and asset dependencies honestly.

Read `docs/source-corners-validation.md` for the current sourced-model checkpoint;
`docs/comparison-pass-2026-09-09.md` records earlier procedural repairs. The active OS task uses
branch `codex/home-menu-assets`; its decrypted asset dependency remains unresolved.

The browser serves a lossless WebP delivery pack, `silver-cover-seam-web.glb`; keep editing the PNG-based Blender checkpoint. See `docs/web-model-packing.md` before updating the public asset.

The power indicator colour pass is documented in `docs/source-power-indicator-validation.md`.

The rounded cap-rim checkpoint is documented in `docs/source-abxy-rollover-validation.md`.

The cap-print atlas and grouped-button handling are documented in `docs/source-abxy-print-validation.md`.

The screen backing atlas correction is documented in `docs/source-screen-backings-validation.md`.

The dark-plastic normal correction is documented in `docs/source-plastic-normal-validation.md`.

The coordinated D-pad and aperture fit is documented in `docs/source-dpad-fit-validation.md`.

The D-pad satin material revision is documented in `docs/source-dpad-finish-validation.md`.

The upper cover border and LCD edge revision is documented in `docs/source-upper-cover-validation.md`.

The rounded power cap and opening are documented in `docs/source-power-fit-validation.md`.

The satin power-button finish is documented in `docs/source-power-finish-validation.md`.

The corrected upper-opening width is documented in `docs/source-upper-width-validation.md`.

The localized inner-lid reflection revision is documented in `docs/source-lid-face-validation.md`.

The clean lower-key maps and UV0 paint-mask correction are documented in `docs/source-lower-label-validation.md`.

The lower-cover cross-section refinement is documented in `docs/source-cover-profile-validation.md`.

The coordinated SD-flap and opening refinement is documented in `docs/source-sd-outline-validation.md`.

The lower-cover seam and tangent-sign correction are documented in `docs/source-cover-seam-validation.md`.
