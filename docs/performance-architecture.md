# Browser performance architecture

The console keeps one authoritative render-quality policy in
`src/scene/render-quality.ts`. The scene, screen uploads, shadow budget and VGPU
surface generation consume that policy instead of selecting independent values.

## Tiers

| Tier | DPR cap | Scene FPS | LCD FPS | Shadow map | VGPU surface |
| --- | ---: | ---: | ---: | ---: | ---: |
| High | 1.5 | 60 | 24 | 1024² | 512², idle-created |
| Balanced | 1.25 | 45 | 18 | 1024² | 512², idle-created |
| Constrained | 1 | 30 | 12 | 512² | baked Blender fallback |

An advancing counted folder close temporarily uses the scene FPS budget for LCD
painting (60/45/30), including the restored-root update. Idle loops retain the
table's LCD values. Reduced motion keeps its settled-pose policy; a frozen HOME
clock does not increase uploads. State timing never depends on completed paints.

Constrained mode is selected for data-saving connections, devices reporting at
most four logical cores or 4 GiB memory, and displays above three million CSS
pixels. The fallback is the already verified baked surface, not an untextured
material.

The animation state still advances on `requestAnimationFrame`, so input and
motion timing remain elapsed-time based. Expensive matrix/bounds work and actual
GPU renders run only at the tier cadence. LCD canvases use a separate cadence,
and production builds omit the per-frame DOM serialization used by development
browser QA.

VGPU remains integrated on capable devices, but creation waits for browser idle
and its one-time readback is one quarter of the former pixel count. This avoids
competing with model decode, shader compilation and the opening animation.

## Verification

`tests/render-quality.test.mjs` locks the device classification and upper bounds.
The normal test, typecheck, production build and WGSL validation commands cover
the integration. Runtime inspection should confirm `data-quality` and
`data-vgpu` on `.console-stage`, then compare open, closed and oblique views so
that performance work does not hide texture or silhouette regressions.
