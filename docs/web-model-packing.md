# Lossless web delivery model

The editable model remains `silver-lower-keys.blend`, with its PNG-based authoring export `silver-lower-keys.glb`. The homepage now serves the separate `silver-lower-keys-web.glb`. Do not import the web pack as the next authoring checkpoint.

The authoring GLB is 142,072,916 bytes, including 116,808,481 bytes of embedded images. None of those image payloads were byte-identical duplicates. `scripts/pack_web_model.py` re-encodes each image as lossless WebP, verifies exact decoded RGBA pixels and dimensions, and retains the original format if WebP is larger. It rebuilds buffer offsets without changing non-image buffer bytes, accessors, meshes, nodes, hierarchy, animation data, material values, texture coordinates or samplers. It does not resize maps or simplify geometry.

The result is 101,490,692 bytes: 40,582,224 fewer bytes, a 28.56% reduction. SHA-256 is `a1de5d3fcdba5e091b00b280fe6c110adb0f3edc9b21853e81af3e89f3d863bb`. Per-image size and decoded-pixel hashes are in `silver-lower-keys-web.packing.json`. This reduces transfer size; it does not reduce decoded GPU texture memory, and no frame-rate improvement is claimed.

The pack declares `EXT_texture_webp` in both used and required extensions, and texture image indices move to that extension's `source` field. The installed Three.js loader has the corresponding image-loading handler. [Three.js supported extensions](https://threejs.org/docs/pages/GLTFLoader.html), [Khronos WebP texture extension](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/EXT_texture_webp).

Independent tests in `tests/test_web_model.py` reopen both GLBs, compare every decoded texture pixel, compare all non-image buffer payloads, and normalize only the declared storage changes before comparing the complete JSON documents. Both tests pass. All 119 JavaScript tests pass, including the public asset identity check. The original source and Blender checkpoint are preserved.

Browser inspection at 1280 × 720 covered the open interior, closed silver lid and underside. The WebP textures loaded with VGPU ready, A opened a folder, HOME returned and the hinge closed. The development-only baked fallback was also checked with the same pack. No application code or shader was changed. The pack remains large, and further delivery optimization must preserve the surface detail and model silhouette.

After future Blender exports, run `pack_web_model.py` on the new authoring GLB, run the independent preservation tests against that pair, inspect the browser, and then update the public mirror and identity test. Preserve the full authoring GLB and source textures.
