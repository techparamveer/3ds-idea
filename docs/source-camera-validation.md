# Inner camera optical finish

The active checkpoint is `silver-camera.blend` and `silver-camera.glb`, derived
from `silver-speakers`. The homepage mirrors the export. Both GLBs have SHA-256
`3cda69c9916d60d9b0af9d63a5b11dc099a223f21d5ff96327642b44bb49618a`.

The [front audit](current-front-audit.md) identified a nearly featureless inner
camera. Ray inspection found the existing insert `Source_2_part_02`, behind the
inner-lid opening. It shared the screen material with four other objects. Its
exported base-colour factor was `[0,0,0,0.85]`, obscuring optical colour detail.
The source mesh has 84 vertices and 80 faces and is retained without movement.

`inspect_inner_camera.py` produces a reversible material trial.
`install_inner_camera.py` starts specifically from `silver-speakers.blend` and
installs a separate opaque dielectric material on that insert. Two 256-pixel
maps distinguish a dark outer surround, a smaller optical region and a central
dark aperture. The proportions and colour values are appearance estimates from
the silver-unit photograph linked in the front audit, not measured camera optics.
The original UVs remain intact; a second planar UV set addresses these maps.
There are no painted highlights or emissive lens elements.

The initial trial used linear colour bytes which would be interpreted as sRGB
by glTF. Before promotion, colour bytes were encoded as sRGB and marked accordingly.
An optical-region pixel now stores RGB 43,48,51, corresponding approximately to
linear 0.024,0.029,0.033. Roughness remains linear (0.16 optical region, 0.34 rim).
The exported texture bindings use the second UV set. The old shared screen
material and its other users are preserved.

Inspected `inner-camera-before-camera.png`, `inner-camera-trial-camera.png`, and
the final `inner-camera-after-camera.png` and `inner-camera-after-front.png` in
`model/candidates/joshua-xl`. The macro reveals the optical centre; the full front
view retains a restrained small camera detail. The final macro uses the default
1000×750 resolution; the earlier trial uses 800×600 with the same camera pose and
orthographic scale. The source polygonal rim remains visible at macro scale and
is not claimed to match the factory contour.

All 75 tests passed. The two new camera tests compare every original vertex
attribute, index and rig transform and resolve texture bindings to prove every
other material unchanged. They also check the camera's opaque material and
second-UV texture bindings. The homepage was visually inspected at 1280×720;
the camera centre is visible, the model and VGPU report ready, and browser
warning/error logs are empty. No shader or app code changed in this material pass.
The preceding keyboard repair had already passed typecheck and production build.

This improves a specific material mismatch. The polygonal aperture, exact lens
profile, other hardware details and authentic HOME Menu assets remain unfinished.
