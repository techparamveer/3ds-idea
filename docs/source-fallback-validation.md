# Baked surface fallback verification

The current model is `silver-abxy-ink.glb`, public SHA-256 `14da48e2edd1e9c24325384c2b624adca8302688f39d25baebfa4d037e582a7f`.

`createSilverSurface()` now accepts a development-only diagnostic through the current page URL: `?surface=baked`. It returns the same null result as the existing no-WebGPU branch, exercising the actual scene fallback without replacing the browser's GPU APIs. Production builds ignore this query, and the normal homepage continues using VGPU.

At `http://localhost:3000/?surface=baked`, inspected the open front, closed silver lid, and underside after dragging the closed console at 1280 × 720. The host reported `vgpu=webgl-fallback`, `ready=true`, and hinge 155° open / 0° closed. Silver paint, dark plastic, hardware ink, and underside markings remained visible. The material maps were retained rather than replaced by a generic fallback colour. No browser warnings/errors were returned. Rotation and keyboard closing worked.

This proves the baked-texture branch works in the current browser. It does not emulate a particular unsupported device, failed adapter acquisition, WebGL absence, or every graphics driver. It also does not establish exact material matching to Nintendo hardware. Fine grain and micro scratches still need visual calibration at close viewing distances.

Returned to the normal homepage and verified `vgpu=ready`, `ready=true`, hinge 155°. Restored the default viewport.

All 92 repository tests, TypeScript checking, and the production build pass. The shader check initially could not acquire a GPU in the command sandbox; rerunning the same `npm run check:shader` outside that sandbox completed successfully. The diagnostic does not change any model assets.
