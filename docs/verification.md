# Verification record — 2026-09-09

- Production Next.js build: passed.
- TypeScript: passed.
- Eight automated tests: passed. These check navigation bounds, touch/button parity, open/back/home/power transitions, the actual exported model dimensions, screen diagonals, hinge/control nodes and paint UVs.
- `npx vgpu`: executed, version 0.4.1.
- Device-backed WGSL validation: passed. The first sandboxed attempt could not acquire the GPU; the authorized local-GPU run succeeded.
- VGPU offscreen render/readback: passed; `docs/surface-validation.json` contains the measured output.
- Browser: loaded `/` with one canvas and no visible page text or overlay. Runtime VGPU state reached `ready`.
- Physical A: opened selected folder. Physical B: returned to HOME Menu.
- Keyboard right/down: selected slot 3. Physical D-pad up: selected slot 2.
- Touch on first tile: selected slot 0, input identified by screen raycast.
- Physical POWER: both screen textures switched off; power LED follows state.
- Space: hinge settled at 0°, then reopened to 155°.
- Responsive check at 390 × 844: initially clipped; camera corrected and the whole console was visually verified inside the viewport.

## Limits of this verification

These checks establish a working, dimensioned interactive reconstruction. They do not establish exact visual identity with a retail 3DS XL or pixel-identical Nintendo HOME Menu graphics. Decrypted firmware assets remain unavailable, and detailed hardware fidelity remains under review. No deployment or public publishing has been performed.
