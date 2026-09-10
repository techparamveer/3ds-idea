# Rotation-aware console framing

The prior fixed aspect-ratio adjustment let the open console clip the right edge of a 390 × 844 viewport after a 190-pixel leftward drag. The default resting view fitted, so checking that view alone missed the defect.

`src/scene/framing.ts` caches the eight corners of each mesh's local bounding box, transforms them into camera space after each animated pose update, and computes the required perspective field of view. It retains the previous 33°/aspect-based view as the minimum. Poses that need more space receive a wider view with a 6% margin at each screen edge. The camera direction, physical model dimensions, hinge and textures are unchanged. Fitting runs before rendering and before projecting control targets for browser QA. Bounds are conservative and may include space outside the actual silhouette.

Validation:

- `tests/framing.test.mjs` reads the shipped GLB's actual hierarchy and position bounds and projects every bound corner. It samples portrait, landscape, desktop and square viewports; six hinge angles from 0–155°; sixteen yaw positions; five pitches including both drag limits; and three zoom scales including both limits. All projected bounds stay inside the margin and clipping planes.
- `npm test`: 55 passing tests. `npm run typecheck` and `npm run build`: pass.
- Browser at 390 × 844: the default open view still fits. The formerly clipped sideways open pose and its closed pose now fit. Clicking the physical A cap in the sideways pose opens the selected folder; H returns HOME and Space closes the lid. VGPU reports ready. No captured browser warnings or errors during this check.
- Temporary viewport override reset; homepage reloaded to its normal presentation.

This resolves the observed framing defect. It does not establish exact hardware fidelity or authentic HOME Menu graphics; the existing model research and asset limitations remain applicable.
