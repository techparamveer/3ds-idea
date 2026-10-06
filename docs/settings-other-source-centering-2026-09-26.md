# Other Settings title centering from the original executable

Base `1e3e5e85df28455f1a14cf20096dd415bae5dae4`. This replaces the historical
95-pixel capture-fitted title-group translation with original Settings width
measurement and float32 centering arithmetic. Evidence tier: source-identified,
source-rendered and tested. Production/native recapture remains the next gate.

## Source ownership

EUR10.7.0-32E System Settings `0004001000022000`, content0/`0000003d`,
`exefs/code.bin` SHA-256
`1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5`.
The retained private disassembly is
`presentation/settings-status-hud/full.asm` under the firmware artifact root
(and its home overflow copy).

`0x2232b4..0x223374` is the original title-group centering function:

- `0x2232bc..0x2232e0` finds `Icon` and `TextBoxTitle_00`.
- `0x2232ec` calls the text rectangle measurement routine `0x19ff04`.
  `0x2232f0..0x223300` subtracts its left edge from its right edge.
- `0x223308..0x223318` loads text X, icon X and icon width.
  Literal `0x223380` is float32 0.5.
- `0x223324..0x223334` subtracts half icon width from the text/icon X gap,
  adds measured text width, adds then subtracts icon width, then adds half
  that extent to icon X. These are float32 instructions.
- `0x22333c..0x22335c` subtracts that center from the existing `Null_Title`
  X and stores X while preserving Y/Z. `0x223360..0x223368` invalidates
  the pane's transform state.

The measurement helper `0x19ff04` obtains the source font, font size,
character/line spacing and text, calls rectangle measurement at `0x19ffa0`,
then returns its rectangle. Its origin conversion adds the measured width
back at `0x1a001c..0x1a0024`, so the right-minus-left used by the title
routine retains the advance width. The renderer's bounded measurement helper
supports single-line zero-character-spacing text only, using source font
metrics and float32 advance accumulation. It rejects unsupported multiline or
spaced input rather than estimating its width.

## Original resources and resulting coordinates

All existing resources remain unchanged, from the user's dump/manifest:

| Element | Source | SHA-256 |
| --- | --- | --- |
| Parent layout | `up_LZ.bin/blyt/CommonBG_U_00.bclyt` | `a298448098578ecbbaf195fc5b87a76ac7483a363ad5196aaa212b351362f56d` |
| Icon layout | `up_LZ.bin/blyt/IconBasic.bclyt` | `5d9360b36dd40db93ba43c8edefad7df8aedaf9ec567d1b138eab19b642d7c48` |
| Icon A4 texture | `IconBasic.bclim` | `d223fee26baad76a1b15e78e0cf52b2a8ddd93d6967bd6deb5001a444f764559` |
| English messages | `message_EU_LZ.bin/message_mset/EU_English/mset.msbt` | `fc91dc60b6db7fe7e2eb4d510ca6c63864eacf150bd72dc02d5541444233cbae` |
| Shared font | `cbf_std.bcfnt` | `95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581` |

`settings_title`, style102, supplies `Other Settings` and float32 scale
0.8500000238418579. Source advances total176 font units; float32 accumulation
at this scale gives149.60000610351562. Source icon X=-174, width32, text X=-150,
and group X=0 yield **95.19999694824219** from the original instruction order.
This fractional coordinate is derived from the executable and resource values;
no fractional translation search, epsilon or tint fit was used.

The 26 September slice scoped `0x2232b4` to Other Settings only. Worker U22
on 6 October applies the same helper to every modern `CommonBG_U_00`
subpage; see [settings-title-centre-2026-10-06](settings-title-centre-2026-10-06.md).
Worker U23 then shares Other's lcd + `azahar-12p4-fit` title raster across
those same pages; see [settings-title-sampling-2026-10-06](settings-title-sampling-2026-10-06.md).
The source orange material and source icon gradient already agree with native
opaque pixels; neither was modified.

## Matched source replay

Target is the coordinator's genuine HOME→Settings→A→Other touch pair:
`settings-other1-home-a-touch-20ec43e-20260926`, native
`reference/screenshots/_26.09.26_04.31.13.302.png`, SHA-256
`424ffb45d0fe4e82fd002d564a6ffe7f8af08dac5c984e444d5af09b56382c40`.
Production upper SHA-256:
`c0e162936e0973df3b5d57532baa066c85a4483df1a083b772a2998e5d1dfd5f`.
Private captures are under `/Users/paramveer/.codex/3ds-artifact-overflow/`.
Before production result is1312 upper /0 lower, with1310 title/icon pixels
and two existing HUD pixels. Empty mask, max RGB-channel threshold2/255.

| Source title region | Before >2 | After >2 | Before / after mean maximum-channel error |
| --- | ---: | ---: | ---: |
| Icon `(95,20)..(150,58)` |349 |50 |2.7775 /0.3651 |
| Text `(150,20)..(305,58)` |961 |971 |2.5504 /1.8569 |
| Combined |1310 |1021 |2.6099 /1.4662 |

The icon improves substantially. The text's over-threshold count increases by10
while average error drops; its maximum error drops97→78. The existing renderer
rasterizes glyphs in pane-local pixels, then Canvas samples that cached result
again at the fractional pane placement. Direct final-pixel text sampling remains
a separate source-renderer boundary; it is not solved by centering. No blur or
replacement texture was introduced to conceal it. The50 icon edge differences
also remain open. Expected production upper is approximately1023, pending live
recapture; this is not an accepted production result.

## Regression checks

- Source verifier: five main selections and44 subpages pass.
- Across its PNG outputs, only `other-top.png` changes. All Settings main
  renders and all50 lower renders are byte-identical in decoded pixels.
- Other lower remains0 pixels >2 against this new native screenshot.
- 73 focused Settings/font/renderer tests pass; one existing TODO. Tests check
  the original group geometry, measured title width, changed-width centering,
  and rejection of unsupported width measurement inputs.
- Typecheck and diff-check pass. No GPU/shader code changed.
- Source renders/comparison JSON and logs are in lane `.local/settings-title/`.

Coordinator browser recapture, remaining text/icon coverage, motion and audio
acceptance stay open. The earlier95px translation note is historical and is
superseded by the executable-derived centering in this document.
