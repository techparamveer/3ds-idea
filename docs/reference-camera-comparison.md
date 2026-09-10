# Camera-matched original XL comparison

The current model remains `silver-upper-width`. This comparison adds no website or model mutation.

The earlier standard render used an orthographic camera and a 155° hinge. The [larger original-XL front image](https://cdn.mos.cms.futurecdn.net/0584727e6f39c0e334d6e9537772f9fa.jpg) has visible perspective expansion toward the lower deck. Comparing those views directly conflates camera projection, hinge pose and actual component proportions.

`fit_reference_camera.py` fits a symmetric pinhole camera to eight manually picked screen/artwork corners using the published active dimensions and the current native display anchors. It uses multiple starting estimates and a damped least-squares solver. The fitted comparison pose is 133.21° open, camera elevation 42.33°, focal length equivalent to 52.15 mm on a 36 mm horizontal sensor. The RMS residual is 1.53 pixels per coordinate at 1794 × 1009. Upper-corner errors reach about 2.5 pixels vertically and lower rear corners about 3.3 pixels. These estimates depend on picked artwork edges, current anchor placement and the no-distortion/symmetric-camera assumptions; they are not proof of the photographed mechanical hinge angle.

The 133° pose is for comparison only. The required website hinge range remains 0–155°. The optimizer is not allowed to rescale the model or either active display to force agreement.

`render_reference_camera.py` reproduces the estimated camera in Blender with sensor shifts for the fitted principal point. It renders both dark screens and temporary white active-display footprints. It restores the camera sensor/shift settings, temporary materials/objects, boot artwork visibility, root/hinge pose and standard view presets. No `.blend` or GLB is rewritten. The source GLB hash and every observed/projected corner are in `reference-camera-fit.json`.

Both matched renders were inspected against the larger front reference. The corrected upper surround and lower-screen footprint now align much more closely with the photograph at comparable framing. The main ABXY diamond, D-pad and circle pad also occupy similar projected positions. This is visual evidence of improved comparison conditions, not a silhouette or every-component accuracy proof. Remaining visible differences include the source's uneven molded-edge highlights, circle-pad appearance, small bumper details and local corner transitions. Illumination differs from the promotional reference; a highlight mismatch alone is insufficient reason to deform geometry.

In particular, the circle pad can look domed in the render, but direct mesh inspection shows the center lower than the rim. Native local top height is approximately .507–.671 mm inside radius 2 mm and reaches 1.525 mm near the rim. Median radial normal components are negative through the inner 6 mm, consistent with a concave dish. The earlier rounding pass retained this vertical profile. Do not flatten or deepen the pad solely from an unmatched lighting impression; inspect a matched close-up and isolate the material/lighting contribution first.

No application tests or rebuild were repeated for this diagnostic-only addition. Existing delivery validation remains in `source-upper-width-validation.md`. Exact physical profiles, lettering and authentic HOME Menu assets remain unfinished.
