# Restrained audio socket finish

The new native checkpoint is `silver-audio-finish.blend`, following `silver-audio-socket.blend`. Earlier models remain preserved. `audio-rim-finish-study.md` records the matched material diagnostics and reference limits.

The audio insert now has an independent copy of its original material with normal strength 0.2. Its original color, roughness/metallic, normal, specular and emission maps remain connected. Other users of the shared source material retain their original strength. The matched front and underside macros show a smoother rim reflection while retaining small edge relief. Full-console front and underside renders were also inspected. This is a local shading change; no geometric bevel, contour or new internal contact was added.

`install_audio_finish.py` defaults to a reversible preview and must start from `silver-audio-socket.blend`. After the macro trial, `main(persist=True, preview=False)` renders the full front/underside views, saves the new native file, exports its PNG GLB and restores the carried shading frames.

The independent export test passes. Every position, index, normal, tangent and UV accessor is byte-identical, along with node transforms and hierarchy. All original maps and sampler descriptions are identical. The only material differences allowed by the test are the audio insert's new material name and normal scale 0.2; unrelated materials match exactly. Consequently the previous geometry, envelope and hinge checks remain applicable. The value is a photographic appearance fit, not a measured Nintendo surface parameter.

The public asset mirrors `silver-audio-finish-web.glb`. The PNG GLB is 152,053,480 bytes, SHA-256 `31635edac1a637569f2f6ff5746e8089ecfb9eb8186159371dd5b2964b14dde9`. The web pack is 110,575,868 bytes, SHA-256 `f0efcd0ae555df55abbd5a515ea98021417cf1222b15cd363cdbd7bff7fc2a77`. Both packing tests pass: all non-image data and semantics remain unchanged, and all 30 images decode to identical RGBA pixels. No additional decoded texture allocation is introduced by this material copy.

All 132 application tests pass. At 1280 × 720 the normal preview reports VGPU ready, with the open console and rotated closed underside inspected and no captured warning/error entries. Physical A opens a folder and HOME returns to the menu. Space closes the hinge to 0°, with the initial open pose at 155°. This is an operation/endpoints check, not a new frame-by-frame animation review. No application code changed, so the earlier successful build was not repeated.

 The photographed internal contacts and exact hardware lettering remain unresolved, and authentic HOME Menu graphics/font are still absent. The complete fidelity goal is not finished.

The forced `?surface=baked` path reports WebGL fallback and shows the textured open console with no captured warnings/errors. The normal URL and default viewport were restored afterwards.
