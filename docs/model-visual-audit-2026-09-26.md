# Sourced silver XL visual audit — 26 September 2026

## Scope and decision

At the start of this audit, the live asset was `public/models/candidates/joshua-xl.glb`, byte-identical
to `silver-audio-finish-compact.glb` (SHA-256
`ca37ec5824f0cd3aa46ca5079b2a339078b203a9afa5f87a1b14b09d1e68454d`).
This audit did not change the live model. The Design worktree is sparse and does
not contain the 16 GB model directory; the preserved model and renders were
read from the original checkout without modifying it. Blender MCP was exposed,
but its addon-status and scene-info calls could not connect to Blender.

The clearest source-supported missing geometry is the headphone socket
interior. The live rim surrounds a black empty aperture in the
[`audio-finish-final-front.png`](../model/candidates/joshua-xl/audio-finish-final-front.png)
macro. In Antoine Turmel's [front-edge original XL photograph](https://commons.wikimedia.org/wiki/File:3DS_XL_and_New_3DS_XL_-_front.jpg),
the **lower** console has a visible bright curved surface at the left of the
mouth and a narrower inner contact. The upper console in that photograph is a
New XL and is not the target. The missing pieces matter only in a close front
or front-under view; they are not a whole-console silhouette correction.

`silver-audio-contacts.blend` is already a preserved, separate candidate made
from `silver-audio-finish.blend`. Its
[`audio-contacts-trial-front.png`](../model/candidates/joshua-xl/audio-contacts-trial-front.png)
and
[`audio-contacts-trial-photo-angle.png`](../model/candidates/joshua-xl/audio-contacts-trial-photo-angle.png)
macros put a dark bore, left arc and inner leaf behind the existing rim. Those
three surfaces address the visible omission without changing the outer shell.
The photographed contact edges, depth and metal color are not measurable from
that image. The 3.58 mm bore, 6.7 mm housing depth and 0.075 mm leaf recorded
in [the existing study](audio-contact-study.md) remain estimates. The
photo-angle render is approximate, not a solved camera match. There is no
evidence for another geometry revision of that candidate yet.

## Matched-view review

| View | Render inspected | Reference and observation |
| --- | --- | --- |
| Open front | [`audio-finish-console-front.png`](../model/candidates/joshua-xl/audio-finish-console-front.png) and the current socket macro | [Original XL front photo](references.md) supports overall two-screen/control placement; this whole-console render is too small to judge contact geometry or glyph exactness. The close socket macro exposes the empty bore. |
| Rear | [`audio-contacts-final-rear.png`](../model/candidates/joshua-xl/audio-contacts-final-rear.png) | [Closed top reference](references.md) supports the broad silver lid and hinge layout. This oblique rear render does not calibrate lid crown height or camera recess depth. Contact additions are out of view. |
| Underside | [`audio-contacts-final-underside.png`](../model/candidates/joshua-xl/audio-contacts-final-underside.png) | The [EUR underside photograph](source-eur-validation.md) has a continuous rolled silver edge and EUR regulatory block. The render preserves those broad features, though angle, lighting and the reference unit's wear differ. This pair cannot establish local corner cross-section accuracy; the controlled [untextured diagnostic](underside-surface-diagnostic.md) still found corner highlight irregularity in geometry. |
| Closed side | [`audio-contacts-final-side.png`](../model/candidates/joshua-xl/audio-contacts-final-side.png) | The [original XL closed-side photo](source-side-audit.md) supports a dark seam with a thin silver lower wrap. The render's side is orthographic and the photo is perspective, so apparent seam thickness is not a measured residual. The contact additions do not affect it. |
| Socket front-under | [`audio-contacts-trial-photo-angle.png`](../model/candidates/joshua-xl/audio-contacts-trial-photo-angle.png) | The [front-edge photograph](https://commons.wikimedia.org/wiki/File:3DS_XL_and_New_3DS_XL_-_front.jpg) supports visible internal surfaces. The candidate captures their presence and approximate left/right order; their exact profile remains unverified. |

## Candidate checks and handoff gate

The candidate is preserved as `silver-audio-contacts.blend` (SHA-256
`6b830884644fae5c7447a4b97179e39ff59fe11be7c5d4177ce9a8afe1e7d10d`),
`silver-audio-contacts.glb` (`e92838dc666f1555c0f1da2b7accdc9136e8d9ac00fab76c4dfb9ea3f26aa107`)
and `silver-audio-contacts-web.glb`
(`177f292e43ef69c92ef236011e856eb6b15e726ceb891469862d03751295641f`).
The files remain in the source model directory and are **not** public delivery.

Read-only execution of `tests/test_audio_contacts.py` against those preserved
files passed all three checks: existing geometry/materials/rig unchanged, added
parts attached to Base and bounded inside the socket, and nondegenerate faces
with consistent exported frames. `tests/test_web_model.py` passed both checks
for the candidate WebP pack, including identical decoded RGBA pixels. These
checks establish export integrity, not photographic identity or browser
appearance. The candidate now has a [separate compact delivery
copy](source-audio-contacts-delivery-validation.md). A subsequent coordinator
trial served that copy at an isolated production-browser URL and compared it
with the earlier live public GLB in a second browser tab. At a matched close
front view, the new contact is visible inside the bore; the earlier aperture
is black. Side and closed underside views showed no broad silhouette or
artwork change. The candidate loaded with VGPU ready and in the development
`surface=baked` fallback, without browser console errors. Space closed and
reopened the hinge, A opened Work, and Escape returned to HOME. This supported
promoting the contact delivery to the public GLB. The paint mask stayed
byte-identical because the new parts add no painted shell region. A calibrated
browser-to-photograph socket crop and factory dimensions are still unavailable.

The remaining higher-scale uncertainties are the underside corner roll under
grazing light, exact lid profile, and hardware lettering at capture-limited
resolution. Neither the envelope checks nor these view pairs close them.
