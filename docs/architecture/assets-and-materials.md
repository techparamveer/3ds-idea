# Asset and material architecture

## Source-to-browser pipeline

```text
licensed source model
  → sequential Blender refinement checkpoints
  → active silver-audio-finish.blend
  → full-resolution validation GLB
  → scripts/compress-delivery.mjs
  → public/models/candidates/joshua-xl.glb
```

The active editable source is
`model/candidates/joshua-xl/silver-audio-finish.blend`. The public homepage asset
is the compact GLB. The earlier procedural `.blend` and `.glb` are historical
artifacts and must remain preserved.

Read the candidate README and the matching `docs/source-*-validation.md` before
changing a modeled area. Refinement scripts form a sequential pipeline; running
an earlier script indiscriminately against the current checkpoint can erase
later work.

## Contracts carried in the GLB

- Closed envelope: 156 × 93 × 22 mm.
- Separate base and lid/hinge hierarchy.
- Semantic screen anchors and physical-control metadata.
- Original UV0 PBR atlas coordinates.
- Secondary UV channels where bounded labels or optical maps require them.
- Explicit material roles and paint-mask URLs used by the browser extension.
- Meshopt-compressed geometry and browser-compatible texture delivery.

Geometry, textures and metadata are one contract. Renaming nodes, flattening the
hierarchy or dropping UV/tangent attributes can break runtime behavior even when
the model still looks plausible in Blender.

## Material layers

1. Embedded glTF base color, roughness, normal and emission maps provide the
   complete baked fallback.
2. `silver-surface.ts` optionally computes a small repeating roughness texture
   through VGPU.
3. `source-paint-surface.ts` injects that texture into Three.js roughness only
   where the exported UV0 paint mask permits it.

The VGPU layer is an enhancement, not the sole source of surface detail. A
browser without WebGPU must still show silver paint, graphite plastic, rubber,
glass, legends, lenses and indicators correctly.

## Delivery update checklist

After Blender changes, update the compact delivery GLB and matching EUR paint
mask together. Retain the adjacent source licence. Validate hierarchy, scale,
hinge motion, UV channels, material maps and browser appearance before replacing
the live asset. File-size reduction is not permission to remove visible detail.
