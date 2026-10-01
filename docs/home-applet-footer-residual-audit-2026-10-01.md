# HOME applet footer residual audit - 1 October 2026

This is a bounded follow-up to the [matched Notes and Friend List footer
comparison](home-applet-footer-2026-10-01.md). It uses only the existing
captures. No emulator, browser or GUI was operated, and no audio was played.
The whole Notes and Friend List scenarios remain `fail`; this note does not
promote a matrix entry.

## Stable residual

The Notes and Friend List footer crops `(0,212)..(320,240)` are byte-identical
within each side of the comparison. Both pairs therefore have the same 781
pixels over the RGB threshold 2/255, maximum channel delta 49 and RGB MAE
0.6808035714. This is a shared footer-presentation residual, not app-specific
content or unsettled timing.

The threshold mask separates into:

- one 694-pixel component at `(0,212)..(319,220)`: all 640 pixels in rows 212
  and 213, plus 54 side-edge pixels in rows 214..220;
- 87 pixels in small components inside the `Open` glyph bounds
  `(139,222)..(179,238)`.

The 694-pixel component follows the full-width source button's two mirrored
picture halves. In decoded `LncBtmBtn_02`, `P_BtnW_C_01` and
`P_EdgeW_C_01` use the source `LncBtmBtn_10/11` textures and the source warm
material registers. The browser's dominant row-212 value is `(210,208,205)`;
native is the cool `(210,212,220)`. Row 213 similarly differs from browser
`(209,207,204)` to native `(206,208,217)`. The footer body below the edge and
the dark text interior agree.

This is the same unresolved runtime theme/material parameter already recorded
in the [native HOME lower comparison](native-home-lower-comparison-2026-09-22.md):
the decoded default edge material differs from native, and its runtime theme
write has not been inferred. `LncBtmBtn_02_SceneIn` changes the scene pose and
alpha but contains no footer palette track. The source layout contains no
alternative cool material registers for this selected pane. Consequently this
slice does **not** fit the observed native colors into the source material. The
edge remains a source gap until the original register producer/write is traced.

Machine-readable localization is at
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/footer-agent/residual-report.json`
(SHA-256
`812462cba7b17147e4c0bc9a0642d92fe1f869b9d69097c1588558618caadbbe`).
Its Notes/Friend native footer RGBA SHA-256 is
`2ec0b162fd88ee03677f050a89e7d6b1ef850de33a538a094f6de50a4ee32496`;
the browser footer RGBA SHA-256 is
`5f1824ee429eef48ed481c2f22b372fe3234e27141cfc134e6e092452a7d8f2b`.

## Source-backed glyph correction

The 87 glyph pixels have a separate cause. HOME was drawing the source
alpha-only shared font through the renderer's default pane-local Canvas raster,
while this single-line, centered, zero-spacing pane satisfies the existing
direct sampler's traced eligibility. The [direct text sampling
proof](settings-other-direct-text-sampling-2026-09-26.md) derives that path from
the original HOME font executable: glyph geometry and source-atlas UVs are
sampled once at final LCD pixel centers. This is a generic source-renderer mode,
not the capture-fitted `azahar-12p4-fit` coverage adaptation.

An offline replay loaded the delivered `LncBtmBtn_02`, its six decoded source
textures, the shared `cbf_std.bcfnt` atlas and the source `lau_1b_start` message
style. It repainted the footer over the existing browser lower capture and
compared against the existing native crop. The default replay is a control;
minor live-Canvas versus `@napi-rs/canvas` differences make its 786 count five
pixels above the captured 781.

| Replay | Footer pixels >2 | Text-region pixels >2 | Text max delta |
| --- | ---: | ---: | ---: |
| Existing default sampling | 786 | 88 | 48 |
| `textSampling: 'lcd'` | 698 | 0 | 2 |

The option changes 224 glyph pixels and leaves the picture/material path
untouched. The implementation opts only the existing HOME footer draw into
`textSampling: 'lcd'`; it does not set `textCoverageAdaptation`, alter source
geometry, replace an asset or add a fitted color. A focused presentation test
locks both the opt-in and the absence of the capture-fitted adaptation.

The replay report and PNGs are under
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/footer-agent/`.
`lcd-replay-report.json` has SHA-256
`eed4ebab37d1a40855be530319b813f1f9dd3265cbdacfce1b39972b4f3ab824`.
This is source-render evidence only. The coordinator must recapture the
integrated production browser on Sidecar, with all 3DS audio muted, before the
87 captured glyph pixels can be retired.

## Remaining work

- Trace the original HOME runtime theme producer and the material-register
  write affecting the full-width footer edge; do not substitute the captured
  cool colors for that missing source path.
- After integration, repeat the matched Notes and Friend List input sequence and
  compare both raw LCDs. Recheck motion, input routing and native cue timing.
- Keep the full scenarios `fail` while their upper LCD, non-footer lower LCD,
  motion, input and audio residuals remain unexplained.
