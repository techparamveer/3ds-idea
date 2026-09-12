# Web delivery model

The current homepage uses the [compact delivery pack](compact-model-delivery.md),
12.35 MB rather than the previous 110.58 MB. The lossless packing records below
are historical source checkpoints.

Historical checkpoint update: the homepage then served `silver-dock-contacts-web.glb`, packed from `silver-dock-contacts.glb`; edit `silver-dock-contacts.blend`. See `source-dock-contact-validation.md` for current sizes, hashes and checks. The initial packing measurements below remain a historical baseline.

The initial packing pass used `silver-lower-keys.blend`, its PNG-based authoring export `silver-lower-keys.glb`, and the separate `silver-lower-keys-web.glb`. Do not import a web pack as the next authoring checkpoint.

The authoring GLB is 142,072,916 bytes, including 116,808,481 bytes of embedded images. None of those image payloads were byte-identical duplicates. `scripts/pack_web_model.py` re-encodes each image as lossless WebP, verifies exact decoded RGBA pixels and dimensions, and retains the original format if WebP is larger. It rebuilds buffer offsets without changing non-image buffer bytes, accessors, meshes, nodes, hierarchy, animation data, material values, texture coordinates or samplers. It does not resize maps or simplify geometry.

The result is 101,490,692 bytes: 40,582,224 fewer bytes, a 28.56% reduction. SHA-256 is `a1de5d3fcdba5e091b00b280fe6c110adb0f3edc9b21853e81af3e89f3d863bb`. Per-image size and decoded-pixel hashes are in `silver-lower-keys-web.packing.json`. This reduces transfer size; it does not reduce decoded GPU texture memory, and no frame-rate improvement is claimed.

The pack declares `EXT_texture_webp` in both used and required extensions, and texture image indices move to that extension's `source` field. The installed Three.js loader has the corresponding image-loading handler. [Three.js supported extensions](https://threejs.org/docs/pages/GLTFLoader.html), [Khronos WebP texture extension](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/EXT_texture_webp).

Independent tests in `tests/test_web_model.py` reopen both GLBs, compare every decoded texture pixel, compare all non-image buffer payloads, and normalize only the declared storage changes before comparing the complete JSON documents. Both tests pass. All 119 JavaScript tests pass, including the public asset identity check. The original source and Blender checkpoint are preserved.

Browser inspection at 1280 × 720 covered the open interior, closed silver lid and underside. The WebP textures loaded with VGPU ready, A opened a folder, HOME returned and the hinge closed. The development-only baked fallback was also checked with the same pack. No application code or shader was changed. The pack remains large, and further delivery optimization must preserve the surface detail and model silhouette.

After future Blender exports, run `pack_web_model.py` on the new authoring GLB, run the independent preservation tests against that pair, inspect the browser, and then update the public mirror and identity test. Preserve the full authoring GLB and source textures.

The current power-indicator delivery pair is `silver-power-indicator.glb` and `silver-power-indicator-web.glb`. The latter is 104,636,804 bytes, with pixel-identical image decoding and unchanged non-image payloads verified independently. Keep editing `silver-power-indicator.blend`; see `source-power-indicator-validation.md`.

The rounded-cap checkpoint now uses `silver-abxy-rollover.glb` and `silver-abxy-rollover-web.glb` (104,638,084 bytes). Both independent pixel/payload checks pass. The editable file remains the PNG-based `silver-abxy-rollover.blend`.

The current planar-print pair is `silver-abxy-print.glb` / `silver-abxy-print-web.glb` (105,244,372 bytes). It adds the 1024-pixel cap-print atlas and preserves the other decoded maps. Both independent packing checks pass. Continue editing `silver-abxy-print.blend`.

The current pair is `silver-screen-backings.glb` / `silver-screen-backings-web.glb` (96,707,412 bytes). Removing the erroneous screen-atlas bindings eliminates two now-unused images from delivery. The pixel/payload verification remains relative to the new authoring GLB; retained material images also pass comparison against the preceding checkpoint. Continue editing `silver-screen-backings.blend`.
