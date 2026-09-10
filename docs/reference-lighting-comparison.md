# Reference lighting and lid reflection study

The active model remains `silver-upper-width`. Four reversible matched-camera trials tested whether the upper lid's washed-out appearance should be corrected through scene lighting or material response. No trial is promoted to the website or saved Blender model.

At two unprinted lid patches, the promotional reference has median RGB values around 56 and 42; the current matched render gives 100 and 81. A lower-left deck patch already matches closely (reference 77–80, render 76), while the lower-right patch is brighter in the model (79 versus 48). These are image-space diagnostics, not physical reflectance measurements. The reproduction script and full patch table are `measure_reference_lighting.py` and `reference-lighting-patches.json`.

- **Reduced fill:** fill energy 200,000 instead of 650,000, world strength .2 instead of .5, key unchanged. Right lid/deck values improve to 58/55, but left lid remains 94. This is insufficient as a global lighting correction.
- **No lid specular:** temporarily disconnecting the upper-lid specular input gives lid values around 54/51. It also removes useful molded-edge and attached-barrel highlights. This isolates the excessive broad specular contribution; zero reflectance is rejected as a final material.
- **Off-axis lights:** camera-relative offsets (-180,210,80) and (200,120,70), increased energies 1,173,750/1,313,000, world .3. This over-brightens other surfaces (lid 88/97, deck around 100) and changes the highlight distribution away from the reference. Rejected.
- **Lower lid roughness:** a temporary uniform .35 roughness under original lighting produces an excessively bright left highlight (145) while the right falls to 64. Rejected; reducing roughness alone does not solve the wash.

The lit versions of all four trials were inspected. The scripts also retain dark-screen versions for further inspection, but they are not a separate acceptance claim. Original lights, world strength, materials, camera and rig pose are restored after each run. `render_reference_camera.main` now accepts an optional prefix and light offsets without changing its default result.

The evidence argues against darkening the entire console, globally reducing roughness, or removing all lid reflection. The next material study should isolate the flat upper-lid plastic from the edge/barrel response and use another original-XL reference to avoid overfitting promotional grading. Current texture maps, lettering and geometric curvature remain preserved. No application tests or build were repeated for these diagnostic-only additions.
