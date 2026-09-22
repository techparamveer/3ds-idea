# Native HOME hints and folder balloon

This bounded presentation follow-up adds `LncBase_U_00` camera/Y and L+R hints
and `LncBlln_00` lower folder labels. It also repairs two renderer defects exposed
by those assets. Integration owns actual browser/Azahar capture and acceptance.

## Preserve independent texture channels

`PictBtnY.bclim` is an 8×16 half-texture mirrored horizontally by the layout.
Its PNG texel (5,5) is `[255,255,255,0]`. Loading it through an image and Canvas
readback changes that texel to `[0,0,0,0]`: premultiplication discards luminance
that the native TEV reads independently of alpha. The same TEV with straight
bytes restores the complete Y; no glyph-specific geometry correction is needed.

`decodeNativePng` is a reusable DOM-independent loader for the converter's
non-interlaced RGBA8 PNGs. It retains hidden RGB and partial-alpha channels, handles
filters 0–4 and multiple IDAT chunks, checks expected dimensions, bounds compressed
input and inflation, and observes cancellation. Fonts retain their existing
alpha-mask loading path. It intentionally does not implement other PNG formats
or color-profile conversion. Decoder failure follows the existing optional-asset
fallback instead of silently returning damaged channels.

## CLYT blend correction

CLYT has distinct compact source/destination factor enums: source factor 2 is
destination color; destination factor 2 is source color. Their inverse forms
are 3. Subtract is operation 2 and reverse-subtract is 3. This is supported by the
[EveryFileExplorer material parser](https://github.com/Gericom/EveryFileExplorer/blob/master/3DS/NintendoWare/LYT1/mat1.cs),
not yet by an independently traced HOME blend setter. Existing native TEV
constant evidence does not establish these blend enums.

The balloon shadow's `src=2,dst=0` therefore multiplies the existing framebuffer
RGB. The previous shared factor mapping instead squared the source, producing
black rectangular blocks. Multiplicative masks now preserve their RGB as opaque
Canvas inputs and use Canvas multiply over the opaque LCD surface. This also
prevents the intermediate mask canvas from discarding RGB under alpha zero.
The uncommon blend readback path likewise retains opaque display alpha, avoiding
double attenuation of the upper hint strip's edge pixels during screen sampling.
This is a bounded RGB display projection, not complete native framebuffer-alpha
emulation: separate alpha blend registers and later destination-alpha-dependent
effects remain outside this path's validation.

## Assembly and placement evidence

Upper hints use settled SceneIn frame 40, Appear frame 10 and WhiteBlack frame 0.
The unimplemented suspended-software window is hidden. Source geometry and
material colors are retained. Camera/capture ink remains lighter than the native
capture; runtime theme material writes are still unresolved. No guessed recolor
is included. The source `BannerFolder/mt_Text` upper label remains with the
integration task; this change does not replace its placeholder with a guessed
layout.

Lower labels use the source shared-font pane, artwork and settled Appear frame 5.
Native captures `_22.09.26_21.05…`, `_22.09.26_21.31.33.514.png` and
`_22.09.26_21.43.16.442.png` establish two lower-screen positions: the central label
body is x32–287 with pointer x160, while the right folder body is x40–295 with
pointer x244. Both bodies are y49–110. The body and pointer therefore move
independently. `getNativeFolderBalloon` clamps the body center to 152–168 and
anchors the pointer to the tile center; the clamp is an inferred interpolation
of those observations, not a recovered runtime formula.

The subsequent [density comparison](native-home-density-2026-09-22.md) establishes
that these were **one-row** captures. Only one-row mode shows the lower balloon;
the native two-row capture has no balloon even with a selected lower-row folder.
The shared one-row grid now uses tile top 125 / anchor 161, while two rows retain
tops 46 and 130 / anchors 82 and 166. Labels disappear during gestures, panels and
an opened folder. The source has only alpha animation tracks; no inferred
below-icon balloon is introduced. Existing upper folder naming remains available
at the other densities.
Empty folder labels resolve the native `(No name)` message and style.

The screen API also accepts `drawHomeBackground(ctx,time,reduced):boolean`.
For the white theme it runs immediately after the fallback background and before
HUD/banner painting. The scene owns the model callback and its fallback result.

## Verification

- **39/39 focused tests passed**, covering presentation state, native layout,
  PNG byte preservation, bitmap fonts and CGFX folder rendering.
- Actual upper-hint and balloon PNGs decode byte-for-byte identically to Sharp.
  Tests exercise all five PNG filters, hidden RGB, partial alpha, truncation,
  invalid dimensions, inflation bounds and cancellation.
- Nonincremental TypeScript and `git diff --check` pass.
- Software Canvas inspection used the production straight decoder. Artifacts are
  `presentation/native-label-assembled-top.png` and
  `presentation/native-label-assembled-bottom.png` under the firmware artifact
  root. The Y is complete; the balloon has a soft shadow with no black blocks.
  These unit-renderer captures omit real portfolio tile artwork and the CGFX
  banner/background, and are not actual browser verification.

Full build limitations remain those recorded in
`firmware-presentation-validation.md`; this pass does not claim a new build or
completed HOME fidelity. Browser recapture after integration is required.

## Follow-up: native alpha-only texture sampling

The upper camera/capture ink discrepancy is now traced to texture expansion,
not missing theme colors or a TEV interpolation rule. The runtime theme trace
(`runtime/reference/banner-background/report.md` in the private firmware
artifacts) confirms default buffer RGB **73,77,80**, with constant0 RGB
**200,200,200** retained. The native RGB-only theme writes preserve alpha and do
not collide with WhiteBlack's constant5-alpha track.

The BCLIM converter emits display-friendly white RGB for A8/A4 mask PNGs.
[Pinned Azahar's texture decoder](https://github.com/azahar-emu/azahar/blob/b8c29a64c306bac3866a5ed293ebee94ef6dcb00/src/video_core/texture/texture_decode.cpp#L116)
uses **zero RGB** for ordinary A8/A4 texture sampling; its alpha-disabled preview
branch is separate. In the source camera/capture material, white preview RGB
selects constant0 gray200; zero sampled RGB selects the buffer charcoal.

`nativeTextureSamplePixels` therefore makes an immutable sampling projection only
for texture records with PICA format 8 (A8) or 11 (A4). The presentation loader's
cache key includes the source format. PNG bytes, alpha, decoded LA4/LA8 RGB,
unknown-format textures and the separate bitmap-font atlas path remain unchanged.
No delivered asset hash, material register or native shader formula is altered.

Tests exercise both alpha-only formats, retained hidden RGB in luminance-alpha
formats, source immutability and the actual camera/capture TEV output
`[73,77,80,255]` for opaque ink. A software Canvas comparison at
`presentation/native-alpha-source-top.png` shows the corrected charcoal symbols;
integration owns the required actual browser capture. This source-backed channel
correction does not establish pixel-perfect GPU rounding or full HOME fidelity.
