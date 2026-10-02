# HOME close mask source audit

Status: **source gap; no runtime change**. The browser's abrupt dark
`AppQuit@0` backing is explained by a concrete host sampler conflict, but the
native transition-time texture binding is not established well enough to
replace it with a different binding. This bounded pass therefore preserves the
existing capture owner/generation guards, cache, playback order and terminal
controls.

## Captured defect

The inspected browser sheet is
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/close-motion-native/health-close-sheet.png`.
Its frame 0 loses the retained application image immediately, while the settled
pre-close sample keeps it. This is a browser observation, not native close
evidence; the retained native captures cover only settled-before and
closed-after states.

## Pinned source findings

The delivered source remains manifest key `models.homeBackground`, HOME
`0004003000009802` v24576, content index 0 / `00000082`, internal path
`romfs/3D/BannerBG_LZ.bin`. Its compressed SHA-256 is
`27d58c2113d2c2d46e3bcc36bb2ae56c35e19d9823488287b6759df998108711`,
decoded CGFX SHA-256 is
`092c8682d0cfabf0a1823a8e3a2c12556515c437afba2aa6f6ac7fc4d5e34595`,
and delivered model JSON SHA-256 is
`45b3c6a470f681a10443f90fc73aff016b97a077b977b62649465524dffd3615`
from `ctr-cgfx-web` 1.1.0.

The authored `mt_BG` binding is texture0 `BG_DmyApp_00`, texture1
`BG_64_00`, texture2 `BG_64_00`. Texture1 is authored Repeat. The suspended
host adapter instead puts the 256x512 A4 `BG_CapMask_00` in texture1 and copies
texture0's ClampToBorder sampler. That settled mask binding, its padding and
sampler remain explicitly fitted adaptations.

`BannerBG_AppQuit@0` keeps texture-coordinate 0 at the settled capture scale
0.87, but sets coordinate 1 to scale `(3,6)` and translation
`(-0.6911,0.1666)`. Those coordinate-1 values are also the terminal
`BannerBG_Loop` wallpaper phase. With the browser adapter's mask in slot 1,
the current Dcc3dsMax matrix maps coordinate-1 U=0 to approximately 1.0733 and
the rest of the quad farther outside the texture.

The copied source sampler says ClampToBorder with border RGBA `(0,0,0,255)`.
The generic model renderer currently maps every non-Repeat wrap to
ClampToEdge and does not apply the authored border colour. The delivered mask's
entire rightmost column has alpha 0. Consequently AppQuit samples transparent
edge alpha instead of opaque border alpha. `mt_BG` TEV stage 0 multiplies
texture1 alpha into the primary alpha path, so this browser-only sampler
demotion explains the immediate loss of the retained image. Existing tests
assert that the fitted mask and copied sampler exist, but do not cover authored
ClampToBorder behaviour or a real rendered close pixel.

This identifies a real source conflict; it does **not** establish whether native
HOME retains `BG_CapMask_00`, restores `BG_64_00`, changes a texture descriptor,
or uses another runtime state when AppQuit begins. Rebinding slot 1 to the
wallpaper, moving the mask to another slot, changing wrap to Repeat, or altering
mask pixels would each guess that missing contract.

## `BannerBGmask` is not the missing close model

The separate pinned resource `romfs/3D/BannerBGmask_LZ.bin` has compressed
SHA-256
`d8c3cf350e2af35263f640a80144a40aa1d9a1b878f1b6eb872be0b4ec669541`
and decoded CGFX SHA-256
`d9139c60d5d608704b26252699a275f034ba04640859e0a8b1b9037047e1d233`.
A read-only private conversion with `ctr-cgfx-web` 1.4.2 is under
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/close-mask-audit.MBtSLN/`;
its model JSON SHA-256 is
`e1bb2e458f00970ee468c4c312665cc50346255ec9d233e51afcac7c00a6dc96`.
No converted bytes were published.

That resource's model is `BannerBGmask`, but its material still binds
`BG_DmyApp_00`, `BG_64_00`, `BG_64_00` with texture1 Repeat. Its
`BG_CapMask_00` is only 8x8 A4 and fully transparent; it is not the delivered
256x512 capture-edge mask. Its base coordinate 1 already equals the AppQuit
`(3,6)/(-0.6911,0.1666)` state.

The executable also rules out substituting this model on the investigated
background construction path. At `0x286ccc..0x286ce4`, HOME supplies both
background resources/names to wrapper `0x24fbfc`; the original wrapper forwards
only the `BannerBG` resource and `BannerBG` model name to `0x24daf4`. The
`BannerBGmask` resource/name arguments are ignored. This agrees with the
independent bounded fixture already recorded in
[native-banner-stencil](../native-banner-stencil.md). It does not reveal the
later capture-texture descriptor state.

## Minimum evidence to unblock a correction

The minimum native visual evidence is one same-session close boundary with:

1. an own 400x480 PNG of the last GPU-presented settled suspended frame before
   Close is accepted;
2. an own 400x480 PNG of the first GPU-presented frame after the accepted Close,
   with an input/update trace proving that sample is `AppQuit@0`; and
3. the exact press/release events, accepted update identity, raw PNG hashes and
   an empty or reasoned comparison mask.

If the emulator cannot single-step that boundary, the minimum substitute is a
lossless 60 Hz-or-higher recording spanning the accepted input, from which the
last pre-close and first post-close frames can be extracted without duplicate
or dropped-frame ambiguity. Another unrelated settled-before/closed-after
still pair cannot identify the frame-0 binding.

For a source-only correction, the equivalent minimum is a bounded original-ARM
trace that reaches the real AppQuit dispatch and records the `mt_BG` texture1
descriptor plus sampler immediately before and after the first submitted close
frame. Until one of those paths resolves the state, keep the current scenario
`fail`/`source-gap`; do not claim the existing abrupt dark frame is native-correct.

## Verification

This was a source/documentation audit only. No scene or renderer source, test,
public asset, browser, Azahar session, audio session, build or scenario matrix
changed. The private conversion and image inspection were read-only with
respect to the pinned dump and stayed in internal overflow storage.
