# Circle-pad rubber finish

The active checkpoint is `silver-rubber.blend` / `.glb`, following the preserved
`silver-plastic` checkpoint. This pass changes only `Button_Circle`'s material.
The pad mesh, source UVs, normal-map detail and closed-lid clearance remain
unchanged. The geometry is still the rounded sourced pad, not manufacturer CAD.

## Comparison and decision

The [original silver XL front reference](https://cdn.mos.cms.futurecdn.net/0584727e6f39c0e334d6e9537772f9fa.jpg)
shows a matte grey pad with a softly highlighted dish. Matched macro diagnostics
in `pad-surface-{before,normal-off,roughness-fixed,plain-rubber,rubber-trial}-pad.png`
isolated the source material channels. Disabling the normal map reduced rim
detail; increasing roughness suppressed the blotchy highlight while keeping
that detail. The final map retains subdued variation instead of a constant
roughness. These are visual finish estimates; the photographs are not calibrated
roughness or colour measurements.

The independent `Sourced circle pad rubber` material uses the prior colour atlas
with a 0.8 linear colour multiplier and a new MR atlas whose green channel is
`0.67 + 0.06 * original_green`. Its red/blue channels remain byte-identical.
The source normal, specular and emission bindings remain intact. It has the
`sourced-rubber` role and no silver paint mask, so VGPU paint grain does not
apply to the rubber.

`build_pad_roughness.py` creates the map and `pad-rubber-report.json` with the
PNG hash. In Blender, open `silver-plastic.blend` and run
`install_pad_rubber.main()` through MCP with the scripts directory on `sys.path`.
It saves and exports the next checkpoint using carried shading frames.

The first export omitted the colour factor because the installed glTF exporter
recognizes the newer `ShaderNodeMix` RGBA multiply pattern, not the older
`ShaderNodeMixRGB` pattern used by the diagnostic. The installer now uses the
recognized node. A GLB-level test explicitly requires the 0.8 RGB factor and
unchanged base-colour image bytes, preventing that silent export mismatch.

## Verification and limits

The final macro, front and three-quarter views are `rubber-after-{pad,front,open}.png`.
They show reduced mottling and retained dish/rim detail. The side, top, rear and
underside remain represented by `plastic-after` renders: the complete material
and every mesh attribute of all other objects are proven unchanged by the new
test. The pad is hidden in those closed views.

All 68 tests pass. The two new tests compare every mesh attribute, topology,
rig transform, control layout and full per-object materials with resolved image
hashes/samplers. Only the pad name/role, colour factor and MR map may differ.
The existing pad height/radius and closed-clearance proof still applies because
its geometry and the inner lid are unchanged. No application code changed.

In the 1280 × 720 browser preview, the rubber finish loaded, VGPU was ready,
no warning/error logs appeared, and pad-right changed selected index 0→2.
The temporary viewport override was reset afterward.

GLB SHA-256: `fd3674676176c58f6fa96ed0630c44357ae46858c1b0862229eea4836abd172b`.

Residual source edge/profile imperfections, hardware typography, surface
fidelity elsewhere, delivery size and authentic HOME Menu assets remain open.
This pass is not evidence of exact visual identity to a physical console.
