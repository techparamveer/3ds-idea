# Other Settings: final three lower pixels

At base `94463cd`, the production lower capture has three pixels above 2/255:
(129,168), (129,169), (129,170). They are the right edge of the original **o**
in “Touch Screen”. `bitmap-font.ts` now evaluates emitted right/bottom quad
endpoints as float32 before deciding pixel-center coverage. No epsilon,
position offset, replacement texture, color change or comparison mask is used.

## Source and arithmetic

The source mapping remains Settings `0004001000022000`, content 0 / `0000003d`,
`button_LZ.bin/blyt/I_Touch.bclyt` (SHA-256
`0c31f5c8346f3b0ccd96fe741b8aded0d12016db5e076bcaab53365900106c15`).
The delivered pack is `packs/settings/contents/0000-0000003d/button.json`.
`TextBox_00` is a 200×38 centered pane. The English `mset/touch` source style
sets both font scales to float32 `0.8500000238418579`. The English message
and shared A4 font hashes are retained in the preceding
[footer audit](settings-footer-glyph-edge-2026-09-26.md#source-mapping-and-diagnosis).
All resources come through the EUR 10.7.0-32E manifest.

The original shared o glyph has width 14, height 30, bearing 1, advance 16,
at sheet 0, (997,33). Existing writer arithmetic gives local x
`41.599998474121094` and width `11.90000057220459`. JavaScript's double sum
is `53.499999046325684`, which excludes the center of local pixel 53.
Float32 addition gives **53.5**, which includes that center under the
[corrected horizontal edge rule](settings-footer-glyph-edge-2026-09-26.md).
The pane's screen origin is x76, so the sample is screen x129.

The retained executable trace is private
`runtime/reference/font-sampling/07-glyph-quad-and-uv.asm`, under the firmware
artifact root. It derives from HOME code SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
The shared writer's immediate quad emitter uses `vmla.f32` at `0x1ac050`
for the right endpoint and `0x1ac058` for the other vertical endpoint, and
stores those float32 vertices. Its cached branch also stores float32 glyph
sizes and positions. The browser already retains float32 advances and glyph
sizes; coverage had reconstructed the endpoint using double precision.
This bounded correction restores float32 endpoint addition. It does not claim
complete emulation of later PICA interpolation or transformed vertex precision.

## Matched offline evidence

Native image:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/scenario-matrix/v1/captures/settings-other-1-text-raster-browser-20260926/native/combined.png`.
Production browser pair:
`/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260926/reference/scenario-matrix/v1/captures/settings-other-1-font-edge-browser-20260926/`.
Independent main native image:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/screenshots/System Settings_25.09.26_13.03.55.629.png`.
Native lower crops are `(40,240,320,240)`.

The existing `verify-stock-settings.mjs` rendered both revisions into this
lane's `.artifacts/glyph-endpoint-{before,after}/`.

| Lower LCD | Before pixels over 2/255 | After | Before / after RGB MAE |
| --- | ---: | ---: | --- |
| Other Settings page 1 | 3 | **0** | 0.155395 / 0.155143 |
| Main cold | 395 | **395** | 0.239067 / 0.239067 |

Only the three target pixels change in the Other lower render. All main
selection renders and every upper source-verifier render are byte-identical
in decoded pixels before/after. Twelve lower source renders change, each by
1–23 pixels at the same endpoint-precision boundaries. Both verifier runs pass
five main and 44 subpage pairs, including their source assertions. Broader
native comparisons are still required for those other views.

The regression uses the original shared glyph and original English message
style to exercise the double-versus-float32 endpoint, verifying the final
covered column and the following uncovered column. All **20** focused
bitmap-font, native-renderer and Other page-tab tests pass; typecheck and
`git diff --check` pass. No new browser or Azahar session was driven.
Expected next production lower result: **zero pixels above 2/255**, pending
recapture. Nonzero sub-threshold error remains; this is not a byte-identical
LCD or a complete application acceptance claim.
