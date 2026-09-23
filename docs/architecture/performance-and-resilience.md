# Performance and resilience architecture

The detailed tier table and implementation history are in
[`../performance-architecture.md`](../performance-architecture.md).

## Performance model

The dominant recurring costs are full-screen fill rate, shadow rendering, model
draw calls, animated bounds fitting, the secondary banner renderer and uploading
two changing canvas textures. VGPU surface generation is a one-time cost, but
its allocation/readback and subsequent shader recompilation can disrupt startup
if it competes with model decoding and the opening animation.

`render-quality.ts` is the only place that selects DPR, shadow size, scene FPS,
LCD FPS, VGPU texture size and constrained-device fallback. Do not add unrelated
quality heuristics inside render modules.

`screenPaintFps` temporarily allows the scene cadence for an advancing counted
folder close, including its final root restoration. Idle loops keep the ordinary
LCD cadence. Frozen clocks and reduced motion do not activate this boost. The
controller still consumes the shared clock independently from rendering; slow
devices can skip visual samples and must be measured separately.

## Degradation order

1. Lower LCD repaint/upload cadence.
2. Lower scene render cadence while keeping elapsed-time state updates.
3. Bound DPR and shadow-map resolution.
4. Use the baked material fallback instead of allocating VGPU on constrained
   devices or data-saving connections.
5. Fall back from the small 3D banner to canvas artwork if another WebGL context
   cannot be created.

The model, controls and portfolio content remain available in every tier.

## Runtime safeguards

- Compile initial Three.js materials before starting the intro clock.
- Defer VGPU generation until browser idle.
- Never regenerate the paint texture per frame.
- Skip screen animation while hidden, powered off, closed or reduced-motion.
- Keep QA dataset serialization development-only.
- Dispose asynchronously created resources if unmount wins the race.
- Avoid allocating new scene geometry, materials or renderers in animation loops.

## Measuring changes

Compare production builds on representative desktop and constrained/mobile
profiles. Record scene FPS, long tasks, GPU frame time, texture uploads, memory
and startup milestones. Also compare screenshots at matched camera poses: a
faster result that loses material maps, curvature or readable screens is a
regression.
