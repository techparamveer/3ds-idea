# Verification record — 2026-09-09

- Production Next.js build: passed.
- TypeScript: passed.
- Fourteen automated tests: passed. These check menu input, the actual exported dimensions, published screen sizes, hinge/control nodes, embedded PBR maps, aligned sockets, distinct membrane keys, nominal closed clearance, original XL connector layout and bounded continuous motion.
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

## Latest comparison pass

See `comparison-pass-2026-09-09.md` for the reference-based repairs and known limits.
The current browser asset was visually inspected at 1280×800. Input and scene
state were also checked in the user's narrow 319×1597 preview; its background-tab
capture did not provide usable visual evidence. A fresh 390×844 override attempt did not change the browser's
reported dimensions, so it is not counted as new phone-size verification.
Temporary viewport overrides were reset. Physical A, HOME and D-pad clicks,
bottom-screen touch, keyboard B and Space, and the ready VGPU state were checked
in the live page. GPU materials/textures are prepared before the intro clock
starts, avoiding a skipped turn during first-frame setup.

The production build passed after moving the cached sandbox failure aside and
rerunning with local-port access. `npx vgpu` ran successfully. Real-device WGSL
validation and128×128 render/readback passed (roughness bytes78–109, mean87.97).
The latest geometry measures156×93×22mm. The enlarged underside label was reduced
from a wasteful radial tessellation to a regular grid before final export.

## Limits of this verification

These checks establish a working, dimensioned interactive reconstruction. They do not establish exact visual identity with a retail 3DS XL or pixel-identical Nintendo HOME Menu graphics. Decrypted firmware assets remain unavailable, and detailed hardware fidelity remains under review. No deployment or public publishing has been performed.
