# Silver 3DS XL

Project brief and acceptance criteria: [GOAL.md](GOAL.md). Current research and visual defects: [3DS XL research](docs/3ds-xl-research.md). Agent instructions: [AGENTS.md](AGENTS.md) and [CLAUDE.md](CLAUDE.md).

A Blender-authored silver Nintendo 3DS XL, displayed as an interactive Next.js / Three.js portfolio. The page contains only the console. It turns left and opens, then the physical controls and bottom touchscreen navigate a plain HOME Menu.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:3000. `npm run build` creates a production build; `npm start` serves it.

## Controls

- Drag the console to rotate; scroll/pinch-wheel to zoom.
- Click the lid/hinge or press Space to close/open (0–155°).
- D-pad/circle pad or arrow keys navigate. A/Enter opens; B/Escape returns.
- HOME/H returns to the menu. START opens; SELECT/X changes grid density.
- Y cycles screen brightness. L/R or Q/E move through the menu.
- POWER/P switches both screens and the power LED off/on.
- Tap a bottom-screen tile to select it; tap it again to open. Portfolio folders are deliberately empty.
- Reduced-motion preference skips the introductory spin.

## Model and rendering

- `model/silver-3ds-xl.blend`: native Blender model, studio lights, camera, packed surface map.
- `public/models/silver-3ds-xl.glb`: web model, in metres, with hinge and separately named controls.
- `model/dimensions.json`: physical measurements from evaluated Blender geometry.
- `renders/`: intermediate and refined comparison renders.
- `scripts/`: modeling passes executed through Blender MCP; the saved `.blend` is the current authoritative model.
- `docs/references.md`: photo sources and honest fidelity gaps.

The closed model measures **156 × 93 × 22 mm**. Display diagonals are **4.88 in / 4.18 in**, with **800 × 240 / 320 × 240** canvas textures. The upper physical panel uses the correct 5:3 monoscopic ratio.

## VGPU

`npx vgpu` was run. VGPU 0.4.1 is installed and the Next.js WGSL loader is configured. `src/shaders/silver.wgsl` generates the paint's grain and micro-scratch roughness once on WebGPU, then Three.js uses it as a material texture. Browsers without WebGPU keep the packed Blender texture.

```sh
npm test
npm run typecheck
npm run check:shader
node scripts/check-surface.mjs
```

Shader validation and readback require GPU access. `docs/surface-validation.json` records an actual GPU render/readback, not only a parser check.

## OS worktree

The separate worktree is `../3ds-idea-os`, branch `codex/3ds-os`. Its `src/os` modules are integrated here. Firmware inspection is read-only and never runs the archive's contents. The supplied archive has 137 CIA packages; the HOME Menu title is encrypted, so no firmware assets have been extracted or shipped. A decrypted HOME Menu RomFS/assets path is pending from the owner.

The hardware and menu are still under fidelity review; the project does not claim exact identity with Nintendo's original hardware or firmware UI.
