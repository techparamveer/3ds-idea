# Lower button strip inspection

Starting checkpoint: `silver-restrained-paint.blend`. This trial is not installed in the saved model or public GLB.

The subsequent joint cap-and-recess correction is now installed in `silver-lower-keys`; see `source-lower-key-validation.md`. This document preserves the rejected cap-only trial.

The TechRadar original-XL front photograph was inspected again at native resolution. SELECT, HOME and START are dark markings on a slightly lighter strip. The existing photographic transfer preserves that relationship, so no ink brightness change was made. The same image shows rounded outer upper corners on SELECT and START, while the current source meshes have sharp ends. [Reference photograph](https://cdn.mos.cms.futurecdn.net/0584727e6f39c0e334d6e9537772f9fa.jpg)

The new `lower-keys-current-keys.png` overhead macro makes this distinction visible. Each source cap has only 22 vertices and 14 triangles. `preview_lower_key_corners.py` refines their outer rear patches and maps the corner quadrants into a rounded outline with a one-millimetre radius estimate. It carries interpolated source UVs and transports shading normals through the deformation Jacobian. No source textures, lettering, placement, HOME geometry or rig state change. This preview does not export tangent attributes and must not be used as a production export script.

`lower-keys-rounded-trial-keys.png` shows improved cap outlines, but the surrounding chassis recess remains square. The mismatch leaves triangular gaps at the two outer upper corners, so the caps must not be promoted alone. The trial restores the original mesh assignments in a `finally` block; both restored caps were confirmed to have 22 vertices.

Scene raycasts identify the surrounding recess as `Sourced graphite chassis`. Its native upper corner vertices are (-40.36148,-39.14468) and (39.94071,-39.14468) mm at Z 13.69307 and 15.03955 mm. The next pass should round the recess and caps together while preserving their clearance, source maps and closed-lid clearance. The one-millimetre cap radius is inferred from the photograph, not a factory measurement.

Trial report: each cap moves at most 0.38494 mm; the minimum Jacobian determinant exceeds 0.5007. The refined trial has 4,644 SELECT and 4,650 START triangles. This verifies a non-inverted local deformation, not the entire strip's mechanical or visual correctness. Glyph capture softness remains unresolved.
