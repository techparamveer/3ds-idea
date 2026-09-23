# Native banner stencil contract

`BannerFrame` writes the stencil region consumed by generic banners, including
folders and `BannerDef`. It is an authored ellipsoid rendered with the shared
banner camera. `BannerBGmask` is loaded but its resource/name arguments are
ignored by the investigated background wrapper; it is not the stencil producer
on this path.

This is source evidence for HOME 10.7.0-32E, not a browser or native GPU result.
Addresses are ARM virtual addresses with `code.bin` based at `0x100000`.
Hashes, fixture results and private artifact paths are recorded in
[native-banner-stencil.json](evidence/native-banner-stencil.json).

## Producer, geometry and camera

`0x287870` loads `3D/BannerFrame_LZ.bin`. Upper initialization passes it to
`0x24bed4`; `0x24c014..044` constructs a base model in **scene 1**, loads model
`BannerFrame`, and saves it at banner-manager `+0x9c`. Common load completion
`0x24ebac..bc0` sets visibility and attaches the model. Its attachment is separate
from the primary banner's attachment.

The asset has one identity-transform model, one mesh, one material, no bones,
textures or animations. Its 994 vertices and 1,984 triangles form a closed
ellipsoid with bounds X/Z `[-18,18]`, Y `[-9.5,9.5]`. Vertex residual against
`(x/18)^2 + (y/9.5)^2 + (z/18)^2 = 1` is below `0.000009` in the converted
coordinates. Preserve the mesh rather than substituting a rectangular scissor
or a guessed circle.

While the primary is actually visible, `0x24c368..3a4` copies primary `+0x90`
to the frame's Y translation, forces X/Z translation to zero and marks the
transform dirty. It does not copy the primary's animated scale or yaw. The
generic constructor initializes this primary Y offset to zero at `0x1fa168`.
The update is skipped when the primary is absent/hidden; it does not reset the
frame translation in that case. Folder reset `0x2492a0` and generic reset
`0x24e4f4` also zero `+0x90`.

`+0x90` is specifically a manager displacement, not the resource's animated
bone Y or the primary's total world Y. Shared update `0x24e190..21c` evolves
it using velocity `+0x8c`, gravity, a floor bounce and an upper clamp of 1;
the preceding code can feed velocity from an input-triggered spin impulse.
The primary transform at `0x24e418..42c` receives X=`+0x98`,
Y=`+0x90 + +0x94`, Z=0. **The mask receives only `+0x90`.** Original ARM
fixtures confirm zero-input idle stays at displacement 0 and a synthetic S0=12
impulse produces nonzero displacement while preserving the separate Y offset.
The meaning/source of that S0 input is outside this investigation. The current
folder lifecycle/render-frame types expose no such displacement/offset fields;
an integration must make the distinction explicit rather than derive mask Y
from a sampled skeleton, total translation, yaw or visibility scale.

Scene 1 receives `BannerCamera_LZ.bin` at `0x287950..95c` through `0x24ee9c`.
The source mono camera is position `(0,1,44.7859992980957)`, Aim target `(0,1,0)`,
vertical FOV `0.5235987901687622`, aspect `1.6666666269302368`, near `26.5`,
far `1000`. Use that camera for the mask and the primary. Stereo eye/frustum
changes remain the shared camera system's responsibility.

## Stencil and depth state

The raw frame material is at decoded CGFX offset `0x6a0` (including its flags
word). Its commands are:

| Field | Word | Meaning |
| --- | --- | --- |
| MTOB `+0x158` | `0x01010001` | Stencil enabled, Never, reference 1, input mask 1 |
| MTOB `+0x15c` | `0x000d0105` | Register `0x105`, byte enables 0/2/3 |
| MTOB `+0x160` | `0x00000222` | Replace on stencil fail, depth fail and depth pass |
| MTOB `+0x164` | `0x000f0106` | Register `0x106`, all bytes enabled |

Every rasterized front-facing fragment fails the stencil test and takes
**Replace**, writing reference 1 while rejecting color/depth output. The source
material has back-face culling, alpha test disabled and depth test disabled;
its stored depth function is Less and its depth/color write flags are set.
Those write flags do not override rejection by the Never stencil test.

Do not interpret the converted material's `BufferMask: 0` as a zero runtime
write mask: the resource command excludes that byte. The native material
emitter sends a separate `0x00020105` command for byte 1 at
`0x1932ec..332c` (also `0x18d440..4b8`), using global byte `0x33c166`, whose
stock value is `0xff`. It also derives depth/stencil-buffer access from this
state (`0x193524..578`); the converted resource's false stencil-buffer access
booleans are not the complete runtime state.

Generic load `0x1fa208..26c` changes every primary material to stencil
**Equal, reference 1, input mask 1, Keep/Keep/Keep**. The actual BannerDef
material words become `0x01010021` and `0`. Folder load
`0x249230 -> 0x1fa19c` uses the same override. Thus the primary passes only where
the stencil's low bit is 1; retain its own depth comparison/write behavior.

## Ordering, clear and chrome

`0x1f84a0` sets model byte `+0x1fc`. BG sets it to 0 (`0x24db18..20`),
frame to 1 (`0x24c044..04c`), and generic primary to 2 (`0x1fa1e8..1f0`).
The collector includes it at `0x2fd38c..3a0`; both native key builders
`0x2fd670` and `0x2fd728` put it in the highest byte of the 64-bit draw key.
Ascending sort at `0x10b694..744` therefore gives:

1. **BannerBG**, with its own material and camera.
2. **BannerFrame**, writing stencil 1 without visible color/depth output.
3. **Primary**, including folder/default, consuming that stencil region.

Do not clear stencil between these three groups. Native scene draw
`0x2362b4` draws the sorted list without an intervening framebuffer clear.
Upper dispatch `0x10214c..17c` runs the earlier layout pass, scene 1, the later
layout pass, then output/clear. Stereo repeats the corresponding dispatch.
The layout split is priority 5000 in `0x2365d4`: earlier priorities are below
5000. `LncBase_U_00`, including its camera hints, is constructed at priority
499 (`0x286608..614`, stored at layout `+0x58` by `0x22a8c4`). It belongs to
the earlier pass; do not infer that every piece of chrome is a final overlay.

Stock output clear descriptors at `0x32e7a4+8/+0xc/+0x1c` are `0x4500`
(color/depth/stencil). `0x2303b4` transfers output before applying the selected
clear. The GL context initializes clear stencil to zero (`0x142d4c`,
`0x143040`). Its optimized depth-clear branch at `0x230468..498` fills the
packed depth/stencil surface with `0x00ffffff`, also stencil 0. A host can clear
its stencil to 0 at frame start, then preserve it through the ordered scene
passes; never clear it to 1 as a substitute for drawing the frame.

## Verification and limits

Private `execute-contract.py` runs original ARM in Unicorn 2.1.4. Bounded
fixtures check the ignored BG-mask arguments, automatic base-model attachment,
both sort-key builders, frame Y translation at three offsets, mono/stereo
dispatch order and both output-clear branches. Allocation, platform, rendering
and selected lookup callees are explicit stubs. Native resource bytes and the
pinned SPICA stencil decoders independently establish the frame state.

The private BannerFrame conversion is evidence, not a published asset or
presenter implementation. Actual GPU command capture, rasterization/edge
coverage, stereo calibration and browser comparison remain unverified. This
investigation makes no mipmap or material-depth changes. It did not establish
normal music-entry versus music-resume behavior.
