# 3D / OFF cavity shading

`silver-slider.blend` / `.glb` is the current checkpoint, following the preserved
`silver-rubber` model. It changes two maps on `Sourced inner lid` only. Every
mesh attribute, topology, transform, control and other object's complete
material is preserved.

## Reference and comparison

The [original silver XL front photograph](https://cdn.mos.cms.futurecdn.net/0584727e6f39c0e334d6e9537772f9fa.jpg)
was examined at its slider detail (source crop 1240,312–1315,395). It shows dark
3D/OFF markings, a filled dark triangular recess and a dark recessed OFF dot.
The initial macro render `slider-before-slider.png` had shallow-looking text,
an almost unfilled triangle and a raised-looking dot. The source normal atlas
already contains the recognizable glyph shapes; this pass retains them rather
than substituting a generic font. Exact factory glyph identity is not proven.

The corrected macro and front/three-quarter renders are
`slider-after-{slider,front,open}.png`. Letter interiors and the triangle are
darker. The dot's local relief is reversed and now reads as an indentation.
The native macro camera is (70,−180,250), target (70,65,30), orthographic scale
35 mm, hinge 155°. The material's roughness and surrounding texture remain.

## Bounded texture changes

`build_slider_cavity_colour.py` integrates the source normal signal within four
small atlas rectangles to recover the existing relief silhouettes. Its axis
convention is specific to this source atlas. This derived scalar field is a
mask for cavity colour; it is not measured depth or a new geometric profile.
Full coverage multiplies linear colour by 0.35, an authored visual estimate.
The 4095 changed colour pixels are confined to the mask; outside pixels are
byte-identical. The source glyph normal relief is retained.

The OFF dot is the separate normal correction: red/green are inverted locally
with full weight through radius 9 pixels and a smooth fade to zero at radius
12, around atlas coordinate (909,2029). Blue is unchanged; 395 pixels change.
The report records both output hashes and parameters. This improves its
shading direction without changing the shell mesh or silhouette.

Run the builder with NumPy/Pillow, then open `silver-rubber.blend` in Blender
and run `install_slider_cavity.main()` through MCP with project scripts on
`sys.path`. The installer asserts the inner-lid material has one user, packs
the images, saves `silver-slider.blend` and exports carried shading frames.
`inspect_slider_cavity.py` is a reversible material preview. The source atlas
and all previous checkpoints remain preserved.

## Verification and remaining differences

All 70 tests pass. The two new tests prove unchanged geometry and rig and
resolve complete materials per object, allowing only the inner-lid colour and
normal image hashes to change. The prior closed-shell views and clearance
checks remain applicable: the changed areas are hidden when closed, and the
outer shell and its materials are unchanged. No application code changed.

This pass improves local shading and legibility, not the whole typography
requirement. Other lettering, speaker-hole faceting, slider-cap shape, source
surface imperfections, delivery size and authentic HOME Menu remain open.

GLB SHA-256: `b502d0a2781c6dff9f4321cda36e3776dcbbf3a4f4c8a50245fd5286cfe3816b`.

Browser verification at 1280 × 720: the updated model loaded with VGPU ready,
hinge 155°, correctly framed screen surfaces and visible slider markings.
No warning/error logs were captured. Viewport override was reset and the
preview reloaded afterward. This is a texture-only change; interaction logic
and hit geometry remain covered by the unchanged-layout tests.
