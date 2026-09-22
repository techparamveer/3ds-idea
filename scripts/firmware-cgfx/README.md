# Native CGFX conversion

The browser model is converted from the owner's decrypted EUR HOME Menu `romfs/3D/BannerFolder_LZ.bin`, not reconstructed geometry. The converter uses [SPICA](https://github.com/gdkchan/SPICA) revision `bd29a7828595d7839cda2ac61c76bb63f9071250` (Unlicense) as its binary reader. It runs headlessly with .NET 8 on macOS. Upstream System.Drawing is a compile dependency only; texture conversion uses raw RGBA and Python PNG output.

Build `Exporter.csproj` with `-p:SpicaRoot=/absolute/path/to/SPICA`, then run `convert.py SOURCE OUTPUT --scratch SCRATCH --dotnet /path/to/dotnet --exporter /path/to/Exporter.dll`. Keep build, decompressed input and RGBA intermediates in the configured Sandisk artifacts directory. The wrapper records compressed and decompressed SHA256 plus upstream revision. No executable, encrypted container or keys are published.

The intermediate JSON retains meshes, four bone influences, skeleton bind transforms, all native material records, texture combiners, LUTs, skeletal/material/visibility/camera animation and source cameras/lights. Native texture-combiner constant selection is copied directly from CGFX because SPICA's H3D conversion otherwise omits it. Browser PNGs are vertically normalized from SPICA's bottom-up RGBA.

`src/scene/firmware-model.ts` renders the original meshes with PICA texture-combiner programs, native blending/wrapping/filtering, rigid or smooth skinning, Hermite skeletal transform curves and texture matrix material animation. The folder's empty contents and placeholder text meshes are hidden. Its source bone channel bobs over 150 frames within a 600-frame looping clip.

The exporter also retains each native light subtype and all 256 raw PICA words per LUT sampler. The subtype avoids SPICA's zero-based CGFX to one-based H3D enum mismatch; the raw words retain interpolation slopes omitted from its float-only table. `src/scene/cgfx-lighting.ts` evaluates directional, unbumped Dist0 and Fresnel lighting with the source light direction, material colors and authored LUTs. Native folder geometry and texture pixels are unchanged.

Remaining fidelity work: bump/reflection/geometry-factor lighting, quaternion/matrix animation elements and visibility animation are exported but not yet evaluated by the presenter. Unsupported lighting still uses the previous approximation. Light sign, camera/view convention and runtime banner transforms require matched Azahar captures; passing a conversion or shader test alone is not a fidelity claim. See `docs/native-folder-lighting-2026-09-22.md`.
