# Native Frame delivery and first browser validation

The authored BannerFrame is now exported and registered in the versioned public
manifest. The current converter reproduced the private candidate's entire model
payload exactly except for updated converter provenance. The public model is
113,413 bytes, SHA-256
`61f4e90b11e341ba857edd73e5d0ce3eba8fbc5a2aff9a03bb0581f402c9fd83`.
It contains no textures, code or firmware executable. Compressed source hash,
pinned SPICA revision and wrapper/exporter hashes are embedded in the model.

Reproduction uses scripts/firmware-cgfx/convert.py with the original
3D/BannerFrame_LZ.bin, model key bannerFrame and title0004003000009802. Scratch
and the comparison report remain under the firmware SSD artifact root at
presentation/banner-stencil/integration-repro and integration-repro-check.json.
The 34 focused model/banner/label checks pass against the real public resource.

The actual browser console reported folder, Frame and background ready with no
browser errors. Its folder label, native background and lower screen remained
visible. At matched yaw87, skeletal/material frame87, fixed background phase509
and identical clock text, the pre/post stencil upper and lower LCD RGB images
are byte-identical. The folder lies inside the mask in this pose: this is a
regression check, not proof of clipping for all displaced/rotated primaries or
full native GPU equivalence.

Artifacts under
/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/:

- reference/browser-stencil-console.png: actual full console screenshot.
- reference/browser-stencil-source.json and -top.png/-bottom.png: native LCDs.
- reference/browser-stencil-comparison.json: exact pre/post pixel comparison.
- integration-stencil-tests.log: 34 passing focused checks, no skips.

Source draw ordering, register masks and Frame displacement semantics remain in
native-banner-stencil.md. Out-of-mask GPU coverage, native reference phase epochs,
reactive displacement inputs, upper chrome pass ordering and mip-level fidelity
still require separate verification.
