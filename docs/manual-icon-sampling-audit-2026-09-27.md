# Settings Manual icon sampling audit — 27 September 2026

## Question and evidence

The empty-mask production/native pair `settings-manual-contents-0a44f2c`
reports 471 upper pixels over 2/255 (MAE 0.110316/255, maximum channel delta
78). Every residual is inside the 32×32 icon pane at upper LCD x4–35, y4–35.
Its native image is
`_26.09.26_23.19.14.606.png` (SHA-256
`2efb7fa73192641b7448735f407cfaeebf7b79445ee1b92bf256f39c1566799b`); the
production browser image SHA-256 is
`f65c04a0799df091536de6053ba85ff8ecd2585d9043d6dacd1db165a37d73c1`.

The source trace in [upper detail fidelity](manual-upper-detail-fidelity-2026-09-27.md)
establishes a 64×64 RGB565 icon texture, 32×32 `P_Icon_00`, 0..0.75 icon UVs,
0.25..1.75 mask UVs with mirror wrap, and linear min/mag filters. Delivered
`IconMask.bclim` is A4. The current CPU material path samples both textures,
applies all three delivered TEV stages, and blends through the native pane.
This confirms layout and source material inputs; it does not establish that
Canvas arithmetic and filtering are bit-identical to PICA GPU execution.

## Bounded experiment

`icons/settings.png` is the published 48×48 SMDH large icon (SHA-256
`a81dd127191d7613aa9452c90409349070431d1112e114b68c75ef2a6467ffc0`). The
runtime pads that image to the 64×64 texture extent. I temporarily quantized
each copied RGB texel to 5/6/5 normalized levels before the CPU linear filter,
leaving transparent padding unchanged. Using the same native screenshot and
the empty-mask source-render comparison, the icon residual rose from **467 to
481 pixels** over 2/255; maximum delta stayed 77. Mean absolute RGB error in
the 40×40 icon crop changed from 3.40833/255 to 3.39292/255. This trades a
slight mean-error reduction for more threshold failures, so the quantization
change was reverted.

No source evidence currently identifies the remaining 471 production pixels
as a specific UV, filter, wrap or TEV error. The CPU experiment also does not
test production GPU execution. No safe correction is supported by the present
evidence; retain the icon residual as an open GPU sampling/combiner source gap.
Do not reduce it with a screenshot texture or a fitted replacement icon.
