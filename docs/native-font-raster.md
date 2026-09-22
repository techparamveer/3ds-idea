# Native centered alpha-font rasterization

The HOME folder label uses the original shared font and `BnrDsTitle_00` layout.
Its centered origin, glyph rectangles, linear sampler and pixel-centre coverage
are reproduced independently of screenshot fitting. The current implementation
is bounded to one centered line with automatic line alignment and zero added
spacing. Other alignment/control-code paths and the HUD's LA4 font retain their
existing renderer and are not covered by this acceptance evidence.

## Original text and sampler behavior

For the supplied EUR HOME title `0004003000009802`, version 24576:

- `0x2ffc90` centres the measured rectangle by subtracting `ceil` of each half
  extent. `0x2e7e98` adds scaled FINF ascent; `0x300340` subtracts scaled TGLP
  baseline. For this font they cancel, producing target Y=22. Advances and
  glyph dimensions retain native float32 values.
- `0x2e8130` resolves the original CWDH width/bearing/advance and TGLP cell
  height. `0x1abf10` emits the exact source rectangle endpoints. There is no
  additional geometry inset, font substitution or fitted baseline correction.
- The resource-font constructor initializes flags6. The actual cached text
  path (`0x1ac830` onward) writes these flags to PICA texture register0x83:
  linear minification, linear magnification, and clamp at the sheet boundary.
- Shared-font format11 (A4) selects command template `0x30d88c`. Its combiner
  inverts the sample's zero RGB and preserves alpha, producing white coverage
  before the pane text color. This rule is not applied to luminance-alpha fonts.

The private reproducible traces are in `runtime/reference/folder-text-alignment`
and `runtime/reference/font-sampling` beneath the task's SSD artifact directory.
They verify the source executable/font hashes, instruction anchors, virtual
methods, command templates and pinned public decoder declarations. Executables
and disassembly are excluded from the website and repository.

## Quad coverage

The matching Azahar revision configures one rasterization sample and disables
sample shading in its [Vulkan pipeline](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/video_core/renderer_vulkan/vk_graphics_pipeline.cpp).
Its [software rasterizer](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/video_core/renderer_software/sw_rasterizer.cpp)
also evaluates pixel centres with hard triangle coverage. A fractional Canvas
`drawImage` boundary adds area antialiasing absent from that contract.

`rasterNativeAlphaGlyph` samples each covered destination pixel at its centre.
The bilinear coordinate is the mapped source coordinate minus half a texel;
this sampling convention does not move the emitted quad. A one-texel border
retains original sheet neighbors, with sheet-edge clamping. The resulting mask
has white RGB and sampled alpha. Glyph-mask caching is limited to 1 MiB and is
released with the font. Native glyph pixels, atlas hashes and materials are
unchanged.

## Actual browser comparison

Reference: `reference/home-folder-two-rows-lower.png`. Browser capture:
`browser-font-quad-verified-top.png`. The 800-wide browser texture adapter is
reduced to logical 400×240 using nearest sampling with `fit: fill`.

For the label region x=80..319, y=162..214, all 38,160 RGB channels compare as:

| Absolute difference | Channels |
| --- | ---: |
| 0 | 36,984 |
| 1 | 1,169 |
| 2 | 7 |

MAE is **0.031001 / 255**, maximum difference **2**. This eliminates all 17
previous glyph-edge errors above three levels (previous maximum54). Background
phase509 was fitted in a prior comparison; the folder yaw is intentionally
unmatched and outside this region. Exact PICA interpolation/rounding precision
is not claimed from the remaining one/two-level differences. See
`font-quad-verified-report.json` for the complete measurement.

Regression tests cover original font metrics, distinct ascent/baseline/line
feed, fractional quad boundaries, original atlas-border filtering, clipping,
white-mask color and overlapping coverage. Those tests support the source and
browser evidence; they do not establish complete HOME fidelity.
