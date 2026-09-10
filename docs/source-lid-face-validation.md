# Inner-lid reflection refinement

The `silver-lid-face.blend` checkpoint reduces the broad washed-out reflection on the black inner lid. It follows the matched-camera trials in `reference-lighting-comparison.md`; the original roughness, grain, base colour and engraved lettering remain in place. The public asset mirrors `silver-lid-face-web.glb`.

## Reference and scope

The assembled original XL in [iFixit's upper LCD replacement guide](https://www.ifixit.com/Guide/Nintendo+3DS+XL+Upper+LCD+Display+Replacement/25070), particularly [this assembled-lid photograph](https://guide-images.cdn.ifixit.com/igi/GyLNCoKHJZuaBJ3o.large), supports a subdued flat face with narrower edge highlights. The fitted promotional comparison is documented in `reference-camera-comparison.md`. These images do not establish measured reflectance or factory material constants.

`build_lid_face_specular.py` rasterizes a smooth geometry-based mask into the existing UV atlas. It reduces the source specular channel to 25% on the near-planar front face, with transitions and explicit protection for the barrel, back and steep edges. It changes 707,592 pixels. A cloned material binds the map only to `Sourced inner lid`. This is an appearance estimate; the rejected global zero-specular trial is not used.

In the fixed lit comparison, the left/right lid patch medians fall from 100/81 to approximately 68/60; the reference values are 56/42. The hinge patch remains approximately 85. This improves the excessive wash without claiming a calibrated photometric match. The diagnostic camera and lighting differ from the live website.

## Verification

All six `lid-face-final-*.png` views were inspected across this pass and its preceding modeling session. The silver lid, underside, seams and broad shell curvature remain visible; local source-model and photographic uncertainties remain. The matched lit comparison is `reference-lid-face-lit-matched.png`.

Three `test_lid_face` checks pass: every mesh attribute/index and rig transform is unchanged; only the inner-lid specular binding differs; the exported alpha reproduces the authored specular channel; and more than 7,000 barrel/back vertex UV probes land outside the mask. These are preservation checks, not factory fidelity proof. Two `test_web_model` checks pass for lossless texture delivery and preserved model structure.

The PNG GLB is 148,803,316 bytes, SHA-256 `0ea84145a61ff35fd5cd346060103d64cebd8c685c8d5e0573006fbca5c7da2a`. The WebP pack is 107,491,320 bytes, SHA-256 `6c6e5a82b61799cc27a8efae3798ff30444bc9ac9b4d75facc373d5ba88e0f15`. Packing preserves decoded pixels. The extra 4096-square map adds about 64 MiB of decoded RGBA storage before mipmaps; the small compressed increase does not imply negligible GPU cost.

Hardware lettering remains photograph-fitted, with capture-resolution limits. Authentic decrypted HOME Menu assets and font are still pending. This checkpoint does not establish exact identity to the physical console.

Browser verification at 1280 × 720: normal rendering reports VGPU ready; the forced `?surface=baked` path reports WebGL fallback and retains the localized material finish. Both open views were inspected. Keyboard A opens a folder, H returns home, and Space closes the normal-path hinge to 0°. The closed silver exterior was inspected. The fallback warning/error log was empty. This pass did not repeat physical pointer-hit coverage; the relevant mesh attributes and rig transforms are byte-identical. `npm test` passes all 131 tests. No application code changed, so no application rebuild was repeated. The normal URL and default viewport were restored.
