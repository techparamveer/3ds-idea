# Front layout calibration correction

The active delivery remains `silver-power-finish`. This pass is a reversible reference comparison, not a promoted geometry change.

Nintendo's original LL product page was rechecked, including the published 156 × 93 × 22 mm closed envelope and 106.2 × 63.72 mm upper active LCD. Its [front hardware image](https://www.nintendo.co.jp/hardware/3dsseries/3dsll/img/3dsll-front.jpg) was inspected in the browser. The original-XL [larger front image](https://cdn.mos.cms.futurecdn.net/0584727e6f39c0e334d6e9537772f9fa.jpg) was also inspected locally at native resolution.

The previous 112 mm upper opening fit used the dark panel width as a proxy for active LCD width. That is not sufficiently supported: the image includes inactive black area and the larger image includes bright artwork/shadow. The earlier conditional measurement was documented as uncertain, but should not remain the sole basis for the aperture width.

`measure_front_layout.py` records manually selected native-image landmarks and scales the surround by the upper shell width. Conditional on that shell being 156 mm wide, Nintendo's image gives 115.17 mm and the larger front image gives 115.25 mm. Conservative selected-edge intervals are 113.07–117.31 and 113.87–116.65 mm respectively. These intervals do not cover every uncertainty: Nintendo publishes overall closed width, not separate upper-shell width, and perspective and artwork remain factors. This supports an approximately 115 mm trial; it does not establish factory dimensions.

The official front image also places the circle pad and D-pad near the same left-side vertical line as the model, and the right controls retain the expected diamond arrangement. This visual review does not justify moving the controls. Their positions require separate calibrated point measurements before changing them.

`layout-current-planar.png` and `layout-current-live-front.png` show the current rig with temporary white active display footprints. `preview_upper_width.py` tests an outward 1.5 mm movement on each side of the upper inner-lid opening. It uses the current mesh and source frames, transforms normals/tangents with the deformation Jacobian, and restores the original mesh and pose afterward. It does not change the website or save a new Blender checkpoint.

The trial moves 3,046 vertices of the inner lid only, with maximum displacement 1.5 mm. The minimum Jacobian determinant is .55003: the outer transition compresses but remains positive. The old inward-deformation threshold of .6 was unsuitable for this outward trial; the new .5 threshold retains a positive margin. The closed envelope remains 155.99992 × 92.99996 × 22 mm within 0.0001 mm of the published dimensions. The former 0.00002 mm comparison was tighter than accumulated float32 roundoff in the preceding exported checkpoint.

The two trial renders were inspected. The 115 mm surround-to-shell ratio is closer to the whole-shell-calibrated references. Both active LCD sizes and lower-screen geometry stay unchanged. The wider trial still needs independent export invariants, closed-control clearance checks, full-console views and browser verification before promotion. The current inner black rectangle and vertical border dimensions also need to be judged separately from the active LCD, rather than inferred automatically from dark artwork edges.
