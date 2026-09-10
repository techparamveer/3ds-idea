# Rounded audio socket and opening

The native candidate is `silver-audio-socket.blend`, following `silver-cover-seam.blend`. The earlier files are preserved. `audio-socket-study.md` records the Nintendo manual, original-XL front-edge photograph, source measurements and rejected trials.

## Geometry and shading

`preview_audio_socket.py` rounds the source's 16-sided socket rings and the adjacent chassis aperture with a common X-only chord correction. Height and depth remain exactly unchanged in the deformation. This avoids altering the front roll or shifting the horizontal lower-cover seam. The source's smooth normals are retained; tangent directions are transformed and re-orthogonalized, with their handedness carried through export.

The socket changes from 96 to 11,680 triangles, moving 6,170 vertices by at most 0.285051 mm. The chassis changes from 225,190 to 247,044 triangles, moving 3,904 vertices by at most 0.304714 mm. Minimum sampled Jacobian determinants are 0.520835 and 0.465561. All nondegenerate refined triangles retain their winding. These are checks of this deformation, not a complete collision proof or evidence of factory-exact geometry.

The script defaults to a reversible preview and must start from `silver-cover-seam.blend`. `main(persist=True, preview=False)` renders the six full views, saves the native candidate, exports the PNG GLB and restores its carried frame attributes. The render tool timed out after 300 seconds; files continued completing. A follow-up MCP query confirmed the new saved file, 76 objects and rendering stopped. No restart was used for this timeout.

Both matched final macro views and all six `audio-socket-final-*.png` views were inspected. The round contour removes the coarse polygonal outline without the first trial's radial reflection ripples in the silver roll. The rim's source texture still has uneven highlights at macro scale, and the photographed internal metal contacts are still absent. This is an improvement to the contour, not a finished connector.

## Export checks

Three independent tests in `test_audio_socket.py` pass. They verify unchanged hierarchy/transforms, materials and embedded image payloads; exact other meshes and position/UV triangles outside a conservative region; finite unit orthogonal shading frames; and preserved bounds. The changed insert has a 0.0001 mm bound tolerance for its source-fitted center and float32 export. The full chassis bounds use 0.00001 mm. The observed insert minimum-X difference is 0.000027 mm; it does not define the console's exterior envelope.

The two rear rings remain at their source-fitted radii within 0.0002 mm and have at least 64 angular samples each. The largest chord sag is below 0.011 mm—less than one pixel in the 18 mm-wide, 1000-pixel front macro. A fixed angular-gap threshold was replaced with this physical contour-error bound because the X-only sampling is nonuniform near the poles.

## Web delivery

The public asset mirrors `silver-audio-socket-web.glb`. Its PNG source is 152,052,676 bytes, SHA-256 `6e141d6ab68bec79a829c21447c826bffebea058b904070a8f31c69add750379`. The lossless WebP pack is 110,574,888 bytes, SHA-256 `143157f570e709986b570183418bf9f75279f789dd3d5661eede9be5f00d38d1`. Both independent packing tests pass: non-image data and semantics are unchanged, and every decoded RGBA pixel matches. All 132 application tests pass against the public asset. No application code changed, so the previous successful build was not repeated.

At 1280 × 720, the normal preview reports VGPU ready and shows the textured open interior, closed silver lid and rotated underside without captured warnings/errors. Clicking the physical A button opens a folder; HOME returns to the menu; a bottom-screen click changes the selected tile with `lastInput=touch`. Space closes the hinge to 0°, and the initial open pose is 155°. This verifies endpoints and operation, not a new frame-by-frame assessment of the introductory spin.

Exact glyph fidelity, rim microfinish and internal contact geometry remain unfinished. Authentic HOME Menu assets/font remain pending. The full fidelity goal is not complete.

The forced `?surface=baked` path reports WebGL fallback and renders the textured open console without captured warnings/errors. The normal URL and default viewport were restored afterwards.
