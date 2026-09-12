# Compact model delivery

The homepage serves `public/models/candidates/joshua-xl.glb`, mirrored from
`model/candidates/joshua-xl/silver-audio-finish-compact.glb`.
Continue editing **silver-audio-finish.blend**. The full-resolution authoring GLB
and the previous lossless WebP pack remain preserved.

## Measured size

- Previous delivery: **110,575,868 bytes (110.58 MB)**.
- Compact delivery: **12,350,048 bytes (12.35 MB)**.
- Reduction: **88.83%** in model payload per uncached download.
- SHA-256: `ca37ec5824f0cd3aa46ca5079b2a339078b203a9afa5f87a1b14b09d1e68454d`.
- Embedded texture payload: 73,941,978 → 4,527,964 bytes.
- All 639,609 triangles remain. Node hierarchy, hinge, material assignments,
  screen anchors, button parts and both UV channels are retained.

This reduces model transfer bandwidth, not every part of the hosting bill.
The Blender files and historical checkpoints are authoring resources stored in
Git LFS; the website does not request them. Git repository storage is separate
from website transfer. Local gzip/Brotli experiments yielded 10.41/9.56 MB,
but those are not claimed as actual transfer sizes: CDN HTTP compression depends
on deployment configuration.

## Packing choices

The packer removes 300 unreferenced accessors (14,754,300 raw bytes), then uses
`EXT_meshopt_compression`. Indices are lossless, preserving triangle order.
Exponential filtering retains Float32 values in the original millimetre units;
it does not rebase node scales or disrupt the VGPU position-based grain.
Positions and UVs use 18-bit filter precision; normals/tangents use 12-bit.
The largest component errors against the source are:

- Position: 0.00048828125 mm, under one micrometre.
- UV: 7.62939453125e-06, approximately 0.0313 texel on a 4096 map.
- Normal: 0.000244140625.
- Tangent: 0.00048828125.

Large base-colour atlases retain their 4096 resolution at WebP quality 95.
Large normal and roughness maps use 2048 resolution at quality 90.
Small encoded maps, including the 1024 cap lettering and lower-key maps,
are copied byte-for-byte. Materials, colour-space roles and UV bindings remain.
This is **lossy delivery compression**, not a claim of identical texture pixels.
Summed texture pixel count falls from 336,914,267 to 211,085,147 (37.3%);
this is not a measurement of total GPU memory or frame rate.

## Rebuild and verify

```sh
node scripts/compress-delivery.mjs
cp model/candidates/joshua-xl/silver-audio-finish-compact.glb public/models/candidates/joshua-xl.glb
npm test
npm run build
npm run typecheck
```

The packer writes a per-map size/resolution report beside the compact GLB.
After a new authoring checkpoint, pass source/output paths explicitly and update
the public mirror, identity test and documentation after visual review.
Do not use the compressed delivery file as the editable Blender source.

Validation on 2026-09-12: 140 tests passed, production build passed, typecheck
passed. The independent compressed-delivery test decodes with Three's actual
runtime Meshopt decoder, checks every live geometry stream against the source
within the stated bounds, checks indices exactly, and checks hierarchy/materials
and untouched texture bytes. The browser rendered the open front, closed silver
lid and underside, with VGPU ready. Circle-pad dragging, D-pad input, A/HOME and
hinge closing were checked. The matched front/lid views retained the overall
appearance; this does not resolve the pre-existing hardware fidelity gaps.
