# Native CGFX conversion

The browser model is converted from the owner's decrypted EUR HOME Menu `romfs/3D/BannerFolder_LZ.bin`, not reconstructed geometry. The converter uses [SPICA](https://github.com/gdkchan/SPICA) revision `bd29a7828595d7839cda2ac61c76bb63f9071250` (Unlicense) as its binary reader. It runs headlessly with .NET 8 on macOS. Upstream System.Drawing is a compile dependency only; texture conversion uses raw RGBA and Python PNG output.

Build `Exporter.csproj` with `-p:SpicaRoot=/absolute/path/to/SPICA`, then run `convert.py SOURCE OUTPUT --scratch SCRATCH --dotnet /path/to/dotnet --exporter /path/to/Exporter.dll`. Keep build, decompressed input and RGBA intermediates in the configured Sandisk artifacts directory. The wrapper records compressed and decompressed SHA256 plus upstream revision. No executable, encrypted container or keys are published.

Version 1.4.1 also accepts a **decrypted** ExeFS `banner.bin` CBMD directly.
`--language eur-en` (the default) selects its EUR-English CGFX entry, or the
common model when that entry is zero. The source CBMD hash, selected compressed
block hash, clear CGFX hash and exact offsets are recorded in model JSON. The
LZ11 model is bounded to the native 0x80000-byte limit; BCWAV audio remains
outside the graphics conversion. A CBMD with only textures is converted as
data but is not a renderable `createFirmwareModel` primary. See
`docs/stock-home-banner-source.md` for the title inventory and remaining HOME
presentation work.

The intermediate JSON retains meshes, four bone influences, skeleton bind transforms, all native material records, texture combiners, LUTs, skeletal/material/visibility/camera animation and source cameras/lights. Native texture-combiner constant selection is copied directly from CGFX because SPICA's H3D conversion otherwise omits it. Browser PNGs are vertically normalized from SPICA's bottom-up RGBA.

`src/scene/firmware-model.ts` renders the original meshes with PICA texture-combiner programs, native blending/wrapping/filtering, rigid or smooth skinning, Hermite skeletal transform curves and texture matrix material animation. The folder's empty contents are hidden; its Text mesh receives the original layout's dynamic label surface. Its source bone channel bobs over 150 frames within a 600-frame looping clip.

The exporter also retains each native light subtype and all 256 raw PICA words per LUT sampler. The subtype avoids SPICA's zero-based CGFX to one-based H3D enum mismatch; the raw words retain interpolation slopes omitted from its float-only table. `src/scene/cgfx-lighting.ts` evaluates directional, unbumped Dist0 and Fresnel lighting with the source light direction, material colors and authored LUTs. Native folder geometry and texture pixels are unchanged.

Version 1.3.0 preserves raw NativeBillboardMode alongside the SPICA enum label, which ToH3D omits, and adapts
the observed revision-5 root with 15 dictionaries through `LegacyGfxReader.cs`.
This prevents the first DICT header from being misread as a sixteenth Emitters
field. Typed object parsing still uses the pinned SPICA source. The Text bone's
Native direction-facing axial mode5, native label surface and display transfer are documented in
`docs/native-folder-label-2026-09-22.md`. Opt-in real-resource tests are in
`tests/test_legacy_cgfx.py`.

Remaining fidelity work: bump/reflection/geometry-factor lighting, quaternion/matrix animation elements and visibility animation are exported but not yet evaluated by the presenter. Unsupported lighting still uses the previous approximation. Light sign, camera/view convention and runtime banner transforms require matched Azahar captures; passing a conversion or shader test alone is not a fidelity claim. See `docs/native-folder-lighting-2026-09-22.md`.

For registration in the extracted delivery manifest, add `--manifest /delivery/manifest.json --model-key homeBackground --title-id 0004003000009802 --source-path 3D/BannerBG_LZ.bin`. All four arguments are required together. The output must be inside the manifest's `models/` directory and the source title must already be registered. Model JSON and texture hashes, sizes and compressed source provenance are written to `resources`; the normal firmware builder preserves these separately converted entries. The sidecar also records the wrapper and exporter hashes.

Model playback now requires explicit clip selection when a resource contains alternatives. `BannerBG_SceneIn` can be held at frame 20 while `BannerBG_Loop` advances independently. Pause, quit and restart clips are not applied simultaneously. Material constant RGBA curves and texture transforms reset to authored values before each selected playback state, so changing clips does not leave stale tint or UV values. The delivered HOME background remains subject to native camera and screen comparison.
