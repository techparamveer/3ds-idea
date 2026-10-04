# Health article residual — 4 October 2026

No runtime change. Worker checkout `1d432c1c` on
`codex/health-article-residual-20261004`. This starts from the captured Health
article stills, not from a guessed later scroll or General screen.

Usage initial and Usage 8 px-scrolled already meet the two-LCD static pixel
tier (0 / 0 pixels above 2/255, maximum delta 2). They are not unexplained
above-threshold residuals. Shared renderer edits after those captures did not
break the lower-LCD threshold on an offline HEAD replay. No source-only article
slice, coverage nudge or fitted artwork is justified from the captured pairs.
This is not byte equality, matched input, motion or whole-scenario acceptance.

## Captured article stills

The assigned `Health and Safety Information_*.png` files under
`/Users/paramveer/.codex/3ds-artifact-overflow/reference/screenshots/` are
settled **entry menus**, not articles. The only genuine EUR article stills in
that folder are:

| State | Native PNG | SHA-256 | Production pair | Above 2 (U/L) |
| --- | --- | --- | --- | ---: |
| Usage initial, `paneY=0`, `thumbY=77` | [`_26.09.26_04.46.01.113.png`](/Users/paramveer/.codex/3ds-artifact-overflow/reference/screenshots/_26.09.26_04.46.01.113.png) | `1a98026014a3a162c56ec12e02bdb9d84ad74a06e0806e569a510430e9440702` | [`health-usage-coverage-fit-b5543c4-20260926`](/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260926/reference/scenario-matrix/v1/captures/health-usage-coverage-fit-b5543c4-20260926/diff/report.json) | 0 / 0 |
| Usage 8 px, `paneY=8`, `thumbY=76.7066650390625` | [`_26.09.26_04.55.28.03.png`](/Users/paramveer/.codex/3ds-artifact-overflow/reference/screenshots/_26.09.26_04.55.28.03.png) | `4fc41442320d3513a0d29b8f57b90cf825f20660d912c7d9a21755bf5e58bed0` | [`health-usage-down2-frame8-2f26c96-20260926`](/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260926/reference/scenario-matrix/v1/captures/health-usage-down2-frame8-2f26c96-20260926/diff/report.json) | 0 / 0 |

Empty masks, threshold 2/255. Mean RGB on the production reports is about
**0.0705 / 0.09614149** (initial) and **0.070444 / 0.093880** (8 px). Native
held/repeated mapped `g` versus two browser Down clicks remains an input-tier
fail. Upper TopLoop half-cycle is unresolved ([scrolled upper fit](health-usage-scrolled-upper-fit-2026-09-26.md)).

Earlier article pairs are explained, not open rendering defects:

| Pair | Above 2 (U/L) | Cause |
| --- | ---: | --- |
| `health-usage-home-touch-frame327-0ad8efd` | 0 / 146 | Back footer; fixed by [direct sampling](health-footer-direct-sampling-2026-09-26.md) then [coverage-grid adaptation](health-other-coverage-grid-adaptation-2026-09-26.md) |
| `health-usage-footer-direct-734468d` | 0 / 22 | Back glyph edges x151 and x172; same coverage adaptation, now 0 |
| `health-usage-down1-retry-bdf5fc7` | 16,595 / 13,837 | Mismatched 4 px vs 8 px article offset, not a glyph defect |
| `health-usage-down2-unphased-bdf5fc7` | 24,828 / 73 | Unphased upper; lower 22 Back + 51 scrollbar, then [fractional SlideBar sampling](health-scrollbar-fractional-sampling-2026-09-26.md) |

## HEAD replay versus those natives

Offline `@napi-rs/canvas` replay of `drawNativeHealthFrame` at HEAD `1d432c1c`,
Usage topic, `healthEntryFrame=20`, no mask:

| State | HEAD lower vs native >2 | Max | Mean RGB | Equal / 76,800 | Notes |
| --- | ---: | ---: | ---: | ---: | --- |
| Usage initial | **0** | 2 | 0.09614149 | 63,872 | Byte-identical to the `b5543c4` production lower |
| Usage 8 px | **0** | 2 | 0.09585069 | 63,907 | Production `2f26c96` lower still 0 above 2; HEAD differs from that production lower by **455 scrollbar pixels at delta 1 only** |

Remaining native/HEAD differences at or below 2 are spread across header, body,
scrollbar and Back. Sampled delta-2 pixels on both stills sit in the title band
y10–21, not in a misplaced article glyph. They stay inside the accepted static
tier. Do not retune glyph edges, paneY, thumbY or the `azahar-12p4-fit` Back
coverage from this remainder.

`stock-health-article.ts` and `stock-health-layout.ts` are unchanged since
`2f26c96`. Health runtime after that commit only adds the upper `CmnFade_U_00`
reveal, which is settled at frame 20 on these article stills.

## What these stills do not cover

Usage warnings sit at parser heights **375** and **1049.7001953125**. They are
off-screen at `paneY` 0 and 8. 3D Display (`article_1`, warning height 39) and
General (`article_2`, 334 rows / maxScroll 6846) have **no native article PNG**.
The `Health and Safety Information_*.png` set and the matched entry bursts
(`health-entry-frame198`, `health-home-a-frame156`) are menus.

Source-rendered later specimens (`health-3d-top`, `health-usage-second-warning`,
`health-general-thumb-*`) remain verifier/output only. The overlapping 200-row
buffers have no pixel effect on the captured Usage band
([live-scroll audit](health-live-scroll-source-audit.md)). Pagination in old
`presentation/stock-ui-native-health` PNGs is stale; live drawing is the
continuous glyph stream with later title/Back coverage and no scissor.

G-02 still names **`health-general-held-down-and-thumb-drag`** as the first
uncaptured article route ([system map](feature-map/system-and-online-apps.md)).
The General touch proposal is a reversible Azahar procedure, not an executed
native still ([proposal](health-general-touch-proposal-2026-09-26.md)). Sandisk1
ENOSPC continues to block new native writes in the last progress checkpoint.

## Provenance (unchanged)

Health title `0004001000022300` v3077, EUR 10.7.0-32E, converter
`ctr-native-web` 1.2.0. Article drawing still uses decoded
`SafeText_D_00` / `SlideBar` / `BtmBtn_White` and `safe_msbt_LZ` `article_3`.
Capture-fitted adaptations already on these stills: Back
`textCoverageAdaptation:'azahar-12p4-fit'`, SlideBar `pictureSampling:'lcd'`,
TopLoop origin +18. Browser catch-up/cancellation remain labelled adaptations.
Boundary/row-tick cues are unpublished.

## Remaining and recapture

Captured Usage article pixels above 2: **0 / 0**. Remaining envelope is
maximum delta **2**, about 12.9k / 12.9k lower pixels at delta 1–2, plus
unmatched held-key input, TopLoop half-cycle, motion, audio, 3D/General
articles, first Usage warning, end scroll and Back return-focus.

Coordinator recapture pair (empty mask, threshold 2):

- Native: `_26.09.26_04.55.28.03.png`
- Browser: `health-usage-down2-frame8` at this HEAD, `paneY=8`,
  `thumbY=76.7066650390625`, live Health frame 8 (frame 368 is the same upper
  motif, not a recovered origin)

That pair confirms production Chrome still meets the 8 px static tier after
later shared renderer edits. It does not open General, warnings or later
scroll. The first **new** native article still, when storage allows, remains
`health-general-held-down-and-thumb-drag`. Do not treat the assigned entry
menu PNGs as article residuals.

Whole-scenario status stays fail. No Azahar, no preview `:3021`, no matrix
edit.
