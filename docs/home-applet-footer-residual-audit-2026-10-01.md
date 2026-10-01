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

## Integrated production recapture

Worker commit `122f35df` integrated as `e59cc4b9` after the applet title-style
fix. Full integrated suite: 1,534 passed, 0 failed, 23 skipped, 1 TODO;
typecheck and production build pass. Log:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/integrated-label-footer-tests.log`.

Production raw LCDs were recaptured on iPad Sidecar with browser `--mute-audio`
and application mute=true. A stale window-placement session rejected the first
move and the page briefly loaded on the main display; the coordinator corrected
the placement and verified `(1810,397,1150,780)` before any input/capture. Future
placement must be verified in a separate call before app navigation. Keyboard
M, X density cycles, ArrowUp then ArrowRight selected one-row Notes/Friend;
captures were guarded by mute/rows/focus assertions. These are fresh browser
captures against retained native PNGs, not synchronized fresh native replays.

Within the same private root, capture scenarios are `notes-footer-lcd-after`
and `friends-footer-lcd-after`; reports and all four inspected LCD contact
sheets are in `comparisons/<scenario>/`. They retain the earlier native
identities, empty mask and threshold 2. Browser lower SHA-256:

- Notes: `73f0ccf6ae8d6930132fae8cf1c3fc1270d9888fb9b0337920ee51be73d1180e`.
- Friend: `d47f29578917a82938a2e21b29ff716dfe7e952482bea30948fa347ca355ac53`.

Both production footer rectangles `(0,212,320,28)` now have **694** pixels over
threshold, maximum delta 21, mean RGB error 0.6191964. The text region
`(130,220,60,20)` has **zero** pixels over threshold, maximum delta 2, mean
0.1830556. This retires the 87 captured glyph residual pixels for these two
static references only. It does not retire the 694 material-edge pixels.
Whole-screen upper/lower counts are 53,417/19,441 Notes and 50,881/19,446
Friend. Upper PNGs are byte-identical to the preceding title-style captures;
lower cursor phases are not matched. Both scenarios remain **fail**.

No Azahar instance launched for this recapture, no audio verified, no global
matrix overwritten. Browser/server closed; isolated Azahar profile remains
volume zero. Other HOME footer states still require matched replay. Portfolio
content/population and offline policy remain adaptations; native material,
phase, input, motion and audio residuals remain separate unresolved work.

## Remaining work

- Trace the original HOME runtime theme producer and the material-register
  write affecting the full-width footer edge; do not substitute the captured
  cool colors for that missing source path.
- After integration, repeat the matched Notes and Friend List input sequence and
  compare both raw LCDs. Recheck motion, input routing and native cue timing.
- Keep the full scenarios `fail` while their upper LCD, non-footer lower LCD,
  motion, input and audio residuals remain unexplained.
