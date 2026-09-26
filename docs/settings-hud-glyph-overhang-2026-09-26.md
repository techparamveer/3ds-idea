# Settings HUD source glyph overhang

Base `ba0b8d5645c9072a5e871dcfdd76ad6864bb135f`. Evidence tier:
source-identified/rendered and tested; production recapture is pending.

## Exact visible cause

The supplied unmasked native/production pair `settings-hud-live-f083291-20260926`
has21 upper and20 lower pixels above2/255. Native is the genuine Azahar
`reference/screenshots/_26.09.26_04.10.28.299.png`, SHA-256
`0c3aaaaf585ddf116b26440fc5c2d304222827927b460161b7d02fd5e12c0eb5`.
Browser upper SHA-256:
`0fc44d4ad1c2bac7a1569361470848480bf3b62347e31d44e5dafb32c295b97c`.
All private paths are under `/Users/paramveer/.codex/3ds-artifact-overflow/`.

Nineteen upper differences lie immediately outside the text panes:

| Pane | Screen start / width | Final glyph | Missing column / rows |
| --- | --- | --- | --- |
| `T_Date_00` |218 /92 |`)` |310 /6..13 (8 pixels) |
| `T_TimeL_00` |317 /20 |`4` |337 /10..13 (4 pixels) |
| `T_TimeR_00` |343 /20 |`0` |363 /6..12 (7 pixels) |

The native pale outline is present there, while browser pixels equal the HUD
background. For example (337,10) is native RGB248,243,204 and browser242,236,178.
This is unrelated to the seconds phase or battery animation.

## Assets and source geometry

User's EUR10.7.0-32E Settings title `0004001000022000`, content0/`0000003d`:
`hud_LZ.bin` converted pack source SHA-256
`c25089a209c4dcec2096ad65c5e4f8d20e41e9991e81551d56a5f483c96de129`,
layout `HudMset_00`. Delivered `fonts/hud/font.json` points to original font
SHA-256 `172b12ad40f2feb04d4422ec67dead3b579a4706ca2a6413f652e1f7de026bb8`.
Its luminance-alpha atlas preserves the outlined glyphs:

| Glyph | Sheet coordinates | Width / advance / bearing / height |
| --- | --- | --- |
|`)` |(33,1), sheet0 |7 /6 /0 /17 |
|`4` |(49,37), sheet0 |11 /10 /0 /17 |
|`0` |(49,19), sheet0 |11 /10 /0 /17 |

At the source16x16 font size each final glyph overhangs its advance by one
texel. The pane is right aligned. The renderer allocated only the pane width
and explicitly clipped to it, deleting this valid source ink.

The correction derives maximum right ink extent from the original glyph
bearings, widths, advances and font scale for single-line, right-aligned
luminance-alpha text. It enlarges only the backing/composite rectangle. The
original pane width remains the argument to font alignment; source panes,
transforms, advances, UVs, styles and inherited caller clipping are unchanged.
Fractional pane sizes retain the previous canvas-to-pane scale. Vertical and
left clipping and all other text paths retain their existing behavior. No
fixed one-pixel pad, glyph-specific patch, replacement asset or color fit is used.

## Verification and limits

A matching04:10 source replay before/after changes exactly19 RGB pixels, only
the three columns above. All19 are now within2/255 of native. Cold source upper
comparison improves109→90 overall, HUD37→18. This cold font setup differs from
the production setup; the production21→2 expectation is a hypothesis for the
coordinator's recapture, not a claimed live result. Battery and colon inputs
are identical in both source replays.

- Existing Settings source verifier passes five main selections and44 subpages.
- All50 lower source PNGs are decoded-pixel identical before/after.
- Focused native renderer, bitmap font, Settings and Health tests:110 passed,
  one existing TODO. Actual HUD glyph metrics test overhang; renderer transport
  test preserves width20 alignment with width21 backing and composition.
  Existing non-Settings picture/material/cache tests pass; shared alpha font
  and Health paths do not enter this correction.
- Typecheck and diff-check pass. No GPU/shader code changed.
- Diagnostic scripts and images are in lane `.local/settings-residual/`.

Two upper date pixels at(304,15),(305,16) remain an interpolation/coverage gap.
The20 lower residuals are unchanged. Fifteen of them are at Other Settings
columns259,273,294. With the source0.699999988079071 font scale and pane origin
x167, the second `t`, `n` and final `s` have emitted right endpoints
259.49999618530273,273.49999237060547,294.49999237060547. Browser excludes those
pixel centers; native includes visible glyph coverage. The earlier writer-local
float32 endpoint correction is already present. Later pane/projection precision
could explain the difference, but this bounded trace does not establish its
ordering. Do not add an epsilon or round screen endpoints merely to fit these
columns. Two further lower pixels atx76,y191..192 and three icon pixels at
(20,45),(18,105),(22,110) remain outside this overhang fix.
