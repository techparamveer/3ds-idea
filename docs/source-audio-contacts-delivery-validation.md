# Headphone-contact delivery candidate — 26 September 2026

The candidate adds the visible inner housing, curved left contact and narrower
leaf to the already rounded, restrained-finish headphone rim. The [original XL
front-edge photograph](https://commons.wikimedia.org/wiki/File:3DS_XL_and_New_3DS_XL_-_front.jpg)
supports their presence and approximate ordering. The lower console is the
original XL; the upper is a New XL. The existing
[`audio-finish-final-front.png`](../model/candidates/joshua-xl/audio-finish-final-front.png)
macro has an empty black mouth. The separate
[`audio-contacts-trial-front.png`](../model/candidates/joshua-xl/audio-contacts-trial-front.png)
and
[`audio-contacts-trial-under.png`](../model/candidates/joshua-xl/audio-contacts-trial-under.png)
macros expose the contact surfaces from comparable front and underside views.
The [EUR underside photograph](source-eur-validation.md) and the
[`audio-contacts-final-underside.png`](../model/candidates/joshua-xl/audio-contacts-final-underside.png)
render show that the candidate does not change the broad cover artwork or
silhouette. These images have different cameras and light, so none establish
factory contact dimensions, alloy, roughness or a pixel match. The candidate's
specific dimensions remain photograph-constrained estimates; see
[the construction study](audio-contact-study.md).

## Preserved files and checks

The source candidate files already exist in Git LFS and remain untouched:

| File | SHA-256 |
| --- | --- |
| `model/candidates/joshua-xl/silver-audio-contacts.blend` | `6b830884644fae5c7447a4b97179e39ff59fe11be7c5d4177ce9a8afe1e7d10d` |
| `model/candidates/joshua-xl/silver-audio-contacts.glb` | `e92838dc666f1555c0f1da2b7accdc9136e8d9ac00fab76c4dfb9ea3f26aa107` |
| `model/candidates/joshua-xl/silver-audio-contacts-web.glb` | `177f292e43ef69c92ef236011e856eb6b15e726ceb891469862d03751295641f` |

Read-only `test_audio_contacts.py` passes all three checks against the
authoring GLB: the 73 old nodes, their mesh attributes, materials and rig
transforms remain unchanged; the three new parts are attached to Base and
bounded within the mouth; their faces and tangent frames are valid. The root
scale is the same `[0.001, 0.001, 0.001]` metre conversion (within float32
representation) in both files. The Hinge translation is identical, and its
range metadata remains `[0, 155]` degrees. The existing audio insert keeps
normal strength 0.2. The candidate has 76 nodes, 71 meshes, 20 materials and
30 images, compared with 73, 68, 18 and 30 in the active authoring GLB. The
two new materials are `Audio internal housing` and `Audio estimated plated
contacts`. `test_web_model.py` also passes both semantic and decoded-pixel
checks for the lossless WebP candidate.

The model packer initially exceeded its strict UV error bound by
`0.0000114441` on an added local contact UV. It now tries the existing 18-bit
precision first and increases only UV streams that exceed the `0.00001`
limit, up to 20 bits. This leaves already compliant streams at their prior
precision. A separate compact copy was written at
[`silver-audio-contacts-compact.glb`](../model/candidates/joshua-xl/silver-audio-contacts-compact.glb)
with [its report](../model/candidates/joshua-xl/silver-audio-contacts-compact.glb.json).
It is 12,415,072 bytes, SHA-256
`ca99725a9c3cf3772d6234f10f64cb9c8fb71b6f5d4beb0336eff89c12559b8c`.
The recorded maximum position error is 0.00048828125 mm, UV error
0.00000762939, normal error 0.000244141 and tangent error 0.00048828125.
The parameterized `compressed-delivery.test.mjs` passes against the candidate,
checking hierarchy, materials, geometry streams, indices and retained small
texture bytes. The active public compact GLB remains byte-identical to its
pre-audit hash `ca37ec5824f0cd3aa46ca5079b2a339078b203a9afa5f87a1b14b09d1e68454d`.

Blender MCP's addon-status and scene-info calls could not connect to Blender,
so no new native render or interactive Blender verification was possible.
At the candidate build checkpoint, the active public asset was still the
earlier `silver-audio-finish` compact delivery. The coordinator later served
the contact candidate from an isolated production build at `127.0.0.1:3002`
and the previous live GLB at `127.0.0.1:3000`. Both had `quality=high` and
`vgpu=ready`, with no browser console errors. The contact candidate exposed a
gold curved surface within the front bore, while the prior GLB remained dark.
The side and closed underside views retained the previous silhouette and
regulatory artwork. In an isolated development run, `?surface=baked` reported
`vgpu=webgl-fallback` and still displayed the contact. Space completed the
close/open cycle, A opened Work and Escape returned to HOME. These browser
checks justify the new public mirror; they do not verify the estimated
contact dimensions, exact alloy, or the whole-console photographic match.
The existing paint mask is byte-identical because the added parts do not
change the painted shell.
