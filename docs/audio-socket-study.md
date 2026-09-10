# Audio socket study

The starting checkpoint is `silver-cover-seam.blend`. The source part `Source_0_part_19` has 96 triangles and 16-sided concentric rear rings; its surrounding opening belongs to `Sourced graphite chassis`. The native X/Z center is approximately (−59.50925, 6.3141) mm. Rear outer diameter is approximately 5.7884 mm and inner opening diameter 4.0259 mm. These are source-model measurements, not published manufacturing dimensions or proof of the actual connector bore.

## Reference evidence

Nintendo's [original XL operations manual](https://www.nintendo.com/eu/media/downloads/support_1/nintendo_3ds_14/Nintendo3DSXL_OperationsManual_UK.pdf), printed pages 20–21 and 86, identifies the stereo audio jack and its function. It does not specify the molded rim diameter. Its 156 × 93 × 22 mm closed envelope and display sizes remain authoritative.

Antoine Turmel's [front-edge comparison photograph](https://commons.wikimedia.org/wiki/File:3DS_XL_and_New_3DS_XL_-_front.jpg), 14 February 2015, CC BY 2.0, was inspected in the browser at fitted and full image scale. **The lower console is the original XL**; the upper console is the New XL and is not the shape reference. The original has a round dark rim at the left front, crossing the chassis/cover boundary, and visible metal contact surfaces inside. The photo supports the round contour, not a calibrated diameter or exact internal contact dimensions. The user's image 5 also locates the headphone symbol and opening against the curved silver underside.

The current source lacks the photographed internal contacts. Rounding its mouth alone does not complete the connector. Do not turn a generic 3.5 mm plug standard into a claimed measurement of the visible molded mouth.

## Trial history

`preview_audio_socket.py` starts only from the saved cover-seam checkpoint, defaults to reversible edits, and restores the original mesh data after trial rendering.

An initial adaptive subdivision rule that selected an edge when either endpoint was in the region did not converge. A read-only per-iteration trace showed new long edges repeatedly crossing the selection boundary. Raising the iteration count did not solve this. Restricting selection to edges whose two endpoints lie inside the larger local box converged. The failed attempts restored both objects.

The first completed round-contour trial used a 16-gon radial correction and a common local X/Z displacement on both parts. It retained UVs and transported source normal/tangent frames through the deformation Jacobian. Although the contour became round, matched front and underside macros showed radial reflection ripples on the silver roll and socket. The trial was rejected; its images are `audio-socket-jacobian-rejected-{front,under}.png`.

A second approach kept the ring's smooth source normals and projected displaced chassis points back onto the original front surface. An unrestricted projection jumped from a visible internal surface to the exterior at a few rays (2.74 mm). Limiting projection depth avoided that jump and improved the render, but a subsequent winding check found 97 inverted triangles. Both projection versions were rejected before save/export.

The next trial uses a common **X-only** chord correction. Each horizontal polygon chord is expanded to its circular counterpart while Y and Z stay fixed, preserving the shell roll and horizontal seam. It retains the source's smooth normals and transports tangent directions before orthogonalization. The first broad influence region affected five thin underside triangles below the socket; restricting the falloff to radii 3.05–3.3 mm removes that unrelated area from the deformation. The refinement selection box remains larger, so adjacent coarse triangles can connect to the new ring without long edges.

The sampled determinant must remain positive, and every nondegenerate refined triangle must retain its winding before any candidate can be saved. The final X-only macro pair was accepted: the contour is smoother and the surrounding roll no longer shows the rejected radial shading ripples. Delivery verification is recorded in `source-audio-socket-validation.md`.
