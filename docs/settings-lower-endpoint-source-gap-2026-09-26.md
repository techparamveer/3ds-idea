# Settings lower endpoint precision: bounded source gap

Base `20ec43e`; no runtime change. The previous HUD overhang correction is
integrated. This audit preserves the current2 upper /20 lower result rather
than selecting a rounding rule from one matching still.

## Reproduced native/browser evidence

Pair: private `captures-20260926/reference/scenario-matrix/v1/captures/`
`settings-main-glyph-overhang-87dc835-matched-minute-20260926/diff/report.json`,
under `/Users/paramveer/.codex/3ds-artifact-overflow/`. Empty comparison mask,
maximum RGB-channel threshold2/255.

Native400x480: `reference/screenshots/_26.09.26_04.25.57.654.png`, SHA-256
`af773003c9bce4ee7b293a461d1c69634a78af7bbff8dce7e7fc5f17ee802339`.
Native lower crop is(40,240,320,240). Production lower SHA-256:
`708211ad94247bc6c87f740c0e1961befea4cec5fdb1e57b4cfc342952e189d0`.
The independent pixel enumeration exactly reproduces these20 coordinates:

| Region | Coordinates | Maximum channel errors in listed order |
| --- | --- | --- |
| Internet icon |(20,45) |3 |
| Parental icon |(18,105),(22,110) |3,3 |
| Other Settings second `t` |(259,174),(259,175),(259,182),(259,183) |4,5,36,12 |
| Other Settings `n` |(273,175)..(273,183), every row |15,45,51,51,51,51,49,49,25 |
| Other Settings final `s` |(294,180),(294,181) |20,18 |
| Data Management text |(76,191),(76,192) |41,18 |

The15 Other Settings pixels are missing ink, not a phase mismatch. At(273,178),
native RGB is180,174,159; browser is228,225,209 (the background).

## Source coordinates

The user's EUR10.7.0-32E Settings title is `0004001000022000`,
content0/`0000003d`. The original button pack source SHA-256 is
`4a356ef05cd4b17f330ab78a2c8dfe218749c404f2aaef1e1f8a9e7e48b91f04`.
The shared font source SHA-256 is
`95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581`.
English `mset/top_settings` supplies scale0.699999988079071. The centered
134x42 text pane's left screen origin is167. Existing float32 writer arithmetic
produces these endpoints after that origin translation:

| Glyph | Local right endpoint | Screen right endpoint | Pixel center excluded |
| --- | ---: | ---: | ---: |
| second `t` |92.49999618530273 |259.49999618530273 |259.5 |
| `n` |106.49999237060547 |273.49999237060547 |273.5 |
| final `s` |127.49999237060547 |294.49999237060547 |294.5 |

The source alpha raster includes exact right-edge ties, but these values fall
just below the ties. Native shows the corresponding source glyph coverage.
This does not establish where the native pipeline removes the small difference.

## Why the existing immediate-writer proof is insufficient

Pinned shared-writer trace: HOME executable SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`,
private firmware artifact `runtime/reference/font-sampling/07-glyph-quad-and-uv.asm`.
These are HOME library offsets, not newly established Settings code offsets.

- `0x1abf84..0x1abfa4` checks whether the writer has a geometry cache.
- Cached branch `0x1abfc8..0x1abfcc` calculates scaled dimensions;
  `0x1abff4..0x1abffc` stores width/height and position separately.
- Immediate branch `0x1ac050` forms the float32 right endpoint and
  `0x1ac058` the vertical endpoint. The existing local endpoint correction
  reproduces this arithmetic. It does not prove how cached glyphs later expand.
- `runtime/reference/folder-text-alignment/15-pane-draw-matrix.asm`,
  `0x2e42e4..0x2e432c`, proves float32 pane-matrix arithmetic and storage.
  This is matrix setup, not the complete cached vertex expansion, projection,
  viewport conversion or raster edge calculation.

The cached texture trace proves original A4 linear sampling/white-alpha handling,
which the renderer already uses. It does not establish final geometry precision.
Moving endpoint rounding from writer-local coordinates to screen coordinates
would therefore replace one incomplete model with another unproven one.

## Diagnostic source renders (not implementation proposals)

Two deliberately isolated hypotheses were applied only in a private source
render of the Other Settings label:

1. Float32 screen endpoint: `f32(right + 167) - 167`.
2. Snap local right endpoint to1/16 pixel: `round(right * 16) / 16`.

Neither is established as the native rule. They are discrimination probes,
not source-supported adaptations or final graphics. Both use original font
texels and leave interpolation inputs unchanged; only endpoint coverage varies.

| Source replay | Whole lower pixels >2 | Target15 remaining | Changed pixels |
| --- | ---: | ---: | ---: |
| Baseline cold verifier |395 |15 |0 |
| Screen float32 hypothesis |380 |0 |15 |
|1/16 edge hypothesis |380 |0 |15 |

Both produce identical changed-pixel sets: exactly the15 coordinates listed
above. Every recovered target is within2 of native. This demonstrates that
matching this still cannot distinguish the two rules. The cold verifier is
not the production capture and its380 other differences are not a new live
regression. No hypothetical output replaces the accepted production pair.
The remaining five production pixels are not explained by these probes.

All three source verifier runs pass five main selections and44 subpages.
The renderer/font focused suite and typecheck pass; see local
`.local/settings-lower/{tests,typecheck}.log`. Pixel RGB enumeration is in
`pixels.json`; exact diagnostic comparisons in `hypothesis-results.json`;
source renders and the isolated harness are in the same directory.
No application build is needed for this documentation-only commit.

## Next evidence required

The Settings executable identity check now finds exact byte-for-byte matches
for the pinned HOME writer's cache branch, cached glyph expansion, immediate
endpoint store, and text-cache/sampler setup. With both `code.bin` files mapped
at `0x100000`, those Settings ranges begin at `0x1eb290`, `0x1eb2d4`,
`0x1eb35c`, and `0x1ebb3c`. The HOME and Settings `nwfont_TextWriterShader.shbin`
files are also byte-identical (SHA-256
`87e9a661a499dfe18818310d6758855eba5d56892fe266c155b18e3e0f4d881e`). The
read-only probe is [`scripts/audit_settings_cached_writer_identity.py`](../scripts/audit_settings_cached_writer_identity.py);
it verifies input hashes and unique instruction windows. This establishes
shared code and shader identity, but does **not** prove the Settings call site
dispatches this path or supply the live vertex attributes, model/view/projection
uniforms, viewport, or screen coordinates.

Those values require a captured Settings text draw command buffer from the
matching Azahar revision, or an instrumented renderer replay that logs shader
selection, vertex inputs, uniform writes, and viewport at `I_TopRBs/TextBox_00`.
There is no such capture or usable PICA shader decoder in the current lane, so
do not infer a transform from the shared HOME trace. Once a source-backed
general edge rule is established, verify it with a fresh matched HOME → A →
Settings main capture in isolated Azahar and the production browser, same
displayed minute and settled animation state, raw 400×480 native and
400×240/320×240 browser LCDs, empty mask, and the same semantic input prefix.
Check all 20 existing lower residuals and regress Other Settings page 1 and
Health before accepting a renderer change. The current 0 upper / 20 lower
native/browser result remains open.
