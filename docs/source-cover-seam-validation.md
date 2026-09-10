# Rounded lower-cover seam

The active native checkpoint is `silver-cover-seam.blend`, following `silver-sd-outline.blend`. The public asset mirrors `silver-cover-seam-web.glb`; earlier checkpoints remain preserved.

## Change and evidence

`cover-seam-study.md` records the reference, source-ring measurements, handedness investigation and rejected narrow trial. The final pass rounds the pair of thin seam rings at both front corners using the existing approximately 12.49 mm quarter-ellipse outline. It extends subdivision into the adjacent wall so the curved seam is not connected directly to coarse triangles. The matched macro views show a smoother silver/black boundary without the narrow trial's obvious triangular wall patches.

The chassis increases from 212,776 to 225,190 triangles. It moves 5,371 vertices by at most 0.151556 mm. The minimum sampled deformation Jacobian determinant is 0.989769. Four inconsistent source tangent signs are repaired from their incident UV triangles before interpolation. Other coincident source vertices with valid opposite-handed frames remain intact.

`preview_cover_seam.py` defaults to a reversible trial. `main(persist=True, preview=False)` saves and exports the same geometry without repeating the macro renders. It must start from `silver-sd-outline.blend`; it carries explicit shading-frame attributes and restores them after export. The geometry is an authored refinement based on the source and photographs, not manufacturer CAD or a measured seam radius.

## Verification

Three export checks pass: unchanged rig hierarchy/transforms and materials/images; exact other meshes and position/UV triangles outside a conservative corner region; unchanged chassis bounds and valid unit orthogonal frames; and the four intended sign changes at preserved UVs, with no mixed-handed triangles inside the refined seam band. Reused UVs and coincident vertices are accounted for rather than assuming a UV coordinate identifies one vertex. These checks preserve the earlier complete-console envelope but do not constitute a new swept-collision proof.

Both final macro views and all six `cover-seam-final-*.png` full views were inspected. Blender's render observation timed out at 300 seconds, but all six output files completed and a subsequent MCP check confirmed rendering had stopped with the saved candidate and 76 objects intact. Blender was not restarted.

The normal browser path at 1280 × 720 reports VGPU ready. The open interior and rotated closed underside were inspected; no warning/error entries were captured. Physical A opens a folder and HOME returns home. The source art, SD flap and rounded seam remain visible. Full-view browser inspection is not a substitute for the matched native macro's local shape comparison.

Two lossless web-packing tests and all 132 application tests pass against the final public asset. No application code changed, so the prior successful build was not repeated. The PNG GLB is 150,135,728 bytes, SHA-256 `fc9edd383c6c7825315112a44d6c610ab13c55efd54542c098b9ef2cff1cfb77`. The web pack is 108,657,936 bytes, SHA-256 `bc37e94912c0e7c77708b905dab297977523cc80de98b5befa2d5d0d5434293d`. Texture pixels and decoded texture-memory cost are unchanged.

The headphone-port rim, some small molded details and exact hardware glyphs still show source-model limitations in close views. Authentic HOME Menu graphics and font remain pending. This local seam refinement does not complete the full fidelity goal.

The forced `?surface=baked` view reports WebGL fallback and renders the open console with no captured warning/error entries. The normal URL and default viewport were restored afterwards.
