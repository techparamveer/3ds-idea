# Lower-cover rolled cross-section

The active native checkpoint is `silver-cover-profile.blend`; the homepage mirrors `silver-cover-profile-web.glb`. This follows `silver-lower-labels` and retains that checkpoint's lettering and paint-mask correction.

## Evidence and change

The texture isolation in `underside-surface-diagnostic.md` showed the corner irregularity persisted without maps. The reference underside photograph recorded in `source-eur-validation.md` supports a continuous rolled silver cover. The physical scan supports broad curvature, but neither source provides a calibrated local manufacturing profile.

`preview_cover_profile.py` fits a fourth-degree radial height profile to 1,053 existing front-corner vertices, mirrored across the chassis. Its RMS residual is 0.053706 mm. A tapered field adjusts 1,385 vertices by at most 0.158117 mm, below native height 4.7 mm. The broad underside crown, X/Y outline, upper chassis and control openings remain outside the edited region. The trial also fits outward normals and projects the original tangents into their new planes, retaining UVs and tangent handedness. This is an authored smoothing fit to the source, not a factory radius measurement.

By default the script is reversible. `main(persist=True)` saves a separate native checkpoint, exports with frame attributes and invokes the carried-frame restorer. Run it only from `silver-lower-labels.blend`. The embedded `cover-profile-trial.json` report describes the initial trial before persistence; the saved/exported delivery is recorded here.

## Visual comparison

Matched macro views are `cover-profile-before-corner.png` and `cover-profile-trial-corner.png`. The second shows a more continuous silver-roll highlight. The adjacent silver/black boundary and SD flap remain visibly segmented at this magnification; this pass does not claim to fix those separate contours.

Matched underside views are `cover-profile-before-underside.png` and `cover-profile-trial-underside.png`. Additional front, open, top, side and rear images use the existing standard cameras as `cover-profile-final-*.png`. All six full views and the before/after macro were inspected. The small full-view change is consistent with the deliberately local correction, not evidence of exact hardware identity.

## Verification

Two export tests pass. They compare other mesh attributes, material/image payloads, rig hierarchy and transforms, all topology and UVs; check unchanged chassis extents and X/Y coordinates; constrain moved points and changed frames to the lower corners; and verify unit orthogonal frames, retained tangent handedness and no reversed nondegenerate triangles. These preserve the preceding closed envelope and controls, but are not a new full swept collision test.

Two independent web-packing tests pass and all 132 application tests pass with the final public model. No application code changed, so the prior successful production build was not repeated.

The browser loads with VGPU ready. Space reaches 0°, and drag rotation exposes the side profile and textured underside with no captured warning/error messages. The refined cover retains its silver artwork and rolled highlight in this view. Small local geometric fidelity is judged primarily from the matched native macro; the whole-console browser view is not a calibrated measurement.

PNG GLB: 149,276,540 bytes, SHA-256 `0cea20814f6821bb5b2c4596972f3cd0786da74c35c9a5417a1a272d64841210`. Lossless web GLB: 107,798,752 bytes, SHA-256 `f2505f0fcf1e3b1a0184727dc7d096e102dfe40c8ee7897a179ec2beb78a47a2`. No texture payloads or their decoded memory sizes were changed.

Exact hardware shapes, some source seams and authentic HOME Menu assets/font remain unresolved. This checkpoint improves the local roll and does not complete the product goal.

Physical A opens a folder and HOME returns home after reloading the final asset. The forced texture fallback reports `webgl-fallback`, its open view renders normally, and its captured warning/error log is empty. The normal URL and default viewport were restored.
